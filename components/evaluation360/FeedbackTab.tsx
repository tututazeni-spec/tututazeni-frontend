// components/evaluation360/FeedbackTab.tsx
// Separador "Feedback" (docs/evaluation360.md §8). Duas secções distintas:
//
// 1. Feedback contínuo — sempre "o meu" (recebido fora de qualquer ciclo
//    formal), do próprio utilizador autenticado (ver Evaluation360View.tsx /
//    hooks/useEvaluation360.ts — ninguém vê o feedback de outro). Dados reais
//    (GET /evaluation360/feedback/continuous/:userId). "+ Dar Feedback" abre
//    a GiveFeedbackModal, que deixa escolher o colega destinatário e não
//    afecta esta lista (o feedback vai para a lista DELE, não para a minha).
//
// 2. Feedback do ciclo (CycleFeedbackSection, abaixo) — só para quem gere o
//    módulo (EVAL_CREATOR_ROLES): comentários qualitativos das respostas já
//    submetidas num ciclo 360º, com as colunas pedidas no documento
//    (Avaliado, Competência, Comentário, Tipo de avaliador, Data, Estado,
//    Visibilidade) e a separação opcional em pontos fortes/oportunidades de
//    melhoria. GET /evaluation360/cycles/:cycleId/feedback — nunca liga um
//    comentário à identidade do avaliador, só ao papel (mesma regra de
//    anonimato de ParticipantDetailModal).
//
// NOTA: Os tipos de feedback contínuo (RECOGNITION, DEVELOPMENT, CHECK_IN)
// usam cores categóricas para codificação de tipo, não ordinal. Estas são
// data-viz exceptions.

'use client';

import { useEffect, useState } from 'react';
import type { ContinuousFeedback, CycleFeedbackRow } from './types';
import { timeAgo, evaluatorRoleLabel } from './colors';
import { GiveFeedbackModal } from './GiveFeedbackModal';
import { useCycleSelectorOptions } from './cycleData';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { EVAL_CREATOR_ROLES } from '@/lib/roles';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { Select, type SelectItemOption } from '@/components/ui/Select';

const ALL = 'ALL';

export interface FeedbackTabProps {
  feedbacks: ContinuousFeedback[];
}

