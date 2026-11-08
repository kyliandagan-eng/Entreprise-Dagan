import * as THREE from 'three';

// ================= TEXTES (modifiables) =================
const TX = {
  floride: 'AU-DESSUS DE LA FLORIDE',
  jet: ['JET PRIVÉ', 'LEARJET 60'],
  tombe: 'TOMBÉ DU CIEL',
  min: ['<1 min', 'DU CIEL AU SOL'],
  date: 'DIMANCHE 1ER NOVEMBRE 2026',
  learjet: ['LEARJET 60', "BIRÉACTEUR D'AFFAIRES"],
  route: [['AUSTIN', 'TEXAS'], ['FLORIDE', ''], ['BAHAMAS', '']],
  bord: '9 À BORD', bordSub: '2 PILOTES · 7 PASSAGERS',
  quote: '« On gère le givre »', quoteSub: 'LE COPILOTE · RADIO',
  atc: 'CONTRÔLE AÉRIEN',
  mayday: 'MAYDAY', alarmes: 'ALARMES',
  descent: [-12000, 'FT/MIN', 'VITESSE DE DESCENTE'],
  altitude: [27000, 1408],
  chute: ['CHUTE LIBRE', 'PERTE DE CONTRÔLE'],
  palm: ['PALM BEACH', 'FLORIDE'],
  secours: 'SECOURS',
  holo: ['TRAJECTOIRE', 'RECONSTITUTION'],
  impact: 'IMPACT ≈ 550 KM/H · ESTIMATION',
  pulv: 'PULVÉRISÉ',
  debris: 'DÉBRIS MINUSCULES',
  morts: '9 MORTS',
  ntsb: 'ENQUÊTE NTSB · EN COURS',
  peri: ['PÉRIMÈTRE', "ZONE D'ENQUÊTE"],
  pourquoi: 'POURQUOI ?',
};

const W = 1080, H = 1920;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const ss = (a, b, t) => { const x = clamp((t - a) / (b - a)); return x * x * (3 - 2 * x); };
const eOut = x => 1 - Math.pow(1 - clamp(x), 3);
const eIn = x => Math.pow(clamp(x), 3);
const eIO = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const backOut = x => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const vlerp = (a, b, t) => a.clone().lerp(b, t);
const wrap = (v, a, b) => { const r = b - a; return ((((v - a) % r) + r) % r) + a; };

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// ================= textures =================
function canvasTex(s, draw) { const c = document.createElement('canvas'); c.width = c.height = s; draw(c.getContext('2d'), s); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const cloudTex = canvasTex(256, (g, s) => { const r = rng(7); for (let i = 0; i < 18; i++) { const x = s / 2 + (r() - .5) * s * .5, y = s / 2 + (r() - .5) * s * .32, rad = s * (.13 + r() * .17); const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, 'rgba(255,255,255,.6)'); gr.addColorStop(.6, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill(); } });
const glowTex = canvasTex(128, (g, s) => { const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s); });

function makeBg() {
  const c = document.createElement('canvas'); c.width = 4; c.height = 512; const g = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  return { tex, set(stops) { const gr = g.createLinearGradient(0, 0, 0, 512); stops.forEach(([o, col]) => gr.addColorStop(o, col)); g.fillStyle = gr; g.fillRect(0, 0, 4, 512); tex.needsUpdate = true; } };
}
const mixc = (a, b, t) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), clamp(t)).getHexString();
const mixStops = (A, B, t) => A.map((s, i) => [lerp(s[0], B[i][0], t), mixc(s[1], B[i][1], t)]);

function cloudField(scene, o) {
  const r = rng(o.seed), sp = [];
  for (let i = 0; i < o.n; i++) {
    const m = new THREE.SpriteMaterial({ map: cloudTex, color: o.color, transparent: true, opacity: o.opacity * (.6 + .4 * r()), depthWrite: false, fog: !!o.fog });
    const s = new THREE.Sprite(m); const sz = lerp(o.size[0], o.size[1], r()); s.scale.set(sz * 1.6, sz, 1);
    s.userData.b = V(lerp(o.xr[0], o.xr[1], r()), lerp(o.yr[0], o.yr[1], r()), lerp(o.zr[0], o.zr[1], r()));
    m.rotation = (r() - .5) * .4; scene.add(s); sp.push(s);
  }
  return { sp, update(dx = 0, dy = 0, dz = 0) { for (const s of sp) { const b = s.userData.b; s.position.set(wrap(b.x + dx, o.xr[0], o.xr[1]), wrap(b.y + dy, o.yr[0], o.yr[1]), wrap(b.z + dz, o.zr[0], o.zr[1])); } } };
}

// ================= Jet =================
function extrudeXY(pts, depth) { const sh = new THREE.Shape(); pts.forEach((p, i) => i ? sh.lineTo(p[0], p[1]) : sh.moveTo(p[0], p[1])); const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: .03, bevelSize: .03, bevelSegments: 2 }); g.translate(0, 0, -depth / 2); return g; }
function makeJet(o = {}) {
  const g = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: o.color || 0xf4f2ee, roughness: .5, metalness: .05 });
  const grey = new THREE.MeshStandardMaterial({ color: 0xc9ccd2, roughness: .5 });
  const red = new THREE.MeshStandardMaterial({ color: 0xd8261c, roughness: .5 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1b2230, roughness: .3 });
  const win = o.winGlow ? new THREE.MeshBasicMaterial({ color: 0xf2cf6a }) : dark;
  const add = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
  const prof = [[0, -5.3], [.28, -5.15], [.52, -4.4], [.72, -3], [.8, -1.5], [.8, 2.6], [.74, 3.6], [.58, 4.4], [.36, 4.95], [.12, 5.25], [0, 5.3]].map(p => new THREE.Vector2(p[0], p[1]));
  const fus = new THREE.LatheGeometry(prof, 48); fus.rotateZ(-Math.PI / 2); add(fus, white);
  for (const s of [1, -1]) {
    add(new THREE.BoxGeometry(5.6, .13, .04), red, .3, -.12, s * .79);
    add(new THREE.BoxGeometry(4.5, .07, .04), red, .1, -.3, s * .765);
    for (let i = 0; i < 8; i++) { const w = add(new THREE.CircleGeometry(.12, 20), win, -1.5 + i * .52, .2, s * .805); if (s < 0) w.rotation.y = Math.PI; }
  }
  const ws = add(new THREE.SphereGeometry(.5, 24, 12), dark, 3.85, .4, 0); ws.scale.set(.6, .3, 1.02);
  // wings
  for (const s of [1, -1]) {
    const wg = extrudeXY([[1.5, .6], [-1.0, .6], [-2.7, 5.7], [-1.8, 5.7]].map(p => [p[0], p[1] * s]), .14); wg.rotateX(Math.PI / 2); add(wg, white, 0, -.32, 0);
    const wl = extrudeXY([[-1.75, 0], [-2.65, 0], [-3.1, 1.0], [-2.65, 1.0]], .06); add(wl, white, 0, -.32, s * 5.68);
    add(new THREE.CylinderGeometry(.34, .3, 1.9, 24).rotateZ(Math.PI / 2), grey, -3.05, .52, s * 1.28);
    add(new THREE.CylinderGeometry(.27, .27, .06, 24).rotateZ(Math.PI / 2), dark, -2.1, .52, s * 1.28);
    add(new THREE.BoxGeometry(.9, .14, .6), grey, -3.05, .5, s * .9);
  }
  add(extrudeXY([[-3.0, .55], [-4.6, .55], [-5.35, 3.0], [-4.65, 3.0]], .13), white);
  for (const s of [1, -1]) { const hs = extrudeXY([[-4.6, 0], [-5.35, 0], [-5.95, 2.3], [-5.5, 2.3]].map(p => [p[0], p[1] * s]), .1); hs.rotateX(Math.PI / 2); add(hs, white, 0, 3.02, 0); }
  // gear
  const gear = new THREE.Group(); g.add(gear);
  for (const [x, z] of [[3.1, 0], [-.4, 1.1], [-.4, -1.1]]) {
    const st = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .9), grey); st.position.set(x, -.95, z); gear.add(st);
    const wh = new THREE.Mesh(new THREE.CylinderGeometry(.24, .24, .2, 16).rotateX(Math.PI / 2), dark); wh.position.set(x, -1.35, z); wh.castShadow = true; gear.add(wh);
  }
  gear.visible = !!o.gear; g.userData.gear = gear;
  g.rotation.order = 'YZX';
  if (o.holo) {
    const fill = new THREE.MeshBasicMaterial({ color: 0x46d4ff, transparent: true, opacity: .22, depthWrite: false, blending: THREE.AdditiveBlending });
    const lm = new THREE.LineBasicMaterial({ color: 0x8fe8ff, transparent: true, opacity: .95 });
    const meshes = []; g.traverse(m => { if (m.isMesh) meshes.push(m); });
    for (const m of meshes) { m.material = fill; m.castShadow = false; const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 25), lm); m.add(e); }
  }
  return g;
}
const setRot = (o, heading, pitch, roll) => { o.rotation.set(roll, heading, pitch, 'YZX'); };

