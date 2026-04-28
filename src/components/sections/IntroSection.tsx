"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Cormorant_Garamond, Bebas_Neue } from "next/font/google";
import { Canvas, useFrame } from "@react-three/fiber";
import { Torus, Float, Environment } from "@react-three/drei";
import * as THREE from "three";
import { launchTransition, suckElementsIntoPortal, zoomIntoPortal } from "../effects/PortalGateway";

// ═══════════════════════════════════════════════════════════════════════════
// 3D PORTAL — Three.js ring + ember canvas
// ═══════════════════════════════════════════════════════════════════════════

interface MouseRef { x: number; y: number; }
interface SlingRingProps { mouse: React.MutableRefObject<MouseRef>; }

const EMBER_COUNT = 600;

// ─── Ember Particle System ────────────────────────────────────────────────────
function EmberSystem() {
  const pointsRef = useRef<THREE.Points>(null);

  const state = useMemo(() => {
    const pos  = new Float32Array(EMBER_COUNT * 3);
    const vel  = new Float32Array(EMBER_COUNT * 3);
    const life = new Float32Array(EMBER_COUNT);
    const maxL = new Float32Array(EMBER_COUNT);
    const col  = new Float32Array(EMBER_COUNT * 3);

    const spawnParticle = (i: number, randomLife = false) => {
      const a = Math.random() * Math.PI * 2;
      const r = 1.95 + (Math.random() - 0.5) * 0.5;
      pos[i * 3]     = Math.cos(a) * r;
      pos[i * 3 + 1] = Math.sin(a) * r;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.4;

      const spd = 1.0 + Math.random() * 3.5;
      vel[i * 3]     = Math.cos(a) * spd * 0.25 + (Math.random() - 0.5) * spd * 0.5;
      vel[i * 3 + 1] = Math.sin(a) * spd * 0.25 + Math.random() * spd * 0.8;
      vel[i * 3 + 2] = (Math.random() - 0.5) * spd * 0.3;

      life[i] = randomLife ? Math.random() : 1.0;
      maxL[i] = 0.5 + Math.random() * 2.2;

      const heat = Math.random();
      if      (heat > 0.88) { col[i*3]=1.0; col[i*3+1]=1.0;  col[i*3+2]=0.9; }
      else if (heat > 0.65) { col[i*3]=1.0; col[i*3+1]=0.90; col[i*3+2]=0.0; }
      else if (heat > 0.38) { col[i*3]=1.0; col[i*3+1]=0.45; col[i*3+2]=0.0; }
      else if (heat > 0.15) { col[i*3]=0.9; col[i*3+1]=0.12; col[i*3+2]=0.0; }
      else                  { col[i*3]=0.6; col[i*3+1]=0.04; col[i*3+2]=0.0; }
    };

    for (let i = 0; i < EMBER_COUNT; i++) spawnParticle(i, true);
    return { pos, vel, life, maxL, col, spawnParticle };
  }, []);

  const [geo, mat] = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(state.pos, 3));
    g.setAttribute("color",    new THREE.BufferAttribute(state.col, 3));
    const m = new THREE.PointsMaterial({
      size: 0.065,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    return [g, m];
  }, [state]);

  useFrame((_, dt) => {
    const { pos, vel, life, maxL, spawnParticle } = state;
    let colorDirty = false;

    for (let i = 0; i < EMBER_COUNT; i++) {
      life[i] -= dt / maxL[i];

      if (life[i] <= 0) {
        spawnParticle(i, false);
        colorDirty = true;
      } else {
        pos[i*3]     += vel[i*3]     * dt;
        pos[i*3 + 1] += vel[i*3 + 1] * dt;
        pos[i*3 + 2] += vel[i*3 + 2] * dt;

        vel[i*3 + 1] += dt * 0.55;
        vel[i*3]     *= 0.991;
        vel[i*3 + 2] *= 0.991;

        if (mat) mat.size = 0.065;
      }
    }

    geo.attributes.position.needsUpdate = true;
    if (colorDirty) geo.attributes.color.needsUpdate = true;
  });

  return <points ref={pointsRef} geometry={geo} material={mat} />;
}

