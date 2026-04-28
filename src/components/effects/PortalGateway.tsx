"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";

// ─── Types ────────────────────────────────────────────────────────────────────

interface IdleData {
  ring1: THREE.Group;
  ring2: THREE.Group;
  ring3: THREE.Group;
  ring4: THREE.Group;
  orbGroup: THREE.Group;
  sparkGeo: THREE.BufferGeometry;
  sparkPos: Float32Array;
  sparkAngles: Float32Array;
  sparkR: Float32Array;
  sparkSpeeds: Float32Array;
  sparkPhis: Float32Array;
}

// ─── Geometry helpers ─────────────────────────────────────────────────────────

function circ(r: number, seg = 96): THREE.Vector3[] {
  return Array.from({ length: seg + 1 }, (_, i) => {
    const a = (i / seg) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0);
  });
}

function poly(r: number, sides: number, rot = 0): THREE.Vector3[] {
  return Array.from({ length: sides + 1 }, (_, i) => {
    const a = (i / sides) * Math.PI * 2 + rot;
    return new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0);
  });
}

function star(ro: number, ri: number, n: number, rot = -Math.PI / 2): THREE.Vector3[] {
  return Array.from({ length: n * 2 + 1 }, (_, i) => {
    const a = (i / (n * 2)) * Math.PI * 2 + rot;
    const r = i % 2 === 0 ? ro : ri;
    return new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0);
  });
}

function lmat(color: number, opacity: number): THREE.LineBasicMaterial {
  return new THREE.LineBasicMaterial({
    color, transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
}

function gmat(color: number, opacity: number): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color, transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
}

function addLine(parent: THREE.Object3D, pts: THREE.Vector3[], color: number, op: number) {
  parent.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lmat(color, op)));
}

// ─── Idle portal scene ────────────────────────────────────────────────────────

function buildIdle(scene: THREE.Scene): IdleData {
  // Ring 1 — outer runic band (slow, CW)
  const ring1 = new THREE.Group();
  addLine(ring1, circ(1.88), 0x4466ff, 0.92);
  addLine(ring1, circ(1.74), 0x5533ff, 0.55);
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    const inner = i % 5 === 0 ? 1.59 : 1.68;
    ring1.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(Math.cos(a) * inner, Math.sin(a) * inner, 0),
        new THREE.Vector3(Math.cos(a) * 1.85,  Math.sin(a) * 1.85,  0),
      ]),
      lmat(0x4466ff, 0.38)
    ));
  }
  scene.add(ring1);

  // Ring 2 — polygon mandala (medium, CCW)
  const ring2 = new THREE.Group();
  addLine(ring2, circ(1.44), 0x5599ff, 0.7);
  for (let i = 0; i < 7; i++)
    addLine(ring2, poly(1.34, 9, (i / 7) * Math.PI * 2), 0x4477ff, 0.38);
  scene.add(ring2);

  // Ring 3 — hex mandala (medium, CW)
  const ring3 = new THREE.Group();
  addLine(ring3, circ(0.94), 0x88aaff, 0.82);
  addLine(ring3, poly(0.84, 3, -Math.PI / 2), 0x6699ff, 0.92); // △
  addLine(ring3, poly(0.84, 3,  Math.PI / 2), 0xaaccff, 0.92); // ▽
  addLine(ring3, circ(0.5),  0x99bbff, 0.5);
  scene.add(ring3);

  // Ring 4 — inner star burst (fast, CCW)
  const ring4 = new THREE.Group();
  addLine(ring4, star(0.38, 0.17, 8), 0xaaccff, 1.0);
  addLine(ring4, circ(0.3, 64),       0x88ccff, 0.75);
  addLine(ring4, star(0.22, 0.1,  6, 0), 0xccddff, 0.9);
  addLine(ring4, circ(0.12, 32),      0xeef4ff, 0.7);
  scene.add(ring4);

  // Eye rift
  const rift = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(
      Array.from({ length: 97 }, (_, i) => {
        const a = (i / 96) * Math.PI * 2;
        return new THREE.Vector3(Math.cos(a) * 0.55, Math.sin(a) * 0.3, 0);
      })
    ),
    lmat(0x99ccff, 0.95)
  );
  scene.add(rift);

  // 3D orbital rings
  const orbGroup = new THREE.Group();
  const orbcirc = (r: number, plane: "xz" | "yz") =>
    Array.from({ length: 97 }, (_, i) => {
      const a = (i / 96) * Math.PI * 2;
      const c = Math.cos(a) * r, s = Math.sin(a) * r;
      return plane === "xz" ? new THREE.Vector3(c, 0, s) : new THREE.Vector3(0, c, s);
    });
  addLine(orbGroup, orbcirc(1.62, "xz"), 0x3355ff, 0.38);
  addLine(orbGroup, orbcirc(1.62, "yz"), 0x3355ff, 0.38);
  scene.add(orbGroup);

  // Center glows
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), gmat(0xffffff, 0.92)));
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), gmat(0x6699ff, 0.38)));
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(0.65, 16, 12), gmat(0x2244aa, 0.18)));

  // Orbital sparks
  const N = 240;
  const sparkPos    = new Float32Array(N * 3);
  const sparkAngles = new Float32Array(N);
  const sparkR      = new Float32Array(N);
  const sparkSpeeds = new Float32Array(N);
  const sparkPhis   = new Float32Array(N);

  for (let i = 0; i < N; i++) {
    sparkAngles[i] = Math.random() * Math.PI * 2;
    sparkR[i]      = 0.45 + Math.random() * 1.55;
    sparkSpeeds[i] = (0.006 + Math.random() * 0.016) * (Math.random() < 0.5 ? 1 : -1);
    sparkPhis[i]   = Math.acos(2 * Math.random() - 1);
    const r = sparkR[i], th = sparkAngles[i], ph = sparkPhis[i];
    sparkPos[i * 3]     = r * Math.sin(ph) * Math.cos(th);
    sparkPos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
    sparkPos[i * 3 + 2] = r * Math.cos(ph) * 0.32;
  }

  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPos, 3));
  scene.add(new THREE.Points(sparkGeo, new THREE.PointsMaterial({
    color: 0x88bbff, size: 0.035, transparent: true, opacity: 0.78,
    blending: THREE.AdditiveBlending, depthWrite: false,
  })));

  return { ring1, ring2, ring3, ring4, orbGroup, sparkGeo, sparkPos, sparkAngles, sparkR, sparkSpeeds, sparkPhis };
}

