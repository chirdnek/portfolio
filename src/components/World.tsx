"use client";

/**
 * WORLD.tsx — KAMAR-TAJ (golden hour)
 *
 * Free first-person exploration of the sanctum:
 *   • WASD / Arrows         — walk
 *   • Mouse (click to lock) — look
 *   • Shift                 — sprint
 *   • Esc                   — release pointer
 *
 * Built with built-in Three.js materials only. Everything is procedural.
 * Personal artifacts inside the Sanctum Hall riff on real Vintazk projects
 * (Barangay Connect, Bose Café Networking Lab, the cursed Acer Aspire, etc.).
 */

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import { EffectComposer, Vignette, Bloom, Noise } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";

/* ─── Disciplined 5-color palette (everything else gets pulled toward this) */
const PALETTE = {
  skyTop:    "#2a1338", // deep navy-violet
  skyMid:    "#a04020", // burnt orange
  skyHorizon:"#d8a050", // cream-gold
  stone:     "#7a6a58", // warm grey
  stoneDark: "#3e2e22", // shadow stone / wood
  foliage:   "#3a4a28", // muted moss
  fire:      "#ff7028", // sigil / lantern
  cream:     "#e8c898", // accents / parchment
};

/* ─── Per-face vertex-color variation — kills "flat plastic Roblox" look.
   Adds subtle brightness shifts to each face of a BoxGeometry. */
function paintBox(
  w: number, h: number, d: number,
  color: string,
  variance = 0.18,
  seedBase = 1
) {
  const g = new THREE.BoxGeometry(w, h, d);
  const c = new THREE.Color(color);
  const count = g.attributes.position.count;
  const colors = new Float32Array(count * 3);
  // BoxGeometry has 24 vertices grouped as 6 faces × 4 vertices.
  let s = (seedBase * 9301 + 49297) % 233280;
  const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  for (let f = 0; f < 6; f++) {
    const v = (rand() - 0.5) * variance;
    const r = THREE.MathUtils.clamp(c.r * (1 + v), 0, 1);
    const gg = THREE.MathUtils.clamp(c.g * (1 + v), 0, 1);
    const b = THREE.MathUtils.clamp(c.b * (1 + v), 0, 1);
    for (let j = 0; j < 4; j++) {
      const idx = (f * 4 + j) * 3;
      colors[idx] = r;
      colors[idx + 1] = gg;
      colors[idx + 2] = b;
    }
  }
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return g;
}

/* ─── Module-scoped state read by HUD outside the Canvas ───────────────── */
const PLAYER_POS = new THREE.Vector3();

/* ═══════════════════════════════════════════════════════════════════════════
 * COLLISION SYSTEM
 *   • COLLIDABLES — meshes registered for raycast tests
 *   • <Collider>  — wrapper that registers all child meshes on mount
 *   • isBlocked() — single ray test, reused Raycaster + Vector3s
 * Player movement runs ONE pair of axis-aligned ray tests per frame
 * (forward and strafe). Each axis tested independently → automatic wall
 * sliding (the blocked component is canceled, the parallel one survives).
 * ═══════════════════════════════════════════════════════════════════════════ */
const COLLIDABLES: THREE.Object3D[] = [];

function Collider({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useEffect(() => {
    const group = ref.current;
    if (!group) return;
    const added: THREE.Object3D[] = [];
    group.traverse((obj) => {
      // Only add real meshes (not lights, not bare groups, not points)
      if ((obj as THREE.Mesh).isMesh) {
        COLLIDABLES.push(obj);
        added.push(obj);
      }
    });
    return () => {
      for (const o of added) {
        const idx = COLLIDABLES.indexOf(o);
        if (idx >= 0) COLLIDABLES.splice(idx, 1);
      }
    };
  }, []);
  return <group ref={ref}>{children}</group>;
}

// Reusable scratch instances — zero per-frame allocation in the movement loop
const COLLISION_DIST = 0.6;       // block when wall is within 0.6 units
const COLLIDE_RAY_Y_OFFSET = -0.8; // cast from chest height (camera y - 0.8)
const _ray = new THREE.Raycaster();
_ray.far = COLLISION_DIST + 0.05;
const _origin  = new THREE.Vector3();
const _dir     = new THREE.Vector3();
const _forward = new THREE.Vector3();
const _right   = new THREE.Vector3();

function isBlocked(origin: THREE.Vector3, dir: THREE.Vector3): boolean {
  _ray.set(origin, dir);
  const hits = _ray.intersectObjects(COLLIDABLES, false);
  return hits.length > 0;
}
// Set by Gong component on mount; called by PlayerMovement when E is pressed near it.
let strikeGong: (() => void) | null = null;

/* ═══════════════════════════════════════════════════════════════════════════
 * AMBIENT SOUND LAYER — Web Audio synthesis (no asset hosting needed)
 *   • Wind:        bandpass-noise with slow LFO sweep
 *   • Spell hum:   low sine drone with subtle vibrato
 *   • Distant bell: random 22-50s, inharmonic sine partials with long decay
 * ═══════════════════════════════════════════════════════════════════════════ */
let _audioCtx: AudioContext | null = null;
let _ambientOn = false;
let _bellTimeoutId: number | null = null;
let _masterGain: GainNode | null = null;
let _muted = false;

function ensureAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!_audioCtx) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    _audioCtx = new Ctx();
  }
  if (_audioCtx.state === "suspended") _audioCtx.resume();
  return _audioCtx;
}

function startAmbientLoop() {
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
    _bellTimeoutId = window.setTimeout(() => {
      playDistantBell();
      scheduleBell();
    }, delay);
  };
  scheduleBell();
}

function playDistantBell() {
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

function setMuted(muted: boolean) {
  _muted = muted;
  if (_masterGain) _masterGain.gain.value = muted ? 0 : 1;
}

/* ─── Door creak synth — bandpass-filtered sawtooth slide ──────────────── */
function playDoorCreak() {
  if (typeof window === "undefined") return;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
function playGongSynth() {
  if (typeof window === "undefined") return;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  const ctx = new Ctx();
  const now = ctx.currentTime;
  // Inharmonic partials = metallic, gong-like timbre
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

  // Subtle low-pass shimmer
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

  // Stick noise burst at the very start
  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.03));
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  const noiseG = ctx.createGain();
  noiseG.gain.value = 0.18;
  noise.connect(noiseG);
  noiseG.connect(lp);
  noise.start(now);

  setTimeout(() => ctx.close(), 6500);
}

type Landmark = {
  id: string;
  pos: [number, number, number];
  radius: number;
  name: string;
  hint: string;
};

const LANDMARKS: Landmark[] = [
  { id: "torii",    pos: [0, 0, 70],   radius: 8,  name: "Threshold Gate",        hint: "You are entering sacred ground" },
  { id: "tablet",   pos: [8, 0, 64],   radius: 4,  name: "Vintazk Stone Tablet",  hint: "The seal of the order · carved in the old script" },
  { id: "altar",    pos: [0, 0, 8],    radius: 6,  name: "Spell Circle",          hint: "Pulses with ancient warmth" },
  { id: "gong",     pos: [-15, 0, 12], radius: 5,  name: "Bronze Gong",           hint: "Press E to strike · or click the disc" },
  { id: "pool",     pos: [22, 0, -8],  radius: 6,  name: "Reflecting Pool",       hint: "Lotus and koi · still as glass" },
  { id: "training", pos: [-22, 0, -8], radius: 6,  name: "Sparring Grounds",      hint: "Posts of polished cypress" },
  { id: "temple",   pos: [0, 0, -28],  radius: 12, name: "Main Temple",           hint: "Climb the steps · the spires hum" },
  { id: "sanctum",  pos: [-32, 0, -28],radius: 10, name: "Sanctum Hall",          hint: "Step inside · the library awaits" },
  { id: "tomes",    pos: [-38, 1, -32],radius: 4,  name: "Project Tomes",         hint: "Barangay Connect · Bose Café · Vintazk" },
  { id: "relic",    pos: [-26, 1, -32],radius: 3,  name: "Cursed Acer Aspire",    hint: "Water-damaged · still revered" },
  { id: "throne",   pos: [-32, 1, -42],radius: 4,  name: "The Throne-Desk",       hint: "Where the heroes write their grimoires" },
  { id: "sigil",    pos: [-32, 0.1, -28], radius: 3, name: "KENTO·O Sigil",        hint: "The seal of the order" },
];

/* ═══════════════════════════════════════════════════════════════════════════
 * SKY · SUN · MOUNTAINS · CLOUDS · MIST  (golden-hour palette)
 * ═══════════════════════════════════════════════════════════════════════════ */
function Sky() {
  // Two-color gradient via a custom-baked vertex-color sphere (no shader).
  const geom = useMemo(() => {
    const g = new THREE.SphereGeometry(420, 32, 24);
    const colors = new Float32Array(g.attributes.position.count * 3);
    const pos = g.attributes.position.array as Float32Array;
    const top = new THREE.Color("#3a1a4a");      // deep violet
    const mid = new THREE.Color("#d96a2e");      // burnt orange
    const bot = new THREE.Color("#f0c060");      // warm gold horizon
    for (let i = 0; i < g.attributes.position.count; i++) {
      const y = pos[i * 3 + 1] / 420; // -1..1
      const c = new THREE.Color();
      if (y > 0.0) c.lerpColors(mid, top, Math.min(1, y * 1.6));
      else c.lerpColors(mid, bot, Math.min(1, -y * 1.4));
      colors[i * 3]     = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return g;
  }, []);
  return (
    <mesh geometry={geom}>
      <meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} />
    </mesh>
  );
}

function Sun() {
  // Now positioned BEHIND the temple — sunset silhouette composition
  return (
    <group position={[0, 28, -260]}>
      <mesh>
        <sphereGeometry args={[18, 32, 32]} />
        <meshBasicMaterial color="#fff0c0" toneMapped={false} fog={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[36, 32, 32]} />
        <meshBasicMaterial color="#ffb060" transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[60, 32, 32]} />
        <meshBasicMaterial color="#ff8040" transparent opacity={0.18} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} />
      </mesh>
    </group>
  );
}

/* ─── Pale moon, opposite the sun, low on the horizon */
function Moon() {
  return (
    <group position={[-40, 50, 220]}>
      <mesh>
        <sphereGeometry args={[5, 24, 24]} />
        <meshBasicMaterial color="#dde4ec" toneMapped={false} fog={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[9, 24, 24]} />
        <meshBasicMaterial color="#9aa8c0" transparent opacity={0.25} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} />
      </mesh>
    </group>
  );
}

