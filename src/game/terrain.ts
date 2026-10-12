/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

export interface Collider {
  x: number;
  z: number;
  r: number;
}

export const colliders: Collider[] = [];

// Truly Vast Open World Landmarks (3400 units wide!)
export const VOL = { x: -680, z: 660 };
export const SNOW = { x: 720, z: 720 };
export const CASTLE = { x: 860, z: -720 };
export const TUNNEL_MOUNTAIN = { x: -100, z: 260 };
export const SPAWN = { x: 20, z: 30 };
export const WORLD_LIMIT = 1580; // Vast expanded world boundary!

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function lerpAngle(a: number, b: number, t: number): number {
  const d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
  return a + d * Math.min(1, t);
}

export function smooth(e0: number, e1: number, x: number): number {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function zoneAt(x: number, z: number): number {
  const d = Math.hypot(x, z);
  if (d < 260) return 1; // Zone 1: Central Plains Village
  if (x < -140 && z < 160) return 2; // Zone 2: Whispering Forest
  if (x > 160 && z < 160) return 3; // Zone 3: Grand Castle City
  if (x < 120 && z >= 160) return 4; // Zone 4: Volcano Ridge
  if (x >= 120 && z >= 160) return 5; // Zone 5: Frostbite Snow Peaks
  return 1;
}

export function riverZ(x: number): number {
  return Math.sin(x * 0.01) * 90 - 280;
}

export const lavaPools: { x: number; z: number; r: number; y: number }[] = [
  { x: -360, z: 420, r: 24, y: 0 },
  { x: -740, z: 480, r: 28, y: 0 },
  { x: -450, z: 820, r: 32, y: 0 },
  { x: -680, z: 760, r: 26, y: 0 },
  { x: -820, z: 620, r: 28, y: 0 },
  { x: VOL.x, z: VOL.z, r: 34, y: 0 },
];

export function baseHeight(x: number, z: number): number {
  const d = Math.hypot(x, z);
  // Rolling meadows in the central kingdom
  let h = Math.sin(x * 0.015) * Math.cos(z * 0.014) * 4.5 + Math.sin(x * 0.006 + z * 0.007) * 7.0;
  h *= smooth(120, 320, d);

  // Sylvan Forest rolling hills to the west
  const wF = smooth(-60, -250, x) * smooth(220, 40, z);
  h += wF * (Math.sin(x * 0.012 + 1) * 6.5 + Math.cos(z * 0.012) * 6.5);
  h = Math.max(h, 0.4);

  // Grand Castle Plateau
  const dc = Math.hypot(x - CASTLE.x, z - CASTLE.z);
  h = lerp(h, 5.0, smooth(360, 180, dc));

  // Volcanic Ridge and crags
  const vm = smooth(180, 380, d);
  const dv2 = (x - VOL.x) ** 2 + (z - VOL.z) ** 2;
  h += vm * (85 * Math.exp(-dv2 / (2 * 190 * 190)) - 55 * Math.exp(-dv2 / (2 * 45 * 45)));

  // Snow Peaks massif
  const ds2 = (x - SNOW.x) ** 2 + (z - SNOW.z) ** 2;
  h += vm * (110 * Math.exp(-ds2 / (2 * 220 * 220)) + smooth(40, 200, x) * smooth(100, 280, z) * Math.sin(x * 0.02) * Math.cos(z * 0.018) * 7.0);

  // River carved valley
  const carve = wF * smooth(55, 20, Math.abs(z - riverZ(x)));
  h = lerp(h, -7.0, carve);
  return h;
}

// Populate lava pool elevations
lavaPools.forEach((p) => {
  p.y = baseHeight(p.x, p.z) - 0.5;
});

export function getTerrainHeight(x: number, z: number): number {
  let h = baseHeight(x, z);
  for (const p of lavaPools) {
    const dd = Math.hypot(x - p.x, z - p.z);
    if (dd < p.r + 14) {
      h = lerp(h, p.y, smooth(p.r + 14, p.r + 2.0, dd));
    }
  }
  return h;
}

export function inLava(x: number, z: number, pad: number = 0): { x: number; z: number; r: number; y: number } | null {
  for (const p of lavaPools) {
    if (Math.hypot(x - p.x, z - p.z) < p.r + pad) return p;
  }
  return null;
}

export function inWater(x: number, z: number): boolean {
  return getTerrainHeight(x, z) < -2.8;
}

export function collidesAny(x: number, z: number, pad: number): boolean {
  for (const c of colliders) {
    const r = c.r + pad;
    if ((x - c.x) ** 2 + (z - c.z) ** 2 < r * r) return true;
  }
  return false;
}

export function resolveColliders(pos: { x: number; z: number }, rad: number): void {
  for (const c of colliders) {
    const dx = pos.x - c.x;
    const dz = pos.z - c.z;
    const min = c.r + rad;
    const d2 = dx * dx + dz * dz;
    if (d2 < min * min) {
      const d = Math.sqrt(d2) || 0.001;
      pos.x = c.x + (dx / d) * min;
      pos.z = c.z + (dz / d) * min;
    }
  }
}

const PATHS = [
  [0, 0, -20, 32],
  [0, 0, 50, -50],
  [50, -50, 80, -16],
  [0, 0, -90, -70],
  [0, 0, 120, -120],
  [0, 0, -110, 80],
  [0, 0, 130, 90],
  [0, 0, 180, 28],
  [0, 0, -180, -24],
  [0, 0, 24, 52],
];

function pathDist(x: number, z: number): number {
  let m = 1e9;
  for (const s of PATHS) {
    const dx = s[2] - s[0];
    const dz = s[3] - s[1];
    const l2 = dx * dx + dz * dz;
    const t = clamp(((x - s[0]) * dx + (z - s[1]) * dz) / l2, 0, 1);
    const d = Math.hypot(x - (s[0] + dx * t), z - (s[1] + dz * t));
    if (d < m) m = d;
  }
  return m;
}

const DIRT = new THREE.Color(0xb08d57);
export function terrainColor(x: number, z: number, h: number): THREE.Color {
  const zn = zoneAt(x, z);
  const c = new THREE.Color();
  if (zn === 1) {
    c.setHex(0x5a9a3e);
    const pd = pathDist(x, z);
    if (pd < 6.5) c.copy(DIRT);
    else if (pd < 10.0) c.lerp(DIRT, 0.4);
  } else if (zn === 2) {
    c.setHex(h < -1.5 ? 0xc9b27a : 0x2d8a4e);
  } else if (zn === 3) {
    c.setHex(Math.hypot(x - CASTLE.x, z - CASTLE.z) < 250 ? 0x9aa8ba : 0x5f9f48);
  } else if (zn === 4) {
    c.setHex(h > 48 ? 0x4a4650 : 0x2b2930);
  } else {
    c.setHex(h > 60 ? 0xf2f8ff : 0xcfe6f2);
  }
  c.offsetHSL(0, 0, Math.sin(x * 0.45) * Math.cos(z * 0.4) * 0.035);
  return c;
}

// Truly Expansive Map Size (3400 units wide, 280 segments)
export const TSIZE = 3400;
export const TSEG = 280;
export const TN = TSEG + 1;

export function buildTerrainMesh(mmBgCanvas: HTMLCanvasElement): THREE.Mesh {
  mmBgCanvas.width = TN;
  mmBgCanvas.height = TN;
  const ctx = mmBgCanvas.getContext('2d')!;
  const terrainGeo = new THREE.PlaneGeometry(TSIZE, TSIZE, TSEG, TSEG);
  terrainGeo.rotateX(-Math.PI / 2);

  const pa = terrainGeo.attributes.position;
  const cols = new Float32Array(pa.count * 3);
  const img = ctx.createImageData(TN, TN);
  const waterC = new THREE.Color(0x3892d0);

  for (let i = 0; i < pa.count; i++) {
    const x = pa.getX(i);
    const z = pa.getZ(i);
    const h = getTerrainHeight(x, z);
    pa.setY(i, h);

    const c = terrainColor(x, z, h);
    cols[i * 3] = c.r;
    cols[i * 3 + 1] = c.g;
    cols[i * 3 + 2] = c.b;

    const mc = h < -2.8 ? waterC : c;
    img.data[i * 4] = mc.r * 255;
    img.data[i * 4 + 1] = mc.g * 255;
    img.data[i * 4 + 2] = mc.b * 255;
    img.data[i * 4 + 3] = 255;
  }

  ctx.putImageData(img, 0, 0);
  terrainGeo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  terrainGeo.computeVertexNormals();

  const terrainMesh = new THREE.Mesh(
    terrainGeo,
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.05,
      flatShading: true,
    })
  );
  terrainMesh.receiveShadow = true;
  return terrainMesh;
}
