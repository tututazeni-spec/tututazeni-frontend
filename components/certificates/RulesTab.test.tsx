import { describe, expect, test, vi, beforeEach } from 'vitest';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { RulesTab } from './RulesTab';
import type { CertificateRuleView, TemplateSummaryRow } from './types';

const NAMES = [
  ['tpl-1-corporativo-classico', 'Corporativo clássico'],
  ['tpl-2-moderno-minimalista', 'Moderno minimalista'],
  ['tpl-3-executivo-premium', 'Executivo premium'],
  ['tpl-4-institucional-formal', 'Institucional formal'],
  ['tpl-5-tecnologico', 'Tecnológico contemporâneo'],
  ['tpl-6-elegante-geometrico', 'Elegante com elementos geométricos'],
  ['tpl-7-academico-tradicional', 'Académico tradicional'],
  ['tpl-8-faixa-lateral', 'Moderno com faixa lateral'],
  ['tpl-9-premium-moldura', 'Premium com moldura e destaque'],
];
const templates: TemplateSummaryRow[] = NAMES.map(([id, name]) => ({
  id,
  name,
  description: null,
  layoutKey: 'x',
  currentVersion: 1,
  colors: {
    primary: '#000000',
    accent: '#000000',
    text: '#000000',
    background: '#FFFFFF',
  },
  updatedAt: '2026-10-20T00:00:00.000Z',
}));

const rule = (
  over: Partial<CertificateRuleView> = {},
): CertificateRuleView => ({
  id: 1,
  activityKind: 'COURSE',
  activityId: 10,
  activityTitle: 'Segurança',
  mode: 'AUTOMATIC',
  criteria: { requireFullCompletion: true },
  validityDays: null,
  templateId: null,
  active: true,
  updatedAt: '2026-10-20T00:00:00.000Z',
  ...over,
});

let rules: CertificateRuleView[] = [];
const put = vi.fn();
vi.mock('@/lib/apiClient', () => ({
  apiClient: { put: (...a: unknown[]) => put(...a) },
}));
vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: (_k: unknown, path: string) => {
    if (path === '/certificates/rules')
      return { data: rules, isLoading: false, error: null };
    if (path === '/certificates/templates')
      return { data: templates, isLoading: false, error: null };
    return {
      data: { data: [{ id: 10, title: 'Segurança no Trabalho' }] },
      isLoading: false,
      error: null,
    };
  },
  useApiMutation: (
    fn: (v: unknown) => Promise<unknown>,
    opts: {
      onSuccess?: (d: unknown, v: unknown) => void;
      onError?: (e: Error) => void;
    },
  ) => ({
    mutate: (v: unknown) =>
      fn(v).then(
        (d) => opts?.onSuccess?.(d, v),
        (e) => opts?.onError?.(e as Error),
      ),
    isPending: false,
  }),
}));
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => vi.fn() }));
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
          {it.label}
        </button>
      ))}
    </div>
  ),
}));

const sentBody = () => put.mock.calls[0][1] as Record<string, unknown>;

describe('RulesTab — modelo de certificado', () => {
  beforeEach(() => {
    put.mockReset();
    put.mockResolvedValue({});
    rules = [];
  });

  test('a lista mostra o nome do modelo (e o clássico quando não há escolha), nunca o id', () => {
    rules = [
      rule({ id: 1, templateId: 'tpl-3-executivo-premium' }),
      rule({
        id: 2,
        activityId: 11,
        activityTitle: 'Liderança',
        templateId: null,
      }),
    ];
    render(<RulesTab canEdit />);
    expect(screen.getByText(/Modelo: Executivo premium/)).toBeInTheDocument();
    expect(
      screen.getByText(/Modelo: Corporativo clássico/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/tpl-/)).not.toBeInTheDocument();
  });

  test('o formulário oferece os nove modelos e envia o escolhido', async () => {
    render(<RulesTab canEdit />);
    fireEvent.click(screen.getByRole('button', { name: /Nova regra/ }));
    const dialog = await screen.findByRole('dialog');
    for (const [, name] of NAMES) {
      expect(within(dialog).getByRole('button', { name })).toBeInTheDocument();
    }
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Segurança no Trabalho' }),
    );
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Académico tradicional' }),
    );
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Guardar regra' }),
    );
    await waitFor(() => expect(put).toHaveBeenCalled());
    expect(put).toHaveBeenCalledWith('/certificates/rules', expect.anything());
    expect(sentBody().templateId).toBe('tpl-7-academico-tradicional');
    expect(sentBody().activityId).toBe(10);
  });

  test('sem escolher modelo não envia templateId (fica o clássico)', async () => {
    render(<RulesTab canEdit />);
    fireEvent.click(screen.getByRole('button', { name: /Nova regra/ }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Segurança no Trabalho' }),
    );
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Guardar regra' }),
    );
    await waitFor(() => expect(put).toHaveBeenCalled());
    expect(sentBody()).not.toHaveProperty('templateId');
  });

  test('editar uma regra mantém o seu modelo se nada for alterado', async () => {
    rules = [rule({ templateId: 'tpl-3-executivo-premium' })];
    render(<RulesTab canEdit />);
    fireEvent.click(screen.getByRole('button', { name: /Editar/ }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Guardar regra' }),
    );
    await waitFor(() => expect(put).toHaveBeenCalled());
    expect(sentBody().templateId).toBe('tpl-3-executivo-premium');
  });

  test('editar uma regra permite trocar para outro modelo, incluindo o clássico', async () => {
    rules = [rule({ templateId: 'tpl-3-executivo-premium' })];
    render(<RulesTab canEdit />);
    fireEvent.click(screen.getByRole('button', { name: /Editar/ }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Corporativo clássico' }),
    );
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Guardar regra' }),
    );
    await waitFor(() => expect(put).toHaveBeenCalled());
    expect(sentBody().templateId).toBe('tpl-1-corporativo-classico');
  });

  test('erro do servidor sobre o modelo aparece no formulário', async () => {
    put.mockRejectedValue(new Error('Modelo de certificado não encontrado'));
    render(<RulesTab canEdit />);
    fireEvent.click(screen.getByRole('button', { name: /Nova regra/ }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Segurança no Trabalho' }),
    );
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Guardar regra' }),
    );
    expect(
      await screen.findByText('Modelo de certificado não encontrado'),
    ).toBeInTheDocument();
  });

  test('quem não pode editar não vê "Nova regra" nem "Editar"', () => {
    rules = [rule()];
    render(<RulesTab canEdit={false} />);
    expect(
      screen.queryByRole('button', { name: /Nova regra/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Editar/ }),
    ).not.toBeInTheDocument();
  });
});
