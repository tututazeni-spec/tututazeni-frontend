import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const notify = vi.fn();
const post = vi.fn();

vi.mock('@/providers/ToastProvider', () => ({
  useToast: () => notify,
}));

vi.mock('@/lib/apiClient', () => ({
  apiClient: { post: (...a: unknown[]) => post(...a) },
}));

vi.mock('@/hooks/useApiQuery', () => ({
  useApiMutation: (fn: (v: unknown) => Promise<unknown>) => ({
    mutate: (
      v: unknown,
      opts?: {
        onSuccess?: (d: unknown) => void;
        onError?: (e: unknown) => void;
      },
    ) =>
      Promise.resolve(fn(v)).then(
        (d) => opts?.onSuccess?.(d),
        (e) => opts?.onError?.(e),
      ),
    isPending: false,
  }),
}));

vi.mock('@/components/ui/Modal', () => ({
  Modal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ModalContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

import { NewIntegrationModal as ScalabilityModal } from './NewIntegrationModal';
import { NewIntegrationModal as ApiIntegrationsModal } from '../api-integrations/NewIntegrationModal';

beforeEach(() => {
  notify.mockReset();
  post.mockReset();
  post.mockResolvedValue({});
});

describe.each([
  {
    name: 'scalability',
    endpoint: '/scalability/integrations',
    requiresBaseUrl: false,
    render: (onClose: () => void) =>
      render(<ScalabilityModal tenantId="t-1" onClose={onClose} />),
  },
  {
    name: 'api-integrations',
    endpoint: '/api-integrations',
    requiresBaseUrl: true,
    render: (onClose: () => void) =>
      render(<ApiIntegrationsModal onClose={onClose} />),
  },
])(
  'NewIntegrationModal ($name)',
  ({ endpoint, requiresBaseUrl, render: renderModal }) => {
    test('o botão de criar só fica activo com os campos obrigatórios', () => {
      renderModal(vi.fn());
      const submit = screen.getByRole('button', { name: 'Criar Integração' });
      expect(submit).toBeDisabled();
      fireEvent.change(screen.getByLabelText('Nome da integração'), {
        target: { value: 'SAP' },
      });
      if (requiresBaseUrl) {
        expect(submit).toBeDisabled();
        fireEvent.change(screen.getByLabelText('URL/Endpoint'), {
          target: { value: 'https://api.exemplo.com' },
        });
      }
      expect(submit).toBeEnabled();
    });

    test('campos editados e valores por omissão chegam ao payload', async () => {
      const onClose = vi.fn();
      renderModal(onClose);

      fireEvent.change(screen.getByLabelText('Nome da integração'), {
        target: { value: '  SAP SuccessFactors ' },
      });
      fireEvent.change(screen.getByLabelText('URL/Endpoint'), {
        target: { value: 'https://api.exemplo.com/v1' },
      });
      fireEvent.change(screen.getByLabelText('Timeout (ms)'), {
        target: { value: '7000' },
      });
      fireEvent.change(screen.getByLabelText('Dados a sincronizar'), {
        target: { value: 'users, courses' },
      });
      fireEvent.change(screen.getByLabelText('Campo de origem'), {
        target: { value: 'email' },
      });
      fireEvent.change(screen.getByLabelText('Campo de destino'), {
        target: { value: 'mail' },
      });

      fireEvent.click(screen.getByRole('button', { name: 'Criar Integração' }));

      await waitFor(() => expect(onClose).toHaveBeenCalled());
      expect(post).toHaveBeenCalledWith(
        endpoint,
        expect.objectContaining({
          name: 'SAP SuccessFactors',
          type: 'REST_API',
          baseUrl: 'https://api.exemplo.com/v1',
          authType: 'NONE',
          environment: 'PRODUCTION',
          dataFormat: 'JSON',
          syncFrequency: 'DAILY',
          dataToSync: ['users', 'courses'],
          fieldMapping: { email: 'mail' },
          timeoutMs: 7000,
          maxRetries: 3,
          retryIntervalMs: 1000,
          status: 'CONFIGURING',
          active: false,
        }),
      );
    });

    test('adicionar e remover linhas de mapeamento', () => {
      renderModal(vi.fn());
      expect(screen.getAllByLabelText('Campo de origem')).toHaveLength(1);

      fireEvent.click(screen.getByRole('button', { name: /Adicionar campo/ }));
      expect(screen.getAllByLabelText('Campo de origem')).toHaveLength(2);

      fireEvent.change(screen.getAllByLabelText('Campo de origem')[1], {
        target: { value: 'b' },
      });
      fireEvent.click(
        screen.getAllByRole('button', { name: 'Remover linha' })[0],
      );
      const rows = screen.getAllByLabelText('Campo de origem');
      expect(rows).toHaveLength(1);
      expect(rows[0]).toHaveValue('b');
    });
  },
);
