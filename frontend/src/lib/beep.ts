// A short three-tone alert beep, synthesized with the Web Audio API so no
// audio asset is needed for something this simple.
export function playTimesUpBeep() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx: AudioContext = new AudioContextClass();
    if (ctx.state === "suspended") ctx.resume();

    const now = ctx.currentTime;
    const frequencies = [880, 988, 1174]; // A5, B5, D6 — a bright ascending chime

    frequencies.forEach((freq, i) => {
      const start = now + i * 0.18;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.3, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.18);
    });

    setTimeout(() => ctx.close(), 800);
  } catch {
    // Web Audio unavailable — the browser Notification (if permitted) still fires.
  }
}
