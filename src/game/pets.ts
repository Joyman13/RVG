/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { getTerrainHeight, lerp } from './terrain.ts';
import { AudioFX } from './audio.ts';

export type PetId = 'fox' | 'dragon' | 'wolf';

export interface PetDef {
  id: PetId;
  name: string;
  nameTh: string;
  icon: string;
  descriptionTh: string;
  perkTh: string;
  color: number;
}

export const PET_DEFS: Record<PetId, PetDef> = {
  fox: {
    id: 'fox',
    name: 'Spirit Fox',
    nameTh: 'จิ้งจอกสายลม สปิริต',
    icon: '🦊',
    descriptionTh: 'ภูตจิ้งจอกตัวน้อยแห่งพงไพร วิ่งเคียงข้างอย่างจงรักภักดี',
    perkTh: 'วิ่งเร็วขึ้น +25% และฟื้นฟูเลือดอัตโนมัติ +4 HP ทุก 3 วินาที',
    color: 0xf97316,
  },
  dragon: {
    id: 'dragon',
    name: 'Baby Fire Drake',
    nameTh: 'มังกรเพลิงน้อย ดราโก้',
    icon: '🐉',
    descriptionTh: 'ลูกมังกรไฟปีกแดง บินลอยเคียงข้างไหล่ของผู้เล่น',
    perkTh: 'ยิงลูกไฟเพลิงใส่ศัตรูที่อยู่ใกล้เคียง (35 ดาเมจ) ทุกๆ 3.5 วินาที',
    color: 0xef4444,
  },
  wolf: {
    id: 'wolf',
    name: 'Guardian Wolf Pup',
    nameTh: 'ลูกหมาป่าพิทักษ์ การ์เดียน',
    icon: '🐺',
    descriptionTh: 'ลูกหมาป่าขนสีเงินผู้กล้าหาญ คอยระวังภัยรอบตัว',
    perkTh: 'เพิ่มพลังโจมตีให้ผู้เล่น +18 ATK และช่วยกระโดดกัดมอนสเตอร์',
    color: 0x94a3b8,
  },
};

export class PetManager {
  scene: THREE.Scene;
  activePetId: PetId | null = null;
  mesh: THREE.Group;
  modelGroup: THREE.Group;
  wingsGroup: THREE.Group | null = null;
  tailGroup: THREE.Group | null = null;
  animTimer: number = 0;
  abilityTimer: number = 0;
  orbitAngle: number = 0;

