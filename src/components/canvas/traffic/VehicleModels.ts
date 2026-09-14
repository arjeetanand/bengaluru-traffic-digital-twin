import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Creates a low-poly modern car geometry (sedan/compact SUV)
 * Dimensions: ~1.8m wide, ~1.4m high, ~4.2m long
 */
export function createCarGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];

  // Lower chassis
  const chassis = new THREE.BoxGeometry(1.8, 0.6, 4.2);
  chassis.translate(0, 0.45, 0);
  parts.push(chassis);

  // Cabin / greenhouse
  const cabin = new THREE.BoxGeometry(1.5, 0.6, 2.3);
  cabin.translate(0, 0.95, -0.2);
  parts.push(cabin);

  // Windshield slant
  const windshield = new THREE.BoxGeometry(1.48, 0.5, 0.6);
  windshield.rotateX(Math.PI / 6);
  windshield.translate(0, 0.85, 0.85);
  parts.push(windshield);

  // 4 Wheels
  const wheelGeom = new THREE.CylinderGeometry(0.32, 0.32, 0.28, 10);
  wheelGeom.rotateZ(Math.PI / 2);

  const flWheel = wheelGeom.clone().translate(-0.95, 0.32, 1.3);
  const frWheel = wheelGeom.clone().translate(0.95, 0.32, 1.3);
  const rlWheel = wheelGeom.clone().translate(-0.95, 0.32, -1.3);
  const rrWheel = wheelGeom.clone().translate(0.95, 0.32, -1.3);
  parts.push(flWheel, frWheel, rlWheel, rrWheel);

  // Headlights
  const hlGeom = new THREE.BoxGeometry(0.35, 0.15, 0.1);
  const leftHl = hlGeom.clone().translate(-0.6, 0.55, 2.12);
  const rightHl = hlGeom.clone().translate(0.6, 0.55, 2.12);
  parts.push(leftHl, rightHl);

  // Taillights
  const tlGeom = new THREE.BoxGeometry(0.35, 0.15, 0.1);
  const leftTl = tlGeom.clone().translate(-0.6, 0.55, -2.12);
  const rightTl = tlGeom.clone().translate(0.6, 0.55, -2.12);
  parts.push(leftTl, rightTl);

  return mergeGeometries(parts, false);
}

/**
 * Creates Bengaluru's iconic 3-wheeled Auto-Rickshaw geometry
 * Characteristics: Green bottom chassis, yellow fabric roof canopy, open sides, 3 wheels
 */
export function createAutoGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];

  // Lower green chassis
  const chassis = new THREE.BoxGeometry(1.3, 0.5, 2.4);
  chassis.translate(0, 0.4, 0);
  parts.push(chassis);

  // Tapered front nose
  const nose = new THREE.CylinderGeometry(0.2, 0.65, 0.9, 4);
  nose.rotateY(Math.PI / 4);
  nose.translate(0, 0.6, 1.0);
  parts.push(nose);

  // Canopy roof (Yellow top)
  const roof = new THREE.BoxGeometry(1.25, 0.6, 1.7);
  roof.translate(0, 1.05, -0.2);
  parts.push(roof);

  // Canopy rear curved frame
  const rearFrame = new THREE.CylinderGeometry(0.62, 0.62, 1.25, 8, 1, false, 0, Math.PI);
  rearFrame.rotateZ(Math.PI / 2);
  rearFrame.translate(0, 1.35, -0.2);
  parts.push(rearFrame);

  // Single front wheel
  const frontWheel = new THREE.CylinderGeometry(0.25, 0.25, 0.18, 8);
  frontWheel.rotateZ(Math.PI / 2);
  frontWheel.translate(0, 0.25, 1.0);
  parts.push(frontWheel);

  // Rear twin wheels
  const rearWheel = new THREE.CylinderGeometry(0.26, 0.26, 0.2, 8);
  rearWheel.rotateZ(Math.PI / 2);
  const rlWheel = rearWheel.clone().translate(-0.68, 0.26, -0.7);
  const rrWheel = rearWheel.clone().translate(0.68, 0.26, -0.7);
  parts.push(rlWheel, rrWheel);

  // Single center round headlight
  const headlight = new THREE.CylinderGeometry(0.12, 0.12, 0.1, 8);
  headlight.rotateX(Math.PI / 2);
  headlight.translate(0, 0.6, 1.35);
  parts.push(headlight);

  return mergeGeometries(parts, false);
}

