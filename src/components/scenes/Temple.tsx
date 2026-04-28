"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  FlyControls,
  Environment,
  Sky,
  RoundedBox,
  ContactShadows,
} from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  SSAO,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { ToneMappingMode, BlendFunction } from "postprocessing";
import { useEffect, useMemo, useRef, useState, type JSX } from "react";
import * as THREE from "three";

const STONE_PALETTE = [
  "#7a5538",
  "#8a6443",
  "#9c7350",
  "#6e4a30",
  "#a78460",
  "#8f6b48",
  "#b89274",
  "#6a4628",
];

const VERDIGRIS = "#5a8a7a";

function pickStone(seed: number) {
  return STONE_PALETTE[Math.floor(Math.abs(Math.sin(seed * 12.9898) * 43758.5453) % STONE_PALETTE.length)];
}

type BlockProps = {
  position: [number, number, number];
  size: [number, number, number];
  color?: string;
  rotation?: [number, number, number];
  castShadow?: boolean;
  receiveShadow?: boolean;
};

function StoneBlock({
  position,
  size,
  color,
  rotation = [0, 0, 0],
  castShadow = true,
  receiveShadow = true,
}: BlockProps) {
  const seed = position[0] * 1.3 + position[1] * 7.7 + position[2] * 3.1;
  const c = color ?? pickStone(seed);
  return (
    <RoundedBox
      args={size}
      radius={0.04}
      smoothness={3}
      position={position}
      rotation={rotation}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    >
      <meshStandardMaterial color={c} roughness={0.92} metalness={0.02} />
    </RoundedBox>
  );
}

// A masonry "shell" — covers the visible faces of a tier with individual blocks
function MasonryTier({
  cx,
  cz,
  y,
  width,
  depth,
  height,
  blockW = 1.2,
  blockH = 0.7,
}: {
  cx: number;
  cz: number;
  y: number;
  width: number;
  depth: number;
  height: number;
  blockW?: number;
  blockH?: number;
}) {
  const blocks: JSX.Element[] = [];
  const rows = Math.max(1, Math.floor(height / blockH));
  const rowH = height / rows;

  // core fill (cheap single mesh hidden inside)
  blocks.push(
    <mesh
      key="core"
      position={[cx, y + height / 2, cz]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[width - 0.2, height, depth - 0.2]} />
      <meshStandardMaterial color="#5a3e29" roughness={0.95} />
    </mesh>,
  );

  // four side shells
  for (let r = 0; r < rows; r++) {
    const yy = y + r * rowH + rowH / 2;
    const offset = (r % 2) * (blockW / 2);

    // front + back
    const cols = Math.ceil((width + blockW) / blockW);
    for (let i = 0; i < cols; i++) {
      const x = cx - width / 2 + i * blockW - offset + blockW / 2;
      if (x < cx - width / 2 - 0.2 || x > cx + width / 2 + 0.2) continue;
      const w = Math.min(blockW * 0.95, cx + width / 2 - (x - blockW / 2));
      blocks.push(
        <StoneBlock
          key={`f-${r}-${i}`}
          position={[x, yy, cz + depth / 2 - 0.05]}
          size={[Math.max(0.3, w), rowH * 0.96, 0.2]}
        />,
      );
      blocks.push(
        <StoneBlock
          key={`b-${r}-${i}`}
          position={[x, yy, cz - depth / 2 + 0.05]}
          size={[Math.max(0.3, w), rowH * 0.96, 0.2]}
        />,
      );
    }
    // left + right
    const colsZ = Math.ceil((depth + blockW) / blockW);
    for (let i = 0; i < colsZ; i++) {
      const z = cz - depth / 2 + i * blockW - offset + blockW / 2;
      if (z < cz - depth / 2 - 0.2 || z > cz + depth / 2 + 0.2) continue;
      const w = Math.min(blockW * 0.95, cz + depth / 2 - (z - blockW / 2));
      blocks.push(
        <StoneBlock
          key={`l-${r}-${i}`}
          position={[cx - width / 2 + 0.05, yy, z]}
          size={[0.2, rowH * 0.96, Math.max(0.3, w)]}
        />,
      );
      blocks.push(
        <StoneBlock
          key={`r-${r}-${i}`}
          position={[cx + width / 2 - 0.05, yy, z]}
          size={[0.2, rowH * 0.96, Math.max(0.3, w)]}
        />,
      );
    }
  }

  return <group>{blocks}</group>;
}