function lights(scene, sky, ground, hi, dc, di, dpos) { scene.add(new THREE.HemisphereLight(sky, ground, hi)); const d = new THREE.DirectionalLight(dc, di); d.position.copy(dpos); scene.add(d); scene.add(d.target); return d; }
const persp = () => new THREE.PerspectiveCamera(50, W / H, .1, 800);

// ================= OVERLAY =================
const ov = document.getElementById('ov');
function mk(html, x, y, cls = '', style = '') { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; d.style.cssText = `left:${x}px;top:${y}px;transform:translate(-50%,-50%);display:none;${style}`; ov.appendChild(d); return d; }
function pop(el, t, t0, t1, o = {}) {
  const fade = o.fade ?? .2, dur = o.dur ?? .38;
  if (t < t0 || t > t1) { el.style.display = 'none'; return 0; }
  el.style.display = '';
  const a = clamp((t - t0) / dur), op = Math.min(clamp((t - t0) / (dur * .5)), 1 - clamp((t - (t1 - fade)) / fade));
  const s = lerp(o.from ?? .55, 1, backOut(a)) * (o.scale ?? 1);
  if (o.x !== undefined) el.style.left = o.x + 'px';
  if (o.y !== undefined) el.style.top = o.y + 'px';
  el.style.opacity = op; el.style.transform = `translate(-50%,-50%) scale(${s}) ${o.extra || ''}`;
  return op;
}
const pill = (txt, c, x, y) => mk(`<div class="dot" style="--c:${c}"></div>${txt}`, x, y, 'pill');
const callout = (a, b, c, x, y, hot = false) => mk(`<b>${a}</b>${b ? `<small>${b}</small>` : ''}`, x, y, 'co' + (hot ? ' hot' : ''), `--c:${c}`);
const title = (txt, cls, x, y, size = 128) => mk(txt, x, y, 'title ' + cls, `font-size:${size}px`);

const svgNS = 'http://www.w3.org/2000/svg';
const lineSvg = document.createElementNS(svgNS, 'svg'); lineSvg.setAttribute('width', W); lineSvg.setAttribute('height', H); lineSvg.style.cssText = 'left:0;top:0;overflow:visible'; ov.appendChild(lineSvg);
function mkLine(color, w = 4) {
  const g = document.createElementNS(svgNS, 'g');
  const p = document.createElementNS(svgNS, 'polyline'); p.setAttribute('fill', 'none'); p.setAttribute('stroke', color); p.setAttribute('stroke-width', w); p.setAttribute('stroke-linejoin', 'round'); p.style.filter = `drop-shadow(0 0 6px ${color})`;
  const c = document.createElementNS(svgNS, 'circle'); c.setAttribute('r', 9); c.setAttribute('fill', color); c.setAttribute('stroke', '#fff'); c.setAttribute('stroke-width', 3);
  g.appendChild(p); g.appendChild(c); lineSvg.appendChild(g);
  return { set(pts, op, prog = 1) {
    if (op <= 0) { g.style.display = 'none'; return; } g.style.display = '';
    g.style.opacity = op; p.setAttribute('points', pts.map(q => q.join(',')).join(' '));
    let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    p.setAttribute('stroke-dasharray', `${L} ${L}`); p.setAttribute('stroke-dashoffset', L * (1 - clamp(prog)));
    c.setAttribute('cx', pts[0][0]); c.setAttribute('cy', pts[0][1]);
  } };
}
function proj(v, cam) { const p = v.clone().project(cam); return [(p.x + 1) / 2 * W, (1 - p.y) / 2 * H]; }

// flash / vignettes
const flash = mk('', 540, 960, '', 'width:1080px;height:1920px;background:#fff');
flash.innerHTML = `<svg width="1080" height="1920">${Array.from({ length: 26 }, (_, i) => { const r = rng(i + 50); const x = r() * 1400 - 200, y = r() * 2200 - 200, l = 120 + r() * 260; return `<line x1="${x}" y1="${y}" x2="${x + l * .5}" y2="${y - l}" stroke="#b9bcc4" stroke-width="${2 + r() * 3}" stroke-linecap="round"/>`; }).join('')}</svg>`;
const redVig = mk('', 540, 960, '', 'width:1080px;height:1920px;background:radial-gradient(ellipse at center,rgba(255,30,10,.05) 35%,rgba(255,20,0,.75) 100%);mix-blend-mode:normal');

// --- overlay elements per scene
const E = {};
E.floride = pill(TX.floride, '#ff8a2a', 540, 300);
E.jet = callout(TX.jet[0], TX.jet[1], '#ff7a45', 790, 560, true); E.jetL = mkLine('#ff8a5a');
E.tombe = title(TX.tombe, 'red', 540, 330, 112);
E.min = mk(`<svg width="96" height="96" viewBox="0 0 96 96"><circle cx="48" cy="52" r="34" fill="none" stroke="#fff" stroke-width="6"/><rect x="40" y="6" width="16" height="10" rx="3" fill="#fff"/><line x1="48" y1="52" x2="48" y2="30" stroke="#ff3b1f" stroke-width="6" stroke-linecap="round" id="minNeedle"/><path d="M48 4 l18 6 -18 6z" fill="#ff3b1f"/></svg><div><div style="font-family:Mont;font-weight:800;font-size:76px;color:#fff;line-height:1">${TX.min[0].replace('<', '&lt;')}</div><div style="font-family:Mono;font-weight:700;font-size:19px;letter-spacing:3px;color:#cfd2da;margin-top:6px">${TX.min[1]}</div></div>`, 540, 1250, 'pill', 'padding:22px 40px 22px 26px;border-radius:70px;gap:22px');
E.date = pill(TX.date, '#5aa0ff', 540, 300);
E.lear = callout(TX.learjet[0], TX.learjet[1], '#f2f2f2', 760, 1040); E.learL = mkLine('#ffffff', 3.5);
// route card
E.route = mk(`<svg width="880" height="220" viewBox="0 0 880 220">
 <defs><linearGradient id="rg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="rgba(80,84,102,.9)"/><stop offset="1" stop-color="rgba(25,27,36,.92)"/></linearGradient></defs>
 <rect x="2" y="2" width="876" height="216" rx="24" fill="url(#rg)" stroke="rgba(255,255,255,.45)" stroke-width="3"/>
 <path id="rArcBg" d="M70 130 Q 420 10 790 120" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="4" stroke-dasharray="4 12"/>
 <path id="rArc" d="M70 130 Q 420 10 790 120" fill="none" stroke="#ff4030" stroke-width="5"/>
 <circle cx="70" cy="130" r="9" fill="#fff"/><circle cx="520" cy="70" r="8" fill="#fff"/><circle cx="790" cy="120" r="8" fill="#fff"/>
 <text x="70" y="172" font-family="Mono" font-weight="800" font-size="22" fill="#fff" text-anchor="middle" letter-spacing="2">${TX.route[0][0]}</text>
 <text x="70" y="196" font-family="Mono" font-weight="700" font-size="15" fill="#b9bdc8" text-anchor="middle" letter-spacing="2">${TX.route[0][1]}</text>
 <text x="520" y="112" font-family="Mono" font-weight="800" font-size="22" fill="#fff" text-anchor="middle" letter-spacing="2">${TX.route[1][0]}</text>
 <text x="790" y="162" font-family="Mono" font-weight="800" font-size="22" fill="#fff" text-anchor="middle" letter-spacing="2">${TX.route[2][0]}</text>
 <g transform="translate(770,40)" fill="#5fd36b"><rect x="12" y="20" width="5" height="36" fill="#a3743f" transform="rotate(8 14 38)"/><path d="M14 22 q-22 -8 -30 6 q14 -6 30 -6z M14 22 q20 -12 32 2 q-16 -4 -32 -2z M14 22 q-6 -18 6 -26 q-2 12 -6 26z"/>
 <rect x="42" y="26" width="5" height="30" fill="#a3743f" transform="rotate(-6 44 40)"/><path d="M44 28 q-18 -6 -26 4 q12 -4 26 -4z M44 28 q18 -10 28 2 q-14 -4 -28 -2z M44 28 q-4 -16 6 -22 q-2 10 -6 22z"/></g>
 <g id="rPlane"><path d="M-22 0 L18 -3 Q26 0 18 3 Z M2 -2 L-8 -20 L-2 -20 L10 -2Z M2 2 L-8 20 L-2 20 L10 2Z M-16 -1 L-22 -9 L-18 -9 L-12 -1Z M-16 1 L-22 9 L-18 9 L-12 1Z" fill="#fff"/></g>
</svg>`, 540, 250);
const rArc = E.route.querySelector('#rArc'), rPlane = E.route.querySelector('#rPlane');
const rLen = 820; rArc.setAttribute('stroke-dasharray', `${rLen} ${rLen}`);
E.bord = title(TX.bord, 'white', 540, 520, 124);
E.bordSub = pill(TX.bordSub, '#ffffff', 540, 668); E.bordSub.querySelector('.dot').remove(); E.bordSub.style.fontSize = '24px';
// pilot quote
E.pilot = mk(`<svg width="150" height="170" viewBox="0 0 150 170"><ellipse cx="75" cy="160" rx="55" ry="10" fill="rgba(0,0,0,.25)"/>
 <path d="M25 165 q0 -50 50 -52 q50 2 50 52z" fill="#2f3a52"/><path d="M60 113 l15 22 15 -22z" fill="#fff"/><path d="M70 120 l5 30 5 -30z" fill="#20283a"/>
 <circle cx="75" cy="78" r="38" fill="#ffcb3d"/><circle cx="62" cy="80" r="5" fill="#3a2a10"/><circle cx="88" cy="80" r="5" fill="#3a2a10"/><path d="M63 97 q12 8 24 0" stroke="#3a2a10" stroke-width="4" fill="none" stroke-linecap="round"/>
 <path d="M33 58 q42 -40 84 0 l-6 10 h-72z" fill="#1f2a44"/><rect x="38" y="58" width="74" height="10" rx="4" fill="#111827"/><circle cx="75" cy="44" r="8" fill="#ffcb3d"/></svg>`, 170, 430, '', 'filter:drop-shadow(0 0 18px rgba(255,210,80,.6))');
