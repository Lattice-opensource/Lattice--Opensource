import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const beats = [
  {
    title: 'Electricity is used across\ndifferent areas and circuits.',
    body: 'A commercial building draws power through dozens of circuits — HVAC, lighting, server rooms, pumps, elevators. Most of it is invisible until the bill arrives.',
    accent: '01',
  },
  {
    title: 'Lattice helps facilities teams\nsee where electricity is consumed.',
    body: 'A single, trusted view of every floor, zone and circuit — live kW and ₹ cost, updated as it happens.',
    accent: '02',
  },
  {
    title: 'The dashboard helps identify\nunusual usage.',
    body: 'Spikes, after-hours waste and short-cycling equipment surface automatically, ranked by impact.',
    accent: '03',
  },
  {
    title: 'Usage insights help teams\ninvestigate and act.',
    body: 'Drill from building to floor to circuit, then make informed operational decisions before the next bill.',
    accent: '04',
  },
];

export default function ScrollStory() {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const visualRef = useRef(null);
  const beatRefs = useRef([]);
  const kpiRef = useRef(null);
  const chartRef = useRef(null);
  const alertRef = useRef(null);
  const glowRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobile = window.matchMedia('(max-width: 768px)').matches;

    const ctx = gsap.context(() => {
      if (reduced || mobile) {
        beatRefs.current.forEach((b) => { if (b) gsap.set(b, { opacity: 1, y: 0 }); });
        if (kpiRef.current) gsap.set(kpiRef.current, { opacity: 1 });
        if (chartRef.current) gsap.set(chartRef.current, { opacity: 1 });
        if (alertRef.current) gsap.set(alertRef.current, { opacity: 1 });
        if (visualRef.current) gsap.set(visualRef.current, { opacity: 1, scale: 1, y: 0, rotationX: 0, rotationY: 0 });
        if (glowRef.current) gsap.set(glowRef.current, { opacity: 0.6 });
        return;
      }

      // Initial states
      beatRefs.current.forEach((b, i) => {
        if (b) gsap.set(b, { opacity: i === 0 ? 1 : 0, y: i === 0 ? 0 : 60 });
      });
      if (kpiRef.current) gsap.set(kpiRef.current, { opacity: 0.15, y: 20 });
      if (chartRef.current) gsap.set(chartRef.current, { opacity: 0.15, y: 20 });
      if (alertRef.current) gsap.set(alertRef.current, { opacity: 0.15, y: 20 });
      if (visualRef.current) gsap.set(visualRef.current, { opacity: 0.6, scale: 0.85, y: 40, rotationX: 8, rotationY: -5 });
      if (glowRef.current) gsap.set(glowRef.current, { opacity: 0.2, scale: 0.8 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=400%',
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // Visual entrance: scale up, rotate to front, glow intensifies
      tl.to(visualRef.current, {
        opacity: 1, scale: 1, y: 0, rotationX: 0, rotationY: 0,
        duration: 0.3, ease: 'power2.out',
      }, 0);
      tl.to(glowRef.current, { opacity: 0.7, scale: 1.2, duration: 0.3, ease: 'power2.out' }, 0);

      // Beat 0 -> 1
      tl.to(beatRefs.current[0], { opacity: 0, y: -40, duration: 0.2, ease: 'power2.in' }, 0.22)
        .to(beatRefs.current[1], { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' }, 0.28)
        .to(kpiRef.current, { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' }, 0.3);

      // Beat 1 -> 2
      tl.to(beatRefs.current[1], { opacity: 0, y: -40, duration: 0.2, ease: 'power2.in' }, 0.5)
        .to(beatRefs.current[2], { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' }, 0.55)
        .to(chartRef.current, { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' }, 0.55)
        .to(visualRef.current, { rotationY: 3, duration: 0.25, ease: 'power1.inOut' }, 0.5);

      // Beat 2 -> 3
      tl.to(beatRefs.current[2], { opacity: 0, y: -40, duration: 0.2, ease: 'power2.in' }, 0.78)
        .to(beatRefs.current[3], { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' }, 0.83)
        .to(alertRef.current, { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' }, 0.83)
        .to(visualRef.current, { rotationY: -2, rotationX: -2, duration: 0.25, ease: 'power1.inOut' }, 0.78);

      // Final pull-back
      tl.to(visualRef.current, { scale: 0.9, opacity: 0.7, y: 30, rotationX: 0, rotationY: 0, duration: 0.2, ease: 'power2.in' }, 0.95);
      tl.to(glowRef.current, { opacity: 0.3, scale: 1, duration: 0.2, ease: 'power2.in' }, 0.95);
    }, section);

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', refresh);
    const t = setTimeout(refresh, 400);

    return () => {
      window.removeEventListener('load', refresh);
      clearTimeout(t);
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative"
      style={{ height: '450vh', perspective: '1200px' }}
    >
      <div className="sticky top-0 h-screen overflow-hidden flex items-center">
        {/* Ambient glow behind the visual */}
        <div
          ref={glowRef}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(225,29,72,0.18) 0%, transparent 65%)',
            filter: 'blur(40px)',
          }}
        />

        <div className="max-w-7xl mx-auto w-full px-5 grid lg:grid-cols-2 gap-12 items-center relative z-10">
          {/* Text column */}
          <div className="relative min-h-[300px]">
            {beats.map((b, i) => (
              <div
                key={i}
                ref={(el) => (beatRefs.current[i] = el)}
                className="absolute inset-0 flex flex-col justify-center"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[48px] font-black text-white/10 leading-none">{b.accent}</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-brand/40 to-transparent" />
                </div>
                <h3 className="text-2xl md:text-4xl font-black tracking-tight text-white leading-[1.1] whitespace-pre-line">
                  {b.title}
                </h3>
                <p className="mt-5 text-gray-400 leading-relaxed max-w-md text-[15px]">
                  {b.body}
                </p>
              </div>
            ))}
          </div>

          {/* Visual column */}
          <div
            ref={visualRef}
            className="relative"
            style={{ transformStyle: 'preserve-3d', willChange: 'transform, opacity' }}
          >
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-glow backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <p className="text-[12px] text-gray-500 uppercase tracking-wider">Lattice Tower — Bengaluru</p>
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[12px] font-bold text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
                </span>
              </div>
              <div ref={kpiRef} className="mt-4 grid grid-cols-3 gap-3" style={{ willChange: 'opacity, transform' }}>
                {[
                  { label: 'Load now', value: '412 kW' },
                  { label: '₹ today', value: '₹1,21,840' },
                  { label: 'Peak (74%)', value: '485 kW' },
                ].map((k) => (
                  <div key={k.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-[11px] text-gray-500">{k.label}</p>
                    <p className="mt-1 text-lg font-black text-white">{k.value}</p>
                  </div>
                ))}
              </div>
              <div ref={chartRef} className="mt-5 flex h-32 items-end gap-2" style={{ willChange: 'opacity, transform' }}>
                {[38, 55, 42, 70, 58, 85, 64, 92, 74, 60, 80, 66, 48, 36].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-md bg-gradient-to-t from-brand/60 to-brand/90"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <div ref={alertRef} className="mt-5 space-y-2" style={{ willChange: 'opacity, transform' }}>
                {[
                  'Floor 9 — highest W/sq ft',
                  '34 ACs on after 7 PM',
                  'Server room +18% vs baseline',
                ].map((t) => (
                  <div key={t} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-[13px] text-gray-300">
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}