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

export const NavigationWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<1 | 2 | 4>(1);
  const [activeButton, setActiveButton] = useState<string | null>(null);

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
          <span>CAMERA CONTROLLER</span>
        </div>
        <button
          className="nav-close-btn"
          onClick={() => setIsOpen(false)}
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
                title="Strafe Left [A]"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                className="d-pad-btn center-btn"
                onClick={handleResetCenter}
                title="Center View [Reset]"
              >
                <Crosshair size={13} />
              </button>
              <button
                className={`d-pad-btn ${activeButton === 'right' ? 'btn-active' : ''}`}
                onPointerDown={(event) => handlePointerDown(event, 'right', 'right')}
                onPointerUp={(event) => handlePointerUp(event, 'right')}
                onPointerCancel={handlePointerCancel}
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
