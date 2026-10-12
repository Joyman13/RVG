/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { InventorySlot, ItemDef } from '../types.ts';
import { ITEMS } from '../game/constants.ts';
import { AudioFX } from '../game/audio.ts';
import { Package, Shield, Swords, Sparkles, X } from 'lucide-react';

interface InventoryModalProps {
  inventory: InventorySlot[];
  onUseItem: (itemId: string) => void;
  onEquipItem: (itemId: string) => void;
  onHoldItem?: (itemId: string) => void;
  onClose: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  inventory,
  onUseItem,
  onEquipItem,
  onHoldItem,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'drops' | 'materials' | 'gear' | 'consumables'>('all');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const filteredSlots = inventory.filter((slot) => {
    if (slot.count <= 0) return false;
    const item = ITEMS[slot.itemId];
    if (!item) return false;
    if (activeTab === 'all') return true;
    if (activeTab === 'drops') return item.category === 'drop';
    if (activeTab === 'materials') return item.category === 'material';
    if (activeTab === 'gear') return item.category === 'weapon' || item.category === 'armor';
    if (activeTab === 'consumables') return item.category === 'consumable';
    return true;
  });

  const selectedItem: ItemDef | null = selectedItemId ? ITEMS[selectedItemId] || null : null;
  const selectedSlot = selectedItemId ? inventory.find((s) => s.itemId === selectedItemId) : null;

  return (
    <div className="modal fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="roblox-panel max-w-2xl w-full rounded-3xl p-5 border-2 border-cyan-400/50 flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">🎒</span>
            <div>
              <h2 className="text-xl font-bold text-cyan-300">Adventurer Backpack</h2>
              <p className="text-xs text-slate-300">
                ช่องเก็บสัมภาระ วัตถุดิบดรอปจากมอนสเตอร์ แร่ และไอเทมสวมใส่ ({inventory.length} ช่อง)
              </p>
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

        {/* Tabs */}
        <div className="flex flex-wrap gap-1.5 py-3 border-b border-white/10">
          {[
            { id: 'all', label: 'ทั้งหมด (All)', icon: <Package className="w-3.5 h-3.5" /> },
            { id: 'drops', label: 'ดรอปจากมอนสเตอร์ (Drops)', icon: <Sparkles className="w-3.5 h-3.5" /> },
            { id: 'materials', label: 'ไม้ & แร่หิน (Harvested)', icon: <Package className="w-3.5 h-3.5" /> },
            { id: 'gear', label: 'อุปกรณ์สวมใส่ (Gear)', icon: <Swords className="w-3.5 h-3.5" /> },
            { id: 'consumables', label: 'ยาและอาหาร (Consumable)', icon: <Shield className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                AudioFX.click();
                setActiveTab(tab.id as typeof activeTab);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === tab.id
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content: Inventory Grid + Detail Pane */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 sm:grid-cols-3 gap-3 py-3">
          {/* Item Grid */}
          <div className="sm:col-span-2 overflow-y-auto pr-1">
            {filteredSlots.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
                <span className="text-3xl">📭</span>
                <span>ไม่มีไอเทมในหมวดหมู่นี้</span>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
                {filteredSlots.map((slot) => {
                  const item = ITEMS[slot.itemId];
                  const isSelected = selectedItemId === slot.itemId;

                  return (
                    <button
                      key={slot.itemId}
                      onClick={() => {
                        AudioFX.click();
                        setSelectedItemId(slot.itemId);
                      }}
                      className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center p-2 border transition-all ${
                        isSelected
                          ? 'bg-cyan-500/25 border-cyan-400 shadow-md scale-105'
                          : 'bg-slate-900/90 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-2xl sm:text-3xl">{item?.icon || '📦'}</span>
                      <span className="absolute bottom-1 right-1.5 text-[11px] font-extrabold text-cyan-200 bg-slate-950/80 px-1 rounded">
                        x{slot.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Item Details Panel */}
          <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-700 flex flex-col justify-between">
            {selectedItem && selectedSlot ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-600 flex items-center justify-center text-3xl">
                    {selectedItem.icon}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-cyan-200 truncate">{selectedItem.nameTh}</h3>
                    <p className="text-[11px] text-slate-400">{selectedItem.name}</p>
                    <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">
                      {selectedItem.rarity}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{selectedItem.descriptionTh}</p>

                {selectedItem.atk && (
                  <div className="bg-red-950/60 border border-red-700/50 rounded-xl p-2 text-xs font-bold text-red-300">
                    ⚔️ พลังโจมตี: +{selectedItem.atk} ATK
                  </div>
                )}
                {selectedItem.def && (
                  <div className="bg-blue-950/60 border border-blue-700/50 rounded-xl p-2 text-xs font-bold text-blue-300">
                    🛡️ พลังป้องกัน: +{selectedItem.def} DEF
                  </div>
                )}
                {selectedItem.hpRestore && (
                  <div className="bg-emerald-950/60 border border-emerald-700/50 rounded-xl p-2 text-xs font-bold text-emerald-300">
                    💚 ฟื้นฟูเลือด: +{selectedItem.hpRestore} HP
                  </div>
                )}

                <div className="text-xs text-amber-300 font-bold">
                  🪙 ราคาขาย: {selectedItem.sellPrice} Gold ต่อชิ้น
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs text-center p-4">
                <span>แตะที่ไอเทมเพื่อดูรายละเอียด</span>
              </div>
            )}

            {/* Action buttons */}
            {selectedItem && (
              <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
                {/* Hold in Hand button for any item */}
                <button
                  onClick={() => {
                    AudioFX.click();
                    if (onHoldItem) onHoldItem(selectedItem.id);
                  }}
                  className="w-full py-2 rounded-xl text-xs font-bold text-amber-200 bg-amber-950/70 hover:bg-amber-900 border border-amber-600/60 shadow-md flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>✋</span>
                  <span>ถือไอเทมนี้ในมือ (Hold in 3D Hand)</span>
                </button>

                {(selectedItem.category === 'weapon' || selectedItem.category === 'armor') && (
                  <button
                    onClick={() => {
                      onEquipItem(selectedItem.id);
                    }}
                    className="roblox-button-gold w-full py-2 rounded-xl text-xs font-bold text-slate-950"
                  >
                    สวมใส่ (Equip)
                  </button>
                )}
                {selectedItem.category === 'consumable' && (
                  <button
                    onClick={() => {
                      onUseItem(selectedItem.id);
                    }}
                    className="roblox-button-green w-full py-2 rounded-xl text-xs font-bold text-white"
                  >
                    ใช้งาน / กิน (Consume)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
