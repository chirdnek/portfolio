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
import { PointerLockControls, useTexture } from "@react-three/drei";
import { EffectComposer, Vignette, Bloom, Noise } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";

import { PALETTE, LANDMARKS, type Landmark } from "./world/constants";
import {
  PLAYER_POS,
  FLY_STATE,
  setFly,
  subscribeFly,
  gongStrike,
  setSpellActive,
  useSpellActive,
} from "./world/state";
import {
  ensureAudioCtx,
  startAmbientLoop,
  playDistantBell,
  setMuted,
  playDoorCreak,
  playGongSynth,
} from "./world/audio";

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
// Bumped from 0.6 → 1.0 so fast/sprint movement (up to ~0.4 units/frame at 30fps)
// can't clip through a wall between collision checks.
const COLLISION_DIST = 1.0;
const COLLIDE_RAY_Y_OFFSET = -0.8;  // cast from chest height (camera y - 0.8)
const STEP_UP_MAX = 1.3;            // climb anything <= 1.3 units (1 stair = 1.015)
const _ray = new THREE.Raycaster();
_ray.far = COLLISION_DIST + 0.05;
const _groundRay = new THREE.Raycaster(); // separate ray for vertical (ground/step-up) probes
_groundRay.far = 14;
const _origin    = new THREE.Vector3();
const _dir       = new THREE.Vector3();
const _forward   = new THREE.Vector3();
const _right     = new THREE.Vector3();
const _stepProbe = new THREE.Vector3();
const _down      = new THREE.Vector3(0, -1, 0);

function isBlocked(origin: THREE.Vector3, dir: THREE.Vector3): boolean {
  _ray.set(origin, dir);
  const hits = _ray.intersectObjects(COLLIDABLES, false);
  return hits.length > 0;
}

/* Probe straight down from a point ahead of the player to find a steppable
   surface. Returns the new camera y if the obstacle is short enough to climb,
   else null. */
function tryStepUp(camY: number, camX: number, camZ: number, dirX: number, dirZ: number): number | null {
  _stepProbe.set(camX + dirX * 0.7, (camY - 1.7) + STEP_UP_MAX + 0.2, camZ + dirZ * 0.7);
  _groundRay.set(_stepProbe, _down);
  _groundRay.far = STEP_UP_MAX + 0.5;
  const hits = _groundRay.intersectObjects(COLLIDABLES, false);
  _groundRay.far = 14;
  if (hits.length === 0) return null;
  const stepTop = hits[0].point.y;
  const currentFootY = camY - 1.7;
  const stepHeight = stepTop - currentFootY;
  if (stepHeight > 0 && stepHeight < STEP_UP_MAX) return stepTop + 1.7;
  return null;
}
/* ═══════════════════════════════════════════════════════════════════════════
 * INTERACTION MANAGER — raycast hover + clickable / E-pressable objects
 *
 * API surface (drop-in <Interactable> wrapper):
 *
 *   <Interactable input="click" label="Ring the gong" onInteract={fn}>
 *     <Gong />
 *   </Interactable>
 *
 * Reuses _ray + _interactDir + cached mesh array (rebuilt only when the
 * registry mutates). Throttled to 30 Hz. Tracks hover state via a
 * subscriber pattern so the HUD prompt can react without polling.
 * ═══════════════════════════════════════════════════════════════════════════ */
type InteractionInput = "click" | "e" | "f";

type InteractionConfig = {
  id: string;
  label: string;
  input: InteractionInput;
  onInteract: () => void;
  cooldown: number;
};

const INTERACTABLES = new Map<THREE.Object3D, InteractionConfig>();
let _interactCache: THREE.Object3D[] = [];
const _triggerTimes = new Map<string, number>();
const MAX_INTERACT_DISTANCE = 4.5;

const _activeInteractable: { current: InteractionConfig | null } = { current: null };
const _activeListeners = new Set<(c: InteractionConfig | null) => void>();
let _dialogOpen = false;

function _setActive(config: InteractionConfig | null) {
  if (_activeInteractable.current?.id === config?.id) return;
  _activeInteractable.current = config;
  _activeListeners.forEach((fn) => fn(config));
}

function _rebuildInteractCache() {
  _interactCache = Array.from(INTERACTABLES.keys());
}

function tryTriggerActive(input: InteractionInput) {
  if (_dialogOpen) return;
  const config = _activeInteractable.current;
  if (!config || config.input !== input) return;
  const now = performance.now();
  const last = _triggerTimes.get(config.id) ?? 0;
  if (now - last < config.cooldown) return;
  _triggerTimes.set(config.id, now);
  config.onInteract();
}

function useActiveInteractable() {
  const [active, setActiveState] = useState<InteractionConfig | null>(null);
  useEffect(() => {
    const fn = (c: InteractionConfig | null) => setActiveState(c);
    _activeListeners.add(fn);
    fn(_activeInteractable.current);
    return () => { _activeListeners.delete(fn); };
  }, []);
  return active;
}

/* ─── DIALOGUE PANEL state — module-scoped open/close API */
type DialogueContent = { title: string; body: string; sub?: string; image?: string; liveUrl?: string };
let _showDialogue: ((c: DialogueContent | null) => void) | null = null;

function openDialogue(content: DialogueContent) {
  _dialogOpen = true;
  if (typeof document !== "undefined") document.exitPointerLock?.();
  _showDialogue?.(content);
}
function closeDialogue() {
  _dialogOpen = false;
  _showDialogue?.(null);
}

/* ─── <Interactable> — registers all child meshes for one config */
let _interactableUid = 0;
function Interactable({
  label,
  input = "click",
  onInteract,
  cooldown = 700,
  children,
}: {
  label: string;
  input?: InteractionInput;
  onInteract: () => void;
  cooldown?: number;
  children: React.ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  const cb = useRef(onInteract);
  cb.current = onInteract;

  useEffect(() => {
    const g = ref.current;
    if (!g) return;
    const config: InteractionConfig = {
      id: `int-${++_interactableUid}`,
      label,
      input,
      cooldown,
      onInteract: () => cb.current(),
    };
    const added: THREE.Object3D[] = [];
    g.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        INTERACTABLES.set(obj, config);
        added.push(obj);
      }
    });
    _rebuildInteractCache();
    return () => {
      added.forEach((o) => INTERACTABLES.delete(o));
      _rebuildInteractCache();
      if (_activeInteractable.current?.id === config.id) _setActive(null);
    };
  }, [label, input, cooldown]);

  return <group ref={ref}>{children}</group>;
}

