import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const notify = vi.fn();
const post = vi.fn();
const patch = vi.fn();

vi.mock('@/providers/ToastProvider', () => ({ useToast: () => notify }));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    post: (...a: unknown[]) => post(...a),
    patch: (...a: unknown[]) => patch(...a),
  },
}));

vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: (_key: unknown, path: string) => ({
    data:
      path === '/roi-impact/analyses/initiative-options'
        ? [{ id: 5, label: 'Curso de Liderança' }]
        : undefined,
  }),
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
      <option value="" />
      {items.map((i) => (
        <option key={i.value} value={i.value}>
          {i.label}
        </option>
      ))}
    </select>
  ),
}));

vi.mock('@/components/departments/DepartmentUserPicker', () => ({
  DepartmentUserPicker: () => null,
}));

import { NewRoiAnalysisWizard } from './NewRoiAnalysisWizard';

const stepText = () => screen.getByTestId('step-description').textContent;

function fillIdentification() {
  fireEvent.change(screen.getByLabelText('Nome da análise *'), {
    target: { value: '  ROI Liderança ' },
  });
  fireEvent.change(screen.getByTestId('select-5'), { target: { value: '5' } });
}

beforeEach(() => {
  notify.mockReset();
  post.mockReset();
  patch.mockReset();
  post.mockResolvedValue({ id: 77 });
  patch.mockResolvedValue({});
});

describe('NewRoiAnalysisWizard', () => {
  test('não avança sem nome e iniciativa', () => {
    render(<NewRoiAnalysisWizard onClose={vi.fn()} />);
    expect(stepText()).toContain('Etapa 1 de 5');
    const next = screen.getByRole('button', { name: 'Continuar' });
    expect(next).toBeDisabled();
    fillIdentification();
    expect(next).toBeEnabled();
  });

  test('etapa 1 cria a análise e avança; etapa 2 grava os custos na análise criada', async () => {
    render(<NewRoiAnalysisWizard onClose={vi.fn()} />);
    fillIdentification();
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    await waitFor(() => expect(stepText()).toContain('Etapa 2 de 5'));
    expect(post).toHaveBeenCalledWith(
      '/roi-impact/analyses',
      expect.objectContaining({
        name: 'ROI Liderança',
        initiativeType: 'CURSO',
        initiativeId: 5,
        measurementPeriodDays: 90,
      }),
    );

    fireEvent.change(screen.getByLabelText('Custos diretos'), {
      target: { value: '1500' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    await waitFor(() => expect(stepText()).toContain('Etapa 3 de 5'));
    expect(patch).toHaveBeenCalledWith(
      '/roi-impact/analyses/77',
      expect.objectContaining({ costDirect: 1500 }),
    );
  });

  test('Voltar recua e mantém o que foi preenchido', async () => {
    render(<NewRoiAnalysisWizard onClose={vi.fn()} />);
    fillIdentification();
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    await waitFor(() => expect(stepText()).toContain('Etapa 2 de 5'));

    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(stepText()).toContain('Etapa 1 de 5');
    expect(screen.getByLabelText('Nome da análise *')).toHaveValue(
      '  ROI Liderança ',
    );
  });

  test('erro ao gravar mostra a mensagem, fica na etapa e volta a permitir tentar', async () => {
    post.mockRejectedValueOnce(new Error('Falha de rede'));
    render(<NewRoiAnalysisWizard onClose={vi.fn()} />);
    fillIdentification();
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(await screen.findByText('Falha de rede')).toBeInTheDocument();
    expect(stepText()).toContain('Etapa 1 de 5');
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    await waitFor(() => expect(stepText()).toContain('Etapa 2 de 5'));
    expect(screen.queryByText('Falha de rede')).not.toBeInTheDocument();
  });
});