export function FeedbackTab({ feedbacks }: FeedbackTabProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const role = useCurrentRole();
  const canManage = !!role && EVAL_CREATOR_ROLES.includes(role);

  const typeConfig: Record<string, { label: string; color: string }> = {
    RECOGNITION: { label: 'Reconhecimento', color: 'rgb(34, 197, 94)' },
    DEVELOPMENT: { label: 'Desenvolvimento', color: 'rgb(129, 140, 248)' },
    CHECK_IN: { label: 'Conversa Individual 1:1', color: 'rgb(96, 165, 250)' },
  };
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h2 className="m-0 text-lg font-bold text-ink">Feedback Contínuo</h2>
          </div>
          <Button intent="primary" size="sm" onClick={() => setModalOpen(true)}>
            + Dar Feedback
          </Button>
        </div>
        {feedbacks.length === 0 && (
          <div className="rounded-lg border border-border bg-surface p-5 text-sm text-ink-muted">
            Ainda sem feedback contínuo.
          </div>
        )}
        {feedbacks.map((fb) => {
          const cfg = typeConfig[fb.type];
          return (
            <div
              key={fb.id}
              className="rounded-r-lg border border-l-4 bg-surface p-4"
              style={{ borderLeftColor: cfg.color }}
            >
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-xs font-bold uppercase tracking-wider"
                      style={{ color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                    {fb.competency && (
                      <span className="text-xs text-ink-muted bg-surface-sunken px-2 py-0.5 rounded-full">
                        {fb.competency}
                      </span>
                    )}
                    <span className="text-xs text-ink-muted">· {timeAgo(fb.createdAt)}</span>
                  </div>
                  <p className="m-0 text-sm text-ink leading-relaxed">{fb.message}</p>
                </div>
              </div>
              <div className="mt-2.5 text-xs text-ink-muted">
                por <strong className="text-ink-muted">{fb.fromName}</strong>
              </div>
            </div>
          );
        })}
        {modalOpen && <GiveFeedbackModal onClose={() => setModalOpen(false)} />}
      </section>

      {canManage && <CycleFeedbackSection />}
    </div>
  );
}

const CATEGORY_CFG: Record<string, { label: string; color: string }> = {
  STRENGTH: { label: 'Ponto forte', color: 'rgb(34, 197, 94)' },
  IMPROVEMENT: { label: 'Oportunidade de melhoria', color: 'rgb(245, 158, 11)' },
};

const ROLE_OPTIONS: SelectItemOption[] = [
  { value: ALL, label: 'Todos os tipos de avaliador' },
  ...Object.entries(evaluatorRoleLabel).map(([value, label]) => ({ value, label })),
];

// Feedback qualitativo de um ciclo (docs/evaluation360.md §8) — GET
// /evaluation360/cycles/:cycleId/feedback. Mesmo padrão de selector de ciclo
// de AvaliadosTab/AvaliadoresTab (sem "ciclo activo" implícito, é uma vista
// de gestão).
function CycleFeedbackSection() {
  const { cycles, options: cycleOptions, loading: cyclesLoading } = useCycleSelectorOptions();
  const [cycleId, setCycleId] = useState('');
  useEffect(() => {
    if (!cycleId && cycles.length > 0) setCycleId(cycles[0].id);
  }, [cycleId, cycles]);

  const [evaluatorRole, setEvaluatorRole] = useState(ALL);
  const params: Record<string, string> = {};
  if (evaluatorRole !== ALL) params.evaluatorRole = evaluatorRole;

  const { data, isLoading } = useApiQuery<{ data: CycleFeedbackRow[]; total: number }>(
    queryKeys.evaluation360.cycleFeedback(cycleId, params),
    `/evaluation360/cycles/${cycleId}/feedback`,
    { params, staleTime: STALE_TIME.DYNAMIC, enabled: !!cycleId },
  );
  const rows = data?.data ?? [];

  return (
    <section className="flex flex-col gap-5 border-t border-border pt-6">
      <div>
        <h2 className="m-0 text-lg font-bold text-ink">Feedback do Ciclo</h2>
        <p className="m-0 mt-1 text-sm text-ink-muted">
          Comentários qualitativos das avaliações 360° já submetidas — a identidade do avaliador
          nunca é exposta, só o tipo de avaliador.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <div className="text-xs font-semibold text-ink-muted mb-1">Ciclo</div>
          <Select
            items={cycleOptions}
            value={cycleId || undefined}
            onValueChange={setCycleId}
            placeholder={cyclesLoading ? 'A carregar…' : 'Escolher ciclo'}
            className="min-w-[220px]"
          />
        </div>
        <div>
          <div className="text-xs font-semibold text-ink-muted mb-1">Tipo de avaliador</div>
          <Select items={ROLE_OPTIONS} value={evaluatorRole} onValueChange={setEvaluatorRole} />
        </div>
      </div>

      {!cycleId && !cyclesLoading && (
        <div className="rounded-lg border border-border bg-surface p-5 text-sm text-ink-muted">
          Ainda não existe nenhum ciclo de avaliação 360º.
        </div>
      )}
      {cycleId && isLoading && <div className="text-sm text-ink-muted">A carregar…</div>}
      {cycleId && !isLoading && rows.length === 0 && (
        <div className="rounded-lg border border-border bg-surface p-5 text-sm text-ink-muted">
          Ainda sem feedback submetido para este ciclo.
        </div>
      )}

      {rows.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {rows.map((r, i) => {
            const cat = r.category ? CATEGORY_CFG[r.category] : null;
            return (
              <div
                key={`${r.evaluateeId}-${i}`}
                className="rounded-lg border border-border bg-surface p-4"
              >
                <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-ink">{r.evaluateeName}</span>
                    {r.competencyName && (
                      <span className="text-xs text-ink-muted bg-surface-sunken px-2 py-0.5 rounded-full">
                        {r.competencyName}
                      </span>
                    )}
                    <span className="text-xs text-ink-muted">
                      {evaluatorRoleLabel[r.evaluatorRole] ?? r.evaluatorRole}
                    </span>
                    {cat && (
                      <span
                        className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: cat.color }}
                      >
                        {cat.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-ink-muted shrink-0">
                    <span>{r.visibility}</span>
                    <span>· {r.date.slice(0, 10)}</span>
                  </div>
                </div>
                <p className="m-0 text-sm text-ink leading-relaxed">{r.comment}</p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
