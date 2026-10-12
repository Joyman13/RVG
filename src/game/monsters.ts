/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { getTerrainHeight, inLava, resolveColliders, lerpAngle, clamp } from './terrain.ts';
import { AudioFX } from './audio.ts';
import { MONSTER_DROPS, ITEMS } from './constants.ts';

function mat(color: number, opts?: THREE.MeshStandardMaterialParameters) {
  return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.8, flatShading: true }, opts || {}));
}

function box(w: number, h: number, d: number, m: THREE.Material, x = 0, y = 0, z = 0) {
  const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  me.position.set(x, y, z);
  return me;
}

function limb(w: number, h: number, d: number, m: THREE.Material, px: number, py: number, pz: number) {
  const piv = new THREE.Group();
  piv.position.set(px, py, pz);
  const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  me.position.y = -h / 2;
  piv.add(me);
  return piv;
}

function shadowAll(o: THREE.Object3D) {
  o.traverse((c) => {
    if ((c as THREE.Mesh).isMesh) {
      c.castShadow = true;
    }
  });
}

function buildSlime() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(2, 14, 10),
    mat(0x22c55e, { transparent: true, opacity: 0.88, roughness: 0.2, flatShading: false })
  );
  body.position.y = 1.7;
  body.scale.y = 0.85;
  g.add(body);
  const wm = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const pm = new THREE.MeshBasicMaterial({ color: 0x0f172a });
  [-0.7, 0.7].forEach((x) => {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), wm);
    e.position.set(x, 2.2, 1.6);
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), pm);
    p.position.set(x, 2.2, 1.95);
    g.add(e, p);
  });
  shadowAll(g);
  return { group: g, legs: [] as THREE.Group[], arms: [] as THREE.Group[], slime: true };
}

function buildWolf() {
  const g = new THREE.Group();
  const fur = mat(0x6b7280);
  const dark = mat(0x374151);
  const red = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  g.add(
    box(1.8, 1.7, 3.6, fur, 0, 2.3, 0),
    box(1.5, 1.4, 1.6, fur, 0, 3, 2.3),
    box(0.7, 0.6, 1, dark, 0, 2.7, 3.4)
  );
  const e1 = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.9, 4), dark);
  e1.position.set(-0.5, 4, 2.1);
  const e2 = e1.clone();
  e2.position.x = 0.5;
  const tail = box(0.5, 0.5, 2, fur, 0, 2.7, -2.6);
  tail.rotation.x = 0.5;
  g.add(
    e1,
    e2,
    tail,
    box(0.25, 0.25, 0.1, red, -0.4, 3.25, 3.1),
    box(0.25, 0.25, 0.1, red, 0.4, 3.25, 3.1)
  );
  const legs = [
    limb(0.55, 1.6, 0.55, dark, -0.7, 1.6, 1.2),
    limb(0.55, 1.6, 0.55, dark, 0.7, 1.6, 1.2),
    limb(0.55, 1.6, 0.55, dark, -0.7, 1.6, -1.2),
    limb(0.55, 1.6, 0.55, dark, 0.7, 1.6, -1.2),
  ];
  legs.forEach((l) => g.add(l));
  shadowAll(g);
  return { group: g, legs, arms: [] as THREE.Group[], slime: false };
}

