import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MySummaryPanel } from './MySummaryPanel';
import type { MySummary } from './types';

const empty: MySummary = {
  emailEnabled: false,
  pending: [],
  expiringSoon: [],
  mandatoryMissing: [],
};

describe('MySummaryPanel', () => {
  test('sem dados não mostra nenhum bloco', () => {
    const { container } = render(<MySummaryPanel summary={empty} />);
    expect(container).toBeEmptyDOMElement();
  });

  test('mostra as formações obrigatórias por concluir com o título e o prazo', () => {
    render(
      <MySummaryPanel
        summary={{
          ...empty,
          mandatoryMissing: [
            {
              enrollmentId: 1,
              courseId: 10,
              title: 'Segurança no Trabalho',
              deadline: '2026-12-31T00:00:00.000Z',
              status: 'IN_PROGRESS',
            },
          ],
        }}
      />,
    );
    expect(
      screen.getByText('Formações obrigatórias por concluir'),
    ).toBeInTheDocument();
    expect(screen.getByText(/Segurança no Trabalho/)).toBeInTheDocument();
    expect(screen.queryByText('A aguardar aprovação')).not.toBeInTheDocument();
    expect(screen.queryByText(/IN_PROGRESS/)).not.toBeInTheDocument();
  });

  test('mostra pendentes de aprovação e a expirar em breve', () => {
    render(
      <MySummaryPanel
        summary={{
          ...empty,
          pending: [{ id: 1, title: 'Primeiros Socorros' }],
          expiringSoon: [
            { id: 2, title: 'Fogo', expiresAt: '2026-11-10T00:00:00.000Z' },
          ],
        }}
      />,
    );
    expect(screen.getByText('A aguardar aprovação')).toBeInTheDocument();
    expect(screen.getByText(/Primeiros Socorros/)).toBeInTheDocument();
    expect(screen.getByText('A expirar em breve')).toBeInTheDocument();
    expect(screen.getByText(/Fogo/)).toBeInTheDocument();
  });
});