function animateIdle(d: IdleData, t: number): void {
  const pulse = 1 + 0.022 * Math.sin(t * 1.45);
  d.ring1.rotation.z = t * -0.22;  d.ring1.scale.setScalar(pulse);
  d.ring2.rotation.z = t *  0.16;  d.ring2.scale.setScalar(pulse * 0.99);
  d.ring3.rotation.z = t * -0.44;  d.ring3.scale.setScalar(pulse * 0.98);
  d.ring4.rotation.z = t *  0.82;  d.ring4.scale.setScalar(pulse * 0.96);
  d.orbGroup.rotation.y = t * 0.24;

  const sp = d.sparkPos, sa = d.sparkAngles, sr = d.sparkR, ss = d.sparkSpeeds, ph = d.sparkPhis;
  for (let i = 0; i < sa.length; i++) {
    sa[i] += ss[i];
    const r = sr[i], th = sa[i], phi = ph[i];
    sp[i * 3]     = r * Math.sin(phi) * Math.cos(th);
    sp[i * 3 + 1] = r * Math.sin(phi) * Math.sin(th);
    sp[i * 3 + 2] = r * Math.cos(phi) * 0.32;
  }
  d.sparkGeo.attributes.position.needsUpdate = true;
}

// ─── Text-suck phase — animates elements toward a point and fades them out ───

/**
 * Animate all elements matching `selector` toward the portal center (cx, cy)
 * with a scale-down and random rotation, fading them out. Returns the total
 * duration (ms) — caller can time the vortex launch off it.
 */
export function suckElementsIntoPortal(
  cx: number,
  cy: number,
  selector: string = "[data-suck]"
): number {
  const els = Array.from(document.querySelectorAll<HTMLElement>(selector));
  els.forEach((el, i) => {
    const r   = el.getBoundingClientRect();
    const dx  = cx - (r.left + r.width  / 2);
    const dy  = cy - (r.top  + r.height / 2);
    const rot = (Math.random() - 0.5) * 720;
    const stagger = i * 38;
    setTimeout(() => {
      // Stop any running CSS animation (e.g. ring spins) so our inline
      // transform actually takes effect.
      el.style.animation = "none";
      el.style.willChange = "transform, opacity";
      el.style.transition =
        `transform 0.72s cubic-bezier(0.4,0,1,1) ${stagger}ms,` +
        `opacity   0.58s ease-in              ${stagger}ms`;
      el.style.transform = `translate(${dx}px,${dy}px) scale(0.04) rotate(${rot}deg)`;
      el.style.opacity   = "0";
    }, 0);
  });
  return 720 + (els.length - 1) * 38;
}

