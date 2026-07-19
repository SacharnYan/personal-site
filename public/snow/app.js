/* ============================================================
   湖心亭看雪 · 雪夜西湖
   张岱《陶庵梦忆》——「天与云与山与水，上下一白」
   three.js r128
   ============================================================ */
(function () {
'use strict';

if (!window.THREE) {
  var errEl = document.getElementById('loadError');
  if (errEl) errEl.style.display = 'block';
  return;
}

/* ---------------- 常量 ---------------- */
var FOG_COLOR  = 0xd9e1e6;
var INK_DARK   = 0x2c333b;   /* 墨色：亭、舟 */
var SNOW_WHITE = 0xeaf0f4;
var START = new THREE.Vector3(-150, 0, 120);  /* 舟起点 */
var AREA = 560, SNOW_H = 130, WIND = -1.1;

/* ---------------- 渲染器 / 场景 ---------------- */
var canvas = document.getElementById('scene');
var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);

var scene = new THREE.Scene();
scene.background = new THREE.Color(FOG_COLOR);
scene.fog = new THREE.FogExp2(FOG_COLOR, 0.0021);

var camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 3200);

/* ---------------- 画布纹理 ---------------- */
function radialTexture(size, stops) {
  var c = document.createElement('canvas'); c.width = c.height = size;
  var g = c.getContext('2d');
  var grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (var i = 0; i < stops.length; i++) grd.addColorStop(stops[i][0], stops[i][1]);
  g.fillStyle = grd; g.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}
var snowTex  = radialTexture(64,  [[0, 'rgba(255,255,255,1)'], [0.4, 'rgba(255,255,255,0.9)'], [1, 'rgba(255,255,255,0)']]);
var mistTex  = radialTexture(256, [[0, 'rgba(235,242,246,0.55)'], [0.5, 'rgba(235,242,246,0.26)'], [1, 'rgba(235,242,246,0)']]);
var glowTex  = radialTexture(128, [[0, 'rgba(255,190,110,1)'], [0.35, 'rgba(255,160,70,0.55)'], [1, 'rgba(255,140,50,0)']]);
var moonTex  = radialTexture(256, [[0, 'rgba(240,246,252,1)'], [0.22, 'rgba(230,238,247,0.5)'], [1, 'rgba(215,230,242,0)']]);
var moonDiscTex = radialTexture(128, [[0, 'rgba(252,254,255,1)'], [0.82, 'rgba(250,252,255,1)'], [1, 'rgba(250,252,255,0)']]);

function streakTexture() {
  var c = document.createElement('canvas'); c.width = 64; c.height = 256;
  var g = c.getContext('2d');
  var v = g.createLinearGradient(0, 0, 0, 256);
  v.addColorStop(0, 'rgba(235,244,250,0)'); v.addColorStop(0.5, 'rgba(235,244,250,0.85)'); v.addColorStop(1, 'rgba(235,244,250,0)');
  g.fillStyle = v; g.fillRect(0, 0, 64, 256);
  g.globalCompositeOperation = 'destination-in';
  var h = g.createLinearGradient(0, 0, 64, 0);
  h.addColorStop(0, 'rgba(255,255,255,0)'); h.addColorStop(0.5, 'rgba(255,255,255,1)'); h.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = h; g.fillRect(0, 0, 64, 256);
  return new THREE.CanvasTexture(c);
}

/* ---------------- 天空 / 月 ---------------- */
var skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: {
    topColor:    { value: new THREE.Color(0x2b3947) },
    bottomColor: { value: new THREE.Color(FOG_COLOR) },
    offset:      { value: 60 },
    exponent:    { value: 0.72 }
  },
  vertexShader:
    'varying vec3 vWorldPosition;' +
    'void main(){ vec4 wp = modelMatrix * vec4(position,1.0); vWorldPosition = wp.xyz;' +
    'gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader:
    'uniform vec3 topColor; uniform vec3 bottomColor; uniform float offset; uniform float exponent;' +
    'varying vec3 vWorldPosition;' +
    'void main(){ float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;' +
    'float t = pow(max(h, 0.0), exponent);' +
    'gl_FragColor = vec4(mix(bottomColor, topColor, t), 1.0); }'
});
scene.add(new THREE.Mesh(new THREE.SphereGeometry(1500, 32, 16), skyMat));

/* 月：挂在舟行方向的前上方，低低一轮 */
var moonDir = new THREE.Vector3(0.927, 0.2, -0.317).normalize();
var moonPos = moonDir.clone().multiplyScalar(1150);
var moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTex, transparent: true, opacity: 0.9, fog: false, depthWrite: false }));
moonGlow.position.copy(moonPos); moonGlow.scale.set(360, 360, 1); scene.add(moonGlow);
var moonDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonDiscTex, transparent: true, fog: false, depthWrite: false }));
moonDisc.position.copy(moonPos); moonDisc.scale.set(52, 52, 1); scene.add(moonDisc);

