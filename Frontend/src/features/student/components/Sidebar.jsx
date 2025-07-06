import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/Sidebar.css';

const Sidebar = ({ setActiveSection, activeSection, navigate }) => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <i className="fas fa-graduation-cap"></i>
          <h2>QuickHire AI</h2>
        </div>
      </div>

      <nav className="nav-menu">
        <div className="menu-section">
          <h3 className="section-title">MAIN MENU</h3>
          <ul>
            <li className={activeSection === 'home' ? 'active' : ''}>
              <button 
                onClick={() => setActiveSection('home')} 
                className="menu-item"
              >
                <i className="fas fa-home"></i>
                <span>Dashboard</span>
              </button>
            </li>
            <li className={activeSection === 'interviews' ? 'active' : ''}>
              <button 
                onClick={() => setActiveSection('interviews')} 
                className="menu-item"
              >
                <i className="fas fa-video"></i>
                <span>Interviews</span>
              </button>
            </li>
            <li className={activeSection === 'profile' ? 'active' : ''}>
              <button 
                onClick={() => setActiveSection('profile')} 
                className="menu-item"
              >
                <i className="fas fa-user"></i>
                <span>Profile</span>
              </button>
            </li>
          </ul>
        </div>

        <div className="menu-section">
          <h3 className="section-title">RESOURCES</h3>
          <ul>
            <li>
              <button className="menu-item">
                <i className="fas fa-book"></i>
                <span>Learning Resources</span>
              </button>
            </li>
            <li>
              <button className="menu-item">
                <i className="fas fa-question-circle"></i>
                <span>Support</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>

      <button className="logout-btn" onClick={handleLogout}>
        <i className="fas fa-sign-out-alt"></i>
        <span>Logout</span>
      </button>
    </div>
  );
};

export default Sidebar; 