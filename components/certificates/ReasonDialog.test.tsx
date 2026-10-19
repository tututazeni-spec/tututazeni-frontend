import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ReasonDialog } from './ReasonDialog';

function setup(props: Partial<Parameters<typeof ReasonDialog>[0]> = {}) {
  const onConfirm = vi.fn();
  const onClose = vi.fn();
  render(
    <ReasonDialog
      title="Revogar certificado"
      confirmLabel="Revogar"
      onConfirm={onConfirm}
      onClose={onClose}
      {...props}
    />,
  );
  return { onConfirm, onClose };
}

const type = (value: string) =>
  fireEvent.change(screen.getByLabelText('Motivo'), { target: { value } });

describe('ReasonDialog', () => {
  test('motivo com 2 caracteres não confirma e explica porquê', () => {
    const { onConfirm } = setup();
    type('ab');
    fireEvent.click(screen.getByRole('button', { name: 'Revogar' }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByText(/pelo menos 3 caracteres/)).toBeInTheDocument();
  });

  test('motivo com 3 caracteres confirma com o texto limpo', () => {
    const { onConfirm } = setup();
    type('  abc  ');
    fireEvent.click(screen.getByRole('button', { name: 'Revogar' }));
    expect(onConfirm).toHaveBeenCalledWith('abc');
  });

  test('mostra o erro devolvido pelo servidor', () => {
    setup({ error: 'O certificado já está revogado' });
    expect(
      screen.getByText('O certificado já está revogado'),
    ).toBeInTheDocument();
  });

  test('Cancelar fecha sem confirmar', () => {
    const { onConfirm, onClose } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onClose).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
