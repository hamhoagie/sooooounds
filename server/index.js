const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Enable CORS for frontend
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [process.env.FRONTEND_URL, 'https://soooounds-web.ondigitalocean.app']
  : ['http://localhost:8000', 'http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.path} - Headers:`, req.headers);
  next();
});

// Strip /sooooounds prefix for DigitalOcean routing
app.use((req, res, next) => {
  if (req.path.startsWith('/sooooounds')) {
    req.url = req.url.replace('/sooooounds', '');
    console.log(`🔄 Rewriting path from ${req.path} to ${req.url}`);
  }
  next();
});

// Serve React app static files
const path = require('path');
app.use(express.static(path.join(__dirname, '../client/dist')));

// Initialize OpenAI only if an API key is available
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Replicate not used - using OpenAI with audio post-processing instead

// API root endpoint
app.get('/api', (req, res) => {
  res.json({ 
    message: 'SOOOOUNDS API Server', 
    status: 'running',
    endpoints: ['/api', '/health', '/transform-image'],
    timestamp: new Date().toISOString() 
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Transform image with audio data
app.post('/transform-image', upload.single('image'), async (req, res) => {
  try {
    console.log('🎨 Image transformation request received');
    
    const audioFeaturesStr = req.body.audioFeatures;
    const mode = req.body.mode;
    const imageBuffer = req.file?.buffer;
    
    if (!imageBuffer) {
      return res.status(400).json({ error: 'No image provided' });
    }
    
    if (!audioFeaturesStr) {
      return res.status(400).json({ error: 'No audio features provided' });
    }
    
    const audioFeatures = JSON.parse(audioFeaturesStr);
    
    console.log('📊 Image details:', {
      originalSize: imageBuffer.length,
      fileType: req.file?.mimetype,
      fileName: req.file?.originalname
    });
    
    console.log('🎵 Audio features:', {
      volume: audioFeatures.volume,
      pitch: audioFeatures.pitch,
      energy: audioFeatures.energy,
      mode: mode
    });
    
    // Generate audio-reactive prompt (this is not used when GPT-4o is active)
    const basicPrompt = generateAudioPrompt(audioFeatures, mode);
    console.log('🎯 Basic prompt (not used):', basicPrompt);
    
    // Convert image to PNG format if needed
    const sharp = require('sharp');
    
    // Convert uploaded image to PNG format
    let pngImageBuffer;
    let imageMetadata;
    if (req.file?.mimetype !== 'image/png') {
      console.log('🔄 Converting image to PNG format');
      const sharpImage = sharp(imageBuffer).png().resize(512, 512, { fit: 'inside' });
      pngImageBuffer = await sharpImage.toBuffer();
      imageMetadata = await sharpImage.metadata();
      console.log('✅ Image converted to PNG');
    } else {
      console.log('✅ Image already in PNG format');
      const sharpImage = sharp(imageBuffer).resize(512, 512, { fit: 'inside' });
      pngImageBuffer = await sharpImage.toBuffer();
      imageMetadata = await sharpImage.metadata();
    }
    
    // Get actual image dimensions after processing
    const finalImageMetadata = await sharp(pngImageBuffer).metadata();
    console.log('📏 Final image dimensions:', { 
      width: finalImageMetadata.width, 
      height: finalImageMetadata.height 
    });
    
    // Create mask for image editing with matching dimensions
    const maskBuffer = await createAudioMask(audioFeatures, mode, finalImageMetadata.width, finalImageMetadata.height);
    
    // Debug: Save mask to file system to inspect it
    const fs = require('fs');
    const debugMaskPath = `/tmp/debug_mask_${Date.now()}.png`;
    fs.writeFileSync(debugMaskPath, maskBuffer);
    console.log('🎭 Mask saved for debugging:', debugMaskPath);
    
    // Create File objects with proper MIME types
    const { File } = require('buffer');
    const imageFile = new File([pngImageBuffer], 'image.png', { type: 'image/png' });
    const maskFile = new File([maskBuffer], 'mask.png', { type: 'image/png' });
    
    console.log('📏 Image file size:', imageFile.size);
    console.log('📏 Mask file size:', maskFile.size);
    
    // Use GPT-4o to analyze the image and create smart prompts
    console.log('🤖 Using GPT-4o vision to analyze uploaded image...');
    
    // Convert image to base64 for GPT-4o
    const base64Image = pngImageBuffer.toString('base64');
    
    // Analyze image with GPT-4o
    const visionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image and describe it in detail. Focus on: 1) Main subject/object, 2) Style (logo, illustration, photo, etc), 3) Colors, 4) Key visual elements. Keep it concise but specific."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 200
    });
    
    const imageDescription = visionResponse.choices[0]?.message?.content || "digital artwork";
    console.log('📝 Image analysis from GPT-4o:', imageDescription);
    console.log('🔍 Full GPT-4o response:', JSON.stringify(visionResponse.choices[0], null, 2));
    
    // Generate audio-reactive prompt based on the image analysis
    const smartPrompt = generateSmartAudioPrompt(audioFeatures, mode, imageDescription);
    console.log('🎯 Smart audio-reactive prompt:', smartPrompt);
    
    // Use DALL-E 3 with the smart prompt
    console.log('🎨 Using DALL-E 3 with context-aware audio-reactive prompt...');
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: smartPrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard"
    });
    
    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI');
    }
    
    console.log('✅ DALL-E 3 generation complete');
    console.log('🌐 Image URL from OpenAI:', imageUrl);
    
    // Fetch the image and apply audio-reactive post-processing
    const imageResponse = await fetch(imageUrl);
    const imageArrayBuffer = await imageResponse.arrayBuffer();
    const dalleImageBuffer = Buffer.from(imageArrayBuffer);
    
    // Apply audio-reactive post-processing using Sharp
    console.log('🎵 Applying audio-reactive post-processing...');
    let processedImage;
    try {
      processedImage = await applyAudioEffects(dalleImageBuffer, audioFeatures);
      console.log('✅ Audio processing complete, buffer size:', processedImage.length);
    } catch (processingError) {
      console.error('❌ Audio processing failed:', processingError);
      console.log('🔄 Using original image without processing');
      processedImage = dalleImageBuffer;
    }
    
    const imageBase64 = processedImage.toString('base64');
    const dataUrl = `data:image/png;base64,${imageBase64}`;
    
    console.log('📤 Sending audio-processed image back to frontend, size:', imageBase64.length);
    console.log('🔍 Data URL preview:', dataUrl.substring(0, 100) + '...');
    console.log('🔍 Data URL starts with:', dataUrl.startsWith('data:image/png;base64,'));
    
    // No temporary files to clean up - using memory buffers
    
    const responseData = {
      success: true,
      imageData: dataUrl,
      prompt: smartPrompt,
      imageAnalysis: imageDescription,
      audioFeatures: audioFeatures
    };
    
    console.log('📦 Response object keys:', Object.keys(responseData));
    console.log('📦 Response success:', responseData.success);
    console.log('📦 Response imageData length:', responseData.imageData.length);
    
    res.json(responseData);
    
  } catch (error) {
    console.error('❌ Transformation failed:', error);
    console.error('❌ Full error stack:', error.stack);
    res.status(500).json({
      error: 'Transformation failed',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Generate smart audio-reactive prompt using image analysis
function generateSmartAudioPrompt(audioFeatures, mode, imageDescription) {
  const { volume, centroid, pitch, energy } = audioFeatures;
  
  // Audio intensity levels
  const volumePercent = Math.round(volume * 100);
  const energyPercent = Math.round(energy * 100);
  
  // Audio-based effects
  const intensity = volume > 0.7 ? "intense, dramatic" :
                   volume > 0.4 ? "moderate, dynamic" :
                   "subtle, gentle";
  
  // Log the actual energy value
  console.log('🎵 Audio energy value:', energy);
  
  const movement = energy > 0.1 ? "swirling energy, flowing motion" :
                  energy > 0.05 ? "gentle movement, soft dynamics" :
                  "calm, peaceful";
  
  const colorMood = centroid > 0.6 ? "vibrant neon colors, electric palette" :
                   centroid > 0.3 ? "warm glowing colors, fiery tones" :
                   "cool deep colors, midnight palette";
  
  // Construct prompt that maintains the original subject
  const prompt = `${imageDescription}, transformed with ${intensity} audio-reactive effects. Apply ${movement} and ${colorMood}. The original subject should remain recognizable but enhanced with sound visualization effects, audio waveforms subtly integrated into the design, ${mode} style. High quality digital art.`;
  
  // Keep under 1000 chars for DALL-E 3
  return prompt.substring(0, 999);
}

// Original prompt generator (kept for reference)
function generateAudioPrompt(audioFeatures, mode) {
  const { volume, centroid, pitch, energy } = audioFeatures;
  
  // Make audio parameters MUCH more dramatic and specific
  const volumePercent = Math.round(volume * 100);
  const energyPercent = Math.round(energy * 100);
  const pitchValue = Math.round(pitch);
  const centroidValue = Math.round(centroid * 100);
  
  console.log('🎵 Audio-reactive parameters:', {
    volumePercent, energyPercent, pitchValue, centroidValue
  });
  
  // Volume controls overall intensity and chaos
  const volumeEffects = volume > 0.8 ? 'EXPLOSIVE CHAOS, maximum distortion, reality-breaking' :
                       volume > 0.6 ? 'INTENSE ENERGY, heavy distortion, dramatic transforms' :
                       volume > 0.4 ? 'DYNAMIC MOTION, moderate distortion, flowing transforms' :
                       volume > 0.2 ? 'GENTLE MOVEMENT, subtle distortion, smooth transforms' :
                       'MINIMAL EFFECTS, very subtle changes, peaceful';
  
  // Energy controls pattern complexity and movement
  const energyEffects = energy > 0.15 ? 'CHAOTIC FRACTALS, lightning patterns, explosive bursts' :
                       energy > 0.10 ? 'SWIRLING VORTEXES, rippling waves, pulsing rhythms' :
                       energy > 0.05 ? 'FLOWING STREAMS, gentle waves, rhythmic patterns' :
                       'SMOOTH GRADIENTS, soft transitions, minimal patterns';
  
  // Pitch controls color temperature and structure
  const pitchEffects = pitch > 100 ? 'CRYSTALLINE STRUCTURES, sharp geometric patterns, sparkles' :
                      pitch > 50 ? 'ORGANIC CURVES, flowing shapes, harmonic patterns' :
                      pitch > 20 ? 'BALANCED FORMS, moderate geometry, smooth transitions' :
                      'HEAVY TEXTURES, grounded elements, solid foundations';
  
  // Centroid controls color palette
  const centroidColors = centroid > 0.7 ? 'BLAZING NEON: electric blues, hot magentas, laser greens' :
                        centroid > 0.4 ? 'FIERY WARM: molten reds, golden yellows, burning oranges' :
                        'DEEP COOL: midnight blues, rich purples, metallic silvers';
  
  // Create unique seed based on audio values for consistent but varied results
  const audioSeed = `${volumePercent}${energyPercent}${pitchValue}${centroidValue}`;
  
  // Create a simple prompt for DALL-E 2 variations
  // The actual audio reactivity comes from post-processing
  const basePrompt = `Digital art style, high quality, artistic variation`;
  
  return basePrompt;
}

// Create audio-reactive mask
async function createAudioMask(audioFeatures, mode, width = 512, height = 512) {
  const { createCanvas } = require('canvas');
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  const { volume, centroid, energy, pitch } = audioFeatures;
  
  // Create dynamic mask based on audio - MUCH more dramatic transformations
  ctx.fillStyle = 'black'; // Black = keep original
  ctx.fillRect(0, 0, width, height);
  
  // White areas = transform, pattern based on audio
  ctx.fillStyle = 'white';
  
  if (mode === 'psychedelic') {
    // Full image transformation for psychedelic mode
    ctx.fillRect(0, 0, width, height);
  } else if (mode === 'minimal') {
    // Transform larger areas based on volume for minimal mode
    const size = Math.max(200, Math.min(width, height) * volume * 0.8); // Minimum 200px, up to 80% coverage
    ctx.fillRect(0, 0, size, size);
    ctx.fillRect(width - size, 0, size, size);
    ctx.fillRect(0, height - size, size, size);
    ctx.fillRect(width - size, height - size, size, size);
  } else {
    // Create strategic audio-reactive mask based on audio parameters
    console.log('🎭 Creating strategic audio-reactive mask');
    
    // Volume controls how much of the image to transform
    const transformCoverage = Math.max(0.3, volume * 0.8); // 30% to 80% coverage
    
    // Energy controls pattern complexity
    const numPatterns = Math.max(2, Math.floor(energy * 20)); // 2 to 20 patterns
    
    // Create base transformation areas
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) * transformCoverage * 0.4;
    
    // Primary transformation area in center
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Additional areas based on energy
    for (let i = 0; i < numPatterns; i++) {
      const angle = (i / numPatterns) * Math.PI * 2;
      const distance = baseRadius * (0.5 + Math.random() * 0.5);
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      const radius = baseRadius * (0.2 + Math.random() * 0.3);
      
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Add pitch-based linear elements
    if (pitch > 50) {
      const numLines = Math.min(5, Math.floor(pitch / 30));
      for (let i = 0; i < numLines; i++) {
        const y = (height / (numLines + 1)) * (i + 1);
        const lineWidth = width * transformCoverage * 0.3;
        const x = (width - lineWidth) / 2;
        
        ctx.fillRect(x, y - 10, lineWidth, 20);
      }
    }
  }
  
  return canvas.toBuffer('image/png');
}

// Apply audio-reactive effects to image
async function applyAudioEffects(imageBuffer, audioFeatures) {
  const sharp = require('sharp');
  const { volume, energy, pitch, centroid } = audioFeatures;
  
  // Calculate effect intensities based on audio
  const brightness = 1 + (volume - 0.5) * 0.3; // -15% to +15% brightness
  const saturation = 1 + energy * 0.5; // up to +50% saturation
  const hue = Math.round(centroid * 30 - 15); // -15 to +15 degree hue shift
  
  console.log('🎨 Audio effect parameters:', {
    brightness,
    saturation,
    hue,
    volume,
    energy,
    centroid
  });
  
  // Apply effects
  let processedImage = sharp(imageBuffer);
  
  // Basic color adjustments based on audio
  processedImage = processedImage.modulate({
    brightness: brightness,
    saturation: saturation,
    hue: hue
  });
  
  // Add audio-reactive tint based on pitch
  if (pitch > 100) {
    // High pitch - cyan/blue tint
    processedImage = processedImage.tint({ r: 200, g: 220, b: 255 });
  } else if (pitch > 50) {
    // Mid pitch - purple tint
    processedImage = processedImage.tint({ r: 220, g: 200, b: 255 });
  } else {
    // Low pitch - warm tint
    processedImage = processedImage.tint({ r: 255, g: 240, b: 220 });
  }
  
  // Add slight blur for high energy
  if (energy > 0.1) {
    const blurAmount = Math.min(2, energy * 10);
    processedImage = processedImage.blur(blurAmount);
  }
  
  // Convert to buffer
  return await processedImage.png().toBuffer();
}

// Catch-all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

if (require.main === module) {
  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Soooounds backend server running on http://0.0.0.0:${port}`);
    console.log(`🌍 PORT environment variable: ${process.env.PORT}`);
    console.log(`🎨 OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'Found' : 'Missing'}`);
    console.log(`🔄 Replicate API Token: ${process.env.REPLICATE_API_TOKEN ? 'Found' : 'Missing'}`);
    console.log(`📡 Server ready to accept connections on all interfaces`);
  });
}

module.exports = { app, generateAudioPrompt, applyAudioEffects };