E.quote = mk(`<div style="font-family:Mont;font-weight:800;font-size:44px;color:#fff">${TX.quote}</div><div style="font-family:Mono;font-weight:700;font-size:18px;letter-spacing:3px;color:#c9ccd6;margin-top:6px">${TX.quoteSub}</div>`, 600, 440, 'pill', 'flex-direction:column;align-items:flex-start;gap:0;padding:20px 30px');
// ATC
E.atc = mk(`<svg width="520" height="60" viewBox="0 0 520 60"><g id="atcBars"></g></svg><span>${TX.atc}</span>`, 540, 300, 'pill', 'padding:12px 30px');
const atcBars = E.atc.querySelector('#atcBars'); for (let i = 0; i < 64; i++) { const r = document.createElementNS(svgNS, 'rect'); r.setAttribute('x', i * 8); r.setAttribute('width', 4); r.setAttribute('rx', 2); r.setAttribute('fill', '#e8ebf2'); atcBars.appendChild(r); }
// cockpit panel
function ticks(cx, cy, r, n, len, w, from = 0, to = 360) { let s = ''; for (let i = 0; i < n; i++) { const a = (from + (to - from) * i / n - 90) * Math.PI / 180; s += `<line x1="${cx + Math.cos(a) * r}" y1="${cy + Math.sin(a) * r}" x2="${cx + Math.cos(a) * (r - len)}" y2="${cy + Math.sin(a) * (r - len)}" stroke="#eee" stroke-width="${w}"/>`; } return s; }
function nums(cx, cy, r, arr, size = 26) { return arr.map((n, i) => { const a = (360 * i / arr.length - 90) * Math.PI / 180; return `<text x="${cx + Math.cos(a) * r}" y="${cy + Math.sin(a) * r + size * .36}" font-family="Mono" font-weight="800" font-size="${size}" fill="#eee" text-anchor="middle">${n}</text>`; }).join(''); }
const G = [240, 540, 840], GY = 1065, GR = 128;
E.panel = mk(`<svg width="1080" height="1920" viewBox="0 0 1080 1920">
 <defs><linearGradient id="pg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#474a54"/><stop offset="1" stop-color="#2c2f37"/></linearGradient>
 <clipPath id="attClip"><circle cx="${G[1]}" cy="${GY}" r="${GR - 8}"/></clipPath>
 <radialGradient id="gl" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="rgba(255,255,255,.28)"/><stop offset=".5" stop-color="rgba(255,255,255,0)"/></radialGradient></defs>
 <rect x="-20" y="790" width="1120" height="560" fill="url(#pg)"/>
 <rect x="-20" y="782" width="1120" height="40" fill="#1d1f25"/>
 <rect id="lampL" x="160" y="858" width="160" height="48" rx="4" fill="#b8613c"/><rect id="lampR" x="760" y="858" width="160" height="48" rx="4" fill="#b8613c"/>
 ${G.map(x => `<circle cx="${x}" cy="${GY}" r="${GR + 10}" fill="#1a1b1f" stroke="#8b8f99" stroke-width="7"/>`).join('')}
 <circle cx="${G[0]}" cy="${GY}" r="${GR}" fill="#0d0e11"/>${ticks(G[0], GY, GR - 6, 40, 14, 3, -150, 150)}${ticks(G[0], GY, GR - 6, 8, 26, 6, -150, 150)}
 <text x="${G[0]}" y="${GY - 38}" font-family="Mono" font-weight="800" font-size="16" fill="#ddd" text-anchor="middle">AIR SPEED</text><text x="${G[0]}" y="${GY + 50}" font-family="Mono" font-weight="800" font-size="16" fill="#ddd" text-anchor="middle">KNOTS</text>
 <rect x="${G[0] - 60}" y="${GY - 12}" width="54" height="24" rx="3" fill="#eee"/>
 <line id="asN" x1="${G[0]}" y1="${GY}" x2="${G[0]}" y2="${GY - 105}" stroke="#fff" stroke-width="7" stroke-linecap="round"/><circle cx="${G[0]}" cy="${GY}" r="12" fill="#ddd"/>
 <g clip-path="url(#attClip)"><g id="att"><rect x="${G[1] - 400}" y="${GY - 400}" width="800" height="400" fill="#4ea6ee"/><rect x="${G[1] - 400}" y="${GY}" width="800" height="400" fill="#ee9a33"/>
  <line x1="${G[1] - 400}" y1="${GY}" x2="${G[1] + 400}" y2="${GY}" stroke="#fff" stroke-width="5"/>
  ${[-60, -40, -20, 20, 40, 60].map(d => `<line x1="${G[1] - (d % 40 ? 22 : 40)}" y1="${GY + d}" x2="${G[1] + (d % 40 ? 22 : 40)}" y2="${GY + d}" stroke="#fff" stroke-width="3"/>`).join('')}</g></g>
 <path d="M${G[1] - 70} ${GY} h40 l12 14 l12 -14 h12 l12 14 l12 -14 h40" fill="none" stroke="#ffd000" stroke-width="8" stroke-linejoin="round"/>
 <circle cx="${G[1]}" cy="${GY}" r="${GR - 8}" fill="url(#gl)"/>
 <circle cx="${G[2]}" cy="${GY}" r="${GR}" fill="#0d0e11"/>${ticks(G[2], GY, GR - 6, 50, 12, 3)}${nums(G[2], GY, GR - 38, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9])}
 <rect x="${G[2] - 34}" y="${GY + 30}" width="68" height="28" rx="3" fill="#eee"/><text id="altTxt" x="${G[2]}" y="${GY + 52}" font-family="Mono" font-weight="800" font-size="20" fill="#111" text-anchor="middle">27000</text>
 <line id="alN1" x1="${G[2]}" y1="${GY}" x2="${G[2]}" y2="${GY - 70}" stroke="#fff" stroke-width="10" stroke-linecap="round"/>
 <line id="alN2" x1="${G[2]}" y1="${GY}" x2="${G[2]}" y2="${GY - 108}" stroke="#fff" stroke-width="5" stroke-linecap="round"/><circle cx="${G[2]}" cy="${GY}" r="11" fill="#ddd"/>
 <circle cx="${G[0]}" cy="${GY}" r="${GR}" fill="url(#gl)"/><circle cx="${G[2]}" cy="${GY}" r="${GR}" fill="url(#gl)"/>
 ${Array.from({ length: 11 }, (_, i) => `<rect class="ydash" x="${70 + i * 88}" y="1262" width="52" height="16" rx="3" fill="#f4c21a"/>`).join('')}
</svg>`, 540, 960, '', '');
const P = id => E.panel.querySelector('#' + id);
E.mayday = title(TX.mayday, 'red', 540, 330, 150);
E.alarm = mk(`<span style="font-family:Mono;font-weight:800;font-size:26px;letter-spacing:3px;color:#fff">${TX.alarmes}</span>`, 600, 760, 'co hot', '--c:#ff5a3a;padding:8px 20px'); E.alarmL = mkLine('#ff4a2a', 4);
E.desc = callout('−0 FT/MIN', TX.descent[2], '#ff3a2a', 300, 1340, true); E.descL = mkLine('#ff4a2a', 4);
// altitude
E.alt = mk(`<div style="font-family:Mono;font-weight:800;font-size:18px;letter-spacing:4px;color:#c9ccd6;text-align:center">ALTITUDE</div><div style="display:flex;align-items:baseline;gap:8px"><span class="v" style="font-family:Mont;font-weight:800;font-size:82px;line-height:1.05">27 000</span><span style="font-family:Mono;font-weight:800;font-size:22px;color:#c9ccd6">FT</span></div>`, 540, 330, 'pill', 'flex-direction:column;gap:2px;padding:14px 34px');
E.altV = E.alt.querySelector('.v');
E.chute = callout(TX.chute[0], TX.chute[1], '#ff3a2a', 730, 1270, true); E.chuteL = mkLine('#ff3a2a', 5);
E.palm = callout(TX.palm[0], TX.palm[1], '#f5e04a', 760, 600); E.palmL = mkLine('#f5e04a', 5);
E.secours = callout(TX.secours, '', '#d9dde6', 560, 1560); E.secL = mkLine('#e8ecf3', 4);
E.holo = callout(TX.holo[0], TX.holo[1], '#ff3a2a', 700, 300, true); E.holoL = mkLine('#ff3a2a', 5);
E.impact = pill(TX.impact, '#ff3a2a', 540, 300);
E.pulv = title(TX.pulv, 'red', 540, 330, 124);
E.ring = mk(`<svg width="700" height="700" viewBox="0 0 700 700"><circle cx="350" cy="350" r="300" fill="none" stroke="#fff" stroke-width="10" style="filter:drop-shadow(0 0 14px #fff)"/></svg>`, 540, 960);
E.debris = callout(TX.debris, '', '#e8ecf3', 760, 560); E.debL = mkLine('#ffffff', 4);
E.morts = title(TX.morts, 'white', 540, 330, 130);
E.pourquoi = title(TX.pourquoi, 'red', 540, 400, 130);
E.ntsb = pill(TX.ntsb, '#4cff7a', 540, 230);
E.peri = callout(TX.peri[0], TX.peri[1], '#f5e04a', 820, 1180); E.periL = mkLine('#f5e04a', 5);
E.mag = mk(`<svg width="200" height="230" viewBox="0 0 200 230"><line x1="125" y1="125" x2="180" y2="200" stroke="#e8ecf3" stroke-width="22" stroke-linecap="round"/><circle cx="85" cy="85" r="68" fill="rgba(255,255,255,.35)" stroke="#fff" stroke-width="16"/><circle cx="62" cy="62" r="18" fill="rgba(255,255,255,.7)"/></svg>`, 470, 560, '', 'filter:drop-shadow(0 0 22px rgba(255,255,255,.7))');
E.tombs = Array.from({ length: 9 }, (_, i) => mk(`<svg width="84" height="104" viewBox="0 0 84 104"><path d="M6 100 V40 a36 36 0 0 1 72 0 V100z" fill="#e7edf2" stroke="#fff" stroke-width="3"/><rect x="2" y="94" width="80" height="10" rx="3" fill="#b8c2cc"/><path d="M42 30 v34 M30 42 h24" stroke="#b6c0ca" stroke-width="6" stroke-linecap="round"/></svg>`, 540 + (i - 4) * 98, 1500, '', 'filter:drop-shadow(0 0 16px rgba(220,240,255,.85))'));

