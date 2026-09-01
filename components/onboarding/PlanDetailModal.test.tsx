import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const del = vi.fn().mockResolvedValue({ message: 'ok' });
const post = vi.fn().mockResolvedValue({ ok: true });
const patch = vi.fn().mockResolvedValue({ ok: true });
vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    delete: (...a: unknown[]) => del(...a),
    post: (...a: unknown[]) => post(...a),
    patch: (...a: unknown[]) => patch(...a),
  },
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

import { PlanDetailModal } from './PlanDetailModal';

function templateTask(over: Record<string, unknown> = {}) {
  return {
    id: 1,
    templateId: 3,
    title: 'Tarefa',
    description: null,
    category: 'DOCUMENTS',
    type: 'TASK',
    phase: 'DAY_1',
    responsible: 'HR',
    dueDayOffset: 1,
    xpReward: 10,
    requiresApproval: false,
    requiresEvidence: false,
    seq: 0,
    ...over,
  };
}
function instance(over: Record<string, unknown> = {}) {
  return {
    id: 11,
    status: 'COMPLETED',
    dueDate: '2026-08-02T00:00:00.000Z',
    completedAt: '2026-08-02T00:00:00.000Z',
    evidenceComment: null,
    evidenceUrl: null,
    skipReason: null,
    approvedBy: null,
    approvalNote: null,
    templateTask: templateTask(),
    ...over,
  };
}

const baseDetail = {
  id: 7,
  status: 'IN_PROGRESS',
  startDate: '2026-08-01T00:00:00.000Z',
  expectedEndDate: '2026-08-31T00:00:00.000Z',
  completedAt: null,
  xpEarned: 30,
  progress: 40,
  completedTasks: 2,
  totalTasks: 5,
  user: {
    id: 1,
    fullName: 'Ana Silva',
    email: 'ana@innova.com',
    avatarUrl: null,
    department: { name: 'TI' },
    position: { name: 'Programadora' },
  },
  template: {
    id: 3,
    name: 'Onboarding TI',
    durationDays: 30,
    welcomeVideoUrl: null,
  },
  buddy: null,
  manager: null,
  hrResponsible: null,
  documents: [
    {
      id: 5,
      documentType: 'Cópia do BI',
      fileUrl: 'https://drive.example/bi',
      status: 'PENDING',
      notes: null,
      rejectionReason: null,
      createdAt: '2026-08-03T00:00:00.000Z',
    },
  ],
  surveys: [],
  byPhase: {
    DAY_1: [
      instance({
        id: 11,
        templateTask: templateTask({ title: 'Entregar documentos' }),
      }),
      instance({
        id: 21,
        status: 'IN_PROGRESS',
        completedAt: null,
        templateTask: templateTask({
          id: 2,
          title: 'Ler código de conduta',
          requiresApproval: true,
        }),
      }),
    ],
  },
};

function renderModal(
  props: Partial<React.ComponentProps<typeof PlanDetailModal>> = {},
) {
  return render(
    <PlanDetailModal
      planId={7}
      canManagePlan
      canManageTasks
      onClose={vi.fn()}
      {...props}
    />,
  );
}

beforeEach(() => {
  del.mockClear().mockResolvedValue({ message: 'ok' });
  post.mockClear().mockResolvedValue({ ok: true });
  patch.mockClear().mockResolvedValue({ ok: true });
  toast.mockClear();
  confirmFn.mockReset().mockResolvedValue(true);
  detailResult = { data: baseDetail, isLoading: false, error: null };
});

