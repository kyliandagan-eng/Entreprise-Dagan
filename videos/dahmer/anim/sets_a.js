// Décors : rue de Milwaukee (nuit), couloir de l'appartement 213, appartement 213.
import * as THREE from 'three';
import { TEX, std, basic, mesh, rbox, glow, beam, dust, makeHuman, makeCar, makeStreetLight, makeBuilding, makeTree, makeSkull, makeSuitcase, makeGlass, makePolaroid, makeDrum, labelTex, rng, lerp, V, mergeStatic } from './lib.js';

function persp(fov = 42) { return new THREE.PerspectiveCamera(fov, 1080 / 1920, .05, 600); }
function plane(w, h, mat, rotX = -Math.PI / 2) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.rotation.x = rotX; m.receiveShadow = true; return m; }
function signTex(text, bg = '#0d5a2a', fg = '#fff', w = 512, h = 128, font = '800 78px Mont') { return labelTex(w, h, (c) => { c.fillStyle = bg; c.fillRect(0, 0, w, h); c.strokeStyle = fg; c.lineWidth = 8; c.strokeRect(8, 8, w - 16, h - 16); c.fillStyle = fg; c.font = font; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, w / 2, h / 2 + 4); }); }
export function addCuff(human) {
  const P = human.userData.P; const steel = std(0xd7dbe3, .18, 1);
  const c1 = mesh(new THREE.TorusGeometry(.065, .014, 10, 28), steel, 0, .02, 0, P.armR.end); c1.rotation.x = Math.PI / 2;
  const chain = new THREE.Group(); chain.position.set(0, -.02, 0); P.armR.end.add(chain);
  for (let i = 0; i < 4; i++) { const l = mesh(new THREE.TorusGeometry(.022, .007, 6, 12), steel, 0, -i * .035, 0, chain); l.rotation.y = i % 2 ? Math.PI / 2 : 0; }
  const c2 = mesh(new THREE.TorusGeometry(.065, .014, 10, 28, Math.PI * 1.6), steel, 0, -.2, 0, chain); c2.rotation.z = .5;
  const g = glow(0xffffff, .12, .5); g.position.set(.03, .03, .05); P.armR.end.add(g);
  human.userData.cuff = c1; human.userData.chain = chain; return c1;
}

