// components/automation/BuilderTab.tsx
// Construtor de Fluxos (docs/modulo_automation.md §4). Fase actual: o
// formulário de nova automação (secções A–E) + biblioteca de modelos. O
// editor visual de blocos (ramificações, reordenar) é uma fase posterior.

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { CreateRuleModal } from './CreateRuleModal';
import { TemplatesTab } from './TemplatesTab';

export function BuilderTab() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-5">
      <Card>
        <CardBody>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-base font-semibold text-ink">
                Nova automação
              </h3>
              <p className="font-body text-sm text-ink-muted">
                Define o gatilho, as condições, as acções e as regras de
                execução. A regra fica guardada e pode ser pausada sem perder
                a configuração.
              </p>
            </div>
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={14} strokeWidth={1.75} />
              Nova automação
            </Button>
          </div>
        </CardBody>
      </Card>

      <div>
        <h3 className="mb-3 font-display text-base font-semibold text-ink">
          Modelos pré-configurados
        </h3>
        <TemplatesTab />
      </div>

      {showCreate && <CreateRuleModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
