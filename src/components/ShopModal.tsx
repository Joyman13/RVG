/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ItemDef } from '../types.ts';
import { AudioFX } from '../game/audio.ts';
import { X } from 'lucide-react';

interface ShopItem {
  id: string;
  name: string;
  nameTh: string;
  price: number;
  icon: string;
  desc: string;
  type: 'weapon' | 'armor' | 'potion_hp' | 'potion_mp';
  idx?: number;
}

interface ShopModalProps {
  shopTitle: string;
  shopRole: string;
  gold: number;
  items: ShopItem[];
  equippedWeaponIdx: number;
  equippedArmorIdx: number;
  onBuy: (item: ShopItem) => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  shopTitle,
  shopRole,
  gold,
  items,
  equippedWeaponIdx,
  equippedArmorIdx,
  onBuy,
  onClose,
}) => {
  return (
    <div className="modal fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="roblox-panel max-w-lg w-full rounded-3xl p-5 border-2 border-yellow-400/50 flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center border-b border-white/10 pb-3">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">🔨</span>
            <div>
              <h3 className="text-xl font-bold text-yellow-400">{shopTitle}</h3>
              <p className="text-xs text-slate-300">{shopRole}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-amber-300 font-bold text-sm bg-amber-950/60 px-2.5 py-1 rounded-xl border border-amber-500/40">
              🪙 {gold} Gold
            </span>
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

        <div className="py-3 space-y-2 overflow-y-auto pr-1 flex-1">
          {items.map((item) => {
            const isEquipped =
              (item.type === 'weapon' && item.idx === equippedWeaponIdx) ||
              (item.type === 'armor' && item.idx === equippedArmorIdx);
            const canAfford = gold >= item.price;

            return (
              <div
                key={item.id}
                className="bg-slate-900/90 rounded-2xl p-3 border border-slate-700 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-3xl shrink-0">{item.icon}</span>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-white truncate">{item.nameTh}</p>
                    <p className="text-xs text-emerald-400">{item.desc}</p>
                  </div>
                </div>

                <div className="shrink-0">
                  {isEquipped ? (
                    <span className="text-xs font-bold text-emerald-300 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-700">
                      สวมใส่อยู่
                    </span>
                  ) : (
                    <button
                      disabled={!canAfford}
                      onClick={() => onBuy(item)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                        canAfford
                          ? 'roblox-button-gold text-slate-950 cursor-pointer shadow active:scale-95'
                          : 'bg-slate-800 text-slate-500 border border-slate-700 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      🪙 {item.price} Gold
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
