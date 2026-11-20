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
import { Building2, MapPin } from 'lucide-react';
import { useDepartmentOptions } from './planData';

interface Paginated {
  data: OnboardingCheckin[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const STATUS_ITEMS = [
  { value: 'ALL', label: 'Todos os estados' },
  ...Object.entries(CHECKIN_STATUS_CFG).map(([value, cfg]) => ({
    value,
    label: cfg.label,
  })),
];

const CHECKINS_GRID =
  'grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-x-6 px-4';

const MANUAL = '__MANUAL__';

// Opções predefinidas (mín. 6) para cada campo do check-in; a última opção do
// selector é sempre "Escrever manualmente".
const FIELD_PRESETS: Record<string, string[]> = {
  difficulties: [
    'Sem dificuldades identificadas',
    'Adaptação às ferramentas e sistemas',
    'Compreensão dos processos internos',
    'Integração com a equipa',
    'Carga de trabalho elevada',
    'Falta de clareza nas responsabilidades',
    'Acesso a sistemas ou equipamentos em falta',
  ],
  positives: [
    'Boa integração com a equipa',
    'Aprendizagem rápida',
    'Proactividade e iniciativa',
    'Cumprimento dos prazos',
    'Boa comunicação',
    'Elevado empenho e motivação',
    'Boa adaptação à cultura da empresa',
  ],
  supportNeeds: [
    'Sem necessidade de apoio adicional',
    'Formação técnica complementar',
    'Acompanhamento mais frequente do gestor',
    'Apoio do mentor/buddy no dia-a-dia',
    'Acesso a ferramentas ou equipamentos',
    'Esclarecimento de processos e responsabilidades',
    'Apoio na integração com outras equipas',
  ],
  managerFeedback: [
    'Integração a decorrer conforme o esperado',
    'Desempenho acima do esperado',
    'Desempenho dentro do esperado',
    'Necessita de maior autonomia',
    'Necessita de melhorar a comunicação',
    'Necessita de acompanhamento próximo',
    'Recomenda-se reforçar a formação',
  ],
  nextActions: [
    'Agendar novo check-in',
    'Reforçar formação obrigatória',
    'Definir objectivos para o próximo período',
    'Reunião com o mentor/buddy',
    'Rever responsabilidades com o colaborador',
    'Providenciar acessos ou equipamentos em falta',
    'Nenhuma acção necessária',
  ],
};

function PresetField({
  label,
  presets,
  value,
  onChange,
}: {
  label: string;
  presets: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  // Valor já guardado que não é uma opção predefinida → modo manual.
  const [manual, setManual] = useState(
    value.trim() !== '' && !presets.includes(value),
  );
  const items = [
    ...presets.map((p) => ({ value: p, label: p })),
    { value: MANUAL, label: 'Escrever manualmente…' },
  ];
  return (
    <div className="space-y-2">
      <Select
        label={label}
        items={items}
        value={manual ? MANUAL : value || undefined}
        onValueChange={(v) => {
          if (v === MANUAL) {
            setManual(true);
            if (presets.includes(value)) onChange('');
          } else {
            setManual(false);
            onChange(v);
          }
        }}
        className="w-full"
      />
      {manual && (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`${label}…`}
          rows={2}
          className="w-full"
        />
      )}
    </div>
  );
}

function CheckinRegisterModal({
  checkin,
  onClose,
}: {
  checkin: OnboardingCheckin;
  onClose: () => void;
}) {
  const notify = useToast();
  const [difficulties, setDifficulties] = useState(checkin.difficulties ?? '');
  const [positives, setPositives] = useState(checkin.positives ?? '');
  const [supportNeeds, setSupportNeeds] = useState(checkin.supportNeeds ?? '');
  const [managerFeedback, setManagerFeedback] = useState(
    checkin.managerFeedback ?? '',
  );
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
          <PresetField
            label="Dificuldades identificadas"
            presets={FIELD_PRESETS.difficulties}
            value={difficulties}
            onChange={setDifficulties}
          />
          <PresetField
            label="Pontos positivos"
            presets={FIELD_PRESETS.positives}
            value={positives}
            onChange={setPositives}
          />
          <PresetField
            label="Necessidades de apoio"
            presets={FIELD_PRESETS.supportNeeds}
            value={supportNeeds}
            onChange={setSupportNeeds}
          />
          <PresetField
            label="Feedback do gestor"
            presets={FIELD_PRESETS.managerFeedback}
            value={managerFeedback}
            onChange={setManagerFeedback}
          />
          <PresetField
            label="Próximas acções"
            presets={FIELD_PRESETS.nextActions}
            value={nextActions}
            onChange={setNextActions}
          />
          {checkin.employeeFeedback && (
            <div className="rounded-card border border-border bg-surface-sunken p-3 font-body text-xs text-ink-muted">
              <span className="font-medium text-ink">
                Feedback do colaborador:{' '}
              </span>
              {checkin.employeeFeedback}
            </div>
          )}
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          <Button
            intent="ghost"
            disabled={register.isPending}
            onClick={() => register.mutate('SKIPPED')}
          >
            Saltar
          </Button>
          <div className="flex gap-2">
            <Button intent="ghost" onClick={onClose}>
              Fechar
            </Button>
            <Button
              loading={register.isPending}
              onClick={() => register.mutate('COMPLETED')}
            >
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
  const [departmentId, setDepartmentId] = useState('ALL');
  const [overdue, setOverdue] = useState(false);
  const [selected, setSelected] = useState<OnboardingCheckin | null>(null);
  const { options: departmentOptions } = useDepartmentOptions();

  const params = {
    departmentId: departmentId === 'ALL' ? undefined : departmentId,
    status: overdue || status === 'ALL' ? undefined : status,
    overdue: overdue || undefined,
  };
  const { data, isLoading } = useApiQuery<Paginated>(
    queryKeys.onboarding.checkins(params),
    '/onboarding/checkins',
    { params, staleTime: STALE_TIME.DYNAMIC },
  );

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Select
          variant="underline"
          icon={MapPin}
          items={STATUS_ITEMS}
          value={status}
          onValueChange={setStatus}
        />
        <Select
          variant="underline"
          icon={Building2}
          items={[
            { value: 'ALL', label: 'Todos os departamentos' },
            ...departmentOptions,
          ]}
          value={departmentId}
          onValueChange={setDepartmentId}
        />
        <button
          type="button"
          onClick={() => setOverdue((v) => !v)}
          aria-pressed={overdue}
          className={`cursor-pointer rounded-control border border-brand px-3 py-2 font-body text-sm font-semibold ${
            overdue ? 'bg-brand text-white' : 'bg-surface text-brand'
          }`}
        >
          Só em atraso
        </button>
      </div>

      {isLoading ? (
        <Skeleton rows={5} />
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          title="Sem check-ins"
          description="Nenhum check-in de acompanhamento corresponde aos filtros."
        />
      ) : (
        <div className="overflow-hidden rounded-[18px] border border-brand-line bg-surface shadow-[0_4px_12px_rgba(21,47,89,0.10)]">
          <div
            className={`${CHECKINS_GRID} bg-brand-dark py-3 text-xs font-semibold uppercase tracking-wider text-white`}
          >
            <div>Colaborador</div>
            <div>Check-in</div>
            <div>Prazo</div>
            <div>Estado</div>
          </div>
          {data.data.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelected(c)}
              className={`${CHECKINS_GRID} w-full cursor-pointer border-b border-brand-line py-[11px] text-left last:border-0`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar
                  name={c.plan.user.fullName}
                  url={c.plan.user.avatarUrl ?? undefined}
                  size="sm"
                />
                <span className="truncate font-body text-sm font-medium text-ink">
                  {c.plan.user.fullName}
                </span>
              </div>
              <div className="truncate font-body text-xs font-semibold text-ink">
                {CHECKIN_TYPE_LABELS[c.type]}
                {c.responsible && ` · Responsável: ${c.responsible.fullName}`}
              </div>
              <div className="font-body text-xs font-semibold text-ink">
                {c.dueDate ? fmtDate(c.dueDate) : '—'}
              </div>
              <StatusBadge
                value={c.status}
                map={CHECKIN_STATUS_CFG}
                className="!bg-transparent !px-0 !text-ink"
              />
            </button>
          ))}
        </div>
      )}

      {selected && (
        <CheckinRegisterModal
          checkin={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