function buildFireGolem(boss: boolean) {
  const g = new THREE.Group();
  const rock = mat(boss ? 0x2a1410 : 0x1e1b18, { roughness: 0.95 });
  const glow = mat(boss ? 0xff7a00 : 0xff4500, {
    emissive: boss ? 0xff5500 : 0xff2200,
    emissiveIntensity: boss ? 3 : 2.2,
  });
  g.add(
    box(4, 5, 3, rock, 0, 4.5, 0),
    box(2, 2, 3.2, glow, 0, 4.8, 0),
    box(2.2, 2.2, 2.2, rock, 0, 7.9, 0),
    box(0.5, 0.4, 0.2, glow, -0.5, 8.1, 1.15),
    box(0.5, 0.4, 0.2, glow, 0.5, 8.1, 1.15)
  );
  const legs = [limb(1.6, 3, 1.6, rock, -1, 3, 0), limb(1.6, 3, 1.6, rock, 1, 3, 0)];
  const arms = [limb(1.4, 4, 1.4, rock, -2.9, 6.6, 0), limb(1.4, 4, 1.4, rock, 2.9, 6.6, 0)];
  [...legs, ...arms].forEach((l) => g.add(l));
  if (boss) {
    [-1, 1].forEach((s) => {
      const h = new THREE.Mesh(new THREE.ConeGeometry(0.5, 2.2, 6), glow);
      h.position.set(s * 1.2, 9.8, 0);
      h.rotation.z = -s * 0.4;
      g.add(h);
    });
  }
  shadowAll(g);
  return { group: g, legs, arms, slime: false };
}

function buildIceGolem() {
  const g = new THREE.Group();
  const ice = mat(0x38bdf8, { emissive: 0x0284c7, emissiveIntensity: 0.4 });
  const dk = mat(0x0ea5e9, { emissive: 0x0369a1, emissiveIntensity: 0.3 });
  const body = new THREE.Mesh(new THREE.IcosahedronGeometry(2.8, 0), ice);
  body.position.y = 4.8;
  body.scale.y = 1.25;
  const head = new THREE.Mesh(new THREE.OctahedronGeometry(1.5, 0), dk);
  head.position.y = 8.6;
  g.add(
    body,
    head,
    box(0.5, 0.4, 0.2, new THREE.MeshBasicMaterial({ color: 0xffffff }), -0.5, 8.7, 1.2),
    box(0.5, 0.4, 0.2, new THREE.MeshBasicMaterial({ color: 0xffffff }), 0.5, 8.7, 1.2)
  );
  const legs = [limb(1.5, 2.6, 1.5, dk, -1, 2.6, 0), limb(1.5, 2.6, 1.5, dk, 1, 2.6, 0)];
  const arms = [limb(1.3, 4, 1.3, ice, -3.2, 6.4, 0), limb(1.3, 4, 1.3, ice, 3.2, 6.4, 0)];
  [...legs, ...arms].forEach((l) => g.add(l));
  shadowAll(g);
  return { group: g, legs, arms, slime: false };
}

function buildDragon() {
  const g = new THREE.Group();
  const redMat = mat(0xb91c1c, { roughness: 0.6 });
  const darkMat = mat(0x450a0a, { roughness: 0.8 });
  const goldMat = mat(0xeab308, { roughness: 0.4 });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  const hornMat = mat(0x18181b);
  const wingMat = mat(0x991b1b, { side: THREE.DoubleSide });

  // Dragon Torso & Golden Belly
  g.add(
    box(3.8, 3.2, 6.2, redMat, 0, 3.8, 0),
    box(2.8, 2.0, 5.0, goldMat, 0, 2.8, 0.4)
  );

  // Long Muscular Neck
  const neck = box(2.0, 3.5, 2.0, redMat, 0, 6.2, 3.2);
  neck.rotation.x = 0.35;
  g.add(neck);

  // Fierce Dragon Head
  const head = box(2.4, 2.0, 3.2, redMat, 0, 8.2, 4.8);
  const snout = box(1.8, 1.4, 2.2, darkMat, 0, 7.8, 6.8);
  g.add(head, snout);

  // Glowing Fiery Eyes
  [-0.9, 0.9].forEach((x) => {
    g.add(box(0.35, 0.35, 0.2, eyeMat, x, 8.6, 5.8));
  });

  // Majestic Horns
  [-0.9, 0.9].forEach((s) => {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.35, 2.6, 5), hornMat);
    horn.position.set(s, 9.8, 3.8);
    horn.rotation.x = -0.5;
    horn.rotation.z = -s * 0.3;
    g.add(horn);
  });

  // Long Spiked Tail
  const tail = box(1.4, 1.4, 6.5, redMat, 0, 3.6, -5.2);
  tail.rotation.x = 0.15;
  const tailTip = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.2, 4), darkMat);
  tailTip.position.set(0, 3.4, -9.0);
  tailTip.rotation.x = -Math.PI / 2;
  g.add(tail, tailTip);

  // Massive Flapping Dragon Wings
  const wings = new THREE.Group();
  wings.position.set(0, 4.8, 0.6);
  [-1, 1].forEach((dir) => {
    const wPivot = new THREE.Group();
    wPivot.position.set(dir * 2.0, 0, 0);
    const bone = box(4.8, 0.4, 0.4, hornMat, dir * 2.4, 0.5, 0);
    bone.rotation.z = dir * 0.18;
    const flap = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 4.0), wingMat);
    flap.position.set(dir * 2.7, -1.8, 0);
    flap.rotation.x = Math.PI / 2;
    wPivot.add(bone, flap);
    wings.add(wPivot);
  });
  g.add(wings);

  // 4 Muscular Legs with Claws
  const legs = [
    limb(1.4, 3.4, 1.4, darkMat, -1.6, 3.2, 2.0),
    limb(1.4, 3.4, 1.4, darkMat, 1.6, 3.2, 2.0),
    limb(1.4, 3.4, 1.4, darkMat, -1.6, 3.2, -2.0),
    limb(1.4, 3.4, 1.4, darkMat, 1.6, 3.2, -2.0),
  ];
  legs.forEach((l) => g.add(l));

  shadowAll(g);
  return { group: g, legs, arms: [] as THREE.Group[], slime: false, wings };
}