// =====================================================================================
export function buildStreet() {
  const S = new THREE.Scene(); S.background = new THREE.Color(0x06070c); S.fog = new THREE.FogExp2(0x0a0c14, .03);
  const hemi = new THREE.HemisphereLight(0x33416e, 0x120c08, .5); S.add(hemi);
  const moon = new THREE.DirectionalLight(0x8094ff, .55); moon.position.set(-25, 40, 30); moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
  Object.assign(moon.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 1, far: 120 }); moon.shadow.bias = -.0006; S.add(moon, moon.target);
  const road = plane(420, 10, std(0x9a9aa2, .55, .05, { map: TEX.asphalt })); road.position.y = 0; S.add(road);
  TEX.asphalt.repeat.set(80, 2);
  for (const s of [-1, 1]) {
    const sw = mesh(new THREE.BoxGeometry(420, .16, 3), std(0xb0b0b6, .85, 0, { map: TEX.concrete }), 0, .08, s * 6.5, S); sw.receiveShadow = true;
    mesh(new THREE.BoxGeometry(420, .2, .25), std(0x77777c, .8), 0, .1, s * 5.05, S);
    const lawn = plane(420, 3, std(0x8aa08a, 1, 0, { map: TEX.grass })); lawn.position.set(0, .02, s * 9.4); S.add(lawn);
  }
  // flaques (reflets)
  const pr = rng(31); for (let i = 0; i < 18; i++) { const p = new THREE.Mesh(new THREE.CircleGeometry(.6 + pr() * 1.4, 24), std(0x05060a, .04, .2)); p.rotation.x = -Math.PI / 2; p.scale.set(1.6, 1, 1); p.position.set(-60 + pr() * 150, .012, (pr() - .5) * 8); p.receiveShadow = true; S.add(p); }
  // immeubles
  const blds = []; const r = rng(7);
  const oxford = makeBuilding(24, 10.6, 12, { seed: 11, floors: 3, cols: 9, door: 4, litRatio: .25, color: 0xe6c9b8 }); oxford.position.set(0, 0, -17); S.add(oxford);
  const aptWin = oxford.userData.windows.find(w => w.f === 1 && w.c === 6);
  aptWin.mesh.material = std(0x000000, .2, 0, { emissive: 0x2a5cff, emissiveIntensity: 1.3 });
  const aptGlow = glow(0x3a6bff, 2.2, .4); aptGlow.position.set(aptWin.x, aptWin.y, 6.4); oxford.add(aptGlow);
  const plate = mesh(new THREE.PlaneGeometry(3.4, .7), new THREE.MeshBasicMaterial({ map: signTex('OXFORD APARTMENTS', '#1a1410', '#d8c08a', 768, 128, '800 62px Mont') }), -0, 3.55, 6.06, oxford);
  for (let x = -80; x < 110; ) { const w = 10 + r() * 8; if (Math.abs(x + w / 2) < 14) { x = 14; continue; } const b = makeBuilding(w, 7 + r() * 5, 10, { seed: (x * 7) | 0, litRatio: .18, color: new THREE.Color().setHSL(.05, .2, .65 + r() * .25).getHex() }); b.position.set(x + w / 2, 0, -16); S.add(b); blds.push(b); x += w + 2 + r() * 3; }
  for (let x = -80; x < 110; ) { const w = 10 + r() * 8; const b = makeBuilding(w, 7 + r() * 5, 10, { seed: (x * 13) | 0, litRatio: .2, color: new THREE.Color().setHSL(.06, .2, .6 + r() * .25).getHex() }); b.position.set(x + w / 2, 0, 16); b.rotation.y = Math.PI; S.add(b); blds.push(b); x += w + 2 + r() * 3; }
  // lampadaires
  const lamps = [];
  for (let x = -70; x < 100; x += 19) { const l = makeStreetLight(0xffa040, true, 70, false); l.position.set(x, 0, -7.4); l.rotation.y = -Math.PI / 2; S.add(l); lamps.push(l); }
  for (let x = -60; x < 100; x += 19) { const l = makeStreetLight(0xffa040, true, 70, false); l.position.set(x, 0, 7.4); l.rotation.y = Math.PI / 2; S.add(l); lamps.push(l); }
  // voitures garées + arbres
  const parked = [];
  for (const [x, z, ry, k] of [[-40, -4.0, 0, 'sedan'], [-22, 4.0, Math.PI, 'wagon'], [8, -4.0, 0, 'sedan'], [26, 4.0, Math.PI, 'sedan'], [44, -4.0, 0, 'wagon'], [-58, 4.0, Math.PI, 'sedan']]) { const c = makeCar(k); c.position.set(x, 0, z); c.rotation.y = ry; c.scale.setScalar(.92); S.add(c); parked.push(c); }
  for (let x = -66; x < 100; x += 23) { const t = makeTree(x | 0); t.position.set(x + 5, 0, -9.6); S.add(t); const t2 = makeTree((x * 3) | 0); t2.position.set(x + 13, 0, 9.6); S.add(t2); }
  // panneaux de rue (coin 25th & State)
  const post = new THREE.Group(); post.position.set(-15, 0, 5.6); S.add(post);
  mesh(new THREE.CylinderGeometry(.05, .05, 3.6, 8), std(0x777a80, .4, .8), 0, 1.8, 0, post);
  const s1 = mesh(new THREE.BoxGeometry(1.7, .4, .04), new THREE.MeshStandardMaterial({ map: signTex('N 25TH ST'), roughness: .5, emissive: 0xffffff, emissiveMap: signTex('N 25TH ST'), emissiveIntensity: .15 }), 0, 3.4, 0, post);
  const s2 = mesh(new THREE.BoxGeometry(1.7, .4, .04), new THREE.MeshStandardMaterial({ map: signTex('W STATE ST'), roughness: .5, emissive: 0xffffff, emissiveMap: signTex('W STATE ST'), emissiveIntensity: .15 }), 0, 3.0, 0, post); s2.rotation.y = Math.PI / 2;
  // maison de la grand-mère (West Allis) plus loin dans la rue
  const gm = new THREE.Group(); gm.position.set(82, 0, 14); gm.rotation.y = Math.PI; S.add(gm);
  mesh(new THREE.BoxGeometry(9, 5.2, 8), std(0xd9d6cc, .9), 0, 2.6, 0, gm);
  const roof = mesh(new THREE.ConeGeometry(7, 2.8, 4), std(0x2a2422, .8), 0, 6.6, 0, gm); roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, .9);
  mesh(new THREE.BoxGeometry(9.4, .2, 2.4), std(0x6a645a, .9), 0, .1, 5.1, gm);
  for (const x of [-2.8, 2.8]) mesh(new THREE.BoxGeometry(1.2, 1.4, .1), std(0, .2, 0, { emissive: 0xffc070, emissiveIntensity: 1.1 }), x, 3.0, 4.03, gm);
  mesh(rbox(1.2, 2.2, .12, .03), std(0x3a2a20, .6), 0, 1.2, 4.04, gm); const pl = glow(0xffd090, 2, .9); pl.position.set(0, 2.7, 4.4); gm.add(pl);
  const porch = new THREE.PointLight(0xffc080, 18, 10, 1.5); porch.position.set(0, 2.6, 5); gm.add(porch);
  // personnages
  const runner = makeHuman({ color: 0x1a1b22 }); addCuff(runner); S.add(runner);
  const konerak = makeHuman({ color: 0x1d1c22, height: .86 }); S.add(konerak); konerak.visible = false;
  const dahmer = makeHuman({ color: 0x24252c, hair: 0x6a5536 }); S.add(dahmer); dahmer.visible = false;
  const cops = [makeHuman({ color: 0x0f1a33, cap: true }), makeHuman({ color: 0x0f1a33, cap: true })]; cops.forEach(c => { S.add(c); c.visible = false; });
  const driver = makeHuman({ color: 0x20232a }); S.add(driver); driver.visible = false;
  const police = makeCar('police'); S.add(police); police.visible = false;
  const taxi = makeCar('taxi'); S.add(taxi); taxi.visible = false;
  const suitcase = makeSuitcase(); suitcase.scale.setScalar(.8); S.add(suitcase); suitcase.visible = false;
  const motes = dust(500, [-60, 100, 0, 8, -8, 8], 0xffc890, .06, 3, .35); S.add(motes);
  const pool = []; for (let i = 0; i < 4; i++) { const L = new THREE.SpotLight(0xffa040, 70, 22, .85, .55, 1.5); S.add(L, L.target); pool.push(L); }
  const heads = lamps.map(l => { l.updateMatrixWorld(true); return l.localToWorld(l.userData.head.clone()); });
  const placeLights = (focus) => { const order = heads.map((h, i) => [h.distanceToSquared(focus), i]).sort((a, b) => a[0] - b[0]); pool.forEach((L, k) => { const h = heads[order[k][1]]; L.position.copy(h); L.target.position.set(h.x, 0, h.z); }); };
  [runner, konerak, dahmer, ...cops, driver, police, taxi, suitcase, motes].forEach(o => o.userData.dynamic = true);
  hemi.userData.dynamic = moon.userData.dynamic = true;
  window.__merged = (window.__merged || 0) + mergeStatic(S, o => o.userData.dynamic || o.isLight);
  const cam = persp(42);
  return { S, cam, hemi, moon, oxford, aptWin, placeLights, runner, konerak, dahmer, cops, driver, police, taxi, suitcase, gm, post, lamps, motes };
}

