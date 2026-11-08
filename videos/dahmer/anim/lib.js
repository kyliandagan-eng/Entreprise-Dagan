// Bibliothèque commune : maths, textures procédurales, matériaux, objets 3D low-poly « premium ».
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const W = 1080, H = 1920;
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const ss = (a, b, t) => { const x = seg(t, a, b); return x * x * (3 - 2 * x); };
export const eOut = x => 1 - Math.pow(1 - clamp(x), 3);
export const eIn = x => Math.pow(clamp(x), 3);
export const eIO = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const eSine = x => .5 - .5 * Math.cos(Math.PI * clamp(x));
export const backOut = x => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
export function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const vlerp = (a, b, t) => a.clone().lerp(b, t);
// bruit doux déterministe (somme de sinus) pour la caméra « à l'épaule »
export const wob = (t, s = 1) => (Math.sin(t * 1.31 * s) * .6 + Math.sin(t * 2.17 * s + 1.3) * .3 + Math.sin(t * 3.73 * s + 2.1) * .1);
// interpolation par images-clés [[t, valeur Vector3|number], ...] avec easing
export function track(keys, t, ease = eIO) {
  if (t <= keys[0][0]) return clone(keys[0][1]);
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, a] = keys[i], [t1, b] = keys[i + 1];
    if (t <= t1) { const k = ease((t - t0) / (t1 - t0)); return typeof a === 'number' ? lerp(a, b, k) : vlerp(a, b, k); }
  }
  return clone(keys[keys.length - 1][1]);
}
const clone = v => typeof v === 'number' ? v : v.clone();
// courbe Catmull-Rom pour des mouvements de caméra parfaitement fluides
export function spline(points, t, ease = eSine) { const c = new THREE.CatmullRomCurve3(points, false, 'centripetal'); return c.getPoint(ease(t)); }

