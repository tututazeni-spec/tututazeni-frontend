import { describe, expect, it } from 'vitest';
import {
  EMPTY_DETAIL_FORM,
  EMPTY_NEW_AUDIT_FORM,
  auditPhase,
  buildActionPayload,
  buildApprovePayload,
  buildCreateAuditPayload,
  buildEvidencePayload,
  buildFindingPayload,
  canExportReport,
  clearDetailFields,
  isDetailFormValid,
  toIso,
  validateNewAudit,
  workflowSteps,
  historyActionLabel,
  findingKindLabel,
  findingSelectItems,
  findingSelectValue,
  parseFindingChoice,
  NO_FINDING,
} from './logic';
import type { InternalAuditStatus } from '../types';

describe('auditPhase', () => {
  const cases: Array<
    [InternalAuditStatus, [boolean, boolean, boolean, boolean]]
  > = [
    // [collecting, actionable, reviewable, terminal]
    ['PLANNED', [true, false, false, false]],
    ['PREPARING', [true, false, false, false]],
    ['IN_PROGRESS', [true, true, false, false]],
    ['IN_REVIEW', [false, true, true, false]],
    ['AWAITING_CORRECTIVE_ACTIONS', [false, true, true, false]],
    ['COMPLETED', [false, false, false, true]],
    ['CANCELLED', [false, false, false, true]],
  ];

  it.each(cases)(
    '%s',
    (status, [collecting, actionable, reviewable, terminal]) => {
      expect(auditPhase(status)).toEqual({
        collecting,
        actionable,
        reviewable,
        terminal,
      });
    },
  );

  it('sem estado (a carregar) nada está ativo', () => {
    expect(auditPhase(undefined)).toEqual({
      collecting: false,
      actionable: false,
      reviewable: false,
      terminal: false,
    });
  });
});

describe('canExportReport', () => {
  it('só depois de aprovada', () => {
    expect(canExportReport('COMPLETED')).toBe(true);
    expect(canExportReport('AWAITING_CORRECTIVE_ACTIONS')).toBe(true);
    expect(canExportReport('IN_REVIEW')).toBe(false);
    expect(canExportReport('CANCELLED')).toBe(false);
  });
});

describe('toIso', () => {
  it('vazio dá undefined, data dá ISO', () => {
    expect(toIso('')).toBeUndefined();
    expect(toIso('2026-03-05')).toBe(
      new Date('2026-03-05T00:00:00').toISOString(),
    );
  });
});

describe('nova auditoria', () => {
  it('exige título', () => {
    expect(validateNewAudit(EMPTY_NEW_AUDIT_FORM)).toBe(
      'Indique o título da auditoria',
    );
    expect(
      validateNewAudit({ ...EMPTY_NEW_AUDIT_FORM, title: '   ' }),
    ).not.toBeNull();
    expect(
      validateNewAudit({ ...EMPTY_NEW_AUDIT_FORM, title: 'A' }),
    ).toBeNull();
  });

  it('normaliza o corpo do pedido', () => {
    const payload = buildCreateAuditPayload(
      {
        ...EMPTY_NEW_AUDIT_FORM,
        title: '  Payroll Q1 ',
        objective: '   ',
        modules: ' Payroll, ,Assiduidade ',
        dueDate: '2026-04-01',
      },
      7,
      [1, 2],
    );
    expect(payload).toMatchObject({
      title: 'Payroll Q1',
      type: 'INTERNAL',
      objective: undefined,
      modules: ['Payroll', 'Assiduidade'],
      periodFrom: undefined,
      leadAuditorId: 7,
      teamIds: [1, 2],
    });
    expect(payload.dueDate).toBe(new Date('2026-04-01T00:00:00').toISOString());
  });
});

