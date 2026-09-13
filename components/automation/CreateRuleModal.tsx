// components/automation/CreateRuleModal.tsx
// Modal "Nova Regra" — separador Automações do módulo de Automação. A página
// só monta o componente quando aberto, por isso o Modal fica sempre `open` e
// delega o fecho em `onClose` (X, Escape, clique fora).
//
// Backend: POST /automation/rules exige @Roles(ADMIN, RH) e espelha
// CreateRuleDto (src/automation/automation.dto.ts) — `name` + `trigger` +
// `action` obrigatórios, todo o resto opcional. O condition builder
// (Condições/Campo/Operador/Valor/Lógica E-OU) grava em conditionsJson e é
// avaliado por evaluateRuleConditions() no engine; os campos da acção
// (Destinatário/Canal/Modelo/Assunto/Dados dinâmicos/Prazo) entram em
// actionParams — só o canal "Notificação interna" tem entrega real, os
// restantes ficam registados para auditoria (ver comentário em
// executeAction() no service). Frequência/Horário/Dias da semana/Datas/Nº
// máx. execuções ficam guardados em triggerConfigJson mas NÃO há ainda um
// scheduler a consumi-los — regras agendadas só correm via "Executar Todas".
// "Registo de execução" não é um campo do formulário: aparece no separador
// Execuções depois de a regra correr pelo menos uma vez.
//
// Invalida queryKeys.automation.rules() (lista) e .stats() (dashboard) para
// apanharem a regra nova sem refresh.

'use client';

import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { cn } from '@/lib/cn';
import { Button, IconButton } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/providers/ToastProvider';

export interface CreateRuleModalProps {
  onClose: () => void;
}

// Mesmo padrão de secção usado em components/scalability/NewIntegrationModal.tsx
// — uma coluna, cabeçalho em maiúsculas, sem tabs (evita o custo/risco de
// testar Radix Tabs num modal que já é grande).
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <h3 className="font-body text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {title}
      </h3>
      {children}
    </div>
  );
}

const NO_CATEGORY = 'NONE';
const NO_ENTITY = 'NONE';
const NO_FREQUENCY = 'NONE';

// Espelha TriggerType em src/automation/automation.dto.ts.
const TRIGGER_ITEMS: { value: string; label: string }[] = [
  { value: 'employee.created', label: 'Novo colaborador criado' },
  { value: 'employee.updated', label: 'Colaborador atualizado' },
  { value: 'role.changed', label: 'Alteração de cargo' },
  { value: 'department.changed', label: 'Alteração de departamento' },
  { value: 'evaluation.submitted', label: 'Avaliação de desempenho concluída' },
  { value: 'pdi.created', label: 'PDI criado' },
  { value: 'pdi.approved', label: 'PDI aprovado' },
  { value: 'pdi.at_risk', label: 'PDI em risco' },
  { value: 'pdi.completed', label: 'PDI concluído' },
  { value: 'course.completed', label: 'Curso concluído' },
  { value: 'course.not_completed', label: 'Curso não concluído' },
  { value: 'certification.expiring', label: 'Certificação a expirar' },
  { value: 'leave.approved', label: 'Férias aprovadas' },
  { value: 'absence.registered', label: 'Ausência registada' },
  { value: 'BIRTHDAY_TODAY', label: 'Aniversário' },
  { value: 'hire_date.reached', label: 'Data de admissão' },
  { value: 'deadline.reached', label: 'Prazo atingido' },
  { value: 'competency.below_expected', label: 'Competência abaixo do nível esperado' },
  { value: 'objective.overdue', label: 'Objetivo em atraso' },
  { value: 'other', label: 'Outro' },
];

