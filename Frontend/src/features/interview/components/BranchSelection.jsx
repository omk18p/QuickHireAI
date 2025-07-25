import React, { useState } from 'react';

const BRANCHES = [
  'CS/IT',
  'Mechanical',
  'ENTC',
  'Electrical',
  'Civil'
];

const BranchSelection = ({ onContinue }) => {
  const [selectedBranch, setSelectedBranch] = useState('');

  return (
    <div style={{ maxWidth: 420, margin: '3rem auto', background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(30,41,59,0.10)', padding: '2.5rem 2rem', textAlign: 'center' }}>
      <h2 style={{ fontWeight: 900, fontSize: '2rem', color: '#1e293b', marginBottom: '2rem' }}>Select Your Branch</h2>
      <form style={{ display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'flex-start', marginBottom: 32 }}>
        {BRANCHES.map(branch => (
          <label key={branch} style={{ fontSize: '1.15rem', color: '#334155', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="radio"
              name="branch"
              value={branch}
              checked={selectedBranch === branch}
              onChange={() => setSelectedBranch(branch)}
              style={{ marginRight: 10 }}
            />
            {branch}
          </label>
        ))}
      </form>
      <button
        style={{ padding: '0.8rem 2.2rem', borderRadius: 10, background: '#2563eb', color: 'white', fontWeight: 700, border: 'none', fontSize: '1.1rem', boxShadow: '0 2px 8px rgba(37,99,235,0.10)', marginTop: 10, cursor: selectedBranch ? 'pointer' : 'not-allowed', opacity: selectedBranch ? 1 : 0.6 }}
        disabled={!selectedBranch}
        onClick={() => onContinue(selectedBranch)}
      >
        Continue
      </button>
    </div>
  );
};

export default BranchSelection; 