// ---------- textures ----------
export function ctex(w, h, draw, repeat = [1, 1], srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); t.anisotropy = 8; return t;
}
function speckle(g, w, h, n, cols, size = [1, 3], seed = 1) { const r = rng(seed); for (let i = 0; i < n; i++) { g.fillStyle = cols[(r() * cols.length) | 0]; const s = size[0] + r() * (size[1] - size[0]); g.globalAlpha = .15 + r() * .35; g.fillRect(r() * w, r() * h, s, s); } g.globalAlpha = 1; }
export const TEX = {};
export function buildTextures() {
  TEX.brick = ctex(512, 512, (g, w, h) => { const r = rng(3); g.fillStyle = '#2a1714'; g.fillRect(0, 0, w, h); const bw = 64, bh = 24;
    for (let y = 0; y < h; y += bh) for (let x = -bw; x < w; x += bw) { const o = (y / bh) % 2 ? bw / 2 : 0; const c = new THREE.Color().setHSL(.02 + r() * .025, .45 + r() * .2, .2 + r() * .1); g.fillStyle = '#' + c.getHexString(); g.fillRect(x + o + 2, y + 2, bw - 4, bh - 4); }
    speckle(g, w, h, 5000, ['#000', '#5a3a30', '#1a0d0a'], [1, 3], 4); });
  TEX.asphalt = ctex(512, 512, (g, w, h) => { g.fillStyle = '#1b1c20'; g.fillRect(0, 0, w, h); speckle(g, w, h, 16000, ['#2c2d33', '#0d0d10', '#3a3a40'], [1, 3], 5);
    const r = rng(6); g.strokeStyle = 'rgba(0,0,0,.5)'; for (let i = 0; i < 14; i++) { g.lineWidth = 1 + r() * 2; g.beginPath(); let x = r() * w, y = r() * h; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - .5) * 80; y += (r() - .5) * 80; g.lineTo(x, y); } g.stroke(); } }, [8, 8]);
  TEX.concrete = ctex(256, 256, (g, w, h) => { g.fillStyle = '#4a4a4e'; g.fillRect(0, 0, w, h); speckle(g, w, h, 5000, ['#5d5d62', '#38383c', '#2a2a2e'], [1, 4], 7); g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 3; g.strokeRect(0, 0, w, h); }, [20, 1]);
  TEX.dirt = ctex(512, 512, (g, w, h) => { g.fillStyle = '#2e2419'; g.fillRect(0, 0, w, h); speckle(g, w, h, 20000, ['#3d3122', '#1f180f', '#4a3b29', '#151009'], [1, 5], 8); }, [3, 3]);
  TEX.grass = ctex(512, 512, (g, w, h) => { g.fillStyle = '#0f1a12'; g.fillRect(0, 0, w, h); const r = rng(9); for (let i = 0; i < 9000; i++) { g.strokeStyle = r() < .5 ? '#1c2d1e' : '#0a120b'; g.globalAlpha = .6; g.beginPath(); const x = r() * w, y = r() * h; g.moveTo(x, y); g.lineTo(x + (r() - .5) * 4, y - 4 - r() * 8); g.stroke(); } g.globalAlpha = 1; }, [10, 10]);
  TEX.wood = ctex(512, 512, (g, w, h) => { const r = rng(10); for (let i = 0; i < 8; i++) { const c = new THREE.Color().setHSL(.07, .35, .16 + r() * .06); g.fillStyle = '#' + c.getHexString(); g.fillRect(0, i * 64, w, 62); g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(0, i * 64 + 62, w, 2); g.fillRect((r() * w) | 0, i * 64, 2, 62); }
    g.globalAlpha = .12; for (let i = 0; i < 300; i++) { g.strokeStyle = r() < .5 ? '#000' : '#7a5a3a'; g.beginPath(); const y = r() * h; g.moveTo(0, y); g.bezierCurveTo(w * .3, y + (r() - .5) * 10, w * .6, y + (r() - .5) * 10, w, y); g.stroke(); } g.globalAlpha = 1; }, [3, 3]);
  TEX.carpet = ctex(256, 256, (g, w, h) => { g.fillStyle = '#4b3b2c'; g.fillRect(0, 0, w, h); speckle(g, w, h, 12000, ['#5c4936', '#3a2d21', '#63503b'], [1, 2], 11); }, [6, 6]);
  TEX.rug = ctex(512, 340, (g, w, h) => { g.fillStyle = '#5a1416'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c9a25a'; g.lineWidth = 10; g.strokeRect(20, 20, w - 40, h - 40); g.strokeStyle = '#1d2240'; g.lineWidth = 16; g.strokeRect(44, 44, w - 88, h - 88);
    g.fillStyle = '#1d2240'; g.beginPath(); g.ellipse(w / 2, h / 2, 110, 70, 0, 0, 7); g.fill(); g.strokeStyle = '#c9a25a'; g.lineWidth = 6; g.stroke(); speckle(g, w, h, 6000, ['#000', '#7a2a24'], [1, 2], 12); });
  TEX.tiles = ctex(256, 256, (g, w, h) => { g.fillStyle = '#9aa3a6'; g.fillRect(0, 0, w, h); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = (x + y) % 2 ? '#d9dfe0' : '#cfd6d8'; g.fillRect(x * 64 + 2, y * 64 + 2, 60, 60); } speckle(g, w, h, 1500, ['#7d878a', '#b9c1c3'], [1, 3], 13); }, [6, 6]);
  TEX.wallpaper = ctex(256, 256, (g, w, h) => { g.fillStyle = '#6e6450'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 32) { g.fillStyle = 'rgba(40,30,20,.25)'; g.fillRect(x, 0, 12, h); } speckle(g, w, h, 4000, ['#4f4636', '#857a62'], [1, 3], 14); }, [4, 2]);
  TEX.panel = ctex(256, 512, (g, w, h) => { g.fillStyle = '#3a2416'; g.fillRect(0, 0, w, h); const r = rng(15); for (let x = 0; x < w; x += 64) { g.fillStyle = `rgba(0,0,0,${.2 + r() * .2})`; g.fillRect(x, 0, 3, h); } g.strokeStyle = 'rgba(255,200,140,.08)'; for (let i = 0; i < 80; i++) { g.beginPath(); const x = r() * w; g.moveTo(x, 0); g.lineTo(x + (r() - .5) * 20, h); g.stroke(); } }, [4, 1]);
  TEX.glow = ctex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.2, 'rgba(255,255,255,.65)'); gr.addColorStop(.5, 'rgba(255,255,255,.18)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  TEX.smoke = ctex(256, 256, (g, s) => { const r = rng(17); for (let i = 0; i < 22; i++) { const x = s / 2 + (r() - .5) * s * .45, y = s / 2 + (r() - .5) * s * .45, rad = s * (.12 + r() * .16); const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill(); } });
  TEX.beam = ctex(16, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(.35, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, [1, 1], false);
  TEX.beam.wrapS = TEX.beam.wrapT = THREE.ClampToEdgeWrapping;
}
export function labelTex(w, h, draw) { const t = ctex(w, h, draw); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t; }

// ---------- matériaux ----------
export const std = (color, rough = .7, metal = 0, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });
export const basic = (color, extra = {}) => new THREE.MeshBasicMaterial({ color, ...extra });
export const glowMat = (color, opacity = 1) => new THREE.SpriteMaterial({ map: TEX.glow, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
export function glow(color, size, opacity = 1) { const s = new THREE.Sprite(glowMat(color, opacity)); s.scale.set(size, size, 1); return s; }
export function rbox(w, h, d, r = .05, s = 3) { return new RoundedBoxGeometry(w, h, d, s, Math.min(r, w / 2 - .001, h / 2 - .001, d / 2 - .001)); }
export function mesh(geo, mat, x = 0, y = 0, z = 0, parent) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; if (parent) parent.add(m); return m; }
// faisceau lumineux volumétrique (cône additif)
export function beam(rTop, rBot, h, color, opacity = .25) {
  const g = new THREE.CylinderGeometry(rTop, rBot, h, 32, 1, true); g.translate(0, -h / 2, 0);
  const m = new THREE.MeshBasicMaterial({ map: TEX.beam, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.FrontSide, fog: false });
  const b = new THREE.Mesh(g, m); b.renderOrder = 5; b.castShadow = false; b.receiveShadow = false; return b;
}
// particules de poussière en suspension
export function dust(n, box, color = 0xffffff, size = .03, seed = 1, opacity = .5) {
  const r = rng(seed); const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) pos.set([lerp(box[0], box[1], r()), lerp(box[2], box[3], r()), lerp(box[4], box[5], r())], i * 3);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.userData.base = pos.slice(); g.userData.box = box;
  const p = new THREE.Points(g, new THREE.PointsMaterial({ map: TEX.glow, color, size, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending }));
  p.userData.update = t => { const b = g.userData.base, a = g.attributes.position.array; for (let i = 0; i < n; i++) { a[i * 3] = b[i * 3] + Math.sin(t * .3 + i) * .15; a[i * 3 + 1] = box[2] + ((b[i * 3 + 1] - box[2] + t * .05 * (1 + (i % 5) * .2)) % (box[3] - box[2])); a[i * 3 + 2] = b[i * 3 + 2] + Math.cos(t * .27 + i * 1.3) * .15; } g.attributes.position.needsUpdate = true; };
  return p;
}

