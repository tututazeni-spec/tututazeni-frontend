import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LessonEmptyState } from './LessonEmptyState';
import type { ModuleProgress } from './types';

const mod = (over: Partial<ModuleProgress>): ModuleProgress => ({
  id: 1,
  title: 'Módulo',
  seq: 1,
  type: null,
  mandatory: false,
  completedCount: 0,
  totalCount: 1,
  pct: 0,
  completed: false,
  locked: false,
  lockedReason: undefined,
  materials: [],
  lessons: [],
  ...over,
});

describe('LessonEmptyState', () => {
  test('sem módulos — explica que o curso ainda não tem conteúdo', () => {
    render(<LessonEmptyState modules={[]} loading={false} />);
    expect(
      screen.getByText('Este curso ainda não tem módulos'),
    ).toBeInTheDocument();
  });

  test('todos bloqueados — lista os motivos sem repetir', () => {
    render(
      <LessonEmptyState
        loading={false}
        modules={[
          mod({ id: 1, locked: true, lockedReason: 'Módulo não publicado' }),
          mod({ id: 2, locked: true, lockedReason: 'Módulo não publicado' }),
          mod({
            id: 3,
            locked: true,
            lockedReason: 'Não está matriculado neste curso',
          }),
        ]}
      />,
    );
    expect(
      screen.getByText('Nenhuma aula está disponível'),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Módulo não publicado')).toHaveLength(1);
    expect(
      screen.getByText('Não está matriculado neste curso'),
    ).toBeInTheDocument();
  });

  test('há módulos abertos — convida a escolher uma aula', () => {
    render(<LessonEmptyState loading={false} modules={[mod({})]} />);
    expect(
      screen.getByText('Selecciona uma aula para começar'),
    ).toBeInTheDocument();
  });

  test('a carregar — não afirma que não há módulos', () => {
    render(<LessonEmptyState loading modules={[]} />);
    expect(screen.getByText('A carregar o curso…')).toBeInTheDocument();
  });
});
