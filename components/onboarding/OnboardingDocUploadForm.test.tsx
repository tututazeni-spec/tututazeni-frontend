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
});
