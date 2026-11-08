// Habillage 2D (DA « infographie ») : pastilles, étiquettes fléchées, gros titres, compteurs.
import { W, H, clamp, lerp, backOut, eOut, rng } from './lib.js';

const ov = document.getElementById('ov');
export function mk(html, x, y, cls = '', style = '') { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; d.style.cssText = `left:${x}px;top:${y}px;transform:translate(-50%,-50%);display:none;${style}`; ov.appendChild(d); return d; }
export function pop(el, t, t0, t1, o = {}) {
  const fade = o.fade ?? .22, dur = o.dur ?? .4;
  if (t < t0 || t > t1) { el.style.display = 'none'; return 0; }
  el.style.display = '';
  const a = clamp((t - t0) / dur), op = Math.min(clamp((t - t0) / (dur * .45)), 1 - clamp((t - (t1 - fade)) / fade));
  const s = lerp(o.from ?? .55, 1, backOut(a)) * (o.scale ?? 1);
  if (o.x !== undefined) el.style.left = o.x + 'px';
  if (o.y !== undefined) el.style.top = o.y + 'px';
  el.style.opacity = op; el.style.transform = `translate(-50%,-50%) scale(${s}) ${o.extra || ''}`;
  if (o.glitch) glitchEl(el, t, t0, o.glitch);
  return op;
}
// glitch : décalages horizontaux RVB pendant l'apparition
function glitchEl(el, t, t0, amt) {
  const k = Math.max(0, 1 - (t - t0) / .45) * amt + (Math.sin(t * 9.1) > .93 ? .5 * amt : 0);
  if (k <= .01) { el.style.filter = ''; el.style.clipPath = ''; return; }
  const f = Math.floor(t * 30), r = rng(f * 7 + 3); const dx = (r() - .5) * 26 * k;
  el.style.filter = `drop-shadow(${dx}px 0 0 rgba(0,255,255,.7)) drop-shadow(${-dx}px 0 0 rgba(255,0,60,.7))`;
  const y0 = r() * 80, y1 = y0 + 8 + r() * 25; el.style.clipPath = r() < .5 ? `polygon(0 0,100% 0,100% ${y0}%,0 ${y0}%,0 ${y1}%,100% ${y1}%,100% 100%,0 100%)` : '';
}
export const pill = (txt, c, x, y) => mk(`<div class="dot" style="--c:${c}"></div>${txt}`, x, y, 'pill');
export const callout = (a, b, c, x, y, hot = false) => mk(`<b>${a}</b>${b ? `<small>${b}</small>` : ''}`, x, y, 'co' + (hot ? ' hot' : ''), `--c:${c}`);
export const title = (txt, cls, x, y, size = 128) => mk(txt, x, y, 'title ' + cls, `font-size:${size}px`);

const svgNS = 'http://www.w3.org/2000/svg';
const lineSvg = document.createElementNS(svgNS, 'svg'); lineSvg.setAttribute('width', W); lineSvg.setAttribute('height', H); lineSvg.style.cssText = 'left:0;top:0;overflow:visible'; ov.appendChild(lineSvg);
export function mkLine(color, w = 4) {
  const g = document.createElementNS(svgNS, 'g');
  const p = document.createElementNS(svgNS, 'polyline'); p.setAttribute('fill', 'none'); p.setAttribute('stroke', color); p.setAttribute('stroke-width', w); p.setAttribute('stroke-linejoin', 'round'); p.style.filter = `drop-shadow(0 0 6px ${color})`;
  const c = document.createElementNS(svgNS, 'circle'); c.setAttribute('r', 9); c.setAttribute('fill', color); c.setAttribute('stroke', '#fff'); c.setAttribute('stroke-width', 3);
  g.appendChild(p); g.appendChild(c); lineSvg.appendChild(g);
  return { set(pts, op, prog = 1) {
    if (op <= 0 || !pts) { g.style.display = 'none'; return; } g.style.display = '';
    g.style.opacity = op; p.setAttribute('points', pts.map(q => q.join(',')).join(' '));
    let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    p.setAttribute('stroke-dasharray', `${L} ${L}`); p.setAttribute('stroke-dashoffset', L * (1 - clamp(prog)));
    c.setAttribute('cx', pts[0][0]); c.setAttribute('cy', pts[0][1]);
  } };
}
// étiquette + trait vers un point 3D projeté
export function anchored(label, line, t, t0, t1, anchor, box, o = {}) {
  const op = pop(label, t, t0, t1, { x: box[0], y: box[1], ...o });
  if (!op || !anchor) { line.set(null, 0); return op; }
  const bx = box[0] + (anchor[0] < box[0] ? -1 : 1) * (label.offsetWidth / 2) * (anchor[0] < box[0] ? 1 : 1);
  const edgeX = anchor[0] < box[0] ? box[0] - label.offsetWidth / 2 : box[0] + label.offsetWidth / 2;
  const pts = o.direct ? [anchor, [edgeX, box[1]]] : [anchor, [anchor[0], box[1]], [edgeX, box[1]]];
  line.set(pts, op, (t - t0 + .1) / .35);
  return op;
}

