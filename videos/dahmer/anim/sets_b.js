// Décors : vide sanitaire (Ohio), bois / maison 1978, intérieur 1978, Ambassador Hotel, studio symbolique, prison, tribunal.
import * as THREE from 'three';
import { TEX, std, basic, mesh, rbox, glow, beam, dust, makeHuman, makeCar, makeStreetLight, makeTree, makePine, makeSkull, makeBone, makeSuitcase, makeGlass, labelTex, rng, lerp, V, mergeStatic } from './lib.js';

const persp = (fov = 42) => new THREE.PerspectiveCamera(fov, 1080 / 1920, .05, 900);
function plane(w, h, mat, rotX = -Math.PI / 2) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.rotation.x = rotX; m.receiveShadow = true; return m; }

// =====================================================================================
export function buildCrawl() {
  const S = new THREE.Scene(); S.background = new THREE.Color(0x020201); S.fog = new THREE.FogExp2(0x0c0a07, .11);
  S.add(new THREE.HemisphereLight(0x7a6650, 0x1a120a, .9));
  const g = plane(16, 10, std(0xffffff, 1, 0, { map: TEX.dirt })); S.add(g);
  const wood = std(0x3a2a1c, .85, 0, { map: TEX.wood });
  for (let z = -4.5; z <= 4.5; z += .45) mesh(new THREE.BoxGeometry(16, .22, .08), wood, 0, 1.15, z, S);
  const sub = plane(16, 10, std(0x2a1f15, .9), Math.PI / 2); sub.position.y = 1.27; S.add(sub);
  const conc = std(0x6a6862, .95, 0, { map: TEX.concrete });
  const back = mesh(new THREE.BoxGeometry(16, 1.3, .3), conc, 0, .65, -4.6, S);
  for (const x of [-6, -1.5, 3.5]) mesh(new THREE.BoxGeometry(.5, 1.15, .5), conc, x, .58, -1 + (x % 2), S);
  // soupiraux : lumière du crépuscule
  const vents = [];
  for (const x of [-3.5, 2.2]) { const v = mesh(new THREE.BoxGeometry(.7, .3, .32), std(0, .5, 0, { emissive: 0x8fa8ff, emissiveIntensity: .7 }), x, .95, -4.6, S); v.castShadow = false;
    const l = new THREE.SpotLight(0x9fb2ff, 16, 8, .5, .6, 1.3); l.position.set(x, .95, -4.3); l.target.position.set(x, 0, -1.5); S.add(l, l.target); }
  // entrée lumineuse (côté droit)
  const ent = mesh(new THREE.BoxGeometry(.1, .8, 1.4), std(0, .5, 0, { emissive: 0xffc890, emissiveIntensity: 3.0 }), 7.9, .45, 1.6, S); ent.castShadow = false;
  const entL = new THREE.PointLight(0xffc080, 26, 9, 1.4); entL.position.set(7.2, .6, 1.6); S.add(entL); const fill = new THREE.PointLight(0xffb070, 3, 5, 1.6); fill.position.set(-2.2, .9, .3); S.add(fill);
  // os d'animaux
  const bones = new THREE.Group(); S.add(bones); const r = rng(51);
  for (let i = 0; i < 16; i++) { const b = makeBone(.18 + r() * .25); b.position.set(-1.2 + (r() - .5) * 2.4, .04, -1.5 + (r() - .5) * 1.6); b.rotation.y = r() * 6; b.rotation.z = (r() - .5) * .3; bones.add(b); }
  for (let i = 0; i < 3; i++) { const sk = makeSkull(std(0xd8d0bb, .6)); sk.scale.set(.09, .08, .12); sk.position.set(-1.4 + i * .7, .07, -1.7 + (r() - .5)); sk.rotation.y = r() * 3; bones.add(sk); }
  const father = makeHuman({ color: 0x17171c }); father.position.set(-2.4, -.05, -.6); father.rotation.y = 2.3; S.add(father);
  const torch = new THREE.SpotLight(0xfff2d0, 0, 9, .35, .5, 1.2); torch.castShadow = true; torch.shadow.mapSize.set(1024, 1024); S.add(torch, torch.target);
  const tb = beam(.03, .55, 3.2, 0xfff0d0, .16); S.add(tb);
  const boy = makeHuman({ color: 0x15151a, height: .58 }); boy.position.set(3.2, 0, 1.4); boy.rotation.y = -1.9; S.add(boy);
  const motes = dust(380, [-7, 7, 0, 1.2, -4.5, 4], 0xfff0d8, .015, 7, .55); S.add(motes);
  return { S, cam: persp(46), bones, father, torch, tb, boy, motes };
}

