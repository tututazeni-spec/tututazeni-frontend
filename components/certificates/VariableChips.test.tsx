import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { VariableChips } from './VariableChips';

describe('VariableChips', () => {
  test('insere a variável escolhida com as chavetas', () => {
    const onInsert = vi.fn();
    render(<VariableChips onInsert={onInsert} />);
    fireEvent.click(screen.getByRole('button', { name: /Nome completo/ }));
    expect(onInsert).toHaveBeenCalledWith('{{nome_completo}}');
  });

  test('mostra só as variáveis da lista fechada, com descrição em português', () => {
    render(<VariableChips onInsert={vi.fn()} />);
    for (const label of [
      'Nome do curso',
      'Carga horária',
      'Nota final',
      'Data de emissão',
      'Código do certificado',
    ]) {
      expect(
        screen.getByRole('button', { name: new RegExp(label) }),
      ).toBeInTheDocument();
    }
    expect(
      screen.queryByText(/nome_completo|nota_final/),
    ).not.toBeInTheDocument();
  });

  test('identifica os campos opcionais e explica que desaparecem sem valor', () => {
    render(<VariableChips onInsert={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: /Nota final \(opcional\)/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Nome completo$/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/desaparecem/i)).toBeInTheDocument();
  });
});
