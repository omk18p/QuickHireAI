const fs = require('fs');
const path = require('path');

const envContent = `GEMINI_API_KEY=AIzaSyCrOn9MsRNHs583sBULH6DQLfbX7Ta5x8c
JWT_SECRET=your-super-secret-jwt-key-keep-it-safe
MONGODB_URI=mongodb+srv://atharvakhot1718:3wQAIC8NbjFNmsSG@cluster0.fsvyesa.mongodb.net/Cluster0
NODE_ENV=development
`;

const envPath = path.resolve(__dirname, '../.env');

try {
    // Write file with UTF-8 encoding without BOM
    fs.writeFileSync(envPath, envContent, { encoding: 'utf8' });
    console.log('✓ Created .env file successfully at:', envPath);
    
    // Verify the file was written correctly
    const content = fs.readFileSync(envPath, 'utf8');
    console.log('\nFile content verification:');
    console.log(content);
} catch (error) {
    console.error('Error creating .env file:', error);
} 