// =====================================================================================
export function buildWoods() {
  const S = new THREE.Scene(); S.background = new THREE.Color(0x0b0d1a); S.fog = new THREE.FogExp2(0x101426, .024);
  const hemi = new THREE.HemisphereLight(0x4a5590, 0x0b0a08, .45); S.add(hemi);
  const moon = new THREE.DirectionalLight(0x9fb0ff, .7); moon.position.set(40, 60, -60); moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
  Object.assign(moon.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 200 }); moon.shadow.bias = -.0006; S.add(moon, moon.target);
  const moonSpr = glow(0xdfe6ff, 40, .9); moonSpr.position.set(60, 75, -170); S.add(moonSpr);
  const moonDisc = new THREE.Mesh(new THREE.CircleGeometry(4.5, 40), basic(0xf2f4ff, { fog: false })); moonDisc.position.set(60, 75, -171); S.add(moonDisc);
  TEX.grass.repeat.set(60, 60);
  const ground = plane(400, 400, std(0x9ab09a, 1, 0, { map: TEX.grass })); S.add(ground);
  const road = plane(400, 7, std(0x8a8a90, .7, 0, { map: TEX.asphalt })); road.position.y = .015; S.add(road);
  for (let x = -200; x < 200; x += 5) { mesh(new THREE.BoxGeometry(3, .01, .12), basic(0xd8b030), x, .03, -.1, S).castShadow = false; mesh(new THREE.BoxGeometry(3, .01, .12), basic(0xd8b030), x, .03, .1, S).castShadow = false; }
  // maison des Dahmer (années 50, sur une butte, cachée par les arbres)
  const hill = new THREE.Mesh(new THREE.SphereGeometry(30, 32, 16), std(0x7a907a, 1, 0, { map: TEX.grass })); hill.scale.set(1, .12, 1); hill.position.set(-22, -1.2, -34); hill.receiveShadow = true; S.add(hill);
  const house = new THREE.Group(); house.position.set(-22, 2.3, -32); S.add(house);
  const siding = std(0xcfd2cf, .85);
  mesh(new THREE.BoxGeometry(14, 3.2, 8), siding, 0, 1.6, 0, house);
  mesh(new THREE.BoxGeometry(6, 2.6, 7), siding, 8.5, 1.3, .3, house);
  const rf = std(0x2b2724, .8);
  const r1 = mesh(new THREE.BoxGeometry(15, .25, 4.8), rf, 0, 3.75, 2.1, house); r1.rotation.x = .28; const r2 = mesh(new THREE.BoxGeometry(15, .25, 4.8), rf, 0, 3.75, -2.1, house); r2.rotation.x = -.28;
  mesh(new THREE.BoxGeometry(7, .2, 7.6), rf, 8.5, 2.7, .3, house);
  mesh(new THREE.BoxGeometry(.9, 2.4, .9), std(0x5a3a30, .9, 0, { map: TEX.brick }), -4.5, 4.2, -1, house);
  const winLit = std(0, .3, 0, { emissive: 0xffb860, emissiveIntensity: 1.8 }), winDark = std(0x0a0c12, .1, .5);
  const wins = [];
  for (const [x, lit] of [[-4.5, false], [-1.5, true], [1.5, false], [4.5, false]]) { mesh(new THREE.BoxGeometry(2.2, 1.6, .1), std(0xe8e4dc, .6), x, 1.7, 4.03, house); const w = mesh(new THREE.BoxGeometry(2.0, 1.4, .12), lit ? winLit : winDark, x, 1.7, 4.05, house); wins.push(w); }
  const houseL = new THREE.PointLight(0xffb060, 20, 14, 1.4); houseL.position.set(-1.5, 1.8, 5.5); house.add(houseL);
  const pond = new THREE.Mesh(new THREE.CircleGeometry(4, 40), std(0x04060c, .05, .4)); pond.rotation.x = -Math.PI / 2; pond.scale.set(1.6, 1, 1); pond.position.set(-6, .05, -27); S.add(pond);
  const rocks = std(0x55565a, .9, 0, { flatShading: true }); const rr = rng(61);
  for (let i = 0; i < 10; i++) { const m = mesh(new THREE.IcosahedronGeometry(1 + rr() * 1.6, 0), rocks, -30 + rr() * 18, .5, -44 + rr() * 6, S); m.rotation.set(rr() * 3, rr() * 3, rr() * 3); }
  // forêt
  const tr = rng(62);
  for (let i = 0; i < 150; i++) { const x = -110 + tr() * 220, z = -120 + tr() * 140; if (Math.abs(z) < 7) continue; if (Math.hypot(x + 22, z + 32) < 13) continue; if (Math.hypot(x - 18, z + 14) < 5) continue; const t = tr() < .65 ? makePine(i) : makeTree(i); t.position.set(x, 0, z); t.scale.setScalar(.9 + tr() * .8); S.add(t); }
  for (let i = 0; i < 40; i++) { const x = -110 + tr() * 220, z = 9 + tr() * 50; const t = tr() < .65 ? makePine(i + 500) : makeTree(i + 500); t.position.set(x, 0, z); S.add(t); }
  // cabane dans les bois avec bocaux
  const shack = new THREE.Group(); shack.position.set(18, 0, -14); shack.rotation.y = -.35; S.add(shack);
  const planks = std(0x4a3524, .9, 0, { map: TEX.wood });
  mesh(new THREE.BoxGeometry(3.4, 2.5, .15), planks, 0, 1.25, -1.2, shack); for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(.15, 2.5, 2.5), planks, s * 1.7, 1.25, 0, shack);
  const sr = mesh(new THREE.BoxGeometry(3.8, .15, 3), planks, 0, 2.65, 0, shack); sr.rotation.x = .12;
  for (const y of [.8, 1.5]) mesh(new THREE.BoxGeometry(3.1, .06, .5), planks, 0, y, -.9, shack);
  const jars = []; const jr = rng(63);
  const glassM = new THREE.MeshPhysicalMaterial({ color: 0xdfffe8, roughness: .05, transparent: true, opacity: .3, depthWrite: false });
  for (let i = 0; i < 9; i++) { const j = new THREE.Group(); const row = i < 5 ? 0 : 1; const k = row ? i - 5 : i; j.position.set(-1.2 + k * (row ? .8 : .6), (row ? 1.53 : .83), -.85); shack.add(j);
    mesh(new THREE.CylinderGeometry(.13, .13, .32, 20), std(0x6aa02a, .2, 0, { emissive: 0x5fbf2a, emissiveIntensity: .9, transparent: true, opacity: .75 }), 0, .16, 0, j);
    mesh(new THREE.CylinderGeometry(.14, .14, .36, 20, 1, true), glassM, 0, .18, 0, j); mesh(new THREE.CylinderGeometry(.145, .145, .05, 20), std(0x8a8a86, .4, .7), 0, .37, 0, j);
    const crit = mesh(new THREE.SphereGeometry(.06, 10, 8), std(0x1a140a, .8), 0, .14, 0, j); crit.scale.set(1.4, .8, .8); jars.push(j); }
  const shL = new THREE.PointLight(0x7fd04a, 10, 6, 1.5); shL.position.set(0, 1.4, 0); shack.add(shL);
  const bulb = glow(0xffd090, 1.2, .8); bulb.position.set(0, 2.3, -.2); shack.add(bulb); const bL = new THREE.PointLight(0xffc070, 6, 5, 1.6); bL.position.set(0, 2.2, 0); shack.add(bL);
  // os éparpillés derrière la maison
  const bones = new THREE.Group(); bones.position.set(-12, 0, -46); S.add(bones); const br = rng(64);
  for (let i = 0; i < 26; i++) { const b = makeBone(.25 + br() * .35, std(0xe8e2d0, .55, 0, { emissive: 0x9aa8c8, emissiveIntensity: .15 })); b.position.set((br() - .5) * 9, .05, (br() - .5) * 6); b.rotation.y = br() * 6; bones.add(b); }
  const boneL = new THREE.PointLight(0x9fb2ff, 0, 12, 1.4); boneL.position.set(0, 3, 0); bones.add(boneL);
  // personnages + voiture
  const teen = makeHuman({ color: 0x17181e }); S.add(teen); const bag = mesh(rbox(.35, .45, .2, .05), std(0x2a2a1e, .8), 0, -.25, 0, teen.userData.P.armR.end);
  const hitch = makeHuman({ color: 0x1b1c22, hair: 0x3a2a1a }); S.add(hitch);
  const car = makeCar('sedan'); S.add(car);
  [teen, hitch, car, house, shack, bones].forEach(o => o.userData.dynamic = true);
  mergeStatic(S, o => o.userData.dynamic || o.isLight);
  const motes = dust(600, [-40, 40, 0, 10, -60, 20], 0xcfd8ff, .08, 11, .35); S.add(motes);
  const fireflies = dust(120, [-30, 40, .3, 3, -40, -6], 0xc8ff70, .12, 12, .9); S.add(fireflies);
  return { S, cam: persp(42), hemi, moon, ground, house, wins, houseL, shack, jars, shL, bones, boneL, teen, hitch, car, motes, fireflies };
}

