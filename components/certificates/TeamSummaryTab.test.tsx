import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TeamSummaryTab } from './TeamSummaryTab';
import type { TeamSummary } from './types';

const summary = (over: Partial<TeamSummary> = {}): TeamSummary => ({
  members: [],
  totals: {
    members: 0,
    active: 0,
    expired: 0,
    expiringSoon: 0,
    pendingApproval: 0,
    mandatoryPending: 0,
    inProgress: 0,
    mandatoryCoveragePct: null,
  },
  ...over,
});

let data: TeamSummary | undefined;
const queries: { path: string; enabled?: boolean }[] = [];
vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: (_k: unknown, path: string, opts?: { enabled?: boolean }) => {
    queries.push({ path, enabled: opts?.enabled });
    return path === '/departments'
      ? { data: { data: [{ id: 4, name: 'Operações' }] }, isLoading: false }
      : { data, isLoading: false, error: null };
  },
}));

describe('TeamSummaryTab', () => {
  beforeEach(() => {
    data = summary();
    queries.length = 0;
  });

  test('equipa vazia mostra o estado vazio', () => {
    render(<TeamSummaryTab />);
    expect(
      screen.getByText('Sem colaboradores na sua equipa'),
    ).toBeInTheDocument();
  });

  test('mostra totais e uma linha por colaborador, sem enums crus', () => {
    data = summary({
      members: [
        {
          userId: 1,
          fullName: 'Ana Silva',
          active: 2,
          expired: 1,
          expiringSoon: 1,
          pendingApproval: 0,
          mandatoryPending: 1,
          inProgress: 3,
        },
        {
          userId: 2,
          fullName: 'Bruno Costa',
          active: 0,
          expired: 0,
          expiringSoon: 0,
          pendingApproval: 1,
          mandatoryPending: 0,
          inProgress: 0,
        },
      ],
      totals: {
        members: 2,
        active: 2,
        expired: 1,
        expiringSoon: 1,
        pendingApproval: 1,
        mandatoryPending: 1,
        inProgress: 3,
        mandatoryCoveragePct: 50,
      },
    });
    render(<TeamSummaryTab />);
    expect(screen.getByText('Ana Silva')).toBeInTheDocument();
    expect(screen.getByText('Bruno Costa')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(
      screen.queryByText(/mandatoryPending|expiringSoon/),
    ).not.toBeInTheDocument();
  });

  test('cobertura sem obrigatórias aparece como traço', () => {
    data = summary({
      members: [
        {
          userId: 1,
          fullName: 'Ana',
          active: 0,
          expired: 0,
          expiringSoon: 0,
          pendingApproval: 0,
          mandatoryPending: 0,
          inProgress: 0,
        },
      ],
    });
    render(<TeamSummaryTab />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  test('RH/ADMIN têm de escolher um departamento antes de ver dados', () => {
    render(<TeamSummaryTab pickDepartment />);
    expect(screen.getByText('Escolha um departamento')).toBeInTheDocument();
    const summaryCalls = queries.filter(
      (q) => q.path === '/certificates/team/summary',
    );
    expect(summaryCalls.every((q) => q.enabled === false)).toBe(true);
  });
});
