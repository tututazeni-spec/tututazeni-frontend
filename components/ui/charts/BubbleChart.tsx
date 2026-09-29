'use client';

export interface BubblePoint {
  x: number;
  y: number;
  size: number;
  label?: string;
}

interface BubbleChartProps {
  points: BubblePoint[];
  xLabel?: string;
  yLabel?: string;
  color?: string;
  height?: number;
}

export function BubbleChart({
  points,
  xLabel,
  yLabel,
  color = '#C9A227',
  height = 200,
}: BubbleChartProps) {
  if (points.length === 0) {
    return (
      <p className="font-body text-xs text-ink-faint">Sem dados suficientes.</p>
    );
  }

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const sizes = points.map((p) => p.size);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const sMax = Math.max(...sizes) || 1;
  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;
  const pad = 24;
  const w = 100;

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }}>
        <line
          x1={pad}
          y1={0}
          x2={pad}
          y2={height - pad}
          stroke="#E3E8EF"
          strokeWidth={0.5}
        />
        <line
          x1={pad}
          y1={height - pad}
          x2={w}
          y2={height - pad}
          stroke="#E3E8EF"
          strokeWidth={0.5}
        />
        {points.map((p, i) => {
          const cx = pad + ((p.x - xMin) / xRange) * (w - pad - 6);
          const cy =
            height - pad - ((p.y - yMin) / yRange) * (height - pad - 6);
          const r = 2 + (p.size / sMax) * 8;
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill={color}
              fillOpacity={0.55}
              stroke={color}
              strokeWidth={0.5}
            >
              {p.label && <title>{p.label}</title>}
            </circle>
          );
        })}
      </svg>
      {(xLabel || yLabel) && (
        <div className="mt-1 flex justify-between font-body text-[10px] text-ink-faint">
          <span>{yLabel}</span>
          <span>{xLabel}</span>
        </div>
      )}
    </div>
  );
}
