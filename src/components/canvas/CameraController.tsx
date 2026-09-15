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
  resolveWalkPosition,
  resolveWalkStart,
  MARATHAHALLI_OVERVIEW_BOUNDS,
  MARATHAHALLI_WALK_BOUNDS,
  resolveWalkEyeHeight,
  getNearestSourceWalkPoint,
  registerSnapshotWalkRoutes
} from '../../data/marathahalliNavigation';
import { loadMarathahalliSnapshot } from '../../services/marathahalliSnapshot';

interface CameraControllerProps {
  isCinematic: boolean;
  cameraPreset: CameraPreset;
  cameraMode: CameraMode;
  simSpeedMultiplier: number;
}

// The controller deliberately keeps these limits here instead of spreading
// them through the scene. They describe the camera experience, not the map
// geometry: a bird view can inspect a roof or metro deck, while a person view
// stays at eye level and never tumbles below the pavement or into the sky.
const WALK_FOV_DEFAULT = 68;
const WALK_FOV_MIN = 54;
const WALK_FOV_MAX = 78;
const WALK_MIN_PITCH = -0.72;
const WALK_MAX_PITCH = 0.62;
const OVERVIEW_MIN_POLAR = 0.06;
const OVERVIEW_MAX_POLAR = Math.PI * 0.48;
const OVERVIEW_MIN_DISTANCE = 12;
const OVERVIEW_MAX_DISTANCE = 4500;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const easeInOutCubic = (value: number) => (
  value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2
);

