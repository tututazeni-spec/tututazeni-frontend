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

import { FilterPanelCard } from './FilterPanelCard';
import { useEffect, useState } from 'react';
import type { ContinuousFeedback, CycleFeedbackRow } from './types';
import { evaluatorRoleLabel } from './colors';
import { GiveFeedbackModal } from './GiveFeedbackModal';
import { useCycleSelectorOptions } from './cycleData';
import { useHasRole } from '@/hooks/useCurrentRole';
import { EVAL_CREATOR_ROLES } from '@/lib/roles';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { Select, type SelectItemOption } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { daysAgo } from '@/lib/format';
import {
  Filter,
  MessageCircle,
  Star,
  ThumbsUp,
  TrendingUp,
  User,
  type LucideIcon,
} from 'lucide-react';

const ALL = 'ALL';

// Cartão "Feedback Contínuo" (desenho de public/images/feedback.jpeg): faixa
// navy com estrela e título, curva verde no canto, e por baixo cada feedback
// com o balão azul, a etiqueta do tipo, a citação e o autor.
const TYPE_CFG: Record<
  string,
  {
    label: string;
    Icon: LucideIcon;
    pillBg: string;
    pillText: string;
    edge: string;
  }
> = {
  RECOGNITION: {
    label: 'Reconhecimento',
    Icon: ThumbsUp,
    pillBg: '#d5f5df',
    pillText: '#0f3d22',
    edge: '#22c55e',
  },
  DEVELOPMENT: {
    label: 'Desenvolvimento',
    Icon: TrendingUp,
    pillBg: '#e3e6fc',
    pillText: '#25307a',
    edge: '#818cf8',
  },
  CHECK_IN: {
    label: 'Conversa Individual 1:1',
    Icon: MessageCircle,
    pillBg: '#dbeafe',
    pillText: '#17408a',
    edge: '#60a5fa',
  },
};

function FeedbackBubble({ Icon }: { Icon: LucideIcon }) {
  return (
    <div className="relative h-[52px] w-[59px] shrink-0">
      <svg
        aria-hidden="true"
        viewBox="0 0 104 92"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id="fb-bubble" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3b8bff" />
            <stop offset="100%" stopColor="#1647c9" />
          </linearGradient>
        </defs>
        <ellipse cx="52" cy="84" rx="34" ry="5" fill="#1d6bff" opacity="0.25" />
        <path
          d="M22 14h62a14 14 0 0 1 14 14v30a14 14 0 0 1-14 14H44L24 86l2-14h-4A14 14 0 0 1 8 58V28a14 14 0 0 1 14-14z"
          fill="url(#fb-bubble)"
        />
        <g stroke="#22c55e" strokeWidth="4" strokeLinecap="round">
          <path d="M78 6l4 8" />
          <path d="M90 14l7 5" />
          <path d="M94 28l8 1" />
        </g>
      </svg>
      <Icon
        size={19}
        strokeWidth={2.2}
        className="absolute left-[17px] top-[13px] fill-white text-white"
      />
    </div>
  );
}

export interface FeedbackTabProps {
  feedbacks: ContinuousFeedback[];
}