function Mountains() {
  // Massive Himalayan silhouettes — three layers, parallax depth.
  // Foreground/midground/background scale ratio sells the "real place" feel.
  const layers = useMemo(() => {
    let s = 7777;
    const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return (s >>> 0) / 0xffffffff; };
    const make = (z: number, h: number, n: number, color: string, opacity: number, spread: number) =>
      Array.from({ length: n }, (_, i) => ({
        x: (i - n / 2) * spread + (rand() - 0.5) * spread * 0.4,
        z,
        h: h * (0.65 + rand() * 0.65),
        w: spread * (0.75 + rand() * 0.4),
        color,
        opacity,
      }));
    return [
      ...make(-560, 220, 14, "#1a0d24", 1.0,  90), // far giants
      ...make(-420, 160, 16, "#2a1638", 0.9,  64), // mid range
      ...make(-300, 110, 18, "#4a2440", 0.78, 48), // foothills
      ...make(-200,  60, 14, "#6a3048", 0.6,  36), // closest hills
    ];
  }, []);
  return (
    <group>
      {layers.map((m, i) => (
        <mesh key={i} position={[m.x, m.h / 2, m.z]}>
          <coneGeometry args={[m.w / 2, m.h, 4]} />
          <meshBasicMaterial color={m.color} transparent opacity={m.opacity} fog={false} />
        </mesh>
      ))}
    </group>
  );
}

function Clouds() {
  const clouds = useMemo(() => {
    let s = 9182;
    const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return (s >>> 0) / 0xffffffff; };
    return Array.from({ length: 14 }, () => ({
      pos: [(rand() - 0.5) * 320, 60 + rand() * 40, (rand() - 0.5) * 280 - 60] as [number, number, number],
      scale: 8 + rand() * 14,
      rot: rand() * Math.PI,
      alpha: 0.55 + rand() * 0.3,
      speed: 0.06 + rand() * 0.1,
      tint: rand() > 0.5 ? "#ffd9a8" : "#e8a878",
    }));
  }, []);
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((c, i) => {
      c.position.x += clouds[i].speed * dt;
      if (c.position.x > 200) c.position.x = -200;
    });
  });
  return (
    <group ref={groupRef}>
      {clouds.map((c, i) => (
        <mesh key={i} position={c.pos} rotation={[Math.PI / 5, c.rot, 0]} scale={c.scale}>
          <planeGeometry args={[3, 1.4]} />
          <meshBasicMaterial color={c.tint} transparent opacity={c.alpha} side={THREE.DoubleSide} fog={false} />
        </mesh>
      ))}
    </group>
  );
}

function GroundMist() {
  // Low semi-transparent disk that blurs the lower world — adds depth
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.4, 0]}>
      <planeGeometry args={[600, 600]} />
      <meshBasicMaterial color="#d8a880" transparent opacity={0.18} depthWrite={false} fog={false} />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * GROUND · PLAZA · PATH
 * ═══════════════════════════════════════════════════════════════════════════ */
function Ground() {
  // Outer ground gets vertex-displaced for terrain undulation. The plaza
  // and path on top stay flat so navigation isn't disrupted.
  const undulating = useMemo(() => {
    const g = new THREE.PlaneGeometry(600, 600, 60, 60);
    const pos = g.attributes.position.array as Float32Array;
    let s = 12345;
    const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (let i = 0; i < g.attributes.position.count; i++) {
      const x = pos[i * 3];
      const y = pos[i * 3 + 1]; // pre-rotation: this is "z" in world
      // Distance from courtyard center — keep the area near the player flat
      const d = Math.sqrt(x * x + y * y);
      if (d < 55) continue; // flat plaza zone
      const falloff = Math.min(1, (d - 55) / 60);
      const noise =
        Math.sin(x * 0.03) * 0.6 +
        Math.cos(y * 0.04) * 0.5 +
        Math.sin(x * 0.11 + y * 0.07) * 0.4 +
        (r() - 0.5) * 0.25;
      pos[i * 3 + 2] += noise * falloff;
    }
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} geometry={undulating} receiveShadow>
        <meshLambertMaterial color="#5a3e22" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -8]} receiveShadow>
        <planeGeometry args={[90, 110]} />
        <meshLambertMaterial color="#7a5e3e" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 30]} receiveShadow>
        <planeGeometry args={[6, 90]} />
        <meshLambertMaterial color="#5a4028" />
      </mesh>
    </>
  );
}

