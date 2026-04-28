import * as THREE from "three";

/**
 * Shared singleton materials. Use these via:
 *   <mesh ...><primitive object={MAT.stoneVertex} attach="material" /></mesh>
 * Identical inline materials currently allocate per-mesh — sharing
 * cuts shader compiles, uniform updates, and GC pressure.
 *
 * Only use these when the visual is genuinely identical (same color,
 * same flags). For one-offs keep inline JSX materials.
 */

export const MAT = {
  /* Vertex-color stone — used by tiers, niches, cornices, friezes, stairs (paintBox geos) */
  stoneVertex: new THREE.MeshLambertMaterial({ vertexColors: true }),

  /* Plain stone tones */
  stoneWarm: new THREE.MeshLambertMaterial({ color: "#7a6a58" }),
  stoneDark: new THREE.MeshLambertMaterial({ color: "#3e2e22" }),
  stoneMid:  new THREE.MeshLambertMaterial({ color: "#5a4634" }),
  stonePillar: new THREE.MeshLambertMaterial({ color: "#9a8268" }),
  stonePillarCap: new THREE.MeshLambertMaterial({ color: "#7a6450" }),

  /* Wood / structure */
  wood:     new THREE.MeshLambertMaterial({ color: "#6a5444" }),
  woodDark: new THREE.MeshLambertMaterial({ color: "#4a3624" }),

  /* Spire palette */
  spireBaseDark: new THREE.MeshLambertMaterial({ color: "#82654a" }),
  spireShaft:    new THREE.MeshLambertMaterial({ color: "#8a6c4a" }),
  spireUpper:    new THREE.MeshLambertMaterial({ color: "#9a7c5a" }),

  /* Verdigris / bronze */
  verdigrisLight: new THREE.MeshLambertMaterial({ color: "#5fb09a", emissive: "#1a3a30", emissiveIntensity: 0.18 }),
  verdigrisCap:   new THREE.MeshLambertMaterial({ color: "#4d9080" }),
  verdigrisDark:  new THREE.MeshLambertMaterial({ color: "#3e7a6c" }),
  patinaRim:      new THREE.MeshLambertMaterial({ color: "#2e6a5c" }),
};

/* Dispose all shared materials — call in an unmount cleanup if needed.
   (Not currently called; module-scoped lifetime matches the page.) */
export function disposeSharedMaterials() {
  Object.values(MAT).forEach((m) => m.dispose());
}
