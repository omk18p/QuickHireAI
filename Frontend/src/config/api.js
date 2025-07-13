// API Configuration
// Update these URLs based on your deployment

export const API_CONFIG = {
  // Your actual Render backend URL
  RENDER_BACKEND_URL: 'https://quickhireai.onrender.com',
  LOCAL_BACKEND_URL: 'http://localhost:5001',
  
  // Your Vercel frontend URL
  VERCEL_FRONTEND_URL: 'https://quick-hire-ai.vercel.app'
};

// Helper function to get the correct API base URL
export const getApiBaseUrl = () => {
  // Check if we're on Vercel (production)
  if (window.location.hostname === 'quick-hire-ai.vercel.app') {
    return `${API_CONFIG.RENDER_BACKEND_URL}/api`;
  }
  
  // Local development
  return `${API_CONFIG.LOCAL_BACKEND_URL}/api`;
};

// Debug function to log current configuration
export const logApiConfig = () => {
  console.log('🌐 API Configuration:', {
    currentHostname: window.location.hostname,
    isProduction: window.location.hostname === 'quick-hire-ai.vercel.app',
    apiBaseUrl: getApiBaseUrl(),
    renderBackendUrl: API_CONFIG.RENDER_BACKEND_URL
  });
}; 