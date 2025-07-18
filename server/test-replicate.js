const Replicate = require('replicate');
require('dotenv').config();

async function testReplicate() {
  try {
    console.log('Testing Replicate connection...');
    console.log('Token found:', process.env.REPLICATE_API_TOKEN ? 'Yes' : 'No');
    
    if (!process.env.REPLICATE_API_TOKEN) {
      console.error('❌ No Replicate token found in .env file');
      return;
    }
    
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });
    
    console.log('✅ Replicate client created successfully');
    console.log('Ready to use Stable Diffusion img2img!');
    
    // Test if we can access the model
    const model = await replicate.models.get("stability-ai", "stable-diffusion-img2img");
    console.log('✅ Model accessible:', model.name);
    
  } catch (error) {
    console.error('❌ Replicate test failed:', error.message);
  }
}

testReplicate();