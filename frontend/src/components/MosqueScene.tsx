/** Original illustrated mosque at sunset (SVG). Decorative; drifting clouds and a pulsing sun glow. */
export default function MosqueScene({ className = '' }: { className?: string }) {
  const arch = (x: number, y: number, w = 12, h = 22) => <path key={`${x}-${y}`} d={`M${x} ${y + h} V${y + w / 2} a${w / 2} ${w / 2} 0 0 1 ${w} 0 V${y + h} Z`} fill="#7d6847" opacity=".35" />;
  const minaret = (x: number, top: number, w = 14) => (
    <g key={x}>
      <rect x={x - w / 2} y={top} width={w} height={362 - top} fill="#cdb893" />
      <rect x={x - w / 2} y={top} width={w / 2.2} height={362 - top} fill="#b9a27b" opacity=".6" />
      <rect x={x - w / 2 - 5} y={top + 38} width={w + 10} height="6" rx="1" fill="#a58d66" />
      <rect x={x - w / 2 - 4} y={top + 8} width={w + 8} height="5" rx="1" fill="#a58d66" />
      <path d={`M${x - w / 2 - 1} ${top} L${x} ${top - 34} L${x + w / 2 + 1} ${top} Z`} fill="#8fa59b" />
      <line x1={x} y1={top - 34} x2={x} y2={top - 46} stroke="#b08d3c" strokeWidth="1.5" />
      <circle cx={x} cy={top - 47} r="2" fill="#b08d3c" />
      {arch(x - 3, top + 52, 6, 14)}{arch(x - 3, top + 90, 6, 14)}
    </g>
  );
  return (
    <svg viewBox="0 0 640 400" preserveAspectRatio="xMaxYMax slice" className={className} role="img" aria-label="Illustration of a mosque at sunset">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f6ead3" /><stop offset=".55" stopColor="#f7dcae" /><stop offset="1" stopColor="#f1b87c" /></linearGradient>
        <radialGradient id="sun" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#fff6dc" /><stop offset=".35" stopColor="#ffe3a1" stopOpacity=".85" /><stop offset="1" stopColor="#ffd088" stopOpacity="0" /></radialGradient>
        <linearGradient id="dome" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#9db3a8" /><stop offset="1" stopColor="#7c968a" /></linearGradient>
      </defs>
      <rect width="640" height="400" fill="url(#sky)" />
      <circle cx="560" cy="300" r="120" fill="url(#sun)" className="animate-pulse" />
      <circle cx="560" cy="300" r="22" fill="#fff3cf" />
      <g className="animate-drift" opacity=".75"><ellipse cx="150" cy="90" rx="70" ry="12" fill="#fff" opacity=".6" /><ellipse cx="200" cy="80" rx="45" ry="10" fill="#fff" opacity=".6" /></g>
      <g className="animate-drift [animation-delay:-7s]" opacity=".7"><ellipse cx="420" cy="60" rx="60" ry="10" fill="#fff" opacity=".55" /><ellipse cx="470" cy="52" rx="38" ry="8" fill="#fff" opacity=".55" /></g>
      <path d="M0 300 L70 255 L130 285 L210 235 L300 290 L380 250 L470 295 L560 262 L640 300 V380 H0Z" fill="#c9b79c" opacity=".55" />
      <path d="M0 330 Q120 300 240 325 T480 318 T640 322 V380 H0Z" fill="#b8a98a" opacity=".6" />
      {[40, 70, 100, 130, 520, 548, 590].map((x, i) => <rect key={x} x={x} y={322 - (i % 3) * 8} width="14" height={40 + (i % 3) * 8} fill="#d6c4a2" opacity=".7" />)}
      {minaret(215, 150)}{minaret(500, 175)}{minaret(590, 235, 11)}
      <rect x="262" y="272" width="178" height="90" fill="#d3bf9a" />
      <rect x="262" y="272" width="60" height="90" fill="#bfa77f" opacity=".45" />
      <path d="M292 272 a59 59 0 0 1 118 0 Z" fill="url(#dome)" />
      <path d="M351 213 V192" stroke="#b08d3c" strokeWidth="2" /><circle cx="351" cy="189" r="3" fill="#b08d3c" />
      <path d="M262 292 a20 20 0 0 1 40 0 Z" fill="url(#dome)" /><path d="M400 292 a20 20 0 0 1 40 0 Z" fill="url(#dome)" />
      <rect x="298" y="258" width="106" height="14" fill="#c4ae88" />
      {[276, 296, 318, 340, 362, 384, 406, 424].map((x) => arch(x, 306, 12, 56))}
      {arch(327, 286, 12, 20)}{arch(351, 286, 12, 20)}{arch(375, 286, 12, 20)}
      <rect x="0" y="360" width="640" height="40" fill="#a9b98a" />
      <path d="M0 362 Q60 340 120 362 Z" fill="#4f7a4a" /><path d="M30 365 Q90 330 150 365 Z" fill="#3f6a41" />
      <path d="M520 365 Q580 320 640 350 V400 H520Z" fill="#3f6a41" /><path d="M560 372 Q610 335 650 372 Z" fill="#4f7a4a" />
      <path d="M150 90 q6 -6 12 0 q6 -6 12 0" stroke="#7a6a52" strokeWidth="1.3" fill="none" opacity=".6" transform="translate(120 30)" />
    </svg>
  );
}
