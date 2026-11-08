// Vidéo « Jeffrey Dahmer » — timeline calée mot à mot sur la voix off.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { W, H, clamp, lerp, ss, seg, eOut, eIn, eIO, eSine, wob, track, V, vlerp, rng, buildTextures, TEX } from './lib.js';
import * as O from './overlay.js';

export const DUR = 139.5;
for (const f of ['900 40px Mont', '800 40px Mont', '700 40px Mont', '600 40px Mont', '800 40px Mono', '700 40px Mono']) await document.fonts.load(f);
buildTextures();
const { buildStreet, buildCorridor, buildApartment } = await import('./sets_a.js');
const { buildCrawl, buildWoods, buildRoom78, buildHotelExt, buildHotelRoom, buildStudio, buildPrison, buildCourt } = await import('./sets_b.js');

// ---------------- moteur de rendu + post-traitement ----------------
const QS0 = new URLSearchParams(location.search);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = QS0.get('sh') === 'soft' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
const QS = new URLSearchParams(location.search);
const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: +(QS.get('s') ?? 4) });
const composer = new EffectComposer(renderer, rt);
const renderPass = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera());
const BQ = +(QS0.get('bq') ?? 4); const bloom = new UnrealBloomPass(new THREE.Vector2(W / BQ, H / BQ), .8, .5, .75);
const Grade = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uVig: { value: .6 }, uGrain: { value: .05 }, uCA: { value: .002 }, uSat: { value: .9 }, uCon: { value: 1.05 },
    uTint: { value: new THREE.Vector3(1, 1, 1) }, uLift: { value: new THREE.Vector3(0, 0, 0) }, uDist: { value: 0 }, uFlash: { value: 0 }, uRed: { value: 0 }, uBlack: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime,uVig,uGrain,uCA,uSat,uCon,uDist,uFlash,uRed,uBlack; uniform vec3 uTint,uLift; varying vec2 vUv;
  float hash(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
  void main(){ vec2 uv=vUv;
    if(uDist>0.0){ float row=floor(uv.y*180.0); float n=hash(vec2(row,floor(uTime*30.0))); uv.x+=(n-.5)*.035*uDist*step(.6,hash(vec2(row*.37,floor(uTime*15.0)))) + sin(uv.y*35.0+uTime*25.0)*.006*uDist; }
    vec2 d=uv-.5; float r=length(d); float ca=uCA+uDist*.012;
    vec3 c=vec3(texture2D(tDiffuse,uv-d*ca*r*2.0).r, texture2D(tDiffuse,uv).g, texture2D(tDiffuse,uv+d*ca*r*2.0).b);
    float l=dot(c,vec3(.2126,.7152,.0722)); c=mix(vec3(l),c,uSat); c=max((c-.18)*uCon+.18,0.0); c=c*uTint+uLift;
    c*=mix(1.0,smoothstep(1.0,.28,r*1.15),uVig);
    float g=hash(uv*vec2(1080.0,1920.0)+fract(uTime*7.31)*91.0)-.5; c+=g*uGrain*(.25+l*.9);
    c=mix(c,c*vec3(1.6,.25,.2)+vec3(.12,0,0),uRed); c=mix(c,vec3(3.0),uFlash); c*=1.0-uBlack;
    gl_FragColor=vec4(c,1.0); }`
};
const grade = new ShaderPass(Grade);
composer.addPass(renderPass); composer.addPass(bloom); composer.addPass(grade); composer.addPass(new OutputPass());
const pmrem = new THREE.PMREMGenerator(renderer); const envTex = pmrem.fromScene(new RoomEnvironment(), .04).texture;

// ---------------- décors ----------------
const ST = buildStreet(), CO = buildCorridor(), AP = buildApartment(), CR = buildCrawl(), WD = buildWoods(), R78 = buildRoom78(), HX = buildHotelExt(), HR = buildHotelRoom(), SD = buildStudio(), PR = buildPrison(), CT = buildCourt();
let NM = 0; for (const set of [ST, CO, AP, CR, WD, R78, HX, HR, SD, PR, CT]) { let n = 0; set.S.traverse(o => { if (o.isMesh) n++; }); NM += n; set.nMesh = n; }
window.MESHCOUNT = [ST, CO, AP, CR, WD, R78, HX, HR, SD, PR, CT].map(s => s.nMesh);
for (const set of [ST, CO, AP, CR, WD, R78, HX, HR, SD, PR, CT]) { set.S.environment = envTex; set.S.traverse(o => { if (o.isMesh && o.material && o.material.isMeshStandardMaterial) { const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach(m => { m.envMapIntensity = m.metalness > .5 ? .55 : .1; }); } }); }

// ---------------- habillage ----------------
const A = {}; // ancres 3D (positions monde) remplies par les plans
const proj = (v) => { if (!v) return null; const p = v.clone().project(CAM); if (p.z > 1) return null; return [(p.x + 1) / 2 * W, (1 - p.y) / 2 * H]; };
let CAM = ST.cam;
const E = {
  date1: O.pill('MILWAUKEE · 22 JUILLET 1991', '#ff4a2a', 540, 230),
  cuff: O.callout('MENOTTE', 'TRACY EDWARDS · 32 ANS', '#e8ecf3', 760, 760), cuffL: O.mkLine('#ffffff', 4),
  addr: O.callout('924 N 25TH STREET', 'OXFORD APARTMENTS', '#7aa2ff', 330, 640), addrL: O.mkLine('#7aa2ff', 4),
  t213: O.title('APPARTEMENT 213', 'red', 540, 450, 104),
  ohio: O.pill('OHIO · 1964', '#ffb347', 540, 230),
  bones: O.callout("OS D'ANIMAUX", 'SOUS LA MAISON FAMILIALE', '#ffd08a', 330, 1240), bonesL: O.mkLine('#ffd08a', 4),
  fasc: O.title('FASCINÉ', 'red', 540, 450, 130),
  ohio2: O.pill('BATH, OHIO · ADOLESCENCE', '#ffb347', 540, 230),
  road: O.callout('ANIMAUX ÉCRASÉS', 'RAMASSÉS AU BORD DES ROUTES', '#ffd08a', 330, 680), roadL: O.mkLine('#ffd08a', 4),
  jars: O.callout('DISSÉQUÉS', 'DANS UNE CABANE DANS LES BOIS', '#9be36a', 700, 640), jarsL: O.mkLine('#9be36a', 4),
  bath78: O.pill('BATH, OHIO · JUIN 1978', '#ff4a2a', 540, 230),
  age18: O.title('18 ANS', 'white', 540, 450, 140),
  alone: O.callout('SEUL DANS LA MAISON', 'SES PARENTS VIENNENT DE DIVORCER', '#ffd08a', 700, 760), aloneL: O.mkLine('#ffd08a', 4),
  hicks: O.callout('STEVEN HICKS', '18 ANS · AUTO-STOPPEUR', '#e8ecf3', 720, 700), hicksL: O.mkLine('#ffffff', 4),
  first: O.title('PREMIER MEURTRE', 'red', 540, 450, 100),
  barbell: O.callout("BARRE D'HALTÈRE", '', '#ff6a50', 330, 1180, true), barbellL: O.mkLine('#ff6a50', 4),
  garden: O.callout('OS ÉPARPILLÉS', 'DERRIÈRE LA MAISON', '#cfd8ff', 700, 700), gardenL: O.mkLine('#cfd8ff', 4),
  amb: O.pill('AMBASSADOR HOTEL · MILWAUKEE · 1987', '#ff3a7a', 540, 230),
  tuomi: O.callout('STEVEN TUOMI', 'RETROUVÉ MORT DANS LE LIT', '#e8ecf3', 760, 1080), tuomiL: O.mkLine('#ffffff', 4),
  nomem: O.title('AUCUN SOUVENIR', 'red', 540, 450, 104),
  valise: O.callout('UNE VALISE', 'ACHETÉE LE JOUR MÊME', '#ffd08a', 720, 760), valiseL: O.mkLine('#ffd08a', 4),
  wa: O.pill('WEST ALLIS · CHEZ SA GRAND-MÈRE', '#ffb347', 540, 230),
  driver: O.callout('LE CHAUFFEUR DE TAXI', "L'AIDE À PORTER LA VALISE", '#f2c94c', 320, 1180), driverL: O.mkLine('#f2c94c', 4),
  m88: O.pill('MILWAUKEE · SEPTEMBRE 1988', '#ff4a2a', 540, 230),
  pills: O.callout('SOMNIFÈRES', 'DANS LA BOISSON', '#9fc8ff', 760, 1130), pillsL: O.mkLine('#9fc8ff', 4),
  boy13: O.callout('UN GARÇON DE 13 ANS', 'DROGUÉ ET AGRESSÉ', '#ff6a50', 330, 700, true),
  mois: O.title('10 MOIS', 'white', 540, 450, 150),
  work: O.callout('SORTIE AUTORISÉE LE JOUR', "POUR ALLER TRAVAILLER À L'USINE", '#ffd08a', 540, 1260), workL: O.mkLine('#ffd08a', 4),
  apt: O.pill('924 N 25TH STREET · MAI 1990', '#7aa2ff', 540, 230),
  money: O.callout("DE L'ARGENT", 'POUR POSER EN PHOTO', '#9be36a', 330, 1220), moneyL: O.mkLine('#9be36a', 4),
  drug: O.callout('SOMNIFÈRES', 'DANS LE VERRE', '#9fc8ff', 760, 1300), drugL: O.mkLine('#9fc8ff', 4),
  pola: O.callout('POLAROID', 'CHAQUE ÉTAPE PHOTOGRAPHIÉE', '#ffffff', 330, 1250), polaL: O.mkLine('#ffffff', 4),
  tub: O.callout('LA BAIGNOIRE', '', '#cfffe0', 760, 1250), tubL: O.mkLine('#cfffe0', 4),
  zomb: O.title('ZOMBIES', 'red', 540, 450, 140),
  drill: O.callout('PERCEUSE', 'CRÂNE PERCÉ, VICTIME VIVANTE', '#5fe8ff', 760, 1250), drillL: O.mkLine('#5fe8ff', 4),
  acid: O.callout('ACIDE', 'INJECTÉ DANS LE CERVEAU', '#c8ff3a', 320, 1300), acidL: O.mkLine('#c8ff3a', 4),
  m91: O.pill('25TH ST & STATE ST · 27 MAI 1991', '#ff4a2a', 540, 230),
  kon: O.callout('KONERAK', '14 ANS · DROGUÉ, LE CRÂNE PERCÉ', '#e8ecf3', 720, 680), konL: O.mkLine('#ffffff', 4),
  quote: O.quote('« Il a 19 ans, il a trop bu »', 'DAHMER AUX POLICIERS', 540, 520),
  rendu: O.title('RENDU À SON BOURREAU', 'red', 540, 450, 68),
  body: O.callout('UN AUTRE CORPS', 'TONY HUGHES · DANS LA CHAMBRE', '#ff6a50', 700, 1220, true), bodyL: O.mkLine('#ff6a50', 4),
  kid: O.callout('KONERAK · 14 ANS', 'TUÉ LE 27 MAI 1991', '#e8ecf3', 300, 1260), kidL: O.mkLine('#ffffff', 4),
  bro: O.callout('SON GRAND FRÈRE', 'AGRESSÉ EN 1988', '#ff6a50', 780, 1260, true), broL: O.mkLine('#ff6a50', 4),
  j22: O.pill('22 JUILLET 1991 · APPARTEMENT 213', '#ff4a2a', 540, 230),
  fridge: O.callout('RÉFRIGÉRATEUR', '1 TÊTE HUMAINE', '#e8f6ff', 760, 1120, true), fridgeL: O.mkLine('#e8f6ff', 4),
  freezer: O.callout('CONGÉLATEUR', '3 TÊTES', '#cfe8ff', 330, 1120, true), freezerL: O.mkLine('#cfe8ff', 4),
  skulls: O.callout('7 CRÂNES', 'DONT 3 PEINTS', '#e6dcc4', 760, 1300, true), skullsL: O.mkLine('#e6dcc4', 4),
  drum: O.callout("BARIL D'ACIDE", '3 TORSES', '#9be36a', 330, 1280, true), drumL: O.mkLine('#9be36a', 4),
  polas: O.callout('74 POLAROIDS', 'LES VICTIMES, ÉTAPE PAR ÉTAPE', '#ffffff', 540, 1300, true), polasL: O.mkLine('#ffffff', 4),
  m92: O.pill('MILWAUKEE · FÉVRIER 1992', '#ffb347', 540, 230),
  glassB: O.callout('VITRE PARE-BALLES', '2,40 M DE HAUT', '#cfe6ff', 760, 700), glassBL: O.mkLine('#cfe6ff', 4),
  folie: O.title('FOLIE ?', 'red', 540, 450, 140),
  sane: O.title("SAIN D'ESPRIT", 'white', 540, 450, 112),
  perp: O.title('15 × PERPÉTUITÉ', 'white', 540, 450, 100),
  sister: O.callout("LA SŒUR D'UNE VICTIME", "RITA ISBELL · SŒUR D'ERROL LINDSEY", '#ff6a50', 540, 700, true), sisterL: O.mkLine('#ff6a50', 4),
  satan: O.title('« SATAN ! »', 'white', 540, 450, 130),
  m94: O.pill('PRISON DE COLUMBIA · 28 NOV. 1994', '#9fb2c8', 540, 230),
  bar: O.callout('BARRE DE MÉTAL', "ARRACHÉE À UN APPAREIL DE MUSCULATION", '#e8ecf3', 540, 1250, true), barL: O.mkLine('#ffffff', 4),
  v17: O.title('17 VICTIMES', 'white', 540, 400, 118),
};
const NAMES = ['STEVEN HICKS', 'STEVEN TUOMI', 'JAMES DOXTATOR', 'RICHARD GUERRERO', 'ANTHONY SEARS', 'RAYMOND SMITH', 'EDWARD SMITH', 'ERNEST MILLER', 'DAVID THOMAS', 'CURTIS STRAUGHTER', 'ERROL LINDSEY', 'ANTHONY HUGHES', 'KONERAK SINTHASOMPHONE', 'MATT TURNER', 'JEREMIAH WEINBERGER', 'OLIVER LACY', 'JOSEPH BRADEHOFT'];
const nameEls = O.names(NAMES, 0, 0);

// ---------------- étalonnage par plan ----------------
const GR = {
  night: { exp: 1.25, sat: .85, con: 1.08, tint: [1, .97, 1.06], lift: [.002, .002, .007], vig: .6, grain: .055, ca: .0025, bloom: [.8, .55, .8] },
  warm: { exp: 1.2, sat: .82, con: 1.08, tint: [1.1, .98, .86], lift: [.004, .002, 0], vig: .7, grain: .07, ca: .002, bloom: [.6, .55, .9] },
  dusk: { exp: 1.15, sat: .85, con: 1.05, tint: [1.06, .94, 1.06], lift: [.004, 0, .008], vig: .6, grain: .06, ca: .002, bloom: [.75, .6, .8] },
  cold: { exp: 1.1, sat: .72, con: 1.1, tint: [.9, 1.0, 1.1], lift: [0, .002, .006], vig: .65, grain: .06, ca: .0025, bloom: [.6, .5, .9] },
  holo: { exp: 1.1, sat: 1.0, con: 1.1, tint: [.9, 1.04, 1.15], lift: [0, .003, .008], vig: .7, grain: .05, ca: .004, bloom: [1.0, .6, .55] },
  court: { exp: 1.3, sat: .78, con: 1.08, tint: [1.06, 1.0, .9], lift: [.003, .002, 0], vig: .62, grain: .06, ca: .002, bloom: [.55, .5, .9] },
  red: { exp: 1.1, sat: .9, con: 1.15, tint: [1.15, .9, .9], lift: [.01, 0, 0], vig: .8, grain: .09, ca: .005, bloom: [.9, .6, .75] },
  memo: { exp: 1.2, sat: .85, con: 1.05, tint: [1.08, .98, .9], lift: [.003, .002, 0], vig: .7, grain: .05, ca: .0015, bloom: [1.1, .7, .55] },
};
function applyGrade(g, t) {
  renderer.toneMappingExposure = g.exp; const u = grade.uniforms;
  u.uSat.value = g.sat; u.uCon.value = g.con; u.uTint.value.set(...g.tint); u.uLift.value.set(...g.lift); u.uVig.value = g.vig; u.uGrain.value = g.grain; u.uCA.value = g.ca; u.uTime.value = t;
  bloom.strength = g.bloom[0]; bloom.radius = g.bloom[1]; bloom.threshold = g.bloom[2];
}

// ---------------- aides de plan ----------------
function look(cam, pos, target, roll = 0) { cam.position.copy(pos); cam.lookAt(target); if (roll) cam.rotateZ(roll); }
function hand(t, s = 1) { return V(wob(t, 1) * .02 * s, wob(t + 7, 1.2) * .02 * s, 0); }
function aimBeam(b, from, to) { b.position.copy(from); const d = to.clone().sub(from).normalize(); b.quaternion.setFromUnitVectors(V(0, -1, 0), d); }
const roomsOnly = (...keep) => AP.rooms.forEach(r => r.visible = keep.includes(r));
function studioOnly(...keys) { const G = SD.G; for (const k of ['pills', 'holo', 'clock', 'frames', 'memo']) G[k].visible = keys.includes(k); G.smoke.forEach(s => s.visible = keys.includes('smoke')); }

// ---------------- plans (t0, t1, décor, fonction) ----------------
const SHOTS = [
  // 0. carton « âme sensible »
  [0, 1.8, SD, 'red', (t) => {
    studioOnly('smoke'); SD.key.intensity = 0; SD.kb.visible = false; SD.rim.intensity = 0; SD.rim2.intensity = 30;
    SD.G.smoke.forEach((s, i) => { const p = (t * .25 + s.userData.ph) % 1; s.position.set(Math.sin(i * 2.1) * 2.2 + Math.sin(t + i) * .3, .3 + p * 3.5, -1.5 + Math.cos(i) * 1.5); s.scale.setScalar(3 + p * 4); s.material.opacity = .35 * Math.sin(Math.PI * p); });
    look(SD.cam, V(0, 1.6, 6 - t * .4), V(0, 1.5, 0));
  }],
  // 1. Tracy Edwards court dans la rue
  [1.8, 8.9, ST, 'night', (t) => {
    const lt = t - 1.8; const x = -30 + 4.3 * lt; const R = ST.runner; R.visible = true; R.position.set(x, 0, 2.4); R.rotation.y = Math.PI / 2; R.userData.pose('run', lt * Math.PI * 2 * 1.55);
    const off = track([[0, V(8, 1.7, -3.2)], [3.2, V(4.2, 1.15, -1.9)], [5.3, V(3.2, 1.05, -1.6)], [7.1, V(2.6, 1.15, -1.3)]], lt);
    const tgt = R.position.clone().add(V(0, 1.15, 0)); const cuff = new THREE.Vector3(); R.userData.cuff.getWorldPosition(cuff); A.cuff = cuff;
    const lk = vlerp(tgt, cuff, ss(5.0, 6.6, lt)); look(ST.cam, R.position.clone().add(off).add(hand(t, 2)), lk);
    ST.moon.position.set(x - 25, 40, 30); ST.moon.target.position.set(x, 0, 0);
    ST.police.visible = ST.taxi.visible = false;
  }],
  // 2. la caméra monte vers la fenêtre de l'appartement 213
  [8.9, 11.28, ST, 'night', (t) => {
    const lt = t - 1.8; const x = -30 + 4.3 * lt; const R = ST.runner; R.position.set(x, 0, 2.4); R.userData.pose('run', lt * Math.PI * 2 * 1.55);
    const winW = V(ST.oxford.position.x + ST.aptWin.x, ST.aptWin.y, ST.oxford.position.z + 6.05); A.win = winW;
    const k = eIO(seg(t, 8.9, 11.28)); const startPos = V(-30 + 4.3 * 7.1 + 2.6, 1.15, 1.1);
    const p = vlerp(startPos, V(winW.x - 1.8, 3.4, 1.2), k); const lk = vlerp(V(startPos.x - 1, 1.1, 2.4), winW, eIO(seg(t, 9.1, 11.0)));
    look(ST.cam, p.add(hand(t, 1.5)), lk);
  }],
  // 3. le couloir, la porte 213 s'entrouvre
  [11.28, 15.09, CO, 'night', (t) => {
    const k = eIO(seg(t, 11.28, 15.09)); look(CO.cam, V(wob(t, .7) * .05, 1.55 + wob(t + 3) * .03, lerp(2.2, -10.6, k)), V(0, 1.25, CO.doorZ));
    CO.hinge.rotation.y = .38 * ss(13.8, 14.9, t); CO.red.intensity = 10 * ss(13.8, 14.6, t); CO.redGlow.material.opacity = .9 * ss(13.8, 14.6, t);
    CO.tubes[1].l.intensity = Math.sin(t * 37) > .6 ? 1 : 9; CO.tubes[1].e.material.emissiveIntensity = Math.sin(t * 37) > .6 ? .2 : 2.2;
    CO.cops.forEach(c => c.visible = false); CO.lights.forEach(l => { l.sl.intensity = 0; l.b.visible = false; }); CO.konerak.visible = CO.dahmer.visible = false;
  }],
  // 4. retour en arrière (rembobinage)
  [15.09, 16.95, CO, 'night', (t) => {
    const k = eIn(seg(t, 15.09, 16.6)); look(CO.cam, V(0, 1.55, lerp(-10.6, 3.5, k)), V(0, 1.25, CO.doorZ), Math.sin(t * 30) * .01);
    CO.hinge.rotation.y = .38 * (1 - k); CO.red.intensity = 10 * (1 - k);
  }],
  // 5. vide sanitaire : le père ramasse des os, l'enfant regarde
  [16.95, 22.95, CR, 'warm', (t) => {
    const F = CR.father; F.userData.pose('crouch'); const B = CR.boy; B.userData.pose('crouch'); B.userData.P.neck.rotation.x = -.1;
    const from = V(-1.85, .62, -.75), to = V(-1.0, 0, -1.65); CR.torch.position.copy(from); CR.torch.target.position.copy(to.clone().add(V(Math.sin(t * .8) * .25, 0, Math.cos(t * .6) * .15))); CR.torch.intensity = 6; aimBeam(CR.tb, from, CR.torch.target.position);
    let p, lk;
    if (t < 18.9) { const k = eSine(seg(t, 16.95, 18.9)); p = vlerp(V(-.6, .42, -1.3), V(.0, .45, -.9), k); lk = V(3.2, .42, 1.4); }
    else { const k = eSine(seg(t, 18.9, 22.95)); p = vlerp(V(.7, .55, .8), V(-.2, .38, -.3), k); lk = V(-1.1, .05, -1.55); }
    look(CR.cam, p.add(hand(t)), lk); A.bone = V(-1.0, .06, -1.55);
  }],
  // 6. adolescent au bord de la route, cabane et bocaux
  [22.95, 27.5, WD, 'dusk', (t) => {
    dusk(true); const lt = t - 22.95; const T = WD.teen; T.visible = true; T.position.set(4 + lt * 1.3, 0, 4.4); T.rotation.y = Math.PI / 2; T.userData.pose('walk', lt * 5.5);
    WD.hitch.visible = false; WD.car.visible = false; WD.car.userData.lights(false);
    const bag = new THREE.Vector3(); T.userData.P.armR.end.getWorldPosition(bag); A.bag = bag; A.jar = new THREE.Vector3(); WD.jars[2].getWorldPosition(A.jar); A.jar.y += .2;
    let p, lk; if (t < 25.9) { const k = eSine(seg(t, 22.95, 25.9)); p = V(T.position.x + lerp(5.8, 4.6, k), 1.5, 10.6); lk = T.position.clone().add(V(-1.6, 1.1, -1.2)); }
    else { const k = eIO(seg(t, 25.9, 27.5)); p = vlerp(V(9.5, 1.3, 7.5), V(15.2, 1.5, -9.3), k); lk = vlerp(V(8, 1.0, 4.4), V(18.3, 1.25, -14.6), k); }
    look(WD.cam, p.add(hand(t)), lk); WD.moon.target.position.set(10, 0, 0);
  }],
  // 7. la maison isolée, une seule fenêtre allumée
  [27.5, 31.55, WD, 'night', (t) => {
    dusk(false); WD.teen.visible = false; WD.hitch.visible = false; WD.car.visible = false;
    const k = eSine(seg(t, 27.5, 31.55)); look(WD.cam, vlerp(V(2, 2.4, 9), V(-11, 4.2, -13), k).add(hand(t)), V(-21.5, 4.2, -30));
    A.houseWin = V(-23.5, 4.0, -27.9); WD.moon.target.position.set(-20, 0, -30);
  }],
  // 8. une voiture s'arrête devant l'auto-stoppeur
  [31.55, 34.42, WD, 'night', (t) => {
    dusk(false); const lt = t - 31.55; const Hh = WD.hitch; Hh.visible = true; Hh.position.set(-3.8, 0, 4.7); Hh.rotation.y = -Math.PI / 2 - .35; Hh.userData.pose('thumb', t);
    const C = WD.car; C.visible = true; C.userData.lights(true); const cx = lerp(-48, -7.2, eOut(seg(lt, 0, 2.7))); C.position.set(cx, 0, 2.2); C.rotation.y = 0;
    look(WD.cam, V(2.5, 1.3, 9.5).add(hand(t)), vlerp(V(-12, 1.2, 2.5), V(-4.5, 1.4, 4.2), eSine(seg(lt, 0, 2.8))));
    A.hitch = Hh.position.clone().add(V(0, 1.85, 0)); WD.moon.target.position.set(-5, 0, 0);
  }],
  // 9. l'intérieur : l'haltère, éclair rouge
  [34.42, 39.98, R78, 'warm', (t) => {
    const k = eSine(seg(t, 34.42, 39.98)); look(R78.cam, vlerp(V(2.7, 1.8, 2.8), V(1.5, 1.1, 1.6), k).add(hand(t, 1.3)), V(.2, .25, -.2));
    const hit = t >= 36.44 ? Math.exp(-(t - 36.44) * 3) : 0; R78.redL.intensity = 40 * hit + 9 * ss(36.44, 37, t) * (1 - ss(39, 39.9, t));
    R78.lampL.intensity = 12 * (1 - ss(37.9, 39.6, t)) * (Math.sin(t * 23) > .85 && t > 36.4 ? .3 : 1); R78.keyL.intensity = 18 * (1 - ss(38.4, 39.8, t));
    A.bar = V(.2, .2, -.2);
  }],
  // 10. le jardin : os éparpillés au clair de lune
  [39.98, 42.42, WD, 'night', (t) => {
    dusk(false); WD.hitch.visible = false; WD.car.visible = false; WD.car.userData.lights(false); WD.boneL.intensity = 12;
    const k = eSine(seg(t, 39.98, 42.42)); look(WD.cam, vlerp(V(-7.5, 1.4, -41), V(-9.6, .75, -43.6), k).add(hand(t)), V(-12.4, 0, -46.2));
    A.gbone = V(-12, .05, -46); WD.moon.target.position.set(-12, 0, -46);
  }],
  // 11. neuf ans de silence
  [42.42, 43.72, SD, 'cold', (t) => {
    studioOnly(); SD.key.intensity = 0; SD.kb.visible = false; SD.rim.intensity = 4; SD.rim2.intensity = 0;
    look(SD.cam, V(0, 1.4, 5 - (t - 42.4) * .3), V(0, 1.2, 0));
  }],
  // 12. l'Ambassador Hotel et son néon
  [43.72, 46.02, HX, 'night', (t) => {
    const k = eSine(seg(t, 43.72, 46.02)); look(HX.cam, vlerp(V(15, 1.7, 17), V(13, 2.6, 13.5), k).add(hand(t)), vlerp(V(3, 6, -4), V(7.5, 19, -6), eIO(seg(t, 43.8, 46)))); HX.sign.children.forEach(c => { if (c.isSprite) c.material.opacity = .32 + .06 * Math.sin(t * 40) * (Math.sin(t * 3) > .9 ? 1 : 0); });
  }],
  // 13. la chambre d'hôtel au petit matin
  [46.02, 51.7, HR, 'cold', (t) => {
    HR.man.userData.pose('sit'); HR.man.userData.P.neck.rotation.x = .55; HR.man.userData.P.armL.up.rotation.x = -1.1; HR.man.userData.P.armR.up.rotation.x = -1.1; HR.man.userData.P.armL.lo.rotation.x = -1.6; HR.man.userData.P.armR.lo.rotation.x = -1.6;
    const k = eSine(seg(t, 46.02, 51.7)); look(HR.cam, vlerp(V(2.4, 1.5, 2.5), V(1.2, 1.25, 1.35), k).add(hand(t)), V(-.4, .7, -.9)); HR.suitL.intensity = 0;
    A.lump = V(.65, .85, -1.3);
  }],
  // 14. la valise
  [51.7, 53.82, HR, 'warm', (t) => {
    HR.suitL.intensity = 40; const a = lerp(1.25, .35, eSine(seg(t, 51.7, 53.82))); const c = V(-2.0, .45, .9);
    look(HR.cam, c.clone().add(V(Math.sin(a) * 2.7, .95, Math.cos(a) * 2.7)), c); A.case = V(-2.0, .95, .9);
  }],
  // 15. le taxi dans la nuit
  [53.82, 55.72, ST, 'night', (t) => {
    ST.runner.visible = false; const T = ST.taxi; T.visible = true; T.userData.lights(true); const lt = t - 53.82; T.position.set(30 + lt * 12, 0, 2.6); T.rotation.y = 0; if (T.userData.lid) T.userData.lid.rotation.z = 0;
    ST.driver.visible = ST.dahmer.visible = false; ST.suitcase.visible = false;
    look(ST.cam, V(T.position.x - 1.5 + lt * .5, 1.35, 7.8).add(hand(t)), T.position.clone().add(V(.8, .8, 0)));
    ST.moon.target.position.set(T.position.x, 0, 0);
  }],
  // 16. le coffre, le chauffeur aide à porter la valise
  [55.72, 58.12, ST, 'night', (t) => {
    const T = ST.taxi; T.visible = true; T.userData.lights(true); T.position.set(78, 0, 2.8); T.rotation.y = 0; T.userData.lid.rotation.z = 1.3;
    const lt = t - 55.72; const lift = ss(.4, 1.6, lt);
    const D = ST.driver, M = ST.dahmer; D.visible = M.visible = true; D.position.set(75.0, 0, 2.1); D.rotation.y = Math.PI / 2 - .3; M.position.set(75.2, 0, 3.6); M.rotation.y = Math.PI / 2 + .4;
    D.userData.pose('lift', lt * 2); M.userData.pose('lift', lt * 2);
    const sc = ST.suitcase; sc.visible = true; sc.position.set(76.0, lerp(.75, .95, lift), 2.85); sc.rotation.set(0, Math.PI / 2, 0);
    look(ST.cam, vlerp(V(71.2, 1.9, 8.6), V(72.2, 1.6, 7.6), eSine(seg(t, 55.72, 58.12))).add(hand(t)), V(75.6, 1.0, 2.9));
    A.driver = D.position.clone().add(V(0, 1.6, 0)); ST.moon.target.position.set(76, 0, 3);
  }],
  // 17. somnifères dans le verre
  [58.12, 61.6, SD, 'cold', (t) => {
    studioOnly('pills'); SD.key.intensity = 70; SD.kb.visible = true; SD.rim.intensity = 14; SD.rim2.intensity = 0; SD.key.target.position.set(0, 0, 0);
    const G = SD.G; G.pills.position.set(0, 0, 0); G.pills.scale.setScalar(1);
    G.pill.forEach((p, i) => { const t0 = 59.45 + i * .14; const k = seg(t, t0, t0 + .5); p.position.set(Math.sin(i * 2.4) * .18, lerp(2.3, .2 + i * .04, eIn(k)), Math.cos(i * 1.7) * .12); p.rotation.set(t * 3 + i, t * 2, i); p.visible = t > t0 - .05; });
    G.bub.userData.update(t * 2); G.bub.visible = t > 59.6;
    look(SD.cam, vlerp(V(.45, 1.35, 3.4), V(.2, 1.05, 2.55), eSine(seg(t, 58.12, 61.6))).add(hand(t, .6)), V(0, .7, 0)); A.glass = V(.15, .7, 0);
  }],
  // 18. 10 mois de prison, sortie la journée
  [61.6, 65.6, PR, 'cold', (t) => {
    PR.C.visible = true; PR.B.visible = false; PR.door.position.x = -1.45 * ss(63.55, 64.5, t); PR.sun.intensity = 60 + 60 * ss(63.6, 64.6, t);
    const k = eSine(seg(t, 61.6, 65.6)); look(PR.cam, vlerp(V(.6, 1.5, 6.2), V(.4, 1.42, 4.6), k).add(hand(t)), V(-.6, 1.0, -1));
    A.door = V(.2, 1.6, 2.4);
  }],
  // 19. vol vers la fenêtre de l'appartement 213
  [65.6, 68.65, ST, 'night', (t) => {
    ST.runner.visible = false; ST.taxi.visible = false; ST.driver.visible = ST.dahmer.visible = false; ST.suitcase.visible = false;
    const winW = V(ST.oxford.position.x + ST.aptWin.x, ST.aptWin.y, ST.oxford.position.z + 6.05);
    const k = eIn(seg(t, 65.6, 68.65)) * .7 + eSine(seg(t, 65.6, 68.65)) * .3; look(ST.cam, vlerp(V(2.5, 1.8, 8.5), V(winW.x, winW.y, winW.z + .6), k), vlerp(V(4, 3.5, -6), winW, eOut(seg(t, 65.6, 67))));
    ST.moon.target.position.set(5, 0, -6);
  }],
  // 20. le salon : argent, verre drogué
  [68.65, 73.5, AP, 'night', (t) => {
    roomsOnly(AP.LV); livingLights(t, 1); AP.torches.forEach(x => { x.sl.intensity = 0; x.b.visible = false; });
    const k = eSine(seg(t, 68.65, 73.5)); look(AP.cam, vlerp(V(1.3, 1.45, 2.3), V(.5, 1.15, -.4), k).add(hand(t)), vlerp(V(0, .85, -2.0), V(.05, .8, -2.0), k));
    AP.pills.forEach((p, i) => { const t0 = 71.5 + i * .1; const kk = seg(t, t0, t0 + .35); p.visible = t > t0 - .02 && t < 73.5; p.position.set(.35 + (i - 1.5) * .015, lerp(1.25, .86, eIn(kk)), -1.95); p.rotation.set(t * 4 + i, t * 3, 0); });
    A.bills = V(-.4, .8, -2.0); A.glass2 = V(.35, .92, -1.95);
  }],
  // 21. flash du Polaroid
  [73.5, 75.22, AP, 'night', (t) => {
    roomsOnly(AP.LV); livingLights(t, 1);
    const fl = [73.96, 74.36, 74.58].reduce((m, f) => Math.max(m, t >= f ? Math.exp(-(t - f) * 14) : 0), 0); AP.flashL.intensity = 35 * fl; AP.flashGl.material.opacity = fl;
    AP.polas.forEach((p, i) => { const t0 = 73.98 + i * .09; const kk = seg(t, t0, t0 + .9); p.visible = t > t0; p.position.set(.2 + Math.sin(i * 1.7) * .8, lerp(1.8, .02, eSine(kk)), -1.0 + Math.cos(i * 2.3) * .6); p.rotation.set(-Math.PI / 2 + (1 - kk) * Math.sin(t * 6 + i) * .8, i, (1 - kk) * Math.cos(t * 5 + i) * .6); });
    look(AP.cam, vlerp(V(1.75, 1.15, -.9), V(1.5, 1.05, -1.35), eSine(seg(t, 73.5, 75.22))).add(hand(t)), V(.85, .85, -2.1)); A.pcam = V(.85, .95, -2.1); fx.flash = fl * .2;
  }],
  // 22. la baignoire
  [75.22, 77.11, AP, 'cold', (t) => {
    roomsOnly(AP.BA); const f = Math.sin(t * 29) > .75 ? .25 : 1; AP.baL.intensity = 4 * f; AP.fluo.material.emissiveIntensity = 1.0 * f;
    look(AP.cam, vlerp(V(90, 1.75, 1.9), V(90.1, 1.45, .95), eSine(seg(t, 75.22, 77.11))).add(hand(t)), V(90, .35, -1.3)); A.tub = V(90.5, .55, -1.3);
  }],
  // 23. « zombies » : crâne holographique
  [77.11, 83.86, SD, 'holo', (t) => {
    studioOnly('holo'); SD.key.intensity = 0; SD.kb.visible = false; SD.rim.intensity = 18; SD.rim2.intensity = 0;
    const G = SD.G; G.holo.position.set(0, 1.35, 0); G.skull.rotation.y = .4 + (t - 77.1) * .12; G.skull.scale.setScalar(.72);
    G.scan.position.y = Math.sin(t * 2.2) * .55; G.ring.rotation.z = t; G.ring.scale.setScalar(1 + .05 * Math.sin(t * 3));
    const dk = eOut(seg(t, 78.8, 79.9)); G.drill.position.copy(vlerp(V(2.4, .25, .6), V(.62, .2, .18), dk)); G.drill.lookAt(V(0, .15, 0).add(G.holo.position)); G.drill.children[2].rotation.y = t * 40;
    const sk = eOut(seg(t, 80.95, 81.9)); G.syr.position.copy(vlerp(V(-2.5, .5, .5), V(-.82, .32, .15), sk)); G.syr.rotation.set(0, -.15, -.25);
    const a = .35 + (t - 77.1) * .06; look(SD.cam, V(Math.sin(a) * 3.7, 1.6 + Math.sin(t * .5) * .05, Math.cos(a) * 3.7), V(0, 1.3, 0));
    A.drill = G.drill.localToWorld(V(0, 0, -.2)); A.syr = G.syr.localToWorld(V(-.55, 0, 0));
  }],
  // 24. une assiette sous la lampe
  [83.86, 86.3, AP, 'warm', (t) => {
    roomsOnly(AP.KT); AP.pendL.intensity = 6; AP.fLight.intensity = 0; AP.zLight.intensity = 0; AP.fGlow.material.opacity = 0; AP.fHinge.rotation.y = 0; AP.zHinge.rotation.y = 0;
    look(AP.cam, vlerp(V(32.5, 1.65, 2.4), V(31.55, 1.2, 1.25), eSine(seg(t, 83.86, 86.3))).add(hand(t)), V(30.8, .8, .4));
  }],
  // 25. Konerak dans la rue
  [86.3, 92.82, ST, 'night', (t) => {
    stCast('konerak'); const lt = t - 86.3; const K = ST.konerak; K.position.set(lerp(1.5, -5.5, lt / 6.5), 0, 5.4 + Math.sin(lt) * .25); K.rotation.y = -Math.PI / 2 + Math.sin(lt * 1.3) * .3; K.userData.pose('stagger', lt * 3.2);
    look(ST.cam, vlerp(V(5.5, 1.5, 10.6), V(.5, 1.4, 10.4), eSine(seg(t, 86.3, 92.82))).add(hand(t)), K.position.clone().add(V(-.6, 1.0, 0)));
    A.kon = K.position.clone().add(V(0, 1.6, 0)); ST.moon.target.position.set(-10, 0, 0); ST.police.visible = false;
  }],
  // 26. la police arrive
  [92.82, 94.12, ST, 'night', (t) => {
    stCast('konerak', 'police'); const P = ST.police; const k = eOut(seg(t, 92.82, 94.0)); P.position.set(lerp(-46, -17.5, k), 0, -2.2); P.rotation.y = 0; P.userData.flash(t); P.userData.lights(true);
    const K = ST.konerak; K.position.set(-6.0, 0, 5.2); K.userData.pose('stagger', t * 3);
    look(ST.cam, V(-3.5, 1.0, 8.8).add(hand(t)), V(-15, 1.1, 1));
  }],
  // 27. Dahmer explique aux policiers
  [94.12, 97.0, ST, 'night', (t) => {
    stCast('konerak', 'police', 'cops', 'dahmer'); const P = ST.police; P.position.set(-17.5, 0, -2.2); P.userData.flash(t); P.userData.lights(true);
    const [c1, c2] = ST.cops; c1.position.set(-14.6, 0, 3.5); c1.rotation.y = .9; c2.position.set(-13.4, 0, 4.7); c2.rotation.y = .3; c1.userData.pose('stand', t); c2.userData.pose('stand', t + 1);
    const M = ST.dahmer; M.position.set(-12.3, 0, 2.9); M.rotation.y = -2.3; M.userData.pose('talk', t * 2);
    const K = ST.konerak; K.position.set(-12.9, 0, 1.9); K.rotation.y = -1.8; K.userData.pose('stagger', t * 2, .5);
    look(ST.cam, vlerp(V(-8.6, 1.7, 8.2), V(-9.4, 1.6, 7.4), eSine(seg(t, 94.12, 97))).add(hand(t)), V(-13.2, 1.35, 3.2));
  }],
  // 28. ramené à l'appartement par le couloir
  [97.0, 99.15, CO, 'night', (t) => {
    const lt = t - 97; const z0 = lerp(-.5, -8.5, lt / 2.15); CO.cops.forEach((c, i) => { c.visible = true; c.position.set(i ? .55 : -.6, 0, z0 + 1.2 + i * .4); c.rotation.y = Math.PI; c.userData.pose('walk', lt * 5 + i); });
    CO.dahmer.visible = true; CO.dahmer.position.set(.1, 0, z0 - .2); CO.dahmer.rotation.y = Math.PI; CO.dahmer.userData.pose('walk', lt * 5 + 2);
    CO.konerak.visible = true; CO.konerak.position.set(-.2, 0, z0 - .9); CO.konerak.rotation.y = Math.PI; CO.konerak.userData.pose('stagger', lt * 4);
    CO.lights.forEach(l => { l.sl.intensity = 0; l.b.visible = false; }); CO.hinge.rotation.y = .5; CO.red.intensity = 4;
    look(CO.cam, V(wob(t) * .05, 1.95, z0 + 6.2), V(0, 1.2, z0 - 3));
  }],
  // 29. un autre corps dans la chambre
  [99.15, 101.0, AP, 'red', (t) => {
    roomsOnly(AP.BR); AP.lump.visible = true; AP.cabL.intensity = 0; AP.fumes.forEach(f => f.material.opacity = 0); AP.bedPolas.forEach(p => p.visible = false);
    look(AP.cam, vlerp(V(61.6, 1.7, 1.9), V(60.9, 1.35, 1.0), eSine(seg(t, 99.15, 101))).add(hand(t)), V(59.1, .55, -.6)); A.lump2 = V(59.1, .8, -.5);
  }],
  // 30. trente minutes
  [101.0, 104.15, SD, 'cold', (t) => {
    studioOnly('clock'); SD.key.intensity = 50; SD.kb.visible = true; SD.rim.intensity = 10; SD.rim2.intensity = 10 * ss(102, 103, t);
    const G = SD.G; G.clock.position.set(0, 1.6, 0); const k = eIn(seg(t, 101.0, 102.95)); G.hm.rotation.z = -Math.PI * k * 1.0; G.hh.rotation.z = -Math.PI / 12 * k - 1.2; G.hs.rotation.z = -Math.PI * 2 * k * 30;
    look(SD.cam, vlerp(V(0, 1.75, 6.2), V(0, 1.7, 5.0), eIn(seg(t, 101, 103))), V(0, 1.35, 0));
  }],
  // 31. deux frères
  [104.15, 107.62, SD, 'warm', (t) => {
    studioOnly('frames'); SD.key.intensity = 22; SD.kb.visible = false; SD.rim.intensity = 6; SD.rim2.intensity = 0; SD.key.target.position.set(0, 1.6, 0);
    SD.G.frames.position.set(0, 0, 0); look(SD.cam, vlerp(V(.3, 1.7, 6.2), V(0, 1.6, 5.2), eSine(seg(t, 104.15, 107.62))).add(hand(t, .5)), V(0, 1.6, 0));
    A.f1 = V(-1.05, 1.3, .1); A.f2 = V(1.05, 1.3, .1);
  }],
  // 32. retour au 22 juillet : la police entre
  [107.62, 109.22, CO, 'night', (t) => {
    CO.konerak.visible = CO.dahmer.visible = false; CO.hinge.rotation.y = 1.2; CO.red.intensity = 0; CO.redGlow.material.opacity = 0;
    CO.cops.forEach((c, i) => { c.visible = true; c.position.set(i ? .5 : -.5, 0, CO.doorZ + 2.2 + i * .5); c.rotation.y = Math.PI; c.userData.pose('stand', t); c.userData.P.armR.up.rotation.x = -1.3; });
    CO.lights.forEach((l, i) => { const from = V(i ? .62 : -.62, 1.35, CO.doorZ + 1.6 + i * .5), to = V(Math.sin(t * 2 + i) * .6, .6, CO.doorZ - 3); l.sl.position.copy(from); l.sl.target.position.copy(to); l.sl.intensity = 9; l.b.visible = true; aimBeam(l.b, from, to); });
    look(CO.cam, V(.25, 1.95, CO.doorZ + 7.2 - (t - 107.6) * .7), V(0, 1.1, CO.doorZ - 2));
  }],
  // 33. le réfrigérateur
  [109.22, 111.22, AP, 'cold', (t) => {
    roomsOnly(AP.KT); AP.pendL.intensity = 0; const k = eOut(seg(t, 109.25, 110.0)); AP.fHinge.rotation.y = 1.5 * k; AP.fLight.intensity = 16 * k; AP.fGlow.material.opacity = .3 * k; AP.inner.material.emissiveIntensity = .55 * k;
    AP.zHinge.rotation.y = 0; AP.zLight.intensity = 0; torches(t, V(29.3, 1.5, .8), V(28.4, 1.0, -2));
    look(AP.cam, vlerp(V(30.4, 1.55, 1.8), V(29.85, 1.4, 1.0), eSine(seg(t, 109.22, 111.22))).add(hand(t)), V(28.5, 1.0, -2.0)); A.fr = V(28.4, 1.05, -1.85);
  }],
  // 34. le congélateur
  [111.22, 113.22, AP, 'cold', (t) => {
    roomsOnly(AP.KT); AP.fHinge.rotation.y = 1.5; AP.fLight.intensity = 6; AP.fGlow.material.opacity = .15; const k = eOut(seg(t, 111.25, 112.0)); AP.zHinge.rotation.y = -1.5 * k; AP.zLight.intensity = 16 * k;
    AP.frost.forEach((s, i) => { const p = (t * .3 + i / 8) % 1; s.position.set(-.55 + (i % 4 - 1.5) * .2 + p * .3, .5 + (i >> 2) * .6 + p * .3, -1.6 + p * .8); s.material.opacity = .25 * k * Math.sin(Math.PI * p); });
    torches(t, V(30.4, 1.5, .9), V(29.45, 1.0, -2));
    look(AP.cam, vlerp(V(31.3, 1.55, 1.8), V(30.8, 1.4, 1.0), eSine(seg(t, 111.22, 113.22))).add(hand(t)), V(29.5, 1.0, -2.0)); A.fz = V(29.45, 1.05, -1.85);
  }],
  // 35. sept crânes
  [113.22, 115.12, AP, 'cold', (t) => {
    roomsOnly(AP.BR); AP.lump.visible = false; AP.cabL.intensity = 1.2; torches(t, V(61.3, 1.6, .9), V(60.9, 1.1, -2.45));
    look(AP.cam, vlerp(V(61.2, 1.5, .9), V(61.0, 1.38, .2), eSine(seg(t, 113.22, 115.12))).add(hand(t)), V(60.9, 1.12, -2.45)); A.sk = V(60.95, 1.5, -2.35);
  }],
  // 36. le baril d'acide
  [115.12, 117.4, AP, 'cold', (t) => {
    roomsOnly(AP.BR); AP.cabL.intensity = 0; torches(t, V(63.8, 1.6, .5), V(62.5, .9, -2));
    AP.fumes.forEach((s, i) => { const p = (t * .25 + s.userData.ph) % 1; s.position.set(2.5 + Math.sin(i * 2.1 + t) * .2, 1.8 + p * 1.0, -2.0 + Math.cos(i) * .2); s.scale.setScalar(.6 + p * 1.2); s.material.opacity = .35 * Math.sin(Math.PI * p); });
    look(AP.cam, vlerp(V(64.5, 1.75, 1.6), V(63.9, 1.5, .8), eSine(seg(t, 115.12, 117.4))).add(hand(t)), V(62.5, 1.0, -2.0)); A.drum = V(62.5, 1.85, -2.0);
  }],
  // 37. des dizaines de Polaroids
  [117.4, 119.32, AP, 'cold', (t) => {
    roomsOnly(AP.BR); AP.fumes.forEach(f => f.material.opacity = 0); torches(t, V(61.2, 1.8, 2.0), V(60.4, 0, .6), 1.4);
    AP.bedPolas.forEach((p, i) => { const r = rng(i + 90); const t0 = 117.42 + r() * .5; const kk = eOut(seg(t, t0, t0 + .45)); p.visible = t > t0; p.position.set(-.4 + r() * 1.9, .01 + i * .0005, -.1 + r() * 1.5); p.rotation.set(-Math.PI / 2, 0, r() * 6 + (1 - kk) * 2); p.scale.setScalar(.48 * lerp(1.6, 1, kk)); });
    look(AP.cam, vlerp(V(60.7, 1.75, 2.0), V(60.55, 1.4, 1.5), eSine(seg(t, 117.4, 119.32))), V(60.5, 0, .5)); A.pl = V(60.5, .05, .6);
  }],
  // 38. le tribunal, la vitre pare-balles
  [119.32, 123.95, CT, 'court', (t) => {
    look(CT.cam, vlerp(V(3.0, 1.75, 5.0), V(1.4, 1.6, 2.6), eSine(seg(t, 119.32, 123.95))).add(hand(t)), V(-3.0, 1.1, -2.8)); CT.redL.intensity = 0; CT.gh.rotation.z = -.8; CT.gavelL.intensity = 0;
    CT.sister.position.set(1.2, 0, 2.2); CT.sister.userData.pose('stand', t); A.glassTop = V(.9, 2.45, -.6);
  }],
  // 39. le marteau du juge
  [123.95, 125.35, CT, 'court', (t) => {
    const hit = t < 124.21 ? -.8 * eIO(seg(t, 123.95, 124.2)) - .0 : 0; CT.gavelL.intensity = 45; CT.gh.rotation.z = t < 124.21 ? -.8 + .8 * eIn(seg(t, 124.0, 124.21)) : -.15 * Math.exp(-(t - 124.21) * 8) * Math.sin((t - 124.21) * 40);
    look(CT.cam, V(2.05 + wob(t) * .01, 2.05, -5.75), V(1.0, 1.78, -6.9));
  }],
  // 40. la sœur d'une victime se jette sur lui
  [125.35, 128.95, CT, 'court', (t) => {
    CT.gh.rotation.z = 0; CT.gavelL.intensity = 0; const S2 = CT.sister; const k = seg(t, 126.4, 127.7);
    S2.position.set(1.2, 0, lerp(2.2, .45, eOut(k))); S2.rotation.y = Math.PI; if (t < 126.4) S2.userData.pose('stand', t); else if (t < 127.5) S2.userData.pose('run', t * 9); else S2.userData.pose('lunge', t, 1);
    const hit = t >= 127.89 ? Math.exp(-(t - 127.89) * 2.5) : 0; CT.redL.intensity = 50 * hit; fx.red = .45 * hit;
    look(CT.cam, vlerp(V(6.8, 2.3, 3.2), V(5.4, 2.0, 2.3), eSine(seg(t, 125.35, 128.95))).add(hand(t, 1 + hit * 4)), V(-.4, 1.25, -.5)); A.sis = S2.position.clone().add(V(0, 1.85, 0));
  }],
  // 41. prison, 1994
  [128.95, 132.38, PR, 'cold', (t) => {
    PR.C.visible = false; PR.B.visible = true; const f = Math.sin(t * 21) > .8 ? .4 : 1; PR.bL.intensity = 6 * f;
    look(PR.cam, vlerp(V(42.6, 1.7, 3.4), V(41.6, 1.15, 2.25), eSine(seg(t, 128.95, 132.38))).add(hand(t)), V(40.7, .1, 1.0)); A.mbar = V(40.75, .1, 1.05);
  }],
  // 42. mémorial
  [132.38, DUR + 1, SD, 'memo', (t) => {
    studioOnly('memo'); SD.key.intensity = 8; SD.kb.visible = false; SD.rim.intensity = 3; SD.rim2.intensity = 0; SD.G.memo.position.set(0, 0, 0);
    SD.G.candles.forEach((c, i) => { const on = ss(132.45 + i * .085, 132.75 + i * .085, t); const fl = .85 + .15 * Math.sin(t * 13 + i * 2.1) * Math.sin(t * 7.3 + i); c.userData.fl.material.opacity = on * fl; c.userData.halo.material.opacity = .35 * on * fl; c.userData.fl.scale.set(.16, .3 * fl, 1); });
    const on = ss(132.4, 134, t); SD.G.memoL.forEach((l, i) => l.intensity = 9 * on * (.9 + .1 * Math.sin(t * 11 + i)));
    look(SD.cam, vlerp(V(0, 1.15, 4.8), V(0, 1.55, 3.7), eSine(seg(t, 132.38, DUR))), V(0, .35, -.3));
  }],
];
const fx = { flash: 0, red: 0 };
function dusk(on) {
  WD.S.background.set(on ? 0x2a2140 : 0x07091a); WD.S.fog.color.set(on ? 0x3a2b48 : 0x0d1124); WD.S.fog.density = on ? .02 : .026; WD.hemi.intensity = on ? .9 : .45; WD.hemi.color.set(on ? 0x8a6aa0 : 0x4a5590); WD.moon.intensity = on ? .25 : .7;
  WD.wins.forEach((w, i) => { }); WD.boneL.intensity = 0;
}
function livingLights(t, on) { AP.LVlights.blueL.intensity = 14 * on; AP.LVlights.aqL.intensity = 10 * on; AP.LVlights.tvL.intensity = (2 + 1.5 * Math.sin(t * 17) * Math.sin(t * 5.3)) * on; }
function torches(t, base, aim, I = 5) { AP.torches.forEach((x, i) => { const from = base.clone().add(V(i ? 1.0 : -.9, .45, i ? .2 : -.1)); const to = aim.clone().add(V(Math.sin(t * 1.7 + i * 2) * .35, Math.cos(t * 1.3 + i) * .15, 0)); x.sl.position.copy(from); x.sl.target.position.copy(to); x.sl.intensity = I; x.b.visible = true; aimBeam(x.b, from, to); }); }
function stCast(...on) { ST.runner.visible = false; ST.taxi.visible = false; ST.suitcase.visible = false; ST.driver.visible = false; ST.konerak.visible = on.includes('konerak'); ST.police.visible = on.includes('police'); ST.dahmer.visible = on.includes('dahmer'); ST.cops.forEach(c => c.visible = on.includes('cops')); }

// ---------------- habillage dans le temps ----------------
function overlay(t) {
  const P = proj;
  // carton
  O.pop(O.warn, t, 0.04, 1.78, { dur: .3, from: .8, glitch: 1.2, fade: .12 });
  O.pop(E.date1, t, 1.95, 8.85);
  O.anchored(E.cuff, E.cuffL, t, 7.1, 8.88, A.cuff && t < 8.9 ? P(A.cuff) : null, [760, 760]);
  O.anchored(E.addr, E.addrL, t, 9.7, 11.25, t < 11.28 ? P(A.win) : null, [330, 640]);
  O.pop(E.t213, t, 10.5, 14.8, { glitch: .8 });
  O.setYears(t, 15.25, 16.95, 1991, 1964, 'RETOUR EN ARRIÈRE');
  O.pop(E.ohio, t, 17.0, 22.9);
  O.anchored(E.bones, E.bonesL, t, 20.3, 22.9, t < 22.95 ? P(A.bone) : null, [330, 1240]);
  O.pop(E.fasc, t, 22.15, 23.6, { glitch: 1 });
  O.pop(E.ohio2, t, 23.1, 27.45);
  O.anchored(E.road, E.roadL, t, 24.5, 25.95, t > 22.95 && t < 25.95 ? P(A.bag) : null, [330, 680]);
  O.anchored(E.jars, E.jarsL, t, 26.3, 27.45, t > 25.9 && t < 27.5 ? P(A.jar) : null, [700, 640]);
  O.pop(E.bath78, t, 27.65, 34.3);
  O.pop(E.age18, t, 29.7, 31.5);
  O.anchored(E.alone, E.aloneL, t, 30.45, 31.5, t > 27.5 && t < 31.55 ? P(A.houseWin) : null, [700, 760]);
  O.anchored(E.hicks, E.hicksL, t, 32.8, 34.38, t > 31.55 && t < 34.42 ? P(A.hitch) : null, [720, 700]);
  O.pop(E.first, t, 36.42, 39.95, { glitch: 1.2 });
  O.anchored(E.barbell, E.barbellL, t, 37.05, 39.2, t > 34.42 && t < 39.98 ? P(A.bar) : null, [330, 1180]);
  O.anchored(E.garden, E.gardenL, t, 40.15, 42.38, t > 39.98 && t < 42.42 ? P(A.gbone) : null, [700, 700]);
  O.setYears(t, 42.45, 43.72, 1978, 1987, '9 ANS DE SILENCE', x => x);
  O.pop(E.amb, t, 43.75, 51.6);
  O.anchored(E.tuomi, E.tuomiL, t, 47.95, 50.35, t > 46.02 && t < 51.7 ? P(A.lump) : null, [760, 1080]);
  O.pop(E.nomem, t, 50.4, 51.75, { glitch: 1.4 });
  O.anchored(E.valise, E.valiseL, t, 52.35, 53.8, t > 51.7 && t < 53.82 ? P(A.case) : null, [720, 760]);
  O.pop(E.wa, t, 53.9, 58.05);
  O.anchored(E.driver, E.driverL, t, 55.85, 58.05, t > 55.72 && t < 58.12 ? P(A.driver) : null, [320, 1180]);
  O.pop(E.m88, t, 58.2, 61.55);
  O.anchored(E.pills, E.pillsL, t, 59.5, 61.55, t > 58.12 && t < 61.6 ? P(A.glass) : null, [760, 1130]);
  O.pop(E.boy13, t, 60.3, 61.55);
  O.pop(E.mois, t, 62.1, 63.5);
  O.anchored(E.work, E.workL, t, 63.85, 65.55, t > 61.6 && t < 65.6 ? P(A.door) : null, [540, 1260]);
  O.pop(E.apt, t, 65.75, 71.3);
  O.anchored(E.money, E.moneyL, t, 69.35, 71.4, t > 68.65 && t < 73.5 ? P(A.bills) : null, [330, 1220]);
  O.anchored(E.drug, E.drugL, t, 71.45, 73.45, t > 68.65 && t < 73.5 ? P(A.glass2) : null, [760, 1300]);
  O.anchored(E.pola, E.polaL, t, 73.65, 75.2, t > 73.5 && t < 75.22 ? P(A.pcam) : null, [330, 1250]);
  O.anchored(E.tub, E.tubL, t, 75.45, 77.08, t > 75.22 && t < 77.11 ? P(A.tub) : null, [760, 1250]);
  O.pop(E.zomb, t, 77.95, 80.3, { glitch: 1.4 });
  O.anchored(E.drill, E.drillL, t, 79.1, 81.0, t > 77.11 && t < 83.86 ? P(A.drill) : null, [760, 1250]);
  O.anchored(E.acid, E.acidL, t, 81.75, 83.8, t > 77.11 && t < 83.86 ? P(A.syr) : null, [320, 1300]);
  O.pop(E.m91, t, 86.4, 93.9);
  O.anchored(E.kon, E.konL, t, 87.95, 92.75, t > 86.3 && t < 92.82 ? P(A.kon) : null, [720, 680]);
  O.pop(E.quote, t, 94.3, 96.95);
  O.pop(E.rendu, t, 98.15, 100.9, { glitch: 1 });
  O.anchored(E.body, E.bodyL, t, 99.45, 100.95, t > 99.15 && t < 101 ? P(A.lump2) : null, [700, 1220]);
  O.setTimer(t, 101.0, 103.05);
  O.anchored(E.kid, E.kidL, t, 104.4, 107.55, t > 104.15 && t < 107.62 ? P(A.f1) : null, [300, 1260]);
  O.anchored(E.bro, E.broL, t, 104.85, 107.55, t > 104.15 && t < 107.62 ? P(A.f2) : null, [780, 1260]);
  O.pop(E.j22, t, 107.8, 119.25);
  O.anchored(E.fridge, E.fridgeL, t, 110.15, 111.2, t > 109.22 && t < 111.22 ? P(A.fr) : null, [760, 1120]);
  O.anchored(E.freezer, E.freezerL, t, 112.3, 113.2, t > 111.22 && t < 113.22 ? P(A.fz) : null, [330, 1120]);
  O.anchored(E.skulls, E.skullsL, t, 113.3, 115.1, t > 113.22 && t < 115.12 ? P(A.sk) : null, [760, 1300]);
  O.anchored(E.drum, E.drumL, t, 115.75, 117.38, t > 115.12 && t < 117.4 ? P(A.drum) : null, [330, 1280]);
  O.anchored(E.polas, E.polasL, t, 117.7, 119.3, t > 117.4 && t < 119.32 ? P(A.pl) : null, [540, 1300]);
  O.pop(E.m92, t, 119.45, 125.3);
  O.anchored(E.glassB, E.glassBL, t, 119.85, 121.5, t > 119.32 && t < 123.95 ? P(A.glassTop) : null, [760, 700]);
  O.pop(E.folie, t, 121.55, 123.15, { glitch: 1.2 });
  O.pop(E.sane, t, 123.2, 124.2);
  O.pop(E.perp, t, 124.21, 125.4, { from: .3 });
  O.anchored(E.sister, E.sisterL, t, 125.6, 127.8, t > 125.35 && t < 128.95 ? P(A.sis) : null, [540, 700]);
  O.pop(E.satan, t, 127.88, 128.95, { glitch: 1.6, extra: `translate(${Math.sin(t * 70) * 7 * Math.exp(-(t - 127.88) * 3)}px,0)` });
  O.pop(E.m94, t, 129.1, 132.35);
  O.anchored(E.bar, E.barL, t, 131.4, 132.35, t > 128.95 && t < 132.38 ? P(A.mbar) : null, [540, 1250]);
  O.pop(E.v17, t, 132.45, DUR, { fade: .5 });
  nameEls.forEach((el, i) => { const col = i < 9 ? 0 : 1; const row = col ? i - 9 : i; const op = O.pop(el, t, 134.55 + i * .07, DUR, { x: col ? 790 : 290, y: 1170 + row * 36, from: .9, dur: .3, fade: .5 }); });
  // compteur de victimes
  const C = [[38.9, 1], [56.0, 2, ''], [58.5, 4, '+2 CHEZ SA GRAND-MÈRE'], [66.4, 5, '+1 EN 1989'], [69.0, 6], [71.0, 7], [74.4, 8], [76.0, 9], [79.0, 10], [81.5, 11], [85.3, 12], [103.05, 13], [108.5, 17, 'EN 14 MOIS DANS CET APPARTEMENT']];
  let cv = 0, cb, cs = ''; for (const c of C) if (t >= c[0]) { cv = c[1]; cb = c[0]; cs = c[2] || ''; }
  if (cb !== undefined && t - cb > 2.6) cs = '';
  O.setCounter(t, 38.9, 128.9, cv, cb, cs);
  // effets plein écran
  O.setFull(O.flash, Math.max(fx.flash, t > 21.3 && t < 0 ? 1 : 0, t >= 68.3 && t < 68.75 ? Math.sin(Math.PI * seg(t, 68.3, 68.75)) : 0, t >= 1.78 && t < 1.95 ? 1 - seg(t, 1.78, 1.95) : 0));
  O.setFull(O.black, Math.max(t >= 103.02 && t < 104.15 ? 1 - ss(103.95, 104.15, t) : 0, ss(DUR - .6, DUR - .05, t), t > 42.42 && t < 42.6 ? 1 - seg(t, 42.42, 42.6) : 0));
  O.setFull(O.redFlash, Math.max(t >= 36.44 && t < 37.6 ? Math.exp(-(t - 36.44) * 2.5) * .9 : 0, fx.red, t >= 50.43 && t < 51.2 ? Math.exp(-(t - 50.43) * 4) * .5 : 0));
  O.vhsBands(t, Math.max(t >= 15.1 && t < 16.95 ? .8 * Math.sin(Math.PI * seg(t, 15.1, 16.95)) : 0, t >= 107.62 && t < 108.4 ? .9 * Math.sin(Math.PI * seg(t, 107.62, 108.4)) : 0, t < 1.8 ? (Math.sin(t * 13) > .7 ? .5 : 0) : 0));
}

let lastShot = null;
window.renderAt = (t) => {
  fx.flash = 0; fx.red = 0;
  const sh = SHOTS.find(s => t >= s[0] && t < s[1]) || SHOTS[SHOTS.length - 1];
  const set = sh[2]; sh[4](t);
  CAM = set.cam; set.motes && set.motes.userData.update && set.motes.userData.update(t);
  if (set === WD) WD.fireflies.userData.update(t);
  if (set === AP) { AP.fish.forEach((f, i) => { const u = f.userData; f.position.set(Math.sin(t * u.sp + u.ph) * .6, u.y + Math.sin(t * 1.3 + u.ph) * .05, Math.cos(t * u.sp * .7 + u.ph) * .12); f.rotation.y = Math.cos(t * u.sp + u.ph) > 0 ? 0 : Math.PI; });
    const g = AP.tvC.getContext('2d'); const r = rng(Math.floor(t * 30)); for (let y = 0; y < 48; y += 2) { const v = 40 + r() * 140; g.fillStyle = `rgb(${v},${v},${v + 20})`; g.fillRect(0, y, 64, 2); } AP.tvT.needsUpdate = true; }
  if (set === ST) { const d = new THREE.Vector3(); ST.cam.getWorldDirection(d); ST.placeLights(ST.cam.position.clone().addScaledVector(d, 9)); }
  renderPass.scene = set.S; renderPass.camera = set.cam;
  const gr = GR[sh[3]]; applyGrade(gr, t);
  const u = grade.uniforms;
  u.uDist.value = Math.max(t >= 15.1 && t < 16.95 ? Math.sin(Math.PI * seg(t, 15.1, 16.95)) : 0, t >= 107.62 && t < 108.4 ? Math.sin(Math.PI * seg(t, 107.62, 108.4)) : 0, t < 1.8 ? .25 + (Math.sin(t * 13) > .7 ? .6 : 0) : 0, t >= 50.43 && t < 51.0 ? .6 * (1 - seg(t, 50.43, 51)) : 0, t >= 77.97 && t < 78.4 ? .5 : 0, t >= 127.89 && t < 128.3 ? .7 : 0);
  u.uFlash.value = 0; u.uRed.value = 0; u.uBlack.value = 0;
  composer.render();
  overlay(t);
  lastShot = sh;
};
window.DUR = DUR; window.DBG = { renderer, composer, bloom, rt, renderPass };
await document.fonts.load('900 40px Mont'); await document.fonts.load('800 40px Mont'); await document.fonts.load('700 40px Mont'); await document.fonts.load('800 40px Mono'); await document.fonts.load('700 40px Mono');
await document.fonts.ready;
window.ready = true;
