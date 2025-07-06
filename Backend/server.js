// Load environment variables first, before any other imports
const path = require('path');
const fs = require('fs');
const connectDB = require('./src/config/db');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Use the same approach that worked in your scripts
try {
  const envPath = path.join(__dirname, '.env');
  console.log('Loading .env from:', envPath);
  
  // Read and parse .env file directly
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  for (const line of lines) {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  }

  // Verify the API key was loaded
  if (process.env.GEMINI_API_KEY) {
    console.log('GEMINI_API_KEY loaded successfully');
    console.log('Key starts with:', process.env.GEMINI_API_KEY.substring(0, 8));
  } else {
    throw new Error('GEMINI_API_KEY not found in .env file');
  }

} catch (error) {
  console.error('Error loading .env file:', error);
  process.exit(1); // Exit if we can't load the API key
}

// Now load other modules
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const interviewRoutes = require('./src/features/interviews/routes/interviewRoutes');
const userRoutes = require('./src/features/users/routes/userRoutes');

// Connect to MongoDB
connectDB();

// Add detailed debugging
console.log('Final Environment Check:', {
  GEMINI_API_KEY_EXISTS: !!process.env.GEMINI_API_KEY,
  GEMINI_API_KEY_VALUE: process.env.GEMINI_API_KEY,
  NODE_ENV: process.env.NODE_ENV,
  PWD: process.cwd()
});

const app = express();
const preferredPort = 5001;
let port = preferredPort;

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5001'],
  credentials: true
}));
app.use(express.json());
app.use(express.static('public'));
app.use('/downloads', express.static(path.join(__dirname, '../downloads')));

// Apply multer middleware to specific routes
app.use('/api/interviews/answer', upload.single('audioBlob'));
app.use('/api/interviews/submit-all', upload.array('answer', 10));

// --- Security Middleware ---
app.use(helmet());
// Rate limiting: 100 requests per 15 minutes per IP for auth and interview endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' }
});
app.use('/api/auth', apiLimiter);
app.use('/api/interviews', apiLimiter);

// Routes
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running!',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', userRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/users', userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  
  // Handle specific error types
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ 
      success: false,
      error: 'File Upload Error',
      message: err.message 
    });
  }
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: err.message,
      details: err.errors
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID',
      message: 'The provided ID is invalid'
    });
  }
  
  if (err.message.includes('Gemini')) {
    return res.status(500).json({ 
      success: false,
      error: 'AI Service Error',
      message: 'Error processing with Gemini API'
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid Token',
      message: 'Please login again'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token Expired',
      message: 'Please login again'
    });
  }
  
  // Default error response
  res.status(500).json({ 
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
});

// Function to start server with fallback ports
const startServer = (portToTry) => {
  app.listen(portToTry, () => {
    console.log(`Server running on http://localhost:${portToTry}`);
    port = portToTry; // Update the port variable
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${portToTry} is busy, trying ${portToTry + 1}...`);
      startServer(portToTry + 1);
    } else {
      console.error('Server error:', err);
    }
  });
};

// Start the server with the preferred port
startServer(preferredPort);
