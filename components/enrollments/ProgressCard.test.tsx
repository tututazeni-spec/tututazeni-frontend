import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ListChecks } from 'lucide-react';
import { ProgressCard } from './ProgressCard';

const base = {
  seed: 1,
  title: 'Recursos Humanos',
  tag: 'Departamento',
  infos: [{ icon: ListChecks, text: 'Total: 10' }],
  progress: { value: 40, label: 'Taxa de conclusão' },
};

describe('ProgressCard', () => {
  test('mostra etiqueta, título, informação e progresso', () => {
    render(<ProgressCard {...base} />);
    expect(screen.getByText('Departamento')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Recursos Humanos' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Total: 10')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('sem avatar — o painel mostra a taxa de conclusão', () => {
    render(<ProgressCard {...base} />);
    expect(screen.getAllByText('40%')).toHaveLength(2);
  });

  test('com avatar — o painel mostra a foto do membro', () => {
    render(
      <ProgressCard
        {...base}
        avatar={{ name: 'Ana Silva', url: 'data:image/png;base64,AAAA' }}
      />,
    );
    expect(
      screen.getByRole('img', { name: 'Foto de Ana Silva' }),
    ).toHaveAttribute('src', 'data:image/png;base64,AAAA');
  });
});
