/**
 * AMBIENT SOUND LAYER — Web Audio synthesis (no asset hosting needed)
 *   • Wind:        bandpass-noise with slow LFO sweep
 *   • Spell hum:   low sine drone with subtle vibrato
 *   • Distant bell: random 22-50s, inharmonic sine partials with long decay
 *   • Door creak / Gong: one-shot synths
 */

let _audioCtx: AudioContext | null = null;
let _ambientOn = false;
let _masterGain: GainNode | null = null;
let _muted = false;

export function ensureAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!_audioCtx) {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    _audioCtx = new Ctx();
  }
  if (_audioCtx.state === "suspended") _audioCtx.resume();
  return _audioCtx;
}

export function startAmbientLoop() {
  if (_ambientOn) return;
  const ctx = ensureAudioCtx();
  if (!ctx) return;
  _ambientOn = true;

  _masterGain = ctx.createGain();
  _masterGain.gain.value = _muted ? 0 : 1;
  _masterGain.connect(ctx.destination);

  // ── Wind: 4-second white-noise loop, bandpass-filtered with LFO sweep
  const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuf;
  noise.loop = true;

  const windFilter = ctx.createBiquadFilter();
  windFilter.type = "bandpass";
  windFilter.frequency.value = 320;
  windFilter.Q.value = 0.7;

  const windLfo = ctx.createOscillator();
  windLfo.type = "sine";
  windLfo.frequency.value = 0.06;
  const windLfoGain = ctx.createGain();
  windLfoGain.gain.value = 200;
  windLfo.connect(windLfoGain);
  windLfoGain.connect(windFilter.frequency);

  const windGain = ctx.createGain();
  windGain.gain.value = 0.05;
  noise.connect(windFilter);
  windFilter.connect(windGain);
  windGain.connect(_masterGain);
  noise.start();
  windLfo.start();

  // ── Spell-circle hum: low 80Hz sine with vibrato
  const hum = ctx.createOscillator();
  hum.type = "sine";
  hum.frequency.value = 80;
  const humLfo = ctx.createOscillator();
  humLfo.type = "sine";
  humLfo.frequency.value = 0.3;
  const humLfoGain = ctx.createGain();
  humLfoGain.gain.value = 2;
  humLfo.connect(humLfoGain);
  humLfoGain.connect(hum.frequency);
  const humGain = ctx.createGain();
  humGain.gain.value = 0.035;
  hum.connect(humGain);
  humGain.connect(_masterGain);
  hum.start();
  humLfo.start();

  // ── Schedule distant temple bells (random 22-50s)
  const scheduleBell = () => {
    const delay = 22000 + Math.random() * 28000;
    window.setTimeout(() => {
      playDistantBell();
      scheduleBell();
    }, delay);
  };
  scheduleBell();
}

export function playDistantBell() {
  const ctx = ensureAudioCtx();
  if (!ctx || !_masterGain) return;
  const now = ctx.currentTime;
  const partials = [
    { f: 196, a: 0.13, d: 7.0 },
    { f: 294, a: 0.07, d: 5.5 },
    { f: 392, a: 0.05, d: 4.5 },
    { f: 588, a: 0.03, d: 3.5 },
    { f: 784, a: 0.02, d: 2.5 },
  ];
  const bus = ctx.createGain();
  bus.gain.value = 0.28;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 1400;
  bus.connect(lp);
  lp.connect(_masterGain);
  partials.forEach((p) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = p.f;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(p.a, now + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, now + p.d);
    osc.connect(g);
    g.connect(bus);
    osc.start(now);
    osc.stop(now + p.d + 0.05);
  });
}

export function setMuted(muted: boolean) {
  _muted = muted;
  if (_masterGain) _masterGain.gain.value = muted ? 0 : 1;
}

/* ─── Door creak synth — bandpass-filtered sawtooth slide ──────────────── */
export function playDoorCreak() {
  if (typeof window === "undefined") return;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  const ctx = new Ctx();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(85, now);
  osc.frequency.exponentialRampToValueAtTime(48, now + 1.5);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.10, now + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 240;
  filter.Q.value = 8.5;
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 2);
  setTimeout(() => ctx.close(), 2300);
}

/* ─── Gong synth — Web Audio, no assets required ────────────────────────── */
export function playGongSynth() {
  if (typeof window === "undefined") return;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  const ctx = new Ctx();
  const now = ctx.currentTime;
  const partials = [
    { f: 110,  a: 0.42, d: 5.5 },
    { f: 165,  a: 0.20, d: 4.0 },
    { f: 220,  a: 0.32, d: 3.8 },
    { f: 295,  a: 0.16, d: 2.8 },
    { f: 380,  a: 0.12, d: 2.2 },
    { f: 510,  a: 0.08, d: 1.6 },
    { f: 730,  a: 0.05, d: 1.2 },
  ];
  const master = ctx.createGain();
  master.gain.value = 0.55;
  master.connect(ctx.destination);

  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 1800;
  lp.Q.value = 0.4;
  lp.connect(master);

  partials.forEach((p) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = p.f;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(p.a, now + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, now + p.d);
    osc.connect(g);
    g.connect(lp);
    osc.start(now);
    osc.stop(now + p.d + 0.05);
  });

  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i++)
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.03));
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  const noiseG = ctx.createGain();
  noiseG.gain.value = 0.18;
  noise.connect(noiseG);
  noiseG.connect(lp);
  noise.start(now);

  setTimeout(() => ctx.close(), 6500);
}
