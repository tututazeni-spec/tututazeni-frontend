// components/leave/SettingsTab.tsx
// Aba Configurações (docs/Modulo_Leave.md §10). ADMIN/RH mantêm as regras da
// organização — cada gravação é uma versão com data de entrada em vigor e
// motivo, visível no histórico; os restantes aprovadores só gerem as suas
// próprias substituições. O backend é a autoridade das validações.

'use client';

import { useState } from 'react';
import {
  AlertCircle,
  CalendarClock,
  CalendarCog,
  CheckCircle2,
  History,
  Plug,
  Scale,
  ShieldCheck,
  UserRoundCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { QueryError } from '@/components/ui/QueryError';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Textarea } from '@/components/ui/Textarea';
import { useApiMutation } from '@/hooks/useApiQuery';
import { useLeaveSettings } from '@/hooks/useLeave';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { cn } from '@/lib/cn';
import { queryKeys } from '@/lib/queryKeys';
import { ABSENCE_TYPE_LABELS, CATEGORY_LABELS } from './constants';
import { DelegationsPanel } from './DelegationsPanel';
import { HolidaysPanel } from './HolidaysPanel';
import {
  ChipMultiSelect,
  OptionalNumberField,
  RequiredNumberField,
  SettingsSection,
  ToggleRow,
  WeekdayPicker,
} from './SettingsFields';
import { SettingsHistoryPanel } from './SettingsHistoryPanel';
import {
  DAY_COUNT_RULE_LABELS,
  SETTING_LABELS,
  changedSettings,
  validateDraft,
} from './settingsMeta';
import type {
  AbsenceOccurrenceType,
  DayCountRule,
  LeaveCategory,
  LeaveSettings,
  SettingsOverview,
} from './types';

type SectionKey =
  | 'calendar'
  | 'holidays'
  | 'balances'
  | 'approvals'
  | 'absences'
  | 'integrations'
  | 'delegations'
  | 'history';

const SECTIONS: Array<{
  key: SectionKey;
  label: string;
  icon: LucideIcon;
  adminOnly: boolean;
  /** Secções que editam o rascunho de configurações (mostram a barra de gravar). */
  form: boolean;
}> = [
  { key: 'calendar', label: 'Calendário e contagem', icon: CalendarCog, adminOnly: true, form: true },
  { key: 'holidays', label: 'Feriados', icon: CalendarClock, adminOnly: true, form: false },
  { key: 'balances', label: 'Saldos e pedidos', icon: Scale, adminOnly: true, form: true },
  { key: 'approvals', label: 'Aprovação e cancelamento', icon: CheckCircle2, adminOnly: true, form: true },
  { key: 'absences', label: 'Ausências e permissões', icon: ShieldCheck, adminOnly: true, form: true },
  { key: 'integrations', label: 'Integrações', icon: Plug, adminOnly: true, form: true },
  { key: 'delegations', label: 'Substituições', icon: UserRoundCheck, adminOnly: false, form: false },
  { key: 'history', label: 'Histórico', icon: History, adminOnly: true, form: false },
];

const OCCURRENCE_OPTIONS = (
  Object.entries(ABSENCE_TYPE_LABELS) as Array<[AbsenceOccurrenceType, string]>
).map(([value, label]) => ({ value, label }));

const CATEGORY_OPTIONS = (
  Object.entries(CATEGORY_LABELS) as Array<[LeaveCategory, string]>
).map(([value, label]) => ({ value, label }));

const RULE_ITEMS = (Object.keys(DAY_COUNT_RULE_LABELS) as DayCountRule[]).map(
  (value) => ({ value, label: DAY_COUNT_RULE_LABELS[value] }),
);

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('pt-PT');

export interface SettingsTabProps {
  isAdmin: boolean;
}

