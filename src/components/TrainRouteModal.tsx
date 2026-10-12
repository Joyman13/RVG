/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TrainRouteId } from '../types.ts';
import { ALL_TRAIN_ROUTES } from '../game/train.ts';
import { AudioFX } from '../game/audio.ts';
import { X, Check } from 'lucide-react';

interface TrainRouteModalProps {
  currentRouteId: TrainRouteId;
  onSelectRoute: (routeId: TrainRouteId) => void;
  onBoard: () => void;
  onClose: () => void;
}

export const TrainRouteModal: React.FC<TrainRouteModalProps> = ({
  currentRouteId,
  onSelectRoute,
  onBoard,
  onClose,
}) => {
  return (
    <div className="modal fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="roblox-panel max-w-md w-full rounded-3xl p-5 border-2 border-cyan-400/50 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-3xl">🚂</span>
            <div>
              <h3 className="text-lg font-bold text-cyan-300">Fantasy Railway Hub</h3>
              <p className="text-xs text-slate-300">เลือกระบบเส้นทางรถไฟที่ต้องการเดินทาง</p>
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

        {/* Routes list */}
        <div className="space-y-2">
          {ALL_TRAIN_ROUTES.map((r) => {
            const isSelected = currentRouteId === r.id;

            return (
              <button
                key={r.id}
                onClick={() => {
                  onSelectRoute(r.id);
                  AudioFX.whistle();
                }}
                className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/25 border-cyan-400 shadow-md ring-2 ring-cyan-400'
                    : 'bg-slate-900/90 border-slate-700/80 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{r.icon}</span>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-white">{r.nameTh}</h4>
                    <p className="text-[11px] text-slate-400">{r.name}</p>
                  </div>
                </div>
                {isSelected && <Check className="w-5 h-5 text-cyan-300 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Board Button */}
        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={() => {
              onBoard();
              onClose();
            }}
            className="roblox-button-gold w-full py-3 rounded-xl font-bold text-xs sm:text-sm text-slate-950 shadow-lg"
          >
            🚂 ขึ้นนั่งรถไฟออกเดินทางทันที (All Aboard!)
          </button>
        </div>
      </div>
    </div>
  );
};
