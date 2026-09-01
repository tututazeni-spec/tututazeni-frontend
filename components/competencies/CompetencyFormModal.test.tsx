import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const post = vi.fn().mockResolvedValue({ id: 11 });
const put = vi.fn().mockResolvedValue({ id: 5 });
vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    post: (...a: unknown[]) => post(...a),
    put: (...a: unknown[]) => put(...a),
  },
}));

// Resultado do GET /competencies/:id — reconfigurado por teste.
let detailResult: {
  data: unknown;
  isLoading: boolean;
  error: unknown;
} = { data: undefined, isLoading: false, error: null };

vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: () => detailResult,
  useApiMutation: (
    fn: (v: unknown) => Promise<unknown>,
    opts: {
      onSuccess?: (d: unknown, v: unknown) => void;
      onError?: (e: Error) => void;
    },
  ) => ({
    mutate: (v: unknown) =>
      Promise.resolve(fn(v)).then(
        (d) => opts?.onSuccess?.(d, v),
        (e) => opts?.onError?.(e as Error),
      ),
    isPending: false,
  }),
}));

vi.mock('@/components/ui/Modal', () => ({
  Modal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ModalContent: ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  ),
}));

// Stub interactivo: <select> nativo que encaminha onValueChange.
vi.mock('@/components/ui/Select', () => ({
  Select: ({
    items,
    value,
    onValueChange,
  }: {
    items: { value: string; label: string }[];
    value?: string;
    onValueChange: (v: string) => void;
  }) => (
    <select
      data-testid="select"
      value={value ?? ''}
      onChange={(e) => onValueChange(e.target.value)}
    >
      <option value="" />
      {items.map((it) => (
        <option key={it.value} value={it.value}>
          {it.label}
        </option>
      ))}
    </select>
  ),
}));

import { CompetencyFormModal } from './CompetencyFormModal';

beforeEach(() => {
  post.mockClear();
  put.mockClear();
  detailResult = { data: undefined, isLoading: false, error: null };
});

describe('CompetencyFormModal — modo criação', () => {
  test('mostra o título "Nova competência" e "Criar" desativado sem nome', () => {
    render(<CompetencyFormModal onClose={vi.fn()} onSuccess={vi.fn()} />);
    expect(screen.getByText('Nova competência')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Criar' })).toBeDisabled();
  });

  test('preencher nome + categoria e Criar envia POST /competencies', async () => {
    render(<CompetencyFormModal onClose={vi.fn()} onSuccess={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Nome *'), {
      target: { value: '  Negociação  ' },
    });
    fireEvent.change(screen.getByTestId('select'), {
      target: { value: 'SOFT_SKILL' },
    });
    fireEvent.change(screen.getByLabelText('Tags'), {
      target: { value: 'vendas, , persuasão' },
    });

    const criar = screen.getByRole('button', { name: 'Criar' });
    expect(criar).toBeEnabled();
    fireEvent.click(criar);

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith('/competencies', {
      name: 'Negociação',
      category: 'SOFT_SKILL',
      description: null,
      tags: ['vendas', 'persuasão'],
    });
    expect(put).not.toHaveBeenCalled();
  });

  test('erro 409 do backend é mostrado no formulário', async () => {
    post.mockRejectedValueOnce(new Error('Competência "Negociação" já existe'));
    render(<CompetencyFormModal onClose={vi.fn()} onSuccess={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Nome *'), {
      target: { value: 'Negociação' },
    });
    fireEvent.change(screen.getByTestId('select'), {
      target: { value: 'SOFT_SKILL' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));

    expect(
      await screen.findByText('Competência "Negociação" já existe'),
    ).toBeInTheDocument();
  });
});

describe('CompetencyFormModal — modo edição', () => {
  const detail = {
    id: 5,
    name: 'Comunicação Eficaz',
    description: 'Descrição atual',
    category: 'SOFT_SKILL',
    tags: ['comunicação', 'apresentação'],
    status: 'ACTIVE',
    proficiencyLevels: [],
    courses: [],
    positions: [],
    _count: { userCompetencies: 3, endorsements: 1 },
  };

  test('pré-preenche o nome com a competência carregada', () => {
    detailResult = { data: detail, isLoading: false, error: null };
    render(
      <CompetencyFormModal
        competencyId={5}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('Nome *')).toHaveValue('Comunicação Eficaz');
  });

  test('Guardar envia PUT /competencies/:id com status incluído', async () => {
    detailResult = { data: detail, isLoading: false, error: null };
    render(
      <CompetencyFormModal
        competencyId={5}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    expect(put).toHaveBeenCalledWith('/competencies/5', {
      name: 'Comunicação Eficaz',
      category: 'SOFT_SKILL',
      description: 'Descrição atual',
      tags: ['comunicação', 'apresentação'],
      status: 'ACTIVE',
    });
    expect(post).not.toHaveBeenCalled();
  });

  test('mostra estado de carregamento enquanto o detalhe não chega', () => {
    detailResult = { data: undefined, isLoading: true, error: null };
    render(
      <CompetencyFormModal
        competencyId={5}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />,
    );
    expect(screen.getByText('A carregar…')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Guardar' }),
    ).not.toBeInTheDocument();
  });
});
