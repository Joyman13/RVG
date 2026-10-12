/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { BuildingPieceType, PlacedStructure } from '../types.ts';
import { BUILDING_PIECES } from './constants.ts';
import { getTerrainHeight, colliders, Collider } from './terrain.ts';
import { AudioFX } from './audio.ts';

export class BuildingSystem {
  scene: THREE.Scene;
  placedStructures: PlacedStructure[] = [];
  structureMeshes: Map<string, { group: THREE.Group; collider?: Collider }> = new Map();
  ghostMesh: THREE.Group | null = null;
  activeType: BuildingPieceType = 'foundation_wood';
  activeRotation: number = 0; // 0, PI/2, PI, 3PI/2
  isBuildMode: boolean = false;
  isDemolishMode: boolean = false;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.createGhostMesh();
  }

  setBuildMode(enabled: boolean) {
    this.isBuildMode = enabled;
    if (this.ghostMesh) {
      this.ghostMesh.visible = enabled && !this.isDemolishMode;
    }
  }

  setPieceType(type: BuildingPieceType) {
    this.activeType = type;
    this.rebuildGhost();
  }

  rotatePiece() {
    this.activeRotation = (this.activeRotation + Math.PI / 2) % (Math.PI * 2);
    if (this.ghostMesh) {
      this.ghostMesh.rotation.y = this.activeRotation;
    }
    AudioFX.click();
  }

  private createGhostMesh() {
    this.ghostMesh = new THREE.Group();
    this.ghostMesh.visible = false;
    this.scene.add(this.ghostMesh);
    this.rebuildGhost();
  }

  private rebuildGhost() {
    if (!this.ghostMesh) return;
    // Clear old children
    while (this.ghostMesh.children.length > 0) {
      this.ghostMesh.remove(this.ghostMesh.children[0]);
    }

    const preview = this.createPieceMesh(this.activeType, true);
    this.ghostMesh.add(preview);
    this.ghostMesh.rotation.y = this.activeRotation;
  }

  private createPieceMesh(type: BuildingPieceType, isGhost: boolean = false): THREE.Group {
    const g = new THREE.Group();
    const def = BUILDING_PIECES[type];

    // Transparent hologram material for ghost preview
    const ghostMat = (color: number) =>
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.55,
        wireframe: false,
      });

    const woodColor = 0x78350f;
    const stoneColor = 0x64748b;
    const plankColor = 0xb45309;

    const mat = (col: number) =>
      isGhost
        ? ghostMat(0x38bdf8)
        : new THREE.MeshStandardMaterial({
            color: col,
            roughness: 0.8,
            flatShading: true,
          });

    switch (type) {
      case 'foundation_wood': {
        const floor = new THREE.Mesh(new THREE.BoxGeometry(def.size.w, def.size.h, def.size.d), mat(plankColor));
        floor.position.y = def.size.h / 2;
        floor.receiveShadow = true;
        floor.castShadow = true;
        g.add(floor);
        // Beams underneath
        [-3.6, 0, 3.6].forEach((z) => {
          const beam = new THREE.Mesh(new THREE.BoxGeometry(def.size.w + 0.2, 0.4, 0.6), mat(woodColor));
          beam.position.set(0, 0.2, z);
          g.add(beam);
        });
        break;
      }
      case 'foundation_stone': {
        const slab = new THREE.Mesh(new THREE.BoxGeometry(def.size.w, def.size.h, def.size.d), mat(stoneColor));
        slab.position.y = def.size.h / 2;
        slab.receiveShadow = true;
        slab.castShadow = true;
        g.add(slab);
        break;
      }
      case 'wall_wood': {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(def.size.w, def.size.h, def.size.d), mat(woodColor));
        wall.position.y = def.size.h / 2;
        wall.castShadow = true;
        wall.receiveShadow = true;
        g.add(wall);
        break;
      }
      case 'wall_stone': {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(def.size.w, def.size.h, def.size.d), mat(stoneColor));
        wall.position.y = def.size.h / 2;
        wall.castShadow = true;
        wall.receiveShadow = true;
        g.add(wall);
        break;
      }
      case 'doorframe': {
        // Left post
        const leftPost = new THREE.Mesh(new THREE.BoxGeometry(2.6, def.size.h, def.size.d), mat(woodColor));
        leftPost.position.set(-2.7, def.size.h / 2, 0);
        // Right post
        const rightPost = new THREE.Mesh(new THREE.BoxGeometry(2.6, def.size.h, def.size.d), mat(woodColor));
        rightPost.position.set(2.7, def.size.h / 2, 0);
        // Header lintel
        const header = new THREE.Mesh(new THREE.BoxGeometry(def.size.w, 1.2, def.size.d), mat(woodColor));
        header.position.set(0, def.size.h - 0.6, 0);
        // Door flap
        const door = new THREE.Mesh(new THREE.BoxGeometry(2.6, def.size.h - 1.2, 0.3), mat(plankColor));
        door.position.set(0, (def.size.h - 1.2) / 2, 0);
        g.add(leftPost, rightPost, header, door);
        break;
      }
      case 'wall_window': {
        const base = new THREE.Mesh(new THREE.BoxGeometry(def.size.w, 1.8, def.size.d), mat(woodColor));
        base.position.set(0, 0.9, 0);
        const top = new THREE.Mesh(new THREE.BoxGeometry(def.size.w, 1.2, def.size.d), mat(woodColor));
        top.position.set(0, def.size.h - 0.6, 0);
        const left = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.0, def.size.d), mat(woodColor));
        left.position.set(-2.9, 2.8, 0);
        const right = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.0, def.size.d), mat(woodColor));
        right.position.set(2.9, 2.8, 0);
        // Glass pane
        const glassMat = isGhost ? ghostMat(0x67e8f9) : new THREE.MeshStandardMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.6 });
        const glass = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.0, 0.1), glassMat);
        glass.position.set(0, 2.8, 0);
        g.add(base, top, left, right, glass);
        break;
      }
      case 'roof_wood': {
        const roof = new THREE.Mesh(new THREE.ConeGeometry(6.2, def.size.h, 4), mat(0x991b1b));
        roof.position.y = def.size.h / 2 + 0.5;
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        g.add(roof);
        break;
      }
      case 'fence_wood': {
        const post1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, def.size.h, 0.5), mat(woodColor));
        post1.position.set(-3.7, def.size.h / 2, 0);
        const post2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, def.size.h, 0.5), mat(woodColor));
        post2.position.set(3.7, def.size.h / 2, 0);
        const railTop = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.3, 0.3), mat(woodColor));
        railTop.position.set(0, def.size.h - 0.4, 0);
        const railBot = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.3, 0.3), mat(woodColor));
        railBot.position.set(0, 0.6, 0);
        g.add(post1, post2, railTop, railBot);
        break;
      }
      case 'campfire': {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.3, 8, 12).rotateX(Math.PI / 2), mat(stoneColor));
        ring.position.y = 0.3;
        const woodLogs = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.2, 5), mat(woodColor));
        woodLogs.position.y = 0.6;
        g.add(ring, woodLogs);
        if (!isGhost) {
          const flame = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xff6a00 })
          );
          flame.position.y = 1.0;
          g.add(flame);
          const fireLight = new THREE.PointLight(0xff7a00, 2.5, 12);
          fireLight.position.y = 1.5;
          g.add(fireLight);
        }
        break;
      }
      case 'crafting_table': {
        const top = new THREE.Mesh(new THREE.BoxGeometry(def.size.w, 0.4, def.size.d), mat(woodColor));
        top.position.y = def.size.h - 0.2;
        [-0.9, 0.9].forEach((x) => {
          [-0.6, 0.6].forEach((z) => {
            const leg = new THREE.Mesh(new THREE.BoxGeometry(0.3, def.size.h - 0.4, 0.3), mat(woodColor));
            leg.position.set(x, (def.size.h - 0.4) / 2, z);
            g.add(leg);
          });
        });
        const anvil = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.5), mat(stoneColor));
        anvil.position.set(0, def.size.h + 0.25, 0);
        g.add(top, anvil);
        break;
      }
      case 'storage_chest': {
        const box = new THREE.Mesh(new THREE.BoxGeometry(def.size.w, def.size.h * 0.7, def.size.d), mat(woodColor));
        box.position.y = (def.size.h * 0.7) / 2;
        const lid = new THREE.Mesh(new THREE.BoxGeometry(def.size.w + 0.1, 0.4, def.size.d + 0.1), mat(plankColor));
        lid.position.y = def.size.h * 0.85;
        const lock = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.2), mat(0xfacc15));
        lock.position.set(0, def.size.h * 0.65, def.size.d / 2 + 0.1);
        g.add(box, lid, lock);
        break;
      }
      case 'torch_wall': {
        const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.2, 0.6), mat(0x1e293b));
        bracket.position.y = 1.0;
        const head = new THREE.Mesh(
          new THREE.SphereGeometry(0.25, 6, 6),
          new THREE.MeshBasicMaterial({ color: 0xfef08a })
        );
        head.position.set(0, 1.6, 0.3);
        g.add(bracket, head);
        if (!isGhost) {
          const l = new THREE.PointLight(0xfef08a, 1.8, 8);
          l.position.set(0, 1.7, 0.4);
          g.add(l);
        }
        break;
      }
    }

    return g;
  }

  updateGhostPosition(playerX: number, playerZ: number, playerFacing: number) {
    if (!this.ghostMesh || !this.isBuildMode || this.isDemolishMode) {
      if (this.ghostMesh) this.ghostMesh.visible = false;
      return;
    }

    this.ghostMesh.visible = true;

    // Place 7 units ahead of player in facing direction, snapped to 2m grid
    const targetX = playerX + Math.sin(playerFacing) * 7.0;
    const targetZ = playerZ + Math.cos(playerFacing) * 7.0;

    const snap = 2.0;
    const snappedX = Math.round(targetX / snap) * snap;
    const snappedZ = Math.round(targetZ / snap) * snap;
    const groundY = getTerrainHeight(snappedX, snappedZ);

    this.ghostMesh.position.set(snappedX, groundY, snappedZ);
    this.ghostMesh.rotation.y = this.activeRotation;
  }

  placePiece(
    burstCallback: (pos: THREE.Vector3, color: number, count: number, speed: number) => void
  ): PlacedStructure | null {
    if (!this.ghostMesh || !this.isBuildMode) return null;

    const x = this.ghostMesh.position.x;
    const y = this.ghostMesh.position.y;
    const z = this.ghostMesh.position.z;
    const rotation = this.activeRotation;

    const id = `struct_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const pieceGroup = this.createPieceMesh(this.activeType, false);
    pieceGroup.position.set(x, y, z);
    pieceGroup.rotation.y = rotation;
    this.scene.add(pieceGroup);

    // Add collider if wall or solid furniture
    let col: Collider | undefined;
    const def = BUILDING_PIECES[this.activeType];
    if (this.activeType.includes('wall') || this.activeType === 'fence_wood' || this.activeType === 'doorframe') {
      col = { x, z, r: 2.2 };
      colliders.push(col);
    } else if (this.activeType === 'storage_chest' || this.activeType === 'crafting_table' || this.activeType === 'campfire') {
      col = { x, z, r: 1.4 };
      colliders.push(col);
    }

    this.structureMeshes.set(id, { group: pieceGroup, collider: col });

    const newStruct: PlacedStructure = {
      id,
      type: this.activeType,
      x,
      y,
      z,
      rotation,
    };
    this.placedStructures.push(newStruct);

    AudioFX.build();
    burstCallback(new THREE.Vector3(x, y + 1.5, z), 0xfde047, 16, 8);
    return newStruct;
  }

  loadPlacedStructures(saved: PlacedStructure[]) {
    // Clear any existing
    this.structureMeshes.forEach(({ group }) => this.scene.remove(group));
    this.structureMeshes.clear();
    this.placedStructures = [];

    saved.forEach((st) => {
      const g = this.createPieceMesh(st.type, false);
      g.position.set(st.x, st.y, st.z);
      g.rotation.y = st.rotation;
      this.scene.add(g);

      let col: Collider | undefined;
      if (st.type.includes('wall') || st.type === 'fence_wood' || st.type === 'doorframe') {
        col = { x: st.x, z: st.z, r: 2.2 };
        colliders.push(col);
      } else if (st.type === 'storage_chest' || st.type === 'crafting_table' || st.type === 'campfire') {
        col = { x: st.x, z: st.z, r: 1.4 };
        colliders.push(col);
      }

      this.structureMeshes.set(st.id, { group: g, collider: col });
      this.placedStructures.push(st);
    });
  }

  demolishTarget(
    px: number,
    pz: number,
    burstCallback: (pos: THREE.Vector3, color: number, count: number, speed: number) => void
  ): PlacedStructure | null {
    let nearest: PlacedStructure | null = null;
    let minDist = 7.0;

    for (const st of this.placedStructures) {
      const d = Math.hypot(st.x - px, st.z - pz);
      if (d < minDist) {
        minDist = d;
        nearest = st;
      }
    }

    if (!nearest) return null;

    const entry = this.structureMeshes.get(nearest.id);
    if (entry) {
      this.scene.remove(entry.group);
      if (entry.collider) {
        entry.collider.r = 0; // Disable collider
      }
      this.structureMeshes.delete(nearest.id);
    }

    this.placedStructures = this.placedStructures.filter((s) => s.id !== nearest!.id);

    AudioFX.dismantle();
    burstCallback(new THREE.Vector3(nearest.x, nearest.y + 1.5, nearest.z), 0x94a3b8, 18, 9);
    return nearest;
  }

  getNearestFurniture(px: number, pz: number, type: BuildingPieceType, maxDist: number = 5.0): PlacedStructure | null {
    let best: PlacedStructure | null = null;
    let minDist = maxDist;
    for (const st of this.placedStructures) {
      if (st.type === type) {
        const d = Math.hypot(st.x - px, st.z - pz);
        if (d < minDist) {
          minDist = d;
          best = st;
        }
      }
    }
    return best;
  }
}
