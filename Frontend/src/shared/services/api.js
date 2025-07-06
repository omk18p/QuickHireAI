import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5001/api', // Updated to match backend port
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000, // 10 second timeout
  retry: 3, // Number of retries
  retryDelay: 1000 // Delay between retries in milliseconds
});

// Add request interceptor for token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // Handle network errors
    if (!error.response) {
      console.error('Network Error:', error);
      if (originalRequest.retry < originalRequest.retry) {
        originalRequest.retry += 1;
        await new Promise(resolve => setTimeout(resolve, originalRequest.retryDelay));
        return api(originalRequest);
      }
      throw new Error('Unable to connect to server. Please check your internet connection.');
    }

    // Handle specific error codes
    switch (error.response.status) {
      case 401:
        // Handle unauthorized access
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      
      case 404:
        throw new Error('Resource not found. Please check the URL.');
      
      case 500:
        throw new Error('Server error. Please try again later.');
      
      default:
        throw new Error(error.response.data.error || 'An unexpected error occurred');
    }
  }
);

export { api }; 