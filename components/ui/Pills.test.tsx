import { describe, expect, test, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PeriodPills, ShortcutPills } from './Pills';

const OPTIONS = [
  { value: 7, label: '7 dias' },
  { value: 30, label: '30 dias' },
  { value: 90, label: '90 dias' },
];

describe('PeriodPills', () => {
  test('marca só a opção seleccionada', () => {
    render(<PeriodPills options={OPTIONS} value={30} onChange={vi.fn()} />);
    expect(screen.getByRole('tab', { name: '30 dias' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: '7 dias' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  test('chama onChange com o valor da opção clicada', () => {
    const onChange = vi.fn();
    render(<PeriodPills options={OPTIONS} value={30} onChange={onChange} />);
    fireEvent.click(screen.getByRole('tab', { name: '90 dias' }));
    expect(onChange).toHaveBeenCalledWith(90);
  });
});

describe('ShortcutPills', () => {
  test('cada atalho chama o seu onClick', () => {
    const a = vi.fn();
    const b = vi.fn();
    render(
      <ShortcutPills
        items={[
          { label: 'Pesquisar registos', onClick: a },
          { label: 'Gerar relatório', onClick: b },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Gerar relatório' }));
    expect(b).toHaveBeenCalledTimes(1);
    expect(a).not.toHaveBeenCalled();
  });
});
