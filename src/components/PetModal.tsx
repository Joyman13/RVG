/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PetId, PET_DEFS } from '../game/pets.ts';
import { AudioFX } from '../game/audio.ts';
import { Sparkles, Shield, Flame, Check, X } from 'lucide-react';

interface PetModalProps {
  activePetId: PetId | null;
  onSelectPet: (petId: PetId | null) => void;
  onClose: () => void;
}

export const PetModal: React.FC<PetModalProps> = ({ activePetId, onSelectPet, onClose }) => {
  const pets = Object.values(PET_DEFS);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-950/95 border-2 border-amber-500/40 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative flex flex-col gap-5 text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2 rounded-2xl bg-amber-500/20 border border-amber-500/30">🐾</span>
            <div>
              <h2 className="text-2xl font-black bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-400 bg-clip-text text-transparent">
                สัตว์เลี้ยงคู่ใจ (Pet Companions)
              </h2>
              <p className="text-xs text-slate-400">เลือกสัตว์เลี้ยงช่วยรบที่จะร่วมเดินทางเคียงข้างคุณในโลกกว้าง</p>
            </div>
          </div>
          <button
            onClick={() => {
              AudioFX.click();
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pet Cards List */}
        <div className="grid grid-cols-1 gap-3.5 max-h-[60vh] overflow-y-auto pr-1">
          {pets.map((p) => {
            const isEquipped = activePetId === p.id;
            return (
              <div
                key={p.id}
                onClick={() => {
                  AudioFX.coin();
                  onSelectPet(isEquipped ? null : p.id);
                }}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  isEquipped
                    ? 'bg-amber-500/15 border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.25)]'
                    : 'bg-slate-900/80 border-white/10 hover:border-amber-400/50 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-white/10"
                    style={{ backgroundColor: `${p.color}25` }}
                  >
                    {p.icon}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg text-amber-200">{p.nameTh}</span>
                      <span className="text-xs text-slate-400 font-mono">({p.name})</span>
                    </div>
                    <p className="text-xs text-slate-300">{p.descriptionTh}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs font-semibold text-emerald-400">
                      {p.id === 'fox' && <Sparkles className="w-3.5 h-3.5 text-emerald-400" />}
                      {p.id === 'dragon' && <Flame className="w-3.5 h-3.5 text-orange-400" />}
                      {p.id === 'wolf' && <Shield className="w-3.5 h-3.5 text-blue-400" />}
                      <span>{p.perkTh}</span>
                    </div>
                  </div>
                </div>

                <div>
                  {isEquipped ? (
                    <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> ใช้งานอยู่
                    </span>
                  ) : (
                    <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-black text-xs shadow-md transition-transform active:scale-95">
                      อัญเชิญ
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>💡 คลิกเพื่อสลับเปลี่ยนสัตว์เลี้ยงหรือยกเลิกการอัญเชิญได้ตลอดเวลา</span>
          {activePetId && (
            <button
              onClick={() => {
                AudioFX.click();
                onSelectPet(null);
              }}
              className="text-red-400 hover:text-red-300 font-semibold underline"
            >
              ยกเลิกสัตว์เลี้ยงทั้งหมด
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