/* ─── <InteractionSystem> — one raycast per 2 frames, central */
const _interactRay = new THREE.Raycaster();
_interactRay.far = MAX_INTERACT_DISTANCE;
const _interactDir = new THREE.Vector3();

function InteractionSystem() {
  const { camera } = useThree();
  const tickRef = useRef(0);

  useFrame(() => {
    tickRef.current = (tickRef.current + 1) % 2; // 30 Hz at 60 fps
    if (tickRef.current !== 0) return;

    if (_interactCache.length === 0) {
      if (_activeInteractable.current) _setActive(null);
      return;
    }
    camera.getWorldDirection(_interactDir);
    _interactRay.set(camera.position, _interactDir);
    _interactRay.far = MAX_INTERACT_DISTANCE;
    const hits = _interactRay.intersectObjects(_interactCache, false);
    if (hits.length > 0) {
      const config = INTERACTABLES.get(hits[0].object);
      _setActive(config ?? null);
    } else {
      _setActive(null);
    }
  });

  useEffect(() => {
    const onClick = () => tryTriggerActive("click");
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "KeyE") tryTriggerActive("e");
      if (e.code === "KeyF") tryTriggerActive("f");
      if (e.code === "Escape" && _dialogOpen) {
        closeDialogue();
      }
    };
    window.addEventListener("click", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return null;
}

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
  // Load the puff PNG once and reuse on every cloud sprite
  const tex = useTexture("/images/clouds.png");
  useEffect(() => {
    if (tex) {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      tex.needsUpdate = true;
    }
  }, [tex]);

  const clouds = useMemo(() => {
    let s = 9182;
    const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return (s >>> 0) / 0xffffffff; };
    // Warm-side clouds (closer to sun) get cream tint, others get cooler dusty rose
    return Array.from({ length: 22 }, () => {
      const x = (rand() - 0.5) * 320;
      const sunSide = x > 0; // sun is at +X-ish
      return {
        pos: [x, 50 + rand() * 55, (rand() - 0.5) * 300 - 70] as [number, number, number],
        scaleX: 18 + rand() * 30,
        scaleY: 9 + rand() * 14,
        alpha: 0.55 + rand() * 0.35,
        speed: 0.08 + rand() * 0.14,
        tint: sunSide
          ? (rand() > 0.4 ? "#ffe2b8" : "#ffd0a0")
          : (rand() > 0.4 ? "#e8b89c" : "#d8a08c"),
      };
    });
  }, []);

  const groupRef = useRef<THREE.Group>(null);
  const tickRef = useRef(0);
  const dtAccRef = useRef(0);
  useFrame((_, dt) => {
    dtAccRef.current += dt;
    if ((++tickRef.current & 1) !== 0) return; // throttle: every other frame
    const effDt = dtAccRef.current;
    dtAccRef.current = 0;
    if (!groupRef.current) return;
    groupRef.current.children.forEach((c, i) => {
      c.position.x += clouds[i].speed * effDt;
      if (c.position.x > 220) c.position.x = -220;
    });
  });

  return (
    <group ref={groupRef}>
      {clouds.map((c, i) => (
        <sprite
          key={i}
          position={c.pos}
          scale={[c.scaleX, c.scaleY, 1]}
        >
          <spriteMaterial
            map={tex}
            color={c.tint}
            transparent
            opacity={c.alpha}
            depthWrite={false}
            fog={false}
            toneMapped={false}
          />
        </sprite>
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
  const birdTickRef = useRef(0);
  const birdDtAccRef = useRef(0);

  useFrame((_, dt) => {
    birdDtAccRef.current += dt;
    if ((++birdTickRef.current & 1) !== 0) return; // throttle: every other frame
    const effDt = birdDtAccRef.current;
    birdDtAccRef.current = 0;
    const t = performance.now() / 1000;
    data.forEach((b, i) => {
      const g = refs.current[i];
      if (!g) return;
      g.position.x += b.speed * effDt;
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
  const spellActive = useSpellActive();
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
  // Smooth fade in/out tied to spell state
  const fadeRef = useRef(1);
  const auroraTickRef = useRef(0);
  const auroraDtAccRef = useRef(0);
  useFrame((_, dt) => {
    auroraDtAccRef.current += dt;
    if ((++auroraTickRef.current & 1) !== 0) return; // throttle: every other frame
    const effDt = auroraDtAccRef.current;
    auroraDtAccRef.current = 0;
    const target = spellActive ? 1 : 0;
    fadeRef.current += (target - fadeRef.current) * Math.min(1, 2 * effDt);
    const t = performance.now() / 1000;
    bands.forEach((b, i) => {
      const m = refs.current[i];
      const mat = matRefs.current[i];
      if (m) m.rotation.y = t * b.speed;
      if (mat) {
        const base = b.opacity + Math.sin(t * 0.4 + b.phase) * 0.06;
        mat.opacity = base * fadeRef.current;
      }
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
  const flagTickRef = useRef(0);
  useFrame(({ clock }) => {
    if ((++flagTickRef.current & 1) !== 0) return; // throttle: every other frame
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
    gongStrike.fn = () => {
      strikeT.current = 0;
      playGongSynth();
    };
    return () => { gongStrike.fn = null; };
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
      {/* Gong disc — wobbles after strike. Click is handled by InteractionSystem. */}
      <mesh ref={discRef} position={[0, 1.9, 0]}>
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
  // Warm-stone shaft → verdigris copper roof cap → patinated bronze finial bulb
  return (
    <group position={position}>
      {/* Stepped base — three diminishing pads (deep umber → ochre) */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[radius * 2.4, 0.6, radius * 2.4]} />
        <meshLambertMaterial color="#5a4128" />
      </mesh>
      <mesh position={[0, 0.85, 0]} castShadow>
        <boxGeometry args={[radius * 2.0, 0.5, radius * 2.0]} />
        <meshLambertMaterial color="#6e5236" />
      </mesh>
      <mesh position={[0, 1.35, 0]} castShadow>
        <boxGeometry args={[radius * 1.7, 0.4, radius * 1.7]} />
        <meshLambertMaterial color="#82654a" />
      </mesh>
      {/* Tower shaft — tapered cylinder, octagonal */}
      <mesh position={[0, 1.55 + height * 0.3, 0]} castShadow>
        <cylinderGeometry args={[radius * 0.78, radius * 1.05, height * 0.6, 8]} />
        <meshLambertMaterial color="#8a6c4a" />
      </mesh>
      {/* Upper bell — narrows further */}
      <mesh position={[0, 1.55 + height * 0.7, 0]} castShadow>
        <cylinderGeometry args={[radius * 0.45, radius * 0.78, height * 0.22, 8]} />
        <meshLambertMaterial color="#9a7c5a" />
      </mesh>
      {/* Verdigris copper roof cap — replaces the cone finial */}
      <mesh position={[0, 1.55 + height * 0.92, 0]} castShadow>
        <coneGeometry args={[radius * 0.55, height * 0.22, 8]} />
        <meshLambertMaterial color="#4d9080" />
      </mesh>
      {/* Bronze finial bulb — patinated verdigris */}
      <mesh position={[0, 1.55 + height * 1.12, 0]}>
        <sphereGeometry args={[radius * 0.22, 12, 12]} />
        <meshLambertMaterial color="#5fb09a" emissive="#1a3a30" emissiveIntensity={0.18} />
      </mesh>
      {/* Tiny topknot rod */}
      <mesh position={[0, 1.55 + height * 1.22, 0]}>
        <cylinderGeometry args={[radius * 0.04, radius * 0.04, height * 0.08, 6]} />
        <meshLambertMaterial color="#3e7a6c" />
      </mesh>
    </group>
  );
}

/* ─── BRAZIER — verdigris-bronze ceremonial bowl flanking the entrance */
function Brazier({ position }: { position: [number, number, number] }) {
  const flameRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + position[0];
    const flicker = 0.85 + Math.sin(t * 9) * 0.12 + Math.sin(t * 19) * 0.06;
    if (flameRef.current) flameRef.current.scale.y = flicker;
    if (lightRef.current) lightRef.current.intensity = 0.9 + flicker * 0.5;
  });
  return (
    <group position={position}>
      {/* Stone plinth */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.7, 1.0, 8]} />
        <meshLambertMaterial color="#4a3422" />
      </mesh>
      {/* Stone shaft */}
      <mesh position={[0, 1.4, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.45, 0.8, 8]} />
        <meshLambertMaterial color="#5a4030" />
      </mesh>
      {/* Verdigris bronze bowl */}
      <mesh position={[0, 2.0, 0]} castShadow>
        <cylinderGeometry args={[0.85, 0.55, 0.45, 16]} />
        <meshLambertMaterial color="#4d9080" />
      </mesh>
      {/* Darker patinated rim */}
      <mesh position={[0, 2.25, 0]}>
        <torusGeometry args={[0.85, 0.07, 8, 16]} />
        <meshLambertMaterial color="#2e6a5c" />
      </mesh>
      {/* Hot embers in bowl */}
      <mesh position={[0, 2.18, 0]}>
        <sphereGeometry args={[0.55, 12, 12]} />
        <meshBasicMaterial color="#ff5a18" toneMapped={false} fog={false} />
      </mesh>
      {/* Flickering flame */}
      <mesh ref={flameRef} position={[0, 2.55, 0]}>
        <coneGeometry args={[0.35, 0.9, 8]} />
        <meshBasicMaterial color="#ffd070" toneMapped={false} transparent opacity={0.85} blending={THREE.AdditiveBlending} fog={false} />
      </mesh>
      {/* Warm point light */}
      <pointLight ref={lightRef} position={[0, 2.4, 0]} color="#ff8030" intensity={1.0} distance={9} decay={2} />
    </group>
  );
}

function Temple() {
  // Tier blocks — warm brown palette: deep umber → burnt sienna → sandstone → pale ochre
  const tier1 = useMemo(() => paintBox(34, 6, 34, "#5e4530", 0.20, 1), []);  // deep umber
  const tier2 = useMemo(() => paintBox(26, 4, 26, "#6e5538", 0.20, 2), []);  // burnt sienna
  const tier3 = useMemo(() => paintBox(18, 4, 18, "#82664a", 0.18, 3), []);  // sandstone
  const tier4 = useMemo(() => paintBox(10, 2, 10, "#967a5e", 0.16, 4), []);  // pale ochre
  // Cornice — darker shadow under each tier
  const cornice1 = useMemo(() => paintBox(36, 0.7, 36, "#3e2a18", 0.12, 11), []);
  const cornice2 = useMemo(() => paintBox(28, 0.6, 28, "#382616", 0.12, 12), []);
  const cornice3 = useMemo(() => paintBox(20, 0.5, 20, "#352314", 0.12, 13), []);
  const cornice4 = useMemo(() => paintBox(12, 0.4, 12, "#352314", 0.12, 14), []);
  // Frieze — thin decorative band running between tiers (slight color break)
  const frieze1 = useMemo(() => paintBox(34.5, 0.45, 34.5, "#4a3520", 0.12, 21), []);
  const frieze2 = useMemo(() => paintBox(26.5, 0.4,  26.5, "#52382a", 0.12, 22), []);
  const frieze3 = useMemo(() => paintBox(18.5, 0.35, 18.5, "#5a4030", 0.12, 23), []);
  // Niche / decorative recess (narrow vertical slits set into wall faces)
  const niche   = useMemo(() => paintBox(0.6, 2.8, 0.18, "#26180c", 0.20, 15), []);
  const stair   = useMemo(() => paintBox(6,   0.7, 1.0,  "#6e5236", 0.20, 5),  []);

  // Pediment — triangular relief above the doorway
  const pedimentGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-3, 0);
    s.lineTo(0, 1.8);
    s.lineTo(3, 0);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: false });
  }, []);

  return (
    <group position={[0, 0, -42]} scale={1.45}>
      {/* ── Tier 1 — base */}
      <mesh position={[0, 3, 0]}    geometry={tier1}   castShadow receiveShadow><meshLambertMaterial vertexColors /></mesh>
      <mesh position={[0, 6.35, 0]} geometry={cornice1} castShadow><meshLambertMaterial vertexColors /></mesh>

      {/* Niches set into tier 1 — front and back faces */}
      {[-12, -6, 6, 12].map((x, i) => (
        <mesh key={`n1f-${i}`} position={[x, 3.5, 17.1]}  geometry={niche}><meshLambertMaterial vertexColors /></mesh>
      ))}
      {[-12, -6, 6, 12].map((x, i) => (
        <mesh key={`n1b-${i}`} position={[x, 3.5, -17.1]} geometry={niche}><meshLambertMaterial vertexColors /></mesh>
      ))}
      {[-12, -6, 6, 12].map((z, i) => (
        <mesh key={`n1l-${i}`} position={[-17.1, 3.5, z]} rotation={[0, Math.PI / 2, 0]} geometry={niche}><meshLambertMaterial vertexColors /></mesh>
      ))}
      {[-12, -6, 6, 12].map((z, i) => (
        <mesh key={`n1r-${i}`} position={[ 17.1, 3.5, z]} rotation={[0, Math.PI / 2, 0]} geometry={niche}><meshLambertMaterial vertexColors /></mesh>
      ))}

      {/* ── Tier 2 */}
      <mesh position={[0, 9, 0]}     geometry={tier2}   castShadow receiveShadow><meshLambertMaterial vertexColors /></mesh>
      <mesh position={[0, 11.3, 0]}  geometry={cornice2} castShadow><meshLambertMaterial vertexColors /></mesh>

      {/* ── Tier 3 */}
      <mesh position={[0, 14, 0]}    geometry={tier3}   castShadow receiveShadow><meshLambertMaterial vertexColors /></mesh>
      <mesh position={[0, 16.25, 0]} geometry={cornice3} castShadow><meshLambertMaterial vertexColors /></mesh>

      {/* ── Tier 4 — top platform */}
      <mesh position={[0, 18, 0]}    geometry={tier4}   castShadow receiveShadow><meshLambertMaterial vertexColors /></mesh>
      <mesh position={[0, 19.2, 0]}  geometry={cornice4} castShadow><meshLambertMaterial vertexColors /></mesh>

      {/* ── Central spire — tall pinnacle on top */}
      <Spire position={[0, 19.6, 0]} height={12} radius={2.4} />

      {/* ── Tier 2 corner spires — at actual corners */}
      <Spire position={[-12, 11.6, -12]} height={5} radius={1.4} />
      <Spire position={[ 12, 11.6, -12]} height={5} radius={1.4} />
      <Spire position={[-12, 11.6,  12]} height={5} radius={1.4} />
      <Spire position={[ 12, 11.6,  12]} height={5} radius={1.4} />

      {/* ── Tier 3 cardinal-direction mid-edge spires (smaller) */}
      <Spire position={[-9, 16.55, 0]}  height={3.2} radius={1.0} />
      <Spire position={[ 9, 16.55, 0]}  height={3.2} radius={1.0} />
      <Spire position={[0, 16.55, -9]}  height={3.2} radius={1.0} />
      {/* removed front-center cardinal spire — it sat directly over the staircase */}

      {/* ── Worn front stairs — flipped so lowest step is closest to player,
            extended to 27 steps so they climb all the way to the top platform.
            Stairs cut visually through the tiers when seen from above, but the
            tier boxes' frontfaces hide most of the clipping from normal angles. */}
      {Array.from({ length: 27 }).map((_, i) => (
        <mesh
          key={i}
          position={[0, 0.4 + i * 0.7, 20.5 - i * 0.5]}
          geometry={stair}
        >
          <meshLambertMaterial vertexColors />
        </mesh>
      ))}

      {/* ── Front pillars */}
      {[-12, -7, -2, 3, 8, 13].map((x, i) => (
        <mesh key={i} position={[x - 0.5, 3.5, 17]} castShadow>
          <cylinderGeometry args={[0.45, 0.5, 5, 8]} />
          <meshLambertMaterial color="#9a8268" />
        </mesh>
      ))}
      {/* Pillar capitals — small block on top of each */}
      {[-12, -7, -2, 3, 8, 13].map((x, i) => (
        <mesh key={`cap-${i}`} position={[x - 0.5, 6.15, 17]}>
          <boxGeometry args={[1.1, 0.3, 1.1]} />
          <meshLambertMaterial color="#7a6450" />
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

/* ─── Featured projects shown on the floating monitors */
type ProjectMonitor = {
  id: string;
  title: string;
  role: string;
  year: string;
  tags: string[];
  bg: string;     // monitor background fallback
  accent: string; // accent / glow color
  image: string;  // /public path — real screenshot
  description: string;
};

const FEATURED_PROJECTS: ProjectMonitor[] = [
  {
    id: "disaster",
    title: "Disaster Response",
    role: "Frontend Lead · UI Architect",
    year: "2024",
    tags: ["React", "Firebase", "Mapbox"],
    bg: "#5a1a1a",
    accent: "#ff6a44",
    image: "/images/projects/Screenshot 2024-09-12 131056.png",
    description:
      "Real-time emergency coordination platform connecting first responders with civilians during natural disasters across the Zamboanga peninsula. Live SOS pins, geo-fenced alerts, low-bandwidth fallback. A quiet observation from the build: in a flood, the simplest UI saves the most lives.",
  },
  {
    id: "eilish",
    title: "The Eilish Vault",
    role: "Frontend Developer",
    year: "2025",
    tags: ["React", "GSAP", "Tailwind"],
    bg: "#3a3a4a",
    accent: "#c0a0c8",
    image: "/images/projects/Screenshot 2025-04-16 112218.png",
    description:
      "A fan-built archive site — discography, lyrics, and editorial moodboards stitched together with reverent typography. Built as an exercise in restraint: every page asked 'does this serve the artist?' before any pixel was placed.",
  },
  {
    id: "saas",
    title: "SaaS Catering",
    role: "Full-Stack Engineer",
    year: "2025",
    tags: ["Next.js", "Supabase", "Stripe"],
    bg: "#3a1a4a",
    accent: "#a040ff",
    image: "/images/projects/Screenshot 2025-02-07 095800.png",
    description:
      "Multi-tenant catering platform — booking flows, menu builder, payment splits, and an admin dashboard for venue partners. Background jobs that keep weddings on schedule and reservations that survive a Friday-night spike.",
  },
];

/* ─── Single monitor — loads its own screenshot via Suspense */
function ProjectMonitorView({ project, dx }: { project: ProjectMonitor; dx: number }) {
  const screenshot = useTexture(project.image);
  useEffect(() => {
    if (screenshot) {
      screenshot.colorSpace = THREE.SRGBColorSpace;
      // Avoid blurry ANGLE-mipmap weirdness on some drivers
      screenshot.minFilter = THREE.LinearFilter;
      screenshot.magFilter = THREE.LinearFilter;
      screenshot.generateMipmaps = false;
      screenshot.needsUpdate = true;
    }
  }, [screenshot]);

  return (
    <Interactable
      input="click"
      label={`Open: ${project.title}`}
      cooldown={400}
      onInteract={() =>
        openDialogue({
          sub: `Project · ${project.year} · ${project.role}`,
          title: project.title,
          body: project.description,
          image: project.image,
        })
      }
    >
      <group position={[dx, 1.9, 0.2]} rotation={[0, -dx * 0.18, 0]}>
        {/* Frame glow halo (additive) — slightly larger than screen for a glow ring */}
        <mesh position={[0, 0, -0.002]}>
          <planeGeometry args={[1.04, 0.72]} />
          <meshBasicMaterial
            color={project.accent}
            toneMapped={false}
            transparent
            opacity={0.5}
            blending={THREE.AdditiveBlending}
            fog={false}
          />
        </mesh>
        {/* Screen — full-bleed screenshot */}
        <mesh>
          <planeGeometry args={[0.96, 0.66]} />
          <meshBasicMaterial
            map={screenshot}
            toneMapped={false}
            side={THREE.DoubleSide}
            fog={false}
          />
        </mesh>
      </group>
    </Interactable>
  );
}

/* ─── Suspense fallback — solid colored monitor while screenshot loads */
function ProjectMonitorPlaceholder({ project, dx }: { project: ProjectMonitor; dx: number }) {
  return (
    <group position={[dx, 1.9, 0.2]} rotation={[0, -dx * 0.18, 0]}>
      <mesh position={[0, 0, -0.002]}>
        <planeGeometry args={[1.04, 0.72]} />
        <meshBasicMaterial
          color={project.accent}
          toneMapped={false}
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          fog={false}
        />
      </mesh>
      <mesh>
        <planeGeometry args={[0.96, 0.66]} />
        <meshBasicMaterial color={project.bg} toneMapped={false} fog={false} />
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

      {/* Floating monitors — each loads its own screenshot via Suspense */}
      {FEATURED_PROJECTS.map((p, i) => {
        const dx = (i - (FEATURED_PROJECTS.length - 1) / 2) * 1.1;
        return (
          <Suspense key={p.id} fallback={<ProjectMonitorPlaceholder project={p} dx={dx} />}>
            <ProjectMonitorView project={p} dx={dx} />
          </Suspense>
        );
      })}
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

      {/* Cursed Acer — clickable; the relic of great power */}
      <Interactable
        input="click"
        label="Examine the Relic"
        cooldown={400}
        onInteract={() =>
          openDialogue({
            sub: "Relic · Display Case III",
            title: "The Cursed Acer Aspire",
            body:
              "An artifact of great power, lost to the floods of 2024. Its keys remember the strokes of a thousand commits. Forensic evidence suggests the device once compiled a Next.js 13 app under conditions no longer reproducible. Touch it not — the warranty is long expired.",
          })
        }
      >
        <CursedAcer position={[6, 0, 0]} />
      </Interactable>

      {/* Throne-desk at the back wall */}
      <ThroneDesk position={[0, 0, -9]} />

      {/* Mindanao map on left wall */}
      <MindanaoMap position={[-8.6, 5.5, 0]} rotationY={Math.PI / 2} />

      {/* 4 tech-rune mandalas on right wall */}
      <TechRune position={[8.5, 5.6,  6]} type="react"    rotationY={-Math.PI / 2} />
      <TechRune position={[8.5, 5.6,  2]} type="next"     rotationY={-Math.PI / 2} />
      <TechRune position={[8.5, 5.6, -2]} type="flutter"  rotationY={-Math.PI / 2} />
      <TechRune position={[8.5, 5.6, -6]} type="supabase" rotationY={-Math.PI / 2} />

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
      radius:    14 + rand() * 8,
      speed:     0.12 + rand() * 0.15,
      offset:    rand() * Math.PI * 2,
      yBase:     34 + rand() * 12,
      yWobble:   1 + rand() * 1.5,
      size:      0.8 + rand() * 1.6,
      tilt:      rand() * Math.PI,
    }));
  }, []);
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  // Per-fragment physics state — survives between spell on/off transitions
  const states = useRef(fragments.map((f) => {
    const a = f.offset;
    return {
      x: Math.cos(a) * f.radius,
      y: f.yBase,
      z: Math.sin(a) * f.radius - 42,
      vx: 0, vy: 0, vz: 0,
      rx: f.tilt,
      ry: f.tilt * 0.7,
      rz: 0,
      landed: false,
    };
  }));
  const spellActive = useSpellActive();

  useFrame((_, dt) => {
    const t = performance.now() / 1000;
    fragments.forEach((f, i) => {
      const m = refs.current[i];
      const st = states.current[i];
      if (!m) return;

      if (spellActive) {
        // ── Active: lerp back toward the orbit target (recovers from a fall)
        const a = t * f.speed + f.offset;
        const tx = Math.cos(a) * f.radius;
        const tz = Math.sin(a) * f.radius - 42;
        const ty = f.yBase + Math.sin(t * 0.6 + f.offset) * f.yWobble;
        const lerp = 1 - Math.exp(-2.0 * dt); // dt-independent smoothing
        st.x += (tx - st.x) * lerp;
        st.y += (ty - st.y) * lerp;
        st.z += (tz - st.z) * lerp;
        st.vx = st.vy = st.vz = 0;
        st.landed = false;
        st.rx = f.tilt + t * 0.3;
        st.ry = f.tilt * 0.7 + t * 0.2;
        st.rz = 0;
      } else if (!st.landed) {
        // ── Inactive: gravity pulls them down, slight tumble
        st.vy -= 9.81 * dt;
        st.x += st.vx * dt;
        st.y += st.vy * dt;
        st.z += st.vz * dt;
        st.rx += dt * 1.6;
        st.ry += dt * 0.9;
        st.rz += dt * 0.7;
        // Land on the temple top / ground
        const groundY = f.size * 0.5;
        if (st.y <= groundY) {
          st.y = groundY;
          st.vy = 0;
          st.vx *= 0.4;
          st.vz *= 0.4;
          st.landed = true;
        }
      }

      m.position.set(st.x, st.y, st.z);
      m.rotation.set(st.rx, st.ry, st.rz);
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
 * VILLAGE — small low-poly huts ringing the temple at middle distance
 *   • Stone-base + clay-tile roof + glowing window + chimney
 *   • Procedurally placed in 6 clusters (left, right, back-left, back-right,
 *     far-back-left, far-back-right) — never inside the player area
 *   • Window glow blooms via toneMapped={false}
 * ═══════════════════════════════════════════════════════════════════════════ */
type HutColor = { wall: string; roof: string; trim: string };
const HUT_PALETTE: HutColor[] = [
  { wall: "#7a5e44", roof: "#3a1a14", trim: "#4a2818" },
  { wall: "#85705a", roof: "#4a2418", trim: "#3a1d18" },
  { wall: "#8a6f56", roof: "#48211a", trim: "#3a1d18" },
  { wall: "#6e5440", roof: "#3e1d18", trim: "#2c150c" },
];

function Hut({
  position,
  scale = 1,
  rotationY = 0,
  color,
  litWindow = true,
  windowColor = "#ffb060",
}: {
  position: [number, number, number];
  scale?: number;
  rotationY?: number;
  color: HutColor;
  litWindow?: boolean;
  windowColor?: string;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      {/* Stone base / walls */}
      <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 2.8, 2.4]} />
        <meshLambertMaterial color={color.wall} />
      </mesh>
      {/* Wooden trim band at base */}
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[3.05, 0.5, 2.45]} />
        <meshLambertMaterial color={color.trim} />
      </mesh>
      {/* Clay-tile pyramid roof — rotated 45° so it reads as a 4-sided pitch */}
      <mesh position={[0, 3.45, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[2.3, 1.6, 4]} />
        <meshLambertMaterial color={color.roof} />
      </mesh>
      {/* Window — glowing if lit */}
      {litWindow && (
        <>
          <mesh position={[0, 1.5, 1.21]}>
            <planeGeometry args={[0.55, 0.55]} />
            <meshBasicMaterial color={windowColor} toneMapped={false} fog />
          </mesh>
          {/* Window cross-frame */}
          <mesh position={[0, 1.5, 1.215]}>
            <planeGeometry args={[0.55, 0.05]} />
            <meshBasicMaterial color={color.trim} fog />
          </mesh>
          <mesh position={[0, 1.5, 1.215]}>
            <planeGeometry args={[0.05, 0.55]} />
            <meshBasicMaterial color={color.trim} fog />
          </mesh>
        </>
      )}
      {/* Door */}
      <mesh position={[1.0, 0.95, 1.21]}>
        <planeGeometry args={[0.7, 1.5]} />
        <meshLambertMaterial color={color.trim} />
      </mesh>
      {/* Chimney */}
      <mesh position={[0.7, 4.2, -0.4]}>
        <boxGeometry args={[0.3, 0.7, 0.3]} />
        <meshLambertMaterial color={color.trim} />
      </mesh>
    </group>
  );
}

function Village() {
  const huts = useMemo(() => {
    let s = 8765;
    const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return (s >>> 0) / 0xffffffff; };

    // Cluster centers chosen to ring the temple without entering the player's
    // walkable zone (bounded x∈[-55,50], z∈[-55,80]).
    const clusters: { cx: number; cz: number; n: number; spread: number }[] = [
      { cx: -68, cz:  18, n: 5, spread: 14 },
      { cx:  62, cz:  14, n: 5, spread: 14 },
      { cx: -78, cz: -18, n: 4, spread: 16 },
      { cx:  74, cz: -22, n: 4, spread: 16 },
      { cx: -38, cz: -85, n: 4, spread: 18 },
      { cx:  42, cz: -85, n: 4, spread: 18 },
    ];

    type HutDef = {
      position: [number, number, number];
      scale: number;
      rotationY: number;
      color: HutColor;
      litWindow: boolean;
      windowColor: string;
    };
    const arr: HutDef[] = [];
    const windowHues = ["#ffb060", "#ff9040", "#ffc070", "#ff8030", "#ffa050"];
    for (const c of clusters) {
      for (let i = 0; i < c.n; i++) {
        const a = (i / c.n) * Math.PI * 2 + r() * 0.9;
        const dist = 3 + r() * c.spread;
        const x = c.cx + Math.cos(a) * dist;
        const z = c.cz + Math.sin(a) * dist;
        arr.push({
          position: [x, 0, z],
          scale: 0.9 + r() * 0.55,
          rotationY: r() * Math.PI * 2,
          color: HUT_PALETTE[Math.floor(r() * HUT_PALETTE.length)],
          litWindow: r() > 0.18,
          windowColor: windowHues[Math.floor(r() * windowHues.length)],
        });
      }
    }
    return arr;
  }, []);

  return (
    <group>
      {huts.map((h, i) => (
        <Hut key={i} {...h} />
      ))}
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

  const moteTickRef = useRef(0);
  const moteDtAccRef = useRef(0);
  useFrame((_, dt) => {
    moteDtAccRef.current += dt;
    if ((++moteTickRef.current & 1) !== 0) return; // throttle: every other frame
    const effDt = moteDtAccRef.current;
    moteDtAccRef.current = 0;
    if (!ref.current) return;
    // Keep mote field anchored loosely around the camera so motes always read
    ref.current.position.x = camera.position.x;
    ref.current.position.z = camera.position.z;

    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3]     += vels[i * 3] * effDt;
      arr[i * 3 + 1] += vels[i * 3 + 1] * effDt;
      arr[i * 3 + 2] += vels[i * 3 + 2] * effDt;
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

    // No-spawn zones — anything important the trees shouldn't grow through.
    const NO_GO: { x: number; z: number; r: number }[] = [
      { x: -15, z:  12, r: 5 },   // gong + frame
      { x:   0, z:   8, r: 5 },   // altar + spell pillar
      { x:  -4, z:  -8, r: 3 },   // foo dog left
      { x:   4, z:  -8, r: 3 },   // foo dog right
      { x:   8, z:  64, r: 3 },   // vintazk tablet
      { x:  22, z:  -8, r: 6 },   // reflecting pool
      { x: -24, z: -10, r: 7 },   // sparring posts cluster
      { x:   0, z: -42, r: 30 },  // main temple footprint (scaled 1.45 × 34 base)
      { x:  30, z: -42, r: 14 },  // right annex
      { x: -30, z: -42, r: 14 },  // left annex
      { x: -32, z: -28, r: 14 },  // sanctum hall
      { x:   0, z:   0, r: 4 },   // central path mid-point
      // Village clusters — don't grow trees through the huts
      { x: -68, z:  18, r: 16 },
      { x:  62, z:  14, r: 16 },
      { x: -78, z: -18, r: 18 },
      { x:  74, z: -22, r: 18 },
      { x: -38, z: -85, r: 20 },
      { x:  42, z: -85, r: 20 },
    ];
    const isClear = (x: number, z: number) => {
      for (const n of NO_GO) {
        const dx = x - n.x, dz = z - n.z;
        if (dx * dx + dz * dz < n.r * n.r) return false;
      }
      return true;
    };

    const arr: { pos: [number, number, number]; scale: number; rotationY: number; variant: 0 | 1 | 2 }[] = [];
    for (let i = 0; i < 14; i++) {
      const sideSign = i % 2 === 0 ? -1 : 1;
      const z = 60 - (i >> 1) * 8;
      const x = sideSign * (12 + rand() * 3);
      if (!isClear(x, z)) continue;
      arr.push({
        pos: [x, 0, z],
        scale: 0.7 + rand() * 0.7,
        rotationY: rand() * Math.PI * 2,
        variant: Math.floor(rand() * 3) as 0 | 1 | 2,
      });
    }
    for (let i = 0; i < 22; i++) {
      const a = rand() * Math.PI * 2;
      const r = 42 + rand() * 60;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r - 30;
      if (!isClear(x, z)) continue;
      arr.push({
        pos: [x, 0, z],
        scale: 0.65 + rand() * 0.85,
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
  const spellActive = useSpellActive();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ringRef.current) ringRef.current.rotation.z = spellActive ? t * 0.4 : 0;
    if (orbitRef.current) orbitRef.current.rotation.y = spellActive ? -t * 0.6 : 0;
    if (pillarRef.current) {
      pillarRef.current.opacity = spellActive
        ? 0.4 + Math.sin(t * 2) * 0.18
        : 0.04;
    }
  });
  return (
    <Interactable
      input="click"
      label="Touch the Spell Circle"
      cooldown={500}
      onInteract={() => setSpellActive(!spellActive)}
    >
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
    </Interactable>
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
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
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
/* ─── PLAYER SHADOW — invisible capsule at the camera's feet that the
   directional sun renders into the shadow map. The mesh's colorWrite is
   off so the player never sees the body itself, only the shadow it casts. */
function PlayerShadowCaster() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    // Body center sits below eye level — torso from y≈0.25 to y≈1.45
    ref.current.position.set(PLAYER_POS.x, 0.85, PLAYER_POS.z);
  });
  return (
    <mesh ref={ref} castShadow frustumCulled={false}>
      <capsuleGeometry args={[0.32, 1.1, 4, 8]} />
      <meshBasicMaterial
        transparent
        opacity={0}
        depthWrite={false}
        colorWrite={false}
      />
    </mesh>
  );
}

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
        if (Math.sqrt(dx * dx + dz * dz) < 5) gongStrike.fn?.();
      }
      // Toggle fly mode — V
      if (e.code === "KeyV") {
        setFly(!FLY_STATE.on);
        if (FLY_STATE.on) velY.current = 0;
      }
      // Jump — Space, only when grounded (and not flying — Space ascends in fly).
      // 4.5 m/s impulse against 9.81 m/s² gravity → ~1.03 m peak (athletic human).
      if (e.code === "Space" && onGround.current && !FLY_STATE.on) {
        velY.current = 4.5;
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

    // ─── FLY MODE: noclip 6-DOF movement, no gravity, no collision, no bounds.
    if (FLY_STATE.on) {
      const flySpeed = (sprint ? 38 : 14) * dt;
      camera.getWorldDirection(_forward); // includes pitch — so W flies up/down with view
      _right.crossVectors(_forward, camera.up).normalize();

      let mvF = 0, mvR = 0, mvU = 0;
      if (keys.current.has("KeyW") || keys.current.has("ArrowUp"))    mvF += 1;
      if (keys.current.has("KeyS") || keys.current.has("ArrowDown"))  mvF -= 1;
      if (keys.current.has("KeyD") || keys.current.has("ArrowRight")) mvR += 1;
      if (keys.current.has("KeyA") || keys.current.has("ArrowLeft"))  mvR -= 1;
      if (keys.current.has("Space"))                                  mvU += 1;
      if (keys.current.has("ControlLeft") || keys.current.has("KeyC")) mvU -= 1;

      const inLen = Math.sqrt(mvF * mvF + mvR * mvR + mvU * mvU);
      if (inLen > 0) { mvF /= inLen; mvR /= inLen; mvU /= inLen; }

      camera.position.x += (_forward.x * mvF + _right.x * mvR) * flySpeed;
      camera.position.y += (_forward.y * mvF + mvU) * flySpeed;
      camera.position.z += (_forward.z * mvF + _right.z * mvR) * flySpeed;

      velY.current = 0;
      onGround.current = false;
      PLAYER_POS.copy(camera.position);
      return;
    }

    // Earthly-but-comfortable speeds — 4.8 m/s walk (fast walk), 8.5 m/s sprint (jog).
    // Reduced air control (0.5×) while jumping — momentum is mostly conserved mid-air.
    const groundSpeed = sprint ? 8.5 : 4.8;
    const airFactor = onGround.current ? 1.0 : 0.5;
    const speed = groundSpeed * airFactor * dt;

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
      if (isBlocked(_origin, _dir)) {
        // Try to step UP onto a low obstacle (stairs, ledges, cornices)
        const newY = tryStepUp(camera.position.y, camera.position.x, camera.position.z, _dir.x, _dir.z);
        if (newY !== null) {
          camera.position.y = newY;
          velY.current = 0;
        } else {
          mvF = 0;
        }
      }
    }
    if (mvR !== 0) {
      _dir.copy(_right).multiplyScalar(Math.sign(mvR));
      if (isBlocked(_origin, _dir)) {
        const newY = tryStepUp(camera.position.y, camera.position.x, camera.position.z, _dir.x, _dir.z);
        if (newY !== null) {
          camera.position.y = newY;
          velY.current = 0;
        } else {
          mvR = 0;
        }
      }
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

    // ── Vertical: Earth gravity (9.81 m/s²) + ground-following raycast
    velY.current -= 9.81 * dt;
    camera.position.y += velY.current * dt;

    // Cast straight down from slightly above the player's feet to find
    // the highest collidable surface beneath. Falls back to flat y=0 ground.
    _origin.copy(camera.position);
    _origin.y += 0.5;
    _groundRay.set(_origin, _down);
    const groundHits = _groundRay.intersectObjects(COLLIDABLES, false);
    let groundY = 0;
    if (groundHits.length > 0) groundY = groundHits[0].point.y;

    const targetY = groundY + 1.7;
    if (camera.position.y <= targetY) {
      camera.position.y = targetY;
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

      {/* Gong — clickable interaction (rings the bronze) */}
      <Collider>
        <Interactable
          input="click"
          label="Ring the Gong"
          cooldown={1500}
          onInteract={() => gongStrike.fn?.()}
        >
          <Gong />
        </Interactable>
      </Collider>

      <Collider>
        <FooDog position={[-4, 0, -8]} mirror={false} />
        <FooDog position={[ 4, 0, -8]} mirror={true} />
      </Collider>
      <Collider><Temple /></Collider>
      <Collider><SanctumHall /></Collider>
      <Collider><Village /></Collider>

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

      {/* Vintazk tablet — clickable, opens an inscription panel */}
      <Interactable
        input="click"
        label="Read the Inscription"
        cooldown={400}
        onInteract={() =>
          openDialogue({
            sub: "Inscription · The Stone Tablet",
            title: "The Seal of the Order",
            body:
              "Carved by the founders of the Vintazk order. The interlocked V marks the breath of creation — one stroke for code, one for craft, the dot above for the spark that animates them. Below the seal: \"May your runes compile clean, and your portals close gently behind you.\"",
          })
        }
      >
        <VintazkTablet />
      </Interactable>

      {/* Interaction core — runs raycast loop and listens for inputs */}
      <InteractionSystem />
      <Visitors />
      <Altar />
      <DustMotes count={45} />
      <PlayerShadowCaster />
      <PlayerMovement />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * INTERACTION PROMPT — centered overlay shown when ray hits an interactable
 * ═══════════════════════════════════════════════════════════════════════════ */
function InteractionPrompt() {
  const active = useActiveInteractable();
  const [visible, setVisible] = useState(false);
  useEffect(() => { setVisible(!!active); }, [active]);
  if (!active && !visible) return null;
  const inputLabel =
    active?.input === "click" ? "CLICK" :
    active?.input === "e"     ? "PRESS E" :
    active?.input === "f"     ? "PRESS F" : "";
  return (
    <div
      className="fixed left-1/2 top-1/2 z-[60] pointer-events-none -translate-x-1/2 mt-10"
      style={{
        opacity: active ? 1 : 0,
        transition: "opacity 200ms ease-out",
      }}
    >
      <div className="px-4 py-2 rounded-md bg-black/70 backdrop-blur-md border border-white/15 text-white text-[11px] font-mono uppercase tracking-[0.22em] flex items-center gap-2.5 shadow-lg whitespace-nowrap">
        <span className="text-[#ffb070] font-semibold">{inputLabel}</span>
        <span className="text-white/30">·</span>
        <span>{active?.label ?? ""}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * DIALOGUE PANEL — shows passed-in text content, ESC or backdrop closes
 * ═══════════════════════════════════════════════════════════════════════════ */
function DialoguePanel() {
  const [content, setContent] = useState<DialogueContent | null>(null);
  useEffect(() => {
    _showDialogue = setContent;
    return () => { _showDialogue = null; };
  }, []);
  if (!content) return null;
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center pointer-events-auto"
      onClick={closeDialogue}
      style={{ animation: "dialogueFadeIn 250ms ease-out both" }}
    >
      <style>{`@keyframes dialogueFadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
      <div className="absolute inset-0 bg-black/65 backdrop-blur-md" />
      <div
        className="relative max-w-2xl mx-6 rounded-2xl border border-[#ff6a00]/30 shadow-[0_30px_80px_rgba(0,0,0,0.7)] overflow-hidden"
        style={{ background: "linear-gradient(160deg, rgba(40,18,12,0.92), rgba(18,8,12,0.92))" }}
        onClick={(e) => e.stopPropagation()}
      >
        {content.image && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={content.image}
            alt={content.title}
            className="w-full h-56 sm:h-72 object-cover border-b border-white/10"
          />
        )}
        <div className="p-7 sm:p-8">
          <div className="text-[10px] font-mono tracking-[0.4em] uppercase text-[#ffb070] mb-3">
            {content.sub ?? "Inscription"}
          </div>
          <h2
            className="text-2xl sm:text-3xl mb-4 leading-tight"
            style={{ fontFamily: "var(--font-serif), 'Cormorant Garamond', serif", fontWeight: 400, color: "#f4e8d4" }}
          >
            {content.title}
          </h2>
          <p className="text-white/75 leading-relaxed text-sm sm:text-base">{content.body}</p>
          <div className="mt-7 flex items-center justify-between text-[10px] font-mono text-white/45 tracking-[0.22em] uppercase">
            <span>Click outside · Esc to close</span>
            <div className="flex items-center gap-2">
              {content.liveUrl && (
                <a
                  href={content.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="px-3 py-1.5 rounded border border-[#ff6a00]/40 text-[#ffb070] hover:bg-[#ff6a00]/10 transition"
                >
                  Visit Live ↗
                </a>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); closeDialogue(); }}
                className="px-3 py-1.5 rounded border border-white/20 text-white/70 hover:text-white hover:bg-white/[0.05] transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
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

function FlyHud() {
  const [on, setOn] = useState(FLY_STATE.on);
  useEffect(() => subscribeFly(setOn), []);
  return (
    <div className="fixed top-1/2 left-5 -translate-y-1/2 z-[60] pointer-events-none">
      <div className="px-3 py-2 rounded-md bg-black/55 backdrop-blur-md border border-white/10 text-[10px] font-mono tracking-[0.22em] uppercase text-white/75">
        <div>
          MODE:{" "}
          <span style={{ color: on ? "#5a8a7a" : "#ffb070" }}>
            {on ? "FLY" : "WALK"}
          </span>
        </div>
        <div className="opacity-60 mt-1">V · toggle fly</div>
        {on && (
          <div className="opacity-60 mt-1 leading-relaxed normal-case tracking-normal">
            wasd · move<br />
            space · up · ctrl/c · down<br />
            shift · boost
          </div>
        )}
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
          shadows={{ type: THREE.PCFShadowMap }}
          gl={{
            antialias: false,
            powerPreference: "high-performance",
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.1,
            outputColorSpace: THREE.SRGBColorSpace,
            stencil: false,
          }}
          camera={{ position: [0, 1.7, 50], fov: 65, near: 0.1, far: 600 }}
          dpr={[1, 1.5]}
          performance={{ min: 0.5 }}
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

      {/* Centered interaction prompt — visible whenever the crosshair hits an interactable */}
      {locked && <InteractionPrompt />}

      {/* Dialogue panel — fullscreen modal for inscriptions / relics / lore */}
      <DialoguePanel />

      {locked && (
        <>
          <div className="fixed inset-0 z-[55] flex items-center justify-center pointer-events-none">
            <div className="w-1 h-1 rounded-full bg-white/55" />
          </div>
          <div className="fixed bottom-5 left-5 z-[60] text-[10px] font-mono text-white/55 tracking-[0.22em] uppercase pointer-events-none">
            <div>WASD · walk</div>
            <div>SPACE · jump</div>
            <div>SHIFT · run</div>
            <div>V · fly mode</div>
            <div>E · interact</div>
            <div>ESC · release</div>
          </div>
          <div className="fixed bottom-5 right-5 z-[60] text-right text-[10px] font-mono text-white/45 tracking-[0.32em] uppercase pointer-events-none">
            <div className="text-[#ffb070]">Kamar-Taj</div>
            <div>Eastern Courtyard · Sunset</div>
          </div>
          <LandmarkHud />
          <FlyHud />
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
