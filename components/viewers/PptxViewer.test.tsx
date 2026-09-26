import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PptxViewer } from './PptxViewer';

const destroy = vi.fn();
const preview = vi.fn().mockResolvedValue(undefined);
const init = vi.fn((..._args: unknown[]) => ({ preview, destroy }));

vi.mock('pptx-preview', () => ({
  init: (...args: unknown[]) => init(...args),
}));

let fetchOk = true;

beforeEach(() => {
  fetchOk = true;
  init.mockClear();
  preview.mockClear();
  destroy.mockClear();
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      fetchOk
        ? Promise.resolve({
            ok: true,
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
          })
        : Promise.resolve({ ok: false }),
    ),
  );
});

describe('PptxViewer', () => {
  test('inicializa o previsualizador com o ficheiro carregado', async () => {
    render(<PptxViewer src="blob:mock" title="Slides da aula" />);
    expect(screen.getByText(/a abrir apresentação/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(preview).toHaveBeenCalledTimes(1);
    });
    expect(init).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ mode: 'slide' }),
    );
  });

  test('mostra aviso de erro quando o fetch falha', async () => {
    fetchOk = false;
    render(<PptxViewer src="blob:mock" title="Slides da aula" />);

    await waitFor(() => {
      expect(
        screen.getByText(/não foi possível abrir esta apresentação/i),
      ).toBeInTheDocument();
    });
  });
});
