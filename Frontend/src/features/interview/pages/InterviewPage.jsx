import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../shared/services/api';

const InterviewPage = () => {
  const [interviewCode, setInterviewCode] = useState('');
  const [candidateCode, setCandidateCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleJoin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Validate codes with backend
      const response = await api.post('/interviews/validate-code', {
        interviewCode: interviewCode.trim(),
        candidateCode: candidateCode.trim(),
      });
      if (response.data.success && response.data.interviewId && response.data.candidateCode) {
        // Store both codes in sessionStorage
        sessionStorage.setItem('interviewId', response.data.interviewId);
        sessionStorage.setItem('candidateCode', response.data.candidateCode);
        // Navigate to the interview session
        navigate(`/interview/session/${interviewCode.trim()}`);
      } else {
        setError(response.data.error || 'Invalid codes. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to join interview.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '4rem auto', background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(30,41,59,0.10)', padding: '2.5rem 2rem', textAlign: 'center' }}>
      <h2 style={{ fontWeight: 900, fontSize: '2.1rem', color: '#1e293b', marginBottom: '1.5rem' }}>Join Interview</h2>
      <form onSubmit={handleJoin}>
        <div style={{ marginBottom: 18 }}>
          <input
            type="text"
            placeholder="Interview Code"
            value={interviewCode}
            onChange={e => setInterviewCode(e.target.value)}
            style={{ width: '100%', padding: '0.8rem', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 16, marginBottom: 12 }}
            required
          />
          <input
            type="text"
            placeholder="Candidate Code"
            value={candidateCode}
            onChange={e => setCandidateCode(e.target.value)}
            style={{ width: '100%', padding: '0.8rem', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 16 }}
            required
          />
        </div>
        {error && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>}
        <button
          type="submit"
          style={{ background: '#2563eb', color: '#fff', fontWeight: 700, borderRadius: 8, padding: '0.7rem 1.5rem', fontSize: 17, border: 'none', cursor: 'pointer', boxShadow: '0 1px 4px #3b82f655', width: '100%' }}
          disabled={loading}
        >
          {loading ? 'Joining...' : 'Join Interview'}
        </button>
      </form>
    </div>
  );
};

export default InterviewPage; 