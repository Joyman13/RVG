/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { getTerrainHeight, colliders, clamp } from './terrain.ts';
import { AudioFX } from './audio.ts';
import { TRAIN_STATIONS } from './constants.ts';
import { TrainStationDef, TrainRouteId } from '../types.ts';

// Route 1: Outer Grand Express Loop (Traverses all 5 zones gently avoiding craters and chasms)
const ROUTE_OUTER_POINTS: [number, number][] = [
  [45, -35],     // Station 1: Village Station (Zone 1)
  [-180, -160],
  [-380, -280],
  [-600, -420],  // Station 2: Whispering Forest Depot (Zone 2)
  [-740, -180],
  [-780, 180],
  [-640, 520],   // Station 3: Volcano Outpost (Zone 4)
  [-380, 560],   // Sweeps smoothly around the mountain
  [0, 570],      // Broad open scenic high plains
  [320, 570],
  [580, 560],    // Station 4: Frost Peaks Halt (Zone 5)
  [720, 240],
  [780, -100],
  [750, -580],   // Station 5: Grand Castle Terminal (Zone 3)
  [480, -380],
  [240, -180],
];

// Route 2: Direct Capital Express (Village Central <-> Grand Castle City)
const ROUTE_CAPITAL_POINTS: [number, number][] = [
  [45, -35],
  [220, -120],
  [420, -260],
  [600, -420],
  [750, -580],
  [600, -420],
  [420, -260],
  [220, -120],
];

// Route 3: Scenic Nature Line (Whispering Forest <-> Central Village <-> Frost Peaks)
const ROUTE_NATURE_POINTS: [number, number][] = [
  [-600, -420],
  [-380, -260],
  [-160, -140],
  [45, -35],
  [220, 180],
  [420, 380],
  [580, 560],
  [420, 380],
  [220, 180],
  [45, -35],
  [-160, -140],
  [-380, -260],
];

export interface TrainRouteDef {
  id: TrainRouteId;
  name: string;
  nameTh: string;
  icon: string;
  points: [number, number][];
}

export const ALL_TRAIN_ROUTES: TrainRouteDef[] = [
  {
    id: 'outer_express',
    name: 'Grand 5-Zone Scenic Express',
    nameTh: 'สายรอบโลกแฟนตาซี 5 โซน (Outer Grand Loop)',
    icon: '🌐',
    points: ROUTE_OUTER_POINTS,
  },
  {
    id: 'central_direct',
    name: 'Direct Capital Express',
    nameTh: 'สายด่วนตรงสู่ปราสาทหลวง (Direct Capital Line)',
    icon: '⚡',
    points: ROUTE_CAPITAL_POINTS,
  },
  {
    id: 'north_south',
    name: 'Scenic Nature Line',
    nameTh: 'สายเลียบธรรมชาติป่าสู่ยอดเขาหิมะ (Scenic Nature Line)',
    icon: '🌲',
    points: ROUTE_NATURE_POINTS,
  },
];

export class TrainSystem {
  scene: THREE.Scene;
  activeRouteId: TrainRouteId = 'outer_express';
  curves: Map<TrainRouteId, THREE.CatmullRomCurve3> = new Map();
  curveLengths: Map<TrainRouteId, number> = new Map();

  trainGroup: THREE.Group;
  currentU: number = 0;
  speed: number = 42; // Fast, smooth cruising across grand continent
  state: 'waiting' | 'cruising' = 'waiting';
  waitTimer: number = 6.0;
  currentStation: TrainStationDef | null = TRAIN_STATIONS[0];
  heading: number = 0;
  stations: TrainStationDef[] = TRAIN_STATIONS;
  onArriveCallback?: (station: TrainStationDef) => void;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Build splines for all routes with obstacle-free elevated ballast
    ALL_TRAIN_ROUTES.forEach((rt) => {
      const xzPts = rt.points.map((p) => new THREE.Vector3(p[0], 0, p[1]));
      const splineXZ = new THREE.CatmullRomCurve3(xzPts, true, 'catmullrom', 0.5);
      const sampled = splineXZ.getPoints(260);

      // Smooth terrain-following height, elevated gently over rivers
      const elevated = sampled.map((p) => {
        const gh = getTerrainHeight(p.x, p.z);
        const y = Math.max(gh + 0.5, 2.0); // Never plunges into water or deep chasms!
        return new THREE.Vector3(p.x, y, p.z);
      });

      const curve3 = new THREE.CatmullRomCurve3(elevated, true, 'catmullrom', 0.5);
      this.curves.set(rt.id, curve3);
      this.curveLengths.set(rt.id, curve3.getLength());

      // Build 3D physical tracks for each route
      this.buildTracksForCurve(curve3, rt.id === 'outer_express' ? 0x94a3b8 : 0xf59e0b);
    });

    // Build physical stations
    this.buildStations();

    // Build Locomotive and Carriage
    this.trainGroup = this.buildTrainModel();
    this.scene.add(this.trainGroup);

