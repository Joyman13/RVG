/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { NPCDef } from '../types.ts';
import { getTerrainHeight, colliders } from './terrain.ts';
import { WEAPONS, ARMORS } from './constants.ts';

function mat(color: number, opts?: THREE.MeshStandardMaterialParameters) {
  return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.8, flatShading: true }, opts || {}));
}

function box(w: number, h: number, d: number, m: THREE.Material, x = 0, y = 0, z = 0) {
  const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  me.position.set(x, y, z);
  return me;
}

function shadowAll(o: THREE.Object3D) {
  o.traverse((c) => {
    if ((c as THREE.Mesh).isMesh) {
      c.castShadow = true;
    }
  });
}

function makeLabel(text: string, color = '#ffffff', scale = 1): THREE.Sprite {
  const cv = document.createElement('canvas');
  cv.width = 512;
  cv.height = 128;
  const c = cv.getContext('2d')!;
  c.font = 'bold 50px Fredoka, Inter, sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.lineWidth = 10;
  c.strokeStyle = 'rgba(0,0,0,.85)';
  c.strokeText(text, 256, 64);
  c.fillStyle = color;
  c.fillText(text, 256, 64);
  const sp = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(cv),
      transparent: true,
      depthTest: false,
    })
  );
  sp.scale.set(9 * scale, 2.2 * scale, 1);
  sp.renderOrder = 10;
  return sp;
}