// =====================================================================================
export function buildRoom78() {
  const S = new THREE.Scene(); S.background = new THREE.Color(0x020101); S.fog = new THREE.FogExp2(0x080504, .09);
  S.add(new THREE.HemisphereLight(0x5a4030, 0x080504, .25));
  const fl = plane(9, 8, std(0xffffff, .95, 0, { map: TEX.carpet })); S.add(fl);
  const pn = std(0xffffff, .7, 0, { map: TEX.panel });
  const back = plane(9, 3, pn, 0); back.position.set(0, 1.5, -3); S.add(back);
  const left = plane(8, 3, pn, 0); left.rotation.y = Math.PI / 2; left.position.set(-4.5, 1.5, 1); S.add(left);
  const ceil = plane(9, 8, std(0x1a1410, .9), Math.PI / 2); ceil.position.y = 3; S.add(ceil);
  // lampe d'appoint
  const lamp = new THREE.Group(); lamp.position.set(-2.6, 0, -2.2); S.add(lamp);
  mesh(new THREE.CylinderGeometry(.03, .03, 1.5), std(0x2a2018, .5, .6), 0, .75, 0, lamp);
  mesh(new THREE.CylinderGeometry(.22, .35, .4, 24, 1, true), std(0xd8c49a, .8, 0, { side: THREE.DoubleSide, emissive: 0xffb060, emissiveIntensity: .6 }), 0, 1.6, 0, lamp);
  const lampL = new THREE.PointLight(0xffb060, 12, 9, 1.5); lampL.position.set(0, 1.5, 0); lampL.castShadow = true; lampL.shadow.mapSize.set(1024, 1024); lamp.add(lampL);
  const sofa = new THREE.Group(); sofa.position.set(1.8, 0, -2.4); S.add(sofa); const vel = std(0x5a3a22, .9);
  mesh(rbox(2.6, .45, .95, .12), vel, 0, .3, 0, sofa); mesh(rbox(2.6, .7, .25, .1), vel, 0, .75, -.38, sofa);
  // haltère au sol
  const bar = new THREE.Group(); bar.position.set(.2, .16, -.2); bar.rotation.y = .5; S.add(bar);
  const iron = std(0x2a2b2e, .35, .85);
  const rod = mesh(new THREE.CylinderGeometry(.025, .025, 1.5, 12), std(0x8a8e96, .4, .75), 0, 0, 0, bar); rod.rotation.z = Math.PI / 2;
  for (const s of [-1, 1]) for (const k of [0, 1]) { const p = mesh(new THREE.CylinderGeometry(.16 - k * .03, .16 - k * .03, .06, 28), iron, s * (.55 + k * .07), 0, 0, bar); p.rotation.z = Math.PI / 2; }
  const redL = new THREE.PointLight(0xff1a0a, 0, 12, 1.2); redL.position.set(0, 2.2, 1); S.add(redL);
  const keyL = new THREE.SpotLight(0xffe0b8, 18, 8, .5, .6, 1.3); keyL.position.set(.5, 2.9, .6); keyL.target.position.set(.2, 0, -.2); keyL.castShadow = true; S.add(keyL, keyL.target);
  const kb = beam(.05, 1.0, 2.9, 0xffe0b8, .1); kb.position.set(.5, 2.9, .6); kb.rotation.x = .2; S.add(kb);
  const motes = dust(250, [-4, 4, 0, 3, -3, 3], 0xffe8d0, .02, 13, .45); S.add(motes);
  return { S, cam: persp(44), bar, redL, keyL, lampL, motes };
}