export interface MonsterTypeConfig {
  name: string;
  nameTh: string;
  hp: number;
  atk: number;
  exp: number;
  gold: [number, number];
  speed: number;
  aggro: number;
  leash: number;
  radius: number;
  scale: number;
  atkRate: number;
  height: number;
  build: () => { group: THREE.Group; legs: THREE.Group[]; arms: THREE.Group[]; slime: boolean; wings?: THREE.Group };
  respawn: number;
  potion: number;
  boss?: boolean;
  icon?: string;
  ringColor?: number;
  burstColor?: number;
  slamText?: string;
}

export const MONSTER_TYPES: Record<string, MonsterTypeConfig> = {
  SLIME: {
    name: 'Slime',
    nameTh: 'สไลม์ป่า',
    hp: 60,
    atk: 9,
    exp: 30,
    gold: [10, 22],
    speed: 3.8,
    aggro: 22,
    leash: 70,
    radius: 2.2,
    scale: 1,
    atkRate: 1.4,
    height: 5,
    build: buildSlime,
    respawn: 14,
    potion: 0.08,
  },
  WOLF: {
    name: 'Forest Wolf',
    nameTh: 'หมาป่าพงไพร',
    hp: 110,
    atk: 15,
    exp: 50,
    gold: [18, 34],
    speed: 8,
    aggro: 30,
    leash: 80,
    radius: 2.2,
    scale: 1,
    atkRate: 1.0,
    height: 5.5,
    build: buildWolf,
    respawn: 16,
    potion: 0.12,
  },
  FIRE_GOLEM: {
    name: 'Fire Golem',
    nameTh: 'โกเลมเพลิงภูเขาไฟ',
    hp: 320,
    atk: 30,
    exp: 95,
    gold: [35, 65],
    speed: 4.8,
    aggro: 28,
    leash: 80,
    radius: 2.8,
    scale: 1,
    atkRate: 1.8,
    height: 10.5,
    build: () => buildFireGolem(false),
    respawn: 20,
    potion: 0.18,
  },
  ICE_GOLEM: {
    name: 'Ice Golem',
    nameTh: 'โกเลมหิมะเยือกแข็ง',
    hp: 260,
    atk: 26,
    exp: 85,
    gold: [30, 55],
    speed: 4.8,
    aggro: 28,
    leash: 80,
    radius: 2.8,
    scale: 1,
    atkRate: 1.7,
    height: 10.5,
    build: buildIceGolem,
    respawn: 20,
    potion: 0.18,
  },
  BOSS: {
    name: 'Lava Titan',
    nameTh: 'ไททันลาวาจ้าวภูเขาไฟ',
    hp: 2500,
    atk: 70,
    exp: 800,
    gold: [450, 550],
    speed: 5.5,
    aggro: 55,
    leash: 100,
    radius: 6,
    scale: 2.4,
    atkRate: 1.6,
    height: 10.5,
    build: () => buildFireGolem(true),
    respawn: 120,
    potion: 1,
    boss: true,
    icon: '🔥',
    ringColor: 0xff2200,
    burstColor: 0xff6a00,
    slamText: '⚠ Lava Titan slams the ground — JUMP!',
  },
  FROST_KING: {
    name: 'Frost King',
    nameTh: 'ราชาน้ำแข็งแห่งยอดเขา',
    hp: 2000,
    atk: 56,
    exp: 600,
    gold: [300, 400],
    speed: 5,
    aggro: 50,
    leash: 100,
    radius: 6,
    scale: 2.3,
    atkRate: 1.6,
    height: 10.5,
    build: buildIceGolem,
    respawn: 120,
    potion: 1,
    boss: true,
    icon: '❄️',
    ringColor: 0x38bdf8,
    burstColor: 0x93e5ff,
    slamText: '⚠ Frost King unleashes a Frost Nova — JUMP!',
  },
  DRAKE: {
    name: 'Infernal Sky Drake',
    nameTh: 'จอมมังกรอเวจี อิกนีเซียส',
    hp: 4500,
    atk: 88,
    exp: 1800,
    gold: [900, 1600],
    speed: 7.2,
    aggro: 75,
    leash: 140,
    radius: 7.5,
    scale: 2.2,
    atkRate: 1.5,
    height: 12.0,
    build: buildDragon,
    respawn: 180,
    potion: 1,
    boss: true,
    icon: '🐉',
    ringColor: 0xef4444,
    burstColor: 0xff7700,
    slamText: '⚠ มังกรคำรามและพ่นเพลิงอเวจี — JUMP หลบแรงกระแทก!',
  },
};