/* ---------------- 灯光 ---------------- */
scene.add(new THREE.AmbientLight(0xbfc9d3, 0.5));
scene.add(new THREE.HemisphereLight(0xd8e0e6, 0x8b959d, 0.5));
var moonLight = new THREE.DirectionalLight(0xd8e6f2, 0.7);
moonLight.position.copy(moonDir.clone().multiplyScalar(500));
scene.add(moonLight);

/* ---------------- 湖面 ---------------- */
var waterGeo = new THREE.PlaneGeometry(2400, 2400, 64, 64);
waterGeo.rotateX(-Math.PI / 2);
var water = new THREE.Mesh(waterGeo, new THREE.MeshPhongMaterial({
  color: 0xb9c4cb, specular: 0x000000, shininess: 1
}));
scene.add(water);
var waterBase = waterGeo.attributes.position.array.slice();

function updateWater(t) {
  var pos = waterGeo.attributes.position;
  for (var i = 0; i < pos.count; i++) {
    var x = waterBase[i * 3], z = waterBase[i * 3 + 2];
    pos.setY(i,
      0.5 * Math.sin(x * 0.045 + t * 0.6) * Math.cos(z * 0.05 + t * 0.45) +
      0.28 * Math.sin(x * 0.012 - t * 0.3) * Math.sin(z * 0.017 + t * 0.22));
  }
  pos.needsUpdate = true;
  waterGeo.computeVertexNormals();
}

/* 月光碎影 */
var glitter = new THREE.Mesh(
  new THREE.PlaneGeometry(7, 110),
  new THREE.MeshBasicMaterial({ map: streakTexture(), transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })
);
glitter.geometry.rotateX(-Math.PI / 2);
glitter.position.set(moonDir.x * 140, 0.4, moonDir.z * 140);
glitter.rotation.y = Math.atan2(moonDir.x, moonDir.z) + Math.PI;
scene.add(glitter);

/* ---------------- 雾 ---------------- */
var mists = [];
for (var mi = 0; mi < 9; mi++) {
  var mMat = new THREE.SpriteMaterial({ map: mistTex, transparent: true, opacity: 0.08, depthWrite: false, fog: false });
  var ms = new THREE.Sprite(mMat);
  var ang = Math.random() * Math.PI * 2, rr = 50 + Math.random() * 210;
  ms.scale.set(150 + Math.random() * 160, 40 + Math.random() * 36, 1);
  ms.position.set(Math.sin(ang) * rr, 4 + Math.random() * 9, Math.cos(ang) * rr);
  scene.add(ms);
  mists.push({ s: ms, ang: ang, r: rr, y: ms.position.y, sp: (Math.random() * 0.5 + 0.2) * 0.008 * (Math.random() < 0.5 ? 1 : -1), op: 0.05 + Math.random() * 0.05, ph: Math.random() * 7 });
}

/* ---------------- 远山 ---------------- */
function ridgeGeo(width, height, seed) {
  var shape = new THREE.Shape();
  var segs = 48;
  shape.moveTo(-width / 2, 0);
  for (var i = 0; i <= segs; i++) {
    var u = i / segs, x = -width / 2 + width * u;
    var win = Math.sin(Math.PI * u);
    var n = 0.5 + 0.5 * (Math.sin(u * 6.3 + seed) * 0.45 + Math.sin(u * 13.7 + seed * 2.1) * 0.3 + Math.sin(u * 23.9 + seed * 0.7) * 0.25);
    shape.lineTo(x, 0.5 + win * height * (0.25 + 0.75 * n));
  }
  shape.lineTo(width / 2, 0);
  shape.lineTo(-width / 2, 0);
  return new THREE.ShapeGeometry(shape);
}
function addMountains(ringR, count, wMin, wMax, hMin, hMax, color, seedBase) {
  var mat = new THREE.MeshBasicMaterial({ color: color, fog: true });
  for (var i = 0; i < count; i++) {
    var w = wMin + Math.random() * (wMax - wMin);
    var h = hMin + Math.random() * (hMax - hMin);
    var mesh = new THREE.Mesh(ridgeGeo(w, h, seedBase + i * 1.7), mat);
    var a = (i / count) * Math.PI * 2 + Math.random() * 0.9;
    mesh.position.set(Math.sin(a) * ringR, -2, Math.cos(a) * ringR);
    mesh.rotation.y = a + Math.PI;
    scene.add(mesh);
  }
}
addMountains(540, 4, 280, 460, 45, 85, 0xc0cbd3, 3.1);
addMountains(660, 4, 340, 540, 70, 115, 0xccd6dc, 11.4);
addMountains(800, 3, 480, 700, 100, 155, 0xd9e1e6, 23.9);

