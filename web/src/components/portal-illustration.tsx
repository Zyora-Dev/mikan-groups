/** Line-art structural frame — drawn, not photographed, to match the portal's register. */
export function PortalIllustration() {
  return (
    <svg
      viewBox="0 0 640 560"
      fill="none"
      aria-hidden="true"
      className="h-full w-full"
      preserveAspectRatio="xMidYMax meet"
    >
      <defs>
        <pattern id="hatch" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="8" stroke="currentColor" strokeWidth="1.1" opacity="0.5" />
        </pattern>
      </defs>

      {/* ground line */}
      <line x1="0" y1="486" x2="640" y2="486" stroke="currentColor" strokeWidth="2.5" />

      {/* left tower — hatched */}
      <g stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round">
        <path d="M52 486 V246 L150 206 V486 Z" fill="url(#hatch)" className="text-brand-cyan" />
        <path d="M52 246 L150 206" />
        {[286, 326, 366, 406, 446].map((y) => <line key={y} x1="52" y1={y} x2="150" y2={y - 16} />)}
      </g>

      {/* centre tower — the tall one */}
      <g stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round">
        <path d="M196 486 V96 L306 60 V486 Z" fill="none" />
        <path d="M196 96 L306 60" />
        {[136, 186, 236, 286, 336, 386, 436].map((y) => (
          <line key={y} x1="196" y1={y} x2="306" y2={y - 18} />
        ))}
        {/* window grid */}
        {[160, 210, 260, 310, 360, 410].map((y) =>
          [222, 252, 282].map((x) => (
            <rect key={`${x}-${y}`} x={x} y={y - (x - 196) * 0.16} width="12" height="18" strokeWidth="1.6" opacity="0.65" />
          ))
        )}
      </g>

      {/* right block — solid accent */}
      <g stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round">
        <path d="M352 486 V196 L452 166 V486 Z" fill="url(#hatch)" className="text-brand-green" />
        <path d="M352 196 L452 166" />
        {[246, 296, 346, 396, 446].map((y) => <line key={y} x1="352" y1={y} x2="452" y2={y - 15} />)}
      </g>

      {/* far-right slab */}
      <g stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round">
        <path d="M498 486 V286 L588 262 V486 Z" fill="none" />
        <path d="M498 286 L588 262" />
        {[336, 386, 436].map((y) => <line key={y} x1="498" y1={y} x2="588" y2={y - 12} />)}
      </g>

      {/* tower crane */}
      <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" className="text-brand-orange">
        <line x1="330" y1="486" x2="330" y2="52" />
        <line x1="150" y1="68" x2="470" y2="68" />
        <line x1="330" y1="52" x2="330" y2="68" />
        <path d="M330 52 L250 68 M330 52 L410 68" strokeWidth="1.8" />
        {/* lattice on the mast */}
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={i} x1="322" y1={88 + i * 44} x2="338" y2={110 + i * 44} strokeWidth="1.4" opacity="0.8" />
        ))}
        {/* hook */}
        <line x1="218" y1="68" x2="218" y2="174" strokeWidth="1.6" />
        <rect x="208" y="174" width="20" height="14" strokeWidth="1.8" />
      </g>

      {/* dimension line — the detail only an engineer would draw */}
      <g stroke="currentColor" strokeWidth="1.4" className="text-brand-green" opacity="0.9">
        <line x1="52" y1="508" x2="588" y2="508" />
        <line x1="52" y1="500" x2="52" y2="516" />
        <line x1="588" y1="500" x2="588" y2="516" />
      </g>
    </svg>
  );
}
