// components/certificates/RulesTab.tsx
// Regras de emissão por curso ou evento: modo (automático / manual / mediante
// aprovação), critérios e validade. Só ADMIN/RH criam ou alteram; o backend
// valida de novo (critérios, limites, atividade existente).

'use client';

import { useState } from 'react';
import { Box, CalendarDays, GraduationCap, Pencil, Plus } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate } from '@/lib/format';
import { useToast } from '@/providers/ToastProvider';
import { AlertCard } from '@/components/ui/AlertCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { QueryError } from '@/components/ui/QueryError';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { describeCriteria, KIND_LABEL, MODE_LABEL } from './labels';
import type {
  ActivityKind,
  CertificateRuleView,
  IssueMode,
  RuleCriteria,
  TemplateSummaryRow,
} from './types';
import { Checkbox } from '@/components/ui/Checkbox';

interface FormState {
  activityKind: 'COURSE' | 'EVENT';
  activityId: string;
  mode: IssueMode;
  requireFullCompletion: boolean;
  minScore: string;
  minAttendancePct: string;
  requirePracticalPass: boolean;
  requireInstructorApproval: boolean;
  requireManagerApproval: boolean;
  validityDays: string;
  /** '' = não escolhido (fica o corporativo clássico). */
  templateId: string;
  active: boolean;
}

const EMPTY: FormState = {
  activityKind: 'COURSE',
  activityId: '',
  mode: 'AUTOMATIC',
  requireFullCompletion: true,
  minScore: '',
  minAttendancePct: '',
  requirePracticalPass: false,
  requireInstructorApproval: false,
  requireManagerApproval: false,
  validityDays: '',
  templateId: '',
  active: true,
};

const MODE_ITEMS = (Object.keys(MODE_LABEL) as IssueMode[]).map((m) => ({
  value: m,
  label: MODE_LABEL[m],
}));

const KIND_ITEMS = [
  { value: 'COURSE', label: KIND_LABEL.COURSE },
  { value: 'EVENT', label: KIND_LABEL.EVENT },
];

function fromRule(r: CertificateRuleView): FormState {
  return {
    activityKind: r.activityKind === 'EVENT' ? 'EVENT' : 'COURSE',
    activityId: String(r.activityId),
    mode: r.mode,
    requireFullCompletion: !!r.criteria.requireFullCompletion,
    minScore:
      r.criteria.minScore !== undefined ? String(r.criteria.minScore) : '',
    minAttendancePct:
      r.criteria.minAttendancePct !== undefined
        ? String(r.criteria.minAttendancePct)
        : '',
    requirePracticalPass: !!r.criteria.requirePracticalPass,
    requireInstructorApproval: !!r.criteria.requireInstructorApproval,
    requireManagerApproval: !!r.criteria.requireManagerApproval,
    validityDays: r.validityDays ? String(r.validityDays) : '',
    templateId: r.templateId ?? '',
    active: r.active,
  };
}

function toCriteria(f: FormState): RuleCriteria {
  const c: RuleCriteria = {};
  if (f.requireFullCompletion) c.requireFullCompletion = true;
  if (f.minScore !== '') c.minScore = Number(f.minScore);
  if (f.minAttendancePct !== '')
    c.minAttendancePct = Number(f.minAttendancePct);
  if (f.requirePracticalPass) c.requirePracticalPass = true;
  if (f.requireInstructorApproval) c.requireInstructorApproval = true;
  if (f.requireManagerApproval) c.requireManagerApproval = true;
  return c;
}

function validate(f: FormState): string | null {
  if (!f.activityId)
    return 'Escolha o curso ou o evento a que a regra se aplica.';
  const c = toCriteria(f);
  if (Object.keys(c).length === 0)
    return 'Defina pelo menos um critério de emissão.';
  for (const [label, v] of [
    ['A nota mínima', f.minScore],
    ['A presença mínima', f.minAttendancePct],
  ] as const) {
    if (
      v !== '' &&
      !(Number.isInteger(Number(v)) && Number(v) >= 0 && Number(v) <= 100)
    ) {
      return `${label} tem de ser um número inteiro entre 0 e 100.`;
    }
  }
  if (
    f.validityDays !== '' &&
    !(
      Number.isInteger(Number(f.validityDays)) &&
      Number(f.validityDays) >= 1 &&
      Number(f.validityDays) <= 3650
    )
  ) {
    return 'A validade tem de ser um número de dias entre 1 e 3650.';
  }
  return null;
}

interface CheckProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function Check({ id, label, checked, onChange }: CheckProps) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 text-sm text-ink">
      <Checkbox
        id={id}

        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}

