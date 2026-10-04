/**
 * Rumbler and Haptic feedback engine
 * Combines hardware navigator.vibrate with Web Audio synthesized haptic kicks
 * so rumble effects work on mobile, tablets, and desktop speakers/trackpads.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Play a low-frequency rumbler pulse through audio drivers
 */
function playSubBassRumble(
  freq = 55,
  durationMs = 80,
  volume = 0.4
) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      28,
      ctx.currentTime + durationMs / 1000
    );

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, ctx.currentTime);

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + durationMs / 1000
    );

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch (e) {
    // Ignore audio autoplay restrictions
  }
}

export const Haptics = {
  /**
   * Rumble triggered on successful cloud sync
   */
  syncSuccess: () => {
    // Hardware vibration if supported
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([40, 50, 60]);
    }
    // Deep dual rumbler pulse
    playSubBassRumble(62, 70, 0.4);
    setTimeout(() => {
      playSubBassRumble(78, 90, 0.5);
    }, 90);
  },

  /**
   * Rumble triggered on document edits / saves
   */
  documentEdit: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(25);
    }
    // Crisp tactile haptic tick
    playSubBassRumble(85, 45, 0.35);
  },

  /**
   * Rumble for biometric unlock
   */
  biometricSuccess: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([30, 40, 70]);
    }
    playSubBassRumble(95, 60, 0.45);
    setTimeout(() => playSubBassRumble(120, 80, 0.4), 80);
  },

  /**
   * Disappearing media burned / dissolved
   */
  disappearingBurn: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([60, 30, 30, 30]);
    }
    playSubBassRumble(42, 130, 0.45);
  },

  /**
   * Generic tactile click
   */
  tap: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
    playSubBassRumble(110, 25, 0.2);
  },
};
