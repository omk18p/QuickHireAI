import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import InterviewGuidelines from '../components/InterviewGuidelines';
import SkillsSelection from '../components/SkillsSelection';
import InterviewScreen from '../components/InterviewScreen';

const MockInterviewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Generate a proper mock code - use from state if provided, otherwise generate new one
  const [mockCode] = useState(() => {
    const stateCode = location.state?.mockCode;
    if (stateCode && stateCode !== 'undefined' && stateCode.trim()) {
      // Ensure the mock code starts with 'mock-'
      const code = stateCode.trim();
      return code.startsWith('mock-') ? code : `mock-${code}`;
    }
    return `mock-${Math.random().toString(36).substring(2, 8)}`;
  });
  
  const [step, setStep] = useState('guidelines'); // Start at guidelines
  const [selectedSkills, setSelectedSkills] = useState([]);

  // Clear any previous session/localStorage data on mount
  useEffect(() => {
    sessionStorage.removeItem('selectedSkills');
    sessionStorage.removeItem('interviewData');
    localStorage.removeItem('interviewDetails');
    localStorage.removeItem('interviewToken');
    
    // Log the mock code for debugging
    console.log('MockInterviewPage initialized with code:', mockCode);
  }, [mockCode]);

  // Step 1: Show guidelines
  if (step === 'guidelines') {
    return (
      <InterviewGuidelines
        interviewCode={mockCode}
        onContinue={() => setStep('skills')}
        isMock={true}
      />
    );
  }

  // Step 2: Skill selection
  if (step === 'skills') {
    return (
      <SkillsSelection
        interviewCode={mockCode}
        onContinue={async (skills) => {
          setSelectedSkills(skills);
          console.log('Starting mock interview with skills:', skills, 'and code:', mockCode);
          
          // Start the interview session on the backend
          try {
            const response = await import('../../../shared/services/api').then(m => m.api.post('/interviews/start', {
              interviewCode: mockCode,
              skills
            }));
            
            console.log('Backend response:', response.data);
            
            if (response.data.success) {
              // Navigate to the mock interview session route
              navigate(`/interview/mock/session/${mockCode}`, { 
                state: { 
                  selectedSkills: skills,
                  mockCode: mockCode 
                } 
              });
            } else {
              alert(response.data.error || 'Failed to start interview');
            }
          } catch (error) {
            console.error('Error starting mock interview:', error);
            alert(error.response?.data?.details || error.message || 'Failed to start interview. Please try again later.');
          }
        }}
        isMock={true}
      />
    );
  }

  // Step 3: Start interview session (fallback)
  if (step === 'interview') {
    return (
      <InterviewScreen
        interviewCode={mockCode}
        selectedSkills={selectedSkills}
        isMock={true}
      />
    );
  }

  return null;
};

export default MockInterviewPage; 