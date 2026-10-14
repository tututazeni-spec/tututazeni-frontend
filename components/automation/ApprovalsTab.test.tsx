import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ApprovalsTab } from './ApprovalsTab';

const post = vi.fn().mockResolvedValue({});

vi.mock('@/lib/apiClient', () => ({
  apiClient: { post: (...a: unknown[]) => post(...a), get: vi.fn() },
}));

const task = {
  id: 't1',
  kind: 'APPROVAL',
  title: 'Aprovar publicação do curso',
  description: null,
  automation: { id: 1, name: 'Fluxo de cursos' },
  module: 'courses',
  record: null,
  approver: { id: 7, name: 'Ana Silva' },
  substitute: null,
  escalation: null,
  priority: 'HIGH',
  status: 'PENDING',
  createdAt: '2026-10-01T10:00:00.000Z',
  dueAt: '2026-10-02T10:00:00.000Z',
  overdue: true,
  decidedBy: null,
};

vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: (_key: unknown, url: string) => {
    if (url === '/automation/tasks')
      return { data: { data: [task] }, isLoading: false };
    if (url === '/automation/tasks/summary')
      return {
        data: {
          pending: 3,
          overdue: 1,
          decidedLast30Days: 9,
          deadline: { onTime: 6, late: 2, onTimeRate: 75 },
        },
        isLoading: false,
      };
    return {
      data: { ...task, history: [], execution: null, canDecide: true },
      isLoading: false,
    };
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

vi.mock('@/providers/ToastProvider', () => ({ useToast: () => vi.fn() }));
vi.mock('@/components/processes/UserPicker', () => ({
  UserPicker: () => <div />,
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
  Select: () => <select />,
}));

describe('ApprovalsTab', () => {
  beforeEach(() => post.mockClear());

  test('mostra o resumo e a lista de pedidos', () => {
    render(<ApprovalsTab />);
    expect(screen.getByText('75%')).toBeTruthy();
    expect(screen.getAllByText('Aprovar publicação do curso').length).toBe(1);
    expect(screen.getByText(/· em atraso/)).toBeTruthy();
  });

  test('recusar exige justificação e não chama a API', () => {
    render(<ApprovalsTab />);
    fireEvent.click(screen.getByText('Aprovar publicação do curso'));
    fireEvent.click(screen.getByRole('button', { name: /Recusar/ }));
    expect(screen.getByRole('alert').textContent).toMatch(/justificação/);
    expect(post).not.toHaveBeenCalled();
  });

  test('aprovar envia a decisão', async () => {
    render(<ApprovalsTab />);
    fireEvent.click(screen.getByText('Aprovar publicação do curso'));
    fireEvent.click(screen.getByRole('button', { name: /^Aprovar$/ }));
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/automation/tasks/t1/decide', {
        decision: 'APPROVE',
      }),
    );
  });
});
