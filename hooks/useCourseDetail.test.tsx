// hooks/useCourseDetail.test.tsx
// Regressão: GET /courses/:id/progress pode chegar como um objecto "truthy"
// que não cumpre o tipo CourseProgress (sem `courseProgress`, sem `modules`).
// O hook fazia `progress?.courseProgress.pct` — o `?.` só protege contra
// `progress` nulo, não contra `courseProgress` em falta — e rebentava com
// "Cannot read properties of undefined (reading 'pct')".

import { describe, expect, test, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCourseDetail } from './useCourseDetail';

const get = vi.fn();
vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    get: (...args: unknown[]) => get(...args),
    post: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('@/providers/ToastProvider', () => ({ useToast: () => vi.fn() }));

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  get.mockReset();
});

describe('useCourseDetail — resiliência ao shape de /progress', () => {
  test('não rebenta quando progress vem sem courseProgress nem modules', async () => {
    get.mockImplementation((path: string) => {
      if (path === '/courses/1')
        return Promise.resolve({ id: 1, title: 'Curso' });
      if (path === '/courses/1/progress')
        // objecto truthy, mas parcial — sem `courseProgress` nem `modules`
        return Promise.resolve({
          enrollment: { id: 9, status: 'IN_PROGRESS', deadline: null },
        });
      return Promise.reject(new Error(`path inesperado: ${path}`));
    });

    const { result } = renderHook(() => useCourseDetail(1), { wrapper });

    await waitFor(() => expect(result.current.progress).not.toBeNull());

    expect(result.current.progressPct).toBe(0);
    expect(result.current.isEnrolled).toBe(true);
  });

  test('usa a percentagem real quando o shape está completo', async () => {
    get.mockImplementation((path: string) => {
      if (path === '/courses/2')
        return Promise.resolve({ id: 2, title: 'Curso' });
      if (path === '/courses/2/progress')
        return Promise.resolve({
          enrollment: { id: 3, status: 'IN_PROGRESS', deadline: null },
          courseProgress: { totalLessons: 4, completedLessons: 1, pct: 25 },
          modules: [],
        });
      return Promise.reject(new Error(`path inesperado: ${path}`));
    });

    const { result } = renderHook(() => useCourseDetail(2), { wrapper });

    await waitFor(() => expect(result.current.progress).not.toBeNull());
    expect(result.current.progressPct).toBe(25);
  });

  test('progress nulo (não inscrito) → 0% e isEnrolled falso', async () => {
    get.mockImplementation((path: string) => {
      if (path === '/courses/3')
        return Promise.resolve({ id: 3, title: 'Curso' });
      if (path === '/courses/3/progress') return Promise.resolve(null);
      return Promise.reject(new Error(`path inesperado: ${path}`));
    });

    const { result } = renderHook(() => useCourseDetail(3), { wrapper });

    await waitFor(() => expect(result.current.course).toBeDefined());
    expect(result.current.progressPct).toBe(0);
    expect(result.current.isEnrolled).toBe(false);
  });
});
