// components/evaluation/RadarChart.tsx
// Radar SVG genérico (label/value/max) usado em Overview e Resultados.
// Extraído de app/(platform)/evaluation/page.tsx.

export interface RadarChartProps {
  data: { label: string; value: number; max?: number }[];
  size?: number;
}

export function RadarChart({ data, size = 200 }: RadarChartProps) {
  if (!data.length) return null;
  const cx = size / 2,
    cy = size / 2,
    r = size / 2 - 24;
  const n = data.length;
  const pts = data.map((d, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const pct = d.value / (d.max ?? 5);
    return {
      x: cx + r * pct * Math.cos(angle),
      y: cy + r * pct * Math.sin(angle),
    };
  });
  const bgPts = data.map((_, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });

  const toPath = (p: { x: number; y: number }[]) =>
    p
      .map(
        (pt, i) =>
          `${i === 0 ? 'M' : 'L'}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`,
      )
      .join(' ') + 'Z';

  return (
    <svg width={size} height={size} className="mx-auto">
      {/* Grid */}
      {[0.25, 0.5, 0.75, 1].map((pct) => (
        <polygon
          key={pct}
          points={bgPts
            .map((p) => {
              const angle = Math.atan2(p.y - cy, p.x - cx);
              return `${(cx + r * pct * Math.cos(angle)).toFixed(1)},${(cy + r * pct * Math.sin(angle)).toFixed(1)}`;
            })
            .join(' ')}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="1"
        />
      ))}
      {/* Spokes */}
      {bgPts.map((p, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={p.x}
          y2={p.y}
          stroke="#e2e8f0"
          strokeWidth="1"
        />
      ))}
      {/* Data polygon */}
      <path
        d={toPath(pts)}
        fill="rgba(99,102,241,0.15)"
        stroke="#6366f1"
        strokeWidth="2"
      />
      {/* Dots */}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#6366f1" />
      ))}
      {/* Labels */}
      {bgPts.map((p, i) => {
        const dx = p.x - cx,
          dy = p.y - cy;
        const len = Math.sqrt(dx * dx + dy * dy);
        const lx = cx + (len + 16) * (dx / len);
        const ly = cy + (len + 16) * (dy / len);
        return (
          <text
            key={i}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[9px]"
            fill="#64748b"
            fontSize="9"
          >
            {data[i].label.slice(0, 6)}
          </text>
        );
      })}
    </svg>
  );
}
