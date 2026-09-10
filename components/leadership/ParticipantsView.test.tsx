import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// A leitura do percurso individual (ParticipantJourney) só é montada para
// gestores; nestes testes nunca é aberta, por isso os hooks de dados não
// chegam a correr. Mocka-se na mesma para o import não puxar o QueryClient.
vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: () => ({ data: undefined, isLoading: false }),
  useApiMutation: (fn: (v: unknown) => Promise<unknown>) => ({
    mutate: (v: unknown) => fn(v),
    isPending: false,
  }),
}));
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => vi.fn() }));
vi.mock('@/lib/apiClient', () => ({ apiClient: { put: vi.fn() } }));

import { ParticipantsView } from './ParticipantsView';
import type { LeadershipProgramDetail } from './types';

const detail = {
  participants: [
    { userId: 3, status: 'IN_PROGRESS', progress: 40, readinessLevel: null, user: { fullName: 'Ana Costa' } },
    { userId: 4, status: 'ENROLLED', progress: 0, readinessLevel: 'READY_SOON', user: { fullName: 'Bruno Dias' } },
  ],
} as unknown as LeadershipProgramDetail;

describe('ParticipantsView', () => {
  test('não-gestor: sem acesso ao percurso individual de outro participante', () => {
    render(<ParticipantsView programId={1} detail={detail} canManage={false} />);

    expect(
      screen.getByText(/apenas gestores do programa podem ver o percurso individual/i),
    ).toBeInTheDocument();
    // Nenhum botão "Percurso" — não há como abrir o plano de ninguém.
    expect(screen.queryByRole('button', { name: /percurso/i })).toBeNull();
    // A lista continua visível.
    expect(screen.getByText('Ana Costa')).toBeInTheDocument();
    expect(screen.getByText('Bruno Dias')).toBeInTheDocument();
  });

  test('gestor: cada participante ganha o botão de percurso', () => {
    render(<ParticipantsView programId={1} detail={detail} canManage />);
    expect(screen.getAllByRole('button', { name: /percurso/i })).toHaveLength(2);
    expect(
      screen.queryByText(/apenas gestores do programa/i),
    ).toBeNull();
  });
});
