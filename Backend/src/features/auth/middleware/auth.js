const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, error: 'Invalid token' });
  }
};

const authorizeCompany = (req, res, next) => {
  if (req.user.userType !== 'company') {
    return res.status(403).json({ success: false, error: 'Company access required' });
  }
  next();
};

const authorizeCandidate = (req, res, next) => {
  if (req.user.userType !== 'candidate') {
    return res.status(403).json({ success: false, error: 'Candidate access required' });
  }
  next();
};

module.exports = {
  generateToken,
  verifyToken,
  authenticateToken,
  authorizeCompany,
  authorizeCandidate
}; 