// =====================================================================================
export function buildHotelExt() {
  const S = new THREE.Scene(); S.background = new THREE.Color(0x04050c); S.fog = new THREE.FogExp2(0x090b18, .016);
  S.add(new THREE.HemisphereLight(0x3a4478, 0x100a08, .45));
  TEX.asphalt.repeat.set(60, 2);
  const road = plane(300, 12, std(0x9a9aa2, .45, .05, { map: TEX.asphalt })); road.position.z = 6; S.add(road);
  mesh(new THREE.BoxGeometry(300, .16, 4), std(0xb0b0b6, .85, 0, { map: TEX.concrete }), 0, .08, -2, S);
  const terra = std(0xcdb48c, .75), dark = std(0x0d0f16, .2, .4), lit = std(0, .3, 0, { emissive: 0xffc070, emissiveIntensity: 1.5 });
  const T = new THREE.Group(); T.position.set(0, 0, -12); S.add(T); const r = rng(71);
  mesh(new THREE.BoxGeometry(22, 5, 14), terra, 0, 2.5, 0, T);
  mesh(new THREE.BoxGeometry(17, 22, 11), terra, 0, 16, 0, T);
  mesh(new THREE.BoxGeometry(12, 4, 8), terra, 0, 29, 0, T); mesh(new THREE.BoxGeometry(7, 2.5, 5), terra, 0, 32.2, 0, T);
  for (let i = -3; i <= 3; i++) mesh(new THREE.BoxGeometry(.5, 22.5, .5), std(0xe2cfa6, .7), i * 2.6, 16, 5.6, T);
  for (let f = 0; f < 8; f++) for (let c = -3; c < 3; c++) { const w = mesh(new THREE.BoxGeometry(1.4, 1.6, .1), r() < .3 ? lit : dark, c * 2.6 + 1.3, 7 + f * 2.6, 5.52, T); }
  // marquise d'entrée
  mesh(new THREE.BoxGeometry(10, .5, 3.2), std(0x1a1a1e, .4, .6), 0, 4.2, 8.4, T);
  for (let i = 0; i < 18; i++) { const b = mesh(new THREE.SphereGeometry(.07, 8, 6), std(0, .5, 0, { emissive: 0xffd9a0, emissiveIntensity: 4 }), -4.6 + i * .54, 3.92, 9.95, T); b.castShadow = false; }
  const doorGlow = mesh(new THREE.BoxGeometry(5, 3.4, .1), std(0, .5, 0, { emissive: 0xffc070, emissiveIntensity: 1.4 }), 0, 1.7, 7.02, T);
  const entL = new THREE.PointLight(0xffc080, 40, 16, 1.4); entL.position.set(0, 2.5, 11); T.add(entL);
  // enseigne néon verticale « AMBASSADOR »
  const neonTex = labelTex(128, 1024, c => { c.fillStyle = '#000'; c.fillRect(0, 0, 128, 1024); c.font = '900 96px Mont'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff'; 'AMBASSADOR'.split('').forEach((ch, i) => c.fillText(ch, 64, 56 + i * 100)); });
  const sign = new THREE.Group(); sign.position.set(8.9, 17, 6.2); T.add(sign);
  mesh(new THREE.BoxGeometry(.5, 18, 2.4), std(0x111216, .4, .6), 0, 0, 0, sign);
  const neonM = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xff2a5a, emissiveIntensity: 3.4, emissiveMap: neonTex, map: neonTex, transparent: false });
  for (const s of [-1, 1]) { const n = mesh(new THREE.PlaneGeometry(2.0, 16.5), neonM, s * .26, 0, 0, sign); n.rotation.y = s * Math.PI / 2; n.castShadow = false; }
  const sg = glow(0xff2a6a, 22, .35); sg.scale.set(9, 24, 1); sign.add(sg);
  const sL = new THREE.PointLight(0xff3060, 60, 30, 1.3); sL.position.set(2, 0, 2); sign.add(sL);
  // éclairage de façade
  for (const x of [-6, 6]) { const u = new THREE.SpotLight(0xffd8a0, 50, 40, .4, .7, 1.2); u.position.set(x, .5, 9); u.target.position.set(x * .6, 22, -12); S.add(u, u.target); }
  for (let x = -40; x < 40; x += 16) { const l = makeStreetLight(0xffb060, true, 60); l.position.set(x + 5, 0, -.5); l.rotation.y = -Math.PI / 2; S.add(l); }
  const car = makeCar('sedan'); car.position.set(-9, 0, 2.6); S.add(car);
  const motes = dust(400, [-30, 30, 0, 30, -10, 15], 0xffd0e0, .1, 17, .3); S.add(motes);
  return { S, cam: persp(46), tower: T, sign, motes };
}