// ---------- silhouette humaine articulée (sans visage) ----------
export function makeHuman(o = {}) {
  const s = o.scale || 1, col = o.color ?? 0x14151b;
  const mat = o.mat || std(col, .55, .05, { emissive: o.emissive || 0x000000 });
  const g = new THREE.Group(); const P = {};
  const cap = (r, l) => new THREE.CapsuleGeometry(r, l, 6, 12);
  P.hips = new THREE.Group(); P.hips.position.y = .95; g.add(P.hips);
  P.torso = new THREE.Group(); P.hips.add(P.torso);
  mesh(cap(.17, .42), mat, 0, .32, 0, P.torso).scale.set(1.15, 1, .75);
  P.neck = new THREE.Group(); P.neck.position.y = .62; P.torso.add(P.neck);
  P.head = mesh(new THREE.SphereGeometry(.13, 20, 16), mat, 0, .14, 0, P.neck); P.head.scale.set(.9, 1.08, 1);
  if (o.cap) { const c = mesh(new THREE.CylinderGeometry(.14, .14, .07, 20), std(0x111a2e, .5), 0, .25, 0, P.neck); mesh(new THREE.BoxGeometry(.2, .02, .12), std(0x0a0f1c, .4), 0, .22, .1, P.neck); c.add(new THREE.Object3D()); }
  if (o.hair) mesh(new THREE.SphereGeometry(.135, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), std(o.hair, .8), 0, .16, -.01, P.neck);
  const limb = (side, isArm) => {
    const up = new THREE.Group(); const lo = new THREE.Group();
    if (isArm) { up.position.set(side * .25, .55, 0); P.torso.add(up); } else { up.position.set(side * .1, 0, 0); P.hips.add(up); }
    const L1 = isArm ? .26 : .38, L2 = isArm ? .25 : .38, R = isArm ? .055 : .075;
    mesh(cap(R, L1), mat, 0, -L1 / 2 - R, 0, up); lo.position.y = -L1 - R * 1.6; up.add(lo);
    mesh(cap(R * .9, L2), mat, 0, -L2 / 2 - R, 0, lo);
    const end = new THREE.Group(); end.position.y = -L2 - R * 1.8; lo.add(end);
    if (!isArm) mesh(rbox(.12, .08, .26, .03), mat, 0, -.02, .06, end);
    return { up, lo, end };
  };
  P.armL = limb(1, true); P.armR = limb(-1, true); P.legL = limb(1, false); P.legR = limb(-1, false);
  g.scale.setScalar(s * (o.height || 1));
  g.userData.P = P; g.userData.mat = mat;
  g.userData.pose = (name, ph = 0, amt = 1) => pose(g, name, ph, amt);
  g.traverse(m => { if (m.isMesh) { m.castShadow = true; } });
  return g;
}
function pose(g, name, ph, a) {
  const P = g.userData.P; const sn = Math.sin(ph), cs = Math.cos(ph);
  const set = (o, x = 0, y = 0, z = 0) => o.rotation.set(x, y, z);
  set(P.torso); set(P.neck); set(P.armL.up); set(P.armR.up); set(P.armL.lo); set(P.armR.lo); set(P.legL.up); set(P.legR.up); set(P.legL.lo); set(P.legR.lo); P.hips.position.y = .95; P.hips.rotation.set(0, 0, 0);
  if (name === 'run') {
    P.torso.rotation.x = .32 * a; P.neck.rotation.x = -.2;
    P.legL.up.rotation.x = -sn * 1.0 * a; P.legR.up.rotation.x = sn * 1.0 * a;
    P.legL.lo.rotation.x = Math.max(0, cs) * 1.5 * a + .2; P.legR.lo.rotation.x = Math.max(0, -cs) * 1.5 * a + .2;
    P.armL.up.rotation.x = sn * 1.1 * a; P.armR.up.rotation.x = -sn * 1.1 * a; P.armL.lo.rotation.x = -1.3 * a; P.armR.lo.rotation.x = -1.3 * a;
    P.armL.up.rotation.z = .15; P.armR.up.rotation.z = -.15; P.hips.position.y = .95 + Math.abs(Math.sin(ph)) * .09 * a - .05 * a;
  } else if (name === 'walk' || name === 'stagger') {
    const k = name === 'stagger' ? 1.4 : 1;
    P.torso.rotation.x = .05; P.legL.up.rotation.x = -sn * .45 * a; P.legR.up.rotation.x = sn * .45 * a;
    P.legL.lo.rotation.x = Math.max(0, cs) * .5 * a; P.legR.lo.rotation.x = Math.max(0, -cs) * .5 * a;
    P.armL.up.rotation.x = sn * .35 * a; P.armR.up.rotation.x = -sn * .35 * a; P.armL.lo.rotation.x = -.2; P.armR.lo.rotation.x = -.2;
    P.armL.up.rotation.z = .08; P.armR.up.rotation.z = -.08; P.hips.position.y = .95 + Math.abs(Math.sin(ph)) * .03;
    if (name === 'stagger') { P.torso.rotation.z = Math.sin(ph * .5) * .22 * k; P.neck.rotation.x = .5; P.torso.rotation.x = .25; P.armL.up.rotation.z = .5; P.armR.up.rotation.z = -.3; P.hips.rotation.z = Math.sin(ph * .5) * .08; }
  } else if (name === 'crouch') {
    P.hips.position.y = .5; P.torso.rotation.x = .55; P.neck.rotation.x = -.35; P.legL.up.rotation.x = -1.7; P.legR.up.rotation.x = -1.5; P.legL.lo.rotation.x = 2.2; P.legR.lo.rotation.x = 2.1;
    P.armL.up.rotation.x = -.9; P.armR.up.rotation.x = -.6; P.armL.lo.rotation.x = -.9; P.armR.lo.rotation.x = -1.0;
  } else if (name === 'sit') {
    P.hips.position.y = .52; P.legL.up.rotation.x = -1.5; P.legR.up.rotation.x = -1.5; P.legL.lo.rotation.x = 1.5; P.legR.lo.rotation.x = 1.5; P.torso.rotation.x = -.05;
    P.armL.up.rotation.x = -.5; P.armR.up.rotation.x = -.5; P.armL.lo.rotation.x = -.6; P.armR.lo.rotation.x = -.6;
  } else if (name === 'thumb') {
    P.armR.up.rotation.z = -1.25; P.armR.up.rotation.x = -.2; P.armR.lo.rotation.z = -.2; P.armL.up.rotation.z = .1; P.torso.rotation.y = .3;
  } else if (name === 'lift') {
    P.torso.rotation.x = .7; P.hips.position.y = .82; P.legL.up.rotation.x = -.6; P.legR.up.rotation.x = -.4; P.legL.lo.rotation.x = .9; P.legR.lo.rotation.x = .7;
    P.armL.up.rotation.x = -1.2 + sn * .1; P.armR.up.rotation.x = -1.2 + sn * .1; P.armL.lo.rotation.x = -.3; P.armR.lo.rotation.x = -.3;
  } else if (name === 'talk') {
    P.armR.up.rotation.x = -.5 + Math.sin(ph * 2) * .15; P.armR.lo.rotation.x = -1.1; P.armR.up.rotation.z = -.2; P.neck.rotation.y = Math.sin(ph) * .15; P.armL.up.rotation.z = .1;
  } else if (name === 'lunge') {
    P.torso.rotation.x = .45 * a; P.legL.up.rotation.x = -.9 * a; P.legL.lo.rotation.x = .6 * a; P.legR.up.rotation.x = .5 * a; P.legR.lo.rotation.x = .3 * a;
    P.armL.up.rotation.x = -2.2 * a; P.armR.up.rotation.x = -2.0 * a; P.armL.lo.rotation.x = -.3; P.armR.lo.rotation.x = -.3; P.hips.position.y = .9;
  } else if (name === 'lie') {
    P.hips.rotation.x = -Math.PI / 2; P.hips.position.y = .2;
  } else if (name === 'stand') {
    P.armL.up.rotation.z = .07; P.armR.up.rotation.z = -.07; P.neck.rotation.x = Math.sin(ph * .7) * .03;
  }
}

