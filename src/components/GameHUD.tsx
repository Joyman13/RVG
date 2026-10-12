/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PlayerData } from '../types.ts';

interface GameHUDProps {
  player: PlayerData;
  activeZoneName: string;
  clockText: string;
  quest: {
    title: string;
    desc: string;
    distText: string;
    rewardText: string;
    progressText?: string;
    progressPercent?: number;
  } | null;
  interactionPrompt: {
    label: string;
    icon: string;
    isPassive?: boolean;
  } | null;
  onInteract: () => void;
  bossData: { name: string; hp: number; maxHp: number; icon: string } | null;
  onZoom?: (delta: number) => void;
  trialData?: {
    nameTh: string;
    waveNum: number;
    totalWaves: number;
    remaining: number;
    total: number;
    timeSec: number;
  } | null;
  comboData?: {
    count: number;
    multiplier: number;
  } | null;
  isGliding?: boolean;
  onToggleGlider?: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  player,
  activeZoneName,
  clockText,
  quest,
  interactionPrompt,
  onInteract,
  bossData,
  onZoom,
  trialData,
  comboData,
  isGliding,
  onToggleGlider,
}) => {
  const hpPercent = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
  const mpPercent = Math.max(0, Math.min(100, (player.mp / player.maxMp) * 100));
  const expPercent = Math.max(0, Math.min(100, (player.exp / player.maxExp) * 100));

  return (
    <div className="fixed inset-0 pointer-events-none z-10 flex flex-col justify-between p-2.5 sm:p-3">
      {/* Top Header Row */}
      <div className="flex items-start justify-between w-full pointer-events-auto gap-2">
        {/* Player Profile & Stats Panel */}
        <div className="roblox-panel rounded-2xl p-2.5 flex items-center space-x-3 max-w-sm sm:max-w-md w-full shadow-2xl">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 border-2 border-white flex items-center justify-center shadow-inner">
              <span className="text-2xl">🧙‍♂️</span>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-red-600 to-amber-600 border border-white rounded-full px-2 py-0.5 text-xs font-bold text-white shadow">
              Lv. {player.level}
            </div>
          </div>

          <div className="flex-1 space-y-1.5 min-w-0">
            <div className="flex justify-between text-xs font-bold tracking-wide gap-2">
              <span className="text-amber-300 truncate">{player.name}</span>
              <span className="text-cyan-300 font-semibold truncate text-[11px]">{activeZoneName}</span>
            </div>

            {/* HP Bar */}
            <div className="w-full bg-slate-900/90 rounded-full h-3.5 p-0.5 border border-slate-600/50 relative overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-green-400 h-full rounded-full transition-all duration-150"
                style={{ width: `${hpPercent}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-extrabold text-white drop-shadow">
                {Math.round(player.hp)} / {player.maxHp}
              </span>
            </div>

            {/* MP Bar */}
            <div className="w-full bg-slate-900/90 rounded-full h-2.5 p-0.5 border border-slate-600/50 relative overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-150"
                style={{ width: `${mpPercent}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-extrabold text-white drop-shadow">
                {Math.round(player.mp)} / {player.maxMp}
              </span>
            </div>

            {/* EXP Bar */}
            <div className="w-full bg-slate-900/90 rounded-full h-2 p-0.5 border border-slate-600/50 relative overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-400 h-full rounded-full transition-all duration-150"
                style={{ width: `${expPercent}%` }}
              />
            </div>
          </div>

          {/* Gold & Clock */}
          <div className="flex flex-col gap-1 shrink-0 items-end">
            <div className="flex items-center space-x-1.5 bg-amber-950/60 border border-amber-500/40 rounded-xl px-2.5 py-1 shadow-inner">
              <span className="text-sm">🪙</span>
              <span className="text-amber-300 font-bold text-xs">{player.gold}</span>
            </div>
            <span className="roblox-panel rounded-xl px-2 py-0.5 text-[11px] font-bold text-slate-200">
              {clockText}
            </span>
          </div>
        </div>

        {/* Minimap (Top Right) */}
        <div className="flex flex-col items-end gap-1.5">
          <div className="roblox-panel rounded-2xl p-1.5 shadow-2xl">
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden border-2 border-slate-400/50 bg-slate-950 shadow-inner">
              <canvas id="minimapCanvas" width="128" height="128" className="w-full h-full" />
              <div className="absolute top-0.5 left-1/2 -translate-x-1/2 text-[9px] font-extrabold text-red-500 drop-shadow">
                N
              </div>
            </div>
          </div>

          {/* Camera Zoom Control Hint & Buttons */}
          <div className="flex items-center gap-1 bg-slate-950/80 backdrop-blur-md px-2 py-1 rounded-xl border border-white/20 text-xs font-bold text-slate-300 shadow-md">
            <span className="text-[10px] text-amber-300 mr-1 hidden sm:inline">🔍 Scroll เมาส์ ซูม</span>
            <button
              onClick={() => onZoom && onZoom(-5)}
              className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white cursor-pointer font-mono font-black"
              title="ซูมเข้า (Zoom In)"
            >
              +
            </button>
            <button
              onClick={() => onZoom && onZoom(5)}
              className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white cursor-pointer font-mono font-black"
              title="ซูมออก (Zoom Out)"
            >
              -
            </button>
          </div>
        </div>
      </div>

      {/* Boss Health Bar (if active) */}
      {bossData && (
        <div className="fixed top-[135px] left-1/2 -translate-x-1/2 w-80 z-20 pointer-events-none">
          <div className="text-center text-sm font-extrabold text-red-300 drop-shadow flex items-center justify-center gap-1.5">
            <span>{bossData.icon}</span>
            <span>{bossData.name}</span>
          </div>
          <div className="w-full bg-slate-900/90 rounded-full h-4 p-0.5 border border-red-500/80 overflow-hidden shadow-2xl">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-400 transition-all duration-150"
              style={{ width: `${Math.max(0, Math.min(100, (bossData.hp / bossData.maxHp) * 100))}%` }}
            />
          </div>
        </div>
      )}

      {/* Trial Arena Challenge Banner (if in active trial) */}
      {trialData && (
        <div className="fixed top-[175px] left-1/2 -translate-x-1/2 z-20 pointer-events-none bg-slate-950/90 border-2 border-amber-400/80 rounded-2xl p-3 shadow-2xl flex flex-col items-center gap-1.5 min-w-[280px]">
          <div className="flex items-center gap-2 text-xs font-black text-amber-300">
            <span className="animate-spin text-base">⚔️</span>
            <span>{trialData.nameTh}</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-white">
            <span className="text-amber-400 font-mono">Wave {trialData.waveNum}/{trialData.totalWaves}</span>
            <span className="text-red-400">มอนสเตอร์เหลือ: {trialData.remaining} ตัว</span>
            <span className="text-cyan-400 font-mono">⏱️ {Math.max(0, Math.round(trialData.timeSec))}s</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-white/20">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-200"
              style={{
                width: `${trialData.total > 0 ? ((trialData.total - trialData.remaining) / trialData.total) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Dynamic Combat Combo Multiplier */}
      {comboData && comboData.count >= 2 && (
        <div className="fixed top-[260px] left-8 z-20 pointer-events-none animate-bounce flex items-center gap-2 bg-gradient-to-r from-red-600/90 to-amber-600/90 px-3.5 py-1.5 rounded-2xl border-2 border-yellow-300 shadow-[0_0_20px_rgba(234,179,8,0.5)]">
          <span className="text-xl">🔥</span>
          <div className="flex flex-col">
            <span className="text-sm font-black text-white drop-shadow font-mono tracking-wider">
              {comboData.count}x COMBO!
            </span>
            <span className="text-[10px] font-bold text-yellow-200 drop-shadow">
              +{Math.round((comboData.multiplier - 1) * 100)}% ATK DMG
            </span>
          </div>
        </div>
      )}

      {/* Glider Soaring Indicator & Quick Toggle */}
      {onToggleGlider && (
        <div className="fixed bottom-28 right-4 pointer-events-auto z-20">
          <button
            onClick={onToggleGlider}
            className={`px-4 py-2 rounded-2xl font-black text-xs flex items-center gap-2 shadow-2xl transition-all cursor-pointer ${
              isGliding
                ? 'bg-gradient-to-r from-cyan-500 to-sky-400 text-slate-950 border-2 border-white animate-pulse'
                : 'bg-slate-900/85 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40'
            }`}
          >
            <span className="text-lg">🪂</span>
            <span>{isGliding ? 'กำลังร่อนเวหา [Space]' : 'ปีกร่อนเวหา (Glider)'}</span>
          </button>
        </div>
      )}

      {/* Quest Tracker Panel */}
      {quest && (
        <div className="absolute right-3 top-[170px] pointer-events-auto w-52 sm:w-64">
          <div className="roblox-panel rounded-2xl p-3 border-l-4 border-l-amber-400 space-y-1 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-1">
              <span className="text-[11px] font-extrabold text-amber-300 uppercase tracking-wider">
                📜 ภารกิจ (Active Quest)
              </span>
            </div>
            <p className="text-sm font-bold text-white leading-tight">{quest.title}</p>
            <p className="text-xs text-slate-300 leading-snug">{quest.desc}</p>
            {quest.distText && (
              <p className="text-[11px] text-cyan-300 font-semibold">{quest.distText}</p>
            )}
            {quest.progressText && (
              <div>
                <div className="w-full bg-slate-900/80 rounded-full h-2 border border-slate-600/50 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-300"
                    style={{ width: `${quest.progressPercent || 0}%` }}
                  />
                </div>
                <p className="text-[11px] text-amber-200 text-right font-semibold">
                  {quest.progressText}
                </p>
              </div>
            )}
            <div className="flex items-center justify-between text-[11px] text-amber-400 pt-1 font-semibold">
              <span>รางวัล:</span>
              <span>{quest.rewardText}</span>
            </div>
          </div>
        </div>
      )}

      {/* Interaction Prompt Button [E] */}
      {interactionPrompt && (
        <div className="absolute top-[58%] left-1/2 -translate-x-1/2 pointer-events-auto z-20">
          <button
            onClick={onInteract}
            className={`roblox-button-gold px-5 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2 cursor-pointer shadow-2xl animate-bounce text-slate-950 ${
              interactionPrompt.isPassive ? 'opacity-70' : ''
            }`}
          >
            <span className="text-xl">{interactionPrompt.icon}</span>
            <span>{interactionPrompt.label}</span>
          </button>
        </div>
      )}
    </div>
  );
};
