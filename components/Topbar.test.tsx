import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Topbar from './Topbar';

// ─── Mocks ────────────────────────────────────────────────────────────────────
// A Topbar só orquestra navegação: o sino leva a /notifications, a lupa
// (submit do formulário) leva a /search?q=…. Mockamos a camada de dados e a
// navegação para testar essa ligação sem rede nem router real.

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('@/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    data: {
      fullName: 'Ana Teste',
      email: 'ana@innova-test.com',
      avatarUrl: null,
    },
  }),
}));

let unreadCount = 0;
vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: () => ({ data: { count: unreadCount } }),
}));

vi.mock('@/components/ui/Avatar', () => ({
  Avatar: ({ name }: { name: string }) => (
    <div data-testid="avatar">{name}</div>
  ),
}));
vi.mock('@/components/ui/Modal', () => ({
  Modal: ({ children, open }: { children: unknown; open: boolean }) =>
    open ? <div>{children as never}</div> : null,
  ModalContent: ({ children }: { children: unknown }) => (
    <div>{children as never}</div>
  ),
}));
vi.mock('@/components/ui/AvatarUploader', () => ({
  AvatarUploader: () => <div data-testid="avatar-uploader" />,
}));

beforeEach(() => {
  push.mockClear();
  unreadCount = 0;
});

describe('Topbar', () => {
  test('clicar no sino navega para /notifications', () => {
    render(<Topbar />);
    fireEvent.click(screen.getByRole('button', { name: 'Notificações' }));
    expect(push).toHaveBeenCalledWith('/notifications');
  });

  test('o indicador de não lidas só aparece quando count > 0', () => {
    const { rerender } = render(<Topbar />);
    expect(screen.queryByTestId('unread-indicator')).not.toBeInTheDocument();

    unreadCount = 4;
    rerender(<Topbar />);
    expect(screen.getByTestId('unread-indicator')).toBeInTheDocument();
  });

  test('submeter a pesquisa pela lupa navega para /search com a query', () => {
    render(<Topbar />);
    fireEvent.change(screen.getByPlaceholderText('Pesquisar...'), {
      target: { value: 'onboarding' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Pesquisar' }));
    expect(push).toHaveBeenCalledWith('/search?q=onboarding');
  });

  test('pesquisa em branco não navega', () => {
    render(<Topbar />);
    fireEvent.change(screen.getByPlaceholderText('Pesquisar...'), {
      target: { value: '   ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Pesquisar' }));
    expect(push).not.toHaveBeenCalled();
  });

  test('a query é codificada para o URL', () => {
    render(<Topbar />);
    fireEvent.change(screen.getByPlaceholderText('Pesquisar...'), {
      target: { value: 'plano & férias' },
    });
    fireEvent.submit(screen.getByRole('search'));
    expect(push).toHaveBeenCalledWith('/search?q=plano%20%26%20f%C3%A9rias');
  });
});