  // Callbacks
  onPetHeal?: (amount: number) => void;
  onPetAttack?: (targetPos: THREE.Vector3, dmg: number) => void;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.mesh = new THREE.Group();
    this.modelGroup = new THREE.Group();
    this.mesh.add(this.modelGroup);
    this.mesh.visible = false;
    this.scene.add(this.mesh);
  }

  setPet(petId: PetId | null, playerPos?: THREE.Vector3) {
    this.activePetId = petId;
    while (this.modelGroup.children.length > 0) {
      this.modelGroup.remove(this.modelGroup.children[0]);
    }
    this.wingsGroup = null;
    this.tailGroup = null;

    if (!petId) {
      this.mesh.visible = false;
      return;
    }

    this.mesh.visible = true;
    if (playerPos) {
      this.mesh.position.set(playerPos.x - 2, playerPos.y + 1, playerPos.z - 2);
    }

    if (petId === 'dragon') {
      this.buildBabyDragon();
    } else if (petId === 'fox') {
      this.buildSpiritFox();
    } else if (petId === 'wolf') {
      this.buildWolfPup();
    }
  }

  private buildBabyDragon() {
    const g = new THREE.Group();
    const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5 });
    const bellyMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.6 });
    const hornMat = new THREE.MeshStandardMaterial({ color: 0x1e1b18 });
    const wingMat = new THREE.MeshStandardMaterial({ color: 0xef4444, side: THREE.DoubleSide });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });

    // Chubby Dragon Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 1.2), redMat);
    body.position.y = 0.5;
    g.add(body);

    const belly = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.9), bellyMat);
    belly.position.set(0, 0.45, 0.15);
    g.add(belly);

    // Cute Big Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.8, 0.9), redMat);
    head.position.set(0, 1.05, 0.7);
    g.add(head);

    // Snout
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.5), redMat);
    snout.position.set(0, 0.9, 1.2);
    g.add(snout);

    // Eyes
    [-0.35, 0.35].forEach((x) => {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.1), eyeMat);
      eye.position.set(x, 1.15, 1.15);
      g.add(eye);
    });

    // Little Horns
    [-0.3, 0.3].forEach((x) => {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.5, 5), hornMat);
      horn.position.set(x, 1.55, 0.5);
      horn.rotation.x = -0.3;
      g.add(horn);
    });

    // Wings Pivot
    this.wingsGroup = new THREE.Group();
    this.wingsGroup.position.set(0, 0.8, 0);

    const leftWing = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.7), wingMat);
    leftWing.position.set(-0.75, 0.1, 0);
    leftWing.rotation.z = -0.2;

    const rightWing = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.7), wingMat);
    rightWing.position.set(0.75, 0.1, 0);
    rightWing.rotation.z = 0.2;

    this.wingsGroup.add(leftWing, rightWing);
    g.add(this.wingsGroup);

    // Tail
    this.tailGroup = new THREE.Group();
    this.tailGroup.position.set(0, 0.5, -0.6);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.9), redMat);
    tail.position.z = -0.45;
    this.tailGroup.add(tail);
    g.add(this.tailGroup);

    this.modelGroup.add(g);
  }

  private buildSpiritFox() {
    const g = new THREE.Group();
    const orangeMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.6 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });

    // Fox Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 1.3), orangeMat);
    body.position.y = 0.65;
    g.add(body);

    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.7, 0.5), whiteMat);
    chest.position.set(0, 0.65, 0.45);
    g.add(chest);

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.75, 0.75), orangeMat);
    head.position.set(0, 1.15, 0.65);
    g.add(head);

    // Snout
    const snout = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.5, 4), whiteMat);
    snout.rotation.x = Math.PI / 2;
    snout.position.set(0, 1.05, 1.15);
    g.add(snout);

    // Pointy Ears
    [-0.28, 0.28].forEach((x) => {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.45, 4), darkMat);
      ear.position.set(x, 1.6, 0.6);
      g.add(ear);
    });

    // 4 Tiny Paws
    [-0.3, 0.3].forEach((x) => {
      [-0.4, 0.4].forEach((z) => {
        const paw = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.45, 0.25), darkMat);
        paw.position.set(x, 0.22, z);
        g.add(paw);
      });
    });

    // Bushy Tail
    this.tailGroup = new THREE.Group();
    this.tailGroup.position.set(0, 0.75, -0.65);
    const tailMesh = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 1.1), orangeMat);
    tailMesh.position.set(0, 0.2, -0.5);
    tailMesh.rotation.x = 0.35;
    const tailTip = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.46, 0.4), whiteMat);
    tailTip.position.set(0, 0.35, -0.9);
    tailTip.rotation.x = 0.35;
    this.tailGroup.add(tailMesh, tailTip);
    g.add(this.tailGroup);

    this.modelGroup.add(g);
  }

  private buildWolfPup() {
    const g = new THREE.Group();
    const greyMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.85, 1.4), greyMat);
    body.position.y = 0.7;
    g.add(body);

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.8, 0.85), greyMat);
    head.position.set(0, 1.25, 0.75);
    g.add(head);

    // Snout
    const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.5), darkMat);
    muzzle.position.set(0, 1.1, 1.25);
    g.add(muzzle);

    // Eyes
    [-0.28, 0.28].forEach((x) => {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.08), eyeMat);
      eye.position.set(x, 1.35, 1.18);
      g.add(eye);
    });

    // Ears
    [-0.32, 0.32].forEach((x) => {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.4, 4), darkMat);
      ear.position.set(x, 1.7, 0.7);
      g.add(ear);
    });

    // Paws
    [-0.35, 0.35].forEach((x) => {
      [-0.45, 0.45].forEach((z) => {
        const paw = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.5, 0.28), darkMat);
        paw.position.set(x, 0.25, z);
        g.add(paw);
      });
    });

    // Tail
    this.tailGroup = new THREE.Group();
    this.tailGroup.position.set(0, 0.8, -0.7);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.8), greyMat);
    tail.position.set(0, 0.2, -0.4);
    tail.rotation.x = 0.5;
    this.tailGroup.add(tail);
    g.add(this.tailGroup);

    this.modelGroup.add(g);
  }

  update(
    dt: number,
    playerPos: THREE.Vector3,
    playerRotY: number,
    monsters: { pos: THREE.Vector3; state: string; hp: number; radius: number; takeDamage: (dmg: number, p: THREE.Vector3, onDeath: () => void) => boolean; onKill: () => void }[],
    burstCallback: (pos: THREE.Vector3, color: number, count: number, speed: number) => void
  ) {
    if (!this.activePetId || !this.mesh.visible) return;

    this.animTimer += dt;
    this.abilityTimer += dt;

    // Follow offset calculation (floating beside player or walking behind)
    const isFlying = this.activePetId === 'dragon';
    const offsetX = Math.cos(playerRotY + Math.PI * 0.75) * 2.8;
    const offsetZ = Math.sin(playerRotY + Math.PI * 0.75) * 2.8;

    const targetX = playerPos.x + offsetX;
    const targetZ = playerPos.z + offsetZ;
    const groundY = getTerrainHeight(targetX, targetZ);
    const targetY = isFlying ? groundY + 2.8 + Math.sin(this.animTimer * 3) * 0.4 : groundY;

    // Smooth lerp to target
    this.mesh.position.x = lerp(this.mesh.position.x, targetX, 0.08);
    this.mesh.position.z = lerp(this.mesh.position.z, targetZ, 0.08);
    this.mesh.position.y = lerp(this.mesh.position.y, targetY, 0.12);

    // Look towards direction of movement or player
    const dx = playerPos.x - this.mesh.position.x;
    const dz = playerPos.z - this.mesh.position.z;
    const lookAngle = Math.atan2(dx, dz);
    this.mesh.rotation.y = lerp(this.mesh.rotation.y, lookAngle, 0.1);

    // Wing flapping for Baby Dragon
    if (this.wingsGroup) {
      this.wingsGroup.rotation.x = Math.sin(this.animTimer * 12) * 0.35;
    }

    // Tail wagging
    if (this.tailGroup) {
      this.tailGroup.rotation.y = Math.sin(this.animTimer * 8) * 0.45;
    }

    // Pet Abilities
    if (this.activePetId === 'fox') {
      // Heal tick every 3.5 seconds
      if (this.abilityTimer >= 3.5) {
        this.abilityTimer = 0;
        burstCallback(this.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)), 0x4ade80, 10, 5);
        if (this.onPetHeal) {
          this.onPetHeal(4);
        }
      }
    } else if (this.activePetId === 'dragon') {
      // Fireball breath attack at nearest monster every 3.5 seconds
      if (this.abilityTimer >= 3.5) {
        let nearestM: typeof monsters[0] | null = null;
        let minDist = 24;

        for (const m of monsters) {
          if (m.state !== 'dead' && m.hp > 0) {
            const d = Math.hypot(m.pos.x - this.mesh.position.x, m.pos.z - this.mesh.position.z);
            if (d < minDist) {
              minDist = d;
              nearestM = m;
            }
          }
        }

        if (nearestM) {
          this.abilityTimer = 0;
          AudioFX.fireball();
          burstCallback(this.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)), 0xff6a00, 14, 8);
          burstCallback(nearestM.pos.clone().add(new THREE.Vector3(0, 1.5, 0)), 0xff4500, 18, 12);
          nearestM.takeDamage(35, this.mesh.position, nearestM.onKill);
          if (this.onPetAttack) {
            this.onPetAttack(nearestM.pos, 35);
          }
        }
      }
    }
  }
}