// Espelha ActionType em src/automation/automation.dto.ts.
const ACTION_ITEMS: { value: string; label: string }[] = [
  { value: 'send_notification', label: 'Enviar notificação' },
  { value: 'send_email', label: 'Enviar e-mail' },
  { value: 'send_sms', label: 'Enviar SMS' },
  { value: 'send_whatsapp', label: 'Enviar WhatsApp' },
  { value: 'create_task', label: 'Criar tarefa' },
  { value: 'assign_course', label: 'Atribuir curso' },
  { value: 'enroll_training', label: 'Inscrever em formação' },
  { value: 'create_pdi', label: 'Criar PDI' },
  { value: 'update_status', label: 'Atualizar estado' },
  { value: 'assign_owner', label: 'Atribuir responsável' },
  { value: 'request_approval', label: 'Solicitar aprovação' },
  { value: 'create_alert', label: 'Criar alerta' },
  { value: 'webhook', label: 'Executar webhook' },
  { value: 'integrate_external', label: 'Integrar com sistema externo' },
  { value: 'generate_report', label: 'Gerar relatório' },
  { value: 'other', label: 'Outro' },
];

// Espelha o enum AutomationCategory em prisma/schema.prisma.
const CATEGORY_ITEMS: { value: string; label: string }[] = [
  { value: NO_CATEGORY, label: 'Sem categoria' },
  { value: 'HR', label: 'RH' },
  { value: 'LMS', label: 'LMS' },
  { value: 'PERFORMANCE', label: 'Desempenho' },
  { value: 'ENGAGEMENT', label: 'Envolvimento' },
  { value: 'GAMIFICATION', label: 'Gamificação' },
  { value: 'OPERATIONAL', label: 'Operacional' },
  { value: 'CUSTOM', label: 'Personalizado' },
];

// Entidade alvo do gatilho — metadado informativo (dto.entity), não usado no
// matching do engine.
const ENTITY_ITEMS: { value: string; label: string }[] = [
  { value: NO_ENTITY, label: 'Sem entidade específica' },
  { value: 'User', label: 'Colaborador' },
  { value: 'Course', label: 'Curso' },
  { value: 'Enrollment', label: 'Inscrição' },
  { value: 'DevelopmentPlan', label: 'PDI' },
  { value: 'PerformanceReview', label: 'Avaliação de Desempenho' },
  { value: 'Certificate', label: 'Certificação' },
  { value: 'AttendanceRecord', label: 'Ausência / Presença' },
  { value: 'Department', label: 'Departamento' },
  { value: 'Badge', label: 'Badge' },
  { value: 'Other', label: 'Outra' },
];

// Espelha ConditionOperator em automation.dto.ts.
const OPERATOR_ITEMS: { value: string; label: string }[] = [
  { value: 'equals', label: 'Igual a' },
  { value: 'not_equals', label: 'Diferente de' },
  { value: 'greater_than', label: 'Maior que' },
  { value: 'less_than', label: 'Menor que' },
  { value: 'contains', label: 'Contém' },
  { value: 'not_contains', label: 'Não contém' },
  { value: 'is_empty', label: 'Está vazio' },
  { value: 'is_not_empty', label: 'Não está vazio' },
];
const VALUELESS_OPERATORS = new Set(['is_empty', 'is_not_empty']);

const LOGIC_ITEMS: { value: string; label: string }[] = [
  { value: 'AND', label: 'E — todas as condições' },
  { value: 'OR', label: 'OU — qualquer condição' },
];

// Espelha CommunicationChannel em automation.dto.ts.
const CHANNEL_ITEMS: { value: string; label: string }[] = [
  { value: 'internal', label: 'Notificação interna' },
  { value: 'email', label: 'E-mail' },
  { value: 'sms', label: 'SMS' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'push', label: 'Push' },
  { value: 'webhook', label: 'Webhook' },
];

// Espelha RuleFrequency em automation.dto.ts.
const FREQUENCY_ITEMS: { value: string; label: string }[] = [
  { value: NO_FREQUENCY, label: 'Sem agendamento — só o gatilho' },
  { value: 'once', label: 'Uma vez' },
  { value: 'hourly', label: 'De hora a hora' },
  { value: 'daily', label: 'Diária' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'custom', label: 'Personalizada (cron)' },
];

const DAYS_OF_WEEK: { value: number; label: string }[] = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
];

