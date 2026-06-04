let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
  }
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  return ctx;
}

let muted = false;

export function setMuted(m: boolean) {
  muted = m;
}

export function isMuted(): boolean {
  return muted;
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.15,
) {
  if (muted) return;
  const ac = getCtx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration / 1000);
  osc.connect(gain).connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + duration / 1000);
}

function playNoise(duration: number, freq: number, volume = 0.08) {
  if (muted) return;
  const ac = getCtx();
  const bufferSize = ac.sampleRate * (duration / 1000);
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.5;
  }
  const source = ac.createBufferSource();
  source.buffer = buffer;

  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  filter.Q.value = 2;

  const gain = ac.createGain();
  gain.gain.setValueAtTime(volume, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration / 1000);

  source.connect(filter).connect(gain).connect(ac.destination);
  source.start();
  source.stop(ac.currentTime + duration / 1000);
}

export function playTap() {
  playTone(800, 50, 'sine', 0.1);
}

export function playPour() {
  playNoise(180, 2200, 0.06);
  playTone(440, 80, 'sine', 0.04);
}

export function playSuccess(combo = 0) {
  const pitchMult = 1 + 0.05 * Math.min(combo, 10);
  const ac = getCtx();
  if (muted) return;
  const t = ac.currentTime;

  [523, 659, 784].forEach((freq, i) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq * pitchMult;
    gain.gain.setValueAtTime(0.12, t + i * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.15);
    osc.connect(gain).connect(ac.destination);
    osc.start(t + i * 0.08);
    osc.stop(t + i * 0.08 + 0.15);
  });
}

export function playError() {
  if (muted) return;
  const ac = getCtx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(180, ac.currentTime);
  osc.frequency.linearRampToValueAtTime(100, ac.currentTime + 0.2);
  gain.gain.setValueAtTime(0.1, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.25);
  osc.connect(gain).connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + 0.25);
}

export function playHeartLoss() {
  playTone(80, 120, 'sine', 0.2);
  setTimeout(() => playTone(60, 100, 'sine', 0.15), 80);
}

export function playLevelUp() {
  if (muted) return;
  const ac = getCtx();
  const t = ac.currentTime;
  [523, 659, 784, 1047].forEach((freq, i) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, t + i * 0.07);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.12);
    osc.connect(gain).connect(ac.destination);
    osc.start(t + i * 0.07);
    osc.stop(t + i * 0.07 + 0.12);
  });
}

export function playCombo(combo: number) {
  const freq = 600 + combo * 50;
  playTone(Math.min(freq, 1200), 60, 'sine', 0.08);
}

export function playDump() {
  playNoise(250, 800, 0.05);
}

export function initAudio() {
  getCtx();
}
