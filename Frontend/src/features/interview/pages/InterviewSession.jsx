import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import '../styles/InterviewSession.css';
import { api } from '../../../shared/services/api';
import InterviewScreen from '../components/InterviewScreen';

const InterviewSession = (props) => {
  const location = useLocation();
  const { interviewCode } = useParams();
  const [interviewData, setInterviewData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const interviewId = props.interviewId || location.state?.interviewId || sessionStorage.getItem('interviewId');
  const candidateCode = props.candidateCode || location.state?.candidateCode || sessionStorage.getItem('candidateCode');

  useEffect(() => {
    const loadSession = async () => {
      try {
        // Try to get interview details from localStorage (company-driven flow)
        const storedDetails = localStorage.getItem('interviewDetails');
        if (storedDetails) {
          setInterviewData(JSON.parse(storedDetails));
          setIsLoading(false);
          return;
        }
        // Fallback: If no details, show error
        throw new Error('Missing interview session details. Please start from the dashboard.');
      } catch (error) {
        setError(error.message || 'Failed to load interview session');
        setIsLoading(false);
      }
    };
    loadSession();
  }, [interviewCode]);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <h2>Loading Interview Session...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!interviewData) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>Missing required interview data</p>
      </div>
    );
  }

  // Render the actual interview interface
  return (
    <InterviewScreen
      {...props}
      interviewId={interviewId}
      candidateCode={candidateCode}
      interviewData={interviewData}
      interviewCode={interviewCode}
    />
  );
};

export default InterviewSession; 