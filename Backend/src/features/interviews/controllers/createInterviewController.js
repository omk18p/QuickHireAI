const Interview = require('../models/Interview');

// Create new interview
const createInterview = async (req, res) => {
  try {
    const { title, description, skills, duration, companyId } = req.body;
    
    console.log('Creating interview with data:', { title, description, skills, duration, companyId });
    console.log('User from token:', req.user);
    
    const interview = new Interview({
      title,
      description,
      skills,
      duration,
      company: companyId || req.user._id,
      status: 'draft'
    });

    console.log('Interview object created:', interview);
    await interview.save();
    
    res.status(201).json({
      success: true,
      interview,
      message: 'Interview created successfully'
    });
  } catch (error) {
    console.error('Error creating interview:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to create interview',
      details: error.message
    });
  }
};

// Get all interviews for a company
const getCompanyInterviews = async (req, res) => {
  try {
    console.log('Fetching company interviews for user:', req.user._id);
    
    const interviews = await Interview.find({ company: req.user._id })
      .populate('candidates.candidate', 'name email')
      .sort({ createdAt: -1 });

    console.log('Found interviews:', interviews.length);

    res.json({
      success: true,
      interviews
    });
  } catch (error) {
    console.error('Error fetching company interviews:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch interviews',
      details: error.message
    });
  }
};

// Get interview details
const getInterview = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate('candidates.candidate', 'name email mobile')
      .populate('company', 'companyName name');

    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    res.json({
      success: true,
      interview
    });
  } catch (error) {
    console.error('Error fetching interview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch interview'
    });
  }
};

module.exports = {
  createInterview,
  getCompanyInterviews,
  getInterview
}; 