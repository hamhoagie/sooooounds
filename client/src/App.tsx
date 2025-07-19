import { useState, useEffect, useRef } from 'react';
import { AudioReactiveLogo } from './components/AudioReactiveLogo';
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer';
import { transformImageWithAI } from './services/aiImageTransform';

function App() {
  const { audioFeatures, isListening, startListening, stopListening } = useAudioAnalyzer();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [transformedImage, setTransformedImage] = useState<string | null>(null);
  const [isTransforming, setIsTransforming] = useState(false);
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);
  const transformIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTransformRef = useRef<number>(0);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('📁 File selected:', file);
    
    if (file) {
      console.log('📁 File details:', {
        name: file.name,
        type: file.type,
        size: file.size
      });
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        console.log('📁 File loaded, data URL length:', result.length);
        console.log('🔄 Clearing previous transformed image');
        setTransformedImage(null); // Reset transformed image
        setUploadedImage(result);
        setIsRealtimeActive(false); // Stop realtime mode
        // Force a small delay to ensure state updates
        setTimeout(() => {
          console.log('✅ Ready for new transformations');
        }, 100);
      };
      reader.onerror = (e) => {
        console.error('📁 File read error:', e);
      };
      reader.readAsDataURL(file);
    } else {
      console.log('📁 No file selected');
    }
  };

  // Real-time transformation effect
  useEffect(() => {
    if (isRealtimeActive && uploadedImage && isListening && !isTransforming) {
      const now = Date.now();
      // Only transform every 8 seconds to allow for GPT-4o + DALL-E 3 processing time
      if (now - lastTransformRef.current > 8000) {
        lastTransformRef.current = now;
        
        const performTransformation = async () => {
          setIsTransforming(true);
          try {
            console.log('🚀 Real-time transformation with audio:', {
              volume: audioFeatures.volume,
              pitch: audioFeatures.pitch,
              energy: audioFeatures.energy
            });
            
            const result = await transformImageWithAI({
              audioFeatures,
              imageData: uploadedImage,
              mode: 'realtime'
            });
            
            console.log('✅ Real-time transformation complete');
            console.log('🖼️ Setting transformed image, length:', result.length);
            console.log('🔄 Original image length:', uploadedImage.length);
            console.log('🔍 Transformed image preview:', result.substring(0, 100) + '...');
            console.log('🎯 Image data starts with:', result.startsWith('data:image/'));
            console.log('🎯 Image data type:', result.substring(0, 30));
            
            // Validate the image data before setting
            if (result && result.startsWith('data:image/')) {
              setTransformedImage(result);
              console.log('✅ Transformed image state updated');
            } else {
              console.error('❌ Invalid image data received:', result?.substring(0, 100));
            }
            
            // Test if the image data is valid by creating a temporary image
            const testImg = new Image();
            testImg.onload = () => {
              console.log('✅ Test image loaded successfully, dimensions:', testImg.width, 'x', testImg.height);
            };
            testImg.onerror = (error) => {
              console.error('❌ Test image failed to load:', error);
            };
            testImg.src = result;
          } catch (error) {
            console.error('❌ Real-time transformation failed:', error);
          } finally {
            setIsTransforming(false);
          }
        };
        
        performTransformation();
      }
    }
  }, [isRealtimeActive, uploadedImage, isListening, audioFeatures.volume, audioFeatures.pitch, audioFeatures.energy, isTransforming]);

  const toggleRealtimeMode = () => {
    if (!uploadedImage || !isListening) return;
    
    if (isRealtimeActive) {
      console.log('🔴 Stopping realtime mode');
      setIsRealtimeActive(false);
      if (transformIntervalRef.current) {
        clearInterval(transformIntervalRef.current);
        transformIntervalRef.current = null;
      }
    } else {
      console.log('🟢 Starting realtime mode');
      setIsRealtimeActive(true);
      lastTransformRef.current = 0; // Reset to trigger immediate transform
    }
  };

  const downloadImage = async () => {
    if (!transformedImage) return;
    
    try {
      // If it's a URL (from OpenAI), we need to handle it differently
      if (transformedImage.startsWith('http')) {
        // Open in new tab since we can't download cross-origin images directly
        window.open(transformedImage, '_blank');
      } else {
        // For base64 images, download normally
        const link = document.createElement('a');
        link.download = `soooounds-transform-${Date.now()}.png`;
        link.href = transformedImage;
        link.click();
      }
    } catch (error) {
      console.error('Download error:', error);
      // Fallback: just open in new tab
      window.open(transformedImage, '_blank');
    }
  };

  // Realtime transformer handles audio updates internally now

  return (
    <div className="min-h-screen bg-white text-black font-helvetica">
      
      {/* Header */}
      <header className="retro-header fixed top-0 left-0 right-0 z-50">
        <h1 className="raygun-title">
            <span style={{ transform: 'translateY(-3px) rotate(3deg)', display: 'inline-block' }}>s</span>
            <span style={{ transform: 'translateY(2px) rotate(-2deg)', display: 'inline-block', marginLeft: '-8px' }}>o</span>
            <span style={{ transform: 'translateY(-1px) rotate(1deg)', display: 'inline-block', marginLeft: '-6px' }}>o</span>
            <span style={{ transform: 'translateY(4px) rotate(-4deg)', display: 'inline-block', marginLeft: '-7px' }}>o</span>
            <span style={{ transform: 'translateY(-2px) rotate(2deg)', display: 'inline-block', marginLeft: '-5px' }}>o</span>
            <span style={{ transform: 'translateY(1px) rotate(-1deg)', display: 'inline-block', marginLeft: '-9px' }}>u</span>
            <span style={{ transform: 'translateY(-4px) rotate(3deg)', display: 'inline-block', marginLeft: '-8px' }}>n</span>
            <span style={{ transform: 'translateY(3px) rotate(-3deg)', display: 'inline-block', marginLeft: '-10px' }}>d</span>
            <span style={{ transform: 'translateY(-1px) rotate(1deg)', display: 'inline-block', marginLeft: '-11px' }}>s</span>
          </h1>
      </header>

      {/* Main content */}
      <main className="swiss-content">
        <div className="swiss-grid">
          
          {/* Left: Setup */}
          <div className="grid-col-6">
              {/* Audio Control */}
              <div className="retro-panel mb-6">
                <h3 className="retro-subtitle retro-text-accent">AUDIO INPUT</h3>
                
                <button
                  onClick={isListening ? stopListening : startListening}
                  className="retro-button w-full py-3 mb-4"
                  style={{ backgroundColor: isListening ? '#e6f0ff' : undefined }}
                >
                  {isListening ? '■ STOP AUDIO' : '▶ START AUDIO'}
                </button>
                
                {/* Live Audio Visualization */}
                {isListening && (
                  <div>
                    <div className="flex items-end justify-center gap-1 h-20 mb-3">
                      {Array.from({ length: 12 }, (_, i) => {
                        const frequencyIndex = Math.floor((i / 12) * audioFeatures.frequency.length);
                        const amplitude = audioFeatures.frequency[frequencyIndex] || -100;
                        const normalizedHeight = Math.max(0, (amplitude + 100) / 100) * 100;
                        
                        return (
                          <div
                            key={i}
                            className="flex-1 transition-none"
                            style={{ 
                              height: `${normalizedHeight}%`,
                              backgroundColor: '#0066cc',
                              border: '1px solid #000'
                            }}
                          />
                        );
                      })}
                    </div>
                    <div className="text-center retro-body" style={{ color: '#666666' }}>
                      <div>VOLUME: {(audioFeatures.volume * 100).toFixed(0)}%</div>
                      <div>PITCH: {audioFeatures.pitch.toFixed(0)} | ENERGY: {audioFeatures.energy.toFixed(0)}</div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Image Upload */}
              <div className="retro-panel">
                <h3 className="retro-subtitle retro-text-accent">IMAGE INPUT</h3>
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="retro-button cursor-pointer inline-block text-center w-full py-3 mb-4"
                >
                  {uploadedImage ? 'CHANGE IMAGE' : 'UPLOAD IMAGE'}
                </label>
                
                {uploadedImage && (
                  <img
                    src={uploadedImage}
                    alt="Uploaded"
                    className="w-full h-40 object-cover retro-border"
                  />
                )}
              </div>
          </div>
            
          {/* Right: Real-Time Transform */}
          <div className="grid-col-6">
            <div className="retro-panel">
              <h3 className="retro-subtitle retro-text-accent">REAL-TIME TRANSFORM</h3>
              
              <button
                onClick={toggleRealtimeMode}
                disabled={!isListening || !uploadedImage}
                className="retro-button w-full py-3 mb-4"
                style={{
                  backgroundColor: isRealtimeActive ? '#ffcccc' : (!isListening || !uploadedImage ? undefined : '#ccffcc')
                }}
              >
                {isRealtimeActive ? '■ STOP LIVE MODE' : '▶ START LIVE MODE'}
              </button>
              
              {isRealtimeActive && (
                <div className="text-center retro-body mb-4" style={{ color: '#0066cc' }}>
                  <div className="flex items-center justify-center gap-2">
                    <div className="retro-status-indicator retro-status-active"></div>
                    LIVE • Transforms every 8 seconds
                  </div>
                </div>
              )}
              
              {isTransforming && (
                <div className="text-center retro-body mb-4" style={{ color: '#ff9900', fontWeight: 'bold' }}>
                  ⏳ Transforming with AI...
                </div>
              )}
              
              {transformedImage && (
                <div>
                  <div className="retro-body mb-2" style={{ color: '#666666' }}>AI TRANSFORMED IMAGE</div>
                  <div className="relative">
                    <img
                      key={`transformed-${transformedImage?.substring(30, 50)}-${Date.now()}`}
                      src={transformedImage}
                      alt="AI Transformed"
                      onLoad={() => console.log('🖼️ Transformed image loaded successfully')}
                      onError={(e) => {
                        console.error('❌ Transformed image failed to load:', e);
                        console.error('❌ Image src length:', transformedImage?.length);
                        console.error('❌ Image src preview:', transformedImage?.substring(0, 100));
                      }}
                      className="w-full h-auto retro-border"
                      style={{ 
                        minHeight: '200px',
                        display: 'block'
                      }}
                    />
                  </div>
                  <button 
                    onClick={downloadImage}
                    className="retro-button w-full py-2 mb-2"
                  >
                    📥 DOWNLOAD
                  </button>
                  <button 
                    onClick={() => {
                      const newWindow = window.open();
                      if (newWindow) {
                        newWindow.document.write(`<img src="${transformedImage}" style="max-width: 100%; height: auto;" />`);
                      }
                    }}
                    className="retro-button w-full py-2"
                  >
                    🔍 VIEW IN NEW TAB
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* 3D Logo Visualization */}
          <div className="grid-col-12 h-64">
            <AudioReactiveLogo audioFeatures={audioFeatures} />
          </div>
          
        </div>
      </main>

    </div>
  );
}

export default App;