function Cornice({
  cx,
  cz,
  y,
  width,
  depth,
}: {
  cx: number;
  cz: number;
  y: number;
  width: number;
  depth: number;
}) {
  return (
    <group>
      <RoundedBox
        args={[width + 0.6, 0.4, depth + 0.6]}
        radius={0.08}
        smoothness={3}
        position={[cx, y + 0.2, cz]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#8c6a47" roughness={0.88} />
      </RoundedBox>
      <RoundedBox
        args={[width + 0.3, 0.18, depth + 0.3]}
        radius={0.05}
        smoothness={3}
        position={[cx, y + 0.5, cz]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#a07a55" roughness={0.85} />
      </RoundedBox>
      {/* verdigris cap strip */}
      <mesh position={[cx, y + 0.62, cz]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.2, 0.06, depth + 0.2]} />
        <meshStandardMaterial
          color={VERDIGRIS}
          roughness={0.55}
          metalness={0.45}
        />
      </mesh>
    </group>
  );
}

function FriezePanels({
  cx,
  cz,
  y,
  width,
  depth,
  count = 10,
}: {
  cx: number;
  cz: number;
  y: number;
  width: number;
  depth: number;
  count?: number;
}) {
  const panels: JSX.Element[] = [];
  const stepX = width / count;
  const stepZ = depth / count;
  for (let i = 0; i < count; i++) {
    const x = cx - width / 2 + stepX / 2 + i * stepX;
    const z = cz - depth / 2 + stepZ / 2 + i * stepZ;
    panels.push(
      <mesh key={`fp-f-${i}`} position={[x, y, cz + depth / 2 + 0.05]} castShadow>
        <boxGeometry args={[stepX * 0.7, 0.5, 0.08]} />
        <meshStandardMaterial color="#735036" roughness={0.9} />
      </mesh>,
    );
    panels.push(
      <mesh key={`fp-b-${i}`} position={[x, y, cz - depth / 2 - 0.05]} castShadow>
        <boxGeometry args={[stepX * 0.7, 0.5, 0.08]} />
        <meshStandardMaterial color="#735036" roughness={0.9} />
      </mesh>,
    );
    panels.push(
      <mesh key={`fp-l-${i}`} position={[cx - width / 2 - 0.05, y, z]} castShadow>
        <boxGeometry args={[0.08, 0.5, stepZ * 0.7]} />
        <meshStandardMaterial color="#735036" roughness={0.9} />
      </mesh>,
    );
    panels.push(
      <mesh key={`fp-r-${i}`} position={[cx + width / 2 + 0.05, y, z]} castShadow>
        <boxGeometry args={[0.08, 0.5, stepZ * 0.7]} />
        <meshStandardMaterial color="#735036" roughness={0.9} />
      </mesh>,
    );
  }
  return <group>{panels}</group>;
}

function Pillar({ position, height = 6 }: { position: [number, number, number]; height?: number }) {
  return (
    <group position={position}>
      {/* base */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.85, 0.95, 0.5, 24]} />
        <meshStandardMaterial color="#8a6443" roughness={0.9} />
      </mesh>
      {/* fluted shaft (approx with many cylinder segments) */}
      <mesh position={[0, 0.5 + height / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.7, 0.78, height, 20]} />
        <meshStandardMaterial color="#a17850" roughness={0.92} />
      </mesh>
      {/* fluting fake — vertical thin strips */}
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.74, 0.5 + height / 2, Math.sin(a) * 0.74]}
            rotation={[0, -a, 0]}
            castShadow
          >
            <boxGeometry args={[0.06, height, 0.04]} />
            <meshStandardMaterial color="#7a5538" roughness={0.95} />
          </mesh>
        );
      })}
      {/* capital */}
      <mesh position={[0, 0.5 + height + 0.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.95, 0.75, 0.4, 24]} />
        <meshStandardMaterial color="#9c7350" roughness={0.88} />
      </mesh>
      <RoundedBox
        args={[2.0, 0.3, 2.0]}
        radius={0.06}
        smoothness={3}
        position={[0, 0.5 + height + 0.55, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#b89274" roughness={0.85} />
      </RoundedBox>
    </group>
  );
}

function Brazier({ position }: { position: [number, number, number] }) {
  const flameRef = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (flameRef.current) {
      const t = clock.elapsedTime;
      flameRef.current.intensity =
        2.5 + Math.sin(t * 8) * 0.4 + Math.sin(t * 17) * 0.25;
    }
  });
  return (
    <group position={position}>
      {/* pedestal */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.4, 0.5, 1.0, 16]} />
        <meshStandardMaterial color="#7a5538" roughness={0.9} />
      </mesh>
      {/* bowl - verdigris */}
      <mesh position={[0, 1.15, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.65, 0.4, 0.4, 24]} />
        <meshStandardMaterial color={VERDIGRIS} roughness={0.5} metalness={0.55} />
      </mesh>
      {/* glowing coals */}
      <mesh position={[0, 1.32, 0]}>
        <sphereGeometry args={[0.5, 16, 12]} />
        <meshStandardMaterial
          color="#ff7a2e"
          emissive="#ff5a1a"
          emissiveIntensity={2.5}
          roughness={1}
        />
      </mesh>
      <pointLight
        ref={flameRef}
        position={[0, 1.5, 0]}
        color="#ff8a3a"
        intensity={2.5}
        distance={12}
        decay={2}
        castShadow
      />
    </group>
  );
}

