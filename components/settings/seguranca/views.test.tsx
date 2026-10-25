// As vistas de Segurança renderizam só com props: sem QueryClient, sem
// apiClient e sem ConfirmProvider.

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AllSessionsCardView } from './AllSessionsCardView';
import { LockedUsersCardView } from './LockedUsersCardView';
import { SecurityPolicyCardView } from './SecurityPolicyCardView';
import { TwoFactorCardView } from './TwoFactorCardView';
import type { LockedUsersController } from '@/hooks/useLockedUsers';
import type { OrgSessionsController } from '@/hooks/useSecuritySessions';
import type { SecurityPolicyController } from '@/hooks/useSecurityPolicy';
import type { TwoFactorController } from '@/hooks/useTwoFactor';

const as = <T,>(v: unknown) => v as T;

describe('LockedUsersCardView', () => {
  const user = {
    id: 7,
    fullName: 'Ana Silva',
    email: 'ana@x.ao',
    lockedUntil: null,
  };

  it('«Desbloquear» pede o desbloqueio do utilizador', () => {
    const requestUnlock = vi.fn();
    render(
      <LockedUsersCardView
        ctl={as<LockedUsersController>({
          isLoading: false,
          total: 1,
          items: [user],
          requestUnlock,
          unlocking: false,
        })}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Desbloquear' }));
    expect(requestUnlock).toHaveBeenCalledWith(user);
  });

  it('sem contas bloqueadas mostra o estado vazio', () => {
    render(
      <LockedUsersCardView
        ctl={as<LockedUsersController>({
          isLoading: false,
          total: 0,
          items: [],
          requestUnlock: vi.fn(),
          unlocking: false,
        })}
      />,
    );
    expect(screen.getByText('Nenhuma conta bloqueada.')).toBeTruthy();
  });
});

describe('AllSessionsCardView', () => {
  it('«Terminar todas» delega a confirmação ao controller', () => {
    const requestRevokeAll = vi.fn();
    const session = {
      id: 1,
      userId: 9,
      ip: '10.0.0.1',
      userAgent: null,
      createdAt: '2026-01-01T10:00:00Z',
      expiresAt: '2026-01-02T10:00:00Z',
      user: { fullName: 'Rui', email: 'rui@x.ao' },
    };
    render(
      <AllSessionsCardView
        ctl={as<OrgSessionsController>({
          isLoading: false,
          total: 1,
          items: [session],
          revoke: vi.fn(),
          requestRevokeAll,
          revoking: false,
          revokingAll: false,
        })}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Terminar todas' }));
    expect(requestRevokeAll).toHaveBeenCalledWith(session);
  });
});

describe('TwoFactorCardView', () => {
  const base = {
    isLoading: false,
    enabled: false,
    mode: undefined,
    setup: null,
    code: '',
    setCode: vi.fn(),
    codeComplete: false,
    startSetup: vi.fn(),
    cancelSetup: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
    pending: { setup: false, enable: false, disable: false },
  };

  it('não renderiza nada enquanto carrega', () => {
    const { container } = render(
      <TwoFactorCardView
        ctl={as<TwoFactorController>({ ...base, isLoading: true })}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('inativo: «Activar 2FA» inicia a configuração', () => {
    const startSetup = vi.fn();
    render(
      <TwoFactorCardView
        ctl={as<TwoFactorController>({ ...base, startSetup })}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Activar 2FA' }));
    expect(startSetup).toHaveBeenCalledTimes(1);
  });

  it('ativo: «Desactivar 2FA» só ativa com o código completo', () => {
    const disable = vi.fn();
    const { unmount } = render(
      <TwoFactorCardView
        ctl={as<TwoFactorController>({ ...base, enabled: true, disable })}
      />,
    );
    const btn = screen.getByRole('button', { name: 'Desactivar 2FA' });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
    unmount();

    render(
      <TwoFactorCardView
        ctl={as<TwoFactorController>({
          ...base,
          enabled: true,
          code: '123456',
          codeComplete: true,
          disable,
        })}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Desactivar 2FA' }));
    expect(disable).toHaveBeenCalledTimes(1);
  });
});

describe('SecurityPolicyCardView', () => {
  it('não renderiza até haver rascunho', () => {
    const { container } = render(
      <SecurityPolicyCardView
        ctl={as<SecurityPolicyController>({ ready: false, form: null })}
      />,
    );
    expect(container.firstChild).toBeNull();
  });
});
