'use client';

import { Lock } from 'lucide-react';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { useIndicators } from '@/hooks/useIndicators';
import { IndicatorsView } from '@/components/monitoring/IndicatorsView';
import { buttonVariants } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

// GET /monitoring/indicators não tem @Roles no backend, mas o link
// "Indicadores" foi escondido de COLABORADOR na página de Avaliações — sem
// este gate a rota continuava acessível a quem escrevesse o URL
// directamente. `role` undefined (arranque pós-login/reload) passa, como em
// qualquer outro filtro por role no frontend, para não mostrar o bloqueio
// por instantes a quem tem acesso.
export default function IndicatorsPage() {
  const role = useCurrentRole();
  const blocked = role === 'COLABORADOR';
  const props = useIndicators(!blocked);

  if (blocked) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Lock}
          title="Sem acesso"
          description="Esta secção não está disponível para o teu papel."
        />
        <div className="mt-4 flex justify-center">
          <a
            href="/monitoring/evaluations"
            className={buttonVariants({ intent: 'secondary', size: 'sm' })}
          >
            ← Avaliações
          </a>
        </div>
      </div>
    );
  }

  return <IndicatorsView {...props} />;
}
