// components/dashboard-rh/rateTone.ts
// Tom do NavyStatCard para taxas (0–100) com limiares — mesma regra de cor
// que o GaugeChart aplicava (bom → verde, aviso → laranja, grave → vermelho).

import type { NavyStatTone } from '@/components/ui/NavyStatCard';

export function rateTone(
  value: number,
  thresholds: { warning: number; danger: number },
  invert = false,
): NavyStatTone {
  const { warning, danger } = thresholds;
  if (invert) {
    if (value >= danger) return 'red';
    if (value >= warning) return 'orange';
    return 'green';
  }
  if (value <= danger) return 'red';
  if (value <= warning) return 'orange';
  return 'green';
}
