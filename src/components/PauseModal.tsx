/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AudioFX, Music } from '../game/audio.ts';
import { Volume2, VolumeX, Music as MusicIcon, X } from 'lucide-react';

interface PauseModalProps {
  onSave: () => void;
  onResume: () => void;
  onRestart: () => void;
  onClose: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onSave,
  onResume,
  onRestart,
  onClose,
}) => {
  const [sfxVol, setSfxVol] = useState(Math.round(AudioFX.sfxVolume * 100));
  const [musicVol, setMusicVol] = useState(Math.round(Music.musicVolume * 100));
  const [muted, setMuted] = useState(AudioFX.muted);

  const handleSfxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setSfxVol(val);
    AudioFX.setSfxVolume(val / 100);
    AudioFX.click();
  };

  const handleMusicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setMusicVol(val);
    Music.setMusicVolume(val / 100);
  };

  const toggleMute = () => {
    AudioFX.muted = !AudioFX.muted;
    setMuted(AudioFX.muted);
    AudioFX.setMasterVolume(AudioFX.muted ? 0 : 1.0);
    AudioFX.click();
  };

  return (
    <div className="modal fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="roblox-panel max-w-sm w-full rounded-3xl p-6 border-2 border-white/30 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚙️</span>
            <h3 className="text-lg font-bold text-white">ตั้งค่า & เมนูหยุดเกม (Settings)</h3>
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

        {/* Volume Controls Section */}
        <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-700/80 space-y-3">
          <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center justify-between">
            <span>🔊 ปรับระดับเสียง (Audio Settings)</span>
            <button
              onClick={toggleMute}
              className={`p-1 rounded-lg text-xs flex items-center gap-1 border transition-all ${
                muted ? 'bg-red-950 text-red-300 border-red-600' : 'bg-slate-800 text-slate-200 border-slate-600'
              }`}
            >
              {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{muted ? 'ปิดเสียงอยู่' : 'เปิดเสียง'}</span>
            </button>
          </h4>

          {/* SFX Volume Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-cyan-300" />
                เสียงเอฟเฟกต์ (SFX)
              </span>
              <span className="font-bold text-cyan-300">{sfxVol}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={sfxVol}
              onChange={handleSfxChange}
              className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
          </div>

          {/* Music Volume Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <MusicIcon className="w-3.5 h-3.5 text-purple-300" />
                ดนตรีประกอบ (Music BGM)
              </span>
              <span className="font-bold text-purple-300">{musicVol}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={musicVol}
              onChange={handleMusicChange}
              className="w-full accent-purple-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-2 pt-1">
          <button
            onClick={() => {
              AudioFX.click();
              onResume();
            }}
            className="roblox-button-green w-full py-2.5 rounded-xl font-bold text-xs"
          >
            ▶ เล่นเกมต่อ (Resume)
          </button>

          <button
            onClick={() => {
              AudioFX.click();
              onSave();
            }}
            className="roblox-button w-full py-2.5 rounded-xl font-bold text-xs"
          >
            💾 บันทึกเกม (Save Game)
          </button>

          <button
            onClick={() => {
              if (window.confirm('คุณต้องการรีเซ็ตข้อมูลเซฟทั้งหมดและเริ่มใหม่หรือไม่?')) {
                onRestart();
              }
            }}
            className="roblox-button-red w-full py-2.5 rounded-xl font-bold text-xs"
          >
            🗑 ลบเซฟและเริ่มใหม่ (Restart)
          </button>
        </div>
      </div>
    </div>
  );
};
