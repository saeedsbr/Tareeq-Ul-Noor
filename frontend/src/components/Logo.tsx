import Link from 'next/link';

export function LogoMark({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M16 2l12 12-12 16L4 14z" />
      <path d="M16 9l6 6-6 8-6-8z" />
      <path d="M4 14h24" />
    </svg>
  );
}

export default function Logo({ href = '/', light = false }: { href?: string; light?: boolean }) {
  return (
    <Link href={href} className={`flex items-center gap-2 font-serif text-lg font-semibold ${light ? 'text-white' : 'text-forest'}`} aria-label="Tareeq Ul Noor home">
      <LogoMark /> Tareeq Ul Noor
    </Link>
  );
}