// ---------- voitures ----------
export function makeCar(kind = 'sedan') {
  const g = new THREE.Group();
  const bodyCol = { sedan: 0x23262c, police: 0xe9eaee, taxi: 0xf2b705, wagon: 0x4a3a2a }[kind] || 0x2a2d34;
  const paint = std(bodyCol, .28, .45); const glass = std(0x0b0f16, .08, .6, { transparent: true, opacity: .92 }); const black = std(0x0b0b0d, .6); const chrome = std(0xcfd3da, .15, 1);
  mesh(rbox(4.6, .62, 1.9, .16), paint, 0, .62, 0, g);
  mesh(rbox(2.5, .55, 1.68, .14), paint, -.25, 1.17, 0, g);
  mesh(rbox(2.36, .44, 1.72, .1), glass, -.25, 1.17, 0, g);
  mesh(new THREE.BoxGeometry(4.66, .1, 1.94), chrome, 0, .45, 0, g);
  for (const [x, z] of [[1.45, .86], [1.45, -.86], [-1.45, .86], [-1.45, -.86]]) {
    const w = mesh(new THREE.CylinderGeometry(.36, .36, .26, 24), black, x, .36, z, g); w.rotation.x = Math.PI / 2;
    const hub = mesh(new THREE.CylinderGeometry(.18, .18, .27, 16), chrome, x, .36, z, g); hub.rotation.x = Math.PI / 2;
  }
  const hl = basic(0xfff3d6), tl = basic(0xff1a10);
  for (const z of [.62, -.62]) { mesh(rbox(.06, .2, .34, .03), hl, 2.31, .7, z, g); mesh(rbox(.06, .16, .34, .03), tl, -2.31, .72, z, g); }
  g.userData.paint = paint;
  if (kind === 'police') {
    mesh(new THREE.BoxGeometry(1.2, .55, 1.96), std(0x0d1a3a, .4, .3), .25, .7, 0, g); // bande latérale sombre
    const bar = new THREE.Group(); bar.position.set(-.2, 1.5, 0); g.add(bar);
    const red = basic(0xff1010), blue = basic(0x1040ff);
    mesh(rbox(.3, .14, .7, .04), red, 0, 0, -.42, bar); mesh(rbox(.3, .14, .7, .04), blue, 0, 0, .42, bar);
    const gr = glow(0xff2020, 3.5), gb = glow(0x2050ff, 3.5); gr.position.set(0, .1, -.5); gb.position.set(0, .1, .5); bar.add(gr, gb);
    const lr = new THREE.PointLight(0xff1a1a, 0, 22, 1.6), lb = new THREE.PointLight(0x2050ff, 0, 22, 1.6); lr.position.set(0, .4, -1.2); lb.position.set(0, .4, 1.2); bar.add(lr, lb);
    g.userData.flash = (t, on = 1) => { const p = (Math.sin(t * 14) > 0) ? 1 : 0; const q = 1 - p; lr.intensity = on * p * 60; lb.intensity = on * q * 60; gr.material.opacity = on * (.2 + .8 * p); gb.material.opacity = on * (.2 + .8 * q); red.color.setScalar(0).setRGB(on * p + .15, 0, 0); blue.color.setRGB(0, .05, on * q + .2); };
  }
  if (kind === 'taxi') {
    const tex = labelTex(256, 64, (c, w, h) => { c.fillStyle = '#fff6c8'; c.fillRect(0, 0, w, h); c.fillStyle = '#111'; c.font = '900 46px Mont'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('TAXI', w / 2, h / 2 + 2); });
    const sign = mesh(new THREE.BoxGeometry(.7, .22, .32), new THREE.MeshBasicMaterial({ map: tex }), -.25, 1.56, 0, g);
    const sg = glow(0xffe08a, 1.5, .8); sg.position.set(-.25, 1.6, 0); g.add(sg);
    // damier
    const chk = labelTex(512, 32, (c, w, h) => { for (let i = 0; i < 32; i++) for (let j = 0; j < 2; j++) { c.fillStyle = (i + j) % 2 ? '#111' : '#f2b705'; c.fillRect(i * 16, j * 16, 16, 16); } });
    for (const z of [.962, -.962]) { const s = mesh(new THREE.PlaneGeometry(4.2, .16), new THREE.MeshBasicMaterial({ map: chk }), 0, .82, z, g); if (z < 0) s.rotation.y = Math.PI; }
    const lid = new THREE.Group(); lid.position.set(-1.75, .95, 0); g.add(lid); mesh(rbox(.8, .06, 1.7, .03), paint, -.4, 0, 0, lid); g.userData.lid = lid;
  }
  // phares : lumières + faisceaux
  const hb = new THREE.Group(); hb.position.set(2.35, .7, 0); g.add(hb); hb.visible = false;
  for (const z of [.62, -.62]) { const b = beam(.12, 1.8, 10, 0xfff0c8, .12); b.rotation.z = Math.PI / 2 + .06; b.position.z = z; hb.add(b); const gl = glow(0xfff2cc, 1.1, .9); gl.position.set(.05, 0, z); hb.add(gl); }
  const sl = new THREE.SpotLight(0xfff0d0, 0, 40, .45, .6, 1.3); sl.position.set(0, 0, 0); sl.target.position.set(10, -1, 0); hb.add(sl, sl.target);
  g.userData.lights = (on) => { hb.visible = on; sl.intensity = on ? 220 : 0; };
  g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = false; } });
  return g;
}

