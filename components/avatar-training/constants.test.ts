import { describe, expect, it } from 'vitest';
import {
  ADMIN_ROLES,
  AUTHOR_ROLES,
  PROGRESS_ROLES,
  TABS,
} from './constants';

const visibleFor = (role: Parameters<typeof AUTHOR_ROLES.includes>[0]) =>
  TABS.filter((t) => !t.roles || t.roles.includes(role)).map((t) => t.id);

describe('avatar-training tabs por papel', () => {
  it('COLABORADOR vê só as abas de formando', () => {
    expect(visibleFor('COLABORADOR')).toEqual([
      'overview',
      'room',
      'programs',
      'avatars',
      'progress',
      'history',
    ]);
  });

  it('Relatórios exige papéis de progresso; Configurações exige autoria', () => {
    expect(visibleFor('AUDITOR')).toContain('reports');
    expect(visibleFor('AUDITOR')).not.toContain('settings');
    expect(visibleFor('INSTRUCTOR')).toContain('settings');
    expect(visibleFor('ADMIN')).toContain('settings');
  });

  it('administração é subconjunto de autoria', () => {
    ADMIN_ROLES.forEach((r) => expect(AUTHOR_ROLES).toContain(r));
    AUTHOR_ROLES.forEach((r) => expect(PROGRESS_ROLES).toContain(r));
  });
});