export const CameraController: React.FC<CameraControllerProps> = ({
  isCinematic,
  cameraPreset,
  cameraMode,
  simSpeedMultiplier
}) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera, gl } = useThree();

  // Keep the initial camera seed stable for the lifetime of this controller.
  // Preset/mode changes update the target refs below; they must not recreate
  // the rig and snap the camera back to a fresh initial view.
  const [initialView] = React.useState(() => getCameraView(cameraPreset, cameraMode));
  const targetCamPos = useRef(new THREE.Vector3(...initialView.position));
  const targetLookAt = useRef(new THREE.Vector3(...initialView.target));
  const transitionStartPos = useRef(new THREE.Vector3(...initialView.position));
  const transitionStartLookAt = useRef(new THREE.Vector3(...initialView.target));
  const isTransitioning = useRef(false);
  const transitionElapsed = useRef(0);
  const transitionDuration = useRef(0);
  const transitionArcHeight = useRef(0);
  const hasInitializedCamera = useRef(false);
  const cameraPresetRef = useRef(cameraPreset);
  const cameraModeRef = useRef(cameraMode);
  const activeCameraMode = useRef(cameraMode);

  // Person mode is intentionally represented as an orientation, rather than
  // repeatedly extracting Euler angles from the camera. That keeps heading
  // continuous through a 360° turn and lets the walk resolver gently steer a
  // forward walk onto the tangent of the mapped footway.
  const walkForward = useRef(new THREE.Vector3(0, 0, -1));
  const desiredWalkForward = useRef(new THREE.Vector3());
  const actualWalkDelta = useRef(new THREE.Vector3());
  const walkPitch = useRef(0);
  const walkFovTarget = useRef(WALK_FOV_DEFAULT);

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

  const setWalkOrientationFromDirection = (direction: THREE.Vector3) => {
    const horizontalLength = Math.hypot(direction.x, direction.z);
    if (horizontalLength > 0.001) {
      walkForward.current.set(direction.x / horizontalLength, 0, direction.z / horizontalLength);
      walkPitch.current = clamp(
        Math.atan2(direction.y, horizontalLength),
        WALK_MIN_PITCH,
        WALK_MAX_PITCH
      );
    }
  };

  const syncWalkOrientationFromTarget = (position: THREE.Vector3, target: THREE.Vector3) => {
    cameraDirection.current.subVectors(target, position);
    setWalkOrientationFromDirection(cameraDirection.current);
  };

  const updateWalkLookAt = () => {
    const horizontalScale = Math.cos(walkPitch.current);
    cameraDirection.current.set(
      walkForward.current.x * horizontalScale,
      Math.sin(walkPitch.current),
      walkForward.current.z * horizontalScale
    );
    targetLookAt.current.copy(camera.position).addScaledVector(cameraDirection.current, WALK_LOOK_DISTANCE);
    if (controlsRef.current) controlsRef.current.target.copy(targetLookAt.current);
    camera.lookAt(targetLookAt.current);
  };

  const cancelCameraTransition = () => {
    if (!isTransitioning.current) return;
    isTransitioning.current = false;
    transitionElapsed.current = transitionDuration.current;
    // Cancelling is an intentional hand-off to the mode the user selected;
    // do not let a later preset interpret the interrupted flight as a stale
    // bird/person boundary.
    activeCameraMode.current = cameraModeRef.current;
    if (controlsRef.current) {
      controlsRef.current.autoRotate = false;
      controlsRef.current.enabled = cameraModeRef.current === 'overview';
      controlsRef.current.update();
      if (cameraModeRef.current === 'walk') {
        camera.position.y = resolveWalkEyeHeight(camera.position.x, camera.position.z);
        syncWalkOrientationFromTarget(camera.position, controlsRef.current.target);
        updateWalkLookAt();
      }
    }
  };

  const beginCameraTransition = (
    position: [number, number, number],
    target: [number, number, number]
  ) => {
    const controls = controlsRef.current;
    targetCamPos.current.set(...position);
    targetLookAt.current.set(...target);

    if (!hasInitializedCamera.current || !controls) {
      camera.position.copy(targetCamPos.current);
      if (controls) controls.target.copy(targetLookAt.current);
      return;
    }

    transitionStartPos.current.copy(camera.position);
    transitionStartLookAt.current.copy(controls.target);

    const horizontalDistance = Math.hypot(
      targetCamPos.current.x - transitionStartPos.current.x,
      targetCamPos.current.z - transitionStartPos.current.z
    );
    const cameraDistance = transitionStartPos.current.distanceTo(targetCamPos.current);
    const modeChanged = activeCameraMode.current !== cameraModeRef.current;
    const destinationIsWalk = cameraModeRef.current === 'walk';

    // Longer flights get a little more time, but the cap keeps a route-stop
    // click responsive. The small lift is what makes a long preset change read
    // as a deliberate Google-Earth-style flight instead of a camera teleport.
    const travelRate = destinationIsWalk ? 260 : 680;
    const duration = 0.78 + (cameraDistance + horizontalDistance * 0.18) / travelRate;
    transitionDuration.current = clamp(
      duration,
      modeChanged ? 1.05 : 0.82,
      destinationIsWalk ? 3.2 : 4.4
    );
    transitionElapsed.current = 0;
    transitionArcHeight.current = destinationIsWalk
      ? (modeChanged ? clamp(horizontalDistance * 0.035, 8, 26) : clamp(horizontalDistance * 0.018, 0, 14))
      : clamp(horizontalDistance * 0.12 + Math.abs(targetCamPos.current.y - transitionStartPos.current.y) * 0.08, 12, 300);

    isTransitioning.current = true;
    controls.autoRotate = false;
    // OrbitControls keeps its own spherical deltas. Pausing it during the
    // flight prevents a previous drag from fighting the transition.
    controls.enabled = false;
    const dampingWasEnabled = controls.enableDamping;
    controls.enableDamping = false;
    controls.update();
    controls.enableDamping = dampingWasEnabled;
    cameraControlBus.releaseAllInputs();
  };

  // Attach window keyboard listeners for controlled movement & rotation
  useEffect(() => {
    let active = true;
    void loadMarathahalliSnapshot()
      .then((snapshot) => {
        if (active) registerSnapshotWalkRoutes(snapshot.footways);
      })
      .catch(() => {
        // The compact source route fallback remains usable if the snapshot is unavailable.
      });

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input or modal
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          activeEl.tagName === 'BUTTON' ||
          activeEl.tagName === 'A' ||
          activeEl.closest('[role="dialog"], [contenteditable="true"]'))
      ) {
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
        cancelCameraTransition();
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
      beginCameraTransition(view.position, view.target);
    });

    // Register dynamic fly-to handler (e.g. clicking on a store marker or store list item)
    const unsubscribeFlyTo = cameraControlBus.onFlyTo((pos, target) => {
      if (cameraModeRef.current === 'walk') {
        const [safeX, safeZ] = resolveWalkStart(pos[0], pos[2]);
        const view = createWalkView([safeX, WALK_EYE_HEIGHT, safeZ], target);
        beginCameraTransition(view.position, view.target);
      } else {
        beginCameraTransition(pos, target);
      }
    });

    return () => {
      active = false;
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

  // Person mode uses a first-person drag gesture instead of OrbitControls'
  // orbit-around-target gesture. This keeps the eye fixed at street height
  // while still allowing mouse, trackpad, and touch look-around navigation.
  useEffect(() => {
    const canvas = gl.domElement;
    const pointerId = { current: null as number | null };
    const lastPointer = { x: 0, y: 0 };
    const previousTouchAction = canvas.style.touchAction;
    canvas.style.touchAction = 'none';

    const handlePointerDown = (event: PointerEvent) => {
      if (cameraModeRef.current !== 'walk' || event.button !== 0) return;
      pointerId.current = event.pointerId;
      lastPointer.x = event.clientX;
      lastPointer.y = event.clientY;
      camera.getWorldDirection(cameraDirection.current);
      setWalkOrientationFromDirection(cameraDirection.current);
      canvas.setPointerCapture(event.pointerId);
      cancelCameraTransition();
      event.preventDefault();
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (cameraModeRef.current !== 'walk' || pointerId.current !== event.pointerId) return;

      const deltaX = event.clientX - lastPointer.x;
      const deltaY = event.clientY - lastPointer.y;
      lastPointer.x = event.clientX;
      lastPointer.y = event.clientY;

      walkForward.current.applyAxisAngle(worldUp.current, -deltaX * 0.0045).normalize();
      walkPitch.current = clamp(
        walkPitch.current - deltaY * 0.004,
        WALK_MIN_PITCH,
        WALK_MAX_PITCH
      );
      updateWalkLookAt();
      event.preventDefault();
    };

    const handleWheel = (event: WheelEvent) => {
      if (cameraModeRef.current !== 'walk') return;
      cancelCameraTransition();
      // Person mode keeps the eye on the mapped surface, so its zoom is a
      // bounded lens change rather than a dolly that could leave the route.
      walkFovTarget.current = clamp(
        walkFovTarget.current + event.deltaY * 0.025,
        WALK_FOV_MIN,
        WALK_FOV_MAX
      );
      event.preventDefault();
    };

    const clearPointerGesture = () => {
      const activePointerId = pointerId.current;
      pointerId.current = null;
      lastPointer.x = 0;
      lastPointer.y = 0;

      if (activePointerId !== null && canvas.hasPointerCapture(activePointerId)) {
        canvas.releasePointerCapture(activePointerId);
      }
    };

    const releasePointer = (event: PointerEvent) => {
      if (pointerId.current !== event.pointerId) return;
      clearPointerGesture();
    };

    const handleLostPointerCapture = (event: PointerEvent) => {
      // The browser can revoke capture without dispatching pointerup. Clear
      // the drag state so the next person-mode gesture can start cleanly.
      if (pointerId.current === event.pointerId) {
        pointerId.current = null;
        lastPointer.x = 0;
        lastPointer.y = 0;
      }
    };

    canvas.addEventListener('pointerdown', handlePointerDown, { passive: false });
    canvas.addEventListener('pointermove', handlePointerMove, { passive: false });
    canvas.addEventListener('pointerup', releasePointer);
    canvas.addEventListener('pointercancel', releasePointer);
    canvas.addEventListener('lostpointercapture', handleLostPointerCapture);
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      clearPointerGesture();
      canvas.style.touchAction = previousTouchAction;
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', releasePointer);
      canvas.removeEventListener('pointercancel', releasePointer);
      canvas.removeEventListener('lostpointercapture', handleLostPointerCapture);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [gl]);

  // Update the shared, named camera anchor when either the preset or the
  // inspection mode changes. Walk mode derives a short eye-level look vector;
  // overview mode keeps the full orbit/bird's-eye framing.
  useEffect(() => {
    const view = getCameraView(cameraPreset, cameraMode);
    const modeChanged = activeCameraMode.current !== cameraMode;
    if (modeChanged && cameraMode === 'walk') {
      walkFovTarget.current = WALK_FOV_DEFAULT;
    }

    // OrbitControls' auto-rotation is imperative state. Turn it off at the
    // mode boundary as well as in the frame loop so a person-mode switch can
    // never inherit a cinematic orbit for a frame.
    if (cameraMode !== 'overview' && controlsRef.current) {
      controlsRef.current.autoRotate = false;
    }

    // OrbitControls owns the camera after mount. Seed its spherical state from
    // the selected preset so the first frame is aimed at the junction instead
    // of using the camera's default -Z orientation.
    if (!hasInitializedCamera.current && controlsRef.current) {
      camera.position.copy(targetCamPos.current);
      controlsRef.current.target.copy(targetLookAt.current);
      controlsRef.current.update();
      hasInitializedCamera.current = true;
      activeCameraMode.current = cameraMode;
      controlsRef.current.enabled = cameraMode === 'overview';
      if (cameraMode === 'walk') {
        syncWalkOrientationFromTarget(camera.position, controlsRef.current.target);
        camera.position.y = resolveWalkEyeHeight(camera.position.x, camera.position.z);
        updateWalkLookAt();
      }
      isTransitioning.current = false;
      return;
    }

    beginCameraTransition(view.position, view.target);
  }, [cameraPreset, cameraMode]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    const safeDelta = Math.min(delta, 0.1);

    // A wider street-level lens preserves context around a pedestrian while
    // the bird view keeps the more cinematic survey framing. Both transitions
    // are damped so switching modes does not produce a lens pop.
    if (camera instanceof THREE.PerspectiveCamera) {
      const desiredFov = cameraMode === 'walk' ? walkFovTarget.current : 50;
      const nextFov = THREE.MathUtils.damp(camera.fov, desiredFov, 8, safeDelta);
      if (Math.abs(camera.fov - nextFov) > 0.01) {
        camera.fov = nextFov;
        camera.updateProjectionMatrix();
      }
      const desiredNear = cameraMode === 'walk' ? 0.08 : 0.5;
      const desiredFar = cameraMode === 'walk' ? 4500 : 7000;
      if (Math.abs(camera.near - desiredNear) > 0.001 || Math.abs(camera.far - desiredFar) > 0.5) {
        camera.near = desiredNear;
        camera.far = desiredFar;
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
      cancelCameraTransition();

      // Person movement is relative to the persistent heading. Bird movement
      // remains relative to the current camera bearing, as expected for an
      // orbit/map inspection surface.
      if (cameraMode === 'walk') {
        forwardVec.current.copy(walkForward.current);
      } else {
        camera.getWorldDirection(forwardVec.current);
        forwardVec.current.y = 0;
        if (forwardVec.current.lengthSq() > 0.001) {
          forwardVec.current.normalize();
        } else {
          forwardVec.current.set(0, 0, -1);
        }
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
          const previousX = camera.position.x;
          const previousZ = camera.position.z;
          const nextX = previousX + moveVec.current.x * moveSpeed;
          const nextZ = previousZ + moveVec.current.z * moveSpeed;
          const [resolvedX, resolvedZ] = resolveWalkPosition(
            previousX,
            previousZ,
            nextX,
            nextZ
          );
          const deltaX = resolvedX - previousX;
          const deltaZ = resolvedZ - previousZ;
          camera.position.x = resolvedX;
          camera.position.z = resolvedZ;

          // Follow the source way only while the user is walking forward. A
          // reverse or strafe input remains under direct user control. The
          // actual accepted step is used to choose the tangent direction so a
          // bidirectional OSM way never flips the camera at a junction.
          const actualDistance = Math.hypot(deltaX, deltaZ);
          if (actualDistance > 0.01 && isForward && !isBackward) {
            actualWalkDelta.current.set(deltaX / actualDistance, 0, deltaZ / actualDistance);
            const sourceMatch = getNearestSourceWalkPoint(resolvedX, resolvedZ, 12);
            if (sourceMatch) {
              desiredWalkForward.current.set(sourceMatch.tangent[0], 0, sourceMatch.tangent[1]);
              if (desiredWalkForward.current.dot(actualWalkDelta.current) < 0) {
                desiredWalkForward.current.negate();
              }
            } else {
              desiredWalkForward.current.copy(actualWalkDelta.current);
            }
            const headingBlend = 1 - Math.exp(-7 * safeDelta);
            walkForward.current.lerp(desiredWalkForward.current, headingBlend).normalize();
          }
        } else {
          camera.position.addScaledVector(moveVec.current, moveSpeed);
          controls.target.addScaledVector(moveVec.current, moveSpeed);
          camera.position.y = Math.max(0.75, camera.position.y);
          controls.target.y = Math.max(-6, controls.target.y);
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
      cancelCameraTransition();
      const rotSpeed = 1.25 * safeDelta;
      const target = controls.target;

      if (cameraMode === 'walk') {
        // First-person rotation changes only the look vector; the eye stays at
        // 1.7m and the orbit target remains a short, stable look-ahead.
        if (isTurnLeft || isTurnRight) {
          const yawAngle = (isTurnLeft ? 1 : -1) * rotSpeed;
          walkForward.current.applyAxisAngle(worldUp.current, yawAngle).normalize();
        }
        if (isTiltUp || isTiltDown) {
          const tiltAngle = (isTiltUp ? 1 : -1) * rotSpeed;
          walkPitch.current = clamp(
            walkPitch.current + tiltAngle,
            WALK_MIN_PITCH,
            WALK_MAX_PITCH
          );
        }
        updateWalkLookAt();
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

    // 3. Smooth preset transitions. OrbitControls is paused while this runs,
    // so its previous spherical drag state cannot overwrite the flight path.
    if (isTransitioning.current) {
      transitionElapsed.current = Math.min(
        transitionDuration.current,
        transitionElapsed.current + safeDelta
      );
      const progress = transitionDuration.current > 0
        ? transitionElapsed.current / transitionDuration.current
        : 1;
      const easedProgress = easeInOutCubic(Math.min(1, progress));

      camera.position.lerpVectors(
        transitionStartPos.current,
        targetCamPos.current,
        easedProgress
      );
      if (transitionArcHeight.current > 0) {
        camera.position.y += Math.sin(Math.PI * easedProgress) * transitionArcHeight.current;
      }
      controls.target.lerpVectors(
        transitionStartLookAt.current,
        targetLookAt.current,
        easedProgress
      );
      camera.lookAt(controls.target);

      if (progress >= 1) {
        camera.position.copy(targetCamPos.current);
        controls.target.copy(targetLookAt.current);
        activeCameraMode.current = cameraMode;
        controls.enabled = cameraMode === 'overview';
        controls.update();
        if (cameraMode === 'walk') {
          camera.position.y = resolveWalkEyeHeight(camera.position.x, camera.position.z);
          syncWalkOrientationFromTarget(camera.position, controls.target);
          updateWalkLookAt();
        }
        isTransitioning.current = false;
      } else {
        return;
      }
    }

    // 4. Keep person mode physically at the current mapped surface. Damp the
    // vertical component so a verified stair/deck change reads as a step-up,
    // not a camera pop. The look target is rebuilt from the heading/pitch refs
    // after the height settles, keeping the eye-to-horizon relationship fixed.
    if (cameraMode === 'walk' && !isTransitioning.current) {
      const desiredEyeHeight = resolveWalkEyeHeight(camera.position.x, camera.position.z);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, desiredEyeHeight, 14, safeDelta);
      updateWalkLookAt();
    }

    // 5. Auto-orbit only when cinematic mode is explicitly turned ON.
    if (cameraMode === 'overview' && isCinematic && !isTransitioning.current && !hasMoveInput && !hasRotateInput) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.5 * Math.min(2, Math.max(0.4, simSpeedMultiplier * 0.2 + 0.3));
    } else {
      controls.autoRotate = false;
    }

    // Ensure orbit controls updates every settled frame for smooth damping.
    // Person mode leaves the imperative control disabled; calling update()
    // directly still keeps its spherical cache in sync with our look target.
    controls.update();

    // OrbitControls can pan outside the modeled corridor. Keep both the camera
    // and its target inside the bounded local overview envelope. The final
    // camera.lookAt() matters because clamping a world coordinate after the
    // control update must not leave a stale quaternion for the next frame.
    if (cameraMode === 'overview') {
      camera.position.x = Math.max(
        MARATHAHALLI_OVERVIEW_BOUNDS.minX,
        Math.min(MARATHAHALLI_OVERVIEW_BOUNDS.maxX, camera.position.x)
      );
      camera.position.y = Math.max(
        MARATHAHALLI_OVERVIEW_BOUNDS.minY,
        Math.min(MARATHAHALLI_OVERVIEW_BOUNDS.maxY, camera.position.y)
      );
      camera.position.z = Math.max(
        MARATHAHALLI_OVERVIEW_BOUNDS.minZ,
        Math.min(MARATHAHALLI_OVERVIEW_BOUNDS.maxZ, camera.position.z)
      );
      controls.target.x = Math.max(
        MARATHAHALLI_WALK_BOUNDS.minX,
        Math.min(MARATHAHALLI_WALK_BOUNDS.maxX, controls.target.x)
      );
      controls.target.z = Math.max(
        MARATHAHALLI_WALK_BOUNDS.minZ,
        Math.min(MARATHAHALLI_WALK_BOUNDS.maxZ, controls.target.z)
      );
      controls.target.y = Math.max(-6, Math.min(32, controls.target.y));
      camera.lookAt(controls.target);
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.075}
      enableRotate={cameraMode === 'overview'}
      rotateSpeed={0.72}
      enableZoom={cameraMode === 'overview'}
      zoomSpeed={0.9}
      zoomToCursor={cameraMode === 'overview'}
      enablePan={cameraMode === 'overview'}
      panSpeed={0.72}
      // Keep a useful map hemisphere: near-nadir is allowed for roof/metro
      // inspection, but the orbit cannot flip underneath the terrain.
      minPolarAngle={cameraMode === 'walk' ? 0.15 : OVERVIEW_MIN_POLAR}
      maxPolarAngle={cameraMode === 'walk' ? Math.PI - 0.15 : OVERVIEW_MAX_POLAR}
      // Person mode has a fixed eye-to-look distance; overview zoom remains
      // bounded to the local source corridor and its wide corridor preset.
      minDistance={cameraMode === 'walk' ? 0.1 : OVERVIEW_MIN_DISTANCE}
      maxDistance={cameraMode === 'walk' ? 1000 : OVERVIEW_MAX_DISTANCE}
      onStart={() => {
        // As soon as user touches/drags mouse or trackpad, immediately yield 100% control
        cancelCameraTransition();
      }}
    />
  );
};
