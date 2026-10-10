import { SoundSet } from './types';

export type SoundEffectType =
  | 'correct'
  | 'incorrect'
  | 'streak'
  | 'level_up'
  | 'badge'
  | 'lesson_complete'
  | 'tap';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (Ctx) {
      audioCtx = new Ctx();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function triggerHaptic(type: SoundEffectType, enabled: boolean): void {
  if (!enabled || typeof navigator === 'undefined' || !navigator.vibrate) return;
  try {
    switch (type) {
      case 'tap':
        navigator.vibrate(8);
        break;
      case 'correct':
        navigator.vibrate([15, 30, 20]);
        break;
      case 'incorrect':
        navigator.vibrate([45, 40, 45]);
        break;
      case 'streak':
        navigator.vibrate([20, 25, 20, 25, 35]);
        break;
      case 'badge':
      case 'level_up':
      case 'lesson_complete':
        navigator.vibrate([25, 35, 35, 35, 60]);
        break;
    }
  } catch {
    // Ignore on unsupported devices
  }
}

export function playSoundEffect(type: SoundEffectType, soundSet: SoundSet, hapticsEnabled: boolean): void {
  triggerHaptic(type, hapticsEnabled);
  if (soundSet === 'silent') return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const pitchShift = soundSet === 'playful' ? 1.2 : soundSet === 'minimal' ? 0.92 : 1.0;
  const waveType: OscillatorType =
    soundSet === 'playful' ? 'triangle' : soundSet === 'minimal' ? 'sine' : 'sine';

  const playNote = (freq: number, startOffset: number, duration: number, gainPeak = 0.12, customType?: OscillatorType) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = customType || waveType;
    osc.frequency.setValueAtTime(freq * pitchShift, now + startOffset);
    gain.gain.setValueAtTime(0.0001, now + startOffset);
    gain.gain.exponentialRampToValueAtTime(gainPeak, now + startOffset + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + startOffset);
    osc.stop(now + startOffset + duration + 0.01);
  };

  switch (type) {
    case 'tap':
      playNote(520, 0, 0.04, 0.04, 'sine');
      break;
    case 'correct':
      // Soft ding (two ascending notes)
      playNote(587.33, 0, 0.14, 0.11); // D5
      playNote(880, 0.08, 0.22, 0.13); // A5
      break;
    case 'incorrect':
      // Soft thud (low descending tone)
      playNote(196, 0, 0.16, 0.12, 'triangle');
      playNote(146.83, 0.09, 0.22, 0.12, 'triangle');
      break;
    case 'streak':
      // Crackling fire burst + warm chord
      playNote(440, 0, 0.12, 0.08, 'triangle');
      playNote(554.37, 0.05, 0.15, 0.09, 'triangle');
      playNote(659.25, 0.1, 0.24, 0.11, 'sine');
      break;
    case 'badge':
      // Metallic clink (high harmonic bell)
      playNote(1046.5, 0, 0.18, 0.1, 'sine');
      playNote(1567.98, 0.04, 0.32, 0.12, 'sine');
      playNote(2093, 0.08, 0.38, 0.08, 'sine');
      break;
    case 'lesson_complete':
      // Short fanfare (C5 - E5 - G5 - C6)
      playNote(523.25, 0, 0.14, 0.11);
      playNote(659.25, 0.1, 0.14, 0.11);
      playNote(783.99, 0.2, 0.16, 0.12);
      playNote(1046.5, 0.32, 0.42, 0.14);
      break;
    case 'level_up':
      // Cheerful arpeggiated chime
      playNote(440, 0, 0.14, 0.11);
      playNote(554.37, 0.09, 0.14, 0.11);
      playNote(659.25, 0.18, 0.14, 0.12);
      playNote(880, 0.27, 0.18, 0.13);
      playNote(1108.73, 0.38, 0.48, 0.15);
      break;
  }
}