// ─── Full-screen vortex transition ────────────────────────────────────────────

export function launchTransition(
  portalEl: HTMLElement,
  destination: string,
  push: (path: string) => void
) {
  const rect = portalEl.getBoundingClientRect();
  const cx = rect.left + rect.width  / 2;
  const cy = rect.top  + rect.height / 2;
  const w  = window.innerWidth;
  const h  = window.innerHeight;
  const cxPct = (cx / w) * 100;
  const cyPct = (cy / h) * 100;

  // World-space portal origin for the orthographic camera
  const ox = cx - w / 2;
  const oy = -(cy - h / 2);
  const maxR = Math.sqrt(w * w + h * h) / 2;

  // ── DOM overlay ──────────────────────────────────────────────────────────
  const overlay = document.createElement("div");
  overlay.id = "portal-vortex-overlay";
  Object.assign(overlay.style, {
    position: "fixed", inset: "0", zIndex: "99998",
    overflow: "hidden", pointerEvents: "none",
    clipPath: `circle(0.01% at ${cxPct}% ${cyPct}%)`,
  });
  document.body.appendChild(overlay);

  // ── Three.js renderer ────────────────────────────────────────────────────
  const scene = new THREE.Scene();
  // Orthographic camera: world units = pixels, centered at screen center
  const oCam = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, 0.1, 500);
  oCam.position.z = 100;

  const rend = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  rend.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  rend.setSize(w, h);
  rend.setClearColor(0x120500, 1);
  Object.assign(rend.domElement.style, {
    position: "absolute", top: "0", left: "0", width: "100%", height: "100%",
  });
  overlay.appendChild(rend.domElement);

  // ── Vortex rings — large circles contracting toward portal center ─────────
  const VCOUNT = 26;
  type VRing = { line: THREE.Line; initR: number; rotSpeed: number };
  const vrings: VRing[] = [];
  for (let i = 0; i < VCOUNT; i++) {
    const frac  = i / VCOUNT;
    const initR = 25 + frac * maxR * 1.05;
    // Hue 0.00 (red) → 0.09 (orange/amber), so outer rings burn redder, inner rings go orange
    const hue   = 0.01 + frac * 0.09;
    const col   = new THREE.Color().setHSL(hue, 1.0, 0.5 + frac * 0.15);
    const pts   = Array.from({ length: 97 }, (_, j) => {
      const a = (j / 96) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(a), Math.sin(a), 0);
    });
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    line.position.set(ox, oy, 0);
    line.scale.setScalar(initR);
    scene.add(line);
    vrings.push({ line, initR, rotSpeed: 0.5 + frac * 4 });
  }

  // ── Debris particles — scattered across screen, gravity-sucked to center ──
  const NDEB = 900;
  const debPos = new Float32Array(NDEB * 3);
  const debVel = new Float32Array(NDEB * 3);
  const debCol = new Float32Array(NDEB * 3);
  const tempC  = new THREE.Color();

  const resetDebris = (i: number) => {
    const angle = Math.random() * Math.PI * 2;
    const r = maxR * (0.15 + Math.random() * 0.9);
    const px = ox + Math.cos(angle) * r;
    const py = oy + Math.sin(angle) * r;
    debPos[i * 3]     = px;
    debPos[i * 3 + 1] = py;
    debPos[i * 3 + 2] = 0;
    const dx = ox - px, dy = oy - py;
    const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
    const spd  = 60 + Math.random() * 100;
    const tang = 0.25 + Math.random() * 0.45;
    const nx = dx / dist, ny = dy / dist;
    debVel[i * 3]     = nx * spd + (-ny) * spd * tang;
    debVel[i * 3 + 1] = ny * spd +   nx  * spd * tang;
    debVel[i * 3 + 2] = 0;
    // Debris colours: 70% fire orange (hue ~0.05-0.11), 30% deep red (hue ~0.0-0.02)
    const hue = Math.random() < 0.3 ? Math.random() * 0.02 : 0.03 + Math.random() * 0.08;
    const light = 0.55 + Math.random() * 0.25;
    tempC.setHSL(hue, 1.0, light);
    debCol[i * 3] = tempC.r; debCol[i * 3 + 1] = tempC.g; debCol[i * 3 + 2] = tempC.b;
  };
  for (let i = 0; i < NDEB; i++) resetDebris(i);

  const debGeo = new THREE.BufferGeometry();
  debGeo.setAttribute("position", new THREE.BufferAttribute(debPos, 3));
  debGeo.setAttribute("color",    new THREE.BufferAttribute(debCol, 3));
  const debPoints = new THREE.Points(debGeo, new THREE.PointsMaterial({
    size: 2.8, sizeAttenuation: false, vertexColors: true,
    transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  scene.add(debPoints);

  // ── Speed streaks — line segments flying inward ───────────────────────────
  const NSTREAKS = 120;
  const strkPos = new Float32Array(NSTREAKS * 6);
  type StreakDatum = { x: number; y: number; speed: number };
  const strkData: StreakDatum[] = [];

  const spawnStreak = (sd: StreakDatum, idx: number, eased = 0) => {
    const angle = Math.random() * Math.PI * 2;
    const r = maxR * (0.4 + Math.random() * 0.65);
    sd.x = ox + Math.cos(angle) * r;
    sd.y = oy + Math.sin(angle) * r;
    sd.speed = 180 + Math.random() * 380;
    const dx = ox - sd.x, dy = oy - sd.y;
    const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
    const nx = dx / dist, ny = dy / dist;
    const len = 14 + eased * 35;
    strkPos[idx * 6]     = sd.x;          strkPos[idx * 6 + 1] = sd.y;          strkPos[idx * 6 + 2] = 0;
    strkPos[idx * 6 + 3] = sd.x - nx * len; strkPos[idx * 6 + 4] = sd.y - ny * len; strkPos[idx * 6 + 5] = 0;
  };
  for (let i = 0; i < NSTREAKS; i++) {
    strkData.push({ x: 0, y: 0, speed: 0 });
    spawnStreak(strkData[i], i);
  }

  const strkGeo = new THREE.BufferGeometry();
  strkGeo.setAttribute("position", new THREE.BufferAttribute(strkPos, 3));
  const strkLines = new THREE.LineSegments(strkGeo, new THREE.LineBasicMaterial({
    color: 0xff8a1a, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  scene.add(strkLines);

  // ── Central singularity ───────────────────────────────────────────────────
  const makeOrb = (color: number) => {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(1, 16, 12),
      gmat(color, 0)
    );
    m.position.set(ox, oy, 0);
    scene.add(m);
    return m;
  };
  const orbCore  = makeOrb(0xffe3b3); // hot cream-yellow core
  const orbGlow1 = makeOrb(0xff6a00); // fire orange
  const orbGlow2 = makeOrb(0xaa1a00); // deep ember red

  // ── Expand clip-path over time (reveals the vortex, swallowing the screen) ─
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlay.style.transition = `clip-path 4s cubic-bezier(0.22, 0, 0.82, 1)`;
      overlay.style.clipPath   = `circle(152% at ${cxPct}% ${cyPct}%)`;
    });
  });

  // ── Animation loop ────────────────────────────────────────────────────────
  const TOTAL     = 5.5;
  let elapsed     = 0;
  let last        = performance.now();
  let navigated   = false;

  const loop = () => {
    const now = performance.now();
    const dt  = Math.min((now - last) / 1000, 0.05);
    last    = now;
    elapsed += dt;

    const norm  = Math.min(elapsed / TOTAL, 1.0);
    const eased = norm < 0.5 ? 2 * norm * norm : 1 - Math.pow(-2 * norm + 2, 2) / 2;
    const easeIn = Math.min(elapsed / 0.14, 1);

    // Vortex rings: stagger-in, contract toward center, spin accelerating
    vrings.forEach(({ line, initR, rotSpeed }, i) => {
      const delay  = (i / VCOUNT) * 0.3;
      const loc    = Math.max(0, elapsed - delay);
      const locN   = Math.min(loc / TOTAL, 1);
      const curR   = Math.max(15, initR * Math.pow(1 - locN, 1.25) + 15);
      line.scale.setScalar(curR);
      line.rotation.z += dt * rotSpeed * (1 + eased * 5);
      const mat   = line.material as THREE.LineBasicMaterial;
      const fin   = Math.min(loc / 0.12, 1);
      const fout  = Math.max(0, 1 - Math.pow(Math.max(0, locN - 0.52) / 0.48, 2));
      mat.opacity = fin * fout * 0.78;
    });

    // Debris: gravity-well toward portal center
    if (elapsed > 0.06) {
      const debMat = debPoints.material as THREE.PointsMaterial;
      debMat.opacity = Math.min((elapsed - 0.06) / 0.25, 1) * 0.92;
      for (let i = 0; i < NDEB; i++) {
        const px = debPos[i * 3], py = debPos[i * 3 + 1];
        const dx = ox - px, dy = oy - py;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
        const accel = (180 + eased * 700) / dist * 55;
        debVel[i * 3]     += (dx / dist) * accel * dt;
        debVel[i * 3 + 1] += (dy / dist) * accel * dt;
        debPos[i * 3]     += debVel[i * 3]     * dt;
        debPos[i * 3 + 1] += debVel[i * 3 + 1] * dt;
        if (dist < 12) resetDebris(i);
      }
      debGeo.attributes.position.needsUpdate = true;
    }

    // Speed streaks: fly toward portal center
    if (elapsed > 0.18) {
      const strkMat = strkLines.material as THREE.LineBasicMaterial;
      strkMat.opacity = Math.min((elapsed - 0.18) / 0.28, 1) * 0.6 * eased;
      for (let i = 0; i < NSTREAKS; i++) {
        const sd = strkData[i];
        const dx = ox - sd.x, dy = oy - sd.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
        const nx = dx / dist, ny = dy / dist;
        const mv = sd.speed * dt * (1 + eased * 3.5);
        sd.x += nx * mv; sd.y += ny * mv;
        if (dist < 18) spawnStreak(sd, i, eased);
        const len = 22 + eased * 140;
        strkPos[i * 6]     = sd.x;          strkPos[i * 6 + 1] = sd.y;          strkPos[i * 6 + 2] = 0;
        strkPos[i * 6 + 3] = sd.x - nx * len; strkPos[i * 6 + 4] = sd.y - ny * len; strkPos[i * 6 + 5] = 0;
      }
      strkGeo.attributes.position.needsUpdate = true;
    }

    // Singularity orb: blazes brighter and larger as everything is consumed
    const coreScale  = 12 + eased * eased * 200;
    orbCore.scale.setScalar(coreScale);
    (orbCore.material  as THREE.MeshBasicMaterial).opacity = Math.min(eased * 1.6, 1.0) * 0.82;
    const glow1Scale = 28 + eased * 350;
    orbGlow1.scale.setScalar(glow1Scale);
    (orbGlow1.material as THREE.MeshBasicMaterial).opacity = Math.min(eased * 0.9, 0.68);
    const glow2Scale = 60 + eased * 600;
    orbGlow2.scale.setScalar(glow2Scale);
    (orbGlow2.material as THREE.MeshBasicMaterial).opacity = Math.min(easeIn * 0.45, 0.45);

    rend.render(scene, oCam);

    if (!navigated && norm < 1) {
      requestAnimationFrame(loop);
    } else if (!navigated) {
      navigated = true;
      // Burst to fire-white and navigate
      overlay.style.transition = "background 0.6s ease-in";
      overlay.style.background =
        "radial-gradient(ellipse at center, #ffffff 0%, #ffd27a 25%, #ff6a00 55%, #4a0a00 100%)";
      setTimeout(() => {
        push(destination);
        // Reset any styles zoomIntoPortal applied to <main> so the destination
        // page renders into a clean container (otherwise <main> stays at
        // scale(9), opacity:0, blur(14px) and the new page is invisible).
        const mainEl = document.querySelector<HTMLElement>("main");
        if (mainEl) {
          mainEl.style.transition = "";
          mainEl.style.transform = "";
          mainEl.style.filter = "";
          mainEl.style.opacity = "";
          mainEl.style.transformOrigin = "";
          mainEl.style.willChange = "";
        }

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            overlay.style.transition = "opacity 1.0s cubic-bezier(0.4,0,0.6,1)";
            overlay.style.opacity = "0";
          });
        });

        // Tear down the vortex scene's GPU resources so it stops competing
        // with the destination page's WebGL context. (We do NOT call
        // forceContextLoss() — that has caused the destination Canvas to
        // receive a null context from the browser. dispose() is enough.)
        setTimeout(() => {
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
          scene.traverse((obj) => {
            const o = obj as THREE.Object3D & {
              geometry?: THREE.BufferGeometry;
              material?: THREE.Material | THREE.Material[];
            };
            if (o.geometry) o.geometry.dispose();
            if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
            else if (o.material) o.material.dispose();
          });
          scene.clear();
          rend.dispose();
        }, 1300);
      }, 260);
    }
  };

  requestAnimationFrame(loop);
}

