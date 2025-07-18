require('dotenv').config();

console.log('=== Environment Check ===');
console.log('Current directory:', process.cwd());
console.log('.env file path:', __dirname + '/.env');

console.log('\nOpenAI Key exists:', !!process.env.OPENAI_API_KEY);
console.log('OpenAI Key starts with:', process.env.OPENAI_API_KEY?.substring(0, 10) + '...');

console.log('\nReplicate Token exists:', !!process.env.REPLICATE_API_TOKEN);
console.log('Replicate Token value:', process.env.REPLICATE_API_TOKEN);
console.log('Replicate Token length:', process.env.REPLICATE_API_TOKEN?.length || 0);
console.log('Replicate Token starts with:', process.env.REPLICATE_API_TOKEN?.substring(0, 5));

console.log('\nAll env vars starting with REPLICATE:');
Object.keys(process.env).filter(key => key.includes('REPLICATE')).forEach(key => {
  console.log(`  ${key}: ${process.env[key]?.substring(0, 10)}...`);
});

console.log('\n=== Raw .env file contents ===');
const fs = require('fs');
try {
  const envContent = fs.readFileSync('.env', 'utf8');
  console.log('File size:', envContent.length, 'bytes');
  console.log('Lines:');
  envContent.split('\n').forEach((line, i) => {
    console.log(`  Line ${i + 1}: "${line}" (length: ${line.length})`);
  });
} catch (error) {
  console.error('Error reading .env file:', error.message);
}