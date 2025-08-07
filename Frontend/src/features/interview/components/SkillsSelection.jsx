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
  },
  // Mechanical Engineering
  mech_thermo: {
    title: 'Thermodynamics',
    skills: [
      { id: 'laws_thermo', name: 'Laws of Thermodynamics', icon: '🔥' },
      { id: 'entropy', name: 'Entropy', icon: '♨️' },
      { id: 'cycles', name: 'Thermodynamic Cycles', icon: '🔄' },
      { id: 'applications', name: 'Applications', icon: '🏭' }
    ]
  },
  mech_fluid: {
    title: 'Fluid Mechanics',
    skills: [
      { id: 'fluid_properties', name: 'Fluid Properties', icon: '💧' },
      { id: 'flow', name: 'Fluid Flow', icon: '🌊' },
      { id: 'pumps', name: 'Pumps & Turbines', icon: '🚰' },
      { id: 'hydraulics', name: 'Hydraulics', icon: '🛠️' }
    ]
  },
  mech_machine: {
    title: 'Machine Design',
    skills: [
      { id: 'gears', name: 'Gears & Bearings', icon: '⚙️' },
      { id: 'shafts', name: 'Shafts & Couplings', icon: '🔩' },
      { id: 'failure', name: 'Failure Theories', icon: '💥' },
      { id: 'design', name: 'Design Process', icon: '📐' }
    ]
  },
  mech_manufacturing: {
    title: 'Manufacturing',
    skills: [
      { id: 'casting', name: 'Casting', icon: '🏭' },
      { id: 'welding', name: 'Welding', icon: '🔧' },
      { id: 'machining', name: 'Machining', icon: '🛠️' },
      { id: 'automation', name: 'Automation', icon: '🤖' }
    ]
  },
  // ENTC
  entc_digital: {
    title: 'Digital Electronics',
    skills: [
      { id: 'logic_gates', name: 'Logic Gates', icon: '🔲' },
      { id: 'flip_flops', name: 'Flip-Flops', icon: '🔁' },
      { id: 'counters', name: 'Counters', icon: '🔢' },
      { id: 'memory', name: 'Memory Devices', icon: '💾' }
    ]
  },
  entc_analog: {
    title: 'Analog Circuits',
    skills: [
      { id: 'amplifiers', name: 'Amplifiers', icon: '📢' },
      { id: 'oscillators', name: 'Oscillators', icon: '🔊' },
      { id: 'filters', name: 'Filters', icon: '🎚️' },
      { id: 'opamps', name: 'Op-Amps', icon: '➕' }
    ]
  },
  entc_comm: {
    title: 'Communication Systems',
    skills: [
      { id: 'modulation', name: 'Modulation', icon: '📡' },
      { id: 'demodulation', name: 'Demodulation', icon: '📶' },
      { id: 'transmission', name: 'Transmission Lines', icon: '🛤️' },
      { id: 'antennas', name: 'Antennas', icon: '📡' }
    ]
  },
  entc_micro: {
    title: 'Microprocessors',
    skills: [
      { id: '8085', name: '8085/8086', icon: '💻' },
      { id: 'assembly', name: 'Assembly Language', icon: '⌨️' },
      { id: 'peripherals', name: 'Peripherals', icon: '🖥️' },
      { id: 'applications', name: 'Applications', icon: '📱' }
    ]
  },
  // Electrical
  elec_power: {
    title: 'Power Systems',
    skills: [
      { id: 'generation', name: 'Generation', icon: '⚡' },
      { id: 'transmission', name: 'Transmission', icon: '🔌' },
      { id: 'distribution', name: 'Distribution', icon: '🔋' },
      { id: 'protection', name: 'Protection', icon: '🛡️' }
    ]
  },
  elec_control: {
    title: 'Control Systems',
    skills: [
      { id: 'block', name: 'Block Diagrams', icon: '📊' },
      { id: 'feedback', name: 'Feedback', icon: '🔄' },
      { id: 'stability', name: 'Stability', icon: '⚖️' },
      { id: 'controllers', name: 'Controllers', icon: '🎛️' }
    ]
  },
  elec_machines: {
    title: 'Electrical Machines',
    skills: [
      { id: 'dc', name: 'DC Machines', icon: '🔋' },
      { id: 'ac', name: 'AC Machines', icon: '🔌' },
      { id: 'transformers', name: 'Transformers', icon: '🔄' },
      { id: 'motors', name: 'Motors', icon: '⚙️' }
    ]
  },
  elec_measure: {
    title: 'Measurements',
    skills: [
      { id: 'instruments', name: 'Instruments', icon: '🧰' },
      { id: 'errors', name: 'Errors', icon: '❌' },
      { id: 'bridges', name: 'Bridges', icon: '🌉' },
      { id: 'transducers', name: 'Transducers', icon: '🔌' }
    ]
  },
  // Civil
  civil_struct: {
    title: 'Structural Engineering',
    skills: [
      { id: 'beams', name: 'Beams', icon: '🪵' },
      { id: 'columns', name: 'Columns', icon: '🏛️' },
      { id: 'trusses', name: 'Trusses', icon: '🏗️' },
      { id: 'frames', name: 'Frames', icon: '🖼️' }
    ]
  },
  civil_geotech: {
    title: 'Geotechnical Engineering',
    skills: [
      { id: 'soil', name: 'Soil Mechanics', icon: '🌱' },
      { id: 'foundations', name: 'Foundations', icon: '🏠' },
      { id: 'retaining', name: 'Retaining Walls', icon: '🧱' },
      { id: 'earthquake', name: 'Earthquake Engg.', icon: '🌎' }
    ]
  },
  civil_transport: {
    title: 'Transportation',
    skills: [
      { id: 'roads', name: 'Roads', icon: '🛣️' },
      { id: 'railways', name: 'Railways', icon: '🚆' },
      { id: 'traffic', name: 'Traffic Engg.', icon: '🚦' },
      { id: 'airports', name: 'Airports', icon: '🛫' }
    ]
  },
  civil_survey: {
    title: 'Surveying',
    skills: [
      { id: 'chains', name: 'Chain Survey', icon: '⛓️' },
      { id: 'levels', name: 'Levelling', icon: '📏' },
      { id: 'theodolite', name: 'Theodolite', icon: '🎯' },
      { id: 'gps', name: 'GPS', icon: '📡' }
    ]
  }
};

