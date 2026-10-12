/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { getTerrainHeight } from './terrain.ts';
import { AudioFX } from './audio.ts';

export interface TrialWave {
  waveNum: number;
  nameTh: string;
  monsterKey: string;
  count: number;
}

export interface TrialDef {
  id: string;
  name: string;
  nameTh: string;
  zoneId: number;
  x: number;
  z: number;
  descriptionTh: string;
  color: number;
  runeColor: number;
  waves: TrialWave[];
  rewardExp: number;
  rewardGold: number;
  rewardItems: { itemId: string; count: number; nameTh: string }[];
}

export const TRIALS: Record<string, TrialDef> = {
  trial_forest: {
    id: 'trial_forest',
    name: 'Sylvan Trial of Valor',
    nameTh: 'เสาผนึกท้าทายแห่งพงไพรศักดิ์สิทธิ์',
    zoneId: 2,
    x: -420,
    z: -420,
    descriptionTh: 'บททดสอบความกล้าหาญ ปราบฝูงสไลม์และฝูงหมาป่าพงไพร',
    color: 0x22c55e,
    runeColor: 0x4ade80,
    waves: [
      { waveNum: 1, nameTh: 'Wave 1/3: กองทัพสไลม์ยักษ์', monsterKey: 'SLIME', count: 6 },
      { waveNum: 2, nameTh: 'Wave 2/3: ฝูงหมาป่าล่าเหยื่อ', monsterKey: 'WOLF', count: 5 },
      { waveNum: 3, nameTh: 'Wave 3/3 (บอสเวฟ): โกเลมเพลิงพิทักษ์ป่า', monsterKey: 'FIRE_GOLEM', count: 2 },
    ],
    rewardExp: 750,
    rewardGold: 800,
    rewardItems: [
      { itemId: 'wood_ancient', count: 6, nameTh: 'ไม้เนื้อแข็งโบราณ' },
      { itemId: 'iron_ore', count: 12, nameTh: 'แร่เหล็กดิบ' },
      { itemId: 'potion_hp', count: 3, nameTh: 'ยาฟื้นฟูพลังชีวิต' },
    ],
  },
  trial_magma: {
    id: 'trial_magma',
    name: 'Volcanic Trial of Flame',
    nameTh: 'เสาผนึกท้าทายเปลวเพลิงนรกานต์',
    zoneId: 4,
    x: -550,
    z: 550,
    descriptionTh: 'บททดสอบห่ากักเพลิง ปะทะโกเลมลาวาอันดุร้าย',
    color: 0xf97316,
    runeColor: 0xff4500,
    waves: [
      { waveNum: 1, nameTh: 'Wave 1/3: โกเลมเพลิงลาดตระเวน', monsterKey: 'FIRE_GOLEM', count: 4 },
      { waveNum: 2, nameTh: 'Wave 2/3: กองทัพอสูรลาวาคลั่ง', monsterKey: 'FIRE_GOLEM', count: 6 },
      { waveNum: 3, nameTh: 'Wave 3/3 (บอสเวฟ): ไททันลาวาจอมพิโรธ', monsterKey: 'BOSS', count: 1 },
    ],
    rewardExp: 1800,
    rewardGold: 1800,
    rewardItems: [
      { itemId: 'ore_fire', count: 8, nameTh: 'แร่ออบซิเดียนภูเขาไฟ' },
      { itemId: 'fire_core', count: 3, nameTh: 'แกนเพลิงเพลิงระอุ' },
      { itemId: 'gold_ore', count: 8, nameTh: 'แร่ทองคำบริสุทธิ์' },
    ],
  },
  trial_frost: {
    id: 'trial_frost',
    name: 'Glacial Trial of Everfrost',
    nameTh: 'เสาผนึกท้าทายยอดเขาเยือกแข็งนิรันดร์',
    zoneId: 5,
    x: 620,
    z: 620,
    descriptionTh: 'บททดสอบความหนาวเหน็บ เผชิญหน้ากองทัพโกเลมหิมะและราชาน้ำแข็ง',
    color: 0x38bdf8,
    runeColor: 0x0284c7,
    waves: [
      { waveNum: 1, nameTh: 'Wave 1/3: โกเลมหิมะผู้พิทักษ์', monsterKey: 'ICE_GOLEM', count: 4 },
      { waveNum: 2, nameTh: 'Wave 2/3: กองพลน้ำแข็งหิมะ', monsterKey: 'ICE_GOLEM', count: 6 },
      { waveNum: 3, nameTh: 'Wave 3/3 (บอสเวฟ): จ้าวราชาน้ำแข็ง', monsterKey: 'FROST_KING', count: 1 },
    ],
    rewardExp: 2200,
    rewardGold: 2200,
    rewardItems: [
      { itemId: 'ore_frost', count: 8, nameTh: 'เพชรน้ำแข็งเกล็ดหิมะ' },
      { itemId: 'ice_crystal', count: 4, nameTh: 'ผลึกน้ำแข็งนิรันดร์' },
      { itemId: 'potion_mp', count: 4, nameTh: 'ยาฟื้นฟูมานา' },
    ],
  },
};

export class TrialManager {
  scene: THREE.Scene;
  shrineGroups: { def: TrialDef; group: THREE.Group; crystal: THREE.Mesh; runeRing: THREE.Mesh }[] = [];