// plein écran : flash, fondu au noir, bandes VHS
export const flash = mk('', W / 2, H / 2, '', `width:${W}px;height:${H}px;background:#fff`);
export const black = mk('', W / 2, H / 2, '', `width:${W}px;height:${H}px;background:#000`);
export const redFlash = mk('', W / 2, H / 2, '', `width:${W}px;height:${H}px;background:radial-gradient(ellipse at center,rgba(255,20,10,.15) 30%,rgba(200,0,0,.75) 100%)`);
export const vhs = mk(`<svg width="${W}" height="${H}"><g id="vb"></g></svg>`, W / 2, H / 2);
const vb = vhs.querySelector('#vb');
for (let i = 0; i < 14; i++) { const r = document.createElementNS(svgNS, 'rect'); r.setAttribute('x', 0); r.setAttribute('width', W); vb.appendChild(r); }
export function setFull(el, op) { el.style.display = op > 0.001 ? '' : 'none'; el.style.opacity = op; el.style.transform = 'translate(-50%,-50%)'; }
export function vhsBands(t, amt) {
  setFull(vhs, amt > 0 ? 1 : 0); if (amt <= 0) return;
  const f = Math.floor(t * 30); const r = rng(f * 13 + 1);
  vb.childNodes.forEach((n, i) => { const h = 4 + r() * 60 * amt; n.setAttribute('y', (r() * H + t * 900 * (i % 3 + 1)) % H); n.setAttribute('height', h); n.setAttribute('fill', i % 3 === 0 ? `rgba(255,255,255,${.25 * amt})` : i % 3 === 1 ? `rgba(0,0,0,${.5 * amt})` : `rgba(120,200,255,${.12 * amt})`); });
}

// compteur de victimes (haut droite)
export const counter = mk(`<div style="font-family:Mono;font-weight:800;font-size:17px;letter-spacing:4px;color:#ffb3a6">VICTIMES</div><div class="n" style="font-family:Mont;font-weight:900;font-size:64px;line-height:1;color:#fff;text-shadow:0 0 18px rgba(255,40,20,.8)">0</div><div class="sub" style="font-family:Mono;font-weight:700;font-size:17px;letter-spacing:2px;color:#ffd0c0;max-width:250px;white-space:normal;text-align:center"></div>`,
  930, 330, 'pill', 'flex-direction:column;gap:4px;padding:12px 18px;border-color:rgba(255,80,60,.75);background:linear-gradient(rgba(110,22,16,.9),rgba(40,8,6,.94))');
