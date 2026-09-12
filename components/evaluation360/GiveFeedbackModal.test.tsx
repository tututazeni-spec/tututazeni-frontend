import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const notify = vi.fn();
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => notify }));

const post = vi.fn().mockResolvedValue({ id: 'fb-1' });
vi.mock('@/lib/apiClient', () => ({
  apiClient: { post: (...a: unknown[]) => post(...a) },
}));

vi.mock('@/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ data: { id: 1, department: { id: 5, name: 'Engenharia' } } }),
}));

vi.mock('@/hooks/useApiQuery', () => ({
  // Distingue as duas queries (colegas do directório vs. banco de
  // competências) pelo path — a mesma forma que o hook real usa.
  useApiQuery: (_key: unknown, path: string) => {
    if (path === '/users/directory') {
      return {
        data: [
          { id: 1, fullName: 'Eu Mesmo' }, // filtrado pela própria modal
          { id: 7, fullName: 'Colega Um' },
        ],
        isLoading: false,
      };
    }
    return { data: [{ id: 1, name: 'Comunicação' }], isLoading: false };
  },
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

vi.mock('@/components/ui/Select', () => ({
  // Select real é o Radix — aqui um <select> nativo interactivo para os
  // testes poderem escolher colega/tipo/competência.
  Select: ({
    items,
    value,
    onValueChange,
  }: {
    items: { value: string; label: string }[];
    value?: string;
    onValueChange?: (v: string) => void;
  }) => (
    <select
      data-testid="select"
      value={value ?? ''}
      onChange={(e) => onValueChange?.(e.target.value)}
    >
      <option value="" />
      {items.map((i) => (
        <option key={i.value} value={i.value}>
          {i.label}
        </option>
      ))}
    </select>
  ),
}));

import { GiveFeedbackModal } from './GiveFeedbackModal';

beforeEach(() => {
  notify.mockReset();
  post.mockClear();
});

describe('GiveFeedbackModal', () => {
  test('envia feedback real para o backend (POST /evaluation360/feedback/continuous)', async () => {
    const onClose = vi.fn();
    render(<GiveFeedbackModal onClose={onClose} />);

    const [colleagueSelect] = screen.getAllByTestId('select');
    fireEvent.change(colleagueSelect, { target: { value: '7' } });
    fireEvent.change(screen.getByLabelText('Mensagem *'), {
      target: { value: 'Excelente trabalho na apresentação.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar Feedback' }));

    expect(post).toHaveBeenCalledWith('/evaluation360/feedback/continuous', {
      tenantId: 'default',
      toUserId: '7',
      type: 'RECOGNITION',
      message: 'Excelente trabalho na apresentação.',
      competencyId: undefined,
    });
  });

  test('a própria pessoa autenticada não aparece na lista de colegas', () => {
    render(<GiveFeedbackModal onClose={vi.fn()} />);
    const [colleagueSelect] = screen.getAllByTestId('select');
    expect(colleagueSelect).not.toHaveTextContent('Eu Mesmo');
    expect(colleagueSelect).toHaveTextContent('Colega Um');
  });

  test('sem colega escolhido mantém o botão desactivado mesmo com mensagem válida', () => {
    render(<GiveFeedbackModal onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Mensagem *'), {
      target: { value: 'Excelente trabalho na apresentação.' },
    });
    expect(screen.getByRole('button', { name: 'Enviar Feedback' })).toBeDisabled();
  });

  test('mensagem demasiado curta mantém o botão desactivado', () => {
    render(<GiveFeedbackModal onClose={vi.fn()} />);
    const [colleagueSelect] = screen.getAllByTestId('select');
    fireEvent.change(colleagueSelect, { target: { value: '7' } });
    expect(screen.getByRole('button', { name: 'Enviar Feedback' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Mensagem *'), {
      target: { value: 'ok' },
    });
    expect(screen.getByRole('button', { name: 'Enviar Feedback' })).toBeDisabled();
  });
});
