/* Procedural Three.js ocean wave surface and mouse-reactive particles for the Hero section. */
import * as THREE from 'three';

const canvas = document.querySelector('#hero-canvas');
const hero = document.querySelector('.hero');

if (canvas && hero && window.WebGLRenderingContext) {
  try {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 760;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
    camera.position.set(0, 2.3, 6.2);
    camera.lookAt(0, -0.25, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !isMobile, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.75));
    renderer.setClearColor(0x000000, 0);

    // Procedural wireframe + point crest wave plane
    const segX = isMobile ? 34 : 68;
    const segY = isMobile ? 24 : 48;
    const waveGeo = new THREE.PlaneGeometry(13, 8.5, segX, segY);
    waveGeo.rotateX(-Math.PI * 0.44);

    const posAttr = waveGeo.attributes.position;
    const basePositions = new Float32Array(posAttr.array.length);
    basePositions.set(posAttr.array);

    const waveMat = new THREE.MeshBasicMaterial({
      color: 0x82cde5,
      wireframe: true,
      transparent: true,
      opacity: 0.22
    });
    const waveMesh = new THREE.Mesh(waveGeo, waveMat);
    waveMesh.position.set(0.7, -0.55, -0.6);
    scene.add(waveMesh);

    // Secondary crimson crest particles riding the water surface
    const crestMat = new THREE.PointsMaterial({
      color: 0xe4002b,
      size: isMobile ? 0.042 : 0.036,
      transparent: true,
      opacity: 0.55
    });
    const crestPoints = new THREE.Points(waveGeo, crestMat);
    crestPoints.position.copy(waveMesh.position);
    scene.add(crestPoints);

    // Ambient floating water droplets
    const dropletCount = isMobile ? 48 : 130;
    const dropletPositions = new Float32Array(dropletCount * 3);
    const dropletSeeds = new Float32Array(dropletCount);
    for (let i = 0; i < dropletCount; i += 1) {
      dropletPositions[i * 3] = (Math.random() - 0.5) * 10;
      dropletPositions[i * 3 + 1] = Math.random() * 3.4 - 0.8;
      dropletPositions[i * 3 + 2] = (Math.random() - 0.5) * 5.5;
      dropletSeeds[i] = Math.random() * Math.PI * 2;
    }
    const dropletGeo = new THREE.BufferGeometry();
    dropletGeo.setAttribute('position', new THREE.BufferAttribute(dropletPositions, 3));
    const droplets = new THREE.Points(
      dropletGeo,
      new THREE.PointsMaterial({ color: 0xbfe9f5, size: 0.04, transparent: true, opacity: 0.55 })
    );
    scene.add(droplets);

    const pointer = new THREE.Vector2(0, 0);
    const smoothPointer = new THREE.Vector2(0, 0);
    let visible = true;

    hero.addEventListener('pointermove', (e) => {
      const rect = hero.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }, { passive: true });

    hero.addEventListener('pointerleave', () => {
      pointer.set(0, 0);
    });

    function resize() {
      const width = Math.max(1, canvas.clientWidth || hero.clientWidth);
      const height = Math.max(1, canvas.clientHeight || hero.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    }

    function updateWaves(t) {
      const arr = posAttr.array;
      for (let i = 0; i < arr.length; i += 3) {
        const bx = basePositions[i];
        const bz = basePositions[i + 2];
        const wave1 = Math.sin(bx * 0.68 + t * 1.15) * 0.28;
        const wave2 = Math.cos(bz * 0.85 - t * 0.9) * 0.22;
        const ripple = Math.sin((bx - smoothPointer.x * 3.0) * 0.9 + (bz + smoothPointer.y * 2.0) * 0.9 - t * 1.8) * 0.14;
        arr[i + 1] = basePositions[i + 1] + wave1 + wave2 + ripple;
      }
      posAttr.needsUpdate = true;

      const dArr = dropletGeo.attributes.position.array;
      for (let i = 0; i < dropletCount; i += 1) {
        const seed = dropletSeeds[i];
        dArr[i * 3 + 1] += Math.sin(t * 1.4 + seed) * 0.0025;
      }
      dropletGeo.attributes.position.needsUpdate = true;
    }

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!reducedMotion) {
        renderer.setAnimationLoop(visible ? animate : null);
      }
    }, { threshold: 0.01 });
    observer.observe(hero);

    function animate(now) {
      const t = now * 0.001;
      smoothPointer.lerp(pointer, 0.055);
      updateWaves(t);

      waveMesh.rotation.y = smoothPointer.x * 0.12 - 0.18;
      waveMesh.rotation.z = smoothPointer.y * 0.06;
      crestPoints.rotation.copy(waveMesh.rotation);
      droplets.rotation.y = smoothPointer.x * 0.18 + t * 0.03;
      droplets.rotation.x = smoothPointer.y * 0.08;

      renderer.render(scene, camera);
    }

    resize();
    updateWaves(0.5);
    renderer.render(scene, camera);
    window.addEventListener('resize', resize, { passive: true });
    if (!reducedMotion) renderer.setAnimationLoop(animate);
  } catch (err) {
    console.warn('Hero 3D water scene fallback active.', err);
  }
}
