// lib/roles.test.ts
// Cobre a lógica de filtro por role que estava duplicada de forma independente
// em components/Sidebar.tsx e app/(platform)/dashboard/page.tsx — ver
// memory project_innova_component_separation_audit.

import { describe, expect, test } from 'vitest';
import {
  filterByRole,
  filterNavSections,
  isRoleAllowed,
  type Role,
} from './roles';

interface TestNavItem {
  href: string;
  roles?: readonly Role[];
}

describe('isRoleAllowed', () => {
  test('permite quando o item não tem roles definidas (sem restrição)', () => {
    expect(isRoleAllowed(undefined, 'COLABORADOR')).toBe(true);
  });

  test('permite quando o array de roles do item está vazio', () => {
    expect(isRoleAllowed([], 'COLABORADOR')).toBe(true);
  });

  test('permite quando a role do utilizador ainda não chegou (undefined)', () => {
    expect(isRoleAllowed(['ADMIN', 'RH'], undefined)).toBe(true);
  });

  test('permite quando a role do utilizador está na lista do item', () => {
    expect(isRoleAllowed(['ADMIN', 'RH'], 'RH')).toBe(true);
  });

  test('bloqueia quando a role do utilizador não está na lista do item', () => {
    expect(isRoleAllowed(['ADMIN', 'RH'], 'COLABORADOR')).toBe(false);
  });
});

describe('filterByRole', () => {
  test('mantém só os itens visíveis para a role dada', () => {
    const items = [
      { id: 'a', roles: ['ADMIN'] as const },
      { id: 'b' },
      { id: 'c', roles: ['ADMIN', 'RH'] as const },
    ];

    const result = filterByRole(items, 'RH');

    expect(result.map((i) => i.id)).toEqual(['b', 'c']);
  });
});

describe('filterNavSections', () => {
  test('remove secções que ficam sem nenhum item visível', () => {
    const sections: { label: string; items: TestNavItem[] }[] = [
      {
        label: 'Só admin',
        items: [{ href: '/audit', roles: ['ADMIN'] }],
      },
      {
        label: 'Todos',
        items: [{ href: '/courses' }],
      },
    ];

    const result = filterNavSections(sections, 'COLABORADOR');

    expect(result.map((s) => s.label)).toEqual(['Todos']);
  });

  test('preserva a ordem e os itens visíveis dentro de cada secção', () => {
    const sections: { label: string; items: TestNavItem[] }[] = [
      {
        label: 'RH',
        items: [{ href: '/users', roles: ['ADMIN', 'RH'] }, { href: '/leave' }],
      },
    ];

    const result = filterNavSections(sections, 'RH');

    expect(result).toEqual([
      {
        label: 'RH',
        items: [{ href: '/users', roles: ['ADMIN', 'RH'] }, { href: '/leave' }],
      },
    ]);
  });
});
