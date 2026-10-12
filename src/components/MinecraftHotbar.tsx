/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AudioFX } from '../game/audio.ts';

export interface HotbarSlotDef {
  id: number; // 1..9
  type: 'weapon' | 'axe' | 'pickaxe' | 'spell' | 'consumable';
  label: string;
  icon: string;
  keybind: string;
  count?: number;
  cdKey?: string;
  requiredLevel?: number;
  description: string;
}

interface MinecraftHotbarProps {
  selectedSlot: number; // 1..9
  onSelectSlot: (slot: number) => void;
  onActivateSlot: (slot: number) => void;
  cooldowns: Record<string, number>;
  cdMax: Record<string, number>;
  potionHpCount: number;
  potionMpCount: number;
  playerLevel: number;
  weaponNameTh?: string;
  weaponIcon?: string;
  customHeldItem?: { id: string; nameTh: string; icon: string } | null;
}

export const MinecraftHotbar: React.FC<MinecraftHotbarProps> = ({
  selectedSlot,
  onSelectSlot,
  onActivateSlot,
  cooldowns,
  cdMax,
  potionHpCount,
  potionMpCount,
  playerLevel,
  weaponNameTh = 'ดาบโจมตี',
  weaponIcon = '⚔️',
  customHeldItem,
}) => {
  const slots: HotbarSlotDef[] = [
    {
      id: 1,
      type: 'weapon',
      label: customHeldItem ? customHeldItem.nameTh : weaponNameTh,
      icon: customHeldItem ? customHeldItem.icon : weaponIcon,
      keybind: '1',
      cdKey: 'atk',
      description: customHeldItem ? `กำลังถือ ${customHeldItem.nameTh} ในมือ` : 'คอมโบฟัน 3 จังหวะ [คลิกซ้าย/F]',
    },
    {
      id: 2,
      type: 'axe',
      label: 'ขวานตัดไม้',
      icon: '🪓',
      keybind: '2',
      cdKey: 'atk',
      description: 'ตัดต้นไม้โอ๊ค สน และไม้โบราณ',
    },
    {
      id: 3,
      type: 'pickaxe',
      label: 'อีเต็ร์กขุดแร่',
      icon: '⛏️',
      keybind: '3',
      cdKey: 'atk',
      description: 'ขุดหินแกรนิต แร่เหล็ก ทองคำ และออบซิเดียน',
    },
    {
      id: 4,
      type: 'spell',
      label: 'Fireball',
      icon: '🔥',
      keybind: '4',
      cdKey: '1',
      description: 'ลูกไฟเพลิงระเบิด (ใช้ 15 MP)',
    },
    {
      id: 5,
      type: 'spell',
      label: 'Whirlwind',
      icon: '🌪️',
      keybind: '5',
      cdKey: '2',
      description: 'หมุนฟันกวาดศัตรูรอบตัว (ใช้ 20 MP)',
    },
    {
      id: 6,
      type: 'spell',
      label: 'Heal Aura',
      icon: '✨',
      keybind: '6',
      cdKey: '3',
      description: 'ฟื้นฟูเลือดศักดิ์สิทธิ์ (ใช้ 25 MP)',
    },
    {
      id: 7,
      type: 'spell',
      label: 'Storm',
      icon: '⚡',
      keybind: '7',
      cdKey: '4',
      requiredLevel: 5,
      description: 'พายุสายฟ้าฟาดกวาดล้าง (ใช้ 40 MP, ปลดล็อก Lv.5)',
    },
    {
      id: 8,
      type: 'consumable',
      label: 'HP Potion',
      icon: '🧪',
      keybind: '8',
      cdKey: 'hp',
      count: potionHpCount,
      description: 'ฟื้นฟูเลือด 50% ทันที',
    },
    {
      id: 9,
      type: 'consumable',
      label: 'MP Potion',
      icon: '💧',
      keybind: '9',
      cdKey: 'mp',
      count: potionMpCount,
      description: 'ฟื้นฟูมานา 50% ทันที',
    },
  ];

  return (
    <div className="fixed bottom-2.5 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex flex-col items-center">
      {/* Active Slot Description Tag */}
      <div className="mb-1 px-3 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/20 text-[11px] font-bold text-amber-300 shadow-md">
        <span>[{slots[selectedSlot - 1]?.keybind}] {slots[selectedSlot - 1]?.label}</span>
        <span className="text-slate-400 font-normal ml-1.5 hidden sm:inline">{slots[selectedSlot - 1]?.description}</span>
      </div>

      {/* Minecraft-Style Belt Frame */}
      <div className="bg-[#1e293b]/95 p-1.5 sm:p-2 rounded-2xl border-4 border-[#334155] shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex items-center gap-1 sm:gap-1.5 max-w-[96vw] overflow-x-auto">
        {slots.map((s) => {
          const isSelected = selectedSlot === s.id;
          const cd = s.cdKey ? cooldowns[s.cdKey] || 0 : 0;
          const maxCd = s.cdKey ? cdMax[s.cdKey] || 1 : 1;
          const cdPercent = cd > 0 ? (cd / maxCd) * 100 : 0;
          const isLocked = s.requiredLevel && playerLevel < s.requiredLevel;

          return (
            <button
              key={s.id}
              onClick={() => {
                AudioFX.click();
                if (selectedSlot !== s.id) {
                  onSelectSlot(s.id);
                } else {
                  onActivateSlot(s.id);
                }
              }}
              className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer shrink-0 select-none ${
                isSelected
                  ? 'bg-slate-700/95 border-3 border-amber-400 scale-105 shadow-[0_0_12px_rgba(251,191,36,0.6)] z-10'
                  : 'bg-[#0f172a]/90 hover:bg-slate-800/90 border-2 border-slate-700'
              } ${isLocked ? 'opacity-50' : ''}`}
            >
              {/* Number key on top-left */}
              <span className="absolute top-0.5 left-1 text-[9px] font-extrabold text-slate-400 font-mono">
                {s.keybind}
              </span>

              {/* Item Icon */}
              <span className="text-xl sm:text-2xl mt-0.5">{s.icon}</span>

              {/* Stack count on bottom-right (Minecraft style) */}
              {typeof s.count === 'number' && (
                <span className="absolute bottom-0.5 right-1 text-[11px] font-extrabold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
                  {s.count}
                </span>
              )}

              {/* Lock label */}
              {isLocked && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl text-[9px] font-extrabold text-amber-300">
                  Lv.{s.requiredLevel}
                </span>
              )}

              {/* Cooldown Dark Overlay */}
              {cdPercent > 0 && (
                <div
                  className="absolute inset-x-0 bottom-0 bg-black/75 rounded-b-xl pointer-events-none transition-all duration-75"
                  style={{ height: `${cdPercent}%` }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
