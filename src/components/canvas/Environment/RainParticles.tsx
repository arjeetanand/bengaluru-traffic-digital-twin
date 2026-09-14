import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface RainParticlesProps {
  isRaining: boolean;
}

export const RainParticles: React.FC<RainParticlesProps> = ({ isRaining }) => {
  const count = 3500;
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Initial random positions for rain streaks
  const rainData = useMemo(() => {
    const data: { x: number; y: number; z: number; speed: number }[] = [];
    for (let i = 0; i < count; i++) {
      data.push({
        x: (Math.random() - 0.5) * 240,
        y: Math.random() * 80,
        z: (Math.random() - 0.5) * 240,
        speed: 45 + Math.random() * 25
      });
    }
    return data;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    if (!isRaining || !meshRef.current) return;

    for (let i = 0; i < count; i++) {
      const p = rainData[i];
      p.y -= p.speed * delta;
      // Slanted wind drift
      p.x -= 8.0 * delta;

      if (p.y < 0) {
        p.y = 70 + Math.random() * 15;
        p.x = (Math.random() - 0.5) * 240;
        p.z = (Math.random() - 0.5) * 240;
      }

      dummy.position.set(p.x, p.y, p.z);
      // Slight slant in wind direction
      dummy.rotation.set(0.05, 0, 0.12);
      dummy.scale.set(0.04, 1.8, 0.04);
      dummy.updateMatrix();

      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (!isRaining) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#a5c4e8" transparent opacity={0.55} depthWrite={false} />
    </instancedMesh>
  );
};
