// As vistas do perfil renderizam só com props: sem QueryClient nem apiClient.

import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { AccessView } from './AccessView';
import { ActivityView } from './ActivityViews';
import { CompetenciesView, CoursesView } from './LearningViews';
import { EvaluationsView, PerformanceView } from './PerformanceViews';
import {
  OrganizationView,
  PersonalDataTab,
  ProfessionalDataTab,
} from './PersonalViews';
import { AttendanceView, DocumentsView, LeaveView } from './RecordsViews';
import type {
  AccessOverview,
  AttendanceResponse,
  User,
  UserActivityStats,
  UserCompetencyEntry,
  UserEnrollmentsResponse,
  UserEval360CycleEntry,
} from '../types';
import type { EvalResults } from '@/components/evaluation/types';

const as = <T,>(v: unknown) => v as T;

const user = (over: Record<string, unknown> = {}) =>
  as<User>({
    id: 1,
    fullName: 'Ana Silva',
    email: 'ana@x.ao',
    hrStatus: 'ACTIVE',
    gender: 'FEMALE',
    birthDate: null,
    hireDate: null,
    exitDate: null,
    manager: null,
    unit: null,
    department: { id: 1, name: 'Recursos Humanos', code: 'RH' },
    position: null,
    ...over,
  });

describe('estados de carregamento e vazio', () => {
  it('a carregar mostra o esqueleto; sem dados mostra a mensagem', () => {
    const { container, unmount } = render(
      <AccessView data={undefined} isLoading />,
    );
    expect(container.querySelector('.animate-pulse')).toBeTruthy();
    unmount();

    render(<AccessView data={undefined} isLoading={false} />);
    expect(screen.getByText('Sem dados de acesso')).toBeTruthy();
  });

  it('listas vazias explicam o que falta', () => {
    const { unmount } = render(
      <CompetenciesView data={[]} isLoading={false} />,
    );
    expect(screen.getByText('Sem competências avaliadas')).toBeTruthy();
    unmount();
    render(<DocumentsView data={{ data: [] } as never} isLoading={false} />);
    expect(screen.getByText('Sem documentos associados')).toBeTruthy();
  });
});

describe('dados pessoais e profissionais', () => {
  it('campos vazios aparecem como «—» e o género vem traduzido', () => {
    render(<PersonalDataTab user={user()} />);
    expect(screen.getByText('Feminino')).toBeTruthy();
    expect(screen.getAllByText('—').length).toBeGreaterThan(3);
  });

  it('o estado do colaborador é o último campo do regime', () => {
    render(<ProfessionalDataTab user={user()} />);
    expect(screen.getByText('Estado do colaborador')).toBeTruthy();
  });

  it('organização mostra a equipa só quando o container a injecta', () => {
    const { unmount } = render(
      <OrganizationView user={user()} team={<div>EQUIPA</div>} />,
    );
    expect(screen.getByText('EQUIPA')).toBeTruthy();
    expect(screen.getByText('Recursos Humanos')).toBeTruthy();
    unmount();

    render(<OrganizationView user={user()} team={null} />);
    expect(screen.queryByText('EQUIPA')).toBeNull();
  });
});

describe('acesso', () => {
  it('MFA, último login e permissões', () => {
    const data = as<AccessOverview>({
      profile: { name: 'RH' },
      systemFunction: 'Gestor',
      contentAccessLevel: 'ALL',
      mfaEnabled: true,
      accountCreatedAt: '2024-03-01T00:00:00Z',
      lastLoginAt: null,
      activeSessions: 2,
      authorizedModules: ['Users'],
      permissions: [{ id: 1, name: 'Ler', action: 'read', subject: 'User' }],
      specialPermissions: [],
    });
    render(<AccessView data={data} isLoading={false} />);
    expect(screen.getByText('Activado')).toBeTruthy();
    expect(screen.getByText('Sem registo')).toBeTruthy();
    expect(screen.getByText('Permissões do perfil (1)')).toBeTruthy();
    expect(
      screen.getByText('Sem permissões especiais concedidas'),
    ).toBeTruthy();
  });
});

describe('cursos e competências', () => {
  it('cursos: contadores por grupo e certificado', () => {
    const data = as<UserEnrollmentsResponse>({
      groups: {
        completed: [1, 2],
        inProgress: [3],
        notStarted: [],
        overdue: [4, 5, 6],
      },
      enrollments: [
        {
          id: 1,
          course: { title: 'Segurança', category: 'HSE' },
          progress: 100,
          deadline: null,
          status: 'COMPLETED',
          certificate: null,
        },
      ],
    });
    render(<CoursesView data={data} isLoading={false} />);
    expect(screen.getByText('Segurança')).toBeTruthy();
    expect(screen.getByText('100%')).toBeTruthy();
    expect(screen.getByText('COMPLETED')).toBeTruthy();
  });

  it('competências: lacuna positiva a vermelho, sem lacuna a verde', () => {
    const data = as<UserCompetencyEntry[]>([
      {
        id: 1,
        competency: { name: 'Liderança', category: null },
        currentLevel: 2,
        targetLevel: 4,
        gap: 2,
        evaluatedAt: '2026-01-05T00:00:00Z',
      },
      {
        id: 2,
        competency: { name: 'Comunicação', category: null },
        currentLevel: 4,
        targetLevel: 4,
        gap: 0,
        evaluatedAt: '2026-01-05T00:00:00Z',
      },
    ]);
    render(<CompetenciesView data={data} isLoading={false} />);
    const lead = screen.getByText('Liderança').closest('tr')!;
    const comm = screen.getByText('Comunicação').closest('tr')!;
    expect(
      within(lead).getByText('2', { selector: 'td.text-danger' }),
    ).toBeTruthy();
    expect(
      within(comm).getByText('0', { selector: 'td.text-success' }),
    ).toBeTruthy();
  });
});

