"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

/**
 * HeroCubeGrid — interactive isometric cube grid that pops up under
 * the cursor like a 3D keyboard. Pure geometry with bloom + edge
 * glow; no external assets, lightweight enough for the hero.
 */

const GRID = 9;             // 9×9 = 81 cubes
const CUBE = 0.9;           // cube edge length
const SPACING = 1.15;       // grid spacing
const LIFT_RADIUS = 3.0;    // world units around the cursor that lift
const LIFT_HEIGHT = 1.6;    // how high a directly-touched cube rises
const BASE_Y = 2.0;         // lift the entire grid up in the frame

function CubeGrid() {
  const groupRef = useRef<THREE.Group>(null);
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const targets = useRef<number[]>(new Array(GRID * GRID).fill(0));
  const colors = useRef<number[]>(new Array(GRID * GRID).fill(0));
  const hoverPoint = useRef(new THREE.Vector3(999, 0, 999));
  const localHover = useRef(new THREE.Vector3());
  const ndc = useRef(new THREE.Vector2(99, 99));
  const raycaster = useRef(new THREE.Raycaster());
  // Hover plane sits at the grid's base height so raycast distances are accurate
  const groundPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), -BASE_Y));
  const tmpHit = useRef(new THREE.Vector3());

  const { camera, gl } = useThree();

  // Build cube positions once
  const cubes = useMemo(() => {
    const arr: { x: number; z: number }[] = [];
    const half = (GRID - 1) / 2;
    for (let i = 0; i < GRID; i++) {
      for (let j = 0; j < GRID; j++) {
        arr.push({
          x: (i - half) * SPACING,
          z: (j - half) * SPACING,
        });
      }
    }
    return arr;
  }, []);

  // Track cursor against the canvas in NDC (works without blocking page pointer events)
  useEffect(() => {
    const canvas = gl.domElement;
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      ndc.current.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
    };
    const onLeave = () => {
      ndc.current.set(99, 99); // off-screen
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, [gl]);

  useFrame((state, delta) => {
    // Project NDC onto the ground plane (world-space) to get the cursor's world point
    raycaster.current.setFromCamera(ndc.current, camera);
    const hit = raycaster.current.ray.intersectPlane(
      groundPlane.current,
      tmpHit.current
    );
    if (hit) {
      hoverPoint.current.copy(tmpHit.current);
    } else {
      hoverPoint.current.set(999, 0, 999);
    }

    // Convert world hover point into the rotated group's local frame so
    // distance comparisons against c.x / c.z (local) are accurate.
    localHover.current.copy(hoverPoint.current);
    if (groupRef.current) {
      groupRef.current.worldToLocal(localHover.current);
    }

    // Subtle idle wave so the grid breathes when no one's interacting
    const t = state.clock.getElapsedTime();
    const idleAmp = 0.12;

    cubes.forEach((c, i) => {
      const dx = c.x - localHover.current.x;
      const dz = c.z - localHover.current.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      let target = 0;
      if (dist < LIFT_RADIUS) {
        const k = 1 - dist / LIFT_RADIUS;
        target = LIFT_HEIGHT * k * k; // ease-out
      }
      // overlay a faint sine wave so non-hovered cubes have life
      target += Math.sin(t * 1.4 + (c.x + c.z) * 0.6) * idleAmp;

      targets.current[i] = target;

      // Color factor — closer = warmer (lerp 0→1)
      const colorFactor =
        dist < LIFT_RADIUS ? Math.pow(1 - dist / LIFT_RADIUS, 1.5) : 0;
      colors.current[i] = THREE.MathUtils.lerp(
        colors.current[i],
        colorFactor,
        0.18
      );

      const mesh = meshRefs.current[i];
      if (!mesh) return;

      // Smooth lerp the height
      mesh.position.y = THREE.MathUtils.lerp(
        mesh.position.y,
        targets.current[i],
        0.18
      );

      // Animate edge color via the line material (child).
      // Default = cool off-white; hover = warm off-white. Both muted,
      // not neon — reads as "soft chrome" on a dark background.
      const edges = mesh.children.find(
        (child) => child instanceof THREE.LineSegments
      ) as THREE.LineSegments | undefined;
      if (edges) {
        const mat = edges.material as THREE.LineBasicMaterial;
        if (!mat.color) return;
        mat.color.setRGB(
          THREE.MathUtils.lerp(0.78, 0.92, colors.current[i]), // R: cool → warm
          THREE.MathUtils.lerp(0.80, 0.84, colors.current[i]), // G: stable mid
          THREE.MathUtils.lerp(0.86, 0.80, colors.current[i])  // B: cooler at rest
        );
      }
    });

    // Slow ambient yaw on the whole group for that "table is alive" feel
    if (state.scene) {
      // no-op; group rotation handled in parent
    }
    void delta;
  });

  return (
    <group ref={groupRef} position={[0, BASE_Y, 0]} rotation={[0, Math.PI / 6, 0]}>
      {cubes.map((c, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshRefs.current[i] = el;
          }}
          position={[c.x, 0, c.z]}
          castShadow={false}
          receiveShadow={false}
        >
          <boxGeometry args={[CUBE, CUBE, CUBE]} />
          <meshStandardMaterial
            color="#0c0c12"
            metalness={0.4}
            roughness={0.55}
            transparent
            opacity={0.72}
          />
          <Edges color="#c7c8cf" lineWidth={1} threshold={15} />
        </mesh>
      ))}
    </group>
  );
}

export default function HeroCubeGrid() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[1] hidden md:block"
    >
      <Canvas
        camera={{ position: [12, 11, 12], fov: 32 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[10, 12, 8]} intensity={0.45} />
        <directionalLight position={[-8, 6, -4]} intensity={0.25} color="#c7c8cf" />
        <Suspense fallback={null}>
          <CubeGrid />
        </Suspense>
        <EffectComposer>
          <Bloom
            intensity={0.35}
            luminanceThreshold={0.55}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