/* ---------------- 树 ---------------- */
var treeMat = new THREE.MeshLambertMaterial({ color: 0x454f58 });
function makeTree(s) {
  var g = new THREE.Group();
  var trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * s, 0.16 * s, 2.4 * s, 5), treeMat);
  trunk.position.y = 1.2 * s;
  trunk.rotation.z = (Math.random() - 0.5) * 0.25;
  g.add(trunk);
  for (var i = 0; i < 4; i++) {
    var b = new THREE.Mesh(new THREE.CylinderGeometry(0.03 * s, 0.06 * s, 1.5 * s, 4), treeMat);
    var a = (i / 4) * Math.PI * 2 + Math.random() * 0.8;
    b.position.set(Math.cos(a) * 0.4 * s, (1.9 + Math.random() * 0.5) * s, Math.sin(a) * 0.4 * s);
    b.rotation.z = Math.cos(a) * 0.9;
    b.rotation.x = -Math.sin(a) * 0.9;
    g.add(b);
  }
  return g;
}

/* ---------------- 长堤一痕 ---------------- */
var causeway = new THREE.Group();
var cwBase = new THREE.Mesh(new THREE.BoxGeometry(500, 1.1, 5), new THREE.MeshLambertMaterial({ color: 0x5e6972 }));
cwBase.position.y = 0.55; causeway.add(cwBase);
var cwSnow = new THREE.Mesh(new THREE.BoxGeometry(500, 0.25, 5.35), new THREE.MeshLambertMaterial({ color: SNOW_WHITE }));
cwSnow.position.y = 1.2; causeway.add(cwSnow);
var cwBridge = new THREE.Mesh(new THREE.TorusGeometry(6.5, 1.0, 6, 14, Math.PI), new THREE.MeshLambertMaterial({ color: 0x606b74 }));
cwBridge.position.set(-70, 0.7, 0); causeway.add(cwBridge);
for (var ci = 0; ci < 12; ci++) {
  var ct = makeTree(1.5);
  ct.position.set(-235 + ci * 40 + (Math.random() - 0.5) * 16, 1.2, (Math.random() - 0.5) * 3);
  causeway.add(ct);
}
causeway.position.z = -150;
scene.add(causeway);

/* ---------------- 湖心亭 ---------------- */
var FLOOR = 2.44; /* 台基顶面高度 */
var pavilion = new THREE.Group();
var stoneMat = new THREE.MeshLambertMaterial({ color: 0x8b969e });
var snowMat  = new THREE.MeshLambertMaterial({ color: SNOW_WHITE });
var inkMat   = new THREE.MeshLambertMaterial({ color: INK_DARK });
var roofMat  = new THREE.MeshLambertMaterial({ color: 0x2b323a, side: THREE.DoubleSide });

/* 小屿与台基 */
var islet = new THREE.Mesh(new THREE.CylinderGeometry(9.5, 11, 1.5, 10), stoneMat);
islet.position.y = 0.45; pavilion.add(islet);
var isletSnow = new THREE.Mesh(new THREE.CylinderGeometry(9.5, 9.5, 0.2, 10), snowMat);
isletSnow.position.y = 1.28; pavilion.add(isletSnow);
var plat = new THREE.Mesh(new THREE.CylinderGeometry(6.8, 7.4, 1.1, 8), new THREE.MeshLambertMaterial({ color: 0x95a0a8 }));
plat.position.y = 1.75; pavilion.add(plat);
var platSnow = new THREE.Mesh(new THREE.CylinderGeometry(6.8, 6.8, 0.16, 8), snowMat);
platSnow.position.y = 2.36; pavilion.add(platSnow);

/* 柱 */
for (var pi = 0; pi < 6; pi++) {
  var pa = (pi / 6) * Math.PI * 2 + Math.PI / 6;
  var pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 3.8, 6), inkMat);
  pillar.position.set(Math.cos(pa) * 4.7, FLOOR + 1.9, Math.sin(pa) * 4.7);
  pavilion.add(pillar);
}
/* 上层短柱 */
for (var pj = 0; pj < 6; pj++) {
  var qa = (pj / 6) * Math.PI * 2 + Math.PI / 6;
  var up = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.7, 5), inkMat);
  up.position.set(Math.cos(qa) * 2.3, 8.7, Math.sin(qa) * 2.3);
  pavilion.add(up);
}
/* 两重檐（车削出上翘的檐口） */
function lathe(pts, mat, y) {
  var v = [];
  for (var i = 0; i < pts.length; i++) v.push(new THREE.Vector2(pts[i][0], pts[i][1]));
  var mesh = new THREE.Mesh(new THREE.LatheGeometry(v, 8), mat);
  mesh.position.y = y;
  return mesh;
}
pavilion.add(lathe([[6.6, 0], [6.05, 0.42], [5.2, 0.92], [4.1, 1.38], [2.9, 1.75], [1.7, 2.0], [0.8, 2.14]], roofMat, 6.05));
pavilion.add(lathe([[6.72, 0.06], [6.12, 0.5], [5.3, 0.98]], new THREE.MeshLambertMaterial({ color: 0xe6edf2, side: THREE.DoubleSide }), 6.08));
pavilion.add(lathe([[3.7, 0], [3.25, 0.26], [2.5, 0.55], [1.6, 0.78], [0.8, 0.94], [0.25, 1.06]], roofMat, 9.45));
pavilion.add(lathe([[3.8, 0.04], [3.3, 0.32], [2.6, 0.6]], new THREE.MeshLambertMaterial({ color: 0xe6edf2, side: THREE.DoubleSide }), 9.48));
/* 宝顶 */
var finial = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), inkMat);
finial.position.y = 10.75; pavilion.add(finial);
var finSnow = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 6), snowMat);
finSnow.scale.y = 0.45; finSnow.position.y = 10.9; pavilion.add(finSnow);

