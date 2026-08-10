'use client';

import { useMonitoringEvaluations } from '@/hooks/useMonitoringEvaluations';
import { EvaluationsView } from '@/components/monitoring/EvaluationsView';

export default function EvaluationsPage() {
  const props = useMonitoringEvaluations();
  return <EvaluationsView {...props} />;
}
