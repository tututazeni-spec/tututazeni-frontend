// components/login/LoginView.test.tsx
// Passo do código por email (instrutor externo): só aparece quando o servidor o pede.
import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LoginView } from './LoginView';

function props(over: Record<string, unknown> = {}) {
  return {
    email: 'ext@x.com',
    setEmail: vi.fn(),
    password: 'Segura@1234',
    setPassword: vi.fn(),
    showPass: false,
    setShowPass: vi.fn(),
    error: null,
    notice: null,
    loading: false,
    handleSubmit: vi.fn((e: { preventDefault: () => void }) => e.preventDefault()),
    needsCode: false,
    codePurpose: 'LOGIN' as const,
    emailCode: '',
    setEmailCode: vi.fn(),
    cancelCode: vi.fn(),
    requestNewCode: vi.fn(),
    codeNotice: null,
    sso: undefined,
    startSsoLogin: vi.fn(),
    ldapEmail: '',
    setLdapEmail: vi.fn(),
    ldapPassword: '',
    setLdapPassword: vi.fn(),
    ldapLoading: false,
    ldapError: null,
    handleLdapSubmit: vi.fn(),
    ...over,
  };
}

describe('LoginView — passo do código por email', () => {
  test('sem needsCode não mostra o campo do código', () => {
    render(<LoginView {...props()} />);
    expect(screen.queryByLabelText(/código enviado por e-mail/i)).toBeNull();
  });

  test('com needsCode mostra o campo, o aviso de dispositivo novo e esconde "Esqueci a senha"', () => {
    render(<LoginView {...props({ needsCode: true, codePurpose: 'NEW_DEVICE' })} />);
    expect(screen.getByLabelText(/código enviado por e-mail/i)).toBeTruthy();
    expect(screen.getByText(/dispositivo novo/i)).toBeTruthy();
    expect(screen.queryByText(/esqueci a senha/i)).toBeNull();
  });

  test('só aceita dígitos no código', () => {
    const setEmailCode = vi.fn();
    render(<LoginView {...props({ needsCode: true, setEmailCode })} />);
    fireEvent.change(screen.getByLabelText(/código enviado por e-mail/i), {
      target: { value: '12a3-4' },
    });
    expect(setEmailCode).toHaveBeenCalledWith('1234');
  });

  test('"Enviar novo código" e "Voltar" chamam as ações do hook', () => {
    const requestNewCode = vi.fn();
    const cancelCode = vi.fn();
    render(<LoginView {...props({ needsCode: true, requestNewCode, cancelCode })} />);
    fireEvent.click(screen.getByRole('button', { name: /enviar novo código/i }));
    fireEvent.click(screen.getByRole('button', { name: /voltar/i }));
    expect(requestNewCode).toHaveBeenCalledTimes(1);
    expect(cancelCode).toHaveBeenCalledTimes(1);
  });

  test('mostra a confirmação de que foi enviado um novo código', () => {
    render(
      <LoginView {...props({ needsCode: true, codeNotice: 'Enviámos um novo código.' })} />,
    );
    expect(screen.getByText('Enviámos um novo código.')).toBeTruthy();
  });
});
