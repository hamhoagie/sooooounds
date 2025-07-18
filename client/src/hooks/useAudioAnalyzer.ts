import { useEffect, useRef, useState, useCallback } from 'react';

export interface AudioFeatures {
  volume: number;
  frequency: Float32Array;
  waveform: Float32Array;
  pitch: number;
  centroid: number;
  rolloff: number;
  energy: number;
}

export const useAudioAnalyzer = () => {
  const [audioFeatures, setAudioFeatures] = useState<AudioFeatures>({
    volume: 0,
    frequency: new Float32Array(256),
    waveform: new Float32Array(1024),
    pitch: 0,
    centroid: 0,
    rolloff: 0,
    energy: 0,
  });
  
  const [isListening, setIsListening] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);

  const startAnalysis = useCallback(() => {
    if (!analyzerRef.current) {
      console.log('❌ No analyzer available for analysis');
      return;
    }

    console.log('🔊 Starting audio analysis loop');
    const analyzer = analyzerRef.current;
    const bufferLength = analyzer.frequencyBinCount;
    const frequencyData = new Float32Array(bufferLength);
    const waveformData = new Float32Array(bufferLength);

    const analyze = () => {
      analyzer.getFloatFrequencyData(frequencyData);
      analyzer.getFloatTimeDomainData(waveformData);

      // Calculate volume (RMS)
      let sum = 0;
      for (let i = 0; i < waveformData.length; i++) {
        sum += waveformData[i] * waveformData[i];
      }
      const volume = Math.sqrt(sum / waveformData.length);

      // Calculate spectral centroid
      let weightedSum = 0;
      let magnitudeSum = 0;
      for (let i = 0; i < frequencyData.length; i++) {
        const magnitude = Math.pow(10, frequencyData[i] / 20);
        weightedSum += magnitude * i;
        magnitudeSum += magnitude;
      }
      const centroid = magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;

      // Calculate spectral rolloff (90% of energy)
      let energySum = 0;
      for (let i = 0; i < frequencyData.length; i++) {
        energySum += Math.pow(10, frequencyData[i] / 20);
      }
      const targetEnergy = energySum * 0.9;
      let currentEnergy = 0;
      let rolloff = 0;
      for (let i = 0; i < frequencyData.length; i++) {
        currentEnergy += Math.pow(10, frequencyData[i] / 20);
        if (currentEnergy >= targetEnergy) {
          rolloff = i;
          break;
        }
      }

      // Simple pitch detection (highest magnitude frequency)
      let maxMagnitude = -Infinity;
      let pitch = 0;
      for (let i = 1; i < frequencyData.length / 4; i++) {
        if (frequencyData[i] > maxMagnitude) {
          maxMagnitude = frequencyData[i];
          pitch = i;
        }
      }

      const finalVolume = Math.max(0, Math.min(1, volume * 10));
      
      // Log occasionally to see if we're getting data
      if (Math.random() < 0.01) { // 1% chance to log
        console.log('📊 Audio data:', { volume: finalVolume, pitch, centroid: centroid / frequencyData.length });
      }

      setAudioFeatures({
        volume: finalVolume,
        frequency: frequencyData,
        waveform: waveformData,
        pitch: pitch,
        centroid: centroid / frequencyData.length,
        rolloff: rolloff / frequencyData.length,
        energy: energySum,
      });

      animationRef.current = requestAnimationFrame(analyze);
    };

    analyze();
  }, []);

  const initializeAudio = useCallback(async () => {
    try {
      console.log('🎤 Initializing audio...');
      
      // Create audio context
      audioContextRef.current = new AudioContext();
      console.log('✅ AudioContext created:', audioContextRef.current.state);
      
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ Microphone access granted');
      
      // Create analyzer node
      analyzerRef.current = audioContextRef.current.createAnalyser();
      analyzerRef.current.fftSize = 2048;
      analyzerRef.current.smoothingTimeConstant = 0.8;
      console.log('✅ Analyzer created');
      
      // Connect microphone to analyzer
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyzerRef.current);
      console.log('✅ Audio pipeline connected');
      
      setIsListening(true);
      startAnalysis();
      console.log('✅ Analysis started');
    } catch (error) {
      console.error('❌ Error initializing audio:', error);
    }
  }, [startAnalysis]);

  const stopListening = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    if (sourceRef.current) {
      sourceRef.current.disconnect();
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    setIsListening(false);
  }, []);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    audioFeatures,
    isListening,
    startListening: initializeAudio,
    stopListening,
  };
};