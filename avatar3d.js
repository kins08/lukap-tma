(function () {
  'use strict';

  const THREE = window.THREE;
  const API = window.LUKAP;
  const stage = document.getElementById('avatarStage');
  const host = document.getElementById('avatar3d');
  const frame = document.getElementById('appFrame');
  if (!THREE || !API || !stage || !host) return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
  } catch (error) {
    console.warn('LUKAP 3D disabled:', error);
    return;
  }
  if (!renderer || !renderer.getContext()) return;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', 'Объёмный 3D-аватар ЛУКАП');
  renderer.domElement.setAttribute('role', 'img');

  const scene = new THREE.Scene();

  function buildStudioEnvironment() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    const sky = context.createLinearGradient(0, 0, 0, 512);
    sky.addColorStop(0, '#fffdf7');
    sky.addColorStop(0.32, '#f6ecdd');
    sky.addColorStop(0.52, '#d9c5aa');
    sky.addColorStop(0.72, '#8f7357');
    sky.addColorStop(1, '#3a2a1e');
    context.fillStyle = sky;
    context.fillRect(0, 0, 1024, 512);

    const glow = (x, y, radius, color, alpha) => {
      const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(${color},${alpha})`);
      gradient.addColorStop(0.55, `rgba(${color},${alpha * 0.32})`);
      gradient.addColorStop(1, `rgba(${color},0)`);
      context.fillStyle = gradient;
      context.fillRect(0, 0, 1024, 512);
    };
    glow(250, 150, 300, '255,255,252', 0.98);
    glow(760, 190, 250, '255,214,184', 0.72);
    glow(930, 300, 190, '255,92,64', 0.32);
    glow(560, 420, 340, '255,232,204', 0.2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.encoding = THREE.sRGBEncoding;
    const generator = new THREE.PMREMGenerator(renderer);
    generator.compileEquirectangularShader();
    const target = generator.fromEquirectangular(texture);
    scene.environment = target.texture;
    texture.dispose();
    generator.dispose();
  }
  buildStudioEnvironment();

  const fabricCanvas = document.createElement('canvas');
  fabricCanvas.width = 96;
  fabricCanvas.height = 96;
  const fabricContext = fabricCanvas.getContext('2d');
  fabricContext.fillStyle = '#808080';
  fabricContext.fillRect(0, 0, 96, 96);
  for (let i = 0; i < 96; i += 2) {
    fabricContext.fillStyle = 'rgba(255,255,255,.16)';
    fabricContext.fillRect(i, 0, 1, 96);
    fabricContext.fillStyle = 'rgba(0,0,0,.14)';
    fabricContext.fillRect(0, i, 96, 1);
  }
  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 1;
  const fabricBump = new THREE.CanvasTexture(fabricCanvas);
  fabricBump.wrapS = THREE.RepeatWrapping;
  fabricBump.wrapT = THREE.RepeatWrapping;
  fabricBump.repeat.set(4, 4);
  fabricBump.anisotropy = Math.min(4, maxAnisotropy);

  const fabricNormalCanvas = document.createElement('canvas');
  fabricNormalCanvas.width = 128;
  fabricNormalCanvas.height = 128;
  const fabricNormalContext = fabricNormalCanvas.getContext('2d');
  const fabricNormalImage = fabricNormalContext.createImageData(128, 128);
  for (let y = 0; y < 128; y += 1) {
    for (let x = 0; x < 128; x += 1) {
      const u = (x / 128) * Math.PI * 14;
      const v = (y / 128) * Math.PI * 14;
      const dx = Math.cos(u) * 0.62;
      const dy = Math.cos(v) * 0.62;
      const nx = -dx * 0.34;
      const ny = -dy * 0.34;
      const length = Math.hypot(nx, ny, 1);
      const offset = (y * 128 + x) * 4;
      fabricNormalImage.data[offset] = Math.round((nx / length * 0.5 + 0.5) * 255);
      fabricNormalImage.data[offset + 1] = Math.round((ny / length * 0.5 + 0.5) * 255);
      fabricNormalImage.data[offset + 2] = Math.round((1 / length * 0.5 + 0.5) * 255);
      fabricNormalImage.data[offset + 3] = 255;
    }
  }
  fabricNormalContext.putImageData(fabricNormalImage, 0, 0);
  const fabricNormal = new THREE.CanvasTexture(fabricNormalCanvas);
  fabricNormal.wrapS = THREE.RepeatWrapping;
  fabricNormal.wrapT = THREE.RepeatWrapping;
  fabricNormal.repeat.set(8, 8);
  fabricNormal.anisotropy = Math.min(4, maxAnisotropy);

  const denimNormalCanvas = document.createElement('canvas');
  denimNormalCanvas.width = 128;
  denimNormalCanvas.height = 128;
  const denimNormalContext = denimNormalCanvas.getContext('2d');
  const denimNormalImage = denimNormalContext.createImageData(128, 128);
  for (let y = 0; y < 128; y += 1) {
    for (let x = 0; x < 128; x += 1) {
      const phase = ((x + y) / 128) * Math.PI * 20;
      const slub = Math.sin((x * 0.7 + y * 0.2) * 0.6) * 0.08;
      const dx = Math.cos(phase) * 0.55 + slub;
      const dy = Math.cos(phase) * 0.55 + slub * 0.4;
      const nx = -dx * 0.48;
      const ny = -dy * 0.48;
      const length = Math.hypot(nx, ny, 1);
      const offset = (y * 128 + x) * 4;
      denimNormalImage.data[offset] = Math.round((nx / length * 0.5 + 0.5) * 255);
      denimNormalImage.data[offset + 1] = Math.round((ny / length * 0.5 + 0.5) * 255);
      denimNormalImage.data[offset + 2] = Math.round((1 / length * 0.5 + 0.5) * 255);
      denimNormalImage.data[offset + 3] = 255;
    }
  }
  denimNormalContext.putImageData(denimNormalImage, 0, 0);
  const denimNormal = new THREE.CanvasTexture(denimNormalCanvas);
  denimNormal.wrapS = THREE.RepeatWrapping;
  denimNormal.wrapT = THREE.RepeatWrapping;
  denimNormal.repeat.set(9, 9);
  denimNormal.anisotropy = Math.min(4, maxAnisotropy);

  const denimRoughCanvas = document.createElement('canvas');
  denimRoughCanvas.width = 128;
  denimRoughCanvas.height = 128;
  const denimRoughContext = denimRoughCanvas.getContext('2d');
  const denimRoughImage = denimRoughContext.createImageData(128, 128);
  for (let y = 0; y < 128; y += 1) {
    for (let x = 0; x < 128; x += 1) {
      const slub = Math.sin(x * 0.23 + y * 0.11) * 10 + Math.sin(x * 0.07) * 6;
      const value = Math.max(0, Math.min(255, 210 + slub));
      const offset = (y * 128 + x) * 4;
      denimRoughImage.data[offset] = value;
      denimRoughImage.data[offset + 1] = value;
      denimRoughImage.data[offset + 2] = value;
      denimRoughImage.data[offset + 3] = 255;
    }
  }
  denimRoughContext.putImageData(denimRoughImage, 0, 0);
  const denimRoughness = new THREE.CanvasTexture(denimRoughCanvas);
  denimRoughness.wrapS = THREE.RepeatWrapping;
  denimRoughness.wrapT = THREE.RepeatWrapping;
  denimRoughness.repeat.set(7, 7);
  denimRoughness.anisotropy = Math.min(4, maxAnisotropy);

  const denimWeaveCanvas = document.createElement('canvas');
  denimWeaveCanvas.width = 64;
  denimWeaveCanvas.height = 64;
  const denimWeaveContext = denimWeaveCanvas.getContext('2d');
  const denimWeaveImage = denimWeaveContext.createImageData(64, 64);
  for (let y = 0; y < 64; y += 1) {
    for (let x = 0; x < 64; x += 1) {
      const twill = Math.sin((x + y) * 0.75) * 12 + Math.sin(x * 0.31 + y * 0.73) * 5;
      const value = Math.max(0, Math.min(255, 232 + twill));
      const offset = (y * 64 + x) * 4;
      denimWeaveImage.data[offset] = value;
      denimWeaveImage.data[offset + 1] = value;
      denimWeaveImage.data[offset + 2] = value;
      denimWeaveImage.data[offset + 3] = 255;
    }
  }
  denimWeaveContext.putImageData(denimWeaveImage, 0, 0);
  const denimWeave = new THREE.CanvasTexture(denimWeaveCanvas);
  denimWeave.wrapS = THREE.RepeatWrapping;
  denimWeave.wrapT = THREE.RepeatWrapping;
  denimWeave.repeat.set(16, 16);
  denimWeave.anisotropy = Math.min(4, maxAnisotropy);

  const skinBumpCanvas = document.createElement('canvas');
  skinBumpCanvas.width = 64;
  skinBumpCanvas.height = 64;
  const skinBumpContext = skinBumpCanvas.getContext('2d');
  const skinBumpImage = skinBumpContext.createImageData(64, 64);
  for (let y = 0; y < 64; y += 1) {
    for (let x = 0; x < 64; x += 1) {
      const grain = Math.sin(x * 1.7 + y * 0.9) * 6 + Math.sin(x * 0.4 - y * 1.3) * 4;
      const value = Math.max(0, Math.min(255, 128 + grain));
      const offset = (y * 64 + x) * 4;
      skinBumpImage.data[offset] = value;
      skinBumpImage.data[offset + 1] = value;
      skinBumpImage.data[offset + 2] = value;
      skinBumpImage.data[offset + 3] = 255;
    }
  }
  skinBumpContext.putImageData(skinBumpImage, 0, 0);
  const skinBump = new THREE.CanvasTexture(skinBumpCanvas);
  skinBump.wrapS = THREE.RepeatWrapping;
  skinBump.wrapT = THREE.RepeatWrapping;
  skinBump.repeat.set(4, 4);
  skinBump.anisotropy = Math.min(4, maxAnisotropy);

  const hairBumpCanvas = document.createElement('canvas');
  hairBumpCanvas.width = 128;
  hairBumpCanvas.height = 128;
  const hairBumpContext = hairBumpCanvas.getContext('2d');
  const hairBumpImage = hairBumpContext.createImageData(128, 128);
  for (let y = 0; y < 128; y += 1) {
    for (let x = 0; x < 128; x += 1) {
      const strand = Math.sin(x * 0.46 + Math.sin(y * 0.09) * 0.7) * 20;
      const fine = Math.sin(x * 1.12 + y * 0.17) * 8;
      const value = Math.max(0, Math.min(255, 128 + strand + fine));
      const offset = (y * 128 + x) * 4;
      hairBumpImage.data[offset] = value;
      hairBumpImage.data[offset + 1] = value;
      hairBumpImage.data[offset + 2] = value;
      hairBumpImage.data[offset + 3] = 255;
    }
  }
  hairBumpContext.putImageData(hairBumpImage, 0, 0);
  const hairBump = new THREE.CanvasTexture(hairBumpCanvas);
  hairBump.wrapS = THREE.RepeatWrapping;
  hairBump.wrapT = THREE.RepeatWrapping;
  hairBump.repeat.set(3, 2);
  hairBump.anisotropy = Math.min(4, maxAnisotropy);

  const BASE_DISTANCE = 4.05;
  const camera = new THREE.PerspectiveCamera(31, 1, 0.05, 30);
  camera.position.set(0, 1.04, BASE_DISTANCE);
  camera.lookAt(0, 0.96, 0);

  scene.add(new THREE.HemisphereLight(0xfff7ec, 0x5c4c3b, 0.46));
  const keyLight = new THREE.DirectionalLight(0xfff3e2, 1.3);
  keyLight.position.set(-2.2, 3.8, 3.3);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 9;
  keyLight.shadow.camera.left = -2;
  keyLight.shadow.camera.right = 2;
  keyLight.shadow.camera.top = 3;
  keyLight.shadow.camera.bottom = -0.5;
  keyLight.shadow.bias = -0.00018;
  keyLight.shadow.normalBias = 0.018;
  keyLight.shadow.radius = 5;
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xffe0c8, 0.38);
  fillLight.position.set(2.6, 1.4, 2.1);
  scene.add(fillLight);
  const rimLight = new THREE.PointLight(0xff4131, 0.95, 5.5);
  rimLight.position.set(1.9, 2.0, -1.5);
  scene.add(rimLight);
  const backLight = new THREE.DirectionalLight(0xffd6bd, 0.3);
  backLight.position.set(-1.4, 2.4, -2.8);
  scene.add(backLight);
  const topLight = new THREE.PointLight(0xfff8ed, 0.36, 4);
  const edgeLight = new THREE.DirectionalLight(0xffead8, 0.26);
  edgeLight.position.set(-2.4, 2.4, -2.2);
  scene.add(edgeLight);
  topLight.position.set(0, 3.2, 0.8);
  scene.add(topLight);

  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 256;
  shadowCanvas.height = 128;
  const shadowContext = shadowCanvas.getContext('2d');
  const shadowGradient = shadowContext.createRadialGradient(128, 64, 5, 128, 64, 112);
  shadowGradient.addColorStop(0, 'rgba(65,44,25,.42)');
  shadowGradient.addColorStop(0.52, 'rgba(65,44,25,.21)');
  shadowGradient.addColorStop(1, 'rgba(65,44,25,0)');
  shadowContext.fillStyle = shadowGradient;
  shadowContext.fillRect(0, 0, 256, 128);
  const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.05, 0.52),
    new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.set(0, 0.002, 0.02);
  scene.add(shadowPlane);
  const shadowReceiver = new THREE.Mesh(
    new THREE.PlaneGeometry(1.45, 0.9),
    new THREE.ShadowMaterial({ color: 0x533a24, opacity: 0.22 })
  );
  shadowReceiver.rotation.x = -Math.PI / 2;
  shadowReceiver.position.set(0, 0.004, 0.02);
  shadowReceiver.receiveShadow = true;
  scene.add(shadowReceiver);

  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.435, 0.02, 64),
    new THREE.MeshStandardMaterial({ color: 0xe4d6c2, roughness: 0.9, metalness: 0.02 })
  );
  pedestal.position.set(0, -0.012, 0.02);
  pedestal.receiveShadow = true;
  scene.add(pedestal);

  const root = new THREE.Group();
  scene.add(root);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const clock = new THREE.Clock();
  let state = API.getState();
  let signature = '';
  let pickables = [];
  let rotation = 0;
  let zoom = 1;
  let viewRotation = 0;
  let viewZoom = 1;
  let rotationVelocity = 0;
  let refreshTimer = null;
  let hasBuilt = false;
  let rebuildCount = 0;
  const activePointers = new Map();
  let pinchStart = null;
  let dragStart = null;
  let dragMode = null;
  let dragSlot = null;
  let dragMoved = 0;
  let lastInteraction = performance.now();
  let snapshotCache = { signature: '', url: '' };
  let lastGoodSize = { width: 720, height: 900 };
  let idleBlend = 0;
  let idleTime = 0;
  let equipPulse = 0;
  const reduceMotion = Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const SKIN_TONES = ['#c68b63', '#8e5a3e', '#e0af88'];
  const WHITE = new THREE.Color(0xffffff);

  function toColor(value) {
    return new THREE.Color(value);
  }

  function isLightColor(value) {
    const hex = value.replace('#', '');
    const parts = hex.length === 3 ? hex.split('').map((char) => char + char) : [hex.slice(0, 2), hex.slice(2, 4), hex.slice(4, 6)];
    const [r, g, b] = parts.map((part) => parseInt(part, 16));
    return (r * 0.299 + g * 0.587 + b * 0.114) > 150;
  }

  function material(value, options) {
    const params = {
      color: toColor(value),
      roughness: 0.7,
      metalness: 0.03,
      envMapIntensity: 0.38,
      ...(options || {})
    };
    if ('fabric' in params) {
      const fabric = params.fabric;
      delete params.fabric;
      if (fabric) {
        params.bumpMap = fabricBump;
        params.bumpScale = params.bumpScale || 0.0015;
        params.normalMap = fabricNormal;
        params.normalScale = new THREE.Vector2(0.1, 0.1);
      }
    }
    if ('denim' in params) {
      const denim = params.denim;
      delete params.denim;
      if (denim) {
        params.bumpMap = fabricBump;
        params.bumpScale = 0.0035;
        params.normalMap = denimNormal;
        params.normalScale = new THREE.Vector2(0.85, 0.85);
        params.roughnessMap = denimRoughness;
        params.map = denimWeave;
      }
    }
    return new THREE.MeshStandardMaterial(params);
  }

  function cloth(value, options) {
    return material(value, { fabric: true, ...(options || {}) });
  }
  function skinMaterial(value, roughness) {
    const mat = new THREE.MeshPhysicalMaterial({
      color: toColor(value),
      roughness: roughness ?? 0.64,
      metalness: 0,
      clearcoat: 0.035,
      clearcoatRoughness: 0.72,
      envMapIntensity: 0.28,
      bumpMap: skinBump,
      bumpScale: 0.0006
    });
    return mat;
  }


  function metalMaterial(value) {
    const metal = new THREE.MeshStandardMaterial({
      color: toColor(value),
      roughness: 0.28,
      metalness: 0.86,
      envMapIntensity: 0.95
    });
    metal.color.multiplyScalar(0.9);
    return metal;
  }

  function add(parent, geometry, mat, position, rotation, scale) {
    const mesh = new THREE.Mesh(geometry, mat);
    if (position) mesh.position.set(position[0], position[1], position[2]);
    if (rotation) mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
    if (scale) mesh.scale.set(scale[0], scale[1], scale[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function tagGroup(group, slot) {
    group.userData.slot = slot;
    group.traverse((object) => {
      if (object.isMesh && object.geometry && object.geometry.isBufferGeometry) {
        object.userData.slot = slot;
        object.castShadow = true;
        object.receiveShadow = true;
        pickables.push(object);
      }
    });
    return group;
  }

  const geometryCache = new Map();
  const cachedGeometries = new Set();

  function cachedGeometry(key, create) {
    let geometry = geometryCache.get(key);
    if (!geometry) {
      geometry = create();
      geometryCache.set(key, geometry);
      cachedGeometries.add(geometry);
    }
    return geometry;
  }

  function clearGroup(group) {
    group.traverse((object) => {
      if (object.isMesh) {
        if (object.geometry && !cachedGeometries.has(object.geometry) && typeof object.geometry.dispose === 'function') object.geometry.dispose();
        if (Array.isArray(object.material)) object.material.forEach((mat) => mat.dispose());
        else if (object.material && typeof object.material.dispose === 'function') object.material.dispose();
      }
    });
    while (group.children.length) group.remove(group.children[0]);
  }

  function cylinder(radiusTop, radiusBottom, height, segments = 24) {
    const count = Math.max(segments, 22);
    return cachedGeometry(`cyl:${radiusTop}:${radiusBottom}:${height}:${count}`, () => new THREE.CylinderGeometry(radiusTop, radiusBottom, height, count, 1));
  }

  function sphere(radius, segments = 22) {
    const count = Math.max(segments, 18);
    return cachedGeometry(`sph:${radius}:${count}`, () => new THREE.SphereGeometry(radius, count, Math.max(12, Math.floor(count * 0.7))));
  }

  function sphereGeo(radius, widthSegments, heightSegments) {
    return cachedGeometry(`sphx:${radius}:${widthSegments}:${heightSegments}`, () => new THREE.SphereGeometry(radius, widthSegments, heightSegments));
  }

  function box(width, height, depth) {
    return cachedGeometry(`box:${width}:${height}:${depth}`, () => new THREE.BoxGeometry(width, height, depth));
  }

  function cone(radius, height, segments) {
    return cachedGeometry(`cone:${radius}:${height}:${segments}`, () => new THREE.ConeGeometry(radius, height, segments));
  }

  function torus(radius, tube, segments = 26) {
    const count = Math.max(segments, 24);
    return cachedGeometry(`tor:${radius}:${tube}:${count}`, () => new THREE.TorusGeometry(radius, tube, 10, count));
  }

  function tube(points, radius, mat) {
    const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(point[0], point[1], point[2])));
    const key = `tube:${radius}:${points.map((point) => point.map((value) => value.toFixed(4)).join(',')).join(';')}`;
    return new THREE.Mesh(cachedGeometry(key, () => new THREE.TubeGeometry(curve, 28, radius, 6, false)), mat);
  }

  function addBrandMark(parent, item, position, scale, mat) {
    if (!item.brand) return null;
    const [x, y, z] = position;
    const s = scale || 1;
    const mark = item.mark || 'wing';
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.scale.setScalar(s);
    if (mark === 'slash') {
      [-0.012, 0.012].forEach((offset) => {
        const slash = new THREE.Mesh(box(0.008, 0.044, 0.004), mat);
        slash.position.set(offset, 0, 0);
        slash.rotation.z = -0.38;
        group.add(slash);
      });
    } else if (mark === 'peak') {
      [-0.024, 0, 0.024].forEach((offset, index) => {
        const peak = new THREE.Mesh(cone(0.019 - index * 0.002, 0.032 + index * 0.004, 3), mat);
        peak.position.set(offset, index === 2 ? 0.004 : -0.004, 0);
        peak.scale.z = 0.22;
        group.add(peak);
      });
    } else if (mark === 'orbit') {
      const ring = new THREE.Mesh(torus(0.02, 0.0035, 24), mat);
      ring.rotation.z = -0.4;
      group.add(ring);
      const core = new THREE.Mesh(sphereGeo(0.0055, 10, 8), mat);
      group.add(core);
    } else if (mark === 'sun') {
      group.add(new THREE.Mesh(sphereGeo(0.012, 12, 10), mat));
      for (let index = 0; index < 8; index += 1) {
        const ray = new THREE.Mesh(box(0.0028, 0.012, 0.003), mat);
        const angle = (index / 8) * Math.PI * 2;
        ray.position.set(Math.cos(angle) * 0.021, Math.sin(angle) * 0.021, 0);
        ray.rotation.z = angle - Math.PI / 2;
        group.add(ray);
      }
    } else if (mark === 'monogram') {
      [[0, 0.024, 0.048, 0.003], [0, -0.024, 0.048, 0.003], [-0.024, 0, 0.003, 0.048], [0.024, 0, 0.003, 0.048]].forEach(([x, y, w, h]) => {
        const bar = new THREE.Mesh(box(w, h, 0.004), mat);
        bar.position.set(x, y, 0);
        group.add(bar);
      });
      [-1, 1].forEach((side) => {
        const stroke = new THREE.Mesh(box(0.006, 0.032, 0.005), mat);
        stroke.position.set(side * 0.008, -0.002, 0.004);
        stroke.rotation.z = side * 0.52;
        group.add(stroke);
      });
    } else if (mark === 'bolt') {
      [-1, 1].forEach((side) => {
        const stroke = new THREE.Mesh(box(0.009, 0.032, 0.005), mat);
        stroke.position.set(side * 0.007, side * 0.008, 0);
        stroke.rotation.z = side * -0.55;
        group.add(stroke);
      });
    } else if (mark === 'diamond') {
      const ring = new THREE.Mesh(cachedGeometry('torx:0.02:0.0032:4:4', () => new THREE.TorusGeometry(0.02, 0.0032, 4, 4)), mat);
      ring.rotation.z = Math.PI / 4;
      group.add(ring);
      group.add(new THREE.Mesh(sphereGeo(0.006, 10, 8), mat));
    } else if (mark === 'arc') {
      const arc = new THREE.Mesh(cachedGeometry('torx:0.019:0.0032:8:18:half', () => new THREE.TorusGeometry(0.019, 0.0032, 8, 18, Math.PI)), mat);
      group.add(arc);
      const dot = new THREE.Mesh(sphereGeo(0.0045, 10, 8), mat);
      dot.position.set(0, -0.019, 0);
      group.add(dot);
    } else if (mark === 'wave') {
      [-0.015, 0, 0.015].forEach((x, index) => {
        const bead = new THREE.Mesh(sphereGeo(0.006, 10, 8), mat);
        bead.position.set(x, index === 0 ? 0.006 : index === 1 ? -0.006 : 0.004, 0);
        group.add(bead);
      });
    } else {
      [-1, 1].forEach((side) => {
        const wing = new THREE.Mesh(box(0.05, 0.011, 0.004), mat);
        wing.position.set(side * 0.022, side * 0.006, 0);
        wing.rotation.z = side * -0.34;
        group.add(wing);
      });
    }
    parent.add(group);
    return group;
  }

  function sampleProfile(points, t) {
    if (t <= points[0][0]) return points[0][1];
    for (let index = 1; index < points.length; index += 1) {
      const [t1, value1] = points[index];
      if (t <= t1) {
        const [t0, value0] = points[index - 1];
        const local = (t - t0) / Math.max(0.0001, t1 - t0);
        return value0 + (value1 - value0) * local;
      }
    }
    return points[points.length - 1][1];
  }

  function profileLegMesh(side, topY, bottomY, rxPoints, cxPoints, depth, mat, zShiftPoints) {
    const height = Math.max(0.05, topY - bottomY);
    const geometry = new THREE.CylinderGeometry(1, 1, height, 24, 14, true);
    const positions = geometry.attributes.position;
    for (let index = 0; index < positions.count; index += 1) {
      const y = positions.getY(index);
      const t = (height / 2 - y) / height;
      const rx = sampleProfile(rxPoints, t);
      const cx = sampleProfile(cxPoints, t);
      const depthValue = Array.isArray(depth) ? sampleProfile(depth, t) : depth;
      const shift = zShiftPoints ? sampleProfile(zShiftPoints, t) : 0;
      const nx = positions.getX(index);
      const nz = positions.getZ(index);
      positions.setX(index, nx * rx + side * cx);
      positions.setZ(index, nz * rx * depthValue + shift);
    }
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.set(0, (topY + bottomY) / 2, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  const ARM_ANGLE = 0.5585;
  const SHOULDER_X = 0.205;
  const SHOULDER_Y = 1.44;

  function armPivot(parent, side) {
    const pivot = new THREE.Group();
    pivot.position.set(side * SHOULDER_X, SHOULDER_Y, 0);
    pivot.rotation.z = side * ARM_ANGLE;
    parent.add(pivot);
    return pivot;
  }

  function makeSleeve(parent, side, mat, cuffMat, options) {
    const config = options || {};
    const radius = config.radius || 0.095;
    const length = config.length || 0.5;
    const pivot = armPivot(parent, side);
    const shoulder = add(
      pivot,
      sphere(radius * 1.13, 16),
      mat,
      [0, -0.01, 0],
      null,
      [1.05, 0.9, 1]
    );
    const arm = add(
      pivot,
      cylinder(radius, radius * 0.82, length, 16),
      mat,
      [0, -length / 2 - 0.02, 0]
    );
    const cuff = add(
      pivot,
      cylinder(radius * 0.84, radius * 0.72, 0.08, 16),
      cuffMat,
      [0, -length - 0.03, 0]
    );
    if (config.stripes) {
      [-0.4, -0.49].forEach((yOffset) => {
        add(pivot, torus(radius * 0.92, 0.012, 18), config.stripeMat, [0, yOffset, 0], [Math.PI / 2, 0, 0]);
      });
    }
    return { shoulder, arm, cuff, pivot };
  }

  function addBody() {
    const skin = skinMaterial(SKIN_TONES[state.skin] || SKIN_TONES[0], 0.66);
    const skinDark = skinMaterial(new THREE.Color(SKIN_TONES[state.skin] || SKIN_TONES[0]).multiplyScalar(0.86), 0.72);
    const bodyWidth = state.body === 'slim' ? 0.93 : state.body === 'strong' ? 1.07 : 1;
    const body = new THREE.Group();
    body.scale.x = bodyWidth;
    root.add(body);
    const headGroup = new THREE.Group();
    root.add(headGroup);

    [-1, 1].forEach((side) => {
      const leg = profileLegMesh(
        side, 0.94, 0.08,
        [[0, 0.072], [0.45, 0.054], [0.62, 0.06], [1, 0.04]],
        [[0, 0.085], [1, 0.085]],
        1,
        skin
      );
      leg.userData.slot = 'bottom';
      const equippedBottom = API.getItems().find((entry) => entry.id === state.equipped.bottom);
      const shortBottom = equippedBottom && ['jorts', 'capri', 'skirt'].includes(equippedBottom.cut || equippedBottom.variant);
      if (equippedBottom && !shortBottom) {
        leg.visible = false;
        leg.raycast = () => {};
      }
      body.add(leg);
      pickables.push(leg);
      const ankle = add(body, sphere(0.043, 12), skinDark, [side * 0.085, 0.09, 0]);
      ankle.userData.slot = 'shoes';
      pickables.push(ankle);

      const arm = armPivot(body, side);
      const shoulder = add(arm, sphere(0.062, 16), skin, [0, -0.006, 0], null, [1.06, 0.86, 1]);
      shoulder.castShadow = false;
      shoulder.userData.slot = 'top';
      pickables.push(shoulder);
      const upperArm = add(arm, cylinder(0.052, 0.045, 0.32, 14), skin, [0, -0.16, 0]);
      upperArm.castShadow = false;
      upperArm.userData.slot = 'top';
      pickables.push(upperArm);
      const elbow = add(arm, sphere(0.05, 12), skin, [0, -0.32, 0], null, [1, 0.85, 1]);
      elbow.castShadow = false;
      elbow.userData.slot = 'top';
      pickables.push(elbow);
      const forearm = add(arm, cylinder(0.045, 0.037, 0.29, 14), skin, [0, -0.465, 0]);
      forearm.castShadow = false;
      forearm.userData.slot = 'top';
      pickables.push(forearm);
      const wrist = add(arm, sphere(0.035, 12), skin, [0, -0.612, 0], null, [1, 0.82, 0.95]);
      wrist.castShadow = false;
      wrist.userData.slot = 'top';
      pickables.push(wrist);
      const handGroup = new THREE.Group();
      handGroup.position.set(0, -0.65, 0.015);
      handGroup.scale.x = 1 / bodyWidth;
      arm.add(handGroup);
      const hand = add(handGroup, sphere(0.058, 14), skin, [0, 0, 0], null, [0.9, 1.1, 0.5]);
      hand.castShadow = false;
      hand.userData.slot = 'accessory';
      pickables.push(hand);
      const thumb = add(handGroup, sphere(0.023, 10), skin, [-side * 0.025, 0.02, 0.035], [0.2, 0, side * 0.45], [0.7, 1.15, 0.55]);
      thumb.castShadow = false;
      thumb.userData.slot = 'accessory';
      pickables.push(thumb);
      [0, 1, 2, 3].forEach((index) => {
        const x = (index - 1.5) * 0.016;
        const finger = add(handGroup, cylinder(0.0072, 0.0052, 0.044, 8), skin, [x, -0.045, 0.004], [0.08, 0, 0]);
        finger.castShadow = false;
        finger.userData.slot = 'accessory';
        pickables.push(finger);
        const tip = add(handGroup, sphere(0.0062, 8), skin, [x, -0.068, 0.007], null, [0.9, 1.1, 0.8]);
        tip.castShadow = false;
        tip.userData.slot = 'accessory';
        pickables.push(tip);
      });
    });

    const torsoProfile = [
      new THREE.Vector2(0, 0.86),
      new THREE.Vector2(0.12, 0.87),
      new THREE.Vector2(0.158, 0.9),
      new THREE.Vector2(0.15, 1.0),
      new THREE.Vector2(0.13, 1.08),
      new THREE.Vector2(0.145, 1.17),
      new THREE.Vector2(0.175, 1.32),
      new THREE.Vector2(0.2, 1.46),
      new THREE.Vector2(0.14, 1.51),
      new THREE.Vector2(0.054, 1.56),
      new THREE.Vector2(0, 1.57)
    ];
    const torso = new THREE.Mesh(new THREE.LatheGeometry(torsoProfile, 28), skin);
    torso.scale.z = 0.7;
    torso.castShadow = true;
    torso.receiveShadow = true;
    torso.userData.slot = 'top';
    body.add(torso);
    pickables.push(torso);

    const neck = add(headGroup, cylinder(0.044, 0.05, 0.14, 14), skin, [0, 1.56, 0]);
    const neckSoft = add(headGroup, sphere(0.06, 16), skin, [0, 1.605, 0], null, [0.92, 0.72, 0.92]);
    neckSoft.userData.slot = 'hair';
    pickables.push(neckSoft);
    neck.userData.slot = 'hair';
    pickables.push(neck);
    const head = add(headGroup, sphere(0.148, 24), skin, [0, 1.73, 0], null, [1, 1.15, 0.94]);
    head.userData.slot = 'hair';
    pickables.push(head);
    const jaw = add(headGroup, sphere(0.11, 20), skin, [0, 1.682, 0.014], null, [0.86, 0.66, 0.9]);
    jaw.userData.slot = 'hair';
    pickables.push(jaw);
    const chin = add(headGroup, sphere(0.038, 14), skin, [0, 1.632, 0.068], null, [1.4, 0.52, 0.9]);
    chin.userData.slot = 'hair';
    pickables.push(chin);
    const nose = add(headGroup, sphere(0.018, 12), skin, [0, 1.735, 0.134], null, [0.7, 1.3, 0.9]);
    nose.userData.slot = 'hair';
    pickables.push(nose);
    add(headGroup, cylinder(0.008, 0.011, 0.046, 10), skin, [0, 1.765, 0.122], [0.18, 0, 0]).userData.slot = 'hair';
    [-1, 1].forEach((side) => {
      const ear = add(headGroup, sphere(0.03, 12), skin, [side * 0.14, 1.72, 0], null, [0.55, 1, 0.7]);
      ear.userData.slot = 'hair';
      pickables.push(ear);
      add(headGroup, sphere(0.016, 8), skinDark, [side * 0.142, 1.72, 0.018], null, [0.4, 0.7, 0.3]).userData.slot = 'hair';
      const trap = add(headGroup, sphere(0.062, 14), skin, [side * 0.064, 1.512, -0.006], null, [1.2, 0.45, 0.85]);
      trap.userData.slot = 'top';
      pickables.push(trap);
    });

    if (state.equipped.hair === null) {
      add(headGroup, sphere(0.151, 20), skin, [0, 1.75, -0.004], null, [1.02, 1.08, 0.97]).userData.slot = 'hair';
    }
    return body;
  }

  function addBaseTop(slotGroup) {
    const cream = cloth('#eee4d5', { roughness: 0.86 });
    const shade = cloth('#d7c9b6', { roughness: 0.9 });
    add(slotGroup, cylinder(0.195, 0.145, 0.5, 20), cream, [0, 1.22, 0], null, [1, 1, 0.7]);
    add(slotGroup, sphere(0.162, 16), cream, [0, 1.39, 0.012], null, [1.08, 0.7, 0.73]);
    [-1, 1].forEach((side) => {
      add(slotGroup, cylinder(0.072, 0.064, 0.17, 14), cream, [side * 0.21, 1.35, 0]);
    });
    add(slotGroup, cylinder(0.146, 0.16, 0.035, 18), shade, [0, 1.0, 0], null, [1, 1, 0.72]);
    tagGroup(slotGroup, 'top');
  }

  function addBaseBottom(slotGroup) {
    const cream = cloth('#eee4d5', { roughness: 0.86 });
    const shade = cloth('#d7c9b6', { roughness: 0.9 });
    add(slotGroup, cylinder(0.17, 0.16, 0.2, 20), cream, [0, 0.88, 0], null, [1, 1, 0.8]);
    [-1, 1].forEach((side) => {
      add(slotGroup, cylinder(0.078, 0.075, 0.18, 14), cream, [side * 0.082, 0.72, 0]);
    });
    add(slotGroup, cylinder(0.171, 0.171, 0.026, 20), shade, [0, 0.965, 0], null, [1, 1, 0.8]);
    tagGroup(slotGroup, 'bottom');
  }

  function addBareFeet(slotGroup) {
    const skin = new THREE.MeshStandardMaterial({
      color: toColor(SKIN_TONES[state.skin] || SKIN_TONES[0]),
      roughness: 0.8
    });
    [-1, 1].forEach((side) => {
      add(slotGroup, sphere(0.075, 16), skin, [side * 0.082, 0.055, 0.065], null, [0.72, 0.48, 1.55]);
    });
    tagGroup(slotGroup, 'shoes');
  }

  function addModernTop(slotGroup, item, mats) {
    const { main, hi, dark, accent, cream, trim, metal } = mats;
    const crease = material(item.palette.main, { roughness: 0.84 });
    crease.color.multiplyScalar(0.76);
    const fit = item.fit || 'regular';
    const oversize = fit === 'oversize';
    const slim = fit === 'slim';
    const cropped = fit === 'cropped';
    const variant = item.variant;
    const bodyTop = 1.46;
    const bodyBottom = variant === 'bomber'
      ? (cropped ? 1.12 : 0.98)
      : cropped ? 1.17 : 0.96;
    const radius = variant === 'bomber'
      ? (oversize ? 0.242 : 0.224)
      : variant === 'vest'
        ? 0.195
        : oversize ? 0.245 : slim ? 0.192 : 0.202;
    add(slotGroup, cylinder(radius, radius * 0.94, bodyTop - bodyBottom, 28), main, [0, (bodyTop + bodyBottom) / 2, 0], null, [1, 1, 0.73]);
    add(slotGroup, sphere(radius * 1.03, 20), main, [0, bodyTop - 0.015, -0.004], null, [1.08, 0.34, 0.83]);
    add(slotGroup, torus(0.055, 0.012, 22), trim, [0, bodyTop + 0.025, 0.012], [Math.PI / 2, 0, 0], [1.3, 1, 0.9]);
    const waistFold = tube([[0.055, bodyBottom + 0.09, 0.14], [0.02, bodyBottom + 0.055, 0.155], [-0.015, bodyBottom + 0.03, 0.15]], 0.0025, crease);
    waistFold.userData.slot = 'top';
    slotGroup.add(waistFold);
    [-1, 1].forEach((side) => {
      add(slotGroup, box(0.004, 0.14, 0.006), crease, [side * radius * 0.8, bodyBottom + 0.1, 0.1], [0, 0, side * 0.14]);
      const topCrease = tube([[side * radius * 0.72, bodyTop - 0.11, 0.135], [side * radius * 0.8, bodyTop - 0.19, 0.145], [side * radius * 0.74, bodyTop - 0.27, 0.13]], 0.0022, crease);
      topCrease.userData.slot = 'top';
      slotGroup.add(topCrease);
      add(slotGroup, box(0.006, (bodyTop - bodyBottom) * 0.86, 0.008), variant === 'shirt' ? cream : hi, [side * radius * 0.96, (bodyTop + bodyBottom) / 2, 0.02], [0, 0, side * 0.04]);
    });

    if (variant === 'tee' || variant === 'tank') {
      if (variant === 'tee') {
        [-1, 1].forEach((side) => {
          const sleeve = armPivot(slotGroup, side);
          add(sleeve, sphere(radius * 0.45, 16), main, [0, -0.06, 0], null, [1.05, 0.82, 1.02]);
          add(sleeve, cylinder(radius * 0.45, radius * 0.34, 0.185, 16), main, [0, -0.14, 0]);
          add(sleeve, sphere(radius * 0.36, 14), main, [0, -0.235, 0], null, [1, 0.72, 1]);
          add(sleeve, torus(radius * 0.33, 0.006, 18), trim, [0, -0.245, 0], [Math.PI / 2, 0, 0], [1, 1, 0.85]);
        });
      } else {
        [-1, 1].forEach((side) => {
          add(slotGroup, torus(0.078, 0.009, 18), trim, [side * radius * 0.8, bodyTop - 0.035, 0], [Math.PI / 2, 0, side * 0.45], [0.8, 1, 1]);
          add(slotGroup, box(0.018, 0.13, 0.028), main, [side * 0.075, bodyTop + 0.04, 0.015], [0, 0, side * 0.08]);
        });
        add(slotGroup, torus(0.06, 0.01, 20), trim, [0, bodyTop + 0.012, 0], [Math.PI / 2, 0, 0], [1.2, 1, 0.78]);
        add(slotGroup, box(0.04, 0.012, 0.012), hi, [0, bodyTop + 0.008, 0.13]);
      }
      add(slotGroup, torus(radius * 0.96, 0.009, 24), trim, [0, bodyBottom, 0], [Math.PI / 2, 0, 0], [1, 1, 0.73]);
      add(slotGroup, box(0.05, 0.016, 0.012), cream, [-0.02, bodyBottom + 0.012, 0.15]);
    } else if (variant === 'longsleeve' || variant === 'shirt') {
      [-1, 1].forEach((side) => {
        const sleeve = makeSleeve(slotGroup, side, main, trim, { radius: oversize ? 0.105 : slim ? 0.07 : 0.085, length: 0.5 });
        if (variant === 'shirt') {
          [0, 1].forEach((index) => add(sleeve.pivot, sphere(0.008, 8), metal, [0, -0.48 - index * 0.022, 0.085]));
        }
      });
      if (variant === 'longsleeve') {
        add(slotGroup, torus(radius * 0.96, 0.009, 24), trim, [0, bodyBottom, 0], [Math.PI / 2, 0, 0], [1, 1, 0.73]);
        add(slotGroup, box(0.05, 0.016, 0.012), cream, [-0.02, bodyBottom + 0.012, 0.15]);
        if (item.turtleneck) {
          add(slotGroup, cylinder(0.082, 0.095, 0.13, 18), main, [0, 1.55, 0], null, [1, 1, 0.9]);
          add(slotGroup, torus(0.09, 0.007, 18), trim, [0, 1.615, 0], [Math.PI / 2, 0, 0]);
        }
      }
    } else if (variant === 'bomber') {
      [-1, 1].forEach((side) => {
        add(slotGroup, sphere(0.118, 16), main, [side * 0.215, 1.43, 0], null, [1.15, 0.85, 1.1]);
        const sleeve = makeSleeve(slotGroup, side, main, trim, { radius: 0.115, length: 0.49 });
        add(sleeve.pivot, torus(0.09, 0.011, 20), trim, [0, -0.51, 0], [Math.PI / 2, 0, 0]);
      });
      add(slotGroup, torus(radius * 0.94, 0.016, 26), trim, [0, bodyBottom, 0], [Math.PI / 2, 0, 0], [1, 1, 0.8]);
      add(slotGroup, torus(0.075, 0.012, 20), trim, [0, bodyTop + 0.045, 0], [Math.PI / 2, 0, 0], [1.1, 1, 0.85]);
      add(slotGroup, box(0.016, 0.36, 0.012), metal, [0, 1.26, 0.185]);
      add(slotGroup, sphere(0.012, 8), metal, [0, bodyTop + 0.005, 0.19]);
      add(slotGroup, box(0.085, 0.048, 0.012), accent, [-0.125, 1.34, 0.18]);
      add(slotGroup, box(0.045, 0.032, 0.012), cream, [0.13, 1.34, 0.18]);
      add(slotGroup, box(0.07, 0.018, 0.01), hi, [0.13, 1.3, 0.18]);
      if (item.puffer) {
        [1.08, 1.2, 1.32, 1.44].forEach((y) => add(slotGroup, torus(radius * 0.97, 0.006, 24), trim, [0, y, 0], [Math.PI / 2, 0, 0], [1, 1, 0.8]));
      }
    } else if (variant === 'vest') {
      [-1, 1].forEach((side) => {
        add(slotGroup, torus(0.072, 0.007, 18), dark, [side * 0.19, 1.37, 0], [Math.PI / 2, 0, 0], [1, 1, 0.9]);
      });
      add(slotGroup, box(0.105, 0.3, 0.016), accent, [-0.06, 1.31, 0.155], [0, 0, 0.22]);
      add(slotGroup, box(0.105, 0.3, 0.016), accent, [0.06, 1.31, 0.155], [0, 0, -0.22]);
      [1.32, 1.23, 1.14, 1.05].forEach((y) => add(slotGroup, sphere(0.01, 8), metal, [0, y, 0.18]));
      add(slotGroup, box(0.09, 0.012, 0.014), dark, [-0.11, 1.0, 0.15]);
      add(slotGroup, box(0.09, 0.012, 0.014), dark, [0.11, 1.0, 0.15]);
    }

    if (variant === 'shirt') {
      add(slotGroup, box(0.06, 0.028, 0.045), cream, [-0.035, 1.47, 0.115], [0, 0, -0.32]);
      add(slotGroup, box(0.06, 0.028, 0.045), cream, [0.035, 1.47, 0.115], [0, 0, 0.32]);
      add(slotGroup, box(0.028, 0.04, 0.03), cream, [0, 1.5, 0.11]);
      add(slotGroup, box(0.038, 0.35, 0.012), trim, [0, 1.27, 0.17]);
      [1.4, 1.31, 1.22, 1.13, 1.04].forEach((y) => add(slotGroup, sphere(0.009, 8), metal, [0, y, 0.18]));
      add(slotGroup, box(0.085, 0.07, 0.012), dark, [-0.115, 1.32, 0.15]);
      if (item.cardigan) {
        add(slotGroup, box(0.012, 0.4, 0.012), dark, [0, 1.27, 0.174]);
        [1.42, 1.32, 1.22, 1.12].forEach((y) => add(slotGroup, sphere(0.009, 8), metal, [0, y, 0.184]));
      }
      add(slotGroup, box(0.075, 0.012, 0.014), hi, [-0.115, 1.33, 0.158]);
      add(slotGroup, box(0.07, 0.012, 0.012), hi, [0.13, 1.12, 0.15]);
    }

    if (variant === 'tee' || variant === 'longsleeve') {
      if (item.collection === 'street') {
        add(slotGroup, box(0.1, 0.075, 0.012), accent, [0, 1.32, 0.16]);
        add(slotGroup, box(0.06, 0.012, 0.014), dark, [0, 1.32, 0.17]);
        add(slotGroup, box(0.012, 0.06, 0.014), dark, [0, 1.32, 0.17]);
      } else if (item.collection === 'muse') {
        add(slotGroup, sphere(0.026, 12), accent, [0, 1.32, 0.16], null, [1, 0.85, 0.35]);
        add(slotGroup, sphere(0.026, 12), accent, [-0.018, 1.305, 0.16], null, [1, 0.85, 0.35]);
        add(slotGroup, cone(0.02, 0.035, 10), accent, [0, 1.285, 0.16], [0, 0, Math.PI]);
      } else {
        add(slotGroup, box(0.085, 0.055, 0.01), accent, [0, 1.32, 0.16]);
        add(slotGroup, box(0.055, 0.012, 0.012), hi, [0, 1.32, 0.168]);
      }
    }
    if (item.brand) {
      addBrandMark(slotGroup, item, [variant === 'shirt' ? 0.105 : 0, 1.315, 0.171], 1.2, accent);
    }
  }


  const FULL_SEAT_DEPTH = [[0, 0.94], [0.12, 1.25], [0.22, 1.5], [0.32, 1.32], [0.42, 1.08], [0.55, 0.98], [1, 0.94]];
  const FULL_SEAT_SHIFT = [[0, 0], [0.12, -0.015], [0.22, -0.025], [0.32, -0.014], [0.45, -0.004], [1, 0]];
  const FITTED_SEAT_DEPTH = [[0, 0.94], [0.12, 1.18], [0.22, 1.35], [0.32, 1.15], [0.42, 0.98], [0.55, 0.9], [1, 0.88]];
  const SHORT_SEAT_DEPTH = [[0, 0.94], [0.2, 1.3], [0.4, 1.35], [0.6, 1.05], [1, 0.94]];
  const SHORT_SEAT_SHIFT = [[0, 0], [0.2, -0.015], [0.4, -0.01], [0.6, 0], [1, 0]];

  const BOTTOM_LEG_PROFILES = {
    flare: {
      rx: [[0, 0.16], [0.1, 0.125], [0.22, 0.094], [0.38, 0.078], [0.52, 0.069], [0.62, 0.06], [0.72, 0.067], [0.84, 0.09], [1, 0.132]],
      center: [[0, 0.035], [0.1, 0.062], [0.2, 0.088], [0.27, 0.098], [0.6, 0.1], [1, 0.13]],
      depth: FITTED_SEAT_DEPTH,
      shift: FULL_SEAT_SHIFT
    },
    bootcut: {
      rx: [[0, 0.16], [0.1, 0.125], [0.22, 0.093], [0.38, 0.077], [0.52, 0.067], [0.62, 0.058], [0.75, 0.065], [1, 0.098]],
      center: [[0, 0.035], [0.1, 0.062], [0.2, 0.088], [0.27, 0.098], [0.6, 0.099], [1, 0.112]],
      depth: FITTED_SEAT_DEPTH,
      shift: FULL_SEAT_SHIFT
    },
    wide: {
      rx: [[0, 0.16], [0.1, 0.13], [0.2, 0.112], [0.35, 0.108], [0.6, 0.118], [1, 0.132]],
      center: [[0, 0.04], [0.1, 0.07], [0.2, 0.1], [0.3, 0.12], [0.6, 0.135], [1, 0.15]],
      depth: FULL_SEAT_DEPTH,
      shift: FULL_SEAT_SHIFT
    },
    cargo: {
      rx: [[0, 0.16], [0.1, 0.13], [0.2, 0.105], [0.5, 0.1], [0.8, 0.102], [1, 0.11]],
      center: [[0, 0.04], [0.1, 0.068], [0.2, 0.095], [0.3, 0.11], [1, 0.13]],
      depth: FULL_SEAT_DEPTH,
      shift: FULL_SEAT_SHIFT
    },
    baggy: {
      rx: [[0, 0.16], [0.1, 0.13], [0.22, 0.115], [0.4, 0.132], [0.7, 0.126], [1, 0.12]],
      center: [[0, 0.04], [0.1, 0.075], [0.2, 0.11], [0.28, 0.128], [0.5, 0.145], [1, 0.16]],
      depth: FULL_SEAT_DEPTH,
      shift: FULL_SEAT_SHIFT
    },
    parachute: {
      rx: [[0, 0.155], [0.12, 0.12], [0.25, 0.13], [0.5, 0.135], [0.75, 0.12], [0.88, 0.09], [1, 0.075]],
      center: [[0, 0.04], [0.1, 0.075], [0.2, 0.112], [0.3, 0.135], [0.5, 0.15], [0.75, 0.155], [1, 0.13]],
      depth: [[0, 0.94], [0.12, 1.0], [0.22, 1.1], [0.32, 1.0], [1, 0.94]],
      shift: [[0, 0], [0.2, -0.01], [0.4, 0], [1, 0]]
    },
    track: {
      rx: [[0, 0.16], [0.1, 0.12], [0.22, 0.095], [0.55, 0.07], [0.8, 0.062], [1, 0.07]],
      center: [[0, 0.04], [0.1, 0.07], [0.2, 0.09], [0.27, 0.098], [1, 0.09]],
      depth: FULL_SEAT_DEPTH,
      shift: FULL_SEAT_SHIFT
    },
    leggings: {
      rx: [[0, 0.16], [0.1, 0.13], [0.22, 0.1], [0.3, 0.064], [0.6, 0.052], [0.85, 0.043], [1, 0.042]],
      center: [[0, 0.04], [0.1, 0.07], [0.2, 0.09], [0.27, 0.1], [1, 0.086]],
      depth: FULL_SEAT_DEPTH,
      shift: FULL_SEAT_SHIFT
    },
    straight: {
      rx: [[0, 0.16], [0.1, 0.125], [0.22, 0.1], [0.6, 0.082], [1, 0.086]],
      center: [[0, 0.04], [0.1, 0.07], [0.2, 0.09], [0.27, 0.1], [1, 0.092]],
      depth: FULL_SEAT_DEPTH,
      shift: FULL_SEAT_SHIFT
    },
    tailored: {
      rx: [[0, 0.16], [0.1, 0.125], [0.22, 0.1], [0.6, 0.08], [1, 0.075]],
      center: [[0, 0.04], [0.1, 0.07], [0.2, 0.09], [0.27, 0.1], [1, 0.092]],
      depth: FULL_SEAT_DEPTH,
      shift: FULL_SEAT_SHIFT
    },
    jorts: {
      rx: [[0, 0.16], [0.1, 0.13], [0.3, 0.11], [0.5, 0.11], [0.6, 0.105], [1, 0.116]],
      center: [[0, 0.04], [0.1, 0.065], [0.3, 0.09], [0.5, 0.105], [0.56, 0.11], [1, 0.13]],
      depth: SHORT_SEAT_DEPTH,
      shift: SHORT_SEAT_SHIFT,
      hem: 0.55
    },
    capri: {
      rx: [[0, 0.16], [0.1, 0.13], [0.22, 0.11], [0.35, 0.095], [0.55, 0.086], [1, 0.082]],
      center: [[0, 0.04], [0.1, 0.06], [0.3, 0.082], [0.42, 0.095], [1, 0.094]],
      depth: [[0, 0.94], [0.15, 1.3], [0.3, 1.4], [0.45, 1.15], [1, 0.94]],
      shift: SHORT_SEAT_SHIFT,
      hem: 0.43
    }
  };

  function bottomPlan(item, waistY) {
    const cut = item.bootcut ? 'bootcut' : item.capri ? 'capri' : (item.cut || item.variant || 'straight');
    const profile = BOTTOM_LEG_PROFILES[cut] || BOTTOM_LEG_PROFILES.straight;
    const hemY = profile.hem || 0.13;
    const topY = waistY - 0.005;
    const topOuter = sampleProfile(profile.center, 0) + sampleProfile(profile.rx, 0);
    const hipR = Math.min(0.23, Math.max(0.172, topOuter));
    return { cut, profile, hemY, topY, waistY, hipR };
  }

  function trouserSurfaceZ(plan, x, y, sign) {
    const span = Math.max(0.001, plan.topY - plan.hemY);
    const t = Math.max(0, Math.min(1, (plan.topY - y) / span));
    const frame = legFrame(plan, t);
    let best = 0;
    [-1, 1].forEach((side) => {
      const dx = x - side * frame.cx;
      if (Math.abs(dx) >= frame.rx) return;
      const z = Math.sqrt(1 - (dx / frame.rx) ** 2) * frame.rx * frame.depth + frame.shift;
      if (z > best) best = z;
    });
    return best * sign;
  }

  function legFrame(plan, t) {
    const depth = Array.isArray(plan.profile.depth) ? sampleProfile(plan.profile.depth, t) : plan.profile.depth;
    return {
      rx: sampleProfile(plan.profile.rx, t),
      cx: sampleProfile(plan.profile.center, t),
      depth,
      shift: plan.profile.shift ? sampleProfile(plan.profile.shift, t) : 0,
      y: plan.topY - t * (plan.topY - plan.hemY)
    };
  }

  function addTrouserSeam(slotGroup, points, mat, radius) {
    const seam = tube(points, radius, mat);
    seam.userData.slot = 'bottom';
    slotGroup.add(seam);
    return seam;
  }

  function addTrouserLegDetails(slotGroup, item, plan, side, mats) {
    const { stitch, crease, metal, hi, dark, main, denim, style } = mats;
    const fullLength = plan.hemY < 0.24;
    const sporty = style === 'sport' || style === 'technical';
    const thread = denim ? stitch : crease;
    const seamMat = sporty ? dark : thread;
    const outer = [];
    const inner = [];
    const front = [];
    const back = [];
    const steps = 12;
    for (let index = 0; index <= steps; index += 1) {
      const t = 0.04 + (index / steps) * 0.94;
      const frame = legFrame(plan, t);
      const rz = frame.rx * frame.depth;
      outer.push([side * (frame.cx + frame.rx * 0.965), frame.y, rz * 0.24 + frame.shift]);
      inner.push([side * (frame.cx - frame.rx * 0.965), frame.y, rz * 0.06 + frame.shift]);
      front.push([side * frame.cx, frame.y, rz * 1.008 + frame.shift]);
      back.push([side * frame.cx, frame.y, -rz * 1.004 + frame.shift]);
    }
    if (denim) {
      addTrouserSeam(slotGroup, outer.map(([x, y, z]) => [x + side * 0.0015, y, z + 0.001]), main, 0.0036);
      addTrouserSeam(slotGroup, inner.map(([x, y, z]) => [x - side * 0.0015, y, z]), main, 0.003);
    }
    addTrouserSeam(slotGroup, outer, seamMat, denim ? 0.003 : sporty ? 0.0012 : 0.0014);
    if (denim) {
      addTrouserSeam(slotGroup, outer.map(([x, y, z]) => [x - side * 0.008, y, z + 0.005]), stitch, 0.0019);
    }
    addTrouserSeam(slotGroup, inner, denim ? stitch : sporty ? dark : crease, denim ? 0.0022 : sporty ? 0.001 : 0.0012);
    if (fullLength && !sporty) {
      addTrouserSeam(slotGroup, front, crease, denim ? 0.0026 : 0.0018);
      addTrouserSeam(slotGroup, back, crease, 0.0018);
    }

    if (plan.cut === 'track' || plan.cut === 'leggings') {
      const stripe = [];
      const stripeDark = [];
      for (let index = 0; index <= 10; index += 1) {
        const t = 0.06 + (index / 10) * 0.9;
        const frame = legFrame(plan, t);
        stripe.push([side * (frame.cx + frame.rx * 0.992), frame.y, 0]);
        stripeDark.push([side * (frame.cx + frame.rx * 0.958), frame.y, frame.rx * frame.depth * 0.12 + frame.shift]);
      }
      addTrouserSeam(slotGroup, stripe, hi, 0.0045);
      addTrouserSeam(slotGroup, stripeDark, dark, 0.0018);
    }

    if (plan.cut === 'parachute') {
      [0.34, 0.58].forEach((t) => {
        const frame = legFrame(plan, t);
        const ringPoints = [];
        for (let index = 0; index <= 12; index += 1) {
          const angle = (index / 12) * Math.PI * 2;
          ringPoints.push([
            side * frame.cx + Math.cos(angle) * frame.rx * 1.004,
            frame.y,
            Math.sin(angle) * frame.rx * frame.depth * 1.004 + frame.shift
          ]);
        }
        addTrouserSeam(slotGroup, ringPoints, crease, 0.0012);
      });
    }

    if (item.cargo || plan.cut === 'cargo') {
      const t = fullLength ? 0.34 : 0.32;
      const frame = legFrame(plan, t);
      const theta = 0.62;
      const nx = side * Math.cos(theta);
      const nz = Math.sin(theta);
      const tx = -side * Math.sin(theta);
      const tz = Math.cos(theta);
      const surfaceX = side * (frame.cx + frame.rx * Math.cos(theta));
      const surfaceZ = frame.rx * frame.depth * Math.sin(theta) + frame.shift;
      const px = surfaceX + nx * 0.018;
      const pz = surfaceZ + nz * 0.018;
      const angle = side === 1 ? -theta : Math.PI + theta;
      const face = (dy, dz) => [px + nx * 0.0205 + tx * dz, frame.y + dy, pz + nz * 0.0205 + tz * dz];
      const pocket = add(slotGroup, box(0.04, 0.15, 0.1), main, [px, frame.y, pz]);
      pocket.rotation.y = angle;
      pocket.castShadow = false;
      const flap = add(slotGroup, box(0.044, 0.034, 0.106), main, [px + nx * 0.002, frame.y + 0.086, pz + nz * 0.002]);
      flap.rotation.y = angle;
      flap.castShadow = false;
      addTrouserSeam(slotGroup, [face(0.079, -0.048), face(0.079, 0.048)], crease, 0.0014);
      addTrouserSeam(slotGroup, [
        face(-0.058, -0.044), face(-0.058, 0.044), face(0.05, 0.044), face(0.05, -0.044), face(-0.058, -0.044)
      ], thread, 0.0017);
      addTrouserSeam(slotGroup, [face(0.034, 0), face(-0.045, 0)], crease, 0.0013);
      add(slotGroup, sphere(0.008, 10), metal, face(0.062, 0.026));
    }

    if (denim) {
      [0.43, 0.48].forEach((t) => {
        const frame = legFrame(plan, t);
        const rz = frame.rx * frame.depth;
        addTrouserSeam(slotGroup, [
          [side * (frame.cx - frame.rx * 0.52), frame.y + 0.018, rz * 0.86 + frame.shift],
          [side * (frame.cx + frame.rx * 0.02), frame.y, rz * 0.995 + frame.shift],
          [side * (frame.cx + frame.rx * 0.54), frame.y - 0.016, rz * 0.84 + frame.shift]
        ], crease, 0.0015);
      });
      [0.92, 0.97].forEach((t) => {
        const frame = legFrame(plan, t);
        const rz = frame.rx * frame.depth;
        addTrouserSeam(slotGroup, [
          [side * (frame.cx - frame.rx * 0.55), frame.y + 0.012, rz * 0.83 + frame.shift],
          [side * (frame.cx + frame.rx * 0.05), frame.y - 0.006, rz * 0.99 + frame.shift],
          [side * (frame.cx + frame.rx * 0.6), frame.y + 0.004, rz * 0.82 + frame.shift]
        ], crease, 0.0014);
      });
      [0.34, 0.4, 0.46].forEach((t) => {
        const frame = legFrame(plan, t);
        const rz = -frame.rx * frame.depth;
        const at = (fraction, dy) => [
          side * (frame.cx + frame.rx * fraction),
          frame.y + dy,
          rz * Math.sqrt(Math.max(0, 1 - fraction * fraction)) * 0.995 + frame.shift
        ];
        addTrouserSeam(slotGroup, [at(-0.55, 0.02), at(0.05, 0), at(0.6, -0.018)], crease, 0.0011);
      });
    } else if (fullLength && !sporty) {
      [0.36, 0.5].forEach((t) => {
        const frame = legFrame(plan, t);
        const rz = frame.rx * frame.depth;
        addTrouserSeam(slotGroup, [
          [side * (frame.cx - frame.rx * 0.5), frame.y + 0.02, rz * 0.86 + frame.shift],
          [side * (frame.cx + frame.rx * 0.1), frame.y, rz * 0.995 + frame.shift],
          [side * (frame.cx + frame.rx * 0.55), frame.y - 0.018, rz * 0.84 + frame.shift]
        ], crease, 0.0018);
      });
    }

    if (sporty) {
      [0.4, 0.58].forEach((t) => {
        const frame = legFrame(plan, t);
        const rz = frame.rx * frame.depth;
        addTrouserSeam(slotGroup, [
          [side * (frame.cx - frame.rx * 0.46), frame.y + 0.012, rz * 0.88 + frame.shift],
          [side * (frame.cx + frame.rx * 0.02), frame.y, rz * 0.995 + frame.shift],
          [side * (frame.cx + frame.rx * 0.5), frame.y - 0.012, rz * 0.86 + frame.shift]
        ], dark, 0.0011);
      });
      if (plan.cut === 'track') {
        const zipPoints = [];
        for (let index = 0; index <= 4; index += 1) {
          const t = 0.86 + index * 0.028;
          const frame = legFrame(plan, t);
          const rz = frame.rx * frame.depth;
          zipPoints.push([side * (frame.cx + frame.rx * 0.975), frame.y, rz * 0.2 + frame.shift]);
        }
        addTrouserSeam(slotGroup, zipPoints, dark, 0.0022);
        for (let index = 0; index < 4; index += 1) {
          const frame = legFrame(plan, 0.885 + index * 0.027);
          const rz = frame.rx * frame.depth;
          add(slotGroup, box(0.004, 0.007, 0.012), metal, [side * (frame.cx + frame.rx * 0.99), frame.y, rz * 0.2 + frame.shift + 0.007]);
        }
      } else if (plan.cut === 'leggings') {
        const ankle = legFrame(plan, 0.94);
        addTrouserSeam(slotGroup, [
          [side * (ankle.cx - ankle.rx * 0.7), ankle.y, ankle.rx * ankle.depth * 0.7 + ankle.shift],
          [side * (ankle.cx + ankle.rx * 0.7), ankle.y, ankle.rx * ankle.depth * 0.7 + ankle.shift]
        ], dark, 0.0012);
      } else if (plan.cut === 'parachute') {
        const toggle = legFrame(plan, 0.86);
        const tz = toggle.rx * toggle.depth * 0.2 + toggle.shift;
        add(slotGroup, box(0.014, 0.024, 0.012), dark, [side * (toggle.cx + toggle.rx * 0.96), toggle.y, tz]);
        add(slotGroup, torus(0.012, 0.0025, 12), metal, [side * (toggle.cx + toggle.rx * 0.99), toggle.y + 0.025, tz], [0, 0, Math.PI / 2]);
        addTrouserSeam(slotGroup, [
          [side * (toggle.cx + toggle.rx * 0.95), toggle.y - 0.02, tz],
          [side * (toggle.cx + toggle.rx * 0.93), toggle.y - 0.08, tz + 0.006]
        ], crease, 0.002);
      }
      const cuff = legFrame(plan, 1);
      add(slotGroup, cylinder(cuff.rx * 0.99, cuff.rx * 0.97, 0.028, 24), plan.cut === 'leggings' ? main : dark, [side * cuff.cx, plan.hemY + 0.035, cuff.shift], null, [1, 1, cuff.depth]);
    }

    const hem = legFrame(plan, 1);
    const hemCx = side * hem.cx;
    add(slotGroup, torus(hem.rx * 0.985, denim ? 0.0028 : 0.0016, 24), thread, [hemCx, plan.hemY + 0.024, hem.shift], [Math.PI / 2, 0, 0], [1, 1, hem.depth]);
    add(slotGroup, torus(hem.rx * 0.955, denim ? 0.0017 : 0.0011, 24), thread, [hemCx, plan.hemY + 0.042, hem.shift], [Math.PI / 2, 0, 0], [1, 1, hem.depth]);
    if (plan.cut === 'jorts') {
      for (let index = 0; index < 5; index += 1) {
        const angle = 0.7 + index * 0.42;
        add(slotGroup, box(0.0022, 0.024, 0.0022), hi, [side * hem.cx + Math.cos(angle) * hem.rx * 0.97, plan.hemY + 0.012, Math.sin(angle) * hem.rx * hem.depth * 0.97 + hem.shift]);
      }
    }
  }

  function addTrouserWaistDetails(slotGroup, item, plan, mats, denim) {
    const { main, stitch, crease, metal, leather, dark, trim, style } = mats;
    const waistY = plan.waistY;
    const sporty = style === 'sport' || style === 'technical';
    const thread = denim ? stitch : crease;
    const frontZ = (x, y) => trouserSurfaceZ(plan, x, y, 1) + 0.0015;
    const backZ = (x, y) => trouserSurfaceZ(plan, x, y, -1) - 0.0015;
    const bandR = plan.hipR + 0.004;
    const bandZ = (x, face) => face * Math.sqrt(Math.max(0, 1 - (x / bandR) ** 2)) * bandR * 0.82;

    if (!sporty) {
      const fly = [
        [0.002, waistY - 0.005, frontZ(0.002, waistY - 0.005)],
        [0.004, waistY - 0.045, frontZ(0.004, waistY - 0.045)],
        [0.012, waistY - 0.085, frontZ(0.012, waistY - 0.085)],
        [0.034, waistY - 0.105, frontZ(0.034, waistY - 0.105)],
        [0.052, waistY - 0.115, frontZ(0.052, waistY - 0.115)]
      ];
      addTrouserSeam(slotGroup, fly, thread, denim ? 0.0024 : 0.0014);
      if (denim) addTrouserSeam(slotGroup, fly.map(([x, y, z]) => [x + 0.008, y, z + 0.0015]), thread, 0.0015);
      addTrouserSeam(slotGroup, [
        [0, waistY - 0.12, frontZ(0, waistY - 0.12)],
        [0, 0.79, frontZ(0, 0.79)],
        [0, 0.715, frontZ(0, 0.715)]
      ], crease, 0.0018);
      if (denim) {
        add(slotGroup, box(0.004, 0.09, 0.004), dark, [0.006, waistY - 0.055, frontZ(0.006, waistY - 0.055)]);
        addTrouserSeam(slotGroup, [
          [-0.03, 0.72, frontZ(0.03, 0.72)],
          [0, 0.703, frontZ(0, 0.703)],
          [0.03, 0.72, frontZ(0.03, 0.72)]
        ], crease, 0.0018);
      }
      add(slotGroup, cylinder(0.012, 0.012, 0.006, 16), metal, [0, waistY + 0.012, bandZ(0, 1) + 0.004], [Math.PI / 2, 0, 0]);
    }

    if (!sporty) {
      const loops = denim
        ? [[-0.14, 1], [-0.08, 1], [0.08, 1], [0.14, 1], [-0.11, -1], [0, -1], [0.11, -1]]
        : [[-0.13, 1], [-0.07, 1], [0.07, 1], [0.13, 1], [0, -1]];
      loops.forEach(([x, face]) => {
        const loopZ = bandZ(x, face) + face * 0.005;
        add(slotGroup, box(0.014, 0.05, 0.011), main, [x, waistY + 0.006, loopZ]);
        if (denim) addTrouserSeam(slotGroup, [[x - 0.005, waistY + 0.024, loopZ + face * 0.007], [x - 0.005, waistY - 0.014, loopZ + face * 0.007]], stitch, 0.0011);
      });
    }

    if (!sporty) {
      [-1, 1].forEach((side) => {
        if (denim) {
          const pocket = [0.15, 0.12, 0.09, 0.062].map((x, index) => {
            const y = waistY - 0.006 - index * 0.026;
            return [side * x, y, frontZ(side * x, y)];
          });
          addTrouserSeam(slotGroup, pocket.map(([x, y, z]) => [x, y, z - 0.0012]), crease, 0.0022);
          addTrouserSeam(slotGroup, pocket, thread, 0.0021);
          const rivet = pocket[0];
          add(slotGroup, sphere(0.0055, 8), metal, [rivet[0], rivet[1], rivet[2] + 0.0025]);
          if (side === 1) {
            addTrouserSeam(slotGroup, [
              [0.105, waistY - 0.04, frontZ(0.105, waistY - 0.04)],
              [0.092, waistY - 0.064, frontZ(0.092, waistY - 0.064)],
              [0.078, waistY - 0.082, frontZ(0.078, waistY - 0.082)]
            ], thread, 0.0013);
            add(slotGroup, sphere(0.004, 8), metal, [0.078, waistY - 0.082, frontZ(0.078, waistY - 0.082) + 0.0025]);
          }
        } else {
          const pocket = [0.155, 0.125, 0.095].map((x, index) => {
            const y = waistY - 0.014 - index * 0.038;
            return [side * x, y, frontZ(side * x, y)];
          });
          addTrouserSeam(slotGroup, pocket, thread, 0.0016);
          addTrouserSeam(slotGroup, pocket.map(([x, y, z]) => [x, y + 0.005, z - 0.001]), crease, 0.001);
        }
      });
    }

    if (plan.hemY < 0.6 && !sporty) {
      if (denim) {
        [-1, 1].forEach((side) => {
          const cx = side * 0.082;
          const top = waistY - (waistY > 0.94 ? 0.10 : 0.07);
          const bottom = top - (waistY > 0.94 ? 0.10 : 0.08);
          const half = 0.042;
          const pocket = [
            [cx - half, top], [cx + half, top], [cx + half, bottom + 0.022],
            [cx, bottom], [cx - half, bottom + 0.022], [cx - half, top]
          ].map(([x, y]) => [x, y, backZ(x, y) - 0.002]);
          addTrouserSeam(slotGroup, pocket, thread, 0.0022);
          addTrouserSeam(slotGroup, pocket.map(([x, y, z]) => [cx + (x - cx) * 0.88, y + 0.003, z - 0.001]), thread, 0.0012);
          addTrouserSeam(slotGroup, [
            [cx - 0.022, top - 0.004, backZ(cx - 0.022, top - 0.004) - 0.002],
            [cx + 0.022, top - 0.004, backZ(cx + 0.022, top - 0.004) - 0.002]
          ], thread, 0.0014);
        });
        const yoke = [-0.13, -0.07, 0, 0.07, 0.13].map((x) => {
          const y = waistY - 0.045 - (1 - Math.abs(x) / 0.13) * 0.02;
          return [x, y, backZ(x, y) - 0.002];
        });
        addTrouserSeam(slotGroup, yoke, thread, 0.0022);
      } else {
        [-1, 1].forEach((side) => {
          const cx = side * 0.082;
          const y = waistY - 0.105;
          addTrouserSeam(slotGroup, [
            [cx - 0.042, y, backZ(cx - 0.042, y) - 0.002],
            [cx + 0.042, y, backZ(cx + 0.042, y) - 0.002]
          ], thread, 0.0018);
          addTrouserSeam(slotGroup, [
            [cx - 0.042, y - 0.006, backZ(cx - 0.042, y - 0.006) - 0.002],
            [cx + 0.042, y - 0.006, backZ(cx + 0.042, y - 0.006) - 0.002]
          ], thread, 0.001);
        });
      }
      addTrouserSeam(slotGroup, [
        [0, waistY - 0.01, backZ(0, waistY - 0.01)],
        [0, 0.8, backZ(0, 0.8)],
        [0, 0.71, backZ(0, 0.71)]
      ], crease, 0.0013);
    }

    if (denim) {
      const patchX = 0.085;
      const patchY = waistY - 0.055;
      add(slotGroup, box(0.07, 0.046, 0.007), leather, [patchX, patchY, backZ(patchX, patchY) - 0.003]);
      addBrandMark(slotGroup, item, [patchX, patchY, backZ(patchX, patchY) - 0.008], 0.4, stitch);
      [-1, 1].forEach((side) => {
        const base = Math.min(waistY - 0.12, 0.83);
        for (let index = 0; index < 2; index += 1) {
          const y0 = base - index * 0.026;
          const points = [0.045, 0.085, 0.125].map((x, pointIndex) => {
            const y = y0 + (pointIndex === 0 ? 0.012 : pointIndex === 1 ? -0.002 : -0.02);
            return [side * x, y, frontZ(side * x, y) + 0.0015];
          });
          addTrouserSeam(slotGroup, points, crease, 0.0018);
        }
      });
    }

    if (sporty) {
      add(slotGroup, box(0.028, 0.012, 0.006), metal, [0.12, waistY + 0.006, bandZ(0.12, 1) + 0.008]);
      if (style === 'technical') {
        add(slotGroup, torus(0.018, 0.003, 12), metal, [-0.16, waistY - 0.005, bandZ(-0.16, 1) + 0.006], [Math.PI / 2, 0, 0]);
      }
    }

    addBrandMark(slotGroup, item, [0.1, waistY + 0.012, bandZ(0.1, 1) + 0.004], 0.6, denim ? stitch : trim);
  }

  function addModernBottom(slotGroup, item, mats) {
    const { main, hi, dark, trim, metal, denim, stitch, leather } = mats;
    const crease = material(item.palette.main, { roughness: 0.86 });
    crease.color.multiplyScalar(0.7);
    const fit = item.fit || 'mid';
    const waistY = fit === 'high' ? 0.975 : fit === 'low' ? 0.855 : 0.925;
    const variant = item.variant;
    const plan = bottomPlan(item, waistY);
    const style = denim ? 'denim' : (plan.cut === 'track' || plan.cut === 'leggings') ? 'sport' : plan.cut === 'parachute' ? 'technical' : 'tailored';
    const waistR = plan.hipR + 0.004;
    const depthScale = 0.82;

    add(slotGroup, cylinder(waistR, waistR * 0.985, 0.055, 22), main, [0, waistY, 0], null, [1, 1, depthScale]);
    add(slotGroup, cylinder(waistR * 1.006, waistR * 1.006, 0.01, 22), dark, [0, waistY + 0.03, 0], null, [1, 1, depthScale]);
    add(slotGroup, cylinder(waistR * 0.99, waistR * 0.99, 0.009, 22), dark, [0, waistY + 0.022, 0], null, [1, 1, depthScale]);

    if (variant === 'skirt') {
      const length = item.length || 'midi';
      const hemY = length === 'mini' ? 0.64 : length === 'maxi' ? 0.16 : 0.4;
      const bottomR = length === 'mini' ? 0.215 : length === 'maxi' ? 0.27 : 0.24;
      const skirt = new THREE.CylinderGeometry(waistR * 0.97, bottomR, waistY - 0.03 - hemY, 32, 4, true);
      add(slotGroup, skirt, main, [0, (waistY + hemY) / 2, 0], null, [1, 1, 0.86]);
      add(slotGroup, torus(bottomR * 0.97, 0.01, 32), trim, [0, hemY, 0], [Math.PI / 2, 0, 0], [1, 1, 0.86]);
      add(slotGroup, torus(waistR * 0.985, 0.012, 28), dark, [0, waistY - 0.02, 0], [Math.PI / 2, 0, 0], [1, 1, 0.86]);
      const thread = denim ? stitch : crease;
      add(slotGroup, torus(waistR * 1.002, 0.0016, 28), thread, [0, waistY + 0.027, 0], [Math.PI / 2, 0, 0], [1, 1, depthScale]);
      add(slotGroup, torus(waistR * 0.985, 0.0014, 28), thread, [0, waistY - 0.026, 0], [Math.PI / 2, 0, 0], [1, 1, depthScale]);
      if (!denim) {
        [-0.12, -0.06, 0, 0.06, 0.12].forEach((x) => {
          add(slotGroup, box(0.004, waistY - hemY - 0.06, 0.004), hi, [x, (waistY + hemY) / 2, 0.145]);
        });
        add(slotGroup, box(0.012, (waistY - hemY) * 0.66, 0.008), dark, [0.07, hemY + (waistY - hemY) * 0.28, 0.18]);
      } else {
        const topY = waistY - 0.03;
        const topR = waistR * 0.97;
        const radiusAt = (y) => topR + (bottomR - topR) * Math.max(0, Math.min(1, (topY - y) / Math.max(0.001, topY - hemY)));
        const frontZ = (x, y) => {
          const radius = radiusAt(y);
          return Math.sqrt(Math.max(0, 1 - (x / radius) ** 2)) * radius * 0.86;
        };
        const backZ = (x, y) => -frontZ(x, y);
        const thread = stitch;
        const sidePts = [[], []];
        for (let index = 0; index <= 8; index += 1) {
          const y = topY - (index / 8) * (topY - hemY - 0.02);
          const radius = radiusAt(y);
          sidePts[0].push([-radius * 0.985, y, 0]);
          sidePts[1].push([radius * 0.985, y, 0]);
        }
        sidePts.forEach((points) => addTrouserSeam(slotGroup, points, thread, 0.0018));
        addTrouserSeam(slotGroup, [
          [0, topY - 0.005, frontZ(0, topY - 0.005)],
          [0, topY - 0.06, frontZ(0, topY - 0.06)],
          [0, topY - 0.105, frontZ(0, topY - 0.105)]
        ], thread, 0.0018);
        [-1, 1].forEach((side) => {
          const pocket = [0.14, 0.105, 0.07].map((x, index) => {
            const y = topY - 0.012 - index * 0.035;
            return [side * x, y, frontZ(side * x, y)];
          });
          addTrouserSeam(slotGroup, pocket.map(([x, y, z]) => [x, y, z - 0.0012]), crease, 0.0018);
          addTrouserSeam(slotGroup, pocket, thread, 0.0018);
          add(slotGroup, sphere(0.005, 8), metal, [pocket[0][0], pocket[0][1], pocket[0][2] + 0.002]);
          const cx = side * 0.072;
          const pkTop = topY - 0.12;
          const pkBottom = pkTop - 0.085;
          const pent = [
            [cx - 0.034, pkTop], [cx + 0.034, pkTop], [cx + 0.034, pkBottom + 0.02],
            [cx, pkBottom], [cx - 0.034, pkBottom + 0.02], [cx - 0.034, pkTop]
          ].map(([x, y]) => [x, y, backZ(x, y) - 0.002]);
          addTrouserSeam(slotGroup, pent, thread, 0.0018);
          addTrouserSeam(slotGroup, [
            [cx - 0.02, pkTop - 0.004, backZ(cx - 0.02, pkTop - 0.004) - 0.002],
            [cx + 0.02, pkTop - 0.004, backZ(cx + 0.02, pkTop - 0.004) - 0.002]
          ], thread, 0.0011);
        });
        const yoke = [-0.11, -0.055, 0, 0.055, 0.11].map((x) => {
          const y = topY - 0.075 - (1 - Math.abs(x) / 0.11) * 0.015;
          return [x, y, backZ(x, y) - 0.002];
        });
        addTrouserSeam(slotGroup, yoke, thread, 0.0018);
        const waistRForLoops = waistR;
        [[-0.13, 1], [-0.065, 1], [0.065, 1], [0.13, 1], [-0.09, -1], [0, -1], [0.09, -1]].forEach(([x, face]) => {
          const z = face * Math.sqrt(Math.max(0, 1 - (x / waistRForLoops) ** 2)) * waistRForLoops * 0.86;
          add(slotGroup, box(0.013, 0.045, 0.01), main, [x, waistY + 0.004, z + face * 0.005]);
          addTrouserSeam(slotGroup, [[x - 0.004, waistY + 0.02, z + face * 0.011], [x - 0.004, waistY - 0.012, z + face * 0.011]], thread, 0.001);
        });
        add(slotGroup, torus(bottomR * 0.965, 0.0016, 32), thread, [0, hemY + 0.022, 0], [Math.PI / 2, 0, 0], [1, 1, 0.86]);
      }
      if (item.cargo) {
        add(slotGroup, box(0.085, 0.13, 0.05), main, [-0.16, 0.65, 0.02]);
        add(slotGroup, box(0.09, 0.018, 0.055), dark, [-0.16, 0.72, 0.02]);
        add(slotGroup, box(0.05, 0.018, 0.02), metal, [-0.16, 0.72, 0.055]);
        add(slotGroup, box(0.085, 0.13, 0.05), main, [0.16, 0.65, 0.02]);
        add(slotGroup, box(0.09, 0.018, 0.055), dark, [0.16, 0.72, 0.02]);
        add(slotGroup, box(0.05, 0.018, 0.02), metal, [0.16, 0.72, 0.055]);
      }
      addBrandMark(slotGroup, item, [0.115, waistY + 0.016, 0.15], 0.72, trim);
      return;
    }

    [-1, 1].forEach((side) => {
      const leg = profileLegMesh(side, plan.topY, plan.hemY, plan.profile.rx, plan.profile.center, plan.profile.depth, main, plan.profile.shift);
      leg.position.z = side * 0.0015;
      slotGroup.add(leg);
      addTrouserLegDetails(slotGroup, item, plan, side, { main, hi, dark, crease, metal, stitch, denim, style });
    });

    addTrouserWaistDetails(slotGroup, item, plan, { main, trim, crease, metal, stitch, leather, dark, denim, style }, denim);

    const thread = denim ? stitch : crease;
    add(slotGroup, torus(waistR * 1.002, 0.0016, 28), thread, [0, waistY + 0.027, 0], [Math.PI / 2, 0, 0], [1, 1, depthScale]);
    add(slotGroup, torus(waistR * 0.986, 0.0014, 28), thread, [0, waistY - 0.026, 0], [Math.PI / 2, 0, 0], [1, 1, depthScale]);

    if (variant === 'track' || variant === 'parachute') {
      [-1, 1].forEach((side) => {
        const cord = tube([[side * 0.03, waistY - 0.005, 0.153], [side * 0.018, waistY - 0.062, 0.164], [side * 0.034, waistY - 0.1, 0.158]], 0.0035, hi);
        cord.userData.slot = 'bottom';
        slotGroup.add(cord);
        add(slotGroup, sphere(0.006, 8), metal, [side * 0.034, waistY - 0.104, 0.158]);
      });
    }
  }

  function addModernShoes(slotGroup, item, mats) {
    const { main, dark, metal, light } = mats;
    const accent = material(item.palette.accent, { roughness: 0.46 });
    const variant = item.variant;
    const soleTier = item.sole || 'mid';
    const soleLayers = { low: 1, mid: 2, high: 3, max: 4 }[soleTier] || 2;
    const soleType = item.soleType || 'foam';
    [-1, 1].forEach((side) => {
      const x = side * 0.087;
      if (variant === 'platform') {
        add(slotGroup, box(0.16, 0.025, 0.31), dark, [x, 0.02, 0.08]);
        add(slotGroup, box(0.165, 0.035, 0.32), main, [x, 0.055, 0.08]);
        add(slotGroup, box(0.155, 0.035, 0.3), dark, [x, 0.085, 0.08]);
        add(slotGroup, sphere(0.078, 16), main, [x, 0.13, 0.13], null, [0.9, 0.62, 1.45]);
        add(slotGroup, box(0.15, 0.1, 0.14), main, [x, 0.13, 0]);
        add(slotGroup, box(0.11, 0.018, 0.04), accent, [x, 0.16, 0.12]);
        add(slotGroup, box(0.02, 0.02, 0.02), metal, [x, 0.18, 0.1]);
        add(slotGroup, box(0.015, 0.06, 0.01), metal, [x + side * 0.07, 0.16, 0.08]);
        addBrandMark(slotGroup, item, [x, 0.17, 0.14], 0.85, accent);
      } else if (variant === 'mule') {
        add(slotGroup, box(0.15, 0.025, 0.3), dark, [x, 0.02, 0.08]);
        add(slotGroup, sphere(0.075, 16), main, [x, 0.085, 0.13], null, [0.85, 0.58, 1.5]);
        add(slotGroup, box(0.14, 0.09, 0.16), main, [x, 0.09, 0]);
        add(slotGroup, box(0.055, 0.12, 0.055), dark, [x, 0.07, -0.06]);
        add(slotGroup, box(0.11, 0.02, 0.035), accent, [x, 0.13, 0.1]);
        add(slotGroup, box(0.02, 0.02, 0.02), metal, [x, 0.145, 0.1]);
        addBrandMark(slotGroup, item, [x, 0.14, 0.118], 0.72, accent);
      } else if (variant === 'ballet') {
        add(slotGroup, box(0.16, 0.026, 0.33), dark, [x, 0.018, 0.08]);
        add(slotGroup, box(0.14, 0.016, 0.31), main, [x, 0.045, 0.08]);
        add(slotGroup, sphere(0.072, 16), main, [x, 0.06, 0.1], null, [0.9, 0.5, 1.5]);
        add(slotGroup, box(0.14, 0.05, 0.17), main, [x, 0.06, 0]);
        add(slotGroup, box(0.075, 0.045, 0.022), accent, [x, 0.09, 0.2]);
        add(slotGroup, box(0.012, 0.02, 0.16), dark, [x, 0.08, 0.03]);
        add(slotGroup, torus(0.058, 0.005, 18), dark, [x, 0.135, 0], [Math.PI / 2, 0, 0]);
        add(slotGroup, box(0.02, 0.018, 0.018), metal, [x + side * 0.055, 0.13, 0.025]);
        addBrandMark(slotGroup, item, [x, 0.102, 0.112], 0.65, accent);
      } else if (variant === 'runner') {
        add(slotGroup, box(0.17, 0.05, 0.33), dark, [x, 0.028, 0.08]);
        add(slotGroup, box(0.165, 0.03, 0.32), light, [x, 0.065, 0.08]);
        add(slotGroup, box(0.15, 0.1, 0.26), main, [x, 0.12, 0.06]);
        add(slotGroup, sphere(0.075, 16), main, [x, 0.115, 0.2], null, [1, 0.8, 1.1]);
        add(slotGroup, box(0.16, 0.05, 0.04), metal, [x, 0.07, 0.24]);
        add(slotGroup, box(0.155, 0.026, 0.05), accent, [x, 0.14, 0.07]);
        add(slotGroup, box(0.09, 0.06, 0.015), dark, [x + side * 0.055, 0.12, 0.02]);
        add(slotGroup, box(0.17, 0.014, 0.33), accent, [x, 0.058, 0.08]);
        add(slotGroup, box(0.155, 0.012, 0.32), dark, [x, 0.08, 0.08]);
        [0.12, 0.145, 0.17].forEach((z) => add(slotGroup, box(0.08, 0.008, 0.012), light, [x, 0.2, z]));
        add(slotGroup, cylinder(0.059, 0.064, 0.1, 16), material('#efe6d7', { roughness: 0.72 }), [x, 0.185, 0]);
        add(slotGroup, torus(0.063, 0.006, 18), light, [x, 0.235, 0], [Math.PI / 2, 0, 0]);
        add(slotGroup, box(0.075, 0.014, 0.11), dark, [x, 0.155, 0.1]);
        add(slotGroup, box(0.09, 0.012, 0.15), main, [x, 0.17, 0.04]);
        add(slotGroup, box(0.17, 0.012, 0.02), accent, [x, 0.045, 0.14]);
        for (let index = 0; index < soleLayers; index += 1) {
          add(slotGroup, box(0.168 - index * 0.003, 0.008, 0.325), index % 2 ? light : accent, [x, 0.048 + index * 0.009, 0.08]);
        }
        if (soleType === 'waffle') {
          [-0.09, -0.03, 0.03, 0.09].forEach((z) => add(slotGroup, box(0.004, 0.026, 0.01), dark, [x + side * 0.085, 0.04, 0.08 + z]));
        } else if (soleType === 'lug') {
          [-0.1, -0.04, 0.02, 0.08, 0.14].forEach((z) => add(slotGroup, box(0.012, 0.032, 0.015), dark, [x - side * 0.082, 0.035, 0.08 + z]));
        } else if (soleType === 'carbon') {
          add(slotGroup, box(0.17, 0.004, 0.32), metal, [x, 0.022, 0.08]);
        } else if (soleType === 'tread') {
          [-0.11, -0.05, 0.01, 0.07, 0.13].forEach((z) => add(slotGroup, box(0.014, 0.018, 0.012), metal, [x + side * 0.084, 0.036, 0.08 + z], [0, 0, 0.2]));
        }
        addBrandMark(slotGroup, item, [x, 0.168, 0.126], 0.95, accent);
      } else if (variant === 'derby') {
        add(slotGroup, box(0.15, 0.02, 0.31), dark, [x, 0.02, 0.08]);
        add(slotGroup, box(0.14, 0.075, 0.26), main, [x, 0.09, 0.06]);
        add(slotGroup, sphere(0.075, 16), main, [x, 0.085, 0.2], null, [1, 0.75, 1.1]);
        add(slotGroup, box(0.11, 0.05, 0.09), dark, [x, 0.14, 0.02]);
        add(slotGroup, box(0.012, 0.012, 0.11), metal, [x, 0.155, 0.05]);
        add(slotGroup, box(0.015, 0.06, 0.015), dark, [x, 0.08, -0.07]);
        addBrandMark(slotGroup, item, [x, 0.125, 0.128], 0.72, accent);
      }
    });
  }

  function applyTopWidthScale(slotGroup, item) {
    const fit = item.fit || 'regular';
    const scale = fit === 'oversize' ? 1.08 : fit === 'cropped' ? 1.03 : 1;
    slotGroup.scale.x *= scale;
    slotGroup.scale.z *= 1 + (scale - 1) * 0.5;
  }

  function applyBottomWidthScale(slotGroup, item) {
    const cut = item.cut || '';
    const scale = ['baggy', 'parachute', 'flare', 'jorts'].includes(cut)
      ? 1.07
      : ['track', 'straight'].includes(cut) ? 0.94 : ['cargo', 'wide'].includes(cut) ? 1.04 : 1;
    slotGroup.scale.x *= scale;
  }

  function addTop(slotGroup) {
    const item = API.getItems().find((entry) => entry.id === state.equipped.top);
    if (!item) {
      addBaseTop(slotGroup);
      root.add(slotGroup);
      return;
    }
    const palette = item.palette;
    const main = cloth(palette.main, { roughness: 0.58 });
    const hi = cloth(palette.accent, { roughness: 0.66 });
    const dark = cloth(palette.detail, { roughness: 0.52 });
    const accent = cloth(palette.detail, { roughness: 0.44 });
    dark.color.multiplyScalar(0.66);
    accent.color.multiplyScalar(0.66);
    const cream = cloth('#e8dfd0', { roughness: 0.75 });
    const trim = cloth(palette.accent, { roughness: 0.7 });
    trim.color.multiplyScalar(0.7);
    const metal = metalMaterial(palette.metal);
    const casual = item.variant === 'hoodie';
    const racer = item.variant === 'racer';

    if (['tee', 'tank', 'longsleeve', 'shirt', 'bomber', 'vest'].includes(item.variant)) {
      addModernTop(slotGroup, item, { main, hi, dark, accent, cream, trim, metal });
      applyTopWidthScale(slotGroup, item);
      tagGroup(slotGroup, 'top');
      root.add(slotGroup);
      return;
    }

    if (casual) {
      add(slotGroup, cylinder(0.265, 0.225, 0.57, 22), main, [0, 1.2, 0], null, [1, 1, 0.82]);
      add(slotGroup, sphere(0.245, 18), main, [0, 1.45, -0.015], null, [1.17, 0.43, 0.9]);
      [-1, 1].forEach((side) => {
        add(slotGroup, sphere(0.128, 16), main, [side * 0.205, 1.445, 0], null, [1.06, 0.68, 1.02]);
        const sleeve = makeSleeve(slotGroup, side, main, trim, { radius: 0.11, length: 0.48 });
        add(sleeve.pivot, torus(0.088, 0.005, 20), trim, [0, -0.5, 0], [Math.PI / 2, 0, 0]);
        add(sleeve.pivot, sphere(0.011, 10), metal, [0, -0.48, 0.086]);
      });
      const hood = add(slotGroup, torus(0.145, 0.055, 24), main, [0, 1.49, -0.06], [Math.PI / 2, 0, 0], [1.2, 1, 0.9]);
      hood.userData.slot = 'top';
      add(slotGroup, box(0.21, 0.14, 0.035), dark, [0, 1.13, 0.2], [0.05, 0, 0]);
      add(slotGroup, box(0.23, 0.03, 0.03), hi, [0, 1.04, 0.19]);
      [-1, 1].forEach((side) => {
        add(slotGroup, cylinder(0.008, 0.008, 0.24, 8), metal, [side * 0.055, 1.4, 0.2]);
        add(slotGroup, sphere(0.014, 8), metal, [side * 0.055, 1.28, 0.2]);
      });
      if (item.zip) {
        add(slotGroup, box(0.014, 0.5, 0.014), metal, [0, 1.24, 0.225]);
        add(slotGroup, sphere(0.012, 8), metal, [0, 1.48, 0.23]);
      }
      add(slotGroup, box(0.04, 0.04, 0.012), accent, [0.145, 1.33, 0.22]);
      add(slotGroup, box(0.02, 0.06, 0.012), cream, [-0.13, 1.36, 0.21], [0, 0, 0.25]);
      add(slotGroup, torus(0.212, 0.007, 26), trim, [0, 0.955, 0], [Math.PI / 2, 0, 0], [1, 1, 0.78]);
    } else {
      const bodyHeight = racer ? 0.44 : 0.57;
      const topRadius = racer ? 0.235 : 0.245;
      add(slotGroup, cylinder(topRadius, racer ? 0.2 : 0.185, bodyHeight, 22), main, [0, racer ? 1.3 : 1.22, 0], null, [1, 1, racer ? 0.76 : 0.72]);
      add(slotGroup, sphere(0.235, 18), main, [0, racer ? 1.47 : 1.45, -0.005], null, [1.12, 0.43, 0.84]);
      const sleeveBySide = new Map();
      [-1, 1].forEach((side) => {
        add(slotGroup, sphere(0.108, 16), main, [side * 0.19, 1.46, 0], null, [1.25, 0.72, 1.08]);
        sleeveBySide.set(side, makeSleeve(slotGroup, side, main, trim, { radius: racer ? 0.105 : 0.103, length: 0.49, stripes: racer, stripeMat: accent }));
      });
      if (!racer) {
        add(slotGroup, cylinder(0.19, 0.225, 0.26, 22), main, [0, 0.88, 0], null, [1, 1, 0.78]);
        add(slotGroup, box(0.04, 0.26, 0.015), dark, [0, 0.88, 0.16]);
        add(slotGroup, box(0.07, 0.07, 0.012), accent, [-0.14, 0.99, 0.15], [0, 0, 0.2]);
      }

      if (racer) {
        add(slotGroup, cylinder(0.078, 0.088, 0.1, 18), dark, [0, 1.52, 0], null, [1, 1, 0.8]);
        add(slotGroup, box(0.026, 0.37, 0.018), metal, [0.055, 1.29, 0.165], [0, 0, -0.42]);
        add(slotGroup, box(0.075, 0.045, 0.018), accent, [-0.13, 1.39, 0.17]);
        add(slotGroup, box(0.23, 0.045, 0.03), dark, [0, 1.075, 0.14]);
      } else {
        add(slotGroup, cylinder(0.075, 0.085, 0.12, 18), cream, [0, 1.54, 0], null, [1, 1, 0.85]);
        add(slotGroup, box(0.012, 0.27, 0.014), dark, [0, 1.34, 0.166]);
        add(slotGroup, box(0.055, 0.26, 0.018), cream, [-0.028, 1.34, 0.154], [0, 0, 0.3]);
        add(slotGroup, box(0.055, 0.26, 0.018), cream, [0.028, 1.34, 0.154], [0, 0, -0.3]);
        add(slotGroup, box(0.11, 0.3, 0.02), hi, [-0.073, 1.34, 0.155], [0, 0, 0.23]);
        add(slotGroup, box(0.11, 0.3, 0.02), hi, [0.073, 1.34, 0.155], [0, 0, -0.23]);
        add(slotGroup, box(0.012, 0.25, 0.014), dark, [0, 1.32, 0.17]);
        [1.26, 1.17, 1.08].forEach((y) => add(slotGroup, sphere(0.014, 10), metal, [0, y, 0.178]));
        const chain = tube([[ -0.13, 1.45, 0.14], [-0.065, 1.37, 0.18], [0, 1.29, 0.19], [0.065, 1.37, 0.18], [0.13, 1.45, 0.14]], 0.009, metal);
        chain.userData.slot = 'top';
        slotGroup.add(chain);
        add(slotGroup, box(0.045, 0.055, 0.018), metal, [0, 1.25, 0.195], [0, 0, 0.78]);
        add(slotGroup, sphere(0.014, 10), accent, [0, 1.19, 0.2]);
        add(slotGroup, box(0.057, 0.057, 0.012), accent, [0.155, 1.34, 0.17], [0, 0, -0.2]);
        add(slotGroup, box(0.022, 0.022, 0.012), metal, [-0.14, 1.41, 0.175], [0, 0, 0.78]);
        add(slotGroup, box(0.05, 0.032, 0.012), metal, [0, 1.0, 0.175]);
        add(sleeveBySide.get(-1).pivot, torus(0.1, 0.012, 18), accent, [0, -0.36, 0], [Math.PI / 2, 0, 0]);
        [-1, 1].forEach((side) => {
          add(slotGroup, box(0.115, 0.026, 0.07), hi, [side * 0.16, 1.49, 0], [0, 0, side * 0.04]);
          add(slotGroup, sphere(0.015, 10), metal, [side * 0.15, 1.49, 0.045]);
          const sleeve = sleeveBySide.get(side).pivot;
          add(sleeve, box(0.075, 0.016, 0.025), accent, [0, -0.4, 0.065]);
          [0, 1, 2].forEach((index) => add(sleeve, sphere(0.011, 8), metal, [0, -0.48 - index * 0.022, 0.086]));
        });
        add(slotGroup, box(0.085, 0.012, 0.01), hi, [-0.115, 1.31, 0.172]);
        add(slotGroup, box(0.012, 0.035, 0.01), metal, [-0.12, 1.36, 0.173]);
        add(slotGroup, box(0.15, 0.012, 0.012), accent, [0, 1.12, -0.18]);
      }

      add(slotGroup, cylinder(0.205, 0.205, 0.038, 22), dark, [0, 1.0, 0], null, [1, 1, 0.74]);
      add(slotGroup, box(0.13, 0.18, 0.01), main, [0, 1.14, -0.175]);
      add(slotGroup, box(0.012, 0.19, 0.012), hi, [0.15, 1.15, 0.17]);
    }
    if (item.brand) {
      if (casual) addBrandMark(slotGroup, item, [0, 1.12, 0.224], 1.55, isLightColor(item.palette.main) ? accent : cream);
      else addBrandMark(slotGroup, item, [0.1, 1.3, 0.185], 1.15, accent);
    }
    applyTopWidthScale(slotGroup, item);
    tagGroup(slotGroup, 'top');
    slotGroup.traverse((object) => { if (object.isMesh) object.castShadow = false; });
    root.add(slotGroup);
  }

  function addBottom(slotGroup) {
    const item = API.getItems().find((entry) => entry.id === state.equipped.bottom);
    if (!item) {
      addBaseBottom(slotGroup);
      root.add(slotGroup);
      return;
    }
    const palette = item.palette;
    const cutKey = item.bootcut ? 'bootcut' : item.capri ? 'capri' : (item.cut || item.variant);
    const denim = ['flare', 'bootcut', 'jorts', 'capri', 'cargo'].includes(cutKey) || /джинс|деним/i.test(item.name);
    const main = material(palette.main, { roughness: denim ? 0.86 : 0.67, fabric: true, denim });
    if (denim) main.color.multiplyScalar(0.94);
    const hi = material(palette.accent, { roughness: denim ? 0.9 : 0.7, fabric: true, denim });
    const dark = material(palette.detail, { roughness: denim ? 0.84 : 0.58, fabric: true, denim });
    dark.color.multiplyScalar(0.68);
    const trim = material(palette.accent, { roughness: denim ? 0.82 : 0.72, fabric: true, denim });
    trim.color.multiplyScalar(0.66);
    const metal = metalMaterial(palette.metal);
    const stitch = material(isLightColor(palette.main) ? '#5f4328' : '#e2b878', { roughness: 0.84 });
    const leather = material('#5b3e2b', { roughness: 0.74 });
    const cargo = item.variant === 'cargo';
    const wide = item.variant === 'wide';

    if (['flare', 'baggy', 'parachute', 'track', 'skirt', 'jorts', 'wide', 'cargo', 'tailored'].includes(item.variant)) {
      addModernBottom(slotGroup, item, { main, hi, dark, trim, metal, denim, stitch, leather });
      applyBottomWidthScale(slotGroup, item);
      tagGroup(slotGroup, 'bottom');
      root.add(slotGroup);
      return;
    }
    const topRadius = cargo ? 0.122 : wide ? 0.115 : 0.11;
    const bottomRadius = cargo ? 0.105 : wide ? 0.148 : 0.088;

    add(slotGroup, cylinder(0.18, 0.165, 0.15, 20), main, [0, 0.92, 0], null, [1, 1, 0.82]);
    add(slotGroup, cylinder(0.185, 0.185, 0.035, 20), dark, [0, 0.95, 0], null, [1, 1, 0.82]);
    add(slotGroup, box(0.07, 0.035, 0.014), metal, [0, 0.95, 0.15]);
    [-1, 1].forEach((side) => {
      add(slotGroup, cylinder(topRadius, bottomRadius, 0.8, 18), main, [side * 0.087, 0.5, 0]);
      add(slotGroup, torus(bottomRadius + 0.002, 0.006, 20), trim, [side * 0.087, 0.12, 0], [Math.PI / 2, 0, 0]);
      add(slotGroup, box(0.008, 0.6, 0.008), hi, [side * 0.087 + 0.058, 0.47, 0.06]);
      if (cargo) {
        add(slotGroup, box(0.09, 0.14, 0.06), main, [side * 0.145, 0.62, 0.035]);
        add(slotGroup, box(0.095, 0.02, 0.065), dark, [side * 0.145, 0.69, 0.035]);
        add(slotGroup, box(0.055, 0.022, 0.02), metal, [side * 0.145, 0.69, 0.075]);
      }
      add(slotGroup, torus(topRadius * 0.96, 0.007, 18), metal, [side * 0.087, 0.61, 0], [Math.PI / 2, 0, 0]);
      add(slotGroup, box(0.03, 0.05, 0.018), metal, [side * 0.145, 0.61, 0.07]);
      if (side === 1) add(slotGroup, box(0.06, 0.05, 0.012), cloth(palette.accent), [side * 0.13, 0.36, 0.08], [0, 0, 0.2]);
    });
    const beltChain = tube([[-0.15, 0.95, 0.14], [-0.12, 0.82, 0.16], [-0.065, 0.71, 0.145]], 0.008, metal);
    beltChain.userData.slot = 'bottom';
    slotGroup.add(beltChain);
    add(slotGroup, box(0.04, 0.055, 0.014), cloth(palette.detail), [0.15, 0.82, 0.15]);
    add(slotGroup, sphere(0.012, 10), metal, [0.15, 0.77, 0.155]);
    [-0.13, -0.045, 0.045, 0.13].forEach((x) => {
      add(slotGroup, box(0.018, 0.055, 0.014), dark, [x, 0.96, 0.145]);
    });
    add(slotGroup, box(0.012, 0.09, 0.012), metal, [0.005, 0.91, 0.15]);
    add(slotGroup, box(0.085, 0.014, 0.012), hi, [0.095, 0.84, 0.145]);
    addBrandMark(slotGroup, item, [0.125, 0.955, 0.15], 0.7, cloth(palette.accent));
    applyBottomWidthScale(slotGroup, item);
    tagGroup(slotGroup, 'bottom');
    root.add(slotGroup);
  }

  function addShoes(slotGroup) {
    const item = API.getItems().find((entry) => entry.id === state.equipped.shoes);
    if (!item) {
      addBareFeet(slotGroup);
      root.add(slotGroup);
      return;
    }
    const palette = item.palette;
    const upperRoughness = { mesh: 0.74, suede: 0.94, leather: 0.38, nubuck: 0.84, canvas: 0.88, knit: 0.8, satin: 0.3 }[item.upper] || 0.48;
    const main = material(palette.main, { roughness: upperRoughness, fabric: ['suede', 'nubuck', 'canvas', 'knit'].includes(item.upper), bumpScale: 0.005 });
    const dark = material(palette.detail, { roughness: 0.58 });
    dark.color.multiplyScalar(0.72);
    const metal = metalMaterial(palette.metal);
    const light = material(item.upper === 'suede' || item.upper === 'nubuck' ? '#c9c2b5' : '#d8d5cb', { roughness: 0.62 });
    const boot = item.variant === 'boot';
    const sneaker = item.variant === 'sneaker';
    const soleTier = item.sole || 'mid';
    const soleLayers = { low: 1, mid: 2, high: 3, max: 4 }[soleTier] || 2;
    const soleType = item.soleType || 'cup';

    if (['platform', 'mule', 'ballet', 'runner', 'derby'].includes(item.variant)) {
      addModernShoes(slotGroup, item, { main, dark, metal, light });
      tagGroup(slotGroup, 'shoes');
      root.add(slotGroup);
      return;
    }

    [-1, 1].forEach((side) => {
      const x = side * 0.087;
      if (boot) {
        add(slotGroup, cylinder(0.075, 0.086, 0.25, 16), main, [x, 0.23, 0.02]);
        add(slotGroup, box(0.14, 0.13, 0.29), main, [x, 0.08, 0.07], [0, 0, 0]);
        add(slotGroup, sphere(0.074, 14), main, [x, 0.075, 0.18], null, [1.05, 0.62, 1.18]);
        add(slotGroup, box(0.15, 0.045, 0.32), dark, [x, 0.018, 0.075]);
        add(slotGroup, box(0.13, 0.055, 0.075), metal, [x, 0.055, 0.21]);
        add(slotGroup, box(0.022, 0.12, 0.012), metal, [x + side * 0.062, 0.18, 0.16]);
        for (let index = 0; index < soleLayers; index += 1) {
          add(slotGroup, box(0.152, 0.008, 0.322), index % 2 ? light : material(palette.accent, { roughness: 0.52 }), [x, 0.034 + index * 0.009, 0.075]);
        }
        if (item.uggs) {
          add(slotGroup, torus(0.09, 0.018, 20), light, [x, 0.3, 0.02], [Math.PI / 2, 0, 0], [1, 1, 0.82]);
          add(slotGroup, cylinder(0.083, 0.09, 0.08, 16), main, [x, 0.33, 0.02], null, [1, 1, 0.82]);
        }
        addBrandMark(slotGroup, item, [x, 0.145, 0.145], 1.05, material(palette.accent, { roughness: 0.5 }));
      } else if (sneaker) {
        add(slotGroup, box(0.155, 0.06, 0.32), dark, [x, 0.035, 0.07]);
        add(slotGroup, box(0.155, 0.045, 0.32), light, [x, 0.072, 0.07]);
        add(slotGroup, box(0.16, 0.014, 0.33), material(palette.accent), [x, 0.058, 0.07]);
        add(slotGroup, box(0.14, 0.11, 0.25), main, [x, 0.13, 0.07]);
        add(slotGroup, sphere(0.075, 14), main, [x, 0.115, 0.2], null, [1, 0.8, 1.1]);
        add(slotGroup, box(0.155, 0.055, 0.04), metal, [x, 0.06, 0.235]);
        [0.12, 0.145, 0.17].forEach((z) => add(slotGroup, box(0.08, 0.008, 0.012), light, [x, 0.2, z]));
        add(slotGroup, box(0.012, 0.07, 0.16), material(palette.accent), [x + side * 0.075, 0.14, 0.08]);
        add(slotGroup, cylinder(0.059, 0.064, 0.095, 16), material('#efe6d7', { roughness: 0.72 }), [x, 0.185, 0]);
        add(slotGroup, torus(0.063, 0.006, 18), light, [x, 0.23, 0], [Math.PI / 2, 0, 0]);
        add(slotGroup, box(0.075, 0.014, 0.11), dark, [x, 0.155, 0.1]);
        add(slotGroup, box(0.09, 0.012, 0.15), main, [x, 0.17, 0.04]);
        [0.11, 0.14, 0.17].forEach((z) => add(slotGroup, box(0.07, 0.006, 0.01), metal, [x, 0.19, z]));
        for (let index = 0; index < soleLayers; index += 1) {
          add(slotGroup, box(0.16, 0.009, 0.33), index % 2 ? light : material(palette.accent, { roughness: 0.5 }), [x, 0.058 + index * 0.009, 0.07]);
        }
        if (soleType === 'cup') {
          add(slotGroup, torus(0.09, 0.006, 20), light, [x, 0.048, 0.07], [Math.PI / 2, 0, 0], [1.7, 1.7, 0.7]);
        } else if (soleType === 'lug') {
          [-0.1, -0.04, 0.02, 0.08, 0.14].forEach((z) => add(slotGroup, box(0.012, 0.032, 0.015), dark, [x + side * 0.08, 0.028, 0.08 + z]));
        } else if (soleType === 'waffle') {
          [-0.09, -0.03, 0.03, 0.09].forEach((z) => add(slotGroup, box(0.004, 0.026, 0.01), dark, [x + side * 0.08, 0.035, 0.08 + z]));
        }
        addBrandMark(slotGroup, item, [x, 0.168, 0.128], 0.9, material(palette.accent, { roughness: 0.42 }));
      } else {
        add(slotGroup, box(0.148, 0.028, 0.315), dark, [x, 0.016, 0.075]);
        add(slotGroup, box(0.14, 0.058, 0.135), main, [x, 0.056, -0.008]);
        add(slotGroup, sphere(0.082, 18), main, [x, 0.074, 0.105], null, [0.84, 0.58, 1.5]);
        add(slotGroup, box(0.108, 0.016, 0.125), dark, [x, 0.108, 0.028], [0.15, 0, 0]);
        add(slotGroup, box(0.124, 0.02, 0.038), material(palette.accent, { roughness: 0.42 }), [x, 0.108, 0.1], [0.05, 0, 0]);
        add(slotGroup, box(0.02, 0.018, 0.018), metal, [x, 0.118, 0.092]);
        add(slotGroup, box(0.012, 0.008, 0.27), material(palette.accent, { roughness: 0.55 }), [x, 0.034, 0.075]);
        add(slotGroup, box(0.02, 0.04, 0.022), metal, [x + side * 0.071, 0.065, 0.03]);
        addBrandMark(slotGroup, item, [x, 0.112, 0.098], 0.68, material(palette.accent, { roughness: 0.5 }));
      }
    });
    tagGroup(slotGroup, 'shoes');
    root.add(slotGroup);
  }

  function addHair(slotGroup) {
    const item = API.getItems().find((entry) => entry.id === state.equipped.hair);
    if (!item) {
      root.add(slotGroup);
      return;
    }
    const palette = item.palette;
    const texture = state.hairTexture || 'straight';
    const hair = material(palette.hair, { roughness: texture === 'straight' ? 0.5 : texture === 'wavy' ? 0.68 : 0.86, bumpMap: hairBump, bumpScale: 0.0016 });
    const hairHi = material(palette.hairHi, { roughness: texture === 'straight' ? 0.44 : texture === 'wavy' ? 0.6 : 0.74, bumpMap: hairBump, bumpScale: 0.0014 });
    const curlHi = texture === 'curly'
      ? material(new THREE.Color(palette.hair).lerp(new THREE.Color('#c39a72'), 0.44), { roughness: 0.64, bumpMap: hairBump, bumpScale: 0.0012 })
      : hairHi;
    const curlShadow = texture === 'curly'
      ? material(new THREE.Color(palette.hair).multiplyScalar(0.66), { roughness: 0.9, bumpMap: hairBump, bumpScale: 0.0012 })
      : hair;
    const fade = material(palette.hair, { roughness: 0.82, transparent: true, opacity: 0.42, bumpMap: hairBump, bumpScale: 0.0012 });
    const styleSeed = Number.isFinite(item.index) ? item.index : (item.id.length + String(item.name || '').length);
    const sideMode = styleSeed % 4;
    const hasSides = sideMode > 0;
    const lengthBias = [0.9, 0.97, 1.04, 1.12][styleSeed % 4];
    const addHairLock = (points, mat, radius) => {
      const lock = tube(points, radius, mat);
      lock.userData.slot = 'hair';
      slotGroup.add(lock);
    };
    if (item.variant === 'crop') {
      const capMaterial = texture === 'straight' ? hair : curlShadow;
      add(slotGroup, sphere(0.155, 28), capMaterial, [0, 1.805, -0.02], null, [1.02, 0.56, 1.0]);
      add(slotGroup, sphere(0.132, 18), capMaterial, [0, 1.772, -0.06], null, [1.0, 0.64, 0.8]);
      add(slotGroup, sphere(0.1, 16), hair, [0, 1.835, 0.112], [0.12, 0, 0], [1.25, 0.24, 0.42]);
      const front = [
        [-0.102, 1.848, 0.088, -0.22, 0.9, 0.52, 0.72],
        [-0.052, 1.858, 0.106, -0.1, 0.92, 0.56, 0.74],
        [0.002, 1.862, 0.112, 0.02, 0.94, 0.56, 0.74],
        [0.056, 1.856, 0.104, 0.14, 0.9, 0.54, 0.72],
        [0.104, 1.844, 0.086, 0.28, 0.84, 0.5, 0.68]
      ];
      front.forEach(([x, y, z, rz, sx, sy, sz], index) => {
        add(slotGroup, sphere(0.042, 14), index % 2 ? hairHi : hair, [x, y, z], [0.12, 0, rz], [sx, sy, sz]);
      });
      [-1, 1].forEach((side) => {
        add(slotGroup, sphere(0.047, 14), texture === 'curly' ? curlHi : hair, [side * 0.134, 1.795, 0.025], [0.1, 0, side * 0.3], [0.72, 0.9, 0.68]);
        if (texture !== 'straight') {
          add(slotGroup, sphere(0.043, 14), hairHi, [side * 0.078, 1.82, -0.108], [0.1, 0, side * 0.2], [0.8, 0.72, 0.6]);
        }
      });
      if (texture === 'curly') {
        [
          [-0.064, 1.895, 0.032, -0.18],
          [-0.018, 1.906, 0.048, -0.04],
          [0.032, 1.902, 0.042, 0.12],
          [0.078, 1.888, 0.024, 0.28],
          [-0.12, 1.846, 0.06, -0.3],
          [0.124, 1.842, 0.05, 0.3],
          [-0.04, 1.84, -0.11, 0.12],
          [0.045, 1.83, -0.115, -0.12],
          [0, 1.88, -0.1, 0]
        ].forEach(([x, y, z, rz], index) => {
          add(slotGroup, sphere(0.038, 14), index % 2 ? curlHi : hair, [x, y, z], [0.1, 0, rz], [0.82, 0.76, 0.7]);
        });
      } else if (texture === 'wavy') {
        [-0.045, 0.035].forEach((x, index) => {
          add(slotGroup, sphere(0.04, 14), hairHi, [x, 1.892 - index * 0.004, 0.055], [0.08, 0, index ? 0.18 : -0.18], [0.9, 0.5, 0.66]);
        });
      }
      add(slotGroup, box(0.02, 0.05, 0.026), hair, [-0.14, 1.76, 0.052], [0.2, 0, -0.2]);
      add(slotGroup, box(0.02, 0.05, 0.026), hair, [0.14, 1.76, 0.052], [0.2, 0, 0.2]);
      add(slotGroup, sphere(0.05, 12), hairHi, [-0.028, 1.902, 0.018], [-0.1, 0.1, -0.16], [0.82, 0.28, 0.62]);
    } else if (item.variant === 'flow') {
      add(slotGroup, sphere(0.163, 30), hair, [0, 1.834, -0.038], null, [1.03, 0.74, 1.01]);
      add(slotGroup, sphere(0.125, 22), hair, [0, 1.785, -0.075], null, [1.0, 0.9, 0.62]);
      [
        [-0.042, 1.846, 0.12, 0.06, 0.8, 0.7, 0.58],
        [0.018, 1.842, 0.129, 0.2, 0.95, 0.66, 0.58],
        [0.08, 1.832, 0.124, 0.36, 0.9, 0.6, 0.55],
        [0.134, 1.814, 0.104, 0.52, 0.75, 0.52, 0.48]
      ].forEach(([x, y, z, rz, sx, sy, sz], index) => {
        add(slotGroup, sphere(0.04, 14), index === 1 || index === 2 ? hairHi : hair, [x, y, z], [0.16, 0, rz], [sx, sy, sz]);
      });
      const flowPart = tube([[-0.072, 1.938, 0.02], [-0.068, 1.885, 0.098], [-0.058, 1.842, 0.13]], 0.004, material(new THREE.Color(palette.hair).multiplyScalar(0.62)));
      flowPart.userData.slot = 'hair';
      slotGroup.add(flowPart);
      [-1, 1].forEach((side) => {
        add(slotGroup, sphere(0.07, 16), hair, [side * 0.138, 1.75, -0.015], [0, 0, side * 0.12], [0.5, 1.35, 0.7]);
        add(slotGroup, sphere(0.045, 14), hairHi, [side * 0.145, 1.67, -0.03], [0, 0, side * 0.1], [0.45, 1.1, 0.55]);
      });
      add(slotGroup, sphere(0.08, 16), hairHi, [-0.03, 1.925, 0.03], [-0.1, 0, -0.16], [1.0, 0.18, 0.6]);
      add(slotGroup, sphere(0.13, 20), hair, [0, 1.56, -0.155], null, [1.06, 1.7, 0.52]);
      [-1, 1].forEach((side) => {
        add(slotGroup, sphere(0.072, 16), hair, [side * 0.12, 1.58, -0.11], [0, 0, side * 0.04], [0.5, 1.7, 0.55]);
      });
    } else if (item.variant === 'fade') {
      add(slotGroup, sphere(0.155, 30), hair, [0, 1.838, -0.03], null, [1.0, 0.62, 0.99]);
      [
        [-0.102, 1.83, 0.106, -0.22, 0.7, 0.72, 0.56],
        [-0.045, 1.837, 0.119, -0.08, 0.75, 0.68, 0.58],
        [0.016, 1.84, 0.122, 0.04, 0.75, 0.66, 0.58],
        [0.075, 1.834, 0.114, 0.2, 0.7, 0.65, 0.55],
        [0.125, 1.82, 0.098, 0.34, 0.62, 0.6, 0.5]
      ].forEach(([x, y, z, rz, sx, sy, sz], index) => {
        add(slotGroup, sphere(0.038, 14), index % 2 ? hairHi : hair, [x, y, z], [0.14, 0, rz], [sx, sy, sz]);
      });
      add(slotGroup, sphere(0.052, 14), fade, [-0.143, 1.793, 0.01], null, [0.32, 1.28, 0.55]);
      add(slotGroup, sphere(0.052, 14), fade, [0.143, 1.793, 0.01], null, [0.32, 1.28, 0.55]);
      add(slotGroup, box(0.02, 0.062, 0.026), hair, [-0.142, 1.755, 0.062], [0.2, 0, -0.18]);
      add(slotGroup, box(0.02, 0.062, 0.026), hair, [0.142, 1.755, 0.062], [0.2, 0, 0.18]);
      add(slotGroup, sphere(0.075, 14), hairHi, [-0.03, 1.908, 0.035], [-0.12, 0.1, -0.15], [0.9, 0.16, 0.55]);
    } else if (item.variant === 'curtain') {
      add(slotGroup, sphere(0.162, 30), hair, [0, 1.832, -0.03], null, [1.02, 0.82, 1.01]);
      add(slotGroup, sphere(0.132, 22), hair, [0, 1.775, -0.07], null, [1.0, 0.86, 0.62]);
      [-1, 1].forEach((side) => {
        add(slotGroup, sphere(0.09, 18), hair, [side * 0.11, 1.755, 0.08], [0.04, 0, side * 0.1], [0.5, 1.4, 0.55]);
        add(slotGroup, sphere(0.06, 14), hairHi, [side * 0.135, 1.69, -0.02], [0.06, 0, side * 0.12], [0.45, 1.3, 0.55]);
        add(slotGroup, sphere(0.05, 14), hair, [side * 0.14, 1.64, -0.02], [0.06, 0, side * 0.1], [0.4, 0.9, 0.45]);
      });
      [-1, 1].forEach((side) => {
        add(slotGroup, sphere(0.045, 14), hairHi, [side * 0.035, 1.845, 0.112], [0.12, 0, side * 0.35], [0.8, 0.6, 0.55]);
      });
      const partLine = tube([[0, 1.94, 0.025], [0, 1.87, 0.11], [0, 1.832, 0.138]], 0.005, material(new THREE.Color(palette.hair).multiplyScalar(0.6)));
      partLine.userData.slot = 'hair';
      slotGroup.add(partLine);
      add(slotGroup, sphere(0.07, 14), hairHi, [-0.045, 1.9, 0.04], [-0.12, 0.1, -0.12], [0.9, 0.18, 0.55]);
    } else if (item.variant === 'bob') {
      add(slotGroup, sphere(0.158, 30), hair, [0, 1.828, -0.028], null, [1.01, 0.68, 1.0]);
      add(slotGroup, sphere(0.13, 22), hair, [0, 1.77, -0.06], null, [0.98, 0.75, 0.7]);
      [
        [-0.108, 1.826, 0.108, -0.2, 0.8, 0.9, 0.62],
        [-0.05, 1.834, 0.123, -0.06, 0.85, 0.86, 0.62],
        [0.01, 1.836, 0.126, 0.04, 0.85, 0.84, 0.6],
        [0.07, 1.832, 0.118, 0.16, 0.8, 0.82, 0.58],
        [0.12, 1.818, 0.104, 0.3, 0.7, 0.75, 0.52]
      ].forEach(([x, y, z, rz, sx, sy, sz], index) => {
        add(slotGroup, sphere(0.04, 14), index % 2 ? hairHi : hair, [x, y, z], [0.12, 0, rz], [sx, sy, sz]);
      });
      [-1, 1].forEach((side) => {
        add(slotGroup, sphere(0.09, 18), hair, [side * 0.115, 1.74, 0.058], [0, 0, side * 0.08], [0.55, 1.45, 0.58]);
        add(slotGroup, sphere(0.06, 14), hair, [side * 0.14, 1.66, 0.012], [0, 0, side * 0.08], [0.5, 1.15, 0.5]);
        add(slotGroup, sphere(0.045, 12), hairHi, [side * 0.125, 1.7, 0.06], [0, 0, side * 0.1], [0.5, 1.1, 0.42]);
      });
      add(slotGroup, sphere(0.07, 14), hairHi, [-0.035, 1.9, 0.04], [-0.1, 0, -0.14], [0.9, 0.18, 0.55]);
    } else if (item.variant === 'pixie') {
      add(slotGroup, sphere(0.155, 30), hair, [0, 1.838, -0.025], null, [1.0, 0.55, 0.98]);
      [
        [-0.1, 1.83, 0.107, -0.24, 0.7, 0.8, 0.55],
        [-0.045, 1.838, 0.119, -0.08, 0.75, 0.78, 0.56],
        [0.015, 1.842, 0.122, 0.05, 0.75, 0.76, 0.55],
        [0.075, 1.835, 0.114, 0.2, 0.7, 0.72, 0.52],
        [0.125, 1.82, 0.098, 0.34, 0.62, 0.66, 0.48]
      ].forEach(([x, y, z, rz, sx, sy, sz], index) => {
        add(slotGroup, sphere(0.038, 14), index % 2 ? hairHi : hair, [x, y, z], [0.14, 0, rz], [sx, sy, sz]);
      });
      add(slotGroup, sphere(0.052, 14), fade, [-0.143, 1.79, 0.01], null, [0.3, 1.2, 0.5]);
      add(slotGroup, sphere(0.052, 14), fade, [0.143, 1.79, 0.01], null, [0.3, 1.2, 0.5]);
      add(slotGroup, box(0.018, 0.052, 0.024), hair, [-0.142, 1.756, 0.062], [0.2, 0, -0.18]);
      add(slotGroup, box(0.018, 0.052, 0.024), hair, [0.142, 1.756, 0.062], [0.2, 0, 0.18]);
      add(slotGroup, sphere(0.07, 14), hairHi, [-0.03, 1.902, 0.035], [-0.12, 0.1, -0.15], [0.9, 0.16, 0.55]);
    } else if (item.variant === 'mullet') {
      add(slotGroup, sphere(0.157, 30), hair, [0, 1.83, -0.028], null, [1.01, 0.66, 1.0]);
      add(slotGroup, sphere(0.115, 22), hair, [0, 1.7, -0.075], null, [1.05, 1.0, 0.62]);
      [-1, 1].forEach((side) => {
        add(slotGroup, sphere(0.065, 16), hair, [side * 0.14, 1.69, -0.02], [0, 0, side * 0.08], [0.48, 1.5, 0.55]);
        add(slotGroup, sphere(0.045, 14), hairHi, [side * 0.145, 1.63, -0.04], [0, 0, side * 0.08], [0.4, 1.0, 0.45]);
        add(slotGroup, box(0.02, 0.06, 0.026), hair, [side * 0.142, 1.755, 0.062], [0.2, 0, side * 0.18]);
      });
      add(slotGroup, sphere(0.065, 14), hairHi, [-0.03, 1.9, 0.035], [-0.12, 0.1, -0.15], [0.9, 0.18, 0.55]);
    } else if (item.variant === 'wolf') {
      add(slotGroup, sphere(0.162, 30), hair, [0, 1.834, -0.036], null, [1.02, 0.72, 1.01]);
      add(slotGroup, sphere(0.12, 22), hair, [0, 1.77, -0.07], null, [1.0, 0.9, 0.62]);
      [-1, 1].forEach((side) => {
        add(slotGroup, sphere(0.075, 16), hair, [side * 0.13, 1.72, 0.0], [0, 0, side * 0.1], [0.48, 1.5, 0.55]);
        add(slotGroup, sphere(0.05, 14), hairHi, [side * 0.14, 1.64, -0.03], [0, 0, side * 0.08], [0.42, 1.1, 0.48]);
        add(slotGroup, sphere(0.04, 12), hair, [side * 0.15, 1.58, -0.02], [0, 0, side * 0.06], [0.35, 0.8, 0.4]);
      });
      [
        [-0.08, 1.842, 0.118, -0.2, 0.8, 0.75, 0.58],
        [-0.02, 1.848, 0.128, -0.06, 0.85, 0.7, 0.56],
        [0.045, 1.842, 0.125, 0.16, 0.8, 0.7, 0.55],
        [0.11, 1.826, 0.108, 0.32, 0.7, 0.6, 0.5]
      ].forEach(([x, y, z, rz, sx, sy, sz], index) => {
        add(slotGroup, sphere(0.04, 14), index % 2 ? hairHi : hair, [x, y, z], [0.14, 0, rz], [sx, sy, sz]);
      });
      add(slotGroup, sphere(0.07, 14), hairHi, [-0.035, 1.905, 0.035], [-0.12, 0.1, -0.15], [0.9, 0.18, 0.55]);
    } else if (item.variant === 'long') {
      add(slotGroup, sphere(0.165, 30), hair, [0, 1.835, -0.025], null, [1.02, 0.78, 1.02]);
      add(slotGroup, sphere(0.15, 24), hair, [0, 1.55, -0.16], null, [1.1, 1.8, 0.5]);
      [-1, 1].forEach((side) => {
        add(slotGroup, sphere(0.07, 18), hair, [side * 0.115, 1.6, -0.12], [0, 0, side * 0.03], [0.55, 1.7, 0.55]);
        add(slotGroup, sphere(0.08, 18), hair, [side * 0.13, 1.62, -0.09], [0, 0, side * 0.05], [0.5, 2.2, 0.6]);
        add(slotGroup, sphere(0.055, 14), hairHi, [side * 0.135, 1.52, 0.035], [0, 0, side * 0.04], [0.42, 1.6, 0.42]);
        add(slotGroup, sphere(0.06, 16), hairHi, [side * 0.055, 1.86, 0.11], [0.1, 0, side * 0.3], [0.85, 0.55, 0.45]);
      });
      add(slotGroup, sphere(0.075, 14), hairHi, [-0.035, 1.9, 0.04], [-0.12, 0.1, -0.12], [0.95, 0.18, 0.55]);
      [-1, 1].forEach((side) => {
        add(slotGroup, sphere(0.07, 16), hair, [side * 0.105, 1.64, 0.07], [0, 0, side * 0.06], [0.55, 1.7, 0.45]);
      });
    } else if (item.variant === 'waves') {
      add(slotGroup, sphere(0.168, 30), hair, [0, 1.84, -0.025], null, [1.04, 0.82, 1.03]);
      add(slotGroup, sphere(0.15, 24), hair, [0, 1.56, -0.155], null, [1.08, 1.72, 0.54]);
      [-1, 1].forEach((side) => {
        add(slotGroup, sphere(0.085, 18), hair, [side * 0.135, 1.62, -0.1], [0, 0, side * 0.06], [0.55, 1.95, 0.6]);
        add(slotGroup, sphere(0.06, 16), hairHi, [side * 0.055, 1.865, 0.11], [0.1, 0, side * 0.32], [0.85, 0.55, 0.45]);
      });
      add(slotGroup, sphere(0.08, 14), hairHi, [-0.035, 1.9, 0.04], [-0.12, 0.1, -0.14], [0.95, 0.18, 0.55]);
      [-1, 1].forEach((side) => {
        add(slotGroup, sphere(0.072, 16), hair, [side * 0.108, 1.65, 0.07], [0, 0, side * 0.06], [0.58, 1.65, 0.46]);
      });
    } else if (item.variant === 'lob') {
      add(slotGroup, sphere(0.162, 30), hair, [0, 1.832, -0.028], null, [1.02, 0.72, 1.01]);
      add(slotGroup, sphere(0.145, 22), hair, [0, 1.71, -0.065], null, [1.0, 1.15, 0.66]);
      [-1, 1].forEach((side) => {
        add(slotGroup, sphere(0.078, 18), hair, [side * 0.125, 1.68, 0.02], [0, 0, side * 0.06], [0.52, 1.45, 0.55]);
        add(slotGroup, sphere(0.06, 14), hair, [side * 0.135, 1.62, 0.035], [0, 0, side * 0.04], [0.45, 1.0, 0.45]);
        add(slotGroup, sphere(0.055, 14), hairHi, [side * 0.05, 1.86, 0.11], [0.1, 0, side * 0.28], [0.85, 0.58, 0.45]);
      });
      add(slotGroup, sphere(0.072, 14), hairHi, [-0.035, 1.9, 0.04], [-0.12, 0.1, -0.12], [0.9, 0.18, 0.55]);
      [-1, 1].forEach((side) => {
        add(slotGroup, sphere(0.064, 14), hair, [side * 0.105, 1.67, 0.06], [0, 0, side * 0.06], [0.52, 1.25, 0.44]);
      });
    } else if (item.variant === 'buzz') {
      add(slotGroup, sphere(0.153, 26), hair, [0, 1.845, -0.018], null, [1.0, 0.5, 0.99]);
      add(slotGroup, sphere(0.148, 20), hair, [0, 1.785, -0.045], null, [0.99, 0.34, 0.94]);
      add(slotGroup, sphere(0.11, 16), hairHi, [0, 1.885, 0.045], [-0.12, 0, 0], [0.9, 0.18, 0.6]);
      [-1, 1].forEach((side) => {
        add(slotGroup, sphere(0.052, 12), fade, [side * 0.145, 1.79, 0.005], null, [0.28, 0.8, 0.5]);
        for (let index = 0; index < 4; index += 1) {
          add(slotGroup, sphere(0.009, 6), hairHi, [side * (0.095 + index * 0.014), 1.86 - index * 0.008, 0.105 - index * 0.01], null, [1.3, 0.5, 0.8]);
        }
      });
      addHairLock([[-0.115, 1.885, 0.075], [-0.055, 1.905, 0.115], [0.0, 1.9, 0.128], [0.06, 1.9, 0.115], [0.115, 1.88, 0.075]], material(new THREE.Color(palette.hair).multiplyScalar(0.62)), 0.0035);
    } else if (item.variant === 'curls') {
      if (texture === 'curly') {
        add(slotGroup, sphere(0.158, 20), hair, [0, 1.82, -0.015], null, [1.02, 0.55, 1.02]);
        const curls = [
          [-0.11, 1.87, 0.02], [0, 1.91, 0.015], [0.11, 1.87, 0.02],
          [-0.145, 1.79, -0.01], [0.145, 1.79, -0.01], [-0.1, 1.79, 0.09],
          [0.1, 1.79, 0.09], [-0.055, 1.9, 0.08], [0.055, 1.9, 0.08],
          [-0.15, 1.73, 0.02], [0.15, 1.73, 0.02], [0, 1.79, 0.13]
        ];
        curls.forEach((position, index) => {
          add(slotGroup, sphere(index % 3 === 0 ? 0.064 : 0.054, 12), index % 3 === 0 ? curlHi : index % 2 ? curlShadow : hair, position);
        });
      } else {
        add(slotGroup, sphere(0.158, 28), hair, [0, 1.842, -0.02], null, [1.02, 0.6, 1.02]);
        add(slotGroup, sphere(0.145, 20), hair, [0, 1.8, -0.05], null, [1.0, 0.7, 0.9]);
        [-1, 1].forEach((side) => {
          add(slotGroup, sphere(0.07, 16), hair, [side * 0.14, 1.76, 0.02], [0, 0, side * 0.12], [0.5, 1.3, 0.65]);
        });
        add(slotGroup, sphere(0.075, 14), hairHi, [-0.03, 1.905, 0.035], [-0.12, 0.1, -0.15], [0.9, 0.18, 0.55]);
      }
    } else if (item.variant === 'mohawk') {
      add(slotGroup, sphere(0.15, 18), hair, [0, 1.82, 0], null, [1, 0.5, 1]);
      [0.18, 0.1, 0.02, -0.06, -0.14].forEach((z, index) => {
        add(slotGroup, cone(0.055 - index * 0.005, 0.16 + (index % 2) * 0.04, 8), index % 2 ? hairHi : hair, [0, 1.94 - Math.abs(z) * 0.25, z]);
      });
      add(slotGroup, sphere(0.152, 16), hair, [0, 1.81, -0.03], null, [0.96, 0.35, 0.95]);
    } else {
      add(slotGroup, sphere(0.162, 20), hair, [0, 1.86, -0.005], null, [1.01, 0.4, 1.02]);
      add(slotGroup, sphere(0.15, 16), hair, [0, 1.82, -0.04], null, [0.98, 0.52, 0.92]);
      add(slotGroup, box(0.05, 0.14, 0.045), hair, [-0.12, 1.77, 0.055], [0.2, 0, -0.2]);
      add(slotGroup, box(0.05, 0.14, 0.045), hair, [0.12, 1.77, 0.055], [0.2, 0, 0.2]);
      add(slotGroup, box(0.12, 0.022, 0.03), hairHi, [-0.035, 1.91, 0.06], [0, 0, -0.15]);
      add(slotGroup, box(0.026, 0.08, 0.03), hairHi, [0.11, 1.85, 0.075], [0.2, 0, 0.3]);
    }
    if (texture === 'curly') {
      add(slotGroup, sphere(0.168, 24), hair, [0, 1.855, -0.022], null, [1.06, 0.78, 1.03]);
      add(slotGroup, sphere(0.14, 20), hair, [0, 1.79, -0.06], null, [1.02, 0.76, 0.82]);
      [
        [-0.1, 1.925, 0.055, 0.044], [-0.052, 1.948, 0.048, 0.047], [0, 1.955, 0.04, 0.048],
        [0.052, 1.948, 0.048, 0.047], [0.1, 1.925, 0.055, 0.044],
        [-0.142, 1.875, 0.028, 0.041], [0.142, 1.875, 0.028, 0.041],
        [-0.155, 1.812, 0.008, 0.043], [0.155, 1.812, 0.008, 0.043],
        [-0.156, 1.75, -0.012, 0.04], [0.156, 1.75, -0.012, 0.04],
        [-0.146, 1.696, -0.026, 0.034], [0.146, 1.696, -0.026, 0.034],
        [-0.115, 1.905, 0.098, 0.037], [-0.055, 1.923, 0.108, 0.039],
        [0.008, 1.928, 0.11, 0.04], [0.068, 1.921, 0.104, 0.038], [0.118, 1.9, 0.09, 0.035],
        [-0.128, 1.842, 0.072, 0.036], [0.128, 1.842, 0.072, 0.036],
        [-0.12, 1.768, 0.062, 0.034], [0.12, 1.768, 0.062, 0.034],
        [-0.095, 1.885, -0.1, 0.042], [0, 1.9, -0.118, 0.046], [0.095, 1.885, -0.1, 0.042],
        [-0.07, 1.805, -0.118, 0.04], [0.07, 1.805, -0.118, 0.04],
        [-0.11, 1.73, -0.095, 0.036], [0.11, 1.73, -0.095, 0.036]
      ].forEach(([x, y, z, r], index) => {
        add(slotGroup, sphere(r * 1.08, 12), index % 4 === 0 ? curlHi : index % 3 === 0 ? curlShadow : hair, [x, y, z], [index * 0.07, index * 0.11, index * 0.05], [1, 0.92 + (index % 3) * 0.06, 0.94]);
      });
      [
        [-0.078, 1.938, 0.096, 0.024], [-0.02, 1.955, 0.1, 0.023], [0.046, 1.948, 0.098, 0.022],
        [0.1, 1.918, 0.088, 0.021], [-0.152, 1.83, 0.04, 0.02], [0.152, 1.83, 0.04, 0.02],
        [-0.136, 1.79, 0.062, 0.019], [0.136, 1.79, 0.062, 0.019],
        [-0.09, 1.92, -0.09, 0.022], [0.02, 1.934, -0.098, 0.022]
      ].forEach(([x, y, z, r], index) => {
        add(slotGroup, sphere(r, 10), index % 3 === 0 ? curlShadow : curlHi, [x, y, z]);
      });
      [
        [-0.12, 1.905, 0.082, -0.35, 0.2, 0],
        [0.02, 1.94, 0.075, -0.55, -0.1, 0],
        [0.13, 1.885, 0.07, -0.2, -0.35, 0],
        [-0.165, 1.845, 0.02, 0, 1.35, 0],
        [0.165, 1.845, 0.02, 0, -1.35, 0],
        [-0.16, 1.755, -0.02, 0, 1.45, 0],
        [0.16, 1.755, -0.02, 0, -1.45, 0],
        [0, 1.895, -0.13, -0.2, Math.PI, 0]
      ].forEach(([x, y, z, rx, ry, rz], index) => {
        add(slotGroup, torus(index % 3 === 0 ? 0.03 : 0.025, 0.011, 12), index % 2 ? curlHi : hair, [x, y, z], [rx, ry, rz], [1, 0.78, 0.55]);
      });
    } else if (texture === 'wavy') {
      [
        [-0.11, 1.9, 0.05, 0.2], [-0.05, 1.92, 0.06, -0.15], [0.05, 1.92, 0.06, 0.15], [0.12, 1.89, 0.04, -0.2],
        [-0.14, 1.8, 0.02, 0.3], [0.14, 1.8, 0.02, -0.3], [-0.13, 1.71, 0.02, 0.25], [0.13, 1.71, 0.02, -0.25],
        [-0.085, 1.848, 0.115, 0.34], [-0.03, 1.856, 0.125, -0.3], [0.028, 1.853, 0.121, 0.28], [0.084, 1.84, 0.112, -0.34]
      ].forEach(([x, y, z, rz], index) => {
        add(slotGroup, sphere(0.038, 12), index % 2 ? hairHi : hair, [x, y, z], [0, 0, rz], [0.48, 0.95, 0.42]);
      });
    }
    // Deterministic silhouette variety: some cuts have tight/shaved sides, some keep side mass,
    // and every cut gets a small extra length offset so the catalog reads more diverse.
    if (!hasSides) {
      for (const child of slotGroup.children.slice()) {
        if (!child.isMesh) continue;
        const { x, y, z } = child.position;
        const sidePiece = Math.abs(x) > 0.09 && z < 0.07;
        const outerFront = Math.abs(x) > 0.14;
        if ((sidePiece || outerFront) && y < 1.9 && z > -0.24) {
          child.visible = false;
          child.raycast = () => {};
        }
      }
    }
    if (lengthBias !== 1) {
      for (const child of slotGroup.children) {
        if (!child.isMesh || !child.visible) continue;
        if (child.position.y < 1.88) {
          child.scale.y *= lengthBias;
          child.position.y -= (lengthBias - 1) * 0.055;
        } else {
          child.scale.y *= 0.95 + (lengthBias - 1) * 0.6;
        }
      }
    }
    tagGroup(slotGroup, 'hair');
    root.add(slotGroup);
  }

  function addAccessory(slotGroup) {
    const item = API.getItems().find((entry) => entry.id === state.equipped.accessory);
    if (!item) {
      root.add(slotGroup);
      return;
    }
    const palette = item.palette;
    const metal = metalMaterial(palette.metal);
    const accent = metalMaterial(palette.accent);
    const dark = material('#151515', { roughness: 0.24, metalness: 0.2, transparent: true, opacity: 0.88 });
    const red = material(palette.detail, { roughness: 0.36, metalness: 0.2 });
    const pearl = material('#f5e7d6', { roughness: 0.3, metalness: 0.12 });

    const addGlasses = (shape) => {
      if (shape === 'rect') {
        [-1, 1].forEach((side) => {
          const cx = side * 0.06;
          add(slotGroup, box(0.082, 0.06, 0.01), dark, [cx, 1.755, 0.155]);
          add(slotGroup, box(0.09, 0.008, 0.013), metal, [cx, 1.727, 0.15]);
          add(slotGroup, box(0.09, 0.008, 0.013), metal, [cx, 1.783, 0.15]);
          add(slotGroup, box(0.008, 0.064, 0.013), metal, [cx - 0.041, 1.755, 0.15]);
          add(slotGroup, box(0.008, 0.064, 0.013), metal, [cx + 0.041, 1.755, 0.15]);
          add(slotGroup, box(0.034, 0.01, 0.012), metal, [side * 0.108, 1.755, 0.12], [0, side * 0.25, 0]);
          add(slotGroup, box(0.003, 0.035, 0.002), accent, [cx - 0.025, 1.77, 0.162]);
        });
        add(slotGroup, box(0.028, 0.01, 0.012), metal, [0, 1.76, 0.156]);
      } else if (shape === 'cat') {
        [-1, 1].forEach((side) => {
          add(slotGroup, torus(0.05, 0.006, 20), metal, [side * 0.058, 1.755, 0.155], [0, 0, side * 0.14], [1.25, 0.88, 1]);
          add(slotGroup, new THREE.CircleGeometry(0.044, 20), dark, [side * 0.058, 1.755, 0.153], [0, 0, side * 0.14], [1.25, 0.88, 1]);
          add(slotGroup, box(0.018, 0.008, 0.012), metal, [side * 0.11, 1.79, 0.15], [0, 0, side * 0.45]);
          add(slotGroup, box(0.034, 0.01, 0.012), metal, [side * 0.108, 1.755, 0.12], [0, side * 0.25, 0]);
        });
        add(slotGroup, box(0.028, 0.01, 0.012), metal, [0, 1.76, 0.156]);
      } else {
        [-1, 1].forEach((side) => {
          add(slotGroup, torus(0.05, 0.006, 20), metal, [side * 0.058, 1.755, 0.155]);
          add(slotGroup, new THREE.CircleGeometry(0.044, 20), dark, [side * 0.058, 1.755, 0.153]);
          add(slotGroup, box(0.035, 0.01, 0.012), metal, [side * 0.105, 1.755, 0.12], [0, side * 0.25, 0]);
        });
        add(slotGroup, box(0.03, 0.01, 0.012), metal, [0, 1.76, 0.156]);
      }
      addBrandMark(slotGroup, item, [-0.108, 1.758, 0.132], 0.42, accent);
    };

    const addLayeredChain = (asPearls) => {
      if (asPearls) {
        for (let index = 0; index <= 13; index += 1) {
          const t = index / 13;
          const x = (t - 0.5) * 0.285;
          const y = 1.435 - Math.sin(t * Math.PI) * 0.135;
          const z = 0.105 + Math.sin(t * Math.PI) * 0.06;
          add(slotGroup, sphere(0.015, 10), pearl, [x, y, z]);
        }
        add(slotGroup, sphere(0.024, 12), pearl, [0, 1.27, 0.17]);
        add(slotGroup, torus(0.012, 0.003, 10), metal, [0, 1.24, 0.17], [Math.PI / 2, 0, 0]);
      } else {
        const first = tube([[-0.14, 1.46, 0.1], [-0.07, 1.36, 0.16], [0, 1.31, 0.17], [0.07, 1.36, 0.16], [0.14, 1.46, 0.1]], 0.0045, metal);
        first.userData.slot = 'accessory';
        slotGroup.add(first);
        const second = tube([[-0.1, 1.47, 0.1], [-0.05, 1.4, 0.15], [0, 1.37, 0.16], [0.05, 1.4, 0.15], [0.1, 1.47, 0.1]], 0.003, metal);
        second.userData.slot = 'accessory';
        slotGroup.add(second);
        add(slotGroup, cone(0.023, 0.045, 4), accent, [0, 1.285, 0.17], [0, 0, Math.PI]);
        add(slotGroup, sphere(0.012, 10), metal, [0, 1.39, 0.165]);
        add(slotGroup, sphere(0.009, 8), accent, [0, 1.27, 0.172]);
      }
      addBrandMark(slotGroup, item, [0, asPearls ? 1.215 : 1.25, 0.176], 0.34, accent);
    };

    const addRings = () => {
      const hands = new Map();
      [-1, 1].forEach((side) => {
        const hand = new THREE.Group();
        hand.position.set(0, -0.65, 0);
        const armScaler = new THREE.Group();
        armScaler.scale.x = state.body === 'slim' ? 0.93 : state.body === 'strong' ? 1.07 : 1;
        slotGroup.add(armScaler);
        hand.scale.x = 1 / armScaler.scale.x;
        armPivot(armScaler, side).add(hand);
        hands.set(side, hand);
        add(hand, torus(0.05, 0.006, 16), metal, [0, 0.135, 0.02], [Math.PI / 2, 0, 0]);
        [0, 1, 2].forEach((index) => {
          add(hand, torus(0.015 + index * 0.002, 0.004, 14), index === 1 ? accent : metal, [side * (index * 0.009 - 0.01), 0.005 - index * 0.012, 0.045], [Math.PI / 2, 0, 0]);
          add(hand, sphere(0.006, 8), index === 2 ? dark : accent, [side * (index * 0.009 - 0.01), 0.005 - index * 0.012, 0.058]);
        });
        add(hand, torus(0.012, 0.0035, 12), accent, [0, 0.03, 0.045], [Math.PI / 2, 0, 0]);
      });
      addBrandMark(hands.get(1), item, [0, 0.03, 0.06], 0.28, accent);
    };

    const addEarrings = () => {
      [-1, 1].forEach((side) => {
        add(slotGroup, sphere(0.009, 8), metal, [side * 0.146, 1.72, 0.018]);
        add(slotGroup, torus(0.024, 0.004, 16), metal, [side * 0.146, 1.68, 0.015], [0, Math.PI / 2, 0]);
        add(slotGroup, sphere(0.008, 8), accent, [side * 0.146, 1.646, 0.015]);
        const drop = tube([[side * 0.146, 1.68, 0.018], [side * 0.15, 1.62, 0.025], [side * 0.146, 1.58, 0.02]], 0.003, metal);
        drop.userData.slot = 'accessory';
        slotGroup.add(drop);
        add(slotGroup, sphere(0.012, 10), pearl, [side * 0.146, 1.558, 0.018]);
      });
      addBrandMark(slotGroup, item, [0.146, 1.612, 0.028], 0.28, accent);
    };

    const addWatch = () => {
      const dial = state.watchDial || 'classic';
      const strapId = state.watchStrap || 'leather';
      const dialConfig = (window.LUKAP_WATCH_DIALS || []).find((entry) => entry.id === dial) || {
        id: 'classic', face: '#f3e7d2', ink: '#2a2520', accent: '#a88855', style: 'classic'
      };
      const strapConfig = (window.LUKAP_WATCH_STRAPS || []).find((entry) => entry.id === strapId) || {
        color: '#65402d', metalness: 0.04, roughness: 0.62
      };
      const strap = material(strapConfig.color, {
        roughness: strapConfig.roughness ?? 0.5,
        metalness: strapConfig.metalness ?? 0.04
      });
      const face = material(dialConfig.face, { roughness: 0.34, metalness: dialConfig.style === 'digital' ? 0.2 : 0.06 });
      const handMat = material(dialConfig.ink, { roughness: 0.38 });
      const second = material(dialConfig.accent, { roughness: 0.35 });
      const armScaler = new THREE.Group();
      armScaler.scale.x = state.body === 'slim' ? 0.93 : state.body === 'strong' ? 1.07 : 1;
      slotGroup.add(armScaler);
      const pivot = armPivot(armScaler, -1);
      const watchGroup = new THREE.Group();
      watchGroup.position.set(0, -0.595, 0);
      pivot.add(watchGroup);
      const wx = 0;
      const wy = 0;
      const wz = 0.045;
      add(watchGroup, torus(0.052, 0.011, 20), strap, [wx, wy, 0.018], [Math.PI / 2, 0, 0]);
      add(watchGroup, box(0.062, 0.04, 0.085), strap, [wx, wy + 0.058, 0.034]);
      add(watchGroup, box(0.062, 0.04, 0.085), strap, [wx, wy - 0.058, 0.034]);
      if (strapId === 'twotone') {
        add(watchGroup, box(0.016, 0.038, 0.088), material('#c9a45c', { roughness: 0.32, metalness: 0.6 }), [wx, wy + 0.058, 0.035]);
        add(watchGroup, box(0.016, 0.038, 0.088), material('#c9a45c', { roughness: 0.32, metalness: 0.6 }), [wx, wy - 0.058, 0.035]);
      } else if (strapId === 'nato') {
        [0.05, 0.064].forEach((offset) => {
          add(watchGroup, box(0.06, 0.005, 0.087), material('#b9bcc2', { roughness: 0.6 }), [wx, wy + offset, 0.034]);
          add(watchGroup, box(0.06, 0.005, 0.087), material('#b9bcc2', { roughness: 0.6 }), [wx, wy - offset, 0.034]);
        });
      }
      add(watchGroup, box(0.01, 0.008, 0.06), accent, [wx - 0.028, wy + 0.03, 0.075]);
      add(watchGroup, box(0.01, 0.008, 0.06), accent, [wx - 0.028, wy - 0.03, 0.075]);
      add(watchGroup, cylinder(0.039, 0.039, 0.016, 24), metal, [wx, wy, 0.078], [Math.PI / 2, 0, 0]);
      add(watchGroup, new THREE.CircleGeometry(0.033, 24), face, [wx, wy, 0.087]);
      add(watchGroup, torus(0.039, 0.004, 22), metal, [wx, wy, 0.087]);
      add(watchGroup, cylinder(0.009, 0.009, 0.014, 10), metal, [wx + 0.042, wy, 0.078], [0, 0, Math.PI / 2]);
      addBrandMark(watchGroup, item, [wx, wy + 0.019, 0.093], 0.3, second);
      const style = dialConfig.style;
      if (style === 'digital') {
        add(watchGroup, box(0.042, 0.02, 0.003), material('#1d2622', { roughness: 0.32 }), [wx, wy + 0.008, 0.09]);
        add(watchGroup, box(0.032, 0.006, 0.003), material(dialConfig.ink, { roughness: 0.3 }), [wx, wy + 0.007, 0.092]);
        add(watchGroup, box(0.023, 0.004, 0.003), material(dialConfig.ink, { roughness: 0.3 }), [wx, wy - 0.004, 0.092]);
      } else {
        [0, 1, 2, 3].forEach((index) => {
          const angle = index * Math.PI / 2;
          add(watchGroup, box(0.004, 0.009, 0.003), second, [wx + Math.sin(angle) * 0.025, wy + Math.cos(angle) * 0.025, 0.09], [0, 0, -angle]);
        });
        if (style === 'chrono' || style === 'panda') {
          add(watchGroup, cylinder(0.008, 0.008, 0.002, 16), second, [wx - 0.013, wy + 0.012, 0.09], [Math.PI / 2, 0, 0]);
          add(watchGroup, cylinder(0.008, 0.008, 0.002, 16), second, [wx + 0.013, wy + 0.012, 0.09], [Math.PI / 2, 0, 0]);
          add(watchGroup, cylinder(0.007, 0.007, 0.002, 16), second, [wx, wy - 0.013, 0.09], [Math.PI / 2, 0, 0]);
        } else if (style === 'moon') {
          add(watchGroup, cylinder(0.008, 0.008, 0.002, 16), material('#e8dcc4', { roughness: 0.5 }), [wx, wy - 0.014, 0.09], [Math.PI / 2, 0, 0]);
        } else if (style === 'skeleton') {
          add(watchGroup, torus(0.009, 0.0018, 12), second, [wx - 0.012, wy - 0.006, 0.09]);
          add(watchGroup, torus(0.006, 0.0015, 12), second, [wx + 0.012, wy + 0.01, 0.09]);
        } else if (style === 'guilloche') {
          add(watchGroup, torus(0.017, 0.0012, 20), material(dialConfig.accent, { roughness: 0.4 }), [wx, wy, 0.089]);
          add(watchGroup, torus(0.026, 0.001, 20), material(dialConfig.accent, { roughness: 0.4 }), [wx, wy, 0.089]);
        } else if (style === 'gmt') {
          add(watchGroup, box(0.003, 0.024, 0.003), second, [wx, wy + 0.012, 0.093], [0, 0, -0.5]);
        }
        add(watchGroup, box(0.004, 0.021, 0.004), handMat, [wx, wy + 0.01, 0.091], [0, 0, -0.35]);
        add(watchGroup, box(0.003, 0.029, 0.004), handMat, [wx + 0.008, wy + 0.014, 0.092], [0, 0, -1.1]);
        add(watchGroup, box(0.002, 0.032, 0.003), second, [wx - 0.006, wy + 0.015, 0.093], [0, 0, -0.7]);
      }
    };

    const addBelt = () => {
      const bottomItem = API.getItems().find((entry) => entry.id === state.equipped.bottom);
      const fit = bottomItem?.fit || 'mid';
      const waistY = fit === 'high' ? 0.975 : fit === 'low' ? 0.855 : 0.925;
      const plan = bottomPlan(bottomItem || { cut: 'straight', variant: 'straight' }, waistY);
      const cut = bottomItem?.cut || '';
      const widthScale = ['baggy', 'parachute', 'flare', 'jorts'].includes(cut)
        ? 1.07
        : ['track', 'straight'].includes(cut) ? 0.94 : ['cargo', 'wide'].includes(cut) ? 1.04 : 1;
      const bodyWidth = state.body === 'slim' ? 0.93 : state.body === 'strong' ? 1.07 : 1;
      const beltR = Math.max(0.19, plan.hipR * widthScale * bodyWidth + 0.018);
      const depthScale = 0.82;
      const frontZ = beltR * depthScale;
      const style = item.beltMaterial || 'leather';
      const strap = style === 'patent'
        ? material(palette.main, { roughness: 0.18, metalness: 0.08, envMapIntensity: 0.8 })
        : style === 'suede'
          ? material(palette.main, { roughness: 0.9, fabric: true })
          : style === 'webbing'
            ? cloth(palette.main, { roughness: 0.88 })
            : material(palette.main, { roughness: 0.46 });
      const thread = material(isLightColor(palette.main) ? '#6f4f2e' : '#e8c07a', { roughness: 0.82 });
      const buckle = style === 'chain' ? metal : metalMaterial(palette.metal);
      const bandHeight = style === 'webbing' ? 0.045 : 0.055;
      const y = waistY + 0.004;

      if (style === 'chain') {
        add(slotGroup, new THREE.CylinderGeometry(beltR * 0.995, beltR * 0.995, 0.014, 40, 1, true), material(palette.detail, { roughness: 0.5 }), [0, y, 0], null, [1, 1, depthScale]);
        const linkMat = metalMaterial(palette.metal);
        for (let index = 0; index < 18; index += 1) {
          const angle = (index / 18) * Math.PI * 2;
          const link = add(slotGroup, torus(0.019, 0.004, 14), linkMat, [Math.cos(angle) * beltR, y, Math.sin(angle) * frontZ], [0, -angle, index % 2 ? Math.PI / 2 : 0]);
          link.castShadow = false;
        }
      } else {
        add(slotGroup, new THREE.CylinderGeometry(beltR, beltR * 1.002, bandHeight, 44, 1, true), strap, [0, y, 0], null, [1, 1, depthScale]);
        if (style !== 'webbing') {
          [-bandHeight / 2 + 0.008, bandHeight / 2 - 0.008].forEach((dy) => {
            add(slotGroup, torus(beltR * 1.003, 0.0016, 44), thread, [0, y + dy, 0], [Math.PI / 2, 0, 0], [1, 1, depthScale]);
          });
        } else {
          add(slotGroup, torus(beltR * 1.008, 0.0022, 44), material(palette.detail, { roughness: 0.8 }), [0, y + bandHeight / 2 - 0.004, 0], [Math.PI / 2, 0, 0], [1, 1, depthScale]);
          add(slotGroup, torus(beltR * 1.008, 0.0018, 44), material(palette.detail, { roughness: 0.8 }), [0, y - bandHeight / 2 + 0.004, 0], [Math.PI / 2, 0, 0], [1, 1, depthScale]);
        }
      }

      const buckleZ = frontZ + 0.012;
      if (style === 'suede') {
        add(slotGroup, torus(0.031, 0.006, 22), buckle, [0, y, buckleZ], null, [1.05, 0.9, 1]);
        add(slotGroup, box(0.052, 0.006, 0.006), buckle, [0.012, y, buckleZ + 0.004]);
      } else if (style === 'webbing') {
        add(slotGroup, box(0.082, 0.052, 0.014), buckle, [0, y, buckleZ]);
        add(slotGroup, box(0.042, 0.024, 0.018), material(palette.detail, { roughness: 0.4 }), [0, y, buckleZ + 0.004]);
        add(slotGroup, box(0.006, 0.036, 0.012), buckle, [0, y, buckleZ + 0.008]);
      } else if (style === 'chain') {
        add(slotGroup, torus(0.038, 0.006, 24), buckle, [0, y, frontZ + 0.012]);
        add(slotGroup, box(0.06, 0.01, 0.012), buckle, [0, y, frontZ + 0.018]);
        for (let index = 0; index < 5; index += 1) {
          add(slotGroup, torus(0.014 + index * 0.001, 0.003, 12), buckle, [0.02 + index * 0.006, y - 0.03 - index * 0.018, frontZ + 0.02], [Math.PI / 2, 0, 0]);
        }
      } else {
        add(slotGroup, box(0.088, 0.009, 0.014), buckle, [0, y + 0.029, buckleZ]);
        add(slotGroup, box(0.088, 0.009, 0.014), buckle, [0, y - 0.029, buckleZ]);
        add(slotGroup, box(0.009, 0.067, 0.014), buckle, [-0.0395, y, buckleZ]);
        add(slotGroup, box(0.009, 0.067, 0.014), buckle, [0.0395, y, buckleZ]);
        add(slotGroup, box(0.054, 0.006, 0.006), buckle, [0.012, y, buckleZ + 0.004]);
      }

      if (style !== 'chain') {
        const tailX = 0.098;
        add(slotGroup, box(0.17, 0.043, 0.012), strap, [tailX, y, frontZ + 0.006]);
        add(slotGroup, cylinder(0.021, 0.021, 0.012, 16), strap, [tailX + 0.084, y, frontZ + 0.006], [Math.PI / 2, 0, 0], [1, 1, 0.55]);
        for (let index = 0; index < 3; index += 1) {
          add(slotGroup, sphere(0.0045, 8), material(palette.detail, { roughness: 0.5 }), [tailX + 0.016 + index * 0.03, y, frontZ + 0.013]);
        }
        add(slotGroup, box(0.014, 0.062, 0.02), strap, [0.155, y, frontZ + 0.002]);
        add(slotGroup, box(0.002, 0.05, 0.004), thread, [0.155, y, frontZ + 0.013]);
      }
      addBrandMark(slotGroup, item, [0.1, y, frontZ + 0.014], 0.38, buckle);
    };

    if (item.variant === 'belt') {
      addBelt();
    } else if (item.variant === 'beanie') {
      const knit = cloth(palette.main, { roughness: 0.9 });
      const knitHi = cloth(palette.accent, { roughness: 0.84 });
      add(slotGroup, sphere(0.175, 20), knit, [0, 1.865, -0.012], null, [1.08, 0.9, 1.08]);
      add(slotGroup, torus(0.158, 0.032, 24), knitHi, [0, 1.79, 0], [Math.PI / 2, 0, 0], [1, 1, 0.92]);
      add(slotGroup, torus(0.16, 0.007, 24), material(palette.detail, { roughness: 0.8 }), [0, 1.817, 0], [Math.PI / 2, 0, 0], [1, 1, 0.92]);
      add(slotGroup, sphere(0.03, 12), knitHi, [0, 2.04, 0.005], null, [0.9, 0.72, 0.9]);
      addBrandMark(slotGroup, item, [0, 1.82, 0.166], 0.62, knitHi);
    } else if (item.variant === 'scarf') {
      const knit = cloth(palette.main, { roughness: 0.92 });
      const knitHi = cloth(palette.accent, { roughness: 0.86 });
      add(slotGroup, torus(0.118, 0.035, 24), knit, [0, 1.56, 0.01], [Math.PI / 2, 0, 0], [1, 1, 0.82]);
      add(slotGroup, box(0.065, 0.36, 0.032), knit, [-0.082, 1.3, 0.19], [0.12, 0, 0.08]);
      add(slotGroup, box(0.062, 0.3, 0.03), knit, [0.084, 1.25, 0.185], [0.18, 0, -0.08]);
      add(slotGroup, box(0.018, 0.22, 0.006), knitHi, [0.084, 1.24, 0.202], [0.18, 0, -0.08]);
      add(slotGroup, torus(0.02, 0.005, 14), knitHi, [-0.082, 1.115, 0.2], [Math.PI / 2, 0, 0]);
      add(slotGroup, torus(0.018, 0.004, 14), knitHi, [0.084, 1.1, 0.195], [Math.PI / 2, 0, 0]);
      addBrandMark(slotGroup, item, [-0.082, 1.14, 0.21], 0.42, knitHi);
    } else if (item.variant === 'bag') {
      const bodyMat = cloth(palette.main, { roughness: 0.62 });
      const strapMat = material(palette.detail, { roughness: 0.5 });
      add(slotGroup, box(0.2, 0.17, 0.075), bodyMat, [0.215, 0.94, 0.16], [0, -0.12, 0]);
      add(slotGroup, box(0.205, 0.045, 0.08), strapMat, [0.215, 1.035, 0.16], [0, -0.12, 0]);
      add(slotGroup, box(0.05, 0.028, 0.012), metal, [0.215, 0.985, 0.202]);
      const strap = tube([[-0.15, 1.47, 0.06], [-0.18, 1.24, 0.14], [-0.1, 1.02, 0.17], [0.06, 0.98, 0.18], [0.17, 1.2, 0.13], [0.16, 1.46, 0.06]], 0.012, strapMat);
      strap.userData.slot = 'accessory';
      slotGroup.add(strap);
      addBrandMark(slotGroup, item, [0.215, 0.955, 0.202], 0.65, metal);
    } else if (item.variant === 'visor') {
      add(slotGroup, box(0.26, 0.078, 0.035), dark, [0, 1.755, 0.152], [0.02, 0, 0]);
      add(slotGroup, box(0.265, 0.012, 0.04), red, [0, 1.79, 0.152]);
      add(slotGroup, box(0.012, 0.055, 0.04), metal, [-0.13, 1.75, 0.15]);
      add(slotGroup, box(0.012, 0.055, 0.04), metal, [0.13, 1.75, 0.15]);
      add(slotGroup, box(0.02, 0.008, 0.012), accent, [0.1, 1.74, 0.17]);
    } else if (item.variant === 'glasses') {
      addGlasses(item.shape || 'round');
    } else if (item.variant === 'watch') {
      addWatch();
    } else if (item.variant === 'rings') {
      addRings();
    } else if (item.variant === 'chain') {
      addLayeredChain(false);
    } else if (item.variant === 'pearls') {
      addLayeredChain(true);
    } else if (item.variant === 'earrings') {
      addEarrings();
    } else {
      addGlasses('round');
      addLayeredChain(false);
    }
    tagGroup(slotGroup, 'accessory');
    root.add(slotGroup);
  }

  function buildCharacter() {
    rebuildCount += 1;
    if (!reduceMotion && hasBuilt) equipPulse = 1;
    state = API.getState();
    pickables = [];
    while (root.children.length) {
      const child = root.children[0];
      root.remove(child);
      clearGroup(child);
    }
    const bodyWidth = state.body === 'slim' ? 0.93 : state.body === 'strong' ? 1.07 : 1;
    addBody();
    const topGroup = new THREE.Group();
    addTop(topGroup);
    topGroup.scale.x *= bodyWidth;
    const bottomGroup = new THREE.Group();
    addBottom(bottomGroup);
    bottomGroup.scale.x *= bodyWidth;
    const shoesGroup = new THREE.Group();
    addShoes(shoesGroup);
    shoesGroup.scale.x *= bodyWidth;
    addHair(new THREE.Group());
    addAccessory(new THREE.Group());

    const invalid = [];
    root.traverse((object) => {
      if (!object.isMesh) return;
      const geometry = object.geometry;
      if (!geometry || !geometry.isBufferGeometry) {
        invalid.push({ slot: object.userData?.slot || object.parent?.userData?.slot || '?', kind: geometry?.constructor?.name || 'none' });
        object.visible = false;
        return;
      }
      if (!geometry.boundingSphere || !geometry.boundingSphere.center) {
        geometry.computeBoundingSphere();
      }
    });
    pickables = pickables.filter((mesh) => mesh.visible !== false && mesh.geometry?.isBufferGeometry);
    if (invalid.length) {
      window.__lukapInvalid = invalid;
      console.warn('[LUKAP] hidden invalid meshes', invalid);
    } else {
      window.__lukapInvalid = [];
    }
  }

  function pulseStage() {
    stage.classList.remove('is-refreshing');
    void stage.offsetWidth;
    stage.classList.add('is-refreshing');
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(() => stage.classList.remove('is-refreshing'), 620);
  }

  function sync(force) {
    state = API.getState();
    const nextSignature = JSON.stringify({
      equipped: state.equipped,
      skin: state.skin,
      body: state.body,
      hairTexture: state.hairTexture,
      watchDial: state.watchDial,
      watchStrap: state.watchStrap
    });
    if (!force && nextSignature === signature) return;
    signature = nextSignature;
    snapshotCache = { signature: '', url: '' };
    buildCharacter();
    if (hasBuilt) pulseStage();
    hasBuilt = true;
  }

  function applyCamera() {
    const targetY = 0.95 + Math.min(0.6, Math.max(0, viewZoom - 1) * 0.62);
    const sway = Math.sin(viewRotation) * 0.03;
    camera.position.set(sway, targetY + 0.08 + Math.sin(viewRotation * 0.5) * 0.012, BASE_DISTANCE / viewZoom);
    camera.lookAt(0, targetY, 0);
  }

  function updateCamera(instant) {
    if (instant) {
      viewZoom = zoom;
      viewRotation = rotation;
      root.rotation.y = viewRotation;
    }
    stage.classList.toggle('is-zoomed', zoom > 1.03);
    applyCamera();
  }

  function snapshot() {
    if (snapshotCache.signature === signature && snapshotCache.url) return snapshotCache.url;
    const hiddenStage = stage.clientWidth < 2 || stage.clientHeight < 2;
    if (hiddenStage) {
      renderer.setSize(lastGoodSize.width, lastGoodSize.height, false);
      camera.aspect = lastGoodSize.width / lastGoodSize.height;
      camera.updateProjectionMatrix();
    }
    const previousRotation = rotation;
    const previousZoom = zoom;
    const previousViewRotation = viewRotation;
    const previousViewZoom = viewZoom;
    const previousPositionY = root.position.y;
    const previousScale = root.scale.x;
    rotation = 0;
    zoom = 1;
    viewRotation = 0;
    viewZoom = 1;
    root.rotation.y = 0;
    root.position.y = 0;
    root.scale.setScalar(1);
    applyCamera();
    renderer.render(scene, camera);
    const url = renderer.domElement.toDataURL('image/png');
    rotation = previousRotation;
    zoom = previousZoom;
    viewRotation = previousViewRotation;
    viewZoom = previousViewZoom;
    root.position.y = previousPositionY;
    root.scale.setScalar(previousScale);
    root.rotation.y = viewRotation;
    applyCamera();
    renderer.render(scene, camera);
    if (hiddenStage) resize();
    snapshotCache = { signature, url };
    return url;
  }

  function resize() {
    const width = Math.max(1, stage.clientWidth);
    const height = Math.max(1, stage.clientHeight);
    if (width > 2 && height > 2) lastGoodSize = { width, height };
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function getSlotFromObject(object) {
    let current = object;
    while (current && !current.userData.slot) current = current.parent;
    return current && current.userData.slot;
  }

  function raycast(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(pickables, false);
    for (const hit of hits) {
      const slot = getSlotFromObject(hit.object);
      if (slot) return slot;
    }
    return null;
  }

  function setPullHint(active) {
    const hint = document.querySelector('.stage-tap-hint');
    if (!hint) return;
    if (!hint.dataset.original) hint.dataset.original = hint.textContent;
    hint.textContent = active ? 'ОТПУСТИ, ЧТОБЫ СНЯТЬ' : hint.dataset.original;
    stage.classList.toggle('is-pulling', Boolean(active));
  }

  function pointerDistance() {
    const points = [...activePointers.values()];
    return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
  }

  function onPointerDown(event) {
    if (event.button !== undefined && event.button !== 0) return;
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (activePointers.size === 2) {
      pinchStart = { distance: Math.max(1, pointerDistance()), zoom };
      dragStart = null;
      dragMode = null;
      dragSlot = null;
      return;
    }
    if (activePointers.size > 2) return;
    dragStart = { x: event.clientX, y: event.clientY, rotation };
    dragMode = null;
    dragSlot = raycast(event);
    dragMoved = 0;
    rotationVelocity = 0;
    lastInteraction = performance.now();
    renderer.domElement.setPointerCapture?.(event.pointerId);
  }

  function onPointerMove(event) {
    if (activePointers.has(event.pointerId)) {
      activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    }
    if (activePointers.size >= 2 && pinchStart) {
      const nextZoom = pinchStart.zoom * (pointerDistance() / pinchStart.distance);
      zoom = Math.min(2.4, Math.max(1, nextZoom));
      updateCamera();
      return;
    }
    if (!dragStart) return;
    const dx = event.clientX - dragStart.x;
    const dy = event.clientY - dragStart.y;
    dragMoved = Math.max(dragMoved, Math.hypot(dx, dy));
    if (!dragMode) {
      if (dragSlot && dy > 12 && dy > Math.abs(dx) * 0.8) dragMode = 'pull';
      else if (Math.abs(dx) > 5 || Math.abs(dy) > 5) dragMode = 'rotate';
    }
    if (dragMode === 'pull') {
      setPullHint(true);
      return;
    }
    if (dragMode === 'rotate') {
      const previous = rotation;
      rotation = dragStart.rotation + dx * 0.011;
      rotationVelocity = (rotation - previous) * 0.62;
      lastInteraction = performance.now();
    }
  }

  function onPointerUp(event) {
    activePointers.delete(event.pointerId);
    if (pinchStart) {
      if (activePointers.size < 2) pinchStart = null;
      if (!dragStart) return;
    }
    if (!dragStart) return;
    const dx = event.clientX - dragStart.x;
    const dy = event.clientY - dragStart.y;
    if (dragMode === 'pull' && dy > 48 && dragSlot) {
      API.removeSlotSoft(dragSlot);
      setPullHint(false);
    } else if (!dragMode && dragMoved < 6 && dragSlot) {
      API.openSlotSheet(dragSlot);
    }
    if (dragMode === 'rotate') lastInteraction = performance.now();
    setPullHint(false);
    dragStart = null;
    dragMode = null;
    dragSlot = null;
    dragMoved = 0;
    try { renderer.domElement.releasePointerCapture?.(event.pointerId); } catch { /* ignore */ }
  }

  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  renderer.domElement.addEventListener('pointermove', onPointerMove);
  renderer.domElement.addEventListener('pointerup', onPointerUp);
  renderer.domElement.addEventListener('pointercancel', onPointerUp);
  renderer.domElement.addEventListener('dblclick', () => { rotation = 0; rotationVelocity = 0; });
  renderer.domElement.addEventListener('wheel', (event) => {
    event.preventDefault();
    zoom = Math.min(2.4, Math.max(1, zoom - event.deltaY * 0.0012));
    updateCamera();
  }, { passive: false });
  document.querySelectorAll('[data-zoom]').forEach((button) => {
    button.addEventListener('click', () => {
      zoom = Math.min(2.4, Math.max(1, zoom + (button.dataset.zoom === 'in' ? 0.25 : -0.25)));
      updateCamera();
    });
  });

  const lookScreen = document.querySelector('.screen[data-screen="look"]');
  const dropModal = document.getElementById('dropModal');
  function animate() {
    requestAnimationFrame(animate);
    const visible = Boolean(lookScreen && lookScreen.classList.contains('is-active'))
      && !document.hidden
      && !document.querySelector('.sheet.is-open')
      && !(dropModal && dropModal.classList.contains('is-open'));
    if (!visible) return;
    const delta = Math.min(clock.getDelta(), 0.05);
    const idleTarget = !dragStart && performance.now() - lastInteraction > 2600 ? 1 : 0;
    idleBlend += (idleTarget - idleBlend) * Math.min(1, delta * 1.7);
    if (!dragStart) {
      if (idleBlend > 0.02) {
        rotation += delta * 0.19 * idleBlend;
        rotationVelocity *= 0.88;
      } else {
        rotation += rotationVelocity;
        rotationVelocity *= 0.9;
      }
    }
    idleTime += delta;
    equipPulse = Math.max(0, equipPulse - delta * 2.8);
    const breathe = reduceMotion ? 0 : Math.sin(idleTime * 1.15) * idleBlend;
    root.position.y = breathe * 0.007 + equipPulse * 0.008;
    root.scale.setScalar(1 + equipPulse * 0.03 + breathe * 0.002);
    viewZoom += (zoom - viewZoom) * Math.min(1, delta * 9);
    viewRotation += (rotation - viewRotation) * Math.min(1, delta * 16);
    root.rotation.y = viewRotation;
    applyCamera();
    renderer.render(scene, camera);
  }

  new ResizeObserver(resize).observe(stage);
  updateCamera();
  resize();
  frame.classList.add('has-3d');
  host.setAttribute('aria-hidden', 'false');
  window.lukap3d = {
    sync,
    snapshot,
    resetView() { rotation = 0; zoom = 1; rotationVelocity = 0; updateCamera(true); },
    get rotation() { return rotation; },
    get zoom() { return zoom; },
    get rebuilds() { return rebuildCount; },
    setRotation(value) { rotation = Number(value) || 0; rotationVelocity = 0; updateCamera(); }
  };
  sync(true);
  animate();
})();
