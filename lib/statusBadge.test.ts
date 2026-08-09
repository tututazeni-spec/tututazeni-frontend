// lib/statusBadge.test.ts
// Cobre a resolução de configuração de badges de estado (label+cor), que
// estava duplicada em ~25 páginas como `const { label, cls } = cfg[status]`
// — sem nenhuma protecção contra um valor de enum não coberto pelo mapa
// (rebentava com "Cannot destructure property 'label' of undefined").
// Ver memory project_innova_component_separation_audit.

import { describe, expect, test } from 'vitest';
import { resolveBadge, type StatusBadgeMap } from './statusBadge';

type Status = 'ACTIVE' | 'INACTIVE';

const map: StatusBadgeMap<Status> = {
  ACTIVE: { label: 'Activo', cls: 'bg-emerald-50 text-emerald-700' },
  INACTIVE: { label: 'Inactivo', cls: 'bg-gray-100 text-gray-500' },
};

describe('resolveBadge', () => {
  test('devolve a configuração correspondente ao valor', () => {
    expect(resolveBadge(map, 'ACTIVE')).toEqual({
      label: 'Activo',
      cls: 'bg-emerald-50 text-emerald-700',
    });
  });

  test('devolve um fallback seguro para um valor fora do mapa, em vez de rebentar', () => {
    // Simula um valor de enum novo no backend que o frontend ainda não mapeou.
    const unknown = 'ARCHIVED' as Status;
    expect(resolveBadge(map, unknown)).toEqual({
      label: 'ARCHIVED',
      cls: 'bg-gray-100 text-gray-500',
    });
  });

  test('permite personalizar o fallback', () => {
    const unknown = 'ARCHIVED' as Status;
    expect(
      resolveBadge(map, unknown, {
        label: 'Desconhecido',
        cls: 'bg-red-50 text-red-700',
      }),
    ).toEqual({ label: 'Desconhecido', cls: 'bg-red-50 text-red-700' });
  });
});
