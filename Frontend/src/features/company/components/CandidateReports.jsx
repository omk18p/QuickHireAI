import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../../shared/services/api";
import "../styles/CandidateReports.css";
import ViewReport from './ViewReport';

const CandidateReports = () => {
  const { interviewId } = useParams();
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!interviewId) return;
    fetchCandidates();
  }, [interviewId]);

  const fetchCandidates = async () => {
    setLoading(true);
    setError("");
    try {
      let allResults = [];
      
      // Fetch regular interview results if interviewId is provided
      if (interviewId) {
        const response = await api.get(`/interviews/${interviewId}/results`);
        if (response.data.success) {
          allResults = [...response.data.results];
        }
      }
      
      // Fetch mock interview results
      try {
        const mockResponse = await api.get('/interviews/mock-results');
        if (mockResponse.data.success) {
          allResults = [...allResults, ...mockResponse.data.results];
        }
      } catch (mockError) {
        console.log('No mock results available or error fetching:', mockError.message);
      }
      
      setCandidates(allResults);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (candidateId, status) => {
    try {
      const response = await api.post(`/interviews/${interviewId}/candidate/${candidateId}/status`, { status });
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to update status");
      }
      fetchCandidates();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const filteredCandidates = candidates.filter(candidate => {
    if (filter === "mock") {
      return candidate.interviewCode && candidate.interviewCode.startsWith('mock-');
    }
    if (filter !== "all" && candidate.status !== filter) return false;
    return candidate.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           candidate.email?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleViewReport = (candidate) => {
    setSelectedCandidate(candidate);
  };

  const handleCloseReport = () => {
    setSelectedCandidate(null);
  };

  const handleShortlist = (candidateId) => {
    updateStatus(candidateId, "shortlisted");
  };

  const handleReject = (candidateId) => {
    updateStatus(candidateId, "rejected");
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "excellent";
    if (score >= 60) return "good";
    if (score >= 40) return "average";
    return "poor";
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading candidate reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={fetchCandidates}>Retry</button>
      </div>
    );
  }

  return (
    <div className="candidate-reports-container">
      <div className="reports-header">
        <h1>Candidate Reports</h1>
        <p>Review candidate interview results including mock interviews</p>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search candidates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-buttons">
          <button
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={filter === "completed" ? "active" : ""}
            onClick={() => setFilter("completed")}
          >
            Completed
          </button>
          <button
            className={filter === "shortlisted" ? "active" : ""}
            onClick={() => setFilter("shortlisted")}
          >
            Shortlisted
          </button>
          <button
            className={filter === "mock" ? "active" : ""}
            onClick={() => setFilter("mock")}
          >
            Mock Interviews
          </button>
        </div>
      </div>

      <div className="candidates-list">
        {filteredCandidates.map(candidate => (
          <div key={candidate.id} className="candidate-card">
            <div className="candidate-info">
              <div className="avatar">{candidate.name?.charAt(0)}</div>
              <div className="details">
                <h3>{candidate.name}</h3>
                <p>{candidate.email}</p>
                {candidate.interviewCode && candidate.interviewCode.startsWith('mock-') && (
                  <span className="mock-badge" style={{
                    background: '#fef3c7',
                    color: '#92400e',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    Mock Interview
                  </span>
                )}
                <span className="date">
                  <i className="far fa-calendar"></i>
                  {new Date(candidate.completedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="score-section">
              <div className="score-grid">
                <div className="score-item">
                  <span className="label">Technical</span>
                  <span className={`value ${getScoreColor(candidate.results?.technicalScore * 10)}`}>
                    {Math.round((candidate.results?.technicalScore || 0) * 10) / 10}/10
                  </span>
                </div>
                <div className="score-item">
                  <span className="label">Communication</span>
                  <span className={`value ${getScoreColor(candidate.results?.communicationScore * 10)}`}>
                    {Math.round((candidate.results?.communicationScore || 0) * 10) / 10}/10
                  </span>
                </div>
                <div className="score-item">
                  <span className="label">Problem Solving</span>
                  <span className={`value ${getScoreColor(candidate.results?.problemSolvingScore * 10)}`}>
                    {Math.round((candidate.results?.problemSolvingScore || 0) * 10) / 10}/10
                  </span>
                </div>
                <div className="score-item">
                  <span className="label">Overall</span>
                  <span className={`value ${getScoreColor(candidate.results?.overallScore * 10)}`}>
                    {Math.round((candidate.results?.overallScore || 0) * 10) / 10}/10
                  </span>
                </div>
              </div>
            </div>

            <div className="actions">
              <button
                className="view-button"
                onClick={() => handleViewReport(candidate)}
              >
                <i className="fas fa-eye"></i>
                View Details
              </button>
              {candidate.status === "completed" && (
                <>
                  <button
                    className="shortlist-button"
                    onClick={() => handleShortlist(candidate.id)}
                  >
                    <i className="fas fa-star"></i>
                    Shortlist
                  </button>
                  <button
                    className="reject-button"
                    onClick={() => handleReject(candidate.id)}
                  >
                    <i className="fas fa-times"></i>
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedCandidate && (
        <ViewReport candidate={selectedCandidate} onClose={handleCloseReport} />
      )}
    </div>
  );
};

export default CandidateReports; 