// =====================================================================================
export function buildHotelRoom() {
  const S = new THREE.Scene(); S.background = new THREE.Color(0x020306); S.fog = new THREE.FogExp2(0x0a0d14, .06);
  S.add(new THREE.HemisphereLight(0x6a7898, 0x1a1410, .7));
  const fl = plane(8, 7, std(0xffffff, .95, 0, { map: TEX.carpet })); S.add(fl);
  const wp = TEX.wallpaper.clone(); wp.needsUpdate = true; wp.repeat.set(5, 1.5);
  const wm = std(0x6a7a6a, .9, 0, { map: wp });
  const back = plane(8, 2.8, wm, 0); back.position.set(0, 1.4, -3); S.add(back);
  const right = plane(7, 2.8, wm, 0); right.rotation.y = -Math.PI / 2; right.position.set(3.6, 1.4, .5); S.add(right);
  const left = plane(7, 2.8, wm, 0); left.rotation.y = Math.PI / 2; left.position.set(-3.6, 1.4, .5); S.add(left);
  const bed = new THREE.Group(); bed.position.set(.2, 0, -1.3); S.add(bed);
  mesh(rbox(2.0, .4, 2.3, .05), std(0x3a2a1e, .6), 0, .2, 0, bed); mesh(rbox(1.9, .25, 2.15, .1), std(0xdcd8cc, .9), 0, .52, 0, bed);
  mesh(rbox(2.1, 1.1, .12, .03), std(0x3a2a1e, .6, 0, { map: TEX.wood }), 0, .7, -1.17, bed);
  for (const x of [-.5, .5]) mesh(rbox(.7, .16, .4, .08), std(0xeeeae0, .9), x, .72, -.85, bed);
  const sheet = std(0xe0dcd0, .95);
  const lump = new THREE.Group(); lump.position.set(.45, .64, .05); bed.add(lump);
  mesh(rbox(.55, .22, 1.6, .11), sheet, 0, .1, 0, lump); mesh(new THREE.SphereGeometry(.18, 16, 12), sheet, 0, .12, -.82, lump).scale.set(1, .8, 1.1); mesh(rbox(1.05, .06, 1.9, .03), sheet, -.2, .02, .1, lump);
  const man = makeHuman({ color: 0x1f2027, hair: 0x6a5536 }); man.position.set(-.75, 0, -.4); man.rotation.y = Math.PI / 2 + .3; S.add(man);
  const ns = new THREE.Group(); ns.position.set(-1.6, 0, -2.4); S.add(ns); mesh(rbox(.6, .6, .5, .03), std(0x3a2a1e, .6), 0, .3, 0, ns);
  mesh(new THREE.CylinderGeometry(.13, .2, .28, 20, 1, true), std(0xcfc2a0, .8, 0, { side: THREE.DoubleSide }), 0, .95, 0, ns); mesh(new THREE.CylinderGeometry(.02, .02, .3), std(0x222), 0, .75, 0, ns);
  // fenêtre à stores : lumière froide de l'aube en lamelles
  const win = new THREE.Group(); win.position.set(3.58, 1.5, -.4); S.add(win);
  mesh(new THREE.BoxGeometry(.05, 1.6, 1.6), std(0, .5, 0, { emissive: 0xb8c8ff, emissiveIntensity: 1.6 }), 0, 0, 0, win);
  for (let i = 0; i < 16; i++) mesh(new THREE.BoxGeometry(.06, .035, 1.6), std(0x8a8a84, .6), -.04, -.75 + i * .1, 0, win);
  const dawn = new THREE.SpotLight(0xb0c4ff, 70, 14, .55, .4, 1.1); const warm = new THREE.PointLight(0xffb070, 4, 6, 1.5); warm.position.set(-1.6, 1.1, -1.9); S.add(warm); dawn.position.set(4.2, 1.9, -.4); dawn.target.position.set(-1, .3, -.8); dawn.castShadow = true; dawn.shadow.mapSize.set(1024, 1024); S.add(dawn, dawn.target);
  const slats = new THREE.Group(); S.add(slats);
  for (let i = 0; i < 9; i++) { const b = mesh(new THREE.PlaneGeometry(4.5, .06), new THREE.MeshBasicMaterial({ color: 0x9fb4ff, transparent: true, opacity: .1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), 1.4, 1.2 + i * .09 - .4, -.4, slats); b.rotation.set(0, 0, -.32); b.castShadow = false; }
  const suitcase = makeSuitcase(); suitcase.position.set(-2.0, 0, .9); suitcase.rotation.y = .5; S.add(suitcase);
  const suitL = new THREE.SpotLight(0xffe4c4, 0, 7, .4, .6, 1.2); suitL.position.set(-2.0, 3.2, 2.2); suitL.target.position.set(-2.0, .4, .9); suitL.castShadow = true; S.add(suitL, suitL.target);
  const motes = dust(300, [-3.5, 3.5, 0, 2.8, -3, 3], 0xd8e2ff, .02, 19, .5); S.add(motes);
  return { S, cam: persp(44), bed, lump, man, suitcase, suitL, dawn, motes };
}

// =====================================================================================
export function buildStudio() {
  const S = new THREE.Scene(); S.background = new THREE.Color(0x000000); S.fog = new THREE.FogExp2(0x000000, .08);
  const amb = new THREE.HemisphereLight(0x303448, 0x000000, .25); S.add(amb);
  const floor = plane(80, 80, std(0x0b0b0e, .32, .55)); S.add(floor);
  const key = new THREE.SpotLight(0xffffff, 60, 16, .42, .65, 1.2); key.position.set(0, 7, 2); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); S.add(key, key.target);
  const kb = beam(.15, 2.6, 7.2, 0xffffff, .07); kb.position.set(0, 7, 2); kb.rotation.x = .28; S.add(kb);
  const rim = new THREE.PointLight(0x6a8aff, 14, 10, 1.4); rim.position.set(-2.5, 2, -2.5); S.add(rim);
  const rim2 = new THREE.PointLight(0xff4a3a, 0, 10, 1.4); rim2.position.set(2.5, 1.5, -2); S.add(rim2);
  const G = {};
  // verre + somnifères
  G.pills = new THREE.Group(); S.add(G.pills);
  const gl = makeGlass(0x9a5a1a); G.pills.add(gl); G.glass = gl;
  G.pill = []; for (let i = 0; i < 5; i++) { const p = mesh(new THREE.CapsuleGeometry(.05, .1, 6, 12), std(0xf6f6ff, .25), 0, 0, 0, G.pills); p.material = std(i % 2 ? 0xf2f4ff : 0x9ac8ff, .25); G.pill.push(p); }
  G.bub = dust(60, [-.3, .3, .1, .85, -.3, .3], 0xffffff, .03, 23, .7); G.pills.add(G.bub);
  // crâne holographique + perceuse + seringue
  G.holo = new THREE.Group(); S.add(G.holo);
  const holoFill = new THREE.MeshBasicMaterial({ color: 0x2ad8ff, transparent: true, opacity: .05, blending: THREE.AdditiveBlending, depthWrite: false });
  const holoLine = new THREE.LineBasicMaterial({ color: 0x8ff0ff, transparent: true, opacity: .9 });
  const sk = makeSkull(holoFill); G.holo.add(sk); G.skull = sk;
  sk.traverse(m => { if (m.isMesh) { m.castShadow = false; m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 18), holoLine)); } });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.9, .01, 8, 80), new THREE.MeshBasicMaterial({ color: 0x5fe8ff, transparent: true, opacity: .6, blending: THREE.AdditiveBlending })); ring.rotation.x = Math.PI / 2; ring.position.y = -.65; G.holo.add(ring); G.ring = ring;
  const scan = new THREE.Mesh(new THREE.PlaneGeometry(1.6, .02), new THREE.MeshBasicMaterial({ color: 0x9ff4ff, transparent: true, opacity: .7, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })); G.holo.add(scan); G.scan = scan;
  G.drill = new THREE.Group(); G.holo.add(G.drill);
  const steel = std(0xd8dde4, .15, 1); const body = std(0x1a1a1e, .5, .3);
  mesh(rbox(.3, .32, .9, .06), body, 0, 0, .65, G.drill); mesh(rbox(.18, .5, .2, .05), body, 0, -.35, .85, G.drill);
  const bit = mesh(new THREE.CylinderGeometry(.015, .03, .5, 12), steel, 0, 0, 0, G.drill); bit.rotation.x = Math.PI / 2; bit.position.z = .05;
  G.syr = new THREE.Group(); G.holo.add(G.syr);
  mesh(new THREE.CylinderGeometry(.05, .05, .5, 20), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: .35, roughness: .05 }), 0, 0, 0, G.syr).rotation.z = Math.PI / 2;
  mesh(new THREE.CylinderGeometry(.045, .045, .3, 20), std(0xc8ff3a, .3, 0, { emissive: 0x9fdc1a, emissiveIntensity: .9 }), .06, 0, 0, G.syr).rotation.z = Math.PI / 2;
  mesh(new THREE.CylinderGeometry(.004, .004, .3, 8), steel, -.4, 0, 0, G.syr).rotation.z = Math.PI / 2;
  // horloge
  G.clock = new THREE.Group(); S.add(G.clock);
  const face = labelTex(512, 512, c => { c.fillStyle = '#f0ece2'; c.beginPath(); c.arc(256, 256, 250, 0, 7); c.fill(); c.fillStyle = '#111'; c.font = '800 54px Mont'; c.textAlign = 'center'; c.textBaseline = 'middle'; for (let i = 1; i <= 12; i++) { const a = i / 12 * Math.PI * 2 - Math.PI / 2; c.fillText(i, 256 + Math.cos(a) * 190, 256 + Math.sin(a) * 190); } for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2; c.fillRect(256 + Math.cos(a) * 232 - 2, 256 + Math.sin(a) * 232 - 2, i % 5 ? 4 : 8, i % 5 ? 4 : 8); } });
  mesh(new THREE.CylinderGeometry(1, 1, .12, 64), std(0x1a1a1a, .3, .6), 0, 0, 0, G.clock).rotation.x = Math.PI / 2;
  mesh(new THREE.CircleGeometry(.92, 64), new THREE.MeshStandardMaterial({ map: face, roughness: .5 }), 0, 0, .065, G.clock);
  G.hm = new THREE.Group(); G.hm.position.z = .08; G.clock.add(G.hm); mesh(new THREE.BoxGeometry(.05, .55, .02), std(0x111), 0, .27, 0, G.hm);
  G.hh = new THREE.Group(); G.hh.position.z = .09; G.clock.add(G.hh); mesh(new THREE.BoxGeometry(.07, .38, .02), std(0x111), 0, .19, 0, G.hh);
  G.hs = new THREE.Group(); G.hs.position.z = .1; G.clock.add(G.hs); mesh(new THREE.BoxGeometry(.015, .7, .01), std(0xc81a10), 0, .28, 0, G.hs);
  // cadres + fil rouge
  G.frames = new THREE.Group(); S.add(G.frames);
  const board = mesh(new THREE.BoxGeometry(4.2, 2.6, .08), std(0x6a4a2a, .95), 0, 1.6, -.1, G.frames);
  const silTex = (kid) => labelTex(256, 320, c => { const gr = c.createLinearGradient(0, 0, 0, 320); gr.addColorStop(0, '#5a5e6a'); gr.addColorStop(1, '#22242a'); c.fillStyle = gr; c.fillRect(0, 0, 256, 320); c.fillStyle = '#0b0c10'; const s = kid ? .85 : 1; c.beginPath(); c.arc(128, 130 + (1 - s) * 40, 58 * s, 0, 7); c.fill(); c.beginPath(); c.ellipse(128, 330, 110 * s, 120 * s, 0, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(0, 0, 256, 60); });
  G.photo = [];
  for (const [x, kid] of [[-1.05, true], [1.05, false]]) { const f = new THREE.Group(); f.position.set(x, 1.6, 0); G.frames.add(f); mesh(rbox(1.25, 1.55, .06, .02), std(0xeeeae0, .5), 0, 0, 0, f); mesh(new THREE.PlaneGeometry(1.1, 1.38), new THREE.MeshStandardMaterial({ map: silTex(kid), roughness: .6 }), 0, 0, .035, f); mesh(new THREE.SphereGeometry(.05, 12, 10), std(0xd01a10, .3, .2), 0, .82, .06, f); G.photo.push(f); }
  const str = mesh(new THREE.CylinderGeometry(.012, .012, 2.1, 8), std(0xd01a10, .5, 0, { emissive: 0x700a05 }), 0, 2.42, .06, G.frames); str.rotation.z = Math.PI / 2; G.string = str;
  // mémorial : bougies
  G.memo = new THREE.Group(); S.add(G.memo); G.candles = [];
  const wax = std(0xf2ede0, .6, 0, { emissive: 0xffb060, emissiveIntensity: .08 });
  for (let i = 0; i < 17; i++) { const row = i < 9 ? 0 : 1; const n = row ? 8 : 9; const k = row ? i - 9 : i; const c = new THREE.Group(); c.position.set((k - (n - 1) / 2) * .62, 0, row ? -.75 : 0); G.memo.add(c);
    const h = .45 + ((i * 37) % 7) * .03; mesh(new THREE.CylinderGeometry(.09, .1, h, 20), wax, 0, h / 2, 0, c);
    const fl = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: 0xffb04a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); fl.scale.set(.16, .3, 1); fl.position.y = h + .1; c.add(fl);
    const halo = glow(0xff9a3a, .9, .35); halo.position.y = h + .1; c.add(halo); c.userData = { fl, halo, h }; G.candles.push(c); }
  G.memoL = [new THREE.PointLight(0xffa040, 0, 8, 1.4), new THREE.PointLight(0xffa040, 0, 8, 1.4)]; G.memoL[0].position.set(-1.5, .8, .5); G.memoL[1].position.set(1.5, .8, -.3); G.memoL.forEach(l => G.memo.add(l));
  // intro : fumée rouge
  G.smoke = []; for (let i = 0; i < 14; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.smoke, color: 0x8a0c08, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); s.userData.ph = i / 14; S.add(s); G.smoke.push(s); }
  const motes = dust(500, [-6, 6, 0, 5, -6, 4], 0xffffff, .025, 29, .5); S.add(motes);
  return { S, cam: persp(40), key, kb, rim, rim2, amb, floor, G, motes };
}