describe('PlanDetailModal — leitura e remoção', () => {
  test('mostra colaborador, template e tarefa por fase', () => {
    renderModal();
    expect(screen.getAllByText('Ana Silva').length).toBeGreaterThan(0);
    expect(screen.getByText('Onboarding TI')).toBeInTheDocument();
    expect(screen.getByText('Dia 1')).toBeInTheDocument();
    expect(screen.getByText('Entregar documentos')).toBeInTheDocument();
  });

  test('sem canManagePlan não mostra "Remover plano"', () => {
    renderModal({ canManagePlan: false });
    expect(
      screen.queryByRole('button', { name: 'Remover plano' }),
    ).not.toBeInTheDocument();
  });

  test('remover confirma e envia DELETE /onboarding/:id', async () => {
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Remover plano' }));

    await waitFor(() => expect(del).toHaveBeenCalledTimes(1));
    expect(del).toHaveBeenCalledWith('/onboarding/7');
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ intent: 'success' }),
    );
  });

  test('cancelar a confirmação não envia DELETE', async () => {
    confirmFn.mockResolvedValue(false);
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Remover plano' }));
    await Promise.resolve();
    expect(del).not.toHaveBeenCalled();
  });

  test('erro ao carregar mostra mensagem', () => {
    detailResult = { data: undefined, isLoading: false, error: new Error('x') };
    renderModal();
    expect(
      screen.getByText('Não foi possível carregar o plano.'),
    ).toBeInTheDocument();
  });

  test('membro da equipa com email → link mailto', () => {
    detailResult = {
      data: {
        ...baseDetail,
        manager: {
          id: 9,
          fullName: 'Rui Costa',
          email: 'rui@innova.com',
          avatarUrl: null,
        },
      },
      isLoading: false,
      error: null,
    };
    renderModal();
    const link = screen.getByRole('link', { name: 'Enviar mensagem' });
    expect(link).toHaveAttribute(
      'href',
      'mailto:rui@innova.com?subject=Onboarding%20%E2%80%94%20Ana%20Silva',
    );
  });

  test('membro da equipa sem email → sem link', () => {
    detailResult = {
      data: {
        ...baseDetail,
        manager: { id: 9, fullName: 'Rui Costa', avatarUrl: null },
      },
      isLoading: false,
      error: null,
    };
    renderModal();
    expect(
      screen.queryByRole('link', { name: 'Enviar mensagem' }),
    ).not.toBeInTheDocument();
  });
});

describe('PlanDetailModal — aprovar / rejeitar / saltar', () => {
  test('sem canManageTasks não mostra acções por tarefa', () => {
    renderModal({ canManageTasks: false });
    expect(
      screen.queryByRole('button', { name: 'Aprovar' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Saltar' }),
    ).not.toBeInTheDocument();
  });

  test('"Aprovar" envia POST /onboarding/tasks/approve decision=approve', async () => {
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Aprovar' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith('/onboarding/tasks/approve', {
      taskInstanceId: 21,
      decision: 'approve',
    });
  });

  test('"Saltar" exige motivo e envia POST /onboarding/tasks/skip', async () => {
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Saltar' }));

    const confirmBtn = screen.getByRole('button', { name: 'Saltar tarefa' });
    expect(confirmBtn).toBeDisabled();

    fireEvent.change(
      screen.getByPlaceholderText(/Motivo para saltar a tarefa/),
      { target: { value: '  Não aplicável ao cargo  ' } },
    );
    expect(confirmBtn).toBeEnabled();
    fireEvent.click(confirmBtn);

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith('/onboarding/tasks/skip', {
      taskInstanceId: 21,
      reason: 'Não aplicável ao cargo',
    });
  });

  test('"Rejeitar" envia decision=reject (comentário opcional)', async () => {
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Rejeitar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Rejeitar tarefa' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith('/onboarding/tasks/approve', {
      taskInstanceId: 21,
      decision: 'reject',
    });
  });
});

describe('PlanDetailModal — validação de documentos', () => {
  test('mostra o documento com link e estado', () => {
    renderModal();
    expect(screen.getByText('Cópia do BI')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Abrir documento' }),
    ).toHaveAttribute('href', 'https://drive.example/bi');
  });

  test('sem canManagePlan não mostra acções de documento', () => {
    renderModal({ canManagePlan: false });
    expect(
      screen.queryByRole('button', { name: 'Aprovar documento' }),
    ).not.toBeInTheDocument();
  });

  test('"Aprovar documento" envia PATCH status=APPROVED', async () => {
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Aprovar documento' }));

    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(patch).toHaveBeenCalledWith('/onboarding/documents/validate', {
      documentId: 5,
      status: 'APPROVED',
    });
  });

  test('"Rejeitar documento" abre painel e envia PATCH status=REJECTED', async () => {
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Rejeitar documento' }));
    fireEvent.change(screen.getByPlaceholderText(/Motivo da rejeição/), {
      target: { value: '  Ilegível  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar rejeição' }));

    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(patch).toHaveBeenCalledWith('/onboarding/documents/validate', {
      documentId: 5,
      status: 'REJECTED',
      rejectionReason: 'Ilegível',
    });
  });
});
