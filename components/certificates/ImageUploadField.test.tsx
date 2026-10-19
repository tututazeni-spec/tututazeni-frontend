import { describe, expect, test, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ImageUploadField } from './ImageUploadField';

const post = vi.fn();
vi.mock('@/lib/apiClient', () => ({
  apiClient: { post: (...args: unknown[]) => post(...args) },
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
      fn(v).then(
        (d) => opts?.onSuccess?.(d, v),
        (e) => opts?.onError?.(e as Error),
      ),
    isPending: false,
  }),
}));

const file = (name: string, type: string, bytes = 100) =>
  new File([new Uint8Array(bytes)], name, { type });

function setup(over: Partial<Parameters<typeof ImageUploadField>[0]> = {}) {
  const onChange = vi.fn();
  render(
    <ImageUploadField
      kind="LOGO"
      label="Logótipo"
      onChange={onChange}
      {...over}
    />,
  );
  const input = screen.getByLabelText('Logótipo') as HTMLInputElement;
  const pick = (f: File) => fireEvent.change(input, { target: { files: [f] } });
  return { onChange, pick };
}

describe('ImageUploadField', () => {
  beforeEach(() => {
    post.mockReset();
  });

  test.each([
    [
      'SVG',
      file('a.svg', 'image/svg+xml'),
      'Só são aceites imagens PNG ou JPEG.',
    ],
    ['GIF', file('a.gif', 'image/gif'), 'Só são aceites imagens PNG ou JPEG.'],
    [
      'PDF',
      file('a.pdf', 'application/pdf'),
      'Só são aceites imagens PNG ou JPEG.',
    ],
    [
      'PNG de 3 MB',
      file('big.png', 'image/png', 3 * 1024 * 1024),
      'A imagem excede 2 MB.',
    ],
  ])('rejeita %s sem chamar a API', async (_n, f, msg) => {
    const { pick, onChange } = setup();
    pick(f);
    expect(await screen.findByText(msg)).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  test('PNG pequeno é enviado com o tipo certo e devolve o id da imagem', async () => {
    post.mockResolvedValue({ id: 'asset12345678' });
    const { pick, onChange } = setup({ kind: 'SIGNATURE', label: 'Logótipo' });
    pick(file('logo.png', 'image/png', 200));
    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post).toHaveBeenCalledWith(
      '/certificates/assets',
      expect.objectContaining({
        kind: 'SIGNATURE',
        file: expect.stringMatching(/^data:image\/png;base64,/),
      }),
    );
    await waitFor(() => expect(onChange).toHaveBeenCalledWith('asset12345678'));
  });

  test('mostra o erro devolvido pelo servidor', async () => {
    post.mockRejectedValue(new Error('PNG truncado ou corrompido.'));
    const { pick, onChange } = setup();
    pick(file('x.png', 'image/png'));
    expect(
      await screen.findByText('PNG truncado ou corrompido.'),
    ).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  test('com imagem guardada mostra a miniatura e permite remover', () => {
    const { onChange } = setup({ value: 'asset12345678' });
    const img = screen.getByRole('img') as HTMLImageElement;
    expect(img.src).toContain('/certificates/assets/asset12345678');
    fireEvent.click(screen.getByRole('button', { name: 'Remover' }));
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  test('sem imagem não mostra miniatura nem "Remover"', () => {
    setup();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Remover' }),
    ).not.toBeInTheDocument();
  });

  test('mostra a nota informativa quando existe', () => {
    setup({
      note: 'Imagem da assinatura — não é uma assinatura digital criptográfica.',
    });
    expect(
      screen.getByText(/não é uma assinatura digital/),
    ).toBeInTheDocument();
  });
});
