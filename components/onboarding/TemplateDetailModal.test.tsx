import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const del = vi.fn().mockResolvedValue({ message: 'Tarefa removida' });
vi.mock('@/lib/apiClient', () => ({
  apiClient: { delete: (...a: unknown[]) => del(...a) },
}));

let detailResult: { data: unknown; isLoading: boolean; error: unknown } = {
  data: undefined,
  isLoading: false,
  error: null,
};

vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: () => detailResult,
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

const confirmFn = vi.fn();
vi.mock('@/providers/ConfirmProvider', () => ({ useConfirm: () => confirmFn }));

const toast = vi.fn();
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => toast }));

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

// Stubs — os formulários têm cobertura própria.
vi.mock('./TemplateTaskFormModal', () => ({
  TemplateTaskFormModal: () => <div>stub-task-form</div>,
}));
vi.mock('./TemplateFormModal', () => ({
  TemplateFormModal: () => <div>stub-template-form</div>,
}));

import { TemplateDetailModal } from './TemplateDetailModal';

const baseDetail = {
  id: 3,
  name: 'Onboarding Colaborador TI',
  description: 'Plano de 30 dias',
  active: true,
  durationDays: 30,
  welcomeVideoUrl: null,
  positionId: null,
  departmentId: null,
  _count: { plans: 0 },
  tasks: [
    {
      id: 1,
      templateId: 3,
      title: 'Entregar documentos',
      description: null,
      category: 'DOCUMENTS',
      type: 'TASK',
      phase: 'DAY_1',
      responsible: 'HR',
      dueDayOffset: 5,
      xpReward: 10,
      requiresApproval: true,
      requiresEvidence: false,
      seq: 0,
    },
  ],
};

function renderModal(
  props: Partial<React.ComponentProps<typeof TemplateDetailModal>> = {},
) {
  return render(
    <TemplateDetailModal
      templateId={3}
      canManage
      onClose={vi.fn()}
      {...props}
    />,
  );
}

beforeEach(() => {
  del.mockClear().mockResolvedValue({ message: 'Tarefa removida' });
  toast.mockClear();
  confirmFn.mockReset().mockResolvedValue(true);
  detailResult = { data: baseDetail, isLoading: false, error: null };
});

describe('TemplateDetailModal', () => {
  test('lista a tarefa com fase e categoria legíveis', () => {
    renderModal();
    expect(screen.getByText('Entregar documentos')).toBeInTheDocument();
    expect(screen.getByText('Dia 1')).toBeInTheDocument();
    expect(screen.getByText('Documentos')).toBeInTheDocument();
  });

  test('sem canManage não mostra acções de gestão', () => {
    renderModal({ canManage: false });
    expect(
      screen.queryByRole('button', { name: 'Adicionar tarefa' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Editar tarefa' }),
    ).not.toBeInTheDocument();
  });

  test('"Adicionar tarefa" abre o formulário', () => {
    renderModal();
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Adicionar tarefa' })[0],
    );
    expect(screen.getByText('stub-task-form')).toBeInTheDocument();
  });

  test('remover uma tarefa confirma e envia DELETE', async () => {
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Remover tarefa' }));

    await waitFor(() => expect(del).toHaveBeenCalledTimes(1));
    expect(del).toHaveBeenCalledWith('/onboarding/templates/tasks/1');
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ intent: 'success' }),
    );
  });

  test('cancelar a confirmação não envia DELETE', async () => {
    confirmFn.mockResolvedValue(false);
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Remover tarefa' }));

    await Promise.resolve();
    expect(del).not.toHaveBeenCalled();
  });

  test('erro ao carregar mostra mensagem', () => {
    detailResult = { data: undefined, isLoading: false, error: new Error('x') };
    renderModal();
    expect(
      screen.getByText('Não foi possível carregar o template.'),
    ).toBeInTheDocument();
  });
});

describe('TemplateDetailModal — editar / apagar template', () => {
  test('sem canManage não mostra "Editar" nem "Apagar template"', () => {
    renderModal({ canManage: false });
    expect(
      screen.queryByRole('button', { name: 'Editar' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Apagar template' }),
    ).not.toBeInTheDocument();
  });

  test('"Editar" abre o formulário do template', () => {
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    expect(screen.getByText('stub-template-form')).toBeInTheDocument();
  });

  test('"Apagar template" confirma e envia DELETE /onboarding/templates/:id', async () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    fireEvent.click(screen.getByRole('button', { name: 'Apagar template' }));

    await waitFor(() => expect(del).toHaveBeenCalledTimes(1));
    expect(del).toHaveBeenCalledWith('/onboarding/templates/3');
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ intent: 'success' }),
    );
  });

  test('com planos associados "Apagar template" fica desactivado e mostra aviso', () => {
    detailResult = {
      data: { ...baseDetail, _count: { plans: 4 } },
      isLoading: false,
      error: null,
    };
    renderModal();
    expect(
      screen.getByRole('button', { name: 'Apagar template' }),
    ).toBeDisabled();
    expect(screen.getByText(/4 planos associados/)).toBeInTheDocument();
  });
});
