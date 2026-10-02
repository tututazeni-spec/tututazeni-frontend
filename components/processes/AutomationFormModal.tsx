// components/processes/AutomationFormModal.tsx
// Criar/editar uma regra de automação dos processos (docs/Modulo_Processes.md
// §9): evento, condições, acção, destinatários, prioridade, vigência,
// repetição e tratamento de erros. As regras são do módulo de Automações
// (POST/PUT /processes/automations); aqui só se configuram.

'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/providers/ToastProvider';
import { RecipientPicker } from './ActionListEditor';
import { ConditionEditor } from './ConditionEditor';
import type {
  AutomationCatalog,
  AutomationInput,
  AutomationRule,
  AutomationTemplate,
  ErrorHandling,
  RetryPolicy,
} from './automation-types';
import type { ConditionDraft } from './workflow-model';

export interface AutomationFormModalProps {
  catalog: AutomationCatalog;
  initial?: AutomationRule;
  template?: AutomationTemplate;
  onClose: () => void;
}

const toDateInput = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : '');

export function AutomationFormModal({ catalog, initial, template, onClose }: AutomationFormModalProps) {
  const notify = useToast();
  const editing = !!initial;
  const seed = initial ?? template;

  const [name, setName] = useState(initial?.name ?? template?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? template?.description ?? '');
  const [code, setCode] = useState(initial?.code ?? '');
  const [trigger, setTrigger] = useState(seed?.trigger ?? catalog.events[0]?.value ?? '');
  const [customTrigger, setCustomTrigger] = useState('');
  const [action, setAction] = useState(seed?.action ?? 'send_notification');
  const [params, setParams] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(seed?.actionParams ?? {}).map(([k, v]) => [k, String(v ?? '')])),
  );
  const [recipients, setRecipients] = useState<string[]>(
    initial?.recipients ?? template?.recipients ?? [],
  );
  const [conditions, setConditions] = useState<ConditionDraft | null>(
    seed?.conditions
      ? {
          logic: seed.conditions.logic,
          rows: seed.conditions.rows.map((r) => ({ field: r.field, operator: r.operator, value: r.value ?? '' })),
        }
      : null,
  );
  const [priority, setPriority] = useState(String(initial?.priority ?? 10));
  const [activeFrom, setActiveFrom] = useState(toDateInput(initial?.activeFrom));
  const [activeUntil, setActiveUntil] = useState(toDateInput(initial?.activeUntil));
  const [active, setActive] = useState(initial?.active ?? true);
  const [maxRetries, setMaxRetries] = useState(String(initial?.maxRetries ?? template?.maxRetries ?? 0));
  const [retryPolicy, setRetryPolicy] = useState<RetryPolicy>(
    initial?.retryPolicy ?? template?.retryPolicy ?? 'NONE',
  );
  const [retryDelay, setRetryDelay] = useState(String(initial?.retryDelayMinutes ?? 5));
  const [errorHandling, setErrorHandling] = useState<ErrorHandling>(
    initial?.errorHandling ?? template?.errorHandling ?? 'NOTIFY_OWNER',
  );
  const [error, setError] = useState('');

  const eventKnown = catalog.events.some((e) => e.value === trigger);
  const act = catalog.actions.find((a) => a.value === action);
  const effectiveTrigger = trigger === '__custom' ? customTrigger.trim() : trigger;

  const save = useApiMutation(
    (body: AutomationInput) =>
      editing
        ? apiClient.put(`/processes/automations/${initial.id}`, body)
        : apiClient.post('/processes/automations', body),
    {
      invalidateKeys: [queryKeys.processes.all],
      onSuccess: () => {
        notify({ title: editing ? 'Regra actualizada' : 'Regra criada', intent: 'success' });
        onClose();
      },
      onError: (e) => setError(e.message || 'Erro ao guardar a regra.'),
    },
  );

  const missingParam = act?.params.find((p) => p.required && !(params[p.key] ?? '').trim());
  const canSubmit =
    name.trim().length > 0 &&
    effectiveTrigger.length > 0 &&
    !missingParam &&
    (!act?.needsRecipients || recipients.length > 0);

  const submit = () => {
    if (!canSubmit) return;
    setError('');
    const actionParams: Record<string, unknown> = {};
    for (const p of act?.params ?? []) {
      const v = (params[p.key] ?? '').trim();
      if (v) actionParams[p.key] = p.type === 'number' ? Number(v) : v;
    }
    for (const [k, v] of Object.entries(params)) {
      if (!(k in actionParams) && v.trim() && !act?.params.some((p) => p.key === k)) actionParams[k] = v;
    }
    save.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      code: code.trim() || undefined,
      trigger: effectiveTrigger,
      action,
      actionParams,
      recipients: recipients.length ? recipients : undefined,
      conditions: conditions?.rows.length
        ? {
            logic: conditions.logic,
            rows: conditions.rows.map((r) => ({
              field: r.field,
              operator: r.operator,
              ...(r.value !== '' ? { value: r.value } : {}),
            })),
          }
        : undefined,
      priority: Number(priority) || 0,
      activeFrom: activeFrom || undefined,
      activeUntil: activeUntil || undefined,
      active,
      maxRetries: Number(maxRetries) || 0,
      retryPolicy,
      retryDelayMinutes: Number(retryDelay) || undefined,
      errorHandling,
    });
  };

  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent
        title={editing ? `Editar regra ${initial.code ?? ''}` : 'Nova regra de automação'}
        description="Quando acontece um evento e as condições se verificam, o sistema executa a acção."
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
      >
        <div className="mt-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Nome *" htmlFor="af-name">
              <Input id="af-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={200} />
            </FormField>
            <FormField label="Código" htmlFor="af-code" hint="Gerado se vazio (AUT-PROC-NNN).">
              <Input id="af-code" value={code} onChange={(e) => setCode(e.target.value)} disabled={editing} />
            </FormField>
          </div>
          <FormField label="Descrição" htmlFor="af-desc">
            <Textarea id="af-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full" />
          </FormField>

          <section>
            <h4 className="mb-2 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">1. Quando</h4>
            <FormField label="Evento desencadeador *" htmlFor="af-trigger">
              <Select
                items={[
                  ...catalog.events.map((e) => ({ value: e.value, label: `${e.module} — ${e.label}` })),
                  { value: '__custom', label: 'Evento personalizado…' },
                ]}
                value={eventKnown || trigger === '__custom' ? trigger : '__custom'}
                onValueChange={setTrigger}
                className="w-full"
              />
            </FormField>
            {trigger === '__custom' && (
              <div className="mt-2">
                <Input
                  value={customTrigger}
                  onChange={(e) => setCustomTrigger(e.target.value)}
                  placeholder="modulo.evento (ex.: process.custom_event)"
                />
              </div>
            )}
            {eventKnown && (
              <p className="mt-1 font-body text-xs text-ink-faint">
                {catalog.events.find((e) => e.value === trigger)?.description}
              </p>
            )}
          </section>

          <section>
            <h4 className="mb-2 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">2. Se</h4>
            <ConditionEditor
              value={conditions}
              onChange={setConditions}
              fields={catalog.fields}
              emptyHint="Sem condições — corre sempre que o evento acontecer."
            />
          </section>

          <section>
            <h4 className="mb-2 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">3. Então</h4>
            <FormField label="Acção *" htmlFor="af-action">
              <Select
                items={catalog.actions.map((a) => ({ value: a.value, label: a.label }))}
                value={action}
                onValueChange={(v) => {
                  setAction(v);
                  setParams({});
                }}
                className="w-full"
              />
            </FormField>
            {act && <p className="mt-1 font-body text-xs text-ink-faint">{act.description}</p>}
            <div className="mt-3 space-y-3">
              {act?.params.map((p) => (
                <FormField key={p.key} label={`${p.label}${p.required ? ' *' : ''}`} htmlFor={`af-p-${p.key}`}>
                  {p.type === 'select' ? (
                    <Select
                      items={p.options ?? []}
                      value={params[p.key] ?? ''}
                      onValueChange={(v) => setParams((s) => ({ ...s, [p.key]: v }))}
                      className="w-full"
                    />
                  ) : p.type === 'textarea' ? (
                    <Textarea
                      id={`af-p-${p.key}`}
                      rows={3}
                      value={params[p.key] ?? ''}
                      onChange={(e) => setParams((s) => ({ ...s, [p.key]: e.target.value }))}
                      className="w-full"
                    />
                  ) : (
                    <Input
                      id={`af-p-${p.key}`}
                      value={params[p.key] ?? ''}
                      onChange={(e) => setParams((s) => ({ ...s, [p.key]: e.target.value }))}
                    />
                  )}
                </FormField>
              ))}
              {act?.needsRecipients && (
                <div>
                  <div className="mb-1 font-body text-xs font-medium text-ink-muted">Destinatários *</div>
                  <RecipientPicker value={recipients} onChange={setRecipients} />
                </div>
              )}
            </div>
          </section>

          <section>
            <h4 className="mb-2 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">4. Gestão da regra</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField label="Prioridade" htmlFor="af-prio" hint="Menor corre primeiro.">
                <Input id="af-prio" value={priority} onChange={(e) => setPriority(e.target.value.replace(/\D/g, ''))} />
              </FormField>
              <FormField label="Activa a partir de" htmlFor="af-from">
                <Input id="af-from" type="date" value={activeFrom} onChange={(e) => setActiveFrom(e.target.value)} />
              </FormField>
              <FormField label="Expira em" htmlFor="af-until">
                <Input id="af-until" type="date" value={activeUntil} onChange={(e) => setActiveUntil(e.target.value)} />
              </FormField>
              <FormField label="Tentativas em caso de erro" htmlFor="af-retries">
                <Input id="af-retries" value={maxRetries} onChange={(e) => setMaxRetries(e.target.value.replace(/\D/g, ''))} />
              </FormField>
              <FormField label="Política de repetição" htmlFor="af-policy">
                <Select
                  items={catalog.retryPolicies}
                  value={retryPolicy}
                  onValueChange={(v) => setRetryPolicy(v as RetryPolicy)}
                  className="w-full"
                />
              </FormField>
              <FormField label="Intervalo (min)" htmlFor="af-delay">
                <Input id="af-delay" value={retryDelay} onChange={(e) => setRetryDelay(e.target.value.replace(/\D/g, ''))} />
              </FormField>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Tratamento de erros" htmlFor="af-err">
                <Select
                  items={catalog.errorHandling}
                  value={errorHandling}
                  onValueChange={(v) => setErrorHandling(v as ErrorHandling)}
                  className="w-full"
                />
              </FormField>
              <label className="flex items-center gap-2 self-end pb-2 font-body text-sm text-ink">
                <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
                Regra activa
              </label>
            </div>
          </section>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose} disabled={save.isPending}>
            Cancelar
          </Button>
          <Button onClick={submit} loading={save.isPending} disabled={!canSubmit}>
            {editing ? 'Guardar' : 'Criar regra'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
