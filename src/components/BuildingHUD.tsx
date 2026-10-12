/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BuildingPieceType, InventorySlot } from '../types.ts';
import { BUILDING_PIECES, ITEMS } from '../game/constants.ts';
import { AudioFX } from '../game/audio.ts';
import { RotateCw, Trash2, Check, X } from 'lucide-react';

interface BuildingHUDProps {
  activeType: BuildingPieceType;
  onSelectType: (type: BuildingPieceType) => void;
  onRotate: () => void;
  onToggleDemolish: () => void;
  isDemolish: boolean;
  inventory: InventorySlot[];
  onExit: () => void;
}

export const BuildingHUD: React.FC<BuildingHUDProps> = ({
  activeType,
  onSelectType,
  onRotate,
  onToggleDemolish,
  isDemolish,
  inventory,
  onExit,
}) => {
  const getItemCount = (itemId: string): number => {
    const slot = inventory.find((s) => s.itemId === itemId);
    return slot ? slot.count : 0;
  };

  const pieces = Object.values(BUILDING_PIECES);

  const canAfford = (type: BuildingPieceType): boolean => {
    const def = BUILDING_PIECES[type];
    return def.cost.every((c) => getItemCount(c.itemId) >= c.count);
  };

  const activeDef = BUILDING_PIECES[activeType];
  const activeAffordable = canAfford(activeType);

  return (
    <div className="fixed inset-x-0 bottom-20 z-40 flex flex-col items-center pointer-events-none px-2 sm:px-4">
      {/* Active Piece Status Banner */}
      <div className="pointer-events-auto mb-2.5 roblox-panel rounded-2xl px-4 py-2 border-amber-400/50 flex items-center justify-between gap-4 max-w-xl w-full">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-2xl">{isDemolish ? '🗑️' : activeDef.icon}</span>
          <div className="min-w-0">
            <h3 className="font-bold text-xs sm:text-sm text-amber-300 truncate">
              {isDemolish ? 'โหมดรื้อถอน (Demolish Mode)' : `สร้าง: ${activeDef.nameTh}`}
            </h3>
            {!isDemolish && (
              <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                <span className="text-slate-300">ใช้วัสดุ:</span>
                {activeDef.cost.map((c) => {
                  const item = ITEMS[c.itemId];
                  const have = getItemCount(c.itemId);
                  const ok = have >= c.count;
                  return (
                    <span
                      key={c.itemId}
                      className={`font-bold ${ok ? 'text-emerald-400' : 'text-red-400'}`}
                    >
                      {item?.icon} {have}/{c.count}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {!isDemolish && (
            <button
              onClick={onRotate}
              className="roblox-button px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1"
              title="หมุนชิ้นงาน (R)"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">หมุน (R)</span>
            </button>
          )}

          <button
            onClick={onToggleDemolish}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
              isDemolish
                ? 'roblox-button-red text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-600'
            }`}
            title="รื้อถอน (X)"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isDemolish ? 'กำลังรื้อถอน' : 'รื้อถอน (X)'}</span>
          </button>

          <button
            onClick={() => {
              AudioFX.click();
              onExit();
            }}
            className="roblox-button-gold px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 text-slate-950"
            title="เสร็จสิ้น (B / Esc)"
          >
            <Check className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">เสร็จสิ้น (B)</span>
          </button>
        </div>
      </div>

      {/* Building Palette Bar */}
      {!isDemolish && (
        <div className="pointer-events-auto roblox-panel rounded-2xl p-1.5 sm:p-2 border-white/20 shadow-2xl flex items-center gap-1.5 overflow-x-auto max-w-full">
          {pieces.map((p) => {
            const ok = canAfford(p.type);
            const isSelected = activeType === p.type;

            return (
              <button
                key={p.type}
                onClick={() => {
                  AudioFX.click();
                  onSelectType(p.type);
                }}
                className={`relative flex flex-col items-center justify-center p-2 rounded-xl border transition-all shrink-0 w-14 sm:w-16 h-14 sm:h-16 ${
                  isSelected
                    ? 'bg-amber-500/30 border-amber-400 shadow-md scale-105'
                    : 'bg-slate-800/80 border-slate-700 hover:bg-slate-700/80'
                } ${!ok ? 'opacity-60' : ''}`}
              >
                <span className="text-xl sm:text-2xl">{p.icon}</span>
                <span className="text-[9px] font-bold text-center leading-tight truncate w-full text-slate-200 mt-1">
                  {p.nameTh.split(' ')[0]}
                </span>
                {!ok && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
