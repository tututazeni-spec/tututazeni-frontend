'use client';

import { useOkrs } from '@/hooks/useOkrs';
import { OkrsView } from '@/components/monitoring/OkrsView';
import { useCurrentRole } from '@/hooks/useCurrentRole';

export default function OkrsPage() {
  const props = useOkrs();
  const role = useCurrentRole();
  // Link "Indicadores" escondido de COLABORADOR a pedido do utilizador
  // (GET /monitoring/indicators em si não tem @Roles no backend).
  const showIndicators = role !== 'COLABORADOR';
  return <OkrsView {...props} showIndicators={showIndicators} />;
}