/**
 * Creates BMTC (Bengaluru Metropolitan Transport Corp) City Bus geometry
 * Dimensions: ~2.5m wide, ~2.9m high, ~10.5m long
 */
export function createBusGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];

  // Main bus body
  const body = new THREE.BoxGeometry(2.5, 2.5, 10.2);
  body.translate(0, 1.6, 0);
  parts.push(body);

  // Curved front windshield section
  const frontCap = new THREE.BoxGeometry(2.48, 1.3, 0.6);
  frontCap.translate(0, 1.8, 5.1);
  parts.push(frontCap);

  // Front electronic destination display
  const destDisplay = new THREE.BoxGeometry(1.8, 0.4, 0.2);
  destDisplay.translate(0, 2.65, 5.2);
  parts.push(destDisplay);

  // Side window recesses / ribbons
  const sideWindowLeft = new THREE.BoxGeometry(0.08, 0.9, 9.2);
  sideWindowLeft.translate(-1.26, 1.85, 0);
  const sideWindowRight = new THREE.BoxGeometry(0.08, 0.9, 9.2);
  sideWindowRight.translate(1.26, 1.85, 0);
  parts.push(sideWindowLeft, sideWindowRight);

  // 6 Wheels (2 front, 4 rear dual-axle)
  const wheelGeom = new THREE.CylinderGeometry(0.5, 0.5, 0.35, 10);
  wheelGeom.rotateZ(Math.PI / 2);

  const fl = wheelGeom.clone().translate(-1.28, 0.5, 3.6);
  const fr = wheelGeom.clone().translate(1.28, 0.5, 3.6);
  const rl1 = wheelGeom.clone().translate(-1.28, 0.5, -2.8);
  const rr1 = wheelGeom.clone().translate(1.28, 0.5, -2.8);
  const rl2 = wheelGeom.clone().translate(-1.28, 0.5, -4.0);
  const rr2 = wheelGeom.clone().translate(1.28, 0.5, -4.0);
  parts.push(fl, fr, rl1, rr1, rl2, rr2);

  return mergeGeometries(parts, false);
}

/**
 * Creates Two-Wheeler geometry (Motorcycle / Scooter with helmeted rider)
 * Highly authentic for Bengaluru traffic
 */
export function createTwoWheelerGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];

  // Bike body / frame
  const bikeFrame = new THREE.BoxGeometry(0.35, 0.45, 1.7);
  bikeFrame.translate(0, 0.5, 0);
  parts.push(bikeFrame);

  // Handlebars
  const bars = new THREE.BoxGeometry(0.75, 0.08, 0.08);
  bars.translate(0, 0.95, 0.5);
  parts.push(bars);

  // Front and Rear Wheels
  const wheelGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.12, 8);
  wheelGeom.rotateZ(Math.PI / 2);
  const frontWheel = wheelGeom.clone().translate(0, 0.3, 0.7);
  const rearWheel = wheelGeom.clone().translate(0, 0.3, -0.7);
  parts.push(frontWheel, rearWheel);

  // Rider Torso
  const torso = new THREE.BoxGeometry(0.4, 0.65, 0.35);
  torso.translate(0, 1.15, -0.1);
  parts.push(torso);

  // Rider Helmet (Sphere)
  const helmet = new THREE.SphereGeometry(0.2, 8, 8);
  helmet.translate(0, 1.6, -0.05);
  parts.push(helmet);

  // Front Headlight
  const light = new THREE.BoxGeometry(0.18, 0.12, 0.08);
  light.translate(0, 0.8, 0.85);
  parts.push(light);

  return mergeGeometries(parts, false);
}
