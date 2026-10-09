// components/leave/AbsenceDetailModal.tsx
// Detalhe de uma ocorrência de ausência (docs/Modulo_Leave.md §5): dados,
// estado de justificação, comprovativos, histórico de alterações e as acções
// permitidas ao perfil (`actions` vem do backend, que também as impõe):
// submeter justificação, validar/recusar, anexar comprovativo, corrigir com
// auditoria, encaminhar ao gestor, enviar ao RH e consultar o histórico do
// colaborador. Dados de saúde chegam ocultos a quem não é o titular nem o RH.

'use client';

import { useState } from 'react';
import { AlertCircle, FileLock2, Paperclip } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { useAbsenceDetail, useAbsenceHistory } from '@/hooks/useLeave';
import { apiClient } from '@/lib/apiClient';
import { formatDate, formatDateTime } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Textarea } from '@/components/ui/Textarea';
import {
  ABSENCE_SOURCE_LABELS,
  ABSENCE_TYPE_LABELS,
  ATTENDANCE_STATUS_LABELS,
  JUSTIFICATION_CFG,
  TIMED_ABSENCE_TYPES,
  absenceTypeLabel,
} from './constants';
import type { AbsenceDetail, AbsenceOccurrenceType } from './types';

type Mode = null | 'justify' | 'validate' | 'attach' | 'correct';

const TYPE_ITEMS = (
  Object.entries(ABSENCE_TYPE_LABELS) as Array<[AbsenceOccurrenceType, string]>
).map(([value, label]) => ({ value, label }));

const FIELD_LABELS: Record<string, string> = {
  date: 'Data',
  startTime: 'Hora de início',
  endTime: 'Hora de fim',
  occurrenceType: 'Tipo',
  customCategory: 'Categoria',
  justificationStatus: 'Estado de justificação',
};

function fieldValue(field: string, v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  const text = String(v);
  if (field === 'occurrenceType')
    return ABSENCE_TYPE_LABELS[text as AbsenceOccurrenceType] ?? text;
  if (field === 'justificationStatus')
    return (
      JUSTIFICATION_CFG[text as keyof typeof JUSTIFICATION_CFG]?.label ?? text
    );
  return text;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-ink-faint">{label}</dt>
      <dd className="text-sm text-ink">{children}</dd>
    </div>
  );
}

export interface AbsenceDetailModalProps {
  absenceId: number;
  onClose: () => void;
}

export function AbsenceDetailModal({
  absenceId,
  onClose,
}: AbsenceDetailModalProps) {
  const { data: a, loading } = useAbsenceDetail(absenceId);
  const [showHistory, setShowHistory] = useState(false);
  const history = useAbsenceHistory(showHistory && a ? a.user.id : null);

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        navyHeader
        title={a ? `Ocorrência #${a.id} — ${a.user.fullName}` : 'Ocorrência'}
        description="Detalhe, justificação e histórico de alterações."
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {loading || !a ? (
          <Skeleton
            rows={5}
            wrapperClassName="mt-4 space-y-2 animate-pulse"
            itemClassName="h-8 bg-surface-sunken rounded-control"
          />
        ) : (
          <DetailBody
            a={a}
            showHistory={showHistory}
            onToggleHistory={() => setShowHistory((v) => !v)}
            history={history.data}
            historyLoading={history.loading}
          />
        )}
      </ModalContent>
    </Modal>
  );
}

interface DetailBodyProps {
  a: AbsenceDetail;
  showHistory: boolean;
  onToggleHistory: () => void;
  history: ReturnType<typeof useAbsenceHistory>['data'];
  historyLoading: boolean;
}