// ─── Camera-style zoom — scales the underlying page into the portal center ───

/**
 * Animate the target element (usually `<main>` or the intro section) so it
 * appears to fly into the portal center: scales up aggressively toward the
 * given viewport-space coordinates, blurs, and fades. This is the
 * "user's view is sucked into the portal" effect.
 */
export function zoomIntoPortal(
  target: HTMLElement,
  cxPx: number,
  cyPx: number,
  durationMs: number = 2200
): void {
  const rect = target.getBoundingClientRect();
  const originXPct = ((cxPx - rect.left) / rect.width)  * 100;
  const originYPct = ((cyPx - rect.top)  / rect.height) * 100;

  target.style.willChange = "transform, filter, opacity";
  target.style.transformOrigin = `${originXPct}% ${originYPct}%`;
  target.style.transition =
    `transform ${durationMs}ms cubic-bezier(0.55, 0, 0.82, 0.25),` +
    `filter ${durationMs}ms cubic-bezier(0.4, 0, 0.2, 1),` +
    `opacity ${Math.round(durationMs * 0.6)}ms ease-in ${Math.round(durationMs * 0.35)}ms`;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      target.style.transform = "scale(9)";
      target.style.filter = "blur(14px) brightness(1.4) saturate(1.2)";
      target.style.opacity = "0";
    });
  });
}

