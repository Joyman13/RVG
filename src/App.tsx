/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  PlayerData,
  CraftingRecipe,
  BuildingPieceType,
  TrainRouteId,
  ToastMessage,
  FloatingTextData,
  NPCDef,
} from './types.ts';
import {
  ITEMS,
  QUESTS,
  WEAPONS as WEAPON_DEFS,
  ARMORS as ARMOR_DEFS,
  SKILLS,
  BUILDING_PIECES,
} from './game/constants.ts';
import { AudioFX, Music } from './game/audio.ts';
import {
  getTerrainHeight,
  inLava,
  zoneAt,
  resolveColliders,
  buildTerrainMesh,
  SPAWN,
  WORLD_LIMIT,
  VOL,
  SNOW,
  CASTLE,
  TSIZE,
  TN,
  lerp,
} from './game/terrain.ts';
import { TrainSystem, ALL_TRAIN_ROUTES } from './game/train.ts';
import { GatheringSystem } from './game/gathering.ts';
import { BuildingSystem } from './game/building.ts';
import { MonsterInstance } from './game/monsters.ts';
import { PlayerRig } from './game/playerRig.ts';
import { VillageManager, ALL_VILLAGE_NPCS } from './game/villages.ts';
import { PetManager, PetId, PET_DEFS } from './game/pets.ts';
import { TrialManager, TRIALS, TrialDef } from './game/trials.ts';

// UI Components
import { GameHUD } from './components/GameHUD.tsx';
import { LuxurySidebar } from './components/LuxurySidebar.tsx';
import { MinecraftHotbar } from './components/MinecraftHotbar.tsx';
import { CraftingModal } from './components/CraftingModal.tsx';
import { BuildingHUD } from './components/BuildingHUD.tsx';
import { SkillModal } from './components/SkillModal.tsx';
import { InventoryModal } from './components/InventoryModal.tsx';
import { StorageChestModal } from './components/StorageChestModal.tsx';
import { ShopModal } from './components/ShopModal.tsx';
import { StatsModal } from './components/StatsModal.tsx';
import { PauseModal } from './components/PauseModal.tsx';
import { NPCModal } from './components/NPCModal.tsx';
import { TrainRouteModal } from './components/TrainRouteModal.tsx';
import { PetModal } from './components/PetModal.tsx';
import { StartScreen } from './components/StartScreen.tsx';

const SAVE_KEY = 'fantasy_rpg_open_world_full_v4';