    this.placeTrain();
  }

  setRoute(routeId: TrainRouteId) {
    this.activeRouteId = routeId;
    this.currentU = 0;
    this.state = 'waiting';
    this.waitTimer = 3.0;
    this.placeTrain();
    AudioFX.whistle();
  }

  private buildTracksForCurve(curve: THREE.CatmullRomCurve3, railColor: number) {
    const pts = curve.getSpacedPoints(300);
    const dummy = new THREE.Object3D();

    const tieMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
    const railMat = new THREE.MeshStandardMaterial({ color: railColor, metalness: 0.85, roughness: 0.25 });
    const viaductPillarMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.95 });

    const ties = new THREE.InstancedMesh(new THREE.BoxGeometry(4.2, 0.25, 0.75), tieMat, pts.length);
    const railL = new THREE.InstancedMesh(new THREE.BoxGeometry(0.28, 0.28, 1), railMat, pts.length);
    const railR = new THREE.InstancedMesh(new THREE.BoxGeometry(0.28, 0.28, 1), railMat, pts.length);

    const bridgePillars = new THREE.Group();

    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const mid = a.clone().add(b).multiplyScalar(0.5);
      const dir = b.clone().sub(a);
      const len = dir.length();
      dir.normalize();
      const perp = new THREE.Vector3(dir.z, 0, -dir.x);

      dummy.position.copy(mid);
      dummy.lookAt(b);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      ties.setMatrixAt(i, dummy.matrix);

      dummy.position.copy(mid).addScaledVector(perp, 1.4);
      dummy.lookAt(b.clone().addScaledVector(perp, 1.4));
      dummy.scale.set(1, 1, len * 1.05);
      dummy.updateMatrix();
      railL.setMatrixAt(i, dummy.matrix);

      dummy.position.copy(mid).addScaledVector(perp, -1.4);
      dummy.lookAt(b.clone().addScaledVector(perp, -1.4));
      dummy.scale.set(1, 1, len * 1.05);
      dummy.updateMatrix();
      railR.setMatrixAt(i, dummy.matrix);

      // Elevated viaduct bridge pillars over water / dips
      const groundH = getTerrainHeight(mid.x, mid.z);
      const diff = mid.y - groundH;
      if (diff > 1.8 && i % 4 === 0) {
        const pillar = new THREE.Mesh(
          new THREE.CylinderGeometry(1.2, 1.6, diff, 6),
          viaductPillarMat
        );
        pillar.position.set(mid.x, groundH + diff / 2, mid.z);
        pillar.castShadow = true;
        pillar.receiveShadow = true;
        bridgePillars.add(pillar);
      }
    }

    [ties, railL, railR].forEach((m) => {
      m.receiveShadow = true;
      m.frustumCulled = false;
      this.scene.add(m);
    });
    this.scene.add(bridgePillars);
  }

  private buildStations() {
    this.stations.forEach((st) => {
      const y = getTerrainHeight(st.x, st.z);
      const g = new THREE.Group();
      g.position.set(st.x, y, st.z);

      const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
      const roofMat = new THREE.MeshStandardMaterial({ color: st.color, roughness: 0.6 });
      const postMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });

      // Covered Station Platform
      const platform = new THREE.Mesh(new THREE.BoxGeometry(22, 1.2, 6), woodMat);
      platform.position.set(0, 0.6, 7.5);
      platform.receiveShadow = true;
      platform.castShadow = true;
      g.add(platform);

      const roof = new THREE.Mesh(new THREE.BoxGeometry(24, 0.6, 8), roofMat);
      roof.position.set(0, 8.5, 7.5);
      roof.castShadow = true;
      g.add(roof);

      [-10, 10].forEach((px) => {
        [-2.5, 2.5].forEach((pz) => {
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.5, 7.5, 0.5), postMat);
          post.position.set(px, 4.5, 7.5 + pz);
          post.castShadow = true;
          g.add(post);
        });
      });

      // Station Sign
      const label = this.makeStationSprite(st.nameTh, st.icon);
      label.position.set(0, 11.2, 7.5);
      g.add(label);

      this.scene.add(g);
      colliders.push({ x: st.x, z: st.z, r: 5.5 });
    });
  }

  private makeStationSprite(text: string, icon: string): THREE.Sprite {
    const cv = document.createElement('canvas');
    cv.width = 512;
    cv.height = 128;
    const ctx = cv.getContext('2d')!;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.beginPath();
    ctx.roundRect(16, 16, 480, 96, 24);
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#fde047';
    ctx.stroke();

    ctx.font = 'bold 36px Fredoka, Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${icon} ${text}`, 256, 64);

    const sp = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(cv),
        transparent: true,
        depthTest: false,
      })
    );
    sp.scale.set(12, 3.0, 1);
    sp.renderOrder = 10;
    return sp;
  }

  private buildTrainModel(): THREE.Group {
    const g = new THREE.Group();
    g.rotation.order = 'YXZ';

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.8 });
    const redMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.5 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.2, metalness: 0.9 });
    const blueMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.6 });
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.9 });

    // Locomotive Engine Boiler
    const boiler = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 2.4, 9, 16).rotateX(Math.PI / 2),
      metalMat
    );
    boiler.position.set(0, 3.4, 3.5);
    boiler.castShadow = true;
    g.add(boiler);

    // Cabin
    const cab = new THREE.Mesh(new THREE.BoxGeometry(4.8, 5.5, 4.5), redMat);
    cab.position.set(0, 4.0, -3.4);
    cab.castShadow = true;
    g.add(cab);

    // Smokestack chimney
    const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.55, 2.8, 12), goldMat);
    stack.position.set(0, 6.4, 6.2);
    stack.castShadow = true;
    g.add(stack);

    // Headlight with warm glow
    const light = new THREE.Mesh(
      new THREE.SphereGeometry(0.9, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfef08a, emissiveIntensity: 2.8 })
    );
    light.position.set(0, 3.4, 8.0);
    g.add(light);

    // Wheels
    [-1, 1].forEach((sx) => {
      [-4.4, 0.9, 5.5].forEach((wz) => {
        const wheel = new THREE.Mesh(
          new THREE.CylinderGeometry(1.1, 1.1, 0.5, 12).rotateZ(Math.PI / 2),
          wheelMat
        );
        wheel.position.set(sx * 2.4, 1.1, wz);
        wheel.castShadow = true;
        g.add(wheel);
      });
    });

    // Passenger Carriage
    const cart = new THREE.Group();
    cart.position.set(0, 0, -12.5);

    const floor = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.6, 9.8), blueMat);
    floor.position.set(0, 1.5, 0);
    floor.castShadow = true;
    cart.add(floor);

    [-2.3, 2.3].forEach((sx) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.8, 9.8), blueMat);
      rail.position.set(sx, 2.6, 0);
      cart.add(rail);
    });

    [-4.7, 4.7].forEach((sz) => {
      const endRail = new THREE.Mesh(new THREE.BoxGeometry(5.0, 1.8, 0.3), blueMat);
      endRail.position.set(0, 2.6, sz);
      cart.add(endRail);
    });

    [-2.4, 2.4].forEach((sz) => {
      const bench = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.6, 1.5), seatMat);
      bench.position.set(0, 2.3, sz);
      bench.castShadow = true;
      cart.add(bench);
    });

    [-1, 1].forEach((sx) => {
      [-3.2, 3.2].forEach((wz) => {
        const w = new THREE.Mesh(
          new THREE.CylinderGeometry(0.95, 0.95, 0.45, 12).rotateZ(Math.PI / 2),
          wheelMat
        );
        w.position.set(sx * 2.4, 0.95, wz);
        w.castShadow = true;
        cart.add(w);
      });
    });

    g.add(cart);
    return g;
  }

  update(dt: number) {
    const curve = this.curves.get(this.activeRouteId);
    const curveLength = this.curveLengths.get(this.activeRouteId) || 1000;
    if (!curve) return;

    if (this.state === 'waiting') {
      this.waitTimer -= dt;
      if (this.waitTimer <= 0) {
        this.state = 'cruising';
        AudioFX.whistle();
      }
    } else {
      const deltaU = (this.speed / curveLength) * dt;
      this.currentU = (this.currentU + deltaU) % 1.0;

      // Check arrival at stations along current route
      const trainPos = curve.getPointAt(this.currentU);
      for (const st of this.stations) {
        const d = Math.hypot(trainPos.x - st.x, trainPos.z - st.z);
        if (d < 16) {
          if (this.currentStation?.id !== st.id) {
            this.state = 'waiting';
            this.waitTimer = 7.0;
            this.currentStation = st;
            AudioFX.whistle();
            if (this.onArriveCallback) {
              this.onArriveCallback(st);
            }
            break;
          }
        }
      }

      if (this.currentStation) {
        const d = Math.hypot(trainPos.x - this.currentStation.x, trainPos.z - this.currentStation.z);
        if (d > 28) {
          this.currentStation = null;
        }
      }
    }

    this.placeTrain();
  }

  placeTrain() {
    const curve = this.curves.get(this.activeRouteId);
    if (!curve) return;

    const pos = curve.getPointAt(this.currentU);
    const tangent = curve.getTangentAt(this.currentU);

    this.heading = Math.atan2(tangent.x, tangent.z);
    this.trainGroup.position.copy(pos);
    this.trainGroup.rotation.y = this.heading;
    this.trainGroup.rotation.x = -Math.asin(clamp(tangent.y, -1, 1));
    this.trainGroup.updateMatrixWorld(true);
  }

  getPassengerPosition(outPos: THREE.Vector3) {
    this.trainGroup.localToWorld(outPos.set(0, 2.3, -12.5));
  }
}
