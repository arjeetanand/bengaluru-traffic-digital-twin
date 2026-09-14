import React, { useState, useEffect } from 'react';
import {
  Compass,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  RotateCw,
  ArrowUp,
  ArrowDown,
  Crosshair,
  Gauge,
  X,
  Move
} from 'lucide-react';
import { cameraControlBus, CameraInputState } from '../../services/cameraControlBus';
import { CameraMode } from '../../types';

interface NavigationWidgetProps {
  cameraMode: CameraMode;
}

export const NavigationWidget: React.FC<NavigationWidgetProps> = ({ cameraMode }) => {
  const [isOpen, setIsOpen] = useState(() => (
    typeof window === 'undefined' || !window.matchMedia('(max-width: 900px)').matches
  ));
  const [speedMultiplier, setSpeedMultiplier] = useState<1 | 2 | 4>(1);
  const [activeButton, setActiveButton] = useState<string | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 900px)');
    const closeForCompactViewport = (event?: MediaQueryListEvent) => {
      if (event?.matches ?? mediaQuery.matches) setIsOpen(false);
    };

    closeForCompactViewport();
    // Some embedded surfaces apply their viewport override just after the
    // first paint; re-check once so the full pad does not flash open there.
    const delayedViewportCheck = window.setTimeout(closeForCompactViewport, 250);
    mediaQuery.addEventListener('change', closeForCompactViewport);
    return () => {
      window.clearTimeout(delayedViewportCheck);
      mediaQuery.removeEventListener('change', closeForCompactViewport);
    };
  }, []);

  useEffect(() => {
    cameraControlBus.setInput({ speedMultiplier });
  }, [speedMultiplier]);

  useEffect(() => {
    const handleGlobalPointerUp = () => {
      setActiveButton(null);
      cameraControlBus.releaseAllInputs();
    };
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, []);

  const handlePointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
    key: keyof CameraInputState,
    buttonId: string
  ) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setActiveButton(buttonId);
    cameraControlBus.setInput({ [key]: true });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>, key: keyof CameraInputState) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setActiveButton(null);
    cameraControlBus.setInput({ [key]: false });
  };

  const handlePointerCancel = () => {
    setActiveButton(null);
    cameraControlBus.releaseAllInputs();
  };

  const handleResetCenter = () => {
    cameraControlBus.triggerResetView();
  };

  const toggleSpeed = () => {
    const nextSpeed = speedMultiplier === 1 ? 2 : speedMultiplier === 2 ? 4 : 1;
    setSpeedMultiplier(nextSpeed);
  };

  if (!isOpen) {
    return (
      <div className="nav-widget-minimized">
        <button
          className="nav-minimize-btn"
          onClick={() => setIsOpen(true)}
          aria-label="Open camera controller"
          title="Open 3D Camera Movement & Rotation Pad"
        >
          <Compass size={16} />
          <span>NAV PAD</span>
        </button>
      </div>
    );
  }

  return (
    <div className="nav-widget-card">
      <div className="nav-widget-header">
        <div className="nav-widget-title">
          <Compass size={13} className="text-cyan" />
          <span>{cameraMode === 'walk' ? 'PERSON NAVIGATION' : 'BIRD NAVIGATION'}</span>
        </div>
        <button
          className="nav-close-btn"
          onClick={() => setIsOpen(false)}
          aria-label="Minimize camera controller"
          title="Minimize Navigation Pad"
        >
          <X size={12} />
        </button>
      </div>

      <div className="nav-widget-body">
        {/* Dual Pad Section: Move & Rotate */}
        <div className="nav-pads-row">
          {/* Movement D-Pad */}
          <div className="nav-pad-cluster">
            <div className="nav-cluster-label">
              <Move size={10} />
              <span>MOVE (WASD)</span>
            </div>
            <div className="d-pad-grid">
              <div />
              <button
                className={`d-pad-btn ${activeButton === 'fwd' ? 'btn-active' : ''}`}
                onPointerDown={(event) => handlePointerDown(event, 'forward', 'fwd')}
                onPointerUp={(event) => handlePointerUp(event, 'forward')}
                onPointerCancel={handlePointerCancel}
                aria-label="Move forward"
                title="Move Forward [W]"
              >
                <ChevronUp size={16} />
              </button>
              <div />

              <button
                className={`d-pad-btn ${activeButton === 'left' ? 'btn-active' : ''}`}
                onPointerDown={(event) => handlePointerDown(event, 'left', 'left')}
                onPointerUp={(event) => handlePointerUp(event, 'left')}
                onPointerCancel={handlePointerCancel}
                aria-label="Strafe left"
                title="Strafe Left [A]"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                className="d-pad-btn center-btn"
                onClick={handleResetCenter}
                aria-label="Center camera view"
                title="Center View [Reset]"
              >
                <Crosshair size={13} />
              </button>
              <button
                className={`d-pad-btn ${activeButton === 'right' ? 'btn-active' : ''}`}
                onPointerDown={(event) => handlePointerDown(event, 'right', 'right')}
                onPointerUp={(event) => handlePointerUp(event, 'right')}
                onPointerCancel={handlePointerCancel}
                aria-label="Strafe right"
                title="Strafe Right [D]"
              >
                <ChevronRight size={16} />
              </button>

              <div />
              <button
                className={`d-pad-btn ${activeButton === 'back' ? 'btn-active' : ''}`}
                onPointerDown={(event) => handlePointerDown(event, 'backward', 'back')}
                onPointerUp={(event) => handlePointerUp(event, 'backward')}
                onPointerCancel={handlePointerCancel}
                aria-label="Move backward"
                title="Move Backward [S]"
              >
                <ChevronDown size={16} />
              </button>
              <div />
            </div>
          </div>

          {/* Rotation & Tilt Pad */}
          <div className="nav-pad-cluster">
            <div className="nav-cluster-label">
              <RotateCw size={10} />
              <span>ROTATE ANY ANGLE</span>
            </div>
            <div className="d-pad-grid">
              <div />
              <button
                className={`d-pad-btn ${activeButton === 'tiltUp' ? 'btn-active' : ''}`}
                onPointerDown={(event) => handlePointerDown(event, 'tiltUp', 'tiltUp')}
                onPointerUp={(event) => handlePointerUp(event, 'tiltUp')}
                onPointerCancel={handlePointerCancel}
                aria-label="Tilt camera up"
                title="Tilt Up [Look up at Flyover/Metro/Sky]"
              >
                <ChevronUp size={16} />
              </button>
              <div />

              <button
                className={`d-pad-btn ${activeButton === 'rotL' ? 'btn-active' : ''}`}
                onPointerDown={(event) => handlePointerDown(event, 'turnLeft', 'rotL')}
                onPointerUp={(event) => handlePointerUp(event, 'turnLeft')}
                onPointerCancel={handlePointerCancel}
                aria-label="Turn camera left"
                title="Turn Left 360° [←]"
              >
                <RotateCcw size={13} />
              </button>
              <div className="d-pad-center-tag">360°</div>
              <button
                className={`d-pad-btn ${activeButton === 'rotR' ? 'btn-active' : ''}`}
                onPointerDown={(event) => handlePointerDown(event, 'turnRight', 'rotR')}
                onPointerUp={(event) => handlePointerUp(event, 'turnRight')}
                onPointerCancel={handlePointerCancel}
                aria-label="Turn camera right"
                title="Turn Right 360° [→]"
              >
                <RotateCw size={13} />
              </button>

              <div />
              <button
                className={`d-pad-btn ${activeButton === 'tiltDown' ? 'btn-active' : ''}`}
                onPointerDown={(event) => handlePointerDown(event, 'tiltDown', 'tiltDown')}
                onPointerUp={(event) => handlePointerUp(event, 'tiltDown')}
                onPointerCancel={handlePointerCancel}
                aria-label="Tilt camera down"
                title="Tilt Down [Look down at Underpass/Road]"
              >
                <ChevronDown size={16} />
              </button>
              <div />
            </div>
          </div>
        </div>

        {/* Altitude & Speed Strip */}
        <div className="nav-altitude-speed-bar">
          <div className="altitude-controls">
            <span className="ctrl-tiny-label">ALTITUDE</span>
            <div className="btn-pair">
              <button
                className={`alt-btn ${activeButton === 'up' ? 'btn-active' : ''}`}
                onPointerDown={(event) => handlePointerDown(event, 'up', 'up')}
                onPointerUp={(event) => handlePointerUp(event, 'up')}
                onPointerCancel={handlePointerCancel}
                disabled={cameraMode === 'walk'}
                aria-label="Increase camera altitude"
                aria-disabled={cameraMode === 'walk'}
                title="Elevate Up [E / Space]"
              >
                <ArrowUp size={11} />
                <span>UP</span>
              </button>
              <button
                className={`alt-btn ${activeButton === 'down' ? 'btn-active' : ''}`}
                onPointerDown={(event) => handlePointerDown(event, 'down', 'down')}
                onPointerUp={(event) => handlePointerUp(event, 'down')}
                onPointerCancel={handlePointerCancel}
                disabled={cameraMode === 'walk'}
                aria-label="Decrease camera altitude"
                aria-disabled={cameraMode === 'walk'}
                title="Lower Down [Q / C]"
              >
                <ArrowDown size={11} />
                <span>DOWN</span>
              </button>
            </div>
          </div>

          <div className="speed-toggle-ctrl">
            <span className="ctrl-tiny-label">SPEED</span>
            <button
              className="nav-speed-btn"
              onClick={toggleSpeed}
              aria-label={`Camera speed multiplier ${speedMultiplier} times`}
              title="Toggle Flight Speed Multiplier"
            >
              <Gauge size={12} />
              <span className="speed-val">{speedMultiplier}×</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
