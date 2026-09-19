import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CourseDetailView } from './CourseDetailView';
import type { CourseDetailData } from './types';

const noop = () => {};

const baseCourse: CourseDetailData = {
  id: 1,
  title: 'Gestão de Liderança',
  shortDescription: 'Curso introdutório',
  description: 'Descrição completa do curso, com todos os detalhes.',
  category: 'Liderança',
  knowledgeArea: null,
  tags: [],
  thumbnailUrl: null,
  workloadHours: 12,
  estimatedDurationDays: null,
  language: 'pt',
  level: 'INTERMEDIATE',
  status: 'PUBLISHED',
  visibility: 'PUBLIC',
  mandatory: false,
  type: null,
  modality: null,
  internalCode: 'C001',
  departmentId: null,
  unit: null,
  targetAudience: ['Gestores', 'Líderes de equipa'],
  learningObjectives: [],
  startDate: null,
  endDate: null,
  requiresApproval: false,
  passingScore: 70,
  minCompletionPercent: 80,
  certificateEnabled: true,
  certificateCriteria: 'Concluir todos os módulos',
  certificateValidityDays: 365,
  primaryInstructorId: 10,
  requiredCourseId: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  publishedAt: '2026-01-01T00:00:00.000Z',
  _count: { enrollments: 5, feedbacks: 0, modules: 2 },
  competencies: [{ competency: { id: 1, name: 'Comunicação' } }],
  primaryInstructor: { id: 10, fullName: 'Ana Silva', avatarUrl: null },
  requiredCourse: null,
  instructors: [],
  modules: [],
  feedbacks: [],
  relatedCourses: [],
  learningPaths: [],
};

const baseProps = {
  onBack: noop,
  loadingCourse: false,
  progress: null,
  isEnrolled: false,
  progressPct: 0,
  activeLesson: null,
  onSelectLesson: noop,
  rating: 0,
  onRatingChange: noop,
  comment: '',
  onCommentChange: noop,
  onEnroll: noop,
  onMarkComplete: noop,
  onFeedback: noop,
  enrolling: false,
  completing: false,
  feedbackLoading: false,
};

describe('CourseDetailView — secções do doc renderizadas com dados reais', () => {
  test('mostra "Sobre o curso" com a descrição real, não um placeholder', () => {
    render(<CourseDetailView {...baseProps} course={baseCourse} />);
    expect(
      screen.getByText('Descrição completa do curso, com todos os detalhes.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Gestores')).toBeInTheDocument();
  });

  test('mostra competências desenvolvidas', () => {
    render(<CourseDetailView {...baseProps} course={baseCourse} />);
    expect(screen.getByText('Competências desenvolvidas')).toBeInTheDocument();
    expect(screen.getByText('Comunicação')).toBeInTheDocument();
  });

  test('mostra o instrutor principal', () => {
    render(<CourseDetailView {...baseProps} course={baseCourse} />);
    expect(screen.getByText('Ana Silva')).toBeInTheDocument();
  });

  test('mostra a secção de certificação quando certificateEnabled', () => {
    render(<CourseDetailView {...baseProps} course={baseCourse} />);
    expect(screen.getByText('Certificação')).toBeInTheDocument();
    expect(screen.getByText('Concluir todos os módulos')).toBeInTheDocument();
  });

  test('mostra percursos de aprendizagem quando o curso pertence a um', () => {
    render(
      <CourseDetailView
        {...baseProps}
        course={{ ...baseCourse, learningPaths: [{ id: 5, title: 'Percurso de Liderança' }] }}
      />,
    );
    expect(screen.getByText('Percurso de Liderança')).toBeInTheDocument();
  });

  test('sem cursos relacionados, não mostra a secção', () => {
    render(<CourseDetailView {...baseProps} course={baseCourse} />);
    expect(screen.queryByText('Cursos relacionados')).not.toBeInTheDocument();
  });

  test('utilizador inscrito e curso concluído mostra estado pós-conclusão com certificado', () => {
    render(
      <CourseDetailView
        {...baseProps}
        course={baseCourse}
        isEnrolled
        progressPct={100}
        progress={{
          enrollment: {
            id: 1,
            status: 'COMPLETED',
            deadline: null,
            completedAt: '2026-02-01T00:00:00.000Z',
            certificate: { id: 1, code: 'CERT-1', issuedAt: '2026-02-01T00:00:00.000Z', fileUrl: 'https://cdn.example.com/cert.pdf' },
          },
          courseProgress: { totalLessons: 4, completedLessons: 4, pct: 100 },
          modules: [],
        }}
      />,
    );
    expect(screen.getByText('Curso concluído')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /descarregar certificado/i }),
    ).toHaveAttribute('href', 'https://cdn.example.com/cert.pdf');
  });

  test('utilizador inscrito sem aula activa tem botão "Continuar curso"', () => {
    render(
      <CourseDetailView
        {...baseProps}
        course={baseCourse}
        isEnrolled
        progressPct={30}
        progress={{
          enrollment: { id: 1, status: 'IN_PROGRESS', deadline: null },
          courseProgress: { totalLessons: 4, completedLessons: 1, pct: 25 },
          modules: [
            {
              id: 1,
              title: 'Módulo 1',
              seq: 0,
              completedCount: 0,
              totalCount: 1,
              lessons: [
                { id: 1, title: 'Lição 1', type: 'TEXT', seq: 0, durationMinutes: null, isFree: true, completed: false, resumePosition: 0 },
              ],
            },
          ],
        }}
      />,
    );
    expect(screen.getByRole('button', { name: /continuar curso/i })).toBeInTheDocument();
  });
});
