import { describe, expect, test, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TemplateEditorModal } from './TemplateEditorModal';
import type { TemplateDetailDto } from './types';

const detail: TemplateDetailDto = {
  id: 'tpl-3-executivo-premium',
  name: 'Executivo premium',
  description: 'Fundo escuro',
  layoutKey: 'executivo-premium',
  currentVersion: 2,
  colors: {
    primary: '#C9A24B',
    accent: '#C9A24B',
    text: '#F5F1E6',
    background: '#0B1426',
  },
  updatedAt: '2026-10-20T00:00:00.000Z',
  config: {
    layoutKey: 'executivo-premium',
    colors: {
      primary: '#C9A24B',
      accent: '#C9A24B',
      text: '#F5F1E6',
      background: '#0B1426',
    },
    texts: {
      title: 'CERTIFICADO DE EXCELÊNCIA',
      recognition: 'Certificamos que',
      courseLine: 'concluiu com aproveitamento\n{{nome_curso}}',
      detailsLine:
        'Carga horária: {{carga_horaria}} · Emitido em {{data_emissao}}',
      footer: 'Código de verificação: {{codigo_certificado}}',
    },
    assets: {},
    signatory: {},
    options: {
      showQr: true,
      showCode: true,
      showHours: true,
      showValidity: true,
      showScore: true,
    },
    elements: {},
  },
  versions: [
    {
      version: 2,
      createdAt: '2026-10-21T10:00:00.000Z',
      createdByName: 'Rita RH',
      restoredFromVersion: null,
    },
    {
      version: 1,
      createdAt: '2026-10-20T10:00:00.000Z',
      createdByName: null,
      restoredFromVersion: null,
    },
  ],
};

const put = vi.fn();
const post = vi.fn();
vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    put: (...a: unknown[]) => put(...a),
    post: (...a: unknown[]) => post(...a),
  },
}));
vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: () => ({ data: detail, isLoading: false, error: null }),
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
const toast = vi.fn();
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => toast }));
vi.mock('./TemplatePreviewModal', () => ({
  TemplatePreviewModal: ({
    config,
  }: {
    config?: { texts: { title: string } };
  }) => <div>preview-title:{config?.texts.title}</div>,
}));
vi.mock('./ImageUploadField', () => ({
  ImageUploadField: ({
    label,
    onChange,
    value,
    note,
  }: {
    label: string;
    onChange: (id?: string) => void;
    value?: string;
    note?: string;
  }) => (
    <div>
      <span>{label}</span>
      {note && <p>{note}</p>}
      <span>valor:{value ?? 'nenhum'}</span>
      <button type="button" onClick={() => onChange('asset12345678')}>
        escolher {label}
      </button>
    </div>
  ),
}));

const open = (onClose = vi.fn(), canEdit = true) => {
  render(
    <TemplateEditorModal
      templateId={detail.id}
      canEdit={canEdit}
      onClose={onClose}
    />,
  );
  return onClose;
};
const tab = (name: string) =>
  fireEvent.click(screen.getByRole('tab', { name }));
const saveBtn = () =>
  screen.getByRole('button', { name: 'Guardar nova versão' });
const sent = () => put.mock.calls[0][1] as typeof detail.config;

