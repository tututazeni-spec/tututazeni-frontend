import { describe, expect, test } from 'vitest';
import { EMPTY_FLOW_FORM, NONE, flowFormFromDetail } from './flowForm';
import type { AutomationRuleDetail } from './types';

// Só os campos que o mapeamento lê; o resto do detalhe é irrelevante aqui.
const detail = (over: Partial<AutomationRuleDetail> = {}) =>
  ({
    name: 'Boas-vindas',
    trigger: 'employee.created',
    action: 'send_notification',
    active: true,
    ...over,
  }) as AutomationRuleDetail;

describe('flowFormFromDetail', () => {
  test('campos opcionais em falta usam os mesmos valores que o formulário vazio', () => {
    const f = flowFormFromDetail(detail());
    expect(f).toMatchObject({
      description: '',
      category: NONE,
      moduleName: '',
      priority: '2',
      tags: '',
      conditionsLogic: 'AND',
      retryPolicy: 'NONE',
      maxRetries: '3',
      retryDelay: '5',
      errorHandling: 'NOTIFY_OWNER',
      notifyOnError: true,
      notes: '',
    });
    expect(f.activeFrom).toBe(EMPTY_FLOW_FORM.activeFrom);
  });

  test('prioridade é limitada a 3 e convertida para string', () => {
    expect(flowFormFromDetail(detail({ priority: 9 })).priority).toBe('3');
    expect(flowFormFromDetail(detail({ priority: 0 })).priority).toBe('0');
  });

  test('tags viram texto separado por vírgulas e datas ficam só com o dia', () => {
    const f = flowFormFromDetail(
      detail({
        tags: ['rh', 'onboarding'],
        activeFrom: '2026-10-01T00:00:00.000Z',
      }),
    );
    expect(f.tags).toBe('rh, onboarding');
    expect(f.activeFrom).toBe('2026-10-01');
  });

  test('regra sem fluxo guardado gera um passo "legacy" com a acção antiga', () => {
    const f = flowFormFromDetail(
      detail({ action: 'send_email', actionParams: { to: 'x' } }),
    );
    expect(f.steps).toEqual([
      {
        id: 'legacy',
        type: 'action',
        action: 'send_email',
        params: { to: 'x' },
      },
    ]);
  });

  test('draft e active reflectem o estado da regra', () => {
    const f = flowFormFromDetail(detail({ draft: true, active: false }));
    expect(f.wasDraft).toBe(true);
    expect(f.wasActive).toBe(false);
  });
});
