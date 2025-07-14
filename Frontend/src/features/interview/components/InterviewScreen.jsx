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

import TabMonitoringService from '../services/tabMonitoringService';
import FullscreenGate from './FullscreenGate';
import FullscreenPause from './FullscreenPause';
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
  // Use shared monitoring state from pause screen - initialize from sessionStorage
  const [sharedSuspiciousActivityCount, setSharedSuspiciousActivityCount] = useState(() => {
    const stored = sessionStorage.getItem('pauseSuspiciousActivityCount');
    return stored ? parseInt(stored) : 0;
  });
  const [sharedAppSwitchCount, setSharedAppSwitchCount] = useState(() => {
    const stored = sessionStorage.getItem('pauseAppSwitchCount');
    return stored ? parseInt(stored) : 0;
  });
  const [isFullscreenEntered, setIsFullscreenEntered] = useState(false);
  const [isFullscreenPaused, setIsFullscreenPaused] = useState(false);
  const [isCurrentlyFullscreen, setIsCurrentlyFullscreen] = useState(false);

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

  // Implement exact same monitoring logic as FullscreenPause
  useEffect(() => {
    // Only clear sessionStorage if this is a completely new interview session
    if (!sessionStorage.getItem('interviewStarted')) {
      sessionStorage.setItem('interviewStarted', 'true');
      // Don't clear the counters - let them persist across screens
      // sessionStorage.removeItem('pauseSuspiciousActivityCount');
      // sessionStorage.removeItem('pauseAppSwitchCount');
    }
    
    // Load existing values from sessionStorage to ensure we don't reset
    const existingSuspicious = sessionStorage.getItem('pauseSuspiciousActivityCount');
    const existingAppSwitch = sessionStorage.getItem('pauseAppSwitchCount');
    
    if (existingSuspicious && parseInt(existingSuspicious) !== sharedSuspiciousActivityCount) {
      setSharedSuspiciousActivityCount(parseInt(existingSuspicious));
    }
    if (existingAppSwitch && parseInt(existingAppSwitch) !== sharedAppSwitchCount) {
      setSharedAppSwitchCount(parseInt(existingAppSwitch));
    }

    // Set monitoring as active
    setIsMonitoringActive(true);
    
    // Enhanced application switching detection (exact same as FullscreenPause)
    let lastActiveTime = Date.now();
    let isCurrentlyActive = true;
    let mouseMovementCount = 0;
    let keyboardActivityCount = 0;
    let suspiciousActivityDetected = false;
    let lastActivityCheck = Date.now();
    let consecutiveSuspiciousChecks = 0;

    // Track all types of user activity
    const updateActivity = () => {
      lastActiveTime = Date.now();
      lastActivityCheck = Date.now();
    };

    const handleVisibilityChange = () => {
      if (document.hidden && isCurrentlyFullscreen) {
        console.log('🚨 SUSPICIOUS: User switched tabs or applications during interview');
        isCurrentlyActive = false;
        suspiciousActivityDetected = true;
        consecutiveSuspiciousChecks++;
        setSharedSuspiciousActivityCount(prev => {
          const newValue = prev + 1;
          sessionStorage.setItem('pauseSuspiciousActivityCount', newValue.toString());
          return newValue;
        });
        setSharedAppSwitchCount(prev => {
          const newValue = prev + 1;
          sessionStorage.setItem('pauseAppSwitchCount', newValue.toString());
          return newValue;
        });
      } else if (!document.hidden) {
        isCurrentlyActive = true;
        updateActivity();
      }
    };

    const handleFocusChange = () => {
      if (!document.hasFocus() && isCurrentlyFullscreen) {
        console.log('🚨 SUSPICIOUS: User switched to another application during interview');
        isCurrentlyActive = false;
        suspiciousActivityDetected = true;
        consecutiveSuspiciousChecks++;
        setSharedSuspiciousActivityCount(prev => {
          const newValue = prev + 1;
          sessionStorage.setItem('pauseSuspiciousActivityCount', newValue.toString());
          return newValue;
        });
        setSharedAppSwitchCount(prev => {
          const newValue = prev + 1;
          sessionStorage.setItem('pauseAppSwitchCount', newValue.toString());
          return newValue;
        });
      } else if (document.hasFocus()) {
        isCurrentlyActive = true;
        updateActivity();
      }
    };

    const handleBlur = () => {
      if (isCurrentlyFullscreen) {
        console.log('🚨 SUSPICIOUS: Window lost focus during interview');
        isCurrentlyActive = false;
        suspiciousActivityDetected = true;
        consecutiveSuspiciousChecks++;
        setSharedSuspiciousActivityCount(prev => {
          const newValue = prev + 1;
          sessionStorage.setItem('pauseSuspiciousActivityCount', newValue.toString());
          return newValue;
        });
        setSharedAppSwitchCount(prev => {
          const newValue = prev + 1;
          sessionStorage.setItem('pauseAppSwitchCount', newValue.toString());
          return newValue;
        });
      }
    };

    const handleFocus = () => {
      isCurrentlyActive = true;
      updateActivity();
    };

    // Enhanced mouse tracking with pixel-level detection
    const handleMouseMove = (event) => {
      const currentPosition = { x: event.clientX, y: event.clientY };
      
      // Check if mouse movement is within the browser window bounds
      const isWithinBounds = currentPosition.x >= 0 && 
                           currentPosition.x <= window.innerWidth &&
                           currentPosition.y >= 0 && 
                           currentPosition.y <= window.innerHeight;

      if (isCurrentlyActive && isWithinBounds) {
        updateActivity();
        mouseMovementCount++;
      }
    };

    // Ultra-aggressive keyboard monitoring
    const handleKeyPress = (event) => {
      if (isCurrentlyActive) {
        updateActivity();
        keyboardActivityCount++;
        
        // Detect suspicious keyboard patterns (like typing in WhatsApp)
        if (keyboardActivityCount > 5 && Date.now() - lastActiveTime < 3000) {
          console.log('🚨 SUSPICIOUS: High keyboard activity detected - possible messaging app');
          suspiciousActivityDetected = true;
          consecutiveSuspiciousChecks++;
          setSharedSuspiciousActivityCount(prev => {
            const newValue = prev + 1;
            sessionStorage.setItem('pauseSuspiciousActivityCount', newValue.toString());
            return newValue;
          });
        }
        
        // Detect rapid typing patterns
        if (keyboardActivityCount > 20) {
          console.log('🚨 SUSPICIOUS: Excessive keyboard activity - possible external app');
          suspiciousActivityDetected = true;
          consecutiveSuspiciousChecks++;
          setSharedSuspiciousActivityCount(prev => {
            const newValue = prev + 1;
            sessionStorage.setItem('pauseSuspiciousActivityCount', newValue.toString());
            return newValue;
          });
        }
      }
    };

    // Monitor clipboard changes
    const handleClipboardChange = () => {
      if (isCurrentlyFullscreen) {
        console.log('🚨 SUSPICIOUS: Clipboard changed - possible app switching');
        suspiciousActivityDetected = true;
        consecutiveSuspiciousChecks++;
        setSharedSuspiciousActivityCount(prev => {
          const newValue = prev + 1;
          sessionStorage.setItem('pauseSuspiciousActivityCount', newValue.toString());
          return newValue;
        });
        setSharedAppSwitchCount(prev => {
          const newValue = prev + 1;
          sessionStorage.setItem('pauseAppSwitchCount', newValue.toString());
          return newValue;
        });
      }
    };

    // Detect rapid window state changes
    let windowStateChanges = 0;
    const handleWindowStateChange = () => {
      if (isCurrentlyFullscreen) {
        windowStateChanges++;
        if (windowStateChanges > 2) {
          console.log('🚨 SUSPICIOUS: Multiple window state changes detected');
          suspiciousActivityDetected = true;
          consecutiveSuspiciousChecks++;
          setSharedSuspiciousActivityCount(prev => {
            const newValue = prev + 1;
            sessionStorage.setItem('pauseSuspiciousActivityCount', newValue.toString());
            return newValue;
          });
          setSharedAppSwitchCount(prev => {
            const newValue = prev + 1;
            sessionStorage.setItem('pauseAppSwitchCount', newValue.toString());
            return newValue;
          });
        }
      }
    };

    // Overlay detection - less aggressive
    const checkForOverlayApplications = () => {
      const timeSinceLastActivity = Date.now() - lastActiveTime;
      
      // Only detect if multiple indicators are present for a longer period
      const indicators = [];
      
      if (timeSinceLastActivity > 4000) indicators.push('inactivity');
      if (mouseMovementCount < 1 && timeSinceLastActivity > 3000) indicators.push('no_mouse_activity');
      if (keyboardActivityCount < 1 && timeSinceLastActivity > 3000) indicators.push('no_keyboard_activity');
      if (document.hasFocus() && !document.hidden && timeSinceLastActivity > 5000) indicators.push('focused_but_inactive');
      
      if (indicators.length >= 3 && !document.hasFocus()) {
        console.log('🚨 SUSPICIOUS: Multiple indicators suggest overlay application:', indicators);
        suspiciousActivityDetected = true;
        consecutiveSuspiciousChecks++;
        setSharedSuspiciousActivityCount(prev => {
          const newValue = prev + 1;
          sessionStorage.setItem('pauseSuspiciousActivityCount', newValue.toString());
          return newValue;
        });
      }
      
      // Reset counters if user is active
      if (timeSinceLastActivity < 2000) {
        consecutiveSuspiciousChecks = 0;
        windowStateChanges = 0;
      }
    };

    // Activity checking - less aggressive to prevent false positives
    const checkActivity = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActiveTime;
      
      // Only detect if user is actually inactive for a longer period
      if (timeSinceLastActivity > 5000 && isCurrentlyFullscreen && !document.hasFocus()) {
        console.log('🚨 SUSPICIOUS: User appears inactive - possible overlay application');
        suspiciousActivityDetected = true;
        consecutiveSuspiciousChecks++;
        setSharedSuspiciousActivityCount(prev => {
          const newValue = prev + 1;
          sessionStorage.setItem('pauseSuspiciousActivityCount', newValue.toString());
          return newValue;
        });
      }
      
      // Check for overlay applications less frequently
      checkForOverlayApplications();
      
      // Reset activity counters periodically
      if (timeSinceLastActivity > 8000) {
        mouseMovementCount = 0;
        keyboardActivityCount = 0;
      }
      
      // Log suspicious activity levels
      if (consecutiveSuspiciousChecks > 1) {
        console.log(`🚨 HIGH SUSPICION LEVEL: ${consecutiveSuspiciousChecks} consecutive suspicious checks`);
      }
    }, 2000); // Check every 2 seconds instead of 1

    // Monitor for window resize events
    const handleResize = () => {
      if (isCurrentlyFullscreen) {
        console.log('🚨 SUSPICIOUS: Window resized - possible overlay application');
        suspiciousActivityDetected = true;
        consecutiveSuspiciousChecks++;
        setSharedSuspiciousActivityCount(prev => {
          const newValue = prev + 1;
          sessionStorage.setItem('pauseSuspiciousActivityCount', newValue.toString());
          return newValue;
        });
        setSharedAppSwitchCount(prev => {
          const newValue = prev + 1;
          sessionStorage.setItem('pauseAppSwitchCount', newValue.toString());
          return newValue;
        });
      }
    };

    // Monitor for selection changes
    const handleSelectionChange = () => {
      if (isCurrentlyFullscreen) {
        console.log('🚨 SUSPICIOUS: Text selection changed - possible app switching');
        suspiciousActivityDetected = true;
        consecutiveSuspiciousChecks++;
        setSharedSuspiciousActivityCount(prev => {
          const newValue = prev + 1;
          sessionStorage.setItem('pauseSuspiciousActivityCount', newValue.toString());
          return newValue;
        });
        setSharedAppSwitchCount(prev => {
          const newValue = prev + 1;
          sessionStorage.setItem('pauseAppSwitchCount', newValue.toString());
          return newValue;
        });
      }
    };

    // Monitor for context menu (common when switching apps)
    const handleContextMenu = () => {
      if (isCurrentlyFullscreen) {
        console.log('🚨 SUSPICIOUS: Context menu opened - possible app switching');
        suspiciousActivityDetected = true;
        consecutiveSuspiciousChecks++;
        setSharedSuspiciousActivityCount(prev => {
          const newValue = prev + 1;
          sessionStorage.setItem('pauseSuspiciousActivityCount', newValue.toString());
          return newValue;
        });
        setSharedAppSwitchCount(prev => {
          const newValue = prev + 1;
          sessionStorage.setItem('pauseAppSwitchCount', newValue.toString());
          return newValue;
        });
      }
    };

    // Add all event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('focus', handleFocus);
    document.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('resize', handleResize);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleKeyPress);
    document.addEventListener('keyup', handleKeyPress);
    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('contextmenu', handleContextMenu);
    
    // Try to monitor clipboard
    try {
      navigator.clipboard.addEventListener('clipboardchange', handleClipboardChange);
    } catch (e) {
      console.log('Clipboard monitoring not available');
    }
    
    // Sync with sessionStorage every second to ensure consistency
    const syncInterval = setInterval(() => {
      const storedSuspicious = sessionStorage.getItem('pauseSuspiciousActivityCount');
      const storedAppSwitch = sessionStorage.getItem('pauseAppSwitchCount');
      
      if (storedSuspicious) {
        const currentValue = parseInt(storedSuspicious);
        if (currentValue !== sharedSuspiciousActivityCount) {
          console.log('Syncing suspicious activity count:', sharedSuspiciousActivityCount, '->', currentValue);
          setSharedSuspiciousActivityCount(currentValue);
        }
      }
      
      if (storedAppSwitch) {
        const currentValue = parseInt(storedAppSwitch);
        if (currentValue !== sharedAppSwitchCount) {
          console.log('Syncing app switch count:', sharedAppSwitchCount, '->', currentValue);
          setSharedAppSwitchCount(currentValue);
        }
      }
    }, 500); // Sync more frequently to prevent resets

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('focus', handleFocus);
      document.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyPress);
      document.removeEventListener('keyup', handleKeyPress);
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      
      try {
        navigator.clipboard.removeEventListener('clipboardchange', handleClipboardChange);
      } catch (e) {
        // Ignore cleanup errors
      }
      
      clearInterval(checkActivity);
      clearInterval(syncInterval);
      // Clean up session when component unmounts
      sessionStorage.removeItem('interviewStarted');
    };
  }, [isCurrentlyFullscreen, sharedSuspiciousActivityCount, sharedAppSwitchCount]);

  // Ensure counters are preserved when transitioning from pause to interview
  useEffect(() => {
    if (!isFullscreenPaused && isFullscreenEntered) {
      // We're back in the interview screen, ensure counters are preserved
      const storedSuspicious = sessionStorage.getItem('pauseSuspiciousActivityCount');
      const storedAppSwitch = sessionStorage.getItem('pauseAppSwitchCount');
      
      if (storedSuspicious) {
        const currentValue = parseInt(storedSuspicious);
        if (currentValue !== sharedSuspiciousActivityCount) {
          console.log('Transition: Syncing suspicious activity count:', sharedSuspiciousActivityCount, '->', currentValue);
          setSharedSuspiciousActivityCount(currentValue);
        }
      }
      
      if (storedAppSwitch) {
        const currentValue = parseInt(storedAppSwitch);
        if (currentValue !== sharedAppSwitchCount) {
          console.log('Transition: Syncing app switch count:', sharedAppSwitchCount, '->', currentValue);
          setSharedAppSwitchCount(currentValue);
        }
      }
    }
  }, [isFullscreenPaused, isFullscreenEntered, sharedSuspiciousActivityCount, sharedAppSwitchCount]);

  // Monitor fullscreen exit
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenElement = document.fullscreenElement || 
                               document.webkitFullscreenElement || 
                               document.mozFullScreenElement || 
                               document.msFullscreenElement;
      
      // Update current fullscreen status
      setIsCurrentlyFullscreen(!!fullscreenElement);
      
      if (!fullscreenElement && isFullscreenEntered) {
        // Fullscreen was exited during interview
        console.log('Fullscreen exited during interview');
        setIsFullscreenPaused(true);
        
        // Stop recording if active
        if (isRecording) {
          speechRecognitionService.stopRecording();
          setIsRecording(false);
        }
        
        // Show warning
        const warningDiv = document.createElement('div');
        warningDiv.className = 'fullscreen-exit-warning';
        warningDiv.innerHTML = `
          <div class="warning-content">
            <span class="warning-icon">🚫</span>
            <span class="warning-text"><strong>INTERVIEW BLOCKED!</strong> Fullscreen mode is MANDATORY to continue.</span>
            <button class="warning-dismiss" onclick="this.parentElement.parentElement.remove()">×</button>
          </div>
        `;
        
        warningDiv.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          padding: 16px 20px;
          border-radius: 12px;
          box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
          z-index: 10000;
          font-family: inherit;
          font-weight: 700;
          animation: slideIn 0.3s ease;
          max-width: 450px;
          border: 2px solid rgba(255, 255, 255, 0.2);
        `;
        
        document.body.appendChild(warningDiv);
        
        // Auto-remove after 8 seconds
        setTimeout(() => {
          if (warningDiv.parentElement) {
            warningDiv.remove();
          }
        }, 8000);
      } else if (fullscreenElement && isFullscreenPaused) {
        // Fullscreen was re-entered
        console.log('Fullscreen re-entered, resuming interview');
        setIsFullscreenPaused(false);
        setIsCurrentlyFullscreen(true);
        // Don't reset counters - keep accumulated values
      } else if (fullscreenElement && !isCurrentlyFullscreen) {
        // Fullscreen was entered but we weren't tracking it
        console.log('Fullscreen detected but not paused, updating status');
        setIsCurrentlyFullscreen(true);
        // Don't reset counters - keep accumulated values
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

  // Fallback: Check fullscreen status periodically when paused
  useEffect(() => {
    if (isFullscreenPaused) {
      const interval = setInterval(() => {
        const fullscreenElement = document.fullscreenElement || 
                                 document.webkitFullscreenElement || 
                                 document.mozFullScreenElement || 
                                 document.msFullscreenElement;
        
        if (fullscreenElement && isFullscreenPaused) {
          console.log('Fallback: Fullscreen detected while paused, resuming interview');
          setIsFullscreenPaused(false);
          setIsCurrentlyFullscreen(true);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isFullscreenPaused]);

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
    console.log('handleFullscreenEntered called');
    setIsFullscreenEntered(true);
    setIsCurrentlyFullscreen(true);
    console.log('Fullscreen mode entered - states updated');
  };

  // Handle fullscreen resume
  const handleFullscreenResumed = () => {
    console.log('handleFullscreenResumed called');
    setIsFullscreenPaused(false);
    setIsCurrentlyFullscreen(true);
    
    // Ensure counters are preserved by re-syncing with sessionStorage
    const storedSuspicious = sessionStorage.getItem('pauseSuspiciousActivityCount');
    const storedAppSwitch = sessionStorage.getItem('pauseAppSwitchCount');
    
    if (storedSuspicious) {
      const currentValue = parseInt(storedSuspicious);
      if (currentValue !== sharedSuspiciousActivityCount) {
        console.log('Resume: Syncing suspicious activity count:', sharedSuspiciousActivityCount, '->', currentValue);
        setSharedSuspiciousActivityCount(currentValue);
      }
    }
    
    if (storedAppSwitch) {
      const currentValue = parseInt(storedAppSwitch);
      if (currentValue !== sharedAppSwitchCount) {
        console.log('Resume: Syncing app switch count:', sharedAppSwitchCount, '->', currentValue);
        setSharedAppSwitchCount(currentValue);
      }
    }
    
    console.log('Interview resumed after fullscreen re-entry - states updated');
  };

  // Handle disabled button clicks
  const handleDisabledButtonClick = (buttonType) => {
    if (!isCurrentlyFullscreen) {
      // Show notification
      const notification = document.createElement('div');
      notification.className = 'fullscreen-required-notification';
      notification.innerHTML = `
        <div class="notification-content">
          <span class="notification-icon">🚫</span>
          <span class="notification-text">Fullscreen first!</span>
          <button class="notification-dismiss" onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; font-size: 1.2rem; cursor: pointer; margin-left: 8px;">×</button>
        </div>
      `;
      
      notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
        z-index: 10001;
        font-family: inherit;
        font-weight: 700;
        animation: slideInUp 0.3s ease;
        border: 2px solid rgba(255, 255, 255, 0.2);
        min-width: 200px;
        text-align: center;
      `;
      
      document.body.appendChild(notification);
      
      // Auto-remove after 3 seconds
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, 3000);
      
      console.log(`Button ${buttonType} clicked while not in fullscreen`);
    }
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
  console.log('InterviewScreen render - isFullscreenEntered:', isFullscreenEntered, 'isFullscreenPaused:', isFullscreenPaused);
  
  if (!isFullscreenEntered) {
    console.log('Showing FullscreenGate');
    return (
      <FullscreenGate onFullscreenEntered={handleFullscreenEntered} />
    );
  }

  // Show fullscreen pause if interview is paused
  if (isFullscreenPaused) {
    console.log('Showing FullscreenPause');
    return (
      <FullscreenPause 
        onFullscreenResumed={handleFullscreenResumed}
        currentQuestion={currentQuestion}
        questionIndex={questionIndex}
        totalQuestions={totalQuestions}
      />
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
  console.log('Showing main interview layout');
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
      
      {/* Fullscreen Warning Banner */}
      {!isCurrentlyFullscreen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
          padding: '0.75rem 1rem',
          textAlign: 'center',
          fontWeight: '700',
          fontSize: '1rem',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
          animation: 'pulse 2s infinite'
        }}>
          🚫 FULLSCREEN REQUIRED - All interview functions are disabled until you enter fullscreen mode
        </div>
      )}
      
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
        zIndex: 10,
        marginTop: !isCurrentlyFullscreen ? '60px' : '0'
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
          opacity: !isCurrentlyFullscreen ? 0.7 : 1,
          filter: !isCurrentlyFullscreen ? 'grayscale(0.3)' : 'none',
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
                
                {/* Suspicious Activity Monitor - Prominent Position */}
                <div style={{
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)',
                  border: '2px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem'
                  }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color: '#dc2626',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <span>🔍</span>
                      Security Monitoring
                    </h3>
                    <div style={{
                      display: 'flex',
                      gap: '1rem',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '8px',
                        border: '1px solid rgba(239, 68, 68, 0.3)'
                      }}>
                        <span style={{ fontSize: '1.2rem' }}>🚨</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>
                          Suspicious: {sharedSuspiciousActivityCount}
                        </span>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '8px',
                        border: '1px solid rgba(239, 68, 68, 0.3)'
                      }}>
                        <span style={{ fontSize: '1.2rem' }}>📱</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>
                          App Switches: {sharedAppSwitchCount}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
                
                {/* Tech Question Types */}
                {!isFollowUpQuestion && (
                  <TechQuestionTypes 
                    currentQuestion={currentQuestion}
                    onQuestionTypeChange={handleQuestionTypeChange}
                  />
                )}
                
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
                      onClick={async (e) => {
                        if (!isCurrentlyFullscreen) {
                          e.preventDefault();
                          handleDisabledButtonClick('submit');
                        } else {
                          setIsProcessing(true);
                          await submitAnswer(code);
                          setIsProcessing(false);
                        }
                      }}
                      disabled={isProcessing || !code.trim()}
                      aria-label="Submit code answer"
                      title={!isCurrentlyFullscreen ? 'Fullscreen required to submit' : ''}
                    >
                      Submit Code
                      {!isCurrentlyFullscreen && <span style={{ marginLeft: '4px', fontSize: '0.8rem' }}>🔒</span>}
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
              <button 
                className={`record-button${isRecording ? ' recording' : ''}`} 
                onClick={(e) => {
                  if (!isCurrentlyFullscreen) {
                    e.preventDefault();
                    handleDisabledButtonClick('record');
                  } else {
                    isRecording ? stopRecording() : startRecording();
                  }
                }} 
                disabled={isProcessing || !hasQuestion} 
                aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
                title={!isCurrentlyFullscreen ? 'Fullscreen required to record' : ''}
              >
                {isRecording ? 'Stop Recording' : 'Start Recording'}
                {!isCurrentlyFullscreen && !isRecording && <span style={{ marginLeft: '4px', fontSize: '0.8rem' }}>🔒</span>}
              </button>
              <button 
                className="skip-button" 
                onClick={(e) => {
                  if (!isCurrentlyFullscreen) {
                    e.preventDefault();
                    handleDisabledButtonClick('skip');
                  } else {
                    skipQuestion();
                  }
                }} 
                disabled={isProcessing || !hasQuestion} 
                aria-label="Skip this question"
                title={!isCurrentlyFullscreen ? 'Fullscreen required to skip' : ''}
              >
                Skip Question
                {!isCurrentlyFullscreen && <span style={{ marginLeft: '4px', fontSize: '0.8rem' }}>🔒</span>}
              </button>
            </div>
            {recordingError && <div className="recording-error">{recordingError}</div>}
            {skipError && <div className="recording-error" style={{ color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', marginTop: 8 }}>{skipError}</div>}
            {!isCurrentlyFullscreen && (
              <div className="fullscreen-warning" style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                marginTop: '12px',
                fontSize: '0.9rem',
                fontWeight: '600',
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                animation: 'pulse 2s infinite'
              }}>
                🚫 All buttons are disabled. Enter fullscreen mode to continue the interview.
              </div>
            )}
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
        @keyframes slideInUp {
          from { opacity: 0; transform: translate(-50%, -40%); }
          to { opacity: 1; transform: translate(-50%, -50%); }
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
        .record-button:disabled, .submit-button:disabled, .skip-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          filter: grayscale(0.5);
        }
        .record-button:disabled:hover, .submit-button:disabled:hover, .skip-button:disabled:hover {
          transform: none;
          filter: grayscale(0.5);
        }
        /* Special styling for buttons when not in fullscreen */
        .record-button:not(:disabled):not(.recording):not([disabled]) {
          cursor: pointer;
        }
        .skip-button:not(:disabled):not([disabled]) {
          cursor: pointer;
        }
        .submit-button:not(:disabled):not([disabled]) {
          cursor: pointer;
        }
        /* Visual indicator for buttons that require fullscreen */
        .record-button:not(.recording):not(:disabled):hover,
        .skip-button:not(:disabled):hover,
        .submit-button:not(:disabled):hover {
          box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.3);
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