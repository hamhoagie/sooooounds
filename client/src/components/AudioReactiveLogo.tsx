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
    
    // Color shift based on pitch
    if (meshRef.current.material instanceof THREE.MeshStandardMaterial) {
      const hue = (pitch / 256) * 0.3; // Map pitch to green spectrum
      meshRef.current.material.color.setHSL(hue, 0.8, 0.6);
    }
  });

  return (
    <group>
      {/* Main logo geometry */}
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial 
          color="#4a7c2c" 
          wireframe={true}
          transparent={true}
          opacity={0.8}
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
          color="#4a7c2c"
          size={0.05}
          transparent={true}
          opacity={0.6}
        />
      </points>
      
      {/* Text elements */}
      <Text
        position={[0, -3, 0]}
        fontSize={0.5}
        color="#ffffff"
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
          antialias: false, // Keep it pixelated
          alpha: true,
          powerPreference: "high-performance"
        }}
      >
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#4a7c2c" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ffffff" />
        
        <LogoMesh audioFeatures={audioFeatures} />
      </Canvas>
    </div>
  );
}