// =====================================================================================
export function buildCorridor() {
  const S = new THREE.Scene(); S.background = new THREE.Color(0x020203); S.fog = new THREE.FogExp2(0x0a0806, .07);
  S.add(new THREE.HemisphereLight(0x5a4a38, 0x0a0806, .25));
  const L = 18, Wd = 2.6, Ht = 2.7;
  const floor = plane(Wd, L, std(0xffffff, .95, 0, { map: TEX.carpet })); floor.position.z = -L / 2 + 4; S.add(floor);
  const ceil = plane(Wd, L, std(0x2a2620, .9), Math.PI / 2); ceil.position.set(0, Ht, -L / 2 + 4); S.add(ceil);
  const wp = TEX.wallpaper.clone(); wp.needsUpdate = true; wp.repeat.set(8, 1.3);
  for (const s of [-1, 1]) { const w = plane(L, Ht, std(0xffffff, .9, 0, { map: wp }), 0); w.rotation.y = -s * Math.PI / 2; w.position.set(s * Wd / 2, Ht / 2, -L / 2 + 4); S.add(w);
    const base = mesh(new THREE.BoxGeometry(.04, .14, L), std(0x2a1d14, .6), s * (Wd / 2 - .02), .07, -L / 2 + 4, S); }
  const endW = plane(Wd, Ht, std(0xffffff, .9, 0, { map: wp }), 0); endW.position.set(0, Ht / 2, -L + 4); S.add(endW);
  const doorM = std(0x3b2516, .45, .05);
  const plateTex = n => labelTex(128, 64, c => { c.fillStyle = '#b89a52'; c.fillRect(0, 0, 128, 64); c.fillStyle = '#1a1208'; c.font = '900 42px Mont'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(n, 64, 34); });
  [[-1, -2, '209'], [1, -4, '210'], [-1, -7, '211'], [1, -9.5, '212']].forEach(([s, z, n]) => { const d = mesh(rbox(.08, 2.1, 1.0, .02), doorM, s * (Wd / 2 - .04), 1.05, z, S); const p = mesh(new THREE.PlaneGeometry(.22, .11), new THREE.MeshBasicMaterial({ map: plateTex(n) }), s * (Wd / 2 - .09), 1.75, z, S); p.rotation.y = -s * Math.PI / 2; });
  // porte 213 au fond
  const door = new THREE.Group(); door.position.set(0, 0, -L + 4.02); S.add(door);
  mesh(new THREE.BoxGeometry(1.25, 2.25, .1), std(0x1d140d, .6), 0, 1.12, 0, door);
  const hinge = new THREE.Group(); hinge.position.set(-.5, 0, .06); door.add(hinge);
  const panel = mesh(rbox(1.0, 2.08, .06, .015), doorM, .5, 1.05, 0, hinge);
  for (const y of [.55, 1.45]) mesh(rbox(.72, .6, .02, .01), std(0x4a2f1c, .5), .5, y, .035, hinge);
  const np = mesh(new THREE.PlaneGeometry(.3, .15), new THREE.MeshBasicMaterial({ map: plateTex('213') }), .5, 1.72, .07, hinge);
  mesh(new THREE.SphereGeometry(.04, 12, 10), std(0xc8b070, .2, 1), .88, 1.02, .07, hinge);
  for (const y of [1.2, 1.32]) mesh(new THREE.CylinderGeometry(.03, .03, .04, 12), std(0xc8b070, .2, 1), .88, y, .06, hinge).rotation.x = Math.PI / 2;
  mesh(new THREE.CylinderGeometry(.015, .015, .03, 10), std(0x111, .2, 1), .5, 1.58, .07, hinge).rotation.x = Math.PI / 2;
  const under = mesh(new THREE.PlaneGeometry(1.0, .03), basic(0xff3010), 0, .015, .07, door);
  const red = new THREE.PointLight(0xff2a10, 0, 7, 1.5); red.position.set(0, 1.1, -.6); door.add(red);
  const redGlow = glow(0xff2a10, 2.2, 0); redGlow.position.set(0, 1.0, -.2); door.add(redGlow);
  const behind = mesh(new THREE.PlaneGeometry(1.2, 2.2), basic(0x2a0000), 0, 1.1, -.25, door);
  // néons au plafond
  const tubes = [];
  for (const z of [1.5, -5, -11]) { mesh(new THREE.BoxGeometry(.25, .06, 1.2), std(0xdddddd, .5), 0, Ht - .04, z, S); const e = mesh(new THREE.BoxGeometry(.18, .03, 1.1), std(0, .5, 0, { emissive: 0xd8ffe8, emissiveIntensity: 1.0 }), 0, Ht - .08, z, S); e.castShadow = false;
    const l = new THREE.PointLight(0xc8ffe0, 6, 9, 1.6); l.position.set(0, Ht - .3, z); S.add(l); tubes.push({ e, l }); }
  const motes = dust(260, [-1.2, 1.2, 0, 2.6, -14, 4], 0xfff2d0, .02, 5, .4); S.add(motes);
  const cops = [makeHuman({ color: 0x0f1a33, cap: true }), makeHuman({ color: 0x0f1a33, cap: true })]; cops.forEach(c => { S.add(c); c.visible = false; });
  const lights = cops.map(() => { const sl = new THREE.SpotLight(0xf2f6ff, 0, 14, .3, .5, 2); S.add(sl, sl.target); const b = beam(.03, .7, 7, 0xe8f0ff, .045); S.add(b); b.visible = false; return { sl, b }; });
  const konerak = makeHuman({ color: 0x1d1c22, height: .86 }); S.add(konerak); konerak.visible = false;
  const dahmer = makeHuman({ color: 0x24252c, hair: 0x6a5536 }); S.add(dahmer); dahmer.visible = false;
  return { S, cam: persp(44), door, hinge, red, redGlow, under, tubes, motes, cops, lights, konerak, dahmer, doorZ: -L + 4.02 };
}