/* ─── BIRDS — silhouette flocks crossing the sun */
function Birds() {
  const N = 5;
  const data = useMemo(() => {
    let s = 31415;
    const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    return Array.from({ length: N }, (_, i) => ({
      startX: -180 - i * 22 - r() * 60,
      y: 55 + r() * 35,
      z: -140 - r() * 80,
      speed: 5 + r() * 5,
      flapPhase: r() * Math.PI * 2,
      flapRate: 8 + r() * 3,
    }));
  }, []);
  const refs = useRef<(THREE.Group | null)[]>([]);

  useFrame((_, dt) => {
    const t = performance.now() / 1000;
    data.forEach((b, i) => {
      const g = refs.current[i];
      if (!g) return;
      g.position.x += b.speed * dt;
      if (g.position.x > 220) g.position.x = -220;
      // Wing flap → tilt the whole silhouette (cheap vs animating two wings)
      const flap = Math.sin(t * b.flapRate + b.flapPhase);
      g.rotation.z = flap * 0.18;
      g.rotation.y = -0.05; // slight angle so we see the wings, not edge-on
    });
  });

  return (
    <group>
      {data.map((b, i) => (
        <group
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          position={[b.startX, b.y, b.z]}
        >
          {/* V-shape from two angled thin boxes */}
          <mesh position={[-0.5, 0, 0]} rotation={[0, 0, 0.35]}>
            <boxGeometry args={[1.2, 0.12, 0.05]} />
            <meshBasicMaterial color="#1a0f18" fog={false} />
          </mesh>
          <mesh position={[0.5, 0, 0]} rotation={[0, 0, -0.35]}>
            <boxGeometry args={[1.2, 0.12, 0.05]} />
            <meshBasicMaterial color="#1a0f18" fog={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ─── AURORA — vertex-color cylinder bands with vertical fade
   Uses additive blending where black = transparent (so top/bottom of each
   cylinder fade out cleanly without needing a custom shader).            */
function makeAuroraGeo(radius: number, height: number, color: string) {
  const g = new THREE.CylinderGeometry(radius, radius, height, 32, 4, true);
  const c = new THREE.Color(color);
  const colors = new Float32Array(g.attributes.position.count * 3);
  const pos = g.attributes.position.array as Float32Array;
  for (let i = 0; i < g.attributes.position.count; i++) {
    const y = pos[i * 3 + 1] / (height / 2); // -1..1
    const fade = Math.max(0, 1 - Math.abs(y));
    colors[i * 3]     = c.r * fade;
    colors[i * 3 + 1] = c.g * fade;
    colors[i * 3 + 2] = c.b * fade;
  }
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return g;
}

function Aurora() {
  const bands = useMemo(
    () => [
      { color: "#5aff88", y: 65, opacity: 0.18, speed:  0.04, phase: 0.0 },
      { color: "#48a8ff", y: 75, opacity: 0.14, speed: -0.06, phase: 1.5 },
      { color: "#aa66ff", y: 85, opacity: 0.10, speed:  0.03, phase: 2.8 },
    ],
    []
  );
  const geos = useMemo(
    () => bands.map((b) => makeAuroraGeo(120, 28, b.color)),
    [bands]
  );
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const matRefs = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    bands.forEach((b, i) => {
      const m = refs.current[i];
      const mat = matRefs.current[i];
      if (m) m.rotation.y = t * b.speed;
      if (mat) mat.opacity = b.opacity + Math.sin(t * 0.4 + b.phase) * 0.06;
    });
  });
  return (
    <group position={[0, 0, -120]}>
      {bands.map((b, i) => (
        <mesh
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          position={[0, b.y, 0]}
          geometry={geos[i]}
        >
          <meshBasicMaterial
            ref={(el) => { matRefs.current[i] = el; }}
            vertexColors
            transparent
            opacity={b.opacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
            fog={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * TORII / GATE — at the start of the path
 * ═══════════════════════════════════════════════════════════════════════════ */
function Torii() {
  return (
    <group position={[0, 0, 70]}>
      {/* Two posts */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 4.5, 4, 0]}>
          <cylinderGeometry args={[0.4, 0.5, 8, 10]} />
          <meshLambertMaterial color="#7a2e1c" />
        </mesh>
      ))}
      {/* Top crossbeam (curved suggestion via two tilted boxes) */}
      <mesh position={[0, 8.4, 0]}>
        <boxGeometry args={[12, 0.7, 1]} />
        <meshLambertMaterial color="#6a2818" />
      </mesh>
      <mesh position={[0, 7.5, 0]}>
        <boxGeometry args={[10, 0.4, 0.8]} />
        <meshLambertMaterial color="#8a3a26" />
      </mesh>
      {/* Hanging plaque */}
      <mesh position={[0, 6.7, 0]}>
        <boxGeometry args={[2.4, 1.2, 0.2]} />
        <meshLambertMaterial color="#3a2010" />
      </mesh>
      <mesh position={[0, 6.7, 0.11]}>
        <boxGeometry args={[2.0, 0.9, 0.04]} />
        <meshBasicMaterial color="#ffaa44" toneMapped={false} fog={false} />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * STONE LANTERNS — 8 along the path; 4 carry actual point lights
 * ═══════════════════════════════════════════════════════════════════════════ */
function Lantern({
  position,
  lit = false,
  color = "#ffaa44",
}: {
  position: [number, number, number];
  lit?: boolean;
  color?: string;
}) {
  const flameRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (!lit) return;
    const t = clock.elapsedTime;
    const flicker = 0.7 + Math.sin(t * 8 + position[0]) * 0.18 + Math.sin(t * 23) * 0.1;
    if (flameRef.current) {
      flameRef.current.scale.y = flicker;
    }
    if (lightRef.current) {
      lightRef.current.intensity = 1.6 + flicker * 0.8;
    }
  });
  return (
    <group position={position}>
      {/* Plinth base */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[0.9, 0.8, 0.9]} />
        <meshLambertMaterial color="#5a4634" />
      </mesh>
      {/* Pillar */}
      <mesh position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.25, 0.3, 1.2, 8]} />
        <meshLambertMaterial color="#6a5444" />
      </mesh>
      {/* Light box */}
      <mesh position={[0, 2.3, 0]}>
        <boxGeometry args={[0.85, 0.8, 0.85]} />
        <meshLambertMaterial color="#5a4634" />
      </mesh>
      {/* Lit panels */}
      {lit && (
        <>
          <mesh position={[0, 2.3, 0]}>
            <boxGeometry args={[0.7, 0.65, 0.7]} />
            <meshBasicMaterial color={color} toneMapped={false} fog={false} />
          </mesh>
          <mesh ref={flameRef} position={[0, 2.3, 0]}>
            <sphereGeometry args={[0.25, 12, 12]} />
            <meshBasicMaterial color="#fff2c0" toneMapped={false} transparent opacity={0.92} fog={false} />
          </mesh>
          <pointLight ref={lightRef} position={[0, 2.3, 0]} color={color} intensity={1.8} distance={14} decay={2} />
        </>
      )}
      {/* Capstone */}
      <mesh position={[0, 2.85, 0]}>
        <coneGeometry args={[0.6, 0.6, 4]} />
        <meshLambertMaterial color="#4a3624" />
      </mesh>
    </group>
  );
}

function PathLanterns() {
  // 8 lanterns lining path; only 4 with active point lights to stay cheap
  const items = useMemo(() => {
    const arr: { pos: [number, number, number]; lit: boolean; color: string }[] = [];
    const colors = ["#ff9a44", "#ffaa44", "#ffbb55", "#ff8a30"];
    for (let i = 0; i < 8; i++) {
      const z = 60 - i * 8;
      const litCount = i % 2;          // alternate lit/unlit so every other is lit
      [-1, 1].forEach((side, sideIdx) => {
        arr.push({
          pos: [side * 4.5, 0, z],
          lit: litCount === 0 && sideIdx === 0 ? true : litCount === 0 ? false : false,
          color: colors[i % colors.length],
        });
      });
    }
    // Limit total lit to 4
    let litTotal = 0;
    return arr.map((a) => {
      if (a.lit && litTotal < 4) {
        litTotal++;
        return a;
      }
      return { ...a, lit: false };
    });
  }, []);
  return (
    <group>
      {items.map((l, i) => (
        <Lantern key={i} position={l.pos} lit={l.lit} color={l.color} />
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * PRAYER FLAGS — colored squares hanging on lines between trees
 * ═══════════════════════════════════════════════════════════════════════════ */
function PrayerFlags() {
  const lines = useMemo(() => {
    const FLAG_COLORS = ["#3a86ff", "#ffffff", "#ff595e", "#8ac926", "#ffca3a"];
    let s = 6541;
    const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return (s >>> 0) / 0xffffffff; };
    const lines: {
      from: [number, number, number];
      to: [number, number, number];
      flags: { x: number; color: string }[];
    }[] = [];
    const positions = [
      { from: [-12, 6, 50],  to: [12, 6, 50] },
      { from: [-14, 7, 35],  to: [14, 6.4, 35] },
      { from: [-13, 6, 18],  to: [13, 7, 18] },
      { from: [-15, 6.5, 0], to: [15, 6, 0] },
      { from: [-11, 5.5, -16], to: [11, 6, -16] },
    ];
    positions.forEach((p) => {
      const flagCount = 12;
      const flags = Array.from({ length: flagCount }, (_, j) => ({
        x: j / (flagCount - 1),
        color: FLAG_COLORS[j % FLAG_COLORS.length],
      }));
      lines.push({
        from: p.from as [number, number, number],
        to: p.to as [number, number, number],
        flags,
      });
      // suppress linter
      void rand;
    });
    return lines;
  }, []);

  const flapRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!flapRef.current) return;
    const t = clock.elapsedTime;
    flapRef.current.children.forEach((line) => {
      line.children.forEach((flag, i) => {
        if (flag.userData.isFlag) {
          flag.rotation.y = Math.sin(t * 2 + i * 0.4) * 0.3;
        }
      });
    });
  });

  return (
    <group ref={flapRef}>
      {lines.map((line, i) => {
        // String line via thin cylinder between endpoints
        const dx = line.to[0] - line.from[0];
        const dy = line.to[1] - line.from[1];
        const dz = line.to[2] - line.from[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const mid: [number, number, number] = [
          (line.from[0] + line.to[0]) / 2,
          (line.from[1] + line.to[1]) / 2 - 0.3, // sag
          (line.from[2] + line.to[2]) / 2,
        ];
        const angleY = Math.atan2(dz, dx);
        return (
          <group key={i}>
            <mesh position={mid} rotation={[0, -angleY, 0]}>
              <cylinderGeometry args={[0.025, 0.025, dist, 4]} />
              <meshBasicMaterial color="#1a0e08" fog={false} />
            </mesh>
            {line.flags.map((flag, j) => {
              const fx = line.from[0] + dx * flag.x;
              const fy = line.from[1] + dy * flag.x - Math.sin(flag.x * Math.PI) * 0.4;
              const fz = line.from[2] + dz * flag.x;
              return (
                <mesh key={j} position={[fx, fy - 0.55, fz]} userData={{ isFlag: true }}>
                  <planeGeometry args={[0.55, 0.75]} />
                  <meshBasicMaterial color={flag.color} side={THREE.DoubleSide} fog />
                </mesh>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * TRAINING SPELL CIRCLES — small glowing rings on the ground
 * ═══════════════════════════════════════════════════════════════════════════ */
function TrainingCircles() {
  const positions: [number, number, number][] = [
    [-22, 0.05, -8],
    [-18, 0.05, 2],
    [-26, 0.05, 6],
    [-30, 0.05, -4],
  ];
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    refs.current.forEach((m, i) => {
      if (!m) return;
      m.rotation.z = clock.elapsedTime * (0.2 + i * 0.05) * (i % 2 === 0 ? 1 : -1);
    });
  });
  return (
    <group>
      {positions.map((p, i) => (
        <group key={i} position={p}>
          <mesh ref={(el) => { refs.current[i] = el; }} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.4, 0.05, 6, 32]} />
            <meshBasicMaterial color="#ff6a18" toneMapped={false} fog={false} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
            <torusGeometry args={[1.0, 0.03, 6, 24]} />
            <meshBasicMaterial color="#ffaa44" toneMapped={false} fog={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * SPARRING POSTS — 4 wooden training dummies
 * ═══════════════════════════════════════════════════════════════════════════ */
function SparringPosts() {
  const positions: [number, number, number][] = [
    [-20, 0, -10],
    [-26, 0, -12],
    [-22, 0, -14],
    [-28, 0, -8],
  ];
  return (
    <group>
      {positions.map((p, i) => (
        <group key={i} position={p}>
          <mesh position={[0, 1.4, 0]}>
            <cylinderGeometry args={[0.18, 0.22, 2.8, 8]} />
            <meshLambertMaterial color="#5a3a20" />
          </mesh>
          {/* Crossbar arms */}
          <mesh position={[0, 2.3, 0]}>
            <boxGeometry args={[1.4, 0.16, 0.16]} />
            <meshLambertMaterial color="#4a2a14" />
          </mesh>
          {/* Wrappings (red) */}
          <mesh position={[0, 1.8, 0]}>
            <cylinderGeometry args={[0.21, 0.21, 0.5, 8]} />
            <meshLambertMaterial color="#a83a28" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * GONG — bronze disc on a wooden frame
 * ═══════════════════════════════════════════════════════════════════════════ */
function Gong() {
  const discRef = useRef<THREE.Mesh>(null);
  const rippleRef = useRef<THREE.Mesh>(null);
  const rippleMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const strikeT = useRef(-10); // seconds since last strike (init far in past)

  // Register strike fn at module scope so PlayerMovement can call it
  useEffect(() => {
    strikeGong = () => {
      strikeT.current = 0;
      playGongSynth();
    };
    return () => { strikeGong = null; };
  }, []);

  useFrame((_, dt) => {
    strikeT.current += dt;
    const t = strikeT.current;

    // Disc — small swing/wobble after strike
    if (discRef.current) {
      if (t < 2.5) {
        const decay = Math.exp(-t * 1.4);
        discRef.current.rotation.x = Math.sin(t * 18) * 0.08 * decay;
        discRef.current.rotation.z = Math.sin(t * 14) * 0.05 * decay;
      } else {
        discRef.current.rotation.x = 0;
        discRef.current.rotation.z = 0;
      }
    }

    // Ripple — expanding fading ring
    if (rippleRef.current && rippleMatRef.current) {
      if (t < 1.6) {
        const s = 0.4 + t * 5.5;
        rippleRef.current.scale.set(s, s, s);
        rippleMatRef.current.opacity = Math.max(0, 0.85 - t / 1.6);
      } else {
        rippleMatRef.current.opacity = 0;
      }
    }
  });

  return (
    <group position={[-15, 0, 12]}>
      {/* Frame posts */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 1.6, 1.7, 0]}>
          <cylinderGeometry args={[0.12, 0.16, 3.4, 8]} />
          <meshLambertMaterial color="#5a3a20" />
        </mesh>
      ))}
      {/* Top beam */}
      <mesh position={[0, 3.4, 0]}>
        <boxGeometry args={[3.5, 0.2, 0.25]} />
        <meshLambertMaterial color="#4a2a14" />
      </mesh>
      {/* Gong disc — wobbles after strike */}
      <mesh ref={discRef} position={[0, 1.9, 0]} onClick={() => strikeGong?.()}>
        <cylinderGeometry args={[1.1, 1.1, 0.12, 32]} />
        <meshLambertMaterial color="#c89a3a" emissive="#3a2810" />
      </mesh>
      {/* Inner sigil */}
      <mesh position={[0, 1.9, 0.08]}>
        <ringGeometry args={[0.5, 0.7, 24]} />
        <meshBasicMaterial color="#6a3a18" side={THREE.DoubleSide} fog />
      </mesh>
      {/* Strike ripple — expanding ring of sound */}
      <mesh ref={rippleRef} position={[0, 1.9, 0]}>
        <ringGeometry args={[1.0, 1.15, 32]} />
        <meshBasicMaterial
          ref={rippleMatRef}
          color="#ffaa44"
          toneMapped={false}
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          fog={false}
        />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * REFLECTING POOL — flat blue plane with lotus pads
 * ═══════════════════════════════════════════════════════════════════════════ */
function ReflectingPool() {
  return (
    <group position={[22, 0, -8]}>
      {/* Stone rim */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[8.4, 0.3, 8.4]} />
        <meshLambertMaterial color="#5a4634" />
      </mesh>
      {/* Water surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.32, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshBasicMaterial color="#3a4a78" transparent opacity={0.85} fog={false} />
      </mesh>
      {/* Highlight reflection */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.34, 0]}>
        <planeGeometry args={[7, 7]} />
        <meshBasicMaterial color="#ffaa55" transparent opacity={0.16} blending={THREE.AdditiveBlending} fog={false} />
      </mesh>
      {/* Lotus pads */}
      {[
        [-2, 1.5],
        [1.5, -1],
        [-1, -2.2],
        [2.5, 2.5],
      ].map((p, i) => (
        <group key={i} position={[p[0], 0.4, p[1]]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.45, 8]} />
            <meshLambertMaterial color="#3a6028" side={THREE.DoubleSide} />
          </mesh>
          {/* Lotus flower */}
          {i % 2 === 0 && (
            <mesh position={[0, 0.1, 0]}>
              <sphereGeometry args={[0.18, 12, 8]} />
              <meshLambertMaterial color="#f098c0" emissive="#a04060" emissiveIntensity={0.3} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * FOO DOG / GUARDIAN STATUES — flank the temple stairs
 * ═══════════════════════════════════════════════════════════════════════════ */
function FooDog({ position, mirror = false }: { position: [number, number, number]; mirror?: boolean }) {
  const dir = mirror ? -1 : 1;
  return (
    <group position={position} rotation={[0, dir * 0.1, 0]}>
      {/* Plinth */}
      <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.7, 1.4, 1.7]} />
        <meshLambertMaterial color="#6a5040" />
      </mesh>
      {/* Body crouch */}
      <mesh position={[0, 1.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 1.1, 1.6]} />
        <meshLambertMaterial color="#7e6248" />
      </mesh>
      {/* Front legs */}
      {[-0.4, 0.4].map((x, i) => (
        <mesh key={i} position={[x, 1.5, 0.6]}>
          <boxGeometry args={[0.3, 0.7, 0.4]} />
          <meshLambertMaterial color="#7e6248" />
        </mesh>
      ))}
      {/* Mane */}
      <mesh position={[0, 2.7, 0.05]}>
        <sphereGeometry args={[0.7, 12, 12]} />
        <meshLambertMaterial color="#5e4030" />
      </mesh>
      {/* Head */}
      <mesh position={[0, 2.9, 0.4]}>
        <boxGeometry args={[0.85, 0.85, 0.95]} />
        <meshLambertMaterial color="#86684c" />
      </mesh>
      {/* Eyes — tiny glow */}
      <mesh position={[-0.18 * dir, 2.95, 0.85]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshBasicMaterial color="#ffaa44" toneMapped={false} fog={false} />
      </mesh>
      <mesh position={[0.18 * dir, 2.95, 0.85]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshBasicMaterial color="#ffaa44" toneMapped={false} fog={false} />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * MAIN TEMPLE — Angkor-stepped pyramid (unchanged)
 * ═══════════════════════════════════════════════════════════════════════════ */
function Spire({
  position,
  height = 6,
  radius = 1.4,
}: {
  position: [number, number, number];
  height?: number;
  radius?: number;
}) {
  return (
    <group position={position}>
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[radius * 2.2, 0.8, radius * 2.2]} />
        <meshLambertMaterial color="#7d6450" />
      </mesh>
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[radius * 1.8, 0.6, radius * 1.8]} />
        <meshLambertMaterial color="#8c7258" />
      </mesh>
      <mesh position={[0, 1.4 + height / 2, 0]}>
        <coneGeometry args={[radius, height, 6]} />
        <meshLambertMaterial color="#967660" />
      </mesh>
      <mesh position={[0, 1.4 + height + 0.3, 0]}>
        <sphereGeometry args={[radius * 0.18, 8, 8]} />
        <meshLambertMaterial color="#7a6048" />
      </mesh>
    </group>
  );
}

function Temple() {
  // Pre-painted geometries with per-face variation — caches once per mount.
  const tier1 = useMemo(() => paintBox(34, 6, 34, PALETTE.stone, 0.18, 1), []);
  const tier2 = useMemo(() => paintBox(26, 4, 26, "#84715a", 0.18, 2), []);
  const tier3 = useMemo(() => paintBox(18, 4, 18, "#92805a", 0.16, 3), []);
  const tier4 = useMemo(() => paintBox(10, 2, 10, "#a08966", 0.14, 4), []);
  const stair = useMemo(() => paintBox(10, 0.7, 1.0, "#7a6450", 0.20, 5), []);

  return (
    <group position={[0, 0, -42]} scale={1.45}>
      <mesh position={[0, 3, 0]}  geometry={tier1} castShadow receiveShadow><meshLambertMaterial vertexColors /></mesh>
      <mesh position={[0, 9, 0]}  geometry={tier2} castShadow receiveShadow><meshLambertMaterial vertexColors /></mesh>
      <mesh position={[0, 14, 0]} geometry={tier3} castShadow receiveShadow><meshLambertMaterial vertexColors /></mesh>
      <mesh position={[0, 18, 0]} geometry={tier4} castShadow receiveShadow><meshLambertMaterial vertexColors /></mesh>

      <Spire position={[0, 19, 0]}     height={10} radius={2.4} />
      <Spire position={[-10, 11, -10]} height={5}  radius={1.4} />
      <Spire position={[ 10, 11, -10]} height={5}  radius={1.4} />
      <Spire position={[-10, 11,  10]} height={5}  radius={1.4} />
      <Spire position={[ 10, 11,  10]} height={5}  radius={1.4} />

      {/* Worn stairs */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[0, 0.4 + i * 0.7, 17 + i * 0.5]} geometry={stair}>
          <meshLambertMaterial vertexColors />
        </mesh>
      ))}

      {/* Pillars — keep cylinder, just tint to palette */}
      {[-12, -7, -2, 3, 8, 13].map((x, i) => (
        <mesh key={i} position={[x - 0.5, 3.5, 17]}>
          <cylinderGeometry args={[0.45, 0.45, 5, 8]} />
          <meshLambertMaterial color="#9a8268" />
        </mesh>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * SANCTUM HALL — interior building with personal artifacts
 * ═══════════════════════════════════════════════════════════════════════════ */
function MandalaWindow({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Stone frame */}
      <mesh>
        <boxGeometry args={[2.4, 3.2, 0.3]} />
        <meshLambertMaterial color="#8a7058" />
      </mesh>
      {/* Glass mandala */}
      <mesh position={[0, 0, 0.16]}>
        <planeGeometry args={[2.0, 2.8]} />
        <meshBasicMaterial color="#ffaa44" transparent opacity={0.7} side={THREE.DoubleSide} fog={false} />
      </mesh>
      {/* Inner ring sigil */}
      <mesh position={[0, 0, 0.18]}>
        <ringGeometry args={[0.6, 0.85, 24]} />
        <meshBasicMaterial color="#ff7028" toneMapped={false} side={THREE.DoubleSide} fog={false} />
      </mesh>
      <mesh position={[0, 0, 0.18]}>
        <ringGeometry args={[0.25, 0.4, 24]} />
        <meshBasicMaterial color="#fff0a0" toneMapped={false} side={THREE.DoubleSide} fog={false} />
      </mesh>
    </group>
  );
}

function GodRay({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  return (
    <mesh position={position} rotation={[Math.PI / 4, rotationY, 0]}>
      <coneGeometry args={[1.6, 8, 8, 1, true]} />
      <meshBasicMaterial
        color="#ffd080"
        transparent
        opacity={0.16}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
        fog={false}
      />
    </mesh>
  );
}

function ProjectTome({
  position,
  color,
  height = 1.0,
}: {
  position: [number, number, number];
  color: string;
  height?: number;
}) {
  return (
    <group position={position}>
      {/* Spine */}
      <mesh>
        <boxGeometry args={[0.18, height, 0.7]} />
        <meshLambertMaterial color={color} />
      </mesh>
      {/* Glow band on spine (project name placeholder) */}
      <mesh position={[0.095, 0, 0]}>
        <boxGeometry args={[0.02, height * 0.4, 0.7]} />
        <meshBasicMaterial color="#ffaa44" toneMapped={false} fog />
      </mesh>
    </group>
  );
}

function Bookshelf({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  // Simulated tomes — colors riff on real Vintazk projects
  const tomes = useMemo(() => {
    const colors = [
      "#6b3a2a", // Barangay Connect — clay
      "#2a4868", // Vintazk Portfolio — slate
      "#c08020", // Bose Café Networking Lab — copper
      "#3a6048", // Pentaxite — moss
      "#7a3a48", // VocabVoyage — wine
      "#5a4878", // Cooking Book — plum
      "#8a6a30", // Saas Catering — bronze
      "#3a3a3a", // The Eilish Vault — coal
      "#5a3a28", // Coffee Blog — espresso
      "#6a4a78", // Figma Design — orchid
      "#4a4a4a", // Disaster Response — slate
    ];
    return colors;
  }, []);
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Shelf frame */}
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[5, 3, 0.6]} />
        <meshLambertMaterial color="#3a2418" />
      </mesh>
      {/* Three shelves of books */}
      {[0.6, 1.5, 2.4].map((y, shelfIdx) => (
        <group key={shelfIdx} position={[0, y, 0.32]}>
          {tomes.slice(0, 6 + shelfIdx).map((c, i) => (
            <ProjectTome
              key={`${shelfIdx}-${i}`}
              position={[-2.2 + i * 0.45, 0, 0]}
              color={c}
              height={0.7 + (i % 3) * 0.06}
            />
          ))}
        </group>
      ))}
    </group>
  );
}

function FloatingTome({ position, color = "#fff0a0" }: { position: [number, number, number]; color?: string }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    groupRef.current.rotation.y = t * 0.4;
    groupRef.current.position.y = position[1] + Math.sin(t * 1.5) * 0.1;
  });
  return (
    <group ref={groupRef} position={position}>
      {/* Open V book */}
      <mesh rotation={[0, 0, -0.18]} position={[-0.35, 0, 0]}>
        <planeGeometry args={[0.7, 0.95]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} fog={false} />
      </mesh>
      <mesh rotation={[0, 0, 0.18]} position={[0.35, 0, 0]}>
        <planeGeometry args={[0.7, 0.95]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} fog={false} />
      </mesh>
      {/* Glow ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.7, 0.05, 6, 24]} />
        <meshBasicMaterial color="#ff7028" toneMapped={false} fog={false} />
      </mesh>
    </group>
  );
}

function CursedAcer({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Stone pedestal */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[1.6, 0.8, 1.6]} />
        <meshLambertMaterial color="#5a4634" />
      </mesh>
      {/* Glass case (additive 4 walls) */}
      {[
        { p: [0.7, 1.4, 0] as [number, number, number], r: [0, Math.PI / 2, 0] as [number, number, number] },
        { p: [-0.7, 1.4, 0] as [number, number, number], r: [0, Math.PI / 2, 0] as [number, number, number] },
        { p: [0, 1.4, 0.7] as [number, number, number], r: [0, 0, 0] as [number, number, number] },
        { p: [0, 1.4, -0.7] as [number, number, number], r: [0, 0, 0] as [number, number, number] },
        { p: [0, 2.1, 0] as [number, number, number], r: [Math.PI / 2, 0, 0] as [number, number, number] },
      ].map((face, i) => (
        <mesh key={i} position={face.p} rotation={face.r}>
          <planeGeometry args={[1.4, 1.4]} />
          <meshBasicMaterial
            color="#88aacc"
            transparent
            opacity={0.18}
            side={THREE.DoubleSide}
            depthWrite={false}
            fog={false}
          />
        </mesh>
      ))}
      {/* Velvet cushion */}
      <mesh position={[0, 0.92, 0]}>
        <boxGeometry args={[1.1, 0.16, 1.1]} />
        <meshLambertMaterial color="#7a1828" />
      </mesh>
      {/* Acer Aspire — closed laptop */}
      <mesh position={[0, 1.04, 0]}>
        <boxGeometry args={[0.95, 0.06, 0.65]} />
        <meshLambertMaterial color="#1a1a1a" />
      </mesh>
      {/* Apple-of-water-damage stain */}
      <mesh position={[0, 1.075, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.1, 12]} />
        <meshBasicMaterial color="#3a4858" fog={false} />
      </mesh>
    </group>
  );
}

function ThroneDesk({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Desk top */}
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[3.8, 0.16, 1.6]} />
        <meshLambertMaterial color="#2a1810" />
      </mesh>
      {/* Legs */}
      {[
        [-1.7, 0.55,  0.6],
        [ 1.7, 0.55,  0.6],
        [-1.7, 0.55, -0.6],
        [ 1.7, 0.55, -0.6],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <boxGeometry args={[0.18, 1.1, 0.18]} />
          <meshLambertMaterial color="#1a1008" />
        </mesh>
      ))}
      {/* Throne back */}
      <mesh position={[0, 1.5, -1.0]}>
        <boxGeometry args={[1.6, 2.2, 0.14]} />
        <meshLambertMaterial color="#3a2418" />
      </mesh>
      {/* Floating holographic monitors (3) */}
      {[-1.0, 0, 1.0].map((dx, i) => (
        <group key={i} position={[dx, 1.9, 0.2]} rotation={[0, dx * 0.18, 0]}>
          <mesh>
            <planeGeometry args={[0.85, 0.55]} />
            <meshBasicMaterial color="#1a3a4a" transparent opacity={0.85} side={THREE.DoubleSide} fog={false} />
          </mesh>
          <mesh position={[0, 0, 0.001]}>
            <planeGeometry args={[0.78, 0.48]} />
            <meshBasicMaterial color={["#ff7028", "#3aa8ff", "#a040ff"][i]} transparent opacity={0.7} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} fog={false} />
          </mesh>
          {/* Frame glow */}
          <mesh>
            <planeGeometry args={[0.92, 0.62]} />
            <meshBasicMaterial color="#ffaa44" toneMapped={false} transparent opacity={0.3} blending={THREE.AdditiveBlending} fog={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function MindanaoMap({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Parchment */}
      <mesh>
        <planeGeometry args={[2.2, 1.8]} />
        <meshBasicMaterial color="#d4b478" side={THREE.DoubleSide} fog />
      </mesh>
      {/* Stylized Mindanao landmass — irregular blob via overlapping triangles */}
      <mesh position={[0, 0, 0.01]}>
        <circleGeometry args={[0.7, 8]} />
        <meshBasicMaterial color="#3a5028" side={THREE.DoubleSide} fog />
      </mesh>
      {/* Zamboanga marker — glowing dot at lower-left */}
      <mesh position={[-0.45, -0.35, 0.02]}>
        <circleGeometry args={[0.08, 16]} />
        <meshBasicMaterial color="#ff6a18" toneMapped={false} fog={false} />
      </mesh>
      {/* Glow halo */}
      <mesh position={[-0.45, -0.35, 0.025]}>
        <circleGeometry args={[0.18, 16]} />
        <meshBasicMaterial color="#ffaa44" transparent opacity={0.5} blending={THREE.AdditiveBlending} fog={false} />
      </mesh>
    </group>
  );
}

function TechRune({ position, type, rotationY = 0 }: { position: [number, number, number]; type: "react" | "next" | "flutter" | "supabase"; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Mounting plaque */}
      <mesh>
        <ringGeometry args={[0.55, 0.7, 20]} />
        <meshBasicMaterial color="#5a3a20" side={THREE.DoubleSide} fog />
      </mesh>
      {type === "react" && (
        // 3 elliptical orbits crossing
        <>
          {[0, Math.PI / 3, -Math.PI / 3].map((a, i) => (
            <mesh key={i} rotation={[Math.PI / 2, 0, a]}>
              <torusGeometry args={[0.5, 0.04, 6, 32]} />
              <meshBasicMaterial color="#3aa8ff" toneMapped={false} fog={false} />
            </mesh>
          ))}
          <mesh>
            <sphereGeometry args={[0.1, 12, 12]} />
            <meshBasicMaterial color="#3aa8ff" toneMapped={false} fog={false} />
          </mesh>
        </>
      )}
      {type === "next" && (
        <>
          {/* Triangle / N-mark */}
          <mesh rotation={[0, 0, 0]}>
            <ringGeometry args={[0.34, 0.5, 3]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} side={THREE.DoubleSide} fog={false} />
          </mesh>
        </>
      )}
      {type === "flutter" && (
        <>
          {/* Stacked dart shapes — represented as overlapping rotated rectangles */}
          {[0, 0.5, -0.2].map((dy, i) => (
            <mesh key={i} position={[0, dy * 0.3, 0]} rotation={[0, 0, Math.PI / 4]}>
              <planeGeometry args={[0.5, 0.16]} />
              <meshBasicMaterial color={["#0080ff", "#40c0ff", "#0064c8"][i]} toneMapped={false} side={THREE.DoubleSide} fog={false} />
            </mesh>
          ))}
        </>
      )}
      {type === "supabase" && (
        <>
          {/* Lightning bolt — two stacked triangles */}
          <mesh rotation={[0, 0, -0.3]}>
            <ringGeometry args={[0, 0.5, 3]} />
            <meshBasicMaterial color="#3ee48a" toneMapped={false} side={THREE.DoubleSide} fog={false} />
          </mesh>
          <mesh position={[0.05, -0.25, 0]} rotation={[0, 0, Math.PI - 0.3]}>
            <ringGeometry args={[0, 0.32, 3]} />
            <meshBasicMaterial color="#1aa860" toneMapped={false} side={THREE.DoubleSide} fog={false} />
          </mesh>
        </>
      )}
    </group>
  );
}

function CentralSigil({ position }: { position: [number, number, number] }) {
  const ringRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    ringRef.current.rotation.z = clock.elapsedTime * 0.3;
  });
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.4, 32]} />
        <meshBasicMaterial color="#1a0a04" fog={false} />
      </mesh>
      <group ref={ringRef}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[2.0, 2.2, 36]} />
          <meshBasicMaterial color="#ff7028" toneMapped={false} side={THREE.DoubleSide} fog={false} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[1.4, 1.5, 36]} />
          <meshBasicMaterial color="#ffaa44" toneMapped={false} side={THREE.DoubleSide} fog={false} />
        </mesh>
        {/* Radial spokes */}
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * 1.7, 0.03, Math.sin(a) * 1.7]}
              rotation={[-Math.PI / 2, 0, -a]}
            >
              <planeGeometry args={[0.5, 0.06]} />
              <meshBasicMaterial color="#fff0a0" toneMapped={false} side={THREE.DoubleSide} fog={false} />
            </mesh>
          );
        })}
        {/* Center "K" — stylized as cross of 2 boxes */}
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.18, 0.7]} />
          <meshBasicMaterial color="#fff0a0" toneMapped={false} side={THREE.DoubleSide} fog={false} />
        </mesh>
        <mesh position={[0.13, 0.04, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
          <planeGeometry args={[0.14, 0.4]} />
          <meshBasicMaterial color="#fff0a0" toneMapped={false} side={THREE.DoubleSide} fog={false} />
        </mesh>
        <mesh position={[0.13, 0.04, 0]} rotation={[-Math.PI / 2, 0, -Math.PI / 4]}>
          <planeGeometry args={[0.14, 0.4]} />
          <meshBasicMaterial color="#fff0a0" toneMapped={false} side={THREE.DoubleSide} fog={false} />
        </mesh>
      </group>
    </group>
  );
}

function SanctumHall() {
  return (
    <group position={[-32, 0, -28]}>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <planeGeometry args={[18, 22]} />
        <meshLambertMaterial color="#5a4030" />
      </mesh>
      {/* 3 walls — open front (facing +Z toward player) */}
      {/* Back wall */}
      <mesh position={[0, 4, -11]} castShadow receiveShadow>
        <boxGeometry args={[18, 8, 0.6]} />
        <meshLambertMaterial color="#7a5e44" />
      </mesh>
      {/* Left wall */}
      <mesh position={[-9, 4, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.6, 8, 22]} />
        <meshLambertMaterial color="#7a5e44" />
      </mesh>
      {/* Right wall */}
      <mesh position={[9, 4, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.6, 8, 22]} />
        <meshLambertMaterial color="#7a5e44" />
      </mesh>
      {/* Front wall partials (frame the open doorway) */}
      <mesh position={[-6.5, 4, 11]}>
        <boxGeometry args={[5, 8, 0.6]} />
        <meshLambertMaterial color="#7a5e44" />
      </mesh>
      <mesh position={[6.5, 4, 11]}>
        <boxGeometry args={[5, 8, 0.6]} />
        <meshLambertMaterial color="#7a5e44" />
      </mesh>
      <mesh position={[0, 7.4, 11]}>
        <boxGeometry args={[18, 1.2, 0.6]} />
        <meshLambertMaterial color="#5e4a34" />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 8.2, 0]}>
        <boxGeometry args={[19, 0.4, 23]} />
        <meshLambertMaterial color="#3a2818" />
      </mesh>

      {/* Mandala windows on side walls */}
      <MandalaWindow position={[-8.65, 4.5,  4]} rotationY={Math.PI / 2} />
      <MandalaWindow position={[-8.65, 4.5, -4]} rotationY={Math.PI / 2} />
      <MandalaWindow position={[ 8.65, 4.5,  4]} rotationY={-Math.PI / 2} />
      <MandalaWindow position={[ 8.65, 4.5, -4]} rotationY={-Math.PI / 2} />

      {/* God-rays from each window */}
      <GodRay position={[-7, 5, 4]} rotationY={Math.PI / 2} />
      <GodRay position={[-7, 5, -4]} rotationY={Math.PI / 2} />
      <GodRay position={[ 7, 5, 4]} rotationY={-Math.PI / 2} />
      <GodRay position={[ 7, 5, -4]} rotationY={-Math.PI / 2} />

      {/* Bookshelves left wall */}
      <Bookshelf position={[-7, 0, -5]} rotationY={Math.PI / 2} />
      <Bookshelf position={[-7, 0,  5]} rotationY={Math.PI / 2} />

      {/* Bookshelves right wall */}
      <Bookshelf position={[7, 0, -5]} rotationY={-Math.PI / 2} />

      {/* Central pedestal — 48 Laws of Power floating */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.7, 0.85, 1.2, 16]} />
          <meshLambertMaterial color="#5a4030" />
        </mesh>
        <FloatingTome position={[0, 1.8, 0]} color="#fff0a0" />
      </group>

      {/* Cursed Acer — to the right of pedestal */}
      <CursedAcer position={[6, 0, 0]} />

      {/* Throne-desk at the back wall */}
      <ThroneDesk position={[0, 0, -9]} />

      {/* Mindanao map on left wall */}
      <MindanaoMap position={[-8.6, 5.5, 0]} rotationY={Math.PI / 2} />

      {/* 4 tech-rune mandalas on right wall */}
      <TechRune position={[8.5, 5.6,  6]} type="react"    rotationY={-Math.PI / 2} />
      <TechRune position={[8.5, 5.6,  2]} type="next"     rotationY={-Math.PI / 2} />
      <TechRune position={[8.5, 5.6, -2]} type="flutter"  rotationY={-Math.PI / 2} />
      <TechRune position={[8.5, 5.6, -6]} type="supabase" rotationY={-Math.PI / 2} />

      {/* Central floor sigil */}
      <CentralSigil position={[0, 0.05, 6]} />
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * FLOATING STONE FRAGMENTS — small chunks orbiting the temple spire
 * (Doctor Strange astral plane vibe; small geometry, additive glow inset)
 * ═══════════════════════════════════════════════════════════════════════════ */
function FloatingFragments() {
  const N = 12;
  const fragments = useMemo(() => {
    let s = 13579;
    const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return (s >>> 0) / 0xffffffff; };
    return Array.from({ length: N }, () => ({
      radius:    14 + rand() * 8,                  // orbit radius around spire
      speed:     0.12 + rand() * 0.15,             // angular velocity
      offset:    rand() * Math.PI * 2,             // starting phase
      yBase:     34 + rand() * 12,                 // height above ground
      yWobble:   1 + rand() * 1.5,                 // bob amplitude
      size:      0.8 + rand() * 1.6,               // chunk size
      tilt:      rand() * Math.PI,                 // self-rotation start
    }));
  }, []);
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    fragments.forEach((f, i) => {
      const m = refs.current[i];
      if (!m) return;
      const a = t * f.speed + f.offset;
      m.position.x = Math.cos(a) * f.radius;
      m.position.z = Math.sin(a) * f.radius - 42; // centered on temple z
      m.position.y = f.yBase + Math.sin(t * 0.6 + f.offset) * f.yWobble;
      m.rotation.x = f.tilt + t * 0.3;
      m.rotation.y = f.tilt * 0.7 + t * 0.2;
    });
  });
  return (
    <group>
      {fragments.map((f, i) => (
        <mesh
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          castShadow
        >
          <boxGeometry args={[f.size, f.size * 0.5, f.size * 0.7]} />
          <meshLambertMaterial color="#5a4a38" emissive="#3a2010" emissiveIntensity={0.35} />
        </mesh>
      ))}
    </group>
  );
}

/* ─── GROUND SIGIL — glowing rune circle on the courtyard pavement */
function GroundSigil({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.elapsedTime * 0.18;
  });
  return (
    <group position={position} scale={scale}>
      <group ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh>
          <ringGeometry args={[1.4, 1.55, 36]} />
          <meshBasicMaterial color="#ff7028" toneMapped={false} side={THREE.DoubleSide} fog={false} />
        </mesh>
        <mesh>
          <ringGeometry args={[1.05, 1.12, 36]} />
          <meshBasicMaterial color="#ffaa44" toneMapped={false} side={THREE.DoubleSide} fog={false} />
        </mesh>
        {/* Radial spokes */}
        {Array.from({ length: 6 }).map((_, i) => {
          const a = (i / 6) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 1.3, 0, Math.sin(a) * 1.3]} rotation={[0, -a, 0]}>
              <planeGeometry args={[0.32, 0.05]} />
              <meshBasicMaterial color="#ffd070" toneMapped={false} side={THREE.DoubleSide} fog={false} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

/* ─── VINTAZK STONE TABLET — personalization marker at path entrance */
function VintazkTablet() {
  return (
    <group position={[8, 0, 64]} rotation={[0, -0.4, 0]}>
      {/* Base plinth */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.8, 1.2]} />
        <meshLambertMaterial color="#5a4838" />
      </mesh>
      {/* Tablet — leans slightly */}
      <mesh position={[0, 2.1, 0]} rotation={[0.05, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 2.6, 0.3]} />
        <meshLambertMaterial color={PALETTE.stone} />
      </mesh>
      {/* Inset face — slightly recessed */}
      <mesh position={[0, 2.1, 0.16]}>
        <planeGeometry args={[1.5, 2.3]} />
        <meshLambertMaterial color="#5a4438" />
      </mesh>
      {/* Glowing rune logo — stylized "V" + ring (vintazk sigil) */}
      <group position={[0, 2.1, 0.17]}>
        <mesh>
          <ringGeometry args={[0.55, 0.62, 24]} />
          <meshBasicMaterial color="#ff7028" toneMapped={false} side={THREE.DoubleSide} fog={false} />
        </mesh>
        {/* "V" mark — two diagonal bars */}
        <mesh position={[-0.15, 0.05, 0]} rotation={[0, 0,  0.4]}>
          <planeGeometry args={[0.08, 0.7]} />
          <meshBasicMaterial color="#ffaa44" toneMapped={false} side={THREE.DoubleSide} fog={false} />
        </mesh>
        <mesh position={[ 0.15, 0.05, 0]} rotation={[0, 0, -0.4]}>
          <planeGeometry args={[0.08, 0.7]} />
          <meshBasicMaterial color="#ffaa44" toneMapped={false} side={THREE.DoubleSide} fog={false} />
        </mesh>
        {/* Crown dot */}
        <mesh position={[0, 0.5, 0]}>
          <circleGeometry args={[0.06, 12]} />
          <meshBasicMaterial color="#ffd070" toneMapped={false} fog={false} />
        </mesh>
      </group>
      {/* Inscription bar (decorative — runs across bottom of tablet) */}
      <mesh position={[0, 1.05, 0.17]}>
        <planeGeometry args={[1.2, 0.06]} />
        <meshBasicMaterial color="#ff7028" toneMapped={false} fog={false} />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * SANCTUM PORTAL — animated doors + sling-ring spell circle + entry burst
 *   • Doors swing OUTWARD as you approach (within 7 units)
 *   • Glow behind doors intensifies with door openness
 *   • Sling-ring + counter-rotating inner ring framing the doorway
 *   • Particle burst when you physically cross the threshold
 *   • Synthesized creak on each open transition
 * ═══════════════════════════════════════════════════════════════════════════ */
function SanctumPortal() {
  const leftRef = useRef<THREE.Group>(null);
  const rightRef = useRef<THREE.Group>(null);
  const glowMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const isOpenRef = useRef(false);
  const lastZRef = useRef(99);

  // Burst particles (80 points spawning radially outward + gravity)
  const BURST_N = 80;
  const burstPos = useMemo(() => new Float32Array(BURST_N * 3), []);
  const burstVel = useMemo(() => new Float32Array(BURST_N * 3), []);
  const burstColors = useMemo(() => {
    const arr = new Float32Array(BURST_N * 3);
    const palette: [number, number, number][] = [
      [1, 0.7, 0.2], [1, 0.45, 0.1], [1, 0.85, 0.4], [0.9, 0.3, 0.05],
    ];
    for (let i = 0; i < BURST_N; i++) {
      const c = palette[Math.floor(Math.random() * palette.length)];
      arr[i * 3] = c[0];
      arr[i * 3 + 1] = c[1];
      arr[i * 3 + 2] = c[2];
    }
    return arr;
  }, []);
  const burstTRef = useRef(99);
  const burstRef = useRef<THREE.Points>(null);
  const burstMatRef = useRef<THREE.PointsMaterial>(null);

  const triggerBurst = () => {
    burstTRef.current = 0;
    for (let i = 0; i < BURST_N; i++) {
      // Spawn slightly randomized inside doorway, shoot out + up
      burstPos[i * 3]     = (Math.random() - 0.5) * 0.6;
      burstPos[i * 3 + 1] = (Math.random() - 0.5) * 1.2;
      burstPos[i * 3 + 2] = 0;
      const a = Math.random() * Math.PI * 2;
      const e = (Math.random() - 0.2) * Math.PI * 0.7;
      const sp = 4 + Math.random() * 6;
      burstVel[i * 3]     = Math.cos(e) * Math.cos(a) * sp;
      burstVel[i * 3 + 1] = Math.sin(e) * sp + 1.5;
      burstVel[i * 3 + 2] = Math.cos(e) * Math.sin(a) * sp;
    }
  };

  useFrame((_, dt) => {
    // ── Distance to door midpoint
    const dx = PLAYER_POS.x - (-32);
    const dz = PLAYER_POS.z - (-17);
    const dist = Math.sqrt(dx * dx + dz * dz);
    const wantOpen = dist < 7;

    if (wantOpen !== isOpenRef.current) {
      isOpenRef.current = wantOpen;
      if (wantOpen) playDoorCreak();
    }

    // ── Animate door rotation (smoothed lerp)
    const targetLeft  = isOpenRef.current ?  Math.PI / 2.2 : 0;
    const targetRight = isOpenRef.current ? -Math.PI / 2.2 : 0;
    if (leftRef.current)  leftRef.current.rotation.y  += (targetLeft  - leftRef.current.rotation.y)  * 0.06;
    if (rightRef.current) rightRef.current.rotation.y += (targetRight - rightRef.current.rotation.y) * 0.06;

    // ── Glow intensity follows door openness (0..1 based on left door angle)
    if (glowMatRef.current && leftRef.current) {
      const openness = leftRef.current.rotation.y / (Math.PI / 2.2);
      glowMatRef.current.opacity = 0.18 + openness * 0.55;
    }

    // ── Threshold crossing — trigger burst when player walks through
    const z = PLAYER_POS.z;
    const x = PLAYER_POS.x;
    if (lastZRef.current > -17 && z <= -17 && x > -36 && x < -28) {
      triggerBurst();
    }
    lastZRef.current = z;

    // ── Update burst particles
    if (burstTRef.current < 1.6 && burstRef.current && burstMatRef.current) {
      burstTRef.current += dt;
      const tt = burstTRef.current;
      for (let i = 0; i < BURST_N; i++) {
        burstPos[i * 3]     += burstVel[i * 3]     * dt;
        burstPos[i * 3 + 1] += burstVel[i * 3 + 1] * dt;
        burstPos[i * 3 + 2] += burstVel[i * 3 + 2] * dt;
        burstVel[i * 3 + 1] -= dt * 8; // gravity
      }
      burstRef.current.geometry.attributes.position.needsUpdate = true;
      burstMatRef.current.opacity = Math.max(0, 1 - tt / 1.6);
    } else if (burstMatRef.current && burstMatRef.current.opacity > 0) {
      burstMatRef.current.opacity = 0;
    }
  });

  return (
    <group position={[-32, 0, -17]}>
      {/* ── Glow plane behind doors (intensifies as they open) */}
      <mesh position={[0, 3.8, -0.25]}>
        <planeGeometry args={[7.2, 7.6]} />
        <meshBasicMaterial
          ref={glowMatRef}
          color="#ffaa44"
          transparent
          opacity={0.18}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
          fog={false}
        />
      </mesh>

      {/* ── Left door — hinge at x = -4 */}
      <group ref={leftRef} position={[-4, 0, 0]}>
        {/* Door panel */}
        <mesh position={[2, 3.3, 0]} castShadow>
          <boxGeometry args={[4, 6.6, 0.18]} />
          <meshLambertMaterial color="#2a1810" />
        </mesh>
        {/* Inset wood grain panel */}
        <mesh position={[2, 3.3, 0.10]}>
          <planeGeometry args={[3.2, 5.4]} />
          <meshBasicMaterial color="#1a0c06" fog />
        </mesh>
        {/* Iron studs */}
        {[0.6, 2.5, 4.4].map((y, i) => (
          <mesh key={i} position={[3.4, y, 0.11]}>
            <sphereGeometry args={[0.10, 8, 8]} />
            <meshLambertMaterial color="#3a2818" />
          </mesh>
        ))}
        {/* Iron handle */}
        <mesh position={[3.7, 3.3, 0.13]}>
          <sphereGeometry args={[0.13, 12, 12]} />
          <meshLambertMaterial color="#3a2818" />
        </mesh>
      </group>

      {/* ── Right door — hinge at x = +4 (mirror of left) */}
      <group ref={rightRef} position={[4, 0, 0]}>
        <mesh position={[-2, 3.3, 0]} castShadow>
          <boxGeometry args={[4, 6.6, 0.18]} />
          <meshLambertMaterial color="#2a1810" />
        </mesh>
        <mesh position={[-2, 3.3, 0.10]}>
          <planeGeometry args={[3.2, 5.4]} />
          <meshBasicMaterial color="#1a0c06" fog />
        </mesh>
        {[0.6, 2.5, 4.4].map((y, i) => (
          <mesh key={i} position={[-3.4, y, 0.11]}>
            <sphereGeometry args={[0.10, 8, 8]} />
            <meshLambertMaterial color="#3a2818" />
          </mesh>
        ))}
        <mesh position={[-3.7, 3.3, 0.13]}>
          <sphereGeometry args={[0.13, 12, 12]} />
          <meshLambertMaterial color="#3a2818" />
        </mesh>
      </group>

      {/* ── Particle burst (anchored at doorway midpoint) */}
      <points ref={burstRef} position={[0, 4, 0]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[burstPos, 3]} />
          <bufferAttribute attach="attributes-color"    args={[burstColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={burstMatRef}
          vertexColors
          size={0.42}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
          fog={false}
          toneMapped={false}
        />
      </points>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * PALMS · VISITORS · ALTAR · EMBERS  (refined for dusk palette)
 * ═══════════════════════════════════════════════════════════════════════════ */
function PalmTree({
  position,
  scale = 1,
  rotationY = 0,
  variant = 0,
}: {
  position: [number, number, number];
  scale?: number;
  rotationY?: number;
  variant?: 0 | 1 | 2;
}) {
  // Wind sway — gentle group rotation with phase offset per tree
  const swayRef = useRef<THREE.Group>(null);
  const phase = useMemo(() => position[0] * 0.13 + position[2] * 0.17, [position]);
  useFrame(({ clock }) => {
    if (!swayRef.current) return;
    const t = clock.elapsedTime;
    swayRef.current.rotation.z = Math.sin(t * 0.8 + phase) * 0.025;
    swayRef.current.rotation.x = Math.sin(t * 0.6 + phase * 1.3) * 0.018;
  });
  // 3 frond-color variants pulled from the palette family
  const frondColor =
    variant === 0 ? PALETTE.foliage :
    variant === 1 ? "#2a3a18" :
    "#4a5a30";
  return (
    <group ref={swayRef} position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <mesh position={[0, 4.5, 0]}>
        <cylinderGeometry args={[0.28, 0.45, 9, 8]} />
        <meshLambertMaterial color="#4a3220" />
      </mesh>
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 1.6, 9.2, Math.sin(a) * 1.6]} rotation={[Math.PI / 2.6, a, 0]}>
            <coneGeometry args={[0.55, 3.6, 4, 1, true]} />
            <meshLambertMaterial color={frondColor} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
      <mesh position={[0, 9.0, 0]}>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshLambertMaterial color="#1e3214" />
      </mesh>
    </group>
  );
}

/* ─── DUST MOTES — tiny camera-relative particles for atmospheric depth */
function DustMotes({ count = 80 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const { camera } = useThree();
  const { positions, vels } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const vels = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 22;
      positions[i * 3 + 1] = Math.random() * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 22;
      vels[i * 3]     = (Math.random() - 0.5) * 0.2;
      vels[i * 3 + 1] = 0.2 + Math.random() * 0.4;
      vels[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
    }
    return { positions, vels };
  }, [count]);

  useFrame((_, dt) => {
    if (!ref.current) return;
    // Keep mote field anchored loosely around the camera so motes always read
    ref.current.position.x = camera.position.x;
    ref.current.position.z = camera.position.z;

    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3]     += vels[i * 3] * dt;
      arr[i * 3 + 1] += vels[i * 3 + 1] * dt;
      arr[i * 3 + 2] += vels[i * 3 + 2] * dt;
      // Wrap inside a small box around the player
      if (arr[i * 3 + 1] > 8) arr[i * 3 + 1] = 0;
      if (arr[i * 3]     >  11) arr[i * 3]     = -11;
      if (arr[i * 3]     < -11) arr[i * 3]     =  11;
      if (arr[i * 3 + 2] >  11) arr[i * 3 + 2] = -11;
      if (arr[i * 3 + 2] < -11) arr[i * 3 + 2] =  11;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={PALETTE.cream}
        size={0.04}
        transparent
        opacity={0.45}
        depthWrite={false}
        sizeAttenuation
        fog
      />
    </points>
  );
}

function PalmGrove() {
  const trees = useMemo(() => {
    let s = 4242;
    const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return (s >>> 0) / 0xffffffff; };
    const arr: { pos: [number, number, number]; scale: number; rotationY: number; variant: 0 | 1 | 2 }[] = [];
    for (let i = 0; i < 14; i++) {
      const sideSign = i % 2 === 0 ? -1 : 1;
      const z = 60 - (i >> 1) * 8;
      arr.push({
        pos: [sideSign * (12 + rand() * 3), 0, z],
        scale: 0.7 + rand() * 0.7,                  // wider scale spread (0.7..1.4)
        rotationY: rand() * Math.PI * 2,           // each tree faces a different way
        variant: Math.floor(rand() * 3) as 0 | 1 | 2,
      });
    }
    for (let i = 0; i < 22; i++) {
      const a = rand() * Math.PI * 2;
      const r = 42 + rand() * 60;
      arr.push({
        pos: [Math.cos(a) * r, 0, Math.sin(a) * r - 30],
        scale: 0.65 + rand() * 0.85,               // (0.65..1.5)
        rotationY: rand() * Math.PI * 2,
        variant: Math.floor(rand() * 3) as 0 | 1 | 2,
      });
    }
    return arr;
  }, []);
  return (
    <group>
      {trees.map((t, i) => (
        <PalmTree key={i} position={t.pos} scale={t.scale} rotationY={t.rotationY} variant={t.variant} />
      ))}
    </group>
  );
}

function Person({
  origin,
  color = "#c84028",
  offset = 0,
  radius = 4,
  speed = 0.4,
}: {
  origin: [number, number, number];
  color?: string;
  offset?: number;
  radius?: number;
  speed?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime * speed + offset;
    groupRef.current.position.x = origin[0] + Math.sin(t) * radius;
    groupRef.current.position.z = origin[2] + Math.cos(t) * radius;
    groupRef.current.rotation.y = -t + Math.PI / 2;
    if (torsoRef.current) torsoRef.current.position.y = 0.7 + Math.sin(t * 4) * 0.04;
  });
  return (
    <group ref={groupRef} position={origin}>
      <mesh ref={torsoRef} position={[0, 0.7, 0]}>
        <capsuleGeometry args={[0.28, 0.9, 4, 10]} />
        <meshLambertMaterial color={color} />
      </mesh>
      <mesh position={[0, 1.55, 0]}>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshLambertMaterial color="#d8b894" />
      </mesh>
    </group>
  );
}

function Visitors() {
  // All robes pulled toward the disciplined palette — burnt clay, moss, stone, cream.
  // The first visitor wears the brand orange — "Master of the Order" easter egg.
  return (
    <>
      <Person origin={[ -2, 0,  10]} color="#ff6a00" offset={0.0} radius={2.5} speed={0.22} />
      <Person origin={[ 12, 0,  16]} color="#5a4838" offset={1.2} radius={4}   speed={0.45} />
      <Person origin={[ -6, 0,  28]} color="#a06840" offset={2.4} radius={3}   speed={0.5} />
      <Person origin={[ 16, 0,  34]} color="#3e3a52" offset={3.6} radius={5}   speed={0.35} />
      <Person origin={[-14, 0,  18]} color="#7a3a28" offset={4.8} radius={5}   speed={0.30} />
      <Person origin={[ 18, 0,  -4]} color="#c8a878" offset={6.0} radius={4}   speed={0.4} />
    </>
  );
}

function Altar() {
  const ringRef = useRef<THREE.Mesh>(null);
  const orbitRef = useRef<THREE.Group>(null);
  const pillarRef = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ringRef.current) ringRef.current.rotation.z = t * 0.4;
    if (orbitRef.current) orbitRef.current.rotation.y = -t * 0.6;
    // Pulse the spell circle's alpha
    if (pillarRef.current) {
      pillarRef.current.opacity = 0.4 + Math.sin(t * 2) * 0.18;
    }
  });
  return (
    <group position={[0, 0.05, 8]}>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[2.6, 2.8, 0.3, 32]} />
        <meshLambertMaterial color="#5a4028" />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[2.0, 2.2, 0.2, 32]} />
        <meshLambertMaterial color="#6a4e34" />
      </mesh>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.55, 0]}>
        <torusGeometry args={[1.7, 0.06, 8, 48]} />
        <meshBasicMaterial color="#ff7a18" toneMapped={false} fog={false} />
      </mesh>
      <group ref={orbitRef} position={[0, 0.9, 0]}>
        {[0, 1, 2, 3].map((i) => {
          const a = (i / 4) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 1.7, 0, Math.sin(a) * 1.7]}>
              <sphereGeometry args={[0.13, 12, 12]} />
              <meshBasicMaterial color="#ffc040" toneMapped={false} fog={false} />
            </mesh>
          );
        })}
      </group>
      <mesh position={[0, 4, 0]}>
        <cylinderGeometry args={[0.18, 0.05, 8, 8, 1, true]} />
        <meshBasicMaterial ref={pillarRef} color="#ffaa44" transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} fog={false} />
      </mesh>
    </group>
  );
}

