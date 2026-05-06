"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment } from "@react-three/drei";
import * as THREE from "three";

/**
 * Robot3D — matte-black humanoid with a glossy mask helmet.
 * Head tracks the cursor, gestures auto-cycle (mostly idle, occasional wave / peace / etc.).
 *
 * The "soul" is the mask: elongated glossy dome, recessed darker face plate,
 * fine grid of sensor dots where eyes would be.
 */

// ── Materials ──────────────────────────────────────────────────────
// All very dark — the contrast is in *gloss vs matte*, not color.
const SHELL_GLOSS = (
  <meshPhysicalMaterial
    color="#101013"
    metalness={0.55}
    roughness={0.18}
    clearcoat={1}
    clearcoatRoughness={0.08}
  />
);
const PANEL_MATTE = (
  <meshStandardMaterial color="#0a0a0d" metalness={0.35} roughness={0.55} />
);
const VISOR = (
  <meshPhysicalMaterial
    color="#050507"
    metalness={0.9}
    roughness={0.04}
    clearcoat={1}
    clearcoatRoughness={0.02}
  />
);
const FACE_PLATE = (
  <meshStandardMaterial color="#020203" metalness={0.5} roughness={0.35} />
);
const JOINT = (
  <meshStandardMaterial color="#1c1c20" metalness={0.78} roughness={0.28} />
);
const ACCENT = (
  <meshStandardMaterial color="#26262c" metalness={0.85} roughness={0.22} />
);

// ── Gestures ───────────────────────────────────────────────────────
type Gesture =
  | "idle"
  | "wave"
  | "peace"
  | "heart"
  | "thumb_up"
  | "point"
  | "open"
  | "fist";

// Finger bend in radians: 0 = straight, -1.5 ≈ fully curled into palm.
// Order: [index, middle, ring, pinky]
const FINGER_BENDS: Record<Gesture, [number, number, number, number]> = {
  idle:     [-0.35, -0.35, -0.35, -0.35],
  wave:     [ 0.12,  0.06,  0.00, -0.06],
  peace:    [ 0.05,  0.05, -1.45, -1.45],
  heart:    [-1.05, -1.50, -1.50, -1.50],
  thumb_up: [-1.55, -1.55, -1.55, -1.55],
  point:    [ 0.00, -1.55, -1.55, -1.55],
  open:     [ 0.05,  0.00,  0.00,  0.05],
  fist:     [-1.55, -1.55, -1.55, -1.55],
};

const THUMB_BENDS: Record<Gesture, number> = {
  idle:     -0.30,
  wave:      0.05,
  peace:    -1.10,
  heart:    -0.60,
  thumb_up:  0.55,
  point:    -0.85,
  open:      0.00,
  fist:     -0.85,
};

type ArmPose = { shoulderX: number; shoulderZ: number; forearmX: number };
function gestureArmPose(side: "L" | "R", gesture: Gesture): ArmPose {
  const sign = side === "L" ? 1 : -1;
  // At idle, arms hang nearly straight — only a tiny natural splay
  const idleZ = sign * 0.05;
  if (side === "R") {
    if (gesture === "idle") {
      return { shoulderX: 0, shoulderZ: idleZ, forearmX: -0.05 };
    }
    return {
      shoulderX: -1.05,
      shoulderZ: idleZ - 0.25,
      forearmX: -1.65,
    };
  }
  return { shoulderX: 0, shoulderZ: idleZ, forearmX: -0.05 };
}

// ── Single posable finger ──────────────────────────────────────────
function Finger({
  bendRef,
  length = 0.18,
}: {
  bendRef: React.MutableRefObject<THREE.Group | null>;
  length?: number;
}) {
  return (
    <group ref={bendRef}>
      <mesh position={[0, -length / 2, 0]}>
        <boxGeometry args={[0.04, length, 0.06]} />
        {SHELL_GLOSS}
      </mesh>
    </group>
  );
}

// ── Hand with posable fingers + thumb ──────────────────────────────
function Hand({
  fingerRefs,
  thumbRef,
  mirror = false,
}: {
  fingerRefs: React.MutableRefObject<(THREE.Group | null)[]>;
  thumbRef: React.MutableRefObject<THREE.Group | null>;
  mirror?: boolean;
}) {
  const sign = mirror ? -1 : 1;
  return (
    <group>
      {/* Wrist cuff */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.13, 0.12, 0.08, 16]} />
        {JOINT}
      </mesh>
      {/* Palm */}
      <mesh position={[0, -0.12, 0]}>
        <boxGeometry args={[0.22, 0.18, 0.13]} />
        {SHELL_GLOSS}
      </mesh>
      {/* Knuckle ridge */}
      <mesh position={[0, -0.22, 0]}>
        <boxGeometry args={[0.22, 0.04, 0.13]} />
        {ACCENT}
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <group key={i} position={[-0.075 + i * 0.05, -0.24, 0]}>
          <Finger
            bendRef={
              {
                get current() {
                  return fingerRefs.current[i];
                },
                set current(v) {
                  fingerRefs.current[i] = v;
                },
              } as React.MutableRefObject<THREE.Group | null>
            }
          />
        </group>
      ))}
      <group position={[sign * 0.13, -0.16, 0.02]} rotation={[0, 0, sign * 0.6]}>
        <Finger bendRef={thumbRef} length={0.14} />
      </group>
    </group>
  );
}

