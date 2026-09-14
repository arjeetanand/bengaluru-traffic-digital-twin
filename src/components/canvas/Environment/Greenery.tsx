import React, { useMemo, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';

interface GreeneryProps {
  isRaining: boolean;
}

export const Greenery: React.FC<GreeneryProps> = ({ isRaining }) => {
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const canopyRef = useRef<THREE.InstancedMesh>(null);

  // Generate tree positions along boulevards, medians, and corners
  const treePositions = useMemo(() => {
    const coords: [number, number, number, number][] = []; // x, y, z, scale

    // Along ORR East sidewalk (X ~ 18)
    for (let z = -140; z <= 140; z += 14) {
      if (Math.abs(z) > 18) {
        coords.push([18.5, 0, z, 0.85 + Math.sin(z) * 0.25]);
      }
    }
    // Along ORR West sidewalk (X ~ -18)
    for (let z = -140; z <= 140; z += 14) {
      if (Math.abs(z) > 18) {
        coords.push([-18.5, 0, z, 0.85 + Math.cos(z) * 0.25]);
      }
    }
    // Along Old Airport Road North sidewalk (Z ~ 16)
    for (let x = -140; x <= 140; x += 14) {
      if (Math.abs(x) > 20) {
        coords.push([x, 0, 16.5, 0.85 + Math.sin(x) * 0.25]);
      }
    }
    // Along Old Airport Road South sidewalk (Z ~ -16)
    for (let x = -140; x <= 140; x += 14) {
      if (Math.abs(x) > 20) {
        coords.push([x, 0, -16.5, 0.85 + Math.cos(x) * 0.25]);
      }
    }

    // Corner park clusters in the quadrants
    const corners = [
      [28, 28], [-28, 28], [28, -28], [-28, -28],
      [36, 42], [-36, 42], [36, -42], [-36, -42],
      [42, 34], [-42, 34], [42, -34], [-42, -34]
    ];
    corners.forEach(([cx, cz], i) => {
      coords.push([cx, 0, cz, 1.1 + (i % 3) * 0.2]);
    });

    return coords;
  }, []);

  useLayoutEffect(() => {
    if (!trunkRef.current || !canopyRef.current) return;

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const greenPalette = ['#15803d', '#166534', '#14532d', '#1e3a1e', '#16a34a'];

    treePositions.forEach(([x, y, z, scale], idx) => {
      // Trunk instance
      dummy.position.set(x, y + (2.5 * scale) / 2, z);
      dummy.scale.set(scale, scale, scale);
      dummy.rotation.set(0, idx * 0.5, 0);
      dummy.updateMatrix();
      trunkRef.current?.setMatrixAt(idx, dummy.matrix);

      // Canopy instance
      dummy.position.set(x, y + 2.4 * scale, z);
      dummy.scale.set(scale * 1.2, scale * 1.1, scale * 1.2);
      dummy.updateMatrix();
      canopyRef.current?.setMatrixAt(idx, dummy.matrix);

      // Color variation
      color.set(greenPalette[idx % greenPalette.length]);
      if (isRaining) color.multiplyScalar(0.75); // Darker lush wet foliage
      canopyRef.current?.setColorAt(idx, color);
    });

    trunkRef.current.instanceMatrix.needsUpdate = true;
    canopyRef.current.instanceMatrix.needsUpdate = true;
    if (canopyRef.current.instanceColor) canopyRef.current.instanceColor.needsUpdate = true;
  }, [treePositions, isRaining]);

  return (
    <group name="InstancedGreenery">
      {/* Trunks */}
      <instancedMesh
        ref={trunkRef}
        args={[undefined, undefined, treePositions.length]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.2, 0.35, 2.5, 6]} />
        <meshStandardMaterial color="#4a3728" roughness={0.9} />
      </instancedMesh>

      {/* Canopies */}
      <instancedMesh
        ref={canopyRef}
        args={[undefined, undefined, treePositions.length]}
        castShadow
        receiveShadow
      >
        <dodecahedronGeometry args={[1.8, 1]} />
        <meshStandardMaterial roughness={0.85} metalness={0.05} />
      </instancedMesh>
    </group>
  );
};
