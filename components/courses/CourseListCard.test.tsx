import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CourseListCard, type CourseCardData } from './CourseListCard';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

const course: CourseCardData = {
  title: 'Segurança no Trabalho',
  thumbnailUrl: 'https://cdn.innova.ao/seg.jpg',
  category: 'Compliance',
  workloadHours: 4,
  level: 'BEGINNER',
  modality: 'ONLINE',
  department: { id: 1, name: 'RH' },
  _count: { enrollments: 12 },
};

describe('CourseListCard', () => {
  test('mostra título, imagem e metadados', () => {
    render(<CourseListCard courseId={1} course={course} onSelect={() => {}} />);
    expect(
      screen.getByRole('heading', { name: 'Segurança no Trabalho' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/^#/)).not.toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      'https://cdn.innova.ao/seg.jpg',
    );
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  test('sem imagem — usa o ícone e não oferece upload', () => {
    const { container } = render(
      <CourseListCard
        courseId={7}
        course={{ ...course, thumbnailUrl: null }}
        onSelect={() => {}}
      />,
    );
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(container.querySelector('input[type="file"]')).toBeNull();
  });

  test('progresso, estado e obrigatório só aparecem quando passados', () => {
    const { rerender } = render(
      <CourseListCard courseId={1} course={course} onSelect={() => {}} />,
    );
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByText('Obrigatório')).not.toBeInTheDocument();

    rerender(
      <CourseListCard
        courseId={1}
        course={course}
        mandatory
        progress={40}
        myStatus="IN_PROGRESS"
        onSelect={() => {}}
      />,
    );
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar').firstElementChild).toHaveStyle({
      backgroundColor: '#0E8794',
    });
    expect(screen.getByText('Obrigatório')).toBeInTheDocument();
    expect(screen.getByText('Em progresso')).toBeInTheDocument();
  });

  test('clique e Enter chamam onSelect', () => {
    const onSelect = vi.fn();
    render(<CourseListCard courseId={1} course={course} onSelect={onSelect} />);
    const card = screen.getByRole('button');
    fireEvent.click(card);
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  test('modo gestão — estado, instrutor, tipo, publicação, progresso médio e menu', () => {
    const onSelect = vi.fn();
    render(
      <CourseListCard
        courseId={2}
        course={{
          ...course,
          status: 'DRAFT',
          type: 'COMPLIANCE',
          publishedAt: null,
          primaryInstructor: null,
          _count: { enrollments: 3 },
        }}
        progress={25}
        progressLabel="Progresso médio"
        onSelect={onSelect}
        actions={<button type="button">Menu</button>}
      />,
    );
    expect(screen.getByText('Rascunho')).toBeInTheDocument();
    expect(screen.getByText('Sem instrutor')).toBeInTheDocument();
    expect(screen.getByText('Compliance')).toBeInTheDocument();
    expect(screen.getByText('Formandos: 3')).toBeInTheDocument();
    expect(screen.getByText('Progresso médio')).toBeInTheDocument();
    // clicar no menu não abre o curso; clicar no título abre
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole('button', { name: 'Segurança no Trabalho' }),
    );
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
