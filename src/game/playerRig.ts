/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { lerp, clamp } from './terrain.ts';

export type ActionAnimType =
  | 'idle'
  | 'walk'
  | 'run'
  | 'attack1'
  | 'attack2'
  | 'attack3'
  | 'chop'
  | 'mine'
  | 'build'
  | 'cast'
  | 'drink'
  | 'eat'
  | 'jump'
  | 'hurt';

export class PlayerRig {
  root: THREE.Group;
  pelvis: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftForearm: THREE.Group;
  rightForearm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  capeMesh: THREE.Group;
  weaponGrip: THREE.Group;

  // Active Held Item & Meshes
  heldMeshContainer: THREE.Group;
  heldItemKey: string = 'weapon';
  currentWeaponIdx: number = 0;
  currentTool: 'weapon' | 'axe' | 'pickaxe' | 'hammer' = 'weapon';
  gliderMesh: THREE.Group;
  isGliding: boolean = false;

  // Animation State
  action: ActionAnimType = 'idle';
  actionTimer: number = 0;
  actionDuration: number = 0;
  comboStep: number = 0;
  walkCycle: number = 0;
  isMoving: boolean = false;
  isSprinting: boolean = false;
  isGrounded: boolean = true;
  verticalVelocity: number = 0;

  // Materials Cache
  skinMat: THREE.MeshStandardMaterial;
  torsoMat: THREE.MeshStandardMaterial;
  legMat: THREE.MeshStandardMaterial;
  bladeMat: THREE.MeshStandardMaterial;
  capeMat: THREE.MeshStandardMaterial;
  hairMat: THREE.MeshStandardMaterial;

