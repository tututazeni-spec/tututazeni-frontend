import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const post = vi.fn().mockResolvedValue({ id: 42 });
const put = vi.fn().mockResolvedValue({});

vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    post: (...a: unknown[]) => post(...a),
    put: (...a: unknown[]) => put(...a),
    get: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock('@/components/ui/Modal', () => ({
  Modal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ModalContent: ({
    title,
    description,
    children,
  }: {
    title: string;
    description?: string;
    children: React.ReactNode;
  }) => (
    <div>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/Select', () => ({
  Select: ({
    items,
    value,
    onValueChange,
    placeholder,
  }: {
    items: Array<{ value: string; label: string }>;
    value?: string;
    onValueChange?: (v: string) => void;
    placeholder?: string;
  }) => (
    <select
      aria-label={placeholder}
      value={value ?? ''}
      onChange={(e) => onValueChange?.(e.target.value)}
    >
      <option value="" />
      {items.map((it) => (
        <option key={it.value} value={it.value}>
          {it.label}
        </option>
      ))}
    </select>
  ),
}));

vi.mock('@/providers/ToastProvider', () => ({ useToast: () => vi.fn() }));

// ProgramsView deps (para o teste de visibilidade do gatilho).
const currentUserRole = { value: 'GESTOR' };
vi.mock('@/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ data: { role: { name: currentUserRole.value } } }),
}));
vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: () => ({ data: { data: [] }, isLoading: false }),
  useApiMutation: (fn: (v: unknown) => Promise<unknown>) => ({
    mutate: (v: unknown) => fn(v),
    isPending: false,
  }),
}));

import { ProgramWizard } from './ProgramWizard';
import { ProgramsView } from './ProgramsView';

beforeEach(() => {
  post.mockReset().mockResolvedValue({ id: 42 });
  put.mockReset().mockResolvedValue({});
  currentUserRole.value = 'GESTOR';
});

describe('ProgramsView — visibilidade do gatilho de criação', () => {
  test('um dos 6 papéis de gestão vê "Criar programa"', () => {
    currentUserRole.value = 'GESTOR';
    render(<ProgramsView />);
    expect(screen.getByRole('button', { name: /criar programa/i })).toBeInTheDocument();
  });

  test('COLABORADOR não vê "Criar programa"', () => {
    currentUserRole.value = 'COLABORADOR';
    render(<ProgramsView />);
    expect(screen.queryByRole('button', { name: /criar programa/i })).toBeNull();
  });
});

describe('ProgramWizard — bloqueio de etapa inválida', () => {
  test('"Continuar" fica bloqueado até código + nome + nível estarem preenchidos', () => {
    render(<ProgramWizard onClose={vi.fn()} onSuccess={vi.fn()} />);
    const next = screen.getByRole('button', { name: 'Continuar' });
    expect(next).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Código *'), { target: { value: 'LDR-1' } });
    fireEvent.change(screen.getByLabelText('Nome do programa *'), {
      target: { value: 'Programa X' },
    });
    expect(next).toBeDisabled(); // ainda sem nível

    fireEvent.change(screen.getByLabelText('Selecionar nível'), {
      target: { value: 'INITIAL' },
    });
    expect(next).toBeEnabled();
  });

  test('avançar a 1ª etapa cria o programa em DRAFT via POST', async () => {
    render(<ProgramWizard onClose={vi.fn()} onSuccess={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Código *'), { target: { value: 'LDR-9' } });
    fireEvent.change(screen.getByLabelText('Nome do programa *'), {
      target: { value: 'Líderes 2026' },
    });
    fireEvent.change(screen.getByLabelText('Selecionar nível'), {
      target: { value: 'ADVANCED' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith('/leadership/programs', {
      code: 'LDR-9',
      name: 'Líderes 2026',
      level: 'ADVANCED',
      description: undefined,
    });
  });
});