  // Active Challenge State
  activeTrialId: string | null = null;
  currentWaveIndex: number = 0;
  remainingMonsters: number = 0;
  totalWaveMonsters: number = 0;
  timeRemaining: number = 0;
  isCompleted: boolean = false;

  // Callbacks
  onSpawnMonsters?: (trialDef: TrialDef, wave: TrialWave) => void;
  onWaveComplete?: (waveNum: number, totalWaves: number) => void;
  onTrialVictory?: (trialDef: TrialDef) => void;
  onTrialDefeat?: (reason: string) => void;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.spawnShrines();
  }

  private spawnShrines() {
    Object.values(TRIALS).forEach((def) => {
      const g = new THREE.Group();
      const y = getTerrainHeight(def.x, def.z);
      g.position.set(def.x, y, def.z);

      // Base Pedestal
      const baseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
      const base = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 5.2, 1.6, 8), baseMat);
      base.position.y = 0.8;
      base.castShadow = true;
      base.receiveShadow = true;
      g.add(base);

      // Carved Monolith Pillar
      const pillarMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(2.4, 7.5, 2.4), pillarMat);
      pillar.position.y = 4.8;
      pillar.castShadow = true;
      g.add(pillar);

      // Glowing Crystal Beacon on top
      const crystalMat = new THREE.MeshStandardMaterial({
        color: def.color,
        emissive: def.runeColor,
        emissiveIntensity: 2.2,
        roughness: 0.2,
      });
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(1.6, 0), crystalMat);
      crystal.position.y = 10.5;
      g.add(crystal);

      // Glowing Rune Ring
      const ringMat = new THREE.MeshBasicMaterial({
        color: def.runeColor,
        side: THREE.DoubleSide,
      });
      const runeRing = new THREE.Mesh(new THREE.RingGeometry(3.6, 4.2, 16), ringMat);
      runeRing.rotation.x = -Math.PI / 2;
      runeRing.position.y = 1.62;
      g.add(runeRing);

      this.scene.add(g);
      this.shrineGroups.push({ def, group: g, crystal, runeRing });
    });
  }

  getNearestShrine(x: number, z: number, maxDist: number = 14) {
    let nearest: TrialDef | null = null;
    let minDist = maxDist;

    for (const sh of this.shrineGroups) {
      const d = Math.hypot(sh.def.x - x, sh.def.z - z);
      if (d < minDist) {
        minDist = d;
        nearest = sh.def;
      }
    }
    return nearest;
  }

  startTrial(trialId: string): boolean {
    if (this.activeTrialId) return false; // Already in trial

    const def = TRIALS[trialId];
    if (!def) return false;

    this.activeTrialId = trialId;
    this.currentWaveIndex = 0;
    this.isCompleted = false;

    AudioFX.roar();
    this.startWave();
    return true;
  }

  private startWave() {
    if (!this.activeTrialId) return;
    const def = TRIALS[this.activeTrialId];
    const wave = def.waves[this.currentWaveIndex];
    if (!wave) {
      this.completeTrial();
      return;
    }

    this.totalWaveMonsters = wave.count;
    this.remainingMonsters = wave.count;
    this.timeRemaining = 120; // 2 minutes per wave

    AudioFX.fanfare();
    if (this.onSpawnMonsters) {
      this.onSpawnMonsters(def, wave);
    }
  }

  onMonsterDefeated() {
    if (!this.activeTrialId) return;
    this.remainingMonsters = Math.max(0, this.remainingMonsters - 1);

    if (this.remainingMonsters <= 0) {
      const def = TRIALS[this.activeTrialId];
      if (this.currentWaveIndex + 1 < def.waves.length) {
        this.currentWaveIndex++;
        AudioFX.quest();
        if (this.onWaveComplete) {
          this.onWaveComplete(this.currentWaveIndex, def.waves.length);
        }
        setTimeout(() => this.startWave(), 2500);
      } else {
        this.completeTrial();
      }
    }
  }

  private completeTrial() {
    if (!this.activeTrialId) return;
    const def = TRIALS[this.activeTrialId];
    this.isCompleted = true;
    AudioFX.fanfare();

    if (this.onTrialVictory) {
      this.onTrialVictory(def);
    }
    this.activeTrialId = null;
  }

  cancelTrial(reason: string) {
    if (!this.activeTrialId) return;
    this.activeTrialId = null;
    if (this.onTrialDefeat) {
      this.onTrialDefeat(reason);
    }
  }

  update(dt: number) {
    // Animate glowing crystals and rune rings
    const now = Date.now() * 0.002;
    this.shrineGroups.forEach((sh) => {
      sh.crystal.rotation.y = now * 0.8;
      sh.crystal.rotation.x = Math.sin(now) * 0.2;
      sh.crystal.position.y = 10.5 + Math.sin(now * 1.5) * 0.4;
      sh.runeRing.rotation.z = -now * 0.5;
    });

    // Check timer for active trial
    if (this.activeTrialId) {
      this.timeRemaining -= dt;
      if (this.timeRemaining <= 0) {
        this.cancelTrial('หมดเวลาทำภารกิจ! บททดสอบล้มเหลว');
      }
    }
  }
}