export function FeedbackTab({ feedbacks }: FeedbackTabProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const canManage = useHasRole(EVAL_CREATOR_ROLES);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <div className="flex justify-end items-center">
          <Button intent="primary" size="sm" onClick={() => setModalOpen(true)}>
            + Dar Feedback
          </Button>
        </div>
        <div className="overflow-hidden rounded-[24px] border border-brand-line bg-surface shadow-[0_8px_24px_rgba(21,47,89,0.10)]">
          <div className="relative flex items-center gap-4 overflow-hidden bg-brand-dark px-6 py-2.5">
            <Star
              size={20}
              strokeWidth={1.75}
              className="relative z-10 shrink-0 text-white"
            />
            <span className="relative z-10 h-5 w-px bg-white/30" />
            <h2 className="relative z-10 m-0 font-display text-lg font-extrabold text-white">
              Feedback Contínuo
            </h2>
            <svg
              aria-hidden="true"
              viewBox="0 0 200 80"
              preserveAspectRatio="none"
              className="pointer-events-none absolute right-0 top-0 h-full w-[22%]"
            >
              <defs>
                <linearGradient id="fb-swoosh" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stopColor="#16a34a" />
                  <stop offset="100%" stopColor="#4ade80" />
                </linearGradient>
              </defs>
              <path
                d="M200 0v52C170 66 120 72 70 76 130 56 150 24 160 0z"
                fill="url(#fb-swoosh)"
              />
            </svg>
          </div>

          {feedbacks.length === 0 && (
            <p className="m-0 px-7 py-6 font-body text-sm text-ink-muted">
              Ainda sem feedback contínuo.
            </p>
          )}
          <ul className="m-0 list-none divide-y divide-border p-0">
            {feedbacks.map((fb) => {
              const cfg = TYPE_CFG[fb.type] ?? TYPE_CFG.RECOGNITION;
              return (
                <li key={fb.id} className="flex items-center gap-4 px-6 py-3">
                  <FeedbackBubble Icon={cfg.Icon} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span
                        className="rounded-full py-0.5 pl-3.5 pr-3 font-body text-xs font-bold"
                        style={{
                          background: cfg.pillBg,
                          color: cfg.pillText,
                          boxShadow: `inset 6px 0 0 ${cfg.edge}`,
                        }}
                      >
                        {cfg.label}
                      </span>
                      <span className="h-4 w-px bg-ink/30" />
                      <span className="font-body text-sm text-ink">
                        {[fb.competency, daysAgo(fb.createdAt)]
                          .filter(Boolean)
                          .join(' • ')}
                      </span>
                    </div>
                    <p className="m-0 mt-1.5 font-display text-base leading-snug text-brand-dark">
                      &ldquo;{fb.message}&rdquo;
                    </p>
                    <div className="mt-1.5 flex items-center gap-2 font-body text-sm text-ink">
                      <User size={16} strokeWidth={1.75} className="shrink-0" />
                      <span>
                        por <strong className="font-bold">{fb.fromName}</strong>
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        {modalOpen && <GiveFeedbackModal onClose={() => setModalOpen(false)} />}
      </section>

      {canManage && <CycleFeedbackSection />}
    </div>
  );
}

const CATEGORY_CFG: Record<string, { label: string; color: string }> = {
  STRENGTH: { label: 'Ponto forte', color: 'rgb(34, 197, 94)' },
  IMPROVEMENT: {
    label: 'Oportunidade de melhoria',
    color: 'rgb(245, 158, 11)',
  },
};

const ROLE_OPTIONS: SelectItemOption[] = [
  { value: ALL, label: 'Todos os tipos de avaliador' },
  ...Object.entries(evaluatorRoleLabel).map(([value, label]) => ({
    value,
    label,
  })),
];

// Feedback qualitativo de um ciclo (docs/evaluation360.md §8) — GET
// /evaluation360/cycles/:cycleId/feedback. Mesmo padrão de selector de ciclo
// de AvaliadosTab/AvaliadoresTab (sem "ciclo activo" implícito, é uma vista
// de gestão).
function CycleFeedbackSection() {
  const {
    cycles,
    options: cycleOptions,
    loading: cyclesLoading,
  } = useCycleSelectorOptions();
  const [cycleId, setCycleId] = useState('');
  useEffect(() => {
    if (!cycleId && cycles.length > 0) setCycleId(cycles[0].id);
  }, [cycleId, cycles]);

  const [evaluatorRole, setEvaluatorRole] = useState(ALL);
  const params: Record<string, string> = {};
  if (evaluatorRole !== ALL) params.evaluatorRole = evaluatorRole;

  const { data, isLoading } = useApiQuery<{
    data: CycleFeedbackRow[];
    total: number;
  }>(
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
          Comentários qualitativos das avaliações 360° já submetidas — a
          identidade do avaliador nunca é exposta, só o tipo de avaliador.
        </p>
      </div>

      <FilterPanelCard>
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
          <div className="text-xs font-semibold text-ink-muted mb-1">
            Tipo de avaliador
          </div>
          <Select
            variant="underline"
            icon={Filter}
            items={ROLE_OPTIONS}
            value={evaluatorRole}
            onValueChange={setEvaluatorRole}
          />
        </div>
      </FilterPanelCard>

      {!cycleId && !cyclesLoading && (
        <div className="overflow-hidden rounded-[24px] border border-brand-line bg-surface p-5 shadow-[0_8px_24px_rgba(21,47,89,0.10)] font-body text-sm text-brand">
          <h3 className="-mx-5 -mt-5 mb-3 bg-brand-dark px-5 py-3 font-body text-xs font-semibold uppercase tracking-wider text-white">
            Feedback
          </h3>
          Ainda não existe nenhum ciclo de avaliação 360º.
        </div>
      )}
      {cycleId && isLoading && <Skeleton rows={3} />}
      {cycleId && !isLoading && rows.length === 0 && (
        <div className="overflow-hidden rounded-[24px] border border-brand-line bg-surface p-5 shadow-[0_8px_24px_rgba(21,47,89,0.10)] font-body text-sm text-brand">
          <h3 className="-mx-5 -mt-5 mb-3 bg-brand-dark px-5 py-3 font-body text-xs font-semibold uppercase tracking-wider text-white">
            Feedback
          </h3>
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
                className="rounded-card border border-border bg-surface p-4"
              >
                <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-ink">
                      {r.evaluateeName}
                    </span>
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
                <p className="m-0 text-sm text-ink leading-relaxed">
                  {r.comment}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
