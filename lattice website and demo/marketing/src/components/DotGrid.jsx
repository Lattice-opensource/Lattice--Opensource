import { useEffect, useState } from 'react';

export default function DotGrid() {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let raf = 0;
    const onMove = (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        // subtle parallax: shift grid 1% of mouse pos
        const x = (e.clientX / window.innerWidth - 0.5) * 20;
        const y = (e.clientY / window.innerHeight - 0.5) * 20;
        setOffset({ x, y });
      });
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{
        backgroundColor: '#0B0F19',
        backgroundImage: `
          radial-gradient(60rem 40rem at 85% -10%, rgba(225,29,72,0.14), transparent 60%),
          radial-gradient(50rem 35rem at -10% 30%, rgba(225,29,72,0.07), transparent 60%)
        `,
      }}
    >
      {/* Dotted grid layer */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.09) 1.1px, transparent 1.2px)`,
          backgroundSize: '28px 28px',
          backgroundPosition: `${offset.x}px ${offset.y}px`,
          maskImage: `radial-gradient(70% 60% at 50% 30%, black 60%, transparent 100%)`,
          WebkitMaskImage: `radial-gradient(70% 60% at 50% 30%, black 60%, transparent 100%)`,
          opacity: 0.9,
        }}
      />
      {/* faint larger grid for playful depth */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)
          `,
          backgroundSize: '84px 84px',
          backgroundPosition: `${offset.x * 0.5}px ${offset.y * 0.5}px`,
        }}
      />
      {/* subtle vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />
    </div>
  );
}
