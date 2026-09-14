import React, { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { CameraMode, CameraPreset } from '../../types';
import { cameraControlBus } from '../../services/cameraControlBus';
import {
  WALK_EYE_HEIGHT,
  WALK_LOOK_DISTANCE,
  createWalkView,
  getCameraView,
  resolveWalkPosition
} from '../../data/marathahalliNavigation';

interface CameraControllerProps {
  isCinematic: boolean;
  cameraPreset: CameraPreset;
  cameraMode: CameraMode;
  simSpeedMultiplier: number;
}

export const CameraController: React.FC<CameraControllerProps> = ({
  isCinematic,
  cameraPreset,
  cameraMode,
  simSpeedMultiplier
}) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();

  // Smooth camera position transitions between presets
  const initialView = getCameraView(cameraPreset, cameraMode);
  const targetCamPos = useRef(new THREE.Vector3(...initialView.position));
  const targetLookAt = useRef(new THREE.Vector3(...initialView.target));
  const isTransitioning = useRef(false);
  const transitionProgress = useRef(0);
  const hasInitializedCamera = useRef(false);
  const cameraPresetRef = useRef(cameraPreset);
  const cameraModeRef = useRef(cameraMode);

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

  // Reuse transient vectors in the render loop to keep inspection controls
  // responsive while the scene is simulating many vehicles.
  const forwardVec = useRef(new THREE.Vector3());
  const rightVec = useRef(new THREE.Vector3());
  const moveVec = useRef(new THREE.Vector3());
  const worldUp = useRef(new THREE.Vector3(0, 1, 0));
  const cameraRight = useRef(new THREE.Vector3());
  const cameraDirection = useRef(new THREE.Vector3());
  const cameraOffset = useRef(new THREE.Vector3());

  cameraPresetRef.current = cameraPreset;
  cameraModeRef.current = cameraMode;

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
      cameraControlBus.releaseAllInputs();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('visibilitychange', handleBlur);
    window.addEventListener('pagehide', handleBlur);

    // Register reset view handler
    const unsubscribeReset = cameraControlBus.onResetView(() => {
      const view = getCameraView(cameraPresetRef.current, cameraModeRef.current);
      targetCamPos.current.set(...view.position);
      targetLookAt.current.set(...view.target);
      isTransitioning.current = true;
      transitionProgress.current = 0;
      cameraControlBus.releaseAllInputs();
    });

    // Register dynamic fly-to handler (e.g. clicking on a store marker or store list item)
    const unsubscribeFlyTo = cameraControlBus.onFlyTo((pos, target) => {
      const view = cameraModeRef.current === 'walk' ? createWalkView(pos, target) : { position: pos, target };
      targetCamPos.current.set(...view.position);
      targetLookAt.current.set(...view.target);
      isTransitioning.current = true;
      transitionProgress.current = 0;
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('visibilitychange', handleBlur);
      window.removeEventListener('pagehide', handleBlur);
      cameraControlBus.releaseAllInputs();
      unsubscribeReset();
      unsubscribeFlyTo();
    };
  }, []);

  // Update the shared, named camera anchor when either the preset or the
  // inspection mode changes. Walk mode derives a short eye-level look vector;
  // overview mode keeps the full orbit/bird's-eye framing.
  useEffect(() => {
    const view = getCameraView(cameraPreset, cameraMode);
    targetCamPos.current.set(...view.position);
    targetLookAt.current.set(...view.target);
    isTransitioning.current = true;
    transitionProgress.current = 0;

    // OrbitControls owns the camera after mount. Seed its spherical state from
    // the selected preset so the first frame is aimed at the junction instead
    // of using the camera's default -Z orientation.
    if (!hasInitializedCamera.current && controlsRef.current) {
      camera.position.copy(targetCamPos.current);
      controlsRef.current.target.copy(targetLookAt.current);
      controlsRef.current.update();
      hasInitializedCamera.current = true;
      isTransitioning.current = false;
    }
  }, [cameraPreset, cameraMode]);

  useFrame((_, delta) => {
    if (!controlsRef.current) return;

    const safeDelta = Math.min(delta, 0.1);

    // A wider street-level lens preserves context around a pedestrian while
    // the bird view keeps the more cinematic survey framing.
    if (camera instanceof THREE.PerspectiveCamera) {
      const desiredFov = cameraMode === 'walk' ? 68 : 50;
      if (Math.abs(camera.fov - desiredFov) > 0.1) {
        camera.fov = desiredFov;
        camera.updateProjectionMatrix();
      }
    }

    // 1. Check for Active Movement Inputs (Keyboard WASD or HUD NavPad)
    const busState = cameraControlBus.state;
    const isForward = keys.current.forward || busState.forward;
    const isBackward = keys.current.backward || busState.backward;
    const isLeft = keys.current.left || busState.left;
    const isRight = keys.current.right || busState.right;
    const isUp = cameraMode === 'overview' && (keys.current.up || busState.up);
    const isDown = cameraMode === 'overview' && (keys.current.down || busState.down);

    const hasMoveInput = isForward || isBackward || isLeft || isRight || isUp || isDown;

    if (hasMoveInput) {
      isTransitioning.current = false;

      // Compute horizontal forward vector from camera orientation
      camera.getWorldDirection(forwardVec.current);
      forwardVec.current.y = 0;
      if (forwardVec.current.lengthSq() > 0.001) {
        forwardVec.current.normalize();
      } else {
        forwardVec.current.set(0, 0, -1);
      }

      // Compute horizontal right vector (perpendicular to forward and world Y)
      rightVec.current.crossVectors(forwardVec.current, worldUp.current).normalize();

      moveVec.current.set(0, 0, 0);
      if (isForward) moveVec.current.add(forwardVec.current);
      if (isBackward) moveVec.current.sub(forwardVec.current);
      if (isRight) moveVec.current.add(rightVec.current);
      if (isLeft) moveVec.current.sub(rightVec.current);
      if (cameraMode === 'overview') {
        if (isUp) moveVec.current.y += 1;
        if (isDown) moveVec.current.y -= 1;
      }

      if (moveVec.current.lengthSq() > 0) {
        moveVec.current.normalize();
        const moveSpeed = (cameraMode === 'walk'
          ? (keys.current.sprint ? 7 : 3.2)
          : (keys.current.sprint ? 50 : 25)) * busState.speedMultiplier * safeDelta;

        if (cameraMode === 'walk') {
          const nextX = camera.position.x + moveVec.current.x * moveSpeed;
          const nextZ = camera.position.z + moveVec.current.z * moveSpeed;
          const [resolvedX, resolvedZ] = resolveWalkPosition(
            camera.position.x,
            camera.position.z,
            nextX,
            nextZ
          );
          const deltaX = resolvedX - camera.position.x;
          const deltaZ = resolvedZ - camera.position.z;
          camera.position.x = resolvedX;
          camera.position.z = resolvedZ;
          camera.position.y = WALK_EYE_HEIGHT;
          controlsRef.current.target.x += deltaX;
          controlsRef.current.target.z += deltaZ;
          controlsRef.current.target.y = Math.max(-3, Math.min(8, controlsRef.current.target.y));
        } else {
          camera.position.addScaledVector(moveVec.current, moveSpeed);
          controlsRef.current.target.addScaledVector(moveVec.current, moveSpeed);
          camera.position.y = Math.max(0.75, camera.position.y);
          controlsRef.current.target.y = Math.max(-6, controlsRef.current.target.y);
        }
      }
    }

    // 2. Check for Active Rotation Inputs
    const isTurnLeft = keys.current.turnLeft || busState.turnLeft;
    const isTurnRight = keys.current.turnRight || busState.turnRight;
    const isTiltUp = keys.current.tiltUp || busState.tiltUp;
    const isTiltDown = keys.current.tiltDown || busState.tiltDown;

    const hasRotateInput = isTurnLeft || isTurnRight || isTiltUp || isTiltDown;

    if (hasRotateInput) {
      isTransitioning.current = false;
      const rotSpeed = 1.4 * safeDelta;
      const target = controlsRef.current.target;

      if (cameraMode === 'walk') {
        // First-person rotation changes only the look vector; the eye stays at
        // 1.7m and the orbit target remains a short, stable look-ahead.
        camera.getWorldDirection(cameraDirection.current);
        if (isTurnLeft || isTurnRight) {
          const yawAngle = (isTurnLeft ? 1 : -1) * rotSpeed;
          cameraDirection.current.applyAxisAngle(worldUp.current, yawAngle);
        }
        if (isTiltUp || isTiltDown) {
          cameraRight.current.crossVectors(cameraDirection.current, worldUp.current);
          if (cameraRight.current.lengthSq() > 0.001) cameraRight.current.normalize();
          const tiltAngle = (isTiltUp ? 1 : -1) * rotSpeed;
          cameraDirection.current.applyAxisAngle(cameraRight.current, tiltAngle);
        }
        cameraDirection.current.normalize();
        camera.position.y = WALK_EYE_HEIGHT;
        target.copy(camera.position).addScaledVector(cameraDirection.current, WALK_LOOK_DISTANCE);
        camera.lookAt(target);
      } else {
        cameraOffset.current.copy(camera.position).sub(target);

        if (isTurnLeft || isTurnRight) {
          const yawAngle = (isTurnLeft ? 1 : -1) * rotSpeed;
          cameraOffset.current.applyAxisAngle(worldUp.current, yawAngle);
        }

        if (isTiltUp || isTiltDown) {
          camera.getWorldDirection(cameraDirection.current);
          cameraRight.current.crossVectors(cameraDirection.current, worldUp.current);
          if (cameraRight.current.lengthSq() > 0.001) cameraRight.current.normalize();
          const tiltAngle = (isTiltUp ? 1 : -1) * rotSpeed;
          cameraOffset.current.applyAxisAngle(cameraRight.current, tiltAngle);
        }

        camera.position.copy(target).add(cameraOffset.current);
        camera.lookAt(target);
      }
    }

    // 3. Smooth Preset Transitions
    if (isTransitioning.current) {
      transitionProgress.current += safeDelta * 2.5;
      const t = Math.min(1, transitionProgress.current);

      camera.position.lerp(targetCamPos.current, cameraMode === 'walk' ? 0.18 : 0.25);
      controlsRef.current.target.lerp(targetLookAt.current, cameraMode === 'walk' ? 0.18 : 0.25);

      if (t >= 1 || camera.position.distanceTo(targetCamPos.current) < 0.2) {
        camera.position.copy(targetCamPos.current);
        controlsRef.current.target.copy(targetLookAt.current);
        controlsRef.current.update();
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
    if (cameraMode === 'walk') {
      camera.position.y = WALK_EYE_HEIGHT;
    } else if (camera.position.y < 0.75) {
      camera.position.y = 0.75;
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      enableRotate={cameraMode === 'overview'}
      rotateSpeed={0.85}
      enableZoom={cameraMode === 'overview'}
      zoomSpeed={1.1}
      enablePan={cameraMode === 'overview'}
      panSpeed={0.85}
      // Completely unrestricted vertical angles:
      // minPolarAngle 0.001 allows viewing straight down (overhead aerial)
      // maxPolarAngle Math.PI - 0.001 allows viewing straight up (looking up at elevated flyover, metro viaduct, buildings & sky)
      minPolarAngle={cameraMode === 'walk' ? 0.15 : 0.001}
      maxPolarAngle={cameraMode === 'walk' ? Math.PI - 0.15 : Math.PI - 0.001}
      // Keep walk-mode transitions unconstrained while OrbitControls is still
      // settling from a bird view. Zoom/rotate/pan are disabled in this mode,
      // and the render loop restores the fixed eight-metre look-ahead after
      // every first-person turn.
      minDistance={cameraMode === 'walk' ? 0.1 : 1.5}
      maxDistance={cameraMode === 'walk' ? 1000 : 500}
      onStart={() => {
        // As soon as user touches/drags mouse or trackpad, immediately yield 100% control
        isTransitioning.current = false;
      }}
    />
  );
};
