import { describe, expect, test, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/providers/ToastProvider', () => ({ useToast: () => vi.fn() }));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock('@/lib/apiClient', () => ({
  apiClient: { post: vi.fn(), patch: vi.fn() },
}));

vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: () => ({ data: undefined }),
}));

vi.mock('@/components/departments/departmentFormData', () => ({
  useDirectoryUsers: () => ({ users: [] }),
  useUnits: () => ({ units: [] }),
}));

vi.mock('@/components/departments/DepartmentUserPicker', () => ({
  DepartmentUserPicker: () => null,
}));

vi.mock('@/components/ui/Modal', () => ({
  Modal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ModalContent: ({
    description,
    children,
  }: {
    description?: string;
    children: React.ReactNode;
  }) => (
    <div>
      <p data-testid="step-description">{description}</p>
      {children}
    </div>
  ),
}));

// Select nativo: o Radix não é o que está em teste.
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
      data-testid={`select-${items[0]?.value ?? 'empty'}`}
      value={value ?? ''}
      onChange={(e) => onValueChange(e.target.value)}
    >
      {items.map((i) => (
        <option key={i.value} value={i.value}>
          {i.label}
        </option>
      ))}
    </select>
  ),
}));

import { NewEvaluationWizard } from './NewEvaluationWizard';

const stepText = () => screen.getByTestId('step-description').textContent;
const next = () => screen.getByRole('button', { name: 'Continuar' });

function fillGeneral() {
  fireEvent.change(screen.getByLabelText('Nome da avaliação *'), {
    target: { value: 'Avaliação anual' },
  });
  fireEvent.change(screen.getByLabelText('Início *'), {
    target: { value: '2026-01-01' },
  });
  fireEvent.change(screen.getByLabelText('Fim *'), {
    target: { value: '2026-03-01' },
  });
}

describe('NewEvaluationWizard (fluxo entre etapas)', () => {
  test('etapa 1 só avança com nome e datas', () => {
    render(<NewEvaluationWizard onClose={vi.fn()} />);
    expect(stepText()).toContain('Etapa 1 de');
    expect(next()).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Nome da avaliação *'), {
      target: { value: 'Avaliação anual' },
    });
    expect(next()).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Início *'), {
      target: { value: '2026-01-01' },
    });
    fireEvent.change(screen.getByLabelText('Fim *'), {
      target: { value: '2026-03-01' },
    });
    expect(next()).toBeEnabled();
  });

  test('etapa 2: grupo exige colaboradores; "Todos" liberta o avanço', () => {
    render(<NewEvaluationWizard onClose={vi.fn()} />);
    fillGeneral();
    fireEvent.click(next());
    expect(stepText()).toContain('Etapa 2 de');

    // por omissão é "Grupo" sem colaboradores seleccionados
    expect(next()).toBeDisabled();

    fireEvent.change(screen.getByTestId('select-ALL'), {
      target: { value: 'ALL' },
    });
    expect(next()).toBeEnabled();
  });

  test('Voltar recua uma etapa e mantém o que foi preenchido', () => {
    render(<NewEvaluationWizard onClose={vi.fn()} />);
    fillGeneral();
    fireEvent.click(next());
    expect(stepText()).toContain('Etapa 2 de');

    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(stepText()).toContain('Etapa 1 de');
    expect(screen.getByLabelText('Nome da avaliação *')).toHaveValue(
      'Avaliação anual',
    );
    expect(screen.getByLabelText('Início *')).toHaveValue('2026-01-01');
  });
});
