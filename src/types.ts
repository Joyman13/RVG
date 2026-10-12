/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ItemCategory = 'material' | 'drop' | 'weapon' | 'armor' | 'consumable' | 'tool' | 'building';
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface ItemDef {
  id: string;
  name: string;
  nameTh: string;
  icon: string;
  category: ItemCategory;
  rarity: ItemRarity;
  description: string;
  descriptionTh: string;
  sellPrice: number;
  atk?: number;
  def?: number;
  hpRestore?: number;
  mpRestore?: number;
  buffDuration?: number;
  buffType?: 'speed' | 'damage' | 'shield';
  color?: number;
}

export interface InventorySlot {
  itemId: string;
  count: number;
}

export interface CraftingRecipe {
  id: string;
  name: string;
  nameTh: string;
  category: 'weapons' | 'armor' | 'tools' | 'consumables' | 'housing';
  resultItemId: string;
  resultCount: number;
  materials: { itemId: string; count: number }[];
  description: string;
  descriptionTh: string;
}

export type HarvestNodeType = 'tree_oak' | 'tree_ancient' | 'tree_frost' | 'rock_granite' | 'rock_iron' | 'rock_gold' | 'ore_fire' | 'ore_frost';

export interface HarvestNodeDef {
  type: HarvestNodeType;
  name: string;
  nameTh: string;
  toolRequired: 'axe' | 'pickaxe' | 'any';
  maxHp: number;
  dropItemId: string;
  dropMin: number;
  dropMax: number;
  rareDropId?: string;
  rareChance?: number;
  color: number;
  scale: number;
}

export type BuildingPieceType = 
  | 'foundation_wood'
  | 'foundation_stone'
  | 'wall_wood'
  | 'wall_stone'
  | 'wall_window'
  | 'doorframe'
  | 'roof_wood'
  | 'fence_wood'
  | 'campfire'
  | 'crafting_table'
  | 'storage_chest'
  | 'torch_wall';

export interface BuildingPieceDef {
  type: BuildingPieceType;
  name: string;
  nameTh: string;
  icon: string;
  category: 'structure' | 'furniture';
  cost: { itemId: string; count: number }[];
  description: string;
  size: { w: number; h: number; d: number };
}

export interface PlacedStructure {
  id: string;
  type: BuildingPieceType;
  x: number;
  y: number;
  z: number;
  rotation: number;
}

export interface SkillDef {
  id: string;
  name: string;
  nameTh: string;
  icon: string;
  branch: 'combat' | 'survival' | 'magic';
  maxLevel: number;
  requiredPlayerLevel: number;
  description: string;
  descriptionTh: string;
  effectPerLevel: string;
}

export type TrainRouteId = 'outer_express' | 'central_direct' | 'north_south';

export interface TrainStationDef {
  id: string;
  name: string;
  nameTh: string;
  zoneId: number;
  zoneName: string;
  zoneNameTh: string;
  u: number;
  x: number;
  z: number;
  color: number;
  icon: string;
  routes?: TrainRouteId[];
}

export interface MonsterDropEntry {
  itemId: string;
  min: number;
  max: number;
  chance: number;
}

export interface NPCDef {
  id: string;
  name: string;
  nameTh: string;
  role: string;
  roleTh: string;
  zoneId: number;
  villageName: string;
  villageNameTh: string;
  icon: string;
  x: number;
  z: number;
  color: number;
  hat: number;
  dialog: string;
  shopItems?: { id: string; name: string; nameTh: string; price: number; icon: string; desc: string; type: 'weapon' | 'armor' | 'potion_hp' | 'potion_mp'; idx?: number }[];
}

export interface MasteriesData {
  combatLevel: number;
  combatExp: number;
  woodcuttingLevel: number;
  woodcuttingExp: number;
  miningLevel: number;
  miningExp: number;
  buildingLevel: number;
  buildingExp: number;
  craftingLevel: number;
  craftingExp: number;
}

export interface PlayerData {
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  exp: number;
  maxExp: number;
  gold: number;
  sp: number;
  skills: Record<string, number>;
  masteries: MasteriesData;
  inventory: InventorySlot[];
  weaponIdx: number;
  armorIdx: number;
  potionHp: number;
  potionMp: number;
  questIndex: number;
  questProgress: number;
  kills: number;
  harvests: number;
  structuresBuilt: number;
  playTime: number;
  pos: { x: number; z: number };
  look: { cape: number; hair: number };
  chests: number[];
  bounty: { target: string; required: number; rewardGold: number; rewardExp: number } | null;
  placedStructures: PlacedStructure[];
  chestStorage: InventorySlot[];
}

export interface ToastMessage {
  id: string;
  text: string;
  color?: string;
}

export interface FloatingTextData {
  id: string;
  text: string;
  color: string;
  x: number;
  y: number;
  size?: number;
}
