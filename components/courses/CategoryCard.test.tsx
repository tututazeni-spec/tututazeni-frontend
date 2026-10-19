import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CategoryCard } from './CategoryCard';

function setup(overrides: Partial<Parameters<typeof CategoryCard>[0]> = {}) {
  const onToggleActive = vi.fn();
  const onViewCourses = vi.fn();
  render(
    <CategoryCard
      seed={1}
      title="Cultura Organizacional"
      subtitle="Cursos de cultura"
      active
      onToggleActive={onToggleActive}
      createdAt="2026-10-17T22:21:00Z"
      courseCount={3}
      onViewCourses={onViewCourses}
      actions={<button type="button">Gerir cursos</button>}
      {...overrides}
    />,
  );
  return { onToggleActive, onViewCourses };
}

describe('CategoryCard', () => {
  test('mostra título, descrição, estado e contagem', () => {
    setup();
    expect(
      screen.getByRole('heading', { name: 'Cultura Organizacional' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Cursos de cultura')).toBeInTheDocument();
    expect(screen.getByText('Activa')).toBeInTheDocument();
    expect(screen.getByText('3 cursos')).toBeInTheDocument();
  });

  test('estado alterna e contagem abre a lista de cursos', () => {
    const { onToggleActive, onViewCourses } = setup();
    fireEvent.click(screen.getByText('Activa'));
    fireEvent.click(screen.getByRole('button', { name: /ver cursos/i }));
    expect(onToggleActive).toHaveBeenCalledTimes(1);
    expect(onViewCourses).toHaveBeenCalledTimes(1);
  });

  test('sem cursos — a contagem não é clicável', () => {
    setup({ courseCount: 0, active: false });
    expect(screen.getByText('0 cursos')).toBeInTheDocument();
    expect(screen.getByText('Inactiva')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ver cursos/i })).toBeDisabled();
  });
});
