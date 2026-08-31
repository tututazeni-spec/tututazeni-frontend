import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EnrollmentCard } from './EnrollmentCard';
import type { Enrollment, EnrollmentStatus } from './types';

// next/image não corre em jsdom sem loader — substituímos por um <img> simples.
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

function makeEnrollment(status: EnrollmentStatus): Enrollment {
  return {
    id: 1,
    courseId: 123,
    userId: 9,
    status,
    mandatory: false,
    origin: 'SELF_ENROLL',
    deadline: null,
    startedAt: null,
    completedAt: null,
    enrolledAt: '2026-01-01T00:00:00.000Z',
    progressPercent: 0,
    completedLessons: 0,
    totalLessons: 5,
    isOverdue: false,
    user: {
      id: 9,
      fullName: 'Teste',
      email: 't@innova.ao',
      avatarUrl: null,
      department: null,
    },
    course: {
      id: 123,
      title: 'Curso X',
      thumbnailUrl: null,
      category: null,
      workloadHours: null,
    },
    certificate: null,
  };
}

describe('EnrollmentCard — CTA aponta para a rota real do curso', () => {
  test.each([
    ['NOT_STARTED', 'Iniciar →'],
    ['IN_PROGRESS', 'Continuar →'],
    ['OVERDUE', 'Iniciar agora →'],
  ] as const)('%s → /courses/:id/learn', (status, label) => {
    render(<EnrollmentCard enrollment={makeEnrollment(status)} />);
    const link = screen.getByRole('link', { name: label });
    expect(link).toHaveAttribute('href', '/courses/123/learn');
  });
});