/* 毡与对坐两人、童子、酒炉 */
var mat0 = new THREE.Mesh(new THREE.CircleGeometry(2.4, 20), new THREE.MeshLambertMaterial({ color: 0x5d4a38 }));
mat0.rotation.x = -Math.PI / 2; mat0.position.y = FLOOR + 0.02; pavilion.add(mat0);

function seatedFigure(x, z, color) {
  var g = new THREE.Group();
  var body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), new THREE.MeshLambertMaterial({ color: color }));
  body.scale.set(1, 1.15, 0.85); body.position.y = 0.6; g.add(body);
  var head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), new THREE.MeshLambertMaterial({ color: 0x22262c }));
  head.position.y = 1.42; g.add(head);
  g.position.set(x, FLOOR, z);
  return g;
}
pavilion.add(seatedFigure(-1.2, 0.1, 0x272c33));
pavilion.add(seatedFigure(1.2, -0.1, 0x322d27));
var boy = seatedFigure(0.2, 1.9, 0x2a2f35);
boy.scale.set(0.8, 0.8, 0.8); pavilion.add(boy);

var stove = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 0.55), new THREE.MeshLambertMaterial({ color: 0x20252b }));
stove.position.set(0.1, FLOOR + 0.22, 1.05); pavilion.add(stove);
var pot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.28, 8), new THREE.MeshLambertMaterial({ color: 0x1f2429 }));
pot.position.set(0.1, FLOOR + 0.58, 1.05); pavilion.add(pot);
var stoveLight = new THREE.PointLight(0xff9440, 1.05, 14);
stoveLight.position.set(0.1, FLOOR + 0.9, 1.05); pavilion.add(stoveLight);
var stoveGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, opacity: 0.7, depthWrite: false }));
stoveGlow.scale.set(1.3, 1.3, 1); stoveGlow.position.set(0.1, FLOOR + 0.7, 1.05); pavilion.add(stoveGlow);

/* 亭心灯笼 */
var lantern = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffc06a }));
lantern.position.set(0, 6.9, 0); pavilion.add(lantern);
var lanternGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, opacity: 0.55, depthWrite: false }));
lanternGlow.scale.set(2.1, 2.1, 1); lanternGlow.position.set(0, 6.9, 0); pavilion.add(lanternGlow);
var lanternLight = new THREE.PointLight(0xffa050, 0.6, 11);
lanternLight.position.set(0, 6.9, 0); pavilion.add(lanternLight);

/* 亭侧枯树与石（树移向屿边，避免挡镜头） */
var pTree = makeTree(1.45); pTree.position.set(8.8, 1.35, -2.5); pavilion.add(pTree);
var rock1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.9), new THREE.MeshLambertMaterial({ color: 0x939ea6 }));
rock1.scale.y = 0.7; rock1.position.set(-6.8, 0.9, 5.2); pavilion.add(rock1);
var rock2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.6), new THREE.MeshLambertMaterial({ color: 0x939ea6 }));
rock2.scale.y = 0.7; rock2.position.set(7.4, 0.8, -3.5); pavilion.add(rock2);
scene.add(pavilion);

/* 远处小屿 */
var islet2 = new THREE.Group();
var i2b = new THREE.Mesh(new THREE.CylinderGeometry(6, 8, 1.2, 9), stoneMat); i2b.position.y = 0.3; islet2.add(i2b);
var i2s = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 0.18, 9), snowMat); i2s.position.y = 0.95; islet2.add(i2s);
var i2t1 = makeTree(1.7); i2t1.position.set(1.5, 1, 0.5); islet2.add(i2t1);
var i2t2 = makeTree(1.3); i2t2.position.set(-2, 1, -1); islet2.add(i2t2);
islet2.position.set(-95, 0, -70);
scene.add(islet2);

/* 炉上蒸汽 */
var steams = [];
for (var si = 0; si < 6; si++) {
  var sm = new THREE.Sprite(new THREE.SpriteMaterial({ map: snowTex, transparent: true, opacity: 0, depthWrite: false }));
  scene.add(sm);
  steams.push({ s: sm, off: si / 6 });
}
function updateSteam(t) {
  for (var i = 0; i < steams.length; i++) {
    var st = steams[i];
    var u = (t * 0.22 + st.off) % 1;
    st.s.position.set(0.1 + Math.sin(u * 5 + st.off * 9) * 0.22 * u, FLOOR + 0.75 + u * 2.4, 1.05 + Math.cos(u * 4 + st.off * 7) * 0.1 * u);
    st.s.material.opacity = 0.3 * Math.sin(Math.PI * u);
    var sc = 0.5 + u * 1.5;
    st.s.scale.set(sc, sc, 1);
  }
}

