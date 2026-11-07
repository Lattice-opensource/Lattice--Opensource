import { useEffect, useRef, useState } from 'react';

export default function CustomCursor() {
  const cursorRef = useRef(null);
  const pos = useRef({ x: -200, y: -200 });
  const target = useRef({ x: -200, y: -200 });
  const [hovering, setHovering] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    // disable on touch devices
    const touch = window.matchMedia('(hover: none), (pointer: coarse)').matches || 'ontouchstart' in window;
    if (touch) {
      setIsTouch(true);
      return;
    }

    const onMove = (e) => {
      target.current = { x: e.clientX, y: e.clientY };
      if (!visible) setVisible(true);
    };
    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    // hover detection for interactive elements
    const updateHover = () => {
      const els = document.querySelectorAll('a, button, [role="button"], .hover-trigger');
      const enter = () => setHovering(true);
      const leave = () => setHovering(false);
      els.forEach((el) => {
        el.addEventListener('mouseenter', enter);
        el.addEventListener('mouseleave', leave);
      });
      return () => {
        els.forEach((el) => {
          el.removeEventListener('mouseenter', enter);
          el.removeEventListener('mouseleave', leave);
        });
      };
    };

    let cleanupHover = updateHover();
    // re-scan when DOM mutates (SPA)
    const obs = new MutationObserver(() => {
      cleanupHover?.();
      cleanupHover = updateHover();
    });
    obs.observe(document.body, { childList: true, subtree: true });

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);

    let raf = 0;
    const animate = () => {
      // lerp for buttery follow
      pos.current.x += (target.current.x - pos.current.x) * 0.14;
      pos.current.y += (target.current.y - pos.current.y) * 0.14;
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
      obs.disconnect();
      cleanupHover?.();
    };
  }, [visible]);

  if (isTouch) return null;

  const size = hovering ? 380 : 320; // grows on hover for playful feedback
  const color = hovering ? '#E11D48' : '#DFFF00'; // brand magenta on hover, lime default (like reference image)
  const gridColor = hovering ? 'rgba(225,29,72,0.55)' : 'rgba(223,255,0,0.42)';

  return (
    <div
      ref={cursorRef}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[9999] hidden md:block"
      style={{
        width: size,
        height: size,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.22s ease, width 0.22s ease, height 0.22s ease',
        willChange: 'transform',
      }}
    >
      {/* Outer circle */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          border: `1px solid ${color}`,
          boxShadow: hovering
            ? `0 0 24px rgba(225,29,72,0.35), inset 0 0 18px rgba(225,29,72,0.12)`
            : `0 0 22px rgba(223,255,0,0.28), inset 0 0 16px rgba(223,255,0,0.10)`,
          transition: 'border-color 0.22s ease, box-shadow 0.22s ease',
        }}
      />

      {/* Grid inside circle — clipped */}
      <div
        className="absolute inset-[10px] rounded-full overflow-hidden"
        style={{
          backgroundImage: `
            linear-gradient(${gridColor} 1px, transparent 1px),
            linear-gradient(90deg, ${gridColor} 1px, transparent 1px)
          `,
          backgroundSize: '28px 28px',
          backgroundPosition: 'center',
          opacity: hovering ? 0.42 : 0.38,
          transition: 'opacity 0.22s ease',
        }}
      >
        {/* fade center to keep crosshair legible */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle at center, transparent 18%, rgba(11,15,25,0.55) 72%)`,
          }}
        />
      </div>

      {/* Crosshair lines (span entire circle) */}
      <div
        className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2"
        style={{ background: color, opacity: 0.95 }}
      />
      <div
        className="absolute top-1/2 left-0 right-0 h-px -translate-y-1/2"
        style={{ background: color, opacity: 0.95 }}
      />

      {/* Inner concentric circles */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: 46,
          height: 46,
          border: `1.5px solid ${color}`,
          boxShadow: `0 0 10px ${color}55`,
          transition: 'border-color 0.22s ease',
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: 30,
          height: 30,
          border: `1px solid ${color}`,
          opacity: 0.9,
        }}
      />

      {/* Center dot */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: 9,
          height: 9,
          background: color,
          boxShadow: `0 0 10px ${color}, 0 0 18px ${color}99`,
          transition: 'background 0.22s ease',
        }}
      />

      {/* tiny tick marks on crosshair ends — like reference */}
      <div className="absolute left-1/2 top-2 w-2 h-[3px] -translate-x-1/2" style={{ background: color }} />
      <div className="absolute left-1/2 bottom-2 w-2 h-[3px] -translate-x-1/2" style={{ background: color }} />
      <div className="absolute top-1/2 left-2 h-2 w-[3px] -translate-y-1/2" style={{ background: color }} />
      <div className="absolute top-1/2 right-2 h-2 w-[3px] -translate-y-1/2" style={{ background: color }} />
    </div>
  );
}
