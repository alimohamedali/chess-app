let audioCtx = null;

function getCtx() {
  if (!audioCtx || audioCtx.state === "closed") {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(frequency, duration, freq2 = null, freq2Time = null) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    if (freq2 && freq2Time) {
      osc.frequency.setValueAtTime(freq2, ctx.currentTime + freq2Time);
    }
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
}

export const SoundService = {
  move: () => playTone(440, 0.1),
  capture: () => playTone(200, 0.2),
  check: () => playTone(600, 0.3, 800, 0.1),
  checkmate: () => {
    playTone(300, 0.2);
    setTimeout(() => playTone(200, 0.2), 200);
    setTimeout(() => playTone(100, 0.4), 400);
  },
  draw: () => playTone(350, 0.4, 300, 0.2),
};