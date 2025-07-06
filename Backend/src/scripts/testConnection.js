require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  try {
    // Test MongoDB connection
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connection successful');

    // Test if we can perform basic operations
    const User = require('../models/User');
    const testUser = new User({
      email: 'test@example.com',
      password: 'test123',
      userType: 'company'
    });
    await testUser.save();
    console.log('✅ Can create documents in database');

    // Clean up test data
    await User.deleteOne({ email: 'test@example.com' });
    console.log('✅ Can delete documents from database');

    console.log('\nAll tests passed! 🎉');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testConnection(); 