const BRANCH_SUBJECTS = {
  'CS/IT': ['Software Development Engineer', 'Frontend Development', 'Backend Development', 'DevOps & Cloud', 'Database & Data'],
  'Mechanical': ['Thermodynamics', 'Fluid Mechanics', 'Machine Design', 'Manufacturing'],
  'ENTC': ['Digital Electronics', 'Analog Circuits', 'Communication Systems', 'Microprocessors'],
  'Electrical': ['Power Systems', 'Control Systems', 'Electrical Machines', 'Measurements'],
  'Civil': ['Structural Engineering', 'Geotechnical Engineering', 'Transportation', 'Surveying'],
};

const SkillsSelection = ({ interviewCode: propInterviewCode, onContinue, isMock = false, branch }) => {
  const navigate = useNavigate();
  const { interviewCode: paramInterviewCode } = useParams();
  const interviewCode = propInterviewCode || paramInterviewCode;
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const toggleSkill = (skill) => {
    console.log('Toggling skill:', skill); // Debug log
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

  // Filter categories based on branch
  let categoriesToShow = Object.entries(SKILL_CATEGORIES);
  if (branch && BRANCH_SUBJECTS[branch]) {
    categoriesToShow = categoriesToShow.filter(([cat, { title }]) => BRANCH_SUBJECTS[branch].includes(title));
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem 0' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
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
              <h1 style={{ color: '#1e293b', fontWeight: 900, fontSize: '2.1rem', marginBottom: 10, marginTop: 18, textAlign: 'center', zIndex: 2, position: 'relative', filter: 'none', opacity: 1, textShadow: 'none' }}>Select Your Subjects</h1>
              <p style={{ color: '#334155', fontWeight: 500, fontSize: '1.08rem', textAlign: 'center', marginBottom: 8, marginTop: 0, filter: 'none', opacity: 1, textShadow: 'none' }}>Choose at least 2 subjects for your technical interview</p>
              {branch && <div style={{ color: '#1e293b', fontWeight: 600, fontSize: '1.08rem', textAlign: 'center', marginBottom: 18, filter: 'none', opacity: 1, textShadow: 'none' }}>Branch: <strong>{branch}</strong></div>}
              {!branch && <div className="error-message">Please select a branch first.</div>}
              {error && <div className="error-message">{error}</div>}
              <div className="selection-info">
                <span className="selected-count">{selectedSkills.length}</span>
                <span>subjects selected</span>
              </div>
            </div>

            <div className="skills-container">
              {categoriesToShow.length === 0 && <div>No subjects available for this branch.</div>}
              {categoriesToShow.map(([category, { title, skills }]) => (
                <div key={category} className="skill-category">
                  <h2 className="category-title">{title}</h2>
                  <div className="skills-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.7rem', justifyContent: 'flex-start', marginBottom: '1.2rem', alignItems: 'center' }}>
                    {skills.map(({ id, name, icon }) => (
                      <button
                        key={id}
                        className={`skill-button ${selectedSkills.includes(name) ? 'selected' : ''}`}
                        onClick={() => {
                          toggleSkill(name);
                        }}
                        style={{ background: selectedSkills.includes(name) ? '#fff' : '#f1f5f9', border: selectedSkills.includes(name) ? '2px solid #3b82f6' : '2px solid #e5e7eb', color: '#1e293b', borderRadius: 10, fontWeight: 600, fontSize: '1rem', boxShadow: selectedSkills.includes(name) ? '0 2px 8px rgba(59,130,246,0.10)' : 'none', transition: 'all 0.2s', minHeight: 44, padding: '0.7rem 1.2rem', cursor: 'pointer' }}
                        onMouseEnter={(e) => {
                          if (selectedSkills.includes(name)) {
                            e.currentTarget.style.border = '2px solid #3b82f6';
                            e.currentTarget.style.background = '#f0f9ff';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedSkills.includes(name)) {
                            e.currentTarget.style.border = '2px solid #e5e7eb';
                            e.currentTarget.style.background = '#f1f5f9';
                          }
                        }}
                      >
                        <span className="skill-icon">{icon}</span> {name}
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
                disabled={selectedSkills.length < 2 || !branch}
                style={{ background: 'linear-gradient(90deg,#3b82f6,#10b981)', color: 'white', borderRadius: 10, fontWeight: 700, border: 'none', fontSize: '1.2rem', boxShadow: '0 2px 8px rgba(37,99,235,0.10)', padding: '1.1rem 2.5rem', marginTop: 24, marginBottom: 12 }}
              >
                {isLoading ? 'Starting Interview...' : 'Start Interview'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SkillsSelection; 