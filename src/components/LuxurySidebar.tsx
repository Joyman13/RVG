/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AudioFX } from '../game/audio.ts';
import { Hammer, Sparkles, Star, Package, BarChart2, Menu } from 'lucide-react';

interface LuxurySidebarProps {
  isBuildMode: boolean;
  unspentSp: number;
  inventoryCount: number;
  activePetIcon?: string;
  onToggleBuild: () => void;
  onOpenCrafting: () => void;
  onOpenSkills: () => void;
  onOpenInventory: () => void;
  onOpenStats: () => void;
  onOpenPets?: () => void;
  onOpenMenu: () => void;
}

export const LuxurySidebar: React.FC<LuxurySidebarProps> = ({
  isBuildMode,
  unspentSp,
  inventoryCount,
  activePetIcon,
  onToggleBuild,
  onOpenCrafting,
  onOpenSkills,
  onOpenInventory,
  onOpenStats,
  onOpenPets,
  onOpenMenu,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const items = [
    {
      id: 'build',
      label: 'สร้างบ้าน (Build Mode)',
      sub: 'วางรากฐาน กำแพง และเฟอร์นิเจอร์',
      key: 'B',
      icon: <Hammer className="w-5 h-5 text-amber-300" />,
      action: onToggleBuild,
      isActive: isBuildMode,
      glowColor: 'rgba(251, 191, 36, 0.4)',
    },
    {
      id: 'craft',
      label: 'คราฟต์ไอเทม (Crafting)',
      sub: 'สร้างอาวุธ ชุดเกราะ และยา',
      key: 'C',
      icon: <Sparkles className="w-5 h-5 text-yellow-300" />,
      action: onOpenCrafting,
      glowColor: 'rgba(234, 179, 8, 0.4)',
    },
    {
      id: 'skills',
      label: 'ผังสกิล (Skill Tree)',
      sub: 'อัปเกรดพลังต่อสู้และเก็บเกี่ยว',
      key: 'K',
      icon: <Star className="w-5 h-5 text-purple-300" />,
      action: onOpenSkills,
      badge: unspentSp > 0 ? `${unspentSp} SP` : undefined,
      badgeColor: 'bg-gradient-to-r from-purple-600 to-pink-500 text-white animate-pulse',
      glowColor: 'rgba(168, 85, 247, 0.4)',
    },
    {
      id: 'inventory',
      label: 'กระเป๋าสัมภาระ (Backpack)',
      sub: 'ดูแร่ วัตถุดิบมอนสเตอร์ และสวมใส่ของ',
      key: 'I',
      icon: <Package className="w-5 h-5 text-cyan-300" />,
      action: onOpenInventory,
      badge: inventoryCount > 0 ? `${inventoryCount}` : undefined,
      badgeColor: 'bg-cyan-600 text-white',
      glowColor: 'rgba(6, 182, 212, 0.4)',
    },
    {
      id: 'stats',
      label: 'ข้อมูลตัวละคร (Hero Stats)',
      sub: 'พลังโจมตี ป้องกัน เลเวล และสถิติ',
      key: '📊',
      icon: <BarChart2 className="w-5 h-5 text-emerald-300" />,
      action: onOpenStats,
      glowColor: 'rgba(16, 185, 129, 0.4)',
    },
    {
      id: 'pets',
      label: 'สัตว์เลี้ยงคู่ใจ (Pet Companions)',
      sub: 'จิ้งจอกสายลม มังกรน้อย และลูกหมาป่า',
      key: 'P',
      icon: <span className="text-lg">{activePetIcon || '🐾'}</span>,
      action: onOpenPets || (() => {}),
      badge: activePetIcon ? 'เคียงข้าง' : undefined,
      badgeColor: 'bg-amber-600 text-white font-bold',
      glowColor: 'rgba(245, 158, 11, 0.4)',
    },
    {
      id: 'menu',
      label: 'เมนูเกม (Game Menu)',
      sub: 'บันทึกเกม ปรับแต่งเสียง และออก',
      key: 'Esc',
      icon: <Menu className="w-5 h-5 text-slate-300" />,
      action: onOpenMenu,
      glowColor: 'rgba(148, 163, 184, 0.4)',
    },
  ];

  return (
    <aside className="fixed left-3 top-1/2 -translate-y-1/2 z-30 pointer-events-auto flex flex-col gap-2">
      {/* Luxury Dock Container */}
      <div className="bg-slate-950/85 backdrop-blur-2xl p-2 rounded-2xl sm:rounded-3xl border-2 border-amber-500/30 shadow-[0_15px_40px_rgba(0,0,0,0.8)] flex flex-col gap-2">
        {items.map((item, idx) => {
          const isHovered = hoveredIdx === idx;

          return (
            <div key={item.id} className="relative flex items-center">
              <button
                onClick={() => {
                  AudioFX.click();
                  item.action();
                }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-150 cursor-pointer ${
                  item.isActive
                    ? 'bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 shadow-[0_0_16px_rgba(251,191,36,0.8)] scale-105 border-2 border-white'
                    : 'bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 hover:border-amber-400/60 hover:scale-105 text-white'
                }`}
                style={{
                  boxShadow: item.isActive ? '0 0 16px rgba(251,191,36,0.6)' : undefined,
                }}
              >
                {item.icon}

                {/* Counter / SP Badge */}
                {item.badge && (
                  <span
                    className={`absolute -top-1.5 -right-1.5 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold shadow-md border border-white/40 ${
                      item.badgeColor || 'bg-amber-500 text-slate-950'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>

              {/* Luxury Sliding Tooltip */}
              {isHovered && (
                <div className="absolute left-16 z-50 pointer-events-none whitespace-nowrap bg-slate-950/95 backdrop-blur-xl px-3.5 py-2 rounded-xl border border-amber-400/50 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-150">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-amber-300">{item.label}</span>
                      <kbd className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-600 font-mono">
                        {item.key}
                      </kbd>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{item.sub}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};
