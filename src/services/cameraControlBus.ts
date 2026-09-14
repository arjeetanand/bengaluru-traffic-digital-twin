// ═════════════════════════════════════════════════════════════════════════════
// 3D DIGITAL TWIN - CAMERA CONTROL EVENT & INPUT BUS
// Connects UI Navigation Widgets directly to Three.js Camera Controller
// ═════════════════════════════════════════════════════════════════════════════

export interface CameraInputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  turnLeft: boolean;
  turnRight: boolean;
  tiltUp: boolean;
  tiltDown: boolean;
  speedMultiplier: number; // 1 = Normal, 2 = Fast, 4 = Boost
}

type ResetCallback = () => void;
export type FlyToCallback = (
  position: [number, number, number],
  target: [number, number, number]
) => void;

class CameraControlBus {
  public state: CameraInputState = {
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
    speedMultiplier: 1
  };

  private resetListeners: Set<ResetCallback> = new Set();
  private flyToListeners: Set<FlyToCallback> = new Set();

  public setInput(input: Partial<CameraInputState>) {
    Object.assign(this.state, input);
  }

  public resetInputs() {
    this.state.forward = false;
    this.state.backward = false;
    this.state.left = false;
    this.state.right = false;
    this.state.up = false;
    this.state.down = false;
    this.state.turnLeft = false;
    this.state.turnRight = false;
    this.state.tiltUp = false;
    this.state.tiltDown = false;
  }

  public triggerResetView() {
    this.resetListeners.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.error('Error triggering camera reset view', err);
      }
    });
  }

  public onResetView(callback: ResetCallback): () => void {
    this.resetListeners.add(callback);
    return () => {
      this.resetListeners.delete(callback);
    };
  }

  public flyTo(
    position: [number, number, number],
    target: [number, number, number]
  ) {
    this.flyToListeners.forEach((cb) => {
      try {
        cb(position, target);
      } catch (err) {
        console.error('Error in camera flyTo listener', err);
      }
    });
  }

  public onFlyTo(callback: FlyToCallback): () => void {
    this.flyToListeners.add(callback);
    return () => {
      this.flyToListeners.delete(callback);
    };
  }
}

export const cameraControlBus = new CameraControlBus();

