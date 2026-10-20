/** Decorative animated layer: rotating geometric stars, drifting glows and twinkling dots. Purely visual. */
const dots = Array.from({ length: 22 }, (_, i) => ({
  left: (i * 37 + 11) % 100, top: (i * 53 + 7) % 100, size: 2 + (i % 3), delay: (i % 7) * 0.6, dur: 3 + (i % 5),
}));

function Star({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} fill="none" stroke="currentColor" strokeWidth="1" aria-hidden>
      <rect x="40" y="40" width="120" height="120" /><rect x="40" y="40" width="120" height="120" transform="rotate(45 100 100)" />
      <circle cx="100" cy="100" r="60" /><circle cx="100" cy="100" r="30" />
    </svg>
  );
}

export default function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -left-20 top-10 h-72 w-72 animate-drift rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="absolute -bottom-24 right-1/4 h-80 w-80 animate-drift rounded-full bg-sand/20 blur-3xl [animation-delay:-9s]" />
      <Star className="absolute -right-24 -top-24 h-[34rem] w-[34rem] animate-spin-slow text-sand/25" />
      <Star className="absolute -right-4 top-10 h-72 w-72 animate-spin-rev text-sand/20" />
      <Star className="absolute -bottom-32 -left-20 h-96 w-96 animate-spin-rev text-sand/15" />
      {dots.map((d, i) => (
        <span key={i} className="absolute animate-twinkle rounded-full bg-sand" style={{ left: `${d.left}%`, top: `${d.top}%`, width: d.size, height: d.size, animationDelay: `${d.delay}s`, animationDuration: `${d.dur}s` }} />
      ))}
      <p dir="rtl" lang="ar" className="absolute bottom-6 right-8 hidden animate-float font-arabic text-6xl text-sand/25 md:block">طَرِيقُ النُّور</p>
    </div>
  );
}
