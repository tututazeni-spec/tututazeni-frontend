import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const post = vi.fn().mockResolvedValue({ id: 1 });

vi.mock('@/lib/apiClient', () => {
  // Mesma assinatura do ApiError real (status primeiro).
  class ApiError extends Error {
    constructor(
      public status: number,
      message: string,
    ) {
      super(message);
    }
  }
  return { apiClient: { post: (...a: unknown[]) => post(...a) }, ApiError };
});

vi.mock('@/hooks/useApiQuery', () => ({
  useApiMutation: (
    fn: (v: unknown) => Promise<unknown>,
    opts: {
      onSuccess?: (d: unknown, v: unknown) => void;
      onError?: (e: Error) => void;
    },
  ) => ({
    mutate: (v: unknown) =>
      Promise.resolve(fn(v)).then(
        (d) => opts?.onSuccess?.(d, v),
        (e) => opts?.onError?.(e as Error),
      ),
    isPending: false,
  }),
}));

const directoryUsers = [
  {
    id: 1,
    fullName: 'Ana Silva',
    avatarUrl: null,
    email: 'ana@innova.com',
    department: { name: 'TI' },
  },
];

vi.mock('./planData', () => ({
  useTemplateOptions: () => ({
    options: [{ value: '5', label: 'Onboarding TI' }],
    loading: false,
  }),
  useDirectoryUsers: () => ({ users: directoryUsers, loading: false }),
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

vi.mock('@/components/ui/Combobox', () => ({
  Combobox: ({
    items,
    onValueChange,
  }: {
    items: { value: string; label: string }[];
    onValueChange: (v: string) => void;
  }) => (
    <div>
      {items.map((it) => (
        <button
          key={it.value}
          type="button"
          onClick={() => onValueChange(it.value)}
        >
          tpl-{it.label}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('@/providers/ToastProvider', () => ({ useToast: () => vi.fn() }));

import { AssignPlanModal } from './AssignPlanModal';
import { ApiError } from '@/lib/apiClient';

beforeEach(() => post.mockReset().mockResolvedValue({ id: 1 }));

function pickUser() {
  fireEvent.change(
    screen.getByPlaceholderText('Pesquisar por nome ou email…'),
    {
      target: { value: 'Ana' },
    },
  );
  fireEvent.click(screen.getByText('Ana Silva'));
}

describe('AssignPlanModal', () => {
  test('sem colaborador o botão está desactivado', () => {
    render(<AssignPlanModal onClose={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: 'Atribuir plano' }),
    ).toBeDisabled();
  });

  test('colaborador + template → POST /onboarding', async () => {
    render(<AssignPlanModal onClose={vi.fn()} />);
    pickUser();
    fireEvent.click(screen.getByRole('button', { name: 'tpl-Onboarding TI' }));
    fireEvent.click(screen.getByRole('button', { name: 'Atribuir plano' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith('/onboarding', {
      userId: 1,
      templateId: 5,
    });
  });

  test('modo automático → POST /onboarding/auto-assign/:id sem template', async () => {
    render(<AssignPlanModal onClose={vi.fn()} />);
    pickUser();
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Escolher template automaticamente pelo cargo/departamento',
      }),
    );
    // o picker de template desaparece
    expect(
      screen.queryByRole('button', { name: 'tpl-Onboarding TI' }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Atribuir plano' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith('/onboarding/auto-assign/1', {});
  });

  test('409 mostra mensagem de plano activo', async () => {
    post.mockRejectedValueOnce(new ApiError(409, 'conflict'));
    render(<AssignPlanModal onClose={vi.fn()} />);
    pickUser();
    fireEvent.click(screen.getByRole('button', { name: 'tpl-Onboarding TI' }));
    fireEvent.click(screen.getByRole('button', { name: 'Atribuir plano' }));

    expect(
      await screen.findByText(
        'Este colaborador já tem um plano de integração activo.',
      ),
    ).toBeInTheDocument();
  });
});
