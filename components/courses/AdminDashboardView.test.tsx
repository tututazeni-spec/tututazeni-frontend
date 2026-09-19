import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdminDashboardView } from './AdminDashboardView';
import type { AdminDashboard } from './types';

const dashboard: AdminDashboard = {
  courses: { total: 10, published: 6 },
  enrollments: { total: 50, completed: 20, overdue: 2 },
  completionRate: 40,
  counts: {
    total: 10,
    published: 6,
    draft: 2,
    paused: 1,
    archived: 1,
    totalModules: 25,
    totalLessons: 80,
    totalEnrollments: 50,
    pendingEnrollments: 3,
    completions: 20,
    totalLearners: 18,
    mandatoryCourses: 4,
    optionalCourses: 6,
    certificatesIssued: 15,
  },
  rates: { avgCompletionRate: 40, avgPassRate: 75, avgRating: 4.2, totalLearningHours: 120 },
  topCourses: [{ id: 1, title: 'Liderança', enrollments: 20 }],
  bestCompletion: [{ id: 1, title: 'Liderança', rate: 90 }],
  worstCompletion: [{ id: 2, title: 'Comunicação', rate: 10 }],
  byCategory: [{ category: 'Liderança', count: 5 }],
  byLevel: [{ level: 'BEGINNER', count: 5 }],
  byUnit: [{ unit: 'Sede', count: 5 }],
  byDepartment: [{ department: 'RH', count: 5 }],
  byInstructor: [{ instructor: 'Ana Silva', count: 5 }],
  recentlyCreated: [{ id: 1, title: 'Liderança', createdAt: '2026-01-01T00:00:00.000Z' }],
  recentlyUpdated: [{ id: 1, title: 'Liderança', updatedAt: '2026-01-02T00:00:00.000Z' }],
  openForEnrollment: 6,
  endingSoon: [{ id: 3, title: 'Comunicação eficaz', endDate: '2026-02-01T00:00:00.000Z' }],
  withoutEnrollments: 1,
  withoutContent: 0,
  withoutInstructor: 2,
  withPendingContent: 1,
  upcomingLiveSessions: [
    { id: 1, title: 'Sessão ao vivo', liveDate: '2026-03-01T10:00:00.000Z', instructor: 'Ana Silva', course: { id: 1, title: 'Liderança' } },
  ],
  recentActivity: {
    enrollments: [{ id: 1, enrolledAt: '2026-01-01T00:00:00.000Z', user: { fullName: 'Bruno' }, course: { id: 1, title: 'Liderança' } }],
    completions: [{ id: 2, completedAt: '2026-01-05T00:00:00.000Z', user: { fullName: 'Carla' }, course: { id: 1, title: 'Liderança' } }],
    feedbacks: [{ id: 3, rating: 5, createdAt: '2026-01-06T00:00:00.000Z', user: { fullName: 'Diana' }, course: { id: 1, title: 'Liderança' } }],
    certificates: [{ id: 4, issuedAt: '2026-01-07T00:00:00.000Z', user: { fullName: 'Eva' }, course: { id: 1, title: 'Liderança' } }],
  },
  monthlyTrend: {
    enrollments: [{ month: '2026-01', count: 5 }],
    completions: [{ month: '2026-01', count: 2 }],
  },
  topCompetencies: [{ id: 1, name: 'Comunicação', count: 8 }],
  alerts: [{ message: '3 inscrições pendentes de aprovação', severity: 'warning' }],
};

vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: () => ({ data: dashboard, isLoading: false, error: null }),
}));

const noop = () => {};

describe('AdminDashboardView — cobre docs/06-modulo-courses.md "Dashboard Admin → Cursos"', () => {
  test('mostra os KPIs principais para além de total/publicados/matrículas/conclusão', () => {
    render(<AdminDashboardView onSelect={noop} onNavigate={noop} onCreateCourse={noop} />);
    expect(screen.getByText('Rascunhos')).toBeInTheDocument();
    expect(screen.getByText('Em pausa')).toBeInTheDocument();
    expect(screen.getByText('Arquivados')).toBeInTheDocument();
    expect(screen.getByText('Módulos')).toBeInTheDocument();
    expect(screen.getByText('Lições')).toBeInTheDocument();
    expect(screen.getByText('Certificados emitidos')).toBeInTheDocument();
    expect(screen.getByText('Taxa de aprovação')).toBeInTheDocument();
    expect(screen.getByText('Nota média')).toBeInTheDocument();
  });

  test('mostra alertas e pendências', () => {
    render(<AdminDashboardView onSelect={noop} onNavigate={noop} onCreateCourse={noop} />);
    expect(screen.getByText('3 inscrições pendentes de aprovação')).toBeInTheDocument();
  });

  test('mostra distribuições por categoria/nível/unidade/departamento/instrutor/competências', () => {
    render(<AdminDashboardView onSelect={noop} onNavigate={noop} onCreateCourse={noop} />);
    expect(screen.getByText('Por categoria')).toBeInTheDocument();
    expect(screen.getByText('Por departamento')).toBeInTheDocument();
    expect(screen.getByText('Por instrutor')).toBeInTheDocument();
    expect(screen.getByText('Competências mais desenvolvidas')).toBeInTheDocument();
  });

  test('atalho "Criar curso" chama onCreateCourse', () => {
    const onCreateCourse = vi.fn();
    render(<AdminDashboardView onSelect={noop} onNavigate={noop} onCreateCourse={onCreateCourse} />);
    screen.getByRole('button', { name: /criar curso/i }).click();
    expect(onCreateCourse).toHaveBeenCalled();
  });

  test('atalho "Gerir certificados" navega para a aba certificates', () => {
    const onNavigate = vi.fn();
    render(<AdminDashboardView onSelect={noop} onNavigate={onNavigate} onCreateCourse={noop} />);
    screen.getByRole('button', { name: /gerir certificados/i }).click();
    expect(onNavigate).toHaveBeenCalledWith('certificates');
  });

  test('clicar num curso do ranking chama onSelect com o id', () => {
    const onSelect = vi.fn();
    render(<AdminDashboardView onSelect={onSelect} onNavigate={noop} onCreateCourse={noop} />);
    screen.getAllByText('Liderança')[0].click();
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  test('mostra próximas sessões ao vivo e actividade recente', () => {
    render(<AdminDashboardView onSelect={noop} onNavigate={noop} onCreateCourse={noop} />);
    expect(screen.getByText('Sessão ao vivo')).toBeInTheDocument();
    expect(screen.getByText('Bruno')).toBeInTheDocument();
    expect(screen.getByText('Diana')).toBeInTheDocument();
  });
});
