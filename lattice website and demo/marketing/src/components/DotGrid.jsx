import { useEffect, useState } from 'react';

export default function DotGrid() {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isLight, setIsLight] = useState(() => document.documentElement.classList.contains('light'));

  useEffect(() => {
    let raf = 0;
    const onMove = (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 20;
        const y = (e.clientY / window.innerHeight - 0.5) * 20;
        setOffset({ x, y });
      });
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    const obs = new MutationObserver(() => {
      setIsLight(document.documentElement.classList.contains('light'));
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      obs.disconnect();
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{
        backgroundColor: isLight ? '#FAFAFB' : '#0B0F19',
        backgroundImage: isLight
          ? 'radial-gradient(60rem 40rem at 85% -10%, rgba(225,29,72,0.06), transparent 60%)'
          : `radial-gradient(60rem 40rem at 85% -10%, rgba(225,29,72,0.14), transparent 60%), radial-gradient(50rem 35rem at -10% 30%, rgba(225,29,72,0.07), transparent 60%)`,
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: isLight
            ? `radial-gradient(circle, rgba(0,0,0,0.06) 1.1px, transparent 1.2px)`
            : `radial-gradient(circle, rgba(255,255,255,0.09) 1.1px, transparent 1.2px)`,
          backgroundSize: '28px 28px',
          backgroundPosition: `${offset.x}px ${offset.y}px`,
          maskImage: `radial-gradient(70% 60% at 50% 30%, black 60%, transparent 100%)`,
          WebkitMaskImage: `radial-gradient(70% 60% at 50% 30%, black 60%, transparent 100%)`,
          opacity: 0.9,
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: isLight
            ? `linear-gradient(rgba(0,0,0,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.6) 1px, transparent 1px)`
            : `linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)`,
          backgroundSize: '84px 84px',
          backgroundPosition: `${offset.x * 0.5}px ${offset.y * 0.5}px`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />
    </div>
  );
}