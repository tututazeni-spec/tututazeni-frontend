import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const post = vi.fn().mockResolvedValue({ id: 1 });
const put = vi.fn().mockResolvedValue({ id: 9 });
vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    post: (...a: unknown[]) => post(...a),
    put: (...a: unknown[]) => put(...a),
  },
}));

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

// <select> nativo por cada Select da fundação; a ordem no DOM é
// categoria, tipo, fase, responsável.
vi.mock('@/components/ui/Select', () => ({
  Select: ({
    items,
    value,
    onValueChange,
  }: {
    items: { value: string; label: string }[];
    value?: string;
    onValueChange: (v: string) => void;
  }) => (
    <select
      data-testid="select"
      value={value ?? ''}
      onChange={(e) => onValueChange(e.target.value)}
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

import { TemplateTaskFormModal } from './TemplateTaskFormModal';
import type { TemplateTask } from './types';

const existing: TemplateTask = {
  id: 9,
  templateId: 3,
  title: 'Configurar acessos',
  description: 'VPN e email',
  category: 'IT_ACCESS',
  type: 'PROCESS',
  phase: 'DAY_1',
  responsible: 'IT',
  dueDayOffset: 2,
  xpReward: 20,
  requiresApproval: true,
  requiresEvidence: false,
  seq: 1,
};

function renderModal(
  props: Partial<React.ComponentProps<typeof TemplateTaskFormModal>> = {},
) {
  return render(
    <TemplateTaskFormModal
      templateId={3}
      task={null}
      defaultPhase="DAY_1"
      nextSeq={5}
      onClose={vi.fn()}
      onSuccess={vi.fn()}
      {...props}
    />,
  );
}

beforeEach(() => {
  post.mockClear().mockResolvedValue({ id: 1 });
  put.mockClear().mockResolvedValue({ id: 9 });
});

describe('TemplateTaskFormModal — criar', () => {
  test('sem título o botão "Adicionar" está desactivado', () => {
    renderModal();
    expect(screen.getByRole('button', { name: 'Adicionar' })).toBeDisabled();
  });

  test('payload mínimo — título trim, defaults, templateId e seq', async () => {
    renderModal();
    fireEvent.change(screen.getByLabelText('Título *'), {
      target: { value: '  Entregar documentos  ' },
    });
    // categoria = primeiro <select>
    fireEvent.change(screen.getAllByTestId('select')[0], {
      target: { value: 'DOCUMENTS' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith('/onboarding/templates/tasks', {
      title: 'Entregar documentos',
      description: '',
      category: 'DOCUMENTS',
      type: 'TASK',
      phase: 'DAY_1',
      responsible: 'SELF',
      xpReward: 10,
      requiresApproval: false,
      requiresEvidence: false,
      dueDayOffset: null,
      templateId: 3,
      seq: 5,
    });
    expect(put).not.toHaveBeenCalled();
  });

  test('campos opcionais — fase, dia limite, XP e toggles', async () => {
    renderModal();
    fireEvent.change(screen.getByLabelText('Título *'), {
      target: { value: 'Formação inicial' },
    });
    const selects = screen.getAllByTestId('select');
    fireEvent.change(selects[0], { target: { value: 'TRAINING' } });
    fireEvent.change(selects[2], { target: { value: 'WEEK_1' } });
    fireEvent.change(selects[3], { target: { value: 'MANAGER' } });
    fireEvent.change(screen.getByLabelText('Dia limite'), {
      target: { value: '7' },
    });
    fireEvent.change(screen.getByLabelText('XP ao concluir *'), {
      target: { value: '25' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Requer aprovação' }));
    fireEvent.click(screen.getByRole('button', { name: 'Requer evidência' }));
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith('/onboarding/templates/tasks', {
      title: 'Formação inicial',
      description: '',
      category: 'TRAINING',
      type: 'TASK',
      phase: 'WEEK_1',
      responsible: 'MANAGER',
      xpReward: 25,
      requiresApproval: true,
      requiresEvidence: true,
      dueDayOffset: 7,
      templateId: 3,
      seq: 5,
    });
  });

  test('erro da API é mostrado', async () => {
    post.mockRejectedValueOnce(new Error('Boom'));
    renderModal();
    fireEvent.change(screen.getByLabelText('Título *'), {
      target: { value: 'X' },
    });
    fireEvent.change(screen.getAllByTestId('select')[0], {
      target: { value: 'ADMIN' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));

    expect(await screen.findByText('Boom')).toBeInTheDocument();
  });
});

describe('TemplateTaskFormModal — editar', () => {
  test('pré-preenche os campos e envia PUT sem templateId/seq', async () => {
    renderModal({ task: existing });
    expect(screen.getByLabelText('Título *')).toHaveValue('Configurar acessos');

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    expect(put).toHaveBeenCalledWith('/onboarding/templates/tasks/9', {
      title: 'Configurar acessos',
      description: 'VPN e email',
      category: 'IT_ACCESS',
      type: 'PROCESS',
      phase: 'DAY_1',
      responsible: 'IT',
      xpReward: 20,
      requiresApproval: true,
      requiresEvidence: false,
      dueDayOffset: 2,
    });
    expect(post).not.toHaveBeenCalled();
  });
});