describe('TemplateEditorModal', () => {
  beforeEach(() => {
    put.mockReset();
    put.mockResolvedValue({});
    toast.mockReset();
  });

  test('mostra os separadores e o título actual do modelo', () => {
    open();
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual([
      'Textos',
      'Cores',
      'Imagens',
      'Posição',
      'Versões',
    ]);
    expect(screen.getByLabelText('Título')).toHaveValue(
      'CERTIFICADO DE EXCELÊNCIA',
    );
    expect(screen.getByText(/Executivo premium/)).toBeInTheDocument();
  });

  test('título vazio bloqueia a gravação e explica porquê', () => {
    open();
    fireEvent.change(screen.getByLabelText('Título'), {
      target: { value: '   ' },
    });
    fireEvent.click(saveBtn());
    expect(put).not.toHaveBeenCalled();
    expect(
      screen.getByText('O título não pode estar vazio.'),
    ).toBeInTheDocument();
  });

  test('cor em formato inválido bloqueia a gravação', () => {
    open();
    tab('Cores');
    fireEvent.change(screen.getByLabelText('Cor principal (hexadecimal)'), {
      target: { value: 'red' },
    });
    fireEvent.click(saveBtn());
    expect(put).not.toHaveBeenCalled();
    expect(
      screen.getByText('A cor principal tem de ser no formato #RRGGBB.'),
    ).toBeInTheDocument();
  });

  test('texto com mais de 300 caracteres bloqueia a gravação', () => {
    open();
    fireEvent.change(screen.getByLabelText('Rodapé'), {
      target: { value: 'x'.repeat(301) },
    });
    fireEvent.click(saveBtn());
    expect(put).not.toHaveBeenCalled();
    expect(screen.getByText(/Rodapé.*300/)).toBeInTheDocument();
  });

  test('guardar envia a configuração alterada, fecha o editor e avisa', async () => {
    const onClose = open();
    fireEvent.change(screen.getByLabelText('Título'), {
      target: { value: 'NOVO TÍTULO' },
    });
    fireEvent.click(saveBtn());
    await waitFor(() => expect(put).toHaveBeenCalled());
    expect(put).toHaveBeenCalledWith(
      `/certificates/templates/${detail.id}`,
      expect.anything(),
    );
    expect(sent().texts.title).toBe('NOVO TÍTULO');
    expect(sent().layoutKey).toBe('executivo-premium');
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ intent: 'success' }),
    );
  });

  test('erro do servidor aparece no editor e não o fecha', async () => {
    put.mockRejectedValue(
      new Error('Variáveis desconhecidas no texto: inventada.'),
    );
    const onClose = open();
    fireEvent.click(saveBtn());
    expect(
      await screen.findByText(/Variáveis desconhecidas no texto: inventada/),
    ).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  test('Pré-visualizar usa a configuração ainda não guardada', () => {
    open();
    fireEvent.change(screen.getByLabelText('Título'), {
      target: { value: 'RASCUNHO' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Pré-visualizar' }));
    expect(screen.getByText('preview-title:RASCUNHO')).toBeInTheDocument();
    expect(put).not.toHaveBeenCalled();
  });

  test('os botões de variáveis inserem o campo no texto seleccionado', () => {
    open();
    const field = screen.getByLabelText(
      'Texto de reconhecimento',
    ) as HTMLTextAreaElement;
    fireEvent.focus(field);
    fireEvent.click(screen.getByRole('button', { name: /^Nome completo$/ }));
    expect(field.value).toContain('{{nome_completo}}');
    expect(field.value).toContain('Certificamos que');
  });

  test('responsável pela assinatura e opções entram na configuração', async () => {
    open();
    fireEvent.change(screen.getByLabelText('Nome do responsável'), {
      target: { value: 'Dr. Carlos Mendes' },
    });
    fireEvent.change(screen.getByLabelText('Cargo do responsável'), {
      target: { value: 'Director' },
    });
    fireEvent.click(screen.getByLabelText('Mostrar o QR Code de verificação'));
    fireEvent.click(saveBtn());
    await waitFor(() => expect(put).toHaveBeenCalled());
    expect(sent().signatory).toEqual({
      name: 'Dr. Carlos Mendes',
      title: 'Director',
    });
    expect(sent().options.showQr).toBe(false);
  });

  test('imagens escolhidas entram em assets', async () => {
    open();
    tab('Imagens');
    expect(screen.getAllByText('valor:nenhum')).toHaveLength(3);
    fireEvent.click(screen.getByRole('button', { name: 'escolher Logótipo' }));
    fireEvent.click(saveBtn());
    await waitFor(() => expect(put).toHaveBeenCalled());
    expect(sent().assets.logoId).toBe('asset12345678');
  });

  test('a nota da assinatura avisa que não é uma assinatura digital criptográfica', () => {
    open();
    tab('Imagens');
    expect(
      screen.getByText(/não é uma assinatura digital criptográfica/i),
    ).toBeInTheDocument();
  });

  test('posição: alinhamento, tamanho, deslocamento e visibilidade por elemento', async () => {
    open();
    tab('Posição');
    fireEvent.change(screen.getByLabelText('Alinhamento de Título'), {
      target: { value: 'left' },
    });
    fireEvent.change(screen.getByLabelText('Tamanho de Título'), {
      target: { value: '1.2' },
    });
    fireEvent.change(screen.getByLabelText('Deslocamento vertical de Título'), {
      target: { value: '5' },
    });
    fireEvent.click(screen.getByLabelText('Mostrar Código de verificação'));
    fireEvent.click(saveBtn());
    await waitFor(() => expect(put).toHaveBeenCalled());
    expect(sent().elements.title).toEqual({
      align: 'left',
      scale: 1.2,
      dy: 0.05,
    });
    expect(sent().elements.code).toEqual({ visible: false });
  });

  test('voltar ao alinhamento predefinido remove a personalização', async () => {
    open();
    tab('Posição');
    const align = screen.getByLabelText('Alinhamento de Título');
    fireEvent.change(align, { target: { value: 'left' } });
    fireEvent.change(align, { target: { value: '' } });
    fireEvent.click(saveBtn());
    await waitFor(() => expect(put).toHaveBeenCalled());
    expect(sent().elements.title).toBeUndefined();
  });

  test('versões: número, data e autor', () => {
    open();
    tab('Versões');
    expect(screen.getByText(/Versão 2 \(actual\)/)).toBeInTheDocument();
    expect(screen.getByText(/Rita RH/)).toBeInTheDocument();
    expect(screen.getByText('Versão 1')).toBeInTheDocument();
  });

  test('restaurar: só nas versões antigas, com confirmação, e chama o endpoint', async () => {
    post.mockResolvedValue({});
    const onClose = open();
    tab('Versões');
    expect(
      screen.queryByRole('button', { name: 'Restaurar versão 2' }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Restaurar versão 1' }));
    expect(
      screen.getByText(
        /Será criada uma nova versão com o conteúdo da versão 1/,
      ),
    ).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Restaurar' }));
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(
        `/certificates/templates/${detail.id}/versions/1/restore`,
        {},
      ),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  test('restaurar: sem permissão de edição não há botão', () => {
    open(vi.fn(), false);
    tab('Versões');
    expect(
      screen.queryByRole('button', { name: /Restaurar versão/ }),
    ).not.toBeInTheDocument();
  });

  test('nenhum identificador técnico aparece no ecrã', () => {
    open();
    expect(
      screen.queryByText(/executivo-premium|tpl-3|layoutKey/),
    ).not.toBeInTheDocument();
  });
});