export const ALL_VILLAGE_NPCS: NPCDef[] = [
  // Zone 1: Central Plains Village
  {
    id: 'elder_thomas',
    name: 'Village Elder Thomas',
    nameTh: 'ผู้เฒ่าโธมัสแห่งหมู่บ้านกลาง',
    role: 'Village Chief & Guide',
    roleTh: 'ผู้นำหมู่บ้านทุ่งหญ้า',
    zoneId: 1,
    villageName: 'Clover Meadows Village',
    villageNameTh: 'หมู่บ้านโคลเวอร์ใจกลางทุ่งหญ้า',
    icon: '👵',
    x: 8,
    z: 16,
    color: 0x8b5cf6,
    hat: 0xe5e7eb,
    dialog: 'ยินดีต้อนรับสู่อาณาจักรแฟนตาซี! ยิ่งเจ้าฝึกฝนสิ่งใดบ่อยครั้ง ความชำนาญ (Mastery) ในสิ่งนั้นก็จะยิ่งสูงขึ้น! รถไฟมีหลากหลายเส้นทางพาเจ้าไปยังทุกหมู่บ้าน',
  },
  {
    id: 'farmer_daisy',
    name: 'Farmer Daisy',
    nameTh: 'แม่ค้าเดซี่แม่ค้าผลไม้และเนื้อย่าง',
    role: 'Provisions Merchant',
    roleTh: 'ร้านเสบียงอาหารและยาฟื้นเลือด',
    zoneId: 1,
    villageName: 'Clover Meadows Village',
    villageNameTh: 'หมู่บ้านโคลเวอร์ใจกลางทุ่งหญ้า',
    icon: '👩‍🌾',
    x: 24,
    z: 8,
    color: 0x16a34a,
    hat: 0xfde047,
    dialog: 'เนื้อย่างจากกองไฟและยาฟื้นเลือดชั้นดีช่วยชีวิตเจ้าได้เสมอในยามคับขัน!',
    shopItems: [
      { id: 'hp_pot_small', name: 'HP Potion', nameTh: 'ยาฟื้นพลังชีวิต (HP Potion)', price: 40, icon: '🧪', desc: 'ฟื้นฟูเลือด 50%', type: 'potion_hp' },
      { id: 'mp_pot_small', name: 'MP Potion', nameTh: 'ยาฟื้นมานา (MP Potion)', price: 30, icon: '💧', desc: 'ฟื้นฟูมานา 50%', type: 'potion_mp' },
    ],
  },
  {
    id: 'blacksmith_gareth',
    name: 'Blacksmith Gareth',
    nameTh: 'ช่างเหล็กกาเร็ธ',
    role: 'Weapons & Armor',
    roleTh: 'ร้านตีเหล็กและชุดเกราะเบื้องต้น',
    zoneId: 1,
    villageName: 'Clover Meadows Village',
    villageNameTh: 'หมู่บ้านโคลเวอร์ใจกลางทุ่งหญ้า',
    icon: '🔨',
    x: -18,
    z: 22,
    color: 0x92400e,
    hat: 0x1f2937,
    dialog: 'ดาบเหล็กกล้าและเกราะเหล็กแกร่งจะช่วยปกป้องเจ้าจากฝูงสไลม์และหมาป่า!',
    shopItems: [
      { id: 'steel_sword', name: 'Steel Broadsword', nameTh: 'ดาบเหล็กกล้า (Steel Broadsword)', price: 50, icon: '⚔️', desc: '+30 ATK', type: 'weapon', idx: 1 },
      { id: 'iron_armor', name: 'Iron Plate Armor', nameTh: 'เกราะเหล็กหนา (Iron Plate)', price: 75, icon: '🛡️', desc: '+20 DEF', type: 'armor', idx: 1 },
    ],
  },

  // Zone 2: Whispering Forest Sylvan Tree Village
  {
    id: 'ranger_lyra',
    name: 'Ranger Lyra',
    nameTh: 'พรานป่าเอลฟ์ไลร่า',
    role: 'Forest Scout & Hunter',
    roleTh: 'หัวหน้านักล่าพงไพร',
    zoneId: 2,
    villageName: 'Sylvan Canopy Village',
    villageNameTh: 'หมู่บ้านพงไพรซิลแวน',
    icon: '🏹',
    x: -245,
    z: -160,
    color: 0x059669,
    hat: 0x065f46,
    dialog: 'ยินดีต้อนรับสู่ยอดไม้ซิลแวน! หมาป่าและสไลม์ในป่านี้ดุร้าย แต่เนื้อและขนของมันคราฟต์เกราะชั้นเยี่ยมได้!',
    shopItems: [
      { id: 'sun_blade', name: 'Golden Sun Blade', nameTh: 'ดาบสุริยันสีทอง (Sun Blade)', price: 150, icon: '🗡️', desc: '+55 ATK', type: 'weapon', idx: 2 },
      { id: 'hp_pot_forest', name: 'HP Potion', nameTh: 'ยาฟื้นพลังชีวิตพงไพร', price: 40, icon: '🧪', desc: 'ฟื้นฟูเลือด 50%', type: 'potion_hp' },
    ],
  },
  {
    id: 'woodcutter_boris',
    name: 'Lumberjack Boris',
    nameTh: 'คนตัดไม้บอริส',
    role: 'Master of Timber',
    roleTh: 'ช่างไม้โบราณ',
    zoneId: 2,
    villageName: 'Sylvan Canopy Village',
    villageNameTh: 'หมู่บ้านพงไพรซิลแวน',
    icon: '🪓',
    x: -265,
    z: -175,
    color: 0x78350f,
    hat: 0xb45309,
    dialog: 'ยิ่งเจ้าตัดไม้บ่อย ระดับ Woodcutting Mastery จะสูงขึ้น ทำให้ฟันต้นไม้ได้เร็วขึ้นและได้ไม้เพิ่มเป็นสองเท่า!',
  },

  // Zone 3: Grand Castle City
  {
    id: 'king_aldric',
    name: 'King Aldric',
    nameTh: 'กษัตริย์อัลดริกแห่งเอลดอเรีย',
    role: 'Sovereign of the Realm',
    roleTh: 'ราชาแห่งปราสาทหลวง',
    zoneId: 3,
    villageName: 'Grand Castle Citadel',
    villageNameTh: 'มหานครปราสาทหลวงเอลดอเรีย',
    icon: '🤴',
    x: 360,
    z: -260,
    color: 0xb91c1c,
    hat: 0xfacc15,
    dialog: 'ผู้กล้าเอ๋ย ขอบคุณที่เดินทางด้วยรถไฟสายด่วนมาถึงปราสาทหลวงแห่งนี้! จงปราบไททันลาวาและราชาน้ำแข็งเพื่อนำความสงบสุขกลับคืนมา!',
  },
  {
    id: 'royal_armorer_brenna',
    name: 'Royal Armorer Brenna',
    nameTh: 'ช่างเกราะหลวงเบรนนา',
    role: 'Master Blacksmith',
    roleTh: 'คลังอาวุธหลวง',
    zoneId: 3,
    villageName: 'Grand Castle Citadel',
    villageNameTh: 'มหานครปราสาทหลวงเอลดอเรีย',
    icon: '🛡️',
    x: 330,
    z: -240,
    color: 0x1e40af,
    hat: 0x94a3b8,
    dialog: 'นี่คืออาวุธและเกราะที่ดีที่สุดในทวีป ตีด้วยแร่มิธริลและเกล็ดมังกรโบราณ!',
    shopItems: [
      { id: 'frost_sword', name: 'Frostbite Crystal Sword', nameTh: 'ดาบผลึกเหมันต์ (Frostbite Sword)', price: 300, icon: '💎', desc: '+90 ATK', type: 'weapon', idx: 3 },
      { id: 'mithril_armor', name: 'Mithril Armor', nameTh: 'เกราะมิธริล (Mithril Armor)', price: 250, icon: '🥋', desc: '+40 DEF', type: 'armor', idx: 2 },
      { id: 'dragon_blade', name: 'Dragonfang Blade', nameTh: 'ดาบเขี้ยวมังกร (Dragonfang Blade)', price: 700, icon: '🐉', desc: '+140 ATK', type: 'weapon', idx: 4 },
      { id: 'dragon_armor', name: 'Dragon Scale Armor', nameTh: 'เกราะเกล็ดมังกร (Dragon Scale)', price: 600, icon: '🐲', desc: '+70 DEF', type: 'armor', idx: 3 },
    ],
  },
  {
    id: 'grand_mage_varian',
    name: 'Grand Mage Varian',
    nameTh: 'มหาจอมเวทวาเรียน',
    role: 'Arcane Scholar',
    roleTh: 'หอคอยเวทมนตร์หลวง',
    zoneId: 3,
    villageName: 'Grand Castle Citadel',
    villageNameTh: 'มหานครปราสาทหลวงเอลดอเรีย',
    icon: '🧙‍♂️',
    x: 375,
    z: -230,
    color: 0x6b21a8,
    hat: 0xa855f7,
    dialog: 'การร่ายเวทบ่อยครั้งจะช่วยเพิ่มพลังจิตและอัตราการฟื้นฟูมานา!',
    shopItems: [
      { id: 'mp_pot_royal', name: 'MP Potion', nameTh: 'ยาฟื้นมานามหาเวท', price: 30, icon: '💧', desc: 'ฟื้นฟูมานา 50%', type: 'potion_mp' },
      { id: 'hp_pot_royal', name: 'HP Potion', nameTh: 'ยาฟื้นเลือดโอสถทิพย์', price: 40, icon: '🧪', desc: 'ฟื้นฟูเลือด 50%', type: 'potion_hp' },
    ],
  },

  // Zone 4: Volcano Ridge Ashfall Village
  {
    id: 'chief_ignis',
    name: 'Chief Ignis',
    nameTh: 'หัวหน้าเผ่าเพลิงอิกนิส',
    role: 'Fire Clan Leader',
    roleTh: 'หัวหน้าเผ่าลาวาแอชฟอล',
    zoneId: 4,
    villageName: 'Ashfall Magma Forge',
    villageNameTh: 'หมู่บ้านชนเผ่าเพลิงลาวาแอชฟอล',
    icon: '👺',
    x: -260,
    z: 220,
    color: 0xc2410c,
    hat: 0xea580c,
    dialog: 'เปลวเพลิงไม่มีวันดับสูญ! จงระวังบ่อลาวาเดือดและโกเลมไฟยักษ์ในหุบเขาด้านนอก!',
  },
  {
    id: 'smith_vulcan',
    name: 'Magma Smith Vulcan',
    nameTh: 'ช่างหลอมหินลาวาวัลแคน',
    role: 'Obsidian Forger',
    roleTh: 'ช่างตีแร่ออบซิเดียน',
    zoneId: 4,
    villageName: 'Ashfall Magma Forge',
    villageNameTh: 'หมู่บ้านชนเผ่าเพลิงลาวาแอชฟอล',
    icon: '🌋',
    x: -285,
    z: 210,
    color: 0x991b1b,
    hat: 0x7f1d1d,
    dialog: 'แร่ออบซิเดียนที่ขุดได้จากภูเขาไฟนี้ทนทานต่อความร้อนยิ่งกว่าสิ่งใดในใต้หล้า!',
    shopItems: [
      { id: 'titan_doom', name: 'Titan Doom Destroyer', nameTh: 'ดาบทำลายล้างไททันดูม', price: 1200, icon: '⚡', desc: '+175 ATK', type: 'weapon', idx: 5 },
      { id: 'hp_pot_magma', name: 'HP Potion', nameTh: 'ยาฟื้นเลือดสกัดเพลิง', price: 40, icon: '🧪', desc: 'ฟื้นฟูเลือด 50%', type: 'potion_hp' },
    ],
  },

  // Zone 5: Frostbite Snow Clan Village
  {
    id: 'hunter_freya',
    name: 'Arctic Hunter Freya',
    nameTh: 'พรานหญิงหิมะเฟรยา',
    role: 'Glacier Tracker',
    roleTh: 'ผู้นำพรานล่าสัตว์เหมันต์',
    zoneId: 5,
    villageName: 'Winterhaven Frost Village',
    villageNameTh: 'หมู่บ้านชาวหิมะวินเทอร์ฮาเวน',
    icon: '❄️',
    x: 230,
    z: 230,
    color: 0x0284c7,
    hat: 0xbae6fd,
    dialog: 'ยินดีต้อนรับสู่วินเทอร์ฮาเวน! อากาศที่นี่หนาวเหน็บ ควรสวมชุดขนสัตว์หมาป่าและพกฟืนอุ่นกองไฟไว้เสมอ!',
  },
  {
    id: 'elder_frostbeard',
    name: 'Elder Frostbeard',
    nameTh: 'ผู้เฒ่าเคราหิมะฟรอสต์เบียร์ด',
    role: 'Clan Sage',
    roleTh: 'นักปราชญ์อาวุโสแห่งยอดเขาหิมะ',
    zoneId: 5,
    villageName: 'Winterhaven Frost Village',
    villageNameTh: 'หมู่บ้านชาวหิมะวินเทอร์ฮาเวน',
    icon: '🧙',
    x: 260,
    z: 250,
    color: 0x0369a1,
    hat: 0xf0f9ff,
    dialog: 'ข้าสามารถช่วยรักษาบาดแผลจากไอเย็นให้เจ้าได้ฟรี พักผ่อนผิงไฟให้อบอุ่นก่อนออกเดินทางต่อเถิด',
  },
];

