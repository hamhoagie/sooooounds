import OpenAI from 'openai';
import type { AudioFeatures } from '../hooks/useAudioAnalyzer';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, use a backend proxy
});

export interface AITransformOptions {
  imageData: string; // base64 data URL
  audioFeatures: AudioFeatures;
  mode: 'artistic' | 'psychedelic' | 'minimal' | 'realtime';
  customPrompt?: string;
}

/**
 * Generate sophisticated prompts based on audio features
 */
export function generateAdvancedPrompt(audioFeatures: AudioFeatures, mode: string, customPrompt?: string): string {
  const { volume, centroid, pitch, energy, rolloff } = audioFeatures;
  
  // Audio-to-visual mappings
  const intensity = volume > 0.8 ? 'explosive, dramatic' : 
                   volume > 0.5 ? 'dynamic, energetic' : 
                   volume > 0.2 ? 'gentle, flowing' : 'subtle, calm';
  
  const colorPalette = centroid > 0.7 ? 'vibrant neons, electric blues and magentas' :
                      centroid > 0.4 ? 'warm oranges, deep reds, golden yellows' :
                      'cool blues, deep purples, silvery grays';
  
  const textureStyle = rolloff > 0.6 ? 'sharp, crystalline, geometric patterns' :
                      rolloff > 0.3 ? 'flowing, organic, fluid forms' :
                      'soft, ethereal, misty textures';
  
  const energyLevel = energy > 500 ? 'chaotic, fractal, lightning-like energy' :
                     energy > 200 ? 'rhythmic, wave-like patterns' :
                     'peaceful, zen-like, minimalist';
  
  const pitchMapping = pitch > 150 ? 'high-frequency, crystalline, sparkling elements' :
                      pitch > 50 ? 'mid-range, balanced, harmonic structures' :
                      'deep, bass-heavy, grounded, earthy tones';

  const baseModePrompts = {
    artistic: `Transform this image into a stunning artistic masterpiece`,
    psychedelic: `Create a mind-bending psychedelic transformation`,
    minimal: `Apply elegant minimal artistic enhancement`,
    realtime: `Apply real-time audio-reactive visual effects`
  };

  const modeStyles = {
    artistic: 'oil painting, impressionist, museum-quality artwork',
    psychedelic: 'trippy, surreal, kaleidoscopic, LSD-inspired visuals',
    minimal: 'clean lines, negative space, Japanese aesthetic, bauhaus',
    realtime: 'digital art, neon, cyberpunk, electronic music visualization'
  };

  if (customPrompt) {
    return `${customPrompt}. Audio characteristics: ${intensity} energy, ${colorPalette}, ${textureStyle}, ${energyLevel}, ${pitchMapping}. Style: ${modeStyles[mode as keyof typeof modeStyles]}`;
  }

  return `${baseModePrompts[mode as keyof typeof baseModePrompts]} with ${intensity} energy levels. 
  Use ${colorPalette} as the primary color scheme. 
  Apply ${textureStyle} with ${energyLevel}. 
  Incorporate ${pitchMapping} throughout the composition.
  Style: ${modeStyles[mode as keyof typeof modeStyles]}.
  Make it visually striking and emotionally resonant, reflecting the audio's mood and energy.`;
}

/**
 * Transform image using OpenAI DALL-E 3 with audio-reactive prompts
 */
