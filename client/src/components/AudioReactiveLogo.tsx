import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { AudioFeatures } from '../hooks/useAudioAnalyzer';

interface LogoMeshProps {
  audioFeatures: AudioFeatures;
}

function LogoMesh({ audioFeatures }: LogoMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  
  // Create particle system
  const particles = useMemo(() => {
    const count = 100;
    const positions = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    
    return positions;
  }, []);

  useFrame((state) => {
    if (!meshRef.current || !particlesRef.current) return;

    const { volume, centroid, pitch } = audioFeatures;
    
    // Scale based on volume
    const scale = 1 + volume * 0.5;
    meshRef.current.scale.setScalar(scale);
    
    // Rotate based on spectral centroid
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.5 + centroid * Math.PI;
    meshRef.current.rotation.x = centroid * Math.PI * 0.5;
    
    // Particle movement based on audio
    const positions = particlesRef.current.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const i3 = i * 3;
      
      // Create wave motion based on frequency data
      const frequencyIndex = Math.floor((i / positions.count) * audioFeatures.frequency.length);
      const frequency = audioFeatures.frequency[frequencyIndex] || 0;
      const normalizedFreq = Math.max(0, (frequency + 100) / 100); // Normalize dB to 0-1
      
      positions.array[i3 + 1] += Math.sin(state.clock.elapsedTime * 2 + i * 0.1) * normalizedFreq * 0.1;
      positions.array[i3] += Math.cos(state.clock.elapsedTime + i * 0.1) * volume * 0.05;
    }
    positions.needsUpdate = true;
    
    // Color shift based on pitch - early 2000's blue/gray palette
    if (meshRef.current.material instanceof THREE.MeshStandardMaterial) {
      const hue = 0.6 + (pitch / 256) * 0.2; // Map pitch to blue spectrum
      meshRef.current.material.color.setHSL(hue, 0.6, 0.5);
    }
  });

  return (
    <group>
      {/* Main logo geometry */}
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial 
          color="#0066cc" 
          wireframe={true}
          transparent={true}
          opacity={0.7}
        />
      </mesh>
      
      {/* Particle system */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particles.length / 3}
            array={particles}
            itemSize={3}
            args={[particles, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#0066cc"
          size={0.08}
          transparent={true}
          opacity={0.5}
        />
      </points>
      
      {/* Text elements */}
      <Text
        position={[0, -3, 0]}
        fontSize={0.5}
        color="#000000"
        anchorX="center"
        anchorY="middle"
      >
        soooounds
      </Text>
    </group>
  );
}

interface AudioReactiveLogoProps {
  audioFeatures: AudioFeatures;
  className?: string;
}

export function AudioReactiveLogo({ audioFeatures, className = '' }: AudioReactiveLogoProps) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ 
          antialias: true, // Smooth rendering for early 2000's look
          alpha: true,
          powerPreference: "high-performance"
        }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.8} color="#0066cc" />
        <pointLight position={[-10, -10, -10]} intensity={0.4} color="#cccccc" />
        
        <LogoMesh audioFeatures={audioFeatures} />
      </Canvas>
    </div>
  );
}