/* ---------------- 小舟 ---------------- */
var boat = new THREE.Group();
var hullGeo = new THREE.BoxGeometry(2.0, 1.0, 6.6, 2, 1, 8);
(function taperHull() {
  var p = hullGeo.attributes.position;
  for (var i = 0; i < p.count; i++) {
    var z = p.getZ(i), t = Math.min(1, Math.abs(z) / 3.3);
    p.setX(i, p.getX(i) * (1 - 0.78 * t * t));
    p.setY(i, p.getY(i) + 0.5 * t * t);
  }
  hullGeo.computeVertexNormals();
})();
var hull = new THREE.Mesh(hullGeo, new THREE.MeshLambertMaterial({ color: 0x23282e }));
hull.position.y = 0.55; boat.add(hull);

/* 箬篷与篷上积雪 */
var canopyGeo = new THREE.CylinderGeometry(1.05, 1.05, 2.7, 10, 1, true, 0, Math.PI);
canopyGeo.rotateX(Math.PI / 2); canopyGeo.rotateZ(Math.PI / 2);
var canopy = new THREE.Mesh(canopyGeo, new THREE.MeshLambertMaterial({ color: 0x403a32, side: THREE.DoubleSide }));
canopy.position.set(0, 1.0, 0.2); boat.add(canopy);
var canopySnowGeo = new THREE.CylinderGeometry(1.12, 1.12, 2.72, 10, 1, true, Math.PI / 2 - 0.55, 1.1);
canopySnowGeo.rotateX(Math.PI / 2); canopySnowGeo.rotateZ(Math.PI / 2);
var canopySnow = new THREE.Mesh(canopySnowGeo, new THREE.MeshLambertMaterial({ color: 0xe8eef2, side: THREE.DoubleSide }));
canopySnow.position.set(0, 1.0, 0.2); boat.add(canopySnow);

/* 舟中炉火 */
var brazier = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.4), new THREE.MeshLambertMaterial({ color: 0x1e2126 }));
brazier.position.set(0, 1.0, 0.3); boat.add(brazier);
var boatLight = new THREE.PointLight(0xff9040, 0.8, 8);
boatLight.position.set(0, 1.7, 0.3); boat.add(boatLight);
var boatGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, opacity: 0.55, depthWrite: false }));
boatGlow.scale.set(1.5, 1.5, 1); boatGlow.position.set(0, 1.35, 0.3); boat.add(boatGlow);

/* 舟子 */
var boatman = new THREE.Group();
var bmBody = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 6), new THREE.MeshLambertMaterial({ color: 0x2c3138 }));
bmBody.scale.set(0.9, 1.3, 0.9); bmBody.position.y = 0.65; boatman.add(bmBody);
var bmHead = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), new THREE.MeshLambertMaterial({ color: 0x22262c }));
bmHead.position.y = 1.45; boatman.add(bmHead);
var bmHat = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.22, 8), new THREE.MeshLambertMaterial({ color: 0x6b5f44 }));
bmHat.position.y = 1.62; boatman.add(bmHat);
var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 3.6, 5), new THREE.MeshLambertMaterial({ color: 0x4a4238 }));
pole.position.set(0.5, 0.5, -0.4); pole.rotation.x = 0.5; boatman.add(pole);
boatman.position.set(0, 0.9, -2.55); boat.add(boatman);

boat.position.copy(START);
scene.add(boat);

/* 舟尾水痕 */
var wakePool = [];
for (var wi = 0; wi < 14; wi++) {
  var wm = new THREE.Mesh(
    new THREE.RingGeometry(0.75, 1.0, 24),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })
  );
  wm.rotation.x = -Math.PI / 2; wm.visible = false;
  scene.add(wm);
  wakePool.push({ m: wm, age: 99 });
}
var wakeTimer = 0;
function spawnWake() {
  for (var i = 0; i < wakePool.length; i++) {
    if (wakePool[i].age > 2.2) {
      var w = wakePool[i];
      w.age = 0; w.m.visible = true;
      w.m.position.set(boat.position.x - Math.sin(heading) * 3, 0.18, boat.position.z - Math.cos(heading) * 3);
      w.m.scale.set(1, 1, 1);
      return;
    }
  }
}
function updateWakes(dt) {
  for (var i = 0; i < wakePool.length; i++) {
    var w = wakePool[i];
    if (w.age > 2.2) { w.m.visible = false; continue; }
    w.age += dt;
    var s = 1 + w.age * 3.4;
    w.m.scale.set(s, s, s);
    w.m.material.opacity = 0.3 * (1 - w.age / 2.2);
  }
}