// ─── React Component ──────────────────────────────────────────────────────────

export interface PortalGatewayProps {
  /**
   * CSS selector for the elements that will get sucked into the portal on activation.
   * Defaults to `[data-suck]`.
   * Example: add `data-suck` to hero headings, paragraphs, etc.
   */
  textSelector?: string;
  /** Next.js route to navigate to after the portal transition. */
  destination?: string;
  /** Edge length of the portal canvas in pixels (square). */
  size?: number;
  className?: string;
}

export default function PortalGateway({
  textSelector = "[data-suck]",
  destination  = "/world",
  size         = 320,
  className    = "",
}: PortalGatewayProps) {
  const mountRef   = useRef<HTMLDivElement>(null);
  const idleRef    = useRef<IdleData | null>(null);
  const router     = useRouter();
  const activeRef  = useRef(false);
  const rafRef     = useRef<number>(0);
  const [hovered, setHovered] = useState(false);

  // ── Idle portal ────────────────────────────────────────────────────────────
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const cam   = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    cam.position.z = 5;

    const rend = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rend.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rend.setSize(size, size);
    rend.setClearColor(0, 0);
    mount.appendChild(rend.domElement);

    const data  = buildIdle(scene);
    idleRef.current = data;

    const timer = new THREE.Timer();
    const loop  = () => {
      rafRef.current = requestAnimationFrame(loop);
      timer.update();
      if (!activeRef.current) {
        animateIdle(data, timer.getElapsed());
        rend.render(scene, cam);
      }
    };
    loop();

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (mount.contains(rend.domElement)) mount.removeChild(rend.domElement);
      rend.dispose();
    };
  }, [size]);

  // ── Double-click handler ───────────────────────────────────────────────────
  const handleDoubleClick = useCallback(() => {
    if (activeRef.current) return;
    activeRef.current = true;
    cancelAnimationFrame(rafRef.current);

    const mount = mountRef.current;
    if (!mount) return;

    const portalRect = mount.getBoundingClientRect();
    const cx = portalRect.left + portalRect.width  / 2;
    const cy = portalRect.top  + portalRect.height / 2;

    // ── Phase 1: Suck text elements toward the portal center ───────────────
    suckElementsIntoPortal(cx, cy, textSelector);

    // ── Phase 2: Full-screen vortex swallows the viewport ─────────────────
    setTimeout(() => {
      launchTransition(mount, destination, router.push.bind(router));
    }, 330);
  }, [textSelector, destination, router]);

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none cursor-pointer ${className}`}
      style={{ width: size, height: size }}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Three.js canvas mount */}
      <div ref={mountRef} />

      {/* Hover affordance */}
      <div
        className="absolute inset-0 flex items-end justify-center pb-3 pointer-events-none"
        style={{
          opacity: hovered && !activeRef.current ? 1 : 0,
          transition: "opacity 0.35s ease",
        }}
      >
        <span className="text-white/25 text-[8px] uppercase tracking-[0.55em] font-light">
          double click to enter
        </span>
      </div>
    </div>
  );
}