// =====================================================================================
export function buildPrison() {
  const S = new THREE.Scene(); S.background = new THREE.Color(0x010203); S.fog = new THREE.FogExp2(0x070a0e, .06);
  S.add(new THREE.HemisphereLight(0x4a5868, 0x080808, .3));
  // cellule
  const C = new THREE.Group(); S.add(C);
  const cw = std(0x8a8c84, .95, 0, { map: TEX.concrete });
  const fl = plane(6, 6, std(0x5a5c58, .8, 0, { map: TEX.concrete })); C.add(fl);
  const bw = plane(6, 3.2, cw, 0); bw.position.set(0, 1.6, -2.5); C.add(bw);
  for (const s of [-1, 1]) { const w = plane(5, 3.2, cw, 0); w.rotation.y = -s * Math.PI / 2; w.position.set(s * 2.4, 1.6, 0); C.add(w); }
  const win = mesh(new THREE.BoxGeometry(.9, .45, .1), std(0, .5, 0, { emissive: 0xfff2d8, emissiveIntensity: 3 }), .6, 2.6, -2.48, C); win.castShadow = false;
  for (let i = 0; i < 4; i++) mesh(new THREE.BoxGeometry(.04, .45, .08), std(0x222), .3 + i * .2, 2.6, -2.4, C);
  const sun = new THREE.SpotLight(0xffeccc, 60, 12, .3, .4, 1.1); sun.position.set(.6, 2.6, -2.2); sun.target.position.set(-.5, 0, 1.5); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); C.add(sun, sun.target);
  const sb = beam(.25, 1.1, 4.2, 0xfff0d0, .14); sb.position.set(.6, 2.6, -2.3); sb.rotation.x = -.95; sb.rotation.z = -.2; C.add(sb);
  mesh(rbox(.9, .3, 2.0, .03), std(0x5a5a52, .7), -1.8, .45, -1.3, C);
  const bars = new THREE.Group(); bars.position.set(0, 0, 2.4); C.add(bars);
  const barM = std(0x3a3d42, .35, .85);
  mesh(new THREE.BoxGeometry(4.8, .12, .12), barM, 0, 3.0, 0, bars); mesh(new THREE.BoxGeometry(4.8, .12, .12), barM, 0, .06, 0, bars);
  const door = new THREE.Group(); bars.add(door); C.userData.door = door;
  for (let i = 0; i < 13; i++) { const x = -2.25 + i * .375; const b = mesh(new THREE.CylinderGeometry(.03, .03, 2.95, 10), barM, x, 1.5, 0, (x > -.6 && x < 1.0) ? door : bars); }
  mesh(new THREE.BoxGeometry(1.7, .08, .08), barM, .2, 1.6, 0, door);
  const man = makeHuman({ color: 0x232328, hair: 0x6a5536 }); man.position.set(-1.4, 0, -1.2); man.rotation.y = .8; C.add(man); man.userData.pose('sit');
  // toilettes du gymnase (1994)
  const B = new THREE.Group(); B.position.x = 40; S.add(B);
  const tl = TEX.tiles.clone(); tl.needsUpdate = true; tl.repeat.set(6, 2);
  const tm = std(0xffffff, .45, 0, { map: tl });
  const bf = plane(8, 8, std(0xffffff, .4, 0, { map: TEX.tiles })); B.add(bf);
  const bb = plane(8, 3, tm, 0); bb.position.set(0, 1.5, -3); B.add(bb);
  for (const s of [-1, 1]) { const w = plane(8, 3, tm, 0); w.rotation.y = -s * Math.PI / 2; w.position.set(s * 3.5, 1.5, 0); B.add(w); }
  for (let i = 0; i < 3; i++) { mesh(new THREE.BoxGeometry(.06, 1.9, 1.5), std(0x6a7078, .5, .4), -3.4 + 1.3 + i * 1.3, 1.05, -2.2, B); mesh(new THREE.BoxGeometry(1.2, 1.7, .05), std(0x5a6068, .5, .4), -3.4 + .65 + i * 1.3, 1.05, -1.45, B); }
  for (let i = 0; i < 3; i++) { mesh(rbox(.6, .2, .45, .05), std(0xeeeee8, .2), 1.2 + i * .8, .9, -2.75, B); mesh(new THREE.BoxGeometry(.6, .8, .05), std(0xb8c8d0, .05, .9), 1.2 + i * .8, 1.8, -2.96, B); }
  const bucket = new THREE.Group(); bucket.position.set(-.5, 0, .3); B.add(bucket);
  mesh(new THREE.CylinderGeometry(.3, .26, .45, 24), std(0xe8b818, .5), 0, .25, 0, bucket); const mop = mesh(new THREE.CylinderGeometry(.02, .02, 1.6), std(0xa08a60, .6), .1, 1.0, 0, bucket); mop.rotation.z = -.25;
  const puddle = new THREE.Mesh(new THREE.CircleGeometry(.9, 32), std(0x05070a, .04, .3)); puddle.rotation.x = -Math.PI / 2; puddle.scale.set(1.7, 1, 1); puddle.position.set(.6, .01, .9); B.add(puddle);
  const metalBar = new THREE.Group(); metalBar.position.set(.7, .05, 1.0); metalBar.rotation.y = .6; B.add(metalBar);
  const mb = mesh(new THREE.CylinderGeometry(.03, .03, .51, 14), std(0xd8dde4, .12, 1), 0, 0, 0, metalBar); mb.rotation.z = Math.PI / 2;
  const glint = glow(0xffffff, .5, .9); glint.position.set(.18, .04, 0); metalBar.add(glint);
  const fl1 = mesh(new THREE.BoxGeometry(1.2, .05, .2), std(0, .5, 0, { emissive: 0xd8ffee, emissiveIntensity: 1.1 }), 0, 2.95, 0, B); fl1.castShadow = false;
  const bL = new THREE.PointLight(0xcfffe8, 16, 9, 1.3); bL.position.set(0, 2.6, .5); bL.castShadow = true; bL.shadow.mapSize.set(1024, 1024); B.add(bL);
  const motes = dust(300, [-3, 43, 0, 3, -2.5, 3], 0xffffff, .02, 31, .5); S.add(motes);
  return { S, cam: persp(44), C, B, door, man, metalBar, bL, sun, motes };
}

