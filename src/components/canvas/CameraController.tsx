import React, { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { CAMERA_DEFAULT_POSITION, CAMERA_DEFAULT_TARGET } from '../../config/location';
import { CameraPreset } from '../../types';
import { cameraControlBus } from '../../services/cameraControlBus';

interface CameraControllerProps {
  isCinematic: boolean;
  cameraPreset: CameraPreset;
  simSpeedMultiplier: number;
}

export const CameraController: React.FC<CameraControllerProps> = ({
  isCinematic,
  cameraPreset,
  simSpeedMultiplier
}) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();

  // Smooth camera position transitions between presets
  const targetCamPos = useRef(new THREE.Vector3(...CAMERA_DEFAULT_POSITION));
  const targetLookAt = useRef(new THREE.Vector3(...CAMERA_DEFAULT_TARGET));
  const isTransitioning = useRef(false);
  const transitionProgress = useRef(0);

  // Active keyboard inputs
  const keys = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
    turnLeft: false,
    turnRight: false,
    tiltUp: false,
    tiltDown: false,
    sprint: false
  });

  // Attach window keyboard listeners for controlled movement & rotation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input or modal
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }

      let handled = false;
      switch (e.code) {
        case 'KeyW':
          keys.current.forward = true;
          handled = true;
          break;
        case 'KeyS':
          keys.current.backward = true;
          handled = true;
          break;
        case 'KeyA':
          keys.current.left = true;
          handled = true;
          break;
        case 'KeyD':
          keys.current.right = true;
          handled = true;
          break;
        case 'KeyE':
        case 'Space':
          keys.current.up = true;
          handled = true;
          break;
        case 'KeyQ':
        case 'KeyC':
          keys.current.down = true;
          handled = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          keys.current.sprint = true;
          handled = true;
          break;
        case 'ArrowLeft':
          keys.current.turnLeft = true;
          handled = true;
          break;
        case 'ArrowRight':
          keys.current.turnRight = true;
          handled = true;
          break;
        case 'ArrowUp':
          keys.current.tiltUp = true;
          handled = true;
          break;
        case 'ArrowDown':
          keys.current.tiltDown = true;
          handled = true;
          break;
      }

      if (handled) {
        isTransitioning.current = false;
        // Prevent default scrolling for arrows and space
        if (e.code.startsWith('Arrow') || e.code === 'Space') {
          e.preventDefault();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
          keys.current.forward = false;
          break;
        case 'KeyS':
          keys.current.backward = false;
          break;
        case 'KeyA':
          keys.current.left = false;
          break;
        case 'KeyD':
          keys.current.right = false;
          break;
        case 'KeyE':
        case 'Space':
          keys.current.up = false;
          break;
        case 'KeyQ':
        case 'KeyC':
          keys.current.down = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          keys.current.sprint = false;
          break;
        case 'ArrowLeft':
          keys.current.turnLeft = false;
          break;
        case 'ArrowRight':
          keys.current.turnRight = false;
          break;
        case 'ArrowUp':
          keys.current.tiltUp = false;
          break;
        case 'ArrowDown':
          keys.current.tiltDown = false;
          break;
      }
    };

    const handleBlur = () => {
      // Clear all keys when window loses focus
      keys.current.forward = false;
      keys.current.backward = false;
      keys.current.left = false;
      keys.current.right = false;
      keys.current.up = false;
      keys.current.down = false;
      keys.current.turnLeft = false;
      keys.current.turnRight = false;
      keys.current.tiltUp = false;
      keys.current.tiltDown = false;
      keys.current.sprint = false;
      cameraControlBus.resetInputs();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    // Register reset view handler
    const unsubscribeReset = cameraControlBus.onResetView(() => {
      targetCamPos.current.set(...CAMERA_DEFAULT_POSITION);
      targetLookAt.current.set(...CAMERA_DEFAULT_TARGET);
      isTransitioning.current = true;
      transitionProgress.current = 0;
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      unsubscribeReset();
    };
  }, []);

  // Update preset targets
  useEffect(() => {
    isTransitioning.current = true;
    transitionProgress.current = 0;

    switch (cameraPreset) {
      case 'underpass':
        // Inside the subterranean underpass trench looking along the tunnel
        targetCamPos.current.set(0, -2.8, 38);
        targetLookAt.current.set(0, -4.8, -15);
        break;
      case 'multiplex':
        // Focused on Innovative Multiplex, entrance marquee, and South Bus Bay
        targetCamPos.current.set(-24, 14, -142);
        targetLookAt.current.set(-35, 4, -180);
        break;
      case 'kalamandir':
        // Focused on Kalamandir silks, Brand Factory, and Marathahalli Metro Station
        targetCamPos.current.set(22, 16, 68);
        targetLookAt.current.set(38, 6, 105);
        break;
      case 'spicegarden':
        // Focused on Spice Garden BMTC bus stop, Iyengar bakery, and roadside bazaar
        targetCamPos.current.set(205, 12, 6);
        targetLookAt.current.set(242, 3, 16);
        break;
      case 'crossover':
        // Wide elevated 3-tier view showing Underpass, Surface crossroads, ROB bridge, and Metro viaduct
        targetCamPos.current.set(-68, 48, 68);
        targetLookAt.current.set(15, 6, 0);
        break;
      case 'surface':
      case 'ground':
        // Street-level at the surface crossroads looking at traffic signals & pedestrian crossing
        targetCamPos.current.set(-28, 4.5, 18);
        targetLookAt.current.set(0, 1.0, 0);
        break;
      case 'aerial':
        // Plan bird's-eye architectural view from directly above
        targetCamPos.current.set(0, 145, 0.1);
        targetLookAt.current.set(0, 0, 0);
        break;
      case 'overview':
      case 'cinematic':
      case 'flyover':
      default:
        // Elevated isometric overview showing both the underground underpass trench & surface crossroads
        targetCamPos.current.set(-42, 32, 52);
        targetLookAt.current.set(0, -1.5, 0);
        break;
    }
  }, [cameraPreset]);

  useFrame((_, delta) => {
    if (!controlsRef.current) return;

    const safeDelta = Math.min(delta, 0.1);

    // 1. Check for Active Movement Inputs (Keyboard WASD or HUD NavPad)
    const busState = cameraControlBus.state;
    const isForward = keys.current.forward || busState.forward;
    const isBackward = keys.current.backward || busState.backward;
    const isLeft = keys.current.left || busState.left;
    const isRight = keys.current.right || busState.right;
    const isUp = keys.current.up || busState.up;
    const isDown = keys.current.down || busState.down;

    const hasMoveInput = isForward || isBackward || isLeft || isRight || isUp || isDown;

    if (hasMoveInput) {
      isTransitioning.current = false;

      // Compute horizontal forward vector from camera orientation
      const forwardVec = new THREE.Vector3();
      camera.getWorldDirection(forwardVec);
      forwardVec.y = 0;
      if (forwardVec.lengthSq() > 0.001) {
        forwardVec.normalize();
      } else {
        forwardVec.set(0, 0, -1);
      }

      // Compute horizontal right vector (perpendicular to forward and world Y)
      const rightVec = new THREE.Vector3().crossVectors(forwardVec, new THREE.Vector3(0, 1, 0)).normalize();

      const moveVec = new THREE.Vector3(0, 0, 0);
      if (isForward) moveVec.add(forwardVec);
      if (isBackward) moveVec.sub(forwardVec);
      if (isRight) moveVec.add(rightVec);
      if (isLeft) moveVec.sub(rightVec);
      if (isUp) moveVec.y += 1;
      if (isDown) moveVec.y -= 1;

      if (moveVec.lengthSq() > 0) {
        moveVec.normalize();
        const baseSpeed = 32; // world units / sec
        const sprintMultiplier = (keys.current.sprint ? 2.5 : 1.0) * busState.speedMultiplier;
        const step = baseSpeed * sprintMultiplier * safeDelta;

        // Move BOTH camera position and orbit target together to preserve orientation
        camera.position.addScaledVector(moveVec, step);
        controlsRef.current.target.addScaledVector(moveVec, step);
      }
    }

    // 2. Check for Active Rotation Inputs (Arrow keys or HUD NavPad)
    const isTurnLeft = keys.current.turnLeft || busState.turnLeft;
    const isTurnRight = keys.current.turnRight || busState.turnRight;
    const isTiltUp = keys.current.tiltUp || busState.tiltUp;
    const isTiltDown = keys.current.tiltDown || busState.tiltDown;

    const hasRotateInput = isTurnLeft || isTurnRight || isTiltUp || isTiltDown;

    if (hasRotateInput) {
      isTransitioning.current = false;
      const rotSpeed = 1.6 * safeDelta * (keys.current.sprint ? 2.0 : 1.0) * busState.speedMultiplier;
      const target = controlsRef.current.target;
      const offset = camera.position.clone().sub(target);

      // Horizontal yaw rotation around world Y
      if (isTurnLeft) {
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotSpeed);
      }
      if (isTurnRight) {
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), -rotSpeed);
      }

      // Vertical pitch rotation around camera's local right vector
      if (isTiltUp || isTiltDown) {
        let camRight = new THREE.Vector3().crossVectors(offset, new THREE.Vector3(0, 1, 0));
        if (camRight.lengthSq() < 0.0001) {
          camRight = new THREE.Vector3(1, 0, 0);
        } else {
          camRight.normalize();
        }
        const tiltAngle = (isTiltUp ? 1 : -1) * rotSpeed;
        offset.applyAxisAngle(camRight, tiltAngle);
      }

      camera.position.copy(target).add(offset);
      camera.lookAt(target);
    }

    // 3. Smooth Preset Transitions (when triggered and not interrupted)
    if (isTransitioning.current) {
      transitionProgress.current += delta * 2.8;
      const t = Math.min(1, transitionProgress.current);

      camera.position.lerp(targetCamPos.current, 0.12);
      controlsRef.current.target.lerp(targetLookAt.current, 0.12);

      // Once close enough or time elapsed, yield complete unhindered control to the user
      if (camera.position.distanceTo(targetCamPos.current) < 0.25 || t >= 1) {
        isTransitioning.current = false;
      }
    }

    // 4. Auto-orbit only when cinematic mode is explicitly turned ON
    if (isCinematic && !isTransitioning.current && !hasMoveInput && !hasRotateInput) {
      controlsRef.current.autoRotate = true;
      controlsRef.current.autoRotateSpeed = 0.5 * Math.min(2, Math.max(0.4, simSpeedMultiplier * 0.2 + 0.3));
    } else {
      controlsRef.current.autoRotate = false;
    }

    // Ensure orbit controls updates every frame for smooth damping
    controlsRef.current.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      enableRotate={true}
      rotateSpeed={0.85}
      enableZoom={true}
      zoomSpeed={1.1}
      enablePan={true}
      panSpeed={0.85}
      // Completely unrestricted vertical angles:
      // minPolarAngle 0.001 allows viewing straight down (overhead aerial)
      // maxPolarAngle Math.PI - 0.001 allows viewing straight up (looking up at elevated flyover, metro viaduct, buildings & sky)
      minPolarAngle={0.001}
      maxPolarAngle={Math.PI - 0.001}
      minDistance={1.5} // Allow zooming directly into road level, vehicles, and underpass
      maxDistance={500} // Allow wide aerial digital twin panorama
      onStart={() => {
        // As soon as user touches/drags mouse or trackpad, immediately yield 100% control
        isTransitioning.current = false;
      }}
    />
  );
};
