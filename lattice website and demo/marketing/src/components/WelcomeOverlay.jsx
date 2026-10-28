import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Building2, ArrowRight } from 'lucide-react';

export default function WelcomeOverlay() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf = 0;
    let w = 0, h = 0;
    const spacing = 28;
    const dots = [];
    const mouse = { x: -9999, y: -9999 };

    const build = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      dots.length = 0;
      const cols = Math.ceil(w / spacing) + 1;
      const rows = Math.ceil(h / spacing) + 1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          dots.push({
            ox: c * spacing,
            oy: r * spacing,
            x: c * spacing,
            y: r * spacing,
            vx: 0,
            vy: 0,
          });
        }
      }
    };
    build();

    const onResize = () => build();
    window.addEventListener('resize', onResize);

    const onMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const onLeave = () => { mouse.x = -9999; mouse.y = -9999; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);

    const animate = () => {
      ctx.clearRect(0, 0, w, h);
      const radius = 140;
      const strength = 0.35;
      for (const d of dots) {
        const dx = d.ox - mouse.x;
        const dy = d.oy - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let tx = d.ox;
        let ty = d.oy;
        if (dist < radius && dist > 0) {
          const force = (1 - dist / radius) * strength;
          tx = d.ox + (dx / dist) * force * radius * 0.6;
          ty = d.oy + (dy / dist) * force * radius * 0.6;
        }
        // spring back
        d.vx += (tx - d.x) * 0.12;
        d.vy += (ty - d.y) * 0.12;
        d.vx *= 0.78;
        d.vy *= 0.78;
        d.x += d.vx;
        d.y += d.vy;

        const alpha = isLight() ? 0.18 : 0.35;
        ctx.beginPath();
        ctx.arc(d.x, d.y, 1.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(225, 29, 72, ${alpha})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  const choose = (path) => {
    try { sessionStorage.setItem('lattice-audience', path); } catch (e) {}
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink px-5 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="relative z-10 max-w-4xl w-full text-center">
        <p className="text-[13px] font-bold text-brand-light uppercase tracking-[0.25em]">Lattice</p>
        <h1 className="mt-4 text-4xl md:text-6xl font-black tracking-tight text-white">
          Welcome to Lattice.
        </h1>
        <p className="mt-4 text-lg text-gray-400">What brings you here?</p>

        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <button
            onClick={() => choose('/home')}
            className="group rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur p-10 text-left hover:border-brand/40 hover:bg-white/[0.06] transition-all hover:-translate-y-1"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/15 text-brand-light mb-6">
              <Home className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-white">Home</h2>
            <p className="mt-2 text-gray-400">Explore Lattice for your home.</p>
            <div className="mt-6 inline-flex items-center gap-2 text-brand-light font-semibold text-[14px] group-hover:gap-3 transition-all">
              Enter <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          <button
            onClick={() => choose('/enterprise')}
            className="group rounded-3xl border border-brand/40 bg-gradient-to-b from-brand/15 to-white/[0.03] backdrop-blur p-10 text-left hover:border-brand/60 transition-all hover:-translate-y-1 shadow-glow"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/15 text-brand-light mb-6">
              <Building2 className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-white">Business & Enterprise</h2>
            <p className="mt-2 text-gray-400">Energy intelligence for commercial buildings and facilities.</p>
            <div className="mt-6 inline-flex items-center gap-2 text-brand-light font-semibold text-[14px] group-hover:gap-3 transition-all">
              Enter <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

function isLight() {
  return document.documentElement.classList.contains('light');
}