export class MonsterInstance {
  key: string;
  T: MonsterTypeConfig;
  mesh: THREE.Group;
  model: { group: THREE.Group; legs: THREE.Group[]; arms: THREE.Group[]; slime: boolean; wings?: THREE.Group };
  spawn: { x: number; z: number };
  maxHp: number;
  hp: number;
  state: 'idle' | 'chase' | 'return' | 'dead' = 'idle';
  atkCd: number = Math.random();
  heading: number = Math.random() * 6.28;
  walkT: number = Math.random() * 6;
  flash: number = 0;
  kx: number = 0;
  kz: number = 0;
  deathT: number = 0;
  respawnT: number = 0;
  provoked: boolean = false;
  wanderT: number = Math.random() * 3;
  wx: number;
  wz: number;
  lunge: number = 0;
  slamCd: number = 4;
  slamT: number = 0;
  ring: THREE.Mesh | null = null;
  radius: number;
  isBoss: boolean;

  constructor(key: string, x: number, z: number, scene: THREE.Scene) {
    this.key = key;
    this.T = MONSTER_TYPES[key];
    this.mesh = new THREE.Group();
    this.model = this.T.build();
    this.mesh.add(this.model.group);
    this.mesh.scale.setScalar(this.T.scale);
    this.spawn = { x, z };
    this.wx = x;
    this.wz = z;
    this.mesh.position.set(x, getTerrainHeight(x, z), z);
    this.maxHp = this.hp = this.T.hp;
    this.radius = this.T.radius;
    this.isBoss = !!this.T.boss;
    this.mesh.rotation.y = this.heading;
    scene.add(this.mesh);
  }

  get pos() {
    return this.mesh.position;
  }

