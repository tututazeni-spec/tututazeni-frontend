import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { RatingScale } from './RatingScale';

describe('RatingScale', () => {
  test('mostra 5 níveis (sem zero) e a legenda do nível escolhido', () => {
    render(<RatingScale label="Nota" value={4} onChange={() => {}} />);
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(5);
    expect(radios.map((r) => r.getAttribute('aria-label'))).not.toContain(
      expect.stringMatching(/^0 /),
    );
    expect(
      screen.getByRole('radio', { name: /4 — Muito bom/ }),
    ).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('rating-description')).toHaveTextContent(
      'Demonstra desempenho acima do esperado com consistência.',
    );
  });

  test('sem nota: nada selecionado e texto de ajuda', () => {
    render(<RatingScale label="Nota" onChange={() => {}} />);
    expect(
      screen
        .getAllByRole('radio')
        .every((r) => r.getAttribute('aria-checked') === 'false'),
    ).toBe(true);
    expect(screen.getByTestId('rating-description')).toHaveTextContent(
      /Sem nota/,
    );
  });

  test('clique e setas do teclado alteram a nota', () => {
    const onChange = vi.fn();
    render(<RatingScale label="Nota" value={3} onChange={onChange} />);
    fireEvent.click(screen.getByRole('radio', { name: /5 — Excelente/ }));
    expect(onChange).toHaveBeenLastCalledWith(5);
    fireEvent.keyDown(screen.getByRole('radio', { name: /3 — Bom/ }), {
      key: 'ArrowRight',
    });
    expect(onChange).toHaveBeenLastCalledWith(4);
    fireEvent.keyDown(screen.getByRole('radio', { name: /3 — Bom/ }), {
      key: 'End',
    });
    expect(onChange).toHaveBeenLastCalledWith(5);
    fireEvent.keyDown(screen.getByRole('radio', { name: /3 — Bom/ }), {
      key: 'Home',
    });
    expect(onChange).toHaveBeenLastCalledWith(1);
  });

  test('apenas o nível ativo é alcançável por Tab', () => {
    render(<RatingScale label="Nota" value={2} onChange={() => {}} />);
    const tabbable = screen
      .getAllByRole('radio')
      .filter((r) => r.tabIndex === 0);
    expect(tabbable).toHaveLength(1);
    expect(tabbable[0]).toHaveAccessibleName(/2 — Insuficiente/);
  });
});
