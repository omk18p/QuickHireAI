// src/services/questionService.js

const { generateQuestion } = require('./geminiService');

const INTERVIEW_TOPICS = [
  {
    name: 'JavaScript',
    weight: 1,
    questionTypes: ['concepts', 'practical']
  },
  {
    name: 'Data Structures',
    weight: 1,
    questionTypes: ['concepts', 'problem-solving']
  },
  {
    name: 'Web Development',
    weight: 1,
    questionTypes: ['frontend', 'backend']
  },
  {
    name: 'System Design',
    weight: 1,
    questionTypes: ['architecture', 'scalability']
  },
  {
    name: 'Coding Best Practices',
    weight: 1,
    questionTypes: ['patterns', 'principles']
  }
];

const MAX_QUESTIONS = 5;
const usedQuestions = new Map(); // Store used questions per topic
const usedTopics = new Set(); // Track used topics

// Mock question data for now
const questionBank = {
    "JavaScript": [
      { question: "What is closure in JavaScript?" },
      { question: "Explain the concept of hoisting in JavaScript." }
    ],
    "Python": [
      { question: "What is a list comprehension in Python?" },
      { question: "Explain the difference between deep copy and shallow copy in Python." }
    ],
    // Add more skills and questions as needed
  };
  
  const getQuestionsBySkills = (skills) => {
    let questions = [];
    skills.forEach(skill => {
      if (questionBank[skill]) {
        questions = [...questions, ...questionBank[skill]];
      }
    });
    return questions;
  };
  
  const getNextQuestion = async (currentTopic, questionNumber) => {
    try {
      console.log(`Getting question ${questionNumber} for topic ${currentTopic}`);
      
      if (questionNumber > MAX_QUESTIONS) {
        return {
          isComplete: true,
          nextQuestion: null,
          nextTopic: null
        };
      }

      // If we've used all topics, reset the used topics set
      if (usedTopics.size >= INTERVIEW_TOPICS.length) {
        usedTopics.clear();
      }

      // Select a new topic that hasn't been used recently
      let nextTopic = currentTopic;
      if (usedTopics.has(currentTopic)) {
        const availableTopic = INTERVIEW_TOPICS.find(topic => !usedTopics.has(topic.name));
        nextTopic = availableTopic ? availableTopic.name : INTERVIEW_TOPICS[0].name;
      }
      usedTopics.add(nextTopic);

      let question;
      let attempts = 0;
      const maxAttempts = 3;
      
      // Get previously used questions for this topic
      const topicUsedQuestions = usedQuestions.get(nextTopic) || new Set();

      // Try to get a unique question
      while (attempts < maxAttempts) {
        question = await generateQuestion(nextTopic);
        
        // Create a unique key for the question based on core content
        const questionKey = question.question.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        if (!topicUsedQuestions.has(questionKey)) {
          // Add to used questions
          topicUsedQuestions.add(questionKey);
          usedQuestions.set(nextTopic, topicUsedQuestions);
          
          console.log('Generated new unique question:', {
            topic: nextTopic,
            questionKey,
            usedQuestionsCount: topicUsedQuestions.size
          });
          
          return {
            isComplete: false,
            nextQuestion: {
              ...question,
              topic: nextTopic
            },
            nextTopic
          };
        }
        
        attempts++;
        console.log(`Attempt ${attempts}: Question was already used, trying again...`);
      }

      // If we couldn't get a unique question, move to a different topic
      const alternativeTopic = INTERVIEW_TOPICS.find(topic => 
        !usedTopics.has(topic.name) && topic.name !== nextTopic
      ) || INTERVIEW_TOPICS[0].name;

      usedTopics.add(alternativeTopic);
      question = await generateQuestion(alternativeTopic);
      
      const newTopicQuestions = new Set([question.question.toLowerCase().replace(/[^a-z0-9]/g, '')]);
      usedQuestions.set(alternativeTopic, newTopicQuestions);

      return {
        isComplete: false,
        nextQuestion: {
          ...question,
          topic: alternativeTopic
        },
        nextTopic: alternativeTopic
      };

    } catch (error) {
      console.error('Error getting next question:', error);
      return getFallbackQuestion(currentTopic);
    }
  };
  
  const getFallbackQuestion = (topic) => {
    return {
      question: `Explain a fundamental concept in ${topic}?`,
      expectedPoints: ["Definition", "Key concepts", "Example"],
      difficulty: "easy",
      requiresCode: false,
      topic: topic
    };
  };
  
  const generateFinalEvaluation = (answers) => {
    const totalScore = answers.reduce((sum, answer) => sum + answer.score, 0);
    const averageScore = Math.round(totalScore / answers.length);
    
    const strengths = [];
    const improvements = [];
    
    answers.forEach(answer => {
      if (answer.details.technicalAccuracy >= 8) {
        strengths.push(`Strong technical understanding in ${answer.question.topic}`);
      }
      if (answer.details.clarity < 7) {
        improvements.push(`Improve clarity in ${answer.question.topic} explanations`);
      }
    });

    return {
      overallScore: averageScore,
      questionScores: answers.map(a => ({
        topic: a.question.topic,
        score: a.score,
        feedback: a.feedback
      })),
      strengths: [...new Set(strengths)],
      improvementAreas: [...new Set(improvements)],
      finalFeedback: `Overall performance: ${averageScore}/10. ${
        averageScore >= 8 ? 'Excellent technical knowledge.' :
        averageScore >= 6 ? 'Good understanding with room for improvement.' :
        'Needs more practice and preparation.'
      }`
    };
  };
  
  // Reset both questions and topics when starting new interview
  const resetQuestions = () => {
    usedQuestions.clear();
    usedTopics.clear();
    console.log('Question and topic history cleared');
  };
  
  module.exports = {
    getQuestionsBySkills,
    getNextQuestion,
    getFallbackQuestion,
    INTERVIEW_TOPICS,
    generateFinalEvaluation,
    MAX_QUESTIONS,
    resetQuestions
  }; 