  moveToward(tx: number, tz: number, speed: number, dt: number): boolean {
    const p = this.mesh.position;
    const dx = tx - p.x;
    const dz = tz - p.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.05) return false;
    const nx = p.x + (dx / d) * speed * dt;
    const nz = p.z + (dz / d) * speed * dt;
    if (getTerrainHeight(nx, nz) < -0.8 || inLava(nx, nz, 1)) return false;
    p.x = nx;
    p.z = nz;
    this.heading = lerpAngle(this.heading, Math.atan2(dx, dz), 10 * dt);
    this.walkT += dt * speed * 0.9;
    return true;
  }

  update(
    dt: number,
    playerPos: THREE.Vector3,
    isRiding: boolean,
    isDead: boolean,
    onPlayerDamage: (dmg: number) => void,
    burstCallback: (pos: THREE.Vector3, color: number, count: number, speed: number) => void,
    onSlamDodged: () => void,
    onBossWarning: (text: string) => void
  ) {
    const T = this.T;
    const p = this.mesh.position;
    if (this.state === 'dead') {
      if (this.deathT > 0) {
        this.deathT -= dt;
        this.mesh.scale.setScalar(Math.max(0.001, this.deathT / 0.5) * T.scale);
        if (this.deathT <= 0) this.mesh.visible = false;
      } else {
        this.respawnT -= dt;
        if (this.respawnT <= 0) this.respawn();
      }
      return;
    }

    const dx = playerPos.x - p.x;
    const dz = playerPos.z - p.z;
    const dist = Math.hypot(dx, dz);
    const homeD = Math.hypot(this.spawn.x - p.x, this.spawn.z - p.z);
    if (dist > 130 && this.state === 'idle') return;

    const playerOK = !isRiding && !isDead;
    if (this.state === 'return') {
      if (homeD < 2.5) this.state = 'idle';
    } else if (playerOK && homeD < T.leash && (dist < T.aggro || this.provoked)) {
      this.state = 'chase';
    } else if (this.state === 'chase') {
      this.state = 'return';
      this.provoked = false;
    }

    let moving = false;
    this.atkCd -= dt;

    if (this.state === 'chase') {
      const range = this.radius + 1.8;
      if (dist > range) {
        moving = this.moveToward(playerPos.x, playerPos.z, T.speed, dt);
      } else {
        this.heading = lerpAngle(this.heading, Math.atan2(dx, dz), 10 * dt);
        if (this.atkCd <= 0) {
          this.atkCd = T.atkRate;
          this.lunge = 0.25;
          onPlayerDamage(T.atk * (0.85 + Math.random() * 0.3));
        }
      }
      if (this.isBoss) {
        this.updateBoss(dt, dist, playerPos, isRiding, onPlayerDamage, burstCallback, onSlamDodged, onBossWarning);
      }
    } else if (this.state === 'return') {
      moving = this.moveToward(this.spawn.x, this.spawn.z, T.speed * 1.4, dt);
      this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.15 * dt);
    } else {
      this.wanderT -= dt;
      if (this.wanderT <= 0) {
        this.wanderT = 2 + Math.random() * 3;
        const a = Math.random() * 6.28;
        const r = Math.random() * 9;
        this.wx = this.spawn.x + Math.cos(a) * r;
        this.wz = this.spawn.z + Math.sin(a) * r;
      }
      if (Math.hypot(this.wx - p.x, this.wz - p.z) > 1) {
        moving = this.moveToward(this.wx, this.wz, T.speed * 0.35, dt);
      }
    }

    // Knockback
    if (Math.abs(this.kx) + Math.abs(this.kz) > 0.05) {
      const nx = p.x + this.kx * dt;
      const nz = p.z + this.kz * dt;
      if (getTerrainHeight(nx, nz) > -0.8 && !inLava(nx, nz, 1)) {
        p.x = nx;
        p.z = nz;
      }
      const f = Math.exp(-8 * dt);
      this.kx *= f;
      this.kz *= f;
    }

    resolveColliders(p, this.radius * 0.5);
    p.y = getTerrainHeight(p.x, p.z);
    this.mesh.rotation.y = this.heading;

    // Animation
    this.flash = Math.max(0, this.flash - dt * 5);
    this.mesh.scale.setScalar(T.scale * (1 + 0.15 * this.flash));
    if (this.lunge > 0) {
      this.lunge -= dt;
      this.model.group.position.z = Math.sin(clamp(this.lunge / 0.25, 0, 1) * Math.PI) * 1.4;
    } else {
      this.model.group.position.z = 0;
    }

    if (this.model.slime) {
      this.model.group.scale.y = 1 + Math.sin(Date.now() * 0.006 + this.walkT) * 0.12;
    }
    const sw = moving ? Math.sin(this.walkT) * 0.7 : 0;
    this.model.legs.forEach((l, i) => (l.rotation.x = i % 2 ? -sw : sw));
    this.model.arms.forEach((a, i) => (a.rotation.x = (i % 2 ? sw : -sw) * 0.8 - (this.lunge > 0 ? 1.2 : 0)));
    if (this.model.wings) {
      this.model.wings.rotation.z = Math.sin(Date.now() * 0.007) * 0.35;
    }
  }

  private updateBoss(
    dt: number,
    dist: number,
    playerPos: THREE.Vector3,
    isRiding: boolean,
    onPlayerDamage: (dmg: number) => void,
    burstCallback: (pos: THREE.Vector3, color: number, count: number, speed: number) => void,
    onSlamDodged: () => void,
    onBossWarning: (text: string) => void
  ) {
    if (this.slamT > 0) {
      this.slamT -= dt;
      if (this.slamT <= 0) {
        AudioFX.boom();
        burstCallback(this.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)), this.T.burstColor || 0xff6a00, 30, 16);
        const d = Math.hypot(playerPos.x - this.mesh.position.x, playerPos.z - this.mesh.position.z);
        const airborne = playerPos.y > getTerrainHeight(playerPos.x, playerPos.z) + 1.4;
        if (d < 14 && !airborne && !isRiding) {
          onPlayerDamage(this.T.atk * 1.7);
        } else if (d < 15 && airborne) {
          onSlamDodged();
        }
        this.slamCd = 7;
      }
    } else {
      this.slamCd -= dt;
      if (this.slamCd <= 0 && dist < 26) {
        this.slamT = 1.0;
        onBossWarning(this.T.slamText || '⚠ Boss is preparing a massive shockwave — JUMP!');
      }
    }
  }

  takeDamage(
    amount: number,
    playerPos: THREE.Vector3,
    onDeath: () => void
  ): boolean {
    if (this.state === 'dead') return false;
    this.hp -= amount;
    this.flash = 1;
    this.provoked = true;
    if (this.state === 'return') this.state = 'chase';
    AudioFX.hit();

    const dx = this.mesh.position.x - playerPos.x;
    const dz = this.mesh.position.z - playerPos.z;
    const d = Math.hypot(dx, dz) || 1;
    const kb = this.isBoss ? 1.5 : 9;
    this.kx += (dx / d) * kb;
    this.kz += (dz / d) * kb;

    if (this.hp <= 0) {
      this.die(onDeath);
      return true;
    }
    return false;
  }

  die(onDeath: () => void) {
    this.hp = 0;
    this.state = 'dead';
    this.deathT = 0.5;
    this.respawnT = this.T.respawn;
    onDeath();
  }

  respawn() {
    this.state = 'idle';
    this.hp = this.maxHp;
    this.provoked = false;
    this.mesh.visible = true;
    this.mesh.scale.setScalar(this.T.scale);
    this.mesh.position.set(this.spawn.x, getTerrainHeight(this.spawn.x, this.spawn.z), this.spawn.z);
  }

  rollDrops(bonusLootChance: number = 0): { itemId: string; count: number; name: string }[] {
    const list = MONSTER_DROPS[this.key] || [];
    const results: { itemId: string; count: number; name: string }[] = [];

    list.forEach((entry) => {
      const chance = Math.min(1.0, entry.chance * (1 + bonusLootChance));
      if (Math.random() < chance) {
        const count = Math.floor(entry.min + Math.random() * (entry.max - entry.min + 1));
        const itemDef = ITEMS[entry.itemId];
        if (itemDef && count > 0) {
          results.push({
            itemId: entry.itemId,
            count,
            name: itemDef.nameTh,
          });
        }
      }
    });

    return results;
  }
}
