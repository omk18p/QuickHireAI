import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/SkillsSelection.css';
import { api } from '../../../shared/services/api';

const SKILL_CATEGORIES = {
  sde: {
    title: 'Software Development Engineer',
    skills: [
      { id: 'javascript', name: 'JavaScript', icon: '⚡' },
      { id: 'python', name: 'Python', icon: '🐍' },
      { id: 'java', name: 'Java', icon: '☕' },
      { id: 'cpp', name: 'C++', icon: '⚙️' },
      { id: 'typescript', name: 'TypeScript', icon: '📘' },
      { id: 'go', name: 'Go', icon: '🦫' },
      { id: 'ruby', name: 'Ruby', icon: '💎' }
    ]
  },
  frontend: {
    title: 'Frontend Development',
    skills: [
      { id: 'react', name: 'React', icon: '⚛️' },
      { id: 'angular', name: 'Angular', icon: '🅰️' },
      { id: 'vue', name: 'Vue.js', icon: '🟢' },
      { id: 'html_css', name: 'HTML/CSS', icon: '🎨' },
      { id: 'sass', name: 'SASS/SCSS', icon: '🎯' },
      { id: 'redux', name: 'Redux', icon: '🔄' },
      { id: 'nextjs', name: 'Next.js', icon: '⏭️' }
    ]
  },
  backend: {
    title: 'Backend Development',
    skills: [
      { id: 'node', name: 'Node.js', icon: '🟢' },
      { id: 'express', name: 'Express.js', icon: '🚂' },
      { id: 'django', name: 'Django', icon: '🐍' },
      { id: 'spring', name: 'Spring Boot', icon: '🌱' },
      { id: 'flask', name: 'Flask', icon: '🍶' },
      { id: 'graphql', name: 'GraphQL', icon: '📊' },
      { id: 'rest', name: 'REST APIs', icon: '🌐' }
    ]
  },
  devops: {
    title: 'DevOps & Cloud',
    skills: [
      { id: 'aws', name: 'AWS', icon: '☁️' },
      { id: 'docker', name: 'Docker', icon: '🐳' },
      { id: 'kubernetes', name: 'Kubernetes', icon: '⚓' },
      { id: 'jenkins', name: 'Jenkins', icon: '🤖' },
      { id: 'terraform', name: 'Terraform', icon: '🏗️' },
      { id: 'git', name: 'Git', icon: '📚' },
      { id: 'ci_cd', name: 'CI/CD', icon: '🔄' }
    ]
  },
  database: {
    title: 'Database & Data',
    skills: [
      { id: 'sql', name: 'SQL', icon: '📊' },
      { id: 'mongodb', name: 'MongoDB', icon: '🍃' },
      { id: 'postgresql', name: 'PostgreSQL', icon: '🐘' },
      { id: 'redis', name: 'Redis', icon: '🔴' },
      { id: 'elasticsearch', name: 'Elasticsearch', icon: '🔍' },
      { id: 'bigdata', name: 'Big Data', icon: '📈' },
      { id: 'data_structures', name: 'Data Structures', icon: '📚' }
    ]
  }
};

const SkillsSelection = ({ interviewCode: propInterviewCode, onContinue, isMock = false }) => {
  const navigate = useNavigate();
  const { interviewCode: paramInterviewCode } = useParams();
  const interviewCode = propInterviewCode || paramInterviewCode;
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const toggleSkill = (skill) => {
    setSelectedSkills(prev => {
      if (prev.includes(skill)) {
        return prev.filter(s => s !== skill);
      } else {
        return [...prev, skill];
      }
    });
  };

  const handleStartInterview = async () => {
    if (selectedSkills.length < 2) {
      setError('Please select at least 2 skills');
      return;
    }

    // For mock interviews, always use the onContinue callback
    if (isMock && typeof onContinue === 'function') {
      onContinue(selectedSkills);
      return;
    }

    // For company-driven interviews, check if onContinue is provided
    if (typeof onContinue === 'function') {
      onContinue(selectedSkills);
      return;
    }

    if (!interviewCode || interviewCode === 'undefined') {
      setError('Invalid or missing interview code. Please go back and try again.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await api.post('/interviews/start', {
        interviewCode,
        skills: selectedSkills
      });

      if (response.data.success) {
        navigate(`/interview/session/${interviewCode}`, {
          state: {
            interviewData: response.data.interview,
            interviewCode,
            skills: selectedSkills
          }
        });
      } else {
        throw new Error(response.data.error || 'Failed to start interview');
      }
    } catch (error) {
      console.error('Error starting interview:', error);
      setError(error.response?.data?.details || error.message || 'Failed to start interview. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="skills-selection">
      {isLoading ? (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <h2>Preparing Your Interview...</h2>
            <p>Generating personalized questions based on your selected skills</p>
          </div>
        </div>
      ) : (
        <>
          <div className="header-section">
            <h1>Select Your Skills</h1>
            <p className="subtitle">Choose at least 2 skills for your technical interview</p>
            {error && <div className="error-message">{error}</div>}
            <div className="selection-info">
              <span className="selected-count">{selectedSkills.length}</span>
              <span>skills selected</span>
            </div>
          </div>

          <div className="skills-container" style={{gap: '1rem'}}>
            {Object.entries(SKILL_CATEGORIES).map(([category, { title, skills }]) => (
              <div key={category} className="skill-category" style={{padding: '0.5rem 0.25rem', marginBottom: '0.5rem'}}>
                <h2 className="category-title" style={{fontSize: '1.1rem', marginBottom: '0.5rem', paddingBottom: '0.25rem'}}>{title}</h2>
                <div className="skills-grid">
                  {skills.map(({ id, name, icon }) => (
                    <button
                      key={id}
                      className={`skill-button ${selectedSkills.includes(name) ? 'selected' : ''}`}
                      onClick={() => toggleSkill(name)}
                    >
                      <span className="skill-icon">{icon}</span>
                      <span className="skill-name">{name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="action-buttons">
            <button
              className="start-button"
              onClick={handleStartInterview}
              disabled={selectedSkills.length < 2}
            >
              {isLoading ? 'Starting Interview...' : 'Start Interview'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default SkillsSelection; 