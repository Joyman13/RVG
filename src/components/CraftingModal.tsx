/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CraftingRecipe, InventorySlot } from '../types.ts';
import { CRAFTING_RECIPES, ITEMS } from '../game/constants.ts';
import { AudioFX } from '../game/audio.ts';
import { Hammer, Shield, Swords, Sparkles, Home, X } from 'lucide-react';

interface CraftingModalProps {
  inventory: InventorySlot[];
  onCraft: (recipe: CraftingRecipe) => void;
  onClose: () => void;
}

export const CraftingModal: React.FC<CraftingModalProps> = ({ inventory, onCraft, onClose }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'weapons' | 'armor' | 'consumables' | 'housing'>('all');

  const getItemCount = (itemId: string): number => {
    const slot = inventory.find((s) => s.itemId === itemId);
    return slot ? slot.count : 0;
  };

  const canCraft = (recipe: CraftingRecipe): boolean => {
    return recipe.materials.every((mat) => getItemCount(mat.itemId) >= mat.count);
  };

  const filteredRecipes = CRAFTING_RECIPES.filter((r) => activeTab === 'all' || r.category === activeTab);

  return (
    <div className="modal fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="roblox-panel max-w-2xl w-full rounded-3xl p-5 border-2 border-amber-400/50 flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">🔨</span>
            <div>
              <h2 className="text-xl font-bold text-amber-300">Fantasy Crafting Station</h2>
              <p className="text-xs text-slate-300">คราฟต์ไอเทม อาวุธ และยาด้วยวัตถุดิบจากมอนสเตอร์และแร่ธรรมชาติ</p>
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

        {/* Categories Tab */}
        <div className="flex flex-wrap gap-1.5 py-3 border-b border-white/10">
          {[
            { id: 'all', label: 'ทั้งหมด (All)', icon: <Sparkles className="w-3.5 h-3.5" /> },
            { id: 'weapons', label: 'อาวุธ (Weapons)', icon: <Swords className="w-3.5 h-3.5" /> },
            { id: 'armor', label: 'ชุดเกราะ (Armor)', icon: <Shield className="w-3.5 h-3.5" /> },
            { id: 'consumables', label: 'ยาและอาหาร (Elixirs)', icon: <Sparkles className="w-3.5 h-3.5" /> },
            { id: 'housing', label: 'สร้างบ้าน (Housing)', icon: <Home className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                AudioFX.click();
                setActiveTab(tab.id as typeof activeTab);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Recipes Grid */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
          {filteredRecipes.map((recipe) => {
            const resultItem = ITEMS[recipe.resultItemId];
            const craftable = canCraft(recipe);

            return (
              <div
                key={recipe.id}
                className={`rounded-2xl p-3.5 border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  craftable
                    ? 'bg-slate-900/90 border-amber-500/50 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 opacity-80'
                }`}
              >
                {/* Result Item Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-600 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                    {resultItem?.icon || '📦'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-amber-200 truncate">
                        {recipe.nameTh}
                        {recipe.resultCount > 1 ? ` x${recipe.resultCount}` : ''}
                      </h4>
                      {resultItem?.atk && (
                        <span className="text-[10px] bg-red-950/80 text-red-300 px-1.5 py-0.5 rounded border border-red-500/40 font-bold">
                          +{resultItem.atk} ATK
                        </span>
                      )}
                      {resultItem?.def && (
                        <span className="text-[10px] bg-blue-950/80 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/40 font-bold">
                          +{resultItem.def} DEF
                        </span>
                      )}
                      {resultItem?.hpRestore && (
                        <span className="text-[10px] bg-emerald-950/80 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/40 font-bold">
                          +{resultItem.hpRestore} HP
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">{recipe.descriptionTh}</p>

                    {/* Material requirements badges */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {recipe.materials.map((mat) => {
                        const matItem = ITEMS[mat.itemId];
                        const have = getItemCount(mat.itemId);
                        const satisfied = have >= mat.count;

                        return (
                          <span
                            key={mat.itemId}
                            className={`text-[11px] px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 border ${
                              satisfied
                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50'
                                : 'bg-red-950/80 text-red-300 border-red-700/50'
                            }`}
                          >
                            <span>{matItem?.icon || '📦'}</span>
                            <span>{matItem?.nameTh || mat.itemId}</span>
                            <span className="opacity-80">
                              ({have}/{mat.count})
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Craft Button */}
                <button
                  disabled={!craftable}
                  onClick={() => {
                    AudioFX.craftSuccess();
                    onCraft(recipe);
                  }}
                  className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap shrink-0 transition-all ${
                    craftable
                      ? 'roblox-button-gold text-slate-950 cursor-pointer shadow-lg active:scale-95'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-50'
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <Hammer className="w-3.5 h-3.5" />
                    คราฟต์ ({recipe.resultCount})
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
