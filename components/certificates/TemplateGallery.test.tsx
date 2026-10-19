import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { TemplateGallery } from './TemplateGallery';
import type { TemplateSummaryRow } from './types';

const NAMES = [
  'Corporativo clássico',
  'Moderno minimalista',
  'Executivo premium',
  'Institucional formal',
  'Tecnológico contemporâneo',
  'Elegante com elementos geométricos',
  'Académico tradicional',
  'Moderno com faixa lateral',
  'Premium com moldura e destaque',
];
const KEYS = [
  'corporativo-classico',
  'moderno-minimalista',
  'executivo-premium',
  'institucional-formal',
  'tecnologico-contemporaneo',
  'elegante-geometrico',
  'academico-tradicional',
  'faixa-lateral',
  'premium-moldura',
];

const rows: TemplateSummaryRow[] = NAMES.map((name, i) => ({
  id: `tpl-${i + 1}-x`,
  name,
  description: `Descrição do modelo ${name}`,
  layoutKey: KEYS[i],
  currentVersion: i + 1,
  colors: {
    primary: '#0F1F3D',
    accent: '#B8860B',
    text: '#1F2937',
    background: '#FFFFFF',
  },
  updatedAt: '2026-10-20T00:00:00.000Z',
}));

vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: () => ({ data: rows, isLoading: false, error: null }),
}));
vi.mock('./TemplateEditorModal', () => ({
  TemplateEditorModal: ({ templateId }: { templateId: string }) => (
    <div>editor:{templateId}</div>
  ),
}));
vi.mock('./TemplatePreviewModal', () => ({
  TemplatePreviewModal: ({ templateId }: { templateId?: string }) => (
    <div>preview:{templateId}</div>
  ),
}));

describe('TemplateGallery', () => {
  test('mostra exactamente os 9 modelos, com nome, descrição e versão', () => {
    render(<TemplateGallery canEdit />);
    for (const name of NAMES)
      expect(screen.getByText(name)).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(9);
    expect(screen.getByText('Versão 3')).toBeInTheDocument();
    expect(
      screen.getByText('Descrição do modelo Executivo premium'),
    ).toBeInTheDocument();
  });

  test('nenhum identificador técnico aparece no ecrã', () => {
    render(<TemplateGallery canEdit />);
    for (const key of KEYS)
      expect(screen.queryByText(key)).not.toBeInTheDocument();
    expect(screen.queryByText(/tpl-\d/)).not.toBeInTheDocument();
  });

  test('"Editar" só aparece a quem pode editar; "Pré-visualizar" aparece sempre', () => {
    const { unmount } = render(<TemplateGallery canEdit={false} />);
    expect(
      screen.queryByRole('button', { name: /Editar/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: /Pré-visualizar/ }),
    ).toHaveLength(9);
    unmount();
    render(<TemplateGallery canEdit />);
    expect(screen.getAllByRole('button', { name: /Editar/ })).toHaveLength(9);
  });

  test('cada cartão mostra as cores do modelo', () => {
    render(<TemplateGallery canEdit />);
    const first = screen.getAllByRole('listitem')[0];
    expect(within(first).getAllByLabelText(/^Cor /).length).toBe(4);
  });

  test('Editar abre o editor do modelo certo e Pré-visualizar abre a pré-visualização', () => {
    render(<TemplateGallery canEdit />);
    const card = screen.getAllByRole('listitem')[2];
    fireEvent.click(within(card).getByRole('button', { name: /Editar/ }));
    expect(screen.getByText('editor:tpl-3-x')).toBeInTheDocument();
  });

  test('Pré-visualizar abre a pré-visualização do modelo certo', () => {
    render(<TemplateGallery canEdit={false} />);
    const card = screen.getAllByRole('listitem')[4];
    fireEvent.click(
      within(card).getByRole('button', { name: /Pré-visualizar/ }),
    );
    expect(screen.getByText('preview:tpl-5-x')).toBeInTheDocument();
  });
});
