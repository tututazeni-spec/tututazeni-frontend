// components/declarations/WorkFormsTab.tsx
// Separador "Formulários" — declarações de vínculo laboral pendentes do
// utilizador + histórico de submissões. Puramente apresentacional. Migrado
// para a fundação de design: cartões/lista bespoke passam a Card
// (components/ui/Card), o aviso de pendências passa a tokens semânticos
// (warning), o estado vazio passa a EmptyState (components/ui/EmptyState),
// e os botões passam a Button (components/ui/Button). Extraído de
// app/(platform)/declarations/page.tsx.

import { AlertCircle, CheckCircle2, ChevronRight, Clipboard } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from './StatusBadge';
import { WORK_TYPE_LABELS } from './constants';
import type { WorkForm, WorkSubmission } from './types';

export interface WorkFormsTabProps {
  pendingWork: { pending: WorkForm[]; total: number } | null;
  workSubs: { data: WorkSubmission[] } | null;
  onOpenForm: (form: WorkForm) => void;
}

export function WorkFormsTab({ pendingWork, workSubs, onOpenForm }: WorkFormsTabProps) {
  return (
    <div className="space-y-4">
      {(pendingWork?.pending.length ?? 0) > 0 && (
        <div className="flex items-start gap-3 rounded-card border border-warning bg-warning-subtle p-4">
          <AlertCircle size={18} strokeWidth={1.75} className="mt-0.5 flex-shrink-0 text-warning-ink" />
          <div>
            <p className="font-body text-sm font-semibold text-warning-ink">
              {pendingWork!.total} declaração(ões) pendente(s)
            </p>
            <p className="mt-0.5 font-body text-xs text-warning-ink">
              Complete os formulários abaixo para manter o seu perfil actualizado.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {pendingWork?.pending.map((f) => (
          <Card key={f.id} className="flex items-center justify-between p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-control bg-info-subtle">
                <Clipboard size={18} strokeWidth={1.75} className="text-info-ink" />
              </div>
              <div>
                <p className="font-body text-sm font-semibold text-ink">{f.title}</p>
                <p className="mt-0.5 font-body text-xs text-ink-faint">
                  {WORK_TYPE_LABELS[f.type]} {f.periodicity ? `· ${f.periodicity}` : ''}
                </p>
                {f.mandatory && (
                  <span className="font-body text-xs font-medium text-danger">Obrigatória</span>
                )}
              </div>
            </div>
            <Button size="sm" onClick={() => onOpenForm(f)}>
              Preencher <ChevronRight size={14} strokeWidth={1.75} />
            </Button>
          </Card>
        ))}
        {pendingWork?.pending.length === 0 && (
          <EmptyState
            icon={CheckCircle2}
            title="Sem formulários pendentes"
            description="Todas as declarações de vínculo laboral estão em dia."
          />
        )}
      </div>

      {/* My submissions */}
      {(workSubs?.data.length ?? 0) > 0 && (
        <Card>
          <div className="border-b border-border px-5 py-4">
            <h3 className="font-display text-sm font-semibold text-ink">
              Histórico de Submissões
            </h3>
          </div>
          <div className="divide-y divide-border">
            {workSubs?.data.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="font-body text-sm font-medium text-ink">{s.form?.title}</p>
                  <p className="font-body text-xs text-ink-faint">
                    {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString('pt-PT') : '—'}
                  </p>
                </div>
                <StatusBadge status={s.status} type="work" />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
