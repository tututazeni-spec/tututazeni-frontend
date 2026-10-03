// components/automation/BuilderTab.tsx
// Construtor de Fluxos (docs/modulo_automation.md §4) e integração por eventos
// (§5): entrada para criar/editar uma automação na página dedicada
// (FlowBuilder), modelos pré-configurados e catálogo de eventos por módulo.

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { EventsCatalogPanel } from './EventsCatalogPanel';
import { FlowBuilder } from './FlowBuilder';
import { TemplatesTab } from './TemplatesTab';

export interface BuilderTabProps {
  /** Regra em edição; 'new' = nova automação; null = mostrar a entrada. */
  editing: number | 'new' | null;
  onEdit: (target: number | 'new' | null) => void;
}

export function BuilderTab({ editing, onEdit }: BuilderTabProps) {
  if (editing !== null) {
    return (
      <FlowBuilder
        key={editing}
        ruleId={editing === 'new' ? undefined : editing}
        onClose={() => onEdit(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-base font-semibold text-ink">
                Nova automação
              </h3>
              <p className="font-body text-sm text-ink-muted">
                Defina o gatilho, as condições e um fluxo de acções, atrasos e
                ramificações Sim / Não. Fica em rascunho até ser publicada.
              </p>
            </div>
            <Button onClick={() => onEdit('new')}>
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

      <EventsCatalogPanel />
    </div>
  );
}
