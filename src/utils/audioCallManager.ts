/**
 * Audio Call Engine & Web Audio Sound System
 * Powers WhatsApp-style ringing, connection chimes, waveform visualizer, and TTS playback
 */

let activeCallOscillators: OscillatorNode[] = [];
let callAudioCtx: AudioContext | null = null;
let currentTtsAudio: HTMLAudioElement | null = null;

function getCallAudioCtx(): AudioContext {
  if (!callAudioCtx) {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    callAudioCtx = new AudioContextClass();
  }
  if (callAudioCtx.state === 'suspended') {
    callAudioCtx.resume().catch(() => {});
  }
  return callAudioCtx;
}

export function playRingingTone() {
  stopCallAudio();
  try {
    const ctx = getCallAudioCtx();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(440, ctx.currentTime);
    osc2.frequency.setValueAtTime(480, ctx.currentTime);

    // Cadence: 2 sec on, 3 sec off repeating
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);

    for (let i = 0; i < 10; i++) {
      const cycleStart = now + i * 4;
      gain.gain.setValueAtTime(0.08, cycleStart);
      gain.gain.setValueAtTime(0.08, cycleStart + 1.6);
      gain.gain.setValueAtTime(0, cycleStart + 1.65);
    }

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    activeCallOscillators.push(osc1, osc2);
  } catch (e) {
    console.warn('Ringtone autoplay prevented:', e);
  }
}

export function playCallConnectedChime() {
  try {
    const ctx = getCallAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15); // G5
    osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.35); // C6

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch (e) {}
}

export function playCallEndedTone() {
  try {
    const ctx = getCallAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, ctx.currentTime);
    osc.frequency.setValueAtTime(320, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {}
}

export function stopCallAudio() {
  activeCallOscillators.forEach((osc) => {
    try {
      osc.stop();
      osc.disconnect();
    } catch (e) {}
  });
  activeCallOscillators = [];
}

/**
 * Playbase64 WAV audio from gemini-3.8-flash-tts
 */
export function playBase64Audio(
  base64Wav: string,
  onEnded?: () => void
): () => void {
  if (currentTtsAudio) {
    currentTtsAudio.pause();
    currentTtsAudio = null;
  }

  const audio = new Audio(`data:audio/wav;base64,${base64Wav}`);
  currentTtsAudio = audio;

  audio.onended = () => {
    if (currentTtsAudio === audio) {
      currentTtsAudio = null;
    }
    if (onEnded) onEnded();
  };

  audio.play().catch((err) => {
    console.warn('Playback error:', err);
    if (onEnded) onEnded();
  });

  return () => {
    audio.pause();
    if (currentTtsAudio === audio) currentTtsAudio = null;
  };
}