describe('desempenho', () => {
  it('sem avaliações mostra a mensagem', () => {
    render(
      <PerformanceView
        data={as<EvalResults>({ hasResults: false })}
        isLoading={false}
      />,
    );
    expect(screen.getByText('Sem avaliações de desempenho')).toBeTruthy();
  });

  it('o texto da pontuação está em português correcto (sem mojibake)', () => {
    const data = as<EvalResults>({
      hasResults: true,
      finalScore: 4.2,
      scoreLabel: 'Muito bom',
      totalEvaluators: 5,
      concordance: null,
      qualitative: {
        strengths: ['Equipa'],
        improvements: [],
        recommendations: [],
      },
    });
    render(<PerformanceView data={data} isLoading={false} />);
    expect(screen.getByText('Pontuação final')).toBeTruthy();
    expect(screen.queryByText(/Ã/)).toBeNull();
    expect(screen.getByText('Pontos fortes')).toBeTruthy();
    expect(screen.getByText('A melhorar')).toBeTruthy();
    expect(screen.getByText('Equipa')).toBeTruthy();
  });

  it('avaliações 360°: nota oculta explica a falta de permissão', () => {
    const data = as<UserEval360CycleEntry[]>([
      {
        cycleId: 1,
        cycleName: 'Ciclo 2025',
        cycleType: 'ANNUAL',
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-12-31T00:00:00Z',
        participantStatus: 'COMPLETED',
        finalScore: null,
      },
      {
        cycleId: 2,
        cycleName: 'Ciclo 2026',
        cycleType: 'ANNUAL',
        startDate: '2026-01-01T00:00:00Z',
        endDate: '2026-12-31T00:00:00Z',
        participantStatus: 'IN_PROGRESS',
        finalScore: 0,
      },
    ]);
    render(<EvaluationsView data={data} isLoading={false} />);
    expect(screen.getByText('Pontuação final')).toBeTruthy();
    expect(screen.getByText('— (sem permissão para ver)')).toBeTruthy();
    // a nota 0 é uma nota válida, não «sem permissão»
    expect(screen.getByText('0')).toBeTruthy();
  });
});

describe('férias e presenças', () => {
  it('férias: aparece o saldo e os pedidos', () => {
    render(
      <LeaveView
        isLoading={false}
        balance={[{ leaveTypeCode: 'ANNUAL', balance: 12, used: 10 } as never]}
        requests={
          {
            data: [
              {
                id: 1,
                leaveTypeCode: 'ANNUAL',
                startDate: '2026-02-01T00:00:00Z',
                endDate: '2026-02-05T00:00:00Z',
                workDays: 5,
                status: 'APPROVED',
              },
            ],
          } as never
        }
      />,
    );
    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText('10 usados')).toBeTruthy();
    expect(screen.getByText('APPROVED')).toBeTruthy();
  });

  it('férias: a carregar ou sem pedidos', () => {
    const { unmount } = render(
      <LeaveView isLoading requests={undefined} balance={undefined} />,
    );
    unmount();
    render(<LeaveView isLoading={false} requests={undefined} balance={[]} />);
    expect(screen.getByText('Sem pedidos de férias/licença')).toBeTruthy();
  });

  it('presenças: mostra só os 30 registos mais recentes', () => {
    const records = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      date: '2026-03-01T00:00:00Z',
      clockIn: '08:00',
      clockOut: '17:00',
      status: i % 2 ? 'ABSENT' : 'PRESENT',
    }));
    const data = as<AttendanceResponse>({
      records,
      summary: {
        attendanceRate: 90,
        presentDays: 20,
        lateDays: 1,
        absentDays: 2,
      },
    });
    render(<AttendanceView data={data} isLoading={false} />);
    expect(screen.getByText('90%')).toBeTruthy();
    // 30 linhas de dados + 1 de cabeçalho
    expect(screen.getAllByRole('row')).toHaveLength(31);
  });
});

describe('actividade', () => {
  it('sequência, conclusão e actividade por categoria', () => {
    const data = as<UserActivityStats>({
      streak: 7,
      activeDays: 120,
      completionRate: 85,
      xpPoints: 900,
      byCategory: { COURSE: 12 },
    });
    render(<ActivityView data={data} isLoading={false} />);
    expect(screen.getByText('7 dias')).toBeTruthy();
    expect(screen.getByText('85%')).toBeTruthy();
    expect(screen.getByText('COURSE: 12')).toBeTruthy();
  });

  it('sem eventos no último ano', () => {
    const data = as<UserActivityStats>({
      streak: 0,
      activeDays: 0,
      completionRate: 0,
      xpPoints: 0,
      byCategory: {},
    });
    render(<ActivityView data={data} isLoading={false} />);
    expect(screen.getByText('Sem eventos no último ano')).toBeTruthy();
  });
});
