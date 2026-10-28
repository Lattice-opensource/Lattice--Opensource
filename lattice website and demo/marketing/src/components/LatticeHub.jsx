import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const h = (e) => setReduced(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  return reduced;
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setMobile(mq.matches);
    const h = (e) => setMobile(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  return mobile;
}

function smoothstep(a, b, x) {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

const PHASES = [
  { at: 0.0, label: 'Meet Lattice Hub' },
  { at: 0.15, label: 'The full device' },
  { at: 0.35, label: 'The display' },
  { at: 0.5, label: 'Connectivity and ports' },
  { at: 0.65, label: 'Exterior details' },
  { at: 0.8, label: 'Designed to connect' },
];

export default function LatticeHub() {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const phaseLabelRef = useRef(null);
  const progressRef = useRef(0);
  const reduced = useReducedMotion();
  const mobile = useIsMobile();
  const show3D = !reduced && !mobile;
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (reduced || mobile) return;
    const el = sectionRef.current;
    if (!el) return;
    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      const p = Math.max(0, Math.min(1, scrolled / Math.max(1, total)));
      progressRef.current = p;
      // update phase label
      if (phaseLabelRef.current) {
        let current = PHASES[0].label;
        for (const ph of PHASES) {
          if (p >= ph.at) current = ph.label;
        }
        phaseLabelRef.current.textContent = current;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [reduced, mobile]);

  useEffect(() => {
    if (!show3D) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    const scene = new THREE.Scene();
    const isLight = document.documentElement.classList.contains('light');
    scene.background = new THREE.Color(isLight ? '#FAFAFB' : '#0B0F19');
    scene.fog = new THREE.Fog(isLight ? '#FAFAFB' : '#0B0F19', 8, 22);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(4, 2.5, 6);

    // lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(5, 6, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x8899bb, 0.4);
    fill.position.set(-4, 2, -3);
    scene.add(fill);
    const rim = new THREE.PointLight(0xE11D48, 0.6, 30);
    rim.position.set(-3, 2, -4);
    scene.add(rim);

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.minPolarAngle = 0.2;
    controls.maxPolarAngle = Math.PI - 0.2;
    let manualMode = false;
    let manualTimer = null;
    const onDown = () => {
      manualMode = true;
      if (manualTimer) clearTimeout(manualTimer);
    };
    const onUp = () => {
      if (manualTimer) clearTimeout(manualTimer);
      manualTimer = setTimeout(() => { manualMode = false; }, 2000);
    };
    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);

    // device group
    const device = new THREE.Group();
    scene.add(device);

    const silverMat = new THREE.MeshStandardMaterial({
      color: 0xC8CDD6,
      metalness: 0.75,
      roughness: 0.28,
    });
    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x1A1A1E,
      metalness: 0.4,
      roughness: 0.5,
    });

    const loader = new STLLoader();
    let mesh = null;

    const loadModel = async () => {
      try {
        const geo = await loader.loadAsync('/models/assembly.stl');
        geo.computeVertexNormals();
        mesh = new THREE.Mesh(geo, silverMat.clone());
        const box = new THREE.Box3().setFromObject(mesh);
        const size = new THREE.Vector3();
        box.getSize(size);
        const center = new THREE.Vector3();
        box.getCenter(center);
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.5 / maxDim;
        mesh.scale.setScalar(scale);
        mesh.position.sub(center.clone().multiplyScalar(scale));
        device.add(mesh);
        setLoaded(true);
      } catch (e) {
        console.error('STL load error', e);
        setLoadError(true);
      }
    };
    loadModel();

    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const p = progressRef.current;

      if (!manualMode) {
        // Scene-driven rotation on ALL axes — tumble so every side is seen
        const r1 = smoothstep(0.0, 0.25, p);
        const r2 = smoothstep(0.2, 0.45, p);
        const r3 = smoothstep(0.4, 0.6, p);
        const r4 = smoothstep(0.55, 0.75, p);
        const r5 = smoothstep(0.7, 1.0, p);
        device.rotation.x = r1 * Math.PI * 0.6 + r2 * Math.PI * 0.8 + r4 * (-Math.PI * 0.5) + r5 * (-Math.PI * 0.3);
        device.rotation.y = r1 * Math.PI * 1.2 + r2 * Math.PI * 0.4 + r3 * Math.PI * 1.0 + r5 * Math.PI * 0.6;
        device.rotation.z = r2 * Math.PI * 0.7 + r3 * (-Math.PI * 0.9) + r4 * Math.PI * 0.6 + r5 * (-Math.PI * 0.4);

        // (no exploded view with single assembly model)

        // camera
        let camX, camY, camZ;
        if (p < 0.15) {
          // reveal: zoom in
          const t = smoothstep(0, 0.15, p);
          camX = 4 - t * 1;
          camY = 2.5 - t * 0.5;
          camZ = 8 - t * 2;
        } else if (p < 0.35) {
          camX = 3;
          camY = 2;
          camZ = 6;
        } else if (p < 0.5) {
          // display showcase: top-front closer
          const t = smoothstep(0.35, 0.5, p);
          camX = 3 - t * 1.5;
          camY = 2 + t * 1.5;
          camZ = 6 - t * 1.5;
        } else if (p < 0.65) {
          // ports: rear/side
          const t = smoothstep(0.5, 0.65, p);
          camX = 1.5 + t * 2;
          camY = 3.5 - t * 1;
          camZ = 4.5 + t * 1.5;
        } else if (p < 0.8) {
          // exploded: pull back
          const t = smoothstep(0.65, 0.8, p);
          camX = 3.5;
          camY = 2.5;
          camZ = 6 + t * 2;
        } else {
          // reassembly hero
          const t = smoothstep(0.8, 1.0, p);
          camX = 3.5 - t * 0.5;
          camY = 2.5 - t * 0.3;
          camZ = 8 - t * 2;
        }
        camera.position.x += (camX - camera.position.x) * 0.08;
        camera.position.y += (camY - camera.position.y) * 0.08;
        camera.position.z += (camZ - camera.position.z) * 0.08;
        camera.lookAt(0, 0, 0);
      } else {
        controls.update();
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      if (manualTimer) clearTimeout(manualTimer);
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
    };
  }, [show3D]);

  const height = reduced || mobile ? '120vh' : '300vh';

  return (
    <section id="hub" ref={sectionRef} className="relative" style={{ height }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="absolute inset-0 bg-ink" />
        <div className="relative z-10 h-full flex flex-col">
          <div className="pt-20 px-5 text-center">
            <p className="text-[13px] font-bold text-brand-light uppercase tracking-[0.2em]">Lattice Hub</p>
            <h2 className="mt-3 text-3xl md:text-5xl font-black tracking-tight text-white">
              Meet Lattice Hub
            </h2>
            <p ref={phaseLabelRef} className="mt-3 text-brand-light font-semibold text-[14px] uppercase tracking-wider">
              Meet Lattice Hub
            </p>
            <p className="mt-2 text-gray-400 max-w-2xl mx-auto text-[14px]">
              The physical hardware at the heart of the Lattice energy platform. Drag to inspect.
            </p>
          </div>

          <div className="flex-1 relative">
            {show3D ? (
              <>
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
                {!loaded && !loadError && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                    Loading Lattice Hub&hellip;
                  </div>
                )}
                {loadError && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                    Lattice Hub preview unavailable.
                  </div>
                )}
              </>
            ) : (
              <Fallback2D />
            )}
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[11px] text-gray-500 uppercase tracking-widest">
            Scroll to explore
          </div>
        </div>
      </div>
    </section>
  );
}

function Fallback2D() {
  return (
    <div className="absolute inset-0 flex items-center justify-center px-5">
      <div className="max-w-md text-center">
        <div className="mx-auto w-40 h-40 rounded-full border-2 border-brand/40 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-brand/20 flex items-center justify-center">
            <span className="text-brand-light font-black">HUB</span>
          </div>
        </div>
        <p className="mt-6 text-gray-400 text-sm">
          Lattice Hub connects facilities, systems and sensors into one centralized layer.
        </p>
      </div>
    </div>
  );
}