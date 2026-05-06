"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Center } from "@react-three/drei";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import type { Group } from "three";

const OBJ_URL = "/3D%20Designs/tinker.obj";
const MTL_URL = "/3D%20Designs/obj.mtl";

function Model() {
  const materials = useLoader(MTLLoader, MTL_URL);
  const obj = useLoader(OBJLoader, OBJ_URL, (loader) => {
    materials.preload();
    (loader as OBJLoader).setMaterials(materials);
  });

  const ref = useRef<Group>(null);

  // Slow auto-rotation around Y so the laptop feels alive but doesn't distract
  useFrame((_state, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.35;
  });

  return (
    <group ref={ref} rotation={[-0.25, 0, 0]} scale={0.45}>
      <Center>
        <primitive object={obj} />
      </Center>
    </group>
  );
}

export default function HeroLaptop3D() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[2] hidden md:block"
    >
      <div
        className="absolute top-1/2 right-0 -translate-y-1/2"
        style={{ width: "min(46vw, 620px)", height: "min(70vh, 560px)" }}
      >
        <Canvas
          camera={{ position: [0, 0, 320], fov: 28 }}
          dpr={[1, 2]}
          gl={{ alpha: true, antialias: true }}
          style={{ background: "transparent" }}
        >
          <ambientLight intensity={0.55} />
          <directionalLight position={[8, 10, 6]} intensity={0.9} />
          <directionalLight position={[-6, -4, 4]} intensity={0.35} color="#00f0ff" />
          <Suspense fallback={null}>
            <Model />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}