// ================= SCENE 1 : au-dessus des nuages =================
const s1 = new THREE.Scene(); const bg1 = makeBg(); s1.background = bg1.tex; s1.fog = new THREE.Fog(0xf1e6de, 40, 160);
lights(s1, 0xfff3ea, 0xffc8a0, 1.9, 0xfff0dd, 2.4, V(6, 12, 10));
const jet1 = makeJet(); s1.add(jet1);
const cl1 = cloudField(s1, { n: 110, seed: 1, xr: [-80, 80], yr: [-10, -3.2], zr: [-80, 22], size: [12, 26], color: 0xffffff, opacity: 1, fog: true });
const cl1b = cloudField(s1, { n: 14, seed: 11, xr: [-80, 80], yr: [3, 12], zr: [-90, -40], size: [14, 26], color: 0xffd7bd, opacity: .5 });
const fl1 = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), new THREE.MeshBasicMaterial({ color: 0xf3f1ef })); fl1.rotation.x = -Math.PI / 2; fl1.position.y = -8; s1.add(fl1);
const cam1 = persp();
function u1(t) {
  bg1.set([[0, '#6c56b9'], [.28, '#ff7420'], [.45, '#ff9550'], [.6, '#f6ddcf'], [1, '#f0efee']]);
  jet1.position.set(lerp(-1.2, 1.8, t / 3.2), Math.sin(t * 2) * .1, 0); setRot(jet1, -.38, .03, .07);
  const k = eOut(t / 1.4);
  cam1.position.set(jet1.position.x - 1, lerp(1.2, 3.4, k), lerp(19, 32, k)); cam1.lookAt(jet1.position.x - .3, lerp(-.8, -2.2, k), 0);
  cl1.update(-t * 4); cl1b.update(-t * 2);
  return [s1, cam1];
}

// ================= SCENE 2 : tombé du ciel =================
const s2 = new THREE.Scene(); const bg2 = makeBg(); s2.background = bg2.tex;
lights(s2, 0xffffff, 0xd8d2cc, 2.0, 0xffffff, 2.0, V(4, 6, 12));
const jet2 = makeJet(); s2.add(jet2);
const cl2 = cloudField(s2, { n: 40, seed: 2, xr: [-40, 40], yr: [-50, 50], zr: [-40, 5], size: [12, 24], color: 0xffffff, opacity: .8 });
const cam2 = persp();
function u2(t) { const lt = t - 3.2;
  bg2.set(mixStops([[0, '#e2a27a'], [.3, '#d6cfca'], [1, '#ececeb']], [[0, '#cfc6c2'], [.3, '#dcd8d5'], [1, '#efefee']], lt / 1.2));
  jet2.position.set(.6 + lt * .4, 1.2 - lt * 1.0, 0); setRot(jet2, .25, -1.0 - lt * .05, Math.PI / 2 - .35 + lt * .25);
  cam2.position.set(0, 0, 25); cam2.lookAt(0, 0, 0);
  cl2.update(0, lt * 22, 0);
  return [s2, cam2];
}

// ================= SCENE 3 : décollage =================
const s3 = new THREE.Scene(); const bg3 = makeBg(); s3.background = bg3.tex; s3.fog = new THREE.Fog(0xf0a070, 80, 420);
s3.add(new THREE.HemisphereLight(0xa8b6ff, 0xd0a070, 1.5));
const d3 = new THREE.DirectionalLight(0xffe2c0, 2.8); d3.castShadow = true; d3.shadow.mapSize.set(2048, 2048); Object.assign(d3.shadow.camera, { left: -25, right: 25, top: 25, bottom: -25, near: 1, far: 200 }); d3.shadow.bias = -.0005; s3.add(d3); s3.add(d3.target);
const gr3 = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshStandardMaterial({ color: 0xb19a82, roughness: 1 })); gr3.rotation.x = -Math.PI / 2; gr3.receiveShadow = true; s3.add(gr3);
const rw = new THREE.Mesh(new THREE.PlaneGeometry(1400, 16), new THREE.MeshStandardMaterial({ color: 0x5a5b62, roughness: .9 })); rw.rotation.x = -Math.PI / 2; rw.position.set(200, .02, 0); rw.receiveShadow = true; s3.add(rw);
{ const wm = new THREE.MeshBasicMaterial({ color: 0xf2f2f2 }); for (let x = -500; x < 900; x += 14) { const d = new THREE.Mesh(new THREE.PlaneGeometry(6, .5), wm); d.rotation.x = -Math.PI / 2; d.position.set(x, .04, 0); s3.add(d); }
  for (const z of [-7.5, 7.5]) { const e = new THREE.Mesh(new THREE.PlaneGeometry(1400, .3), wm); e.rotation.x = -Math.PI / 2; e.position.set(200, .04, z); s3.add(e); }
  for (let i = 0; i < 8; i++) { const d = new THREE.Mesh(new THREE.PlaneGeometry(10, .8), wm); d.rotation.x = -Math.PI / 2; d.position.set(-115, .04, -6 + i * 1.7); s3.add(d); }
  const ym = new THREE.MeshBasicMaterial({ color: 0xe8c23a }); for (let x = -300; x < 600; x += 7) { const d = new THREE.Mesh(new THREE.PlaneGeometry(3.5, .35), ym); d.rotation.x = -Math.PI / 2; d.position.set(x, .04, 14); s3.add(d); } }
