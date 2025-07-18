import type { AudioFeatures } from '../hooks/useAudioAnalyzer';

export interface TransformationParams {
  style: string;
  intensity: number;
  colorShift: number;
  distortion: number;
  abstract: number;
}

export interface TransformationOptions {
  audioFeatures: AudioFeatures;
  imageData: string; // base64 data URL
  mode: 'realtime' | 'artistic' | 'psychedelic' | 'minimal';
}

/**
 * Converts audio features to image transformation parameters
 */
export function audioToTransformParams(audioFeatures: AudioFeatures): TransformationParams {
  const { volume, centroid, energy, rolloff } = audioFeatures;
  
  // Map audio features to visual parameters
  return {
    style: volume > 0.7 ? 'aggressive' : volume > 0.3 ? 'moderate' : 'subtle',
    intensity: Math.min(1, volume * 2), // 0-1 range
    colorShift: centroid, // 0-1 range
    distortion: Math.min(1, energy / 1000), // Normalize energy
    abstract: rolloff, // 0-1 range
  };
}

/**
 * Generate transformation prompt based on audio features
 */
export function generateTransformPrompt(audioFeatures: AudioFeatures, mode: string): string {
  const params = audioToTransformParams(audioFeatures);
  
  const basePrompts = {
    realtime: "Transform this image with real-time audio-reactive effects",
    artistic: "Create an artistic interpretation of this image",
    psychedelic: "Apply psychedelic, trippy effects to this image",
    minimal: "Apply subtle, minimal transformations to this image"
  };
  
  const intensityWords = {
    high: ["dramatic", "intense", "bold", "explosive"],
    medium: ["moderate", "balanced", "smooth", "flowing"],
    low: ["subtle", "gentle", "soft", "delicate"]
  };
  
  const intensityLevel = params.intensity > 0.7 ? 'high' : 
                        params.intensity > 0.3 ? 'medium' : 'low';
  
  const colorWords = params.colorShift > 0.6 ? "vibrant, saturated colors" :
                    params.colorShift > 0.3 ? "balanced color palette" :
                    "muted, desaturated tones";
  
  const styleWord = intensityWords[intensityLevel][Math.floor(Math.random() * 4)];
  
  return `${basePrompts[mode as keyof typeof basePrompts]}, ${styleWord} style, ${colorWords}, distortion level ${Math.round(params.distortion * 10)}/10, abstract factor ${Math.round(params.abstract * 10)}/10`;
}

/**
 * Transform image using backend proxy with OpenAI DALL-E
 */
export async function transformImageWithAI(options: TransformationOptions): Promise<string> {
  const { audioFeatures, imageData, mode } = options;
  
  console.log('🎨 AI Transformation started:', {
    audioParams: audioToTransformParams(audioFeatures),
    mode,
    imageDataLength: imageData.length
  });
  
  try {
    // Convert data URL to blob for upload
    const response = await fetch(imageData);
    const blob = await response.blob();
    
    // Create form data for backend
    const formData = new FormData();
    formData.append('image', blob, `image-${Date.now()}.png`);
    formData.append('audioFeatures', JSON.stringify(audioFeatures));
    formData.append('mode', mode);
    formData.append('timestamp', Date.now().toString());
    
    console.log('🚀 Sending to backend proxy...');
    
    // Call backend proxy
    const backendResponse = await fetch('http://localhost:3001/transform-image', {
      method: 'POST',
      body: formData
    });
    
    console.log('🌐 Backend response status:', backendResponse.status);
    console.log('🌐 Backend response headers:', backendResponse.headers);
    
    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('❌ Backend error response:', errorText);
      throw new Error(`Backend error: ${backendResponse.status}`);
    }
    
    const result = await backendResponse.json();
    console.log('📋 Full backend response:', result);
    console.log('📋 Response keys:', Object.keys(result));
    
    if (!result.success) {
      throw new Error(result.message || 'Transformation failed');
    }
    
    console.log('✅ Backend transformation complete');
    console.log('📨 Received image data from backend, length:', result.imageData?.length || 'undefined');
    console.log('📨 Image data starts with:', result.imageData?.substring(0, 50) || 'undefined');
    console.log('🎨 Transformation prompt used:', result.prompt);
    return result.imageData;
    
  } catch (error) {
    console.error('❌ Backend transformation failed:', error);
    
    // Fallback to enhanced simulation on error
    console.log('🔧 Falling back to enhanced simulation');
    return await simulateTransformation(imageData, audioFeatures);
  }
}

/**
 * Enhanced simulation that preserves original image structure
 * Applies audio-reactive transformations while keeping the subject recognizable
 */
