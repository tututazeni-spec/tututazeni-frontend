import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

let gapData: unknown = undefined;
const lastPath = { value: '' };

vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: (_key: unknown, path: string, opts?: { enabled?: boolean }) => {
    lastPath.value = path;
    if (opts?.enabled === false) return { data: undefined, isLoading: false };
    return { data: gapData, isLoading: false };
  },
}));

let currentRole: string | undefined = 'COLABORADOR';
vi.mock('@/hooks/useCurrentRole', () => ({ useCurrentRole: () => currentRole }));

vi.mock('@/components/departments/DepartmentUserPicker', () => ({
  DepartmentUserPicker: () => <div data-testid="user-picker" />,
}));

import { CompetenciesTab } from './CompetenciesTab';

beforeEach(() => {
  gapData = undefined;
  currentRole = 'COLABORADOR';
  lastPath.value = '';
});

describe('CompetenciesTab', () => {
  test('COLABORADOR chama o gap "my" e não vê o selector de colaborador', () => {
    gapData = { gaps: [], totalGap: 0, mandatoryGaps: 0, readinessPercent: 100, positionId: 1, userId: 1 };
    render(<CompetenciesTab />);
    expect(lastPath.value).toBe('/competencies/my/gap');
    expect(screen.queryByTestId('user-picker')).not.toBeInTheDocument();
    expect(screen.getByText('Sem competências mapeadas para o cargo')).toBeInTheDocument();
  });

  test('sem cargo atribuído mostra estado vazio dedicado', () => {
    gapData = { gaps: [], totalGap: 0, mandatoryGaps: 0, readinessPercent: 100, positionId: null, userId: 1, noPosition: true };
    render(<CompetenciesTab />);
    expect(screen.getByText('Sem cargo atribuído')).toBeInTheDocument();
  });

  test('GESTOR vê o selector de colaborador antes de escolher', () => {
    currentRole = 'GESTOR';
    render(<CompetenciesTab />);
    expect(screen.getByTestId('user-picker')).toBeInTheDocument();
    expect(screen.getByText('Selecciona um colaborador')).toBeInTheDocument();
  });

  test('lista de gaps mostra competência, esperado e demonstrado', () => {
    gapData = {
      gaps: [
        {
          competency: { id: 1, name: 'Liderança' },
          requiredLevel: 4,
          currentLevel: 2,
          gap: 2,
          met: false,
          priority: 'MANDATORY',
          weight: 1,
          recommendedCourses: [],
        },
      ],
      totalGap: 2,
      mandatoryGaps: 1,
      readinessPercent: 0,
      positionId: 1,
      userId: 1,
    };
    render(<CompetenciesTab />);
    expect(screen.getByText('Liderança')).toBeInTheDocument();
    expect(screen.getByText('Demonstrado: 2 · Esperado: 4')).toBeInTheDocument();
  });
});