const jet3 = makeJet({ gear: true }); s3.add(jet3);
const cam3 = persp();
function jetPath3(lt) { const x = -100 + 30 * lt + 11 * lt * lt; const lift = Math.max(0, lt - 1.25); return V(x, 1.6 + 3.2 * lift * lift + 2.5 * lift, 0); }
function u3(t) { const lt = t - 5.3;
  bg3.set([[0, '#1636c9'], [.3, '#3550d0'], [.45, '#8a73b8'], [.56, '#ff7a1a'], [.62, '#ffa45a'], [1, '#e8c8a0']]);
  const p = jetPath3(lt); jet3.position.copy(p);
  const pitch = ss(1.05, 1.6, lt) * .2; setRot(jet3, 0, pitch, 0); jet3.userData.gear.visible = lt < 2.6;
  const camA = V(-8, 2.6, 3.5);
  const off1 = V(5, -.6, 15), off2 = V(-1, -2.5, 34);
  let cp;
  if (lt < 1.3) cp = camA;
  else if (lt < 2.2) cp = vlerp(camA, p.clone().add(off1), eIO((lt - 1.3) / .9));
  else cp = vlerp(p.clone().add(off1), p.clone().add(off2), eIO((lt - 2.2) / 1.3));
  cam3.position.copy(cp); const look = p.clone().add(V(lt < 1.3 ? 0 : 1.5, lt < 1.3 ? 1 : .5, 0)); cam3.lookAt(look);
  d3.position.copy(p).add(V(-12, 30, 14)); d3.target.position.copy(p);
  return [s3, cam3];
}

// ================= SCENE 5 : 9 à bord (fuselage) + aile =================
const s5 = new THREE.Scene(); const bg5 = makeBg(); s5.background = bg5.tex;
const hemi5 = new THREE.HemisphereLight(0xdfe6ff, 0x9a8a80, 1.6); s5.add(hemi5);
const d5 = new THREE.DirectionalLight(0xfff0e0, 2.2); d5.position.set(5, 10, 10); s5.add(d5);
const jet5 = makeJet({ winGlow: true }); s5.add(jet5); setRot(jet5, 0, 0, 0);
const cl5 = cloudField(s5, { n: 60, seed: 5, xr: [-60, 60], yr: [-25, 12], zr: [-60, -6], size: [10, 22], color: 0x8a90a0, opacity: .7 });
const cl5b = cloudField(s5, { n: 50, seed: 15, xr: [-60, 60], yr: [-25, 6], zr: [10, 70], size: [10, 22], color: 0x7d8392, opacity: .7 });
// ice
const iceMat = new THREE.MeshStandardMaterial({ color: 0xe8f6ff, roughness: .15, metalness: .1, transparent: true, opacity: .92, emissive: 0x9fd6ff, emissiveIntensity: .25, flatShading: true });
const ices = []; { const r = rng(9); for (let i = 0; i < 140; i++) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(.05 + r() * .07, 0), iceMat); const z = 1 + r() * 4.6; const x = lerp(1.4, -1.6, (z - .6) / 5.1) - r() * .25; m.position.set(x + .05, -.22 + r() * .06, z); m.userData.t0 = 12.35 + r() * 1.4; m.rotation.set(r() * 3, r() * 3, r() * 3); s5.add(m); ices.push(m); } }
const cam5 = persp();
function u5(t) {
  const a = ss(9.6, 11.2, t), b = ss(11.8, 12.05, t);
  const stA = [[0, '#2a3fc8'], [.35, '#6a6ac0'], [.55, '#ff8030'], [1, '#e9c09a']], stB = [[0, '#3d4352'], [.35, '#596070'], [.55, '#7b8090'], [1, '#9097a4']], stC = [[0, '#20242e'], [.35, '#2f3440'], [.55, '#454b58'], [1, '#596070']];
  bg5.set(b > 0 ? mixStops(stB, stC, b) : mixStops(stA, stB, a));
  hemi5.intensity = lerp(1.6, 1.0, b);
  let cp, lk;
  if (t < 12) { const k = eIO((t - 9.3) / 2.7); cp = V(lerp(4.2, -.3, k), lerp(.9, 1.0, k), lerp(3.4, 3.0, k)); lk = V(cp.x - 3.2, -.2, 0); }
  else { const k = (t - 12) / 2; const wv = window.WING || [2.6, 1.2, 1.4, -1.8, -.8, 5.2]; cp = V(wv[0] - k * .4, wv[1], wv[2]); lk = V(wv[3], wv[4], wv[5]); cp.x += Math.sin(t * 37) * .015; cp.y += Math.sin(t * 29) * .015; }
  cam5.position.copy(cp); cam5.lookAt(lk);
  cl5.update(-t * 18, 0, 0); for (const s of cl5.sp) s.visible = t > 11; cl5b.update(-t * 40, 0, 0); for (const s of cl5b.sp) s.visible = t >= 12;
  for (const m of ices) { const k = ss(m.userData.t0, m.userData.t0 + .5, t); m.scale.setScalar(k); m.visible = k > 0; }
  return [s5, cam5];
}

// ================= SCENE 7 : cockpit =================
const s7 = new THREE.Scene(); const bg7 = makeBg(); s7.background = bg7.tex;
const cl7 = cloudField(s7, { n: 70, seed: 7, xr: [-40, 40], yr: [-20, 25], zr: [-120, 10], size: [10, 22], color: 0xa9aebb, opacity: .75 });
const cam7 = persp();
function u7(t) {
  const m = ss(15.9, 16.3, t);
  bg7.set(mixStops([[0, '#8b909c'], [.5, '#a3a8b3'], [1, '#6b707b']], [[0, '#5a4d55'], [.5, '#7d7077'], [1, '#4c4148']], m));
  cl7.update(0, m * (t - 16) * 30, t * 45);
  cam7.position.set(0, 0, 0); cam7.rotation.set(0, 0, m * -.6 * ss(16, 17, t));
  return [s7, cam7];
}

// ================= SCENE 8 : chute dans les nuages =================
const s8 = new THREE.Scene(); const bg8 = makeBg(); s8.background = bg8.tex;
lights(s8, 0xc8d0e0, 0x404550, 1.5, 0xffffff, 1.8, V(-6, 4, 10));
const jet8 = makeJet({ color: 0xf1ead2 }); s8.add(jet8);
const cl8 = cloudField(s8, { n: 70, seed: 8, xr: [-50, 50], yr: [-60, 60], zr: [-40, 8], size: [14, 30], color: 0xb8bcc6, opacity: .85 });
const cam8 = persp();
function u8(t) { const lt = t - 17.8;
  bg8.set([[0, '#07080b'], [.45, '#1b1d23'], [1, '#3f434c']]);
  jet8.position.set(1, 0, 0); setRot(jet8, 2.55 + lt * .05, -.55 - lt * .05, .75 + lt * .12);
  const sh = .02 + lt * .025; cam8.position.set(1 + Math.sin(t * 41) * sh, -1.5 + Math.sin(t * 33) * sh, 25); cam8.lookAt(1, .6, 0);
  cl8.update(0, lt * 30, 0);
  return [s8, cam8];
}

