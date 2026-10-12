/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SkillDef } from '../types.ts';
import { SKILLS } from '../game/constants.ts';
import { AudioFX } from '../game/audio.ts';
import { Swords, Wand2, Axe, Star, Plus, X } from 'lucide-react';

interface SkillModalProps {
  playerLevel: number;
  availableSp: number;
  skills: Record<string, number>;
  onUpgradeSkill: (skillId: string) => void;
  onClose: () => void;
}

export const SkillModal: React.FC<SkillModalProps> = ({
  playerLevel,
  availableSp,
  skills,
  onUpgradeSkill,
  onClose,
}) => {
  const [activeBranch, setActiveBranch] = useState<'all' | 'combat' | 'magic' | 'survival'>('all');

  const allSkills = Object.values(SKILLS);
  const filteredSkills = allSkills.filter((s) => activeBranch === 'all' || s.branch === activeBranch);

  return (
    <div className="modal fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="roblox-panel max-w-2xl w-full rounded-3xl p-5 border-2 border-purple-400/50 flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">⭐</span>
            <div>
              <h2 className="text-xl font-bold text-purple-300">Skill Tree & Talents</h2>
              <p className="text-xs text-slate-300">อัปเกรดสกิลการต่อสู้ เวทมนตร์ และทักษะการเก็บเกี่ยวตัดไม้ขุดแร่</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-purple-950/80 border border-purple-500/50 rounded-xl px-3 py-1.5 shadow">
              <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
              <span className="text-xs font-bold text-purple-200">
                แต้มสกิลคงเหลือ: <b className="text-yellow-300 text-sm">{availableSp}</b> SP
              </span>
            </div>
            <button
              onClick={() => {
                AudioFX.click();
                onClose();
              }}
              className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Branch Tabs */}
        <div className="flex flex-wrap gap-1.5 py-3 border-b border-white/10">
          {[
            { id: 'all', label: 'ทั้งหมด (All)', icon: <Star className="w-3.5 h-3.5" /> },
            { id: 'combat', label: 'สายต่อสู้ (Combat)', icon: <Swords className="w-3.5 h-3.5" /> },
            { id: 'magic', label: 'สายเวทมนตร์ (Magic)', icon: <Wand2 className="w-3.5 h-3.5" /> },
            { id: 'survival', label: 'สายเก็บเกี่ยว & สร้างบ้าน (Survival)', icon: <Axe className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                AudioFX.click();
                setActiveBranch(tab.id as typeof activeBranch);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeBranch === tab.id
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Skill Cards Grid */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
          {filteredSkills.map((skill) => {
            const currentLevel = skills[skill.id] || 0;
            const isMax = currentLevel >= skill.maxLevel;
            const levelReqMet = playerLevel >= skill.requiredPlayerLevel;
            const canUpgrade = availableSp > 0 && !isMax && levelReqMet;

            return (
              <div
                key={skill.id}
                className={`rounded-2xl p-4 border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isMax
                    ? 'bg-slate-900/90 border-purple-500/60'
                    : currentLevel > 0
                    ? 'bg-slate-900/70 border-slate-700'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                {/* Skill Icon & Description */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 border ${
                      currentLevel > 0
                        ? 'bg-purple-900/50 border-purple-400 text-purple-200 shadow-inner'
                        : 'bg-slate-800 border-slate-700 opacity-60'
                    }`}
                  >
                    {skill.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-white truncate">{skill.nameTh}</h4>
                      <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-600 text-purple-300">
                        Lv. {currentLevel} / {skill.maxLevel}
                      </span>
                      {!levelReqMet && (
                        <span className="text-[10px] text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-800 font-bold">
                          ต้องการ Lv. {skill.requiredPlayerLevel}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{skill.descriptionTh}</p>
                    <p className="text-[11px] text-purple-300 font-semibold mt-0.5">
                      ผลลัพธ์: {skill.effectPerLevel}
                    </p>
                  </div>
                </div>

                {/* Level Up Button */}
                <div className="w-full sm:w-auto flex items-center justify-end shrink-0">
                  {isMax ? (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-700">
                      ระดับสูงสุด (MAX)
                    </span>
                  ) : (
                    <button
                      disabled={!canUpgrade}
                      onClick={() => {
                        AudioFX.skillUp();
                        onUpgradeSkill(skill.id);
                      }}
                      className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        canUpgrade
                          ? 'roblox-button-purple text-white shadow-lg cursor-pointer active:scale-95'
                          : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      อัปเกรด (1 SP)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
