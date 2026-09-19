import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: () => ({ data: undefined, isLoading: false }),
}));
vi.mock('@/lib/apiClient', () => ({
  apiClient: { post: vi.fn().mockResolvedValue({ id: 1 }) },
}));
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => vi.fn() }));
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock('@/components/departments/DepartmentUserPicker', () => ({
  DepartmentUserPicker: () => <div data-testid="user-picker" />,
}));
vi.mock('@/components/departments/departmentFormData', () => ({
  useUnits: () => ({ units: [], loading: false }),
  useDirectoryUsers: () => ({ users: [], loading: false }),
}));
vi.mock('@/components/ui/Select', () => ({
  Select: () => <div data-testid="select" />,
}));

import { NewEvaluationWizard } from './NewEvaluationWizard';

beforeEach(() => vi.clearAllMocks());

describe('NewEvaluationWizard', () => {
  test('etapa 1: "Continuar" fica desactivado sem nome nem datas', () => {
    render(<NewEvaluationWizard onClose={vi.fn()} />);
    expect(screen.getByText('Etapa 1 de 8 — Dados gerais')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled();
  });

  test('etapa 1: preencher nome + datas (modo independente) activa "Continuar"', () => {
    render(<NewEvaluationWizard onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Nome da avaliação *'), {
      target: { value: 'Avaliação de Desempenho 2026' },
    });
    fireEvent.change(screen.getByLabelText('Início *'), { target: { value: '2026-01-01' } });
    fireEvent.change(screen.getByLabelText('Fim *'), { target: { value: '2026-12-31' } });
    expect(screen.getByRole('button', { name: 'Continuar' })).not.toBeDisabled();
  });

  test('cancelar na etapa 1 chama onClose', () => {
    const onClose = vi.fn();
    render(<NewEvaluationWizard onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onClose).toHaveBeenCalled();
  });

  test('avançar para etapa 2 muda o título e mostra "Voltar"', () => {
    render(<NewEvaluationWizard onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Nome da avaliação *'), {
      target: { value: 'Avaliação X' },
    });
    fireEvent.change(screen.getByLabelText('Início *'), { target: { value: '2026-01-01' } });
    fireEvent.change(screen.getByLabelText('Fim *'), { target: { value: '2026-12-31' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByText('Etapa 2 de 8 — Participantes')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeInTheDocument();
  });
});