export async function transformImageWithOpenAI(options: AITransformOptions): Promise<string> {
  const { audioFeatures, mode, customPrompt } = options;
  
  try {
    console.log('🎨 Starting OpenAI DALL-E 3 transformation...');
    
    // Generate sophisticated prompt based on audio
    const prompt = generateAdvancedPrompt(audioFeatures, mode, customPrompt);
    console.log('🎯 Generated prompt:', prompt);
    
    // Use DALL-E 3 for image generation with audio-reactive prompts
    const completion = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
      style: mode === 'artistic' ? 'vivid' : 'natural'
    });
    
    const imageUrl = completion.data?.[0]?.url;
    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI');
    }
    
    // Convert URL to data URL to avoid CORS issues
    console.log('🔄 Converting OpenAI URL to data URL...');
    try {
      const response = await fetch(imageUrl, { mode: 'cors' });
      const blob = await response.blob();
      
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (fetchError) {
      console.warn('⚠️ Failed to fetch OpenAI image, returning URL:', fetchError);
      // If CORS fails, return the URL anyway and let the UI handle it
      return imageUrl;
    }
    
  } catch (error) {
    console.error('❌ OpenAI transformation failed:', error);
    throw new Error(`AI transformation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Enhanced image editing with DALL-E 2 (supports image editing)
 */
export async function editImageWithOpenAI(options: AITransformOptions): Promise<string> {
  const { imageData, audioFeatures, mode, customPrompt } = options;
  
  try {
    console.log('✏️ Starting OpenAI image editing...');
    
    // Generate prompt
    const prompt = generateAdvancedPrompt(audioFeatures, mode, customPrompt);
    console.log('🎯 Edit prompt:', prompt);
    
    // Convert image to RGBA format using canvas
    const img = new Image();
    img.src = imageData;
    await new Promise((resolve) => { img.onload = resolve; });
    
    // Create canvas and convert to RGBA
    const canvas = document.createElement('canvas');
    canvas.width = 512; // DALL-E 2 requires 512x512
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Fill with transparent background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw and scale image to fit
    const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
    const x = (canvas.width - img.width * scale) / 2;
    const y = (canvas.height - img.height * scale) / 2;
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    
    // Convert canvas to blob in RGBA PNG format
    const rgbaBlob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/png');
    });
    
    const file = new File([rgbaBlob], 'image.png', { type: 'image/png' });
    
    // Use DALL-E 2 for image editing (more suitable for transformations)
    const completion = await openai.images.edit({
      model: "dall-e-2",
      image: file,
      prompt: prompt,
      n: 1,
      size: "512x512"
    });
    
    const imageUrl = completion.data?.[0]?.url;
    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI');
    }
    
    // Return the URL directly - let the image tag handle loading
    // This avoids CORS issues
    return imageUrl;
    
  } catch (error) {
    console.error('❌ OpenAI edit failed:', error);
    throw new Error(`AI edit failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Edit image with mask for proper transformations
 */
export async function editImageWithMask(options: AITransformOptions): Promise<string> {
  const { imageData, audioFeatures, mode, customPrompt } = options;
  
  try {
    console.log('✏️ Starting OpenAI image editing with mask...');
    
    // Generate prompt
    const prompt = generateAdvancedPrompt(audioFeatures, mode, customPrompt);
    console.log('🎯 Edit prompt:', prompt);
    
    // Convert image to RGBA format using canvas
    const img = new Image();
    img.src = imageData;
    await new Promise((resolve) => { img.onload = resolve; });
    
    // Create canvas for image
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Draw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
    const x = (canvas.width - img.width * scale) / 2;
    const y = (canvas.height - img.height * scale) / 2;
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    
    // Convert to blob
    const imageBlob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/png');
    });
    
    // Create mask based on audio features
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = 512;
    maskCanvas.height = 512;
    const maskCtx = maskCanvas.getContext('2d')!;
    
    // Create dynamic mask based on audio
    maskCtx.fillStyle = 'black'; // Black = keep original
    maskCtx.fillRect(0, 0, 512, 512);
    
    // White areas = transform, pattern based on audio
    maskCtx.fillStyle = 'white';
    
    // Audio-reactive mask patterns
    const { volume, centroid } = audioFeatures;
    
    if (mode === 'psychedelic') {
      // Full image transformation
      maskCtx.fillRect(0, 0, 512, 512);
    } else if (mode === 'minimal') {
      // Transform edges/corners based on volume
      const size = 512 * volume * 0.3;
      maskCtx.fillRect(0, 0, size, size);
      maskCtx.fillRect(512 - size, 0, size, size);
      maskCtx.fillRect(0, 512 - size, size, size);
      maskCtx.fillRect(512 - size, 512 - size, size, size);
    } else {
      // Dynamic pattern based on audio
      const centerX = 256 + (centroid - 0.5) * 200;
      const centerY = 256;
      const radius = 100 + volume * 300;
      
      // Radial gradient based on audio
      const gradient = maskCtx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      gradient.addColorStop(0, 'white');
      gradient.addColorStop(1, 'black');
      maskCtx.fillStyle = gradient;
      maskCtx.fillRect(0, 0, 512, 512);
    }
    
    // Convert mask to blob
    const maskBlob = await new Promise<Blob>((resolve) => {
      maskCanvas.toBlob((blob) => resolve(blob!), 'image/png');
    });
    
    const imageFile = new File([imageBlob], 'image.png', { type: 'image/png' });
    const maskFile = new File([maskBlob], 'mask.png', { type: 'image/png' });
    
    // Use DALL-E 2 for image editing with mask
    const completion = await openai.images.edit({
      model: "dall-e-2",
      image: imageFile,
      mask: maskFile,
      prompt: prompt,
      n: 1,
      size: "512x512"
    });
    
    const imageUrl = completion.data?.[0]?.url;
    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI');
    }
    
    // Convert URL to data URL to avoid CORS issues
    console.log('🔄 Converting OpenAI edit result to data URL...');
    try {
      const response = await fetch(imageUrl, { mode: 'cors' });
      const blob = await response.blob();
      
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (fetchError) {
      console.warn('⚠️ Failed to fetch OpenAI edit result, returning URL:', fetchError);
      return imageUrl;
    }
    
  } catch (error) {
    console.error('❌ OpenAI edit with mask failed:', error);
    throw new Error(`AI edit failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate multiple variations for comparison
 */
export async function generateVariations(options: AITransformOptions, count: number = 3): Promise<string[]> {
  const results: string[] = [];
  
  for (let i = 0; i < count; i++) {
    try {
      // Slightly vary the prompt for each generation
      const variedOptions = {
        ...options,
        customPrompt: options.customPrompt ? 
          `${options.customPrompt} (variation ${i + 1})` : 
          undefined
      };
      
      const result = await transformImageWithOpenAI(variedOptions);
      results.push(result);
    } catch (error) {
      console.error(`❌ Variation ${i + 1} failed:`, error);
    }
  }
  
  return results;
}