'use client';

import { useIndicators } from '@/hooks/useIndicators';
import { IndicatorsView } from '@/components/monitoring/IndicatorsView';

export default function IndicatorsPage() {
  const props = useIndicators();
  return <IndicatorsView {...props} />;
}