export class VillageManager {
  scene: THREE.Scene;
  npcEntities: { def: NPCDef; group: THREE.Group; marker: THREE.Sprite }[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.buildAllVillages();
    this.spawnAllNPCs();
  }

  private buildAllVillages() {
    // 1. Zone 1: Clover Meadows Village
    this.buildPlainsVillage(0, 0);

    // 2. Zone 2: Whispering Forest Sylvan Tree Village
    this.buildForestVillage(-250, -170);

    // 3. Zone 3: Grand Castle Citadel
    this.buildCastleCity(350, -250);

    // 4. Zone 4: Ashfall Magma Village
    this.buildVolcanoVillage(-270, 215);

    // 5. Zone 5: Winterhaven Snow Village
    this.buildSnowVillage(245, 240);
  }

  private buildPlainsVillage(cx: number, cz: number) {
    const g = new THREE.Group();
    // Central Fountain
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(8, 8.5, 1.8, 14), mat(0x94a3b8));
    basin.position.set(cx, getTerrainHeight(cx, cz) + 0.9, cz);
    const water = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 0.4, 14), new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8 }));
    water.position.set(cx, getTerrainHeight(cx, cz) + 1.6, cz);
    g.add(basin, water);
    colliders.push({ x: cx, z: cz, r: 8.5 });

    // Windmill
    const wx = cx + 45;
    const wz = cz + 30;
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 6, 18, 8), mat(0xf8fafc));
    tower.position.set(wx, getTerrainHeight(wx, wz) + 9, wz);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(5, 5, 8), mat(0xb91c1c));
    roof.position.set(wx, getTerrainHeight(wx, wz) + 20, wz);
    g.add(tower, roof);
    colliders.push({ x: wx, z: wz, r: 6 });

    // Cozy Village Cottages
    [
      [-30, -25, 0xe2e8f0, 0xb45309],
      [35, -35, 0xfde68a, 0x991b1b],
      [-35, 28, 0xe2e8f0, 0x15803d],
      [-55, -8, 0xfecaca, 0x78350f],
      [55, 12, 0xe2e8f0, 0x1d4ed8],
    ].forEach(([dx, dz, wall, rf]) => {
      const x = cx + (dx as number);
      const z = cz + (dz as number);
      const y = getTerrainHeight(x, z);
      const house = new THREE.Group();
      house.position.set(x, y, z);
      house.add(
        box(10, 7, 10, mat(wall as number), 0, 3.5, 0),
        new THREE.Mesh(new THREE.ConeGeometry(8.5, 5.5, 4).rotateY(Math.PI / 4), mat(rf as number))
      );
      house.children[1].position.y = 9.5;
      house.add(box(2.4, 4, 0.4, mat(0x78350f), 0, 2, 5.1)); // door
      shadowAll(house);
      g.add(house);
      colliders.push({ x, z, r: 7.5 });
    });

    this.scene.add(g);
  }

  private buildForestVillage(cx: number, cz: number) {
    const g = new THREE.Group();
    // Elevated Wooden Platforms and Forest Longhouses
    [
      [0, 0],
      [-25, -20],
      [25, -25],
      [-20, 25],
    ].forEach(([dx, dz]) => {
      const x = cx + dx;
      const z = cz + dz;
      const y = getTerrainHeight(x, z);

      // Wooden Timber Platform
      const plat = box(14, 1.2, 14, mat(0x78350f), x, y + 1.2, z);
      // Support pillars
      [-5, 5].forEach((px) => {
        [-5, 5].forEach((pz) => {
          const col = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 4, 6), mat(0x451a03));
          col.position.set(x + px, y + 1, z + pz);
          g.add(col);
        });
      });

      // Treehouse cabin
      const cabin = box(10, 6, 10, mat(0x54381e), x, y + 4.5, z);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(8, 4.5, 4).rotateY(Math.PI / 4), mat(0x166534));
      roof.position.set(x, y + 9.5, z);
      g.add(plat, cabin, roof);
      colliders.push({ x, z, r: 8 });
    });

    // Hanging forest lanterns
    [-15, 15].forEach((dx) => {
      const x = cx + dx;
      const z = cz;
      const y = getTerrainHeight(x, z);
      const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 8), mat(0xa7f3d0, { emissive: 0x10b981, emissiveIntensity: 1.5 }));
      lantern.position.set(x, y + 4, z);
      g.add(lantern);
    });

    this.scene.add(g);
  }

  private buildCastleCity(cx: number, cz: number) {
    const g = new THREE.Group();
    const stoneMat = mat(0x64748b);
    const blueMat = mat(0x1e3a8a);

    // Castle Keep
    const keep = box(42, 34, 42, stoneMat, cx, getTerrainHeight(cx, cz) + 17, cz);
    keep.castShadow = true;
    g.add(keep);
    colliders.push({ x: cx, z: cz, r: 26 });

    // Corner Towers
    [
      [-22, -22],
      [22, -22],
      [-22, 22],
      [22, 22],
    ].forEach(([tx, tz]) => {
      const x = cx + tx;
      const z = cz + tz;
      const y = getTerrainHeight(x, z);
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 6, 46, 10), stoneMat);
      tower.position.set(x, y + 23, z);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(6.8, 12, 10), blueMat);
      cone.position.set(x, y + 52, z);
      g.add(tower, cone);
      colliders.push({ x, z, r: 6.5 });
    });

    // Citadel Town Plaza Mansions
    [
      [-45, 15],
      [-45, -25],
      [45, 15],
    ].forEach(([mx, mz]) => {
      const x = cx + mx;
      const z = cz + mz;
      const y = getTerrainHeight(x, z);
      const mansion = box(14, 10, 14, mat(0x94a3b8), x, y + 5, z);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(11, 6, 4).rotateY(Math.PI / 4), blueMat);
      roof.position.set(x, y + 13, z);
      g.add(mansion, roof);
      colliders.push({ x, z, r: 9 });
    });

    this.scene.add(g);
  }

  private buildVolcanoVillage(cx: number, cz: number) {
    const g = new THREE.Group();
    const basaltMat = mat(0x1e1b18);
    const lavaForgemat = mat(0xff4500, { emissive: 0xff4500, emissiveIntensity: 2.5 });

    // Obsidian Forges & Basalt Lodges
    [
      [0, 0],
      [-25, -20],
      [25, -20],
      [-20, 25],
    ].forEach(([dx, dz]) => {
      const x = cx + dx;
      const z = cz + dz;
      const y = getTerrainHeight(x, z);
      const lodge = box(12, 7, 12, basaltMat, x, y + 3.5, z);
      const roof = box(13, 1.2, 13, mat(0x7f1d1d), x, y + 7.5, z);
      // Chimney with glowing smoke
      const chimney = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 6, 6), basaltMat);
      chimney.position.set(x + 3.5, y + 10, z + 3.5);
      const ember = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 8), lavaForgemat);
      ember.position.set(x + 3.5, y + 13.5, z + 3.5);
      g.add(lodge, roof, chimney, ember);
      colliders.push({ x, z, r: 8 });
    });

    // Central Magma Crucible Basin
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(6, 6.5, 2, 10), basaltMat);
    basin.position.set(cx, getTerrainHeight(cx, cz) + 1, cz);
    const magma = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.2, 0.4, 10), lavaForgemat);
    magma.position.set(cx, getTerrainHeight(cx, cz) + 1.8, cz);
    g.add(basin, magma);
    colliders.push({ x: cx, z: cz, r: 6.5 });

    this.scene.add(g);
  }

  private buildSnowVillage(cx: number, cz: number) {
    const g = new THREE.Group();
    const snowCabinMat = mat(0x38bdf8);
    const frostedWood = mat(0x3f2e21);

    // Snow Igloos and Frosted Timber Cabins
    [
      [0, 0],
      [-22, -18],
      [24, -20],
      [-20, 22],
    ].forEach(([dx, dz]) => {
      const x = cx + dx;
      const z = cz + dz;
      const y = getTerrainHeight(x, z);
      const cabin = box(11, 6, 11, frostedWood, x, y + 3, z);
      const snowRoof = new THREE.Mesh(new THREE.ConeGeometry(9, 5, 4).rotateY(Math.PI / 4), mat(0xf1f5f9));
      snowRoof.position.set(x, y + 8, z);
      g.add(cabin, snowRoof);
      colliders.push({ x, z, r: 7.5 });
    });

    // Central Ice Crystal Totem
    const totem = new THREE.Mesh(
      new THREE.ConeGeometry(1.8, 10, 5),
      mat(0x38bdf8, { emissive: 0x0284c7, emissiveIntensity: 1.5, roughness: 0.1 })
    );
    totem.position.set(cx, getTerrainHeight(cx, cz) + 5, cz);
    g.add(totem);
    colliders.push({ x: cx, z: cz, r: 4 });

    this.scene.add(g);
  }

  private spawnAllNPCs() {
    ALL_VILLAGE_NPCS.forEach((def) => {
      const g = new THREE.Group();
      const y = getTerrainHeight(def.x, def.z);
      g.position.set(def.x, y, def.z);

      const body = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 3.6, 8), mat(def.color));
      body.position.y = 1.8;
      const hd = new THREE.Mesh(new THREE.SphereGeometry(1.15, 10, 10), mat(0xfde047));
      hd.position.y = 4.3;
      const hat = new THREE.Mesh(new THREE.ConeGeometry(1.3, 1.8, 8), mat(def.hat));
      hat.position.y = 5.8;

      g.add(body, hd, hat);
      const lb = makeLabel(def.nameTh, '#fde047', 0.9);
      lb.position.y = 8.2;
      g.add(lb);

      const marker = makeLabel('!', '#fbbf24', 0.6);
      marker.position.y = 10.5;
      marker.visible = false;
      g.add(marker);

      shadowAll(g);
      this.scene.add(g);
      colliders.push({ x: def.x, z: def.z, r: 1.8 });

      this.npcEntities.push({ def, group: g, marker });
    });
  }

  update(dt: number, px: number, pz: number, questTargetNpcId?: string) {
    this.npcEntities.forEach(({ def, group, marker }, i) => {
      group.position.y = getTerrainHeight(def.x, def.z) + Math.abs(Math.sin(Date.now() * 0.002 + i)) * 0.15;
      const d = Math.hypot(def.x - px, def.z - pz);
      if (d < 24) {
        group.rotation.y = Math.atan2(px - def.x, pz - def.z);
      }
      marker.visible = def.id === questTargetNpcId;
      if (marker.visible) {
        marker.position.y = 10.5 + Math.sin(Date.now() * 0.005) * 0.4;
      }
    });
  }

  getNearestNPC(px: number, pz: number, maxDist: number = 8.0): NPCDef | null {
    let best: NPCDef | null = null;
    let minDist = maxDist;
    for (const { def } of this.npcEntities) {
      const d = Math.hypot(def.x - px, def.z - pz);
      if (d < minDist) {
        minDist = d;
        best = def;
      }
    }
    return best;
  }
}
