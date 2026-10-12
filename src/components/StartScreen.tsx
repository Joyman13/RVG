/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AudioFX } from '../game/audio.ts';

const CAPE_COLORS = [0xdc2626, 0x7c3aed, 0x16a34a, 0xf59e0b, 0x0ea5e9, 0xec4899];
const HAIR_COLORS = [0x3b2314, 0x111827, 0xfacc15, 0xb91c1c, 0xe5e7eb, 0x2563eb];

interface StartScreenProps {
  hasSave: boolean;
  saveSummary?: string;
  onStart: (name: string, capeIdx: number, hairIdx: number, isNew: boolean) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ hasSave, saveSummary, onStart }) => {
  const [heroName, setHeroName] = useState('Fantasy Hero');
  const [capeIdx, setCapeIdx] = useState(0);
  const [hairIdx, setHairIdx] = useState(0);

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-slate-950/85 via-indigo-950/90 to-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="roblox-panel max-w-lg w-full rounded-3xl p-6 border-2 border-amber-400/50 text-center space-y-4">
        <div className="text-5xl">🏰</div>
        <h1 className="text-3xl font-bold text-amber-300">Fantasy RPG Open World</h1>
        <p className="text-xs text-slate-300">
          ผจญภัยในโลกแฟนตาซี 5 โซน นั่งรถไฟรอบแผนที่ สุ่มดรอปไอเทมมอนสเตอร์ คราฟต์ของ ตัดไม้ ขุดหิน แร่ สร้างบ้าน และอัปเกรดสกิล!
        </p>

        <input
          value={heroName}
          onChange={(e) => setHeroName(e.target.value.slice(0, 14))}
          maxLength={14}
          placeholder="ชื่อตัวละคร (Hero name)"
          className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-2.5 text-center font-bold text-white text-sm outline-none focus:border-amber-400"
        />

        <div className="flex items-center justify-center gap-6 text-xs text-slate-300 py-1">
          <div className="flex items-center gap-2">
            <span>ผ้าคลุม:</span>
            <div className="flex gap-1.5">
              {CAPE_COLORS.map((c, i) => (
                <button
                  key={i}
                  onClick={() => {
                    AudioFX.click();
                    setCapeIdx(i);
                  }}
                  className={`w-5 h-5 rounded-full border-2 transition-transform ${
                    capeIdx === i ? 'border-amber-400 scale-110 ring-2 ring-amber-400' : 'border-slate-500'
                  }`}
                  style={{ backgroundColor: `#${c.toString(16).padStart(6, '0')}` }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span>ทรงผม:</span>
            <div className="flex gap-1.5">
              {HAIR_COLORS.map((c, i) => (
                <button
                  key={i}
                  onClick={() => {
                    AudioFX.click();
                    setHairIdx(i);
                  }}
                  className={`w-5 h-5 rounded-full border-2 transition-transform ${
                    hairIdx === i ? 'border-amber-400 scale-110 ring-2 ring-amber-400' : 'border-slate-500'
                  }`}
                  style={{ backgroundColor: `#${c.toString(16).padStart(6, '0')}` }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          {hasSave && (
            <button
              onClick={() => {
                AudioFX.click();
                onStart(heroName, capeIdx, hairIdx, false);
              }}
              className="roblox-button-green w-full py-3 rounded-xl font-bold text-sm text-white"
            >
              💾 เล่นต่อจากเซฟเดิม (Continue)
            </button>
          )}

          <button
            onClick={() => {
              AudioFX.click();
              onStart(heroName, capeIdx, hairIdx, true);
            }}
            className="roblox-button-gold w-full py-3 rounded-xl font-bold text-sm text-slate-950"
          >
            ▶ เริ่มต้นเกมใหม่ (New Game)
          </button>

          {saveSummary && <p className="text-[11px] text-slate-400">{saveSummary}</p>}
        </div>

        {/* Controls explanation */}
        <div className="text-left text-[11px] text-slate-300 bg-slate-900/80 rounded-2xl p-3 border border-slate-700/80 grid grid-cols-2 gap-x-3 gap-y-1">
          <span>
            <b className="text-amber-300">WASD / เลื่อน</b> เดิน / วิ่ง
          </span>
          <span>
            <b className="text-amber-300">Space</b> กระโดด
          </span>
          <span>
            <b className="text-amber-300">คลิก / F</b> โจมตี / ตัดไม้ / ขุดแร่
          </span>
          <span>
            <b className="text-amber-300">1, 2, 3, 4</b> สกิลเวทมนตร์
          </span>
          <span>
            <b className="text-amber-300">B</b> โหมดสร้างบ้าน (Build)
          </span>
          <span>
            <b className="text-amber-300">C</b> โหมดคราฟต์ไอเทม
          </span>
          <span>
            <b className="text-amber-300">K</b> หน้าต่างสกิล (Skill Tree)
          </span>
          <span>
            <b className="text-amber-300">I</b> กระเป๋าเก็บของ (Backpack)
          </span>
          <span>
            <b className="text-amber-300">E</b> พูดคุย / นั่งรถไฟ / เปิดหีบ
          </span>
          <span>
            <b className="text-amber-300">Esc / ☰</b> เมนูบันทึกเกม
          </span>
        </div>
      </div>
    </div>
  );
};
