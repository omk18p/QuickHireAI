import { useState } from "react";
import "../styles/Interview.css";
import { useNavigate } from "react-router-dom";

const Interviews = () => {
  const navigate = useNavigate();
  const [mockCode, setMockCode] = useState("");
  const [interviews] = useState([
    { id: 1, company: "Google", role: "Frontend Developer", date: "2024-03-15", status: "Completed", score: "85%" },
    { id: 2, company: "Microsoft", role: "Full Stack Developer", date: "2024-03-20", status: "Pending" }
  ]);

  const handleStartMock = () => {
    // Generate a proper mock code - ensure it always starts with 'mock-'
    let finalMockCode;
    if (mockCode.trim()) {
      // If user provided a code, prefix it with 'mock-' if it doesn't already have it
      finalMockCode = mockCode.trim().startsWith('mock-') 
        ? mockCode.trim() 
        : `mock-${mockCode.trim()}`;
    } else {
      // Generate a random mock code
      finalMockCode = `mock-${Math.random().toString(36).substring(2, 8)}`;
    }
    console.log('Starting mock interview with code:', finalMockCode);
    navigate('/interview/mock', { state: { mockCode: finalMockCode } });
  };

  return (
    <div className="interviews-section">
      <h1>My Interviews</h1>
      <div className="mock-interview-card" style={{
        background: '#f0f9ff',
        border: '2px solid #3b82f6',
        borderRadius: 12,
        padding: '1.2rem 1.5rem',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px #3b82f622',
        gap: 18
      }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, color: '#2563eb', fontWeight: 800 }}>Mock Interview</h2>
          <p style={{ margin: 0, color: '#334155' }}>Practice with AI-powered questions and feedback. Choose your own skills!</p>
        </div>
        <input
          type="text"
          placeholder="Enter custom code (optional, will be prefixed with 'mock-')"
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
          onClick={handleStartMock}
        >
          Start Mock Interview <i className="fas fa-arrow-right"></i>
        </button>
      </div>
      <div className="interviews-list">
        {interviews.map((interview) => (
          <div key={interview.id} className="interview-card">
            <div className="company-info">
              <h3>{interview.company}</h3>
              <p>{interview.role}</p>
            </div>
            <div className="interview-details">
              <span className={`status ${interview.status.toLowerCase()}`}>
                {interview.status}
              </span>
              <p>Date: {interview.date}</p>
              {interview.score && <p>Score: {interview.score}</p>}
            </div>
            <div className="interview-actions">
              {interview.status === "Pending" ? (
                <button className="start-btn">
                  Start Interview <i className="fas fa-play"></i>
                </button>
              ) : (
                <button className="view-btn">
                  View Results <i className="fas fa-chart-line"></i>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Interviews; 