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

// Select nativo — sem `id` (o componente real do Radix Select não expõe um
// para o Trigger), por isso os testes indexam por ordem de aparição no DOM
// em vez de getByLabelText para estes campos. Ordem por omissão (sem
// condições, sem canal email, sem agendamento semanal): gatilho(0),
// entidade(1), categoria(2), tipo de ação(3), canal(4), frequência(5),
// estado(6), ambiente(7).
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

const fillName = (value: string) =>
  fireEvent.change(screen.getByLabelText('Nome da regra *'), { target: { value } });
const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Criar regra' }));

describe('CreateRuleModal', () => {
  test('payload mínimo — nome trim + defaults de gatilho/acção/canal/ambiente/estado', async () => {
    render(<CreateRuleModal onClose={vi.fn()} />);
    fillName('  Notificar RH  ');
    submit();

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith('/automation/rules', {
      name: 'Notificar RH',
      trigger: 'employee.created',
      action: 'send_notification',
      active: true,
      notifyOnError: true,
      priority: 0,
      channel: 'internal',
      environment: 'production',
    });
  });

  test('campos opcionais — descrição, categoria, entidade e prioridade', async () => {
    const { container } = render(<CreateRuleModal onClose={vi.fn()} />);
    fillName('Regra X');
    fireEvent.change(screen.getByLabelText('Descrição'), {
      target: { value: '  faz algo  ' },
    });
    fireEvent.change(screen.getByLabelText('Prioridade'), { target: { value: '5' } });

    const selects = container.querySelectorAll('select');
    fireEvent.change(selects[1], { target: { value: 'User' } }); // entidade
    fireEvent.change(selects[2], { target: { value: 'HR' } }); // categoria
    submit();

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith('/automation/rules', {
      name: 'Regra X',
      trigger: 'employee.created',
      action: 'send_notification',
      active: true,
      notifyOnError: true,
      priority: 5,
      description: 'faz algo',
      category: 'HR',
      entity: 'User',
      channel: 'internal',
      environment: 'production',
    });
  });

  test('estado "Inativa" desactiva a regra (active: false)', async () => {
    const { container } = render(<CreateRuleModal onClose={vi.fn()} />);
    fillName('Regra Inactiva');
    const selects = container.querySelectorAll('select');
    fireEvent.change(selects[6], { target: { value: 'INACTIVE' } }); // estado
    submit();

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith(
      '/automation/rules',
      expect.objectContaining({ active: false }),
    );
  });

  test('condições — linha field/operator/value entra em `conditions` com lógica AND por omissão', async () => {
    render(<CreateRuleModal onClose={vi.fn()} />);
    fillName('Regra com condição');
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar condição' }));
    fireEvent.change(screen.getByLabelText('Campo da condição'), {
      target: { value: 'departmentId' },
    });
    fireEvent.change(screen.getByLabelText('Valor da condição'), {
      target: { value: '3' },
    });
    submit();

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith(
      '/automation/rules',
      expect.objectContaining({
        conditions: [{ field: 'departmentId', operator: 'equals', value: '3' }],
        conditionsLogic: 'AND',
      }),
    );
  });

  test('linha de condição sem campo preenchido é ignorada na submissão', async () => {
    render(<CreateRuleModal onClose={vi.fn()} />);
    fillName('Regra sem condição válida');
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar condição' }));
    submit();

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const body = post.mock.calls[0][1] as Record<string, unknown>;
    expect(body.conditions).toBeUndefined();
  });

  test('dados dinâmicos com JSON inválido bloqueia a submissão', async () => {
    render(<CreateRuleModal onClose={vi.fn()} />);
    fillName('Regra com JSON inválido');
    fireEvent.change(screen.getByLabelText('Dados dinâmicos'), {
      target: { value: '{not valid json' },
    });
    submit();

    expect(await screen.findByText('JSON inválido')).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  test('sem nome — botão desactivado, não submete', () => {
    render(<CreateRuleModal onClose={vi.fn()} />);
    submit();
    expect(post).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Criar regra' })).toBeDisabled();
  });

  test('erro da API — mostra mensagem', async () => {
    post.mockRejectedValueOnce(new Error('Boom'));
    render(<CreateRuleModal onClose={vi.fn()} />);
    fillName('Regra Y');
    submit();

    await waitFor(() => expect(screen.getByText('Boom')).toBeInTheDocument());
  });
});
