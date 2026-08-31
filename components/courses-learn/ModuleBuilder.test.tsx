import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ModuleBuilder } from './ModuleBuilder';

// ─── Mocks ────────────────────────────────────────────────────────────────────
// O construtor só orquestra: 1 GET /courses/:id + mutações. Mockamos a camada
// de dados para testar a apresentação da lista de módulos sem rede nem React
// Query. O ponto central: GET /courses/:id devolve `modules[].lessons` mas
// NUNCA `modules[]._count` — o componente não pode assumir esse campo.

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    post: vi.fn().mockResolvedValue({}),
    put: vi.fn().mockResolvedValue({}),
    patch: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
}));
vi.mock('@/lib/errorReporting', () => ({ reportError: vi.fn() }));
vi.mock('@/providers/ConfirmProvider', () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true),
}));
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => vi.fn() }));

let queryData: unknown;
vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: () => ({ data: queryData, isLoading: false }),
  useApiMutation: (fn: (v: unknown) => Promise<unknown>) => ({
    mutate: (v: unknown) => fn(v),
    isPending: false,
  }),
}));

// Módulo tal como chega de GET /courses/:id: com `lessons`, sem `_count`.
const moduleFromApi = {
  id: 7,
  courseId: 53,
  title: 'Introdução',
  seq: 0,
  status: 'PUBLISHED',
  type: 'THEORETICAL',
  progressionType: 'FREE',
  mandatory: true,
  dripDays: null,
  lessons: [
    { id: 1, title: 'Aula 1', type: 'VIDEO', durationMinutes: 10 },
    { id: 2, title: 'Aula 2', type: 'TEXT', durationMinutes: null },
  ],
  materials: [],
};

describe('ModuleBuilder', () => {
  test('mostra a contagem de aulas sem rebentar quando a API não devolve _count', () => {
    queryData = { modules: [moduleFromApi] };
    render(<ModuleBuilder courseId={53} />);
    expect(screen.getByText('Introdução')).toBeInTheDocument();
    expect(screen.getByText(/2 aulas/)).toBeInTheDocument();
  });

  test('estado vazio quando o curso não tem módulos', () => {
    queryData = { modules: [] };
    render(<ModuleBuilder courseId={53} />);
    expect(screen.getByText('Sem módulos')).toBeInTheDocument();
  });
});
