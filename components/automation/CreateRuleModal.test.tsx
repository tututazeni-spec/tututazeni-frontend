import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const post = vi.fn().mockResolvedValue({ id: 1 });

vi.mock('@/lib/apiClient', () => ({
  apiClient: { post: (...a: unknown[]) => post(...a) },
}));

// useApiMutation: executa `fn` e encaminha para onSuccess/onError, como o
// mock de CreateLiveClassModal.test.tsx.
vi.mock('@/hooks/useApiQuery', () => ({
  useApiMutation: (
    fn: (v: unknown) => Promise<unknown>,
    opts: {
      onSuccess?: (d: unknown, v: unknown) => void;
      onError?: (e: Error) => void;
    },
  ) => ({
    mutate: (v: unknown) =>
      fn(v).then(
        (d) => opts?.onSuccess?.(d, v),
        (e) => opts?.onError?.(e as Error),
      ),
    isPending: false,
  }),
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

// Select nativo — os <select> aparecem por ordem: gatilho, acção, categoria.
vi.mock('@/components/ui/Select', () => ({
  Select: ({
    items,
    value,
    onValueChange,
  }: {
    items: Array<{ value: string; label: string }>;
    value: string;
    onValueChange: (v: string) => void;
  }) => (
    <select value={value} onChange={(e) => onValueChange(e.target.value)}>
      {items.map((it) => (
        <option key={it.value} value={it.value}>
          {it.label}
        </option>
      ))}
    </select>
  ),
}));

vi.mock('@/providers/ToastProvider', () => ({ useToast: () => vi.fn() }));

import { CreateRuleModal } from './CreateRuleModal';

beforeEach(() => post.mockReset().mockResolvedValue({ id: 1 }));

describe('CreateRuleModal', () => {
  test('payload mínimo — nome trim + gatilho/acção default + active true', async () => {
    render(<CreateRuleModal onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Nome *'), {
      target: { value: '  Notificar RH  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar regra' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith('/automation/rules', {
      name: 'Notificar RH',
      trigger: 'employee.created',
      action: 'send_notification',
      active: true,
    });
  });

  test('campos opcionais — descrição, categoria e active desligado', async () => {
    const { container } = render(<CreateRuleModal onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Nome *'), {
      target: { value: 'Regra X' },
    });
    fireEvent.change(screen.getByLabelText('Descrição'), {
      target: { value: '  faz algo  ' },
    });
    const selects = container.querySelectorAll('select');
    // selects[0] = gatilho, [1] = acção, [2] = categoria
    fireEvent.change(selects[2], { target: { value: 'HR' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Criar regra' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith('/automation/rules', {
      name: 'Regra X',
      trigger: 'employee.created',
      action: 'send_notification',
      active: false,
      description: 'faz algo',
      category: 'HR',
    });
  });

  test('sem nome — botão desactivado, não submete', () => {
    render(<CreateRuleModal onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Criar regra' }));
    expect(post).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Criar regra' })).toBeDisabled();
  });

  test('erro da API — mostra mensagem', async () => {
    post.mockRejectedValueOnce(new Error('Boom'));
    render(<CreateRuleModal onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Nome *'), {
      target: { value: 'Regra Y' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar regra' }));

    await waitFor(() => expect(screen.getByText('Boom')).toBeInTheDocument());
  });
});