// ---------- lampadaire (lumière sodium) ----------
export function makeStreetLight(color = 0xffa040, withBeam = true, intensity = 90, real = true) {
  const g = new THREE.Group(); const pole = std(0x2a2c30, .5, .6);
  mesh(new THREE.CylinderGeometry(.07, .1, 6.5, 10), pole, 0, 3.25, 0, g);
  const arm = mesh(new THREE.CylinderGeometry(.05, .05, 1.6, 8), pole, .7, 6.4, 0, g); arm.rotation.z = Math.PI / 2;
  mesh(rbox(.7, .18, .4, .06), pole, 1.4, 6.35, 0, g);
  const bulb = mesh(new THREE.BoxGeometry(.5, .04, .28), basic(color), 1.4, 6.25, 0, g); bulb.castShadow = false;
  const gl = glow(color, 2.6, .9); gl.position.set(1.4, 6.15, 0); g.add(gl);
  let L = null; if (real) { L = new THREE.SpotLight(color, intensity, 22, .85, .55, 1.5); L.position.set(1.4, 6.1, 0); L.target.position.set(1.4, 0, 0); g.add(L, L.target); }
  g.userData.head = V(1.4, 6.1, 0);
  if (withBeam) { const b = beam(.25, 3.2, 6.2, color, .085); b.position.set(1.4, 6.1, 0); g.add(b); }
  g.userData.light = L; return g;
}

