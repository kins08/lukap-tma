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
  renderer.toneMappingExposure = 0.98;
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
    sky.addColorStop(0, '#fffdf9');
    sky.addColorStop(0.38, '#f3eadc');
    sky.addColorStop(0.62, '#d8c9b6');
    sky.addColorStop(0.8, '#a38d75');
    sky.addColorStop(1, '#6e5c4a');
    context.fillStyle = sky;
    context.fillRect(0, 0, 1024, 512);

    const softbox = (x, y, width, height, color, alpha, blur) => {
      context.save();
      context.filter = `blur(${blur}px)`;
      context.fillStyle = `rgba(${color},${alpha})`;
      context.fillRect(x, y, width, height);
      context.restore();
    };
    softbox(120, 54, 360, 220, '255,255,252', 0.96, 34);
    softbox(690, 120, 230, 150, '255,238,220', 0.62, 28);
    softbox(430, 300, 390, 130, '255,246,232', 0.24, 42);
    context.fillStyle = 'rgba(255,252,246,.28)';
    context.fillRect(0, 0, 1024, 88);

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

  const BASE_DISTANCE = 4.6;
  const camera = new THREE.PerspectiveCamera(29, 1, 0.05, 30);
  camera.position.set(0, 1.06, BASE_DISTANCE);
  camera.lookAt(0, 0.98, 0);

  scene.add(new THREE.HemisphereLight(0xfff7ec, 0x8a7a66, 0.32));
  const keyLight = new THREE.DirectionalLight(0xfff1df, 1.35);
  keyLight.position.set(-2.4, 3.5, 2.8);
  keyLight.castShadow = true;
  const lowPower = (navigator.hardwareConcurrency || 4) <= 4;
  const shadowSize = lowPower ? 1024 : 2048;
  keyLight.shadow.mapSize.set(shadowSize, shadowSize);
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 10;
  keyLight.shadow.camera.left = -2.3;
  keyLight.shadow.camera.right = 2.3;
  keyLight.shadow.camera.top = 3.2;
  keyLight.shadow.camera.bottom = -0.2;
  keyLight.shadow.bias = -0.0004;
  keyLight.shadow.normalBias = 0.02;
  keyLight.shadow.radius = 5;
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xeaf0ff, 0.5);
  fillLight.position.set(2.6, 1.6, 2.2);
  scene.add(fillLight);
  const rimLight = new THREE.DirectionalLight(0xffffff, 0.8);
  rimLight.position.set(2.2, 2.8, -2.6);
  scene.add(rimLight);

  const cycCanvas = document.createElement('canvas');
  cycCanvas.width = 512;
  cycCanvas.height = 512;
  const cycContext = cycCanvas.getContext('2d');
  const cycGradient = cycContext.createLinearGradient(0, 0, 0, 512);
  cycGradient.addColorStop(0, '#f2e8da');
  cycGradient.addColorStop(0.42, '#e9dccb');
  cycGradient.addColorStop(0.56, '#e2d2be');
  cycGradient.addColorStop(1, '#d8c7b0');
  cycContext.fillStyle = cycGradient;
  cycContext.fillRect(0, 0, 512, 512);
  const cycGlow = cycContext.createRadialGradient(256, 250, 10, 256, 250, 260);
  cycGlow.addColorStop(0, 'rgba(255,252,245,.48)');
  cycGlow.addColorStop(0.55, 'rgba(255,248,236,.16)');
  cycGlow.addColorStop(1, 'rgba(255,248,236,0)');
  cycContext.fillStyle = cycGlow;
  cycContext.fillRect(0, 0, 512, 512);
  const cycTexture = new THREE.CanvasTexture(cycCanvas);
  cycTexture.encoding = THREE.sRGBEncoding;
  cycTexture.anisotropy = Math.min(4, maxAnisotropy);

  const cycWidth = 8;
  const cycXSegments = 32;
  const cycVSegments = 40;
  const cycPositions = [];
  const cycUvs = [];
  const cycIndices = [];
  const cycProfile = [];
  for (let index = 0; index <= cycVSegments; index += 1) {
    const v = index / cycVSegments;
    let z;
    let y;
    if (v < 0.32) {
      const t = v / 0.32;
      z = 4.8 - t * 4.6;
      y = 0;
    } else if (v < 0.56) {
      const t = (v - 0.32) / 0.24;
      const angle = t * Math.PI / 2;
      z = 0.2 - Math.sin(angle) * 1.0;
      y = 1 - Math.cos(angle);
    } else {
      const t = (v - 0.56) / 0.44;
      z = -0.8;
      y = 1 + t * 3.4;
    }
    cycProfile.push({ y, z });
  }
  for (let vIndex = 0; vIndex <= cycVSegments; vIndex += 1) {
    for (let xIndex = 0; xIndex <= cycXSegments; xIndex += 1) {
      const x = (xIndex / cycXSegments - 0.5) * cycWidth;
      const profile = cycProfile[vIndex];
      cycPositions.push(x, profile.y, profile.z);
      cycUvs.push(xIndex / cycXSegments, 1 - vIndex / cycVSegments);
    }
  }
  for (let vIndex = 0; vIndex < cycVSegments; vIndex += 1) {
    for (let xIndex = 0; xIndex < cycXSegments; xIndex += 1) {
      const a = vIndex * (cycXSegments + 1) + xIndex;
      const b = a + 1;
      const c = a + cycXSegments + 1;
      const d = c + 1;
      cycIndices.push(a, c, b, b, c, d);
    }
  }
  const cycGeometry = new THREE.BufferGeometry();
  cycGeometry.setAttribute('position', new THREE.Float32BufferAttribute(cycPositions, 3));
  cycGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(cycUvs, 2));
  cycGeometry.setIndex(cycIndices);
  cycGeometry.computeVertexNormals();
  const cyclorama = new THREE.Mesh(cycGeometry, new THREE.MeshStandardMaterial({
    color: 0xece1d2,
    map: cycTexture,
    roughness: 0.95,
    metalness: 0,
    side: THREE.DoubleSide
  }));
  cyclorama.receiveShadow = true;
  cyclorama.castShadow = false;
  scene.add(cyclorama);

  const contactCanvas = document.createElement('canvas');
  contactCanvas.width = 512;
  contactCanvas.height = 256;
  const contactContext = contactCanvas.getContext('2d');
  [168, 344].forEach((cx) => {
    const contactGradient = contactContext.createRadialGradient(cx, 128, 4, cx, 128, 92);
    contactGradient.addColorStop(0, 'rgba(42,29,18,.44)');
    contactGradient.addColorStop(0.48, 'rgba(42,29,18,.2)');
    contactGradient.addColorStop(1, 'rgba(42,29,18,0)');
    contactContext.save();
    contactContext.translate(cx, 128);
    contactContext.scale(1, 0.5);
    contactContext.translate(-cx, -128);
    contactContext.fillStyle = contactGradient;
    contactContext.fillRect(0, 0, 512, 256);
    contactContext.restore();
  });
  const contactTexture = new THREE.CanvasTexture(contactCanvas);
  const contactShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.98, 0.5),
    new THREE.MeshBasicMaterial({ map: contactTexture, transparent: true, depthWrite: false })
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.set(0, 0.004, 0.035);
  contactShadow.renderOrder = 1;
  scene.add(contactShadow);

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
  let frozen = false;
  let cameraTargetY = 0.98;
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

  function armPivot(parent, side) {
    const pivot = new THREE.Group();
    pivot.position.set(side * BODY.shoulder.x * bodyShape().shoulder, BODY.shoulder.y, 0);
    pivot.rotation.z = side * (ARM_ANGLE + (side > 0 ? 0.018 : -0.012));
    parent.add(pivot);
    return pivot;
  }

  function makeSleeve(parent, side, mat, cuffMat, options) {
    const config = options || {};
    const thickness = config.thickness === undefined ? 0.007 : config.thickness;
    const ease = config.ease === undefined ? 0.006 : config.ease;
    const length = config.length || 0.5;
    const pivot = armPivot(parent, side);
    const arm = armSections();
    const top = 0.012;
    const end = -length + 0.02;
    // Рукав строится по профилю руки: ткань повторяет дельтовидную, локтевую и лучевую форму.
    const steps = 18;
    const sections = [];
    for (let step = 0; step <= steps; step += 1) {
      const t = step / steps;
      const y = end + (top - end) * t;
      const baseRx = sampleSections(arm, y, 'rx', 0.05);
      const baseRz = sampleSections(arm, y, 'rz', 0.05);
      const flare = (config.flare || 0) * t;
      sections.push({
        y,
        rx: baseRx + thickness + ease + flare,
        rz: baseRz + thickness + ease + flare,
        cx: -side * 0.014 * Math.max(0, 1 - t * 4),
        cz: 0,
        power: 2.25
      });
    }
    const sleeve = new THREE.Mesh(loft(sections, { rings: 30, segments: 24, power: 2.25 }), mat);
    sleeve.castShadow = true;
    sleeve.receiveShadow = true;
    sleeve.userData.slot = 'top';
    pivot.add(sleeve);
    const cuffRadius = sampleSections(arm, end, 'rx', 0.04) + thickness + ease;
    const cuffHeight = Math.min(0.078, length * 0.32);
    const cuffSections = [
      { y: end - cuffHeight, rx: cuffRadius * 0.97, rz: cuffRadius * 0.93, cx: 0, cz: 0, power: 2.2 },
      { y: end - 0.008, rx: cuffRadius * 1.08, rz: cuffRadius * 1.04, cx: 0, cz: 0, power: 2.2 },
      { y: end + 0.045, rx: cuffRadius * 1.16, rz: cuffRadius * 1.12, cx: 0, cz: 0, power: 2.2 }
    ];
    const cuff = new THREE.Mesh(loft(cuffSections, { rings: 10, segments: 24, power: 2.2 }), cuffMat);
    cuff.castShadow = true;
    cuff.receiveShadow = true;
    cuff.userData.slot = 'top';
    pivot.add(cuff);
    add(pivot, torus(cuffRadius * 1.14, 0.005, 24), cuffMat, [0, end + 0.045, 0], [Math.PI / 2, 0, 0], [1, 1, 0.97]);
    if (config.stripes) {
      [end + length * 0.12, end + length * 0.03].forEach((yOffset) => {
        add(pivot, torus(cuffRadius * 0.98, 0.012, 18), config.stripeMat, [0, yOffset, 0], [Math.PI / 2, 0, 0]);
      });
    }
    // Головка рукава закрывает стык с корпусом и формирует круглое плечо.
    const capRadius = sections[sections.length - 1].rx;
    const cap = add(pivot, sphere(capRadius * 1.04, 18), mat, [0, 0.002, 0], null, [1, 0.84, 1]);
    cap.castShadow = true;
    cap.userData.slot = 'top';
    return { arm: sleeve, cuff, pivot, cap, cuffZ: cuffRadius * 0.74 };
  }

  // Анатомия тела — единый источник правды для манекена, одежды, волос и аксессуаров.
  // Высоты скелета не меняются: от них зависят крой одежды, посадка обуви и объём причёсок.
  const BODY = {
    head: { cy: 1.735, rx: 0.11, rz: 0.106, chin: 1.628, earY: 1.706, earX: 0.104 },
    neck: { base: 1.5, top: 1.646, rx: 0.046 },
    shoulder: { x: 0.212, y: 1.432 },
    wrist: 0.6,
    legTop: 0.94,
    legBottom: 0.08,
    footX: 0.082
  };

  // Телосложение: разные пропорции по зонам, а не равномерный масштаб по X.
  const BODY_SHAPES = {
    slim: { shoulder: 0.95, chest: 0.94, waist: 0.9, hip: 0.93, depth: 0.95, arm: 0.9, leg: 0.9, neck: 0.94 },
    average: { shoulder: 1, chest: 1, waist: 1, hip: 1, depth: 1, arm: 1, leg: 1, neck: 1 },
    strong: { shoulder: 1.1, chest: 1.08, waist: 1.08, hip: 1.07, depth: 1.06, arm: 1.12, leg: 1.1, neck: 1.08 }
  };

  function bodyShape() {
    return BODY_SHAPES[state.body] || BODY_SHAPES.average;
  }

  const TORSO_BASE = [
    { y: 0.86, rx: 0.15, rz: 0.103, cx: 0, cz: 0, zone: 'hip', power: 2.35 },
    { y: 0.92, rx: 0.162, rz: 0.11, cx: 0, cz: 0, zone: 'hip', power: 2.35 },
    { y: 0.985, rx: 0.156, rz: 0.106, cx: 0, cz: 0, zone: 'hip', power: 2.3 },
    { y: 1.04, rx: 0.144, rz: 0.098, cx: 0, cz: 0, zone: 'waist', power: 2.25 },
    { y: 1.1, rx: 0.135, rz: 0.093, cx: 0, cz: 0, zone: 'waist', power: 2.25 },
    { y: 1.165, rx: 0.14, rz: 0.096, cx: 0, cz: 0, zone: 'waist', power: 2.25 },
    { y: 1.235, rx: 0.152, rz: 0.102, cx: 0, cz: 0, zone: 'chest', power: 2.3 },
    { y: 1.305, rx: 0.163, rz: 0.107, cx: 0, cz: 0, zone: 'chest', power: 2.35 },
    { y: 1.365, rx: 0.173, rz: 0.107, cx: 0, cz: 0, zone: 'chest', power: 2.45 },
    { y: 1.418, rx: 0.191, rz: 0.101, cx: 0, cz: 0, zone: 'shoulder', power: 2.6 },
    { y: 1.452, rx: 0.188, rz: 0.097, cx: 0, cz: 0, zone: 'shoulder', power: 2.5 },
    { y: 1.48, rx: 0.158, rz: 0.088, cx: 0, cz: 0, zone: 'shoulder', power: 2.35 },
    { y: 1.508, rx: 0.108, rz: 0.077, cx: 0, cz: 0, zone: 'neck', power: 2.2 },
    { y: 1.538, rx: 0.07, rz: 0.063, cx: 0, cz: 0, zone: 'neck', power: 2.15 },
    { y: 1.565, rx: 0.056, rz: 0.054, cx: 0, cz: 0, zone: 'neck', power: 2.1 }
  ];

  const ARM_BASE = [
    { y: -0.6, rx: 0.03, rz: 0.031, cx: 0, cz: 0, power: 2.1 },
    { y: -0.55, rx: 0.033, rz: 0.034, cx: 0, cz: 0, power: 2.1 },
    { y: -0.47, rx: 0.041, rz: 0.042, cx: 0, cz: 0, power: 2.15 },
    { y: -0.38, rx: 0.047, rz: 0.047, cx: 0, cz: 0, power: 2.2 },
    { y: -0.32, rx: 0.043, rz: 0.044, cx: 0, cz: 0, power: 2.2 },
    { y: -0.26, rx: 0.048, rz: 0.048, cx: 0, cz: 0, power: 2.2 },
    { y: -0.16, rx: 0.055, rz: 0.054, cx: 0, cz: 0, power: 2.2 },
    { y: -0.07, rx: 0.058, rz: 0.056, cx: 0, cz: 0, power: 2.25 },
    { y: -0.01, rx: 0.066, rz: 0.064, cx: 0, cz: 0, power: 2.3 },
    { y: 0.005, rx: 0.068, rz: 0.066, cx: 0, cz: 0, power: 2.3 }
  ];

  let torsoCache = { type: '', sections: TORSO_BASE };
  let armCache = { type: '', sections: ARM_BASE };

  function torsoSections() {
    const type = state.body;
    if (torsoCache.type === type) return torsoCache.sections;
    const shape = bodyShape();
    const sections = TORSO_BASE.map((section) => {
      const width = section.zone === 'hip' ? shape.hip
        : section.zone === 'waist' ? shape.waist
          : section.zone === 'chest' ? shape.chest
            : section.zone === 'shoulder' ? shape.shoulder
              : shape.neck;
      const depth = section.zone === 'neck' ? shape.neck : shape.depth;
      return { ...section, rx: section.rx * width, rz: section.rz * depth };
    });
    torsoCache = { type, sections };
    return sections;
  }

  function armSections() {
    const type = state.body;
    if (armCache.type === type) return armCache.sections;
    const shape = bodyShape();
    const sections = ARM_BASE.map((section) => ({ ...section, rx: section.rx * shape.arm, rz: section.rz * shape.arm }));
    armCache = { type, sections };
    return sections;
  }

  function legProfile() {
    const scale = bodyShape().leg;
    return [[0, 0.076], [0.16, 0.073], [0.36, 0.065], [0.48, 0.058], [0.56, 0.062], [0.72, 0.052], [0.86, 0.042], [1, 0.036]]
      .map(([t, radius]) => [t, radius * scale]);
  }

  function legCenter() {
    const scale = bodyShape().leg;
    return [[0, 0.086], [0.5, 0.081], [1, 0.077]].map(([t, value]) => [t, value * (0.5 + 0.5 * scale)]);
  }

  function legDepth() {
    return [[0, 1.03], [0.4, 1.08], [0.62, 1], [1, 0.94]];
  }

  function catmullScalar(a, b, c, d, t) {
    const t2 = t * t;
    const t3 = t2 * t;
    return 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
  }

  function sampleSections(sections, y, key, fallback) {
    if (!sections.length) return fallback;
    if (y <= sections[0].y) return sections[0][key];
    if (y >= sections[sections.length - 1].y) return sections[sections.length - 1][key];
    let index = 1;
    while (index < sections.length && sections[index].y < y) index += 1;
    const p1 = sections[index - 1];
    const p2 = sections[index];
    const p0 = sections[index - 2] || p1;
    const p3 = sections[index + 1] || p2;
    const t = (y - p1.y) / Math.max(0.0001, p2.y - p1.y);
    return catmullScalar(p0[key], p1[key], p2[key], p3[key], t);
  }

  function bodySectionAt(y) {
    const sections = torsoSections();
    return {
      rx: sampleSections(sections, y, 'rx', 0.16),
      rz: sampleSections(sections, y, 'rz', 0.106),
      cx: sampleSections(sections, y, 'cx', 0),
      cz: sampleSections(sections, y, 'cz', 0),
      power: sampleSections(sections, y, 'power', 2.35)
    };
  }

  function loft(sections, options) {
    const config = options || {};
    const rings = Math.max(8, config.rings || 48);
    const segments = Math.max(12, config.segments || 40);
    const yStart = sections[0].y;
    const yEnd = sections[sections.length - 1].y;
    const positions = [];
    const uvs = [];
    const indices = [];
    for (let ring = 0; ring <= rings; ring += 1) {
      const v = ring / rings;
      const y = yStart + (yEnd - yStart) * v;
      const rx = sampleSections(sections, y, 'rx', 0.1);
      const rz = sampleSections(sections, y, 'rz', 0.1);
      const cx = sampleSections(sections, y, 'cx', 0);
      const cz = sampleSections(sections, y, 'cz', 0);
      const power = Math.max(2, sampleSections(sections, y, 'power', config.power || 2.3));
      for (let segment = 0; segment < segments; segment += 1) {
        const angle = (segment / segments) * Math.PI * 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const ex = Math.sign(cos) * Math.pow(Math.abs(cos), 2 / power);
        const ez = Math.sign(sin) * Math.pow(Math.abs(sin), 2 / power);
        positions.push(cx + ex * rx, y, cz + ez * rz);
        uvs.push(segment / segments, 1 - v);
      }
    }
    for (let ring = 0; ring < rings; ring += 1) {
      for (let segment = 0; segment < segments; segment += 1) {
        const next = (segment + 1) % segments;
        const a = ring * segments + segment;
        const b = ring * segments + next;
        const c = (ring + 1) * segments + segment;
        const d = (ring + 1) * segments + next;
        indices.push(a, c, b, b, c, d);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    return geometry;
  }

  // Кисть: ладонь, четыре пальца, большой палец. Пальцы сгруппированы вдоль бедра,
  // ладонь развёрнута к телу — поза витринного манекена, а не лапки.
  const HAND_FINGERS = [
    { x: -0.0168, len: 0.039, r: 0.0072 },
    { x: -0.0056, len: 0.045, r: 0.0075 },
    { x: 0.0058, len: 0.041, r: 0.007 },
    { x: 0.0168, len: 0.031, r: 0.0062 }
  ];

  function addHand(parent, side, skin, skinDark) {
    const hand = new THREE.Group();
    hand.position.set(0, -BODY.wrist + 0.002, 0.012);
    hand.rotation.y = -side * 1.42;
    parent.add(hand);

    const palmSections = [
      { y: 0.014, rx: 0.019, rz: 0.012, cx: 0, cz: 0, power: 2.5 },
      { y: -0.008, rx: 0.023, rz: 0.014, cx: 0, cz: 0.001, power: 2.7 },
      { y: -0.032, rx: 0.026, rz: 0.013, cx: 0, cz: 0.003, power: 3 },
      { y: -0.052, rx: 0.024, rz: 0.01, cx: 0, cz: 0.004, power: 3 }
    ];
    const palm = new THREE.Mesh(loft(palmSections, { rings: 12, segments: 16, power: 2.8 }), skin);
    palm.castShadow = false;
    palm.receiveShadow = true;
    palm.userData.slot = 'accessory';
    hand.add(palm);
    pickables.push(palm);

    const fingers = new THREE.Group();
    fingers.position.set(0, -0.046, 0.004);
    fingers.rotation.x = -0.3;
    hand.add(fingers);
    HAND_FINGERS.forEach((spec) => {
      const finger = add(fingers, cylinder(spec.r, spec.r * 0.82, spec.len, 8), skin, [spec.x, -spec.len / 2, 0]);
      finger.castShadow = false;
      finger.userData.slot = 'accessory';
      pickables.push(finger);
      const tip = add(fingers, sphere(spec.r * 0.88, 8), skin, [spec.x, -spec.len - spec.r * 0.25, 0]);
      tip.castShadow = false;
      tip.userData.slot = 'accessory';
      pickables.push(tip);
    });

    const thumb = new THREE.Group();
    thumb.position.set(side * 0.021, -0.012, 0.002);
    thumb.rotation.z = side * 0.72;
    thumb.rotation.x = -0.38;
    hand.add(thumb);
    const thumbMesh = add(thumb, cylinder(0.0078, 0.0062, 0.034, 8), skin, [0, -0.017, 0]);
    thumbMesh.castShadow = false;
    thumbMesh.userData.slot = 'accessory';
    pickables.push(thumbMesh);
    const thumbTip = add(thumb, sphere(0.0058, 8), skinDark, [0, -0.035, 0]);
    thumbTip.castShadow = false;
    thumbTip.userData.slot = 'accessory';
    pickables.push(thumbTip);
    return hand;
  }

  // Голова: гладкий манекен без лица — по требованию дизайна «осознанно абстрактный манекен».
  const HEAD_SECTIONS = [
    { y: 1.626, rx: 0.026, rz: 0.03, cx: 0, cz: 0.01, power: 2.2 },
    { y: 1.638, rx: 0.038, rz: 0.043, cx: 0, cz: 0.009, power: 2.2 },
    { y: 1.652, rx: 0.052, rz: 0.058, cx: 0, cz: 0.008, power: 2.25 },
    { y: 1.666, rx: 0.064, rz: 0.07, cx: 0, cz: 0.007, power: 2.25 },
    { y: 1.68, rx: 0.075, rz: 0.08, cx: 0, cz: 0.005, power: 2.3 },
    { y: 1.694, rx: 0.085, rz: 0.089, cx: 0, cz: 0.004, power: 2.3 },
    { y: 1.708, rx: 0.094, rz: 0.096, cx: 0, cz: 0.002, power: 2.35 },
    { y: 1.722, rx: 0.102, rz: 0.102, cx: 0, cz: 0.001, power: 2.35 },
    { y: 1.736, rx: 0.107, rz: 0.106, cx: 0, cz: 0, power: 2.4 },
    { y: 1.752, rx: 0.11, rz: 0.106, cx: 0, cz: -0.001, power: 2.4 },
    { y: 1.77, rx: 0.11, rz: 0.104, cx: 0, cz: -0.002, power: 2.4 },
    { y: 1.79, rx: 0.107, rz: 0.1, cx: 0, cz: -0.003, power: 2.4 },
    { y: 1.81, rx: 0.1, rz: 0.093, cx: 0, cz: -0.004, power: 2.35 },
    { y: 1.83, rx: 0.089, rz: 0.083, cx: 0, cz: -0.005, power: 2.35 },
    { y: 1.848, rx: 0.074, rz: 0.069, cx: 0, cz: -0.006, power: 2.3 },
    { y: 1.862, rx: 0.056, rz: 0.052, cx: 0, cz: -0.007, power: 2.25 },
    { y: 1.873, rx: 0.036, rz: 0.034, cx: 0, cz: -0.007, power: 2.2 },
    { y: 1.879, rx: 0.014, rz: 0.013, cx: 0, cz: -0.007, power: 2.2 }
  ];

  function addHead(headGroup, skin, skinDark) {
    const head = new THREE.Mesh(loft(HEAD_SECTIONS, { rings: 40, segments: 30, power: 2.35 }), skin);
    head.castShadow = true;
    head.receiveShadow = true;
    head.userData.slot = 'hair';
    headGroup.add(head);
    pickables.push(head);
    [-1, 1].forEach((side) => {
      const ear = add(headGroup, sphere(0.028, 12), skin, [side * BODY.head.earX, BODY.head.earY, 0], null, [0.5, 1.05, 0.72]);
      ear.userData.slot = 'hair';
      pickables.push(ear);
      const earInner = add(headGroup, sphere(0.015, 8), skinDark, [side * (BODY.head.earX + 0.003), BODY.head.earY, 0.016], null, [0.4, 0.72, 0.3]);
      earInner.userData.slot = 'hair';
      pickables.push(earInner);
    });
    return head;
  }

  function addBody() {
    const skin = skinMaterial(SKIN_TONES[state.skin] || SKIN_TONES[0], 0.66);
    const skinDark = skinMaterial(new THREE.Color(SKIN_TONES[state.skin] || SKIN_TONES[0]).multiplyScalar(0.86), 0.72);
    const body = new THREE.Group();
    root.add(body);
    const headGroup = new THREE.Group();
    root.add(headGroup);

    [-1, 1].forEach((side) => {
      const leg = profileLegMesh(
        side, BODY.legTop, BODY.legBottom,
        legProfile(),
        legCenter(),
        legDepth(),
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
      const ankle = add(body, sphere(0.037, 12), skinDark, [side * 0.079, 0.085, 0.004]);
      ankle.userData.slot = 'shoes';
      pickables.push(ankle);

      const arm = armPivot(body, side);
      const armLoft = new THREE.Mesh(loft(armSections(), { rings: 32, segments: 22, power: 2.2 }), skin);
      armLoft.castShadow = false;
      armLoft.receiveShadow = true;
      armLoft.userData.slot = 'top';
      arm.add(armLoft);
      pickables.push(armLoft);
      addHand(arm, side, skin, skinDark);
    });

    const torso = new THREE.Mesh(loft(torsoSections(), { rings: 60, segments: 44 }), skin);
    torso.castShadow = true;
    torso.receiveShadow = true;
    torso.userData.slot = 'top';
    body.add(torso);
    pickables.push(torso);

    const neckScale = bodyShape().neck;
    const neckSections = [
      { y: 1.512, rx: 0.062, rz: 0.058, cx: 0, cz: 0.002, power: 2.2 },
      { y: 1.552, rx: 0.05, rz: 0.049, cx: 0, cz: 0.004, power: 2.15 },
      { y: 1.6, rx: 0.046, rz: 0.045, cx: 0, cz: 0.006, power: 2.1 },
      { y: 1.646, rx: 0.045, rz: 0.044, cx: 0, cz: 0.006, power: 2.1 }
    ].map((section) => ({ ...section, rx: section.rx * neckScale, rz: section.rz * neckScale }));
    const neck = new THREE.Mesh(loft(neckSections, { rings: 18, segments: 24, power: 2.15 }), skin);
    neck.castShadow = true;
    neck.receiveShadow = true;
    neck.userData.slot = 'hair';
    headGroup.add(neck);
    pickables.push(neck);

    const trapScale = bodyShape().shoulder;
    [-1, 1].forEach((side) => {
      const trap = add(headGroup, sphere(0.058, 14), skin, [side * 0.062 * trapScale, 1.498, -0.006], null, [1.25 * trapScale, 0.42, 0.9]);
      trap.userData.slot = 'top';
      pickables.push(trap);
    });

    addHead(headGroup, skin, skinDark);

    if (state.equipped.hair === null) {
      add(headGroup, sphere(0.113, 20), skin, [0, 1.752, -0.004], null, [1.02, 1.08, 0.99]).userData.slot = 'hair';
    }
    return body;
  }

  function addBaseTop(slotGroup) {
    const cream = cloth('#eee4d5', { roughness: 0.86 });
    const shade = cloth('#d7c9b6', { roughness: 0.9 });
    const hem = bodySectionAt(0.98);
    const sections = [0.98, 1.06, 1.16, 1.26, 1.34, 1.41, 1.46].map((y) => {
      const section = bodySectionAt(y);
      return { y, rx: section.rx + 0.012, rz: section.rz + 0.012, cx: section.cx, cz: section.cz, power: section.power };
    });
    const shell = new THREE.Mesh(loft(sections, { rings: 24, segments: 32 }), cream);
    shell.castShadow = true;
    shell.receiveShadow = true;
    shell.userData.slot = 'top';
    slotGroup.add(shell);
    [-1, 1].forEach((side) => {
      add(slotGroup, cylinder(0.068, 0.06, 0.15, 14), cream, [side * (BODY.shoulder.x - 0.006), 1.36, 0], null, [1, 1, 0.95]);
    });
    add(slotGroup, torus(hem.rx + 0.012, 0.008, 26), shade, [0, 0.985, 0], [Math.PI / 2, 0, 0], [1, 1, hem.rz / hem.rx]);
    tagGroup(slotGroup, 'top');
  }

  function addBaseBottom(slotGroup) {
    const cream = cloth('#eee4d5', { roughness: 0.86 });
    const shade = cloth('#d7c9b6', { roughness: 0.9 });
    const hip = bodySectionAt(0.94);
    const radius = hip.rx + 0.01;
    add(slotGroup, cylinder(radius, radius * 0.98, 0.22, 22), cream, [0, 0.87, 0], null, [1, 1, hip.rz / hip.rx]);
    [-1, 1].forEach((side) => {
      add(slotGroup, cylinder(0.072, 0.068, 0.18, 14), cream, [side * 0.083, 0.71, 0], null, [1, 1, 0.95]);
    });
    add(slotGroup, cylinder(radius + 0.004, radius + 0.004, 0.028, 22), shade, [0, 0.965, 0], null, [1, 1, hip.rz / hip.rx]);
    tagGroup(slotGroup, 'bottom');
  }

  function addBareFeet(slotGroup) {
    const skin = skinMaterial(SKIN_TONES[state.skin] || SKIN_TONES[0], 0.72);
    // Стопа: пятка, свод, подушечка и пальцы — одной лофт-поверхностью.
    const sections = [
      { z: -0.078, w: 0.034, cy: 0.048, h: 0.044, power: 2.6 },
      { z: -0.042, w: 0.037, cy: 0.042, h: 0.038, power: 2.5 },
      { z: 0.0, w: 0.034, cy: 0.03, h: 0.028, power: 2.4 },
      { z: 0.04, w: 0.037, cy: 0.028, h: 0.026, power: 2.4 },
      { z: 0.08, w: 0.04, cy: 0.026, h: 0.024, power: 2.3 },
      { z: 0.115, w: 0.039, cy: 0.024, h: 0.021, power: 2.3 },
      { z: 0.145, w: 0.032, cy: 0.021, h: 0.016, power: 2.2 },
      { z: 0.163, w: 0.016, cy: 0.019, h: 0.009, power: 2.1 }
    ];
    [-1, 1].forEach((side) => {
      const foot = new THREE.Mesh(loftZ(sections, { rings: 18, segments: 20 }), skin);
      foot.position.set(side * BODY.footX, 0, 0);
      foot.castShadow = true;
      foot.receiveShadow = true;
      slotGroup.add(foot);
    });
    tagGroup(slotGroup, 'shoes');
  }

  function edgeCurve(points) {
    return points.map(([y, v]) => ({ y, v }));
  }

  const TOP_EDGE_TANK = {
    front: edgeCurve([[0, 1.33], [14, 1.35], [26, 1.392], [38, 1.44], [48, 1.452], [58, 1.448], [70, 1.43], [80, 1.41], [90, 1.398]]),
    back: edgeCurve([[0, 1.328], [10, 1.35], [22, 1.402], [36, 1.446], [52, 1.456], [68, 1.452], [82, 1.444], [90, 1.438]])
  };
  const TOP_EDGE_VEST = {
    front: edgeCurve([[0, 1.312], [16, 1.332], [28, 1.394], [40, 1.444], [52, 1.456], [64, 1.44], [78, 1.396], [90, 1.342]]),
    back: edgeCurve([[0, 1.312], [12, 1.343], [26, 1.398], [42, 1.442], [58, 1.45], [74, 1.44], [90, 1.428]])
  };
  const TOP_EDGE_SLEEVED = {
    front: edgeCurve([[0, 1.552], [20, 1.55], [40, 1.547], [60, 1.54], [80, 1.527], [90, 1.521]]),
    back: edgeCurve([[0, 1.552], [24, 1.552], [50, 1.55], [72, 1.546], [90, 1.542]])
  };

  function topEdgeAt(angle, curves) {
    const quadrant = Math.acos(Math.min(1, Math.abs(Math.cos(angle)))) * 180 / Math.PI;
    const curve = Math.sin(angle) >= 0 ? curves.front : curves.back;
    return sampleSections(curve, quadrant, 'v', 1.45);
  }

  function topShellGeometry(bottomY, shellAt, curves, rings, segments) {
    const positions = [];
    const uvs = [];
    const indices = [];
    const rim = [];
    for (let ring = 0; ring <= rings; ring += 1) {
      const v = ring / rings;
      for (let segment = 0; segment < segments; segment += 1) {
        const angle = (segment / segments) * Math.PI * 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const top = topEdgeAt(angle, curves);
        const y = bottomY + (top - bottomY) * v;
        const section = shellAt(y);
        const ex = Math.sign(cos) * Math.pow(Math.abs(cos), 2 / section.power);
        const ez = Math.sign(sin) * Math.pow(Math.abs(sin), 2 / section.power);
        const x = (section.cx || 0) + ex * section.rx;
        const z = (section.cz || 0) + ez * section.rz;
        positions.push(x, y, z);
        uvs.push(segment / segments, 1 - v);
        if (ring === rings) rim.push(new THREE.Vector3(x, y, z));
      }
    }
    for (let ring = 0; ring < rings; ring += 1) {
      for (let segment = 0; segment < segments; segment += 1) {
        const next = (segment + 1) % segments;
        const a = ring * segments + segment;
        const b = ring * segments + next;
        const c = (ring + 1) * segments + segment;
        const d = (ring + 1) * segments + next;
        indices.push(a, c, b, b, c, d);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    return { geometry, rim };
  }

  function rimPointAt(degrees, shellAt, curves) {
    const angle = (degrees * Math.PI) / 180;
    const y = topEdgeAt(angle, curves);
    const section = shellAt(y);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const ex = Math.sign(cos) * Math.pow(Math.abs(cos), 2 / section.power);
    const ez = Math.sign(sin) * Math.pow(Math.abs(sin), 2 / section.power);
    return [ex * section.rx, y, ez * section.rz];
  }

  function edgeTube(points, tubeRadius, mat) {
    const curve = new THREE.CatmullRomCurve3(points.map((point) => point.clone()), true);
    const geometry = new THREE.TubeGeometry(curve, Math.max(64, points.length * 2), tubeRadius, 5, true);
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  function ribbonSweep(points, width, thickness, mat, widthAxis) {
    const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(point[0], point[1], point[2])));
    const steps = 24;
    const positions = [];
    const indices = [];
    const center = new THREE.Vector3();
    const tangent = new THREE.Vector3();
    const widthDir = new THREE.Vector3(widthAxis[0], widthAxis[1], widthAxis[2]).normalize();
    const normal = new THREE.Vector3();
    const halfWidth = width / 2;
    const halfThickness = thickness / 2;
    for (let step = 0; step <= steps; step += 1) {
      const t = step / steps;
      curve.getPointAt(t, center);
      curve.getTangentAt(t, tangent);
      normal.crossVectors(widthDir, tangent).normalize();
      const corners = [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1]
      ];
      corners.forEach(([w, n]) => {
        positions.push(
          center.x + widthDir.x * w * halfWidth + normal.x * n * halfThickness,
          center.y + widthDir.y * w * halfWidth + normal.y * n * halfThickness,
          center.z + widthDir.z * w * halfWidth + normal.z * n * halfThickness
        );
      });
    }
    for (let step = 0; step < steps; step += 1) {
      const base = step * 4;
      const next = base + 4;
      for (let side = 0; side < 4; side += 1) {
        const a = base + side;
        const b = base + ((side + 1) % 4);
        const c = next + side;
        const d = next + ((side + 1) % 4);
        indices.push(a, c, b, b, c, d);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
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
    const sleeveless = variant === 'tank' || variant === 'vest';
    const baseEase = fit === 'slim' ? 0.004 : fit === 'tailored' ? 0.008 : fit === 'oversize' ? (sleeveless ? 0.026 : 0.042) : fit === 'boxy' ? 0.03 : 0.016;
    const thickness = variant === 'bomber' ? 0.007 : variant === 'shirt' ? 0.009 : sleeveless ? 0.005 : fit === 'oversize' ? 0.008 : 0.006;
    const shellAt = (y) => {
      const section = bodySectionAt(y);
      const neckT = sleeveless ? 0 : Math.min(1, Math.max(0, (y - 1.46) / 0.065));
      const localEase = baseEase + (0.008 - baseEase) * neckT;
      return { rx: section.rx + localEase + thickness, rz: section.rz + localEase + thickness, cx: section.cx, cz: section.cz, power: section.power };
    };
    const frontAt = (y) => shellAt(y).rz + 0.004;
    const curves = variant === 'tank' ? TOP_EDGE_TANK : variant === 'vest' ? TOP_EDGE_VEST : TOP_EDGE_SLEEVED;
    const shell = topShellGeometry(bodyBottom, shellAt, curves, 26, 48);
    const shellMesh = new THREE.Mesh(shell.geometry, main);
    shellMesh.castShadow = true;
    shellMesh.receiveShadow = true;
    shellMesh.userData.slot = 'top';
    slotGroup.add(shellMesh);
    const binding = edgeTube(shell.rim, sleeveless ? 0.0065 : 0.005, trim);
    binding.userData.slot = 'top';
    slotGroup.add(binding);
    const radius = shellAt((bodyTop + bodyBottom) / 2).rx;

    if (sleeveless) {
      const strapMaterial = main.clone();
      strapMaterial.side = THREE.DoubleSide;
      const strapWidth = variant === 'vest' ? 0.06 : 0.048;
      const strapPeak = variant === 'vest' ? 1.538 : 1.527;
      [-1, 1].forEach((side) => {
        const front = rimPointAt(side > 0 ? 54 : 126, shellAt, curves);
        const back = rimPointAt(side > 0 ? 306 : 234, shellAt, curves);
        const path = [
          [front[0] * 0.94, front[1] - 0.01, front[2] * 0.94],
          [front[0] * 0.92, 1.462, front[2] * 0.86],
          [side * 0.132, 1.492, front[2] * 0.5],
          [side * 0.122, strapPeak - 0.012, front[2] * 0.2],
          [side * 0.12, strapPeak, 0.012],
          [side * 0.12, strapPeak, -0.03],
          [side * 0.122, strapPeak - 0.014, back[2] * 0.2],
          [side * 0.132, 1.49, back[2] * 0.5],
          [back[0] * 0.92, 1.46, back[2] * 0.86],
          [back[0] * 0.94, back[1] - 0.01, back[2] * 0.94]
        ];
        const strapTilt = variant === 'vest' ? 0.52 : 0.45;
        const widthAxis = [side * Math.cos(strapTilt), -Math.sin(strapTilt), 0];
        const band = ribbonSweep(path, strapWidth, 0.012, strapMaterial, widthAxis);
        band.userData.slot = 'top';
        slotGroup.add(band);
      });
    }

    const waistFold = tube([[0.055, bodyBottom + 0.09, frontAt(bodyBottom + 0.09)], [0.02, bodyBottom + 0.055, frontAt(bodyBottom + 0.055) + 0.006], [-0.015, bodyBottom + 0.03, frontAt(bodyBottom + 0.03)]], 0.0025, crease);
    waistFold.userData.slot = 'top';
    slotGroup.add(waistFold);

    if (variant === 'tee' || variant === 'tank') {
      if (variant === 'tee') {
        [-1, 1].forEach((side) => {
          makeSleeve(slotGroup, side, main, trim, { ease: oversize ? 0.015 : slim ? 0.002 : 0.007, length: 0.17 });
        });
      }
      add(slotGroup, torus(shellAt(bodyBottom).rx * 0.99, 0.0075, 28), trim, [0, bodyBottom, 0], [Math.PI / 2, 0, 0], [1, 1, shellAt(bodyBottom).rz / shellAt(bodyBottom).rx]);
      add(slotGroup, box(0.05, 0.014, 0.01), cream, [-0.02, bodyBottom + 0.01, frontAt(bodyBottom + 0.01)]);
    } else if (variant === 'longsleeve' || variant === 'shirt') {
      [-1, 1].forEach((side) => {
        const sleeve = makeSleeve(slotGroup, side, main, trim, { ease: oversize ? 0.014 : slim ? 0.002 : 0.005, length: 0.58 });
        if (variant === 'shirt') {
          [0, 1].forEach((index) => add(sleeve.pivot, sphere(0.008, 8), metal, [0.01, -0.55 - index * 0.024, sleeve.cuffZ]));
        }
      });
      add(slotGroup, torus(shellAt(bodyBottom).rx * 0.99, 0.0075, 28), trim, [0, bodyBottom, 0], [Math.PI / 2, 0, 0], [1, 1, shellAt(bodyBottom).rz / shellAt(bodyBottom).rx]);
      add(slotGroup, box(0.05, 0.014, 0.01), cream, [-0.02, bodyBottom + 0.01, frontAt(bodyBottom + 0.01)]);
      if (variant === 'longsleeve' && item.turtleneck) {
        const neckSections = [
          { y: 1.5, rx: 0.094, rz: 0.086, cx: 0, cz: 0, power: 2.2 },
          { y: 1.535, rx: 0.082, rz: 0.074, cx: 0, cz: 0, power: 2.15 },
          { y: 1.57, rx: 0.068, rz: 0.062, cx: 0, cz: 0, power: 2.1 },
          { y: 1.6, rx: 0.06, rz: 0.056, cx: 0, cz: 0, power: 2.05 }
        ];
        const neckMesh = new THREE.Mesh(loft(neckSections, { rings: 16, segments: 26 }), main);
        neckMesh.castShadow = true;
        neckMesh.receiveShadow = true;
        neckMesh.userData.slot = 'top';
        slotGroup.add(neckMesh);
        add(slotGroup, torus(0.061, 0.0045, 22), trim, [0, 1.602, 0], [Math.PI / 2, 0, 0], [1, 1, 0.93]);
      }
    } else if (variant === 'bomber') {
      [-1, 1].forEach((side) => {
        const sleeve = makeSleeve(slotGroup, side, main, trim, { ease: 0.016, length: 0.57 });
        add(sleeve.pivot, torus(0.072, 0.011, 22), trim, [0, -0.6, 0], [Math.PI / 2, 0, 0]);
      });
      add(slotGroup, torus(shellAt(bodyBottom).rx * 0.96, 0.015, 28), trim, [0, bodyBottom, 0], [Math.PI / 2, 0, 0], [1, 1, shellAt(bodyBottom).rz / shellAt(bodyBottom).rx]);
      const collarSections = [
        { y: 1.54, rx: 0.084, rz: 0.076, cx: 0, cz: 0, power: 2.15 },
        { y: 1.575, rx: 0.075, rz: 0.068, cx: 0, cz: 0, power: 2.1 },
        { y: 1.605, rx: 0.068, rz: 0.062, cx: 0, cz: 0, power: 2.05 }
      ];
      const collar = new THREE.Mesh(loft(collarSections, { rings: 10, segments: 26 }), trim);
      collar.castShadow = true;
      collar.receiveShadow = true;
      collar.userData.slot = 'top';
      slotGroup.add(collar);
      add(slotGroup, torus(0.069, 0.007, 24), trim, [0, 1.607, 0], [Math.PI / 2, 0, 0], [1, 1, 0.92]);
      add(slotGroup, box(0.016, 0.38, 0.012), metal, [0, 1.24, frontAt(1.24)]);
      add(slotGroup, sphere(0.012, 8), metal, [0, 1.438, frontAt(1.438) + 0.006]);
      add(slotGroup, box(0.085, 0.048, 0.012), accent, [-0.125, 1.33, frontAt(1.33)]);
      add(slotGroup, box(0.045, 0.032, 0.012), cream, [0.13, 1.33, frontAt(1.33)]);
      add(slotGroup, box(0.07, 0.018, 0.01), hi, [0.13, 1.29, frontAt(1.29)]);
      if (item.puffer) {
        [1.06, 1.18, 1.3, 1.42].forEach((y) => add(slotGroup, torus(shellAt(y).rx * 0.97, 0.006, 26), trim, [0, y, 0], [Math.PI / 2, 0, 0], [1, 1, shellAt(y).rz / shellAt(y).rx]));
      }
    } else if (variant === 'vest') {
      add(slotGroup, box(0.028, 0.38, 0.012), trim, [0, 1.18, frontAt(1.18)]);
      [1.3, 1.21, 1.12, 1.03].forEach((y) => add(slotGroup, sphere(0.01, 8), metal, [0, y, frontAt(y) + 0.008]));
      add(slotGroup, box(0.08, 0.014, 0.012), dark, [-0.1, 0.995, frontAt(0.995)]);
      add(slotGroup, box(0.08, 0.014, 0.012), dark, [0.1, 0.995, frontAt(0.995)]);
      add(slotGroup, torus(shellAt(bodyBottom).rx * 0.99, 0.0075, 28), trim, [0, bodyBottom, 0], [Math.PI / 2, 0, 0], [1, 1, shellAt(bodyBottom).rz / shellAt(bodyBottom).rx]);
      add(slotGroup, box(0.05, 0.014, 0.01), cream, [0.02, bodyBottom + 0.01, frontAt(bodyBottom + 0.01)]);
    }

    if (variant === 'shirt') {
      const collarBand = [
        { y: 1.53, rx: 0.086, rz: 0.078, cx: 0, cz: 0, power: 2.1 },
        { y: 1.565, rx: 0.076, rz: 0.069, cx: 0, cz: 0, power: 2.1 },
        { y: 1.592, rx: 0.069, rz: 0.063, cx: 0, cz: 0, power: 2.05 }
      ];
      const collarStand = new THREE.Mesh(loft(collarBand, { rings: 10, segments: 26 }), cream);
      collarStand.castShadow = true;
      collarStand.receiveShadow = true;
      collarStand.userData.slot = 'top';
      slotGroup.add(collarStand);
      [-1, 1].forEach((side) => {
        add(slotGroup, box(0.082, 0.052, 0.006), cream, [side * 0.048, 1.5, frontAt(1.5) + 0.002], [-0.42, 0, side * 0.56]);
        add(slotGroup, box(0.074, 0.008, 0.004), trim, [side * 0.05, 1.475, frontAt(1.475) + 0.004], [-0.42, 0, side * 0.56]);
      });
      add(slotGroup, box(0.036, 0.4, 0.012), trim, [0, 1.25, frontAt(1.25)]);
      [1.44, 1.35, 1.26, 1.17, 1.08].forEach((y) => add(slotGroup, sphere(0.009, 8), metal, [0, y, frontAt(y) + 0.006]));
      add(slotGroup, box(0.085, 0.062, 0.012), dark, [-0.115, 1.31, frontAt(1.31)]);
      if (item.cardigan) {
        add(slotGroup, box(0.012, 0.38, 0.012), dark, [0, 1.26, frontAt(1.26) + 0.006]);
        [1.4, 1.3, 1.2, 1.1].forEach((y) => add(slotGroup, sphere(0.009, 8), metal, [0, y, frontAt(y) + 0.012]));
      }
      add(slotGroup, box(0.07, 0.011, 0.012), hi, [-0.115, 1.315, frontAt(1.315) + 0.006]);
      add(slotGroup, box(0.065, 0.011, 0.01), hi, [0.13, 1.11, frontAt(1.11) + 0.006]);
    }

    if (variant === 'tee' || variant === 'longsleeve') {
      if (item.collection === 'street') {
        add(slotGroup, box(0.1, 0.075, 0.012), accent, [0, 1.32, frontAt(1.32)]);
        add(slotGroup, box(0.06, 0.012, 0.014), dark, [0, 1.32, frontAt(1.32) + 0.008]);
        add(slotGroup, box(0.012, 0.06, 0.014), dark, [0, 1.32, frontAt(1.32) + 0.008]);
      } else if (item.collection === 'muse') {
        add(slotGroup, sphere(0.026, 12), accent, [0, 1.32, frontAt(1.32)], null, [1, 0.85, 0.35]);
        add(slotGroup, sphere(0.026, 12), accent, [-0.018, 1.305, frontAt(1.305)], null, [1, 0.85, 0.35]);
        add(slotGroup, cone(0.02, 0.035, 10), accent, [0, 1.285, frontAt(1.285)], [0, 0, Math.PI]);
      } else {
        add(slotGroup, box(0.085, 0.055, 0.01), accent, [0, 1.32, frontAt(1.32)]);
        add(slotGroup, box(0.055, 0.012, 0.012), hi, [0, 1.32, frontAt(1.32) + 0.006]);
      }
    }
    if (item.brand) {
      addBrandMark(slotGroup, item, [variant === 'shirt' ? 0.105 : 0, 1.315, frontAt(1.315) + 0.004], 1.2, accent);
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

  function sampleZ(sections, z, key, fallback) {
    if (!sections.length) return fallback;
    if (z <= sections[0].z) return sections[0][key];
    if (z >= sections[sections.length - 1].z) return sections[sections.length - 1][key];
    let index = 1;
    while (index < sections.length && sections[index].z < z) index += 1;
    const p1 = sections[index - 1];
    const p2 = sections[index];
    const p0 = sections[index - 2] || p1;
    const p3 = sections[index + 1] || p2;
    const t = (z - p1.z) / Math.max(0.0001, p2.z - p1.z);
    return catmullScalar(p0[key], p1[key], p2[key], p3[key], t);
  }

  function loftZ(sections, options) {
    const config = options || {};
    const rings = Math.max(8, config.rings || 24);
    const segments = Math.max(12, config.segments || 26);
    const zStart = sections[0].z;
    const zEnd = sections[sections.length - 1].z;
    const positions = [];
    const uvs = [];
    const indices = [];
    for (let ring = 0; ring <= rings; ring += 1) {
      const v = ring / rings;
      const z = zStart + (zEnd - zStart) * v;
      const w = sampleZ(sections, z, 'w', 0.05);
      const cy = sampleZ(sections, z, 'cy', 0.06);
      const h = sampleZ(sections, z, 'h', 0.04);
      const power = Math.max(2, sampleZ(sections, z, 'power', 2.4));
      for (let segment = 0; segment < segments; segment += 1) {
        const angle = (segment / segments) * Math.PI * 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const ex = Math.sign(cos) * Math.pow(Math.abs(cos), 2 / power);
        const ey = Math.sign(sin) * Math.pow(Math.abs(sin), 2 / power);
        positions.push(ex * w, cy + ey * h, z);
        uvs.push(segment / segments, 1 - v);
      }
    }
    for (let ring = 0; ring < rings; ring += 1) {
      for (let segment = 0; segment < segments; segment += 1) {
        const next = (segment + 1) % segments;
        const a = ring * segments + segment;
        const b = ring * segments + next;
        const c = (ring + 1) * segments + segment;
        const d = (ring + 1) * segments + next;
        indices.push(a, b, c, b, d, c);
      }
    }
    const centerStart = positions.length / 3;
    positions.push(0, sampleZ(sections, zStart, 'cy', 0.06), zStart);
    uvs.push(0.5, 0);
    for (let segment = 0; segment < segments; segment += 1) {
      const next = (segment + 1) % segments;
      indices.push(centerStart, next, segment);
    }
    const centerEnd = positions.length / 3;
    const lastRing = rings * segments;
    positions.push(0, sampleZ(sections, zEnd, 'cy', 0.06), zEnd);
    uvs.push(0.5, 1);
    for (let segment = 0; segment < segments; segment += 1) {
      const next = (segment + 1) % segments;
      indices.push(centerEnd, lastRing + segment, lastRing + next);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    return geometry;
  }

  const SHOE_SOLE = [
    { z: -0.104, w: 0.056, cy: 0.022, h: 0.022, power: 2.5 },
    { z: -0.07, w: 0.07, cy: 0.022, h: 0.022, power: 2.5 },
    { z: 0.0, w: 0.082, cy: 0.022, h: 0.022, power: 2.55 },
    { z: 0.08, w: 0.082, cy: 0.023, h: 0.022, power: 2.55 },
    { z: 0.16, w: 0.076, cy: 0.027, h: 0.021, power: 2.5 },
    { z: 0.215, w: 0.062, cy: 0.033, h: 0.019, power: 2.45 },
    { z: 0.252, w: 0.033, cy: 0.04, h: 0.014, power: 2.35 }
  ];

  const SHOE_UPPER_LOW = [
    { z: -0.1, w: 0.052, cy: 0.088, h: 0.041, power: 2.3 },
    { z: -0.085, w: 0.063, cy: 0.096, h: 0.05, power: 2.4 },
    { z: -0.05, w: 0.071, cy: 0.102, h: 0.057, power: 2.5 },
    { z: -0.005, w: 0.074, cy: 0.105, h: 0.06, power: 2.55 },
    { z: 0.045, w: 0.075, cy: 0.101, h: 0.055, power: 2.5 },
    { z: 0.1, w: 0.073, cy: 0.092, h: 0.047, power: 2.45 },
    { z: 0.155, w: 0.069, cy: 0.082, h: 0.038, power: 2.4 },
    { z: 0.2, w: 0.06, cy: 0.073, h: 0.03, power: 2.35 },
    { z: 0.23, w: 0.045, cy: 0.068, h: 0.024, power: 2.3 },
    { z: 0.248, w: 0.024, cy: 0.064, h: 0.018, power: 2.2 }
  ];

  const SHOE_UPPER_FLAT = [
    { z: -0.096, w: 0.05, cy: 0.062, h: 0.026, power: 2.3 },
    { z: -0.07, w: 0.062, cy: 0.066, h: 0.032, power: 2.4 },
    { z: -0.02, w: 0.072, cy: 0.068, h: 0.035, power: 2.5 },
    { z: 0.04, w: 0.075, cy: 0.066, h: 0.033, power: 2.5 },
    { z: 0.11, w: 0.073, cy: 0.06, h: 0.028, power: 2.45 },
    { z: 0.17, w: 0.066, cy: 0.054, h: 0.023, power: 2.4 },
    { z: 0.22, w: 0.05, cy: 0.049, h: 0.017, power: 2.3 },
    { z: 0.25, w: 0.026, cy: 0.046, h: 0.012, power: 2.2 }
  ];

  const SHOE_CONFIG = {
    sneaker: { sole: 1.0, lift: 0, drop: 0, lace: true, collar: true, heelTab: true },
    runner: { sole: 1.12, lift: 0.004, drop: 0, lace: true, collar: true, heelTab: true, runner: true },
    boot: { sole: 1.3, lift: 0.012, drop: 0, lace: false, collar: false, heelTab: true, shaft: true },
    derby: { sole: 0.52, lift: 0, drop: 0.012, lace: true, collar: false, heelTab: false, heelBlock: true, toeCap: true },
    platform: { sole: 1.7, lift: 0.042, drop: 0, lace: true, collar: true, heelTab: true, flatSide: true },
    mule: { sole: 0.7, lift: 0, drop: 0.014, lace: false, collar: false, heelTab: false, heelBlock: true, flat: true },
    ballet: { sole: 0.36, lift: 0, drop: 0.02, lace: false, collar: false, heelTab: false, flat: true, bow: true }
  };

  function addShoePair(slotGroup, item, mats, materials) {
    const { main, dark, metal, light } = mats;
    const accent = materials.accent;
    const variant = item.variant || 'sneaker';
    const config = SHOE_CONFIG[variant] || SHOE_CONFIG.sneaker;
    const upperShape = config.flat ? SHOE_UPPER_FLAT : SHOE_UPPER_LOW;
    const upperSections = upperShape.map((section) => ({ ...section, cy: section.cy + config.lift - config.drop }));
    const midSections = SHOE_SOLE.map((section) => ({
      ...section,
      w: section.w + (config.sole > 1.4 ? 0.006 : 0.002),
      cy: config.flatSide ? 0.052 : 0.012 + section.h * config.sole,
      h: config.flatSide ? 0.04 : section.h * config.sole,
      power: config.flatSide ? 4 : section.power
    }));
    const outSections = SHOE_SOLE.map((section) => ({
      ...section,
      w: section.w + 0.006,
      cy: 0.008,
      h: 0.009,
      power: config.flatSide ? 4 : section.power
    }));
    const stripeSections = SHOE_SOLE.map((section) => ({
      ...section,
      w: section.w + (config.flatSide ? 0.007 : 0.005),
      cy: config.flatSide ? 0.086 : Math.max(0.013, 0.012 + section.h * config.sole * 1.7 - 0.006),
      h: 0.0045,
      power: config.flatSide ? 4 : section.power
    }));
    const upperTop = 0.165 + config.lift - config.drop;
    const laceYs = [0.016, 0.044, 0.072, 0.1];
    [-1, 1].forEach((side) => {
      const x = side * 0.087;
      const soleMesh = new THREE.Mesh(loftZ(outSections, { rings: 12, segments: 26 }), dark);
      soleMesh.position.x = x;
      soleMesh.castShadow = true;
      soleMesh.receiveShadow = true;
      slotGroup.add(soleMesh);
      const midMesh = new THREE.Mesh(loftZ(midSections, { rings: 16, segments: 26 }), light);
      midMesh.position.x = x;
      midMesh.castShadow = true;
      midMesh.receiveShadow = true;
      slotGroup.add(midMesh);
      if (!config.flat) {
        const stripeMesh = new THREE.Mesh(loftZ(stripeSections, { rings: 10, segments: 26 }), accent);
        stripeMesh.position.x = x;
        stripeMesh.castShadow = true;
        stripeMesh.receiveShadow = true;
        slotGroup.add(stripeMesh);
      }
      const upperMesh = new THREE.Mesh(loftZ(upperSections, { rings: 26, segments: 28 }), main);
      upperMesh.position.x = x;
      upperMesh.castShadow = true;
      upperMesh.receiveShadow = true;
      slotGroup.add(upperMesh);
      if (config.collar) {
        add(slotGroup, torus(0.05, 0.0075, 24), dark, [x, upperTop - 0.004, -0.006], [Math.PI / 2, 0, 0], [1, 1.32, 1]);
      }
      if (config.shaft) {
        const shaftLift = config.lift;
        const shaft = [
          { y: 0.12 + shaftLift, rx: 0.063, rz: 0.077, cx: 0, cz: -0.004, power: 2.4 },
          { y: 0.18 + shaftLift, rx: 0.061, rz: 0.072, cx: 0, cz: -0.003, power: 2.3 },
          { y: 0.25 + shaftLift, rx: 0.058, rz: 0.067, cx: 0, cz: -0.002, power: 2.3 },
          { y: 0.305 + shaftLift, rx: 0.058, rz: 0.066, cx: 0, cz: 0, power: 2.3 }
        ];
        const shaftMesh = new THREE.Mesh(loft(shaft, { rings: 14, segments: 24 }), main);
        shaftMesh.position.x = x;
        shaftMesh.castShadow = true;
        shaftMesh.receiveShadow = true;
        slotGroup.add(shaftMesh);
        add(slotGroup, torus(0.059, 0.009, 24), item.uggs ? light : dark, [x, 0.305 + shaftLift, 0], [Math.PI / 2, 0, 0], [1, 1, 1.12]);
        if (item.uggs) {
          add(slotGroup, cylinder(0.064, 0.07, 0.06, 22), main, [x, 0.33 + shaftLift, 0], null, [1, 1, 1.12]);
        }
        add(slotGroup, box(0.022, 0.035, 0.012), metal, [x + side * 0.058, 0.24 + shaftLift, 0.045]);
        add(slotGroup, box(0.024, 0.03, 0.01), dark, [x, 0.288 + shaftLift, -0.068]);
      }
      if (config.lace) {
        const instepTop = (z) => sampleZ(upperSections, z, 'cy', 0.1) + sampleZ(upperSections, z, 'h', 0.05);
        const tongue = add(slotGroup, box(0.05, 0.008, 0.08), light, [x, instepTop(0.05) + 0.002, 0.05], [-0.26, 0, 0]);
        tongue.userData.slot = 'shoes';
        laceYs.forEach((z) => {
          const y = instepTop(z) + 0.007;
          add(slotGroup, box(0.056, 0.005, 0.009), light, [x, y, z], [-0.28, 0, 0]);
          [-1, 1].forEach((laceSide) => {
            add(slotGroup, sphere(0.0036, 8), metal, [x + laceSide * 0.029, y + 0.001, z]);
          });
        });
      } else if (config.shaft) {
        add(slotGroup, box(0.006, 0.085, 0.048), dark, [x + side * 0.058, 0.225 + config.lift, 0.02]);
        add(slotGroup, box(0.004, 0.1, 0.004), metal, [x, 0.23 + config.lift, 0.061]);
      }
      if (config.toeCap) {
        const seam = tube([[x - 0.052, 0.112 + config.lift - config.drop, 0.158], [x, 0.122 + config.lift - config.drop, 0.162], [x + 0.052, 0.112 + config.lift - config.drop, 0.158]], 0.0022, dark);
        seam.userData.slot = 'shoes';
        slotGroup.add(seam);
      }
      if (config.heelTab) {
        add(slotGroup, box(0.032, 0.024, 0.012), accent, [x, upperTop - 0.03, -0.098]);
      }
      if (config.runner) {
        add(slotGroup, box(0.085, 0.006, 0.024), accent, [x, 0.073 + config.lift, 0.212], [0.1, 0, 0]);
        add(slotGroup, box(0.005, 0.028, 0.13), accent, [x + side * 0.074, 0.085 + config.lift, 0.045], [0, 0, -side * 0.06]);
      }
      if (config.heelBlock) {
        add(slotGroup, box(0.086, 0.042, 0.092), dark, [x, 0.021, -0.062]);
      }
      if (config.bow) {
        const bowY = sampleZ(upperSections, 0.07, 'cy', 0.06) + sampleZ(upperSections, 0.07, 'h', 0.03) + 0.004;
        add(slotGroup, box(0.026, 0.006, 0.014), accent, [x - 0.014, bowY, 0.072], [0, 0, 0.35]);
        add(slotGroup, box(0.026, 0.006, 0.014), accent, [x + 0.014, bowY, 0.072], [0, 0, -0.35]);
        add(slotGroup, sphere(0.006, 8), accent, [x, bowY + 0.001, 0.074]);
      }
      const mark = addBrandMark(slotGroup, item, [x + side * 0.079, 0.1 + config.lift - config.drop, 0.03], 0.62, accent);
      if (mark) mark.rotation.y = side * Math.PI / 2;
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
        const sleeve = makeSleeve(slotGroup, side, main, trim, { ease: 0.019, length: 0.48 });
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
        sleeveBySide.set(side, makeSleeve(slotGroup, side, main, trim, { ease: racer ? 0.016 : 0.015, length: 0.49, stripes: racer, stripeMat: accent }));
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
    const accent = material(palette.accent, { roughness: 0.46 });
    addShoePair(slotGroup, item, { main, dark, metal, light }, { accent });
    tagGroup(slotGroup, 'shoes');
    root.add(slotGroup);
  }

  const HAIR_CENTER_Y = 1.735;
  const HAIR_RX = 0.125;
  const HAIR_RY = 0.15;
  const HAIR_RZ = 0.121;

  function hairlinePolar(azimuth) {
    const front = Math.max(0, Math.sin(azimuth));
    const back = Math.max(0, -Math.sin(azimuth));
    const side = Math.abs(Math.cos(azimuth));
    return 1.3 + back * 0.56 + side * 0.14 - front * 0.38;
  }

  function hairPoint(azimuth, polar, inflate) {
    const r = inflate || 1;
    return new THREE.Vector3(
      Math.sin(polar) * Math.cos(azimuth) * HAIR_RX * r,
      HAIR_CENTER_Y + Math.cos(polar) * HAIR_RY * r,
      Math.sin(polar) * Math.sin(azimuth) * HAIR_RZ * r
    );
  }

  const HAIR_STYLES = {
    crop: { side: 0.018, back: 0.026, fringe: 0.045, flare: 0.006, grooves: 90, clumps: 12, roughness: 0.66, sideRaise: 0.22 },
    fade: { side: 0.012, back: 0.02, fringe: 0.035, flare: 0.004, grooves: 60, clumps: 8, roughness: 0.8, fade: true, sideRaise: 0.24 },
    pixie: { side: 0.03, back: 0.05, fringe: 0.058, flare: 0.01, grooves: 94, clumps: 14, roughness: 0.68, sideRaise: 0.12 },
    slick: { side: 0.022, back: 0.04, fringe: 0.018, flare: 0.006, grooves: 78, clumps: 8, roughness: 0.42, slick: true },
    mohawk: { side: 0.008, back: 0.014, fringe: 0.012, flare: 0.004, grooves: 0, clumps: 0, roughness: 0.88, mohawk: true },
    buzz: { side: 0.007, back: 0.012, fringe: 0.008, flare: 0.003, grooves: 0, clumps: 0, roughness: 0.94, buzz: true },
    bob: { side: 0.105, back: 0.135, fringe: 0.078, flare: 0.014, grooves: 130, clumps: 20, roughness: 0.6, tipIn: 0.014 },
    lob: { side: 0.16, back: 0.2, fringe: 0.082, flare: 0.017, grooves: 140, clumps: 22, roughness: 0.6 },
    wolf: { side: 0.12, back: 0.21, fringe: 0.08, flare: 0.02, grooves: 116, clumps: 18, roughness: 0.64 },
    mullet: { side: 0.06, back: 0.2, fringe: 0.052, flare: 0.016, grooves: 108, clumps: 16, roughness: 0.64 },
    shag: { side: 0.13, back: 0.19, fringe: 0.086, flare: 0.02, grooves: 120, clumps: 20, roughness: 0.7, wave: 0.008 },
    curls: { side: 0.11, back: 0.16, fringe: 0.075, flare: 0.032, grooves: 150, clumps: 24, roughness: 0.78, wave: 0.014 },
    flow: { side: 0.3, back: 0.4, fringe: 0.06, flare: 0.022, grooves: 170, clumps: 24, roughness: 0.58 },
    curtain: { side: 0.26, back: 0.3, fringe: 0.115, flare: 0.02, grooves: 160, clumps: 24, roughness: 0.6, curtain: true },
    long: { side: 0.34, back: 0.43, fringe: 0.06, flare: 0.024, grooves: 180, clumps: 26, roughness: 0.58 },
    waves: { side: 0.32, back: 0.41, fringe: 0.06, flare: 0.024, grooves: 180, clumps: 26, roughness: 0.66, wave: 0.014 }
  };

  function hairStyleFor(item, texture) {
    const base = { ...(HAIR_STYLES[item.variant] || HAIR_STYLES.long) };
    if (texture === 'curly') {
      base.wave = (base.wave || 0) + 0.016;
      base.flare += 0.008;
      base.grooves = Math.round(base.grooves * 1.15);
      base.roughness = 0.8;
    } else if (texture === 'wavy') {
      base.wave = Math.max(base.wave || 0, 0.012);
      base.roughness = Math.max(base.roughness, 0.68);
    }
    return base;
  }

  function effectiveHairline(azimuth, style) {
    let hairline = hairlinePolar(azimuth);
    if (style.fade) hairline -= Math.abs(Math.cos(azimuth)) * 0.3;
    if (style.sideRaise) hairline -= Math.pow(Math.abs(Math.cos(azimuth)), 2) * style.sideRaise;
    return hairline;
  }

  function hairDrop(azimuth, style) {
    const front = Math.max(0, Math.sin(azimuth));
    const back = Math.max(0, -Math.sin(azimuth));
    const base = style.side + back * (style.back - style.side);
    const frontMix = Math.min(1, Math.max(0, (front - 0.25) / 0.5));
    const smoothMix = frontMix * frontMix * (3 - 2 * frontMix);
    let drop = base * (1 - smoothMix) + style.fringe * smoothMix;
    if (style.curtain && front > 0.3) drop = style.side * 0.9 + front * 0.02;
    return drop;
  }

  function hairSurfacePoint(azimuth, v, style, extra, dropOverride) {
    const hairline = effectiveHairline(azimuth, style) - 0.01;
    const surfaceT = Math.min(1, v / 0.62);
    const hangRaw = Math.max(0, (v - 0.62) / 0.38);
    const hang = hangRaw * hangRaw * (3 - 2 * hangRaw);
    const drop = dropOverride ?? hairDrop(azimuth, style);
    const point = hairPoint(azimuth, hairline * surfaceT, 1.006 + (extra || 0));
    point.y -= drop * Math.pow(hangRaw, 1.05);
    const flare = (style.flare || 0.012) * hang;
    point.x += Math.cos(azimuth) * flare;
    point.z += Math.sin(azimuth) * flare;
    const front = Math.max(0, Math.sin(azimuth));
    point.z += front * 0.042 * hang;
    if (style.curtain && front > 0.3) point.x += (Math.cos(azimuth) >= 0 ? 1 : -1) * 0.05 * hang;
    if (style.slick) point.z -= 0.022 * hang;
    if (style.tipIn) point.y += style.tipIn * hang * hang;
    return point;
  }

  function hairShellGeometry(item, style) {
    const rings = 30;
    const segments = 76;
    const positions = [];
    const uvs = [];
    const indices = [];
    let seed = 0;
    for (let index = 0; index < item.id.length; index += 1) seed = (seed * 31 + item.id.charCodeAt(index)) >>> 0;
    const phase = (seed % 628) / 100;
    for (let ring = 0; ring <= rings; ring += 1) {
      const v = ring / rings;
      for (let segment = 0; segment < segments; segment += 1) {
        const azimuth = (segment / segments) * Math.PI * 2;
        let drop = hairDrop(azimuth, style);
        const jitter = style.tipIn ? 0.006 : style.buzz || style.mohawk ? 0.002 : 0.026;
        drop *= 1 + Math.sin(azimuth * 7 + phase) * jitter + Math.sin(azimuth * 17 + phase * 2.1) * jitter * 0.55;
        const front = Math.max(0, Math.sin(azimuth));
        if (front > 0.3) {
          drop += (Math.sin(azimuth * 29 + phase * 3.2) * 0.0045 + Math.sin(azimuth * 47 + phase) * 0.0025) * front;
          const partAzimuth = Math.PI / 2 + ((item.index || 1) % 2 ? 1 : -1) * 0.38;
          const partDist = Math.abs(Math.atan2(Math.sin(azimuth - partAzimuth), Math.cos(azimuth - partAzimuth)));
          if (partDist < 0.17) drop *= 0.22 + (partDist / 0.17) * 0.78;
        }
        const point = hairSurfacePoint(azimuth, v, style, 0, drop);
        positions.push(point.x, point.y, point.z);
        uvs.push(segment / segments, 1 - v);
      }
    }
    for (let ring = 0; ring < rings; ring += 1) {
      for (let segment = 0; segment < segments; segment += 1) {
        const next = (segment + 1) % segments;
        const a = ring * segments + segment;
        const b = ring * segments + next;
        const c = (ring + 1) * segments + segment;
        const d = (ring + 1) * segments + next;
        indices.push(a, c, b, b, c, d);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    return geometry;
  }

  function hairGrooveGeometry(item, palette, texture, style) {
    let seed = 0;
    for (let index = 0; index < item.id.length; index += 1) seed = (seed * 31 + item.id.charCodeAt(index)) >>> 0;
    seed = (seed + (item.index || 1) * 7919) >>> 0;
    const random = () => {
      seed = (seed + 0x6D2B79F5) >>> 0;
      let value = seed;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
    const rootColor = new THREE.Color(palette.hair);
    const tipColor = new THREE.Color(palette.hairHi);
    const positions = [];
    const colors = [];
    const indices = [];
    const radial = new THREE.Vector3();
    const tangent = new THREE.Vector3();
    const sideDir = new THREE.Vector3();
    const addStrip = (azimuth, rootPolar, lengthScale, widthScale, brightness, extra, dark) => {
      const points = [];
      const steps = 8;
      for (let step = 0; step < steps; step += 1) {
        const t = step / (steps - 1);
        const v = 0.2 + t * 0.8 * lengthScale;
        const azimuthDrift = azimuth + Math.sin(t * 3.4 + brightness * 9) * 0.03 * t;
        const point = hairSurfacePoint(azimuthDrift, Math.min(1, v), style, extra);
        const wave = style.wave ? Math.sin(t * Math.PI * 3 + rootPolar * 8) * style.wave * t : 0;
        point.x += -Math.sin(azimuth) * wave;
        point.z += Math.cos(azimuth) * wave;
        points.push(point);
      }
      if (style.bobTips) {
        const last = points[points.length - 1];
        const prev = points[points.length - 2];
        last.x += (prev.x - last.x) * 0.2;
        last.z += (prev.z - last.z) * 0.2;
      }
      const baseIndex = positions.length / 3;
      for (let index = 0; index < points.length; index += 1) {
        const point = points[index];
        const previous = points[Math.max(0, index - 1)];
        const next = points[Math.min(points.length - 1, index + 1)];
        tangent.copy(next).sub(previous);
        if (tangent.lengthSq() < 1e-8) tangent.set(0, -1, 0);
        tangent.normalize();
        radial.set(point.x, (point.y - HAIR_CENTER_Y) * 0.3, point.z);
        if (radial.lengthSq() < 1e-7) radial.set(0.1, 0.2, 0.95);
        radial.normalize();
        sideDir.crossVectors(tangent, radial);
        if (sideDir.lengthSq() < 1e-7) sideDir.set(1, 0, 0);
        sideDir.normalize();
        const t = index / (points.length - 1);
        const width = (style.grooveWidth * widthScale) * (1 - t * 0.82);
        positions.push(
          point.x - sideDir.x * width, point.y - sideDir.y * width, point.z - sideDir.z * width,
          point.x + sideDir.x * width, point.y + sideDir.y * width, point.z + sideDir.z * width
        );
        const tone = dark ? 0.62 : 1;
        const color = rootColor.clone().lerp(tipColor, t).multiplyScalar(brightness * tone);
        colors.push(color.r, color.g, color.b, color.r, color.g, color.b);
      }
      for (let index = 0; index < points.length - 1; index += 1) {
        const a = baseIndex + index * 2;
        const b = a + 1;
        const c = a + 2;
        const d = a + 3;
        indices.push(a, c, b, b, c, d);
      }
    };
    style.grooveWidth = style.grooveWidth || 0.0032;
    const count = style.grooves;
    for (let groove = 0; groove < count; groove += 1) {
      const azimuth = (groove / count) * Math.PI * 2 + (random() - 0.5) * (Math.PI * 2 / count) * 1.4;
      const rootPolar = 0.2 + random() * 0.65;
      const lengthScale = 0.86 + random() * 0.2;
      const bright = 0.8 + random() * 0.3;
      addStrip(azimuth, rootPolar, lengthScale, 0.7 + random() * 0.6, bright, 0.004 + random() * 0.004, false);
    }
    const clumpCount = style.clumps || 0;
    for (let clump = 0; clump < clumpCount; clump += 1) {
      const azimuth = (clump / clumpCount) * Math.PI * 2 + (random() - 0.5) * 0.32;
      const rootPolar = 0.12 + random() * 0.35;
      const lengthScale = 0.94 + random() * 0.12;
      const bright = 0.9 + random() * 0.18;
      addStrip(azimuth, rootPolar, lengthScale, 3.6 + random() * 2, bright, 0.012 + random() * 0.01, false);
    }
    const partAzimuth = Math.PI / 2 + ((item.index || 1) % 2 ? 1 : -1) * 0.38;
    addStrip(partAzimuth, 0.1, 0.7, 0.8, 0.4, 0.006, true);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    return geometry;
  }

  function addHair(slotGroup) {
    const item = API.getItems().find((entry) => entry.id === state.equipped.hair);
    if (!item) {
      root.add(slotGroup);
      return;
    }
    const palette = item.palette;
    const texture = state.hairTexture || 'straight';
    const style = hairStyleFor(item, texture);
    style.bobTips = item.variant === 'bob' || item.variant === 'lob';
    style.grooveWidth = texture === 'curly' ? 0.0048 : 0.0036;
    const shellColor = new THREE.Color(palette.hair).multiplyScalar(style.buzz || style.mohawk ? 0.45 : 0.82);
    const shell = new THREE.Mesh(
      hairShellGeometry(item, style),
      new THREE.MeshStandardMaterial({
        color: shellColor,
        roughness: style.roughness,
        metalness: texture === 'straight' ? 0.03 : 0,
        side: THREE.DoubleSide,
        envMapIntensity: 0.42,
        bumpMap: hairBump,
        bumpScale: texture === 'curly' ? 0.002 : 0.001
      })
    );
    shell.castShadow = true;
    shell.receiveShadow = true;
    shell.userData.slot = 'hair';
    slotGroup.add(shell);
    if (style.grooves || style.clumps) {
      const grooves = new THREE.Mesh(
        hairGrooveGeometry(item, palette, texture, style),
        new THREE.MeshStandardMaterial({
          vertexColors: true,
          roughness: style.roughness + 0.04,
          metalness: 0,
          side: THREE.DoubleSide,
          envMapIntensity: 0.5
        })
      );
      grooves.castShadow = false;
      grooves.receiveShadow = true;
      grooves.userData.slot = 'hair';
      slotGroup.add(grooves);
    }
    if (style.mohawk) {
      const positions = [];
      const colors = [];
      const indices = [];
      const rootColor = new THREE.Color(palette.hair);
      const tipColor = new THREE.Color(palette.hairHi);
      let crestSeed = 7;
      const crestRandom = () => {
        crestSeed = (crestSeed * 16807) % 2147483647;
        return crestSeed / 2147483647;
      };
      [-1, 0, 1].forEach((row) => {
        const baseRow = positions.length / 3;
        const steps = 16;
        for (let index = 0; index <= steps; index += 1) {
          const t = index / steps;
          const phi = 1.24 - t * 2.36;
          const x = row * 0.012;
          const base = new THREE.Vector3(x, HAIR_CENTER_Y + Math.cos(phi) * HAIR_RY, Math.sin(phi) * HAIR_RZ);
          const height = (0.04 + Math.sin(t * Math.PI) * 0.055 + crestRandom() * 0.02 + (index % 2) * 0.008) * (row === 0 ? 1.1 : 1);
          const top = base.clone().add(new THREE.Vector3(x * 0.15, height, -height * 0.52));
          positions.push(base.x, base.y, base.z, top.x, top.y, top.z);
          const root = rootColor.clone().lerp(tipColor, 0.15 + crestRandom() * 0.2).multiplyScalar(0.88 + crestRandom() * 0.12);
          const tip = rootColor.clone().lerp(tipColor, 0.7 + crestRandom() * 0.3).multiplyScalar(0.9 + crestRandom() * 0.12);
          colors.push(root.r, root.g, root.b, tip.r, tip.g, tip.b);
        }
        for (let index = 0; index < steps; index += 1) {
          const a = baseRow + index * 2;
          const b = a + 1;
          const c = a + 2;
          const d = a + 3;
          indices.push(a, c, b, b, c, d);
        }
      });
      const crestGeometry = new THREE.BufferGeometry();
      crestGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      crestGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      crestGeometry.setIndex(indices);
      crestGeometry.computeVertexNormals();
      const crest = new THREE.Mesh(
        crestGeometry,
        new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.66, metalness: 0, side: THREE.DoubleSide, envMapIntensity: 0.5 })
      );
      crest.castShadow = true;
      crest.receiveShadow = true;
      crest.userData.slot = 'hair';
      slotGroup.add(crest);
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
          const cx = side * 0.048;
          add(slotGroup, box(0.07, 0.05, 0.01), dark, [cx, 1.748, 0.118]);
          add(slotGroup, box(0.076, 0.007, 0.012), metal, [cx, 1.724, 0.114]);
          add(slotGroup, box(0.076, 0.007, 0.012), metal, [cx, 1.772, 0.114]);
          add(slotGroup, box(0.007, 0.054, 0.012), metal, [cx - 0.035, 1.748, 0.114]);
          add(slotGroup, box(0.007, 0.054, 0.012), metal, [cx + 0.035, 1.748, 0.114]);
          add(slotGroup, box(0.03, 0.009, 0.011), metal, [side * 0.094, 1.748, 0.09], [0, side * 0.25, 0]);
          add(slotGroup, box(0.003, 0.03, 0.002), accent, [cx - 0.021, 1.76, 0.124]);
        });
        add(slotGroup, box(0.024, 0.009, 0.011), metal, [0, 1.752, 0.119]);
      } else if (shape === 'cat') {
        [-1, 1].forEach((side) => {
          add(slotGroup, torus(0.042, 0.005, 20), metal, [side * 0.046, 1.748, 0.116], [0, 0, side * 0.14], [1.25, 0.88, 1]);
          add(slotGroup, new THREE.CircleGeometry(0.037, 20), dark, [side * 0.046, 1.748, 0.114], [0, 0, side * 0.14], [1.25, 0.88, 1]);
          add(slotGroup, box(0.016, 0.007, 0.011), metal, [side * 0.09, 1.778, 0.112], [0, 0, side * 0.45]);
          add(slotGroup, box(0.03, 0.009, 0.011), metal, [side * 0.094, 1.748, 0.09], [0, side * 0.25, 0]);
        });
        add(slotGroup, box(0.024, 0.009, 0.011), metal, [0, 1.752, 0.119]);
      } else {
        [-1, 1].forEach((side) => {
          add(slotGroup, torus(0.042, 0.005, 20), metal, [side * 0.046, 1.748, 0.116]);
          add(slotGroup, new THREE.CircleGeometry(0.037, 20), dark, [side * 0.046, 1.748, 0.114]);
          add(slotGroup, box(0.031, 0.009, 0.011), metal, [side * 0.09, 1.748, 0.09], [0, side * 0.25, 0]);
        });
        add(slotGroup, box(0.025, 0.009, 0.011), metal, [0, 1.752, 0.119]);
      }
      addBrandMark(slotGroup, item, [-0.094, 1.75, 0.1], 0.36, accent);
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
        hand.position.set(0, -BODY.wrist + 0.002, 0.012);
        hand.rotation.y = -side * 1.42;
        armPivot(slotGroup, side).add(hand);
        hands.set(side, hand);
        add(hand, torus(0.034, 0.005, 16), metal, [0, 0.012, 0], [Math.PI / 2, 0, 0]);
        [0, 1, 2].forEach((index) => {
          const spec = HAND_FINGERS[index + 1];
          add(hand, torus(0.009 + index * 0.001, 0.003, 14), index === 1 ? accent : metal, [spec.x, -0.062 - index * 0.008, 0.002], [Math.PI / 2, 0, 0]);
          add(hand, sphere(0.005, 8), index === 2 ? dark : accent, [spec.x, -0.062 - index * 0.008, 0.004]);
        });
        add(hand, torus(0.01, 0.003, 12), accent, [HAND_FINGERS[3].x, -0.056, 0.002], [Math.PI / 2, 0, 0]);
      });
      addBrandMark(hands.get(1), item, [0, 0.018, 0.026], 0.22, accent);
    };

    const addEarrings = () => {
      [-1, 1].forEach((side) => {
        add(slotGroup, sphere(0.008, 8), metal, [side * BODY.head.earX, BODY.head.earY, 0.016]);
        add(slotGroup, torus(0.021, 0.0035, 16), metal, [side * BODY.head.earX, BODY.head.earY - 0.034, 0.014], [0, Math.PI / 2, 0]);
        add(slotGroup, sphere(0.007, 8), accent, [side * BODY.head.earX, BODY.head.earY - 0.062, 0.014]);
        const drop = tube([[side * BODY.head.earX, BODY.head.earY - 0.034, 0.016], [side * 0.104, BODY.head.earY - 0.088, 0.022], [side * BODY.head.earX, BODY.head.earY - 0.14, 0.018]], 0.003, metal);
        drop.userData.slot = 'accessory';
        slotGroup.add(drop);
        add(slotGroup, sphere(0.011, 10), pearl, [side * BODY.head.earX, BODY.head.earY - 0.148, 0.018]);
      });
      addBrandMark(slotGroup, item, [BODY.head.earX, BODY.head.earY - 0.11, 0.026], 0.24, accent);
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
      const pivot = armPivot(slotGroup, -1);
      const watchGroup = new THREE.Group();
      watchGroup.position.set(0, -0.575, 0);
      pivot.add(watchGroup);
      const wx = 0;
      const wy = 0;
      const wz = 0.045;
      add(watchGroup, torus(0.036, 0.009, 20), strap, [wx, wy, 0.012], [Math.PI / 2, 0, 0]);
      add(watchGroup, box(0.046, 0.03, 0.062), strap, [wx, wy + 0.04, 0.024]);
      add(watchGroup, box(0.046, 0.03, 0.062), strap, [wx, wy - 0.04, 0.024]);
      if (strapId === 'twotone') {
        add(watchGroup, box(0.012, 0.028, 0.065), material('#c9a45c', { roughness: 0.32, metalness: 0.6 }), [wx, wy + 0.04, 0.025]);
        add(watchGroup, box(0.012, 0.028, 0.065), material('#c9a45c', { roughness: 0.32, metalness: 0.6 }), [wx, wy - 0.04, 0.025]);
      } else if (strapId === 'nato') {
        [0.035, 0.046].forEach((offset) => {
          add(watchGroup, box(0.044, 0.004, 0.064), material('#b9bcc2', { roughness: 0.6 }), [wx, wy + offset, 0.024]);
          add(watchGroup, box(0.044, 0.004, 0.064), material('#b9bcc2', { roughness: 0.6 }), [wx, wy - offset, 0.024]);
        });
      }
      add(watchGroup, box(0.008, 0.006, 0.045), accent, [wx - 0.021, wy + 0.022, 0.056]);
      add(watchGroup, box(0.008, 0.006, 0.045), accent, [wx - 0.021, wy - 0.022, 0.056]);
      add(watchGroup, cylinder(0.027, 0.027, 0.012, 24), metal, [wx, wy, 0.058], [Math.PI / 2, 0, 0]);
      add(watchGroup, new THREE.CircleGeometry(0.023, 24), face, [wx, wy, 0.065]);
      add(watchGroup, torus(0.027, 0.003, 22), metal, [wx, wy, 0.065]);
      add(watchGroup, cylinder(0.007, 0.007, 0.011, 10), metal, [wx + 0.03, wy, 0.058], [0, 0, Math.PI / 2]);
      addBrandMark(watchGroup, item, [wx, wy + 0.014, 0.07], 0.22, second);
      const style = dialConfig.style;
      if (style === 'digital') {
        add(watchGroup, box(0.03, 0.014, 0.003), material('#1d2622', { roughness: 0.32 }), [wx, wy + 0.006, 0.067]);
        add(watchGroup, box(0.023, 0.005, 0.003), material(dialConfig.ink, { roughness: 0.3 }), [wx, wy + 0.005, 0.069]);
        add(watchGroup, box(0.017, 0.003, 0.003), material(dialConfig.ink, { roughness: 0.3 }), [wx, wy - 0.003, 0.069]);
      } else {
        [0, 1, 2, 3].forEach((index) => {
          const angle = index * Math.PI / 2;
          add(watchGroup, box(0.003, 0.007, 0.002), second, [wx + Math.sin(angle) * 0.017, wy + Math.cos(angle) * 0.017, 0.067], [0, 0, -angle]);
        });
        if (style === 'chrono' || style === 'panda') {
          add(watchGroup, cylinder(0.006, 0.006, 0.002, 16), second, [wx - 0.009, wy + 0.009, 0.067], [Math.PI / 2, 0, 0]);
          add(watchGroup, cylinder(0.006, 0.006, 0.002, 16), second, [wx + 0.009, wy + 0.009, 0.067], [Math.PI / 2, 0, 0]);
          add(watchGroup, cylinder(0.005, 0.005, 0.002, 16), second, [wx, wy - 0.009, 0.067], [Math.PI / 2, 0, 0]);
        } else if (style === 'moon') {
          add(watchGroup, cylinder(0.005, 0.005, 0.002, 16), material('#e8dcc4', { roughness: 0.5 }), [wx, wy - 0.01, 0.067], [Math.PI / 2, 0, 0]);
        } else if (style === 'skeleton') {
          add(watchGroup, torus(0.007, 0.0015, 12), second, [wx - 0.009, wy - 0.004, 0.067]);
          add(watchGroup, torus(0.0045, 0.0012, 12), second, [wx + 0.009, wy + 0.007, 0.067]);
        } else if (style === 'guilloche') {
          add(watchGroup, torus(0.012, 0.001, 20), material(dialConfig.accent, { roughness: 0.4 }), [wx, wy, 0.066]);
          add(watchGroup, torus(0.019, 0.0009, 20), material(dialConfig.accent, { roughness: 0.4 }), [wx, wy, 0.066]);
        } else if (style === 'gmt') {
          add(watchGroup, box(0.002, 0.018, 0.002), second, [wx, wy + 0.009, 0.068], [0, 0, -0.5]);
        }
        add(watchGroup, box(0.003, 0.016, 0.002), handMat, [wx, wy + 0.007, 0.068], [0, 0, -0.35]);
        add(watchGroup, box(0.002, 0.022, 0.002), handMat, [wx + 0.006, wy + 0.01, 0.069], [0, 0, -1.1]);
        add(watchGroup, box(0.0015, 0.024, 0.002), second, [wx - 0.004, wy + 0.011, 0.069], [0, 0, -0.7]);
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
      add(slotGroup, sphere(0.148, 20), knit, [0, 1.858, -0.012], null, [1.06, 0.92, 1.06]);
      add(slotGroup, torus(0.134, 0.028, 24), knitHi, [0, 1.792, 0], [Math.PI / 2, 0, 0], [1, 1, 0.92]);
      add(slotGroup, torus(0.136, 0.006, 24), material(palette.detail, { roughness: 0.8 }), [0, 1.815, 0], [Math.PI / 2, 0, 0], [1, 1, 0.92]);
      add(slotGroup, sphere(0.026, 12), knitHi, [0, 1.996, 0.005], null, [0.9, 0.72, 0.9]);
      addBrandMark(slotGroup, item, [0, 1.826, 0.142], 0.52, knitHi);
    } else if (item.variant === 'scarf') {
      const knit = cloth(palette.main, { roughness: 0.92 });
      const knitHi = cloth(palette.accent, { roughness: 0.86 });
      add(slotGroup, torus(0.082, 0.03, 24), knit, [0, 1.575, 0.008], [Math.PI / 2, 0, 0], [1, 1, 0.88]);
      add(slotGroup, box(0.058, 0.34, 0.028), knit, [-0.072, 1.3, 0.158], [0.12, 0, 0.08]);
      add(slotGroup, box(0.055, 0.29, 0.026), knit, [0.074, 1.25, 0.152], [0.18, 0, -0.08]);
      add(slotGroup, box(0.016, 0.2, 0.005), knitHi, [0.074, 1.24, 0.167], [0.18, 0, -0.08]);
      add(slotGroup, torus(0.018, 0.005, 14), knitHi, [-0.072, 1.13, 0.166], [Math.PI / 2, 0, 0]);
      add(slotGroup, torus(0.016, 0.004, 14), knitHi, [0.074, 1.115, 0.16], [Math.PI / 2, 0, 0]);
      addBrandMark(slotGroup, item, [-0.072, 1.15, 0.176], 0.36, knitHi);
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
      add(slotGroup, box(0.225, 0.068, 0.032), dark, [0, 1.748, 0.122], [0.02, 0, 0]);
      add(slotGroup, box(0.23, 0.011, 0.036), red, [0, 1.778, 0.122]);
      add(slotGroup, box(0.011, 0.048, 0.036), metal, [-0.112, 1.745, 0.12]);
      add(slotGroup, box(0.011, 0.048, 0.036), metal, [0.112, 1.745, 0.12]);
      add(slotGroup, box(0.018, 0.007, 0.011), accent, [0.086, 1.736, 0.136]);
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

  function mergeStaticMeshes() {
    root.updateMatrixWorld(true);
    const rootInverse = new THREE.Matrix4().copy(root.matrixWorld).invert();
    const groups = new Map();
    const candidates = [];
    root.traverse((object) => {
      if (object.isMesh && object.visible && object.material && !Array.isArray(object.material) && object.geometry?.isBufferGeometry) {
        candidates.push(object);
      }
    });
    candidates.forEach((mesh) => {
      const geometry = mesh.geometry;
      const attributes = Object.keys(geometry.attributes).sort().join(',');
      const slot = mesh.userData.slot || '?';
      const key = `${slot}|${mesh.material.uuid}|${attributes}|${geometry.index ? 'indexed' : 'raw'}`;
      if (!groups.has(key)) groups.set(key, { material: mesh.material, slot, meshes: [] });
      groups.get(key).meshes.push(mesh);
    });
    let mergedCount = 0;
    groups.forEach((group) => {
      if (group.meshes.length < 3) return;
      const source = group.meshes[0].geometry;
      const attributes = Object.keys(source.attributes);
      const mergedAttributes = {};
      attributes.forEach((name) => { mergedAttributes[name] = []; });
      const indices = [];
      let offset = 0;
      group.meshes.forEach((mesh) => {
        const geometry = mesh.geometry;
        const matrix = new THREE.Matrix4().multiplyMatrices(rootInverse, mesh.matrixWorld);
        attributes.forEach((name) => {
          const sourceAttribute = geometry.attributes[name];
          if (!sourceAttribute) return;
          const array = sourceAttribute.array;
          const itemSize = sourceAttribute.itemSize;
          let values;
          if (name === 'position') {
            const temp = new THREE.BufferAttribute(array.slice(), itemSize);
            temp.applyMatrix4(matrix);
            values = temp.array;
          } else if (name === 'normal') {
            const temp = new THREE.BufferAttribute(array.slice(), itemSize);
            temp.applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(matrix));
            values = temp.array;
          } else {
            values = array;
          }
          for (let index = 0; index < values.length; index += 1) mergedAttributes[name].push(values[index]);
        });
        const indexArray = geometry.index ? geometry.index.array : null;
        const count = geometry.attributes.position.count;
        if (indexArray) {
          for (let index = 0; index < indexArray.length; index += 1) indices.push(indexArray[index] + offset);
        } else {
          for (let index = 0; index < count; index += 1) indices.push(index + offset);
        }
        offset += count;
      });
      const mergedGeometry = new THREE.BufferGeometry();
      Object.entries(mergedAttributes).forEach(([name, values]) => {
        const itemSize = source.attributes[name].itemSize;
        mergedGeometry.setAttribute(name, new THREE.Float32BufferAttribute(values, itemSize));
      });
      if (indices.length) mergedGeometry.setIndex(indices);
      mergedGeometry.computeBoundingSphere();
      const merged = new THREE.Mesh(mergedGeometry, group.material);
      merged.castShadow = group.meshes.some((mesh) => mesh.castShadow);
      merged.receiveShadow = group.meshes.some((mesh) => mesh.receiveShadow);
      merged.userData.slot = group.slot;
      group.meshes.forEach((mesh) => { if (mesh.parent) mesh.parent.remove(mesh); });
      root.add(merged);
      mergedCount += group.meshes.length - 1;
    });
    if (mergedCount > 0) {
      pickables = [];
      root.traverse((object) => {
        if (object.isMesh && object.userData.slot) pickables.push(object);
      });
    }
  }

  function buildCharacter() {
    rebuildCount += 1;
    if (!reduceMotion && hasBuilt) equipPulse = 1;
    state = API.getState();
    root.rotation.z = -0.01;
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
    const bottomGroup = new THREE.Group();
    addBottom(bottomGroup);
    bottomGroup.scale.x *= bodyWidth;
    const shoesGroup = new THREE.Group();
    addShoes(shoesGroup);
    shoesGroup.scale.x *= bodyWidth;
    shoesGroup.position.y = -0.018;
    addHair(new THREE.Group());
    addAccessory(new THREE.Group());
    mergeStaticMeshes();

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
    const targetY = cameraTargetY;
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
    if (frozen) {
      viewZoom += (zoom - viewZoom) * Math.min(1, delta * 12);
      viewRotation += (rotation - viewRotation) * Math.min(1, delta * 18);
      root.position.y = 0;
      root.scale.setScalar(1);
      root.rotation.y = viewRotation;
      applyCamera();
      renderer.render(scene, camera);
      return;
    }
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
    resetView() { rotation = 0; zoom = 1; cameraTargetY = 0.98; rotationVelocity = 0; updateCamera(true); },
    get rotation() { return rotation; },
    get zoom() { return zoom; },
    get rebuilds() { return rebuildCount; },
    setRotation(value) { rotation = Number(value) || 0; rotationVelocity = 0; updateCamera(); },
    freeze(value) { frozen = Boolean(value); if (frozen) rotationVelocity = 0; },
    stats() {
      return {
        triangles: renderer.info.render.triangles,
        calls: renderer.info.render.calls,
        textures: renderer.info.memory.textures,
        geometries: renderer.info.memory.geometries,
        programs: renderer.info.programs ? renderer.info.programs.length : 0,
        rebuilds: rebuildCount,
        frozen
      };
    },
    setCameraPreset(preset) {
      const presets = {
        front: { rotation: 0, zoom: 1, targetY: 0.98 },
        'three-quarter': { rotation: 0.62, zoom: 1, targetY: 0.98 },
        side: { rotation: Math.PI / 2, zoom: 1, targetY: 0.98 },
        'closeup-torso': { rotation: 0.45, zoom: 1.85, targetY: 1.2 },
        'closeup-feet': { rotation: 0.45, zoom: 2.1, targetY: 0.25 },
        'closeup-hands': { rotation: 0.5, zoom: 1.35, targetY: 0.92 },
        'closeup-head': { rotation: 0.35, zoom: 2.2, targetY: 1.72 }
      };
      const config = presets[preset] || presets.front;
      rotation = config.rotation;
      zoom = config.zoom;
      cameraTargetY = config.targetY;
      rotationVelocity = 0;
      updateCamera(true);
      return config;
    }
  };
  sync(true);
  animate();
})();
