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

// O Select real é Radix (não é um <select> nativo) — troca-se por um nativo.
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
      aria-label="Tipo de documento *"
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

vi.mock('@/providers/ToastProvider', () => ({ useToast: () => vi.fn() }));

import { OnboardingDocUploadForm } from './OnboardingDocUploadForm';

beforeEach(() => post.mockReset().mockResolvedValue({ id: 1 }));

async function attachPdf(name = 'bi.pdf') {
  const file = new File(['%PDF-1.4'], name, { type: 'application/pdf' });
  fireEvent.change(screen.getByLabelText('Documento (PDF) *'), {
    target: { files: [file] },
  });
  expect(await screen.findByText(name)).toBeInTheDocument();
}

async function fill() {
  fireEvent.change(screen.getByLabelText('Tipo de documento *'), {
    target: { value: 'Cópia do BI' },
  });
  await attachPdf();
}

describe('OnboardingDocUploadForm', () => {
  test('botão desactivado sem tipo + PDF', () => {
    render(<OnboardingDocUploadForm planId={7} onUploaded={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: 'Submeter documento' }),
    ).toBeDisabled();
  });

  test('submete POST /onboarding/documents com os campos trimmed', async () => {
    const onUploaded = vi.fn();
    render(<OnboardingDocUploadForm planId={7} onUploaded={onUploaded} />);
    await fill();
    fireEvent.change(screen.getByLabelText('Notas'), {
      target: { value: '  entregue em mão  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submeter documento' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith('/onboarding/documents', {
      planId: 7,
      documentType: 'Cópia do BI',
      fileUrl: expect.stringMatching(/^data:application\/pdf;base64,/),
      notes: 'entregue em mão',
    });
    await waitFor(() => expect(onUploaded).toHaveBeenCalledTimes(1));
  });

  test('erro da API é mostrado', async () => {
    post.mockRejectedValueOnce(new Error('fileUrl deve usar HTTPS'));
    render(<OnboardingDocUploadForm planId={7} onUploaded={vi.fn()} />);
    await fill();
    fireEvent.click(screen.getByRole('button', { name: 'Submeter documento' }));

    expect(
      await screen.findByText('fileUrl deve usar HTTPS'),
    ).toBeInTheDocument();
  });

  test('"Outro…" mostra o campo de texto e envia o tipo trimmed', async () => {
    render(<OnboardingDocUploadForm planId={7} onUploaded={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Tipo de documento *'), {
      target: { value: '__other__' },
    });
    fireEvent.change(
      screen.getByLabelText('Tipo de documento *', { selector: 'input' }),
      {
        target: { value: '  Carta de condução  ' },
      },
    );
    await attachPdf('cc.pdf');
    fireEvent.click(screen.getByRole('button', { name: 'Submeter documento' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post.mock.calls[0][1]).toMatchObject({
      documentType: 'Carta de condução',
    });
  });

  test('PDF carregado é enviado como data URL', async () => {
    render(<OnboardingDocUploadForm planId={7} onUploaded={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Tipo de documento *'), {
      target: { value: 'NIB / IBAN' },
    });
    await attachPdf('nib.pdf');
    fireEvent.click(screen.getByRole('button', { name: 'Submeter documento' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const body = post.mock.calls[0][1] as { fileUrl: string };
    expect(body.fileUrl).toMatch(/^data:application\/pdf;base64,/);
  });

  test('recusa PDF acima de 3 MB e ficheiro que não é PDF', async () => {
    render(<OnboardingDocUploadForm planId={7} onUploaded={vi.fn()} />);
    const input = screen.getByLabelText('Documento (PDF) *');

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