export function SettingsTab({ isAdmin }: SettingsTabProps) {
  const visible = SECTIONS.filter((s) => isAdmin || !s.adminOnly);
  const [section, setSection] = useState<SectionKey>(visible[0].key);
  const current = visible.find((s) => s.key === section) ?? visible[0];

  const { data, loading, error } = useLeaveSettings(isAdmin);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[15rem_1fr]">
      <nav className="space-y-1" aria-label="Secções das configurações">
        {visible.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSection(s.key)}
            aria-current={current.key === s.key ? 'page' : undefined}
            className={cn(
              'flex w-full items-center gap-2 rounded-control px-3 py-2 text-left text-sm transition-colors',
              current.key === s.key
                ? 'bg-primary-subtle font-semibold text-primary'
                : 'text-ink-muted hover:bg-surface-sunken hover:text-ink',
            )}
          >
            <s.icon size={16} strokeWidth={1.75} />
            {s.label}
          </button>
        ))}
      </nav>

      <div className="min-w-0 space-y-4">
        {current.form && isAdmin ? (
          error ? (
            <QueryError error={error} title="Não foi possível carregar as configurações" />
          ) : loading || !data ? (
            <Skeleton rows={4} />
          ) : (
            <SettingsForm
              // Reinicia o rascunho quando entra uma versão nova (em vigor ou agendada).
              key={`${data.versionId ?? 'default'}-${data.upcoming?.versionId ?? 'none'}`}
              overview={data}
              section={current.key}
            />
          )
        ) : null}

        {current.key === 'holidays' && isAdmin && <HolidaysPanel />}
        {current.key === 'delegations' && <DelegationsPanel isAdmin={isAdmin} />}
        {current.key === 'history' && isAdmin && <SettingsHistoryPanel />}
      </div>
    </div>
  );
}

// ─── Formulário (rascunho partilhado entre as secções de regras) ────────────

interface SettingsFormProps {
  overview: SettingsOverview;
  section: SectionKey;
}

