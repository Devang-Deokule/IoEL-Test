// ---------------------------------------------------------------------------
// Emergency Alarm Audio Siren Engine (HTML5 Web Audio API)
// Synthesizes a real hospital emergency siren sound with zero external audio files.
// Modulates frequency between 650Hz and 1050Hz in a rhythmic sweep.
// ---------------------------------------------------------------------------

let audioCtx = null;
let oscillator = null;
let gainNode = null;
let lfo = null;
let isPlaying = false;
let isMuted = false;

function initAudioContext() {
  if (!audioCtx && typeof window !== 'undefined') {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
}

// Automatically try to resume audio context on the first user interaction anywhere
if (typeof window !== 'undefined') {
  const unlock = () => {
    initAudioContext();
    window.removeEventListener('click', unlock);
    window.removeEventListener('keydown', unlock);
    window.removeEventListener('touchstart', unlock);
  };
  window.addEventListener('click', unlock, { passive: true });
  window.addEventListener('keydown', unlock, { passive: true });
  window.addEventListener('touchstart', unlock, { passive: true });
}

export const sirenService = {
  start() {
    if (isMuted) return;
    if (isPlaying) return;

    try {
      initAudioContext();
      if (!audioCtx) return;

      // Master Gain
      gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.connect(audioCtx.destination);

      // Main Oscillator (Dual tone alarm: 650Hz to 1050Hz)
      oscillator = audioCtx.createOscillator();
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);

      // LFO for emergency siren wailing sweep (approx 1.8 Hz modulation)
      lfo = audioCtx.createOscillator();
      lfo.frequency.setValueAtTime(1.8, audioCtx.currentTime);

      const lfoGain = audioCtx.createGain();
      lfoGain.gain.setValueAtTime(250, audioCtx.currentTime); // sweep +-250 Hz

      lfo.connect(lfoGain);
      lfoGain.connect(oscillator.frequency);

      oscillator.connect(gainNode);

      lfo.start();
      oscillator.start();
      isPlaying = true;
    } catch (err) {
      console.warn('Siren audio could not be started:', err);
    }
  },

  stop() {
    if (!isPlaying) return;
    try {
      if (gainNode && audioCtx) {
        gainNode.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
      }
      setTimeout(() => {
        try {
          if (oscillator) {
            oscillator.stop();
            oscillator.disconnect();
          }
          if (lfo) {
            lfo.stop();
            lfo.disconnect();
          }
        } catch {
          /* ignore already stopped */
        }
        oscillator = null;
        lfo = null;
        gainNode = null;
        isPlaying = false;
      }, 120);
    } catch {
      isPlaying = false;
    }
  },

  mute() {
    isMuted = true;
    this.stop();
  },

  unmute() {
    isMuted = false;
  },

  toggleMute() {
    if (isMuted) {
      this.unmute();
      return false;
    } else {
      this.mute();
      return true;
    }
  },

  isPlaying() {
    return isPlaying;
  },

  isMuted() {
    return isMuted;
  },
};