// ─── Portal Vortex (GLSL ShaderMaterial) ──────────────────────────────────────
function PortalVortex() {
  const matRef = useRef<THREE.ShaderMaterial | null>(null);

  const shader = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTime;
          varying vec2 vUv;

          void main() {
            vec2 uv   = vUv - 0.5;
            float d   = length(uv);
            float ang = atan(uv.y, uv.x);

            float swirl = ang - uTime * 1.8 + d * 14.0;
            float rings = sin(d * 22.0 - uTime * 4.5) * 0.5 + 0.5;
            float pat   = sin(swirl * 5.0) * 0.5 + 0.5;

            float edgeFade  = smoothstep(0.48, 0.30, d);
            float innerHole = smoothstep(0.18, 0.32, d);
            float alpha     = edgeFade * innerHole;

            vec3 outer = vec3(0.55, 0.08, 0.0);
            vec3 mid   = vec3(0.95, 0.35, 0.0);
            vec3 inner = vec3(1.0,  0.82, 0.1);
            vec3 col   = mix(outer, mid,   smoothstep(0.38, 0.22, d));
            col        = mix(col,   inner, smoothstep(0.22, 0.10, d));

            col *= 0.5 + pat * 0.35 + rings * 0.25;

            gl_FragColor = vec4(col, alpha * 0.88);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    []
  );

  matRef.current = shader;

  useFrame(({ clock }) => {
    shader.uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <mesh renderOrder={-1}>
      <circleGeometry args={[1.58, 128]} />
      <primitive object={shader} attach="material" />
    </mesh>
  );
}

// ─── Pulsing Inner Glow Orb ───────────────────────────────────────────────────
function GlowOrb() {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef  = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const pulse = 0.6 + Math.sin(t * 2.1) * 0.3 + Math.sin(t * 5.3) * 0.1;
    if (matRef.current) {
      matRef.current.emissiveIntensity = pulse * 3.5;
      matRef.current.opacity = 0.18 + pulse * 0.12;
    }
    if (meshRef.current) {
      const s = 1.0 + Math.sin(t * 1.7) * 0.04;
      meshRef.current.scale.setScalar(s);
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.45, 48, 48]} />
      <meshStandardMaterial
        ref={matRef}
        color="#FF3D00"
        emissive="#FF6D00"
        emissiveIntensity={2.5}
        transparent
        opacity={0.22}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.BackSide}
        toneMapped={false}
      />
    </mesh>
  );
}

// ─── Flickering Point Lights ──────────────────────────────────────────────────
function FlickerLights() {
  const lightA = useRef<THREE.PointLight>(null);
  const lightB = useRef<THREE.PointLight>(null);
  const lightC = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (lightA.current)
      lightA.current.intensity = 3.5 + Math.sin(t * 7.3)  * 1.2 + Math.sin(t * 13.1) * 0.6;
    if (lightB.current)
      lightB.current.intensity = 1.8 + Math.sin(t * 5.9)  * 0.8 + Math.sin(t * 17.3) * 0.4;
    if (lightC.current)
      lightC.current.intensity = 1.0 + Math.sin(t * 11.7) * 0.5;
  });

  return (
    <>
      <pointLight ref={lightA} position={[0,  0,  3.5]} color="#FF5722" intensity={3.5} distance={12} decay={2} />
      <pointLight ref={lightB} position={[3, -2,  2.5]} color="#FFC107" intensity={1.8} distance={10} decay={2} />
      <pointLight ref={lightC} position={[-2, 2,  2.0]} color="#FF9800" intensity={1.0} distance={8}  decay={2} />
    </>
  );
}