// =====================================================================================
export function buildCourt() {
  const S = new THREE.Scene(); S.background = new THREE.Color(0x030202); S.fog = new THREE.FogExp2(0x0e0b08, .035);
  S.add(new THREE.HemisphereLight(0x9a8a70, 0x1a120a, .7));
  const fl = plane(20, 22, std(0xffffff, .9, 0, { map: TEX.carpet })); S.add(fl);
  const pn = TEX.panel.clone(); pn.needsUpdate = true; pn.repeat.set(8, 1);
  const pm = std(0xffffff, .65, 0, { map: pn });
  const back = plane(20, 6, pm, 0); back.position.set(0, 3, -9); S.add(back);
  for (const s of [-1, 1]) { const w = plane(22, 6, pm, 0); w.rotation.y = -s * Math.PI / 2; w.position.set(s * 10, 3, 2); S.add(w); }
  const wood = std(0x4a2e18, .55, 0, { map: TEX.wood });
  mesh(rbox(6, 1.6, 1.4, .04), wood, 0, .8, -7.2, S); mesh(rbox(6.2, .1, 1.6, .02), wood, 0, 1.65, -7.2, S);
  const seal = mesh(new THREE.CircleGeometry(.9, 48), std(0xb08a3a, .35, .8), 0, 3.7, -8.95, S);
  const judge = makeHuman({ color: 0x0b0b0e }); judge.position.set(0, .35, -7.8); judge.userData.pose('sit'); S.add(judge);
  const gavel = new THREE.Group(); gavel.position.set(1.0, 1.72, -6.9); S.add(gavel);
  const gh = new THREE.Group(); gavel.add(gh); mesh(new THREE.CylinderGeometry(.07, .07, .25, 16), wood, 0, .12, 0, gh).rotation.z = Math.PI / 2; mesh(new THREE.CylinderGeometry(.015, .015, .4, 8), wood, -.2, .12, .0, gh).rotation.x = Math.PI / 2;
  // tables défense / accusation
  for (const x of [-3, 3]) { mesh(rbox(3, .08, 1.2, .02), wood, x, .78, -3.6, S); for (const dx of [-1.3, 1.3]) mesh(new THREE.BoxGeometry(.08, .78, 1), wood, x + dx, .39, -3.6, S); }
  const dahmer = makeHuman({ color: 0x2b2a2a, hair: 0x6a5536 }); dahmer.position.set(-3.4, -.05, -2.85); dahmer.rotation.y = Math.PI; dahmer.userData.pose('sit'); S.add(dahmer);
  const lawyer = makeHuman({ color: 0x15161b }); lawyer.position.set(-2.1, -.05, -2.85); lawyer.rotation.y = Math.PI; lawyer.userData.pose('sit'); S.add(lawyer);
  const pros = makeHuman({ color: 0x15161b }); pros.position.set(3.0, -.05, -2.85); pros.rotation.y = Math.PI; pros.userData.pose('sit'); S.add(pros);
  // vitre pare-balles de 2,40 m
  const glassM = new THREE.MeshPhysicalMaterial({ color: 0xcfe6ff, roughness: .04, metalness: 0, transparent: true, opacity: .2, depthWrite: false, side: THREE.DoubleSide });
  const frameM = std(0x9aa0a8, .3, .85);
  const barrier = new THREE.Group(); barrier.position.set(0, 0, -.6); S.add(barrier);
  for (let i = -4; i <= 4; i++) { const p = mesh(new THREE.BoxGeometry(2.1, 2.4, .04), glassM, i * 2.2, 1.2, 0, barrier); p.castShadow = false; p.renderOrder = 4; mesh(new THREE.BoxGeometry(.08, 2.45, .1), frameM, i * 2.2 + 1.1, 1.22, 0, barrier); }
  mesh(new THREE.BoxGeometry(20, .1, .14), frameM, 0, 2.45, 0, barrier); mesh(new THREE.BoxGeometry(20, .1, .14), frameM, 0, .05, 0, barrier);
  // public
  const pub = []; for (let row = 0; row < 3; row++) { mesh(rbox(16, .5, .5, .05), wood, 0, .45, 1.6 + row * 1.6, S); mesh(rbox(16, .9, .12, .03), wood, 0, .9, 1.9 + row * 1.6, S);
    for (let k = 0; k < 9; k++) { if ((row * 9 + k) % 3 === 1) continue; const h = makeHuman({ color: 0x141418 + ((row * 9 + k) % 4) * 0x030303 }); h.position.set(-6.5 + k * 1.6, -.05, 1.75 + row * 1.6); h.rotation.y = Math.PI; h.userData.pose('sit'); S.add(h); pub.push(h); } }
  const sister = makeHuman({ color: 0x2a1418, hair: 0x120a08 }); sister.position.set(1.2, 0, 2.2); sister.rotation.y = Math.PI; S.add(sister);
  [sister, gavel, dahmer, barrier].forEach(o => o.userData.dynamic = true); mergeStatic(S, o => o.userData.dynamic || o.isLight);
  // lumières
  for (const [x, z] of [[-4, -4], [4, -4], [0, 2]]) { const l = new THREE.SpotLight(0xffe8c8, 110, 14, .7, .7, 1.3); l.position.set(x, 5.8, z); l.target.position.set(x, 0, z); if (z === -4) { l.castShadow = true; l.shadow.mapSize.set(1024, 1024); } S.add(l, l.target); mesh(new THREE.BoxGeometry(1.2, .05, .4), std(0, .5, 0, { emissive: 0xfff0d8, emissiveIntensity: 2 }), x, 5.95, z, S).castShadow = false; }
  const redL = new THREE.PointLight(0xff1a0a, 0, 16, 1.2); redL.position.set(0, 3, 0); S.add(redL);
  const gavelL = new THREE.SpotLight(0xffe2c0, 0, 6, .35, .6, 1.2); gavelL.position.set(1.6, 3.2, -5.6); gavelL.target.position.set(1.0, 1.7, -6.9); S.add(gavelL, gavelL.target);
  const motes = dust(500, [-9, 9, 0, 6, -8, 8], 0xfff0d8, .03, 37, .45); S.add(motes);
  return { S, cam: persp(42), barrier, dahmer, sister, gavel, gh, redL, gavelL, pub, motes };
}