// ================= TOWN (scènes 9-14) =================
const T = new THREE.Scene(); T.background = new THREE.Color('#141a33'); T.fog = new THREE.Fog('#141a33', 55, 140);
const hemiT = new THREE.HemisphereLight(0x7f8fd8, 0x1c2140, 1.5); T.add(hemiT);
const dT = new THREE.DirectionalLight(0xa8b8ff, 1.3); dT.position.set(-20, 40, 15); T.add(dT);
{ const g = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshStandardMaterial({ color: 0x252d4f, roughness: 1 })); g.rotation.x = -Math.PI / 2; T.add(g);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(400, 10), new THREE.MeshStandardMaterial({ color: 0x343b5c, roughness: .95 })); road.rotation.x = -Math.PI / 2; road.position.y = .02; T.add(road);
  for (const z of [-6.3, 6.3]) { const sw = new THREE.Mesh(new THREE.BoxGeometry(400, .25, 2.6), new THREE.MeshStandardMaterial({ color: 0x4a5480 })); sw.position.set(0, .12, z); T.add(sw); }
  const wm = new THREE.MeshBasicMaterial({ color: 0xf2f2f2 }); for (let x = -200; x < 200; x += 6) { const d = new THREE.Mesh(new THREE.PlaneGeometry(2.6, .28), wm); d.rotation.x = -Math.PI / 2; d.position.set(x, .04, 0); T.add(d); }
  const r = rng(21); const winM = new THREE.MeshBasicMaterial({ color: 0xffd57a });
  for (const side of [-1, 1]) for (let x = -90; x < 90; x += 10 + r() * 4) {
    const w = 6 + r() * 3, d = 6 + r() * 3, h = 3 + r() * 2.6; const col = new THREE.Color(0x56629a).offsetHSL(0, 0, (r() - .5) * .08);
    const hm = new THREE.MeshStandardMaterial({ color: col, roughness: .9, flatShading: true });
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), hm); b.position.set(x, h / 2, side * (9.5 + d / 2)); T.add(b);
    if (r() < .6) { const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * .75, 1.8, 4), hm); roof.rotation.y = Math.PI / 4; roof.scale.set(w / Math.max(w, d), 1, d / Math.max(w, d)); roof.position.set(x, h + .9, side * (9.5 + d / 2)); T.add(roof); }
    for (let k = 0; k < 2; k++) if (r() < .85) { const wn = new THREE.Mesh(new THREE.PlaneGeometry(.9, .9), winM); wn.position.set(x - w / 4 + k * w / 2, h * .55, side * 9.48); if (side > 0) wn.rotation.y = Math.PI; T.add(wn); }
  }
  const trunkM = new THREE.MeshStandardMaterial({ color: 0x4a5577 }), leafM = new THREE.MeshStandardMaterial({ color: 0x3fb8a4, emissive: 0x0e3a36, side: THREE.DoubleSide, flatShading: true });
  for (const side of [-1, 1]) for (let x = -80; x < 80; x += 11 + r() * 8) {
    const p = new THREE.Group(); const h = 5 + r() * 2.5; const tr = new THREE.Mesh(new THREE.CylinderGeometry(.13, .22, h, 6), trunkM); tr.position.y = h / 2; p.add(tr);
    for (let k = 0; k < 7; k++) { const lf = new THREE.Mesh(new THREE.ConeGeometry(.35, 3.2, 3), leafM); lf.geometry.translate(0, 1.6, 0); const piv = new THREE.Group(); piv.position.y = h; piv.rotation.y = k / 7 * Math.PI * 2 + r(); lf.rotation.z = -1.2 - r() * .4; lf.scale.z = .25; piv.add(lf); p.add(piv); }
    p.position.set(x, 0, side * (6.6 + r() * .8)); p.rotation.z = (r() - .5) * .25; T.add(p);
  }
}
// crater
const crater = new THREE.Group(); T.add(crater);
{ const r = rng(33); const d = new THREE.Mesh(new THREE.CircleGeometry(3.2, 40), new THREE.MeshBasicMaterial({ color: 0x0b0a10 })); d.rotation.x = -Math.PI / 2; d.position.y = .06; crater.add(d);
  const rm = new THREE.MeshStandardMaterial({ color: 0x5c4436, roughness: 1, flatShading: true });
  for (let i = 0; i < 110; i++) { const a = r() * 7, rr = 2.4 + r() * 2.4; const m = new THREE.Mesh(new THREE.IcosahedronGeometry(.1 + r() * .2, 0), rm); m.position.set(Math.cos(a) * rr, .1 + r() * .25, Math.sin(a) * rr); m.rotation.set(r() * 3, r() * 3, r() * 3); crater.add(m); } }
const fireL = new THREE.PointLight(0xff8a2a, 0, 60, 1.6); fireL.position.set(0, 3, 0); T.add(fireL);
const fires = []; { const r = rng(44); for (let i = 0; i < 22; i++) { const m = new THREE.SpriteMaterial({ map: glowTex, color: new THREE.Color().setHSL(.07 + r() * .07, 1, .55), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }); const s = new THREE.Sprite(m); s.userData = { x: (r() - .5) * 2.4, y: .4 + r() * 1.6, z: (r() - .5) * 2.4, s: 1.4 + r() * 1.6, ph: r() * 9, vx: r() - .5, vy: r(), vz: r() - .5 }; T.add(s); fires.push(s); } }
const smokes = []; { const r = rng(55); for (let i = 0; i < 22; i++) { const m = new THREE.SpriteMaterial({ map: cloudTex, color: 0x8e909c, transparent: true, depthWrite: false, opacity: .5 }); const s = new THREE.Sprite(m); s.userData = { ph: i / 22, dx: (r() - .5) * 2, sc: .8 + r() * .5 }; T.add(s); smokes.push(s); } }
function makeCar() { const g = new THREE.Group(); const wM = new THREE.MeshStandardMaterial({ color: 0xeceef4, roughness: .4 });
  const b = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.1, 2), wM); b.position.y = .85; g.add(b);
  const c = new THREE.Mesh(new THREE.BoxGeometry(2.2, .8, 1.8), wM); c.position.set(-.2, 1.8, 0); g.add(c);
  const st = new THREE.Mesh(new THREE.BoxGeometry(4.25, .22, 2.05), new THREE.MeshStandardMaterial({ color: 0xd82a2a })); st.position.y = .75; g.add(st);
  const red = new THREE.Mesh(new THREE.BoxGeometry(.5, .25, .8), new THREE.MeshBasicMaterial({ color: 0xff2a2a })); red.position.set(-.2, 2.33, -.45); g.add(red);
  const blue = new THREE.Mesh(new THREE.BoxGeometry(.5, .25, .8), new THREE.MeshBasicMaterial({ color: 0x2a5aff })); blue.position.set(-.2, 2.33, .45); g.add(blue);
  const lr = new THREE.PointLight(0xff1a1a, 0, 18, 1.3); lr.position.set(0, 2.6, -1.5); g.add(lr);
  const lb = new THREE.PointLight(0x2050ff, 0, 18, 1.3); lb.position.set(0, 2.6, 1.5); g.add(lb);
  const gr = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xff2020, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); gr.position.set(-.2, 2.5, -.45); gr.scale.set(3, 3, 1); g.add(gr);
  const gb = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x3060ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); gb.position.set(-.2, 2.5, .45); gb.scale.set(3, 3, 1); g.add(gb);
  g.userData = { lr, lb, gr, gb, red, blue }; T.add(g); return g; }
const cars = [makeCar(), makeCar(), makeCar()];
cars[0].position.set(-8, 0, 2.3); cars[0].rotation.y = .25; cars[1].position.set(7, 0, -2.4); cars[1].rotation.y = -.35; cars[2].position.set(9.5, 0, 2.5); cars[2].rotation.y = .1;
const holoJet = makeJet({ holo: true }); holoJet.scale.setScalar(1.1); T.add(holoJet);
const diveJet = makeJet(); T.add(diveJet);
// debris
const NDEB = 700; const debGeo = new THREE.TetrahedronGeometry(.3); const debMat = new THREE.MeshStandardMaterial({ roughness: .5, flatShading: true, emissive: 0x222222 });
const deb = new THREE.InstancedMesh(debGeo, debMat, NDEB); T.add(deb);
const debD = []; { const r = rng(66); const cols = [0xffffff, 0xf0f0f0, 0xd8dbe2, 0xe03030, 0xffb060, 0xc0c4cc]; for (let i = 0; i < NDEB; i++) { const a = r() * 7, el = .15 + r() * 1.2, sp = 6 + r() * 26; debD.push({ v: V(Math.cos(a) * Math.cos(el) * sp, Math.sin(el) * sp, Math.sin(a) * Math.cos(el) * sp), w: V(r() * 9, r() * 9, r() * 9), s: .4 + r() * 1.4, t0: 28.0 + r() * .15 }); deb.setColorAt(i, new THREE.Color(cols[(r() * cols.length) | 0])); } }
// ground sparkles
const spk = (() => { const r = rng(77); const n = 2200; const pos = new Float32Array(n * 3), col = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const a = r() * 7, rr = Math.pow(r(), .7) * 13; pos.set([Math.cos(a) * rr * 1.2, .15 + r() * .2, Math.sin(a) * rr], i * 3); const c = new THREE.Color(r() < .2 ? 0xff4040 : (r() < .5 ? 0xffffff : 0xb8c0ff)); col.set([c.r, c.g, c.b], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ size: .32, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); T.add(p); return p; })();
// perimeter (yellow tape)
const peri = []; { const m = new THREE.MeshBasicMaterial({ color: 0xf5e04a }); const hx = 10, hz = 8; const edges = [[-hx, -hz, hx, -hz], [hx, -hz, hx, hz], [hx, hz, -hx, hz], [-hx, hz, -hx, -hz]];
  for (const e of edges) { const L = Math.hypot(e[2] - e[0], e[3] - e[1]); const b = new THREE.Mesh(new THREE.BoxGeometry(1, .2, .3), m); b.userData = { e, L }; T.add(b); peri.push(b); } }
