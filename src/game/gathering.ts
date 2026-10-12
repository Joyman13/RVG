/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { HarvestNodeType, HarvestNodeDef } from '../types.ts';
import { HARVEST_NODE_DEFS, ITEMS } from './constants.ts';
import { getTerrainHeight, colliders, inLava, zoneAt, Collider } from './terrain.ts';
import { AudioFX } from './audio.ts';

export interface ActiveHarvestNode {
  id: string;
  type: HarvestNodeType;
  def: HarvestNodeDef;
  x: number;
  y: number;
  z: number;
  hp: number;
  maxHp: number;
  mesh: THREE.Group;
  collider: Collider;
  isHarvested: boolean;
  respawnTimer: number;
  flashTimer: number;
}

export class GatheringSystem {
  scene: THREE.Scene;
  nodes: ActiveHarvestNode[] = [];
  onLootGained?: (itemId: string, count: number, name: string) => void;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.spawnAllWorldNodes();
  }

  private spawnAllWorldNodes() {
    let idCounter = 1;

    // Helper to spawn node if valid spot
    const trySpawn = (type: HarvestNodeType, xMin: number, xMax: number, zMin: number, zMax: number, count: number, zoneReq: number) => {
      let spawned = 0;
      for (let i = 0; i < count * 20 && spawned < count; i++) {
        const x = xMin + Math.random() * (xMax - xMin);
        const z = zMin + Math.random() * (zMax - zMin);
        if (zoneAt(x, z) !== zoneReq) continue;
        const h = getTerrainHeight(x, z);
        if (h < 0.4 || inLava(x, z, 5)) continue;

        // Check distance to existing colliders
        let tooClose = false;
        for (const c of colliders) {
          if ((x - c.x) ** 2 + (z - c.z) ** 2 < (c.r + 3.0) ** 2) {
            tooClose = true;
            break;
          }
        }
        if (tooClose) continue;

        this.createNode(`node_${idCounter++}`, type, x, z);
        spawned++;
      }
    };

    // Zone 1 (Village & surroundings)
    trySpawn('tree_oak', -180, 180, -180, 180, 28, 1);
    trySpawn('rock_granite', -190, 190, -190, 190, 20, 1);
    trySpawn('rock_iron', -190, 190, -190, 190, 16, 1);

    // Zone 2 (Whispering Forest)
    trySpawn('tree_oak', -750, -70, -750, 120, 48, 2);
    trySpawn('tree_ancient', -750, -80, -750, 100, 32, 2);
    trySpawn('rock_granite', -750, -70, -750, 120, 28, 2);
    trySpawn('rock_iron', -750, -70, -750, 120, 24, 2);

    // Zone 4 (Volcano Ridge)
    trySpawn('ore_fire', -780, 60, 90, 780, 42, 4);
    trySpawn('rock_granite', -780, 60, 90, 780, 30, 4);
    trySpawn('rock_gold', -780, 60, 90, 780, 25, 4);

    // Zone 5 (Frostbite Peaks)
    trySpawn('tree_frost', 60, 780, 90, 780, 45, 5);
    trySpawn('ore_frost', 60, 780, 90, 780, 38, 5);
    trySpawn('rock_iron', 60, 780, 90, 780, 26, 5);

    // Zone 3 (Grand Castle City outskirts)
    trySpawn('rock_granite', 110, 780, -780, 60, 34, 3);
    trySpawn('rock_iron', 110, 780, -780, 60, 28, 3);
    trySpawn('rock_gold', 110, 780, -780, 60, 22, 3);
  }

  private createNode(id: string, type: HarvestNodeType, x: number, z: number) {
    const def = HARVEST_NODE_DEFS[type];
    const y = getTerrainHeight(x, z);
    const g = new THREE.Group();
    g.position.set(x, y, z);

    let radius = 1.8;

    if (type.startsWith('tree')) {
      // Tree visual model
      const isAncient = type === 'tree_ancient';
      const isFrost = type === 'tree_frost';
      const trunkColor = isFrost ? 0x3f2e21 : isAncient ? 0x451a03 : 0x54381e;
      const foliageColor = def.color;

      const trunkH = isAncient ? 7.5 : 5.0;
      const trunkR = isAncient ? 1.4 : 0.85;
      radius = trunkR + 0.4;

      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(trunkR * 0.8, trunkR, trunkH, 7),
        new THREE.MeshStandardMaterial({ color: trunkColor, roughness: 0.9 })
      );
      trunk.position.y = trunkH / 2;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      g.add(trunk);

      // Foliage layers
      const layers = isAncient ? 4 : 3;
      for (let j = 0; j < layers; j++) {
        const coneR = (isAncient ? 6.5 : 4.8) - j * 1.0;
        const coneH = isAncient ? 5.5 : 4.2;
        const leaves = new THREE.Mesh(
          new THREE.ConeGeometry(coneR, coneH, 7),
          new THREE.MeshStandardMaterial({ color: foliageColor, roughness: 0.8, flatShading: true })
        );
        leaves.position.y = trunkH + j * (isAncient ? 3.0 : 2.5);
        leaves.castShadow = true;
        g.add(leaves);
      }
    } else {
      // Rock / Ore visual model
      const isOre = type.includes('ore') || type.includes('gold');
      radius = 1.6;
      const rockMat = new THREE.MeshStandardMaterial({
        color: def.color,
        roughness: isOre ? 0.4 : 0.9,
        metalness: isOre ? 0.7 : 0.1,
        flatShading: true,
      });

      const boulder = new THREE.Mesh(new THREE.DodecahedronGeometry(2.0 * def.scale, 0), rockMat);
      boulder.position.y = 1.4 * def.scale;
      boulder.rotation.set(Math.random(), Math.random(), Math.random());
      boulder.castShadow = true;
      boulder.receiveShadow = true;
      g.add(boulder);

      // Embedded sparkling crystal / ore facets
      if (isOre) {
        const gemColor = type === 'ore_fire' ? 0xff4500 : type === 'ore_frost' ? 0x67e8f9 : 0xfde047;
        for (let i = 0; i < 4; i++) {
          const crystal = new THREE.Mesh(
            new THREE.ConeGeometry(0.5, 1.4, 5),
            new THREE.MeshStandardMaterial({
              color: gemColor,
              emissive: gemColor,
              emissiveIntensity: 0.8,
              roughness: 0.2,
            })
          );
          const a = (i / 4) * Math.PI * 2;
          crystal.position.set(Math.cos(a) * 1.3, 1.5 + Math.sin(a) * 0.4, Math.sin(a) * 1.3);
          crystal.rotation.set(Math.random(), Math.random(), Math.random());
          g.add(crystal);
        }
      }
    }

    this.scene.add(g);
    const col: Collider = { x, z, r: radius };
    colliders.push(col);

    this.nodes.push({
      id,
      type,
      def,
      x,
      y,
      z,
      hp: def.maxHp,
      maxHp: def.maxHp,
      mesh: g,
      collider: col,
      isHarvested: false,
      respawnTimer: 0,
      flashTimer: 0,
    });
  }

  harvest(
    node: ActiveHarvestNode,
    damage: number,
    skillLumberjack: number,
    skillMiner: number,
    burstCallback: (pos: THREE.Vector3, color: number, count: number, speed: number) => void
  ): boolean {
    if (node.isHarvested) return false;

    // Apply skill damage bonus
    let effectiveDmg = damage;
    const isTree = node.type.startsWith('tree');
    if (isTree) {
      if (skillLumberjack > 0) effectiveDmg *= 1 + skillLumberjack * 0.5;
      AudioFX.chop();
    } else {
      if (skillMiner > 0) effectiveDmg *= 1 + skillMiner * 0.5;
      AudioFX.mine();
    }

    node.hp = Math.max(0, node.hp - effectiveDmg);
    node.flashTimer = 0.2;
    node.mesh.scale.setScalar(1.08);

    // Particle burst
    const hitPos = new THREE.Vector3(node.x, node.y + 2.5, node.z);
    burstCallback(hitPos, node.def.color, 8, 8);

    if (node.hp <= 0) {
      this.breakNode(node, skillLumberjack, skillMiner, burstCallback);
      return true;
    }
    return false;
  }

  private breakNode(
    node: ActiveHarvestNode,
    skillLumberjack: number,
    skillMiner: number,
    burstCallback: (pos: THREE.Vector3, color: number, count: number, speed: number) => void
  ) {
    node.isHarvested = true;
    node.respawnTimer = 22.0; // Respawns after 22 seconds!
    node.mesh.visible = false;
    node.collider.r = 0; // Disable collision while harvested

    const hitPos = new THREE.Vector3(node.x, node.y + 2.0, node.z);
    burstCallback(hitPos, node.def.color, 24, 14);

    // Calculate yield
    const isTree = node.type.startsWith('tree');
    let yieldCount = Math.floor(node.def.dropMin + Math.random() * (node.def.dropMax - node.def.dropMin + 1));
    if (isTree && skillLumberjack > 0) yieldCount += skillLumberjack;

    const mainItem = ITEMS[node.def.dropItemId];
    if (this.onLootGained && mainItem) {
      this.onLootGained(node.def.dropItemId, yieldCount, mainItem.nameTh);
    }

    // Rare drop check
    if (node.def.rareDropId) {
      let rareChance = node.def.rareChance || 0.15;
      if (!isTree && skillMiner > 0) rareChance += skillMiner * 0.1;
      if (Math.random() < rareChance) {
        const rareItem = ITEMS[node.def.rareDropId];
        if (rareItem && this.onLootGained) {
          const rareQty = Math.floor(1 + Math.random() * 2);
          this.onLootGained(node.def.rareDropId, rareQty, rareItem.nameTh);
        }
      }
    }
  }

  update(dt: number) {
    this.nodes.forEach((n) => {
      if (n.flashTimer > 0) {
        n.flashTimer -= dt;
        if (n.flashTimer <= 0) {
          n.mesh.scale.setScalar(1.0);
        }
      }

      if (n.isHarvested) {
        n.respawnTimer -= dt;
        if (n.respawnTimer <= 0) {
          n.isHarvested = false;
          n.hp = n.maxHp;
          n.mesh.visible = true;
          n.collider.r = n.type.startsWith('tree') ? 1.4 : 1.6;
          n.mesh.scale.setScalar(1.0);
        }
      }
    });
  }

  getNearestNode(px: number, pz: number, maxDist: number = 6.0): ActiveHarvestNode | null {
    let best: ActiveHarvestNode | null = null;
    let minDist = maxDist;
    for (const n of this.nodes) {
      if (n.isHarvested) continue;
      const d = Math.hypot(n.x - px, n.z - pz);
      if (d < minDist) {
        minDist = d;
        best = n;
      }
    }
    return best;
  }
}
