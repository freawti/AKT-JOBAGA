/* Load the licensed road-bike GLB; keep a procedural Three.js fallback. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const wrap = document.querySelector('.bike-canvas-wrap');
const canvas = document.querySelector('#bike-canvas');
const showcase = document.querySelector('#bike-showcase');
if (!wrap || !canvas || !showcase || !window.WebGLRenderingContext) {
  showcase?.classList.add('bike-fallback');
} else {
  try {
    showcase.dataset.bikeModel = 'loading';
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 40);
    camera.position.set(0, 0.52, 7.4);
    camera.lookAt(0, 0.08, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);

    scene.add(new THREE.HemisphereLight(0xc6efff, 0x17191d, 2.0));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
    keyLight.position.set(-2.5, 4, 5);
    scene.add(keyLight);
    const redLight = new THREE.PointLight(0xe4002b, 8, 6);
    redLight.position.set(2.4, 0.5, 1.4);
    scene.add(redLight);

    const bike = new THREE.Group();
    bike.position.set(0, -0.15, 0);
    scene.add(bike);

    const tireMaterial = new THREE.MeshStandardMaterial({ color: 0x171a1d, roughness: 0.52, metalness: 0.18 });
    const rimMaterial = new THREE.MeshStandardMaterial({ color: 0x9caab0, roughness: 0.28, metalness: 0.78 });
    const spokeMaterial = new THREE.MeshStandardMaterial({ color: 0x596970, roughness: 0.38, metalness: 0.68 });
    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0xe4002b, roughness: 0.25, metalness: 0.52, emissive: 0x4a0010, emissiveIntensity: 0.36 });
    const darkMetal = new THREE.MeshStandardMaterial({ color: 0x252a2e, roughness: 0.34, metalness: 0.78 });
    const rubber = new THREE.MeshStandardMaterial({ color: 0x08090a, roughness: 0.8 });

    const wheelRadius = 0.78;
    const wheelBase = 1.48;
    const rear = new THREE.Vector3(-wheelBase, -0.35, 0);
    const front = new THREE.Vector3(wheelBase, -0.35, 0);
    const crank = new THREE.Vector3(-0.03, -0.35, 0.08);
    const seat = new THREE.Vector3(-0.53, 0.53, 0.07);
    const headTop = new THREE.Vector3(0.67, 0.49, 0.06);
    const headBottom = new THREE.Vector3(0.85, 0.03, 0.05);
    const wheelPivots = [];

    function addTube(start, end, radius, material, parent = bike) {
      const curve = new THREE.LineCurve3(start, end);
      const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 1, radius, 6, false), material);
      parent.add(mesh);
      return mesh;
    }
    function addCylinderBetween(start, end, radius, material, parent = bike, sides = 6) {
      const direction = new THREE.Vector3().subVectors(end, start);
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), sides), material);
      mesh.position.copy(start).add(end).multiplyScalar(0.5);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
      parent.add(mesh);
      return mesh;
    }

    function makeWheel(x, y) {
      const pivot = new THREE.Group();
      pivot.position.set(x, y, 0);
      bike.add(pivot);
      wheelPivots.push(pivot);

      const tire = new THREE.Mesh(new THREE.TorusGeometry(wheelRadius, 0.042, 7, 48), tireMaterial);
      pivot.add(tire);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(wheelRadius - 0.065, 0.012, 5, 48), rimMaterial);
      pivot.add(rim);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.16, 10), darkMetal);
      hub.rotation.x = Math.PI / 2;
      pivot.add(hub);

      const count = window.innerWidth < 760 ? 12 : 18;
      for (let index = 0; index < count; index += 1) {
        const angle = index / count * Math.PI * 2;
        const outer = new THREE.Vector3(Math.cos(angle) * (wheelRadius - 0.055), Math.sin(angle) * (wheelRadius - 0.055), 0);
        const inner = new THREE.Vector3(Math.cos(angle + 0.22) * 0.055, Math.sin(angle + 0.22) * 0.055, 0);
        addCylinderBetween(inner, outer, 0.006, spokeMaterial, pivot, 4);
      }

      // Machined braking rotor with slots and a bright outer braking track.
      const rotor = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.009, 4, 32), rimMaterial);
      rotor.position.z = 0.105;
      pivot.add(rotor);
      for (let index = 0; index < 10; index += 1) {
        const angle = index / 10 * Math.PI * 2;
        const slot = new THREE.Mesh(new THREE.SphereGeometry(0.018, 5, 4), rubber);
        slot.position.set(Math.cos(angle) * 0.245, Math.sin(angle) * 0.245, 0.114);
        pivot.add(slot);
      }
      const sidewall = new THREE.Mesh(new THREE.TorusGeometry(wheelRadius - 0.115, 0.006, 4, 48), spokeMaterial);
      sidewall.position.z = 0.012;
      pivot.add(sidewall);
      const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.11, 5), rimMaterial);
      const valveAngle = Math.PI * 0.24;
      valve.position.set(Math.cos(valveAngle) * (wheelRadius - 0.06), Math.sin(valveAngle) * (wheelRadius - 0.06), 0.015);
      valve.rotation.z = valveAngle - Math.PI / 2;
      pivot.add(valve);
      return pivot;
    }

    makeWheel(rear.x, rear.y);
    makeWheel(front.x, front.y);

    // Frame triangle and fork.
    addTube(rear, crank, 0.036, frameMaterial);
    addTube(crank, seat, 0.036, frameMaterial);
    addTube(seat, rear, 0.036, frameMaterial);
    addTube(seat, headTop, 0.036, frameMaterial);
    addTube(headTop, crank, 0.036, frameMaterial);
    addTube(headTop, headBottom, 0.052, darkMetal);
    addTube(headBottom, front, 0.032, frameMaterial);

    // Seat post and compact aero bar.
    addTube(seat, new THREE.Vector3(-0.63, 0.91, 0.08), 0.024, darkMetal);
    addTube(new THREE.Vector3(-0.84, 0.94, 0.08), new THREE.Vector3(-0.42, 0.94, 0.08), 0.045, rubber);
    addTube(headTop, new THREE.Vector3(0.86, 0.78, 0.08), 0.025, darkMetal);
    addTube(new THREE.Vector3(0.72, 0.8, 0.08), new THREE.Vector3(1.05, 0.8, 0.08), 0.025, darkMetal);
    addTube(new THREE.Vector3(1.05, 0.8, 0.08), new THREE.Vector3(1.12, 0.68, 0.08), 0.023, darkMetal);
    addTube(new THREE.Vector3(0.74, 0.8, 0.08), new THREE.Vector3(0.68, 0.68, 0.08), 0.023, darkMetal);

    // Crank arms, chainring, and a hint of the chain line.
    const crankGroup = new THREE.Group();
    crankGroup.position.copy(crank);
    bike.add(crankGroup);
    const chainring = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.012, 5, 24), rimMaterial);
    crankGroup.add(chainring);
    addTube(new THREE.Vector3(0, 0, 0.04), new THREE.Vector3(0.32, -0.18, 0.04), 0.026, darkMetal, crankGroup);
    addTube(new THREE.Vector3(0, 0, 0.04), new THREE.Vector3(-0.31, 0.19, 0.04), 0.026, darkMetal, crankGroup);
    addTube(new THREE.Vector3(0.22, -0.21, 0.04), new THREE.Vector3(0.42, -0.21, 0.04), 0.026, rubber, crankGroup);
    addTube(new THREE.Vector3(-0.42, 0.22, 0.04), new THREE.Vector3(-0.2, 0.22, 0.04), 0.026, rubber, crankGroup);
    addTube(new THREE.Vector3(-1.47, -0.24, -0.15), new THREE.Vector3(0.02, -0.24, -0.15), 0.012, darkMetal);
    addTube(new THREE.Vector3(-1.47, -0.46, -0.15), new THREE.Vector3(0.02, -0.46, -0.15), 0.012, darkMetal);

    // Rear cassette, front chainring, brake calipers, and a shaped bottle.
    for (const radius of [0.1, 0.145, 0.19]) {
      const cog = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.009, 4, 24), rimMaterial);
      cog.position.set(rear.x, rear.y, -0.11);
      bike.add(cog);
    }
    const rearBrake = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.09, 0.12), darkMetal);
    rearBrake.position.set(-1.32, 0.48, 0.11);
    bike.add(rearBrake);
    const frontBrake = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.09, 0.12), darkMetal);
    frontBrake.position.set(1.38, 0.47, 0.11);
    bike.add(frontBrake);
    const bottleMaterial = new THREE.MeshStandardMaterial({ color: 0xc7e6ec, roughness: 0.22, metalness: 0.25, emissive: 0x15343d, emissiveIntensity: 0.5 });
    const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.37, 8), bottleMaterial);
    bottle.position.set(-0.23, 0.12, 0.18);
    bottle.rotation.z = 0.42;
    bike.add(bottle);
    const bottleCap = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.07, 8), rubber);
    bottleCap.position.set(-0.3, 0.29, 0.18);
    bottleCap.rotation.z = 0.42;
    bike.add(bottleCap);
    addTube(new THREE.Vector3(-0.4, -0.03, 0.22), new THREE.Vector3(-0.07, 0.25, 0.22), 0.012, rimMaterial);
    addTube(new THREE.Vector3(-0.45, 0.25, 0.22), new THREE.Vector3(-0.02, -0.07, 0.22), 0.012, rimMaterial);

    // Textured saddle and bar tape create readable parts at the small canvas scale.
    const saddle = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.32, 3, 8), rubber);
    saddle.position.set(-0.63, 0.97, 0.09);
    saddle.rotation.z = Math.PI / 2;
    bike.add(saddle);
    const barPad = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.08, 0.15), rubber);
    barPad.position.set(0.87, 0.8, 0.1);
    barPad.rotation.z = -0.15;
    bike.add(barPad);

    const particlePositions = new Float32Array(36 * 3);
    for (let i = 0; i < 36; i += 1) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 5.8;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 2.7;
      particlePositions[i * 3 + 2] = -0.8 - Math.random() * 1.7;
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({ color: 0x82cde5, size: 0.018, transparent: true, opacity: 0.6 }));
    scene.add(particles);

    const pointer = new THREE.Vector2();
    const targetTilt = new THREE.Vector2();
    let hovered = false;
    let wheelSpeed = 0.12;
    let targetWheelSpeed = 0.12;
    let scrollProgress = 0;
    let frame = 0;
    let visible = true;
    let activeBike = bike;
    let detailedWheels = [];
    let detailedCrank = null;
    let hasDetailedModel = false;

    // Local GLB includes full drivetrain, rim-brake levers, spokes and moving parts.
    const loader = new GLTFLoader();
    loader.load('./assets/models/road-bike.glb', (gltf) => {
      const model = gltf.scene;
      const bounds = new THREE.Box3().setFromObject(model);
      const center = bounds.getCenter(new THREE.Vector3());
      model.position.sub(center);
      model.traverse((part) => {
        if (!part.isMesh) return;
        part.castShadow = true;
        part.receiveShadow = true;
        if (part.material && 'envMapIntensity' in part.material) part.material.envMapIntensity = 1.25;
      });
      const rig = new THREE.Group();
      rig.scale.setScalar(window.innerWidth < 760 ? 2.12 : 2.42);
      rig.add(model);
      rig.position.set(0, 0, 0);
      scene.remove(bike);
      scene.add(rig);
      activeBike = rig;
      detailedWheels = ['Front_Wheel', 'Rear_Wheel'].map((name) => model.getObjectByName(name)).filter(Boolean);
      detailedCrank = model.getObjectByName('Crank');
      hasDetailedModel = detailedWheels.length > 0;
      showcase.dataset.bikeModel = hasDetailedModel ? 'road-bike-glb' : 'procedural-fallback';
      if (!detailedCrank) console.info('Road bike loaded; its crank node was not found.');
      resize();
    }, undefined, (error) => {
      showcase.dataset.bikeModel = 'procedural-fallback';
      console.warn('Using the procedural road-bike fallback because the local GLB could not load.', error);
    });

    function resize() {
      const width = Math.max(1, wrap.clientWidth);
      const height = Math.max(1, wrap.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      if (hasDetailedModel) {
        camera.position.set(width < 600 ? 5.65 : 5.2, width < 600 ? 1.8 : 1.55, 0.65);
        camera.lookAt(0, 0, 0);
        camera.fov = width < 600 ? 40 : 35;
      } else {
        camera.position.set(0, 0.52, width < 600 ? 8.2 : 7.4);
        camera.lookAt(0, 0.08, 0);
        camera.fov = width < 600 ? 41 : 35;
      }
      camera.updateProjectionMatrix();
      render();
    }
    function render() {
      renderer.render(scene, camera);
      showcase.dataset.drawCalls = String(renderer.info.render.calls);
    }

    wrap.addEventListener('pointerenter', () => {
      hovered = true;
      targetWheelSpeed = 8 + scrollProgress * 4;
      showcase.classList.add('is-hovering');
    });
    wrap.addEventListener('pointerleave', () => {
      hovered = false;
      targetWheelSpeed = 0.12 + scrollProgress * 1.6;
      showcase.classList.remove('is-hovering');
      targetTilt.set(0, 0);
    });
    wrap.addEventListener('pointermove', (event) => {
      const bounds = wrap.getBoundingClientRect();
      pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -((event.clientY - bounds.top) / bounds.height * 2 - 1));
      targetTilt.set(pointer.y * 0.1, pointer.x * 0.13);
      if (reducedMotion) { activeBike.rotation.y = targetTilt.y; render(); }
    });

    // Scrolling through the 180 km stage changes the model's lean and wheel pace.
    if (window.gsap && window.ScrollTrigger && !reducedMotion) {
      window.ScrollTrigger.create({
        trigger: '.bike-showcase', start: 'top bottom', end: 'bottom top',
        onUpdate: (self) => {
          scrollProgress = self.progress;
          activeBike.rotation.z = THREE.MathUtils.lerp(-0.025, 0.025, scrollProgress);
          targetWheelSpeed = hovered ? 8 + scrollProgress * 4 : 0.12 + scrollProgress * 1.6;
        }
      });
    } else {
      window.addEventListener('scroll', () => {
        const bounds = showcase.getBoundingClientRect();
        const progress = THREE.MathUtils.clamp((window.innerHeight - bounds.top) / (window.innerHeight + bounds.height), 0, 1);
        if (!reducedMotion) {
          scrollProgress = progress;
          activeBike.rotation.z = THREE.MathUtils.lerp(-0.025, 0.025, progress);
          targetWheelSpeed = hovered ? 8 + progress * 4 : 0.12 + progress;
        }
      }, { passive: true });
    }

    const motionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      renderer.setAnimationLoop(visible && !reducedMotion ? animate : null);
      if (visible && reducedMotion) render();
    }, { threshold: 0.01 });
    motionObserver.observe(wrap);

    function animate(time) {
      const delta = Math.min(0.04, (time - (frame || time)) / 1000);
      frame = time;
      wheelSpeed = THREE.MathUtils.lerp(wheelSpeed, targetWheelSpeed, Math.min(1, delta * 4));
      if (hasDetailedModel) {
        detailedWheels.forEach((wheel) => { wheel.rotation.x -= delta * wheelSpeed; });
        if (detailedCrank) detailedCrank.rotation.x += delta * wheelSpeed * 0.42;
      } else {
        wheelPivots.forEach((wheel) => { wheel.rotation.z -= delta * wheelSpeed; });
        crankGroup.rotation.z -= delta * wheelSpeed * 1.25;
      }
      activeBike.rotation.y = THREE.MathUtils.lerp(activeBike.rotation.y, targetTilt.y + (hovered ? 0.035 : 0), Math.min(1, delta * 3));
      activeBike.rotation.x = THREE.MathUtils.lerp(activeBike.rotation.x, targetTilt.x, Math.min(1, delta * 3));
      activeBike.position.y = (hasDetailedModel ? 0 : -0.15) + Math.sin(time * 0.0008) * (hovered ? 0.045 : 0.018);
      redLight.intensity = hovered ? 14 : 8;
      particles.rotation.z += delta * (hovered ? 0.08 : 0.015);
      render();
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });
    if (!reducedMotion) renderer.setAnimationLoop(animate);
  } catch (error) {
    console.warn('Bike scene could not start; leaving the styled fallback in place.', error);
    showcase.classList.add('bike-fallback');
  }
}
