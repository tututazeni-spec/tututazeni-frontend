import { describe, expect, it } from 'vitest';
import { visibleTabs } from './tabs';

const ids = (role: Parameters<typeof visibleTabs>[0]) =>
  visibleTabs(role).map((t) => t.id);

describe('visibleTabs (Integrações de API)', () => {
  it('ADMIN vê todos os separadores', () => {
    expect(ids('ADMIN')).toEqual([
      'integrations',
      'webhooks',
      'api-keys',
      'monitoring',
    ]);
  });

  it('RH não vê Webhooks nem Chaves de API (o backend só deixa ADMIN gerir)', () => {
    expect(ids('RH')).toEqual(['integrations', 'monitoring']);
  });

  it('papel ainda por carregar não mostra os separadores restritos (sem piscar)', () => {
    expect(ids(undefined)).toEqual(['integrations', 'monitoring']);
  });
});