// ---------- immeuble en briques avec fenêtres ----------
export function makeBuilding(w, h, d, o = {}) {
  const g = new THREE.Group(); const r = rng(o.seed || 1);
  const tex = TEX.brick.clone(); tex.needsUpdate = true; tex.repeat.set(w / 3, h / 3);
  const wallM = std(o.color || 0xffffff, .9, 0, { map: tex });
  mesh(new THREE.BoxGeometry(w, h, d), wallM, 0, h / 2, 0, g);
  mesh(new THREE.BoxGeometry(w + .3, .35, d + .3), std(0x3a3a3e, .8), 0, h + .17, 0, g);
  const floors = o.floors || Math.floor(h / 3.2), cols = o.cols || Math.floor(w / 2.4);
  const lit = std(0x000000, .3, 0, { emissive: 0xffb060, emissiveIntensity: .95 }), litCold = std(0x000000, .3, 0, { emissive: 0x9fc8ff, emissiveIntensity: .7 }), dark = std(0x0a0c12, .15, .5);
  const frame = std(0xd8d2c4, .6);
  g.userData.windows = [];
  for (let f = 0; f < floors; f++) for (let c = 0; c < cols; c++) {
    const x = -w / 2 + (c + .5) * (w / cols), y = 1.6 + f * (h - 1) / floors;
    if (o.door !== undefined && f === 0 && c === o.door) continue;
    const isLit = r() < (o.litRatio ?? .3); const m = isLit ? (r() < .25 ? litCold : lit) : dark;
    mesh(new THREE.BoxGeometry(1.2, 1.5, .08), frame, x, y, d / 2 + .02, g);
    const wm = mesh(new THREE.BoxGeometry(1.0, 1.3, .1), m, x, y, d / 2 + .03, g); g.userData.windows.push({ mesh: wm, f, c, x, y });
    mesh(new THREE.BoxGeometry(1.4, .12, .25), std(0x8a8478, .7), x, y - .8, d / 2 + .1, g);
  }
  if (o.door !== undefined) { const x = -w / 2 + (o.door + .5) * (w / cols); mesh(rbox(1.6, 2.6, .2, .04), std(0x2a1a12, .5), x, 1.3, d / 2 + .05, g); mesh(rbox(2.2, .2, 1.2, .04), std(0x55555a, .9), x, .1, d / 2 + .6, g); const gl = glow(0xffd7a0, 2.2, .7); gl.position.set(x, 2.9, d / 2 + .3); g.add(gl); }
  return g;
}
export function makeTree(seed = 1, col = 0x0e1712) {
  const r = rng(seed); const g = new THREE.Group(); const h = 3 + r() * 2;
  mesh(new THREE.CylinderGeometry(.12, .2, h, 8), std(0x1a130e, .9), 0, h / 2, 0, g);
  const leaf = std(col, .9, 0, { flatShading: true });
  for (let i = 0; i < 4; i++) { const m = mesh(new THREE.IcosahedronGeometry(1.1 + r() * .7, 0), leaf, (r() - .5) * 1.4, h + (r() - .2) * 1.2, (r() - .5) * 1.4, g); m.rotation.set(r() * 3, r() * 3, r() * 3); }
  return g;
}
export function makePine(seed = 1, col = 0x0b140f) {
  const r = rng(seed); const g = new THREE.Group(); const h = 6 + r() * 4; const leaf = std(col, .9, 0, { flatShading: true });
  mesh(new THREE.CylinderGeometry(.12, .22, h * .4, 7), std(0x1a130e, .9), 0, h * .2, 0, g);
  for (let i = 0; i < 4; i++) { const k = i / 4; const c = mesh(new THREE.ConeGeometry((1 - k) * 2.0 + .4, h * .32, 7), leaf, 0, h * (.3 + k * .55), 0, g); c.rotation.y = r() * 3; }
  return g;
}

