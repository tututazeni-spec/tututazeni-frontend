import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const post = vi.fn().mockResolvedValue({ id: 1 });

vi.mock('@/lib/apiClient', () => ({
  apiClient: { post: (...a: unknown[]) => post(...a) },
}));

// useApiMutation: executa `fn` e encaminha para onSuccess/onError, como
// CreateLiveClassModal.test.tsx fazia antes deste componente a substituir.
// useApiQuery: só '/courses' devolve dados (picker de curso); os restantes
// pickers (formadores/departamentos/unidades/cargos/módulos) ficam vazios —
// não são obrigatórios para submeter.
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
  useApiQuery: (_key: unknown, path: string) => {
    if (path === '/courses') return { data: { data: [{ id: 7, title: 'Curso 7' }] }, isLoading: false };
    return { data: undefined, isLoading: false };
  },
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

vi.mock('@/components/ui/Combobox', () => ({
  Combobox: ({
    items,
    onValueChange,
    placeholder,
  }: {
    items: Array<{ value: string; label: string }>;
    onValueChange: (v: string) => void;
    placeholder?: string;
  }) => (
    <button type="button" onClick={() => onValueChange(items[0]?.value ?? '')}>
      stub-pick:{placeholder}
    </button>
  ),
}));

vi.mock('@/providers/ToastProvider', () => ({ useToast: () => vi.fn() }));

// O Select real é um Radix Select (sem <select> nativo) — não interagível
// via fireEvent.change em jsdom. Stub como <select> nativo, suficiente para
// os testes deste ficheiro (só mudamos o valor, nunca abrimos o popover).
vi.mock('@/components/ui/Select', () => ({
  Select: ({
    items,
    value,
    onValueChange,
  }: {
    items: Array<{ value: string; label: string }>;
    value?: string;
    onValueChange?: (v: string) => void;
  }) => (
    <select value={value} onChange={(e) => onValueChange?.(e.target.value)}>
      {items.map((i) => (
        <option key={i.value} value={i.value}>
          {i.label}
        </option>
      ))}
    </select>
  ),
}));

import { CreateLiveClassWizard } from './CreateLiveClassWizard';

beforeEach(() => post.mockReset().mockResolvedValue({ id: 1 }));

function fillGeneralStep() {
  fireEvent.click(screen.getByRole('button', { name: 'stub-pick:Selecionar curso…' }));
  fireEvent.change(screen.getByLabelText('Título da aula *'), {
    target: { value: '  Introdução ao CRM  ' },
  });
}

function fillScheduleStep() {
  fireEvent.change(screen.getByLabelText('Data e hora de início *'), {
    target: { value: '2026-12-31T14:30' },
  });
  fireEvent.change(screen.getByLabelText('Duração (min) *'), { target: { value: '90' } });
}

/** Avança da etapa actual clicando "Continuar" (ou "Criar Aula" na última). */
function clickContinue() {
  const btn = screen.queryByRole('button', { name: 'Continuar' }) ?? screen.getByRole('button', { name: 'Criar Aula' });
  fireEvent.click(btn);
}

describe('CreateLiveClassWizard', () => {
  test('etapa 1 (Informações gerais) bloqueia "Continuar" sem curso/título', () => {
    render(<CreateLiveClassWizard onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled();
  });

  test('etapa 2 (Data e horário) bloqueia sem data/duração', () => {
    render(<CreateLiveClassWizard onClose={vi.fn()} />);
    fillGeneralStep();
    clickContinue();
    expect(screen.getByText('Etapa 2 de 9 — Data e horário')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled();
  });

  test('percorre as 9 etapas e submete o payload mínimo', async () => {
    render(<CreateLiveClassWizard onClose={vi.fn()} />);
    fillGeneralStep();
    clickContinue(); // → schedule
    fillScheduleStep();
    for (let i = 0; i < 8; i++) clickContinue(); // schedule → ... → notifications → submit

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const [url, body] = post.mock.calls[0] as [string, Record<string, unknown>];
    expect(url).toBe('/live-classes');
    expect(body).toMatchObject({
      courseId: 7,
      topic: 'Introdução ao CRM',
      scheduledAt: new Date('2026-12-31T14:30').toISOString(),
      duration: 90,
      type: 'AULA',
      recurrence: 'ONCE',
      modality: 'ONLINE',
      enrollmentMode: 'MANUAL',
      attendanceAutoRegister: true,
      recordSession: true,
      evaluationRequired: false,
    });
    expect(body.notifySettings).toMatchObject({ onEnroll: true, onCancel: true });
  });

  test('erro da API no submit final — mostra mensagem', async () => {
    post.mockRejectedValueOnce(new Error('Boom'));
    render(<CreateLiveClassWizard onClose={vi.fn()} />);
    fillGeneralStep();
    clickContinue();
    fillScheduleStep();
    for (let i = 0; i < 8; i++) clickContinue();

    await waitFor(() => expect(screen.getByText('Boom')).toBeInTheDocument());
  });

  test('recorrência != ONCE exige data final antes de continuar', () => {
    render(<CreateLiveClassWizard onClose={vi.fn()} />);
    fillGeneralStep();
    clickContinue();
    fillScheduleStep();
    // Único <select> visível na etapa "Data e horário" (Recorrência) — o
    // Select real é Radix (sem <select> nativo/htmlFor→id), por isso não dá
    // para usar getByLabelText aqui; ver mock de '@/components/ui/Select'.
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'WEEKLY' } });
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled();
  });
});
