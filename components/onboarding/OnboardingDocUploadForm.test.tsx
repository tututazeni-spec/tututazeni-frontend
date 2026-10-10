import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const post = vi.fn().mockResolvedValue({ id: 1 });
vi.mock('@/lib/apiClient', () => ({
  apiClient: { post: (...a: unknown[]) => post(...a) },
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
}));

vi.mock('@/providers/ToastProvider', () => ({ useToast: () => vi.fn() }));

import { OnboardingDocUploadForm } from './OnboardingDocUploadForm';

beforeEach(() => post.mockReset().mockResolvedValue({ id: 1 }));

function fill() {
  fireEvent.change(screen.getByLabelText('Tipo de documento *'), {
    target: { value: '  Cópia do BI  ' },
  });
  fireEvent.change(screen.getByLabelText('Link do documento *'), {
    target: { value: '  https://drive.example/bi  ' },
  });
}

describe('OnboardingDocUploadForm', () => {
  test('botão desactivado sem tipo + link', () => {
    render(<OnboardingDocUploadForm planId={7} onUploaded={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: 'Submeter documento' }),
    ).toBeDisabled();
  });

  test('submete POST /onboarding/documents com os campos trimmed', async () => {
    const onUploaded = vi.fn();
    render(<OnboardingDocUploadForm planId={7} onUploaded={onUploaded} />);
    fill();
    fireEvent.change(screen.getByLabelText('Notas'), {
      target: { value: '  entregue em mão  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submeter documento' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith('/onboarding/documents', {
      planId: 7,
      documentType: 'Cópia do BI',
      fileUrl: 'https://drive.example/bi',
      notes: 'entregue em mão',
    });
    await waitFor(() => expect(onUploaded).toHaveBeenCalledTimes(1));
  });

  test('erro da API é mostrado', async () => {
    post.mockRejectedValueOnce(new Error('fileUrl deve usar HTTPS'));
    render(<OnboardingDocUploadForm planId={7} onUploaded={vi.fn()} />);
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Submeter documento' }));

    expect(
      await screen.findByText('fileUrl deve usar HTTPS'),
    ).toBeInTheDocument();
  });

  test('PDF carregado é enviado como data URL no lugar do link', async () => {
    render(<OnboardingDocUploadForm planId={7} onUploaded={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Tipo de documento *'), {
      target: { value: 'NIB' },
    });
    const file = new File(['%PDF-1.4'], 'nib.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByLabelText('Ou carregar documento (PDF)'), {
      target: { files: [file] },
    });
    expect(await screen.findByText('nib.pdf')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Submeter documento' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const body = post.mock.calls[0][1] as { fileUrl: string };
    expect(body.fileUrl).toMatch(/^data:application\/pdf;base64,/);
  });

  test('recusa PDF acima de 3 MB e ficheiro que não é PDF', async () => {
    render(<OnboardingDocUploadForm planId={7} onUploaded={vi.fn()} />);
    const input = screen.getByLabelText('Ou carregar documento (PDF)');

    const big = new File(['x'], 'grande.pdf', { type: 'application/pdf' });
    Object.defineProperty(big, 'size', { value: 3 * 1024 * 1024 + 1 });
    fireEvent.change(input, { target: { files: [big] } });
    expect(await screen.findByText(/máx\. 3 MB/)).toBeInTheDocument();

    const txt = new File(['x'], 'a.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [txt] } });
    expect(
      await screen.findByText('O ficheiro tem de ser um PDF.'),
    ).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });
});