// ---------- objets ----------
export function makeSkull(mat) {
  const g = new THREE.Group(); const m = mat || std(0xe8e0cc, .55);
  const cr = mesh(new THREE.SphereGeometry(.5, 24, 18), m, 0, .1, 0, g); cr.scale.set(.88, .9, 1.05);
  mesh(rbox(.62, .32, .55, .12), m, 0, -.27, .18, g);
  const eye = std(0x050505, .9);
  for (const x of [-.17, .17]) { const e = mesh(new THREE.SphereGeometry(.12, 14, 10), eye, x, -.08, .42, g); e.scale.set(1, .9, .6); }
  const n = mesh(new THREE.ConeGeometry(.06, .14, 3), eye, 0, -.22, .5, g); n.rotation.x = Math.PI;
  for (let i = 0; i < 6; i++) mesh(rbox(.055, .09, .06, .015), std(0xf2ecd8, .4), -.15 + i * .06, -.38, .44, g);
  return g;
}
export function makeBone(len = .5, mat) { const g = new THREE.Group(); const m = mat || std(0xd9d2bf, .6); const c = mesh(new THREE.CylinderGeometry(.035, .035, len, 8), m, 0, 0, 0, g); c.rotation.z = Math.PI / 2; for (const s of [-1, 1]) for (const z of [-.03, .03]) mesh(new THREE.SphereGeometry(.05, 10, 8), m, s * len / 2, 0, z, g); return g; }
export function makeSuitcase() {
  const g = new THREE.Group(); const leather = std(0x4a2a17, .55, .05), metal = std(0xc9b78a, .25, 1);
  mesh(rbox(1.6, 1.1, .5, .08), leather, 0, .55, 0, g);
  mesh(new THREE.BoxGeometry(1.62, .05, .52), std(0x2a170c, .6), 0, .55, 0, g);
  const h = mesh(new THREE.TorusGeometry(.17, .035, 8, 20, Math.PI), std(0x1c1009, .5), 0, 1.1, 0, g);
  for (const x of [-.5, .5]) mesh(rbox(.12, .1, .54, .02), metal, x, .62, 0, g);
  for (const x of [-.7, .7]) for (const y of [.08, 1.02]) mesh(rbox(.18, .14, .54, .04), metal, x, y, 0, g);
  return g;
}
export function makeGlass(liquid = 0xb5651d) {
  const g = new THREE.Group();
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .05, metalness: 0, transmission: .0, transparent: true, opacity: .28, side: THREE.DoubleSide, depthWrite: false });
  const cup = mesh(new THREE.CylinderGeometry(.42, .36, 1.2, 40, 1, true), glass, 0, .6, 0, g); cup.renderOrder = 3; cup.castShadow = cup.receiveShadow = false;
  const bot = mesh(new THREE.CylinderGeometry(.36, .36, .06, 40), glass, 0, .03, 0, g); bot.castShadow = bot.receiveShadow = false;
  const liq = mesh(new THREE.CylinderGeometry(.39, .355, .8, 40), std(liquid, .15, 0, { transparent: true, opacity: .82, emissive: liquid, emissiveIntensity: .25 }), 0, .45, 0, g); liq.renderOrder = 2; liq.castShadow = liq.receiveShadow = false;
  g.userData.liq = liq; return g;
}
export function makePolaroid(seed = 1) {
  const r = rng(seed);
  const tex = labelTex(128, 152, (c, w, h) => { c.fillStyle = '#f1efe8'; c.fillRect(0, 0, w, h); const gr = c.createLinearGradient(0, 0, 0, 112); gr.addColorStop(0, `hsl(${10 + r() * 20},25%,${8 + r() * 10}%)`); gr.addColorStop(1, `hsl(${r() * 30},35%,${4 + r() * 6}%)`); c.fillStyle = gr; c.fillRect(10, 10, 108, 108); c.fillStyle = 'rgba(255,255,255,.05)'; c.fillRect(10, 10, 108, 30); });
  const m = new THREE.Mesh(new THREE.BoxGeometry(.88, 1.05, .015), [std(0xb8b4aa), std(0xb8b4aa), std(0xb8b4aa), std(0xb8b4aa), std(0xc8c4ba, .6, 0, { map: tex }), std(0xa8a49a)]);
  m.castShadow = true; return m;
}
export function makeDrum() {
  const g = new THREE.Group(); const blue = std(0x1d4fb8, .35, .3);
  mesh(new THREE.CylinderGeometry(.6, .6, 1.75, 40), blue, 0, .875, 0, g);
  for (const y of [.55, 1.2]) mesh(new THREE.TorusGeometry(.61, .03, 8, 40), blue, 0, y, 0, g).rotation.x = Math.PI / 2;
  mesh(new THREE.TorusGeometry(.57, .04, 8, 40), blue, 0, 1.75, 0, g).rotation.x = Math.PI / 2;
  const lab = labelTex(256, 256, (c, w, h) => { c.fillStyle = '#fff'; c.fillRect(0, 0, w, h); c.translate(w / 2, h / 2); c.rotate(Math.PI / 4); c.fillStyle = '#111'; c.fillRect(-80, -80, 160, 160); c.fillStyle = '#ff7a00'; c.fillRect(-72, -72, 144, 144); c.rotate(-Math.PI / 4); c.fillStyle = '#111'; c.font = '900 34px Mont'; c.textAlign = 'center'; c.fillText('ACIDE', 0, 12); });
  const l = mesh(new THREE.CylinderGeometry(.605, .605, .5, 40, 1, true, -.5, 1), new THREE.MeshStandardMaterial({ map: lab, roughness: .6, transparent: true }), 0, .85, 0, g);
  return g;
}

