import type { AudioFeatures } from '../hooks/useAudioAnalyzer';
import { applyWebGLColorTransform } from '../utils/webglTransforms';

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
    // Use relative URL in production to work with any base path
    const apiUrl = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3001');
    const backendResponse = await fetch(`${apiUrl}/transform-image`, {
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
    console.log('🔍 Image analysis from GPT-4o:', result.imageAnalysis);
    console.log('🎵 Audio features used:', result.audioFeatures);
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
  
  const img = new Image();

  return new Promise((resolve) => {
    img.onload = () => {
      const { volume, centroid, pitch, energy } = audioFeatures;

      const glCanvas = applyWebGLColorTransform(img, {
        hueShift: (centroid * 360) % 360,
        saturation: 1 + volume * 1.2,
        brightness: 1 + (volume - 0.5) * 0.6,
        noise: volume > 0.4 ? volume * 0.1 : 0,
        seed: Math.random()
      });

      const canvas = document.createElement('canvas');
      canvas.width = glCanvas.width;
      canvas.height = glCanvas.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(glCanvas, 0, 0);

      if (energy > 100) {
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
      
      const glCanvas = applyWebGLColorTransform(this.originalImage, {
        hueShift: (centroid * 360) % 360,
        saturation: 1 + volume * 0.8,
        brightness: 1 + (volume - 0.5) * 0.4,
        noise: energy > 50 ? volume * 0.1 : 0,
        seed: Math.random()
      });

      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(glCanvas, 0, 0);
      
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
  
  stopRealtimeTransform(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }
}