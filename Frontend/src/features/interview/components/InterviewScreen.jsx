import { useState, useEffect, useRef } from "react";
import WebcamFeed from "./WebcamFeed";
import { api } from "../../../shared/services/api";
import "../styles/InterviewScreen.css";
import SimpleCodeEditor from "./SimpleCodeEditor";
import RealTimeFeedback from './RealTimeFeedback';
import FinalEvaluation from './FinalEvaluation';
import speechRecognitionService from '../services/speechRecognitionService';
import CodeEditor from './CodeEditor';
import TechQuestionTypes from './TechQuestionTypes';
import SuspiciousActivityMonitor from './SuspiciousActivityMonitor';
import TabMonitoringService from '../services/tabMonitoringService';
import FullscreenGate from './FullscreenGate';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

const InterviewScreen = (props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { interviewCode: paramInterviewCode } = useParams();
  const interviewCode = props.interviewCode || paramInterviewCode;

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [currentTopic, setCurrentTopic] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [code, setCode] = useState("");
  const [allAnswers, setAllAnswers] = useState([]);
  const [finalEvaluation, setFinalEvaluation] = useState(null);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [answers, setAnswers] = useState([]);
  const [skippedQuestions, setSkippedQuestions] = useState([]);
  const [recordingStatus, setRecordingStatus] = useState('idle'); // 'idle', 'recording', 'processing'
  const [recordingError, setRecordingError] = useState(null);
  const [skipError, setSkipError] = useState(null);
  const [hasSavedCompletion, setHasSavedCompletion] = useState(false);
  const [isFollowUpQuestion, setIsFollowUpQuestion] = useState(false);
  const [followUpCount, setFollowUpCount] = useState(0);
  const [selectedQuestionType, setSelectedQuestionType] = useState('concepts');
  const [tabMonitoringService, setTabMonitoringService] = useState(null);
  const [suspiciousActivities, setSuspiciousActivities] = useState([]);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [isMonitoringActive, setIsMonitoringActive] = useState(false);
  const [isFullscreenEntered, setIsFullscreenEntered] = useState(false);

  useEffect(() => {
    const initializeInterview = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Strict separation of mock and company interview flows
        let skills = null;
        let isMock = !!props.isMock;
        let codeToUse = interviewCode;

        if (!codeToUse || codeToUse === 'undefined' || codeToUse === '') {
          setError('Invalid or missing interview code. Please restart the interview.');
          setIsLoading(false);
          return;
        }

        if (isMock) {
          // Mock interview: use selectedSkills from props or sessionStorage
          if (props.selectedSkills && props.selectedSkills.length > 0) {
            skills = props.selectedSkills;
          } else {
            skills = JSON.parse(sessionStorage.getItem('selectedSkills'));
          }
        } else if (props.interviewData?.skills) {
          // Company interview: use company skills only
          skills = props.interviewData.skills;
        }

        if (!skills || !Array.isArray(skills) || skills.length < 1) {
          setError('No skills selected or available. Please restart the interview.');
          setIsLoading(false);
          return;
        }

        // Store skills in session storage if coming from location state (for mock interviews)
        if (isMock && props.selectedSkills && props.selectedSkills.length > 0) {
          sessionStorage.setItem('selectedSkills', JSON.stringify(props.selectedSkills));
          sessionStorage.setItem('interviewData', JSON.stringify({ interviewCode: codeToUse }));
        }

        const response = await api.post('/interviews/start', {
          interviewCode: codeToUse,
          skills
        });

        if (response.data.success) {
          const { interview } = response.data;
          setQuestions(interview.questions);
          setCurrentQuestion(interview.questions[0]);
          setTotalQuestions(interview.totalQuestions);
        } else {
          throw new Error(response.data.error || 'Failed to initialize interview');
        }
      } catch (error) {
        console.error('Error initializing interview:', error);
        setError('Failed to initialize interview. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeInterview();

    // Cleanup function
    return () => {
      if (isRecording) {
        speechRecognitionService.stopRecording();
      }
    };
  }, [interviewCode, location.state, navigate, props.interviewData, props.selectedSkills, props.isMock]);

  // Remove the session checking interval as it's causing the redirect issue
  // Instead, check session validity only when needed
  const checkSession = () => {
    const storedData = sessionStorage.getItem('interviewData');
    const storedSkills = sessionStorage.getItem('selectedSkills');
    return storedData && storedSkills;
  };

  const startRecording = () => {
    try {
      setRecordingStatus('recording');
      setRecordingError(null);
      
      speechRecognitionService.startRecording(
        (interim) => setInterimTranscript(interim),
        (final) => setTranscript(final),
        (error) => {
          setRecordingError(error);
          setRecordingStatus('idle');
        }
      );
      setIsRecording(true);
    } catch (error) {
      setRecordingError('Failed to start recording');
      setRecordingStatus('idle');
    }
  };

  const stopRecording = async () => {
    try {
      setRecordingStatus('processing');
      const finalTranscript = await speechRecognitionService.stopRecording();
      setIsRecording(false);
      
      console.log('Recording stopped, final transcript:', finalTranscript);
      
      if (!finalTranscript || !finalTranscript.trim()) {
        console.log('No transcript detected');
        setRecordingError('No speech detected. Please try again.');
        return;
      }

      // Set the transcript in state and submit
      setTranscript(finalTranscript.trim());
      // Log transcript for debugging
      console.log('Transcript to submit:', finalTranscript.trim());
      await submitAnswer(finalTranscript.trim());

    } catch (error) {
      console.error('Error in stopRecording:', error);
      setRecordingError('Failed to process recording');
    } finally {
      setRecordingStatus('idle');
      setInterimTranscript('');
    }
  };

  const submitAnswer = async (answer) => {
    try {
      console.log('Starting answer submission:', answer);
      
      if (!answer || !answer.trim()) {
        throw new Error('No answer to submit');
      }

      setIsProcessing(true);
      setError(null);

      // Log the request payload
      const payload = {
        answer: answer.trim(),
        question: currentQuestion,
        interviewCode,
        code: code || ''
      };
      console.log('Submitting answer with payload:', payload);

      const response = await api.post('/interviews/evaluate-answer', payload);

      // Log backend response
      console.log('Evaluation response:', response.data);

      // If interview is complete, show final evaluation
      if (response.data.isComplete && response.data.evaluation) {
        setFinalEvaluation(response.data.evaluation);
        setIsComplete(true);
        // Do NOT call handleInterviewCompletion!
        return;
      }

      const { evaluation, nextQuestion, isFollowUp } = response.data;
      
      // Store the answer
      const newAnswer = {
        question: currentQuestion,
        answer: answer.trim(),
        code,
        evaluation,
        questionNumber: questionIndex + 1,
        isFollowUp: isFollowUpQuestion
      };
      
      console.log('Storing new answer:', newAnswer);
      setAnswers(prev => [...prev, newAnswer]);
      setFeedback(evaluation);

      // Handle next question
      if (nextQuestion) {
        console.log('Moving to next question:', nextQuestion);
        
        // Check if this is a follow-up question
        if (isFollowUp) {
          setIsFollowUpQuestion(true);
          setFollowUpCount(prev => prev + 1);
          console.log('This is a follow-up question');
        } else {
          setIsFollowUpQuestion(false);
          setFollowUpCount(0);
          setQuestionIndex(prev => prev + 1);
        }
        
        setCurrentQuestion(nextQuestion);
        setTranscript('');
        setInterimTranscript('');
        setCode('');
        setFeedback(null);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      setError(error.message || 'Failed to submit answer');
    } finally {
      setIsProcessing(false);
    }
  };

  // --- UI/UX Improvements and Skip Fix ---
  // 1. Add a helper to always send a valid question object for skip/submit
  const getValidQuestion = () => {
    if (!currentQuestion) return null;
    // If currentQuestion has 'question' or 'text', return as is
    if (currentQuestion.question || currentQuestion.text) {
      // Ensure all required fields are present (id, question, topic, difficulty, etc.)
      const q = currentQuestion;
      // Try to find the full question object from questions array if missing fields
      if (q.id && q.topic && q.difficulty) return q;
      const match = questions.find(qq => qq.question === q.question || qq.text === q.text);
      return match ? { ...match, ...q } : q;
    }
    // Fallback: try to get from questions array
    if (questions[questionIndex]) return questions[questionIndex];
    return null;
  };

  // Fix skip: always send valid question object
  const skipQuestion = async () => {
    const validQuestion = getValidQuestion();
    if (!validQuestion) {
      setSkipError('Cannot skip: Invalid question data.');
      return;
    }
    try {
      setIsProcessing(true);
      setSkipError(null);
      setSkippedQuestions(prev => [...prev, questionIndex]);
      const payload = {
        answer: '',
        question: validQuestion, // always send valid object
        interviewCode,
        code: '',
        skipped: true
      };
      console.log('Skip payload:', payload); // <-- Debug log
      const response = await api.post('/interviews/evaluate-answer', payload);
      if (response.data.isComplete && response.data.evaluation) {
        setFinalEvaluation(response.data.evaluation);
        setIsComplete(true);
        return;
      }
      const { evaluation, nextQuestion } = response.data;
      const newAnswer = {
        question: validQuestion,
        answer: '',
        code: '',
        evaluation,
        questionNumber: questionIndex + 1
      };
      setAnswers(prev => [...prev, newAnswer]);
      setFeedback(evaluation);
      if (nextQuestion) {
        setQuestionIndex(prev => prev + 1);
        setCurrentQuestion(nextQuestion);
        setTranscript('');
        setInterimTranscript('');
        setCode('');
        setFeedback(null);
      }
    } catch (error) {
      console.error('Error skipping question:', error);
      setSkipError('Failed to skip question. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle question type change
  const handleQuestionTypeChange = (questionType) => {
    setSelectedQuestionType(questionType);
    console.log('Question type changed to:', questionType);
  };

  // Initialize tab monitoring
  useEffect(() => {
    if (!tabMonitoringService) {
      const monitoringService = new TabMonitoringService();
      
      monitoringService.setCallbacks({
        onSuspiciousActivity: (activity) => {
          setSuspiciousActivities(prev => [...prev, activity]);
          console.log('Suspicious activity detected:', activity);
        },
        onTabSwitch: (data) => {
          setTabSwitchCount(data.count);
          console.log('Tab switch detected:', data);
        },
        onInactivity: (data) => {
          console.log('Inactivity detected:', data);
        }
      });
      
      setTabMonitoringService(monitoringService);
      setIsMonitoringActive(true);
    }

    // Cleanup monitoring service on unmount
    return () => {
      if (tabMonitoringService) {
        tabMonitoringService.destroy();
      }
    };
  }, [tabMonitoringService]);

  // Monitor fullscreen exit
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenElement = document.fullscreenElement || 
                               document.webkitFullscreenElement || 
                               document.mozFullScreenElement || 
                               document.msFullscreenElement;
      
      if (!fullscreenElement && isFullscreenEntered) {
        // Fullscreen was exited during interview
        console.log('Fullscreen exited during interview');
        
        // Show warning
        const warningDiv = document.createElement('div');
        warningDiv.className = 'fullscreen-exit-warning';
        warningDiv.innerHTML = `
          <div class="warning-content">
            <span class="warning-icon">⚠️</span>
            <span class="warning-text">Fullscreen mode was exited. Please return to fullscreen for the best interview experience.</span>
            <button class="warning-dismiss" onclick="this.parentElement.parentElement.remove()">×</button>
          </div>
        `;
        
        warningDiv.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          color: white;
          padding: 12px 16px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
          z-index: 10000;
          font-family: inherit;
          font-weight: 600;
          animation: slideIn 0.3s ease;
          max-width: 400px;
        `;
        
        document.body.appendChild(warningDiv);
        
        // Auto-remove after 8 seconds
        setTimeout(() => {
          if (warningDiv.parentElement) {
            warningDiv.remove();
          }
        }, 8000);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [isFullscreenEntered]);

  // Handle activity reporting
  const handleActivityReport = async (reportData) => {
    try {
      console.log('Reporting suspicious activity:', reportData);
      
      // Send report to backend
      await api.post('/interviews/report-activity', {
        interviewCode,
        reportData
      });
      
      console.log('Activity report sent successfully');
    } catch (error) {
      console.error('Error reporting activity:', error);
    }
  };

  // Handle fullscreen entry
  const handleFullscreenEntered = () => {
    setIsFullscreenEntered(true);
    console.log('Fullscreen mode entered');
  };

  // Save completion for company-driven interviews
  useEffect(() => {
    const saveCompletion = async () => {
      if (isComplete && finalEvaluation && !props.isMock && !hasSavedCompletion) {
        // Try to get interviewId and candidateCode from props, state, or storage
        const interviewId = props.interviewId || location.state?.interviewId || sessionStorage.getItem('interviewId');
        const candidateCode = props.candidateCode || location.state?.candidateCode || sessionStorage.getItem('candidateCode');
        
        console.log('Saving interview completion:', { interviewId, candidateCode, answers, finalEvaluation });
        
        if (interviewId && candidateCode) {
          try {
            // Call the /end endpoint to mark candidate as completed and save results
            await api.post(`/interviews/end`, { 
              interviewId, 
              candidateCode,
              finalEvaluation,
              answers 
            });
            setHasSavedCompletion(true);
          } catch (err) {
            console.error('Failed to save interview completion:', err);
            setHasSavedCompletion(true); // Still allow completion message
          }
        } else {
          console.warn('Missing interviewId or candidateCode for completion:', { interviewId, candidateCode });
          setHasSavedCompletion(true); // Fallback
        }
      }
    };
    
    saveCompletion();
  }, [isComplete, finalEvaluation, props.isMock, hasSavedCompletion, props.interviewData, location.state, answers]);



  // Show fullscreen gate if not yet entered
  if (!isFullscreenEntered) {
    return (
      <FullscreenGate onFullscreenEntered={handleFullscreenEntered} />
    );
  }

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <h2>Loading Interview...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (isComplete && finalEvaluation) {
    if (props.isMock) {
      return (
        <FinalEvaluation 
          evaluation={finalEvaluation}
          answers={answers}
          onRetake={() => navigate('/dashboard')}
        />
      );
    } else {
      // Company-driven: show completion message only after backend call
      if (!hasSavedCompletion) {
        return (
          <div style={{ maxWidth: 600, margin: '4rem auto', background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(30,41,59,0.10)', padding: '3rem 2rem', textAlign: 'center' }}>
            <h2 style={{ fontWeight: 900, fontSize: '2.1rem', color: '#1e293b', marginBottom: '1.5rem' }}>Saving your results...</h2>
            <p style={{ color: '#334155', fontSize: '1.15rem', marginBottom: '2rem' }}>Please wait while we save your interview results.</p>
          </div>
        );
      }
      return (
        <div style={{ maxWidth: 600, margin: '4rem auto', background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(30,41,59,0.10)', padding: '3rem 2rem', textAlign: 'center' }}>
          <h2 style={{ fontWeight: 900, fontSize: '2.1rem', color: '#1e293b', marginBottom: '1.5rem' }}>Interview Complete</h2>
          <p style={{ color: '#334155', fontSize: '1.15rem', marginBottom: '2rem' }}>Thank you for completing your interview.<br/>Your results will be reviewed and shared by the company.</p>
          <button onClick={() => navigate('/dashboard')} style={{ padding: '0.8rem 2.2rem', borderRadius: 10, background: '#2563eb', color: 'white', fontWeight: 700, border: 'none', fontSize: '1.1rem', boxShadow: '0 2px 8px rgba(37,99,235,0.10)' }}>Return to Dashboard</button>
        </div>
      );
    }
  }

  // Main interview layout
  const hasQuestion = currentQuestion && (currentQuestion.question || currentQuestion.text);
  const isCodeQuestion = currentQuestion && (
    /sql|query|code|program|function|algorithm|cpp|java|python|javascript/i.test(currentQuestion.question || currentQuestion.text)
  );
  return (
    <div style={{ 
      minHeight: '100vh', 
      width: '100vw', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
      fontFamily: 'Inter, Roboto, Arial, sans-serif', 
      display: 'flex', 
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Effects */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'url("data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'><defs><pattern id=\'grain\' width=\'100\' height=\'100\' patternUnits=\'userSpaceOnUse\'><circle cx=\'50\' cy=\'50\' r=\'1\' fill=\'rgba(255,255,255,0.1)\'/></pattern></defs><rect width=\'100\' height=\'100\' fill=\'url(%23grain)\'/></svg>")',
        opacity: 0.3,
        pointerEvents: 'none',
        zIndex: -2
      }}></div>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(255,255,255,0.05) 0%, transparent 50%)
        `,
        animation: 'float 20s ease-in-out infinite',
        pointerEvents: 'none',
        zIndex: -2
      }}></div>
      {/* App Bar */}
      
      {/* Main Content */}
      <main style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        width: '100%', 
        minHeight: 'calc(100vh - 64px - 48px)', 
        padding: '2.5rem 0 1.5rem 0',
        position: 'relative',
        zIndex: 10
      }}>
        <div className="interview-main-card" style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: 24,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 20px rgba(102, 126, 234, 0.3)',
          padding: 0,
          minWidth: 280,
          maxWidth: 900,
          width: '96vw',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'stretch',
          animation: 'fadeIn 0.8s',
          overflow: 'hidden',
          position: 'relative',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          {/* Left Panel: Question/Answer */}
          <div style={{
            flex: 1.2,
            minWidth: 220,
            maxWidth: 480,
            padding: '1.5rem 1.2rem 1.2rem 1.2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            background: 'transparent',
          }}>
            {/* Title & Progress */}
            <div style={{ marginBottom: 18 }}>
              <h2 style={{ fontWeight: 900, fontSize: '2.1rem', color: '#1e293b', margin: 0, letterSpacing: '-1px' }}>Technical Interview</h2>
              <div style={{ color: '#64748b', fontSize: '1.1rem', marginTop: 6, marginBottom: 18 }}>Question {questionIndex + 1} of {totalQuestions}</div>
              {/* Progress Circles */}
              <div className="progress-circles-horizontal" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', gap: 18, marginBottom: 32 }}>
                {Array.from({ length: totalQuestions }).map((_, idx) => {
                  let status = '';
                  if (idx < answers.length) {
                    status = answers[idx].answer === '' ? 'skipped' : 'done';
                  } else if (idx === questionIndex) {
                    status = 'current';
                  }
                  return (
                    <div key={idx} aria-label={`Question ${idx + 1} ${status}`} className={`progress-dot ${status}`} style={{ width: 38, height: 38, borderRadius: '50%', background: status === 'done' ? 'linear-gradient(135deg,#22c55e 60%,#a7f3d0 100%)' : status === 'skipped' ? 'linear-gradient(135deg,#f59e42 60%,#fde68a 100%)' : status === 'current' ? 'linear-gradient(135deg,#3b82f6 60%,#a5b4fc 100%)' : '#e5e7eb', color: status === 'current' ? '#fff' : '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 22, border: status === 'current' ? '3px solid #3b82f6' : '3px solid #e5e7eb', boxShadow: status === 'current' ? '0 0 0 3px #dbeafe' : 'none', transition: 'all 0.2s', position: 'relative' }}>
                  {status === 'done' ? <span style={{ fontSize: 20, color: '#fff' }}>&#10003;</span> : status === 'current' ? <span style={{ fontSize: 20, color: '#fff' }}>&#8594;</span> : idx + 1}
                </div>
              );
            })}
              </div>
            </div>
            {hasQuestion ? (
              <>
                {/* Follow-up Question Indicator */}
                {isFollowUpQuestion && (
                  <div style={{
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3)'
                  }}>
                    <span style={{ fontSize: '1.1rem' }}>🔄</span>
                    Follow-up Question {followUpCount > 0 ? `(${followUpCount})` : ''}
                  </div>
                )}
                <h2 className="question-text" style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1e293b', marginBottom: 12 }}>{currentQuestion.question || currentQuestion.text}</h2>
                <div className="question-meta" style={{ marginBottom: 10 }}>
                  {currentQuestion.topic && <span className="topic-badge">{currentQuestion.topic}</span>}
                  {currentQuestion.difficulty && <span className="difficulty-badge">{currentQuestion.difficulty}</span>}
                  {currentQuestion.duration && <span className="duration-text">{currentQuestion.duration} sec</span>}
                  {isFollowUpQuestion && <span className="follow-up-badge" style={{
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                    color: '#fff',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: 600
                  }}>Follow-up</span>}
                </div>
                
                {/* Tech Question Types */}
                {!isFollowUpQuestion && (
                  <TechQuestionTypes 
                    currentQuestion={currentQuestion}
                    onQuestionTypeChange={handleQuestionTypeChange}
                  />
                )}
                
                {/* Suspicious Activity Monitor */}
                <SuspiciousActivityMonitor
                  isActive={isMonitoringActive}
                  suspiciousActivities={suspiciousActivities}
                  tabSwitchCount={tabSwitchCount}
                  onActivityReport={handleActivityReport}
                />
                
                {/* Code Editor for code/SQL questions */}
                {isCodeQuestion && (
                  <div style={{ marginTop: 10, marginBottom: 10 }}>
                    <SimpleCodeEditor
                      value={code}
                      onChange={setCode}
                      language={/sql|query/i.test(currentQuestion.question || currentQuestion.text) ? 'sql' : 'javascript'}
                      placeholder={/sql|query/i.test(currentQuestion.question || currentQuestion.text) ? 'Write your SQL query here...' : 'Write your code here...'}
                    />
                    <button
                      className="submit-button"
                      style={{ marginTop: 8, background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 1.2rem', fontWeight: 600, cursor: 'pointer' }}
                      onClick={async () => {
                        setIsProcessing(true);
                        await submitAnswer(code);
                        setIsProcessing(false);
                      }}
                      disabled={isProcessing || !code.trim()}
                      aria-label="Submit code answer"
                    >
                      Submit Code
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="question-error">
                <h2>No questions available.</h2>
                <p>Please contact support or try again later.</p>
              </div>
            )}
            {/* Controls always at the bottom, sticky if needed */}
            <div className="control-buttons sticky-controls" style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              marginTop: 18,
              position: 'sticky',
              bottom: 0,
              background: '#fff',
              zIndex: 10,
              padding: '1rem 0 0.5rem 0',
              borderTop: '1px solid #e5e7eb',
              minHeight: 70,
            }}>
              <button className={`record-button${isRecording ? ' recording' : ''}`} onClick={isRecording ? stopRecording : startRecording} disabled={isProcessing || !hasQuestion} aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}>
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </button>
              <button className="skip-button" onClick={skipQuestion} disabled={isProcessing || !hasQuestion} aria-label="Skip this question">Skip Question</button>
            </div>
            {recordingError && <div className="recording-error">{recordingError}</div>}
            {skipError && <div className="recording-error" style={{ color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', marginTop: 8 }}>{skipError}</div>}
          </div>
          {/* Divider */}
          <div style={{ width: 2, minHeight: '100%', background: 'linear-gradient(180deg,#e0e7ef 0%,#c7d2fe 100%)', borderRadius: 2, boxShadow: '0 0 8px #c7d2fe44', alignSelf: 'stretch' }}></div>
          {/* Right Panel: Webcam & Transcript */}
          <div style={{
            flex: 1,
            minWidth: 180,
            maxWidth: 320,
            padding: '1.5rem 1.2rem 1.2rem 1.2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            background: 'transparent',
          }}>
            <div className="webcam-label" style={{ fontWeight: 700, color: '#2563eb', fontSize: 16, marginBottom: 6, letterSpacing: '0.5px' }}>Webcam</div>
            <div style={{
              width: 260,
              height: 180,
              borderRadius: 12,
              overflow: 'hidden',
              background: '#222',
              boxShadow: '0 0 10px #a5b4fc55',
              border: '2px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 10,
              position: 'relative',
            }}>
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <WebcamFeed confidence={feedback?.confidence} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
              </div>
              {/* Confidence Score Overlay (bottom left, more visible) */}
              {typeof feedback?.confidence === 'number' && (
                <div style={{
                  position: 'absolute',
                  left: 8,
                  bottom: 8,
                  background: 'rgba(255,255,255,0.98)',
                  color: '#166534',
                  fontWeight: 800,
                  fontSize: 15,
                  borderRadius: 7,
                  padding: '2px 10px',
                  boxShadow: '0 1px 4px #a5b4fc33',
                  border: '2px solid #22c55e',
                  zIndex: 2,
                  letterSpacing: '0.5px',
                }}>
                  Confidence: {feedback.confidence}%
                </div>
              )}
            </div>
            {/* Transcript Area as chat bubble */}
            <div style={{ width: '100%', marginTop: 18, background: 'linear-gradient(135deg,#f8fafc 80%,#e0e7ef 100%)', borderRadius: 14, minHeight: 70, maxHeight: 140, overflowY: 'auto', padding: '0.8rem', color: '#334155', fontSize: '1.08rem', boxShadow: '0 2px 8px rgba(30,41,59,0.08)', border: '1.2px solid #c7d2fe', transition: 'box-shadow 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: '#2563eb', marginBottom: 4 }}>Transcript:</span>
              <span style={{ marginTop: 6, background: '#fff', borderRadius: 8, padding: '0.5rem 0.8rem', boxShadow: '0 1px 4px #c7d2fe22', color: '#334155', fontSize: '1.01rem', minWidth: 60 }}>{transcript || <span style={{ color: '#b6b6b6' }}>Your spoken answer will appear here.</span>}</span>
            </div>
          </div>
        </div>
      </main>
      {/* Footer */}
      <footer style={{ 
        width: '100%', 
        textAlign: 'center', 
        padding: '1.2rem 0 0.7rem 0', 
        color: 'rgba(255, 255, 255, 0.9)', 
        fontSize: 15, 
        background: 'transparent', 
        letterSpacing: '0.2px',
        position: 'relative',
        zIndex: 10,
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
      }}>
        &copy; {new Date().getFullYear()} QuickHire AI &mdash; Elevate Your Interview Experience
      </footer>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: none; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        .main-card:hover { box-shadow: 0 12px 40px rgba(30,41,59,0.22) !important; transform: scale(1.01) !important; }
        .record-button, .submit-button, .skip-button {
          transition: background 0.2s, color 0.2s, transform 0.15s;
        }
        .record-button:hover:not(:disabled), .submit-button:hover:not(:disabled), .skip-button:hover:not(:disabled) {
          filter: brightness(1.08);
          transform: scale(1.04);
          box-shadow: 0 2px 8px #a5b4fc44;
        }
        @media (max-width: 900px) {
          .interview-main-card { flex-direction: column !important; min-width: 0 !important; max-width: 100vw !important; width: 99vw !important; }
          .interview-main-card > div { max-width: 100vw !important; width: 100vw !important; padding: 1.2rem 0.5rem 1rem 0.5rem !important; }
          .interview-main-card > div:nth-child(2) { display: none !important; }
        }
        @media (max-width: 600px) {
          .interview-main-card > div { padding: 0.5rem 0.2rem 0.5rem 0.2rem !important; }
        }
        @media (max-width: 700px) {
          .sticky-controls {
            position: fixed !important;
            left: 0; right: 0; bottom: 0;
            width: 100vw;
            background: #fff;
            border-top: 1.5px solid #e5e7eb;
            z-index: 100;
            padding: 0.7rem 0.5rem 0.7rem 0.5rem !important;
            box-shadow: 0 -2px 12px #a5b4fc22;
          }
        }
      `}</style>
    </div>
  );
};

export default InterviewScreen; 