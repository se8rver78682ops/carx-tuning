// Глубокий космос вокруг «Библейского космоса»: фон с Млечным Путём и туманностями,
// яркие звёзды с лучами, далёкие галактики, чёрные дыры, квазары, падающие звёзды
// и близкая космическая пыль для ощущения глубины.
// Тяжёлый фон рисуется один раз в кубическую текстуру, поэтому в кадре он почти ничего не стоит.

const NOISE = /* glsl */ `
  float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float noise(vec3 x) {
    vec3 i = floor(x), f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 6; i++) { s += a * noise(p); p = p * 2.03 + vec3(1.7, 9.2, 4.1); a *= 0.5; } return s; }
`;

const SKY_FRAG = /* glsl */ `
  varying vec3 vDir;
  ${NOISE}
  vec3 cloud(vec3 d, vec3 c, float k, vec3 col, float seed) {
    float w = exp(-(1.0 - dot(d, c)) * k);
    float n = fbm(d * 3.2 + seed);
    return col * w * smoothstep(0.35, 0.85, n) * 0.8;
  }
  float starLayer(vec3 d, float scale, float thr) {
    vec3 p = d * scale;
    vec3 i = floor(p);
    float h = hash(i * 1.37 + 3.1);
    if (h < thr) return 0.0;
    vec3 c = i + 0.5 + (vec3(hash(i + 1.1), hash(i + 2.3), hash(i + 5.7)) - 0.5) * 0.7;
    float r = length(p - c);
    return smoothstep(0.35, 0.0, r) * (h - thr) / (1.0 - thr);
  }
  void main() {
    vec3 d = normalize(vDir);
    vec3 col = mix(vec3(0.004, 0.005, 0.012), vec3(0.010, 0.008, 0.022), d.y * 0.5 + 0.5);
    // Млечный Путь с тёмными пылевыми прожилками
    vec3 n = normalize(vec3(0.3, 1.0, 0.2));
    float b = dot(d, n);
    float band = exp(-b * b * 22.0);
    float core = exp(-b * b * 90.0);
    float f = fbm(d * 5.0);
    float lanes = smoothstep(0.42, 0.68, fbm(d * 9.0 + 7.0)) * core;
    vec3 milky = mix(vec3(0.10, 0.11, 0.17), vec3(0.24, 0.20, 0.16), core);
    col += milky * band * (0.22 + 0.55 * f) * (1.0 - 0.85 * lanes);
    // Цветные туманности
    col += cloud(d, normalize(vec3(-0.7, 0.35, -0.6)), 9.0,  vec3(0.30, 0.06, 0.22), 1.0);
    col += cloud(d, normalize(vec3(0.8, 0.15, 0.55)),  8.0,  vec3(0.04, 0.18, 0.26), 4.0);
    col += cloud(d, normalize(vec3(0.15, -0.55, 0.8)), 7.0,  vec3(0.22, 0.10, 0.03), 9.0);
    col += cloud(d, normalize(vec3(-0.3, 0.85, 0.4)),  10.0, vec3(0.08, 0.06, 0.28), 13.0);
    col += cloud(d, normalize(vec3(0.6, -0.2, -0.75)), 12.0, vec3(0.20, 0.05, 0.10), 21.0);
    // Мелкие звёзды, гуще в полосе Млечного Пути
    float s = starLayer(d, 260.0, 0.93 - band * 0.05) * 1.6 + starLayer(d, 520.0, 0.965 - band * 0.04);
    vec3 tint = mix(vec3(0.75, 0.82, 1.0), vec3(1.0, 0.88, 0.72), hash(floor(d * 260.0)));
    col += tint * s;
    gl_FragColor = vec4(col * 0.8, 1.0);
  }
`;

function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

