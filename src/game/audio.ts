/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class WebAudioFX {
  ctx: AudioContext | null = null;
  masterGain: GainNode | null = null;
  sfxGain: GainNode | null = null;
  muted: boolean = false;
  sfxVolume: number = 0.8; // 0..1
  masterVolume: number = 1.0; // 0..1

  init() {
    if (!this.ctx) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);
      } catch (e) {
        console.warn('AudioContext not available:', e);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMasterVolume(val: number) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
  }

  setSfxVolume(val: number) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    if (this.ctx && this.sfxGain) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
  }

  tone(type: OscillatorType, f1: number, f2: number, dur: number, vol: number, delay: number = 0) {
    if (this.muted || this.sfxVolume <= 0.01) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(f1, 1), t);
    if (f2 !== f1) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(f2, 1), t + dur);
    }
    gain.gain.setValueAtTime(vol * this.sfxVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + dur);
  }

  swing() {
    this.tone('sine', 420, 90, 0.15, 0.22);
  }

  hit() {
    this.tone('triangle', 160, 45, 0.1, 0.32);
  }

  chop() {
    this.tone('triangle', 180, 70, 0.08, 0.35);
    this.tone('sine', 120, 50, 0.12, 0.25, 0.02);
  }

  mine() {
    this.tone('sine', 880, 1100, 0.07, 0.22);
    this.tone('triangle', 300, 120, 0.09, 0.2, 0.01);
  }

  build() {
    this.tone('square', 220, 330, 0.08, 0.15);
    this.tone('triangle', 440, 220, 0.1, 0.2, 0.05);
  }

  dismantle() {
    this.tone('sawtooth', 140, 50, 0.15, 0.22);
  }

  fireball() {
    this.tone('sawtooth', 260, 620, 0.3, 0.22);
  }

  boom() {
    this.tone('sawtooth', 130, 32, 0.35, 0.32);
  }

  heal() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone('sine', f, f, 0.2, 0.16, i * 0.08));
  }

  whistle() {
    [659.25, 783.99, 987.77].forEach((f, i) => this.tone('sawtooth', f, f + 25, 0.5, 0.14, i * 0.15));
  }

  levelUp() {
    [440, 554.37, 659.25, 880, 1108.73].forEach((f, i) => this.tone('triangle', f, f, 0.28, 0.22, i * 0.09));
  }

  masteryUp() {
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => this.tone('triangle', f, f + 10, 0.2, 0.24, i * 0.07));
  }

  coin() {
    this.tone('square', 880, 1320, 0.12, 0.1);
  }

  craftSuccess() {
    [392, 523.25, 659.25, 783.99].forEach((f, i) => this.tone('sine', f, f, 0.22, 0.18, i * 0.08));
  }

  skillUp() {
    [587.33, 739.99, 880, 1174.66].forEach((f, i) => this.tone('triangle', f, f, 0.25, 0.2, i * 0.07));
  }

  hurt() {
    this.tone('sawtooth', 220, 65, 0.2, 0.24);
  }

  glide() {
    this.tone('sine', 180, 290, 0.35, 0.12);
  }

  crit() {
    this.tone('triangle', 659.25, 1318.5, 0.18, 0.28);
    this.tone('sine', 880, 1760, 0.22, 0.2, 0.04);
  }

  combo() {
    this.tone('square', 440, 660, 0.08, 0.1);
  }

  dash() {
    this.tone('sine', 340, 110, 0.15, 0.22);
  }

  roar() {
    this.tone('sawtooth', 95, 38, 0.55, 0.38);
    this.tone('triangle', 65, 30, 0.65, 0.4, 0.05);
  }

  fanfare() {
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
      this.tone('triangle', f, f, 0.35, 0.25, i * 0.1);
    });
  }

  quest() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone('triangle', f, f, 0.25, 0.22, i * 0.1));
  }

  click() {
    this.tone('square', 620, 620, 0.04, 0.06);
  }
}

export const AudioFX = new WebAudioFX();

const MUSIC_SCALES: Record<number, { root: number; n: number[] }> = {
  1: { root: 130.81, n: [261.63, 293.66, 329.63, 392, 440, 523.25] },
  2: { root: 146.83, n: [293.66, 329.63, 349.23, 440, 493.88, 587.33] },
  3: { root: 196, n: [392, 440, 493.88, 587.33, 659.25, 783.99] },
  4: { root: 110, n: [220, 246.94, 261.63, 329.63, 349.23, 440] },
  5: { root: 164.81, n: [329.63, 369.99, 415.3, 493.88, 554.37, 659.25] },
};

class GameMusicManager {
  on: boolean = true;
  timer: number | null = null;
  step: number = 0;
  idx: number = 2;
  currentZone: number = 1;
  inCombat: boolean = false;
  musicVolume: number = 0.55; // 0..1

  setMusicVolume(val: number) {
    this.musicVolume = Math.max(0, Math.min(1, val));
  }

  start() {
    if (this.timer || !this.on) return;
    AudioFX.init();
    this.timer = window.setInterval(() => this.tick(), 540);
  }

  stop() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  tick() {
    if (AudioFX.muted || !this.on || this.musicVolume <= 0.01) return;
    const sc = MUSIC_SCALES[this.currentZone] || MUSIC_SCALES[1];
    this.step++;
    const vol = this.musicVolume;
    if (this.step % 4 === 1) {
      AudioFX.tone('sine', sc.root, sc.root, 1.8, (this.inCombat ? 0.06 : 0.045) * vol);
    }
    if (this.step % 8 === 1) {
      [0, 2, 4].forEach((i) => AudioFX.tone('sine', sc.n[i] / 2, sc.n[i] / 2, 4, 0.02 * vol));
    }
    if (Math.random() < (this.inCombat ? 0.85 : 0.5)) {
      const shift = (Math.random() < 0.5 ? -1 : 1) * (Math.random() < 0.3 ? 2 : 1);
      this.idx = Math.max(0, Math.min(sc.n.length - 1, this.idx + shift));
      AudioFX.tone(this.inCombat ? 'square' : 'triangle', sc.n[this.idx], sc.n[this.idx], 1.1, (this.inCombat ? 0.025 : 0.035) * vol);
    }
  }
}

export const Music = new GameMusicManager();