function FloatingEmbers({ count = 600 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const { positions, colors, vels } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const vels = new Float32Array(count);
    const palette: [number, number, number][] = [
      [1.0, 0.85, 0.35],
      [1.0, 0.55, 0.20],
      [1.0, 0.30, 0.10],
      [1.0, 0.75, 0.40],
    ];
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = Math.random() * 15;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100 - 10;
      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = c[0]; colors[i * 3 + 1] = c[1]; colors[i * 3 + 2] = c[2];
      vels[i] = 0.3 + Math.random() * 0.9;
    }
    return { positions, colors, vels };
  }, [count]);
  useFrame((_, dt) => {
    if (!ref.current) return;
    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += vels[i] * dt;
      if (arr[i * 3 + 1] > 25) {
        arr[i * 3] = (Math.random() - 0.5) * 100;
        arr[i * 3 + 1] = 0;
        arr[i * 3 + 2] = (Math.random() - 0.5) * 100 - 10;
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial vertexColors size={0.13} transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
    </points>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * LIGHTING — golden hour
 * ═══════════════════════════════════════════════════════════════════════════ */
function GoldenHourLight() {
  return (
    <>
      {/* Hemisphere replaces ambient — warm sun-side, deep purple shadow-side */}
      <hemisphereLight args={["#ff9966", "#1a1030", 0.55]} />
      {/* Sun — slightly off-axis behind the temple → long shadows reach toward the player */}
      <directionalLight
        position={[18, 28, -110]}
        intensity={2.2}
        color="#ffaa66"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={180}
        shadow-camera-left={-70}
        shadow-camera-right={70}
        shadow-camera-top={70}
        shadow-camera-bottom={-70}
        shadow-bias={-0.0005}
      />
      {/* A subtle warm fill from camera-side so silhouettes don't go fully black */}
      <directionalLight position={[0, 8, 60]} intensity={0.35} color="#ffcc88" />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * PLAYER MOVEMENT — WASD + bounds + write to PLAYER_POS
 * ═══════════════════════════════════════════════════════════════════════════ */
function PlayerMovement() {
  const { camera } = useThree();
  const keys = useRef<Set<string>>(new Set());
  const velY = useRef(0);
  const onGround = useRef(true);

  useEffect(() => {
    camera.position.set(0, 1.7, 50);
    camera.rotation.order = "YXZ";
    const onDown = (e: KeyboardEvent) => {
      keys.current.add(e.code);
      // Interact — press E to strike gong if within range
      if (e.code === "KeyE") {
        const dx = PLAYER_POS.x - (-15);
        const dz = PLAYER_POS.z - 12;
        if (Math.sqrt(dx * dx + dz * dz) < 5) strikeGong?.();
      }
      // Jump — Space, only when grounded
      if (e.code === "Space" && onGround.current) {
        velY.current = 8.5;
        onGround.current = false;
        e.preventDefault?.();
      }
    };
    const onUp = (e: KeyboardEvent) => keys.current.delete(e.code);
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [camera]);

  useFrame((_, dt) => {
    const sprint = keys.current.has("ShiftLeft") || keys.current.has("ShiftRight");
    const speed = (sprint ? 12 : 7) * dt;

    // Camera-relative horizontal basis (yaw only — exclude pitch by zeroing y)
    camera.getWorldDirection(_forward);
    _forward.y = 0;
    if (_forward.lengthSq() > 0) _forward.normalize();
    _right.crossVectors(_forward, camera.up).normalize();

    // Build axis intent in [-1, 1]
    let mvF = 0, mvR = 0;
    if (keys.current.has("KeyW") || keys.current.has("ArrowUp"))    mvF += 1;
    if (keys.current.has("KeyS") || keys.current.has("ArrowDown"))  mvF -= 1;
    if (keys.current.has("KeyD") || keys.current.has("ArrowRight")) mvR += 1;
    if (keys.current.has("KeyA") || keys.current.has("ArrowLeft"))  mvR -= 1;

    // Normalize so diagonal movement isn't √2× faster
    const inLen = Math.sqrt(mvF * mvF + mvR * mvR);
    if (inLen > 0) { mvF /= inLen; mvR /= inLen; }

    // Cast rays from chest height (camera y - 0.8) so we hit walls + waist props
    _origin.copy(camera.position);
    _origin.y += COLLIDE_RAY_Y_OFFSET;

    if (mvF !== 0) {
      _dir.copy(_forward).multiplyScalar(Math.sign(mvF));
      if (isBlocked(_origin, _dir)) mvF = 0;
    }
    if (mvR !== 0) {
      _dir.copy(_right).multiplyScalar(Math.sign(mvR));
      if (isBlocked(_origin, _dir)) mvR = 0;
    }

    // Apply surviving horizontal movement
    if (mvF !== 0) {
      camera.position.x += _forward.x * mvF * speed;
      camera.position.z += _forward.z * mvF * speed;
    }
    if (mvR !== 0) {
      camera.position.x += _right.x * mvR * speed;
      camera.position.z += _right.z * mvR * speed;
    }

    // ── Vertical: gravity + ground snap (jumping support)
    velY.current -= 25 * dt;
    camera.position.y += velY.current * dt;

    const groundLevel = 1.7; // flat-ground eye height
    if (camera.position.y <= groundLevel) {
      camera.position.y = groundLevel;
      velY.current = 0;
      onGround.current = true;
    } else {
      onGround.current = false;
    }

    // Outer void bounds (failsafe in case you walk off the edge of the world)
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -55, 50);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -55, 80);

    PLAYER_POS.copy(camera.position);
  });

  return null;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * SCENE WRAPPER
 * ═══════════════════════════════════════════════════════════════════════════ */
function Scene() {
  return (
    <>
      <Sky />
      <Sun />
      <Moon />
      <Birds />
      <Aurora />
      <Mountains />
      <Clouds />
      <GoldenHourLight />
      <Ground />
      <GroundMist />

      {/* ── Collidable architecture (player can't walk through these) ── */}
      <Collider><Torii /></Collider>
      <Collider><PathLanterns /></Collider>
      <Collider><SparringPosts /></Collider>
      <Collider><Gong /></Collider>
      <Collider>
        <FooDog position={[-4, 0, -8]} mirror={false} />
        <FooDog position={[ 4, 0, -8]} mirror={true} />
      </Collider>
      <Collider><Temple /></Collider>
      <Collider><SanctumHall /></Collider>

      {/* ── Decorative / pass-through (still render, no collision) ── */}
      <PrayerFlags />
      <TrainingCircles />
      <ReflectingPool />
      <SanctumPortal />
      <PalmGrove />

      {/* ── Magical / personalization layer ── */}
      <FloatingFragments />
      <GroundSigil position={[0, 0.05, 56]} scale={0.9} />
      <GroundSigil position={[0, 0.05, 30]} scale={0.7} />
      <GroundSigil position={[0, 0.05, -2]} scale={0.85} />
      <VintazkTablet />
      <Visitors />
      <Altar />
      <FloatingEmbers count={500} />
      <DustMotes count={90} />
      <PlayerMovement />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * HUD — landmark tooltip outside Canvas (reads PLAYER_POS each frame via rAF)
 * ═══════════════════════════════════════════════════════════════════════════ */
function LandmarkHud() {
  const [active, setActive] = useState<Landmark | null>(null);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      let nearest: Landmark | null = null;
      let nearestDist = Infinity;
      for (const lm of LANDMARKS) {
        const dx = PLAYER_POS.x - lm.pos[0];
        const dz = PLAYER_POS.z - lm.pos[2];
        const d = Math.sqrt(dx * dx + dz * dz);
        if (d < lm.radius && d < nearestDist) {
          nearest = lm;
          nearestDist = d;
        }
      }
      setActive((prev) => (prev?.id === nearest?.id ? prev : nearest));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!active) return null;
  return (
    <div className="fixed left-1/2 bottom-24 -translate-x-1/2 z-[60] pointer-events-none">
      <div className="px-5 py-3 rounded-lg bg-black/60 backdrop-blur-md border border-white/15 text-center text-white max-w-md">
        <div className="text-[9.5px] font-mono tracking-[0.32em] uppercase text-[#ffb070] mb-1">
          {active.name}
        </div>
        <div className="text-sm text-white/80" style={{ fontFamily: "var(--font-serif), 'Cormorant Garamond', serif" }}>
          {active.hint}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * ROOT EXPORT
 * ═══════════════════════════════════════════════════════════════════════════ */
export default function World() {
  const [revealed, setRevealed] = useState(false);
  const [locked, setLocked] = useState(false);
  const [muted, setMutedState] = useState(false);
  const toggleMute = () => {
    const next = !muted;
    setMutedState(next);
    setMuted(next);
  };

  useEffect(() => {
    const mainEl = document.querySelector<HTMLElement>("main");
    if (mainEl) {
      mainEl.style.transition = "";
      mainEl.style.transform = "";
      mainEl.style.filter = "";
      mainEl.style.opacity = "";
      mainEl.style.transformOrigin = "";
      mainEl.style.willChange = "";
    }
    const t = setTimeout(() => setRevealed(true), 350);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-[#1a0a18] z-0">
        <Canvas
          shadows={{ type: THREE.PCFSoftShadowMap }}
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.1,
            outputColorSpace: THREE.SRGBColorSpace,
          }}
          camera={{ position: [0, 1.7, 50], fov: 65, near: 0.1, far: 800 }}
          dpr={[1, 1.7]}
        >
          <color attach="background" args={["#1a0a18"]} />
          {/* Warm dark fog — exponential falloff bakes the dimensional dusk in */}
          <fogExp2 attach="fog" args={["#2a1810", 0.015]} />
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
          <PointerLockControls
            onLock={() => {
              setLocked(true);
              startAmbientLoop();
            }}
            onUnlock={() => setLocked(false)}
          />
          <EffectComposer>
            {/* Subtle bloom — only the brightest highlights bleed */}
            <Bloom intensity={1.05} luminanceThreshold={0.78} luminanceSmoothing={0.3} mipmapBlur />
            {/* Painterly grain — kills the plastic CG look */}
            <Noise opacity={0.06} blendFunction={BlendFunction.OVERLAY} premultiply />
            <Vignette eskil={false} offset={0.16} darkness={0.6} />
          </EffectComposer>
        </Canvas>
      </div>

      {!locked && revealed && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
          <div className="px-8 py-6 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white text-center shadow-2xl">
            <div className="text-[10px] font-mono tracking-[0.4em] uppercase text-[#ffb070] mb-2">
              Kamar-Taj · Golden Hour
            </div>
            <div className="text-2xl sm:text-3xl mb-3" style={{ fontFamily: "var(--font-serif), 'Cormorant Garamond', serif", fontWeight: 300 }}>
              Click to enter the Sanctum
            </div>
            <div className="text-[10.5px] font-mono text-white/60 tracking-[0.22em] uppercase">WASD · walk &nbsp;·&nbsp; Mouse · look</div>
            <div className="text-[10.5px] font-mono text-white/60 tracking-[0.22em] uppercase">Space · jump &nbsp;·&nbsp; Shift · run</div>
            <div className="text-[10.5px] font-mono text-white/60 tracking-[0.22em] uppercase">E · interact &nbsp;·&nbsp; Esc · release</div>
          </div>
        </div>
      )}

      {locked && (
        <>
          <div className="fixed inset-0 z-[55] flex items-center justify-center pointer-events-none">
            <div className="w-1 h-1 rounded-full bg-white/55" />
          </div>
          <div className="fixed bottom-5 left-5 z-[60] text-[10px] font-mono text-white/55 tracking-[0.22em] uppercase pointer-events-none">
            <div>WASD · walk</div>
            <div>SPACE · jump</div>
            <div>SHIFT · run</div>
            <div>E · interact</div>
            <div>ESC · release</div>
          </div>
          <div className="fixed bottom-5 right-5 z-[60] text-right text-[10px] font-mono text-white/45 tracking-[0.32em] uppercase pointer-events-none">
            <div className="text-[#ffb070]">Kamar-Taj</div>
            <div>Eastern Courtyard · Sunset</div>
          </div>
          <LandmarkHud />
        </>
      )}

      <Link
        href="/"
        className="fixed top-5 left-5 z-[70] text-white/60 hover:text-white text-[11px] font-mono tracking-[0.32em] uppercase transition-colors duration-300"
      >
        ← Return
      </Link>

      {/* Mute toggle — top-right */}
      <button
        onClick={toggleMute}
        aria-label={muted ? "Unmute" : "Mute"}
        className="fixed top-5 right-5 z-[70] w-9 h-9 rounded-full bg-black/55 backdrop-blur border border-white/15 flex items-center justify-center text-white/75 hover:text-white hover:bg-black/75 transition-colors"
      >
        {muted ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5 6 9H2v6h4l5 4z" />
            <path d="m22 9-6 6M16 9l6 6" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5 6 9H2v6h4l5 4z" />
            <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" />
          </svg>
        )}
      </button>

      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 65,
          background: "radial-gradient(ellipse at center, #ffffff 0%, #ffd27a 22%, #ff6a00 52%, #4a0a00 88%, #000 100%)",
          opacity: revealed ? 0 : 1,
          transition: "opacity 2.4s cubic-bezier(0.4, 0, 0.6, 1)",
        }}
      />
    </>
  );
}
