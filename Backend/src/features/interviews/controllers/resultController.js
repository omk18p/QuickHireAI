const Interview = require('../models/Interview');
const Candidate = require('../../candidates/models/Candidate');
const geminiService = require('../services/geminiService');
const faceAnalysisService = require('../services/faceAnalysisService');
const questionController = require('./questionController');
const activeInterviews = require('./questionController').activeInterviews;

// Process answer and analyze
const processAnswer = async (req, res) => {
  try {
    const { interviewCode, answer, skipped = false, videoData } = req.body;
    
    console.log('--- Incoming answer submission ---');
    console.log('interviewCode:', interviewCode);
    if (videoData) console.log('videoData present');
    
    // Get interview session from activeInterviews
    let interview = activeInterviews.get(interviewCode);
    if (!interview) {
      // Fallback: create a new session if not found (should not happen in normal flow)
      interview = {
        answers: [],
        skills: ['JavaScript', 'Python', 'React'],
        totalQuestions: 5,
        currentScore: 0,
        questions: [],
        status: 'active',
      };
      activeInterviews.set(interviewCode, interview);
    }
    
    // Use answers.length as the current question index
    const currentIndex = interview.answers.length;
    const currentQuestion = `Question ${currentIndex}`;
    const transcript = answer || '';
    const code = interviewCode;
    const isFinalQuestion = currentIndex >= interview.totalQuestions;
    
    // Analyze face if video data provided
    let facialAnalysis = null;
    let confidenceScore = 0;
    
    if (videoData) {
      try {
        facialAnalysis = await faceAnalysisService.analyzeFrame(videoData);
        confidenceScore = facialAnalysis.confidenceScore;
        
        if (facialAnalysis.warning) {
          console.log('Facial analysis warning:', facialAnalysis.warning);
        }
      } catch (error) {
        console.error('Error analyzing face:', error);
        // Continue without facial analysis
      }
    }

    // Analyze answer using Gemini
    let analysis;
    try {
      analysis = skipped ? 
        { 
          score: 0, 
          feedback: "Question skipped",
          technicalAccuracy: 0,
          completeness: 0,
          clarity: 0
        } :
        await geminiService.analyzeAnswer(transcript, currentQuestion, code);
      console.log('Gemini evaluation result:', analysis);
    } catch (analysisError) {
      console.error('Error analyzing answer:', analysisError);
      analysis = getDefaultAnalysis();
    }

    // Store answer and analysis with confidence score
    interview.answers.push({
      question: currentQuestion,
      answer: transcript,
      code: code,
      analysis: analysis,
      confidenceScore: confidenceScore,
      facialAnalysis: facialAnalysis
    });
    console.log('Answer stored in interview.answers:', interview.answers[interview.answers.length - 1]);

    // Calculate running average including confidence score
    const totalScore = interview.answers.reduce((sum, ans) => {
      const technicalScore = ans.analysis?.score || 0;
      const confidenceScore = ans.confidenceScore || 0;
      return sum + (technicalScore * 0.7 + confidenceScore * 0.3); // 70% technical, 30% confidence
    }, 0);
    interview.currentScore = totalScore / interview.answers.length;

    // If we've reached totalQuestions, end the interview and store results
    if (interview.answers.length >= interview.totalQuestions) {
      interview.status = 'completed';
      const finalEvaluation = await geminiService.generateFinalEvaluation(interview.answers);
      
      // Store mock interview results in database for company viewing
      if (interviewCode.startsWith('mock-')) {
        await storeMockInterviewResults(interviewCode, interview, finalEvaluation);
      }
      
      return res.json({
        success: true,
        evaluation: finalEvaluation,
        isComplete: true,
        finalScore: interview.currentScore
      });
    }

    // Generate next question
    const nextSkill = interview.skills[currentIndex];
    const previousQuestions = interview.questions?.map(q => q.question) || [];
    let nextQuestion;
    try {
      nextQuestion = await geminiService.generateQuestion(nextSkill, previousQuestions);
      nextQuestion = {
        ...nextQuestion,
        id: Math.random().toString(36).substr(2, 9),
        skill: nextSkill,
        questionNumber: currentIndex + 1
      };
      interview.questions.push(nextQuestion);
    } catch (error) {
      console.error('Error generating next question:', error);
      nextQuestion = getFallbackQuestion(nextSkill);
      interview.questions.push(nextQuestion);
    }

    res.json({
      success: true,
      evaluation: {
        ...analysis,
        confidenceScore: confidenceScore,
        facialAnalysis: facialAnalysis
      },
      nextQuestion,
      progress: {
        current: currentIndex + 1,
        total: interview.totalQuestions
      }
    });
    console.log('--- Answer processing complete ---');

  } catch (error) {
    console.error('Error processing answer:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error processing answer',
      details: error.message 
    });
  }
};