/* ---------------- 雪 ---------------- */
function makeSnow(count, size, opacity) {
  var geo = new THREE.BufferGeometry();
  var arr = new Float32Array(count * 3);
  for (var i = 0; i < count; i++) {
    arr[i * 3] = (Math.random() - 0.5) * AREA;
    arr[i * 3 + 1] = Math.random() * SNOW_H;
    arr[i * 3 + 2] = (Math.random() - 0.5) * AREA;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  var mat = new THREE.PointsMaterial({ size: size, map: snowTex, transparent: true, opacity: opacity, depthWrite: false, sizeAttenuation: true });
  var pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  scene.add(pts);
  return { geo: geo, count: count };
}
var snowFar = makeSnow(7000, 1.0, 0.6);
var snowNear = makeSnow(2500, 1.9, 0.85);
function updateSnow(sys, dt, fall, t) {
  var a = sys.geo.attributes.position.array;
  for (var i = 0; i < sys.count; i++) {
    var j = i * 3;
    a[j + 1] -= fall * dt * (0.72 + 0.28 * Math.sin(i * 0.37));
    a[j] += (WIND + 0.5 * Math.sin(t * 0.5 + i * 0.13)) * dt;
    a[j + 2] += 0.4 * Math.cos(t * 0.4 + i * 0.21) * dt;
    if (a[j + 1] < 0) a[j + 1] += SNOW_H;
    if (a[j] > AREA / 2) a[j] -= AREA; else if (a[j] < -AREA / 2) a[j] += AREA;
    if (a[j + 2] > AREA / 2) a[j + 2] -= AREA; else if (a[j + 2] < -AREA / 2) a[j + 2] += AREA;
  }
  sys.geo.attributes.position.needsUpdate = true;
}

/* ---------------- 状态与输入 ---------------- */
var mode = 'boat';           /* boat | aerial | pavilion */
var aerialFrom = 'boat';
var started = false;
var heading = Math.atan2(0 - START.x, 0 - START.z); /* 初始朝湖心亭 */
var speed = 0, travelled = 0;
var camYawOff = 0, camPitch = 0.26, camDist = 14;
var aYaw = heading + Math.PI, aPitch = 0.75, aDist = 110;
var pYaw = 0, pPitch = 0.3, pDist = 13;
var camPosSm = new THREE.Vector3(START.x, 20, START.z + 30);
var camLookSm = new THREE.Vector3(0, 2, 0);
var snapCam = true;
var keys = {}, rowHeld = false;
var endTimer = null;

function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function wrapAngle(a) {
  a = a % (Math.PI * 2);
  if (a > Math.PI) a -= Math.PI * 2;
  if (a < -Math.PI) a += Math.PI * 2;
  return a;
}

var stageEl = document.getElementById('stage');
var hintEl = document.getElementById('hint');
var btnRow = document.getElementById('btnRow');
var btnAerial = document.getElementById('btnAerial');
var btnPavilion = document.getElementById('btnPavilion');
var intro = document.getElementById('intro');
var endCard = document.getElementById('endCard');

var stageLines = [
  '',
  '是日更定矣，余拏一小舟，拥毳衣炉火，独往湖心亭看雪。',
  '雾凇沆砀，天与云与山与水，上下一白。',
  '湖上影子，惟长堤一痕、湖心亭一点、与余舟一芥、舟中人两三粒而已。',
  '到亭上，有两人铺毡对坐，一童子烧酒炉正沸。见余大喜曰：「湖中焉得更有此人！」拉余同饮，余强饮三大白而别。',
  '及下船，舟子喃喃曰：「莫说相公痴，更有痴似相公者！」'
];
var stage = 0, stageFadeTimer = null;
function setStage(n) {
  stage = n;
  stageEl.style.opacity = 0;
  if (stageFadeTimer) clearTimeout(stageFadeTimer);
  stageFadeTimer = setTimeout(function () {
    stageEl.textContent = stageLines[n];
    stageEl.style.opacity = 1;
  }, 460);
}

function setMode(m) {
  if (m === 'aerial' && mode !== 'aerial') aerialFrom = mode;
  mode = m;
  btnAerial.textContent = (m === 'aerial') ? '返回舟中' : '俯瞰全湖';
  btnPavilion.textContent = (m === 'pavilion') ? '解缆归舟' : '登亭小坐';
  if (m === 'pavilion') {
    pYaw = Math.atan2(boat.position.x, boat.position.z);
    pPitch = 0.3;
  }
  hintEl.textContent = (m === 'boat')
    ? '拖动 环顾 · 滚轮 远近 · 空格或长按「划桨」行舟'
    : '拖动 环绕 · 滚轮 远近';
}

/* 键盘 */
window.addEventListener('keydown', function (e) {
  keys[e.code] = true;
  if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown') e.preventDefault();
});
window.addEventListener('keyup', function (e) { keys[e.code] = false; });

/* 拖动环顾 */
var dragging = false, lastX = 0, lastY = 0;
canvas.addEventListener('pointerdown', function (e) {
  dragging = true; lastX = e.clientX; lastY = e.clientY;
  canvas.classList.add('dragging');
  try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
});
canvas.addEventListener('pointermove', function (e) {
  if (!dragging) return;
  var dx = e.clientX - lastX, dy = e.clientY - lastY;
  lastX = e.clientX; lastY = e.clientY;
  if (mode === 'boat') {
    camYawOff = wrapAngle(camYawOff - dx * 0.0052);
    camPitch = clamp(camPitch + dy * 0.004, 0.06, 1.2);
  } else if (mode === 'aerial') {
    aYaw -= dx * 0.005;
    aPitch = clamp(aPitch + dy * 0.004, 0.32, 1.42);
  } else {
    pYaw -= dx * 0.005;
    pPitch = clamp(pPitch + dy * 0.003, 0.12, 0.62);
  }
});
function endDrag() { dragging = false; canvas.classList.remove('dragging'); }
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

/* 滚轮 */
canvas.addEventListener('wheel', function (e) {
  e.preventDefault();
  var k = 1 + e.deltaY * 0.001;
  if (mode === 'boat') camDist = clamp(camDist * k, 8, 26);
  else if (mode === 'aerial') aDist = clamp(aDist * k, 50, 260);
  else pDist = clamp(pDist * k, 9, 18);
}, { passive: false });

/* 划桨（按住） */
function rowDown(e) { e.preventDefault(); rowHeld = true; btnRow.classList.add('held'); }
function rowUp() { rowHeld = false; btnRow.classList.remove('held'); }
btnRow.addEventListener('pointerdown', rowDown);
btnRow.addEventListener('pointerup', rowUp);
btnRow.addEventListener('pointerleave', rowUp);
btnRow.addEventListener('pointercancel', rowUp);
btnRow.addEventListener('contextmenu', function (e) { e.preventDefault(); });

/* 俯瞰 */
btnAerial.addEventListener('click', function () {
  if (mode === 'aerial') setMode(aerialFrom === 'pavilion' ? 'pavilion' : 'boat');
  else setMode('aerial');
});

/* 登亭 / 归舟 */
btnPavilion.addEventListener('click', function () {
  btnPavilion.classList.remove('glow');
  if (mode !== 'pavilion') {
    setMode('pavilion');
  } else {
    setMode('boat');
    if (stage === 4) { setStage(5); endTimer = 14; }
  }
});

/* 开始 / 重来 / 留下 */
document.getElementById('btnStart').addEventListener('click', function () {
  intro.classList.add('hidden');
  started = true;
  setStage(1);
});
document.getElementById('btnAgain').addEventListener('click', function () {
  endCard.classList.add('hidden');
  reset();
});
document.getElementById('btnStay').addEventListener('click', function () {
  endCard.classList.add('hidden');
});
function reset() {
  boat.position.copy(START);
  heading = Math.atan2(0 - START.x, 0 - START.z);
  speed = 0; travelled = 0; camYawOff = 0;
  endTimer = null;
  btnPavilion.style.display = 'none';
  btnPavilion.classList.remove('glow');
  setMode('boat');
  snapCam = true;
  setStage(1);
}

/* ---------------- 更新 ---------------- */
function updateBoat(dt, t) {
  var rowing = (keys['Space'] || keys['KeyW'] || keys['ArrowUp'] || rowHeld) && mode === 'boat';
  var targetSpeed = rowing ? 7.2 : 0;
  speed += (targetSpeed - speed) * Math.min(1, dt * 1.6);
  if (speed > 0.4) heading += wrapAngle(camYawOff) * Math.min(1, dt * 1.5);

  var nx = boat.position.x + Math.sin(heading) * speed * dt;
  var nz = boat.position.z + Math.cos(heading) * speed * dt;

  /* 湖心亭浅滩：泊舟 */
  var d = Math.sqrt(nx * nx + nz * nz);
  if (d < 10.8) { var s = 10.8 / d; nx *= s; nz *= s; speed *= 0.3; }
  /* 长堤不可逾越 */
  if (Math.abs(nz + 150) < 4.5 && Math.abs(nx) < 252) { nz = boat.position.z; speed *= 0.4; }
  /* 湖界 */
  var r = Math.sqrt(nx * nx + nz * nz);
  if (r > 380) { var s2 = 380 / r; nx *= s2; nz *= s2; }

  travelled += speed * dt;
  boat.position.x = nx; boat.position.z = nz;
  boat.position.y = 0.32 + Math.sin(t * 0.85) * 0.1 + Math.min(speed * 0.012, 0.08);
  boat.rotation.y = heading;
  boat.rotation.z = Math.sin(t * 0.7) * 0.02 - wrapAngle(camYawOff) * 0.06 * Math.min(1, speed / 7);
  boat.rotation.x = Math.sin(t * 0.62 + 1.3) * 0.015 + speed * 0.0035;

  wakeTimer -= dt;
  if (speed > 1.5 && wakeTimer <= 0) { spawnWake(); wakeTimer = 0.55; }
}

var _tp = new THREE.Vector3(), _tl = new THREE.Vector3();
function updateCamera(dt, t) {
  if (mode === 'boat') {
    var phi = heading + Math.PI + camYawOff;
    var cy = Math.sin(camPitch) * camDist, ch = Math.cos(camPitch) * camDist;
    _tp.set(boat.position.x + Math.sin(phi) * ch, Math.max(1.6, 1.4 + cy), boat.position.z + Math.cos(phi) * ch);
    _tl.set(boat.position.x + Math.sin(heading) * 7, 2.3 + Math.sin(t * 0.5) * 0.1, boat.position.z + Math.cos(heading) * 7);
  } else if (mode === 'aerial') {
    aYaw += dt * 0.045;
    /* 环绕小舟，让「余舟一芥」始终在画面里 */
    var h = Math.cos(aPitch) * aDist;
    _tp.set(boat.position.x + Math.sin(aYaw) * h, Math.sin(aPitch) * aDist, boat.position.z + Math.cos(aYaw) * h);
    _tl.set(boat.position.x * 0.55, 3, boat.position.z * 0.55);
  } else {
    pYaw += dt * 0.05;
    _tp.set(Math.sin(pYaw) * Math.cos(pPitch) * pDist, Math.max(2.0, Math.sin(pPitch) * pDist + 1.2), Math.cos(pYaw) * Math.cos(pPitch) * pDist);
    _tl.set(0, 3.4, 0);
  }
  if (snapCam) { camPosSm.copy(_tp); camLookSm.copy(_tl); snapCam = false; }
  camPosSm.lerp(_tp, 1 - Math.exp(-2.6 * dt));
  camLookSm.lerp(_tl, 1 - Math.exp(-3.4 * dt));
  camera.position.copy(camPosSm);
  camera.lookAt(camLookSm);
}

function updateMist(dt, t) {
  for (var i = 0; i < mists.length; i++) {
    var m = mists[i];
    m.ang += m.sp * dt;
    m.s.position.set(Math.sin(m.ang) * m.r, m.y, Math.cos(m.ang) * m.r);
    m.s.material.opacity = m.op * (0.75 + 0.25 * Math.sin(t * 0.3 + m.ph));
  }
}

function checkStages(dt) {
  if (!started) return;
  if (stage === 1 && travelled > 25) setStage(2);
  else if (stage === 2 && travelled > 95) setStage(3);

  var dx = boat.position.x, dz = boat.position.z;
  var dp = Math.sqrt(dx * dx + dz * dz);
  if (dp < 20) {
    if (btnPavilion.style.display === 'none') {
      btnPavilion.style.display = 'block';
      btnPavilion.classList.add('glow');
    }
    if (stage < 4 && mode === 'boat') setStage(4);
  } else if (mode !== 'pavilion') {
    btnPavilion.style.display = 'none';
  }

  if (endTimer !== null) {
    if (mode === 'pavilion') { endTimer = null; return; }
    endTimer -= dt;
    if (endTimer <= 0) { endTimer = null; endCard.classList.remove('hidden'); }
  }
}

/* ---------------- 调试参数（截图用） ---------------- */
(function applyQuery() {
  var qs = new URLSearchParams(location.search);
  if (qs.get('shot')) {
    intro.style.display = 'none';
    started = true;
    stage = 1;
    stageEl.textContent = stageLines[1];
  }
  if (qs.get('cam') === 'aerial') { setMode('aerial'); }
  if (qs.get('dbg')) {
    var d = qs.get('dbg');
    if (d.indexOf('noglitter') >= 0) glitter.visible = false;
    if (d.indexOf('nomoon') >= 0) { moonGlow.visible = false; moonDisc.visible = false; }
    if (d.indexOf('nomist') >= 0) mists.forEach(function (m) { m.s.visible = false; });
    if (d.indexOf('nowater') >= 0) water.visible = false;
    if (d.indexOf('nodir') >= 0) moonLight.intensity = 0;
  }
  if (qs.get('cam') === 'pavilion') {
    boat.position.set(9.5, 0, 6);
    heading = Math.atan2(-9.5, -6);
    setMode('pavilion');
    stage = 4;
    stageEl.textContent = stageLines[4];
    btnPavilion.style.display = 'block';
  }
})();

/* ---------------- 主循环 ---------------- */
var clock = new THREE.Clock();
var tt = 0;
function animate() {
  requestAnimationFrame(animate);
  var dt = Math.min(clock.getDelta(), 0.05);
  tt += dt;

  updateBoat(dt, tt);
  updateCamera(dt, tt);
  updateSnow(snowFar, dt, 3.2, tt);
  updateSnow(snowNear, dt, 5.2, tt);
  updateWater(tt);
  updateMist(dt, tt);
  updateWakes(dt);
  updateSteam(tt);

  stoveLight.intensity = 1.05 + Math.sin(tt * 11) * 0.12 + Math.sin(tt * 24 + 1.7) * 0.07;
  boatLight.intensity = 0.8 + Math.sin(tt * 9 + 2) * 0.1 + Math.sin(tt * 19) * 0.06;
  lanternLight.intensity = 0.6 + Math.sin(tt * 7 + 4) * 0.08;
  stoveGlow.material.opacity = 0.55 + 0.18 * Math.sin(tt * 9 + 2);
  glitter.material.opacity = 0.045 + 0.015 * Math.sin(tt * 1.2);

  checkStages(dt);
  renderer.render(scene, camera);
}

window.addEventListener('resize', function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

console.log('[snow] ready');
animate();
})();
