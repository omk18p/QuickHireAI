import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/CompanyHome.css";

const CompanyHome = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  // Get company name from localStorage
  let companyName = "Company";
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.companyName) companyName = user.companyName;
  } catch {}

  const stats = {
    interviews: {
      total: 156,
      active: 24,
      completed: 89,
      scheduled: 12
    },
    candidates: {
      total: 245,
      shortlisted: 45,
      rejected: 32,
      pending: 168
    }
  };

  const recentActivity = [
    {
      id: 1,
      type: "new-candidate",
      title: "New Candidate Application",
      description: "John Doe applied for Senior Frontend Developer",
      time: "2 hours ago",
      icon: "fa-user-plus"
    },
    {
      id: 2,
      type: "interview-completed",
      title: "Interview Completed",
      description: "Sarah Wilson completed UI/UX Designer interview",
      time: "5 hours ago",
      icon: "fa-check"
    },
    {
      id: 3,
      type: "interview-scheduled",
      title: "Interview Scheduled",
      description: "Backend Developer position - 3 candidates",
      time: "1 day ago",
      icon: "fa-calendar"
    }
  ];

  const quickActions = [
    {
      id: 1,
      title: "Create New Interview",
      description: "Set up a custom AI-powered interview",
      icon: "fa-plus-circle",
      action: () => navigate("/company-dashboard/create-interview")
    },
    {
      id: 3,
      title: "View Reports",
      description: "Check candidate performance",
      icon: "fa-chart-bar",
      action: () => navigate("/company-dashboard/reports")
    }
  ];

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
          }}>{companyName}</span>!
        </h1>
        <p style={{
          fontSize: '1.15rem',
          color: '#334155',
          opacity: 0.96,
          fontWeight: 500
        }}>
          Manage your AI-powered interviews efficiently.
        </p>
      </div>

      <div className="quick-actions">
        {quickActions.map(action => (
          <div
            key={action.id}
            className="action-card"
            onClick={action.action}
          >
            <div className="action-icon">
              <i className={`fas ${action.icon}`}></i>
            </div>
            <div className="action-content">
              <h3>{action.title}</h3>
              <p>{action.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-tabs">
        <button
          className={activeTab === "overview" ? "active" : ""}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={activeTab === "interviews" ? "active" : ""}
          onClick={() => setActiveTab("interviews")}
        >
          Interviews
        </button>
        <button
          className={activeTab === "candidates" ? "active" : ""}
          onClick={() => setActiveTab("candidates")}
        >
          Candidates
        </button>
      </div>

      <div className="stats-section">
        {activeTab === "overview" && (
          <>
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-user-tie"></i>
              </div>
              <div className="stat-content">
                <span className="stat-label">Active</span>
                <div className="stat-value">{stats.interviews.active}</div>
                <span className="stat-description">Open Positions</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-users"></i>
              </div>
              <div className="stat-content">
                <span className="stat-label">Total</span>
                <div className="stat-value">{stats.candidates.total}</div>
                <span className="stat-description">Candidates</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <div className="stat-content">
                <span className="stat-label">Completed</span>
                <div className="stat-value">{stats.interviews.completed}</div>
                <span className="stat-description">Interviews</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-clock"></i>
              </div>
              <div className="stat-content">
                <span className="stat-label">Scheduled</span>
                <div className="stat-value">{stats.interviews.scheduled}</div>
                <span className="stat-description">This Week</span>
              </div>
            </div>
          </>
        )}

        {activeTab === "interviews" && (
          <>
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-calendar-check"></i>
              </div>
              <div className="stat-content">
                <span className="stat-label">Total</span>
                <div className="stat-value">{stats.interviews.total}</div>
                <span className="stat-description">Interviews</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-hourglass-half"></i>
              </div>
              <div className="stat-content">
                <span className="stat-label">Active</span>
                <div className="stat-value">{stats.interviews.active}</div>
                <span className="stat-description">In Progress</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-check-double"></i>
              </div>
              <div className="stat-content">
                <span className="stat-label">Completed</span>
                <div className="stat-value">{stats.interviews.completed}</div>
                <span className="stat-description">This Month</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-calendar-alt"></i>
              </div>
              <div className="stat-content">
                <span className="stat-label">Scheduled</span>
                <div className="stat-value">{stats.interviews.scheduled}</div>
                <span className="stat-description">Upcoming</span>
              </div>
            </div>
          </>
        )}

        {activeTab === "candidates" && (
          <>
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-users"></i>
              </div>
              <div className="stat-content">
                <span className="stat-label">Total</span>
                <div className="stat-value">{stats.candidates.total}</div>
                <span className="stat-description">Candidates</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-star"></i>
              </div>
              <div className="stat-content">
                <span className="stat-label">Shortlisted</span>
                <div className="stat-value">{stats.candidates.shortlisted}</div>
                <span className="stat-description">Top Candidates</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-times-circle"></i>
              </div>
              <div className="stat-content">
                <span className="stat-label">Rejected</span>
                <div className="stat-value">{stats.candidates.rejected}</div>
                <span className="stat-description">Not Selected</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-hourglass-end"></i>
              </div>
              <div className="stat-content">
                <span className="stat-label">Pending</span>
                <div className="stat-value">{stats.candidates.pending}</div>
                <span className="stat-description">Awaiting Review</span>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="recent-activity-section">
        <h2>Recent Activity</h2>
        <ul className="activity-list">
          {recentActivity.map(activity => (
            <li key={activity.id} className={`activity-item ${activity.type}`}>
              <div className="activity-icon">
                <i className={`fas ${activity.icon}`}></i>
              </div>
              <div className="activity-content">
                <h4>{activity.title}</h4>
                <p>{activity.description}</p>
                <span className="activity-time">{activity.time}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CompanyHome; 