// ── The Mask — the heart of the design ─────────────────────────────
function Mask() {
  // Build a small dot grid of "sensor" eyes on the face plate.
  // Two dense bands suggest the sci-fi visor without overdoing it.
  const dots: { x: number; y: number; size: number }[] = [];
  const COLS = 11;
  const ROWS = 4;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      // Skip center column so the rows feel like two clusters around a "nose bridge"
      if (c === Math.floor(COLS / 2)) continue;
      dots.push({
        x: -0.16 + c * 0.032,
        y: 0.04 - r * 0.022,
        size: 0.0085,
      });
    }
  }

  return (
    <group>
      {/* Outer helmet shell — elongated, ultra-glossy */}
      <mesh scale={[1, 1.18, 1.02]}>
        <sphereGeometry args={[0.58, 128, 128]} />
        {VISOR}
      </mesh>

      {/* Subtle chin taper — second sphere shifted down */}
      <mesh position={[0, -0.34, 0]} scale={[0.78, 0.55, 0.9]}>
        <sphereGeometry args={[0.42, 64, 64]} />
        {VISOR}
      </mesh>

      {/* Recessed face plate — slightly less glossy than shell, sits flush */}
      <mesh position={[0, -0.04, 0.45]} scale={[0.78, 1.05, 0.22]}>
        <sphereGeometry args={[0.42, 64, 64]} />
        {FACE_PLATE}
      </mesh>

      {/* Sensor dot grid — two dim clusters */}
      {dots.map((d, i) => (
        <mesh key={i} position={[d.x, d.y, 0.62]}>
          <sphereGeometry args={[d.size, 8, 8]} />
          <meshStandardMaterial
            color="#3a3a42"
            emissive="#1f1f25"
            emissiveIntensity={0.4}
          />
        </mesh>
      ))}

      {/* Thin highlight strip across the top — sells the glossy curvature */}
      <mesh position={[0, 0.42, 0.18]} rotation={[0.3, 0, 0]} scale={[0.6, 0.04, 0.04]}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial
          color="#2a2a32"
          emissive="#15151a"
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  );
}

