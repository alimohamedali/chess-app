const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(frequency, duration, startFreq2 = null, freq2Time = null) {
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    if (startFreq2 && freq2Time) {
      osc.frequency.setValueAtTime(startFreq2, audioCtx.currentTime + freq2Time);
    }
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

export const SoundService = {
  move: () => playTone(440, 0.1),
  capture: () => playTone(200, 0.2),
  check: () => playTone(600, 0.3, 800, 0.1),
  checkmate: () => {
    playTone(300, 0.6);
    setTimeout(() => playTone(200, 0.6), 200);
    setTimeout(() => playTone(100, 0.6), 400);
  },
  draw: () => playTone(350, 0.4, 300, 0.2),
};