// Espelha RuleEnvironment em automation.dto.ts.
const ENVIRONMENT_ITEMS: { value: string; label: string }[] = [
  { value: 'production', label: 'Produção' },
  { value: 'staging', label: 'Staging' },
  { value: 'development', label: 'Desenvolvimento' },
];

// "Estado" só tem 2 valores reais no backend (AutomationRule.active) — as
// restantes opções do enterprise-spec (Suspensa / Com erro) são estados que
// uma regra atinge depois de correr (ver toggleRule / execuções falhadas),
// nunca uma escolha válida ao criar uma regra nova; "Em configuração" mapeia
// para active=false tal como "Inativa" (ver hint no campo).
const STATE_ITEMS: { value: string; label: string }[] = [
  { value: 'ACTIVE', label: 'Ativa' },
  { value: 'DRAFT', label: 'Em configuração' },
  { value: 'INACTIVE', label: 'Inativa' },
];

interface ConditionRow {
  id: number;
  field: string;
  operator: string;
  value: string;
}

export function CreateRuleModal({ onClose }: CreateRuleModalProps) {
  const notify = useToast();

  // ── Geral ──────────────────────────────────────────────────────
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [trigger, setTrigger] = useState(TRIGGER_ITEMS[0].value);
  const [entity, setEntity] = useState(NO_ENTITY);
  const [category, setCategory] = useState(NO_CATEGORY);

  // ── Condições ──────────────────────────────────────────────────
  const nextConditionId = useRef(1);
  const [conditions, setConditions] = useState<ConditionRow[]>([]);
  const [conditionsLogic, setConditionsLogic] = useState('AND');
  const addCondition = () =>
    setConditions((rows) => [
      ...rows,
      { id: nextConditionId.current++, field: '', operator: OPERATOR_ITEMS[0].value, value: '' },
    ]);
  const updateCondition = (id: number, patch: Partial<ConditionRow>) =>
    setConditions((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const removeCondition = (id: number) =>
    setConditions((rows) => rows.filter((r) => r.id !== id));

  // ── Ação ───────────────────────────────────────────────────────
  const [action, setAction] = useState(ACTION_ITEMS[0].value);
  const [recipient, setRecipient] = useState('');
  const [channel, setChannel] = useState(CHANNEL_ITEMS[0].value);
  const [messageTemplate, setMessageTemplate] = useState('');
  const [subject, setSubject] = useState('');
  const [dynamicData, setDynamicData] = useState('');
  const [dynamicDataError, setDynamicDataError] = useState('');
  const [deadlineMinutes, setDeadlineMinutes] = useState('');

  // ── Agendamento ────────────────────────────────────────────────
  const [frequency, setFrequency] = useState(NO_FREQUENCY);
  const [executionTime, setExecutionTime] = useState('');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const toggleDay = (day: number) =>
    setDaysOfWeek((days) => (days.includes(day) ? days.filter((d) => d !== day) : [...days, day]));
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxExecutions, setMaxExecutions] = useState('');

  // ── Gestão ─────────────────────────────────────────────────────
  const [priority, setPriority] = useState('0');
  const [state, setState] = useState('ACTIVE');
  const [ownerId, setOwnerId] = useState('');
  const [environment, setEnvironment] = useState(ENVIRONMENT_ITEMS[0].value);
  const [notifyOnError, setNotifyOnError] = useState(true);
  const [notes, setNotes] = useState('');

  const [submitError, setSubmitError] = useState('');

  const canSubmit = name.trim().length > 0 && !!trigger && !!action;

  const createRule = useApiMutation(
    (body: Record<string, unknown>) =>
      apiClient.post('/automation/rules', body),
    {
      invalidateKeys: [
        queryKeys.automation.rules(),
        queryKeys.automation.stats(),
      ],
      onSuccess: () => {
        notify({ title: 'Regra criada', intent: 'success' });
        onClose();
      },
      onError: (e: Error) =>
        setSubmitError(e.message || 'Erro ao criar a regra. Tente novamente.'),
    },
  );
  const loading = createRule.isPending;

  const handleSubmit = () => {
    if (!canSubmit || loading) return;
    setSubmitError('');

    if (dynamicData.trim()) {
      try {
        JSON.parse(dynamicData);
        setDynamicDataError('');
      } catch {
        setDynamicDataError('JSON inválido');
        return;
      }
    }

    const validConditions = conditions
      .filter((r) => r.field.trim())
      .map(({ field, operator, value }) => ({
        field: field.trim(),
        operator,
        value: VALUELESS_OPERATORS.has(operator) ? undefined : value.trim() || undefined,
      }));

    createRule.mutate({
      name: name.trim(),
      trigger,
      action,
      active: state === 'ACTIVE',
      notifyOnError,
      priority: Number(priority) || 0,
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(category !== NO_CATEGORY ? { category } : {}),
      ...(entity !== NO_ENTITY ? { entity } : {}),
      ...(validConditions.length
        ? { conditions: validConditions, conditionsLogic }
        : {}),
      ...(recipient.trim() ? { recipient: recipient.trim() } : {}),
      ...(channel ? { channel } : {}),
      ...(messageTemplate.trim() ? { messageTemplate: messageTemplate.trim() } : {}),
      ...(channel === 'email' && subject.trim() ? { subject: subject.trim() } : {}),
      ...(dynamicData.trim() ? { dynamicData: dynamicData.trim() } : {}),
      ...(deadlineMinutes ? { deadlineMinutes: Number(deadlineMinutes) } : {}),
      ...(frequency !== NO_FREQUENCY ? { frequency } : {}),
      ...(executionTime ? { executionTime } : {}),
      ...(frequency === 'weekly' && daysOfWeek.length ? { daysOfWeek } : {}),
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
      ...(maxExecutions ? { maxExecutions: Number(maxExecutions) } : {}),
      ...(ownerId.trim() ? { ownerId: ownerId.trim() } : {}),
      ...(environment ? { environment } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    });
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Nova Regra"
        description="Define um gatilho, condições e a ação a executar quando ele ocorrer."
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-5 space-y-4">
          {submitError && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {submitError}
            </div>
          )}

          <FormField label="Nome da regra *" htmlFor="cr-name">
            <Input
              id="cr-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Notificar RH quando entra colaborador"
              maxLength={200}
            />
          </FormField>

          <Section title="Geral">
            <FormField
              label="Descrição"
              htmlFor="cr-description"
              hint="Opcional — o que esta regra faz e porquê."
            >
              <Textarea
                id="cr-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full"
              />
            </FormField>

            <FormField label="Evento disparador *" htmlFor="cr-trigger">
              <Select
                items={TRIGGER_ITEMS}
                value={trigger}
                onValueChange={setTrigger}
                className="w-full"
              />
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Entidade" htmlFor="cr-entity" hint="Opcional.">
                <Select
                  items={ENTITY_ITEMS}
                  value={entity}
                  onValueChange={setEntity}
                  className="w-full"
                />
              </FormField>
              <FormField label="Categoria" htmlFor="cr-category" hint="Opcional.">
                <Select
                  items={CATEGORY_ITEMS}
                  value={category}
                  onValueChange={setCategory}
                  className="w-full"
                />
              </FormField>
            </div>
          </Section>

          <Section title="Condições">
            <p className="font-body text-xs text-ink-muted">
              Condições adicionais sobre o payload do evento — a regra só executa a ação se
              todas (ou qualquer uma) se verificarem. Sem condições, a regra executa sempre
              que o gatilho ocorre.
            </p>

            {conditions.map((row) => (
                <div key={row.id} className="flex flex-wrap items-start gap-2 rounded-card border border-border p-3">
                  <div className="min-w-[140px] flex-1">
                    <FormField label="Campo da condição" htmlFor={`cr-cond-field-${row.id}`}>
                      <Input
                        id={`cr-cond-field-${row.id}`}
                        value={row.field}
                        onChange={(e) => updateCondition(row.id, { field: e.target.value })}
                        placeholder="ex.: departmentId"
                      />
                    </FormField>
                  </div>
                  <div className="min-w-[150px] flex-1">
                    <FormField label="Operador" htmlFor={`cr-cond-op-${row.id}`}>
                      <Select
                        items={OPERATOR_ITEMS}
                        value={row.operator}
                        onValueChange={(v) => updateCondition(row.id, { operator: v })}
                        className="w-full"
                      />
                    </FormField>
                  </div>
                  {!VALUELESS_OPERATORS.has(row.operator) && (
                    <div className="min-w-[140px] flex-1">
                      <FormField label="Valor da condição" htmlFor={`cr-cond-value-${row.id}`}>
                        <Input
                          id={`cr-cond-value-${row.id}`}
                          value={row.value}
                          onChange={(e) => updateCondition(row.id, { value: e.target.value })}
                        />
                      </FormField>
                    </div>
                  )}
                  <IconButton
                    icon={Trash2}
                    label="Remover condição"
                    intent="ghost"
                    className="mt-6 hover:bg-danger-subtle hover:text-danger"
                    onClick={() => removeCondition(row.id)}
                  />
                </div>
              ))}

              <Button size="sm" intent="secondary" onClick={addCondition}>
                <Plus size={14} strokeWidth={1.75} />
                Adicionar condição
              </Button>

            {conditions.length > 1 && (
              <FormField
                label="Lógica das condições"
                htmlFor="cr-cond-logic"
                hint="Como combinar as condições acima entre si."
              >
                <Select
                  items={LOGIC_ITEMS}
                  value={conditionsLogic}
                  onValueChange={setConditionsLogic}
                  className="w-full"
                />
              </FormField>
            )}
          </Section>

          <Section title="Ação">
            <FormField label="Tipo de ação *" htmlFor="cr-action">
                <Select
                  items={ACTION_ITEMS}
                  value={action}
                  onValueChange={setAction}
                  className="w-full"
                />
              </FormField>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  label="Destinatário"
                  htmlFor="cr-recipient"
                  hint="userId — vazio usa o utilizador do evento."
                >
                  <Input
                    id="cr-recipient"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Ex.: 42"
                  />
                </FormField>
                <FormField label="Canal de comunicação" htmlFor="cr-channel">
                  <Select
                    items={CHANNEL_ITEMS}
                    value={channel}
                    onValueChange={setChannel}
                    className="w-full"
                  />
                </FormField>
              </div>

              {channel !== 'internal' && (
                <p className="font-body text-xs text-ink-muted">
                  Só o canal "Notificação interna" tem entrega automática nesta versão — os
                  restantes ficam registados para auditoria, sem envio real.
                </p>
              )}

              <FormField
                label="Modelo de mensagem"
                htmlFor="cr-message-template"
                hint="Suporta placeholders {{campo}} substituídos pelos dados dinâmicos ou pelo evento."
              >
                <Textarea
                  id="cr-message-template"
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  rows={2}
                  className="w-full"
                  placeholder="Ex.: Olá {{nome}}, o teu curso {{nomeCurso}} está disponível."
                />
              </FormField>

              {channel === 'email' && (
                <FormField label="Assunto" htmlFor="cr-subject">
                  <Input
                    id="cr-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </FormField>
              )}

              <FormField
                label="Dados dinâmicos"
                htmlFor="cr-dynamic-data"
                hint='JSON com valores para os placeholders — ex.: {"nomeCurso": "Excel Avançado"}'
                error={dynamicDataError}
              >
                <Textarea
                  id="cr-dynamic-data"
                  value={dynamicData}
                  onChange={(e) => {
                    setDynamicData(e.target.value);
                    if (dynamicDataError) setDynamicDataError('');
                  }}
                  rows={2}
                  className="w-full font-data"
                  placeholder='{"nomeCurso": "Excel Avançado"}'
                />
              </FormField>

              <FormField
                label="Prazo para execução"
                htmlFor="cr-deadline"
                hint="Minutos após o gatilho — opcional."
              >
                <Input
                  id="cr-deadline"
                  type="number"
                  min={0}
                  value={deadlineMinutes}
                  onChange={(e) => setDeadlineMinutes(e.target.value)}
                  className="max-w-[160px]"
                />
              </FormField>
          </Section>

          <Section title="Agendamento">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Frequência" htmlFor="cr-frequency">
                  <Select
                    items={FREQUENCY_ITEMS}
                    value={frequency}
                    onValueChange={setFrequency}
                    className="w-full"
                  />
                </FormField>
                <FormField label="Horário de execução" htmlFor="cr-execution-time" hint="Opcional.">
                  <Input
                    id="cr-execution-time"
                    type="time"
                    value={executionTime}
                    onChange={(e) => setExecutionTime(e.target.value)}
                  />
                </FormField>
              </div>

              {frequency === 'weekly' && (
                <FormField label="Dias da semana" htmlFor="cr-days-of-week">
                  <div id="cr-days-of-week" className="flex flex-wrap gap-1.5">
                    {DAYS_OF_WEEK.map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => toggleDay(d.value)}
                        aria-pressed={daysOfWeek.includes(d.value)}
                        className={cn(
                          'rounded-control border-[1.5px] px-2.5 py-1 font-body text-xs font-semibold transition-colors',
                          daysOfWeek.includes(d.value)
                            ? 'border-primary bg-primary text-canvas'
                            : 'border-border-strong bg-surface text-ink-muted hover:bg-surface-sunken',
                        )}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </FormField>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField label="Data de início" htmlFor="cr-start-date" hint="Opcional.">
                  <Input
                    id="cr-start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </FormField>
                <FormField label="Data de fim" htmlFor="cr-end-date" hint="Opcional.">
                  <Input
                    id="cr-end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </FormField>
                <FormField
                  label="Nº máximo de execuções"
                  htmlFor="cr-max-executions"
                  hint="Opcional."
                >
                  <Input
                    id="cr-max-executions"
                    type="number"
                    min={1}
                    value={maxExecutions}
                    onChange={(e) => setMaxExecutions(e.target.value)}
                  />
                </FormField>
              </div>

              <p className="font-body text-xs text-ink-muted">
                Estes campos ficam guardados na regra, mas a sua execução periódica ainda
                depende de "Executar Todas" (manual) ou de um cron externo a chamar
                POST /automation/run — não há scheduler automático nesta versão.
              </p>
          </Section>

          <Section title="Gestão">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  label="Prioridade"
                  htmlFor="cr-priority"
                  hint="Ordem de execução — menor corre primeiro."
                >
                  <Input
                    id="cr-priority"
                    type="number"
                    min={0}
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  />
                </FormField>
                <FormField
                  label="Estado"
                  htmlFor="cr-state"
                  hint='"Suspensa" e "Com erro" só acontecem depois de a regra correr.'
                >
                  <Select
                    items={STATE_ITEMS}
                    value={state}
                    onValueChange={setState}
                    className="w-full"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  label="Responsável"
                  htmlFor="cr-owner"
                  hint="Opcional — por omissão, quem cria a regra."
                >
                  <Input
                    id="cr-owner"
                    value={ownerId}
                    onChange={(e) => setOwnerId(e.target.value)}
                    placeholder="ID ou nome do responsável"
                  />
                </FormField>
                <FormField label="Ambiente" htmlFor="cr-environment">
                  <Select
                    items={ENVIRONMENT_ITEMS}
                    value={environment}
                    onValueChange={setEnvironment}
                    className="w-full"
                  />
                </FormField>
              </div>

              <label className="flex items-center gap-2 text-sm text-ink-muted">
                <input
                  type="checkbox"
                  checked={notifyOnError}
                  onChange={(e) => setNotifyOnError(e.target.checked)}
                  className="h-4 w-4 rounded border-border-strong accent-primary"
                />
                Notificar o responsável em caso de erro
              </label>

              <FormField
                label="Observações"
                htmlFor="cr-notes"
                hint="Opcional — notas livres sobre a regra."
              >
                <Textarea
                  id="cr-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full"
                />
              </FormField>

              <p className="font-body text-xs text-ink-muted">
                O registo de cada execução desta regra fica disponível no separador
                "Execuções" depois de criada — não é algo que se defina aqui.
              </p>
          </Section>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            loading={loading}
          >
            Criar regra
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
