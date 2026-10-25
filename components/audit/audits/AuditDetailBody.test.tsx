// Prova da separação: o corpo do detalhe renderiza só com props — sem
// QueryClient, sem apiClient e sem mocks de rede.

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AuditDetailBody } from './AuditDetailBody';
import {
  EMPTY_DETAIL_FORM,
  auditPhase,
  isDetailFormValid,
  type DetailFormValues,
  type FormKind,
} from './logic';
import type { InternalAuditDetailController } from '@/hooks/useInternalAuditDetail';
import type { InternalAuditDetail, InternalAuditStatus } from '../types';

function makeAudit(
  status: InternalAuditStatus,
  over: Partial<InternalAuditDetail> = {},
): InternalAuditDetail {
  return {
    id: 1,
    code: 'AUD-001',
    title: 'Payroll Q1',
    objective: null,
    scope: null,
    type: 'INTERNAL',
    status,
    modules: [],
    periodFrom: null,
    periodTo: null,
    criteria: null,
    startDate: null,
    dueDate: null,
    result: null,
    closingReport: null,
    approvedAt: null,
    cancelReason: null,
    leadAuditor: null,
    approvedBy: null,
    team: [],
    checks: [],
    evidences: [],
    findings: [],
    actions: [],
    history: [],
    ...over,
  };
}

function makeCtl(
  audit: InternalAuditDetail,
  over: { form?: FormKind; f?: Partial<DetailFormValues> } = {},
) {
  const form = over.form ?? null;
  const f = { ...EMPTY_DETAIL_FORM, ...over.f };
  const ctl = {
    audit,
    phase: auditPhase(audit.status),
    form,
    f,
    set: vi.fn(),
    responsible: null,
    setResponsible: vi.fn(),
    toggle: vi.fn(),
    closeForm: vi.fn(),
    formValid: isDetailFormValid(form, f),
    submit: {
      check: vi.fn(),
      evidence: vi.fn(),
      finding: vi.fn(),
      action: vi.fn(),
      approve: vi.fn(),
      cancel: vi.fn(),
    },
    changeStatus: vi.fn(),
    updateCheckStatus: vi.fn(),
    updateActionStatus: vi.fn(),
    exportReport: vi.fn(),
    pending: {
      check: false,
      evidence: false,
      finding: false,
      action: false,
      approve: false,
      status: false,
      export: false,
    },
  };
  return ctl as unknown as InternalAuditDetailController & typeof ctl;
}

describe('AuditDetailBody', () => {
  it('«Submeter para revisão» pede a transição IN_PROGRESS → IN_REVIEW', () => {
    const audit = makeAudit('IN_PROGRESS');
    const ctl = makeCtl(audit);
    render(<AuditDetailBody audit={audit} ctl={ctl} />);
    fireEvent.click(screen.getByText('Submeter para revisão'));
    expect(ctl.changeStatus).toHaveBeenCalledWith('IN_REVIEW');
  });

  it('estado final esconde o fluxo e as ações de recolha', () => {
    const audit = makeAudit('COMPLETED');
    render(<AuditDetailBody audit={audit} ctl={makeCtl(audit)} />);
    expect(screen.queryByText('Cancelar auditoria')).toBeNull();
    expect(screen.queryByText('Adicionar verificação')).toBeNull();
    expect(screen.getByText('Exportar relatório final')).toBeTruthy();
  });

  it('só se pode exportar o relatório depois de aprovado', () => {
    const audit = makeAudit('IN_REVIEW');
    render(<AuditDetailBody audit={audit} ctl={makeCtl(audit)} />);
    expect(screen.queryByText('Exportar relatório final')).toBeNull();
    expect(screen.getByText('Aprovar relatório')).toBeTruthy();
  });

  it('aprovação: «Aprovar» fica desativado sem relatório de encerramento', () => {
    const audit = makeAudit('IN_REVIEW');
    const empty = makeCtl(audit, { form: 'approve' });
    const { unmount } = render(<AuditDetailBody audit={audit} ctl={empty} />);
    const btn = screen.getByRole('button', { name: 'Aprovar' });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
    unmount();

    const filled = makeCtl(audit, {
      form: 'approve',
      f: { closingReport: 'Tudo conforme' },
    });
    render(<AuditDetailBody audit={audit} ctl={filled} />);
    const ok = screen.getByRole('button', { name: 'Aprovar' });
    expect((ok as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(ok);
    expect(filled.submit.approve).toHaveBeenCalledTimes(1);
  });
});