const getDefaultAnalysis = () => ({
  score: 5,
  feedback: "Error analyzing answer. Please try again.",
  technicalAccuracy: 5,
  completeness: 5,
  clarity: 5
});

const getFallbackQuestion = (skill) => ({
  question: `Tell me about your experience with ${skill}`,
  topic: skill,
  difficulty: "medium",
  expectedDuration: "2-3 minutes",
  category: "experience",
  expectedKeyPoints: ["Technical knowledge", "Practical experience", "Challenges faced"]
});

// Store mock interview results in database
const storeMockInterviewResults = async (mockCode, interview, finalEvaluation) => {
  try {
    // Create a mock interview entry in the database
    const mockInterview = new Interview({
      company: null, // Mock interviews don't belong to a company
      title: `Mock Interview - ${mockCode}`,
      description: 'Mock interview session',
      skills: interview.skills,
      duration: 30, // Default duration
      status: 'completed',
      interviewCode: mockCode,
      candidates: [{
        candidate: null, // No specific candidate for mock interviews
        code: mockCode,
        status: 'completed',
        results: {
          technicalScore: finalEvaluation.skillAssessment?.technicalKnowledge || 0,
          communicationScore: finalEvaluation.skillAssessment?.communicationSkills || 0,
          problemSolvingScore: finalEvaluation.skillAssessment?.codingAbility || 0,
          confidenceScore: interview.answers.reduce((sum, ans) => sum + (ans.confidenceScore || 0), 0) / interview.answers.length,
          overallScore: finalEvaluation.overallScore || 0,
          strengths: finalEvaluation.strengths || [],
          weaknesses: finalEvaluation.weaknesses || [],
          feedback: finalEvaluation.feedback || '',
          answers: interview.answers.map(ans => ({
            question: ans.question,
            answer: ans.answer,
            score: ans.analysis?.score || 0,
            feedback: ans.analysis?.feedback || ''
          }))
        },
        startedAt: interview.startTime,
        completedAt: new Date()
      }]
    });
    
    await mockInterview.save();
    console.log('Mock interview results stored in database:', mockCode);
  } catch (error) {
    console.error('Error storing mock interview results:', error);
  }
};

// End interview and generate final evaluation
const endInterview = async (req, res) => {
  try {
    const { interviewId, candidateCode } = req.params;
    const { answers, finalEvaluation } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid answers format',
        details: 'Answers must be provided as an array'
      });
    }

    // Generate final evaluation if not provided
    let evaluation = finalEvaluation;
    if (!evaluation) {
      evaluation = await geminiService.generateFinalEvaluation(answers);
    }

    // Calculate average confidence score
    const avgConfidenceScore = answers.length
      ? answers.reduce((sum, a) => sum + (a.confidenceScore || 0), 0) / answers.length
      : 0;

    // Save scores to Interview.candidates and Candidate.interviews
    if (interviewId && candidateCode) {
      const interview = await Interview.findById(interviewId);
      if (interview) {
        const candidateEntry = interview.candidates.find(c => c.code === candidateCode);
        if (candidateEntry) {
          candidateEntry.status = 'completed';
          candidateEntry.scores = {
            total: evaluation.overallScore ?? null,
            technical: evaluation.skillAssessment?.technicalKnowledge ?? null,
            coding: evaluation.skillAssessment?.codingAbility ?? null,
            communication: evaluation.skillAssessment?.communicationSkills ?? null,
            confidence: avgConfidenceScore ?? null
          };
          await interview.save();
        }
        // Also update Candidate.interviews
        if (candidateEntry.candidateId) {
          const candidate = await Candidate.findById(candidateEntry.candidateId);
          if (candidate) {
            const interviewEntry = candidate.interviews.find(i => i.interviewId.toString() === interviewId);
            if (interviewEntry) {
              interviewEntry.status = 'completed';
              interviewEntry.scores = candidateEntry.scores;
              await candidate.save();
            }
          }
        }
      }
    }

    res.json({
      success: true,
      evaluation,
      avgConfidenceScore
    });
  } catch (error) {
    console.error('Error ending interview:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate final evaluation',
      details: error.message 
    });
  }
};