const camT = persp();
const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpE = new THREE.Euler();
function uT(t) {
  // camera
  let cp, lk, up = V(0, 1, 0), shake = 0;
  const seg = (a, b, A, B, LA, LB) => { const k = eIO((t - a) / (b - a)); cp = vlerp(A, B, k); lk = vlerp(LA, LB, k); };
  if (t < 23.9) seg(21.8, 23.9, V(15, 19, 11), V(11, 14.5, 8.5), V(0, 0, 0), V(-.5, .5, 0));
  else if (t < 25) seg(23.9, 25, V(14, 9, 7), V(12.5, 8.4, 6.5), V(-3, 1, 0), V(-3, 1, 0));
  else if (t < 26) seg(25, 26, V(14, 9, 7.5), V(13, 8.6, 7), V(-2, 3, 0), V(-2, 3, 0));
  else if (t < 28) seg(26, 28, V(18, 9, 7), V(17, 8.5, 6.5), V(-3, 8, -1), V(-1, 2.5, 0));
  else if (t < 30.5) { seg(28, 30.5, V(18, 11, 8), V(15, 9, 7), V(0, 2, 0), V(0, 2, 0)); shake = .5 * Math.exp(-(t - 28) * 1.6); }
  else if (t < 33) { seg(30.5, 33, V(6.5, 6.5, 5), V(4.5, 5, 4), V(0, 1, 0), V(0, 1, 0)); shake = .08; }
  else { seg(33, 36.6, V(.01, 44, 0), V(.01, 38, 0), V(0, 0, 0), V(0, 0, 0)); up = V(Math.cos(-2.2), 0, Math.sin(-2.2)); }
  cp.x += Math.sin(t * 47) * shake; cp.y += Math.sin(t * 39) * shake; camT.position.copy(cp); camT.up.copy(up); camT.lookAt(lk);
  // fire
  let fireLvl = 0, fireScale = 1;
  if (t < 26) fireLvl = 1; else if (t < 28) fireLvl = 0; else if (t < 30.5) { fireLvl = 1; fireScale = 1 + 3 * Math.exp(-(t - 28) * 1.2) + (t - 28) * .3; } else if (t < 33) { fireLvl = 1; fireScale = 2.2; } else fireLvl = 0;
  fires.forEach((s, i) => { const u = s.userData; const f = .75 + .35 * Math.sin(t * 14 + u.ph) * Math.sin(t * 9.3 + u.ph * 2);
    let x = u.x, y = u.y, z = u.z; if (t >= 28 && t < 33) { const e = Math.min(t - 28, 2.5); x += u.vx * e * 3; y += u.vy * e * 2.5; z += u.vz * e * 3; }
    s.position.set(x, y, z); s.scale.setScalar(u.s * f * fireScale); s.material.opacity = fireLvl * (t >= 30.5 && t < 33 ? .85 : 1); s.visible = fireLvl > 0; });
  const boom = t >= 28 && t < 31 ? 4 * Math.exp(-(t - 28) * 2.5) : 0;
  fireL.intensity = fireLvl * (90 + 30 * Math.sin(t * 17)) * (1 + boom * 6);
  smokes.forEach((s, i) => { const u = s.userData; const p = (t * .12 + u.ph) % 1; s.position.set(u.dx + p * 4, 1 + p * 13, -p * 2); s.scale.set((3 + p * 9) * u.sc * 1.5, (3 + p * 9) * u.sc, 1); s.material.opacity = (t < 26 ? .55 : (t >= 33 ? .35 : (t >= 28 ? .5 : 0))) * (1 - p) * Math.min(1, p * 6); s.visible = s.material.opacity > 0; });
  // cars
  cars.forEach((c, i) => { const vis = t > 23.8 && !(t >= 30.5 && t < 33); c.visible = vis; const ph = Math.sin(t * 12 + i * 2) > 0; const u = c.userData;
    u.lr.intensity = ph ? 120 : 10; u.lb.intensity = ph ? 10 : 120; u.gr.material.opacity = ph ? 1 : .2; u.gb.material.opacity = ph ? .2 : 1; });
  // holo
  holoJet.visible = t >= 25 && t < 26; holoJet.position.set(-3, 4.6 + Math.sin(t * 3) * .1, 1); setRot(holoJet, -.6 + (t - 25) * .15, -.15, -.15);
  // dive jet
  diveJet.visible = t >= 26 && t < 28.02;
  if (diveJet.visible) { const k = eIn((t - 26) / 2) * .85 + (t - 26) / 2 * .15; const A = V(-12, 18, -3), B = V(0, .5, 0); diveJet.position.copy(vlerp(A, B, k));
    const dir = B.clone().sub(A).normalize(); tmpQ.setFromUnitVectors(V(1, 0, 0), dir); diveJet.quaternion.copy(tmpQ); diveJet.rotateX((t - 26) * 1.2 + .6); diveJet.scale.setScalar(.75); }
  // debris
  const dv = t >= 28; deb.visible = dv;
  if (dv) { for (let i = 0; i < NDEB; i++) { const d = debD[i]; const e = Math.max(0, t - d.t0); let s = d.s;
      let x = d.v.x * e * .55, y = 1 + d.v.y * e * .55 - 9.8 * e * e * .5 * .55, z = d.v.z * e * .55;
      if (t >= 30.5 && t < 33) { const e2 = t - 30.5; x = d.v.x * (.25 + e2 * .35); y = 1.5 + d.v.y * (.2 + e2 * .3); z = d.v.z * (.25 + e2 * .35); s *= .55; }
      if (t >= 33) { s *= .0; }
      if (y < .15) y = .15;
      tmpE.set(d.w.x * e, d.w.y * e, d.w.z * e); tmpQ.setFromEuler(tmpE); tmpM.compose(V(x, y, z), tmpQ, V(s, s, s)); deb.setMatrixAt(i, tmpM); }
    deb.instanceMatrix.needsUpdate = true; if (deb.instanceColor) deb.instanceColor.needsUpdate = true; }
  spk.visible = t >= 33; spk.material.opacity = .9;
  // perimeter
  peri.forEach((b, i) => { const k = clamp((t - 33.2) * 3.2 - i); b.visible = t >= 33 && k > 0; if (!b.visible) return; const [x0, z0, x1, z1] = b.userData.e; const L = b.userData.L * k; b.scale.x = L; b.position.set(x0 + (x1 - x0) / b.userData.L * L / 2, .3, z0 + (z1 - z0) / b.userData.L * L / 2); b.rotation.y = -Math.atan2(z1 - z0, x1 - x0); });
  crater.visible = true;
  hemiT.intensity = t >= 33 ? 1.2 : 1.5;
  return [T, camT];
}

