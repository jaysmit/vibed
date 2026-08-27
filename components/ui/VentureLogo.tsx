const GLYPHS: Record<string, string> = {
  wave: '<path d="M4 10v4M8.5 6.5v11M13 3v18M17.5 7.5v9M21 10.5v3"/>',
  cup: '<path d="M4.5 9h13v5a6.5 6.5 0 01-13 0z"/><path d="M17.5 10.5h1.6a2.4 2.4 0 010 4.8h-1.6"/><path d="M8 5.5c0-1 1.5-1 1.5-2M13 5.5c0-1 1.5-1 1.5-2"/>',
  peak: '<path d="M2.5 19l6-11 4 6.5 2.5-4 6.5 8.5z"/>',
  leaf: '<path d="M20 4c0 9-5.5 15-14 15C6 10 11.5 4 20 4z"/><path d="M6 19c3.5-4 6.5-6.5 11-9"/>',
  sail: '<path d="M12 3v14M12 4.5L4.5 17H12M13.5 8.5L19 17h-5.5"/><path d="M3 20.5h18"/>',
  receipt: '<path d="M5.5 3h13v18l-2.2-1.6-2.2 1.6-2.1-1.6-2.2 1.6-2.1-1.6-2.2 1.6z"/><path d="M9 8h6M9 12h6"/>',
  drop: '<path d="M12 3.5c4 4.8 6 7.9 6 10.2a6 6 0 01-12 0c0-2.3 2-5.4 6-10.2z"/>',
};

interface VentureLogoProps {
  glyph: string;
  brand: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: { box: 'w-7 h-7 rounded-lg', icon: 'w-3.5 h-3.5' },
  md: { box: 'w-[42px] h-[42px] rounded-[13px]', icon: 'w-[21px] h-[21px]' },
  lg: { box: 'w-24 h-24 rounded-3xl', icon: 'w-[46px] h-[46px]' },
};

export function VentureLogo({ glyph, brand, size = 'md', className = '' }: VentureLogoProps) {
  const sizeClasses = sizes[size];
  const path = GLYPHS[glyph] || GLYPHS.wave;

  return (
    <span
      className={`${sizeClasses.box} grid place-items-center ${className}`}
      style={{ background: brand }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        className={sizeClasses.icon}
        style={{
          stroke: '#fff',
          fill: 'none',
          strokeWidth: 1.9,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }}
        dangerouslySetInnerHTML={{ __html: path }}
      />
    </span>
  );
}
