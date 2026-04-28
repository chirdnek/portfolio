"use client";

import * as THREE from "three";
import { useEffect, useState } from "react";

/* ─── Player world position — written by PlayerMovement, read by HUDs. */
export const PLAYER_POS = new THREE.Vector3();

/* ─── Fly mode (V to toggle). Skips gravity, collision, and bounds clamps. */
export const FLY_STATE = { on: false };
const flyListeners = new Set<(v: boolean) => void>();
export function setFly(v: boolean) {
  FLY_STATE.on = v;
  flyListeners.forEach((f) => f(v));
}
export function subscribeFly(f: (v: boolean) => void) {
  flyListeners.add(f);
  return () => {
    flyListeners.delete(f);
  };
}

/* ─── Gong striker: Gong component sets `fn`; PlayerMovement calls it on E. */
export const gongStrike: { fn: (() => void) | null } = { fn: null };

/* ─── Spell circle state — toggled by clicking the altar. */
let _spellActive = true;
const _spellListeners = new Set<(active: boolean) => void>();
export function setSpellActive(active: boolean) {
  if (_spellActive === active) return;
  _spellActive = active;
  _spellListeners.forEach((fn) => fn(active));
}
export function useSpellActive() {
  const [active, setActive] = useState(_spellActive);
  useEffect(() => {
    const fn = (a: boolean) => setActive(a);
    _spellListeners.add(fn);
    return () => {
      _spellListeners.delete(fn);
    };
  }, []);
  return active;
}