// ─── Main Sling Ring ──────────────────────────────────────────────────────────
function SlingRing({ mouse }: SlingRingProps) {
  const ringGroup = useRef<THREE.Group>(null);
  const outerHalo = useRef<THREE.Mesh>(null);
  const coreRing  = useRef<THREE.Mesh>(null);
  const innerBand = useRef<THREE.Mesh>(null);
  const midRing   = useRef<THREE.Mesh>(null);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;

    if (ringGroup.current) {
      ringGroup.current.rotation.z += delta * 0.22;
      ringGroup.current.rotation.x = THREE.MathUtils.lerp(
        ringGroup.current.rotation.x,
        (mouse.current?.y ?? 0) * 0.35,
        0.05
      );
      ringGroup.current.rotation.y = THREE.MathUtils.lerp(
        ringGroup.current.rotation.y,
        (mouse.current?.x ?? 0) * 0.35,
        0.05
      );
    }

    if (outerHalo.current) outerHalo.current.rotation.z -= delta * 0.35;
    if (innerBand.current) innerBand.current.rotation.z += delta * 0.90;
    if (midRing.current)   midRing.current.rotation.z   -= delta * 0.55;

    if (coreRing.current) {
      const mat = coreRing.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 2.2 + Math.sin(t * 3.1) * 0.8 + Math.sin(t * 7.3) * 0.3;
    }
  });

  return (
    <group ref={ringGroup}>
      <Torus ref={outerHalo} args={[2.52, 0.018, 8, 180]}>
        <meshBasicMaterial color="#FF6D00" toneMapped={false} />
      </Torus>
      <Torus args={[2.38, 0.010, 8, 180]}>
        <meshBasicMaterial color="#FFD740" toneMapped={false} />
      </Torus>

      <Torus args={[2.22, 0.035, 8, 180]}>
        <meshBasicMaterial color="#FF5722" toneMapped={false} />
      </Torus>

      <Torus ref={coreRing} args={[1.95, 0.13, 20, 200]}>
        <meshStandardMaterial
          color="#FF4500"
          emissive="#FF5722"
          emissiveIntensity={2.2}
          roughness={0.15}
          metalness={0.85}
          toneMapped={false}
        />
      </Torus>

      <Torus ref={midRing} args={[1.78, 0.022, 8, 160]}>
        <meshBasicMaterial color="#FFAB40" toneMapped={false} />
      </Torus>

      <Torus ref={innerBand} args={[1.60, 0.018, 8, 140]}>
        <meshBasicMaterial color="#FFE57F" toneMapped={false} />
      </Torus>

      <Torus args={[1.45, 0.010, 8, 120]}>
        <meshBasicMaterial color="#FF9800" toneMapped={false} />
      </Torus>

      {Array.from({ length: 36 }).map((_, i) => {
        const angle   = (i / 36) * Math.PI * 2;
        const isMain  = i % 3 === 0;
        const isMid   = i % 3 === 1;
        const length  = isMain ? 0.20 : isMid ? 0.12 : 0.07;
        const color   = isMain ? "#FFD740" : isMid ? "#FFC107" : "#FF9800";
        const radius  = 1.87;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * radius, Math.sin(angle) * radius, 0]}
            rotation={[0, 0, angle]}
          >
            <boxGeometry args={[length, isMain ? 0.025 : 0.015, 0.015]} />
            <meshBasicMaterial color={color} toneMapped={false} />
          </mesh>
        );
      })}

      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        return (
          <mesh
            key={`d${i}`}
            position={[Math.cos(angle) * 2.22, Math.sin(angle) * 2.22, 0]}
            rotation={[0, 0, angle + Math.PI / 4]}
          >
            <boxGeometry args={[0.08, 0.08, 0.02]} />
            <meshBasicMaterial color="#FFD740" toneMapped={false} />
          </mesh>
        );
      })}

      <PortalVortex />
      <GlowOrb />
      <EmberSystem />
    </group>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────────
function PortalScene({ mouse }: SlingRingProps) {
  return (
    <>
      <ambientLight intensity={0.15} />
      <FlickerLights />
      <Float speed={1.1} rotationIntensity={0.3} floatIntensity={0.5}>
        <SlingRing mouse={mouse} />
      </Float>
      <Suspense fallback={null}>
        <Environment preset="night" />
      </Suspense>
    </>
  );
}

// ─── Portal Canvas — fills the IntroSection only ──────────────────────────────
// `position: absolute; inset: 0` locks the canvas to the section's bounds.
// Because IntroSection is `height: 100vh` + `position: relative`, the canvas
// is centered inside the section and scrolls AWAY with it — it is NOT pinned
// to the viewport and does NOT overlay other sections of the portfolio.
//
// `active` drives the Three.js render loop: "always" while the section is on
// screen, "demand" while off-screen (frees GPU + CPU once user scrolls past).
function PortalCanvas({ active }: { active: boolean }) {
  const mouse = useRef<MouseRef>({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x =  (e.clientX / window.innerWidth)  * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div
      data-testid="portal-3d-canvas"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 1,
      }}
    >
      <Canvas
        style={{ width: "100%", height: "100%", display: "block" }}
        camera={{ position: [0, 0, 6], fov: 50 }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
        dpr={[1, 2]}
        frameloop={active ? "always" : "demand"}
      >
        <PortalScene mouse={mouse} />
      </Canvas>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// INTRO SECTION — fonts, decorative SVG rings, title, portal activation
// ═══════════════════════════════════════════════════════════════════════════

// ─── Fonts (self-hosted, zero-CLS, no blocking @import) ──────────────────────
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas",
  display: "swap",
});

