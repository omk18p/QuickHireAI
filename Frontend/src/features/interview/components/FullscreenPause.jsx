import React, { useState, useEffect } from 'react';
import '../styles/FullscreenPause.css';

const FullscreenPause = ({ onFullscreenResumed, currentQuestion, questionIndex, totalQuestions }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [pauseTime, setPauseTime] = useState(0);

  // Track pause time
  useEffect(() => {
    const interval = setInterval(() => {
      setPauseTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Reset pause time when fullscreen is resumed
  useEffect(() => {
    if (isFullscreen) {
      setPauseTime(0);
    }
  }, [isFullscreen]);

  // Warn about tab switching during pause
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isFullscreen) {
        console.log('User switched tabs while interview is paused');
        // You could add additional logging or warnings here
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isFullscreen]);

  useEffect(() => {
    // Listen for fullscreen changes
    const handleFullscreenChange = () => {
      const fullscreenElement = document.fullscreenElement || 
                               document.webkitFullscreenElement || 
                               document.mozFullScreenElement || 
                               document.msFullscreenElement;
      
      setIsFullscreen(!!fullscreenElement);
      
      if (fullscreenElement) {
        // Fullscreen re-entered successfully
        console.log('FullscreenPause: Fullscreen detected, calling onFullscreenResumed');
        setTimeout(() => {
          console.log('FullscreenPause: Calling onFullscreenResumed after delay');
          onFullscreenResumed();
        }, 500);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [onFullscreenResumed]);

  const requestFullscreen = async () => {
    try {
      setShowInstructions(false);
      
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        await document.documentElement.webkitRequestFullscreen();
      } else if (document.documentElement.mozRequestFullScreen) {
        await document.documentElement.mozRequestFullScreen();
      } else if (document.documentElement.msRequestFullscreen) {
        await document.documentElement.msRequestFullscreen();
      }
    } catch (error) {
      console.error('Error entering fullscreen:', error);
      setShowInstructions(true);
    }
  };

  return (
    <div className="fullscreen-pause-overlay">
      <div className="fullscreen-pause-content">
        <div className="pause-icon">⏸️</div>
        <h2>Interview Paused</h2>
        <p><strong>Fullscreen mode is REQUIRED</strong> to continue your interview.</p>
        <div className="mandatory-notice">
          <span className="warning-icon">⚠️</span>
          <span>You must enter fullscreen mode to proceed with the interview.</span>
        </div>
        
        {/* Current Question Info */}
        {currentQuestion && (
          <div className="current-question-info">
            <div className="question-progress">
              <span className="progress-text">Question {questionIndex + 1} of {totalQuestions}</span>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${((questionIndex + 1) / totalQuestions) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="question-preview">
              <h4>Current Question:</h4>
              <p>{currentQuestion.question || currentQuestion.text}</p>
            </div>
          </div>
        )}
        
        {showInstructions && (
          <div className="pause-instructions">
            <h3>Why Fullscreen is MANDATORY?</h3>
            <ul>
              <li>🔒 <strong>REQUIRED</strong> for interview security</li>
              <li>🎯 <strong>MANDATORY</strong> to maintain focus</li>
              <li>📱 <strong>ESSENTIAL</strong> for optimal experience</li>
              <li>⚡ <strong>NECESSARY</strong> to prevent distractions</li>
            </ul>
            <div className="strict-notice">
              <span>⚠️</span>
              <span><strong>You cannot continue without entering fullscreen mode.</strong></span>
            </div>
          </div>
        )}
        
        <div className="pause-actions">
          <button 
            className="resume-fullscreen-button"
            onClick={requestFullscreen}
            disabled={isFullscreen}
          >
            {isFullscreen ? 'Returning to Interview...' : 'ENTER FULLSCREEN TO CONTINUE'}
          </button>
          
          {/* Manual resume button as fallback */}
          <button 
            className="manual-resume-button"
            onClick={onFullscreenResumed}
            style={{
              marginTop: '0.75rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            Resume Interview Manually
          </button>
        </div>
        
        <div className="pause-status">
          {isFullscreen ? (
            <div className="status-resuming">
              <span className="status-icon">🔄</span>
              <span>Resuming interview...</span>
            </div>
          ) : (
            <div className="status-paused">
              <span className="status-icon">⏸️</span>
              <span><strong>Interview BLOCKED</strong> - Fullscreen required</span>
              {pauseTime > 0 && (
                <div className="pause-time">
                  Blocked for {Math.floor(pauseTime / 60)}:{(pauseTime % 60).toString().padStart(2, '0')}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="pause-tips">
          <h4>How to Continue:</h4>
          <ul>
            <li><strong>Press <kbd>F11</kbd> to enter fullscreen</strong></li>
            <li><strong>Or click the "ENTER FULLSCREEN" button above</strong></li>
            <li>Ensure your microphone and camera are still working</li>
            <li>Close other applications to avoid distractions</li>
          </ul>
          <div className="final-warning">
            <span>🚫</span>
            <span><strong>No other way to continue the interview!</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullscreenPause; 