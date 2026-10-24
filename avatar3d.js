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
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.toneMappingExposure = 0.9;
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
  const fabricBump = new THREE.CanvasTexture(fabricCanvas);
  fabricBump.wrapS = THREE.RepeatWrapping;
  fabricBump.wrapT = THREE.RepeatWrapping;
  fabricBump.repeat.set(3, 3);

  const BASE_DISTANCE = 3.9;
  const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 30);
  camera.position.set(0, 1.03, BASE_DISTANCE);
  camera.lookAt(0, 0.95, 0);

  scene.add(new THREE.HemisphereLight(0xfff7ec, 0x5c4c3b, 0.32));
  const keyLight = new THREE.DirectionalLight(0xfff3e2, 1.08);
  keyLight.position.set(-2.2, 3.8, 3.3);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 9;
  keyLight.shadow.camera.left = -2;
  keyLight.shadow.camera.right = 2;
  keyLight.shadow.camera.top = 3;
  keyLight.shadow.camera.bottom = -0.5;
  keyLight.shadow.bias = -0.0002;
  keyLight.shadow.radius = 4;
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xffe0c8, 0.24);
  fillLight.position.set(2.6, 1.4, 2.1);
  scene.add(fillLight);
  const rimLight = new THREE.PointLight(0xff4131, 1.2, 5.5);
  rimLight.position.set(1.9, 2.0, -1.5);
  scene.add(rimLight);
  const topLight = new THREE.PointLight(0xfff8ed, 0.3, 4);
  topLight.position.set(0, 3.2, 0.8);
  scene.add(topLight);

  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 256;
  shadowCanvas.height = 128;
  const shadowContext = shadowCanvas.getContext('2d');
  const shadowGradient = shadowContext.createRadialGradient(128, 64, 5, 128, 64, 112);
  shadowGradient.addColorStop(0, 'rgba(65,44,25,.34)');
  shadowGradient.addColorStop(0.52, 'rgba(65,44,25,.17)');
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
    new THREE.ShadowMaterial({ color: 0x533a24, opacity: 0.18 })
  );
  shadowReceiver.rotation.x = -Math.PI / 2;
  shadowReceiver.position.set(0, 0.004, 0.02);
  shadowReceiver.receiveShadow = true;
  scene.add(shadowReceiver);

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
  const activePointers = new Map();
  let pinchStart = null;
  let dragStart = null;
  let dragMode = null;
  let dragSlot = null;
  let dragMoved = 0;
  let lastInteraction = performance.now();
  let snapshotCache = { signature: '', url: '' };

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
        params.bumpScale = params.bumpScale || 0.004;
      }
    }
    return new THREE.MeshStandardMaterial(params);
  }

  function cloth(value, options) {
    return material(value, { fabric: true, ...(options || {}) });
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

  function clearGroup(group) {
    group.traverse((object) => {
      if (object.isMesh) {
        if (object.geometry && typeof object.geometry.dispose === 'function') object.geometry.dispose();
        if (Array.isArray(object.material)) object.material.forEach((mat) => mat.dispose());
        else if (object.material && typeof object.material.dispose === 'function') object.material.dispose();
      }
    });
    while (group.children.length) group.remove(group.children[0]);
  }

  function cylinder(radiusTop, radiusBottom, height, segments = 24) {
    return new THREE.CylinderGeometry(radiusTop, radiusBottom, height, Math.max(segments, 22), 1);
  }

  function sphere(radius, segments = 22) {
    const count = Math.max(segments, 18);
    return new THREE.SphereGeometry(radius, count, Math.max(12, Math.floor(count * 0.7)));
  }

  function box(width, height, depth) {
    return new THREE.BoxGeometry(width, height, depth);
  }

  function torus(radius, tube, segments = 26) {
    return new THREE.TorusGeometry(radius, tube, 10, Math.max(segments, 24));
  }

  function tube(points, radius, mat) {
    const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(point[0], point[1], point[2])));
    return new THREE.Mesh(new THREE.TubeGeometry(curve, 28, radius, 6, false), mat);
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
        const slash = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.044, 0.004), mat);
        slash.position.set(offset, 0, 0);
        slash.rotation.z = -0.38;
        group.add(slash);
      });
    } else if (mark === 'peak') {
      [-0.024, 0, 0.024].forEach((offset, index) => {
        const peak = new THREE.Mesh(new THREE.ConeGeometry(0.019 - index * 0.002, 0.032 + index * 0.004, 3), mat);
        peak.position.set(offset, index === 2 ? 0.004 : -0.004, 0);
        peak.scale.z = 0.22;
        group.add(peak);
      });
    } else if (mark === 'orbit') {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.0035, 8, 24), mat);
      ring.rotation.z = -0.4;
      group.add(ring);
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.0055, 10, 8), mat);
      group.add(core);
    } else if (mark === 'sun') {
      group.add(new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 10), mat));
      for (let index = 0; index < 8; index += 1) {
        const ray = new THREE.Mesh(new THREE.BoxGeometry(0.0028, 0.012, 0.003), mat);
        const angle = (index / 8) * Math.PI * 2;
        ray.position.set(Math.cos(angle) * 0.021, Math.sin(angle) * 0.021, 0);
        ray.rotation.z = angle - Math.PI / 2;
        group.add(ray);
      }
    } else if (mark === 'monogram') {
      [[0, 0.024, 0.048, 0.003], [0, -0.024, 0.048, 0.003], [-0.024, 0, 0.003, 0.048], [0.024, 0, 0.003, 0.048]].forEach(([x, y, w, h]) => {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.004), mat);
        bar.position.set(x, y, 0);
        group.add(bar);
      });
      [-1, 1].forEach((side) => {
        const stroke = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.032, 0.005), mat);
        stroke.position.set(side * 0.008, -0.002, 0.004);
        stroke.rotation.z = side * 0.52;
        group.add(stroke);
      });
    } else if (mark === 'bolt') {
      [-1, 1].forEach((side) => {
        const stroke = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.032, 0.005), mat);
        stroke.position.set(side * 0.007, side * 0.008, 0);
        stroke.rotation.z = side * -0.55;
        group.add(stroke);
      });
    } else if (mark === 'diamond') {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.0032, 4, 4), mat);
      ring.rotation.z = Math.PI / 4;
      group.add(ring);
      group.add(new THREE.Mesh(new THREE.SphereGeometry(0.006, 10, 8), mat));
    } else if (mark === 'arc') {
      const arc = new THREE.Mesh(new THREE.TorusGeometry(0.019, 0.0032, 8, 18, Math.PI), mat);
      group.add(arc);
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.0045, 10, 8), mat);
      dot.position.set(0, -0.019, 0);
      group.add(dot);
    } else if (mark === 'wave') {
      [-0.015, 0, 0.015].forEach((x, index) => {
        const bead = new THREE.Mesh(new THREE.SphereGeometry(0.006, 10, 8), mat);
        bead.position.set(x, index === 0 ? 0.006 : index === 1 ? -0.006 : 0.004, 0);
        group.add(bead);
      });
    } else {
      [-1, 1].forEach((side) => {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.011, 0.004), mat);
        wing.position.set(side * 0.022, side * 0.006, 0);
        wing.rotation.z = side * -0.34;
        group.add(wing);
      });
    }
    parent.add(group);
    return group;
  }

  function makeSleeve(parent, side, mat, cuffMat, options) {
    const config = options || {};
    const shoulderX = side * 0.205;
    const radius = config.radius || 0.095;
    const length = config.length || 0.5;
    const shoulder = add(
      parent,
      sphere(radius * 1.13, 16),
      mat,
      [shoulderX, 1.44, 0],
      null,
      [1.05, 0.9, 1]
    );
    const arm = add(
      parent,
      cylinder(radius, radius * 0.82, length, 16),
      mat,
      [side * 0.22, 1.17, 0]
    );
    const cuff = add(
      parent,
      cylinder(radius * 0.84, radius * 0.72, 0.08, 16),
      cuffMat,
      [side * 0.22, 0.91, 0]
    );
    if (config.stripes) {
      [-0.2, -0.33].forEach((yOffset) => {
        add(parent, torus(radius * 0.92, 0.012, 18), config.stripeMat, [side * 0.22, 1.17 + yOffset, 0], [Math.PI / 2, 0, 0]);
      });
    }
    return { shoulder, arm, cuff };
  }

  function addBody() {
    const skin = new THREE.MeshStandardMaterial({
      color: toColor(SKIN_TONES[state.skin] || SKIN_TONES[0]),
      roughness: 0.78,
      metalness: 0,
      envMapIntensity: 0.35
    });
    const skinDark = new THREE.MeshStandardMaterial({
      color: toColor(SKIN_TONES[state.skin] || SKIN_TONES[0]).multiplyScalar(0.86),
      roughness: 0.82,
      envMapIntensity: 0.35
    });
    const body = new THREE.Group();
    root.add(body);

    [-1, 1].forEach((side) => {
      const x = side * 0.085;
      const upper = add(body, cylinder(0.067, 0.055, 0.4), skin, [x, 0.7, 0]);
      upper.userData.slot = 'bottom';
      pickables.push(upper);
      const knee = add(body, sphere(0.06, 14), skin, [x, 0.51, 0], null, [1, 0.85, 1]);
      knee.userData.slot = 'bottom';
      pickables.push(knee);
      const lower = add(body, cylinder(0.055, 0.043, 0.4), skin, [x, 0.3, 0]);
      lower.userData.slot = 'bottom';
      pickables.push(lower);
      const ankle = add(body, sphere(0.045, 12), skinDark, [x, 0.11, 0]);
      ankle.userData.slot = 'shoes';
      pickables.push(ankle);

      const upperArm = add(body, cylinder(0.052, 0.045, 0.32, 14), skin, [side * 0.21, 1.26, 0]);
      upperArm.userData.slot = 'top';
      pickables.push(upperArm);
      const elbow = add(body, sphere(0.05, 12), skin, [side * 0.215, 1.09, 0], null, [1, 0.85, 1]);
      elbow.userData.slot = 'top';
      pickables.push(elbow);
      const forearm = add(body, cylinder(0.045, 0.037, 0.29, 14), skin, [side * 0.22, 0.945, 0]);
      forearm.userData.slot = 'top';
      pickables.push(forearm);
      const hand = add(body, sphere(0.058, 14), skin, [side * 0.223, 0.79, 0.015], null, [0.9, 1.1, 0.7]);
      hand.userData.slot = 'accessory';
      pickables.push(hand);
      const thumb = add(body, sphere(0.023, 10), skin, [side * 0.2, 0.81, 0.045]);
      thumb.userData.slot = 'accessory';
      pickables.push(thumb);
    });

    const hips = add(body, cylinder(0.15, 0.16, 0.14), skinDark, [0, 0.93, 0], null, [1, 1, 0.72]);
    hips.userData.slot = 'bottom';
    pickables.push(hips);
    const torso = add(body, cylinder(0.185, 0.135, 0.49, 20), skin, [0, 1.22, 0], null, [1, 1, 0.68]);
    torso.userData.slot = 'top';
    pickables.push(torso);
    const chest = add(body, sphere(0.16, 16), skin, [0, 1.38, 0.015], null, [1.08, 0.62, 0.72]);
    chest.userData.slot = 'top';
    pickables.push(chest);

    const neck = add(body, cylinder(0.044, 0.05, 0.14, 14), skin, [0, 1.56, 0]);
    neck.userData.slot = 'hair';
    pickables.push(neck);
    const head = add(body, sphere(0.148, 24), skin, [0, 1.73, 0], null, [1, 1.12, 0.94]);
    head.userData.slot = 'hair';
    pickables.push(head);
    [-1, 1].forEach((side) => {
      const ear = add(body, sphere(0.03, 12), skin, [side * 0.146, 1.72, 0], null, [0.55, 1, 0.7]);
      ear.userData.slot = 'hair';
      pickables.push(ear);
    });

    const eyeMat = material('#221c17', { roughness: 0.5 });
    [-1, 1].forEach((side) => {
      add(body, sphere(0.024, 12), eyeMat, [side * 0.055, 1.76, 0.133], null, [1.15, 0.38, 0.24]);
      const brow = add(body, box(0.058, 0.012, 0.014), eyeMat, [side * 0.057, 1.805, 0.135], [0, 0, side * 0.1]);
      brow.userData.slot = 'hair';
      pickables.push(brow);
    });
    const nose = add(body, new THREE.ConeGeometry(0.016, 0.055, 8), skinDark, [0, 1.715, 0.147], [0.35, 0, 0]);
    nose.userData.slot = 'hair';
    pickables.push(nose);
    const mouth = add(body, box(0.052, 0.011, 0.01), material('#6a382f', { roughness: 0.7 }), [0, 1.665, 0.14]);
    mouth.userData.slot = 'hair';
    pickables.push(mouth);

    if (state.equipped.hair === null) {
      add(body, sphere(0.151, 20), skin, [0, 1.75, -0.004], null, [1.02, 1.08, 0.97]).userData.slot = 'hair';
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
          add(slotGroup, sphere(radius * 0.45, 16), main, [side * (radius - 0.005), bodyTop - 0.065, 0], null, [1.05, 0.82, 1.02]);
          add(slotGroup, cylinder(radius * 0.45, radius * 0.34, 0.185, 16), main, [side * (radius + 0.045), bodyTop - 0.135, 0], [0, 0, side * 0.6]);
          add(slotGroup, sphere(radius * 0.36, 14), main, [side * (radius + 0.105), bodyTop - 0.225, 0], null, [1, 0.72, 1]);
          add(slotGroup, torus(radius * 0.33, 0.006, 18), trim, [side * (radius + 0.107), bodyTop - 0.235, 0], [Math.PI / 2, 0, side * 0.6], [1, 1, 0.85]);
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
        makeSleeve(slotGroup, side, main, trim, { radius: oversize ? 0.105 : slim ? 0.07 : 0.085, length: 0.5 });
        if (variant === 'shirt') {
          [0, 1].forEach((index) => add(slotGroup, sphere(0.008, 8), metal, [side * 0.22, 0.9 + index * 0.022, 0.085]));
        }
      });
      if (variant === 'longsleeve') {
        add(slotGroup, torus(radius * 0.96, 0.009, 24), trim, [0, bodyBottom, 0], [Math.PI / 2, 0, 0], [1, 1, 0.73]);
        add(slotGroup, box(0.05, 0.016, 0.012), cream, [-0.02, bodyBottom + 0.012, 0.15]);
      }
    } else if (variant === 'bomber') {
      [-1, 1].forEach((side) => {
        add(slotGroup, sphere(0.118, 16), main, [side * 0.215, 1.43, 0], null, [1.15, 0.85, 1.1]);
        makeSleeve(slotGroup, side, main, trim, { radius: 0.115, length: 0.49 });
        add(slotGroup, torus(0.09, 0.011, 20), trim, [side * 0.22, 0.885, 0], [Math.PI / 2, 0, 0]);
      });
      add(slotGroup, torus(radius * 0.94, 0.016, 26), trim, [0, bodyBottom, 0], [Math.PI / 2, 0, 0], [1, 1, 0.8]);
      add(slotGroup, torus(0.075, 0.012, 20), trim, [0, bodyTop + 0.045, 0], [Math.PI / 2, 0, 0], [1.1, 1, 0.85]);
      add(slotGroup, box(0.016, 0.36, 0.012), metal, [0, 1.26, 0.185]);
      add(slotGroup, sphere(0.012, 8), metal, [0, bodyTop + 0.005, 0.19]);
      add(slotGroup, box(0.085, 0.048, 0.012), accent, [-0.125, 1.34, 0.18]);
      add(slotGroup, box(0.045, 0.032, 0.012), cream, [0.13, 1.34, 0.18]);
      add(slotGroup, box(0.07, 0.018, 0.01), hi, [0.13, 1.3, 0.18]);
    } else if (variant === 'vest') {
      [-1, 1].forEach((side) => {
        add(slotGroup, torus(0.075, 0.01, 18), trim, [side * 0.19, 1.37, 0], [Math.PI / 2, 0, 0], [1, 1, 0.9]);
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
        add(slotGroup, new THREE.ConeGeometry(0.02, 0.035, 10), accent, [0, 1.285, 0.16], [0, 0, Math.PI]);
      } else {
        add(slotGroup, box(0.085, 0.055, 0.01), accent, [0, 1.32, 0.16]);
        add(slotGroup, box(0.055, 0.012, 0.012), hi, [0, 1.32, 0.168]);
      }
    }
    if (item.brand) {
      addBrandMark(slotGroup, item, [variant === 'shirt' ? 0.105 : 0, 1.315, 0.171], 1.2, accent);
    }
  }

  function addModernBottom(slotGroup, item, mats) {
    const { main, hi, dark, trim, metal } = mats;
    const crease = material(item.palette.main, { roughness: 0.86 });
    crease.color.multiplyScalar(0.7);
    const fit = item.fit || 'mid';
    const waistY = fit === 'high' ? 0.975 : fit === 'low' ? 0.855 : 0.925;
    const variant = item.variant;
    add(slotGroup, cylinder(0.178, 0.166, 0.07, 22), main, [0, waistY, 0], null, [1, 1, 0.82]);
    add(slotGroup, cylinder(0.182, 0.182, 0.022, 22), dark, [0, waistY + 0.045, 0], null, [1, 1, 0.82]);
    add(slotGroup, box(0.06, 0.03, 0.014), metal, [0, waistY + 0.015, 0.15]);
    [-0.128, -0.042, 0.042, 0.128].forEach((x) => add(slotGroup, box(0.017, 0.055, 0.014), dark, [x, waistY + 0.015, 0.145]));
    const chain = tube([[-0.15, waistY, 0.145], [-0.12, waistY - 0.13, 0.16], [-0.065, waistY - 0.24, 0.15]], 0.007, metal);
    chain.userData.slot = 'bottom';
    slotGroup.add(chain);
    add(slotGroup, box(0.047, 0.022, 0.012), metal, [0.14, waistY - 0.1, 0.15]);
    add(slotGroup, sphere(0.012, 10), metal, [0.14, waistY - 0.13, 0.152]);

    // pelvis bridge: closes the gap between waistband and leg tops on wide trousers
    add(slotGroup, cylinder(0.174, 0.158, 0.25, 24), main, [0, waistY - 0.115, 0], null, [1, 1, 0.82]);
    add(slotGroup, torus(0.171, 0.009, 24), dark, [0, waistY - 0.025, 0], [Math.PI / 2, 0, 0], [1, 1, 0.82]);
    add(slotGroup, box(0.012, 0.19, 0.012), dark, [0, waistY - 0.15, 0.145]);
    [-1, 1].forEach((side) => {
      add(slotGroup, box(0.012, 0.14, 0.012), crease, [side * 0.155, waistY - 0.14, 0.02], [0, 0, side * 0.1]);
      const bottomCrease = tube([[side * 0.12, waistY - 0.3, 0.13], [side * 0.08, waistY - 0.4, 0.15], [side * 0.1, waistY - 0.5, 0.14]], 0.0022, crease);
      bottomCrease.userData.slot = 'bottom';
      slotGroup.add(bottomCrease);
    });

    if (variant === 'skirt') {
      const length = item.length || 'midi';
      const hemY = length === 'mini' ? 0.64 : length === 'maxi' ? 0.16 : 0.4;
      const bottomR = length === 'mini' ? 0.215 : length === 'maxi' ? 0.27 : 0.24;
      const skirt = new THREE.CylinderGeometry(0.17, bottomR, waistY - 0.03 - hemY, 32, 4, true);
      add(slotGroup, skirt, main, [0, (waistY + hemY) / 2, 0], null, [1, 1, 0.86]);
      add(slotGroup, torus(bottomR * 0.97, 0.01, 32), trim, [0, hemY, 0], [Math.PI / 2, 0, 0], [1, 1, 0.86]);
      add(slotGroup, torus(0.173, 0.012, 28), dark, [0, waistY - 0.02, 0], [Math.PI / 2, 0, 0], [1, 1, 0.86]);
      [-0.12, -0.06, 0, 0.06, 0.12].forEach((x) => {
        add(slotGroup, box(0.004, waistY - hemY - 0.06, 0.004), hi, [x, (waistY + hemY) / 2, 0.145]);
      });
      add(slotGroup, box(0.012, (waistY - hemY) * 0.66, 0.008), dark, [0.07, hemY + (waistY - hemY) * 0.28, 0.18]);
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

    const hemY = variant === 'jorts' ? 0.52 : 0.13;
    [-1, 1].forEach((side) => {
      const x = side * (['flare', 'baggy', 'parachute'].includes(variant) ? 0.1 : variant === 'jorts' ? 0.095 : 0.086);
      if (variant === 'flare') {
        add(slotGroup, cylinder(0.1, 0.08, 0.34, 20), main, [x, 0.66, 0]);
        add(slotGroup, cylinder(0.08, 0.175, 0.36, 20), main, [x, 0.32, 0]);
        add(slotGroup, torus(0.178, 0.012, 22), trim, [x, 0.135, 0], [Math.PI / 2, 0, 0]);
        add(slotGroup, torus(0.1, 0.008, 18), metal, [x, 0.5, 0], [Math.PI / 2, 0, 0]);
        add(slotGroup, box(0.012, 0.5, 0.012), hi, [x + side * 0.045, 0.48, 0.045]);
      } else if (variant === 'baggy') {
        add(slotGroup, cylinder(0.145, 0.155, 0.79, 20), main, [x, 0.52, 0]);
        add(slotGroup, torus(0.157, 0.014, 22), trim, [x, 0.17, 0], [Math.PI / 2, 0, 0]);
        add(slotGroup, torus(0.14, 0.009, 22), trim, [x, 0.235, 0], [Math.PI / 2, 0, 0]);
        add(slotGroup, box(0.095, 0.13, 0.055), main, [side * 0.15, 0.62, 0.04]);
        add(slotGroup, box(0.1, 0.018, 0.06), dark, [side * 0.15, 0.69, 0.04]);
        add(slotGroup, box(0.05, 0.02, 0.02), metal, [side * 0.15, 0.69, 0.075]);
        add(slotGroup, box(0.008, 0.6, 0.008), hi, [x + side * 0.08, 0.5, 0.05]);
      } else if (variant === 'parachute') {
        add(slotGroup, cylinder(0.15, 0.175, 0.8, 20), main, [x, 0.52, 0]);
        add(slotGroup, torus(0.09, 0.018, 20), trim, [x, 0.155, 0], [Math.PI / 2, 0, 0]);
        add(slotGroup, torus(0.16, 0.012, 24), trim, [x, 0.23, 0], [Math.PI / 2, 0, 0]);
        add(slotGroup, box(0.065, 0.16, 0.055), main, [side * 0.16, 0.56, 0.02]);
        add(slotGroup, box(0.07, 0.025, 0.06), dark, [side * 0.16, 0.63, 0.025]);
        add(slotGroup, box(0.045, 0.018, 0.02), metal, [side * 0.16, 0.63, 0.058]);
        add(slotGroup, box(0.01, 0.15, 0.01), hi, [x + side * 0.04, 0.45, 0.08]);
      } else if (variant === 'track') {
        add(slotGroup, cylinder(0.1, 0.065, 0.78, 20), main, [x, 0.53, 0]);
        add(slotGroup, torus(0.073, 0.016, 20), trim, [x, 0.16, 0], [Math.PI / 2, 0, 0]);
        add(slotGroup, box(0.025, 0.65, 0.012), hi, [x + side * 0.06, 0.5, 0.05]);
        add(slotGroup, box(0.012, 0.5, 0.012), dark, [x + side * 0.062, 0.5, 0.05]);
        add(slotGroup, torus(0.086, 0.01, 18), metal, [x, 0.5, 0], [Math.PI / 2, 0, 0]);
      } else if (variant === 'jorts') {
        add(slotGroup, cylinder(0.155, 0.165, 0.36, 20), main, [x, 0.72, 0], null, [1, 1, 0.9]);
        add(slotGroup, torus(0.157, 0.014, 22), trim, [x, 0.55, 0], [Math.PI / 2, 0, 0]);
        add(slotGroup, box(0.105, 0.12, 0.055), main, [side * 0.155, 0.77, 0.02]);
        add(slotGroup, box(0.11, 0.018, 0.06), dark, [side * 0.155, 0.83, 0.025]);
        [0, 1, 2].forEach((index) => add(slotGroup, box(0.02, 0.03, 0.01), main, [x - 0.04 + index * 0.04, 0.535, 0.08], [0, 0, side * (index % 2 ? 0.2 : -0.2)]));
      } else if (variant === 'wide') {
        const wx = side * 0.126;
        add(slotGroup, cylinder(0.098, 0.106, 0.72, 22), main, [wx, 0.56, 0], null, [1, 1, 0.92]);
        add(slotGroup, cylinder(0.108, 0.11, 0.07, 22), trim, [wx, 0.21, 0], null, [1, 1, 0.92]);
        add(slotGroup, box(0.008, 0.55, 0.008), hi, [wx + side * 0.058, 0.56, 0.06]);
        add(slotGroup, box(0.008, 0.55, 0.008), dark, [wx - side * 0.046, 0.56, 0.06]);
        if (item.cargo) {
          add(slotGroup, box(0.078, 0.13, 0.048), main, [side * 0.198, 0.6, 0.03]);
          add(slotGroup, box(0.083, 0.018, 0.052), dark, [side * 0.198, 0.67, 0.03]);
          add(slotGroup, box(0.05, 0.018, 0.02), metal, [side * 0.198, 0.67, 0.062]);
        }
      }
      const shorts = variant === 'jorts';
      const narrow = variant === 'track';
      const wide = variant === 'wide';
      const foldX = wide ? side * 0.126 : x;
      const kneeZ = narrow ? 0.066 : variant === 'flare' ? 0.098 : wide ? 0.094 : 0.145;
      const hemZ = narrow ? 0.062 : variant === 'flare' ? 0.138 : wide ? 0.098 : 0.144;
      const kneeY = shorts ? 0.74 : wide ? 0.6 : 0.53;
      const hemYPos = shorts ? 0.585 : wide ? 0.27 : 0.255;
      const kneeFold = tube([[foldX - side * 0.03, kneeY + 0.03, kneeZ - 0.01], [foldX + side * 0.004, kneeY, kneeZ], [foldX + side * 0.03, kneeY - 0.035, kneeZ - 0.008]], 0.0018, crease);
      kneeFold.userData.slot = 'bottom';
      slotGroup.add(kneeFold);
      const hemFold = tube([[foldX - side * 0.026, hemYPos + 0.035, hemZ - 0.012], [foldX + side * 0.012, hemYPos, hemZ], [foldX - side * 0.006, hemYPos - 0.04, hemZ - 0.01]], 0.0016, crease);
      hemFold.userData.slot = 'bottom';
      slotGroup.add(hemFold);
      add(slotGroup, box(0.03, 0.006, 0.008), crease, [foldX + side * 0.024, hemYPos - 0.052, hemZ - 0.008], [0, 0, side * 0.16]);
      add(slotGroup, box(0.008, 0.36, 0.008), hi, [x - side * 0.045, 0.72, 0.06]);
    });

    add(slotGroup, box(0.012, 0.12, 0.012), dark, [0, waistY - 0.02, 0.148]);
    add(slotGroup, box(0.06, 0.012, 0.012), hi, [0, waistY - 0.01, 0.15]);
    addBrandMark(slotGroup, item, [0.115, waistY + 0.016, 0.15], 0.72, trim);
    if (variant === 'track' || variant === 'parachute') {
      const cord = tube([[-0.035, waistY, 0.15], [-0.02, waistY - 0.14, 0.16], [0.01, waistY - 0.2, 0.15]], 0.006, hi);
      cord.userData.slot = 'bottom';
      slotGroup.add(cord);
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
        add(slotGroup, sphere(0.145, 16), main, [side * 0.21, 1.46, 0], null, [1.12, 0.75, 1.05]);
        makeSleeve(slotGroup, side, main, trim, { radius: 0.118, length: 0.48 });
      });
      const hood = add(slotGroup, torus(0.145, 0.055, 24), main, [0, 1.49, -0.06], [Math.PI / 2, 0, 0], [1.2, 1, 0.9]);
      hood.userData.slot = 'top';
      add(slotGroup, box(0.21, 0.14, 0.035), dark, [0, 1.13, 0.2], [0.05, 0, 0]);
      add(slotGroup, box(0.23, 0.03, 0.03), hi, [0, 1.04, 0.19]);
      [-1, 1].forEach((side) => {
        add(slotGroup, cylinder(0.008, 0.008, 0.24, 8), metal, [side * 0.055, 1.4, 0.2]);
        add(slotGroup, sphere(0.014, 8), metal, [side * 0.055, 1.28, 0.2]);
      });
      add(slotGroup, box(0.04, 0.04, 0.012), accent, [0.145, 1.33, 0.22]);
      add(slotGroup, box(0.02, 0.06, 0.012), cream, [-0.13, 1.36, 0.21], [0, 0, 0.25]);
      [-1, 1].forEach((side) => {
        add(slotGroup, torus(0.088, 0.005, 20), trim, [side * 0.22, 0.888, 0], [Math.PI / 2, 0, 0]);
        add(slotGroup, sphere(0.011, 10), metal, [side * 0.222, 0.902, 0.086]);
      });
      add(slotGroup, torus(0.212, 0.007, 26), trim, [0, 0.955, 0], [Math.PI / 2, 0, 0], [1, 1, 0.78]);
    } else {
      const bodyHeight = racer ? 0.44 : 0.57;
      const topRadius = racer ? 0.235 : 0.245;
      add(slotGroup, cylinder(topRadius, racer ? 0.2 : 0.185, bodyHeight, 22), main, [0, racer ? 1.3 : 1.22, 0], null, [1, 1, racer ? 0.76 : 0.72]);
      add(slotGroup, sphere(0.235, 18), main, [0, racer ? 1.47 : 1.45, -0.005], null, [1.12, 0.43, 0.84]);
      [-1, 1].forEach((side) => {
        add(slotGroup, sphere(0.108, 16), main, [side * 0.19, 1.46, 0], null, [1.25, 0.72, 1.08]);
        makeSleeve(slotGroup, side, main, trim, { radius: racer ? 0.105 : 0.103, length: 0.49, stripes: racer, stripeMat: accent });
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
        add(slotGroup, torus(0.1, 0.012, 18), accent, [-0.22, 1.08, 0], [Math.PI / 2, 0, 0]);
        [-1, 1].forEach((side) => {
          add(slotGroup, box(0.115, 0.026, 0.07), hi, [side * 0.16, 1.49, 0], [0, 0, side * 0.04]);
          add(slotGroup, sphere(0.015, 10), metal, [side * 0.15, 1.49, 0.045]);
          add(slotGroup, box(0.075, 0.016, 0.025), accent, [side * 0.225, 1.03, 0.065]);
          [0, 1, 2].forEach((index) => add(slotGroup, sphere(0.011, 8), metal, [side * 0.22, 0.92 + index * 0.022, 0.086]));
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
    const main = cloth(palette.main, { roughness: 0.67 });
    const hi = cloth(palette.accent, { roughness: 0.7 });
    const dark = cloth(palette.detail, { roughness: 0.58 });
    dark.color.multiplyScalar(0.68);
    const trim = cloth(palette.accent, { roughness: 0.72 });
    trim.color.multiplyScalar(0.66);
    const metal = metalMaterial(palette.metal);
    const cargo = item.variant === 'cargo';
    const wide = item.variant === 'wide';

    if (['flare', 'baggy', 'parachute', 'track', 'skirt', 'jorts', 'wide'].includes(item.variant)) {
      addModernBottom(slotGroup, item, { main, hi, dark, trim, metal });
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
    const hair = material(palette.hair, { roughness: texture === 'straight' ? 0.5 : texture === 'wavy' ? 0.68 : 0.86 });
    const hairHi = material(palette.hairHi, { roughness: texture === 'straight' ? 0.44 : texture === 'wavy' ? 0.6 : 0.74 });
    const curlHi = texture === 'curly'
      ? material(new THREE.Color(palette.hair).lerp(new THREE.Color('#c39a72'), 0.44), { roughness: 0.64 })
      : hairHi;
    const curlShadow = texture === 'curly'
      ? material(new THREE.Color(palette.hair).multiplyScalar(0.66), { roughness: 0.9 })
      : hair;
    const fade = material(palette.hair, { roughness: 0.82, transparent: true, opacity: 0.42 });
    if (item.variant === 'crop') {
      add(slotGroup, sphere(0.158, 30), hair, [0, 1.828, -0.028], null, [1.01, 0.68, 1.0]);
      if (texture === 'curly') {
        [
          [-0.108, 1.824, 0.108, -0.24, 0.8, 0.8, 0.6],
          [-0.055, 1.832, 0.12, -0.1, 0.85, 0.75, 0.62],
          [0.004, 1.836, 0.124, 0.02, 0.85, 0.72, 0.6],
          [0.062, 1.83, 0.118, 0.15, 0.8, 0.74, 0.6],
          [0.116, 1.818, 0.104, 0.32, 0.7, 0.7, 0.55]
        ].forEach(([x, y, z, rz, sx, sy, sz], index) => {
          add(slotGroup, sphere(0.04, 14), index % 2 ? hairHi : hair, [x, y, z], [0.14, 0, rz], [sx, sy, sz]);
        });
      } else if (texture === 'wavy') {
        add(slotGroup, sphere(0.09, 18), hair, [0.035, 1.838, 0.095], [0.1, 0, -0.35], [1.2, 0.38, 0.55]);
        add(slotGroup, sphere(0.065, 16), hair, [-0.115, 1.79, 0.06], [0, 0, -0.25], [0.62, 1.3, 0.55]);
        add(slotGroup, sphere(0.065, 16), hair, [0.14, 1.77, 0.06], [0, 0, 0.25], [0.62, 1.3, 0.55]);
        add(slotGroup, sphere(0.06, 14), hairHi, [0.055, 1.855, 0.11], [0.1, 0, -0.3], [1.15, 0.25, 0.5]);
        add(slotGroup, sphere(0.04, 12), hairHi, [-0.12, 1.79, 0.09], [0, 0, -0.2], [0.55, 0.9, 0.45]);
        add(slotGroup, sphere(0.045, 14), hair, [-0.065, 1.84, 0.112], [0.1, 0, -0.32], [0.55, 1.0, 0.45]);
        add(slotGroup, sphere(0.045, 14), hair, [0.095, 1.835, 0.108], [0.1, 0, 0.28], [0.5, 1.05, 0.44]);
        add(slotGroup, sphere(0.03, 12), hairHi, [-0.072, 1.852, 0.125], [0, 0, -0.28], [0.5, 0.8, 0.38]);
      } else {
        add(slotGroup, sphere(0.115, 20), hair, [0, 1.84, 0.08], null, [1.2, 0.24, 0.52]);
        add(slotGroup, sphere(0.06, 14), hair, [-0.13, 1.79, 0.04], [0, 0, -0.18], [0.45, 0.95, 0.5]);
        add(slotGroup, sphere(0.06, 14), hair, [0.13, 1.79, 0.04], [0, 0, 0.18], [0.45, 0.95, 0.5]);
        add(slotGroup, sphere(0.075, 14), hairHi, [-0.03, 1.875, 0.045], [-0.1, 0.1, -0.14], [0.9, 0.14, 0.55]);
      }
      add(slotGroup, sphere(0.125, 20), hair, [0, 1.775, -0.06], null, [0.9, 0.65, 0.62]);
      add(slotGroup, box(0.02, 0.055, 0.026), hair, [-0.142, 1.755, 0.06], [0.2, 0, -0.2]);
      add(slotGroup, box(0.02, 0.055, 0.026), hair, [0.142, 1.755, 0.06], [0.2, 0, 0.2]);
      add(slotGroup, sphere(0.062, 14), hairHi, [-0.032, 1.905, 0.032], [-0.1, 0.1, -0.16], [0.88, 0.16, 0.62]);
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
        add(slotGroup, new THREE.ConeGeometry(0.055 - index * 0.005, 0.16 + (index % 2) * 0.04, 8), index % 2 ? hairHi : hair, [0, 1.94 - Math.abs(z) * 0.25, z]);
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
        add(slotGroup, new THREE.ConeGeometry(0.023, 0.045, 4), accent, [0, 1.285, 0.17], [0, 0, Math.PI]);
        add(slotGroup, sphere(0.012, 10), metal, [0, 1.39, 0.165]);
        add(slotGroup, sphere(0.009, 8), accent, [0, 1.27, 0.172]);
      }
      addBrandMark(slotGroup, item, [0, asPearls ? 1.215 : 1.25, 0.176], 0.34, accent);
    };

    const addRings = () => {
      [-1, 1].forEach((side) => {
        const x = side * 0.223;
        add(slotGroup, torus(0.05, 0.006, 16), metal, [side * 0.22, 0.925, 0.02], [Math.PI / 2, 0, 0]);
        [0, 1, 2].forEach((index) => {
          add(slotGroup, torus(0.015 + index * 0.002, 0.004, 14), index === 1 ? accent : metal, [x + side * (index * 0.009 - 0.01), 0.795 - index * 0.012, 0.045], [Math.PI / 2, 0, 0]);
          add(slotGroup, sphere(0.006, 8), index === 2 ? dark : accent, [x + side * (index * 0.009 - 0.01), 0.795 - index * 0.012, 0.058]);
        });
        add(slotGroup, torus(0.012, 0.0035, 12), accent, [x, 0.82, 0.045], [Math.PI / 2, 0, 0]);
      });
      addBrandMark(slotGroup, item, [0.223, 0.82, 0.06], 0.28, accent);
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
      const wx = -0.223;
      const wy = 0.845;
      const wz = 0.045;
      add(slotGroup, torus(0.052, 0.011, 20), strap, [wx, wy, 0.018], [Math.PI / 2, 0, 0]);
      add(slotGroup, box(0.062, 0.04, 0.085), strap, [wx, wy + 0.058, 0.034]);
      add(slotGroup, box(0.062, 0.04, 0.085), strap, [wx, wy - 0.058, 0.034]);
      if (strapId === 'twotone') {
        add(slotGroup, box(0.016, 0.038, 0.088), material('#c9a45c', { roughness: 0.32, metalness: 0.6 }), [wx, wy + 0.058, 0.035]);
        add(slotGroup, box(0.016, 0.038, 0.088), material('#c9a45c', { roughness: 0.32, metalness: 0.6 }), [wx, wy - 0.058, 0.035]);
      } else if (strapId === 'nato') {
        [0.05, 0.064].forEach((offset) => {
          add(slotGroup, box(0.06, 0.005, 0.087), material('#b9bcc2', { roughness: 0.6 }), [wx, wy + offset, 0.034]);
          add(slotGroup, box(0.06, 0.005, 0.087), material('#b9bcc2', { roughness: 0.6 }), [wx, wy - offset, 0.034]);
        });
      }
      add(slotGroup, box(0.01, 0.008, 0.06), accent, [wx - 0.028, wy + 0.03, 0.075]);
      add(slotGroup, box(0.01, 0.008, 0.06), accent, [wx - 0.028, wy - 0.03, 0.075]);
      add(slotGroup, cylinder(0.039, 0.039, 0.016, 24), metal, [wx, wy, 0.078], [Math.PI / 2, 0, 0]);
      add(slotGroup, new THREE.CircleGeometry(0.033, 24), face, [wx, wy, 0.087]);
      add(slotGroup, torus(0.039, 0.004, 22), metal, [wx, wy, 0.087]);
      add(slotGroup, cylinder(0.009, 0.009, 0.014, 10), metal, [wx + 0.042, wy, 0.078], [0, 0, Math.PI / 2]);
      addBrandMark(slotGroup, item, [wx, wy + 0.019, 0.093], 0.3, second);
      const style = dialConfig.style;
      if (style === 'digital') {
        add(slotGroup, box(0.042, 0.02, 0.003), material('#1d2622', { roughness: 0.32 }), [wx, wy + 0.008, 0.09]);
        add(slotGroup, box(0.032, 0.006, 0.003), material(dialConfig.ink, { roughness: 0.3 }), [wx, wy + 0.007, 0.092]);
        add(slotGroup, box(0.023, 0.004, 0.003), material(dialConfig.ink, { roughness: 0.3 }), [wx, wy - 0.004, 0.092]);
      } else {
        [0, 1, 2, 3].forEach((index) => {
          const angle = index * Math.PI / 2;
          add(slotGroup, box(0.004, 0.009, 0.003), second, [wx + Math.sin(angle) * 0.025, wy + Math.cos(angle) * 0.025, 0.09], [0, 0, -angle]);
        });
        if (style === 'chrono' || style === 'panda') {
          add(slotGroup, cylinder(0.008, 0.008, 0.002, 16), second, [wx - 0.013, wy + 0.012, 0.09], [Math.PI / 2, 0, 0]);
          add(slotGroup, cylinder(0.008, 0.008, 0.002, 16), second, [wx + 0.013, wy + 0.012, 0.09], [Math.PI / 2, 0, 0]);
          add(slotGroup, cylinder(0.007, 0.007, 0.002, 16), second, [wx, wy - 0.013, 0.09], [Math.PI / 2, 0, 0]);
        } else if (style === 'moon') {
          add(slotGroup, cylinder(0.008, 0.008, 0.002, 16), material('#e8dcc4', { roughness: 0.5 }), [wx, wy - 0.014, 0.09], [Math.PI / 2, 0, 0]);
        } else if (style === 'skeleton') {
          add(slotGroup, torus(0.009, 0.0018, 12), second, [wx - 0.012, wy - 0.006, 0.09]);
          add(slotGroup, torus(0.006, 0.0015, 12), second, [wx + 0.012, wy + 0.01, 0.09]);
        } else if (style === 'guilloche') {
          add(slotGroup, torus(0.017, 0.0012, 20), material(dialConfig.accent, { roughness: 0.4 }), [wx, wy, 0.089]);
          add(slotGroup, torus(0.026, 0.001, 20), material(dialConfig.accent, { roughness: 0.4 }), [wx, wy, 0.089]);
        } else if (style === 'gmt') {
          add(slotGroup, box(0.003, 0.024, 0.003), second, [wx, wy + 0.012, 0.093], [0, 0, -0.5]);
        }
        add(slotGroup, box(0.004, 0.021, 0.004), handMat, [wx, wy + 0.01, 0.091], [0, 0, -0.35]);
        add(slotGroup, box(0.003, 0.029, 0.004), handMat, [wx + 0.008, wy + 0.014, 0.092], [0, 0, -1.1]);
        add(slotGroup, box(0.002, 0.032, 0.003), second, [wx - 0.006, wy + 0.015, 0.093], [0, 0, -0.7]);
      }
    };

    if (item.variant === 'visor') {
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
      add(slotGroup, torus(0.014, 0.004, 12), metal, [0.223, 0.8, 0.045], [Math.PI / 2, 0, 0]);
      add(slotGroup, cylinder(0.03, 0.03, 0.018, 16), metal, [-0.225, 0.93, 0.03], [Math.PI / 2, 0, 0]);
      add(slotGroup, torus(0.035, 0.006, 14), metal, [-0.225, 0.93, 0.03], [Math.PI / 2, 0, 0]);
      add(slotGroup, torus(0.015, 0.004, 12), accent, [-0.223, 0.78, 0.05], [Math.PI / 2, 0, 0]);
    }
    tagGroup(slotGroup, 'accessory');
    root.add(slotGroup);
  }

  function buildCharacter() {
    state = API.getState();
    pickables = [];
    while (root.children.length) {
      const child = root.children[0];
      root.remove(child);
      clearGroup(child);
    }
    const bodyScale = state.body === 'slim' ? 0.94 : state.body === 'strong' ? 1.065 : 1;
    root.scale.x = bodyScale;
    addBody();
    addTop(new THREE.Group());
    addBottom(new THREE.Group());
    addShoes(new THREE.Group());
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

  function sync(force) {
    state = API.getState();
    const nextSignature = JSON.stringify({ equipped: state.equipped, skin: state.skin, body: state.body });
    if (!force && nextSignature === signature) return;
    signature = nextSignature;
    snapshotCache = { signature: '', url: '' };
    buildCharacter();
  }

  function updateCamera() {
    const targetY = 0.95 + Math.min(0.6, Math.max(0, zoom - 1) * 0.62);
    camera.position.set(0, targetY + 0.08, BASE_DISTANCE / zoom);
    camera.lookAt(0, targetY, 0);
    stage.classList.toggle('is-zoomed', zoom > 1.03);
  }

  function snapshot() {
    if (snapshotCache.signature === signature && snapshotCache.url) return snapshotCache.url;
    const previousRotation = rotation;
    const previousZoom = zoom;
    rotation = 0;
    zoom = 1;
    root.rotation.y = 0;
    updateCamera();
    renderer.render(scene, camera);
    const url = renderer.domElement.toDataURL('image/png');
    rotation = previousRotation;
    zoom = previousZoom;
    root.rotation.y = previousRotation;
    updateCamera();
    renderer.render(scene, camera);
    snapshotCache = { signature, url };
    return url;
  }

  function resize() {
    const width = Math.max(1, stage.clientWidth);
    const height = Math.max(1, stage.clientHeight);
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
      rotation = dragStart.rotation + dx * 0.011;
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
  renderer.domElement.addEventListener('dblclick', () => { rotation = 0; });
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
  let lastRenderAt = 0;
  function animate(now) {
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.05);
    const visible = Boolean(lookScreen && lookScreen.classList.contains('is-active'))
      && !document.querySelector('.sheet.is-open')
      && !(dropModal && dropModal.classList.contains('is-open'));
    if (!visible) return;
    if (now - lastRenderAt < 30) return;
    lastRenderAt = now;
    if (!dragStart && performance.now() - lastInteraction > 2600) {
      rotation += delta * 0.18;
    }
    root.rotation.y = rotation;
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
    resetView() { rotation = 0; zoom = 1; updateCamera(); },
    get rotation() { return rotation; },
    get zoom() { return zoom; }
  };
  sync(true);
  animate();
})();
