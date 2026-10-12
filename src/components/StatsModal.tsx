/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PlayerData } from '../types.ts';
import { AudioFX } from '../game/audio.ts';
import { X, Award, BarChart2 } from 'lucide-react';

interface StatsModalProps {
  player: PlayerData;
  atk: number;
  def: number;
  weaponName: string;
  armorName: string;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  player,
  atk,
  def,
  weaponName,
  armorName,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'masteries'>('stats');

  const stats = [
    ['ชื่อตัวละคร (Hero)', player.name],
    ['ระดับเลเวลหลัก (Player Level)', `Lv. ${player.level} (EXP: ${player.exp} / ${player.maxExp})`],
    ['พลังชีวิต (HP)', `${Math.round(player.hp)} / ${player.maxHp}`],
    ['พลังมานา (MP)', `${Math.round(player.mp)} / ${player.maxMp}`],
    ['พลังโจมตีสุทธิ (Total Attack)', `${atk} ATK`],
    ['พลังป้องกันสุทธิ (Total Defense)', `${def} DEF`],
    ['แต้มสกิลคงเหลือ (Skill Points)', `${player.sp} SP`],
    ['อาวุธที่สวมใส่ (Weapon)', weaponName],
    ['ชุดเกราะที่สวมใส่ (Armor)', armorName],
    ['จำนวนตัดไม้ & ขุดแร่ (Harvests)', `${player.harvests} ครั้ง`],
    ['จำนวนสร้างสิ่งปลูกสร้าง (Structures)', `${player.structuresBuilt} ชิ้น`],
    ['มอนสเตอร์ที่กำจัด (Monsters Slain)', `${player.kills} ตัว`],
    ['เงินในกระเป๋า (Gold)', `🪙 ${player.gold} Gold`],
    ['เวลาในการเล่น (Play Time)', `${Math.floor(player.playTime / 60)} นาที`],
  ];

  const m = player.masteries;
  const masteriesList = [
    {
      name: 'ความชำนาญการต่อสู้ (Combat Mastery)',
      icon: '⚔️',
      level: m.combatLevel,
      exp: m.combatExp,
      maxExp: m.combatLevel * 120,
      benefit: `เพิ่มพลังโจมตี +${m.combatLevel * 5}% และโอกาสคริติคอล +${m.combatLevel * 2}%`,
      tip: 'ได้ EXP จากการฟันโจมตีมอนสเตอร์และใช้สกิลต่อสู้',
    },
    {
      name: 'ความชำนาญการตัดไม้ (Woodcutting Mastery)',
      icon: '🪓',
      level: m.woodcuttingLevel,
      exp: m.woodcuttingExp,
      maxExp: m.woodcuttingLevel * 100,
      benefit: `ฟันต้นไม้แรงขึ้น +${m.woodcuttingLevel * 10}% และได้ไม้เพิ่ม +${Math.floor(m.woodcuttingLevel / 2)} ท่อน`,
      tip: 'ได้ EXP จากการใช้ขวานตัดต้นไม้โอ๊ค ไม้สน และไม้โบราณ',
    },
    {
      name: 'ความชำนาญการขุดแร่ (Mining Mastery)',
      icon: '⛏️',
      level: m.miningLevel,
      exp: m.miningExp,
      maxExp: m.miningLevel * 100,
      benefit: `ขุดหิน/แร่แรงขึ้น +${m.miningLevel * 10}% และโอกาสแร่หายาก +${m.miningLevel * 4}%`,
      tip: 'ได้ EXP จากการใช้อีเตอร์ขุดหินแกรนิต แร่เหล็ก ทองคำ และออบซิเดียน',
    },
    {
      name: 'ความชำนาญการสร้างบ้าน (Building Mastery)',
      icon: '🔨',
      level: m.buildingLevel,
      exp: m.buildingExp,
      maxExp: m.buildingLevel * 90,
      benefit: `รัศมีกองไฟกว้างขึ้น +${m.buildingLevel * 15}% และโอกาสประหยัดวัสดุสร้าง +${m.buildingLevel * 5}%`,
      tip: 'ได้ EXP จากการวางฐานราก กำแพง ประตู และของแต่งบ้าน',
    },
    {
      name: 'ความชำนาญการคราฟต์ไอเทม (Crafting Mastery)',
      icon: '🧪',
      level: m.craftingLevel,
      exp: m.craftingExp,
      maxExp: m.craftingLevel * 80,
      benefit: `โอกาสคราฟต์ได้ไอเทมสองเท่า +${m.craftingLevel * 6}% และประสิทธิภาพยา +${m.craftingLevel * 4}%`,
      tip: 'ได้ EXP จากการคราฟต์อาวุธ ชุดเกราะ สเต็ก และยาที่โต๊ะคราฟต์',
    },
  ];

  return (
    <div className="modal fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="roblox-panel max-w-lg w-full rounded-3xl p-5 border-2 border-cyan-400/50 flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            <div>
              <h3 className="text-lg font-bold text-cyan-300">สถิติ & ความชำนาญเฉพาะด้าน</h3>
              <p className="text-xs text-slate-300">ยิ่งทำสิ่งใดบ่อย ความชำนาญในด้านนั้นยิ่งพัฒนาสูงขึ้น!</p>
            </div>
          </div>
          <button
            onClick={() => {
              AudioFX.click();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex gap-2 py-3 border-b border-white/10">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'stats' ? 'bg-cyan-600 text-white shadow' : 'bg-slate-800 text-slate-300'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            ข้อมูลตัวละคร (Stats)
          </button>
          <button
            onClick={() => setActiveTab('masteries')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'masteries' ? 'bg-amber-500 text-slate-950 shadow' : 'bg-slate-800 text-slate-300'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            ความชำนาญ 5 สาย (Masteries)
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pr-1 py-2 space-y-2">
          {activeTab === 'stats' ? (
            <div className="space-y-1.5 text-xs">
              {stats.map(([label, val]) => (
                <div key={label} className="flex justify-between items-center py-1.5 border-b border-white/5">
                  <span className="text-slate-300">{label}</span>
                  <span className="font-bold text-cyan-200">{val}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {masteriesList.map((item) => {
                const percent = Math.min(100, (item.exp / item.maxExp) * 100);

                return (
                  <div key={item.name} className="bg-slate-900/90 rounded-2xl p-3 border border-slate-700/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{item.icon}</span>
                        <div>
                          <h4 className="font-bold text-xs text-white">{item.name}</h4>
                          <span className="text-[10px] text-amber-300 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-600/40">
                            ระดับความชำนาญ: Lv. {item.level}
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-cyan-300 font-bold">
                        {item.exp} / {item.maxExp} EXP
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-700">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-yellow-300 h-full rounded-full transition-all duration-200"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-emerald-300 font-semibold">✨ โบนัส: {item.benefit}</p>
                    <p className="text-[10px] text-slate-400">{item.tip}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
