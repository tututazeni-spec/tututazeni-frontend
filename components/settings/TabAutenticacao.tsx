// components/settings/TabAutenticacao.tsx
// Tab "Autenticação / SSO" (ADMIN): login único (Google/Microsoft/OIDC),
// LDAP/Active Directory e o domínio autorizado (reutiliza a política de
// utilizadores, §3) — GET/PUT /settings/auth, POST /settings/auth/test-oidc,
// POST /settings/auth/test-ldap (docs/modulo_settings.md §11).

'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useToast } from '@/providers/ToastProvider';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { AuthSettings, AuthTestResult, OidcProviderKey, UserPolicy } from './types';

const PROVIDER_LABELS: Record<OidcProviderKey, string> = {
  GOOGLE: 'Google',
  MICROSOFT: 'Microsoft (Azure AD)',
  OIDC: 'OIDC genérico',
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
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

type AuthForm = Omit<AuthSettings, 'oidcProviderOptions'>;

export function TabAutenticacao() {
  const toast = useToast();
  const { data, isLoading, error } = useApiQuery<AuthSettings>(
    queryKeys.settings.authSettings(),
    '/settings/auth',
  );
  const policy = useApiQuery<UserPolicy>(queryKeys.settings.userPolicy(), '/settings/users/policy');

  const [form, setForm] = useState<AuthForm | null>(null);
  const [clientSecret, setClientSecret] = useState('');
  const [bindPassword, setBindPassword] = useState('');

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const save = useApiMutation(
    (payload: Record<string, unknown>) => apiClient.put('/settings/auth', payload),
    {
      invalidateKeys: [queryKeys.settings.authSettings()],
      onSuccess: () => {
        setClientSecret('');
        setBindPassword('');
        toast({ title: 'Definições de autenticação guardadas', intent: 'success' });
      },
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  const testOidc = useApiMutation(() => apiClient.post<AuthTestResult>('/settings/auth/test-oidc', {}), {
    onSuccess: (r) =>
      toast(
        r.ok
          ? { title: `Descoberta OIDC OK — ${r.issuer}`, intent: 'success' }
          : { title: r.error ?? 'Falha na descoberta OIDC', intent: 'danger' },
      ),
    onError: (e) => toast({ title: e.message, intent: 'danger' }),
  });

  const testLdap = useApiMutation(() => apiClient.post<AuthTestResult>('/settings/auth/test-ldap', {}), {
    onSuccess: (r) =>
      toast(
        r.ok
          ? { title: 'Ligação LDAP/AD estabelecida', intent: 'success' }
          : { title: r.error ?? 'Falha na ligação LDAP/AD', intent: 'danger' },
      ),
    onError: (e) => toast({ title: e.message, intent: 'danger' }),
  });

  if (isLoading || !form) return <p className="py-10 text-center text-sm text-ink-faint">A carregar…</p>;
  if (error) return <p className="py-10 text-center text-sm text-danger">{error.message}</p>;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const { oidc, ldap, ...rest } = form;
    const { hasClientSecret: _hcs, ...oidcRest } = oidc;
    const { hasBindPassword: _hbp, ...ldapRest } = ldap;
    save.mutate({
      ...rest,
      oidc: { ...oidcRest, ...(clientSecret && { clientSecret }) },
      ldap: { ...ldapRest, ...(bindPassword && { bindPassword }) },
    });
  }

  const providerOptions = data?.oidcProviderOptions.map((p) => ({ value: p, label: PROVIDER_LABELS[p] })) ?? [];

  return (
    <form onSubmit={submit} className="space-y-4">
      <Card>
        <CardBody>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-ink">Login único (SSO)</h3>
            <Badge intent={form.ssoEnabled ? 'success' : 'neutral'}>
              {form.ssoEnabled ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>
          <div className="space-y-4">
            <Toggle
              id="sso-enabled"
              label="Activar login único"
              checked={form.ssoEnabled}
              onChange={(v) => setForm((f) => (f ? { ...f, ssoEnabled: v } : f))}
            />
            <FormField label="Fornecedor" htmlFor="sso-provider">
              <Select
                className="w-full"
                items={providerOptions}
                value={form.ssoProvider ?? undefined}
                onValueChange={(v) =>
                  setForm((f) => (f ? { ...f, ssoProvider: v as OidcProviderKey } : f))
                }
                placeholder="Escolher fornecedor…"
              />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Client ID" htmlFor="oidc-client-id">
                <Input
                  id="oidc-client-id"
                  className="w-full"
                  value={form.oidc.clientId}
                  onChange={(e) =>
                    setForm((f) => (f ? { ...f, oidc: { ...f.oidc, clientId: e.target.value } } : f))
                  }
                />
              </FormField>
              <FormField
                label="Client Secret"
                htmlFor="oidc-client-secret"
                hint={form.oidc.hasClientSecret ? 'Já configurado — deixe em branco para manter' : undefined}
              >
                <Input
                  id="oidc-client-secret"
                  type="password"
                  className="w-full"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="••••••••"
                />
              </FormField>
              {form.ssoProvider === 'MICROSOFT' && (
                <FormField label="Tenant do Azure AD" htmlFor="oidc-tenant" hint='"common" = qualquer conta'>
                  <Input
                    id="oidc-tenant"
                    className="w-full"
                    value={form.oidc.tenantId}
                    onChange={(e) =>
                      setForm((f) => (f ? { ...f, oidc: { ...f.oidc, tenantId: e.target.value } } : f))
                    }
                  />
                </FormField>
              )}
              {form.ssoProvider === 'OIDC' && (
                <FormField label="Emissor (issuer)" htmlFor="oidc-issuer" hint="ex.: https://idp.empresa.ao">
                  <Input
                    id="oidc-issuer"
                    className="w-full"
                    value={form.oidc.issuer}
                    onChange={(e) =>
                      setForm((f) => (f ? { ...f, oidc: { ...f.oidc, issuer: e.target.value } } : f))
                    }
                  />
                </FormField>
              )}
            </div>
            <div>
              <Button
                type="button"
                intent="secondary"
                disabled={testOidc.isPending || !form.ssoProvider}
                onClick={() => testOidc.mutate(undefined)}
              >
                {testOidc.isPending ? 'A testar…' : 'Testar descoberta OIDC'}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-ink">LDAP / Active Directory</h3>
            <Badge intent={form.ldap.enabled ? 'success' : 'neutral'}>
              {form.ldap.enabled ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>
          <div className="space-y-4">
            <Toggle
              id="ldap-enabled"
              label="Activar login via LDAP/AD"
              checked={form.ldap.enabled}
              onChange={(v) => setForm((f) => (f ? { ...f, ldap: { ...f.ldap, enabled: v } } : f))}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField label="URL" htmlFor="ldap-url" hint="ex.: ldaps://ad.empresa.ao:636">
                <Input
                  id="ldap-url"
                  className="w-full"
                  value={form.ldap.url}
                  onChange={(e) => setForm((f) => (f ? { ...f, ldap: { ...f.ldap, url: e.target.value } } : f))}
                />
              </FormField>
              <div className="flex items-end">
                <Toggle
                  id="ldap-starttls"
                  label="StartTLS"
                  checked={form.ldap.startTls}
                  onChange={(v) => setForm((f) => (f ? { ...f, ldap: { ...f.ldap, startTls: v } } : f))}
                />
              </div>
              <FormField label="Bind DN (conta de serviço)" htmlFor="ldap-bind-dn">
                <Input
                  id="ldap-bind-dn"
                  className="w-full"
                  value={form.ldap.bindDn}
                  onChange={(e) => setForm((f) => (f ? { ...f, ldap: { ...f.ldap, bindDn: e.target.value } } : f))}
                />
              </FormField>
              <FormField
                label="Bind Password"
                htmlFor="ldap-bind-password"
                hint={form.ldap.hasBindPassword ? 'Já configurada — deixe em branco para manter' : undefined}
              >
                <Input
                  id="ldap-bind-password"
                  type="password"
                  className="w-full"
                  value={bindPassword}
                  onChange={(e) => setBindPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </FormField>
              <FormField label="Base DN" htmlFor="ldap-base-dn" hint="ex.: DC=empresa,DC=ao">
                <Input
                  id="ldap-base-dn"
                  className="w-full"
                  value={form.ldap.baseDn}
                  onChange={(e) => setForm((f) => (f ? { ...f, ldap: { ...f.ldap, baseDn: e.target.value } } : f))}
                />
              </FormField>
              <FormField label="Filtro de busca" htmlFor="ldap-filter" hint="{{email}} é substituído pelo email introduzido">
                <Input
                  id="ldap-filter"
                  className="w-full"
                  value={form.ldap.userFilter}
                  onChange={(e) =>
                    setForm((f) => (f ? { ...f, ldap: { ...f.ldap, userFilter: e.target.value } } : f))
                  }
                />
              </FormField>
              <FormField label="Atributo do email" htmlFor="ldap-email-attr">
                <Input
                  id="ldap-email-attr"
                  className="w-full"
                  value={form.ldap.emailAttribute}
                  onChange={(e) =>
                    setForm((f) => (f ? { ...f, ldap: { ...f.ldap, emailAttribute: e.target.value } } : f))
                  }
                />
              </FormField>
              <FormField label="Atributo do nome" htmlFor="ldap-name-attr">
                <Input
                  id="ldap-name-attr"
                  className="w-full"
                  value={form.ldap.nameAttribute}
                  onChange={(e) =>
                    setForm((f) => (f ? { ...f, ldap: { ...f.ldap, nameAttribute: e.target.value } } : f))
                  }
                />
              </FormField>
            </div>
            <div>
              <Button
                type="button"
                intent="secondary"
                disabled={testLdap.isPending}
                onClick={() => testLdap.mutate(undefined)}
              >
                {testLdap.isPending ? 'A testar…' : 'Testar ligação LDAP/AD'}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h3 className="mb-4 text-base font-bold text-ink">Domínio autorizado</h3>
          <p className="m-0 text-sm text-ink-faint">
            O domínio de email autorizado para contas novas (via SSO, LDAP ou convite) é partilhado
            com a política de utilizadores —{' '}
            {policy.data?.allowedEmailDomains?.length
              ? policy.data.allowedEmailDomains.join(', ')
              : 'sem restrição configurada'}
            . Edite-o no separador Utilizadores.
          </p>
          <div className="mt-4">
            <Toggle
              id="enforce-sso-only"
              label="Obrigar SSO/LDAP para todos excepto ADMIN (acesso de emergência)"
              checked={form.enforceSsoOnly}
              onChange={(v) => setForm((f) => (f ? { ...f, enforceSsoOnly: v } : f))}
            />
          </div>
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? 'A guardar…' : 'Guardar alterações'}
        </Button>
      </div>
    </form>
  );
}