function defaultPlayer(): PlayerData {
  return {
    name: 'Fantasy Hero',
    level: 1,
    hp: 100,
    maxHp: 100,
    mp: 50,
    maxMp: 50,
    exp: 0,
    maxExp: 100,
    gold: 70,
    sp: 2,
    skills: {},
    masteries: {
      combatLevel: 1,
      combatExp: 0,
      woodcuttingLevel: 1,
      woodcuttingExp: 0,
      miningLevel: 1,
      miningExp: 0,
      buildingLevel: 1,
      buildingExp: 0,
      craftingLevel: 1,
      craftingExp: 0,
    },
    inventory: [
      { itemId: 'wood_log', count: 18 },
      { itemId: 'stone_chunk', count: 12 },
      { itemId: 'iron_ore', count: 5 },
    ],
    weaponIdx: 0,
    armorIdx: 0,
    potionHp: 3,
    potionMp: 2,
    questIndex: 0,
    questProgress: 0,
    kills: 0,
    harvests: 0,
    structuresBuilt: 0,
    playTime: 0,
    pos: { x: SPAWN.x, z: SPAWN.z },
    look: { cape: 0, hair: 0 },
    chests: [],
    bounty: null,
    placedStructures: [],
    chestStorage: [],
  };
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // React State
  const [player, setPlayer] = useState<PlayerData>(defaultPlayer());
  const [gameStarted, setGameStarted] = useState(false);
  const [hasSave, setHasSave] = useState(false);
  const [saveSummary, setSaveSummary] = useState('');
  const [activeZoneName, setActiveZoneName] = useState('Zone 1: Central Village');
  const [clockText, setClockText] = useState('☀️ 12:00');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingTextData[]>([]);

  // Modals & HUD state
  const [showCrafting, setShowCrafting] = useState(false);
  const [showSkills, setShowSkills] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showStorageChest, setShowStorageChest] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showPause, setShowPause] = useState(false);
  const [showTrainRoutes, setShowTrainRoutes] = useState(false);
  const [showPets, setShowPets] = useState(false);
  const [activePet, setActivePet] = useState<PetId | null>('fox');
  const [isGliding, setIsGliding] = useState(false);
  const [comboCount, setComboCount] = useState(0);
  const [comboTimer, setComboTimer] = useState(0);
  const [trialStatus, setTrialStatus] = useState<{
    nameTh: string;
    waveNum: number;
    totalWaves: number;
    remaining: number;
    total: number;
    timeSec: number;
  } | null>(null);
  const [isBuildMode, setIsBuildMode] = useState(false);
  const [isDemolishMode, setIsDemolishMode] = useState(false);
  const [activePieceType, setActivePieceType] = useState<BuildingPieceType>('foundation_wood');
  const [selectedHotbarSlot, setSelectedHotbarSlot] = useState<number>(1);
  const [customHeldItem, setCustomHeldItem] = useState<{ id: string; nameTh: string; icon: string } | null>(null);
  const [activeTrainRoute, setActiveTrainRoute] = useState<TrainRouteId>('outer_express');

  const [activeNPC, setActiveNPC] = useState<{
    id: string;
    name: string;
    role: string;
    icon: string;
  } | null>(null);
  const [npcDialog, setNpcDialog] = useState<{ text: string; buttons: { label: string; cls?: string; fn: () => void }[] } | null>(null);

  const [activeShop, setActiveShop] = useState<{
    title: string;
    role: string;
    items: any[];
  } | null>(null);

  const [interactionPrompt, setInteractionPrompt] = useState<{
    label: string;
    icon: string;
    isPassive?: boolean;
    action: () => void;
  } | null>(null);

  const [bossInfo, setBossInfo] = useState<{
    name: string;
    hp: number;
    maxHp: number;
    icon: string;
  } | null>(null);

  const [isDead, setIsDead] = useState(false);

  // References to 3D and Engine systems
  const playerRef = useRef<PlayerData>(player);
  playerRef.current = player;

  const engineRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    trainSystem: TrainSystem;
    gatheringSystem: GatheringSystem;
    buildingSystem: BuildingSystem;
    villageManager: VillageManager;
    petManager: PetManager;
    trialManager: TrialManager;
    monsters: MonsterInstance[];
    playerRig: PlayerRig;
    cooldowns: Record<string, number>;
    cdMax: Record<string, number>;
    keys: Record<string, boolean>;
    cameraConfig: { distance: number; pitch: number; yaw: number };
    isRiding: boolean;
    currentStationZone: number;
    combatTimer: number;
    gameTime: number;
    verticalVelocity: number;
    isGrounded: boolean;
    projectiles: { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[];
    particles: { mesh: THREE.Mesh; vel: THREE.Vector3; life: number; maxLife: number }[];
    burst: (pos: THREE.Vector3, color: number, count: number, speed: number) => void;
  } | null>(null);

  // Toast & Floating text helpers
  const addToast = useCallback((text: string, color?: string) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev.slice(-3), { id, text, color }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);

  const addFloatingText = useCallback((text: string, x: number, y: number, color: string = '#ffffff', size: number = 18) => {
    const id = `flt_${Date.now()}_${Math.random()}`;
    setFloatingTexts((prev) => [...prev.slice(-6), { id, text, x, y, color, size }]);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((f) => f.id !== id));
    }, 1000);
  }, []);

  // Mastery XP System ("การทำสิ่งใด บ่อย ๆ ก็ได้ค่าประสบการณ์การทำสิ่งนั้น")
  const addMasteryExp = useCallback((type: keyof PlayerData['masteries'], amount: number) => {
    setPlayer((prev) => {
      const m = { ...prev.masteries };
      const expKey = type;
      const levelKey = (type.replace('Exp', 'Level') as keyof PlayerData['masteries']);
      
      let curExp = (m[expKey] as number) + amount;
      let curLvl = m[levelKey] as number;
      let needed = curLvl * (type.startsWith('combat') ? 120 : type.startsWith('crafting') ? 80 : 100);
      let leveled = false;

      while (curExp >= needed && curLvl < 20) {
        curExp -= needed;
        curLvl += 1;
        needed = curLvl * (type.startsWith('combat') ? 120 : type.startsWith('crafting') ? 80 : 100);
        leveled = true;
      }

      (m[expKey] as number) = curExp;
      (m[levelKey] as number) = curLvl;

      if (leveled) {
        AudioFX.masteryUp();
        const names: Record<string, string> = {
          combatExp: '⚔️ ความชำนาญการต่อสู้ (Combat Mastery)',
          woodcuttingExp: '🪓 ความชำนาญการตัดไม้ (Woodcutting Mastery)',
          miningExp: '⛏️ ความชำนาญการขุดแร่ (Mining Mastery)',
          buildingExp: '🔨 ความชำนาญการสร้างบ้าน (Building Mastery)',
          craftingExp: '🧪 ความชำนาญการคราฟต์ (Crafting Mastery)',
        };
        addToast(`🏆 เลเวลอัป! ${names[type] || type} ขึ้นเป็น Lv. ${curLvl}!`, '#fde047');
      }

      return { ...prev, masteries: m };
    });
  }, [addToast]);

  // Compute Attack and Defense from Level, Equipment, Skills, and Mastery!
  const getAtk = useCallback(() => {
    const p = playerRef.current;
    let base = 10 + p.level * 5;
    if (p.weaponIdx < WEAPON_DEFS.length) {
      base += WEAPON_DEFS[p.weaponIdx].atk;
    }
    const bladeMastery = p.skills['skill_heavy_strike'] || 0;
    if (bladeMastery > 0) base *= 1 + bladeMastery * 0.12;

    // Combat Mastery Bonus (+5% per mastery level)
    const combatLvl = p.masteries?.combatLevel || 1;
    base *= 1 + (combatLvl - 1) * 0.05;

    const berserk = p.skills['skill_berserker'] || 0;
    if (berserk > 0 && p.hp / p.maxHp < 0.4) {
      base *= 1 + 0.5 + (berserk - 1) * 0.15;
    }
    return Math.round(base);
  }, []);

  const getDef = useCallback(() => {
    const p = playerRef.current;
    let base = 2 + p.level * 3;
    if (p.armorIdx < ARMOR_DEFS.length) {
      base += ARMOR_DEFS[p.armorIdx].def;
    }
    const ironSkin = p.skills['skill_iron_skin'] || 0;
    if (ironSkin > 0) base += ironSkin * 6;
    return Math.round(base);
  }, []);

  // Inventory Helper
  const addItemToInventory = useCallback((itemId: string, count: number) => {
    setPlayer((prev) => {
      const inv = [...prev.inventory];
      const slot = inv.find((s) => s.itemId === itemId);
      if (slot) {
        slot.count += count;
      } else {
        inv.push({ itemId, count });
      }
      return { ...prev, inventory: inv };
    });
  }, []);

  const removeItemFromInventory = useCallback((itemId: string, count: number): boolean => {
    let success = false;
    setPlayer((prev) => {
      const inv = [...prev.inventory];
      const slot = inv.find((s) => s.itemId === itemId);
      if (slot && slot.count >= count) {
        slot.count -= count;
        success = true;
      }
      return { ...prev, inventory: inv.filter((s) => s.count > 0) };
    });
    return success;
  }, []);

  // Add Exp & Level up
  const addExp = useCallback((amount: number) => {
    setPlayer((prev) => {
      let exp = prev.exp + amount;
      let level = prev.level;
      let sp = prev.sp;
      let maxExp = prev.maxExp;
      let maxHp = prev.maxHp;
      let maxMp = prev.maxMp;
      let hp = prev.hp;
      let mp = prev.mp;
      let leveled = false;

      while (exp >= maxExp && level < 30) {
        exp -= maxExp;
        level += 1;
        sp += 2;
        maxExp = Math.round(100 * Math.pow(1.5, level - 1));
        maxHp = 100 + (level - 1) * 20;
        maxMp = 50 + (level - 1) * 10;
        hp = maxHp;
        mp = maxMp;
        leveled = true;
      }

      if (leveled) {
        AudioFX.levelUp();
        addToast(`⭐ เลเวลอัป! Level ${level}! ได้รับ +2 แต้มสกิล (SP)`, '#fde047');
      }

      return {
        ...prev,
        level,
        exp,
        maxExp,
        sp,
        maxHp,
        maxMp,
        hp,
        mp,
      };
    });
  }, [addToast]);

  // Save game to localStorage
  const saveGame = useCallback((silent: boolean = false) => {
    try {
      const eng = engineRef.current;
      const curPlayer = playerRef.current;
      const pos = eng ? { x: eng.playerRig.root.position.x, z: eng.playerRig.root.position.z } : curPlayer.pos;
      const placed = eng ? eng.buildingSystem.placedStructures : curPlayer.placedStructures;

      const dataToSave: PlayerData = {
        ...curPlayer,
        pos,
        placedStructures: placed,
      };

      localStorage.setItem(SAVE_KEY, JSON.stringify(dataToSave));
      if (!silent) addToast('💾 บันทึกเกมสำเร็จแล้ว!', '#4ade80');
    } catch (e) {
      if (!silent) addToast('ไม่สามารถบันทึกเกมได้', '#fca5a5');
    }
  }, [addToast]);

  // Crafting Handler with Crafting Mastery XP
  const handleCraft = (recipe: CraftingRecipe) => {
    const curPlayer = playerRef.current;
    const ok = recipe.materials.every((mat) => {
      const s = curPlayer.inventory.find((inv) => inv.itemId === mat.itemId);
      return s && s.count >= mat.count;
    });

    if (!ok) {
      addToast('วัตถุดิบไม่เพียงพอ!', '#fca5a5');
      return;
    }

    setPlayer((prev) => {
      const inv = [...prev.inventory];
      recipe.materials.forEach((mat) => {
        const s = inv.find((slot) => slot.itemId === mat.itemId);
        if (s) s.count -= mat.count;
      });

      // Crafting mastery chance of bonus yield
      const craftLvl = prev.masteries?.craftingLevel || 1;
      let finalCount = recipe.resultCount;
      if (Math.random() < craftLvl * 0.06) {
        finalCount += 1;
        addToast('✨ โบนัสความชำนาญการคราฟต์: ได้รับไอเทมเพิ่ม 1 ชิ้น!', '#38bdf8');
      }

      const resSlot = inv.find((slot) => slot.itemId === recipe.resultItemId);
      if (resSlot) {
        resSlot.count += finalCount;
      } else {
        inv.push({ itemId: recipe.resultItemId, count: finalCount });
      }

      return { ...prev, inventory: inv.filter((s) => s.count > 0) };
    });

    if (engineRef.current) {
      engineRef.current.playerRig.triggerBuild();
    }

    // Award Crafting Mastery EXP!
    addMasteryExp('craftingExp', 35);
    addToast(`🔨 คราฟต์สำเร็จ: ${recipe.nameTh} x${recipe.resultCount}! (+35 Crafting EXP)`, '#fde047');
    addExp(40);

    const quest = QUESTS[curPlayer.questIndex];
    if (quest && quest.type === 'craft') {
      advanceQuest();
    }
  };

  // Skill Upgrade Handler
  const handleUpgradeSkill = (skillId: string) => {
    setPlayer((prev) => {
      if (prev.sp <= 0) return prev;
      const currentLvl = prev.skills[skillId] || 0;
      const def = SKILLS[skillId];
      if (!def || currentLvl >= def.maxLevel) return prev;

      const newSkills = { ...prev.skills, [skillId]: currentLvl + 1 };
      let newMaxHp = prev.maxHp;
      let newMaxMp = prev.maxMp;

      if (skillId === 'skill_iron_skin') newMaxHp += 25;
      if (skillId === 'skill_arcane_mind') newMaxMp += 20;

      addToast(`⭐ อัปเกรด ${def.nameTh} เป็น Lv. ${currentLvl + 1}!`, '#c084fc');
      return {
        ...prev,
        sp: prev.sp - 1,
        skills: newSkills,
        maxHp: newMaxHp,
        maxMp: newMaxMp,
      };
    });
  };

  // Advance active quest
  const advanceQuest = () => {
    setPlayer((prev) => {
      const q = QUESTS[prev.questIndex];
      if (!q) return prev;
      AudioFX.quest();
      addToast(`✅ ทำภารกิจสำเร็จ: ${q.title}! (+🪙 ${q.rewardGold} Gold, +${q.rewardExp} EXP)`, '#fde047');

      let newGold = prev.gold + q.rewardGold;
      let newInv = [...prev.inventory];
      if (q.rewardItems) {
        q.rewardItems.forEach((r) => {
          const s = newInv.find((slot) => slot.itemId === r.itemId);
          if (s) s.count += r.count;
          else newInv.push({ itemId: r.itemId, count: r.count });
        });
      }

      addExp(q.rewardExp);

      return {
        ...prev,
        gold: newGold,
        inventory: newInv,
        questIndex: prev.questIndex + 1,
        questProgress: 0,
      };
    });
  };

  // Hotbar Slot Selection Handler (Select slot & hold item in 3D hand)
  const handleSelectHotbarSlot = (slot: number) => {
    setSelectedHotbarSlot(slot);
    const eng = engineRef.current;
    if (!eng) return;

    if (slot === 1) {
      if (customHeldItem) {
        eng.playerRig.setHeldItem(customHeldItem.id, {
          weaponIdx: playerRef.current.weaponIdx,
          name: customHeldItem.nameTh,
        });
      } else {
        eng.playerRig.setHeldItem('weapon', { weaponIdx: playerRef.current.weaponIdx });
      }
    } else if (slot === 2) {
      eng.playerRig.setHeldItem('axe');
    } else if (slot === 3) {
      eng.playerRig.setHeldItem('pickaxe');
    } else if (slot === 4) {
      eng.playerRig.setHeldItem('fireball');
    } else if (slot === 5) {
      eng.playerRig.setHeldItem('whirlwind');
    } else if (slot === 6) {
      eng.playerRig.setHeldItem('heal');
    } else if (slot === 7) {
      eng.playerRig.setHeldItem('storm');
    } else if (slot === 8) {
      eng.playerRig.setHeldItem('potion_hp');
    } else if (slot === 9) {
      eng.playerRig.setHeldItem('potion_mp');
    }
  };

  // Hotbar Action Handler (Perform action of held slot)
  const handleActivateHotbarSlot = (slot: number) => {
    handleSelectHotbarSlot(slot);
    const eng = engineRef.current;
    if (!eng) return;

    if (slot === 1) {
      if (customHeldItem?.id.includes('potion_hp')) {
        usePotion('hp');
      } else if (customHeldItem?.id.includes('potion_mp')) {
        usePotion('mp');
      } else {
        triggerAttackOrHarvest();
      }
    } else if (slot === 2) {
      triggerAttackOrHarvest();
    } else if (slot === 3) {
      triggerAttackOrHarvest();
    } else if (slot === 4) {
      triggerSkill(1);
    } else if (slot === 5) {
      triggerSkill(2);
    } else if (slot === 6) {
      triggerSkill(3);
    } else if (slot === 7) {
      triggerSkill(4);
    } else if (slot === 8) {
      usePotion('hp');
    } else if (slot === 9) {
      usePotion('mp');
    }
  };

  // Hold any item from inventory in 3D hand ("เลือกใช้ไอเทมไหน ก็แสดงไอเทมนั้นในมือด้วย")
  const handleHoldItem = (itemId: string) => {
    const item = ITEMS[itemId];
    if (!item) return;
    setCustomHeldItem({ id: itemId, nameTh: item.nameTh, icon: item.icon });
    setSelectedHotbarSlot(1);
    if (engineRef.current) {
      engineRef.current.playerRig.setHeldItem(itemId, {
        weaponIdx: playerRef.current.weaponIdx,
        name: item.nameTh,
      });
    }
    addToast(`✋ กำลังถือ: ${item.nameTh} ในมือ 3D!`, '#38bdf8');
  };

  // Setup Three.js Engine on Mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        setHasSave(true);
        setSaveSummary(`เซฟ: ${saved.name} • Lv. ${saved.level} • 🪙 ${saved.gold} Gold`);
      }
    } catch (_) {}

    // Initialize WebGL Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa0c4ff);
    scene.fog = new THREE.FogExp2(0xa0c4ff, 0.00042);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 4000);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lighting
    const ambientLight = new THREE.HemisphereLight(0xcfe3ff, 0x6b5a3a, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 0.95);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(2048, 2048);
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 700;
    const SH = 160;
    dirLight.shadow.camera.left = -SH;
    dirLight.shadow.camera.right = SH;
    dirLight.shadow.camera.top = SH;
    dirLight.shadow.camera.bottom = -SH;
    scene.add(dirLight);
    scene.add(dirLight.target);

    // Terrain & Minimap Cache
    const mmBgCanvas = document.createElement('canvas');
    const terrainMesh = buildTerrainMesh(mmBgCanvas);
    scene.add(terrainMesh);

    // River Water
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x3892d0,
      transparent: true,
      opacity: 0.78,
      roughness: 0.2,
      emissive: new THREE.Color(0x0b3b66),
      emissiveIntensity: 0.35,
    });
    const waterGeo = new THREE.PlaneGeometry(550, 400, 36, 36);
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.set(-230, -2.5, -90);
    scene.add(waterMesh);

    // 5 Distinct Villages & NPCs
    const villageManager = new VillageManager(scene);

    // Multi-Route Railway System (Obstacle-free, elevated viaduct, multi-lines)
    const trainSystem = new TrainSystem(scene);
    trainSystem.onArriveCallback = (st) => {
      addToast(`🚂 รถไฟจอดเทียบชานชาลา: ${st.nameTh}!`, '#38bdf8');
    };

    // Gathering System (Trees & Mining)
    const gatheringSystem = new GatheringSystem(scene);
    gatheringSystem.onLootGained = (itemId, count, nameTh) => {
      addItemToInventory(itemId, count);
      setPlayer((prev) => ({ ...prev, harvests: prev.harvests + 1 }));
      addToast(`⛏️ ได้รับ: ${nameTh} x${count}`, '#34d399');
      addExp(15);

      const curP = playerRef.current;
      const q = QUESTS[curP.questIndex];
      if (q && q.type === 'gather' && q.target === itemId) {
        const requiredCount = q.required || 1;
        if (curP.questProgress + count >= requiredCount) {
          advanceQuest();
        } else {
          setPlayer((p) => ({ ...p, questProgress: p.questProgress + count }));
        }
      }
    };

    // Building System (Player Housing)
    const buildingSystem = new BuildingSystem(scene);

    // Spawn Monsters across Expanded Map
    const monsters: MonsterInstance[] = [];
    const spawnGroup = (key: string, count: number, xMin: number, xMax: number, zMin: number, zMax: number, zoneReq: number) => {
      let spawned = 0;
      for (let i = 0; i < count * 25 && spawned < count; i++) {
        const x = xMin + Math.random() * (xMax - xMin);
        const z = zMin + Math.random() * (zMax - zMin);
        if (zoneAt(x, z) !== zoneReq) continue;
        const h = getTerrainHeight(x, z);
        if (h < 0.4 || inLava(x, z, 5)) continue;
        monsters.push(new MonsterInstance(key, x, z, scene));
        spawned++;
      }
    };

    spawnGroup('SLIME', 32, -750, -60, -750, 100, 2);
    spawnGroup('WOLF', 24, -750, -60, -750, 100, 2);
    spawnGroup('FIRE_GOLEM', 24, -780, 40, 80, 780, 4);
    spawnGroup('ICE_GOLEM', 24, 60, 780, 80, 780, 5);

    // Bosses
    const bossTitan = new MonsterInstance('BOSS', VOL.x, VOL.z + 26, scene);
    monsters.push(bossTitan);
    const bossFrost = new MonsterInstance('FROST_KING', SNOW.x, SNOW.z + 30, scene);
    monsters.push(bossFrost);

    // Colossal Sky World Boss: Infernal Sky Drake ("จอมมังกรอเวจี อิกนีเซียส")
    const bossDrake = new MonsterInstance('DRAKE', CASTLE.x, CASTLE.z + 55, scene);
    monsters.push(bossDrake);

    // Pet Companion System (สัตว์เลี้ยงคู่ใจ)
    const petManager = new PetManager(scene);
    petManager.setPet(activePet, new THREE.Vector3(SPAWN.x, getTerrainHeight(SPAWN.x, SPAWN.z), SPAWN.z));
    petManager.onPetHeal = (amt) => {
      setPlayer((p) => ({ ...p, hp: Math.min(p.maxHp, p.hp + amt) }));
      addToast(`🦊 สัตว์เลี้ยงฟื้นฟูเลือด +${amt} HP!`, '#4ade80');
    };
    petManager.onPetAttack = (_pos, dmg) => {
      addToast(`🐉 มังกรน้อยยิงลูกไฟช่วยรบ! (${dmg} DMG)`, '#f97316');
    };

    // Ancient Challenge Shrines & Wave Arenas (เสาผนึกท้าทายโบราณ)
    const trialManager = new TrialManager(scene);
    trialManager.onSpawnMonsters = (_trialDef, wave) => {
      addToast(`⚔️ ${wave.nameTh} เริ่มบุกโจมตี!`, '#ef4444');
      for (let i = 0; i < wave.count; i++) {
        const ox = (Math.random() - 0.5) * 36;
        const oz = (Math.random() - 0.5) * 36;
        const m = new MonsterInstance(wave.monsterKey, _trialDef.x + ox, _trialDef.z + oz, scene);
        m.provoked = true;
        monsters.push(m);
      }
    };
    trialManager.onWaveComplete = (waveNum, total) => {
      addToast(`🌟 พิชิต Wave ${waveNum}/${total} สำเร็จ! รอรับคลื่นถัดไป...`, '#38bdf8');
    };
    trialManager.onTrialVictory = (trialDef) => {
      addToast(`🏆 ชัยชนะอันยิ่งใหญ่! ผ่านบททดสอบ ${trialDef.nameTh}!`, '#facc15');
      addExp(trialDef.rewardExp);
      setPlayer((p) => {
        let nInv = [...p.inventory];
        trialDef.rewardItems.forEach((r) => {
          const slot = nInv.find((s) => s.itemId === r.itemId);
          if (slot) slot.count += r.count;
          else nInv.push({ itemId: r.itemId, count: r.count });
        });
        return {
          ...p,
          gold: p.gold + trialDef.rewardGold,
          inventory: nInv,
        };
      });
    };
    trialManager.onTrialDefeat = (reason) => {
      addToast(`💀 ${reason}`, '#ef4444');
    };

    // Fluid Articulated Player Rig
    const playerRig = new PlayerRig();
    playerRig.root.position.set(SPAWN.x, getTerrainHeight(SPAWN.x, SPAWN.z), SPAWN.z);
    playerRig.setHeldItem('weapon', { weaponIdx: playerRef.current.weaponIdx });
    scene.add(playerRig.root);

    // Particle FX Pool
    const particles: { mesh: THREE.Mesh; vel: THREE.Vector3; life: number; maxLife: number }[] = [];
    const partGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);

    const burst = (pos: THREE.Vector3, color: number, count: number, speed: number) => {
      const pMat = new THREE.MeshBasicMaterial({ color });
      for (let i = 0; i < count; i++) {
        const m = new THREE.Mesh(partGeo, pMat);
        m.position.copy(pos);
        scene.add(m);
        particles.push({
          mesh: m,
          vel: new THREE.Vector3(
            (Math.random() - 0.5) * speed,
            Math.random() * speed + 2,
            (Math.random() - 0.5) * speed
          ),
          life: 0.7,
          maxLife: 0.7,
        });
      }
    };

    // Store engine reference
    engineRef.current = {
      scene,
      camera,
      renderer,
      trainSystem,
      gatheringSystem,
      buildingSystem,
      villageManager,
      petManager,
      trialManager,
      monsters,
      playerRig,
      cooldowns: { atk: 0, 1: 0, 2: 0, 3: 0, 4: 0, hp: 0, mp: 0 },
      cdMax: { atk: 0.45, 1: 1.5, 2: 5, 3: 8, 4: 20, hp: 1, mp: 1 },
      keys: {},
      cameraConfig: { distance: 26, pitch: 0.42, yaw: 0 },
      isRiding: false,
      currentStationZone: 1,
      combatTimer: 0,
      gameTime: 0,
      verticalVelocity: 0,
      isGrounded: true,
      projectiles: [],
      particles,
      burst,
    };

    // Keyboard Listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      const k = e.key.toLowerCase();
      if (engineRef.current) engineRef.current.keys[k] = true;

      // Number keys 1..9 for Minecraft hotbar belt
      if (/^[1-9]$/.test(k)) {
        const slotNum = parseInt(k, 10);
        handleSelectHotbarSlot(slotNum);
        return;
      }

      if (k === 'b') {
        setIsBuildMode((prev) => {
          const next = !prev;
          if (engineRef.current) {
            engineRef.current.buildingSystem.setBuildMode(next);
            if (next) engineRef.current.playerRig.setHeldItem('hammer');
            else handleSelectHotbarSlot(selectedHotbarSlot);
          }
          return next;
        });
      } else if (k === 'r') {
        buildingSystem.rotatePiece();
      } else if (k === 'c') {
        setShowCrafting((prev) => !prev);
      } else if (k === 'k') {
        setShowSkills((prev) => !prev);
      } else if (k === 'i') {
        setShowInventory((prev) => !prev);
      } else if (k === 'escape') {
        setShowPause((prev) => !prev);
      } else if (k === 'f') {
        triggerAttackOrHarvest();
      } else if (k === 'e') {
        triggerInteract();
      } else if (k === 'q') {
        usePotion('hp');
      } else if (k === 'p') {
        setShowPets((prev) => !prev);
      } else if (k === 'g') {
        setIsGliding((prev) => {
          const next = !prev;
          if (next) AudioFX.glide();
          return next;
        });
      } else if (k === ' ' && engineRef.current) {
        if (engineRef.current.isGrounded) {
          engineRef.current.verticalVelocity = 15;
          engineRef.current.isGrounded = false;
        } else {
          // Airborne Spacebar toggles Glider Wings! ("ปีกร่อนเวหา Glider")
          setIsGliding((prev) => {
            const next = !prev;
            if (next) AudioFX.glide();
            return next;
          });
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (engineRef.current) engineRef.current.keys[k] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Mouse Drag for Camera Orbit
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onPointerDown = (e: PointerEvent) => {
      if (isBuildMode) {
        const placed = buildingSystem.placePiece(burst);
        if (placed) {
          playerRig.triggerBuild();
          setPlayer((p) => ({ ...p, structuresBuilt: p.structuresBuilt + 1 }));
          addMasteryExp('buildingExp', 40);
          addToast(`🏠 สร้าง ${BUILDING_PIECES[placed.type].nameTh} สำเร็จ! (+40 Building EXP)`, '#fde047');
          const q = QUESTS[playerRef.current.questIndex];
          if (q && q.type === 'build') {
            advanceQuest();
          }
        }
        return;
      }

      if (e.button === 0 && !isBuildMode) {
        triggerAttackOrHarvest();
      }

      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging || !engineRef.current) return;
      const dx = e.clientX - prevMouseX;
      const dy = e.clientY - prevMouseY;
      engineRef.current.cameraConfig.yaw -= dx * 0.005;
      engineRef.current.cameraConfig.pitch = Math.max(
        0.1,
        Math.min(1.3, engineRef.current.cameraConfig.pitch + dy * 0.005)
      );
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!engineRef.current) return;
      // Mouse scroll zooms in and out directly ("การ scroll เมาส์ คือ การซูมเข้า-ออก")
      const zoomSpeed = 0.035;
      const targetDist = engineRef.current.cameraConfig.distance + e.deltaY * zoomSpeed;
      engineRef.current.cameraConfig.distance = Math.max(
        6, // close-up 3rd person / over-the-shoulder view
        Math.min(95, targetDist) // wide overview / high camera view
      );
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    // Handle Window Resize
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    // Main Game Loop
    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const eng = engineRef.current;
      if (!eng) return;

      eng.gameTime += dt;

      // Update cooldowns
      for (const k in eng.cooldowns) {
        eng.cooldowns[k] = Math.max(0, eng.cooldowns[k] - dt);
      }

      // Update Train
      eng.trainSystem.update(dt);

      // Update Gathering respawns
      eng.gatheringSystem.update(dt);

      // Update NPCs in 5 villages
      eng.villageManager.update(dt, eng.playerRig.root.position.x, eng.playerRig.root.position.z);

      // Player Movement Physics
      const pp = eng.playerRig.root.position;
      let moveSpeed = 19;
      const swift = playerRef.current.skills['skill_swift_stride'] || 0;
      if (swift > 0) moveSpeed *= 1 + swift * 0.1;

      let isMoving = false;
      const isSprinting = !!eng.keys['shift'];

      if (eng.isRiding) {
        const seatPos = new THREE.Vector3();
        eng.trainSystem.getPassengerPosition(seatPos);
        pp.copy(seatPos);
        eng.playerRig.root.rotation.y = eng.trainSystem.heading;
      } else {
        let mx = 0;
        let mz = 0;
        if (eng.keys['w'] || eng.keys['arrowup']) mz -= 1;
        if (eng.keys['s'] || eng.keys['arrowdown']) mz += 1;
        if (eng.keys['a'] || eng.keys['arrowleft']) mx -= 1;
        if (eng.keys['d'] || eng.keys['arrowright']) mx += 1;

        if (mx !== 0 || mz !== 0) {
          isMoving = true;
          const ang = Math.atan2(mx, mz) + eng.cameraConfig.yaw;
          const spd = moveSpeed * (isGliding ? 1.6 : (isSprinting ? 1.45 : 1.0));
          pp.x += Math.sin(ang) * spd * dt;
          pp.z += Math.cos(ang) * spd * dt;
          eng.playerRig.root.rotation.y = lerp(eng.playerRig.root.rotation.y, ang, 0.18);
        }

        pp.x = Math.max(-WORLD_LIMIT, Math.min(WORLD_LIMIT, pp.x));
        pp.z = Math.max(-WORLD_LIMIT, Math.min(WORLD_LIMIT, pp.z));
        resolveColliders(pp, 1.0);

        // Glider & Gravity Physics ("ปีกร่อนเวหา Glider")
        if (isGliding && !eng.isGrounded) {
          eng.verticalVelocity = Math.max(-4.5, eng.verticalVelocity - 8 * dt);
          if (Math.random() < 0.45) {
            eng.burst(pp.clone().add(new THREE.Vector3(0, 1.8, 0)), 0x38bdf8, 2, 4);
          }
        } else {
          eng.verticalVelocity -= 32 * dt;
        }
        pp.y += eng.verticalVelocity * dt;

        const gy = getTerrainHeight(pp.x, pp.z);
        if (pp.y <= gy) {
          pp.y = gy;
          eng.verticalVelocity = 0;
          eng.isGrounded = true;
          if (isGliding) {
            setIsGliding(false);
          }
        }

        // Lava damage tick
        const lp = inLava(pp.x, pp.z);
        if (lp && pp.y < lp.y + 1.8) {
          setPlayer((p) => ({ ...p, hp: Math.max(0, p.hp - 14 * dt) }));
        }

        // Cozy Campfire healing tick
        const nearestFire = eng.buildingSystem.getNearestFurniture(pp.x, pp.z, 'campfire', 9.0);
        if (nearestFire && playerRef.current.hp < playerRef.current.maxHp) {
          setPlayer((p) => ({ ...p, hp: Math.min(p.maxHp, p.hp + 9 * dt) }));
        }
      }

      // Update Articulated Character Rig
      eng.playerRig.update(dt, isMoving, isSprinting, eng.isGrounded, eng.verticalVelocity, isGliding);

      // Update Companion Pet System
      eng.petManager.update(dt, pp, eng.playerRig.root.rotation.y, eng.monsters, burst);

      // Update Ancient Trial Shrines System
      eng.trialManager.update(dt);
      if (eng.trialManager.activeTrialId) {
        const trDef = TRIALS[eng.trialManager.activeTrialId];
        setTrialStatus({
          nameTh: trDef.nameTh,
          waveNum: eng.trialManager.currentWaveIndex + 1,
          totalWaves: trDef.waves.length,
          remaining: eng.trialManager.remainingMonsters,
          total: eng.trialManager.totalWaveMonsters,
          timeSec: eng.trialManager.timeRemaining,
        });
      } else {
        setTrialStatus(null);
      }

      // Update Building Ghost Preview
      eng.buildingSystem.updateGhostPosition(pp.x, pp.z, eng.playerRig.root.rotation.y);

      // Update Monsters
      let currentBoss: { name: string; hp: number; maxHp: number; icon: string } | null = null;
      eng.monsters.forEach((m) => {
        m.update(
          dt,
          pp,
          eng.isRiding,
          isDead,
          (dmg) => {
            const effectiveDef = getDef();
            const finalDmg = Math.max(1, Math.round((dmg * 100) / (100 + effectiveDef * 2)));
            setPlayer((p) => {
              const nhp = Math.max(0, p.hp - finalDmg);
              if (nhp <= 0 && !isDead) {
                handlePlayerDeath();
              }
              return { ...p, hp: nhp };
            });
            eng.playerRig.triggerHurt();
            AudioFX.hurt();
          },
          burst,
          () => addToast('DODGED! กระโดดหลบแรงกระแทกได้สำเร็จ!', '#38bdf8'),
          (warn) => addToast(warn, '#f87171')
        );

        if (m.isBoss && m.hp > 0 && Math.hypot(m.pos.x - pp.x, m.pos.z - pp.z) < 95) {
          currentBoss = {
            name: m.T.nameTh,
            hp: m.hp,
            maxHp: m.maxHp,
            icon: m.T.icon || '🔥',
          };
        }
      });
      setBossInfo(currentBoss);

      // Update Projectiles
      for (let i = eng.projectiles.length - 1; i >= 0; i--) {
        const p = eng.projectiles[i];
        p.life -= dt;
        p.mesh.position.addScaledVector(p.vel, dt);

        let hit = p.life <= 0;
        if (!hit) {
          for (const m of eng.monsters) {
            if (m.state !== 'dead' && Math.hypot(m.pos.x - p.mesh.position.x, m.pos.z - p.mesh.position.z) < m.radius + 1.2) {
              hit = true;
              burst(p.mesh.position, 0xff6a00, 20, 14);
              AudioFX.boom();
              const dmg = getAtk() * 2.2;
              m.takeDamage(dmg, pp, () => onMonsterKilled(m));
              addMasteryExp('combatExp', 15);
              break;
            }
          }
        }

        if (hit) {
          scene.remove(p.mesh);
          eng.projectiles.splice(i, 1);
        }
      }

      // Update Particles
      for (let i = eng.particles.length - 1; i >= 0; i--) {
        const pt = eng.particles[i];
        pt.life -= dt;
        pt.vel.y -= 25 * dt;
        pt.mesh.position.addScaledVector(pt.vel, dt);
        pt.mesh.scale.setScalar(Math.max(0.01, pt.life / pt.maxLife));
        if (pt.life <= 0) {
          scene.remove(pt.mesh);
          eng.particles.splice(i, 1);
        }
      }

      // Camera Follows
      const dist = eng.cameraConfig.distance;
      const pitch = eng.cameraConfig.pitch;
      const yaw = eng.cameraConfig.yaw;
      const target = pp.clone().add(new THREE.Vector3(0, 3.8, 0));

      camera.position.set(
        target.x + dist * Math.sin(yaw) * Math.cos(pitch),
        Math.max(target.y + dist * Math.sin(pitch), getTerrainHeight(target.x, target.z) + 1.5),
        target.z + dist * Math.cos(yaw) * Math.cos(pitch)
      );
      camera.lookAt(target);

      // Light Position
      dirLight.position.set(pp.x + 90, pp.y + 140, pp.z + 70);
      dirLight.target.position.copy(pp);

      // Check Active Zone & Clock
      const currentZone = zoneAt(pp.x, pp.z);
      const zoneNames = [
        '',
        'Zone 1: Clover Meadows (หมู่บ้านทุ่งหญ้า)',
        'Zone 2: Sylvan Canopy (หมู่บ้านพงไพร)',
        'Zone 3: Grand Castle Citadel (มหานครปราสาทหลวง)',
        'Zone 4: Ashfall Magma (หมู่บ้านช่างหลอมลาวา)',
        'Zone 5: Winterhaven Frost (หมู่บ้านชาวหิมะ)',
      ];
      setActiveZoneName(zoneNames[currentZone] || 'Zone 1: Clover Meadows');
      Music.currentZone = currentZone;

      // Update Interaction Prompts
      detectInteractions(pp);

      // Render Scene & Minimap
      renderer.render(scene, camera);
      drawMinimap(pp, mmBgCanvas);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
    };
  }, [addMasteryExp]);

  // Minimap rendering
  const drawMinimap = (playerPos: THREE.Vector3, bgCanvas: HTMLCanvasElement) => {
    const mmCanvas = document.getElementById('minimapCanvas') as HTMLCanvasElement;
    if (!mmCanvas) return;
    const ctx = mmCanvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 128, 128);

    const scale = 0.14;
    const worldToCanvas = TN / TSIZE;
    const half = (64 / scale) * worldToCanvas;
    const cx = (playerPos.x + TSIZE / 2) * worldToCanvas;
    const cz = (playerPos.z + TSIZE / 2) * worldToCanvas;

    ctx.drawImage(bgCanvas, cx - half, cz - half, half * 2, half * 2, 0, 0, 128, 128);

    const eng = engineRef.current;
    if (!eng) return;

    // Draw Train
    const trPos = eng.trainSystem.trainGroup.position;
    const tx = 64 + (trPos.x - playerPos.x) * scale;
    const ty = 64 + (trPos.z - playerPos.z) * scale;
    if (tx >= 0 && tx <= 128 && ty >= 0 && ty <= 128) {
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(tx, ty, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Monsters
    eng.monsters.forEach((m) => {
      if (m.state !== 'dead') {
        const mx = 64 + (m.pos.x - playerPos.x) * scale;
        const my = 64 + (m.pos.z - playerPos.z) * scale;
        if (mx >= 0 && mx <= 128 && my >= 0 && my <= 128) {
          ctx.fillStyle = m.isBoss ? '#f97316' : '#ef4444';
          ctx.beginPath();
          ctx.arc(mx, my, m.isBoss ? 4.5 : 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });

    // Draw Player Arrow
    ctx.save();
    ctx.translate(64, 64);
    ctx.rotate(Math.PI - eng.playerRig.root.rotation.y);
    ctx.fillStyle = '#22c55e';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(4.5, 5);
    ctx.lineTo(-4.5, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };

  // Interactions detection
  const detectInteractions = (pp: THREE.Vector3) => {
    const eng = engineRef.current;
    if (!eng) return;

    // 1. Train Riding
    if (eng.isRiding) {
      setInteractionPrompt({
        label: 'กด [E] เพื่อลงจากรถไฟ (Disembark)',
        icon: '🚂',
        action: () => {
          eng.isRiding = false;
          addToast('ลงจากรถไฟเรียบร้อยแล้ว');
        },
      });
      return;
    }

    // Multi-route Train Station interaction
    const trainDist = Math.hypot(eng.trainSystem.trainGroup.position.x - pp.x, eng.trainSystem.trainGroup.position.z - pp.z);
    if (trainDist < 18) {
      setInteractionPrompt({
        label: 'กด [E] เพื่อเลือกรอบ/ขึ้นรถไฟแฟนตาซี',
        icon: '🚂',
        action: () => {
          setShowTrainRoutes(true);
        },
      });
      return;
    }

    // 2. Storage Chest Furniture
    const chestNear = eng.buildingSystem.getNearestFurniture(pp.x, pp.z, 'storage_chest', 5.5);
    if (chestNear) {
      setInteractionPrompt({
        label: 'กด [E] เพื่อเปิดหีบเก็บของในบ้าน',
        icon: '📦',
        action: () => setShowStorageChest(true),
      });
      return;
    }

    // 3. Crafting Table Furniture
    const tableNear = eng.buildingSystem.getNearestFurniture(pp.x, pp.z, 'crafting_table', 5.5);
    if (tableNear) {
      setInteractionPrompt({
        label: 'กด [E] เพื่อเปิดโต๊ะคราฟท์ไอเทม',
        icon: '🔨',
        action: () => setShowCrafting(true),
      });
      return;
    }

    // 4. Village NPCs (Search all 5 distinct villages)
    const nearNPC = eng.villageManager.getNearestNPC(pp.x, pp.z, 8.5);
    if (nearNPC) {
      setInteractionPrompt({
        label: `กด [E] เพื่อคุยกับ ${nearNPC.nameTh}`,
        icon: nearNPC.icon,
        action: () => {
          setActiveNPC(nearNPC);
          const buttons: { label: string; cls?: string; fn: () => void }[] = [];

          // Free Heal button for elders
          if (nearNPC.id === 'elder_thomas' || nearNPC.id === 'elder_frostbeard') {
            buttons.push({
              label: '💚 พักผ่อนฟื้นฟูเลือดและมานาฟรี',
              cls: 'roblox-button-green',
              fn: () => {
                setPlayer((p) => ({ ...p, hp: p.maxHp, mp: p.maxMp }));
                AudioFX.heal();
                addToast('พลังชีวิตและมานาเต็มเปี่ยม!', '#4ade80');
              },
            });
          }

          // Open Shop button if merchant
          if (nearNPC.shopItems && nearNPC.shopItems.length > 0) {
            buttons.push({
              label: `🛒 ร้านค้าของ ${nearNPC.nameTh}`,
              cls: 'roblox-button-gold',
              fn: () => {
                setActiveShop({
                  title: nearNPC.nameTh,
                  role: nearNPC.roleTh,
                  items: nearNPC.shopItems || [],
                });
              },
            });
          }

          setNpcDialog({
            text: `${nearNPC.dialog} (${nearNPC.villageNameTh})`,
            buttons,
          });

          // Check talk quests
          const q = QUESTS[playerRef.current.questIndex];
          if (q && q.type === 'talk' && (q.target === 'elder' ? nearNPC.id === 'elder_thomas' : q.target === nearNPC.id)) {
            advanceQuest();
          }
        },
      });
      return;
    }

    // 5. Ancient Trial Shrines (เสาผนึกท้าทายโบราณ)
    const nearShrine = eng.trialManager.getNearestShrine(pp.x, pp.z, 14);
    if (nearShrine) {
      if (eng.trialManager.activeTrialId) {
        setInteractionPrompt({
          label: `กำลังท้าทาย: ${nearShrine.nameTh} (Wave ${eng.trialManager.currentWaveIndex + 1})`,
          icon: '⚔️',
          isPassive: true,
          action: () => {},
        });
      } else {
        setInteractionPrompt({
          label: `กด [E] เพื่อเริ่มบททดสอบท้าทาย ${nearShrine.nameTh}`,
          icon: '🏆',
          action: () => {
            eng.trialManager.startTrial(nearShrine.id);
            addToast(`⚔️ เริ่มต้นบททดสอบ ${nearShrine.nameTh}! ปราบมอนสเตอร์ทุกเวฟ!`, '#f59e0b');
          },
        });
      }
      return;
    }

    // 6. Harvest Node close by
    const nearNode = eng.gatheringSystem.getNearestNode(pp.x, pp.z, 5.5);
    if (nearNode) {
      setInteractionPrompt({
        label: `กด [F] เพื่อตัด/ขุด ${nearNode.def.nameTh}`,
        icon: nearNode.type.startsWith('tree') ? '🪓' : '⛏️',
        action: () => triggerAttackOrHarvest(),
      });
      return;
    }

    setInteractionPrompt(null);
  };

  // Actions
  const triggerAttackOrHarvest = () => {
    const eng = engineRef.current;
    if (!eng || eng.cooldowns.atk > 0) return;

    eng.cooldowns.atk = 0.45;
    const pp = eng.playerRig.root.position;
    const curP = playerRef.current;

    // Check harvest node in range
    const nearNode = eng.gatheringSystem.getNearestNode(pp.x, pp.z, 6.5);
    if (nearNode) {
      const isTree = nearNode.type.startsWith('tree');
      if (isTree) {
        eng.playerRig.triggerChop();
        addMasteryExp('woodcuttingExp', 15);
      } else {
        eng.playerRig.triggerMine();
        addMasteryExp('miningExp', 15);
      }

      const lumber = curP.skills['skill_lumberjack'] || 0;
      const miner = curP.skills['skill_miner'] || 0;
      eng.gatheringSystem.harvest(nearNode, 1, lumber, miner, eng.burst);
      return;
    }

    // Combat Attack Combo & Critical Hits!
    eng.playerRig.triggerAttackCombo();
    AudioFX.swing();

    const curCombo = comboCount + 1;
    setComboCount(curCombo);
    setComboTimer(3.0);
    const comboMultiplier = 1.0 + Math.min(1.0, (curCombo - 1) * 0.05);
    if (curCombo >= 2) {
      AudioFX.combo();
    }

    const wolfBonus = activePet === 'wolf' ? 18 : 0;
    const baseAtk = getAtk() + wolfBonus;

    eng.monsters.forEach((m) => {
      if (m.state !== 'dead') {
        const d = Math.hypot(m.pos.x - pp.x, m.pos.z - pp.z);
        if (d < m.radius + 4.2) {
          const isCrit = Math.random() < 0.25;
          const critMultiplier = isCrit ? 1.85 : 1.0;
          const finalAtk = Math.round(baseAtk * comboMultiplier * critMultiplier);

          if (isCrit) {
            AudioFX.crit();
            eng.burst(m.pos.clone().add(new THREE.Vector3(0, 2, 0)), 0xfacc15, 20, 12);
          }

          const screenX = window.innerWidth / 2 + (Math.random() - 0.5) * 80;
          const screenY = window.innerHeight / 2 - 40 + (Math.random() - 0.5) * 50;
          addFloatingText(
            isCrit ? `💥 CRIT! -${finalAtk}` : `-${finalAtk}`,
            screenX,
            screenY,
            isCrit ? '#facc15' : '#ef4444',
            isCrit ? 26 : 20
          );

          m.takeDamage(finalAtk, pp, () => onMonsterKilled(m));
          addMasteryExp('combatExp', isCrit ? 20 : 12);
        }
      }
    });
  };

  const triggerSkill = (slot: number) => {
    const eng = engineRef.current;
    if (!eng) return;
    const curP = playerRef.current;

    if (slot === 1) {
      if (curP.mp < 15 || eng.cooldowns['1'] > 0) return;
      setPlayer((p) => ({ ...p, mp: p.mp - 15 }));
      eng.cooldowns['1'] = 1.5;
      eng.playerRig.triggerSpellCast();
      AudioFX.fireball();

      const rot = eng.playerRig.root.rotation.y;
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(1.2, 10, 10),
        new THREE.MeshStandardMaterial({ color: 0xff6a00, emissive: 0xff4500, emissiveIntensity: 2.5 })
      );
      sphere.position.copy(eng.playerRig.root.position).add(new THREE.Vector3(Math.sin(rot) * 2, 2.5, Math.cos(rot) * 2));
      eng.scene.add(sphere);
      eng.projectiles.push({
        mesh: sphere,
        vel: new THREE.Vector3(Math.sin(rot), 0, Math.cos(rot)).multiplyScalar(58),
        life: 1.4,
      });
      addMasteryExp('combatExp', 15);
    } else if (slot === 2) {
      if (curP.mp < 20 || eng.cooldowns['2'] > 0) return;
      setPlayer((p) => ({ ...p, mp: p.mp - 20 }));
      eng.cooldowns['2'] = 4.5;
      eng.playerRig.triggerAttackCombo();
      AudioFX.swing();
      eng.burst(eng.playerRig.root.position, 0x93c5fd, 22, 14);

      const atkPower = getAtk() * 1.5;
      eng.monsters.forEach((m) => {
        if (m.state !== 'dead') {
          const d = Math.hypot(m.pos.x - eng.playerRig.root.position.x, m.pos.z - eng.playerRig.root.position.z);
          if (d < 9.0) {
            m.takeDamage(atkPower, eng.playerRig.root.position, () => onMonsterKilled(m));
            addMasteryExp('combatExp', 15);
          }
        }
      });
    } else if (slot === 3) {
      if (curP.mp < 25 || eng.cooldowns['3'] > 0) return;
      setPlayer((p) => ({ ...p, mp: p.mp - 25, hp: Math.min(p.maxHp, p.hp + 65) }));
      eng.cooldowns['3'] = 8.0;
      eng.playerRig.triggerSpellCast();
      AudioFX.heal();
      eng.burst(eng.playerRig.root.position, 0x4ade80, 24, 8);
      addToast('+65 HP ฟื้นฟูพลังชีวิตศักดิ์สิทธิ์!', '#4ade80');
      addMasteryExp('combatExp', 10);
    } else if (slot === 4) {
      if (curP.level < 5 || curP.mp < 40 || eng.cooldowns['4'] > 0) return;
      setPlayer((p) => ({ ...p, mp: p.mp - 40 }));
      eng.cooldowns['4'] = 18.0;
      eng.playerRig.triggerSpellCast();
      AudioFX.boom();
      eng.burst(eng.playerRig.root.position, 0xfde047, 36, 18);

      const atkPower = getAtk() * 2.8;
      eng.monsters.forEach((m) => {
        if (m.state !== 'dead') {
          const d = Math.hypot(m.pos.x - eng.playerRig.root.position.x, m.pos.z - eng.playerRig.root.position.z);
          if (d < 28.0) {
            m.takeDamage(atkPower, eng.playerRig.root.position, () => onMonsterKilled(m));
            addMasteryExp('combatExp', 25);
          }
        }
      });
      addToast('⚡ มหาวิบัติพายุสายฟ้าฟาดกวาดล้าง!', '#fde047');
    }
  };

  const usePotion = (type: 'hp' | 'mp') => {
    setPlayer((prev) => {
      if (type === 'hp' && prev.potionHp > 0) {
        AudioFX.heal();
        addToast('+50% HP ฟื้นฟูเลือด!', '#ef4444');
        return {
          ...prev,
          potionHp: prev.potionHp - 1,
          hp: Math.min(prev.maxHp, prev.hp + Math.round(prev.maxHp * 0.5)),
        };
      }
      if (type === 'mp' && prev.potionMp > 0) {
        AudioFX.heal();
        addToast('+50% MP ฟื้นฟูมานา!', '#3b82f6');
        return {
          ...prev,
          potionMp: prev.potionMp - 1,
          mp: Math.min(prev.maxMp, prev.mp + Math.round(prev.maxMp * 0.5)),
        };
      }
      return prev;
    });
  };

  const triggerInteract = () => {
    if (interactionPrompt) {
      interactionPrompt.action();
    }
  };

  const onMonsterKilled = (m: MonsterInstance) => {
    const curP = playerRef.current;
    setPlayer((prev) => ({
      ...prev,
      kills: prev.kills + 1,
      gold: prev.gold + Math.floor(m.T.gold[0] + Math.random() * (m.T.gold[1] - m.T.gold[0])),
    }));

    addExp(m.T.exp);
    addMasteryExp('combatExp', 40);

    const drops = m.rollDrops(0);
    drops.forEach((d) => {
      addItemToInventory(d.itemId, d.count);
      addToast(`🎁 มอนสเตอร์ดรอป: ${d.name} x${d.count}!`, '#facc15');
    });

    const q = QUESTS[curP.questIndex];
    if (q && q.type === 'kill' && q.target === m.key) {
      if (curP.questProgress + 1 >= (q.required || 1)) {
        advanceQuest();
      } else {
        setPlayer((p) => ({ ...p, questProgress: p.questProgress + 1 }));
      }
    }

    // Trial Arena progress check
    if (engineRef.current?.trialManager.activeTrialId) {
      engineRef.current.trialManager.onMonsterDefeated();
    }
  };

  const handlePlayerDeath = () => {
    setIsDead(true);
    addToast('💀 คุณสิ้นชีพ! กำลังเกิดใหม่ที่หมู่บ้าน...', '#f87171');
    setTimeout(() => {
      const eng = engineRef.current;
      if (eng) {
        eng.playerRig.root.position.set(SPAWN.x, getTerrainHeight(SPAWN.x, SPAWN.z), SPAWN.z);
      }
      setPlayer((p) => ({
        ...p,
        hp: p.maxHp,
        mp: p.maxMp,
        gold: Math.max(0, Math.floor(p.gold * 0.9)),
      }));
      setIsDead(false);
    }, 2800);
  };

  const handleStartGame = (name: string, capeIdx: number, hairIdx: number, isNew: boolean) => {
    if (isNew) {
      localStorage.removeItem(SAVE_KEY);
      const initP = defaultPlayer();
      initP.name = name;
      initP.look = { cape: capeIdx, hair: hairIdx };
      setPlayer(initP);
    } else {
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (raw) {
          const loaded = JSON.parse(raw);
          setPlayer(loaded);
          if (engineRef.current) {
            engineRef.current.buildingSystem.loadPlacedStructures(loaded.placedStructures || []);
          }
        }
      } catch (_) {}
    }

    AudioFX.init();
    Music.start();
    setGameStarted(true);
    addToast('ยินดีต้อนรับสู่อาณาจักรแฟนตาซี 5 หมู่บ้าน!', '#fde047');
  };

  const activeQuest = QUESTS[player.questIndex] || null;

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-slate-950 font-sans">
      {/* 3D WebGL Canvas */}
      <canvas ref={canvasRef} id="gameCanvas" />

      {/* Screen Damage Vignette */}
      <div id="hitVignette" />

      {/* Floating Notifications */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-40 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="roblox-panel rounded-2xl px-4 py-2 text-xs sm:text-sm font-bold shadow-2xl toast-anim"
            style={{ color: t.color || '#ffffff' }}
          >
            {t.text}
          </div>
        ))}
      </div>

      {/* Floating Combat / Harvest Numbers */}
      {floatingTexts.map((f) => (
        <div
          key={f.id}
          className="floating-text"
          style={{
            left: `${f.x}px`,
            top: `${f.y}px`,
            color: f.color,
            fontSize: `${f.size || 18}px`,
          }}
        >
          {f.text}
        </div>
      ))}

      {/* Death Screen Overlay */}
      {isDead && (
        <div className="fixed inset-0 z-50 bg-red-950/80 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none">
          <span className="text-6xl mb-3 animate-bounce">💀</span>
          <h2 className="text-4xl font-extrabold text-red-200">YOU DIED</h2>
          <p className="text-sm text-red-300 mt-2">กำลังคืนชีพที่หมู่บ้านเริ่มต้น...</p>
        </div>
      )}

      {/* Left Luxury Sidebar (Build, Craft, Skills, Bag, Stats, Menu) */}
      {gameStarted && (
        <LuxurySidebar
          isBuildMode={isBuildMode}
          unspentSp={player.sp}
          inventoryCount={player.inventory.reduce((acc, s) => acc + s.count, 0)}
          activePetIcon={activePet ? PET_DEFS[activePet]?.icon : undefined}
          onToggleBuild={() => {
            const next = !isBuildMode;
            setIsBuildMode(next);
            if (engineRef.current) {
              engineRef.current.buildingSystem.setBuildMode(next);
              if (next) {
                engineRef.current.playerRig.setHeldItem('hammer');
              } else {
                handleSelectHotbarSlot(selectedHotbarSlot);
              }
            }
          }}
          onOpenCrafting={() => setShowCrafting(true)}
          onOpenSkills={() => setShowSkills(true)}
          onOpenInventory={() => setShowInventory(true)}
          onOpenStats={() => setShowStats(true)}
          onOpenPets={() => setShowPets(true)}
          onOpenMenu={() => setShowPause(true)}
        />
      )}

      {/* Main Game HUD (Top Bars, Minimap, Quests, Interactions, Trials, Combos) */}
      {gameStarted && (
        <GameHUD
          player={player}
          activeZoneName={activeZoneName}
          clockText={clockText}
          quest={
            activeQuest
              ? {
                  title: activeQuest.title,
                  desc: activeQuest.desc,
                  distText: '',
                  rewardText: `🪙 ${activeQuest.rewardGold} Gold`,
                  progressText: activeQuest.required ? `${player.questProgress} / ${activeQuest.required}` : undefined,
                  progressPercent: activeQuest.required ? (player.questProgress / activeQuest.required) * 100 : undefined,
                }
              : null
          }
          interactionPrompt={interactionPrompt}
          onInteract={triggerInteract}
          bossData={bossInfo}
          trialData={trialStatus}
          comboData={
            comboCount >= 2
              ? {
                  count: comboCount,
                  multiplier: 1.0 + Math.min(1.0, (comboCount - 1) * 0.05),
                }
              : null
          }
          isGliding={isGliding}
          onToggleGlider={() => {
            setIsGliding((prev) => {
              const next = !prev;
              if (next) AudioFX.glide();
              return next;
            });
          }}
          onZoom={(delta) => {
            if (engineRef.current) {
              engineRef.current.cameraConfig.distance = Math.max(
                6,
                Math.min(95, engineRef.current.cameraConfig.distance + delta)
              );
            }
          }}
        />
      )}

      {/* Bottom Minecraft-Style 9-Slot Hotbar Belt */}
      {gameStarted && (
        <MinecraftHotbar
          selectedSlot={selectedHotbarSlot}
          onSelectSlot={handleSelectHotbarSlot}
          onActivateSlot={handleActivateHotbarSlot}
          cooldowns={engineRef.current ? engineRef.current.cooldowns : {}}
          cdMax={engineRef.current ? engineRef.current.cdMax : {}}
          potionHpCount={player.potionHp}
          potionMpCount={player.potionMp}
          playerLevel={player.level}
          weaponNameTh={WEAPON_DEFS[player.weaponIdx]?.name || 'ดาบโจมตี'}
          weaponIcon={WEAPON_DEFS[player.weaponIdx]?.icon || '⚔️'}
          customHeldItem={customHeldItem}
        />
      )}

      {/* Building Mode Overlay */}
      {gameStarted && isBuildMode && (
        <BuildingHUD
          activeType={activePieceType}
          onSelectType={(t) => {
            setActivePieceType(t);
            if (engineRef.current) engineRef.current.buildingSystem.setPieceType(t);
          }}
          onRotate={() => engineRef.current?.buildingSystem.rotatePiece()}
          onToggleDemolish={() => {
            const next = !isDemolishMode;
            setIsDemolishMode(next);
            if (engineRef.current) engineRef.current.buildingSystem.isDemolishMode = next;
          }}
          isDemolish={isDemolishMode}
          inventory={player.inventory}
          onExit={() => {
            setIsBuildMode(false);
            if (engineRef.current) engineRef.current.buildingSystem.setBuildMode(false);
          }}
        />
      )}

      {/* Multi-Route Railway Selection Modal */}
      {showTrainRoutes && (
        <TrainRouteModal
          currentRouteId={activeTrainRoute}
          onSelectRoute={(rtId) => {
            setActiveTrainRoute(rtId);
            if (engineRef.current) {
              engineRef.current.trainSystem.setRoute(rtId);
            }
          }}
          onBoard={() => {
            if (engineRef.current) {
              engineRef.current.isRiding = true;
              AudioFX.whistle();
              addToast('🚂 ยินดีต้อนรับสู่รถไฟแฟนตาซี! ออกเดินทางแล้ว...', '#38bdf8');
            }
          }}
          onClose={() => setShowTrainRoutes(false)}
        />
      )}

      {/* Crafting System Modal */}
      {showCrafting && (
        <CraftingModal
          inventory={player.inventory}
          onCraft={handleCraft}
          onClose={() => setShowCrafting(false)}
        />
      )}

      {/* Skill Tree Modal */}
      {showSkills && (
        <SkillModal
          playerLevel={player.level}
          availableSp={player.sp}
          skills={player.skills}
          onUpgradeSkill={handleUpgradeSkill}
          onClose={() => setShowSkills(false)}
        />
      )}

      {/* Inventory & Gear Modal */}
      {showInventory && (
        <InventoryModal
          inventory={player.inventory}
          onUseItem={(id) => {
            const it = ITEMS[id];
            if (it?.hpRestore) {
              setPlayer((p) => ({ ...p, hp: Math.min(p.maxHp, p.hp + (it.hpRestore || 0)) }));
              removeItemFromInventory(id, 1);
              if (engineRef.current) engineRef.current.playerRig.triggerDrinkPotion();
              AudioFX.heal();
              addToast(`+${it.hpRestore} HP!`, '#4ade80');
            }
          }}
          onEquipItem={(id) => {
            const it = ITEMS[id];
            if (it?.category === 'weapon') {
              const idx = WEAPON_DEFS.findIndex((w) => w.name === it.name);
              if (idx !== -1) {
                setPlayer((p) => ({ ...p, weaponIdx: idx }));
                setCustomHeldItem(null);
                if (engineRef.current) {
                  engineRef.current.playerRig.setHeldItem('weapon', { weaponIdx: idx });
                }
                addToast(`⚔️ สวมใส่ ${it.nameTh} สำเร็จ! แสดงในมือ 3D`, '#fde047');
              }
            } else if (it?.category === 'armor') {
              const idx = ARMOR_DEFS.findIndex((a) => a.name === it.name);
              if (idx !== -1) {
                setPlayer((p) => ({ ...p, armorIdx: idx }));
                addToast(`🛡️ สวมใส่ ${it.nameTh} สำเร็จ!`, '#fde047');
              }
            }
          }}
          onHoldItem={handleHoldItem}
          onClose={() => setShowInventory(false)}
        />
      )}

      {/* Home Storage Chest Modal */}
      {showStorageChest && (
        <StorageChestModal
          playerInventory={player.inventory}
          chestStorage={player.chestStorage}
          onDeposit={(id, count) => {
            removeItemFromInventory(id, count);
            setPlayer((prev) => {
              const cs = [...prev.chestStorage];
              const s = cs.find((slot) => slot.itemId === id);
              if (s) s.count += count;
              else cs.push({ itemId: id, count });
              return { ...prev, chestStorage: cs };
            });
            addToast(`ฝากไอเทมเรียบร้อยแล้ว`, '#38bdf8');
          }}
          onWithdraw={(id, count) => {
            setPlayer((prev) => {
              const cs = [...prev.chestStorage];
              const s = cs.find((slot) => slot.itemId === id);
              if (s && s.count >= count) {
                s.count -= count;
                addItemToInventory(id, count);
              }
              return { ...prev, chestStorage: cs.filter((slot) => slot.count > 0) };
            });
            addToast(`ถอนไอเทมเรียบร้อยแล้ว`, '#fde047');
          }}
          onClose={() => setShowStorageChest(false)}
        />
      )}

      {/* NPC Merchant Shop Modal */}
      {activeShop && (
        <ShopModal
          shopTitle={activeShop.title}
          shopRole={activeShop.role}
          gold={player.gold}
          items={activeShop.items}
          equippedWeaponIdx={player.weaponIdx}
          equippedArmorIdx={player.armorIdx}
          onBuy={(item) => {
            if (player.gold < item.price) {
              addToast('เงินไม่พอ!', '#fca5a5');
              return;
            }
            const isWeapon = item.type === 'weapon' && typeof item.idx === 'number';
            const newWeaponIdx: number = isWeapon && typeof item.idx === 'number' ? item.idx : player.weaponIdx;
            const newArmorIdx: number = item.type === 'armor' && typeof item.idx === 'number' ? item.idx : player.armorIdx;
            setPlayer((p) => ({
              ...p,
              gold: p.gold - item.price,
              weaponIdx: newWeaponIdx,
              armorIdx: newArmorIdx,
            }));
            if (isWeapon && engineRef.current) {
              engineRef.current.playerRig.setHeldItem('weapon', { weaponIdx: item.idx });
              setCustomHeldItem(null);
            }
            AudioFX.coin();
            addToast(`ซื้อ ${item.nameTh} สำเร็จ! แสดงในมือ 3D`, '#fde047');
          }}
          onClose={() => setActiveShop(null)}
        />
      )}

      {/* Character Stats & Masteries Modal */}
      {showStats && (
        <StatsModal
          player={player}
          atk={getAtk()}
          def={getDef()}
          weaponName={WEAPON_DEFS[player.weaponIdx]?.name || 'Standard'}
          armorName={ARMOR_DEFS[player.armorIdx]?.name || 'Cloth'}
          onClose={() => setShowStats(false)}
        />
      )}

      {/* Pause & Settings Menu with Volume Sliders */}
      {showPause && (
        <PauseModal
          onSave={() => saveGame(false)}
          onResume={() => setShowPause(false)}
          onRestart={() => {
            localStorage.removeItem(SAVE_KEY);
            window.location.reload();
          }}
          onClose={() => setShowPause(false)}
        />
      )}

      {/* NPC Dialog Modal */}
      {activeNPC && npcDialog && (
        <NPCModal
          npc={activeNPC}
          dialogText={npcDialog.text}
          buttons={npcDialog.buttons}
          onClose={() => {
            setActiveNPC(null);
            setNpcDialog(null);
          }}
        />
      )}

      {/* Pet Companions Modal */}
      {showPets && (
        <PetModal
          activePetId={activePet}
          onSelectPet={(petId) => {
            setActivePet(petId);
            if (engineRef.current) {
              engineRef.current.petManager.setPet(petId, engineRef.current.playerRig.root.position);
            }
            if (petId) {
              addToast(`🐾 อัญเชิญ ${PET_DEFS[petId].nameTh} เคียงข้างคุณแล้ว!`, '#f59e0b');
            } else {
              addToast('ยกเลิกการอัญเชิญสัตว์เลี้ยง');
            }
          }}
          onClose={() => setShowPets(false)}
        />
      )}

      {/* Start Title Screen */}
      {!gameStarted && (
        <StartScreen
          hasSave={hasSave}
          saveSummary={saveSummary}
          onStart={handleStartGame}
        />
      )}
    </div>
  );
}
