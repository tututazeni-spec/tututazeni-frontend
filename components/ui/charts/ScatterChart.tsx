'use client';

export interface ScatterPoint {
  x: number;
  y: number;
  label?: string;
}

interface ScatterChartProps {
  points: ScatterPoint[];
  xLabel?: string;
  yLabel?: string;
  color?: string;
  height?: number;
}

export function ScatterChart({
  points,
  xLabel,
  yLabel,
  color = '#2B6CC4',
  height = 200,
}: ScatterChartProps) {
  if (points.length === 0) {
    return <p className="font-body text-xs text-ink-faint">Sem dados suficientes.</p>;
  }

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;
  const pad = 24;
  const w = 100;

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }}>
        <line x1={pad} y1={0} x2={pad} y2={height - pad} stroke="#E3E8EF" strokeWidth={0.5} />
        <line x1={pad} y1={height - pad} x2={w} y2={height - pad} stroke="#E3E8EF" strokeWidth={0.5} />
        {points.map((p, i) => {
          const cx = pad + ((p.x - xMin) / xRange) * (w - pad - 4);
          const cy = height - pad - ((p.y - yMin) / yRange) * (height - pad - 4);
          return (
            <circle key={i} cx={cx} cy={cy} r={2.2} fill={color} fillOpacity={0.75}>
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