  constructor() {
    this.root = new THREE.Group();

    this.skinMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.5 });
    this.torsoMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.6 });
    this.legMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });
    this.bladeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
    this.capeMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, side: THREE.DoubleSide });
    this.hairMat = new THREE.MeshStandardMaterial({ color: 0x3b2314 });

    // Pelvis / Hips (Root of body articulated chain)
    this.pelvis = new THREE.Group();
    this.pelvis.position.y = 1.9;
    this.root.add(this.pelvis);

    // Torso / Chest
    this.torso = new THREE.Group();
    const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.6, 1.25), this.torsoMat);
    torsoMesh.position.y = 1.3;
    torsoMesh.castShadow = true;
    this.torso.add(torsoMesh);
    this.pelvis.add(this.torso);

    // Head & Face & Hair
    this.head = new THREE.Group();
    this.head.position.y = 2.6;
    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.0, 2.0), this.skinMat);
    headMesh.position.y = 1.0;
    headMesh.castShadow = true;
    this.head.add(headMesh);

    // Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.45, 0.1), eyeMat);
    eyeL.position.set(-0.4, 1.05, 1.01);
    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.45, 0.1), eyeMat);
    eyeR.position.set(0.4, 1.05, 1.01);
    this.head.add(eyeL, eyeR);

    // Hair
    const hairTop = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.65, 2.3), this.hairMat);
    hairTop.position.set(0, 2.1, 0);
    const hairBack = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.4, 0.5), this.hairMat);
    hairBack.position.set(0, 1.3, -0.95);
    this.head.add(hairTop, hairBack);
    this.torso.add(this.head);

    // Dynamic Flowing Cape
    this.capeMesh = new THREE.Group();
    this.capeMesh.position.set(0, 2.45, -0.65);
    const capeSeg1 = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.6, 0.12), this.capeMat);
    capeSeg1.position.y = -0.8;
    capeSeg1.castShadow = true;
    const capeSeg2 = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.6, 0.12), this.capeMat);
    capeSeg2.position.set(0, -1.5, -0.1);
    capeSeg2.castShadow = true;
    this.capeMesh.add(capeSeg1, capeSeg2);
    this.torso.add(this.capeMesh);

    // Glider Wings ("ปีกร่อนเวหา Glider")
    this.gliderMesh = this.buildGliderWings();
    this.gliderMesh.visible = false;
    this.torso.add(this.gliderMesh);

    // Arms Hierarchy (Left)
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-1.6, 2.3, 0);
    const lUpper = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.3, 0.85), this.skinMat);
    lUpper.position.y = -0.65;
    lUpper.castShadow = true;
    this.leftArm.add(lUpper);

    this.leftForearm = new THREE.Group();
    this.leftForearm.position.y = -1.3;
    const lLower = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.1, 0.8), this.skinMat);
    lLower.position.y = -0.55;
    lLower.castShadow = true;
    this.leftForearm.add(lLower);
    this.leftArm.add(this.leftForearm);
    this.torso.add(this.leftArm);

    // Arms Hierarchy (Right - Item/Weapon Hand)
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(1.6, 2.3, 0);
    const rUpper = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.3, 0.85), this.skinMat);
    rUpper.position.y = -0.65;
    rUpper.castShadow = true;
    this.rightArm.add(rUpper);

    this.rightForearm = new THREE.Group();
    this.rightForearm.position.y = -1.3;
    const rLower = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.1, 0.8), this.skinMat);
    rLower.position.y = -0.55;
    rLower.castShadow = true;
    this.rightForearm.add(rLower);

    // Weapon Grip Pivot
    this.weaponGrip = new THREE.Group();
    this.weaponGrip.position.set(0, -1.0, 0.4);
    this.rightForearm.add(this.weaponGrip);
    this.rightArm.add(this.rightForearm);
    this.torso.add(this.rightArm);

    // Legs Hierarchy (Left)
    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.6, 0, 0);
    const lLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.9, 0.9), this.legMat);
    lLegMesh.position.y = -0.95;
    lLegMesh.castShadow = true;
    this.leftLeg.add(lLegMesh);
    this.pelvis.add(this.leftLeg);

    // Legs Hierarchy (Right)
    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.6, 0, 0);
    const rLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.9, 0.9), this.legMat);
    rLegMesh.position.y = -0.95;
    rLegMesh.castShadow = true;
    this.rightLeg.add(rLegMesh);
    this.pelvis.add(this.rightLeg);

    // Container for currently held 3D item
    this.heldMeshContainer = new THREE.Group();
    this.weaponGrip.add(this.heldMeshContainer);

    // Initial held item (Sword 0)
    this.setHeldItem('weapon', { weaponIdx: 0 });
  }

  // -------------------------------------------------------------
  // DYNAMIC 3D HELD ITEM SYSTEM ("เลือกใช้ไอเทมไหน ก็แสดงไอเทมนั้นในมือด้วย")
  // -------------------------------------------------------------
  setHeldItem(itemKey: string, options?: { weaponIdx?: number; name?: string }) {
    this.heldItemKey = itemKey;
    if (typeof options?.weaponIdx === 'number') {
      this.currentWeaponIdx = options.weaponIdx;
    }

    // Clear old held item mesh
    while (this.heldMeshContainer.children.length > 0) {
      const child = this.heldMeshContainer.children[0];
      this.heldMeshContainer.remove(child);
    }

    // Build the exact 3D model corresponding to what is selected
    const model = this.createHeldMesh(itemKey, this.currentWeaponIdx);
    if (model) {
      this.heldMeshContainer.add(model);
    }

    // Sync current tool
    if (itemKey === 'axe' || itemKey === 'axe_iron') {
      this.currentTool = 'axe';
    } else if (itemKey === 'pickaxe' || itemKey === 'pickaxe_iron' || itemKey === 'pickaxe_diamond') {
      this.currentTool = 'pickaxe';
    } else if (itemKey === 'hammer' || itemKey.startsWith('build')) {
      this.currentTool = 'hammer';
    } else {
      this.currentTool = 'weapon';
    }
  }

  // Backwards compatibility with setTool
  setTool(tool: 'weapon' | 'axe' | 'pickaxe' | 'hammer') {
    this.setHeldItem(tool, { weaponIdx: this.currentWeaponIdx });
  }

  private createHeldMesh(key: string, weaponIdx: number): THREE.Group {
    const k = key.toLowerCase();

    // 1. Weapons & Swords
    if (k === 'weapon' || k.startsWith('sword') || k.startsWith('dagger') || k.startsWith('blade')) {
      return this.buildSwordMesh(weaponIdx);
    }

    // 2. Axes
    if (k === 'axe' || k.includes('axe')) {
      return this.buildAxeMesh();
    }

    // 3. Pickaxes
    if (k === 'pickaxe' || k.includes('pickaxe')) {
      return this.buildPickaxeMesh(k.includes('diamond'));
    }

    // 4. Hammer
    if (k === 'hammer' || k.includes('hammer') || k.startsWith('build')) {
      return this.buildHammerMesh();
    }

    // 5. Potions
    if (k.includes('potion_hp') || k === 'hp' || k.includes('heal_potion')) {
      return this.buildPotionMesh(0xef4444, 0x991b1b, 'HP Potion');
    }
    if (k.includes('potion_mp') || k === 'mp' || k.includes('mana_potion')) {
      return this.buildPotionMesh(0x0ea5e9, 0x0369a1, 'MP Potion');
    }
    if (k.includes('elixir')) {
      return this.buildPotionMesh(0xf59e0b, 0xd97706, 'Elixir');
    }

    // 6. Magic Spells & Staves
    if (k.includes('fireball') || k === 'spell_1' || k === 'fire') {
      return this.buildMagicStaffMesh('fire');
    }
    if (k.includes('whirlwind') || k === 'spell_2' || k === 'wind') {
      return this.buildMagicStaffMesh('wind');
    }
    if (k.includes('heal') || k === 'spell_3') {
      return this.buildMagicStaffMesh('holy');
    }
    if (k.includes('storm') || k === 'spell_4' || k === 'lightning') {
      return this.buildMagicStaffMesh('storm');
    }

    // 7. Consumable Food & Meat
    if (k.includes('meat') || k.includes('food') || k.includes('steak')) {
      return this.buildMeatMesh();
    }

    // 8. Raw Materials & Harvested Blocks
    if (k.includes('wood') || k.includes('log') || k.includes('plank')) {
      return this.buildWoodLogMesh();
    }
    if (k.includes('stone') || k.includes('granite')) {
      return this.buildStoneChunkMesh();
    }
    if (k.includes('iron')) {
      return this.buildOreChunkMesh(0x94a3b8, 0x475569);
    }
    if (k.includes('gold')) {
      return this.buildOreChunkMesh(0xfbbf24, 0xd97706);
    }
    if (k.includes('crystal_fire') || k.includes('fire_core')) {
      return this.buildCrystalMesh(0xf97316, 0xef4444);
    }
    if (k.includes('crystal_frost') || k.includes('ice')) {
      return this.buildCrystalMesh(0x38bdf8, 0x0284c7);
    }
    if (k.includes('slime')) {
      return this.buildSlimeCubeMesh();
    }
    if (k.includes('torch')) {
      return this.buildTorchMesh();
    }

    // Fallback: Default stylish weapon
    return this.buildSwordMesh(weaponIdx);
  }

  // -------------------------------------------------------------
  // HIGH-DETAIL 3D MESH GENERATORS FOR HELD ITEMS
  // -------------------------------------------------------------
  private buildSwordMesh(weaponIdx: number): THREE.Group {
    const g = new THREE.Group();

    // Weapon variants
    let bladeColor = 0xe2e8f0;
    let guardColor = 0xf59e0b;
    let bladeLength = 3.4;
    let bladeWidth = 0.65;
    let emissiveColor = 0x000000;
    let metalness = 0.9;
    let roughness = 0.2;

    if (weaponIdx === 1) {
      // Steel Broadsword
      bladeColor = 0xf1f5f9;
      guardColor = 0x64748b;
      bladeLength = 3.7;
    } else if (weaponIdx === 2) {
      // Wolf Fang Dagger (Curved serrated ivory dagger)
      bladeColor = 0xfef08a;
      guardColor = 0x78350f;
      bladeLength = 2.4;
      bladeWidth = 0.55;
    } else if (weaponIdx === 3) {
      // Obsidian Edge (Jet-black glass with violet rune glow)
      bladeColor = 0x0f172a;
      guardColor = 0x7c3aed;
      bladeLength = 3.6;
      emissiveColor = 0x3b0764;
    } else if (weaponIdx === 4) {
      // Flame Greatsword (Crimson burning blade with fire glow)
      bladeColor = 0xef4444;
      guardColor = 0xb45309;
      bladeLength = 4.2;
      bladeWidth = 0.85;
      emissiveColor = 0xf97316;
    } else if (weaponIdx === 5) {
      // Frost Slayer (Crystalline icy blue double-edge blade)
      bladeColor = 0x7dd3fc;
      guardColor = 0x0284c7;
      bladeLength = 4.0;
      emissiveColor = 0x0284c7;
    } else if (weaponIdx >= 6) {
      // Royal Excalibur (Golden shining holy blade)
      bladeColor = 0xfef9c3;
      guardColor = 0xfbbf24;
      bladeLength = 4.3;
      bladeWidth = 0.8;
      emissiveColor = 0xeab308;
    }

    const bMat = new THREE.MeshStandardMaterial({
      color: bladeColor,
      metalness,
      roughness,
      emissive: emissiveColor,
      emissiveIntensity: emissiveColor !== 0x000000 ? 0.6 : 0,
    });
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.26, bladeLength, bladeWidth), bMat);
    blade.position.y = bladeLength / 2;
    blade.castShadow = true;

    // Crossguard
    const guardMat = new THREE.MeshStandardMaterial({ color: guardColor, metalness: 0.85, roughness: 0.3 });
    const guard = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.25, 0.5), guardMat);
    guard.position.y = 0.2;
    guard.castShadow = true;

    // Handle Grip
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 1.0, 8),
      new THREE.MeshStandardMaterial({ color: 0x451a03 })
    );
    handle.position.y = -0.4;

    // Pommel
    const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), guardMat);
    pommel.position.y = -0.9;

    g.add(blade, guard, handle, pommel);
    g.rotation.x = Math.PI / 2.6;
    return g;
  }

  private buildAxeMesh(): THREE.Group {
    const g = new THREE.Group();
    // Wooden curved shaft
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.2, 3.4, 8),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 })
    );
    handle.position.y = 1.3;
    handle.castShadow = true;

    // Heavy steel double-bevel axe head
    const headMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.25 });
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.4, 1.7), headMat);
    head.position.set(0, 2.6, 0.35);
    head.castShadow = true;

    // Axe sharp edge bevel
    const edge = new THREE.Mesh(
      new THREE.ConeGeometry(0.85, 0.26, 4),
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.95, roughness: 0.15 })
    );
    edge.rotation.z = Math.PI / 2;
    edge.position.set(0, 2.6, 1.2);

    g.add(handle, head, edge);
    g.rotation.x = Math.PI / 2.6;
    return g;
  }

  private buildPickaxeMesh(isDiamond = false): THREE.Group {
    const g = new THREE.Group();
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.2, 3.3, 8),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 })
    );
    handle.position.y = 1.2;
    handle.castShadow = true;

    const headMat = new THREE.MeshStandardMaterial({
      color: isDiamond ? 0x38bdf8 : 0x64748b,
      metalness: 0.9,
      roughness: 0.2,
      emissive: isDiamond ? 0x0284c7 : 0x000000,
      emissiveIntensity: isDiamond ? 0.5 : 0,
    });

    const head = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.22, 6, 12, Math.PI), headMat);
    head.rotation.z = Math.PI / 2;
    head.position.set(0, 2.6, 0);
    head.castShadow = true;

    g.add(handle, head);
    g.rotation.x = Math.PI / 2.6;
    return g;
  }

  private buildHammerMesh(): THREE.Group {
    const g = new THREE.Group();
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.22, 2.6, 8),
      new THREE.MeshStandardMaterial({ color: 0x78350f })
    );
    handle.position.y = 1.0;
    handle.castShadow = true;

    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.9, 1.8),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.4 })
    );
    head.position.set(0, 2.1, 0);
    head.castShadow = true;

    g.add(handle, head);
    g.rotation.x = Math.PI / 2.6;
    return g;
  }

  private buildPotionMesh(liquidColor: number, emissiveColor: number, _name: string): THREE.Group {
    const g = new THREE.Group();

    // Round bottom glass flask
    const bodyMat = new THREE.MeshStandardMaterial({
      color: liquidColor,
      roughness: 0.15,
      metalness: 0.2,
      transparent: true,
      opacity: 0.88,
      emissive: emissiveColor,
      emissiveIntensity: 0.6,
    });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.65, 12, 12), bodyMat);
    body.position.y = 0.65;
    body.castShadow = true;

    // Glass bottle neck
    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.28, 0.6, 10),
      new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.65, roughness: 0.1 })
    );
    neck.position.y = 1.35;

    // Cork stopper
    const cork = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.25, 0.35, 8),
      new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.9 })
    );
    cork.position.y = 1.7;

    g.add(body, neck, cork);
    g.position.set(0, -0.2, 0.4);
    g.rotation.x = Math.PI / 6; // Held upright in hand
    return g;
  }

  private buildMagicStaffMesh(type: 'fire' | 'wind' | 'holy' | 'storm'): THREE.Group {
    const g = new THREE.Group();

    // Ornate wood & metal staff shaft
    const staffShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.18, 4.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.6 })
    );
    staffShaft.position.y = 1.6;
    staffShaft.castShadow = true;

    let gemColor = 0xef4444;
    let emissiveColor = 0xf97316;
    if (type === 'wind') {
      gemColor = 0x10b981;
      emissiveColor = 0x059669;
    } else if (type === 'holy') {
      gemColor = 0xfef08a;
      emissiveColor = 0xeab308;
    } else if (type === 'storm') {
      gemColor = 0x60a5fa;
      emissiveColor = 0x3b82f6;
    }

    // Staff head prongs
    const prongs = new THREE.Mesh(
      new THREE.TorusGeometry(0.5, 0.12, 6, 12, Math.PI * 1.5),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9 })
    );
    prongs.rotation.z = Math.PI / 2;
    prongs.position.set(0, 3.6, 0);

    // Glowing magical orb hovering in head
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 12, 12),
      new THREE.MeshStandardMaterial({
        color: gemColor,
        emissive: emissiveColor,
        emissiveIntensity: 0.9,
        roughness: 0.1,
      })
    );
    orb.position.set(0, 3.7, 0);

    g.add(staffShaft, prongs, orb);
    g.rotation.x = Math.PI / 4;
    return g;
  }

  private buildMeatMesh(): THREE.Group {
    const g = new THREE.Group();
    // Bone handle
    const bone = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.14, 1.4, 8),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 })
    );
    bone.position.y = 0.4;

    // Roasted drumstick meat
    const meat = new THREE.Mesh(
      new THREE.SphereGeometry(0.65, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.8 })
    );
    meat.scale.set(1.1, 1.4, 1.0);
    meat.position.y = 1.1;
    meat.castShadow = true;

    g.add(bone, meat);
    g.rotation.x = Math.PI / 3;
    return g;
  }

  private buildWoodLogMesh(): THREE.Group {
    const g = new THREE.Group();
    const log = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 1.8, 12),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 })
    );
    log.position.y = 0.7;
    log.rotation.z = Math.PI / 2;
    log.castShadow = true;
    g.add(log);
    g.rotation.x = Math.PI / 4;
    return g;
  }

  private buildStoneChunkMesh(): THREE.Group {
    const g = new THREE.Group();
    const stone = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.65, 0),
      new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 })
    );
    stone.position.y = 0.6;
    stone.castShadow = true;
    g.add(stone);
    g.rotation.x = Math.PI / 4;
    return g;
  }

  private buildOreChunkMesh(baseColor: number, fleckColor: number): THREE.Group {
    const g = new THREE.Group();
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.65, 0),
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.85 })
    );
    rock.position.y = 0.6;
    rock.castShadow = true;

    const flecks = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.45, 0.45),
      new THREE.MeshStandardMaterial({ color: baseColor, metalness: 0.9, roughness: 0.2, emissive: fleckColor, emissiveIntensity: 0.3 })
    );
    flecks.position.set(0.1, 0.65, 0.1);

    g.add(rock, flecks);
    g.rotation.x = Math.PI / 4;
    return g;
  }

  private buildCrystalMesh(color: number, emissive: number): THREE.Group {
    const g = new THREE.Group();
    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.65, 0),
      new THREE.MeshStandardMaterial({
        color,
        emissive,
        emissiveIntensity: 0.7,
        roughness: 0.15,
        transparent: true,
        opacity: 0.9,
      })
    );
    crystal.scale.set(0.8, 1.5, 0.8);
    crystal.position.y = 0.8;
    g.add(crystal);
    g.rotation.x = Math.PI / 4;
    return g;
  }

  private buildSlimeCubeMesh(): THREE.Group {
    const g = new THREE.Group();
    const slime = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.9, 0.9),
      new THREE.MeshStandardMaterial({
        color: 0x22c55e,
        emissive: 0x15803d,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.8,
        roughness: 0.2,
      })
    );
    slime.position.y = 0.6;
    g.add(slime);
    g.rotation.x = Math.PI / 4;
    return g;
  }

  private buildTorchMesh(): THREE.Group {
    const g = new THREE.Group();
    const stick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.14, 2.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x78350f })
    );
    stick.position.y = 1.0;

    const flame = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.35, 0),
      new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xef4444, emissiveIntensity: 1.0 })
    );
    flame.position.y = 2.2;

    g.add(stick, flame);
    g.rotation.x = Math.PI / 4;
    return g;
  }

  // -------------------------------------------------------------
  // ANIMATION TRIGGERS
  // -------------------------------------------------------------
  triggerAttackCombo() {
    this.comboStep = (this.comboStep % 3) + 1;
    this.action = (`attack${this.comboStep}` as ActionAnimType);
    this.actionDuration = 0.38;
    this.actionTimer = 0.38;
  }

  triggerChop() {
    this.action = 'chop';
    this.actionDuration = 0.45;
    this.actionTimer = 0.45;
  }

  triggerMine() {
    this.action = 'mine';
    this.actionDuration = 0.42;
    this.actionTimer = 0.42;
  }

  triggerBuild() {
    this.action = 'build';
    this.actionDuration = 0.35;
    this.actionTimer = 0.35;
  }

  triggerSpellCast() {
    this.action = 'cast';
    this.actionDuration = 0.4;
    this.actionTimer = 0.4;
  }

  triggerDrinkPotion() {
    this.action = 'drink';
    this.actionDuration = 0.5;
    this.actionTimer = 0.5;
  }

  triggerEatFood() {
    this.action = 'eat';
    this.actionDuration = 0.45;
    this.actionTimer = 0.45;
  }

  triggerHurt() {
    this.action = 'hurt';
    this.actionDuration = 0.25;
    this.actionTimer = 0.25;
  }

  // -------------------------------------------------------------
  // TICK UPDATE & KINEMATICS
  // -------------------------------------------------------------
  update(dt: number, isMoving: boolean, isSprinting: boolean, isGrounded: boolean, velY: number, isGliding: boolean = false) {
    this.isMoving = isMoving;
    this.isSprinting = isSprinting;
    this.isGrounded = isGrounded;
    this.verticalVelocity = velY;
    this.isGliding = isGliding;
    this.gliderMesh.visible = isGliding;

    // Advance walk cycle
    const walkSpeedMultiplier = isSprinting ? 18 : 12;
    if (isMoving && isGrounded) {
      this.walkCycle += dt * walkSpeedMultiplier;
    } else {
      this.walkCycle += dt * 3; // Breathing rate
    }

    // Countdown active action
    if (this.actionTimer > 0) {
      this.actionTimer -= dt;
      if (this.actionTimer <= 0) {
        this.action = isGrounded ? (isMoving ? (isSprinting ? 'run' : 'walk') : 'idle') : (isGliding ? 'idle' : 'jump');
      }
    } else {
      this.action = isGrounded ? (isMoving ? (isSprinting ? 'run' : 'walk') : 'idle') : (isGliding ? 'idle' : 'jump');
    }

    // Reset procedural bones
    this.pelvis.position.y = 1.9;
    this.pelvis.rotation.set(0, 0, 0);
    this.torso.rotation.set(0, 0, 0);
    this.head.rotation.set(0, 0, 0);
    this.leftArm.rotation.set(0, 0, 0);
    this.rightArm.rotation.set(0, 0, 0);
    this.leftForearm.rotation.set(0, 0, 0);
    this.rightForearm.rotation.set(0, 0, 0);
    this.leftLeg.rotation.set(0, 0, 0);
    this.rightLeg.rotation.set(0, 0, 0);
    this.capeMesh.rotation.set(0, 0, 0);

    // Apply active animation
    const sw = Math.sin(this.walkCycle);
    const cw = Math.cos(this.walkCycle);

    if (this.isGliding) {
      this.animateGliding();
    } else if (this.action.startsWith('attack')) {
      this.animateAttack(sw);
    } else if (this.action === 'chop') {
      this.animateChop();
    } else if (this.action === 'mine') {
      this.animateMine();
    } else if (this.action === 'build') {
      this.animateBuild();
    } else if (this.action === 'cast') {
      this.animateCast();
    } else if (this.action === 'drink') {
      this.animateDrink();
    } else if (this.action === 'eat') {
      this.animateEat();
    } else if (this.action === 'hurt') {
      this.animateHurt();
    } else if (!isGrounded) {
      this.animateJump(velY);
    } else if (isMoving) {
      this.animateLocomotion(sw, cw, isSprinting);
    } else {
      this.animateIdle(sw);
    }

    // Dynamic cape wind physics
    const forwardSpeedFactor = isMoving ? (isSprinting ? 0.65 : 0.42) : 0.08;
    this.capeMesh.rotation.x =
      forwardSpeedFactor + Math.sin(this.walkCycle * 1.5) * 0.12 - clamp(velY * 0.03, -0.4, 0.4);
  }

  private animateIdle(sw: number) {
    // Gentle natural breathing
    this.torso.position.y = Math.sin(this.walkCycle * 0.7) * 0.04;
    this.head.rotation.y = sw * 0.06;
    this.leftArm.rotation.x = sw * 0.08;
    this.rightArm.rotation.x = -sw * 0.08;
    this.leftArm.rotation.z = -0.1;
    this.rightArm.rotation.z = 0.1;
  }

  private animateLocomotion(sw: number, _cw: number, isSprinting: boolean) {
    const legAmp = isSprinting ? 1.05 : 0.75;
    const armAmp = isSprinting ? 1.15 : 0.8;
    const hipBob = Math.abs(sw) * (isSprinting ? 0.22 : 0.12);

    // Pelvis rhythmic bounce with footfalls
    this.pelvis.position.y = 1.9 - hipBob;
    this.pelvis.rotation.y = sw * (isSprinting ? 0.14 : 0.08);

    // Forward lean when running
    this.torso.rotation.x = isSprinting ? 0.26 : 0.14;

    // Legs inverse swinging
    this.leftLeg.rotation.x = sw * legAmp;
    this.rightLeg.rotation.x = -sw * legAmp;

    // Knee bend during back-swing
    if (sw > 0) {
      this.leftLeg.rotation.z = -0.04;
    } else {
      this.rightLeg.rotation.z = 0.04;
    }

    // Alternating arm pump
    this.leftArm.rotation.x = -sw * armAmp;
    this.rightArm.rotation.x = sw * armAmp;
    this.leftForearm.rotation.x = Math.max(0, -sw * 0.4);
    this.rightForearm.rotation.x = Math.max(0, sw * 0.4);
  }

  private animateJump(_velY: number) {
    // Legs tuck in, arms spread for balance
    this.torso.rotation.x = -0.15;
    this.leftLeg.rotation.x = -0.6;
    this.rightLeg.rotation.x = -0.4;
    this.leftArm.rotation.z = -0.7;
    this.rightArm.rotation.z = 0.7;
    this.leftArm.rotation.x = -0.5;
    this.rightArm.rotation.x = -0.5;
  }

  private animateAttack(_sw: number) {
    const progress = 1 - this.actionTimer / this.actionDuration; // 0..1
    const strike = Math.sin(progress * Math.PI);

    if (this.comboStep === 1) {
      // Combo 1: Diagonal slash from top-right to bottom-left
      this.torso.rotation.y = lerp(-0.4, 0.6, progress);
      this.rightArm.rotation.x = lerp(-1.8, 0.9, strike);
      this.rightArm.rotation.z = lerp(0.8, -0.6, strike);
      this.rightForearm.rotation.x = -0.6;
    } else if (this.comboStep === 2) {
      // Combo 2: Upward back-slash
      this.torso.rotation.y = lerp(0.5, -0.5, progress);
      this.rightArm.rotation.x = lerp(0.8, -1.6, strike);
      this.rightArm.rotation.z = lerp(-0.6, 0.6, strike);
    } else {
      // Combo 3: Heavy 360 Spin Cleave
      this.root.rotation.y += strike * 0.35;
      this.torso.rotation.x = 0.2;
      this.rightArm.rotation.x = -1.2;
      this.rightArm.rotation.z = 1.2;
      this.leftArm.rotation.x = -0.8;
    }
  }

  private animateChop() {
    // Two-handed timber overhead chop
    const progress = 1 - this.actionTimer / this.actionDuration;
    if (progress < 0.4) {
      const up = progress / 0.4;
      this.torso.rotation.x = -0.25 * up; // Arches back
      this.rightArm.rotation.x = -2.2 * up;
      this.leftArm.rotation.x = -1.8 * up;
    } else {
      const down = (progress - 0.4) / 0.6;
      this.torso.rotation.x = lerp(-0.25, 0.4, down); // Follow-through slam
      this.rightArm.rotation.x = lerp(-2.2, 0.6, down);
      this.leftArm.rotation.x = lerp(-1.8, 0.3, down);
    }
  }

  private animateMine() {
    // Pickaxe strike forward into rock
    const progress = 1 - this.actionTimer / this.actionDuration;
    if (progress < 0.35) {
      const p = progress / 0.35;
      this.rightArm.rotation.x = -2.0 * p;
      this.torso.rotation.x = -0.15 * p;
    } else {
      const p = (progress - 0.35) / 0.65;
      this.rightArm.rotation.x = lerp(-2.0, 0.7, p);
      this.torso.rotation.x = lerp(-0.15, 0.35, p);
    }
  }

  private animateBuild() {
    // Builder hammer tapping
    const progress = 1 - this.actionTimer / this.actionDuration;
    this.torso.rotation.x = 0.2;
    this.rightArm.rotation.x = -0.8 + Math.sin(progress * Math.PI * 3) * 0.7;
  }

  private animateCast() {
    // Spell casting: hand outstretched with magic surge
    this.rightArm.rotation.x = -1.5;
    this.rightArm.rotation.z = 0.2;
    this.head.rotation.x = -0.2;
    this.leftArm.rotation.x = 0.4;
    this.leftArm.rotation.z = -0.5;
  }

  private animateDrink() {
    // Potion drinking: raise bottle to lips
    const progress = 1 - this.actionTimer / this.actionDuration;
    const sip = Math.sin(progress * Math.PI);
    this.head.rotation.x = -0.35 * sip; // Tilt head back
    this.rightArm.rotation.x = lerp(0, -2.1, sip); // Raise bottle to mouth
    this.rightArm.rotation.z = -0.3 * sip;
    this.rightForearm.rotation.x = -0.8 * sip;
    this.leftArm.rotation.x = -0.4 * sip;
  }

  private animateEat() {
    // Eating: bring food to mouth
    const progress = 1 - this.actionTimer / this.actionDuration;
    const bite = Math.sin(progress * Math.PI);
    this.head.rotation.x = 0.15 * Math.sin(progress * Math.PI * 4); // Chewing bob
    this.rightArm.rotation.x = lerp(0, -1.9, bite);
    this.rightArm.rotation.z = -0.2 * bite;
  }

  private animateHurt() {
    // Recoil backwards
    const progress = 1 - this.actionTimer / this.actionDuration;
    const recoil = Math.sin(progress * Math.PI);
    this.torso.rotation.x = -0.4 * recoil;
    this.head.rotation.x = 0.3 * recoil;
    this.rightArm.rotation.x = -0.5 * recoil;
    this.leftArm.rotation.x = -0.5 * recoil;
  }

  private animateGliding() {
    // Graceful forward superman / soaring glide posture
    this.torso.rotation.x = 0.68;
    this.head.rotation.x = -0.42;
    this.leftArm.rotation.x = -1.15;
    this.leftArm.rotation.z = -0.75;
    this.rightArm.rotation.x = -1.15;
    this.rightArm.rotation.z = 0.75;
    this.leftLeg.rotation.x = -0.35;
    this.rightLeg.rotation.x = -0.3;
    this.gliderMesh.rotation.z = Math.sin(this.walkCycle * 2) * 0.05;
  }

  private buildGliderWings(): THREE.Group {
    const g = new THREE.Group();
    g.position.set(0, 1.8, 0.2);

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      emissive: 0x0284c7,
      emissiveIntensity: 0.7,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92,
    });
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    // Center harness frame
    const center = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 1.8), frameMat);
    center.position.set(0, 0.4, 0);
    g.add(center);

    // Crossbar Handle held by player
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.4), frameMat);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(0, -0.6, 1.1);
    g.add(handle);

    // Left and Right Swept Hang Glider Wings (Delta Wings)
    [-1, 1].forEach((dir) => {
      // Wing Strut / Leading Edge
      const strut = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.15, 0.15), frameMat);
      strut.position.set(dir * 1.8, 0.4, 0.2);
      strut.rotation.y = -dir * 0.4;
      g.add(strut);

      // Fabric Wing Surface
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(dir * 3.8, -0.8);
      shape.lineTo(dir * 0.2, -2.4);
      shape.closePath();

      const wingGeo = new THREE.ShapeGeometry(shape);
      const wingMesh = new THREE.Mesh(wingGeo, wingMat);
      wingMesh.rotation.x = Math.PI / 2;
      wingMesh.position.set(0, 0.42, 0.6);
      g.add(wingMesh);

      // Glowing Wingtip Beacons
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), glowMat);
      tip.position.set(dir * 3.8, 0.45, 0.2);
      g.add(tip);
    });

    return g;
  }
}
