import { useEffect, useState } from 'react';
import '../styles/RealTimeFeedback.css';

const RealTimeFeedback = ({ feedback }) => {
  const [score, setScore] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    if (feedback) {
      setScore(feedback.score);
      setAnalysis(feedback.details);
    }
  }, [feedback]);

  if (!feedback) return null;

  return (
    <div className="feedback-container">
      <div className="score-section">
        <h3>Score: {score}/10</h3>
      </div>
      
      {analysis && (
        <div className="analysis-section">
          <div className="metric">
            <span>Technical Understanding:</span>
            <div className="progress-bar">
              <div 
                className="progress" 
                style={{width: `${analysis.understanding * 10}%`}}
              />
            </div>
          </div>
          
          <div className="metric">
            <span>Communication:</span>
            <div className="progress-bar">
              <div 
                className="progress" 
                style={{width: `${analysis.clarity * 10}%`}}
              />
            </div>
          </div>
          
          <div className="metric">
            <span>Completeness:</span>
            <div className="progress-bar">
              <div 
                className="progress" 
                style={{width: `${analysis.completeness * 10}%`}}
              />
            </div>
          </div>
        </div>
      )}

      {feedback.feedback && (
        <div className="feedback-text">
          <h4>Feedback:</h4>
          <p>{feedback.feedback}</p>
        </div>
      )}
    </div>
  );
};

export default RealTimeFeedback; 