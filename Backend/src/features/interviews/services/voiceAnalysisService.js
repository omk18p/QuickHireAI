const analyze = async (transcript) => {
  // Mock implementation for now
  return {
    confidenceScore: Math.random() * 100,
    clarityScore: Math.random() * 100,
    stressLevel: Math.random() * 100
  };
};

module.exports = {
  analyze
}; 