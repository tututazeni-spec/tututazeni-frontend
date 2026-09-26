import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PdfViewer } from './PdfViewer';

function makePage() {
  return {
    getViewport: () => ({ width: 100, height: 200 }),
    render: () => ({ promise: Promise.resolve() }),
  };
}

const destroy = vi.fn().mockResolvedValue(undefined);
const getPage = vi.fn((_n: number) => Promise.resolve(makePage()));
let numPages = 1;
let shouldFail = false;

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {},
  getDocument: () => ({
    promise: shouldFail
      ? Promise.reject(new Error('boom'))
      : Promise.resolve({ numPages, getPage, destroy }),
  }),
}));

describe('PdfViewer', () => {
  beforeEach(() => {
    shouldFail = false;
    numPages = 1;
    getPage.mockClear();
    destroy.mockClear();
  });

  test('mostra o canvas depois de o documento carregar', async () => {
    render(<PdfViewer src="blob:mock" title="Manual em PDF" />);
    expect(screen.getByText(/a abrir pdf/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(document.querySelector('canvas')).not.toHaveClass('hidden');
    });
    expect(getPage).toHaveBeenCalledWith(1);
  });

  test('mostra aviso de erro se o documento não carrega', async () => {
    shouldFail = true;
    render(<PdfViewer src="blob:mock" title="Manual em PDF" />);

    await waitFor(() => {
      expect(screen.getByText(/não foi possível abrir este pdf/i)).toBeInTheDocument();
    });
  });

  test('a paginação avança e recua entre páginas', async () => {
    numPages = 3;
    render(<PdfViewer src="blob:mock" title="Manual em PDF" />);

    await waitFor(() => {
      expect(screen.getByText('Página 1 de 3')).toBeInTheDocument();
    });

    screen.getByRole('button', { name: 'Página seguinte' }).click();

    await waitFor(() => {
      expect(getPage).toHaveBeenCalledWith(2);
    });
  });
});