function SettingsForm({ overview, section }: SettingsFormProps) {
  const notify = useToast();
  const server = overview.settings;
  const [draft, setDraft] = useState<LeaveSettings>(server);
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [changeNote, setChangeNote] = useState('');
  const [error, setError] = useState('');

  const set = <K extends keyof LeaveSettings>(key: K, value: LeaveSettings[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const changes = changedSettings(server, draft);
  const changedKeys = Object.keys(changes) as Array<keyof LeaveSettings>;
  const problem = validateDraft(draft);
  const dirty = changedKeys.length > 0;

  const save = useApiMutation(
    () =>
      apiClient.patch('/leave/settings', {
        ...changes,
        effectiveFrom: effectiveFrom || undefined,
        changeNote: changeNote.trim(),
      }),
    {
      invalidateKeys: [queryKeys.leave.all],
      onSuccess: () => {
        setChangeNote('');
        setEffectiveFrom('');
        setError('');
        notify({
          title: effectiveFrom
            ? 'Alteração agendada'
            : 'Configurações guardadas',
          intent: 'success',
        });
      },
      onError: (e) => setError(e.message),
    },
  );

  return (
    <>
      {overview.upcoming && (
        <div className="flex items-start gap-2 rounded-card bg-info-subtle p-3 text-sm text-info-ink">
          <CalendarClock size={16} strokeWidth={1.75} className="mt-0.5" />
          <span>
            Há uma alteração agendada para{' '}
            <strong>{fmtDate(overview.upcoming.effectiveFrom)}</strong>:{' '}
            {overview.upcoming.changedKeys
              .map((k) => SETTING_LABELS[k] ?? k)
              .join(', ')}
            .
          </span>
        </div>
      )}
      {overview.effectiveFrom && (
        <p className="text-xs text-ink-faint">
          Versão em vigor desde {fmtDate(overview.effectiveFrom)}.
        </p>
      )}

      {section === 'calendar' && <CalendarSection draft={draft} set={set} />}
      {section === 'balances' && <BalancesSection draft={draft} set={set} />}
      {section === 'approvals' && <ApprovalsSection draft={draft} set={set} />}
      {section === 'absences' && <AbsencesSection draft={draft} set={set} />}
      {section === 'integrations' && <IntegrationsSection draft={draft} set={set} />}

      {dirty && (
        <Card className="sticky bottom-4 z-10 space-y-3 border-primary p-4 shadow-elevated">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-ink">
              {changedKeys.length} alteraç{changedKeys.length === 1 ? 'ão' : 'ões'}{' '}
              por guardar
            </p>
            <p className="text-xs text-ink-faint">
              {changedKeys.map((k) => SETTING_LABELS[k]).join(' · ')}
            </p>
          </div>
          {(error || problem) && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {problem ?? error}
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[12rem_1fr]">
            <FormField
              label="Em vigor a partir de"
              htmlFor="settings-effective"
              hint="Vazio = já"
            >
              <Input
                id="settings-effective"
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField label="Motivo da alteração *" htmlFor="settings-note">
              <Textarea
                id="settings-note"
                rows={2}
                maxLength={500}
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
                placeholder="Fica registado no histórico"
                className="w-full"
              />
            </FormField>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              intent="ghost"
              onClick={() => {
                setDraft(server);
                setError('');
              }}
            >
              Descartar
            </Button>
            <Button
              loading={save.isPending}
              disabled={!changeNote.trim() || !!problem}
              onClick={() => {
                setError('');
                save.mutate(undefined);
              }}
            >
              Guardar configurações
            </Button>
          </div>
        </Card>
      )}
    </>
  );
}

interface SectionProps {
  draft: LeaveSettings;
  set: <K extends keyof LeaveSettings>(key: K, value: LeaveSettings[K]) => void;
}

function CalendarSection({ draft, set }: SectionProps) {
  const hasWindow = !!draft.vacationWindowStart || !!draft.vacationWindowEnd;
  return (
    <>
      <SettingsSection
        title="Ano de referência e período de férias"
        description="O período limita quando as férias podem ser gozadas; fora dele o pedido é recusado."
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <OptionalNumberField
            id="set-year"
            label="Ano de referência"
            hint="Vazio = ano do pedido"
            value={draft.referenceYear}
            onChange={(v) => set('referenceYear', v)}
            min={2000}
            max={2100}
          />
          <FormField label="Período de férias: início" htmlFor="set-vac-start" hint="Mês-dia (MM-DD)">
            <Input
              id="set-vac-start"
              placeholder="06-01"
              maxLength={5}
              value={draft.vacationWindowStart ?? ''}
              onChange={(e) => set('vacationWindowStart', e.target.value || null)}
              className="w-full"
            />
          </FormField>
          <FormField
            label="Período de férias: fim"
            htmlFor="set-vac-end"
            hint="Pode atravessar o fim do ano"
            error={
              hasWindow && !(draft.vacationWindowStart && draft.vacationWindowEnd)
                ? 'Indique início e fim'
                : undefined
            }
          >
            <Input
              id="set-vac-end"
              placeholder="09-30"
              maxLength={5}
              value={draft.vacationWindowEnd ?? ''}
              onChange={(e) => set('vacationWindowEnd', e.target.value || null)}
              className="w-full"
            />
          </FormField>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Semana de trabalho e horário"
        description="Os dias fora da semana de trabalho não contam como dias úteis em nenhum cálculo do módulo."
      >
        <WeekdayPicker value={draft.workWeekDays} onChange={(v) => set('workWeekDays', v)} />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <FormField label="Início do horário" htmlFor="set-wd-start">
            <Input
              id="set-wd-start"
              type="time"
              value={draft.workdayStart}
              onChange={(e) => set('workdayStart', e.target.value)}
              className="w-full"
            />
          </FormField>
          <FormField label="Fim do horário" htmlFor="set-wd-end">
            <Input
              id="set-wd-end"
              type="time"
              value={draft.workdayEnd}
              onChange={(e) => set('workdayEnd', e.target.value)}
              className="w-full"
            />
          </FormField>
          <RequiredNumberField
            id="set-hpd"
            label="Horas por dia"
            hint="Converte licenças em horas para dias"
            value={draft.hoursPerDay}
            onChange={(v) => set('hoursPerDay', v)}
            min={1}
            max={24}
            suffix="h"
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Regra de contagem de dias"
        description="Decide se um pedido gasta dias úteis ou de calendário. “Conforme cada tipo” respeita o que cada tipo de ausência define."
      >
        <FormField label="Regra" htmlFor="set-rule">
          <Select
            items={RULE_ITEMS}
            value={draft.dayCountRule}
            onValueChange={(v) => set('dayCountRule', v as DayCountRule)}
            className="w-full md:w-80"
          />
        </FormField>
      </SettingsSection>
    </>
  );
}

function BalancesSection({ draft, set }: SectionProps) {
  return (
    <>
      <SettingsSection
        title="Transição de dias"
        description="Aplicada quando o RH processa a transição de fim de ano; é idempotente por ano."
      >
        <ToggleRow
          label="Permitir transição de saldos"
          description="Desligada, nenhum saldo transita para o ano seguinte."
          checked={draft.carryOverEnabled}
          onChange={(v) => set('carryOverEnabled', v)}
        />
        <OptionalNumberField
          id="set-co-max"
          label="Limite global de transição"
          hint="Tecto para todos os tipos; o limite de cada tipo continua a valer se for menor"
          value={draft.carryOverMaxDays}
          onChange={(v) => set('carryOverMaxDays', v)}
          max={365}
          suffix="dias"
        />
      </SettingsSection>

      <SettingsSection
        title="Limites de antecedência"
        description="Valem para os tipos que não definem a sua própria antecedência mínima."
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <OptionalNumberField
            id="set-min-notice"
            label="Antecedência mínima"
            value={draft.minNoticeDays}
            onChange={(v) => set('minNoticeDays', v)}
            max={365}
            suffix="dias úteis"
          />
          <OptionalNumberField
            id="set-max-advance"
            label="Antecedência máxima"
            hint="Quão cedo se pode pedir"
            value={draft.maxAdvanceDays}
            onChange={(v) => set('maxAdvanceDays', v)}
            min={1}
            max={1095}
            suffix="dias"
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Documentos e substituto"
        description="Categorias de tipos que exigem comprovativo na submissão (somam-se ao que cada tipo já exige)."
      >
        <ChipMultiSelect
          ariaLabel="Categorias com documento obrigatório"
          options={CATEGORY_OPTIONS}
          value={draft.documentRequiredCategories as LeaveCategory[]}
          onChange={(v) => set('documentRequiredCategories', v)}
        />
        <OptionalNumberField
          id="set-substitute"
          label="Exigir substituto acima de"
          hint="Pedidos mais longos têm de indicar quem substitui"
          value={draft.substituteRequiredOverDays}
          onChange={(v) => set('substituteRequiredOverDays', v)}
          min={1}
          max={365}
          suffix="dias úteis"
        />
      </SettingsSection>
    </>
  );
}

function ApprovalsSection({ draft, set }: SectionProps) {
  return (
    <>
      <SettingsSection
        title="Prazos de decisão e escalonamento"
        description="Todos os dias às 08:00 o aprovador em atraso é lembrado; se definir um limite, a etapa é escalada para o RH."
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <RequiredNumberField
            id="set-sla"
            label="Prazo de decisão por omissão"
            hint="Usado quando a política aplicável não define o seu"
            value={draft.decisionSlaDays}
            onChange={(v) => set('decisionSlaDays', v)}
            min={1}
            max={60}
            suffix="dias"
          />
          <OptionalNumberField
            id="set-escalation"
            label="Escalar para o RH após atraso de"
            hint="Vazio = só lembrar, nunca escalar"
            value={draft.escalationAfterDays}
            onChange={(v) => set('escalationAfterDays', v)}
            min={1}
            max={60}
            suffix="dias"
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Cancelamento e alteração"
        description="ADMIN e RH cancelam sempre, fora destes limites; fica registado quem cancelou."
      >
        <ToggleRow
          label="O colaborador pode cancelar pedidos aprovados"
          description="Desligado, só o RH cancela licenças já aprovadas."
          checked={draft.employeeCanCancelApproved}
          onChange={(v) => set('employeeCanCancelApproved', v)}
        />
        <OptionalNumberField
          id="set-cancel-days"
          label="Cancelar aprovados só até"
          hint="Dias antes do início; vazio = até ao próprio dia"
          value={draft.cancelApprovedMinDaysBefore}
          onChange={(v) => set('cancelApprovedMinDaysBefore', v)}
          max={365}
          suffix="dias antes"
        />
      </SettingsSection>
    </>
  );
}

function AbsencesSection({ draft, set }: SectionProps) {
  return (
    <>
      <SettingsSection
        title="Categorias justificadas e injustificadas"
        description="Classificam as ocorrências nos relatórios enquanto a justificação não foi decidida."
      >
        <div>
          <p className="mb-2 text-xs font-semibold text-ink-muted">Justificadas</p>
          <ChipMultiSelect
            ariaLabel="Ocorrências justificadas"
            options={OCCURRENCE_OPTIONS}
            value={draft.justifiedOccurrenceTypes}
            onChange={(v) => set('justifiedOccurrenceTypes', v)}
          />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold text-ink-muted">Injustificadas</p>
          <ChipMultiSelect
            ariaLabel="Ocorrências injustificadas"
            options={OCCURRENCE_OPTIONS}
            value={draft.unjustifiedOccurrenceTypes}
            onChange={(v) => set('unjustifiedOccurrenceTypes', v)}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Cobertura operacional"
        description="Percentagem máxima de uma equipa ausente em simultâneo quando nenhuma política do departamento a define."
      >
        <RequiredNumberField
          id="set-coverage"
          label="Máximo de ausentes"
          value={draft.defaultMaxAbsencePercent}
          onChange={(v) => set('defaultMaxAbsencePercent', v)}
          min={1}
          max={100}
          suffix="%"
        />
      </SettingsSection>

      <SettingsSection
        title="Permissões do gestor"
        description="ADMIN e RH têm sempre acesso. Estas opções limitam o que os gestores, directores e líderes podem fazer no seu âmbito."
      >
        <ToggleRow
          label="Gestores registam ausências da equipa"
          checked={draft.managerCanRegisterAbsences}
          onChange={(v) => set('managerCanRegisterAbsences', v)}
        />
        <ToggleRow
          label="Gestores validam justificações da equipa"
          checked={draft.managerCanValidateAbsences}
          onChange={(v) => set('managerCanValidateAbsences', v)}
        />
      </SettingsSection>
    </>
  );
}

function IntegrationsSection({ draft, set }: SectionProps) {
  return (
    <SettingsSection
      title="Integrações"
      description="O módulo envia sempre notificações e eventos para as Automações; aqui controla o que parte para outros módulos."
    >
      <ToggleRow
        label="Sincronizar licenças aprovadas com a assiduidade"
        description="Marca “Em licença” nos dias úteis, sem duplicar registos de presença. Cancelar o pedido remove essas marcas."
        checked={draft.syncAttendance}
        onChange={(v) => set('syncAttendance', v)}
      />
      <ToggleRow
        label="Disponibilizar ausências validadas ao processamento salarial"
        description="Só dados validados e necessários; tipos sensíveis (saúde) saem sem detalhe. Não calcula descontos."
        checked={draft.payrollFeedEnabled}
        onChange={(v) => set('payrollFeedEnabled', v)}
      />
      <ToggleRow
        label="Notificar o RH de cada aprovação final"
        checked={draft.notifyHrOnApproval}
        onChange={(v) => set('notifyHrOnApproval', v)}
      />
    </SettingsSection>
  );
}