function GuardianStatue({ position, facing = 0 }: { position: [number, number, number]; facing?: number }) {
  return (
    <group position={position} rotation={[0, facing, 0]}>
      {/* plinth */}
      <RoundedBox args={[2.2, 1.0, 2.2]} radius={0.05} smoothness={3} position={[0, 0.5, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#6e4a30" roughness={0.92} />
      </RoundedBox>
      {/* body — abstract seated guardian */}
      <RoundedBox args={[1.6, 2.6, 1.4]} radius={0.15} smoothness={3} position={[0, 2.3, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#8a6443" roughness={0.92} />
      </RoundedBox>
      {/* head */}
      <RoundedBox args={[1.0, 1.1, 1.0]} radius={0.2} smoothness={4} position={[0, 4.1, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#9c7350" roughness={0.9} />
      </RoundedBox>
      {/* headdress crest */}
      <mesh position={[0, 4.95, 0]} castShadow>
        <coneGeometry args={[0.55, 0.9, 4]} />
        <meshStandardMaterial color={VERDIGRIS} roughness={0.55} metalness={0.5} />
      </mesh>
      {/* arms resting forward */}
      <RoundedBox args={[0.5, 0.5, 1.6]} radius={0.1} smoothness={3} position={[-0.7, 2.2, 0.5]} castShadow>
        <meshStandardMaterial color="#7a5538" roughness={0.92} />
      </RoundedBox>
      <RoundedBox args={[0.5, 0.5, 1.6]} radius={0.1} smoothness={3} position={[0.7, 2.2, 0.5]} castShadow>
        <meshStandardMaterial color="#7a5538" roughness={0.92} />
      </RoundedBox>
    </group>
  );
}

// deterministic pseudo-random
function rand(seed: number) {
  const s = Math.sin(seed * 91.7 + 13.37) * 43758.5453;
  return s - Math.floor(s);
}

const MOSS_PALETTE = [
  "#3d5a2e",
  "#4a6b3a",
  "#577a45",
  "#2f4a25",
  "#6b8a4a",
  "#5a7a55",
  "#3a5530",
];

// 3D moss clump — cluster of small lumpy spheres in varied greens.
// Position is the anchor point; clump grows outward and upward from it.
function MossClump({
  position,
  scale = 1,
  seed = 0,
  spread = 0.4,
}: {
  position: [number, number, number];
  scale?: number;
  seed?: number;
  spread?: number;
}) {
  const lumps = useMemo(() => {
    const count = 5 + Math.floor(rand(seed) * 6);
    const out: { p: [number, number, number]; r: number; c: string; rot: [number, number, number] }[] = [];
    for (let i = 0; i < count; i++) {
      const a = rand(seed + i * 11) * Math.PI * 2;
      const dist = rand(seed + i * 13 + 1) * spread;
      const px = Math.cos(a) * dist;
      const pz = Math.sin(a) * dist;
      const py = rand(seed + i * 17 + 3) * 0.06 * scale;
      const r = (0.06 + rand(seed + i * 19 + 5) * 0.11) * scale;
      const c = MOSS_PALETTE[Math.floor(rand(seed + i * 23 + 7) * MOSS_PALETTE.length)];
      out.push({
        p: [px, py, pz],
        r,
        c,
        rot: [
          rand(seed + i * 29) * Math.PI,
          rand(seed + i * 31) * Math.PI,
          rand(seed + i * 37) * Math.PI,
        ],
      });
    }
    return out;
  }, [seed, scale, spread]);

  return (
    <group position={position}>
      {lumps.map((l, i) => (
        <mesh
          key={i}
          position={l.p}
          rotation={l.rot}
          scale={[1, 0.55 + rand(seed + i * 41) * 0.4, 1]}
          castShadow
          receiveShadow
        >
          <icosahedronGeometry args={[l.r, 0]} />
          <meshStandardMaterial
            color={l.c}
            roughness={1}
            flatShading
            emissive={l.c}
            emissiveIntensity={0.04}
          />
        </mesh>
      ))}
      {/* fine moss fuzz — tiny dots for surface texture */}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = rand(seed + 200 + i * 7) * Math.PI * 2;
        const d = rand(seed + 210 + i * 7) * spread * 1.1;
        const c = MOSS_PALETTE[Math.floor(rand(seed + 220 + i) * MOSS_PALETTE.length)];
        return (
          <mesh
            key={`f-${i}`}
            position={[Math.cos(a) * d, 0.01 * scale, Math.sin(a) * d]}
          >
            <icosahedronGeometry args={[0.025 * scale, 0]} />
            <meshStandardMaterial color={c} roughness={1} flatShading />
          </mesh>
        );
      })}
    </group>
  );
}

function Staircase({
  cx,
  cz,
  yStart,
  yEnd,
  width,
  steps = 14,
  depthPerStep = 0.6,
}: {
  cx: number;
  cz: number;
  yStart: number;
  yEnd: number;
  width: number;
  steps?: number;
  depthPerStep?: number;
}) {
  const list: JSX.Element[] = [];
  const stepH = (yEnd - yStart) / steps;

  // side balustrades / cheek walls
  const totalDepth = steps * depthPerStep;
  for (const sign of [-1, 1]) {
    list.push(
      <mesh
        key={`cheek-${sign}`}
        position={[
          cx + sign * (width / 2 + 0.45),
          yStart + (yEnd - yStart) / 2,
          cz + totalDepth / 2,
        ]}
        rotation={[Math.atan2(yEnd - yStart, totalDepth), 0, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry
          args={[0.7, 1.1, Math.hypot(yEnd - yStart, totalDepth) + 0.3]}
        />
        <meshStandardMaterial color="#6e4a30" roughness={0.95} />
      </mesh>,
    );
  }

  for (let i = 0; i < steps; i++) {
    const w = width - i * 0.05;
    const y = yStart + stepH / 2 + i * stepH;
    const z = cz + depthPerStep / 2 + i * depthPerStep;

    // base step slab — broken into 3 segments for masonry feel
    const segments = 3;
    for (let s = 0; s < segments; s++) {
      const segW = w / segments;
      const sx = cx - w / 2 + segW / 2 + s * segW;
      const seed = i * 17 + s * 3;
      const wear = rand(seed);
      const heightJitter = 1 + (rand(seed + 5) - 0.5) * 0.06;
      const yJitter = (rand(seed + 11) - 0.5) * 0.04;
      const tone =
        wear < 0.2
          ? "#6a4628"
          : wear < 0.5
          ? "#8a6443"
          : wear < 0.8
          ? "#9c7350"
          : "#a78460";

      list.push(
        <RoundedBox
          key={`s-${i}-${s}`}
          args={[segW * 0.97, stepH * 1.05 * heightJitter, depthPerStep]}
          radius={0.04}
          smoothness={3}
          position={[sx, y + yJitter, z]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color={tone} roughness={0.95} metalness={0.02} />
        </RoundedBox>,
      );

      // chipped corner — small displaced cube sitting on tread
      if (rand(seed + 21) > 0.78) {
        const cs = 0.18 + rand(seed + 31) * 0.18;
        list.push(
          <mesh
            key={`chip-${i}-${s}`}
            position={[
              sx + (rand(seed + 41) - 0.5) * segW * 0.6,
              y + stepH * 0.55,
              z + (rand(seed + 51) - 0.5) * depthPerStep * 0.6,
            ]}
            rotation={[
              rand(seed + 61) * 0.6,
              rand(seed + 71) * Math.PI,
              rand(seed + 81) * 0.6,
            ]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[cs, cs * 0.7, cs * 0.9]} />
            <meshStandardMaterial color="#5a3e29" roughness={1} />
          </mesh>,
        );
      }

      // 3D moss clump tucked against the back riser of the tread
      if (rand(seed + 91) > 0.55) {
        const mossX = sx + (rand(seed + 101) - 0.5) * segW * 0.75;
        const mossScale = 0.7 + rand(seed + 113) * 0.7;
        list.push(
          <MossClump
            key={`moss-${i}-${s}`}
            position={[mossX, y + stepH * 0.5, z - depthPerStep * 0.42]}
            scale={mossScale}
            seed={seed + 91}
            spread={0.25 + rand(seed + 117) * 0.25}
          />,
        );
      }

      // moss creeping along front edge of step (less common, smaller)
      if (rand(seed + 191) > 0.78) {
        list.push(
          <MossClump
            key={`moss-edge-${i}-${s}`}
            position={[
              sx + (rand(seed + 193) - 0.5) * segW * 0.6,
              y + stepH * 0.52,
              z + depthPerStep * 0.4,
            ]}
            scale={0.5 + rand(seed + 195) * 0.35}
            seed={seed + 197}
            spread={0.18}
          />,
        );
      }

      // moss in the seam between segments (vertical crack moss)
      if (s < segments - 1 && rand(seed + 231) > 0.7) {
        list.push(
          <MossClump
            key={`moss-seam-${i}-${s}`}
            position={[
              sx + segW * 0.48,
              y + stepH * 0.5,
              z + (rand(seed + 233) - 0.5) * depthPerStep * 0.5,
            ]}
            scale={0.45 + rand(seed + 237) * 0.3}
            seed={seed + 239}
            spread={0.14}
          />,
        );
      }

      // hairline crack — thin dark inset on tread surface
      if (rand(seed + 151) > 0.85) {
        list.push(
          <mesh
            key={`crack-${i}-${s}`}
            position={[
              sx + (rand(seed + 161) - 0.5) * segW * 0.5,
              y + stepH * 0.55,
              z + (rand(seed + 171) - 0.5) * depthPerStep * 0.4,
            ]}
            rotation={[-Math.PI / 2, 0, rand(seed + 181) * Math.PI]}
          >
            <planeGeometry args={[0.5 + rand(seed + 191) * 0.5, 0.02]} />
            <meshStandardMaterial color="#2a1a0e" roughness={1} />
          </mesh>,
        );
      }
    }

    // sand drift along tread edge on lower steps
    if (i < steps * 0.4 && rand(i + 200) > 0.5) {
      list.push(
        <mesh
          key={`sand-${i}`}
          position={[
            cx + (rand(i + 210) - 0.5) * w * 0.6,
            y + stepH * 0.52,
            z + depthPerStep * 0.35,
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[1.2 + rand(i + 220) * 1.5, 0.4]} />
          <meshStandardMaterial color="#c9a878" roughness={1} />
        </mesh>,
      );
    }
  }
  return <group>{list}</group>;
}

// horizontal stone slab bridging top of stairs to the colonnade entrance
function LandingSlab({
  cx,
  zStart,
  zEnd,
  y,
  width,
}: {
  cx: number;
  zStart: number;
  zEnd: number;
  y: number;
  width: number;
}) {
  const depth = zEnd - zStart;
  const cz = (zStart + zEnd) / 2;
  const slabs: JSX.Element[] = [];

  // main slab base
  slabs.push(
    <RoundedBox
      key="slab-core"
      args={[width, 0.5, depth]}
      radius={0.05}
      smoothness={3}
      position={[cx, y - 0.25, cz]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial color="#7a5538" roughness={0.95} />
    </RoundedBox>,
  );

  // tiled flagstones on top
  const tilesX = 6;
  const tilesZ = Math.max(2, Math.round(depth / 1.6));
  const tileW = width / tilesX;
  const tileD = depth / tilesZ;
  for (let i = 0; i < tilesX; i++) {
    for (let j = 0; j < tilesZ; j++) {
      const seed = i * 7 + j * 13 + 401;
      const wear = rand(seed);
      const tone =
        wear < 0.25
          ? "#6e4a30"
          : wear < 0.55
          ? "#8a6443"
          : wear < 0.85
          ? "#9c7350"
          : "#a78460";
      const sx = cx - width / 2 + tileW / 2 + i * tileW;
      const sz = zStart + tileD / 2 + j * tileD;
      slabs.push(
        <RoundedBox
          key={`tile-${i}-${j}`}
          args={[tileW * 0.96, 0.18, tileD * 0.96]}
          radius={0.03}
          smoothness={2}
          position={[sx, y + 0.09, sz]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color={tone} roughness={0.95} />
        </RoundedBox>,
      );
      // moss in seams — 3D clumps along tile edges
      if (rand(seed + 17) > 0.65) {
        slabs.push(
          <MossClump
            key={`tmoss-${i}-${j}`}
            position={[
              sx + (rand(seed + 23) - 0.5) * tileW * 0.5,
              y + 0.18,
              sz + tileD * 0.45,
            ]}
            scale={0.6 + rand(seed + 27) * 0.5}
            seed={seed + 29}
            spread={0.22}
          />,
        );
      }
      if (rand(seed + 41) > 0.78) {
        slabs.push(
          <MossClump
            key={`tmoss2-${i}-${j}`}
            position={[
              sx + tileW * 0.45,
              y + 0.18,
              sz + (rand(seed + 43) - 0.5) * tileD * 0.6,
            ]}
            scale={0.5 + rand(seed + 47) * 0.4}
            seed={seed + 49}
            spread={0.18}
          />,
        );
      }
    }
  }

  // verdigris border strip on outer edge
  slabs.push(
    <mesh
      key="border-front"
      position={[cx, y + 0.05, zStart - 0.05]}
      castShadow
    >
      <boxGeometry args={[width + 0.2, 0.1, 0.15]} />
      <meshStandardMaterial color={VERDIGRIS} roughness={0.55} metalness={0.45} />
    </mesh>,
  );

  return <group>{slabs}</group>;
}

function Pediment({ cx, cz, y, width }: { cx: number; cz: number; y: number; width: number }) {
  // triangular prism via custom geometry
  const geom = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, 0);
    shape.lineTo(width / 2, 0);
    shape.lineTo(0, width * 0.22);
    shape.lineTo(-width / 2, 0);
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: 1.5,
      bevelEnabled: true,
      bevelSize: 0.08,
      bevelThickness: 0.05,
      bevelSegments: 2,
    });
    g.translate(0, 0, -0.75);
    return g;
  }, [width]);

  return (
    <group position={[cx, y, cz]}>
      <mesh geometry={geom} castShadow receiveShadow>
        <meshStandardMaterial color="#a07a55" roughness={0.88} />
      </mesh>
      {/* relief band along the base of pediment */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[width * 0.96, 0.3, 1.6]} />
        <meshStandardMaterial color="#7a5538" roughness={0.95} />
      </mesh>
      {/* center medallion (verdigris) */}
      <mesh position={[0, width * 0.1, 0.81]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 0.15, 24]} />
        <meshStandardMaterial color={VERDIGRIS} roughness={0.5} metalness={0.55} />
      </mesh>
    </group>
  );
}

function SlitWindows({
  cx,
  cz,
  y,
  width,
  depth,
  count = 5,
}: {
  cx: number;
  cz: number;
  y: number;
  width: number;
  depth: number;
  count?: number;
}) {
  const items: JSX.Element[] = [];
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count;
    const x = cx - width / 2 + t * width;
    const z = cz - depth / 2 + t * depth;
    // front
    items.push(
      <mesh key={`w-f-${i}`} position={[x, y, cz + depth / 2 + 0.06]}>
        <boxGeometry args={[0.25, 1.2, 0.05]} />
        <meshStandardMaterial color="#1a0e07" roughness={1} />
      </mesh>,
    );
    items.push(
      <mesh key={`w-b-${i}`} position={[x, y, cz - depth / 2 - 0.06]}>
        <boxGeometry args={[0.25, 1.2, 0.05]} />
        <meshStandardMaterial color="#1a0e07" roughness={1} />
      </mesh>,
    );
    items.push(
      <mesh key={`w-l-${i}`} position={[cx - width / 2 - 0.06, y, z]}>
        <boxGeometry args={[0.05, 1.2, 0.25]} />
        <meshStandardMaterial color="#1a0e07" roughness={1} />
      </mesh>,
    );
    items.push(
      <mesh key={`w-r-${i}`} position={[cx + width / 2 + 0.06, y, z]}>
        <boxGeometry args={[0.05, 1.2, 0.25]} />
        <meshStandardMaterial color="#1a0e07" roughness={1} />
      </mesh>,
    );
  }
  return <group>{items}</group>;
}

function Doorway({ cx, cz, y }: { cx: number; cz: number; y: number }) {
  return (
    <group position={[cx, y, cz]}>
      {/* recessed dark interior */}
      <mesh position={[0, 2.2, -0.4]}>
        <boxGeometry args={[3.2, 4.4, 0.2]} />
        <meshStandardMaterial color="#0e0805" roughness={1} />
      </mesh>
      {/* frame — verdigris-trimmed sandstone */}
      <RoundedBox args={[3.8, 0.4, 0.6]} radius={0.04} smoothness={3} position={[0, 4.6, 0]} castShadow>
        <meshStandardMaterial color="#a07a55" roughness={0.85} />
      </RoundedBox>
      <RoundedBox args={[0.4, 5, 0.6]} radius={0.04} smoothness={3} position={[-1.7, 2.2, 0]} castShadow>
        <meshStandardMaterial color="#8a6443" roughness={0.9} />
      </RoundedBox>
      <RoundedBox args={[0.4, 5, 0.6]} radius={0.04} smoothness={3} position={[1.7, 2.2, 0]} castShadow>
        <meshStandardMaterial color="#8a6443" roughness={0.9} />
      </RoundedBox>
      {/* lintel verdigris band */}
      <mesh position={[0, 4.85, 0.05]} castShadow>
        <boxGeometry args={[3.6, 0.12, 0.5]} />
        <meshStandardMaterial color={VERDIGRIS} roughness={0.5} metalness={0.55} />
      </mesh>
      {/* glyph row */}
      {Array.from({ length: 7 }).map((_, i) => (
        <mesh key={i} position={[-1.5 + i * 0.5, 4.95, 0.31]}>
          <boxGeometry args={[0.18, 0.18, 0.04]} />
          <meshStandardMaterial color="#5a3e29" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[400, 400]} />
      <meshStandardMaterial color="#7a5a3e" roughness={1} />
    </mesh>
  );
}

function TempleStructure() {
  // tier dimensions (width, depth, height) bottom -> top
  const tiers = [
    { w: 36, d: 28, h: 3 },
    { w: 30, d: 23, h: 2.6 },
    { w: 24, d: 19, h: 2.4 },
    { w: 19, d: 15, h: 2.2 },
    { w: 14, d: 11, h: 2.0 },
  ];

  let yCursor = 0;
  const tierEls: JSX.Element[] = [];
  const cornices: JSX.Element[] = [];
  const friezes: JSX.Element[] = [];
  const windows: JSX.Element[] = [];

  tiers.forEach((t, i) => {
    tierEls.push(
      <MasonryTier
        key={`tier-${i}`}
        cx={0}
        cz={0}
        y={yCursor}
        width={t.w}
        depth={t.d}
        height={t.h}
      />,
    );
    cornices.push(
      <Cornice key={`c-${i}`} cx={0} cz={0} y={yCursor + t.h - 0.4} width={t.w} depth={t.d} />,
    );
    if (i > 0) {
      friezes.push(
        <FriezePanels
          key={`f-${i}`}
          cx={0}
          cz={0}
          y={yCursor + t.h * 0.55}
          width={t.w}
          depth={t.d}
          count={Math.max(6, 14 - i * 2)}
        />,
      );
    }
    if (i >= 2) {
      windows.push(
        <SlitWindows
          key={`sw-${i}`}
          cx={0}
          cz={0}
          y={yCursor + t.h * 0.6}
          width={t.w - 0.5}
          depth={t.d - 0.5}
          count={Math.max(3, 7 - i)}
        />,
      );
    }
    yCursor += t.h;
  });

  const topY = yCursor;
  const topTier = tiers[tiers.length - 1];

  // Crowning shrine on top tier
  const shrine = (
    <group>
      <MasonryTier cx={0} cz={0} y={topY} width={8} depth={6.5} height={3} />
      <Cornice cx={0} cz={0} y={topY + 2.6} width={8} depth={6.5} />
      {/* roof cap verdigris */}
      <mesh position={[0, topY + 3.4, 0]} castShadow receiveShadow>
        <coneGeometry args={[5.2, 1.6, 4]} />
        <meshStandardMaterial color={VERDIGRIS} roughness={0.5} metalness={0.55} />
      </mesh>
      <mesh position={[0, topY + 4.6, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.18, 1.2, 12]} />
        <meshStandardMaterial color={VERDIGRIS} roughness={0.5} metalness={0.55} />
      </mesh>
    </group>
  );

  // Colonnaded entrance attached to FRONT of top tier
  const colonnadeZ = topTier.d / 2 + 2.5;
  const pillarCount = 8;
  const colWidth = topTier.w + 1.0;
  const pillarSpacing = colWidth / (pillarCount - 1);

  const pillars: JSX.Element[] = [];
  for (let i = 0; i < pillarCount; i++) {
    const x = -colWidth / 2 + i * pillarSpacing;
    pillars.push(<Pillar key={i} position={[x, topY, colonnadeZ]} height={5.5} />);
  }

  const entablatureY = topY + 6.5;
  const entablature = (
    <group>
      <RoundedBox
        args={[colWidth + 1.5, 0.7, 3.2]}
        radius={0.05}
        smoothness={3}
        position={[0, entablatureY, colonnadeZ]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#a07a55" roughness={0.88} />
      </RoundedBox>
      <FriezePanels
        cx={0}
        cz={colonnadeZ}
        y={entablatureY}
        width={colWidth + 1.0}
        depth={3.0}
        count={14}
      />
      <mesh position={[0, entablatureY + 0.45, colonnadeZ]} castShadow>
        <boxGeometry args={[colWidth + 1.2, 0.15, 3.0]} />
        <meshStandardMaterial color={VERDIGRIS} roughness={0.5} metalness={0.55} />
      </mesh>
    </group>
  );

  const pediment = (
    <Pediment cx={0} cz={colonnadeZ} y={entablatureY + 0.55} width={colWidth + 1.4} />
  );

  // staircase from ground up to top tier (entrance level)
  const stairWidth = 10;
  const stairStepCount = Math.round(topY / 0.6);
  const stairDepthPerStep = 0.7;
  const stairStartZ = tiers[0].d / 2;
  const stairTopZ = stairStartZ + stairStepCount * stairDepthPerStep;
  const staircase = (
    <Staircase
      cx={0}
      cz={stairStartZ}
      yStart={0}
      yEnd={topY}
      width={stairWidth}
      steps={stairStepCount}
      depthPerStep={stairDepthPerStep}
    />
  );

  // landing slab connecting top of stairs back to the colonnade base
  // (stairs land far in front; without this there is a gap above the lower tiers)
  const landing = (
    <LandingSlab
      cx={0}
      zStart={topTier.d / 2}
      zEnd={stairTopZ}
      y={topY}
      width={stairWidth + 4}
    />
  );

  // secondary slab landing spanning the colonnade floor itself
  const colonnadeFloor = (
    <LandingSlab
      cx={0}
      zStart={topTier.d / 2 - 0.1}
      zEnd={colonnadeZ + 1.8}
      y={topY}
      width={colWidth + 1.0}
    />
  );

  // guardians at base of stairs
  const stairFrontZ = tiers[0].d / 2 + (topY / 0.6) * 0.7 + 1.5;
  const guardians = (
    <>
      <GuardianStatue position={[-7, 0, stairFrontZ - 1]} facing={Math.PI} />
      <GuardianStatue position={[7, 0, stairFrontZ - 1]} facing={Math.PI} />
    </>
  );

  // braziers flanking entrance at top
  const braziers = (
    <>
      <Brazier position={[-colWidth / 2 - 1.2, topY, colonnadeZ + 1.5]} />
      <Brazier position={[colWidth / 2 + 1.2, topY, colonnadeZ + 1.5]} />
    </>
  );

  const doorway = <Doorway cx={0} cz={topTier.d / 2 + 0.05} y={topY} />;

  return (
    <group>
      {tierEls}
      {cornices}
      {friezes}
      {windows}
      {shrine}
      {pillars}
      {entablature}
      {pediment}
      {staircase}
      {landing}
      {colonnadeFloor}
      {guardians}
      {braziers}
      {doorway}
    </group>
  );
}

function CameraRig({ flyMode }: { flyMode: boolean }) {
  if (flyMode) {
    return (
      <FlyControls
        movementSpeed={25}
        rollSpeed={0.6}
        dragToLook
        autoForward={false}
      />
    );
  }
  return (
    <OrbitControls
      target={[0, 8, 0]}
      maxPolarAngle={Math.PI / 2 - 0.05}
      minDistance={5}
      maxDistance={300}
      enableDamping
      dampingFactor={0.06}
    />
  );
}

function Scene({ flyMode }: { flyMode: boolean }) {
  const sunRef = useRef<THREE.DirectionalLight>(null);

  return (
    <>
      <fogExp2 attach="fog" args={["#c4a880", 0.008]} />
      <color attach="background" args={["#d8b48a"]} />

      <hemisphereLight args={["#b8a890", "#4a3525", 0.6]} />
      <ambientLight intensity={0.15} />
      <directionalLight
        ref={sunRef}
        position={[-40, 35, 25]}
        intensity={2.2}
        color="#ffd9a8"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={200}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-bias={-0.0003}
      />

      <Sky
        distance={450000}
        sunPosition={[-40, 18, 25]}
        inclination={0.49}
        azimuth={0.25}
        turbidity={8}
        rayleigh={3}
        mieCoefficient={0.01}
        mieDirectionalG={0.85}
      />

      <Environment preset="sunset" />

      <Ground />
      <TempleStructure />

      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.45}
        scale={120}
        blur={2.5}
        far={20}
      />

      <CameraRig flyMode={flyMode} />
    </>
  );
}

export default function Temple() {
  const [flyMode, setFlyMode] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "v" || e.key === "V") setFlyMode((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div style={{ width: "100%", height: "100vh", background: "#000", position: "relative" }}>
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          zIndex: 10,
          padding: "10px 14px",
          background: "rgba(0,0,0,0.55)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 6,
          color: "#fff",
          fontFamily: "ui-monospace, monospace",
          fontSize: 12,
          lineHeight: 1.5,
          backdropFilter: "blur(6px)",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <div style={{ opacity: 0.6, marginBottom: 4 }}>
          MODE: <span style={{ color: flyMode ? "#5a8a7a" : "#ffd9a8" }}>{flyMode ? "FLY" : "ORBIT"}</span>
        </div>
        <div style={{ opacity: 0.85 }}>Press <b>V</b> to toggle fly mode</div>
        {flyMode ? (
          <div style={{ opacity: 0.7, marginTop: 4 }}>
            <b>W/A/S/D</b> move &middot; <b>R</b> up &middot; <b>F</b> down &middot; <b>Q/E</b> roll<br />
            <b>drag mouse</b> to look around
          </div>
        ) : (
          <div style={{ opacity: 0.7, marginTop: 4 }}>drag to orbit &middot; scroll to zoom</div>
        )}
      </div>
      <Canvas
        shadows="soft"
        dpr={[1, 2]}
        camera={{ position: [28, 10, 50], fov: 45, near: 0.1, far: 500 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
      >
        <Scene flyMode={flyMode} />
        <EffectComposer multisampling={4}>
          <SSAO
            samples={16}
            radius={0.12}
            intensity={25}
            luminanceInfluence={0.6}
            worldDistanceThreshold={20}
            worldDistanceFalloff={5}
            worldProximityThreshold={6}
            worldProximityFalloff={2}
            blendFunction={BlendFunction.MULTIPLY}
          />
          <Bloom
            intensity={0.45}
            luminanceThreshold={0.8}
            luminanceSmoothing={0.2}
            mipmapBlur
          />
          <Vignette eskil={false} offset={0.2} darkness={0.65} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