function DetailBody({
  a,
  showHistory,
  onToggleHistory,
  history,
  historyLoading,
}: DetailBodyProps) {
  const notify = useToast();
  const [mode, setMode] = useState<Mode>(null);
  const [error, setError] = useState('');
  const [justification, setJustification] = useState('');
  const [doc, setDoc] = useState({ name: '', fileUrl: '' });
  const [decision, setDecision] = useState<'VALIDATE' | 'REJECT'>('VALIDATE');
  const [notes, setNotes] = useState('');
  const [fix, setFix] = useState({
    reason: '',
    date: a.date.slice(0, 10),
    startTime: a.startTime ?? '',
    endTime: a.endTime ?? '',
    occurrenceType: a.occurrenceType,
    customCategory: a.customCategory ?? '',
  });

  const done = (title: string) => () => {
    notify({ title, intent: 'success' });
    setMode(null);
    setError('');
    setJustification('');
    setDoc({ name: '', fileUrl: '' });
    setNotes('');
  };
  const opts = (title: string) => ({
    invalidateKeys: [queryKeys.leave.all],
    onSuccess: done(title),
    onError: (e: Error) => setError(e.message),
  });
  const base = `/leave/absences/${a.id}`;
  const docBody = doc.name.trim() && doc.fileUrl.trim()
    ? [{ name: doc.name.trim(), fileUrl: doc.fileUrl.trim() }]
    : undefined;

  const justify = useApiMutation(
    () =>
      apiClient.post(`${base}/justification`, {
        justification: justification.trim(),
        attachments: docBody,
      }),
    opts('Justificação submetida'),
  );
  const validate = useApiMutation(
    () =>
      apiClient.patch(`${base}/validate`, {
        decision,
        notes: notes.trim() || undefined,
      }),
    opts(decision === 'VALIDATE' ? 'Justificação validada' : 'Justificação recusada'),
  );
  const attach = useApiMutation(
    () => apiClient.post(`${base}/attachments`, docBody?.[0]),
    opts('Comprovativo anexado'),
  );
  const correct = useApiMutation(
    () => {
      const body: Record<string, string> = { reason: fix.reason.trim() };
      if (fix.date !== a.date.slice(0, 10)) body.date = fix.date;
      if (fix.startTime !== (a.startTime ?? '') && fix.startTime)
        body.startTime = fix.startTime;
      if (fix.endTime !== (a.endTime ?? '') && fix.endTime)
        body.endTime = fix.endTime;
      if (fix.occurrenceType !== a.occurrenceType)
        body.occurrenceType = fix.occurrenceType;
      if (fix.customCategory.trim() !== (a.customCategory ?? ''))
        body.customCategory = fix.customCategory.trim();
      return apiClient.patch(base, body);
    },
    opts('Registo corrigido'),
  );
  const forward = useApiMutation(
    () => apiClient.post(`${base}/forward`, {}),
    opts('Encaminhada para o gestor'),
  );
  const sendToHr = useApiMutation(
    () => apiClient.post(`${base}/send-to-hr`, {}),
    opts('Enviada para validação do RH'),
  );

  const act = a.actions;
  const protectedFiles = a.hasAttachment && a.attachments.length === 0;
  const docIncomplete = !!doc.name.trim() !== !!doc.fileUrl.trim();
  const fixTimed = TIMED_ABSENCE_TYPES.includes(fix.occurrenceType);

  return (
    <div className="mt-4 space-y-5">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-danger-subtle text-danger-ink rounded-card text-sm">
          <AlertCircle size={16} strokeWidth={1.75} />
          {error}
        </div>
      )}

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Field label="Colaborador">
          {a.user.fullName}
          <span className="text-ink-faint">
            {' '}
            · {a.user.employeeNumber ?? '—'} · {a.user.department?.name ?? '—'}
          </span>
        </Field>
        <Field label="Tipo">{absenceTypeLabel(a)}</Field>
        <Field label="Data">{formatDate(a.date)}</Field>
        <Field label="Horário / duração">
          {a.startTime && a.endTime ? `${a.startTime}–${a.endTime} · ` : ''}
          {a.durationHours ? `${a.durationHours} h` : `${a.durationDays} dia(s)`}
        </Field>
        <Field label="Estado de justificação">
          <StatusBadge
            value={a.justificationStatus}
            map={JUSTIFICATION_CFG}
            variant="dot"
          />
        </Field>
        <Field label="Origem">{ABSENCE_SOURCE_LABELS[a.source]}</Field>
        <Field label="Impacto na assiduidade">
          {a.attendance
            ? `${ATTENDANCE_STATUS_LABELS[a.attendance.status] ?? a.attendance.status} (${formatDate(a.attendance.date)})`
            : 'Sem registo associado'}
        </Field>
        <Field label="Validador">
          {a.validator
            ? `${a.validator.fullName ?? '—'}${a.validatedAt ? ` · ${formatDateTime(a.validatedAt)}` : ''}`
            : '—'}
        </Field>
        <Field label="Encaminhada para">{a.forwardedTo?.fullName ?? '—'}</Field>
        <Field label="Validação do RH">
          {a.sentToHrAt ? `Enviada · ${formatDateTime(a.sentToHrAt)}` : '—'}
        </Field>
        <Field label="Registada por">
          {a.createdBy.fullName ?? '—'} · {formatDateTime(a.createdAt)}
        </Field>
        {a.payrollReview !== undefined && (
          <Field label="Impacto salarial">
            {a.payrollReview ? 'Requer análise do Payroll' : 'Sem indicação'}
          </Field>
        )}
      </dl>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-ink">Justificação</h3>
        {a.occurrenceType === 'HEALTH_ABSENCE' &&
        a.justification === null &&
        protectedFiles ? (
          <p className="flex items-center gap-2 text-sm text-ink-faint">
            <FileLock2 size={14} strokeWidth={1.75} /> Dados de saúde — acesso
            restrito ao colaborador e ao RH.
          </p>
        ) : (
          <>
            <p className="text-sm text-ink-muted whitespace-pre-wrap">
              {a.justification || 'Sem justificação apresentada.'}
            </p>
            {a.attachments.length > 0 && (
              <ul className="space-y-0.5">
                {a.attachments.map((f) => (
                  <li key={f.id}>
                    <a
                      href={f.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <Paperclip size={12} strokeWidth={1.75} />
                      {f.name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {a.validationNotes && (
              <p className="text-sm text-ink-muted">
                <span className="text-ink-faint">Parecer do validador: </span>
                {a.validationNotes}
              </p>
            )}
          </>
        )}
      </section>

      <div className="flex flex-wrap gap-2">
        {act.submitJustification && (
          <Button size="sm" intent="secondary" onClick={() => setMode('justify')}>
            Submeter justificação
          </Button>
        )}
        {act.validate && (
          <Button size="sm" intent="secondary" onClick={() => setMode('validate')}>
            Validar / recusar
          </Button>
        )}
        {act.attach && (
          <Button size="sm" intent="ghost" onClick={() => setMode('attach')}>
            Anexar comprovativo
          </Button>
        )}
        {act.correct && (
          <Button size="sm" intent="ghost" onClick={() => setMode('correct')}>
            Corrigir registo
          </Button>
        )}
        {act.forward && (
          <Button
            size="sm"
            intent="ghost"
            loading={forward.isPending}
            onClick={() => forward.mutate(undefined)}
          >
            Encaminhar para o gestor
          </Button>
        )}
        {act.sendToHr && (
          <Button
            size="sm"
            intent="ghost"
            loading={sendToHr.isPending}
            onClick={() => sendToHr.mutate(undefined)}
          >
            Enviar para validação do RH
          </Button>
        )}
        <Button size="sm" intent="ghost" onClick={onToggleHistory}>
          {showHistory ? 'Ocultar histórico' : 'Histórico do colaborador'}
        </Button>
      </div>

      {mode === 'justify' && (
        <div className="space-y-3 rounded-card border border-border p-3">
          <FormField label="Justificação *" htmlFor="abd-just">
            <Textarea
              id="abd-just"
              rows={3}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              className="w-full resize-none"
            />
          </FormField>
          <DocFields doc={doc} onChange={setDoc} />
          <FormActions
            onCancel={() => setMode(null)}
            submitLabel="Submeter"
            loading={justify.isPending}
            disabled={!justification.trim() || docIncomplete}
            onSubmit={() => {
              setError('');
              justify.mutate(undefined);
            }}
          />
        </div>
      )}

      {mode === 'validate' && (
        <div className="space-y-3 rounded-card border border-border p-3">
          <div className="flex gap-2">
            <Button
              size="sm"
              intent={decision === 'VALIDATE' ? 'primary' : 'ghost'}
              onClick={() => setDecision('VALIDATE')}
            >
              Validar
            </Button>
            <Button
              size="sm"
              intent={decision === 'REJECT' ? 'danger' : 'ghost'}
              onClick={() => setDecision('REJECT')}
            >
              Recusar
            </Button>
          </div>
          <FormField
            label={decision === 'REJECT' ? 'Justificação da recusa *' : 'Comentário'}
            htmlFor="abd-notes"
          >
            <Textarea
              id="abd-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full resize-none"
            />
          </FormField>
          <FormActions
            onCancel={() => setMode(null)}
            submitLabel="Confirmar"
            loading={validate.isPending}
            disabled={decision === 'REJECT' && !notes.trim()}
            onSubmit={() => {
              setError('');
              validate.mutate(undefined);
            }}
          />
        </div>
      )}

      {mode === 'attach' && (
        <div className="space-y-3 rounded-card border border-border p-3">
          <DocFields doc={doc} onChange={setDoc} />
          <FormActions
            onCancel={() => setMode(null)}
            submitLabel="Anexar"
            loading={attach.isPending}
            disabled={!docBody}
            onSubmit={() => {
              setError('');
              attach.mutate(undefined);
            }}
          />
        </div>
      )}

      {mode === 'correct' && (
        <div className="space-y-3 rounded-card border border-border p-3">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Data" htmlFor="abd-fdate">
              <Input
                id="abd-fdate"
                type="date"
                value={fix.date}
                onChange={(e) => setFix((f) => ({ ...f, date: e.target.value }))}
                className="w-full"
              />
            </FormField>
            <FormField label="Tipo" htmlFor="abd-ftype">
              <Select
                className="w-full"
                value={fix.occurrenceType}
                onValueChange={(v) =>
                  setFix((f) => ({
                    ...f,
                    occurrenceType: v as AbsenceOccurrenceType,
                  }))
                }
                items={TYPE_ITEMS}
              />
            </FormField>
            <FormField label={`Hora de início${fixTimed ? ' *' : ''}`} htmlFor="abd-fs">
              <Input
                id="abd-fs"
                type="time"
                value={fix.startTime}
                onChange={(e) =>
                  setFix((f) => ({ ...f, startTime: e.target.value }))
                }
                className="w-full"
              />
            </FormField>
            <FormField label={`Hora de fim${fixTimed ? ' *' : ''}`} htmlFor="abd-fe">
              <Input
                id="abd-fe"
                type="time"
                value={fix.endTime}
                onChange={(e) =>
                  setFix((f) => ({ ...f, endTime: e.target.value }))
                }
                className="w-full"
              />
            </FormField>
          </div>
          {fix.occurrenceType === 'OTHER' && (
            <FormField label="Categoria" htmlFor="abd-fc">
              <Input
                id="abd-fc"
                value={fix.customCategory}
                maxLength={100}
                onChange={(e) =>
                  setFix((f) => ({ ...f, customCategory: e.target.value }))
                }
                className="w-full"
              />
            </FormField>
          )}
          <FormField
            label="Motivo da correcção *"
            htmlFor="abd-freason"
            hint="Fica registado na auditoria com os valores anteriores"
          >
            <Textarea
              id="abd-freason"
              rows={2}
              value={fix.reason}
              onChange={(e) => setFix((f) => ({ ...f, reason: e.target.value }))}
              className="w-full resize-none"
            />
          </FormField>
          <FormActions
            onCancel={() => setMode(null)}
            submitLabel="Guardar correcção"
            loading={correct.isPending}
            disabled={!fix.reason.trim()}
            onSubmit={() => {
              setError('');
              correct.mutate(undefined);
            }}
          />
        </div>
      )}

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-ink">Histórico de alterações</h3>
        {a.revisions.length === 0 ? (
          <p className="text-sm text-ink-faint">Sem alterações registadas.</p>
        ) : (
          <ol className="space-y-2">
            {a.revisions.map((r) => (
              <li key={r.id} className="text-sm border-l-2 border-border pl-3">
                <p className="text-ink">
                  {r.reason}{' '}
                  <span className="text-ink-faint">
                    · {r.changedBy.fullName ?? '—'} · {formatDateTime(r.createdAt)}
                  </span>
                </p>
                {Object.entries(r.changes).map(([field, pair]) => (
                  <p key={field} className="text-xs text-ink-muted">
                    {FIELD_LABELS[field] ?? field}: {fieldValue(field, pair[0])} →{' '}
                    {fieldValue(field, pair[1])}
                  </p>
                ))}
              </li>
            ))}
          </ol>
        )}
      </section>

      {showHistory && (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-ink">
            Histórico de ausências de {a.user.fullName}
          </h3>
          {historyLoading || !history ? (
            <Skeleton
              rows={3}
              wrapperClassName="space-y-2 animate-pulse"
              itemClassName="h-6 bg-surface-sunken rounded-control"
            />
          ) : (
            <>
              <p className="text-sm text-ink-muted">
                {history.summary.total} ocorrência(s) ·{' '}
                {history.summary.totalDays} dia(s) ·{' '}
                {history.summary.byType
                  .map(
                    (t) =>
                      `${ABSENCE_TYPE_LABELS[t.occurrenceType]}: ${t.count}`,
                  )
                  .join(' · ') || '—'}
              </p>
              <ul className="space-y-1 text-sm">
                {history.records.slice(0, 20).map((h) => (
                  <li key={h.id} className="flex items-center gap-2">
                    <span className="w-24 text-ink-muted">{formatDate(h.date)}</span>
                    <span className="flex-1 text-ink">{absenceTypeLabel(h)}</span>
                    <StatusBadge
                      value={h.justificationStatus}
                      map={JUSTIFICATION_CFG}
                      variant="dot"
                    />
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
    </div>
  );
}

function DocFields({
  doc,
  onChange,
}: {
  doc: { name: string; fileUrl: string };
  onChange: (d: { name: string; fileUrl: string }) => void;
}) {
  return (
    <div className="flex items-start gap-2">
      <Input
        aria-label="Nome do comprovativo"
        placeholder="Nome do comprovativo (opcional)"
        value={doc.name}
        onChange={(e) => onChange({ ...doc, name: e.target.value })}
        className="w-full"
      />
      <Input
        aria-label="Endereço do comprovativo"
        placeholder="https://…"
        value={doc.fileUrl}
        onChange={(e) => onChange({ ...doc, fileUrl: e.target.value })}
        className="w-full"
      />
    </div>
  );
}

function FormActions({
  onCancel,
  onSubmit,
  submitLabel,
  loading,
  disabled,
}: {
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
  loading: boolean;
  disabled: boolean;
}) {
  return (
    <div className="flex justify-end gap-2">
      <Button size="sm" intent="ghost" onClick={onCancel}>
        Cancelar
      </Button>
      <Button size="sm" loading={loading} disabled={disabled} onClick={onSubmit}>
        {submitLabel}
      </Button>
    </div>
  );
}