async function simulateTransformation(imageData: string, audioFeatures: AudioFeatures): Promise<string> {
  console.log('🔧 Starting enhanced simulation transformation');
  console.log('🎵 Audio features for simulation:', {
    volume: audioFeatures.volume,
    pitch: audioFeatures.pitch,
    energy: audioFeatures.energy,
    centroid: audioFeatures.centroid
  });
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const img = new Image();
  
  return new Promise((resolve) => {
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Apply audio-reactive transformations
      const { volume, centroid, pitch, energy } = audioFeatures;
      
      // Base image
      ctx.drawImage(img, 0, 0);
      
      // Apply audio-reactive overlay effects
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Color shift based on audio (more dramatic)
      const hueShift = (centroid * 360) % 360;
      const saturationBoost = 1 + volume * 1.2; // More saturation
      const brightnessAdjust = 1 + (volume - 0.5) * 0.6; // More brightness change
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Convert to HSL, adjust, convert back
        const [h, s, l] = rgbToHsl(r, g, b);
        const newH = (h + hueShift / 360) % 1;
        const newS = Math.min(1, s * saturationBoost);
        const newL = Math.max(0, Math.min(1, l * brightnessAdjust));
        
        const [newR, newG, newB] = hslToRgb(newH, newS, newL);
        
        data[i] = newR;
        data[i + 1] = newG;
        data[i + 2] = newB;
        
        // Add audio-reactive noise/distortion sparingly
        if (volume > 0.4 && Math.random() < volume * 0.05) {
          const noise = (Math.random() - 0.5) * volume * 50;
          data[i] = Math.max(0, Math.min(255, data[i] + noise));
          data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
          data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      // Add audio-reactive effects as overlays
      if (energy > 100) {
        // Add energy-based particle effects
        ctx.globalAlpha = Math.min(0.3, energy / 1000);
        ctx.fillStyle = `hsl(${pitch * 2}, 70%, 60%)`;
        
        for (let i = 0; i < Math.floor(energy / 100); i++) {
          const x = Math.random() * canvas.width;
          const y = Math.random() * canvas.height;
          const size = Math.random() * volume * 10;
          
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.globalAlpha = 1;
      }
      
      // Add wave distortion based on pitch
      if (pitch > 50) {
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = 0.1;
        
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, `hsl(${pitch}, 50%, 50%)`);
        gradient.addColorStop(1, `hsl(${pitch + 180}, 50%, 50%)`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
      }
      
      const result = canvas.toDataURL();
      console.log('✅ Simulation transformation complete, result length:', result.length);
      resolve(result);
    };
    
    img.onerror = (error) => {
      console.error('❌ Image loading error in simulation:', error);
      resolve(imageData); // Return original on error
    };
    
    img.src = imageData;
  });
}

// Helper functions for color conversion
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    
    h /= 6;
  }
  
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * Real-time transformation for continuous audio processing
 */
export class RealtimeTransformer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private originalImage: HTMLImageElement | null = null;
  private animationFrame: number | null = null;
  
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }
  
  async setImage(imageData: string): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.originalImage = img;
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        resolve();
      };
      img.src = imageData;
    });
  }
  
  startRealtimeTransform(getAudioFeatures: () => AudioFeatures, onUpdate: (dataUrl: string) => void): void {
    if (!this.originalImage) return;
    
    const transform = () => {
      if (!this.originalImage) return;
      
      const audioFeatures = getAudioFeatures();
      const { volume, centroid, pitch, energy } = audioFeatures;
      
      // Clear and apply base image
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(this.originalImage, 0, 0);
      
      // Get image data for pixel-level manipulation
      const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      const data = imageData.data;
      
      // Real-time color transformations
      const hueShift = (centroid * 360) % 360;
      const saturationBoost = 1 + volume * 0.8;
      const brightnessAdjust = 1 + (volume - 0.5) * 0.4;
      
      // Apply transformations to each pixel
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Convert to HSL, adjust, convert back
        const [h, s, l] = this.rgbToHsl(r, g, b);
        const newH = (h + hueShift / 360) % 1;
        const newS = Math.min(1, s * saturationBoost);
        const newL = Math.max(0, Math.min(1, l * brightnessAdjust));
        
        const [newR, newG, newB] = this.hslToRgb(newH, newS, newL);
        
        data[i] = newR;
        data[i + 1] = newG;
        data[i + 2] = newB;
        
        // Add real-time noise based on energy
        if (energy > 50 && Math.random() < energy / 2000) {
          const noise = (Math.random() - 0.5) * volume * 30;
          data[i] = Math.max(0, Math.min(255, data[i] + noise));
          data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
          data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
        }
      }
      
      // Apply transformed image data
      this.ctx.putImageData(imageData, 0, 0);
      
      // Add real-time overlay effects
      if (energy > 100) {
        this.ctx.globalAlpha = Math.min(0.2, energy / 1000);
        this.ctx.fillStyle = `hsl(${pitch * 2}, 70%, 60%)`;
        
        // Add energy particles
        for (let i = 0; i < Math.floor(energy / 200); i++) {
          const x = Math.random() * this.canvas.width;
          const y = Math.random() * this.canvas.height;
          const size = Math.random() * volume * 5;
          
          this.ctx.beginPath();
          this.ctx.arc(x, y, size, 0, Math.PI * 2);
          this.ctx.fill();
        }
        
        this.ctx.globalAlpha = 1;
      }
      
      // Call update callback
      onUpdate(this.canvas.toDataURL());
      
      this.animationFrame = requestAnimationFrame(transform);
    };
    
    transform();
  }
  
  private rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      
      h /= 6;
    }
    
    return [h, s, l];
  }
  
  private hslToRgb(h: number, s: number, l: number): [number, number, number] {
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }
  
  stopRealtimeTransform(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }
}