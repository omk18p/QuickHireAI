import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../shared/services/api";
import "../styles/CompanyInterviews.css";

const CompanyInterviews = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCandidates, setShowCandidates] = useState(null); // interviewId or null

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const response = await api.get("/interviews/company");
      if (!response.data.success) {
        throw new Error(response.data.error);
      }
      setInterviews(response.data.interviews);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "success";
      case "draft": return "warning";
      case "completed": return "info";
      default: return "default";
    }
  };

  const isLive = (interview) => {
    if (interview.status !== "active") return false;
    const now = new Date();
    const interviewDate = new Date(interview.createdAt);
    // Assume interview is live for 2 hours from start (customize as needed)
    return now >= interviewDate && now <= new Date(interviewDate.getTime() + 2 * 60 * 60 * 1000);
  };

  const filteredInterviews = interviews.filter(interview => {
    if (filter !== "all" && interview.status !== filter) return false;
    return interview.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           interview.description?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="interviews-container">
      <div className="page-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', paddingBottom: '1rem', borderBottom: '1.5px solid #e2e8f0'}}>
        <div>
          <h1 style={{fontSize: '2.3rem', fontWeight: 900, color: '#1e293b', marginBottom: '0.3rem', letterSpacing: '-1px'}}>All Interviews</h1>
          <p style={{fontSize: '1.1rem', color: '#64748b', fontWeight: 500}}>Manage and track your interview processes</p>
        </div>
        <div className="header-buttons">
          <button className="new-interview-btn" style={{padding: '1rem 2.2rem', fontSize: '1.1rem', fontWeight: 700, borderRadius: '12px', background: 'linear-gradient(90deg, #3b82f6 30%, #10b981 100%)', color: 'white', border: 'none', boxShadow: '0 4px 16px rgba(59,130,246,0.10)', display: 'flex', alignItems: 'center', gap: '0.7rem'}} onClick={() => navigate("/company-dashboard/create-interview")}> <i className="fas fa-plus"></i> Create Interview </button>
        </div>
      </div>
      <div className="filters-section" style={{background: 'white', borderRadius: '14px', padding: '1.5rem', marginBottom: '2.5rem', boxShadow: '0 2px 8px rgba(30,41,59,0.06)', border: '1.5px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', justifyContent: 'space-between'}}>
        <div className="search-box" style={{display: 'flex', alignItems: 'center', gap: '0.7rem', flex: 1}}>
          <i className="fas fa-search" style={{color: '#64748b', fontSize: '1.1rem'}}></i>
          <input type="text" placeholder="    Search interviews..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '0.7rem 1.2rem', fontSize: '1rem', width: '100%'}} />
        </div>
        <div className="filter-buttons" style={{display: 'flex', gap: '0.7rem'}}>
          <button className={filter === "all" ? "active" : ""} style={{padding: '0.7rem 1.5rem', borderRadius: '8px', border: 'none', background: filter === 'all' ? 'linear-gradient(90deg, #3b82f6 30%, #10b981 100%)' : '#f1f5f9', color: filter === 'all' ? 'white' : '#1e293b', fontWeight: 600, fontSize: '1rem', transition: 'all 0.2s'}} onClick={() => setFilter("all")}>All</button>
          <button className={filter === "active" ? "active" : ""} style={{padding: '0.7rem 1.5rem', borderRadius: '8px', border: 'none', background: filter === 'active' ? 'linear-gradient(90deg, #3b82f6 30%, #10b981 100%)' : '#f1f5f9', color: filter === 'active' ? 'white' : '#1e293b', fontWeight: 600, fontSize: '1rem', transition: 'all 0.2s'}} onClick={() => setFilter("active")}>Active</button>
          <button className={filter === "draft" ? "active" : ""} style={{padding: '0.7rem 1.5rem', borderRadius: '8px', border: 'none', background: filter === 'draft' ? 'linear-gradient(90deg, #3b82f6 30%, #10b981 100%)' : '#f1f5f9', color: filter === 'draft' ? 'white' : '#1e293b', fontWeight: 600, fontSize: '1rem', transition: 'all 0.2s'}} onClick={() => setFilter("draft")}>Draft</button>
          <button className={filter === "completed" ? "active" : ""} style={{padding: '0.7rem 1.5rem', borderRadius: '8px', border: 'none', background: filter === 'completed' ? 'linear-gradient(90deg, #3b82f6 30%, #10b981 100%)' : '#f1f5f9', color: filter === 'completed' ? 'white' : '#1e293b', fontWeight: 600, fontSize: '1rem', transition: 'all 0.2s'}} onClick={() => setFilter("completed")}>Completed</button>
        </div>
      </div>
      <div className="interviews-list" style={{display: 'flex', flexDirection: 'column', gap: '1.1rem'}}>
        {filteredInterviews.map(interview => (
          <div key={interview._id} className="interview-card" style={{background: 'white', borderRadius: '12px', padding: '1.1rem 2rem', boxShadow: '0 1px 4px rgba(30,41,59,0.07)', border: '1px solid #e2e8f0', transition: 'all 0.2s', display: 'flex', flexDirection: 'row', alignItems: 'stretch', justifyContent: 'space-between', gap: '1.2rem', minHeight: '90px'}}>
            <div style={{flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
              <div className="interview-title" style={{fontWeight: 900, fontSize: '1.13rem', color: '#1e293b', marginBottom: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{interview.title || interview.interviewName || 'Untitled Interview'}</div>
              <div style={{color: '#64748b', fontWeight: 500, fontSize: '0.98rem', marginBottom: '0.3rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '28vw'}}>{interview.description}</div>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.3rem'}}>
                {interview.skills.map((skill, idx) => (
                  <span key={idx} className="skill-pill" style={{background: '#e0f2fe', color: '#0f172a', borderRadius: '8px', padding: '0.22rem 0.7rem', fontWeight: 600, fontSize: '0.89rem'}}>{skill}</span>
                ))}
              </div>
              <div style={{display: 'flex', gap: '0.7rem', alignItems: 'center', flexWrap: 'wrap'}}>
                <span style={{color: '#64748b', fontWeight: 500, fontSize: '0.97rem'}}><i className="far fa-calendar"></i> {new Date(interview.createdAt).toLocaleDateString()}</span>
                <span style={{color: '#64748b', fontWeight: 500, fontSize: '0.97rem'}}><i className="far fa-clock"></i> {interview.duration} min</span>
                <span className={`interview-status-badge ${getStatusColor(interview.status)}`} style={{padding: '0.22rem 0.8rem', borderRadius: '999px', fontWeight: 700, fontSize: '0.89rem', background: interview.status === 'active' ? '#dcfce7' : interview.status === 'draft' ? '#fef9c3' : interview.status === 'completed' ? '#dbeafe' : '#f1f5f9', color: interview.status === 'active' ? '#166534' : interview.status === 'draft' ? '#92400e' : interview.status === 'completed' ? '#1e40af' : '#64748b', textTransform: 'capitalize'}}>{interview.status}</span>
                <span style={{color: '#64748b', fontWeight: 600, fontSize: '0.97rem'}}><i className="fas fa-users"></i> {interview.candidates?.length || 0} Candidates</span>
              </div>
            </div>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '180px'}}>
              <button className="action-btn view-details" style={{padding: '0.7rem 1.5rem', borderRadius: '9px', background: '#2563eb', color: 'white', fontWeight: 700, border: 'none', fontSize: '1rem', boxShadow: '0 1px 4px rgba(37,99,235,0.08)', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap', height: 'fit-content'}} onClick={() => navigate(`/company-dashboard/interviews/${interview._id}/details`)}>
                <i className="fas fa-eye"></i> View Details
              </button>
            </div>
          </div>
        ))}
      </div>
      {/* Interview Details Modal */}
      {showCandidates && (
        <InterviewDetailsModal
          interview={interviews.find(i => i._id === showCandidates)}
          onClose={() => setShowCandidates(null)}
        />
      )}
    </div>
  );
};

const InterviewDetailsModal = ({ interview, onClose }) => {
  if (!interview) return null;
  return (
    <div className="candidates-modal-overlay">
      <div className="candidates-modal" style={{maxWidth: '700px', width: '100%', background: '#fff', borderRadius: '18px', boxShadow: '0 8px 32px rgba(30,41,59,0.18)', padding: '2.5rem 2rem', position: 'relative', zIndex: 100}}>
        <div className="modal-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
          <div>
            <h2 style={{fontWeight: 900, fontSize: '2rem', color: '#1e293b', marginBottom: '0.3rem'}}>{interview.title || interview.interviewName || 'Untitled Interview'}</h2>
            <p style={{color: '#64748b', fontWeight: 500, fontSize: '1.1rem'}}>{interview.description}</p>
          </div>
          <button className="close-btn" style={{background: 'none', border: 'none', fontSize: '1.7rem', color: '#64748b', cursor: 'pointer'}} onClick={onClose}><i className="fas fa-times"></i></button>
        </div>
        <div style={{marginBottom: '1.5rem'}}>
          <span style={{marginRight: '1.2rem', color: '#64748b'}}><i className="far fa-calendar"></i> {new Date(interview.createdAt).toLocaleDateString()}</span>
          <span style={{marginRight: '1.2rem', color: '#64748b'}}><i className="far fa-clock"></i> {interview.duration} min</span>
          <span className={`interview-status-badge ${interview.status}`} style={{padding: '0.4rem 1.1rem', borderRadius: '999px', fontWeight: 700, fontSize: '0.95rem', background: interview.status === 'active' ? '#dcfce7' : interview.status === 'draft' ? '#fef9c3' : interview.status === 'completed' ? '#dbeafe' : '#f1f5f9', color: interview.status === 'active' ? '#166534' : interview.status === 'draft' ? '#92400e' : interview.status === 'completed' ? '#1e40af' : '#64748b', textTransform: 'capitalize'}}>{interview.status}</span>
        </div>
        <div style={{marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem'}}>
          {interview.skills.map((skill, idx) => (
            <span key={idx} className="skill-pill" style={{background: 'linear-gradient(90deg, #e0f2fe 30%, #f0fdf4 100%)', color: '#0f172a', borderRadius: '8px', padding: '0.4rem 1rem', fontWeight: 600, fontSize: '0.95rem'}}>{skill}</span>
          ))}
        </div>
        <div style={{marginBottom: '1.5rem'}}>
          <h3 style={{fontWeight: 800, fontSize: '1.2rem', color: '#1e293b', marginBottom: '0.7rem'}}>Candidates ({interview.candidates.length})</h3>
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            {interview.candidates.map((candidate, idx) => {
              const candidateName = candidate.candidate?.name || candidate.name || candidate.candidateName || `Candidate ${idx + 1}`;
              const candidateEmail = candidate.candidate?.email || candidate.email || candidate.candidateEmail || 'No email';
              const status = candidate.status || 'pending';
              return (
                <div key={candidate.code || idx} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', borderRadius: '10px', padding: '1rem 1.5rem'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '1.2rem'}}>
                    <div style={{background: 'linear-gradient(90deg, #3b82f6 30%, #10b981 100%)', color: 'white', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem'}}>{candidateName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()}</div>
                    <div>
                      <div style={{fontWeight: 700, color: '#1e293b', fontSize: '1.05rem'}}>{candidateName}</div>
                      <div style={{color: '#64748b', fontSize: '0.97rem'}}>{candidateEmail}</div>
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '1.2rem'}}>
                    <span style={{padding: '0.4rem 1.1rem', borderRadius: '999px', fontWeight: 700, fontSize: '0.95rem', background: status === 'completed' ? '#dbeafe' : '#fef9c3', color: status === 'completed' ? '#1e40af' : '#92400e', textTransform: 'capitalize'}}>{status}</span>
                    <button style={{padding: '0.6rem 1.3rem', borderRadius: '8px', background: 'linear-gradient(90deg, #3b82f6 30%, #10b981 100%)', color: 'white', fontWeight: 700, border: 'none', fontSize: '1rem', boxShadow: '0 2px 8px rgba(59,130,246,0.10)', display: 'flex', alignItems: 'center', gap: '0.5rem'}}><i className="fas fa-chart-bar"></i> View Report</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
};

export default CompanyInterviews; 