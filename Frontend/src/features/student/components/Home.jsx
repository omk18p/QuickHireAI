import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";
import { api } from '../../../shared/services/api';

const Home = () => {
  const navigate = useNavigate();
  const [interviewCode, setInterviewCode] = useState("");
  const [error, setError] = useState("");
  const [mockCode, setMockCode] = useState("");
  const [candidateCode, setCandidateCode] = useState("");
  // Get student name from localStorage
  let studentName = "Student";
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.name) studentName = user.name;
  } catch {}

  const handleStartInterview = async (e) => {
    e.preventDefault();
    setError("");
    if (!interviewCode.trim() || !candidateCode.trim()) {
      setError("Please enter both interview code and your candidate code");
      return;
    }
    try {
      const response = await api.post('/interviews/validate-code', {
        interviewCode: interviewCode.trim(),
        candidateCode: candidateCode.trim(),
      });
      if (response.data.success) {
        // Store token and interview details for session
        localStorage.setItem('interviewToken', response.data.token);
        localStorage.setItem('interviewDetails', JSON.stringify(response.data.interview));
        
        // Store interviewId and candidateCode for completion
        sessionStorage.setItem('interviewId', response.data.interview.id);
        sessionStorage.setItem('candidateCode', candidateCode.trim());
        
        navigate(`/interview/session/${interviewCode.trim()}`);
    } else {
        setError(response.data.error || 'Invalid code. Please check your details.');
      }
    } catch (err) {
      setError(err.message || 'Failed to validate interview code.');
    }
  };

  return (
    <div className="dashboard-home">
      <div className="welcome-section" style={{
        background: '#fff',
        color: '#1e293b',
        borderRadius: '18px',
        padding: '2.5rem 2rem',
        textAlign: 'center',
        marginBottom: '2rem',
        boxShadow: '0 6px 32px rgba(30,41,59,0.08)',
        border: '1.5px solid #e0e7ef',
        position: 'relative',
        zIndex: 2
      }}>
        <h1 style={{
          fontWeight: 900,
          fontSize: '2.3rem',
          marginBottom: '0.5rem',
          letterSpacing: '-1px',
          color: '#1e293b'
        }}>
          Welcome back, <span style={{
            background: 'linear-gradient(90deg, #3b82f6 30%, #10b981 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: 900
          }}>{studentName}</span>!
        </h1>
        <p style={{
          fontSize: '1.15rem',
          color: '#334155',
          opacity: 0.96,
          fontWeight: 500
        }}>
          Ready to ace your next interview? Let's get started.
        </p>
      </div>

      {/* Start New Interview Card (company-based) - now on top */}
      <div className="interview-section">
        <div className="interview-code-section" style={{
          background: '#fff',
          border: '2px solid #e0e7ef',
          borderRadius: 14,
          padding: '1.2rem 1.5rem',
          marginBottom: 32,
          boxShadow: '0 2px 8px #e0e7ef44',
          maxWidth: 750,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}>
          <h2 style={{ color: '#1e293b', fontWeight: 800, marginBottom: 6 }}>Start New Interview</h2>
          <p style={{ color: '#334155', marginBottom: 18 }}>Enter your interview code to begin your session</p>
          <form onSubmit={handleStartInterview}>
            <div className="code-input-group" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="text"
                placeholder="Enter interview code (e.g., INT-123)"
                value={interviewCode}
                onChange={(e) => setInterviewCode(e.target.value)}
                style={{
                  padding: '0.6rem 1rem',
                  borderRadius: 8,
                  border: '1.5px solid #cbd5e1',
                  fontSize: 16,
                  minWidth: 180,
                  flex: 1
                }}
              />
              <input
                type="text"
                placeholder="Enter your candidate code (e.g., CAND-456)"
                value={candidateCode}
                onChange={(e) => setCandidateCode(e.target.value)}
                style={{
                  padding: '0.6rem 1rem',
                  borderRadius: 8,
                  border: '1.5px solid #cbd5e1',
                  fontSize: 16,
                  minWidth: 180,
                  flex: 1
                }}
              />
              <button 
                type="submit" 
                disabled={!interviewCode.trim() || !candidateCode.trim()}
                style={{
                  background: 'linear-gradient(90deg, #3b82f6 30%, #10b981 100%)',
                  color: '#fff',
                  fontWeight: 700,
                  borderRadius: 8,
                  padding: '0.7rem 1.5rem',
                  fontSize: 17,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 1px 4px #3b82f655'
                }}
              >
                Start Interview <i className="fas fa-arrow-right"></i>
              </button>
            </div>
            {error && (
              <div className="error-message">{error}</div>
            )}
          </form>
        </div>
      </div>

      {/* Mock Interview Card - now below, styled to match */}
      <div className="mock-interview-card" style={{
        background: '#fff',
        border: '2px solid #3b82f6',
        borderRadius: 14,
        padding: '1.2rem 1.5rem',
        marginBottom: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px #3b82f622',
        gap: 18,
        maxWidth: 750,
        marginLeft: 'auto',
        marginRight: 'auto',
      }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, color: '#2563eb', fontWeight: 800 }}>Mock Interview</h2>
          <p style={{ margin: 0, color: '#334155' }}>Practice with AI-powered questions and feedback. Choose your own skills!</p>
        </div>
        <input
          type="text"
          placeholder="Enter mock code (e.g., test1, practice)"
          value={mockCode}
          onChange={e => setMockCode(e.target.value)}
          style={{
            padding: '0.6rem 1rem',
            borderRadius: 8,
            border: '1.5px solid #cbd5e1',
            fontSize: 16,
            marginRight: 12,
            minWidth: 180
          }}
        />
        <button
          className="start-btn"
          style={{ background: '#3b82f6', color: '#fff', fontWeight: 700, borderRadius: 8, padding: '0.7rem 1.5rem', fontSize: 17, border: 'none', cursor: 'pointer', boxShadow: '0 1px 4px #3b82f655' }}
          onClick={() => navigate('/interview/mock', { state: { mockCode: mockCode || 'mock' } })}
        >
          Continue <i className="fas fa-arrow-right"></i>
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-content">
            <h3>Upcoming</h3>
            <p className="stat-number">2</p>
            <span>Scheduled Interviews</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-content">
            <h3>Completed</h3>
            <p className="stat-number">5</p>
            <span>Past Interviews</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-star"></i>
          </div>
          <div className="stat-content">
            <h3>Average Score</h3>
            <p className="stat-number">85%</p>
            <span>Performance</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 