'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface CrystalProps {
  level: number;
  rankColor: string;
}

function Crystal({ level, rankColor }: CrystalProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.1;
    }
  });

  // Scale based on level
  const scale = 0.8 + (level / 100) * 0.5;
  
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[2, 2, 2]} intensity={1} color={rankColor} />
      <pointLight position={[-2, -2, -2]} intensity={0.5} color="#4a9eff" />
      
      <mesh ref={meshRef} scale={scale}>
        <octahedronGeometry args={[1, 0]} />
        <MeshDistortMaterial
          color={rankColor}
          transparent
          opacity={0.8}
          distort={0.2}
          speed={2}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>
      
      {/* Glow effect */}
      <mesh scale={scale * 1.2}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial
          color={rankColor}
          transparent
          opacity={0.1}
          wireframe
        />
      </mesh>
    </>
  );
}

export default function Crystal3D({ level, rankColor }: CrystalProps) {
  return (
    <div style={{ width: '100%', height: '120px' }}>
      <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
        <Crystal level={level} rankColor={rankColor} />
      </Canvas>
    </div>
  );
}

