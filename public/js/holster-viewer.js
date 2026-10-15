/* 3D-Viewer für das Grav-Charge-Holster.
   Wird erst geladen, wenn jemand auf „In 3D ansehen“ klickt (siehe main.js). */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';

const PALETTES = [
  { name: 'Silber / Rot', holster: 0xa9aeb5, body: 0xc4c9d0, dome: 0xb3262e, metal: 0.85, domeGlass: false },
  { name: 'Braun / Schwarz', holster: 0x7a4527, body: 0x3a3d42, dome: 0xe6eef2, metal: 0.25, domeGlass: true }
];
// Wie weit (mm) die Teile beim Zerlegen nach vorne fliegen
const EXPLODE = { back: 28, front: 58, dome: 86 };

export function mount(root) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stage = root.querySelector('.viewer-stage');
  const slider = root.querySelector('input[type=range]');
  const status = root.querySelector('.viewer-status');

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const sun = new THREE.DirectionalLight(0xffffff, 1.4);
  sun.position.set(-150, 250, -300);
  scene.add(sun, new THREE.HemisphereLight(0xffffff, 0x223344, 0.6));

  const camera = new THREE.PerspectiveCamera(32, 16 / 10, 1, 5000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.autoRotate = !reduceMotion;
  controls.autoRotateSpeed = 1.2;
  controls.addEventListener('start', () => { controls.autoRotate = false; });

  const mats = {
    holster: new THREE.MeshStandardMaterial({ roughness: 0.38 }),
    body: new THREE.MeshStandardMaterial({ roughness: 0.32 }),
    dome: new THREE.MeshPhysicalMaterial({ roughness: 0.35, clearcoat: 0.6 })
  };
  let paletteIdx = 0;
  function applyPalette() {
    const p = PALETTES[paletteIdx];
    mats.holster.color.setHex(p.holster); mats.holster.metalness = p.metal;
    mats.body.color.setHex(p.body); mats.body.metalness = p.metal;
    mats.dome.color.setHex(p.dome);
    mats.dome.metalness = 0;
    mats.dome.transparent = p.domeGlass;
    mats.dome.opacity = p.domeGlass ? 0.45 : 1;
    mats.dome.roughness = p.domeGlass ? 0.05 : 0.35;
    mats.dome.needsUpdate = true;
    root.querySelector('[data-act=color]').textContent = 'Farbe: ' + p.name;
  }

  const parts = [];          // { obj, base, dir, kind, idx }
  let explode = 0, target = 0, from = 0, animStart = 0, animating = false;

  function layout(e) {
    parts.forEach(p => {
      if (!p.dir) return;
      // Leicht versetzt: erst die Kuppeln, dann die Ringe, zuletzt die Rückteile; Charges nacheinander
      const order = { dome: 0, front: 1, back: 2 }[p.kind];
      const local = THREE.MathUtils.clamp(e * 1.8 - (order * 0.12 + p.idx * 0.1), 0, 1);
      const k = local * local * (3 - 2 * local);
      p.obj.position.copy(p.base).addScaledVector(p.dir, EXPLODE[p.kind] * k);
    });
  }

  function animateTo(t) {
    from = explode; target = t; animStart = performance.now(); animating = true;
    controls.autoRotate = false;
    if (reduceMotion) { explode = target; animating = false; layout(explode); slider.value = explode * 100; }
  }

  const creased = {};
  new GLTFLoader().load(root.dataset.model, gltf => {
    const model = gltf.scene;
    model.traverse(o => {
      if (!o.isMesh) return;
      // Normalen mit Knickwinkel: Rundungen bleiben weich, Kanten bleiben scharf.
      // Gleiche Geometrie wird nur einmal umgerechnet (Teile kommen dreifach vor).
      const key = o.geometry.uuid;
      if (!creased[key]) creased[key] = toCreasedNormals(o.geometry, Math.PI / 6);
      o.geometry = creased[key];
      const name = (o.name || o.parent.name || '').toLowerCase();
      const kind = name.startsWith('holster') ? 'holster' : name.startsWith('dome') ? 'dome' : name.startsWith('front') ? 'front' : 'back';
      o.material = kind === 'holster' ? mats.holster : kind === 'dome' ? mats.dome : mats.body;
      if (kind !== 'holster') {
        const idx = parseInt(name.replace(/\D/g, ''), 10) - 1 || 0;
        parts.push({ obj: o, base: o.position.clone(), dir: new THREE.Vector3(0, 0, 1).applyQuaternion(o.quaternion).normalize(), kind, idx });
      }
    });
    applyPalette();
    scene.add(model);

    // Kamera so wählen, dass auch der zerlegte Zustand ganz ins Bild passt
    // Kamera zielt auf das zusammengebaute Holster, der Abstand reicht auch für den zerlegten Zustand
    layout(0);
    const center = new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());
    layout(1);
    const size = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3()).length();
    controls.target.copy(center);
    camera.position.copy(center).add(new THREE.Vector3(0.3, 0.35, -1).normalize().multiplyScalar(size * 1.3));
    controls.minDistance = size * 0.5;
    controls.maxDistance = size * 3;
    status.hidden = true;
    root.classList.add('ready');
    // Kleiner Auftritt: einmal zerlegt starten und zusammenbauen
    explode = 1; slider.value = 100;
    setTimeout(() => animateTo(0), reduceMotion ? 0 : 500);
  }, undefined, () => { status.textContent = 'Das 3D-Modell konnte nicht geladen werden.'; });

  root.addEventListener('click', e => {
    const act = e.target.closest('[data-act]');
    if (!act) return;
    if (act.dataset.act === 'assemble') animateTo(0);
    if (act.dataset.act === 'explode') animateTo(1);
    if (act.dataset.act === 'color') { paletteIdx = (paletteIdx + 1) % PALETTES.length; applyPalette(); }
  });
  slider.addEventListener('input', () => {
    animating = false; controls.autoRotate = false;
    explode = slider.value / 100; layout(explode);
  });

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(stage);
  resize();

  let visible = true;
  new IntersectionObserver(en => { visible = en[0].isIntersecting; }).observe(stage);

  renderer.setAnimationLoop(now => {
    if (!visible) return;
    if (animating) {
      const t = Math.min(1, (now - animStart) / 1800);
      explode = from + (target - from) * t;
      layout(explode);
      slider.value = explode * 100;
      if (t >= 1) animating = false;
    }
    controls.update();
    renderer.render(scene, camera);
  });
}