describe('formulários do detalhe', () => {
  const f = EMPTY_DETAIL_FORM;

  it('cada formulário exige o seu campo obrigatório', () => {
    expect(isDetailFormValid('check', f)).toBe(false);
    expect(isDetailFormValid('check', { ...f, title: ' x ' })).toBe(true);
    expect(isDetailFormValid('evidence', { ...f, title: 'x' })).toBe(true);
    expect(isDetailFormValid('finding', { ...f, title: 'x' })).toBe(true);
    expect(isDetailFormValid('action', { ...f, title: 'x' })).toBe(false);
    expect(isDetailFormValid('action', { ...f, description: 'x' })).toBe(true);
    expect(isDetailFormValid('approve', { ...f, closingReport: '  ' })).toBe(
      false,
    );
    expect(isDetailFormValid('approve', { ...f, closingReport: 'ok' })).toBe(
      true,
    );
    expect(isDetailFormValid('cancel', { ...f, reason: 'x' })).toBe(true);
    expect(isDetailFormValid(null, { ...f, title: 'x' })).toBe(false);
  });

  it('clearDetailFields limpa texto mas mantém os selectores', () => {
    const cleared = clearDetailFields({
      ...f,
      title: 'x',
      description: 'y',
      findingId: '3',
      nonConformity: 'false',
      risk: 'HIGH',
      result: 'NAO_CONFORME',
    });
    expect(cleared).toEqual({
      ...f,
      nonConformity: 'false',
      risk: 'HIGH',
      result: 'NAO_CONFORME',
    });
  });

  it('evidência: números e textos opcionais', () => {
    expect(
      buildEvidencePayload({ ...f, title: ' t ', url: ' ', auditLogId: '42' }),
    ).toEqual({
      title: 't',
      description: undefined,
      url: undefined,
      auditLogId: 42,
    });
    expect(
      buildEvidencePayload({ ...f, title: 't' }).auditLogId,
    ).toBeUndefined();
  });

  it('constatação: nonConformity é booleano', () => {
    expect(buildFindingPayload({ ...f, title: 't' }).nonConformity).toBe(true);
    expect(
      buildFindingPayload({ ...f, title: 't', nonConformity: 'false' })
        .nonConformity,
    ).toBe(false);
  });

  it('ação: findingId vazio fica undefined e o responsável vem à parte', () => {
    expect(buildActionPayload({ ...f, description: ' d ' }, 5)).toEqual({
      description: 'd',
      findingId: undefined,
      responsibleId: 5,
      dueDate: undefined,
    });
    expect(
      buildActionPayload({ ...f, description: 'd', findingId: '9' }, undefined)
        .findingId,
    ).toBe(9);
  });

  it('aprovação aparara o relatório', () => {
    expect(buildApprovePayload({ ...f, closingReport: ' fim ' })).toEqual({
      result: 'CONFORME',
      closingReport: 'fim',
    });
  });
});

describe('workflowSteps', () => {
  it('cada estado oferece só as transições válidas', () => {
    expect(workflowSteps('PLANNED')).toEqual({
      startPreparation: true,
      startExecution: true,
      submitReview: false,
      returnToExecution: false,
    });
    expect(workflowSteps('PREPARING')).toMatchObject({
      startPreparation: false,
      startExecution: true,
    });
    expect(workflowSteps('IN_PROGRESS')).toMatchObject({
      submitReview: true,
      startExecution: false,
    });
    expect(workflowSteps('IN_REVIEW')).toMatchObject({
      returnToExecution: true,
      submitReview: false,
    });
    expect(workflowSteps('AWAITING_CORRECTIVE_ACTIONS')).toEqual({
      startPreparation: false,
      startExecution: false,
      submitReview: false,
      returnToExecution: false,
    });
  });
});

describe('textos do detalhe', () => {
  it('historyActionLabel', () => {
    expect(historyActionLabel('AUDIT_CHECK_ADDED')).toBe('check added');
    expect(historyActionLabel('AUDIT_STATUS_CHANGED')).toBe('status changed');
    expect(historyActionLabel('OTHER_EVENT')).toBe('other event');
  });

  it('findingKindLabel', () => {
    expect(findingKindLabel(true)).toBe('Não conformidade');
    expect(findingKindLabel(false)).toBe('Observação');
  });

  it('selector de constatação associada', () => {
    expect(
      findingSelectItems([
        { id: 4, title: 'Falta de registo' },
        { id: 9, title: 'Acesso indevido' },
      ]),
    ).toEqual([
      { value: NO_FINDING, label: 'Sem constatação associada' },
      { value: '4', label: 'Falta de registo' },
      { value: '9', label: 'Acesso indevido' },
    ]);
    expect(findingSelectValue('')).toBe(NO_FINDING);
    expect(findingSelectValue('4')).toBe('4');
    expect(parseFindingChoice(NO_FINDING)).toBe('');
    expect(parseFindingChoice('4')).toBe('4');
  });
});
