import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const post = vi.fn().mockResolvedValue({ id: 1 });
const put = vi.fn().mockResolvedValue({ id: 9 });

vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    post: (...a: unknown[]) => post(...a),
    put: (...a: unknown[]) => put(...a),
  },
}));

vi.mock('@/hooks/useApiQuery', () => ({
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
  // Departamentos/cargos (Informações gerais) — sem dados nestes testes,
  // fica só o item "Sem X" nos selects.
  useApiQuery: () => ({ data: undefined }),
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

// Select stub: um botão por opção para o teste escolher a duração.
vi.mock('@/components/ui/Select', () => ({
  Select: ({
    items,
    onValueChange,
  }: {
    items: Array<{ value: string; label: string }>;
    onValueChange: (v: string) => void;
  }) => (
    <div>
      {items.map((it) => (
        <button
          key={it.value}
          type="button"
          onClick={() => onValueChange(it.value)}
        >
          dur-{it.value}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('@/providers/ToastProvider', () => ({ useToast: () => vi.fn() }));

import { TemplateFormModal } from './TemplateFormModal';

const template = {
  id: 9,
  name: 'Onboarding TI',
  description: 'Plano TI',
  objective: null,
  version: 1,
  company: null,
  location: null,
  active: true,
  durationDays: 30,
  welcomeVideoUrl: null,
  positionId: null,
  departmentId: null,
  unitId: null,
  tasks: [],
  _count: { plans: 0 },
};

beforeEach(() => {
  post.mockReset().mockResolvedValue({ id: 1 });
  put.mockReset().mockResolvedValue({ id: 9 });
});

describe('TemplateFormModal — criar', () => {
  test('payload mínimo — nome trim + durationDays por defeito (30)', async () => {
    render(<TemplateFormModal onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Nome *'), {
      target: { value: '  Onboarding Colaborador TI  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar plano de integração' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith('/onboarding/templates', {
      name: 'Onboarding Colaborador TI',
      durationDays: 30,
    });
    expect(put).not.toHaveBeenCalled();
  });

  test('campos opcionais — descrição, vídeo e active=false', async () => {
    render(<TemplateFormModal onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Nome *'), {
      target: { value: 'Onboarding Comercial' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'dur-60' }));
    fireEvent.change(screen.getByLabelText('Descrição'), {
      target: { value: '  Plano de 60 dias  ' },
    });
    fireEvent.change(screen.getByLabelText('URL do vídeo de boas-vindas'), {
      target: { value: '  https://vid.example/welcome  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Template activo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Criar plano de integração' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith('/onboarding/templates', {
      name: 'Onboarding Comercial',
      durationDays: 60,
      description: 'Plano de 60 dias',
      welcomeVideoUrl: 'https://vid.example/welcome',
      active: false,
    });
  });

  test('sem nome — botão desactivado, não submete', () => {
    render(<TemplateFormModal onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Criar plano de integração' }));
    expect(post).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Criar plano de integração' }),
    ).toBeDisabled();
  });

  test('erro da API — mostra mensagem', async () => {
    post.mockRejectedValueOnce(new Error('Boom'));
    render(<TemplateFormModal onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Nome *'), {
      target: { value: 'Onboarding X' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar plano de integração' }));

    await waitFor(() => expect(screen.getByText('Boom')).toBeInTheDocument());
  });

  test('sucesso — chama onClose', async () => {
    const onClose = vi.fn();
    render(<TemplateFormModal onClose={onClose} />);
    fireEvent.change(screen.getByLabelText('Nome *'), {
      target: { value: 'Onboarding X' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar plano de integração' }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  test('Estrutura — item ONE_ON_ONE (Reuniões 1:1) desmarcado como opcional entra em `tasks`', async () => {
    render(<TemplateFormModal onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Nome *'), {
      target: { value: 'Onboarding Comercial' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar item' }));
    fireEvent.change(screen.getByLabelText('Título do item'), {
      target: { value: '1:1 com o gestor' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'dur-ONE_ON_ONE' }));
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Criar plano de integração' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith('/onboarding/templates', {
      name: 'Onboarding Comercial',
      durationDays: 30,
      tasks: [
        expect.objectContaining({
          title: '1:1 com o gestor',
          category: 'ONE_ON_ONE',
          type: 'MEETING',
          isMandatory: false,
        }),
      ],
    });
  });

  test('Estrutura — item sem desmarcar a checkbox fica isMandatory=true por defeito', async () => {
    render(<TemplateFormModal onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Nome *'), {
      target: { value: 'Onboarding Comercial' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar item' }));
    fireEvent.change(screen.getByLabelText('Título do item'), {
      target: { value: 'Formação de compliance' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'dur-TRAINING' }));
    fireEvent.click(screen.getByRole('button', { name: 'Criar plano de integração' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith(
      '/onboarding/templates',
      expect.objectContaining({
        tasks: [expect.objectContaining({ category: 'TRAINING', isMandatory: true })],
      }),
    );
  });
});

describe('TemplateFormModal — editar', () => {
  test('pré-preenche os campos e mostra "Editar template" / "Guardar"', () => {
    render(<TemplateFormModal template={template} onClose={vi.fn()} />);
    expect(screen.getByText('Editar template')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome *')).toHaveValue('Onboarding TI');
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument();
  });

  test('Guardar envia PUT /onboarding/templates/:id com o corpo completo', async () => {
    render(<TemplateFormModal template={template} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    expect(put).toHaveBeenCalledWith('/onboarding/templates/9', {
      name: 'Onboarding TI',
      durationDays: 30,
      description: 'Plano TI',
      objective: null,
      company: null,
      location: null,
      departmentId: null,
      positionId: null,
      unitId: null,
      welcomeVideoUrl: null,
      active: true,
    });
    expect(post).not.toHaveBeenCalled();
  });

  test('desligar "Template activo" arquiva (active:false)', async () => {
    render(<TemplateFormModal template={template} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Template activo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    expect(put).toHaveBeenCalledWith(
      '/onboarding/templates/9',
      expect.objectContaining({ active: false }),
    );
  });
});
