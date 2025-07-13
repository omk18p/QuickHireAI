const path = require('path');
const fs = require('fs');

console.log('🧪 Testing Environment Variable Loading...\n');

// Test the same logic as server.js
const loadEnvironmentVariables = () => {
  const envPath = path.join(__dirname, '.env');
  console.log('📁 Checking for .env file at:', envPath);
  
  if (fs.existsSync(envPath)) {
    console.log('✅ Found .env file, loading local environment variables');
    try {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n');
      
      for (const line of lines) {
        if (line.trim() && !line.startsWith('#')) {
          const [key, ...valueParts] = line.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').trim();
            process.env[key.trim()] = value;
          }
        }
      }
      console.log('✅ Successfully loaded local .env file');
    } catch (error) {
      console.warn('⚠️ Error reading .env file:', error.message);
    }
  } else {
    console.log('⚠️ .env file not found. Assuming environment variables are set by hosting platform');
  }

  // Verify critical environment variables
  const requiredEnvVars = ['GEMINI_API_KEY', 'MONGODB_URI', 'JWT_SECRET'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  console.log('\n📊 Environment Variable Status:');
  console.log('================================');
  
  requiredEnvVars.forEach(varName => {
    const exists = !!process.env[varName];
    const status = exists ? '✅' : '❌';
    const value = exists ? 
      (varName.includes('KEY') || varName.includes('SECRET') ? 
        process.env[varName].substring(0, 8) + '...' : 
        process.env[varName]) : 
      'NOT_SET';
    console.log(`${status} ${varName}: ${value}`);
  });
  
  if (missingVars.length > 0) {
    console.log('\n⚠️ Missing environment variables:', missingVars);
    console.log('\n📝 To fix this:');
    console.log('1. Create a .env file in the Backend directory');
    console.log('2. Add the missing variables:');
    missingVars.forEach(varName => {
      console.log(`   ${varName}=your_value_here`);
    });
  } else {
    console.log('\n🎉 All environment variables are properly configured!');
  }
  
  console.log('\n🌍 NODE_ENV:', process.env.NODE_ENV || 'not set');
  console.log('📍 Current directory:', process.cwd());
};

loadEnvironmentVariables(); 