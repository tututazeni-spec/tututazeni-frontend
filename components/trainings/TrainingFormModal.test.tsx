import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const post = vi.fn().mockResolvedValue({ id: 1 });
const put = vi.fn().mockResolvedValue({});
vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    post: (...a: unknown[]) => post(...a),
    put: (...a: unknown[]) => put(...a),
  },
}));

vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: () => ({ data: { data: [] } }),
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
  ModalContent: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  ),
}));

// Cada Select vira um <select> nativo — identificado pela posição de
// aparência (Tipo de formação é o 1º, Nível o 2º), já que ambos partilham o
// mesmo placeholder "Selecionar".
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
      data-testid="select-mock"
      value={value ?? ''}
      onChange={(e) => onValueChange(e.target.value)}
    >
      <option value="" disabled />
      {items.map((i) => (
        <option key={i.value} value={i.value}>
          {i.label}
        </option>
      ))}
    </select>
  ),
}));

vi.mock('@/components/ui/Combobox', () => ({
  Combobox: () => <div data-testid="combobox-mock" />,
}));

vi.mock('../courses/CourseImageField', () => ({
  CourseImageField: () => <div data-testid="image-field-mock" />,
}));

import { TrainingFormModal } from './TrainingFormModal';

beforeEach(() => {
  post.mockClear();
  put.mockClear();
});

function fillRequired() {
  fireEvent.change(screen.getByLabelText('Nome da formação *'), {
    target: { value: 'Formação Nova' },
  });
  const selects = screen.getAllByTestId('select-mock');
  fireEvent.change(selects[0], { target: { value: 'ONLINE' } }); // Tipo/Modalidade
  fireEvent.change(selects[1], { target: { value: 'BEGINNER' } }); // Nível
}

describe('TrainingFormModal — criação', () => {
  test('payload mínimo inclui title/type/level e arrays vazios de competências/co-instrutores', async () => {
    render(<TrainingFormModal training={null} onClose={vi.fn()} onSuccess={vi.fn()} />);
    fillRequired();
    fireEvent.click(screen.getByRole('button', { name: 'Criar Formação' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith('/trainings', {
      title: 'Formação Nova',
      type: 'ONLINE',
      level: 'BEGINNER',
      language: 'pt',
      passingScore: 70,
      mandatory: false,
      issueCertificate: false,
      requiresApproval: false,
      priority: 'MEDIUM',
      targetDeptIds: [],
      targetUnitIds: [],
      targetPositionIds: [],
      coInstructorIds: [],
      competencyIds: [],
    });
  });

  test('sem campos obrigatórios — não submete (validação)', () => {
    render(<TrainingFormModal training={null} onClose={vi.fn()} onSuccess={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Criar Formação' }));
    expect(post).not.toHaveBeenCalled();
  });

  test('código e etiquetas entram no payload quando preenchidos', async () => {
    render(<TrainingFormModal training={null} onClose={vi.fn()} onSuccess={vi.fn()} />);
    fillRequired();
    fireEvent.change(screen.getByLabelText('Código da formação'), {
      target: { value: 'FORM-9' },
    });
    fireEvent.change(screen.getByLabelText('Etiquetas (separadas por vírgula)'), {
      target: { value: 'liderança, gestão' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar Formação' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const payload = post.mock.calls[0][1];
    expect(payload.code).toBe('FORM-9');
    expect(payload.tags).toEqual(['liderança', 'gestão']);
  });
});

describe('TrainingFormModal — edição', () => {
  test('submete PUT /trainings/:id', async () => {
    const training = {
      id: 7,
      title: 'Formação Existente',
      type: 'PRESENTIAL',
      level: 'ADVANCED',
      requiredResources: [],
      coInstructors: [],
      competencies: [],
    } as never;

    render(<TrainingFormModal training={training} onClose={vi.fn()} onSuccess={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Guardar alterações' }));

    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    expect(put).toHaveBeenCalledWith(
      '/trainings/7',
      expect.objectContaining({ title: 'Formação Existente', type: 'PRESENTIAL', level: 'ADVANCED' }),
    );
  });
});
