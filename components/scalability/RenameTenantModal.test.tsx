import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const notify = vi.fn();

vi.mock('@/providers/ToastProvider', () => ({
  useToast: () => notify,
}));

vi.mock('@/components/ui/Modal', () => ({
  Modal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ModalContent: ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  ),
}));

import { RenameTenantModal } from './RenameTenantModal';

beforeEach(() => notify.mockReset());

describe('RenameTenantModal', () => {
  test('guarda o novo nome (trim) e fecha', () => {
    const onRename = vi.fn();
    const onClose = vi.fn();
    render(
      <RenameTenantModal
        currentName="Sonangol EP"
        onRename={onRename}
        onClose={onClose}
      />,
    );

    fireEvent.change(screen.getByLabelText('Nome da empresa *'), {
      target: { value: '  Sonangol Holding  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(onRename).toHaveBeenCalledWith('Sonangol Holding');
    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({ intent: 'success' }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('botão desactivado quando o nome está vazio', () => {
    render(
      <RenameTenantModal
        currentName="Sonangol EP"
        onRename={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText('Nome da empresa *'), {
      target: { value: '   ' },
    });
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled();
  });

  test('botão desactivado quando o nome não muda', () => {
    render(
      <RenameTenantModal
        currentName="Sonangol EP"
        onRename={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled();
  });
});
