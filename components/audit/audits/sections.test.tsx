// As secções do detalhe de uma auditoria renderizam só com props.

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ActionsSection } from './ActionsSection';
import { ChecksSection } from './ChecksSection';
import { EvidencesSection } from './EvidencesSection';
import { FindingsSection } from './FindingsSection';
import { HistorySection } from './HistorySection';
import { WorkflowSection } from './WorkflowSection';
import { AddButton, SubmitRow } from './detailParts';
import {
  EMPTY_DETAIL_FORM,
  auditPhase,
  isDetailFormValid,
  type DetailFormValues,
  type FormKind,
} from './logic';
import type { InternalAuditDetailController } from '@/hooks/useInternalAuditDetail';
import type { InternalAuditDetail, InternalAuditStatus } from '../types';

// O selector de responsável tem os seus próprios pedidos: fora do âmbito destes testes.
vi.mock('@/components/departments/DepartmentUserPicker', () => ({
  DepartmentUserPicker: () => <div>PICKER</div>,
}));

const btn = (name: string | RegExp) => screen.getByRole('button', { name });

function audit(
  status: InternalAuditStatus,
  over: Partial<InternalAuditDetail> = {},
): InternalAuditDetail {
  return {
    id: 1,
    code: 'AUD-1',
    title: 'Payroll',
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
  a: InternalAuditDetail,
  over: { form?: FormKind; f?: Partial<DetailFormValues> } = {},
) {
  const form = over.form ?? null;
  const f = { ...EMPTY_DETAIL_FORM, ...over.f };
  const ctl = {
    audit: a,
    phase: auditPhase(a.status),
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

describe('detailParts', () => {
  it('AddButton e SubmitRow', () => {
    const onAdd = vi.fn();
    const onSave = vi.fn();
    const onCancel = vi.fn();
    render(
      <>
        <AddButton label="Adicionar x" onClick={onAdd} />
        <SubmitRow
          label="Aprovar"
          pending={false}
          disabled={false}
          onClick={onSave}
          onCancel={onCancel}
        />
      </>,
    );
    fireEvent.click(btn(/Adicionar x/));
    fireEvent.click(btn('Aprovar'));
    fireEvent.click(btn('Cancelar'));
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('SubmitRow sem rótulo usa «Guardar»', () => {
    render(<SubmitRow pending={false} onClick={vi.fn()} onCancel={vi.fn()} />);
    expect(btn('Guardar')).toBeTruthy();
  });
});

describe('WorkflowSection — botões por estado', () => {
  const labelsFor = (status: InternalAuditStatus) => {
    const a = audit(status);
    const { unmount } = render(<WorkflowSection audit={a} ctl={makeCtl(a)} />);
    const names = screen.queryAllByRole('button').map((b) => b.textContent);
    unmount();
    return names;
  };

  it('planeada: preparar ou executar, e cancelar', () => {
    expect(labelsFor('PLANNED')).toEqual([
      'Iniciar preparação',
      'Iniciar execução',
      'Cancelar auditoria',
    ]);
  });

  it('em execução: submeter para revisão', () => {
    expect(labelsFor('IN_PROGRESS')).toEqual([
      'Submeter para revisão',
      'Cancelar auditoria',
    ]);
  });

  it('em revisão: devolver ou aprovar', () => {
    expect(labelsFor('IN_REVIEW')).toEqual([
      'Devolver à execução',
      'Aprovar relatório',
      'Cancelar auditoria',
    ]);
  });

  it('a aguardar ações corretivas: só aprovar', () => {
    expect(labelsFor('AWAITING_CORRECTIVE_ACTIONS')).toEqual([
      'Aprovar relatório',
      'Cancelar auditoria',
    ]);
  });

  it('estados finais não têm fluxo nenhum', () => {
    expect(labelsFor('COMPLETED')).toEqual([]);
    expect(labelsFor('CANCELLED')).toEqual([]);
  });

  it('cada botão pede a transição certa', () => {
    const a = audit('PLANNED');
    const ctl = makeCtl(a);
    render(<WorkflowSection audit={a} ctl={ctl} />);
    fireEvent.click(btn('Iniciar preparação'));
    fireEvent.click(btn('Iniciar execução'));
    fireEvent.click(btn('Cancelar auditoria'));
    expect(ctl.changeStatus).toHaveBeenNthCalledWith(1, 'PREPARING');
    expect(ctl.changeStatus).toHaveBeenNthCalledWith(2, 'IN_PROGRESS');
    expect(ctl.toggle).toHaveBeenCalledWith('cancel');
  });

  it('cancelamento exige justificação', () => {
    const a = audit('IN_PROGRESS');
    const { unmount } = render(
      <WorkflowSection audit={a} ctl={makeCtl(a, { form: 'cancel' })} />,
    );
    expect((btn('Confirmar cancelamento') as HTMLButtonElement).disabled).toBe(
      true,
    );
    unmount();

    const ctl = makeCtl(a, { form: 'cancel', f: { reason: 'Duplicada' } });
    render(<WorkflowSection audit={a} ctl={ctl} />);
    fireEvent.click(btn('Confirmar cancelamento'));
    expect(ctl.submit.cancel).toHaveBeenCalledTimes(1);
  });
});

describe('ChecksSection', () => {
  const a = audit('IN_PROGRESS', {
    checks: [
      { id: 1, title: 'Revisão de acessos', status: 'PASSED', notes: null },
    ],
  });

  it('a recolher: permite adicionar; terminada: mostra o estado só de leitura', () => {
    const ctl = makeCtl(a);
    const { unmount } = render(<ChecksSection audit={a} ctl={ctl} />);
    fireEvent.click(btn(/Adicionar verificação/));
    expect(ctl.toggle).toHaveBeenCalledWith('check');
    unmount();

    const done = audit('COMPLETED', { checks: a.checks });
    render(<ChecksSection audit={done} ctl={makeCtl(done)} />);
    expect(
      screen.queryByRole('button', { name: /Adicionar verificação/ }),
    ).toBeNull();
    expect(screen.getByText('Conforme')).toBeTruthy();
  });

  it('sem verificações explica', () => {
    const empty = audit('IN_PROGRESS');
    render(<ChecksSection audit={empty} ctl={makeCtl(empty)} />);
    expect(screen.getByText('Sem verificações.')).toBeTruthy();
  });
});

describe('EvidencesSection', () => {
  it('mostra o evento ligado e a ligação segura', () => {
    const a = audit('IN_PROGRESS', {
      evidences: [
        {
          id: 1,
          title: 'Extracto',
          description: 'Janeiro',
          url: 'https://x.ao/doc',
          auditLogId: 42,
          createdAt: '2026-01-05T10:00:00Z',
          addedBy: { id: 1, fullName: 'Ana' },
        },
      ],
    } as never);
    render(<EvidencesSection audit={a} ctl={makeCtl(a)} />);
    expect(screen.getByText('Extracto')).toBeTruthy();
    expect(screen.getByText(/evento #42/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'https://x.ao/doc' })).toBeTruthy();
  });

  it('o formulário grava com o título preenchido', () => {
    const a = audit('IN_PROGRESS');
    const ctl = makeCtl(a, { form: 'evidence', f: { title: 'Extracto' } });
    render(<EvidencesSection audit={a} ctl={ctl} />);
    fireEvent.click(btn('Guardar'));
    expect(ctl.submit.evidence).toHaveBeenCalledTimes(1);
  });
});

describe('FindingsSection', () => {
  it('rotula não conformidades e observações com o risco', () => {
    const a = audit('IN_PROGRESS', {
      findings: [
        {
          id: 1,
          title: 'Sem dupla validação',
          description: null,
          nonConformity: true,
          risk: 'HIGH',
          recommendation: 'Introduzir validação',
        },
        {
          id: 2,
          title: 'Documentação antiga',
          description: null,
          nonConformity: false,
          risk: 'LOW',
          recommendation: null,
        },
      ],
    });
    render(<FindingsSection audit={a} ctl={makeCtl(a)} />);
    expect(screen.getByText('Não conformidade')).toBeTruthy();
    expect(screen.getByText('Observação')).toBeTruthy();
    expect(screen.getAllByText(/^Risco /)).toHaveLength(2);
    expect(screen.getByText('Recomendação: Introduzir validação')).toBeTruthy();
  });
});

describe('ActionsSection', () => {
  const a = audit('IN_REVIEW', {
    actions: [
      {
        id: 1,
        findingId: null,
        description: 'Corrigir permissões',
        status: 'OPEN',
        dueDate: null,
        responsible: null,
      },
    ],
  });

  it('só se criam ações a partir de «em execução»', () => {
    render(<ActionsSection audit={a} ctl={makeCtl(a)} />);
    expect(btn(/Criar ação corretiva/)).toBeTruthy();
    expect(screen.getByText(/Sem responsável/)).toBeTruthy();
  });

  it('antes da execução não há botão nem estados editáveis', () => {
    const planned = audit('PLANNED', { actions: a.actions });
    render(<ActionsSection audit={planned} ctl={makeCtl(planned)} />);
    expect(
      screen.queryByRole('button', { name: /Criar ação corretiva/ }),
    ).toBeNull();
    expect(screen.getByText('Aberta')).toBeTruthy();
  });

  it('formulário: «Guardar» só ativa com a descrição', () => {
    const { unmount } = render(
      <ActionsSection audit={a} ctl={makeCtl(a, { form: 'action' })} />,
    );
    expect((btn('Guardar') as HTMLButtonElement).disabled).toBe(true);
    unmount();

    const ctl = makeCtl(a, { form: 'action', f: { description: 'Rever' } });
    render(<ActionsSection audit={a} ctl={ctl} />);
    fireEvent.click(btn('Guardar'));
    expect(ctl.submit.action).toHaveBeenCalledTimes(1);
  });
});

describe('HistorySection', () => {
  it('traduz a ação e usa «Sistema» sem autor', () => {
    const a = audit('IN_PROGRESS', {
      history: [
        {
          id: 1,
          action: 'AUDIT_CHECK_ADDED',
          timestamp: '2026-01-05T10:00:00Z',
          user: null,
        },
      ],
    });
    render(<HistorySection audit={a} />);
    expect(screen.getByText(/Sistema/)).toBeTruthy();
    expect(screen.getByText(/check added/)).toBeTruthy();
  });
});