// =====================================================================================
export function buildApartment() {
  const S = new THREE.Scene(); S.background = new THREE.Color(0x010102); S.fog = new THREE.FogExp2(0x05060a, .045);
  const hemi = new THREE.HemisphereLight(0x3a4058, 0x0a0806, .22); S.add(hemi);
  const room = (ox, w, d, h, floorMat, wallMat) => {
    const g = new THREE.Group(); g.position.x = ox; S.add(g);
    const f = plane(w, d, floorMat); g.add(f); const c = plane(w, d, std(0x1a1816, .9), Math.PI / 2); c.position.y = h; g.add(c);
    const back = plane(w, h, wallMat, 0); back.position.set(0, h / 2, -d / 2); g.add(back);
    const l = plane(d, h, wallMat, 0); l.rotation.y = Math.PI / 2; l.position.set(-w / 2, h / 2, 0); g.add(l);
    const r = plane(d, h, wallMat, 0); r.rotation.y = -Math.PI / 2; r.position.set(w / 2, h / 2, 0); g.add(r);
    return g;
  };
  const wp = TEX.wallpaper.clone(); wp.needsUpdate = true; wp.repeat.set(5, 1.6);
  const wallM = std(0x8d8a80, .9, 0, { map: wp });
  // ---------------- salon ----------------
  const LV = room(0, 8, 6.4, 2.7, std(0xffffff, .95, 0, { map: TEX.carpet }), wallM);
  const rug = plane(3.4, 2.3, std(0xffffff, .9, 0, { map: TEX.rug })); rug.position.set(0, .01, .2); LV.add(rug);
  // fenêtre masquée par un rideau noir
  const curtain = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.0, 60, 4), std(0x07070a, .55, 0, { side: THREE.DoubleSide }));
  { const p = curtain.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 9) * .05); curtain.geometry.computeVertexNormals(); }
  curtain.position.set(0, 1.45, -3.17); curtain.castShadow = true; LV.add(curtain);
  for (const x of [-1.22, 1.22]) { const leak = mesh(new THREE.PlaneGeometry(.025, 1.9), basic(0xff9a40), x, 1.45, -3.19, LV); leak.castShadow = false; }
  // table noire (le futur « autel »)
  const lac = std(0x050506, .12, .35);
  const table = new THREE.Group(); table.position.set(0, 0, -2.05); LV.add(table);
  mesh(rbox(2.0, .07, .75, .02), lac, 0, .74, 0, table); for (const [x, z] of [[-.9, -.3], [.9, -.3], [-.9, .3], [.9, .3]]) mesh(new THREE.BoxGeometry(.06, .72, .06), lac, x, .36, z, table);
  // lampe bleue à globes
  const lamp = new THREE.Group(); lamp.position.set(0, 2.68, -2.0); LV.add(lamp);
  mesh(new THREE.CylinderGeometry(.02, .02, .5), std(0x111, .4, .8), 0, -.25, 0, lamp);
  const blueLights = [];
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; const x = Math.cos(a) * .45, z = Math.sin(a) * .3; const arm = mesh(new THREE.CylinderGeometry(.012, .012, .5), std(0x111, .4, .8), x / 2, -.5, z / 2, lamp); arm.rotation.z = -Math.atan2(x, .2) * .9;
    const s = mesh(new THREE.SphereGeometry(.06, 18, 14), std(0, .3, 0, { emissive: 0x2f5bff, emissiveIntensity: 1.3 }), x, -.52, z, lamp); s.castShadow = false; }
  const blueL = new THREE.PointLight(0x2d55ff, 14, 7, 1.4); blueL.position.set(0, -.8, 0); lamp.add(blueL); blueLights.push(blueL);
  // fauteuil en cuir noir
  const leather = std(0x0b0a0a, .38, .05);
  const chair = new THREE.Group(); chair.position.set(0, 0, -.2); LV.add(chair);
  mesh(rbox(.9, .42, .85, .1), leather, 0, .32, 0, chair); mesh(rbox(.9, .75, .2, .08), leather, 0, .85, .38, chair); for (const x of [-.48, .48]) mesh(rbox(.16, .55, .85, .07), leather, x, .45, 0, chair);
  // canapé beige
  const fab = std(0xb3a385, .9);
  const couch = new THREE.Group(); couch.position.set(-3.45, 0, .2); couch.rotation.y = Math.PI / 2; LV.add(couch);
  mesh(rbox(2.4, .45, .95, .12), fab, 0, .3, 0, couch); mesh(rbox(2.4, .7, .25, .1), fab, 0, .75, -.38, couch); for (const x of [-1.2, 1.2]) mesh(rbox(.22, .62, .95, .09), fab, x, .45, 0, couch);
  for (const x of [-.6, .6]) mesh(rbox(1.1, .16, .8, .08), std(0xc2b394, .9), x, .58, .05, couch);
  // aquarium
  const aq = new THREE.Group(); aq.position.set(3.55, 0, -.9); aq.rotation.y = -Math.PI / 2; LV.add(aq);
  mesh(rbox(1.7, .75, .55, .03), std(0x0a0a0c, .5), 0, .375, 0, aq);
  const water = mesh(new THREE.BoxGeometry(1.6, .72, .45), std(0x0b4a5a, .1, 0, { emissive: 0x15c8d8, emissiveIntensity: .55, transparent: true, opacity: .55 }), 0, 1.13, 0, aq); water.castShadow = false;
  const glassM = new THREE.MeshPhysicalMaterial({ color: 0xbfefff, roughness: .02, transparent: true, opacity: .16, depthWrite: false });
  mesh(new THREE.BoxGeometry(1.64, .8, .5), glassM, 0, 1.15, 0, aq).castShadow = false;
  mesh(new THREE.BoxGeometry(1.6, .06, .45), std(0xa08a6a, .9), 0, .8, 0, aq);
  const fish = []; const fr = rng(22);
  for (let i = 0; i < 7; i++) { const f = new THREE.Group(); const c = [0xff8a20, 0xffd23a, 0xff5050, 0x9af0ff][i % 4]; const b = mesh(new THREE.SphereGeometry(.05, 10, 8), std(0, .4, 0, { emissive: c, emissiveIntensity: .9 }), 0, 0, 0, f); b.scale.set(1.6, 1, .5); const tl = mesh(new THREE.ConeGeometry(.04, .07, 4), std(0, .4, 0, { emissive: c, emissiveIntensity: .9 }), -.09, 0, 0, f); tl.rotation.z = Math.PI / 2; f.userData = { y: .95 + fr() * .45, ph: fr() * 6, sp: .4 + fr() * .5 }; aq.add(f); fish.push(f); }
  const aqL = new THREE.PointLight(0x20d8e8, 10, 6, 1.4); aqL.position.set(0, 1.2, .4); aq.add(aqL);
  for (let i = 0; i < 5; i++) { const pl = mesh(new THREE.ConeGeometry(.04, .35, 5), std(0x1f7a3a, .8, 0, { emissive: 0x0a3a1a }), -.6 + i * .3, .98, -.1, aq); }
  // télévision
  const tv = new THREE.Group(); tv.position.set(2.6, 0, 2.3); tv.rotation.y = -2.5; LV.add(tv);
  mesh(rbox(.9, .5, .45, .04), std(0x1a1a1c, .7), 0, .25, 0, tv); mesh(rbox(.72, .58, .55, .06), std(0x232326, .45), 0, .8, 0, tv);
  const tvC = document.createElement('canvas'); tvC.width = 64; tvC.height = 48; const tvT = new THREE.CanvasTexture(tvC);
  const scr = mesh(new THREE.PlaneGeometry(.56, .42), new THREE.MeshBasicMaterial({ map: tvT, color: 0x9ab0c8 }), 0, .8, .281, tv); scr.castShadow = false;
  const tvL = new THREE.PointLight(0x9fb8ff, 3, 5, 1.6); tvL.position.set(0, .8, .7); tv.add(tvL);
  // objets sur la table : billets, verre, appareil Polaroid
  const bills = new THREE.Group(); bills.position.set(-.45, .785, -2.0); LV.add(bills);
  const billTex = labelTex(128, 56, c => { c.fillStyle = '#8fa98a'; c.fillRect(0, 0, 128, 56); c.strokeStyle = '#2c4a2a'; c.lineWidth = 4; c.strokeRect(4, 4, 120, 48); c.fillStyle = '#2c4a2a'; c.beginPath(); c.ellipse(64, 28, 16, 18, 0, 0, 7); c.fill(); c.font = '900 18px Mont'; c.fillText('50', 10, 24); c.fillText('50', 96, 48); });
  for (let i = 0; i < 4; i++) { const b = mesh(new THREE.BoxGeometry(.32, .004, .14), std(0xffffff, .8, 0, { map: billTex }), i * .03, i * .004, 0, bills); b.rotation.y = -.5 + i * .3; }
  const glass = makeGlass(0x8a4a14); glass.scale.setScalar(.16); glass.position.set(.35, .78, -1.95); LV.add(glass);
  const pills = []; for (let i = 0; i < 4; i++) { const p = mesh(new THREE.CapsuleGeometry(.012, .025, 4, 8), std(0xf4f4ff, .3), 0, 0, 0, LV); p.visible = false; pills.push(p); }
  const cam = new THREE.Group(); cam.position.set(.85, .78, -2.1); cam.rotation.y = -.6; LV.add(cam);
  mesh(rbox(.32, .2, .26, .03), std(0x1c1c1e, .5), 0, .1, 0, cam); mesh(new THREE.CylinderGeometry(.06, .06, .05, 20), std(0x111, .2, .7), 0, .1, .15, cam).rotation.x = Math.PI / 2;
  const flashGl = glow(0xffffff, 1.2, 0); flashGl.position.set(.09, .17, .14); cam.add(flashGl);
  const flashL = new THREE.PointLight(0xffffff, 0, 12, 1.2); flashL.position.set(0, .3, .5); cam.add(flashL);
  const polas = []; for (let i = 0; i < 12; i++) { const p = makePolaroid(i + 3); p.scale.setScalar(.3); p.visible = false; LV.add(p); polas.push(p); }
  // ---------------- cuisine ----------------
  const tiles = TEX.tiles.clone(); tiles.needsUpdate = true; tiles.repeat.set(3, 3);
  const KT = room(30, 6, 5, 2.7, std(0x9a9488, .6, 0, { map: tiles }), std(0x6a7066, .9));
  const fridge = new THREE.Group(); fridge.position.set(-1.6, 0, -2.05); KT.add(fridge);
  const enamel = std(0xe9e6dc, .32, .05);
  mesh(rbox(.85, 1.8, .7, .05), enamel, 0, .9, 0, fridge);
  const inner = mesh(new THREE.BoxGeometry(.75, 1.65, .02), std(0xffffff, .5, 0, { emissive: 0xdff4ff, emissiveIntensity: .0 }), 0, .9, .34, fridge);
  for (const y of [.55, .95, 1.35]) mesh(new THREE.BoxGeometry(.75, .015, .55), std(0xffffff, .2, 0, { transparent: true, opacity: .5 }), 0, y, .08, fridge);
  const fHinge = new THREE.Group(); fHinge.position.set(.425, 0, .36); fridge.add(fHinge);
  mesh(rbox(.85, 1.8, .07, .04), enamel, -.425, .9, 0, fHinge); mesh(new THREE.BoxGeometry(.04, .5, .05), std(0xb0b0b0, .3, .8), -.78, 1.15, .05, fHinge);
  const fLight = new THREE.SpotLight(0xe8f6ff, 0, 9, .8, .5, 1.2); fLight.position.set(0, 1.2, .2); fLight.target.position.set(.4, .9, 3); fridge.add(fLight, fLight.target);
  const fGlow = glow(0xe8f6ff, .9, 0); fGlow.position.set(0, 1.0, .5); fridge.add(fGlow);
  const freezer = new THREE.Group(); freezer.position.set(-.55, 0, -2.05); KT.add(freezer);
  mesh(rbox(.8, 1.7, .7, .05), enamel, 0, .85, 0, freezer);
  mesh(new THREE.BoxGeometry(.7, 1.55, .02), std(0xffffff, .5, 0, { emissive: 0xcfeaff, emissiveIntensity: .0 }), 0, .85, .34, freezer);
  const zHinge = new THREE.Group(); zHinge.position.set(-.4, 0, .36); freezer.add(zHinge);
  mesh(rbox(.8, 1.7, .07, .04), enamel, .4, .85, 0, zHinge); mesh(new THREE.BoxGeometry(.04, .5, .05), std(0xb0b0b0, .3, .8), .74, 1.1, .05, zHinge);
  const zLight = new THREE.SpotLight(0xcfe8ff, 0, 9, .8, .5, 1.2); zLight.position.set(0, 1.1, .2); zLight.target.position.set(-.3, .9, 3); freezer.add(zLight, zLight.target);
  const frost = []; for (let i = 0; i < 8; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.smoke, color: 0xdff2ff, transparent: true, opacity: 0, depthWrite: false })); s.position.set(-.55 + (i % 4 - 1.5) * .2, .6 + (i >> 2) * .6, -1.6); s.scale.set(1, 1, 1); KT.add(s); frost.push(s); }
  mesh(rbox(2.4, .9, .65, .03), std(0x3a2e24, .6), 1.4, .45, -2.15, KT); mesh(new THREE.BoxGeometry(2.45, .05, .7), std(0xb8b2a2, .4), 1.4, .92, -2.12, KT);
  // table de cuisine + assiette (scène « il les mange »)
  const ktab = new THREE.Group(); ktab.position.set(.8, 0, .4); KT.add(ktab);
  mesh(rbox(1.3, .05, .9, .02), std(0x5a3a22, .5, 0, { map: TEX.wood }), 0, .76, 0, ktab); for (const [x, z] of [[-.55, -.35], [.55, -.35], [-.55, .35], [.55, .35]]) mesh(new THREE.CylinderGeometry(.03, .03, .74), std(0x2a1a10, .6), x, .37, z, ktab);
  mesh(new THREE.CylinderGeometry(.2, .16, .025, 40), std(0xf2f0ea, .25), 0, .79, 0, ktab);
  mesh(new THREE.CylinderGeometry(.13, .13, .005, 40), std(0x3a0806, .2, .1), 0, .805, 0, ktab);
  const fork = mesh(new THREE.BoxGeometry(.018, .006, .26), std(0xd8dce2, .15, 1), -.27, .785, 0, ktab), knife = mesh(new THREE.BoxGeometry(.022, .006, .28), std(0xd8dce2, .15, 1), .27, .785, 0, ktab);
  const pend = new THREE.Group(); pend.position.set(.8, 2.7, .4); KT.add(pend); mesh(new THREE.CylinderGeometry(.006, .006, .9), std(0x111), 0, -.45, 0, pend);
  mesh(new THREE.ConeGeometry(.28, .22, 32, 1, true), std(0x1a1a1a, .5, .5, { side: THREE.DoubleSide }), 0, -.95, 0, pend);
  const bulb = mesh(new THREE.SphereGeometry(.06, 12, 10), std(0, .5, 0, { emissive: 0xffd7a0, emissiveIntensity: 2 }), 0, -1.0, 0, pend); bulb.castShadow = false;
  const pendL = new THREE.SpotLight(0xffc890, 0, 6, .7, .6, 1.3); pendL.position.set(0, -1.0, 0); pendL.target.position.set(0, -3, 0); pendL.castShadow = true; pend.add(pendL, pendL.target);
  const pendB = beam(.1, .9, 2.0, 0xffd7a0, .12); pendB.position.y = -1.0; pend.add(pendB);
  // ---------------- chambre ----------------
  const BR = room(60, 6.5, 5.5, 2.7, std(0xffffff, .95, 0, { map: TEX.carpet }), wallM);
  const bed = new THREE.Group(); bed.position.set(-.9, 0, -.6); BR.add(bed);
  mesh(rbox(1.6, .35, 2.2, .04), std(0x2a1d14, .6), 0, .18, 0, bed); mesh(rbox(1.5, .22, 2.05, .08), std(0xc9c6bc, .9), 0, .46, 0, bed);
  mesh(rbox(1.62, .9, .1, .03), std(0x2a1d14, .6), 0, .6, -1.1, bed); mesh(rbox(.6, .14, .35, .07), std(0xe2dfd6, .9), -.35, .63, -.85, bed);
  const lump = new THREE.Group(); lump.position.set(0, .56, .05); bed.add(lump);
  const sheet = std(0xd8d4c8, .95);
  mesh(rbox(.55, .2, 1.6, .1), sheet, 0, .1, 0, lump); mesh(new THREE.SphereGeometry(.17, 16, 12), sheet, 0, .12, -.82, lump).scale.set(1, .8, 1.1); mesh(rbox(.95, .06, 1.75, .03), sheet, 0, .02, .1, lump);
  lump.visible = false;
  const drum = makeDrum(); drum.position.set(2.5, 0, -2.0); BR.add(drum);
  const fumes = []; for (let i = 0; i < 9; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.smoke, color: 0x9ccf6a, transparent: true, opacity: 0, depthWrite: false })); s.userData.ph = i / 9; BR.add(s); fumes.push(s); }
  const cab = new THREE.Group(); cab.position.set(.9, 0, -2.45); BR.add(cab);
  const metal = std(0x5d6066, .45, .6);
  mesh(new THREE.BoxGeometry(1.2, 1.9, .03), metal, 0, .95, -.26, cab); for (const x of [-.585, .585]) mesh(new THREE.BoxGeometry(.03, 1.9, .55), metal, x, .95, 0, cab);
  mesh(new THREE.BoxGeometry(1.2, .03, .55), metal, 0, 1.885, 0, cab); mesh(new THREE.BoxGeometry(1.2, .1, .55), metal, 0, .05, 0, cab); mesh(new THREE.BoxGeometry(1.14, 1.84, .01), std(0x15161a, .8), 0, .95, -.24, cab);
  for (const s of [-1, 1]) { const dh = new THREE.Group(); dh.position.set(s * .6, 0, .28); cab.add(dh); mesh(new THREE.BoxGeometry(.58, 1.86, .025), metal, -s * .29, .95, 0, dh); dh.rotation.y = s * 1.9; }
  for (const y of [.75, 1.35]) mesh(new THREE.BoxGeometry(1.1, .03, .5), metal, 0, y, .02, cab);
  const skulls = []; for (let i = 0; i < 7; i++) { const painted = i === 1 || i === 4 || i === 6; const sk = makeSkull(std(painted ? 0x7d7f84 : 0xe6dcc4, painted ? .4 : .6, painted ? .3 : 0)); sk.scale.setScalar(.16); const row = i < 4 ? 0 : 1; const n = row ? 3 : 4; const k = row ? i - 4 : i; sk.position.set(-.39 + k * (.78 / (n - 1)), (row ? .81 : 1.41) + .07, .1); sk.rotation.y = (k - 1.5) * .12; cab.add(sk); skulls.push(sk); }
  const cabL = new THREE.PointLight(0xfff2d8, 0, 3, 2); cabL.position.set(0, 1.2, .55); cab.add(cabL);
  const blinds = new THREE.Group(); blinds.position.set(-3.22, 1.5, .8); blinds.rotation.y = Math.PI / 2; BR.add(blinds);
  for (let i = 0; i < 14; i++) { const s = mesh(new THREE.BoxGeometry(1.3, .012, .06), std(0xd0ccc0, .7), 0, -.65 + i * .1, 0, blinds); s.rotation.x = .9; }
  const winL = new THREE.SpotLight(0xffa860, 14, 12, .5, .6, 1.2); winL.position.set(-4.2, 2.1, .8); winL.target.position.set(.5, 0, .4); BR.add(winL, winL.target);
  const bedPolas = []; for (let i = 0; i < 26; i++) { const p = makePolaroid(40 + i); p.scale.setScalar(.33); BR.add(p); bedPolas.push(p); p.visible = false; }
  // ---------------- salle de bains ----------------
  const tl2 = TEX.tiles.clone(); tl2.needsUpdate = true; tl2.repeat.set(4, 2);
  const BA = room(90, 4, 4, 2.6, std(0xffffff, .5, 0, { map: tiles }), std(0xffffff, .55, 0, { map: tl2 }));
  const tub = new THREE.Group(); tub.position.set(0, 0, -1.3); BA.add(tub);
  const ena = std(0xf0eee6, .22, .05);
  mesh(rbox(2.0, .6, .9, .12), ena, 0, .3, 0, tub); const cav = mesh(rbox(1.75, .5, .7, .1), std(0x9a968c, .3), 0, .38, 0, tub);
  mesh(new THREE.BoxGeometry(1.7, .02, .65), std(0x1a0503, .2, .1, { transparent: true, opacity: .65 }), 0, .2, 0, tub);
  mesh(new THREE.CylinderGeometry(.02, .02, .25), std(0xd0d4da, .15, 1), .85, .78, -.3, tub);
  const rod = mesh(new THREE.CylinderGeometry(.015, .015, 2.1), std(0xd0d4da, .15, 1), 0, 2.2, .45, tub); rod.rotation.z = Math.PI / 2;
  const shc = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.9, 40, 2), new THREE.MeshPhysicalMaterial({ color: 0xcfe8e0, roughness: .3, transparent: true, opacity: .55, side: THREE.DoubleSide }));
  { const p = shc.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 14) * .04); shc.geometry.computeVertexNormals(); } shc.position.set(-.45, 1.25, .45); tub.add(shc);
  const fluo = mesh(new THREE.BoxGeometry(.9, .05, .16), std(0, .5, 0, { emissive: 0xd8ffe6, emissiveIntensity: 1.0 }), 0, 2.55, -.5, BA); fluo.castShadow = false;
  const baL = new THREE.PointLight(0xccffdd, 4, 7, 1.4); baL.position.set(0, 2.2, 0); BA.add(baL);
  const LVlights = { blueL, aqL, tvL };
  // policiers avec lampes torches (inventaire)
  const torches = [0, 1].map(() => { const sl = new THREE.SpotLight(0xf4f8ff, 0, 10, .34, .55, 2); sl.castShadow = true; sl.shadow.mapSize.set(1024, 1024); S.add(sl, sl.target); const b = beam(.03, .9, 6, 0xeaf2ff, .05); S.add(b); return { sl, b }; });
  const motes = dust(400, [-4, 95, 0, 2.7, -3, 3], 0xffffff, .018, 9, .5); S.add(motes);
  return { S, cam: persp(44), hemi, LV, KT, BR, BA, rooms: [LV, KT, BR, BA], table, curtain, chair, couch, aq, fish, water, tv, tvC, tvT, bills, glass, pills, polaCam: cam, flashGl, flashL, polas, fridge, fHinge, fLight, fGlow, inner, freezer, zHinge, zLight, frost, ktab, pendL, bed, lump, drum, fumes, cab, cabL, skulls, bedPolas, tub, baL, fluo, LVlights, torches, motes };
}
