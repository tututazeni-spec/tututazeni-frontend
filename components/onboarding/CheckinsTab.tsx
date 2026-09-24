// components/onboarding/CheckinsTab.tsx
// Separador "Acompanhamento" (docs/onboarding.md ponto 8) — check-ins do
// gestor/mentor com o colaborador nos marcos 1.º dia/1.ª semana/30/60/90
// dias (seedados automaticamente na criação do plano) + avulsos (CUSTOM).
// Registar um check-in é PATCH /onboarding/checkins/:id — só o responsável
// atribuído ou ADMIN/RH (assertCanAccess no backend).

'use client';

import { useState } from 'react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { useToast } from '@/providers/ToastProvider';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Textarea } from '@/components/ui/Textarea';
import { CHECKIN_STATUS_CFG, CHECKIN_TYPE_LABELS } from './constants';
import type { OnboardingCheckin } from './types';

interface Paginated {
  data: OnboardingCheckin[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const STATUS_ITEMS = [
  { value: 'ALL', label: 'Todos os estados' },
  ...Object.entries(CHECKIN_STATUS_CFG).map(([value, cfg]) => ({ value, label: cfg.label })),
];

function CheckinRegisterModal({ checkin, onClose }: { checkin: OnboardingCheckin; onClose: () => void }) {
  const notify = useToast();
  const [difficulties, setDifficulties] = useState(checkin.difficulties ?? '');
  const [positives, setPositives] = useState(checkin.positives ?? '');
  const [supportNeeds, setSupportNeeds] = useState(checkin.supportNeeds ?? '');
  const [managerFeedback, setManagerFeedback] = useState(checkin.managerFeedback ?? '');
  const [nextActions, setNextActions] = useState(checkin.nextActions ?? '');

  const register = useApiMutation(
    (status: 'COMPLETED' | 'SKIPPED') =>
      apiClient.patch(`/onboarding/checkins/${checkin.id}`, {
        difficulties: difficulties.trim() || undefined,
        positives: positives.trim() || undefined,
        supportNeeds: supportNeeds.trim() || undefined,
        managerFeedback: managerFeedback.trim() || undefined,
        nextActions: nextActions.trim() || undefined,
        status,
      }),
    {
      invalidateKeys: [queryKeys.onboarding.all],
      onSuccess: () => {
        notify({ title: 'Check-in registado.', intent: 'success' });
        onClose();
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={`Check-in — ${CHECKIN_TYPE_LABELS[checkin.type]}`}
        description={checkin.plan.user.fullName}
        className="max-w-lg"
      >
        <div className="mt-4 space-y-3">
          <Textarea
            value={difficulties}
            onChange={(e) => setDifficulties(e.target.value)}
            placeholder="Dificuldades identificadas…"
            rows={2}
            className="w-full"
          />
          <Textarea
            value={positives}
            onChange={(e) => setPositives(e.target.value)}
            placeholder="Pontos positivos…"
            rows={2}
            className="w-full"
          />
          <Textarea
            value={supportNeeds}
            onChange={(e) => setSupportNeeds(e.target.value)}
            placeholder="Necessidades de apoio…"
            rows={2}
            className="w-full"
          />
          <Textarea
            value={managerFeedback}
            onChange={(e) => setManagerFeedback(e.target.value)}
            placeholder="Feedback do gestor…"
            rows={2}
            className="w-full"
          />
          <Textarea
            value={nextActions}
            onChange={(e) => setNextActions(e.target.value)}
            placeholder="Próximas acções…"
            rows={2}
            className="w-full"
          />
          {checkin.employeeFeedback && (
            <div className="rounded-card border border-border bg-surface-sunken p-3 font-body text-xs text-ink-muted">
              <span className="font-medium text-ink">Feedback do colaborador: </span>
              {checkin.employeeFeedback}
            </div>
          )}
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          <Button intent="ghost" disabled={register.isPending} onClick={() => register.mutate('SKIPPED')}>
            Saltar
          </Button>
          <div className="flex gap-2">
            <Button intent="ghost" onClick={onClose}>
              Fechar
            </Button>
            <Button loading={register.isPending} onClick={() => register.mutate('COMPLETED')}>
              Marcar concluído
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}

export function CheckinsTab() {
  const [status, setStatus] = useState('ALL');
  const [overdue, setOverdue] = useState(false);
  const [selected, setSelected] = useState<OnboardingCheckin | null>(null);

  const params = { status: overdue || status === 'ALL' ? undefined : status, overdue: overdue || undefined };
  const { data, isLoading } = useApiQuery<Paginated>(
    queryKeys.onboarding.checkins(params),
    '/onboarding/checkins',
    { params, staleTime: STALE_TIME.DYNAMIC },
  );

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Select items={STATUS_ITEMS} value={status} onValueChange={setStatus} />
        <button
          type="button"
          onClick={() => setOverdue((v) => !v)}
          className={`rounded-control border px-3 py-2 font-body text-sm ${
            overdue ? 'border-danger bg-danger-subtle text-danger-ink' : 'border-border text-ink-muted'
          }`}
        >
          Só em atraso
        </button>
        <span className="ml-auto font-body text-sm text-ink-faint">{data?.meta.total ?? 0} check-ins</span>
      </div>

      {isLoading ? (
        <Skeleton rows={5} />
      ) : !data || data.data.length === 0 ? (
        <EmptyState title="Sem check-ins" description="Nenhum check-in de acompanhamento corresponde aos filtros." />
      ) : (
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          {data.data.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelected(c)}
              className="flex w-full items-center gap-4 border-b border-border px-4 py-3 text-left last:border-0 hover:bg-surface-sunken"
            >
              <Avatar name={c.plan.user.fullName} url={c.plan.user.avatarUrl ?? undefined} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-body text-sm font-medium text-ink">{c.plan.user.fullName}</div>
                <div className="truncate font-body text-xs text-ink-faint">
                  {CHECKIN_TYPE_LABELS[c.type]}
                  {c.responsible && ` · Responsável: ${c.responsible.fullName}`}
                </div>
              </div>
              <div className="hidden shrink-0 font-body text-xs text-ink-faint sm:block">
                {c.dueDate ? fmtDate(c.dueDate) : '—'}
              </div>
              <StatusBadge value={c.status} map={CHECKIN_STATUS_CFG} />
            </button>
          ))}
        </div>
      )}

      {selected && <CheckinRegisterModal checkin={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