function RuleFormModal({
  initial,
  onClose,
}: {
  initial: CertificateRuleView | null;
  onClose: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState<FormState>(
    initial ? fromRule(initial) : EMPTY,
  );
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<FormState>) =>
    setForm((f) => ({ ...f, ...patch }));

  const path = form.activityKind === 'COURSE' ? '/courses' : '/events';
  const listParams = { limit: 100 };
  const activities = useApiQuery<{ data: { id: number; title: string }[] }>(
    [...queryKeys.certificates.all, 'activities', form.activityKind],
    path,
    {
      params: listParams,
      staleTime: STALE_TIME.SEMI_STATIC,
      enabled: !initial,
    },
  );
  const activityItems = (activities.data?.data ?? []).map((a) => ({
    value: String(a.id),
    label: a.title,
  }));

  const templates = useApiQuery<TemplateSummaryRow[]>(
    queryKeys.certificates.templates(),
    '/certificates/templates',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const templateItems = (templates.data ?? []).map((t) => ({
    value: t.id,
    label: t.name,
  }));

  const save = useApiMutation(
    () =>
      apiClient.put('/certificates/rules', {
        activityKind: form.activityKind,
        activityId: Number(form.activityId),
        mode: form.mode,
        criteria: toCriteria(form),
        validityDays:
          form.validityDays === '' ? undefined : Number(form.validityDays),
        ...(form.templateId ? { templateId: form.templateId } : {}),
        active: form.active,
      }),
    {
      invalidateKeys: [
        queryKeys.certificates.rules(),
        queryKeys.certificates.history({}),
      ],
      onSuccess: () => {
        toast({ title: 'Regra de emissão guardada.', intent: 'success' });
        onClose();
      },
      onError: (e) => setError(e.message),
    },
  );

  function submit() {
    const problem = validate(form);
    setError(problem);
    if (!problem) save.mutate(undefined);
  }

  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent
        title={initial ? 'Editar regra de emissão' : 'Nova regra de emissão'}
        description="Define quando o certificado é emitido e que requisitos são verificados."
        navyHeader
      >
        <div className="space-y-4">
          {error && (
            <AlertCard
              variant="danger"
              title="Não foi possível guardar"
              message={error}
              compact
            />
          )}

          {initial ? (
            <p className="text-sm text-ink">
              {KIND_LABEL[initial.activityKind]}:{' '}
              <strong>
                {initial.activityTitle ?? `#${initial.activityId}`}
              </strong>
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField label="Aplica-se a" htmlFor="rule-kind">
                <Select
                  items={KIND_ITEMS}
                  value={form.activityKind}
                  onValueChange={(v) =>
                    set({
                      activityKind: v as 'COURSE' | 'EVENT',
                      activityId: '',
                    })
                  }
                />
              </FormField>
              <FormField label="Atividade" htmlFor="rule-activity">
                <Select
                  items={activityItems}
                  value={form.activityId}
                  onValueChange={(v) => set({ activityId: v })}
                  placeholder="Escolher…"
                />
              </FormField>
            </div>
          )}

          <FormField label="Modo de emissão" htmlFor="rule-mode">
            <Select
              items={MODE_ITEMS}
              value={form.mode}
              onValueChange={(v) => set({ mode: v as IssueMode })}
            />
          </FormField>

          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-medium text-ink">
              Critérios
            </legend>
            <Check
              id="c-completion"
              label="Conteúdo obrigatório concluído"
              checked={form.requireFullCompletion}
              onChange={(v) => set({ requireFullCompletion: v })}
            />
            <Check
              id="c-practical"
              label="Avaliação prática aprovada"
              checked={form.requirePracticalPass}
              onChange={(v) => set({ requirePracticalPass: v })}
            />
            <Check
              id="c-instructor"
              label="Aprovação do instrutor"
              checked={form.requireInstructorApproval}
              onChange={(v) => set({ requireInstructorApproval: v })}
            />
            <Check
              id="c-manager"
              label="Aprovação do gestor"
              checked={form.requireManagerApproval}
              onChange={(v) => set({ requireManagerApproval: v })}
            />
            <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
              <FormField label="Nota mínima (%)" htmlFor="c-score">
                <Input
                  id="c-score"
                  type="number"
                  min={0}
                  max={100}
                  value={form.minScore}
                  onChange={(e) => set({ minScore: e.target.value })}
                />
              </FormField>
              <FormField label="Presença mínima (%)" htmlFor="c-attendance">
                <Input
                  id="c-attendance"
                  type="number"
                  min={0}
                  max={100}
                  value={form.minAttendancePct}
                  onChange={(e) => set({ minAttendancePct: e.target.value })}
                />
              </FormField>
            </div>
          </fieldset>

          <FormField
            label="Validade (dias)"
            htmlFor="rule-validity"
            hint="Deixe vazio para um certificado sem expiração."
          >
            <Input
              id="rule-validity"
              type="number"
              min={1}
              max={3650}
              value={form.validityDays}
              onChange={(e) => set({ validityDays: e.target.value })}
            />
          </FormField>

          <FormField
            label="Modelo de certificado"
            htmlFor="rule-template"
            hint="Sem escolha, usa o Corporativo clássico."
          >
            <Select
              items={templateItems}
              value={form.templateId}
              onValueChange={(v) => set({ templateId: v })}
              placeholder="Corporativo clássico (predefinido)"
            />
          </FormField>

          <Check
            id="rule-active"
            label="Regra activa"
            checked={form.active}
            onChange={(v) => set({ active: v })}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button intent="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={save.isPending}>
              {save.isPending ? 'A guardar…' : 'Guardar regra'}
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}

/** Lâmpada sobre livros, como no desenho de referência das regras. */
function RuleIllustration() {
  return (
    <svg
      viewBox="0 0 120 150"
      className="h-[70px] w-[52px]"
      role="presentation"
    >
      <defs>
        <radialGradient id="rule-bulb" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#FFE680" />
          <stop offset="100%" stopColor="#F5B800" />
        </radialGradient>
      </defs>
      <g stroke="#F5C542" strokeWidth="3" strokeLinecap="round">
        <path d="M60 4v10M24 18l7 7M96 18l-7 7M10 50h10M100 50h10" />
      </g>
      <circle cx="60" cy="46" r="27" fill="url(#rule-bulb)" />
      <rect x="50" y="70" width="20" height="14" rx="3" fill="#2F6FDB" />
      <rect x="6" y="104" width="108" height="16" rx="3" fill="#E8EEF9" />
      <rect x="6" y="116" width="108" height="14" rx="3" fill="#2F6FDB" />
      <rect x="16" y="86" width="90" height="16" rx="3" fill="#E8EEF9" />
      <rect x="16" y="98" width="90" height="12" rx="3" fill="#1F55B8" />
    </svg>
  );
}

export function RulesTab({ canEdit }: { canEdit: boolean }) {
  const templates = useApiQuery<TemplateSummaryRow[]>(
    queryKeys.certificates.templates(),
    '/certificates/templates',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const templateName = (id: string | null) =>
    id
      ? (templates.data?.find((t) => t.id === id)?.name ??
        'Modelo personalizado')
      : 'Corporativo clássico';
  const [editing, setEditing] = useState<CertificateRuleView | 'new' | null>(
    null,
  );
  const { data, isLoading, error, refetch } = useApiQuery<
    CertificateRuleView[]
  >(queryKeys.certificates.rules(), '/certificates/rules', {
    staleTime: STALE_TIME.DYNAMIC,
  });

  if (isLoading) return <Skeleton rows={3} />;
  if (error) return <QueryError error={error} onRetry={() => void refetch()} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          Cursos e eventos sem regra própria emitem o certificado quando o
          conteúdo está concluído (cursos) ou a presença está confirmada
          (eventos).
        </p>
        {canEdit && (
          <Button onClick={() => setEditing('new')}>
            <Plus size={14} strokeWidth={1.75} />
            Nova regra
          </Button>
        )}
      </div>

      {!data || data.length === 0 ? (
        <EmptyState
          title="Sem regras configuradas"
          description="Ainda não há regras de emissão personalizadas."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {data.map((r) => (
            <article
              key={r.id}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B1A38] via-[#0F2A5C] to-[#12388A] text-white shadow-md"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 400 200"
                preserveAspectRatio="none"
                className="pointer-events-none absolute bottom-0 right-0 h-3/4 w-3/4 opacity-60"
              >
                <path
                  d="M400 20 C300 80 220 150 120 200 L400 200 Z"
                  fill="#1D4FB8"
                />
              </svg>
              <div className="relative flex gap-3 px-4 py-3">
                <div
                  aria-hidden="true"
                  className="flex w-[70px] shrink-0 items-center justify-center self-stretch border-r border-white/25 pr-3"
                >
                  <RuleIllustration />
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-[17px] font-bold leading-tight">
                      {r.activityTitle ??
                        `${KIND_LABEL[r.activityKind as ActivityKind]} #${r.activityId}`}
                    </h3>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        r.active
                          ? 'bg-green-200 text-green-900'
                          : 'bg-white/20 text-white'
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${r.active ? 'bg-green-600' : 'bg-white/60'}`}
                      />
                      {r.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <GraduationCap size={14} strokeWidth={1.75} />
                    <span>
                      {KIND_LABEL[r.activityKind as ActivityKind]} ·{' '}
                      {MODE_LABEL[r.mode]}
                    </span>
                  </div>
                  <ul className="flex flex-wrap items-start gap-1">
                    {describeCriteria(r.criteria).map((c) => (
                      <li
                        key={c}
                        className="inline-flex items-center gap-1.5 rounded-full bg-green-200 px-2.5 py-0.5 text-xs font-semibold text-green-950"
                      >
                        <span className="h-2 w-2 rounded-full bg-green-600" />
                        {c}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-2 text-xs">
                    <Box size={14} strokeWidth={1.75} />
                    <span>Modelo: {templateName(r.templateId)}</span>
                  </div>
                </div>
              </div>
              <div className="relative flex items-center justify-between gap-3 bg-black/25 px-4 py-2 text-xs">
                <span className="flex items-center gap-2">
                  <CalendarDays size={14} strokeWidth={1.75} />
                  {r.validityDays
                    ? `Validade ${r.validityDays} dias`
                    : 'Sem expiração'}
                  {' · '}
                  Actualizada em {formatDate(r.updatedAt)}
                </span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setEditing(r)}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-1 text-sm font-bold text-[#0F1F3D] hover:bg-white/90"
                  >
                    <Pencil size={14} strokeWidth={1.75} />
                    Editar
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && (
        <RuleFormModal
          initial={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
