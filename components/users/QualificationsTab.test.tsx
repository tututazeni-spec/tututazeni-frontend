// components/users/QualificationsTab.test.tsx
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const useApiQuery = vi.fn();
vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: (...a: unknown[]) => useApiQuery(...a),
  useApiMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => vi.fn() }));
vi.mock('@/providers/ConfirmProvider', () => ({
  useConfirm: () => vi.fn().mockResolvedValue(false),
}));

import { QualificationsTab } from './QualificationsTab';

const profile = {
  qualifications: [
    { id: 1, degree: 'LICENCIATURA', course: 'Informática', institution: null, year: null },
  ],
  languages: [{ id: 2, language: 'Inglês', level: 'C1' }],
  certifications: [],
  priorExperienceYears: null,
};

describe('QualificationsTab', () => {
  beforeEach(() => useApiQuery.mockReset());

  // GESTOR/LIDER abrem o perfil de um subordinado: o backend responde 404
  // (só o próprio e ADMIN/RH). Sem tratar o erro ficava um skeleton eterno.
  test('sem acesso (erro do pedido) mostra mensagem, não um skeleton infinito', () => {
    useApiQuery.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<QualificationsTab userId={5} />);
    expect(screen.getByText(/sem acesso/i)).toBeTruthy();
  });

  test('mostra as habilitações e os idiomas registados', () => {
    useApiQuery.mockReturnValue({ data: profile, isLoading: false, isError: false });
    render(<QualificationsTab userId={5} />);
    expect(screen.getByText('Informática')).toBeTruthy();
    expect(screen.getByText('Inglês')).toBeTruthy();
  });

  test('experiência nunca preenchida (null) aparece com o campo vazio', () => {
    useApiQuery.mockReturnValue({ data: profile, isLoading: false, isError: false });
    render(<QualificationsTab userId={5} />);
    const input = screen.getByLabelText('Anos de experiência anterior') as HTMLInputElement;
    expect(input.value).toBe('');
  });
});
