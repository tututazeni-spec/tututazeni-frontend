// hooks/useLogin.ts
// Extraído de app/login/page.tsx — a página tinha o seu próprio mini
// cliente fetch (apiRequest) em vez de usar o apiClient canónico.

'use client';

import { useEffect, useState } from 'react';
import { apiClient, ApiError, API_URL } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';

// Definições §11 (Autenticação/SSO): opções públicas de login — sem sessão,
// por isso não pode depender de nada que exija o cookie já estar presente.
interface SsoLoginOptions {
  ssoEnabled: boolean;
  ssoProvider: 'GOOGLE' | 'MICROSOFT' | 'OIDC' | null;
  ldapEnabled: boolean;
  passwordLoginDisabled: boolean;
}

// Lido directamente de window.location.search (em vez de
// next/navigation#useSearchParams) para não obrigar esta página a uma
// fronteira <Suspense> só por causa de um aviso de sessão opcional.
function sessionExpiredNotice(): string | null {
  if (typeof window === 'undefined') return null;
  const reason = new URLSearchParams(window.location.search).get('reason');
  return reason === 'expired'
    ? 'A tua sessão expirou por inactividade. Inicia sessão novamente.'
    : null;
}

export function useLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Instrutor externo: depois da senha, o servidor pede um código enviado por email.
  const [needsCode, setNeedsCode] = useState(false);
  const [codePurpose, setCodePurpose] = useState<'LOGIN' | 'NEW_DEVICE'>('LOGIN');
  const [emailCode, setEmailCode] = useState('');
  const [codeNotice, setCodeNotice] = useState<string | null>(null);

  function cancelCode() {
    setNeedsCode(false);
    setEmailCode('');
    setError(null);
    setCodeNotice(null);
  }

  // Pede outro código: repete o login sem código. O servidor reaproveita o código vivo se o
  // último pedido foi há menos de 60 s; queimado ou expirado, envia um novo.
  async function requestNewCode() {
    setError(null);
    setCodeNotice(null);
    setLoading(true);
    try {
      await apiClient.post('/auth/login', { email, password });
    } catch (err) {
      const body = err instanceof ApiError ? (err.body as { code?: string } | undefined) : undefined;
      if (err instanceof ApiError && err.status === 401 && body?.code === 'EMAIL_CODE_REQUIRED') {
        setEmailCode('');
        setCodeNotice('Enviámos um código para o seu e-mail. Se acabou de pedir um, aguarde um minuto.');
      } else {
        reportError(err, { source: 'useLogin.requestNewCode' });
        setError(err instanceof Error ? err.message : 'Não foi possível enviar o código');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setNotice(sessionExpiredNotice());
  }, []);

  const sso = useApiQuery<SsoLoginOptions>(queryKeys.settings.ssoOptions(), '/auth/sso/options');

  function startSsoLogin() {
    window.location.href = `${API_URL}/auth/sso/login`;
  }

  const [ldapEmail, setLdapEmail] = useState('');
  const [ldapPassword, setLdapPassword] = useState('');
  const [ldapLoading, setLdapLoading] = useState(false);
  const [ldapError, setLdapError] = useState<string | null>(null);

  async function handleLdapSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLdapError(null);
    setLdapLoading(true);
    try {
      await apiClient.post('/auth/sso/ldap-login', { email: ldapEmail, password: ldapPassword });
      window.location.href = '/dashboard';
    } catch (err) {
      reportError(err, { source: 'useLogin.handleLdapSubmit' });
      setLdapError(err instanceof Error ? err.message : 'Erro ao entrar');
    } finally {
      setLdapLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // O backend define o cookie httpOnly 'token'; o JS nunca toca no token.
      const res = await apiClient.post<{ mustChangePassword?: boolean }>(
        '/auth/login',
        {
          email,
          password,
          ...(needsCode && emailCode ? { emailCode } : {}),
        },
      );
      // Navegação forçada para garantir que o middleware revê o cookie.
      // Conta convidada com password temporária (política de utilizadores):
      // vai directa ao separador Segurança para a trocar.
      window.location.href = res?.mustChangePassword
        ? '/settings?tab=seguranca&firstLogin=1'
        : '/dashboard';
    } catch (err) {
      const body = err instanceof ApiError ? (err.body as { code?: string; purpose?: string } | undefined) : undefined;
      if (err instanceof ApiError && err.status === 401 && body?.code === 'EMAIL_CODE_REQUIRED') {
        // Passo seguinte, não é um erro: mostra o campo do código.
        setCodePurpose(body.purpose === 'NEW_DEVICE' ? 'NEW_DEVICE' : 'LOGIN');
        setNeedsCode(true);
        setEmailCode('');
        return;
      }
      reportError(err, { source: 'useLogin.handleSubmit' });
      setError(err instanceof Error ? err.message : 'Erro ao entrar');
    } finally {
      setLoading(false);
    }
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    showPass,
    setShowPass,
    error,
    notice,
    loading,
    handleSubmit,
    needsCode,
    codePurpose,
    emailCode,
    setEmailCode,
    cancelCode,
    requestNewCode,
    codeNotice,
    sso: sso.data,
    startSsoLogin,
    ldapEmail,
    setLdapEmail,
    ldapPassword,
    setLdapPassword,
    ldapLoading,
    ldapError,
    handleLdapSubmit,
  };
}