// ---------- fusion des objets statiques (réduit drastiquement le nombre d'appels de dessin) ----------
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
export function mergeStatic(root, isDynamic) {
  root.updateMatrixWorld(true);
  const groups = new Map(); const victims = [];
  const visit = (o) => {
    if (o !== root && isDynamic(o)) return;
    if (o.isMesh && !o.isInstancedMesh && !Array.isArray(o.material) && o.geometry && o.visible && !(o.material.transparent)) {
      const k = o.material.uuid + (o.castShadow ? 's' : 'n');
      if (!groups.has(k)) groups.set(k, []); groups.get(k).push(o);
    }
    for (const c of o.children.slice()) visit(c);
  };
  visit(root);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  let merged = 0;
  for (const [k, list] of groups) {
    if (list.length < 2) continue;
    const geos = [];
    for (const m of list) { let g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone(); for (const n of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(n)) g.deleteAttribute(n); if (!g.attributes.uv || !g.attributes.normal) continue; g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld)); geos.push(g); victims.push(m); }
    if (geos.length < 2) continue;
    const mg = mergeGeometries(geos, false); if (!mg) continue;
    const mm = new THREE.Mesh(mg, list[0].material); mm.castShadow = list[0].castShadow; mm.receiveShadow = true; root.add(mm); merged++;
  }
  for (const m of victims) m.parent && m.parent.remove(m);
  return merged;
}