function canvasTexture(THREE, size, draw) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function galaxyTexture(THREE, seed, arms) {
  const r = rng(seed);
  return canvasTexture(THREE, 256, (g, S) => {
    const cx = S / 2;
    const grd = g.createRadialGradient(cx, cx, 0, cx, cx, S * 0.18);
    grd.addColorStop(0, 'rgba(255,240,215,1)');
    grd.addColorStop(1, 'rgba(255,220,180,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, S, S);
    for (let i = 0; i < 4200; i++) {
      const arm = i % arms;
      const t = Math.pow(r(), 0.7);
      const ang = t * 7.5 + (arm * Math.PI * 2) / arms + (r() - 0.5) * 0.55;
      const rad = t * S * 0.46 + (r() - 0.5) * 9;
      const x = cx + Math.cos(ang) * rad, y = cx + Math.sin(ang) * rad;
      const blue = t > 0.35 && r() < 0.35;
      g.fillStyle = blue ? `rgba(150,190,255,${0.35 + r() * 0.5})` : `rgba(255,${200 + r() * 40},${170 + r() * 50},${0.2 + r() * 0.4})`;
      const sz = r() < 0.03 ? 2.2 : 1.1;
      g.fillRect(x, y, sz, sz);
    }
  });
}

function cloudTexture(THREE, seed) {
  const r = rng(seed);
  const N = 64, grid = Array.from({ length: (N + 1) * (N + 1) }, () => r());
  const v = (x, y) => grid[(y % N) * (N + 1) + (x % N)];
  const noise = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), w = yf * yf * (3 - 2 * yf);
    return (v(xi, yi) * (1 - u) + v(xi + 1, yi) * u) * (1 - w) + (v(xi, yi + 1) * (1 - u) + v(xi + 1, yi + 1) * u) * w;
  };
  return canvasTexture(THREE, 256, (g, S) => {
    const img = g.createImageData(S, S);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      let a = 0.5, s = 0, fx = (x / S) * 6, fy = (y / S) * 6;
      for (let o = 0; o < 5; o++) { s += a * noise(fx + 13, fy + 7); fx *= 2; fy *= 2; a *= 0.5; }
      const dx = x / S - 0.5, dy = y / S - 0.5;
      const fall = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) * 2.1);
      const val = Math.max(0, s - 0.38) * 2.4 * fall * fall;
      const i = (y * S + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
      img.data[i + 3] = Math.min(255, val * 255);
    }
    g.putImageData(img, 0, 0);
  });
}