// ─── Precomputed geometry (SSR-safe, no float drift) ─────────────────────────
const r4 = (n: number) => Math.round(n * 10000) / 10000;

const TICK_MARKS = Array.from({ length: 48 }, (_, i) => {
  const a = (i / 48) * Math.PI * 2;
  const r1 = 278, r2 = i % 12 === 0 ? 260 : i % 4 === 0 ? 267 : 272;
  return {
    x1: r4(290 + r1 * Math.cos(a)), y1: r4(290 + r1 * Math.sin(a)),
    x2: r4(290 + r2 * Math.cos(a)), y2: r4(290 + r2 * Math.sin(a)),
  };
});

const DIAMOND_NODES = [0, 60, 120, 180, 240, 300].map(deg => {
  const a = (deg * Math.PI) / 180;
  return { x: r4(240 + 224 * Math.cos(a)), y: r4(240 + 224 * Math.sin(a)) };
});

// Full Elder Futhark rune sequence for the ancient text rings
const RUNES_OUTER = "ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ · ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ · ᚠᚢᚦᚨᚱᚲ ·";
const RUNES_INNER = "ᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟᚠᚢᚦᚨᚱᚲᚷᚹ · VINTAZK · ᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟᚠ ·";

export default function IntroSection() {
  const [mounted, setMounted] = useState(false);
  const [portalActive, setPortalActive] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);
  const activatedRef = useRef(false);
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  // ── Pause Three.js render loop once the section scrolls out of view.
  // The canvas is contained inside the section so it naturally disappears
  // with scroll — this just stops burning cycles on an offscreen scene.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const io = new IntersectionObserver(
      ([entry]) => setPortalActive(entry.isIntersecting),
      { threshold: 0 }
    );
    io.observe(section);
    return () => io.disconnect();
  }, []);

  const particles = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2.5 + 0.5,
      duration: Math.random() * 8 + 4,
      delay: Math.random() * 6,
      opacity: Math.random() * 0.35 + 0.05,
    })),
  []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Portal activation — runs once, regardless of trigger source ────────────
  const activatePortal = () => {
    if (activatedRef.current) return;
    const section = sectionRef.current;
    if (!section) return;
    activatedRef.current = true;

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    const suckSelector = [
      "[data-suck]",
      ".intro-section .ring-outer",
      ".intro-section .ring-mid",
      ".intro-section .ring-inner",
      ".intro-section .ring-rune1",
      ".intro-section .ring-rune2",
      ".intro-section .nebula",
    ].join(", ");
    suckElementsIntoPortal(cx, cy, suckSelector);

    const main = document.querySelector<HTMLElement>("main");
    if (main) zoomIntoPortal(main, cx, cy, 4200);

    const portalAnchor = document.createElement("div");
    Object.assign(portalAnchor.style, {
      position: "fixed",
      left: `${cx}px`,
      top: `${cy}px`,
      width: "1px",
      height: "1px",
      pointerEvents: "none",
    });
    document.body.appendChild(portalAnchor);

    setTimeout(() => {
      launchTransition(portalAnchor, "/world", router.push.bind(router));
      setTimeout(() => portalAnchor.remove(), 500);
    }, 330);
  };

  const handleDoubleClick = () => activatePortal();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      activatePortal();
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .intro-section {
          background: radial-gradient(ellipse at 50% 50%, #1c0800 0%, #0d0400 45%, #000 100%);
        }

        /* Ambient particles */
        @keyframes floatParticle {
          0%,100% { transform: translateY(0) translateX(0); opacity: var(--op); }
          50%      { transform: translateY(-15px) translateX(8px); }
        }
        .particle { animation: floatParticle var(--dur) ease-in-out infinite var(--delay); opacity: var(--op); }

        /* Spinning rings */
        @keyframes spinCW  { to { transform: translate(-50%,-50%) rotate(360deg);  } }
        @keyframes spinCCW { to { transform: translate(-50%,-50%) rotate(-360deg); } }
        @keyframes ringPulse { 0%,100% { opacity:.4; } 50% { opacity:.9; } }

        .ring-outer { animation: spinCW  70s linear infinite, ringPulse 6s ease-in-out infinite; }
        .ring-mid   { animation: spinCCW 45s linear infinite, ringPulse 4s ease-in-out infinite 1s; }
        .ring-inner { animation: spinCW  28s linear infinite, ringPulse 3s ease-in-out infinite .5s; }
        .ring-rune1 { animation: spinCCW 55s linear infinite; }
        .ring-rune2 { animation: spinCW  38s linear infinite; }

        /* Nebula glow */
        @keyframes nebulaBreath {
          0%,100% { opacity:.5; transform:translate(-50%,-50%) scale(1); }
          50%      { opacity:.8; transform:translate(-50%,-50%) scale(1.1); }
        }
        .nebula { animation: nebulaBreath 5s ease-in-out infinite; }

        /* Title entrance */
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(28px); filter:blur(8px); }
          to   { opacity:1; transform:translateY(0);    filter:blur(0);   }
        }
        .fade-up { animation: fadeUp 1.3s cubic-bezier(.16,1,.3,1) forwards; opacity:0; }

        @keyframes fadeLeft {
          from { opacity:0; transform:translateX(-32px); filter:blur(6px); }
          to   { opacity:1; transform:translateX(0);      filter:blur(0);   }
        }
        .fade-left { animation: fadeLeft 1.3s cubic-bezier(.16,1,.3,1) forwards; opacity:0; }

        @keyframes fadeRight {
          from { opacity:0; transform:translateX(32px); filter:blur(6px); }
          to   { opacity:1; transform:translateX(0);    filter:blur(0);   }
        }
        .fade-right { animation: fadeRight 1.3s cubic-bezier(.16,1,.3,1) forwards; opacity:0; }

        /* Fire gradient */
        .text-fire {
          background: linear-gradient(90deg,#ff6a00 0%,#ee9b00 40%,#94d82d 100%);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
        }

        /* Scroll indicator */
        @keyframes scrollBounce {
          0%,100% { transform:translateY(0);   opacity:.5; }
          50%      { transform:translateY(8px); opacity:1;  }
        }
        .scroll-indicator { animation: scrollBounce 2s ease-in-out infinite; }

        /* Bottom info bar */
        .info-mono {
          font-family: 'Courier New', monospace;
          font-size: 10px;
          letter-spacing: 0.18em;
          color: rgba(255,255,255,0.28);
          text-transform: uppercase;
        }

        /* Runic SVG text */
        .rune-text-outer {
          font-family: serif;
          font-size: 13px;
          letter-spacing: 0.22em;
          fill: rgba(255,150,40,0.38);
        }
        .rune-text-inner {
          font-family: serif;
          font-size: 11px;
          letter-spacing: 0.18em;
          fill: rgba(255,190,60,0.28);
        }
        .orbit-text {
          font-family: 'Courier New', monospace;
          font-size: 10px;
          letter-spacing: 0.3em;
          fill: rgba(255,190,80,0.35);
          text-transform: uppercase;
        }

        /* Focus ring — subtle, on-theme */
        .intro-section:focus-visible {
          outline: 1px solid rgba(255,150,40,0.35);
          outline-offset: -4px;
        }
      `}} />

      <section
        ref={sectionRef}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label="Double-click or press Enter to enter the world"
        className={`intro-section relative w-full overflow-hidden cursor-pointer ${cormorant.variable} ${bebas.variable}`}
        style={{ height: "100vh", minHeight: "100vh" }}
      >
        {/* Ambient particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {mounted && particles.map(p => (
            <div key={p.id} className="particle absolute rounded-full bg-orange-200"
              style={{ left: p.left, top: p.top, width: p.size, height: p.size,
                "--op": p.opacity, "--dur": `${p.duration}s`, "--delay": `${p.delay}s`,
              } as React.CSSProperties} />
          ))}
        </div>

        {/* 3D Portal — absolute-positioned inside THIS section only.
            Scrolls away with the section; does NOT cover other pages. */}
        {mounted && <PortalCanvas active={portalActive} />}

        {/* ── CSS decorative rings centered over the portal ── */}
        <div className="absolute pointer-events-none"
          style={{ left: "50%", top: "50%", zIndex: 3 }}>

          {/* Warm nebula glow */}
          <div className="nebula" style={{
            position: "absolute", left: "50%", top: "50%",
            transform: "translate(-50%,-50%)",
            width: 380, height: 380, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,120,0,0.16) 0%, rgba(255,60,0,0.07) 50%, transparent 70%)",
          }} />

          {/* Outer dashed ring with heavy tick marks */}
          <svg className="ring-outer absolute"
            style={{ left:"50%", top:"50%", transform:"translate(-50%,-50%)" }}
            width={600} height={600} viewBox="0 0 580 580">
            <circle cx={290} cy={290} r={278} fill="none"
              stroke="rgba(255,130,0,0.28)" strokeWidth="1" strokeDasharray="3 9" />
            {TICK_MARKS.map((t, i) => (
              <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
                stroke="rgba(255,150,40,0.45)"
                strokeWidth={i % 12 === 0 ? 2 : i % 4 === 0 ? 1.2 : 0.7} />
            ))}
          </svg>

          {/* Outer ancient rune ring — slow CCW */}
          <svg className="ring-rune1 absolute"
            style={{ left:"50%", top:"50%", transform:"translate(-50%,-50%)", overflow:"visible" }}
            width={620} height={620} viewBox="0 0 620 620">
            <defs>
              <path id="runePathOuter"
                d="M310,310 m-298,0 a298,298 0 1,1 596,0 a298,298 0 1,1 -596,0" />
            </defs>
            <text className="rune-text-outer">
              <textPath href="#runePathOuter" startOffset="0%">{RUNES_OUTER}</textPath>
            </text>
          </svg>

          {/* Mid dashed ring with diamond nodes */}
          <svg className="ring-mid absolute"
            style={{ left:"50%", top:"50%", transform:"translate(-50%,-50%)" }}
            width={500} height={500} viewBox="0 0 480 480">
            <circle cx={240} cy={240} r={228} fill="none"
              stroke="rgba(255,150,50,0.2)" strokeWidth="1" strokeDasharray="2 7" />
            {DIAMOND_NODES.map((d, i) => (
              <rect key={i} x={d.x-3.5} y={d.y-3.5} width={7} height={7}
                fill="none" stroke="rgba(255,200,80,0.6)" strokeWidth="1.2"
                transform={`rotate(45 ${d.x} ${d.y})`} />
            ))}
          </svg>

          {/* Inner rune ring — slow CW */}
          <svg className="ring-rune2 absolute"
            style={{ left:"50%", top:"50%", transform:"translate(-50%,-50%)", overflow:"visible" }}
            width={430} height={430} viewBox="0 0 430 430">
            <defs>
              <path id="runePathInner"
                d="M215,215 m-198,0 a198,198 0 1,1 396,0 a198,198 0 1,1 -396,0" />
            </defs>
            <text className="rune-text-inner">
              <textPath href="#runePathInner" startOffset="5%">{RUNES_INNER}</textPath>
            </text>
          </svg>

          {/* Innermost solid ring */}
          <svg className="ring-inner absolute"
            style={{ left:"50%", top:"50%", transform:"translate(-50%,-50%)" }}
            width={380} height={380} viewBox="0 0 370 370">
            <circle cx={185} cy={185} r={174} fill="none"
              stroke="rgba(255,130,0,0.15)" strokeWidth="0.8" strokeDasharray="1 5" />
          </svg>

          {/* Curved orbit info text */}
          <svg style={{ position:"absolute", left:"50%", top:"50%", transform:"translate(-50%,-50%)", overflow:"visible" }}
            width={530} height={530} viewBox="0 0 530 530">
            <defs>
              <path id="orbitTop"    d="M265,265 m-240,0 a240,240 0 1,1 480,0" />
              <path id="orbitBottom" d="M265,265 m-215,0 a215,215 0 0,0 430,0" />
            </defs>
            <text className="orbit-text">
              <textPath href="#orbitTop" startOffset="10%">
                BSIT Student at WMSU · Full-Stack Developer · Zamboanga ·
              </textPath>
            </text>
            <text className="orbit-text" style={{ fill:"rgba(255,190,80,0.2)" }}>
              <textPath href="#orbitBottom" startOffset="18%">
                vintazk · designer · builder ·
              </textPath>
            </text>
          </svg>
        </div>

        {/* ── Title readability scrim — dims portal behind the text only ── */}
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(780px, 75vw)",
            height: "min(460px, 60vh)",
            zIndex: 9,
            background:
              "radial-gradient(ellipse at center, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.38) 40%, rgba(0,0,0,0.12) 65%, transparent 85%)",
          }}
        />

        {/* ── TITLE ── */}
        <div className="absolute pointer-events-none"
          style={{ left:"50%", top:"50%", transform:"translate(-50%,-50%)", zIndex:10, textAlign:"center", width:"100%" }}>

          <div data-suck className="fade-up" style={{
            fontFamily:"var(--font-cormorant), serif", fontWeight:600,
            fontSize:"clamp(2.5rem,8vw,6rem)", color:"#ffffff",
            letterSpacing:"0.15em", lineHeight:1, textTransform:"uppercase",
            textShadow:"0 2px 18px rgba(0,0,0,0.85), 0 0 40px rgba(0,0,0,0.7), 0 0 80px rgba(255,120,0,0.35)",
            animationDelay:"0.1s", display:"block",
            marginBottom:"-0.05em",
          }}>Kendrick</div>

          <div style={{ display:"flex", alignItems:"baseline", justifyContent:"center", gap:"0.2em" }}>
            <span data-suck className="fade-left" style={{
              fontFamily:"var(--font-cormorant), serif", fontStyle:"italic", fontWeight:300,
              fontSize:"clamp(2rem,7vw,5rem)", color:"rgba(255,200,130,1)",
              letterSpacing:"0.02em", lineHeight:1, animationDelay:"0.4s",
              textShadow:"0 2px 16px rgba(0,0,0,0.85), 0 0 30px rgba(0,0,0,0.6)",
              display:"inline-block",
            }}>Ken</span>

            <span data-suck className="fade-right text-fire" style={{
              fontFamily:"var(--font-bebas), sans-serif",
              fontSize:"clamp(3.5rem,14vw,10rem)", letterSpacing:"-0.02em",
              lineHeight:0.9, animationDelay:"0.6s",
              filter:"drop-shadow(0 2px 14px rgba(0,0,0,0.85)) drop-shadow(0 0 26px rgba(0,0,0,0.6))",
              display:"inline-block",
            }}>_O</span>
          </div>

          <div data-suck className="fade-up" style={{
            fontFamily:"var(--font-cormorant), serif", fontStyle:"italic",
            fontSize:"clamp(0.7rem,1.5vw,0.95rem)", color:"rgba(255,220,170,0.85)",
            letterSpacing:"0.06em", marginTop:"1em", animationDelay:"1s", display:"block",
            textShadow:"0 1px 10px rgba(0,0,0,0.9), 0 0 18px rgba(0,0,0,0.7)",
          }}>
            "Design is not just what it looks like. Design is how it works."
          </div>
        </div>

        {/* ── Scroll indicator (above the bottom bar) ── */}
        <div className="absolute pointer-events-none scroll-indicator"
          style={{ bottom:"5rem", left:"50%", transform:"translateX(-50%)", zIndex:20,
            display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
          <div data-suck style={{
            fontFamily:"var(--font-cormorant), serif", fontSize:10, letterSpacing:"0.35em",
            color:"rgba(255,255,255,0.22)", textTransform:"uppercase",
          }}>Double-click to enter</div>
          <div style={{ width:1, height:36, background:"linear-gradient(to bottom, rgba(255,140,0,0.4), transparent)" }} />
        </div>

        {/* ── Bottom info bar — coordinates + address ── */}
        <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none"
          style={{ padding:"1rem 2.5rem", display:"flex", alignItems:"center", justifyContent:"space-between" }}>

          <div data-suck className="info-mono">6.9214° N &nbsp;·&nbsp; 122.0790° E</div>

          <div data-suck className="info-mono" style={{ textAlign:"center" }}>
            Developer &nbsp;·&nbsp; Designer &nbsp;·&nbsp; Builder
          </div>

          <div data-suck className="info-mono">WMSU &nbsp;—&nbsp; Zamboanga City</div>
        </div>
      </section>
    </>
  );
}