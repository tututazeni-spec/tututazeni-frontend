// components/audit/audits/AuditDetailBody.tsx
// Corpo do detalhe de uma auditoria (apresentação). Estado, mutações e fase do
// fluxo vêm de hooks/useInternalAuditDetail.ts.

import { Download, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { DepartmentUserPicker } from '@/components/departments/DepartmentUserPicker';
import { safeHref } from '@/lib/safeHref';
import type { InternalAuditDetailController } from '@/hooks/useInternalAuditDetail';
import { SEVERITY_CFG } from '../constants';
import { fmtTs } from '../utils';
import type { FormKind } from './logic';
import { canExportReport, fmtDay } from './logic';
import {
  ACTION_STATUS,
  CHECK_STATUS,
  RESULTS,
  RISK_ITEMS,
  resultLabel,
  typeLabel,
} from './constants';
import { Section, StatusPill } from './shared';
import type { InternalAuditDetail, Severity } from '../types';

interface AuditDetailBodyProps {
  audit: InternalAuditDetail;
  ctl: InternalAuditDetailController;
}

export function AuditDetailBody({ audit: a, ctl }: AuditDetailBodyProps) {
  const {
    phase: { collecting, actionable, reviewable, terminal },
    form,
    f,
    set,
    responsible,
    setResponsible,
    toggle,
    closeForm,
    formValid,
    submit,
    changeStatus,
    updateCheckStatus,
    updateActionStatus,
    exportReport,
    pending,
  } = ctl;
  const status = a.status;

  const addBtn = (k: Exclude<FormKind, null>, label: string) => (
    <Button size="sm" intent="secondary" onClick={() => toggle(k)}>
      <Plus size={12} /> {label}
    </Button>
  );
  const submitRow = ({
    onClick,
    pending,
    disabled,
    label = 'Guardar',
  }: {
    onClick: () => void;
    pending: boolean;
    disabled?: boolean;
    label?: string;
  }) => (
    <div className="flex gap-2 pt-1">
      <Button size="sm" loading={pending} disabled={disabled} onClick={onClick}>
        {label}
      </Button>
      <Button size="sm" intent="ghost" onClick={() => closeForm()}>
        Cancelar
      </Button>
    </div>
  );

  return (
    <div className="mt-4 space-y-5 font-body text-xs">
      <div className="flex flex-wrap items-center gap-3">
        <StatusPill status={a.status} />
        <span className="text-ink-muted">{typeLabel(a.type)}</span>
        {a.result && (
          <Badge intent={a.result === 'CONFORME' ? 'success' : 'warning'}>
            {resultLabel(a.result)}
          </Badge>
        )}
      </div>

      <dl className="grid grid-cols-[160px_1fr] gap-y-1 text-ink">
        <dt className="text-ink-faint">Auditor responsável</dt>
        <dd>{a.leadAuditor?.fullName ?? 'Por definir'}</dd>
        <dt className="text-ink-faint">Equipa</dt>
        <dd>{a.team.map((t) => t.fullName).join(', ') || '—'}</dd>
        <dt className="text-ink-faint">Módulos</dt>
        <dd>{a.modules.join(', ') || '—'}</dd>
        <dt className="text-ink-faint">Período analisado</dt>
        <dd>
          {fmtDay(a.periodFrom)} a {fmtDay(a.periodTo)}
        </dd>
        <dt className="text-ink-faint">Início / prazo</dt>
        <dd>
          {fmtDay(a.startDate)} / {fmtDay(a.dueDate)}
        </dd>
        {a.objective && (
          <>
            <dt className="text-ink-faint">Objetivo</dt>
            <dd className="whitespace-pre-wrap">{a.objective}</dd>
          </>
        )}
        {a.scope && (
          <>
            <dt className="text-ink-faint">Âmbito</dt>
            <dd className="whitespace-pre-wrap">{a.scope}</dd>
          </>
        )}
        {a.criteria && (
          <>
            <dt className="text-ink-faint">Critérios</dt>
            <dd className="whitespace-pre-wrap">{a.criteria}</dd>
          </>
        )}
        {a.approvedBy && (
          <>
            <dt className="text-ink-faint">Relatório aprovado</dt>
            <dd>
              {a.approvedBy.fullName}
              {a.approvedAt ? ` · ${fmtTs(a.approvedAt)}` : ''}
            </dd>
          </>
        )}
        {a.cancelReason && (
          <>
            <dt className="text-ink-faint">Motivo do cancelamento</dt>
            <dd className="whitespace-pre-wrap">{a.cancelReason}</dd>
          </>
        )}
      </dl>

      {/* Fluxo */}
      {!terminal && (
        <div className="flex flex-wrap gap-2 rounded-card border border-border p-3">
          {status === 'PLANNED' && (
            <Button
              size="sm"
              intent="secondary"
              onClick={() => changeStatus('PREPARING')}
            >
              Iniciar preparação
            </Button>
          )}
          {(status === 'PLANNED' || status === 'PREPARING') && (
            <Button
              size="sm"
              loading={pending.status}
              onClick={() => changeStatus('IN_PROGRESS')}
            >
              Iniciar execução
            </Button>
          )}
          {status === 'IN_PROGRESS' && (
            <Button
              size="sm"
              loading={pending.status}
              onClick={() => changeStatus('IN_REVIEW')}
            >
              Submeter para revisão
            </Button>
          )}
          {status === 'IN_REVIEW' && (
            <Button
              size="sm"
              intent="secondary"
              onClick={() => changeStatus('IN_PROGRESS')}
            >
              Devolver à execução
            </Button>
          )}
          {reviewable && (
            <Button size="sm" onClick={() => toggle('approve')}>
              Aprovar relatório
            </Button>
          )}
          <Button
            size="sm"
            intent="danger"
            className="ml-auto"
            onClick={() => toggle('cancel')}
          >
            Cancelar auditoria
          </Button>
        </div>
      )}
      {form === 'approve' && (
        <div className="space-y-2 rounded-card border border-border p-3">
          <FormField label="Resultado *" htmlFor="aud-result">
            <Select
              items={RESULTS}
              value={f.result}
              onValueChange={(v) => set({ result: v })}
            />
          </FormField>
          <FormField label="Relatório de encerramento *" htmlFor="aud-report">
            <Textarea
              id="aud-report"
              rows={5}
              className="w-full"
              value={f.closingReport}
              onChange={(e) => set({ closingReport: e.target.value })}
            />
          </FormField>
          <p className="text-ink-faint">
            A aprovação fica registada com o seu nome e data. Não pode aprovar
            um relatório de que é o auditor responsável.
          </p>
          {submitRow({
            label: 'Aprovar',
            pending: pending.approve,
            disabled: !formValid,
            onClick: submit.approve,
          })}
        </div>
      )}
      {form === 'cancel' && (
        <div className="space-y-2 rounded-card border border-border p-3">
          <FormField
            label="Justificação do cancelamento *"
            htmlFor="aud-cancel"
          >
            <Textarea
              id="aud-cancel"
              rows={2}
              className="w-full"
              value={f.reason}
              onChange={(e) => set({ reason: e.target.value })}
            />
          </FormField>
          {submitRow({
            label: 'Confirmar cancelamento',
            pending: pending.status,
            disabled: !formValid,
            onClick: submit.cancel,
          })}
        </div>
      )}

      {/* Verificações */}
      <Section
        title={`Verificações (${a.checks.length})`}
        action={collecting && addBtn('check', 'Adicionar verificação')}
      >
        {form === 'check' && (
          <div className="space-y-2 py-2">
            <Input
              placeholder="Verificação a efetuar"
              value={f.title}
              onChange={(e) => set({ title: e.target.value })}
            />
            {submitRow({
              pending: pending.check,
              disabled: !formValid,
              onClick: submit.check,
            })}
          </div>
        )}
        {a.checks.length === 0 && (
          <p className="py-1 text-ink-faint">Sem verificações.</p>
        )}
        {a.checks.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-3 border-b border-border py-1.5 last:border-0"
          >
            <span className="min-w-0 flex-1 text-ink">{c.title}</span>
            {collecting ? (
              <Select
                items={CHECK_STATUS}
                value={c.status}
                onValueChange={(v) => updateCheckStatus(c.id, v)}
                className="w-44"
              />
            ) : (
              <span className="text-ink-muted">
                {CHECK_STATUS.find((s) => s.value === c.status)?.label}
              </span>
            )}
          </div>
        ))}
      </Section>

      {/* Evidências */}
      <Section
        title={`Evidências (${a.evidences.length})`}
        action={collecting && addBtn('evidence', 'Anexar evidência')}
      >
        {form === 'evidence' && (
          <div className="space-y-2 py-2">
            <Input
              placeholder="Título da evidência *"
              value={f.title}
              onChange={(e) => set({ title: e.target.value })}
            />
            <Textarea
              rows={2}
              className="w-full"
              placeholder="Descrição"
              value={f.description}
              onChange={(e) => set({ description: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Ligação (URL)"
                value={f.url}
                onChange={(e) => set({ url: e.target.value })}
              />
              <Input
                type="number"
                min={1}
                placeholder="ID de evento de auditoria"
                value={f.auditLogId}
                onChange={(e) => set({ auditLogId: e.target.value })}
              />
            </div>
            {submitRow({
              pending: pending.evidence,
              disabled: !formValid,
              onClick: submit.evidence,
            })}
          </div>
        )}
        {a.evidences.length === 0 && (
          <p className="py-1 text-ink-faint">Sem evidências.</p>
        )}
        {a.evidences.map((e) => (
          <div
            key={e.id}
            className="border-b border-border py-1.5 last:border-0"
          >
            <div className="text-ink">
              {e.title}
              {e.auditLogId != null && (
                <span className="text-ink-faint">
                  {' '}
                  · evento #{e.auditLogId}
                </span>
              )}
            </div>
            {e.description && (
              <div className="text-ink-muted">{e.description}</div>
            )}
            {e.url && (
              <a
                href={safeHref(e.url)}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                {e.url}
              </a>
            )}
            <div className="text-ink-faint">
              {e.addedBy?.fullName ?? '—'} · {fmtTs(e.createdAt)}
            </div>
          </div>
        ))}
      </Section>

      {/* Constatações */}
      <Section
        title={`Constatações e riscos (${a.findings.length})`}
        action={collecting && addBtn('finding', 'Registar constatação')}
      >
        {form === 'finding' && (
          <div className="space-y-2 py-2">
            <Input
              placeholder="Constatação *"
              value={f.title}
              onChange={(e) => set({ title: e.target.value })}
            />
            <Textarea
              rows={2}
              className="w-full"
              placeholder="Descrição"
              value={f.description}
              onChange={(e) => set({ description: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <Select
                items={[
                  { value: 'true', label: 'Não conformidade' },
                  { value: 'false', label: 'Observação' },
                ]}
                value={f.nonConformity}
                onValueChange={(v) => set({ nonConformity: v })}
              />
              <Select
                items={RISK_ITEMS}
                value={f.risk}
                onValueChange={(v) => set({ risk: v as Severity })}
              />
            </div>
            <Textarea
              rows={2}
              className="w-full"
              placeholder="Recomendação"
              value={f.recommendation}
              onChange={(e) => set({ recommendation: e.target.value })}
            />
            {submitRow({
              pending: pending.finding,
              disabled: !formValid,
              onClick: submit.finding,
            })}
          </div>
        )}
        {a.findings.length === 0 && (
          <p className="py-1 text-ink-faint">Sem constatações.</p>
        )}
        {a.findings.map((x) => (
          <div
            key={x.id}
            className="border-b border-border py-1.5 last:border-0"
          >
            <div className="flex items-center gap-2 text-ink">
              <span className="font-medium">{x.title}</span>
              <Badge
                intent={x.nonConformity ? 'danger' : 'neutral'}
                dot={false}
              >
                {x.nonConformity ? 'Não conformidade' : 'Observação'}
              </Badge>
              <span className={SEVERITY_CFG[x.risk].cls}>
                Risco {SEVERITY_CFG[x.risk].label.toLowerCase()}
              </span>
            </div>
            {x.description && (
              <div className="text-ink-muted">{x.description}</div>
            )}
            {x.recommendation && (
              <div className="text-ink-muted">
                Recomendação: {x.recommendation}
              </div>
            )}
          </div>
        ))}
      </Section>

      {/* Ações corretivas */}
      <Section
        title={`Plano de ações corretivas (${a.actions.length})`}
        action={actionable && addBtn('action', 'Criar ação corretiva')}
      >
        {form === 'action' && (
          <div className="space-y-2 py-2">
            <Textarea
              rows={2}
              className="w-full"
              placeholder="Ação a executar *"
              value={f.description}
              onChange={(e) => set({ description: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <Select
                items={[
                  { value: 'NONE', label: 'Sem constatação associada' },
                  ...a.findings.map((x) => ({
                    value: String(x.id),
                    label: x.title,
                  })),
                ]}
                value={f.findingId || 'NONE'}
                onValueChange={(v) => set({ findingId: v === 'NONE' ? '' : v })}
              />
              <Input
                type="date"
                value={f.dueDate}
                onChange={(e) => set({ dueDate: e.target.value })}
              />
            </div>
            <DepartmentUserPicker
              label="Responsável"
              htmlFor="aud-act-resp"
              value={responsible}
              onChange={setResponsible}
            />
            {submitRow({
              pending: pending.action,
              disabled: !formValid,
              onClick: submit.action,
            })}
          </div>
        )}
        {a.actions.length === 0 && (
          <p className="py-1 text-ink-faint">Sem ações corretivas.</p>
        )}
        {a.actions.map((x) => (
          <div
            key={x.id}
            className="flex items-center gap-3 border-b border-border py-1.5 last:border-0"
          >
            <div className="min-w-0 flex-1">
              <div className="text-ink">{x.description}</div>
              <div className="text-ink-faint">
                {x.responsible?.fullName ?? 'Sem responsável'} · prazo{' '}
                {fmtDay(x.dueDate)}
              </div>
            </div>
            {actionable ? (
              <Select
                items={ACTION_STATUS}
                value={x.status}
                onValueChange={(v) => updateActionStatus(x.id, v)}
                className="w-36"
              />
            ) : (
              <span className="text-ink-muted">
                {ACTION_STATUS.find((s) => s.value === x.status)?.label}
              </span>
            )}
          </div>
        ))}
      </Section>

      {a.closingReport && (
        <Section title="Relatório de encerramento">
          <p className="whitespace-pre-wrap py-1 text-ink">{a.closingReport}</p>
        </Section>
      )}

      {canExportReport(a.status) && (
        <Button
          size="sm"
          intent="secondary"
          loading={pending.export}
          onClick={exportReport}
        >
          <Download size={14} /> Exportar relatório final
        </Button>
      )}

      <Section title="Histórico">
        {a.history.map((h) => (
          <div key={h.id} className="py-1 text-ink-muted">
            {fmtTs(h.timestamp)} · {h.user?.fullName ?? 'Sistema'} ·{' '}
            {h.action
              .replace(/^AUDIT_/, '')
              .toLowerCase()
              .replace(/_/g, ' ')}
          </div>
        ))}
      </Section>
    </div>
  );
}
