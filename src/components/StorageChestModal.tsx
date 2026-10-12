/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { InventorySlot } from '../types.ts';
import { ITEMS } from '../game/constants.ts';
import { AudioFX } from '../game/audio.ts';
import { ArrowLeftRight, X } from 'lucide-react';

interface StorageChestModalProps {
  playerInventory: InventorySlot[];
  chestStorage: InventorySlot[];
  onDeposit: (itemId: string, count: number) => void;
  onWithdraw: (itemId: string, count: number) => void;
  onClose: () => void;
}

export const StorageChestModal: React.FC<StorageChestModalProps> = ({
  playerInventory,
  chestStorage,
  onDeposit,
  onWithdraw,
  onClose,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<{ source: 'bag' | 'chest'; itemId: string } | null>(null);

  return (
    <div className="modal fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="roblox-panel max-w-2xl w-full rounded-3xl p-5 border-2 border-amber-500/50 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">📦</span>
            <div>
              <h2 className="text-xl font-bold text-amber-300">Home Storage Chest</h2>
              <p className="text-xs text-slate-300">หีบเก็บสมบัติส่วนตัวในบ้าน เก็บวัตถุดิบและอุปกรณ์ได้อย่างปลอดภัย</p>
            </div>
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

        {/* 2-Column Split: Backpack vs Chest */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 flex-1 overflow-hidden">
          {/* Backpack column */}
          <div className="bg-slate-900/80 rounded-2xl p-3 border border-slate-700 flex flex-col">
            <h4 className="font-bold text-xs text-cyan-300 uppercase mb-2 flex items-center justify-between">
              <span>🎒 ในกระเป๋าตัวละคร (Backpack)</span>
            </h4>
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-60 sm:max-h-72">
              {playerInventory.filter((s) => s.count > 0).map((slot) => {
                const item = ITEMS[slot.itemId];
                return (
                  <div
                    key={slot.itemId}
                    onClick={() => {
                      AudioFX.click();
                      onDeposit(slot.itemId, 1);
                    }}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 cursor-pointer transition-all text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{item?.icon || '📦'}</span>
                      <span className="font-bold text-slate-200">{item?.nameTh || slot.itemId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-cyan-300">x{slot.count}</span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                        ฝาก ➔
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chest column */}
          <div className="bg-slate-900/80 rounded-2xl p-3 border border-slate-700 flex flex-col">
            <h4 className="font-bold text-xs text-amber-300 uppercase mb-2 flex items-center justify-between">
              <span>📦 ในหีบเก็บของ (Chest Storage)</span>
            </h4>
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-60 sm:max-h-72">
              {chestStorage.filter((s) => s.count > 0).length === 0 ? (
                <div className="h-40 flex items-center justify-center text-slate-500 text-xs text-center">
                  หีบว่างเปล่า คลิกที่ไอเทมในกระเป๋าเพื่อฝาก
                </div>
              ) : (
                chestStorage.filter((s) => s.count > 0).map((slot) => {
                  const item = ITEMS[slot.itemId];
                  return (
                    <div
                      key={slot.itemId}
                      onClick={() => {
                        AudioFX.click();
                        onWithdraw(slot.itemId, 1);
                      }}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 cursor-pointer transition-all text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{item?.icon || '📦'}</span>
                        <span className="font-bold text-slate-200">{item?.nameTh || slot.itemId}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-amber-300">x{slot.count}</span>
                        <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-bold">
                          ⬅ ถอน
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
