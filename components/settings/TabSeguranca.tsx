// components/settings/TabSeguranca.tsx
// Tab "Segurança" (docs/modulo_settings.md §4): alteração de senha (todos),
// 2FA/sessões/histórico pessoais (todos) e política + contas bloqueadas +
// sessões/histórico da organização (ADMIN) — /settings/security/*.

'use client';

import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/cn';
import type {
  LockedUser,
  LoginHistoryPage,
  SecurityPolicy,
  SessionRow,
  TwoFactorMode,
  TwoFactorStatus,
} from './types';

interface TabSegurancaProps {
  isAdmin?: boolean;
  onToast?: (msg: string, type: 'success' | 'error') => void;
}

const TWO_FACTOR_LABELS: Record<TwoFactorMode, string> = {
  OPTIONAL: 'Opcional',
  REQUIRED_PRIVILEGED: 'Obrigatório para perfis privilegiados',
  REQUIRED_ALL: 'Obrigatório para todos',
};

function Toggle({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 text-sm text-ink">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('pt-PT');
}

export function TabSeguranca({ isAdmin = false, onToast }: TabSegurancaProps) {
  const toast = useToast();
  const confirm = useConfirm();
  const toastFn = (msg: string, type: 'success' | 'error') => {
    if (onToast) {
      onToast(msg, type);
    } else {
      toast({ title: msg, intent: type === 'error' ? 'danger' : 'success' });
    }
  };

  return (
    <div className="space-y-4">
      <PasswordCard toastFn={toastFn} />
      <TwoFactorCard toastFn={toastFn} />
      <MySessionsCard toastFn={toastFn} />
      <LoginHistoryCard
        title="O meu histórico de logins"
        queryKey={queryKeys.settings.loginHistory('me', 1)}
        basePath="/settings/security/me/login-history"
        showOutcomeFilter={false}
      />

      {isAdmin && (
        <>
          <SecurityPolicyCard toastFn={toastFn} />
          <LockedUsersCard toastFn={toastFn} confirm={confirm} />
          <AllSessionsCard toastFn={toastFn} confirm={confirm} />
          <LoginHistoryCard
            title="Histórico de logins (organização)"
            queryKey={queryKeys.settings.loginHistory('all', 1)}
            basePath="/settings/security/login-history"
            showOutcomeFilter
          />
        </>
      )}
    </div>
  );
}

// ─── Alterar senha (pessoal) ────────────────────────────────────────────────

function PasswordCard({
  toastFn,
}: {
  toastFn: (msg: string, type: 'success' | 'error') => void;
}) {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPass, setShowPass] = useState(false);

  // POST /auth/change-password — ChangePasswordDto: { currentPassword, newPassword }
  const changePassword = useApiMutation(
    (payload: { currentPassword: string; newPassword: string }) =>
      apiClient.post('/auth/change-password', payload),
    {
      onSuccess: () => {
        toastFn('Senha alterada com sucesso!', 'success');
        setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      },
      onError: (e) => toastFn(e.message ?? 'Erro ao alterar senha', 'error'),
    },
  );
  const saving = changePassword.isPending;

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toastFn('As senhas não coincidem.', 'error');
      return;
    }
    if (form.newPassword.length < 6) {
      toastFn('A nova senha deve ter pelo menos 6 caracteres.', 'error');
      return;
    }
    changePassword.mutate({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    });
  }

  const strength = (p: string) => {
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };

  const pw = form.newPassword;
  const str = strength(pw);
  const strLabel = ['', 'Fraca', 'Razoável', 'Boa', 'Forte'];
  const strColorClass = ['', 'text-danger', 'text-warning', 'text-primary', 'text-success'];

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardBody>
          <h3 className="mb-5 text-base font-bold text-ink">Alterar Senha</h3>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <div className="relative">
                <FormField label="Senha Actual" htmlFor="current-password">
                  <Input
                    id="current-password"
                    type={showPass ? 'text' : 'password'}
                    value={form.currentPassword}
                    onChange={(e) => set('currentPassword', e.target.value)}
                    placeholder="••••••••"
                    required
                    className="pr-10"
                  />
                </FormField>
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-9 text-ink-faint hover:text-ink"
                  aria-label={showPass ? 'Ocultar' : 'Mostrar'}
                >
                  {showPass ? <EyeOff strokeWidth={1.75} size={18} /> : <Eye strokeWidth={1.75} size={18} />}
                </button>
              </div>
            </div>

            <div>
              <FormField label="Nova Senha" htmlFor="new-password">
                <Input
                  id="new-password"
                  type="password"
                  value={form.newPassword}
                  onChange={(e) => set('newPassword', e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </FormField>
              {pw && (
                <div className="mt-2">
                  <div className="mb-1 flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          'flex-1 h-1 rounded-sm transition-colors',
                          i <= str
                            ? strColorClass[str] === 'text-danger'
                              ? 'bg-danger'
                              : strColorClass[str] === 'text-warning'
                                ? 'bg-warning'
                                : strColorClass[str] === 'text-primary'
                                  ? 'bg-primary'
                                  : 'bg-success'
                            : 'bg-border',
                        )}
                      />
                    ))}
                  </div>
                  <span className={cn('text-xs font-semibold', strColorClass[str])}>
                    {strLabel[str]}
                  </span>
                </div>
              )}
            </div>

            <FormField label="Confirmar Nova Senha" htmlFor="confirm-password">
              <Input
                id="confirm-password"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => set('confirmPassword', e.target.value)}
                placeholder="••••••••"
                required
                invalid={form.confirmPassword.length > 0 && form.confirmPassword !== form.newPassword}
              />
              {form.confirmPassword && form.confirmPassword !== form.newPassword && (
                <p className="text-danger text-xs mt-1">As senhas não coincidem</p>
              )}
            </FormField>

            <Button
              type="submit"
              intent="primary"
              loading={saving}
              disabled={saving || form.newPassword !== form.confirmPassword}
              className="w-full"
            >
              {saving ? 'A alterar...' : 'Alterar Senha'}
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h3 className="mb-4 text-base font-bold text-ink">Dicas de Segurança</h3>
          <div className="space-y-3">
            {[
              { text: 'Usa pelo menos 8 caracteres', ok: pw.length >= 8 },
              { text: 'Inclui letras maiúsculas', ok: /[A-Z]/.test(pw) },
              { text: 'Inclui números', ok: /[0-9]/.test(pw) },
              { text: 'Inclui caracteres especiais', ok: /[^A-Za-z0-9]/.test(pw) },
            ].map((tip) => (
              <div
                key={tip.text}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border transition-all',
                  pw && tip.ok ? 'bg-success-subtle border-success' : 'bg-surface-sunken border-border',
                )}
              >
                <span className="text-sm text-ink">{tip.text}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 p-4 bg-surface border border-ink rounded-lg">
            <p className="m-0 text-xs text-ink font-semibold">
              O token de acesso expira num curto período. Serás redirecionado para o login
              automaticamente.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

// ─── 2FA (pessoal) ──────────────────────────────────────────────────────────

function TwoFactorCard({
  toastFn,
}: {
  toastFn: (msg: string, type: 'success' | 'error') => void;
}) {
  const status = useApiQuery<TwoFactorStatus>(
    queryKeys.settings.twoFactor(),
    '/settings/security/me/2fa',
  );
  const [setup, setSetup] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [code, setCode] = useState('');

  const setupMutation = useApiMutation(
    () => apiClient.post<{ secret: string; otpauthUrl: string }>('/settings/security/me/2fa/setup', {}),
    {
      onSuccess: (data) => setSetup(data),
      onError: (e) => toastFn(e.message, 'error'),
    },
  );

  const enableMutation = useApiMutation(
    (c: string) => apiClient.post('/settings/security/me/2fa/enable', { code: c }),
    {
      invalidateKeys: [queryKeys.settings.twoFactor()],
      onSuccess: () => {
        setSetup(null);
        setCode('');
        toastFn('2FA activado com sucesso', 'success');
      },
      onError: (e) => toastFn(e.message, 'error'),
    },
  );

  const disableMutation = useApiMutation(
    (c: string) => apiClient.post('/settings/security/me/2fa/disable', { code: c }),
    {
      invalidateKeys: [queryKeys.settings.twoFactor()],
      onSuccess: () => {
        setCode('');
        toastFn('2FA desactivado', 'success');
      },
      onError: (e) => toastFn(e.message, 'error'),
    },
  );

  if (status.isLoading) return null;

  const enabled = status.data?.enabled ?? false;
  const mode = status.data?.mode;

  return (
    <Card>
      <CardBody>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-ink">Autenticação de dois factores (2FA)</h3>
          <Badge intent={enabled ? 'success' : 'neutral'}>{enabled ? 'Activo' : 'Inactivo'}</Badge>
        </div>
        {mode && (
          <p className="mb-4 text-xs text-ink-faint">
            Política da organização: {TWO_FACTOR_LABELS[mode]}
          </p>
        )}

        {enabled ? (
          <div className="max-w-sm space-y-3">
            <FormField label="Código da app de autenticação" htmlFor="disable-2fa-code">
              <Input
                id="disable-2fa-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
              />
            </FormField>
            <Button
              intent="danger"
              disabled={disableMutation.isPending || code.length !== 6}
              onClick={() => disableMutation.mutate(code)}
            >
              Desactivar 2FA
            </Button>
          </div>
        ) : setup ? (
          <div className="max-w-sm space-y-3">
            <p className="text-sm text-ink-muted">
              Adiciona esta chave numa app de autenticação (Google Authenticator, Authy…) e
              confirma com o código gerado.
            </p>
            <FormField label="Chave secreta" htmlFor="totp-secret">
              <Input id="totp-secret" readOnly value={setup.secret} />
            </FormField>
            <FormField label="URL de configuração (otpauth)" htmlFor="totp-url">
              <Input id="totp-url" readOnly value={setup.otpauthUrl} className="text-xs" />
            </FormField>
            <FormField label="Código de confirmação" htmlFor="enable-2fa-code">
              <Input
                id="enable-2fa-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
              />
            </FormField>
            <div className="flex gap-2">
              <Button
                intent="primary"
                disabled={enableMutation.isPending || code.length !== 6}
                onClick={() => enableMutation.mutate(code)}
              >
                Confirmar e activar
              </Button>
              <Button intent="ghost" onClick={() => setSetup(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <Button
            intent="primary"
            disabled={setupMutation.isPending}
            onClick={() => setupMutation.mutate(undefined)}
          >
            Activar 2FA
          </Button>
        )}
      </CardBody>
    </Card>
  );
}

// ─── As minhas sessões ──────────────────────────────────────────────────────

function MySessionsCard({
  toastFn,
}: {
  toastFn: (msg: string, type: 'success' | 'error') => void;
}) {
  const sessions = useApiQuery<{ total: number; items: SessionRow[] }>(
    queryKeys.settings.sessions('me'),
    '/settings/security/me/sessions',
  );
  const revoke = useApiMutation(
    (id: number) => apiClient.delete(`/settings/security/me/sessions/${id}`),
    {
      invalidateKeys: [queryKeys.settings.sessions('me')],
      onSuccess: () => toastFn('Sessão terminada', 'success'),
      onError: (e) => toastFn(e.message, 'error'),
    },
  );

  return (
    <Card>
      <CardBody>
        <h3 className="mb-4 text-base font-bold text-ink">As minhas sessões activas</h3>
        {sessions.isLoading ? (
          <p className="text-sm text-ink-faint">A carregar…</p>
        ) : !sessions.data?.items.length ? (
          <p className="py-4 text-center text-sm text-ink-faint">Nenhuma sessão activa.</p>
        ) : (
          <div className="space-y-2">
            {sessions.data.items.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
              >
                <div>
                  <p className="m-0 text-ink">{s.userAgent ?? 'Dispositivo desconhecido'}</p>
                  <p className="m-0 text-xs text-ink-faint">
                    {s.ip ?? '—'} · desde {fmtDate(s.createdAt)}
                  </p>
                </div>
                <Button intent="ghost" disabled={revoke.isPending} onClick={() => revoke.mutate(s.id)}>
                  Terminar
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

// ─── Histórico de logins (pessoal/organização) ─────────────────────────────

function LoginHistoryCard({
  title,
  basePath,
  showOutcomeFilter,
}: {
  title: string;
  queryKey: unknown;
  basePath: string;
  showOutcomeFilter: boolean;
}) {
  const [page, setPage] = useState(1);
  const [outcome, setOutcome] = useState<'ALL' | 'SUCCESS' | 'FAILED'>('ALL');
  const scope = basePath.includes('/me/') ? 'me' : 'all';

  const history = useApiQuery<LoginHistoryPage>(
    queryKeys.settings.loginHistory(scope, page),
    basePath,
    { params: { page, ...(outcome !== 'ALL' && { outcome }) } },
  );

  return (
    <Card>
      <CardBody>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-ink">{title}</h3>
          {showOutcomeFilter && (
            <Select
              className="w-44"
              items={[
                { value: 'ALL', label: 'Todos' },
                { value: 'SUCCESS', label: 'Sucesso' },
                { value: 'FAILED', label: 'Falha' },
              ]}
              value={outcome}
              onValueChange={(v) => {
                setOutcome(v as typeof outcome);
                setPage(1);
              }}
            />
          )}
        </div>
        {history.isLoading ? (
          <p className="text-sm text-ink-faint">A carregar…</p>
        ) : !history.data?.data.length ? (
          <p className="py-4 text-center text-sm text-ink-faint">Sem registos.</p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-ink-faint">
                  {scope === 'all' && <th className="py-2">Utilizador</th>}
                  <th>Acção</th>
                  <th>IP</th>
                  <th>Data</th>
                  <th>Motivo</th>
                </tr>
              </thead>
              <tbody>
                {history.data.data.map((row) => (
                  <tr key={row.id} className="border-t border-border">
                    {scope === 'all' && (
                      <td className="py-2">{row.user?.fullName ?? '—'}</td>
                    )}
                    <td>
                      <Badge intent={row.action === 'LOGIN' ? 'success' : row.action === 'LOGOUT' ? 'neutral' : 'danger'}>
                        {row.action}
                      </Badge>
                    </td>
                    <td>{row.ip ?? '—'}</td>
                    <td>{fmtDate(row.createdAt)}</td>
                    <td className="text-ink-faint">{row.reason ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              page={history.data.meta.page}
              totalPages={history.data.meta.totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </CardBody>
    </Card>
  );
}

// ─── Política de segurança (ADMIN) ─────────────────────────────────────────

function SecurityPolicyCard({
  toastFn,
}: {
  toastFn: (msg: string, type: 'success' | 'error') => void;
}) {
  const query = useApiQuery<SecurityPolicy & { twoFactorModes: TwoFactorMode[] }>(
    queryKeys.settings.securityPolicy(),
    '/settings/security/policy',
  );
  const [form, setForm] = useState<SecurityPolicy | null>(null);

  useEffect(() => {
    if (query.data) setForm(query.data);
  }, [query.data]);

  const save = useApiMutation(
    (payload: SecurityPolicy) => apiClient.put('/settings/security/policy', payload),
    {
      invalidateKeys: [queryKeys.settings.securityPolicy()],
      onSuccess: () => toastFn('Política de segurança guardada', 'success'),
      onError: (e) => toastFn(e.message, 'error'),
    },
  );

  if (query.isLoading || !form) return null;

  const num = (k: keyof SecurityPolicy) => (form[k] as number) ?? 0;
  const set = (k: keyof SecurityPolicy, v: number | boolean | string) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form) save.mutate(form);
  }

  return (
    <Card>
      <CardBody>
        <h3 className="mb-4 text-base font-bold text-ink">Política de Segurança (organização)</h3>
        <form onSubmit={submit} className="grid grid-cols-3 gap-4">
          <FormField label="Tamanho mínimo da senha" htmlFor="passwordMinLength">
            <Input
              id="passwordMinLength"
              type="number"
              min={10}
              max={64}
              value={num('passwordMinLength')}
              onChange={(e) => set('passwordMinLength', Number(e.target.value))}
            />
          </FormField>
          <FormField label="Expiração da senha (dias, 0 = nunca)" htmlFor="passwordExpiryDays">
            <Input
              id="passwordExpiryDays"
              type="number"
              min={0}
              max={730}
              value={num('passwordExpiryDays')}
              onChange={(e) => set('passwordExpiryDays', Number(e.target.value))}
            />
          </FormField>
          <FormField label="Tentativas falhadas até bloquear (0 = sem bloqueio)" htmlFor="maxFailedAttempts">
            <Input
              id="maxFailedAttempts"
              type="number"
              min={0}
              max={20}
              value={num('maxFailedAttempts')}
              onChange={(e) => set('maxFailedAttempts', Number(e.target.value))}
            />
          </FormField>
          <FormField label="Duração do bloqueio (minutos)" htmlFor="lockoutMinutes">
            <Input
              id="lockoutMinutes"
              type="number"
              min={1}
              max={1440}
              value={num('lockoutMinutes')}
              onChange={(e) => set('lockoutMinutes', Number(e.target.value))}
            />
          </FormField>
          <FormField label="Sessão inactiva expira após (minutos)" htmlFor="sessionIdleMinutes">
            <Input
              id="sessionIdleMinutes"
              type="number"
              min={5}
              max={1440}
              value={num('sessionIdleMinutes')}
              onChange={(e) => set('sessionIdleMinutes', Number(e.target.value))}
            />
          </FormField>
          <FormField label="Validade do token de acesso (minutos)" htmlFor="accessTokenMinutes">
            <Input
              id="accessTokenMinutes"
              type="number"
              min={5}
              max={120}
              value={num('accessTokenMinutes')}
              onChange={(e) => set('accessTokenMinutes', Number(e.target.value))}
            />
          </FormField>
          <FormField label="Validade do refresh token (dias)" htmlFor="refreshTokenDays">
            <Input
              id="refreshTokenDays"
              type="number"
              min={1}
              max={7}
              value={num('refreshTokenDays')}
              onChange={(e) => set('refreshTokenDays', Number(e.target.value))}
            />
          </FormField>
          <FormField label="Exigência de 2FA" htmlFor="twoFactorMode">
            <Select
              className="w-full"
              items={(query.data?.twoFactorModes ?? []).map((m) => ({
                value: m,
                label: TWO_FACTOR_LABELS[m],
              }))}
              value={form.twoFactorMode}
              onValueChange={(v) => set('twoFactorMode', v)}
            />
          </FormField>
          <div className="col-span-3 flex items-center justify-between">
            <Toggle
              id="passwordRequireSymbol"
              label="Exigir pelo menos um símbolo na senha"
              checked={form.passwordRequireSymbol}
              onChange={(v) => set('passwordRequireSymbol', v)}
            />
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? 'A guardar…' : 'Guardar política'}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

// ─── Contas bloqueadas (ADMIN) ──────────────────────────────────────────────

function LockedUsersCard({
  toastFn,
  confirm,
}: {
  toastFn: (msg: string, type: 'success' | 'error') => void;
  confirm: ReturnType<typeof useConfirm>;
}) {
  const query = useApiQuery<{ total: number; items: LockedUser[] }>(
    queryKeys.settings.lockedUsers(),
    '/settings/security/locked-users',
  );
  const unlock = useApiMutation(
    (id: number) => apiClient.post(`/settings/security/users/${id}/unlock`, {}),
    {
      invalidateKeys: [queryKeys.settings.lockedUsers()],
      onSuccess: () => toastFn('Conta desbloqueada', 'success'),
      onError: (e) => toastFn(e.message, 'error'),
    },
  );

  return (
    <Card>
      <CardBody>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-ink">Contas bloqueadas</h3>
          {query.data && (
            <Badge intent={query.data.total ? 'danger' : 'success'}>{query.data.total}</Badge>
          )}
        </div>
        {query.isLoading ? (
          <p className="text-sm text-ink-faint">A carregar…</p>
        ) : !query.data?.items.length ? (
          <p className="py-4 text-center text-sm text-ink-faint">Nenhuma conta bloqueada.</p>
        ) : (
          <div className="space-y-2">
            {query.data.items.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
              >
                <div>
                  <p className="m-0 font-medium text-ink">{u.fullName}</p>
                  <p className="m-0 text-xs text-ink-faint">
                    {u.email} · bloqueada até {u.lockedUntil ? fmtDate(u.lockedUntil) : '—'}
                  </p>
                </div>
                <Button
                  intent="primary"
                  disabled={unlock.isPending}
                  onClick={async () => {
                    if (await confirm({ title: `Desbloquear ${u.fullName}?`, confirmLabel: 'Desbloquear' })) {
                      unlock.mutate(u.id);
                    }
                  }}
                >
                  Desbloquear
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

// ─── Sessões activas da organização (ADMIN) ────────────────────────────────

function AllSessionsCard({
  toastFn,
  confirm,
}: {
  toastFn: (msg: string, type: 'success' | 'error') => void;
  confirm: ReturnType<typeof useConfirm>;
}) {
  const query = useApiQuery<{ total: number; items: SessionRow[] }>(
    queryKeys.settings.sessions('all'),
    '/settings/security/sessions',
  );
  const revoke = useApiMutation(
    (id: number) => apiClient.delete(`/settings/security/sessions/${id}`),
    {
      invalidateKeys: [queryKeys.settings.sessions('all')],
      onSuccess: () => toastFn('Sessão terminada', 'success'),
      onError: (e) => toastFn(e.message, 'error'),
    },
  );
  const revokeAll = useApiMutation(
    (userId: number) => apiClient.delete(`/settings/security/users/${userId}/sessions`),
    {
      invalidateKeys: [queryKeys.settings.sessions('all')],
      onSuccess: () => toastFn('Sessões terminadas', 'success'),
      onError: (e) => toastFn(e.message, 'error'),
    },
  );

  return (
    <Card>
      <CardBody>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-ink">Sessões activas (organização)</h3>
          {query.data && <Badge intent="info">{query.data.total}</Badge>}
        </div>
        {query.isLoading ? (
          <p className="text-sm text-ink-faint">A carregar…</p>
        ) : !query.data?.items.length ? (
          <p className="py-4 text-center text-sm text-ink-faint">Nenhuma sessão activa.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-ink-faint">
                <th className="py-2">Utilizador</th>
                <th>IP</th>
                <th>Desde</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {query.data.items.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="py-2">
                    <div className="font-medium text-ink">{s.user?.fullName ?? `#${s.userId}`}</div>
                    <div className="text-xs text-ink-faint">{s.user?.email}</div>
                  </td>
                  <td>{s.ip ?? '—'}</td>
                  <td>{fmtDate(s.createdAt)}</td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button intent="ghost" disabled={revoke.isPending} onClick={() => revoke.mutate(s.id)}>
                        Terminar
                      </Button>
                      <Button
                        intent="ghost"
                        disabled={revokeAll.isPending}
                        onClick={async () => {
                          if (
                            await confirm({
                              title: `Terminar todas as sessões de ${s.user?.fullName ?? `#${s.userId}`}?`,
                              confirmLabel: 'Terminar todas',
                              destructive: true,
                            })
                          ) {
                            revokeAll.mutate(s.userId);
                          }
                        }}
                      >
                        Terminar todas
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardBody>
    </Card>
  );
}
