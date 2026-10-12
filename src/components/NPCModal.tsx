/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AudioFX } from '../game/audio.ts';

interface NPCModalProps {
  npc: {
    id: string;
    name: string;
    role: string;
    icon: string;
  };
  dialogText: string;
  buttons: { label: string; cls?: string; fn: () => void }[];
  onClose: () => void;
}

export const NPCModal: React.FC<NPCModalProps> = ({ npc, dialogText, buttons, onClose }) => {
  return (
    <div className="modal fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="roblox-panel max-w-md w-full rounded-3xl p-6 border-2 border-amber-400/50">
        <div className="flex items-center space-x-4 border-b border-white/10 pb-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-4xl shadow-lg">
            {npc.icon}
          </div>
          <div>
            <h3 className="text-xl font-bold text-amber-300">{npc.name}</h3>
            <p className="text-xs text-slate-300">{npc.role}</p>
          </div>
        </div>

        <p className="py-5 text-sm text-slate-200 leading-relaxed min-h-[80px]">{dialogText}</p>

        <div className="flex flex-col space-y-2 pt-2">
          {buttons.map((b, i) => (
            <button
              key={i}
              onClick={() => {
                AudioFX.click();
                b.fn();
              }}
              className={`w-full py-2.5 rounded-xl font-bold text-xs ${
                b.cls || 'roblox-button-gold text-slate-950'
              }`}
            >
              {b.label}
            </button>
          ))}
          <button
            onClick={() => {
              AudioFX.click();
              onClose();
            }}
            className="w-full py-2 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300"
          >
            ปิดบทสนทนา (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
