import React, { useState } from 'react';
import './TechQuestionTypes.css';

const TechQuestionTypes = ({ currentQuestion, onQuestionTypeChange }) => {
  const [selectedType, setSelectedType] = useState('concepts');

  const questionTypes = {
    'JavaScript': [
      { id: 'concepts', label: 'Core Concepts', icon: '🧠' },
      { id: 'practical', label: 'Practical Code', icon: '💻' },
      { id: 'advanced', label: 'Advanced Topics', icon: '🚀' }
    ],
    'React': [
      { id: 'concepts', label: 'Core Concepts', icon: '⚛️' },
      { id: 'hooks', label: 'Hooks & State', icon: '🎣' },
      { id: 'performance', label: 'Performance', icon: '⚡' }
    ],
    'Python': [
      { id: 'concepts', label: 'Core Concepts', icon: '🐍' },
      { id: 'practical', label: 'Practical Code', icon: '💻' },
      { id: 'advanced', label: 'Advanced Topics', icon: '🚀' }
    ],
    'SQL': [
      { id: 'queries', label: 'SQL Queries', icon: '🗄️' },
      { id: 'optimization', label: 'Optimization', icon: '⚡' },
      { id: 'design', label: 'Database Design', icon: '🏗️' }
    ],
    'Node.js': [
      { id: 'concepts', label: 'Core Concepts', icon: '🟢' },
      { id: 'async', label: 'Async/Await', icon: '⏱️' },
      { id: 'performance', label: 'Performance', icon: '⚡' }
    ]
  };

  const currentTopic = currentQuestion?.topic || 'JavaScript';
  const availableTypes = questionTypes[currentTopic] || questionTypes['JavaScript'];

  const handleTypeChange = (typeId) => {
    setSelectedType(typeId);
    onQuestionTypeChange(typeId);
  };

  return (
    <div className="tech-question-types">
      <div className="types-header">
        <h3>Question Type</h3>
        <span className="topic-label">{currentTopic}</span>
      </div>
      
      <div className="types-grid">
        {availableTypes.map((type) => (
          <button
            key={type.id}
            className={`type-button ${selectedType === type.id ? 'active' : ''}`}
            onClick={() => handleTypeChange(type.id)}
          >
            <span className="type-icon">{type.icon}</span>
            <span className="type-label">{type.label}</span>
          </button>
        ))}
      </div>
      
      <div className="type-description">
        {selectedType === 'concepts' && (
          <p>Test your understanding of fundamental concepts and principles.</p>
        )}
        {selectedType === 'practical' && (
          <p>Write actual code to solve problems and implement features.</p>
        )}
        {selectedType === 'advanced' && (
          <p>Explore complex topics and advanced implementation patterns.</p>
        )}
        {selectedType === 'hooks' && (
          <p>Focus on React hooks, state management, and lifecycle.</p>
        )}
        {selectedType === 'performance' && (
          <p>Optimization techniques and performance best practices.</p>
        )}
        {selectedType === 'queries' && (
          <p>Write SQL queries to retrieve and manipulate data.</p>
        )}
        {selectedType === 'optimization' && (
          <p>Database optimization, indexing, and query performance.</p>
        )}
        {selectedType === 'design' && (
          <p>Database schema design and architectural patterns.</p>
        )}
        {selectedType === 'async' && (
          <p>Asynchronous programming patterns and error handling.</p>
        )}
      </div>
    </div>
  );
};

export default TechQuestionTypes; 