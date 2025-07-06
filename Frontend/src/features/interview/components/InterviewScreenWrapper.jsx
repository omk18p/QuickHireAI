import { useParams, useLocation } from 'react-router-dom';
import InterviewScreen from './InterviewScreen';

const InterviewScreenWrapper = () => {
  const { mockCode } = useParams();
  const location = useLocation();
  const selectedSkills = location.state?.selectedSkills || [];

  return (
    <InterviewScreen
      interviewCode={mockCode}
      selectedSkills={selectedSkills}
      isMock={true}
    />
  );
};

export default InterviewScreenWrapper; 