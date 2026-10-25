// components/audit/audits/WorkflowSection.tsx
// Transições de estado, aprovação e cancelamento (apresentação).

import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { workflowSteps } from './logic';
import { RESULTS } from './constants';
import { SubmitRow } from './detailParts';
import type { InternalAuditDetailController } from '@/hooks/useInternalAuditDetail';
import type { InternalAuditDetail } from '../types';

export function WorkflowSection({
  audit: a,
  ctl,
}: {
  audit: InternalAuditDetail;
  ctl: InternalAuditDetailController;
}) {
  const {
    phase: { terminal, reviewable },
    form,
    f,
    set,
    toggle,
    closeForm,
    formValid,
    submit,
    changeStatus,
    pending,
  } = ctl;

  const steps = workflowSteps(a.status);

  return (
    <>
      {/* Fluxo */}
      {!terminal && (
        <div className="flex flex-wrap gap-2 rounded-card border border-border p-3">
          {steps.startPreparation && (
            <Button
              size="sm"
              intent="secondary"
              onClick={() => changeStatus('PREPARING')}
            >
              Iniciar preparação
            </Button>
          )}
          {steps.startExecution && (
            <Button
              size="sm"
              loading={pending.status}
              onClick={() => changeStatus('IN_PROGRESS')}
            >
              Iniciar execução
            </Button>
          )}
          {steps.submitReview && (
            <Button
              size="sm"
              loading={pending.status}
              onClick={() => changeStatus('IN_REVIEW')}
            >
              Submeter para revisão
            </Button>
          )}
          {steps.returnToExecution && (
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
          <SubmitRow
            label="Aprovar"
            pending={pending.approve}
            disabled={!formValid}
            onClick={submit.approve}
            onCancel={closeForm}
          />
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
          <SubmitRow
            label="Confirmar cancelamento"
            pending={pending.status}
            disabled={!formValid}
            onClick={submit.cancel}
            onCancel={closeForm}
          />
        </div>
      )}
    </>
  );
}
