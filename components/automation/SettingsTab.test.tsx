import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SettingsTab } from './SettingsTab';

const put = vi.fn().mockResolvedValue({});
let role = 'ADMIN';

vi.mock('@/lib/apiClient', () => ({
  apiClient: { put: (...a: unknown[]) => put(...a), get: vi.fn() },
}));

const settings = {
  maxExecutionsPerMinute: 120,
  maxConcurrentPerRule: 5,
  maxEventDepth: 5,
  requireApprovalCritical: true,
  failureAlertThreshold: 5,
  failureAlertWindowMinutes: 60,
  archiveAfterDays: 90,
  retentionDays: 365,
  deadLetterRetentionDays: 180,
  auditRetentionDays: 730,
  updatedAt: null,
  updatedBy: null,
};

vi.mock('@/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ data: { role: { name: role } }, isLoading: false }),
}));
vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: () => ({ data: settings, isLoading: false }),
  useApiMutation: (
    fn: (v: unknown) => Promise<unknown>,
    opts: { onSuccess?: (d: unknown, v: unknown) => void },
  ) => ({
    mutate: (v: unknown) => fn(v).then((d) => opts?.onSuccess?.(d, v)),
    isPending: false,
  }),
}));
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => vi.fn() }));
vi.mock('@/providers/ConfirmProvider', () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true),
}));
vi.mock('./SettingsPermissions', () => ({ PermissionsPanel: () => <div /> }));
vi.mock('./SettingsSecurity', () => ({
  DeadLettersPanel: () => <div />,
  SecurityPanel: () => <div />,
}));

describe('SettingsTab', () => {
  beforeEach(() => {
    put.mockClear();
    role = 'ADMIN';
  });

  test('perfis que não são ADMIN não vêem as definições', () => {
    role = 'RH';
    render(<SettingsTab />);
    expect(screen.getByText('Apenas para administradores')).toBeTruthy();
  });

  test('guarda os limites como números', async () => {
    render(<SettingsTab />);
    fireEvent.change(screen.getByLabelText(/Execuções por minuto/), {
      target: { value: '200' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar definições' }));
    await waitFor(() => expect(put).toHaveBeenCalled());
    const [url, body] = put.mock.calls[0];
    expect(url).toBe('/automation/settings');
    expect(body.maxExecutionsPerMinute).toBe(200);
    expect(body.requireApprovalCritical).toBe(true);
  });

  test('bloqueia valores fora do intervalo', () => {
    render(<SettingsTab />);
    fireEvent.change(screen.getByLabelText(/Profundidade máxima/), {
      target: { value: '99' },
    });
    expect(
      (screen.getByRole('button', { name: 'Guardar definições' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });
});