function ringTexture(THREE) {
  return canvasTexture(THREE, 256, (g, S) => {
    const c = S / 2;
    const grd = g.createRadialGradient(c, c, S * 0.28, c, c, S * 0.5);
    grd.addColorStop(0, 'rgba(255,230,190,0)');
    grd.addColorStop(0.18, 'rgba(255,240,215,1)');
    grd.addColorStop(0.32, 'rgba(255,170,90,0.35)');
    grd.addColorStop(1, 'rgba(255,120,40,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, S, S);
  });
}

function jetTexture(THREE) {
  return canvasTexture(THREE, 128, (g, S) => {
    const grd = g.createLinearGradient(0, 0, 0, S);
    grd.addColorStop(0, 'rgba(160,200,255,0.95)');
    grd.addColorStop(1, 'rgba(120,150,255,0)');
    g.fillStyle = grd;
    g.beginPath();
    g.moveTo(S * 0.44, 0); g.lineTo(S * 0.56, 0); g.lineTo(S * 0.85, S); g.lineTo(S * 0.15, S);
    g.fill();
  });
}

export function buildSky(THREE, { scene, renderer, eye, glowTex, quality = 1 }) {
  const additive = (opts) => ({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, ...opts });
  const dirFrom = (az, el) => new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
  const root = new THREE.Group();
  scene.add(root);
  const animated = [];

  // 1. Фон: один раз рендерим шейдер неба в кубическую текстуру.
  const skyScene = new THREE.Scene();
  skyScene.add(new THREE.Mesh(
    new THREE.SphereGeometry(10, 64, 32),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      vertexShader: 'varying vec3 vDir; void main() { vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: SKY_FRAG,
    }),
  ));
  const cubeRT = new THREE.WebGLCubeRenderTarget(quality > 0.6 ? 1536 : 1024, { generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
  const cubeCam = new THREE.CubeCamera(1, 100, cubeRT);
  cubeCam.update(renderer, skyScene);
  skyScene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
  scene.background = cubeRT.texture;

  // 2. Яркие звёзды с дифракционными лучами.
  {
    const N = 140, r = rng(7);
    const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), size = new Float32Array(N), ph = new Float32Array(N);
    const palette = [[0.7, 0.8, 1.0], [1.0, 1.0, 1.0], [1.0, 0.92, 0.75], [1.0, 0.7, 0.5], [0.8, 0.9, 1.0]];
    for (let i = 0; i < N; i++) {
      const d = new THREE.Vector3().randomDirection().multiplyScalar(700 + r() * 300).add(eye);
      pos.set([d.x, d.y, d.z], i * 3);
      col.set(palette[Math.floor(r() * palette.length)], i * 3);
      size[i] = 7 + Math.pow(r(), 3) * 26;
      ph[i] = r() * 6.28;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
    const mat = new THREE.ShaderMaterial(additive({
      uniforms: { uTime: { value: 0 }, uPx: { value: 1 } },
      vertexShader: `attribute vec3 aColor; attribute float aSize; attribute float aPhase; uniform float uTime; uniform float uPx;
        varying vec3 vColor; void main() { vColor = aColor * (0.8 + 0.2 * sin(uTime * 1.3 + aPhase));
        gl_PointSize = aSize * uPx; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `varying vec3 vColor; void main() { vec2 p = gl_PointCoord - 0.5; float r = length(p);
        float core = exp(-r * 18.0) * 1.4 + exp(-r * 6.0) * 0.25;
        float spikes = (exp(-abs(p.x) * 70.0) * exp(-abs(p.y) * 5.0) + exp(-abs(p.y) * 70.0) * exp(-abs(p.x) * 5.0)) * 0.7;
        float a = core + spikes; if (a < 0.01) discard; gl_FragColor = vec4(vColor * a, a); }`,
    }));
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    root.add(pts);
    animated.push((t) => { mat.uniforms.uTime.value = t; mat.uniforms.uPx.value = Math.min(2, renderer.getPixelRatio()); });
  }

  // 3. Туманности: объёмные облака из нескольких слоёв.
  {
    const r = rng(21);
    const textures = [cloudTexture(THREE, 3), cloudTexture(THREE, 11), cloudTexture(THREE, 29)];
    const nebulae = [
      [-2.3, 0.35, '#c04a9a'], [0.95, 0.15, '#2aa7b8'], [2.6, -0.45, '#d9772e'], [-0.9, 0.95, '#5a4fe0'],
      [3.6, 0.5, '#d04a64'], [1.9, -0.9, '#3f7fe0'],
    ];
    nebulae.forEach(([az, el, color], i) => {
      const center = dirFrom(az, el).multiplyScalar(420 + r() * 160).add(eye);
      for (let k = 0; k < 3; k++) {
        const m = new THREE.Sprite(new THREE.SpriteMaterial(additive({ map: textures[(i + k) % 3], color, opacity: 0.17 - k * 0.04 })));
        m.material.rotation = r() * 6.28;
        m.position.copy(center).add(new THREE.Vector3((r() - 0.5) * 60, (r() - 0.5) * 40, (r() - 0.5) * 60));
        m.scale.setScalar(170 + r() * 160 - k * 30);
        root.add(m);
        const spin = (r() - 0.5) * 0.01;
        animated.push((t, dt) => { m.material.rotation += spin * dt; });
      }
    });
  }

  // 4. Далёкие спиральные галактики.
  {
    const r = rng(42);
    const tex = [galaxyTexture(THREE, 1, 2), galaxyTexture(THREE, 5, 3), galaxyTexture(THREE, 9, 2)];
    for (let i = 0; i < 16; i++) {
      const az = r() * Math.PI * 2, el = (r() - 0.35) * 1.9;
      const p = dirFrom(az, el).multiplyScalar(600 + r() * 300).add(eye);
      const s = 14 + r() * 40;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial(additive({ map: tex[i % 3], opacity: 0.55 + r() * 0.35, side: THREE.DoubleSide })));
      m.position.copy(p);
      m.lookAt(eye);
      m.rotateX((r() - 0.5) * 2.2);
      m.rotateZ(r() * 6.28);
      root.add(m);
      const spin = (r() - 0.5) * 0.02;
      animated.push((t, dt) => { m.rotateZ(spin * dt); });
    }
  }

  // 5. Чёрные дыры: горизонт событий, вращающийся аккреционный диск, линзированная дуга и фотонное кольцо.
  const diskFrag = /* glsl */ `
    varying vec2 vUv; uniform float uTime; uniform float uInner; uniform float uLensed;
    ${NOISE}
    void main() {
      vec2 p = vUv - 0.5; float r = length(p) * 2.0; float a = atan(p.y, p.x);
      if (r < uInner || r > 1.0) discard;
      float t = (r - uInner) / (1.0 - uInner);
      float swirl = fbm(vec3(cos(a) * 3.0, sin(a) * 3.0, t * 6.0 - uTime * 0.35 + a * 0.6));
      float streak = 0.55 + 0.45 * sin(a * 18.0 + t * 25.0 - uTime * 2.2 / (0.3 + t));
      vec3 hot = mix(vec3(1.0, 0.97, 0.9), vec3(1.0, 0.62, 0.22), smoothstep(0.0, 0.45, t));
      vec3 col = mix(hot, vec3(0.75, 0.18, 0.05), smoothstep(0.4, 1.0, t));
      float doppler = 0.55 + 0.75 * max(0.0, cos(a));
      float fade = smoothstep(0.0, 0.08, t) * (1.0 - smoothstep(0.55, 1.0, t));
      float I = fade * (0.35 + swirl) * (0.75 + 0.25 * streak) * doppler * mix(1.0, 0.55, uLensed);
      gl_FragColor = vec4(col * I * 1.6, I);
    }`;
  const ringTex = ringTexture(THREE);
  function blackHole(az, el, dist, size, tilt) {
    const g = new THREE.Group();
    g.position.copy(dirFrom(az, el).multiplyScalar(dist).add(eye));
    g.lookAt(eye);
    const horizon = new THREE.Mesh(new THREE.SphereGeometry(size, 48, 24), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    g.add(horizon);
    const mkDisk = (lensed, scale) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(size * scale, size * scale), new THREE.ShaderMaterial(additive({
        uniforms: { uTime: { value: 0 }, uInner: { value: lensed ? 0.42 : 0.3 }, uLensed: { value: lensed ? 1 : 0 } },
        vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: diskFrag, side: THREE.DoubleSide,
      })));
      return m;
    };
    const disk = mkDisk(false, 9);
    disk.rotation.x = tilt;
    g.add(disk);
    const lensed = mkDisk(true, 6.2); // свет диска, изогнутый гравитацией над и под горизонтом
    lensed.renderOrder = 1;
    g.add(lensed);
    const photon = new THREE.Sprite(new THREE.SpriteMaterial(additive({ map: ringTex, opacity: 0.95 })));
    photon.scale.setScalar(size * 3.1);
    g.add(photon);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial(additive({ map: glowTex, color: '#ff8a3a', opacity: 0.22 })));
    halo.scale.setScalar(size * 16);
    g.add(halo);
    // Горизонт событий должен закрывать диск позади себя.
    horizon.renderOrder = 2;
    root.add(g);
    animated.push((t) => { disk.material.uniforms.uTime.value = t; lensed.material.uniforms.uTime.value = t; });
    return g;
  }
  blackHole(0.6, 1.12, 380, 16, 1.32);   // почти над головой
  blackHole(3.5, -0.85, 430, 13, 1.2);   // внизу, позади
  blackHole(-1.9, 0.05, 620, 9, 1.4);   // у горизонта, между книгами

  // 6. Квазары: ослепительное ядро и два джета.
  {
    const jet = jetTexture(THREE);
    const quasar = (az, el, dist, size, roll) => {
      const g = new THREE.Group();
      g.position.copy(dirFrom(az, el).multiplyScalar(dist).add(eye));
      g.lookAt(eye);
      g.rotateZ(roll);
      const core = new THREE.Sprite(new THREE.SpriteMaterial(additive({ map: glowTex, color: '#ffffff' })));
      core.scale.setScalar(size * 1.4);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial(additive({ map: glowTex, color: '#7fb0ff', opacity: 0.6 })));
      glow.scale.setScalar(size * 6);
      g.add(core, glow);
      for (const sgn of [1, -1]) {
        for (const rot of [0, Math.PI / 2]) {
          const m = new THREE.Mesh(new THREE.PlaneGeometry(size * 1.4, size * 14), new THREE.MeshBasicMaterial(additive({ map: jet, side: THREE.DoubleSide, opacity: 0.8 })));
          m.position.y = sgn * size * 7;
          if (sgn < 0) m.rotation.z = Math.PI;
          m.rotateY(rot);
          g.add(m);
        }
      }
      root.add(g);
      animated.push((t) => { const k = 1 + 0.18 * Math.sin(t * 3.1 + roll * 7); core.scale.setScalar(size * 1.4 * k); });
    };
    quasar(-0.6, 1.25, 700, 4, 0.5);
    quasar(2.2, 0.85, 760, 3.5, -0.8);
    quasar(-2.8, -0.6, 680, 3, 1.2);
  }

  // 7. Падающие звёзды.
  {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array([1, 1, 1, 0, 0, 0]), 3));
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial(additive({ vertexColors: true })));
    line.frustumCulled = false;
    line.visible = false;
    root.add(line);
    const st = { next: 4, t: 0, dur: 1, a: new THREE.Vector3(), v: new THREE.Vector3() };
    const r = rng(99);
    animated.push((t, dt) => {
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (!line.visible) {
        st.next -= dt;
        if (st.next > 0) return;
        st.a.copy(dirFrom(r() * 6.28, 0.1 + r() * 0.9)).multiplyScalar(300).add(eye);
        st.v.copy(new THREE.Vector3().randomDirection()).multiplyScalar(160 + r() * 120);
        st.t = 0; st.dur = 0.7 + r() * 0.6;
        line.visible = true;
      }
      st.t += dt;
      const head = st.a.clone().addScaledVector(st.v, st.t);
      const tail = head.clone().addScaledVector(st.v, -0.28);
      geo.attributes.position.array.set([head.x, head.y, head.z, tail.x, tail.y, tail.z]);
      geo.attributes.position.needsUpdate = true;
      const k = Math.sin(Math.min(1, st.t / st.dur) * Math.PI);
      geo.attributes.color.array.set([k, k, k * 0.95, 0, 0, 0]);
      geo.attributes.color.needsUpdate = true;
      if (st.t > st.dur) { line.visible = false; st.next = 5 + r() * 9; }
    });
  }

  // 8. Близкая космическая пыль: медленно плывёт вокруг и даёт глубину при движении головы.
  const dustU = { uTime: { value: 0 }, uFade: { value: 1 }, uScale: { value: 700 } };
  {
    const N = Math.round(1400 * quality), r = rng(5);
    const pos = new Float32Array(N * 3), drift = new Float32Array(N * 3), ph = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const d = new THREE.Vector3().randomDirection().multiplyScalar(4 + Math.pow(r(), 1.6) * 40).add(eye);
      pos.set([d.x, d.y, d.z], i * 3);
      const v = new THREE.Vector3().randomDirection().multiplyScalar(0.4 + r() * 0.8);
      drift.set([v.x, v.y, v.z], i * 3);
      ph[i] = r() * 6.28;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aDrift', new THREE.BufferAttribute(drift, 3));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
    const mat = new THREE.ShaderMaterial(additive({
      uniforms: dustU,
      vertexShader: `attribute vec3 aDrift; attribute float aPhase; uniform float uTime; uniform float uFade; uniform float uScale;
        varying float vA; void main() {
          vec3 p = position + aDrift * sin(uTime * 0.07 + aPhase) * 2.5;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          float s = 0.045 * uScale / max(-mv.z, 0.1);
          gl_PointSize = clamp(s, 1.0, 6.0);
          vA = uFade * clamp(s / 2.0, 0.15, 0.6) * (0.6 + 0.4 * sin(uTime * 0.9 + aPhase * 3.0));
          gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `varying float vA; void main() { float r = length(gl_PointCoord - 0.5); if (r > 0.5) discard;
        float a = (1.0 - r * 2.0) * vA; gl_FragColor = vec4(vec3(0.75, 0.82, 1.0) * a, a); }`,
    }));
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    root.add(pts);
  }


  // 9. Далёкое солнце, газовый гигант с кольцами и кольцевая туманность.
  const sunPos = dirFrom(0.95, 0.32).multiplyScalar(900).add(eye);
  {
    const glow = new THREE.Sprite(new THREE.SpriteMaterial(additive({ map: glowTex, color: '#ffe2b0', opacity: 0.55 })));
    glow.scale.setScalar(150);
    glow.position.copy(sunPos);
    const core = new THREE.Sprite(new THREE.SpriteMaterial(additive({ map: glowTex, color: '#ffffff' })));
    core.scale.setScalar(22);
    core.position.copy(sunPos);
    root.add(glow, core);
  }
  {
    const R = 46;
    const center = dirFrom(-0.8, -0.62).multiplyScalar(240).add(eye);
    const L = new THREE.Vector3().subVectors(sunPos, center).normalize();
    const planet = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 64), new THREE.ShaderMaterial({
      uniforms: { uL: { value: L }, uTime: { value: 0 } },
      vertexShader: `varying vec3 vN; varying vec3 vP; varying vec3 vW;
        void main() { vN = normalize(mat3(modelMatrix) * normal); vP = position; vW = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0); }`,
      fragmentShader: `varying vec3 vN; varying vec3 vP; varying vec3 vW; uniform vec3 uL; uniform float uTime;
        ${NOISE}
        void main() {
          vec3 p = normalize(vP);
          float lat = p.y;
          float turb = fbm(vec3(p.x * 3.0 + uTime * 0.01, lat * 14.0, p.z * 3.0)) - 0.5;
          float bands = sin((lat + turb * 0.08) * 34.0) * 0.5 + 0.5;
          vec3 c1 = vec3(0.86, 0.72, 0.52), c2 = vec3(0.62, 0.42, 0.30), c3 = vec3(0.95, 0.88, 0.74);
          vec3 col = mix(c2, c1, bands);
          col = mix(col, c3, smoothstep(0.55, 0.9, fbm(vec3(p * 6.0) + 3.0)) * 0.35);
          float storm = exp(-pow(length(vec2(atan(p.z, p.x) - 0.8, (lat + 0.22) * 3.0)) * 4.0, 2.0));
          col = mix(col, vec3(0.78, 0.36, 0.22), storm * 0.8);
          vec3 n = normalize(vN);
          float diff = smoothstep(-0.15, 0.6, dot(n, uL));
          vec3 v = normalize(cameraPosition - vW);
          float rim = pow(1.0 - max(dot(n, v), 0.0), 3.0);
          vec3 lit = col * diff * 1.05 + vec3(0.35, 0.55, 0.95) * rim * (0.25 + 0.6 * diff);
          gl_FragColor = vec4(lit, 1.0);
        }`,
    }));
    planet.position.copy(center);
    planet.rotation.z = 0.35;
    root.add(planet);
    const rings = new THREE.Mesh(new THREE.RingGeometry(R * 1.35, R * 2.35, 160, 1), new THREE.ShaderMaterial({
      uniforms: { uL: { value: L }, uR: { value: R }, uC: { value: center } },
      vertexShader: `varying vec3 vP; varying vec3 vW; void main() { vP = position; vW = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0); }`,
      fragmentShader: `varying vec3 vP; varying vec3 vW; uniform vec3 uL; uniform float uR; uniform vec3 uC;
        ${NOISE}
        void main() {
          float r = length(vP.xy) / uR;
          float bands = 0.55 + 0.45 * sin(r * 70.0) * sin(r * 23.0 + 1.3);
          float gap = smoothstep(0.0, 0.02, abs(r - 1.92)) ;
          float a = bands * gap * smoothstep(1.35, 1.42, r) * (1.0 - smoothstep(2.25, 2.35, r));
          // тень планеты на кольцах
          vec3 toC = uC - vW; float t = dot(toC, uL); float d = length(toC - uL * t);
          float shadow = (t > 0.0 && d < uR) ? 0.15 : 1.0;
          vec3 col = mix(vec3(0.75, 0.66, 0.52), vec3(0.95, 0.9, 0.8), noise(vec3(r * 40.0, 0.0, 0.0)));
          gl_FragColor = vec4(col * shadow * 0.9, a * 0.85);
        }`,
      transparent: true, side: THREE.DoubleSide, depthWrite: false,
    }));
    rings.position.copy(center);
    rings.lookAt(eye);
    rings.rotateX(1.18);
    rings.rotateY(0.25);
    root.add(rings);
    const atmo = new THREE.Sprite(new THREE.SpriteMaterial(additive({ map: glowTex, color: '#6f9cff', opacity: 0.18 })));
    atmo.position.copy(center);
    atmo.scale.setScalar(R * 3.2);
    root.add(atmo);
    animated.push((t) => { planet.material.uniforms.uTime.value = t; planet.rotation.y = t * 0.004; });
  }
  {
    const tex = canvasTexture(THREE, 256, (g, S) => {
      const c = S / 2;
      const rr = rng(77);
      for (let i = 0; i < 2600; i++) {
        const a = rr() * Math.PI * 2;
        const rad = S * (0.27 + (rr() + rr() + rr()) / 3 * 0.18);
        const x = c + Math.cos(a) * rad, y = c + Math.sin(a) * rad * 0.82;
        const inner = rad < S * 0.36;
        g.fillStyle = inner ? `rgba(110, 230, 220, ${0.05 + rr() * 0.08})` : `rgba(255, 90, 90, ${0.04 + rr() * 0.07})`;
        g.beginPath(); g.arc(x, y, 3 + rr() * 6, 0, Math.PI * 2); g.fill();
      }
      const grd = g.createRadialGradient(c, c, 0, c, c, S * 0.25);
      grd.addColorStop(0, 'rgba(150, 200, 255, 0.35)');
      grd.addColorStop(1, 'rgba(150, 200, 255, 0)');
      g.fillStyle = grd; g.fillRect(0, 0, S, S);
      g.fillStyle = 'rgba(255,255,255,0.95)'; g.beginPath(); g.arc(c, c, 2.2, 0, Math.PI * 2); g.fill();
    });
    const ringNeb = new THREE.Sprite(new THREE.SpriteMaterial(additive({ map: tex, opacity: 0.9 })));
    ringNeb.position.copy(dirFrom(2.9, 0.42).multiplyScalar(520).add(eye));
    ringNeb.scale.setScalar(95);
    root.add(ringNeb);
    animated.push((t, dt) => { ringNeb.material.rotation += dt * 0.004; });
  }

  // Затемнение фона внутри книги и главы, чтобы звёзды-стихи и текст не терялись.
  const dimmer = new THREE.Mesh(new THREE.SphereGeometry(1500, 32, 16), new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide, transparent: true, opacity: 0, depthWrite: false }));
  dimmer.position.copy(eye);
  dimmer.renderOrder = -10;
  scene.add(dimmer);
  let dimTarget = 0;

  let fadeTarget = 1;
  return {
    root,
    // mode: 'galaxy' | 'book' | 'chapter' — в главе пыль почти исчезает, чтобы не мешать чтению.
    setMode(mode) { fadeTarget = mode === 'chapter' ? 0.25 : 1; dimTarget = mode === 'galaxy' ? 0 : mode === 'book' ? 0.5 : 0.45; },
    update(t, dt, pxScale) {
      dustU.uTime.value = t;
      dustU.uScale.value = pxScale;
      dustU.uFade.value += (fadeTarget - dustU.uFade.value) * Math.min(1, dt * 2);
      const dm = dimmer.material;
      dm.opacity += (dimTarget - dm.opacity) * Math.min(1, dt * 2.5);
      dimmer.visible = dm.opacity > 0.01;
      for (const f of animated) f(t, dt);
    },
  };
}