const cN = counter.querySelector('.n'), cSub = counter.querySelector('.sub');
export function setCounter(t, t0, t1, value, bumpT, sub) {
  const op = pop(counter, t, t0, t1, { dur: .3 }); if (!op) return;
  cN.textContent = value; cSub.textContent = sub || ''; cSub.style.display = sub ? '' : 'none';
  const b = bumpT !== undefined ? Math.max(0, 1 - (t - bumpT) / .35) * (t >= bumpT ? 1 : 0) : 0;
  cN.style.transform = `scale(${1 + b * .45})`; cN.style.color = b > .05 ? '#ff5a3a' : '#fff';
}
// rouleau d'années
export const years = mk(`<div class="y" style="font-family:Mont;font-weight:900;font-size:190px;color:#fff;line-height:1;text-shadow:0 0 40px rgba(255,255,255,.35),0 8px 0 #6d727c"></div><div class="s" style="font-family:Mono;font-weight:800;font-size:26px;letter-spacing:6px;color:#d6d9e0;margin-top:14px;text-align:center"></div>`, W / 2, H / 2 - 80, '', 'text-align:center');
const yY = years.querySelector('.y'), yS = years.querySelector('.s');
export function setYears(t, t0, t1, a, b, sub = '', ease = eOut) {
  const op = pop(years, t, t0, t1, { dur: .25, from: .85 }); if (!op) return;
  const k = ease(clamp((t - t0 - .1) / (t1 - t0 - .5))); yY.textContent = Math.round(lerp(a, b, k)); yS.textContent = sub;
}
// grand chrono
export const timer = mk(`<div class="v" style="font-family:Mono;font-weight:800;font-size:170px;color:#fff;letter-spacing:4px;text-shadow:0 0 30px rgba(255,60,40,.7)">30:00</div><div style="font-family:Mono;font-weight:800;font-size:28px;letter-spacing:8px;color:#ffb0a0;text-align:center">MINUTES</div>`, W / 2, 1420);
const tV = timer.querySelector('.v');
export function setTimer(t, t0, t1) { const op = pop(timer, t, t0, t1, { dur: .3 }); if (!op) return; const k = clamp((t - t0) / (t1 - t0 - .25)); const s = Math.round(1800 * (1 - k)); tV.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; tV.style.color = k > .85 ? '#ff3b22' : '#fff'; }
// carte citation
export function quote(text, sub, x, y) { return mk(`<div style="font-family:Mont;font-weight:800;font-size:40px;color:#fff;white-space:nowrap">${text}</div><div style="font-family:Mono;font-weight:700;font-size:18px;letter-spacing:3px;color:#c9ccd6;margin-top:6px">${sub}</div>`, x, y, 'pill', 'flex-direction:column;align-items:flex-start;gap:0;padding:20px 30px'); }
// liste d'inventaire (s'empile)
export function inventory(items, x, y) {
  return items.map((it, i) => mk(`<span style="color:#ff6a50;font-size:26px">■</span><span>${it[0]}</span><span style="margin-left:auto;color:#ff9a84">${it[1]}</span>`, x, y + i * 92, 'pill', 'font-size:26px;width:640px;gap:18px;padding:14px 26px;border-color:rgba(255,90,70,.6)'));
}
// carton d'avertissement
export const warn = mk(`<svg width="190" height="170" viewBox="0 0 190 170"><path d="M95 8 L182 160 H8 Z" fill="none" stroke="#ff2a1a" stroke-width="12" stroke-linejoin="round"/><rect x="88" y="58" width="14" height="58" rx="6" fill="#ff2a1a"/><circle cx="95" cy="136" r="9" fill="#ff2a1a"/></svg>
 <div class="title red" style="font-size:118px;margin-top:40px">ÂME SENSIBLE</div><div class="title white" style="font-size:96px;margin-top:22px">S'ABSTENIR</div>`, W / 2, 900, '', 'text-align:center;display:flex;flex-direction:column;align-items:center');
// mémorial : noms
export function names(list, x0, y0) { return list.map((n, i) => mk(n, x0, y0, '', 'font-family:Mono;font-weight:700;font-size:21px;letter-spacing:2px;color:#e9edf2;white-space:nowrap;text-shadow:0 0 12px rgba(200,220,255,.6)')); }
