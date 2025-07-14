import React, { useState, useEffect, useRef } from 'react';
import '../styles/FullscreenPause.css';

const FullscreenPause = ({ onFullscreenResumed, currentQuestion, questionIndex, totalQuestions }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [pauseTime, setPauseTime] = useState(0);
  // --- State initialization ---
  const getStoredCount = (key) => {
    const stored = sessionStorage.getItem(key);
    return stored !== null ? parseInt(stored) : 0;
  };
  const [suspiciousActivityCount, setSuspiciousActivityCount] = useState(() => getStoredCount('pauseSuspiciousActivityCount'));
  const [appSwitchCount, setAppSwitchCount] = useState(() => getStoredCount('pauseAppSwitchCount'));

  // Add suspicious activity logs state and helper
  const getStoredLogs = () => {
    try {
      const raw = sessionStorage.getItem('suspiciousActivityLogs');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };
  const [suspiciousActivityLogs, setSuspiciousActivityLogs] = useState(getStoredLogs());
  const addSuspiciousLog = (message) => {
    const log = { time: new Date().toLocaleString(), message };
    setSuspiciousActivityLogs(prev => {
      const updated = [...prev, log];
      sessionStorage.setItem('suspiciousActivityLogs', JSON.stringify(updated));
      return updated;
    });
  };

  const recentlyIncrementedRef = useRef(false);
  const incrementCountsOnce = (logMessage) => {
    if (!recentlyIncrementedRef.current) {
      setSuspiciousActivityCount(prev => {
        const newValue = prev + 1;
        sessionStorage.setItem('pauseSuspiciousActivityCount', newValue.toString());
        return newValue;
      });
      setAppSwitchCount(prev => {
        const newValue = prev + 1;
        sessionStorage.setItem('pauseAppSwitchCount', newValue.toString());
        return newValue;
      });
      if (logMessage) addSuspiciousLog(logMessage);
      recentlyIncrementedRef.current = true;
      setTimeout(() => { recentlyIncrementedRef.current = false; }, 500);
    }
  };

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
      // Don't reset the counters when fullscreen is resumed
      // Keep the accumulated values - this prevents reset on minimize/restore
    }
  }, [isFullscreen]);

  // Always sync suspicious/app switch counts to sessionStorage
  useEffect(() => {
      sessionStorage.setItem('pauseSuspiciousActivityCount', suspiciousActivityCount.toString());
  }, [suspiciousActivityCount]);
  useEffect(() => {
      sessionStorage.setItem('pauseAppSwitchCount', appSwitchCount.toString());
  }, [appSwitchCount]);

  // On mount and on resume, always re-sync counts from sessionStorage
  useEffect(() => {
    setSuspiciousActivityCount(getStoredCount('pauseSuspiciousActivityCount'));
    setAppSwitchCount(getStoredCount('pauseAppSwitchCount'));
  }, []);

  // Enhanced application switching detection without intrusive monitoring
  useEffect(() => {
    
    let lastActiveTime = Date.now();
    let isCurrentlyActive = true;
    let mouseMovementCount = 0;
    let keyboardActivityCount = 0;
    let suspiciousActivityDetected = false;
    let lastActivityCheck = Date.now();
    let consecutiveSuspiciousChecks = 0;

    // Track all types of user activity
    const updateActivity = () => {
      lastActiveTime = Date.now();
      lastActivityCheck = Date.now();
    };

    const handleVisibilityChange = () => {
      if (document.hidden && !isFullscreen) {
        console.log('🚨 SUSPICIOUS: User switched tabs or applications while interview is paused');
        isCurrentlyActive = false;
        suspiciousActivityDetected = true;
        consecutiveSuspiciousChecks++;
        incrementCountsOnce('Tab switch detected via visibilitychange (document.hidden) [pause screen]');
      } else if (!document.hidden) {
        isCurrentlyActive = true;
        updateActivity();
      }
    };

    const handleFocusChange = () => {
      if (!document.hasFocus() && !isFullscreen) {
        console.log('🚨 SUSPICIOUS: User switched to another application while interview is paused');
        isCurrentlyActive = false;
        suspiciousActivityDetected = true;
        consecutiveSuspiciousChecks++;
        incrementCountsOnce('App switch detected via focus change (window lost focus) [pause screen]');
      } else if (document.hasFocus()) {
        isCurrentlyActive = true;
        updateActivity();
      }
    };

    const handleBlur = () => {
      if (!isFullscreen) {
        console.log('🚨 SUSPICIOUS: Window lost focus - user may have switched applications');
        isCurrentlyActive = false;
        suspiciousActivityDetected = true;
        consecutiveSuspiciousChecks++;
        incrementCountsOnce('App switch detected via blur event [pause screen]');
      }
    };

    const handleFocus = () => {
      isCurrentlyActive = true;
      updateActivity();
    };

    // Enhanced mouse tracking with pixel-level detection
    const handleMouseMove = (event) => {
      const currentPosition = { x: event.clientX, y: event.clientY };
      
      // Check if mouse movement is within the browser window bounds
      const isWithinBounds = currentPosition.x >= 0 && 
                           currentPosition.x <= window.innerWidth &&
                           currentPosition.y >= 0 && 
                           currentPosition.y <= window.innerHeight;

      if (isCurrentlyActive && isWithinBounds) {
        updateActivity();
        mouseMovementCount++;
      }
    };

    // Ultra-aggressive keyboard monitoring
    const handleKeyPress = (event) => {
      if (isCurrentlyActive) {
        updateActivity();
        keyboardActivityCount++;
        
        // Detect suspicious keyboard patterns (like typing in WhatsApp)
        if (keyboardActivityCount > 5 && Date.now() - lastActiveTime < 3000) {
          console.log('🚨 SUSPICIOUS: High keyboard activity detected - possible messaging app');
          suspiciousActivityDetected = true;
          consecutiveSuspiciousChecks++;
          incrementCountsOnce();
        }
        
        // Detect rapid typing patterns
        if (keyboardActivityCount > 20) {
          console.log('🚨 SUSPICIOUS: Excessive keyboard activity - possible external app');
          suspiciousActivityDetected = true;
          consecutiveSuspiciousChecks++;
          incrementCountsOnce();
        }
      }
    };

    // Monitor clipboard changes
    const handleClipboardChange = () => {
      if (!isFullscreen) {
        console.log('🚨 SUSPICIOUS: Clipboard changed - possible app switching');
        suspiciousActivityDetected = true;
        consecutiveSuspiciousChecks++;
        incrementCountsOnce('Clipboard change detected (possible app switch) [pause screen]');
      }
    };

    // Detect rapid window state changes
    let windowStateChanges = 0;
    const handleWindowStateChange = () => {
      if (!isFullscreen) {
        windowStateChanges++;
        if (windowStateChanges > 2) {
          console.log('🚨 SUSPICIOUS: Multiple window state changes detected');
          suspiciousActivityDetected = true;
          consecutiveSuspiciousChecks++;
          incrementCountsOnce('Window state change detected (possible app switch) [pause screen]');
        }
      }
    };

    // Overlay detection - less aggressive
    const checkForOverlayApplications = () => {
      const timeSinceLastActivity = Date.now() - lastActiveTime;
      
      // Only detect if multiple indicators are present for a longer period
      const indicators = [];
      
      if (timeSinceLastActivity > 4000) indicators.push('inactivity');
      if (mouseMovementCount < 1 && timeSinceLastActivity > 3000) indicators.push('no_mouse_activity');
      if (keyboardActivityCount < 1 && timeSinceLastActivity > 3000) indicators.push('no_keyboard_activity');
      if (document.hasFocus() && !document.hidden && timeSinceLastActivity > 5000) indicators.push('focused_but_inactive');
      
      if (indicators.length >= 3 && !document.hasFocus()) {
        console.log('🚨 SUSPICIOUS: Multiple indicators suggest overlay application:', indicators);
        suspiciousActivityDetected = true;
        consecutiveSuspiciousChecks++;
        incrementCountsOnce();
      }
      
      // Reset counters if user is active
      if (timeSinceLastActivity < 2000) {
        consecutiveSuspiciousChecks = 0;
        windowStateChanges = 0;
      }
    };

    // Activity checking - less aggressive to prevent false positives
    const checkActivity = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActiveTime;
      
      // Only detect if user is actually inactive for a longer period
      if (timeSinceLastActivity > 5000 && !isFullscreen && !document.hasFocus()) {
        console.log('🚨 SUSPICIOUS: User appears inactive - possible overlay application');
        suspiciousActivityDetected = true;
        consecutiveSuspiciousChecks++;
        incrementCountsOnce();
      }
      
      // Check for overlay applications less frequently
      checkForOverlayApplications();
      
      // Reset activity counters periodically
      if (timeSinceLastActivity > 8000) {
        mouseMovementCount = 0;
        keyboardActivityCount = 0;
      }
      
      // Log suspicious activity levels
      if (consecutiveSuspiciousChecks > 1) {
        console.log(`🚨 HIGH SUSPICION LEVEL: ${consecutiveSuspiciousChecks} consecutive suspicious checks`);
      }
    }, 2000); // Check every 2 seconds instead of 1

    // Monitor for window resize events
    const handleResize = () => {
      if (!isFullscreen) {
        console.log('🚨 SUSPICIOUS: Window resized - possible overlay application');
        suspiciousActivityDetected = true;
        consecutiveSuspiciousChecks++;
        incrementCountsOnce();
      }
    };

    // Monitor for selection changes
    const handleSelectionChange = () => {
      if (!isFullscreen) {
        console.log('🚨 SUSPICIOUS: Text selection changed - possible app switching');
        suspiciousActivityDetected = true;
        consecutiveSuspiciousChecks++;
        incrementCountsOnce('Selection change detected (possible app switch) [pause screen]');
      }
    };

    // Monitor for context menu (common when switching apps)
    const handleContextMenu = () => {
      if (!isFullscreen) {
        console.log('🚨 SUSPICIOUS: Context menu opened - possible app switching');
        suspiciousActivityDetected = true;
        consecutiveSuspiciousChecks++;
        incrementCountsOnce('Context menu opened (possible app switch) [pause screen]');
      }
    };

    // Add all event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('focus', handleFocus);
    document.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('resize', handleResize);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleKeyPress);
    document.addEventListener('keyup', handleKeyPress);
    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('contextmenu', handleContextMenu);
    
    // Try to monitor clipboard
    try {
      navigator.clipboard.addEventListener('clipboardchange', handleClipboardChange);
    } catch (e) {
      console.log('Clipboard monitoring not available');
    }
    
    // Sync with sessionStorage to ensure consistency with InterviewScreen
    const syncInterval = setInterval(() => {
      const storedSuspicious = sessionStorage.getItem('pauseSuspiciousActivityCount');
      const storedAppSwitch = sessionStorage.getItem('pauseAppSwitchCount');
      
      if (storedSuspicious) {
        const currentValue = parseInt(storedSuspicious);
        if (currentValue !== suspiciousActivityCount) {
          console.log('Pause: Syncing suspicious activity count:', suspiciousActivityCount, '->', currentValue);
          setSuspiciousActivityCount(currentValue);
        }
      }
      
      if (storedAppSwitch) {
        const currentValue = parseInt(storedAppSwitch);
        if (currentValue !== appSwitchCount) {
          console.log('Pause: Syncing app switch count:', appSwitchCount, '->', currentValue);
          setAppSwitchCount(currentValue);
        }
      }
    }, 500);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('focus', handleFocus);
      document.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyPress);
      document.removeEventListener('keyup', handleKeyPress);
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      
      try {
        navigator.clipboard.removeEventListener('clipboardchange', handleClipboardChange);
      } catch (e) {
        // Ignore cleanup errors
      }
      
      clearInterval(checkActivity);
      clearInterval(syncInterval);
    };
  }, [isFullscreen, suspiciousActivityCount, appSwitchCount]);

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
              
              {/* Suspicious Activity Counters */}
              {(suspiciousActivityCount > 0 || appSwitchCount > 0) && (
                <div className="suspicious-activity-counters">
                  <div className="counter-item">
                    <span className="counter-icon">🚨</span>
                    <span className="counter-label">Suspicious Activities:</span>
                    <span className="counter-value">{suspiciousActivityCount}</span>
                  </div>
                  <div className="counter-item">
                    <span className="counter-icon">📱</span>
                    <span className="counter-label">App Switches:</span>
                    <span className="counter-value">{appSwitchCount}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Monitoring Activity Area */}
        <div className="monitoring-activity-area">
          <h4 className="monitoring-title">
            <span className="monitoring-icon">🔍</span>
            Security Monitoring Active
          </h4>
          <div className="monitoring-counters">
            <div className="monitoring-counter">
              <div className="counter-header">
                <span className="counter-icon">🚨</span>
                <span className="counter-title">Suspicious Activities</span>
              </div>
              <div className="counter-display">
                <span className="counter-number">{suspiciousActivityCount}</span>
                <span className="counter-unit">detected</span>
              </div>
            </div>
            <div className="monitoring-counter">
              <div className="counter-header">
                <span className="counter-icon">📱</span>
                <span className="counter-title">App Switches</span>
              </div>
              <div className="counter-display">
                <span className="counter-number">{appSwitchCount}</span>
                <span className="counter-unit">attempted</span>
              </div>
            </div>
          </div>
          <div className="monitoring-status">
            <span className="status-indicator">
              {suspiciousActivityCount > 0 || appSwitchCount > 0 ? '⚠️' : '✅'}
            </span>
            <span className="status-text">
              {suspiciousActivityCount > 0 || appSwitchCount > 0 
                ? 'Security violations detected' 
                : 'No suspicious activity detected'}
            </span>
          </div>
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