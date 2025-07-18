import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import "../styles/InterviewGuidelines.css";

const InterviewGuidelines = ({ onContinue, interviewCode: propInterviewCode, isMock = false }) => {
  const navigate = useNavigate();
  const { interviewCode: paramInterviewCode } = useParams();
  const interviewCode = propInterviewCode || paramInterviewCode;

  const handleContinue = () => {
    // If onContinue is provided (for mock interviews), use it
    if (typeof onContinue === 'function') {
      onContinue();
      return;
    }
    
    // Otherwise, use the default navigation (for company interviews)
    navigate(`/interview/skills/${interviewCode}`);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem 0' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div className="guidelines-content">
          <h1>Interview Guidelines</h1>
          <div className="guidelines-card">
            <h2>Before You Begin</h2>
            <ul className="guidelines-list">
              <li>
                <i className="fas fa-microphone"></i>
                <div>
                  <h3>Check Your Audio</h3>
                  <p>Ensure your microphone is working and properly connected.</p>
                </div>
              </li>
              <li>
                <i className="fas fa-video"></i>
                <div>
                  <h3>Test Your Camera</h3>
                  <p>Make sure your webcam is functioning and well-positioned.</p>
                </div>
              </li>
              <li>
                <i className="fas fa-wifi"></i>
                <div>
                  <h3>Internet Connection</h3>
                  <p>Verify you have a stable internet connection.</p>
                </div>
              </li>
              <li>
                <i className="fas fa-clock"></i>
                <div>
                  <h3>Time Management</h3>
                  <p>The interview will last approximately 30 minutes.</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="guidelines-card" style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(30,41,59,0.10)', padding: '2.5rem', marginBottom: '2rem' }}>
            <h2>Interview Format</h2>
            <ul className="format-list">
              <li>Technical questions related to your field</li>
              <li>Problem-solving scenarios</li>
              <li>Code implementation challenges</li>
              <li>Real-time feedback and evaluation</li>
            </ul>
          </div>

          <div className="guidelines-card" style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(30,41,59,0.10)', padding: '2.5rem', marginBottom: '2rem' }}>
            <h2>Tips for Success</h2>
            <ul className="tips-list">
              <li>Speak clearly and maintain good posture</li>
              <li>Take time to understand questions before answering</li>
              <li>Show your problem-solving process</li>
              <li>Ask for clarification if needed</li>
            </ul>
          </div>

          <div className="action-buttons">
            <button className="back-btn" onClick={() => navigate('/dashboard')} style={{ background: '#e0e7ff', color: '#3b82f6', borderRadius: 10, fontWeight: 700, border: 'none', fontSize: '1.1rem', boxShadow: '0 2px 8px rgba(37,99,235,0.10)' }}>
              <i className="fas fa-arrow-left"></i> Back to Dashboard
            </button>
            <button className="continue-btn" onClick={handleContinue} style={{ background: 'linear-gradient(90deg,#3b82f6,#10b981)', color: 'white', borderRadius: 10, fontWeight: 700, border: 'none', fontSize: '1.1rem', boxShadow: '0 2px 8px rgba(37,99,235,0.10)' }}>
              Continue to Skills Selection <i className="fas fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewGuidelines; 