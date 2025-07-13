import React, { useState, useEffect } from 'react';
import './FullscreenGate.css';

const FullscreenGate = ({ onFullscreenEntered }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [showInstructions, setShowInstructions] = useState(true);

  useEffect(() => {
    // Check if fullscreen is supported
    if (!document.fullscreenEnabled && 
        !document.webkitFullscreenEnabled && 
        !document.mozFullScreenEnabled && 
        !document.msFullscreenEnabled) {
      setIsSupported(false);
    }

    // Listen for fullscreen changes
    const handleFullscreenChange = () => {
      const fullscreenElement = document.fullscreenElement || 
                               document.webkitFullscreenElement || 
                               document.mozFullScreenElement || 
                               document.msFullscreenElement;
      
      setIsFullscreen(!!fullscreenElement);
      
      if (fullscreenElement) {
        // Fullscreen entered successfully
        setTimeout(() => {
          onFullscreenEntered();
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
  }, [onFullscreenEntered]);

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

  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  };

  if (!isSupported) {
    return (
      <div className="fullscreen-gate">
        <div className="fullscreen-content">
          <div className="fullscreen-icon">⚠️</div>
          <h2>Fullscreen Not Supported</h2>
          <p>Your browser doesn't support fullscreen mode. For the best interview experience, please use a modern browser.</p>
          <button 
            className="continue-button"
            onClick={onFullscreenEntered}
          >
            Continue Anyway
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fullscreen-gate">
      <div className="fullscreen-content">
        <div className="fullscreen-icon">🖥️</div>
        <h2>Interview Fullscreen Required</h2>
        <p>To ensure a secure and focused interview experience, please enter fullscreen mode.</p>
        
        {showInstructions && (
          <div className="instructions">
            <h3>Why Fullscreen?</h3>
            <ul>
              <li>🔒 Prevents accidental tab switching</li>
              <li>🎯 Maintains focus during the interview</li>
              <li>📱 Ensures optimal viewing experience</li>
              <li>⚡ Reduces distractions</li>
            </ul>
          </div>
        )}
        
        <div className="fullscreen-actions">
          <button 
            className="fullscreen-button"
            onClick={requestFullscreen}
            disabled={isFullscreen}
          >
            {isFullscreen ? 'Fullscreen Active' : 'Enter Fullscreen'}
          </button>
          
          {isFullscreen && (
            <button 
              className="exit-fullscreen-button"
              onClick={exitFullscreen}
            >
              Exit Fullscreen
            </button>
          )}
        </div>
        
        <div className="fullscreen-status">
          {isFullscreen ? (
            <div className="status-success">
              <span className="status-icon">✅</span>
              <span>Fullscreen mode active</span>
            </div>
          ) : (
            <div className="status-waiting">
              <span className="status-icon">⏳</span>
              <span>Waiting for fullscreen...</span>
            </div>
          )}
        </div>
        
        <div className="fullscreen-tips">
          <h4>Quick Tips:</h4>
          <ul>
            <li>Press <kbd>F11</kbd> or <kbd>Esc</kbd> to exit fullscreen</li>
            <li>Ensure your microphone and camera are working</li>
            <li>Close other applications to avoid distractions</li>
            <li>Have a stable internet connection</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FullscreenGate; 