// Get interview results
const getInterviewResults = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate('candidates.candidate', 'name email');
    
    if (!interview) {
      return res.status(404).json({ success: false, error: 'Interview not found' });
    }

    // Filter out pending candidates
    const results = interview.candidates.filter(c => c.status !== 'pending');

    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get mock interview results
const getMockInterviewResults = async (req, res) => {
  try {
    // Find all interviews that start with 'mock-'
    const mockInterviews = await Interview.find({ 
      interviewCode: { $regex: '^mock-' } 
    }).sort({ createdAt: -1 });

    // Extract candidate results from mock interviews
    const mockResults = mockInterviews.flatMap(interview => 
      interview.candidates.map(candidate => ({
        id: candidate._id,
        name: `Mock Candidate - ${interview.interviewCode}`,
        email: `mock-${interview.interviewCode}@example.com`,
        status: candidate.status,
        completedAt: candidate.completedAt,
        duration: 30, // Default duration for mock interviews
        results: {
          technicalScore: candidate.results?.technicalScore || 0,
          communicationScore: candidate.results?.communicationScore || 0,
          problemSolvingScore: candidate.results?.problemSolvingScore || 0,
          overallScore: candidate.results?.overallScore || 0,
          strengths: candidate.results?.strengths || [],
          weaknesses: candidate.results?.weaknesses || [],
          feedback: candidate.results?.feedback || ''
        },
        interviewCode: interview.interviewCode,
        skills: interview.skills
      }))
    );

    res.json({ success: true, results: mockResults });
  } catch (error) {
    console.error('Error fetching mock interview results:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Submit interview results
const submitInterviewResults = async (req, res) => {
  try {
    const { interviewId, candidateId } = req.user;
    const results = req.body;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ success: false, error: 'Interview not found' });
    }

    const candidate = interview.candidates.find(c => c.candidate.toString() === candidateId);
    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    // Calculate overall score
    const overallScore = interview.calculateOverallScore(
      results.technicalScore,
      results.communicationScore,
      results.problemSolvingScore,
      results.confidenceScore
    );

    // Update candidate results
    candidate.results = {
      ...results,
      overallScore
    };
    candidate.status = 'completed';
    candidate.completedAt = new Date();
    
    await interview.save();

    res.json({ success: true, message: 'Interview results submitted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Submit all answers at once
const submitAllAnswers = async (req, res) => {
  try {
    const { interviewCode, answers } = req.body;
    
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid answers format'
      });
    }

    // Process all answers
    const processedAnswers = [];
    for (const answer of answers) {
      try {
        const analysis = await geminiService.analyzeAnswer(
          answer.answer, 
          answer.question
        );
        processedAnswers.push({
          ...answer,
          analysis
        });
      } catch (error) {
        console.error('Error processing answer:', error);
        processedAnswers.push({
          ...answer,
          analysis: getDefaultAnalysis()
        });
      }
    }

    // Generate final evaluation
    const finalEvaluation = await geminiService.generateFinalEvaluation(processedAnswers);

    res.json({
      success: true,
      answers: processedAnswers,
      finalEvaluation
    });
  } catch (error) {
    console.error('Error submitting all answers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process answers',
      details: error.message
    });
  }
};

// Analyze face
const analyzeFace = async (req, res) => {
  try {
    const { faceBox, frameSize } = req.body;
    
    if (!faceBox || !frameSize) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing face detection data' 
      });
    }

    const analysis = await faceAnalysisService.analyzeFrame({ faceBox, frameSize });
    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Face analysis error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error analyzing face data',
      details: error.message
    });
  }
};

module.exports = {
  processAnswer,
  endInterview,
  getInterviewResults,
  getMockInterviewResults,
  submitInterviewResults,
  submitAllAnswers,
  analyzeFace
}; 