function Robot() {
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftForearmRef = useRef<THREE.Group>(null);
  const rightForearmRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);

  const rFingerRefs = useRef<(THREE.Group | null)[]>([null, null, null, null]);
  const rThumbRef = useRef<THREE.Group | null>(null);
  const lFingerRefs = useRef<(THREE.Group | null)[]>([null, null, null, null]);
  const lThumbRef = useRef<THREE.Group | null>(null);

  const target = useRef({ x: 0, y: 0 });

  // ── Gesture state machine ────────────────────────────────────────
  // Idle most of the time; occasionally pick a gesture, hold, then return.
  const [gesture, setGesture] = useState<Gesture>("idle");

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const scheduleNext = (current: Gesture) => {
      // Idle dwells longer than active gestures
      const dwell =
        current === "idle"
          ? 5000 + Math.random() * 4000   // 5–9s idle
          : 2200 + Math.random() * 800;   // 2.2–3s gesture

      timeout = setTimeout(() => {
        let next: Gesture;
        if (current !== "idle") {
          // Always return to idle after a gesture
          next = "idle";
        } else {
          // From idle: 55% stay idle, 45% pick a gesture (wave weighted heaviest)
          const roll = Math.random();
          if (roll < 0.55) next = "idle";
          else {
            const pool: Gesture[] = [
              "wave", "wave", "wave",       // wave is the signature
              "peace", "thumb_up", "point", "open",
            ];
            next = pool[Math.floor(Math.random() * pool.length)];
          }
        }
        setGesture(next);
        scheduleNext(next);
      }, dwell);
    };

    scheduleNext(gesture);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Cursor tracking ──────────────────────────────────────────────
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      target.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  // ── Per-frame animation ──────────────────────────────────────────
  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Smooth head tracking — exaggerated so it CLEARLY looks left/right/up/down
    if (headRef.current) {
      // Y rotation (left/right) — up to ~57°
      headRef.current.rotation.y = THREE.MathUtils.lerp(
        headRef.current.rotation.y,
        target.current.x * 1.0,
        0.12
      );
      // X rotation (up/down) — up to ~28°
      headRef.current.rotation.x = THREE.MathUtils.lerp(
        headRef.current.rotation.x,
        -target.current.y * 0.5,
        0.12
      );
      // Z roll — slight curiosity tilt in the direction it's looking
      headRef.current.rotation.z = THREE.MathUtils.lerp(
        headRef.current.rotation.z,
        -target.current.x * 0.18,
        0.1
      );
    }

    // Gentle torso breathing
    if (torsoRef.current) {
      torsoRef.current.position.y = Math.sin(t * 1.2) * 0.012;
    }

    const rPose = gestureArmPose("R", gesture);
    const lPose = gestureArmPose("L", gesture);

    const lerpRot = (
      group: THREE.Group | null,
      key: "x" | "y" | "z",
      target: number,
      factor = 0.1
    ) => {
      if (!group) return;
      group.rotation[key] = THREE.MathUtils.lerp(
        group.rotation[key],
        target,
        factor
      );
    };

    lerpRot(leftArmRef.current, "x", lPose.shoulderX);
    lerpRot(leftArmRef.current, "z", lPose.shoulderZ);
    lerpRot(leftForearmRef.current, "x", lPose.forearmX);

    lerpRot(rightArmRef.current, "x", rPose.shoulderX);
    lerpRot(rightArmRef.current, "z", rPose.shoulderZ);
    lerpRot(rightForearmRef.current, "x", rPose.forearmX);

    // Idle sway — subtle now that arms hang straight
    if (gesture === "idle") {
      const sway = Math.sin(t * 1.1) * 0.02;
      if (leftArmRef.current) leftArmRef.current.rotation.z += sway * 0.18;
      if (rightArmRef.current) rightArmRef.current.rotation.z -= sway * 0.18;
    }

    // Wave: side-to-side hand
    if (gesture === "wave") {
      const w = Math.sin(t * 4.2) * 0.42;
      lerpRot(rightArmRef.current, "z", -0.22 + 0.15 + w, 0.18);
    }

    // Pose right-hand fingers + thumb
    const targetFingers = FINGER_BENDS[gesture];
    const targetThumb = THUMB_BENDS[gesture];
    rFingerRefs.current.forEach((g, i) => {
      if (!g) return;
      g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, targetFingers[i], 0.18);
    });
    if (rThumbRef.current) {
      rThumbRef.current.rotation.x = THREE.MathUtils.lerp(
        rThumbRef.current.rotation.x,
        targetThumb,
        0.18
      );
    }

    // Left hand stays relaxed
    const idleFingers = FINGER_BENDS.idle;
    lFingerRefs.current.forEach((g, i) => {
      if (!g) return;
      g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, idleFingers[i], 0.18);
    });
    if (lThumbRef.current) {
      lThumbRef.current.rotation.x = THREE.MathUtils.lerp(
        lThumbRef.current.rotation.x,
        THUMB_BENDS.idle,
        0.18
      );
    }
  });

  return (
    <group position={[0, -0.7, 0]} scale={0.7}>
      {/* ── HEAD ── */}
      <group ref={headRef} position={[0, 2.55, 0]}>
        <Mask />
      </group>

      {/* NECK — tapered cylinder */}
      <mesh position={[0, 1.92, 0]}>
        <cylinderGeometry args={[0.13, 0.2, 0.24, 24]} />
        {JOINT}
      </mesh>

      {/* ── TORSO (V-shape) ── */}
      <group ref={torsoRef}>
        {/* Upper chest — broad */}
        <mesh position={[0, 1.55, 0]}>
          <boxGeometry args={[1.5, 0.45, 0.7]} />
          {SHELL_GLOSS}
        </mesh>
        {/* Mid torso — tapering */}
        <mesh position={[0, 1.15, 0]}>
          <boxGeometry args={[1.25, 0.4, 0.62]} />
          {PANEL_MATTE}
        </mesh>
        {/* Lower torso — narrow */}
        <mesh position={[0, 0.78, 0]}>
          <boxGeometry args={[1.0, 0.35, 0.55]} />
          {SHELL_GLOSS}
        </mesh>
        {/* Center sternum line — subtle accent strip */}
        <mesh position={[0, 1.3, 0.36]}>
          <boxGeometry args={[0.04, 0.85, 0.02]} />
          {ACCENT}
        </mesh>
        {/* Pectoral split lines — two thin vertical accents */}
        <mesh position={[-0.42, 1.5, 0.36]}>
          <boxGeometry args={[0.02, 0.4, 0.015]} />
          {ACCENT}
        </mesh>
        <mesh position={[0.42, 1.5, 0.36]}>
          <boxGeometry args={[0.02, 0.4, 0.015]} />
          {ACCENT}
        </mesh>
        {/* Shoulder yoke — top plate */}
        <mesh position={[0, 1.78, 0]}>
          <boxGeometry args={[1.55, 0.12, 0.74]} />
          {ACCENT}
        </mesh>
      </group>

      {/* WAIST + HIPS */}
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[0.85, 0.22, 0.5]} />
        {ACCENT}
      </mesh>
      <mesh position={[0, 0.18, 0]}>
        <boxGeometry args={[0.95, 0.22, 0.55]} />
        {PANEL_MATTE}
      </mesh>

      {/* ── LEGS ── */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.27, -0.12, 0]}>
          <mesh>
            <sphereGeometry args={[0.18, 24, 24]} />
            {JOINT}
          </mesh>
          <mesh position={[0, -0.55, 0]}>
            <cylinderGeometry args={[0.18, 0.16, 1.0, 20]} />
            {SHELL_GLOSS}
          </mesh>
          <mesh position={[0, -1.1, 0]}>
            <sphereGeometry args={[0.18, 24, 24]} />
            {JOINT}
          </mesh>
          <mesh position={[0, -1.1, 0.13]} scale={[0.7, 0.85, 0.4]}>
            <sphereGeometry args={[0.18, 24, 24]} />
            {ACCENT}
          </mesh>
        </group>
      ))}

      {/* ── LEFT ARM ── */}
      <group ref={leftArmRef} position={[-0.85, 1.65, 0]}>
        <mesh>
          <sphereGeometry args={[0.26, 32, 32]} />
          {JOINT}
        </mesh>
        <mesh position={[-0.05, -0.5, 0]} rotation={[0, 0, 0.12]}>
          <cylinderGeometry args={[0.18, 0.16, 0.78, 20]} />
          {SHELL_GLOSS}
        </mesh>
        <mesh position={[-0.13, -0.95, 0]}>
          <sphereGeometry args={[0.18, 24, 24]} />
          {JOINT}
        </mesh>
        <group ref={leftForearmRef} position={[-0.13, -0.95, 0]}>
          <mesh position={[-0.05, -0.32, 0.05]} rotation={[0.2, 0, 0.08]}>
            <cylinderGeometry args={[0.14, 0.16, 0.62, 20]} />
            {PANEL_MATTE}
          </mesh>
          <group position={[-0.1, -0.7, 0.08]}>
            <Hand fingerRefs={lFingerRefs} thumbRef={lThumbRef} />
          </group>
        </group>
      </group>

      {/* ── RIGHT ARM ── */}
      <group ref={rightArmRef} position={[0.85, 1.65, 0]}>
        <mesh>
          <sphereGeometry args={[0.26, 32, 32]} />
          {JOINT}
        </mesh>
        <mesh position={[0.05, -0.5, 0]} rotation={[0, 0, -0.12]}>
          <cylinderGeometry args={[0.18, 0.16, 0.78, 20]} />
          {SHELL_GLOSS}
        </mesh>
        <mesh position={[0.13, -0.95, 0]}>
          <sphereGeometry args={[0.18, 24, 24]} />
          {JOINT}
        </mesh>
        <group ref={rightForearmRef} position={[0.13, -0.95, 0]}>
          <mesh position={[0.05, -0.32, 0.05]} rotation={[0.2, 0, -0.08]}>
            <cylinderGeometry args={[0.14, 0.16, 0.62, 20]} />
            {PANEL_MATTE}
          </mesh>
          <group position={[0.1, -0.7, 0.08]}>
            <Hand fingerRefs={rFingerRefs} thumbRef={rThumbRef} mirror />
          </group>
        </group>
      </group>
    </group>
  );
}