// ================= RENDER =================
function overlay(t, cam) {
  // S1
  pop(E.floride, t, .9, 3.2);
  { const op = pop(E.jet, t, 1.25, 3.2); const a = cam && t < 3.2 ? proj(jet1.localToWorld(V(.3, .8, 0)), cam) : [0, 0]; E.jetL.set([a, [a[0] + 40, 560], [690, 560]], op, (t - 1.15) / .3); }
  // S2
  pop(E.tombe, t, 3.3, 5.3, { dur: .45, from: .3 });
  pop(E.min, t, 4.25, 5.3); E.min.querySelector('#minNeedle').setAttribute('transform', `rotate(${(t - 4.25) * 360} 48 52)`);
  // S3
  pop(E.date, t, 5.4, 7.7);
  { const op = pop(E.lear, t, 6.7, 9.3); const a = (t >= 5.3 && t < 9.3) ? proj(jet3.localToWorld(V(-.5, -.6, 0)), cam) : [0, 0]; E.learL.set([a, [a[0], 1040], [640, 1040]], op, (t - 6.6) / .35); }
  // route
  pop(E.route, t, 8.3, 12.0); { const p = lerp(.04, .64, eIO((t - 8.4) / 3.2)); rArc.setAttribute('stroke-dashoffset', rLen * (1 - p)); const q = 1 - p, x = q * q * 70 + 2 * q * p * 420 + p * p * 790, y = q * q * 130 + 2 * q * p * 10 + p * p * 120; const dx = 2 * q * (420 - 70) + 2 * p * (790 - 420), dy = 2 * q * (10 - 130) + 2 * p * (120 - 10); rPlane.setAttribute('transform', `translate(${x},${y}) rotate(${Math.atan2(dy, dx) * 180 / Math.PI})`); }
  pop(E.bord, t, 10.0, 12.0, { dur: .45, from: .3 }); pop(E.bordSub, t, 10.25, 12.0);
  // S6
  pop(E.pilot, t, 12.15, 14.0); pop(E.quote, t, 12.3, 14.0);
  // S7
  const inCock = t >= 14 && t < 17.8; E.panel.style.display = inCock ? '' : 'none';
  if (inCock) { E.panel.style.opacity = 1; const m = ss(16.0, 16.6, t);
    const roll = lerp(Math.sin(t * 1.3) * 3, -48 + Math.sin(t * 7) * 6, m), pitch = lerp(0, -55, m);
    P('att').setAttribute('transform', `rotate(${roll} ${G[1]} ${GY}) translate(0 ${-pitch})`);
    P('asN').setAttribute('transform', `rotate(${lerp(40, 40 + (t - 16) * 160, m)} ${G[0]} ${GY})`);
    const alt = t < 16 ? 27000 : Math.max(9000, 27000 - (t - 16) * 9000);
    P('alN1').setAttribute('transform', `rotate(${alt / 10000 * 36} ${G[2]} ${GY})`); P('alN2').setAttribute('transform', `rotate(${alt / 1000 * 36} ${G[2]} ${GY})`); P('altTxt').textContent = Math.round(alt);
    const fl = m > 0 && Math.sin(t * 18) > 0; P('lampL').setAttribute('fill', m > 0 ? (fl ? '#ff2a14' : '#7a2010') : '#b8613c'); P('lampR').setAttribute('fill', m > 0 ? (fl ? '#7a2010' : '#ff2a14') : '#b8613c');
    E.panel.querySelectorAll('.ydash').forEach((d, i) => d.setAttribute('fill', m > 0 && ((i + Math.floor(t * 10)) % 2) ? '#ff4a2a' : '#f4c21a'));
    const sh = m * 7; E.panel.style.transform = `translate(-50%,-50%) translate(${Math.sin(t * 50) * sh}px,${Math.sin(t * 43) * sh}px) rotate(${m * Math.sin(t * 9) * 1.2}deg)`;
  }
  pop(E.atc, t, 14.2, 15.95); atcBars.childNodes.forEach((r, i) => { const h = 6 + 40 * Math.abs(Math.sin(i * .7 + t * 11) * Math.sin(i * .23 + t * 5)) * (i > 10 && i < 54 ? 1 : .3); r.setAttribute('height', h); r.setAttribute('y', 30 - h / 2); });
  pop(E.mayday, t, 16.0, 17.8, { dur: .4, from: .3, extra: `translate(${Math.sin(t * 60) * 5}px,${Math.sin(t * 47) * 4}px)` });
  { const op = pop(E.alarm, t, 16.15, 17.8); E.alarmL.set([[440, 860], [520, 760]], op, (t - 16.1) / .25); }
  { const op = pop(E.desc, t, 16.5, 17.8); const v = Math.round(TX.descent[0] * eOut((t - 16.5) / 1.0) / 10) * 10; E.desc.querySelector('b').textContent = `${v < 0 ? '−' : ''}${Math.abs(v).toLocaleString('fr-FR').replace(/ | /g, ' ')} ${TX.descent[1]}`; E.descL.set([[G[0] + 40, GY + 20], [G[0] + 40, 1340], [470, 1340]], op, (t - 16.4) / .3); }
  { const v = (t >= 14 && t < 17.8) ? ss(15.95, 16.15, t) * (.55 + .45 * Math.sin(t * 18)) : 0; redVig.style.display = v > 0 ? '' : 'none'; redVig.style.opacity = v; }
  // S8
  { const op = pop(E.alt, t, 17.9, 21.3); if (op) { const k = clamp((t - 17.95) / 3.05); const v = Math.round(lerp(TX.altitude[0], TX.altitude[1], 1 - Math.pow(1 - k, 1.6))); E.altV.textContent = v.toLocaleString('fr-FR').replace(/ | /g, ' '); E.altV.style.color = v < 5000 ? '#ff3b1f' : '#fff'; E.altV.style.textShadow = v < 5000 ? '0 0 20px rgba(255,50,20,.8)' : 'none'; } }
  { const op = pop(E.chute, t, 19.9, 21.3); const a = (t >= 17.8 && t < 21.3) ? proj(jet8.localToWorld(V(0, -.6, 0)), cam) : [0, 0]; E.chuteL.set([a, [a[0], 1270], [560, 1270]], op, (t - 19.8) / .35); }
  { const f = t >= 21.3 && t < 21.95 ? (t < 21.6 ? ss(21.3, 21.36, t) : 1 - ss(21.6, 21.95, t)) : 0; flash.style.display = f > 0 ? '' : 'none'; flash.style.opacity = f; }
  // town
  const town = t >= 21.8;
  { const op = pop(E.palm, t, 22.5, 23.9); const a = town ? proj(V(0, 1, 0), cam) : [0, 0]; E.palmL.set([a, [a[0], 600], [600, 600]], op, (t - 22.4) / .35); }
  { const op = pop(E.secours, t, 24.2, 25.0); const a = town ? proj(cars[0].localToWorld(V(0, 1.5, 0)), cam) : [0, 0]; E.secL.set([a, [a[0] + 80, 1560], [450, 1560]], op, (t - 24.1) / .3); }
  { const op = pop(E.holo, t, 25.15, 26.0); const a = town ? proj(holoJet.localToWorld(V(0, 0, 0)), cam) : [0, 0]; E.holoL.set([a, [a[0] + 120, 300], [520, 300]], op, (t - 25.05) / .3); }
  pop(E.impact, t, 26.2, 28.0);
  pop(E.pulv, t, 28.25, 30.5, { dur: .4, from: .3, extra: `translate(${Math.sin(t * 60) * 6 * Math.exp(-(t - 28.25) * 2)}px,0)` });
  { const op = pop(E.ring, t, 30.6, 33.0, { scale: lerp(.35, .8, eOut((t - 30.6) / 2)) }); if (op && cam) { const a = proj(V(0, 1.2, 0), cam); E.ring.style.left = a[0] + 'px'; E.ring.style.top = a[1] + 'px'; } }
  { const op = pop(E.debris, t, 31.1, 33.0); const a = town ? proj(V(1.2, 2.4, -1), cam) : [0, 0]; E.debL.set([a, [a[0] + 60, 560], [560, 560]], op, (t - 31) / .3); }
  pop(E.morts, t, 33.1, 34.95, { dur: .45, from: .3 });
  pop(E.pourquoi, t, 35.0, 36.7, { dur: .45, from: .3 });
  pop(E.ntsb, t, 34.2, 36.7);
  pop(E.mag, t, 34.3, 36.7, { x: 470 + Math.sin(t * 2.2) * 50, y: 600 + Math.cos(t * 1.7) * 40 });
  { const op = pop(E.peri, t, 34.45, 36.7); E.periL.set([[640, 1180], [700, 1180]], op, (t - 34.4) / .3); }
  E.tombs.forEach((el, i) => pop(el, t, 33.3 + i * .09, 36.7, { dur: .3 }));
}

window.renderAt = (t) => {
  let r;
  if (t < 3.2) r = u1(t); else if (t < 5.3) r = u2(t); else if (t < 9.3) r = u3(t); else if (t < 14) r = u5(t);
  else if (t < 17.8) r = u7(t); else if (t < 21.3) r = u8(t); else if (t < 21.8) r = u8(21.29); else r = uT(t);
  renderer.render(r[0], r[1]);
  overlay(t, r[1]);
};
await document.fonts.load('900 40px Mont'); await document.fonts.load('800 40px Mont'); await document.fonts.load('800 40px Mono'); await document.fonts.load('700 40px Mono'); await document.fonts.load('700 40px Mont');
await document.fonts.ready;
window.ready = true;
