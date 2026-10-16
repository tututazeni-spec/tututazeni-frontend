// components/monitoring/PlatformStatusCard.tsx
// "Estado geral da plataforma" (Visão Geral). O anel mostra a percentagem de
// módulos em estado Normal.

'use client';

import { Activity } from 'lucide-react';
import { StatusHeroCard } from './StatusHeroCard';
import type { OverviewData } from './platformTypes';

export function PlatformStatusCard({
  platform,
}: {
  platform: OverviewData['platform'];
}) {
  const total = platform.modules.total;
  const normal = platform.modules.counts.NORMAL ?? 0;
  const db = platform.database.available
    ? `${platform.database.latencyMs} ms`
    : 'sem resposta';

  return (
    <StatusHeroCard
      icon={Activity}
      title="Estado geral da plataforma"
      headline="Saúde da plataforma"
      status={platform.status}
      percent={total > 0 ? (normal / total) * 100 : 0}
      ringLabel={`${normal} de ${total} módulos em estado normal`}
      stats={[
        { label: 'Módulos em estado normal', value: `${normal} / ${total}` },
        { label: 'Base de dados', value: db },
      ]}
      info={
        platform.reasons.length > 0 ? (
          <ul className="space-y-1">
            {platform.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        ) : (
          'Sem alertas: todos os componentes estão a funcionar.'
        )
      }
    />
  );
}