// ── Bare canvas — drop in anywhere; sizing is controlled by the parent.
//    No section wrapper, no overlays, no dialogue. Just the robot.
export default function Robot3D({ className = "" }: { className?: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Placeholder so SSR and client first paint match — Three.js can't SSR.
    return (
      <div
        suppressHydrationWarning
        className={`relative w-full h-full ${className}`}
      />
    );
  }

  return (
    <div
      suppressHydrationWarning
      className={`relative w-full h-full ${className}`}
    >
      <Canvas
        camera={{ position: [0, -0.4, 5.6], fov: 32 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent" }}
      >
        <Environment preset="studio" />

        <ambientLight intensity={0.25} />
        <directionalLight position={[3.5, 5, 4]} intensity={1.4} color="#ffffff" />
        <directionalLight position={[-4, 2, 2]} intensity={0.6} color="#9aa6ff" />
        <pointLight position={[0, 2, -4]} intensity={1.2} color="#ffffff" />
        <pointLight position={[0, -1, 3]} intensity={0.4} color="#ffffff" />

        <Suspense fallback={null}>
          <Robot />
        </Suspense>

        <ContactShadows
          position={[0, -1.7, 0]}
          opacity={0.6}
          blur={2.2}
          far={4}
          resolution={512}
          color="#000000"
        />
      </Canvas>
    </div>
  );
}