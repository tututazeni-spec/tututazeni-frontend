// lib/roles.test.ts
// Cobre a lógica de filtro por role que estava duplicada de forma independente
// em components/Sidebar.tsx e app/(platform)/dashboard/page.tsx — ver
// memory project_innova_component_separation_audit.

import { describe, expect, test } from 'vitest';
import {
  AUTHENTICATED_ROLES,
  filterByRole,
  filterNavSections,
  homeFor,
  isExternalInstructorRole,
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

describe('instrutor externo', () => {
  type NavItem = { href: string; roles?: readonly Role[] };
  const sections: { label: string; items: NavItem[] }[] = [
    {
      label: 'Aprender',
      items: [
        { href: '/courses' },
        { href: '/evaluation' },
        { href: '/live-classes' },
        { href: '/ai-tutor' },
      ],
    },
    { label: 'Pessoas', items: [{ href: '/users', roles: ['ADMIN', 'RH'] }, { href: '/leave' }] },
    { label: 'Sistema', items: [{ href: '/settings' }, { href: '/support' }] },
  ];

  test('o menu só mostra Cursos e Aulas ao Vivo, mesmo em itens sem restrição de papel', () => {
    const result = filterNavSections(sections, 'INSTRUCTOR_EXTERNO');
    expect(result.map((s) => s.items.map((i) => i.href))).toEqual([
      ['/courses', '/live-classes'],
    ]);
  });

  test('os outros papéis não mudam', () => {
    const result = filterNavSections(sections, 'COLABORADOR');
    expect(result.flatMap((s) => s.items.map((i) => i.href))).toEqual([
      '/courses',
      '/evaluation',
      '/live-classes',
      '/ai-tutor',
      '/leave',
      '/settings',
      '/support',
    ]);
  });

  test('o externo aterra nas aulas ao vivo; os outros no dashboard', () => {
    expect(homeFor('INSTRUCTOR_EXTERNO')).toBe('/live-classes');
    expect(homeFor('ADMIN')).toBe('/dashboard');
    expect(homeFor(undefined)).toBe('/dashboard');
  });

  test('AUTHENTICATED_ROLES não inclui o externo (espelha o backend)', () => {
    expect(AUTHENTICATED_ROLES).not.toContain('INSTRUCTOR_EXTERNO');
    expect(isExternalInstructorRole('INSTRUCTOR_EXTERNO')).toBe(true);
    expect(isExternalInstructorRole('INSTRUCTOR')).toBe(false);
  });
});
