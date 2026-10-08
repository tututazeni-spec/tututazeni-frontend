'use client';
import { logout } from '@/lib/apiClient';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/providers/ToastProvider';
import { NAV } from '@/components/settings/styles';
import { TabPerfil } from '@/components/settings/TabPerfil';
import { TabPermissoes } from '@/components/settings/TabPermissoes';
import { TabSeguranca } from '@/components/settings/TabSeguranca';
import { TabVisaoGeral } from '@/components/settings/TabVisaoGeral';
import { TabUtilizadores } from '@/components/settings/TabUtilizadores';
import { TabNotificacoes } from '@/components/settings/TabNotificacoes';
import { TabIntegracoes } from '@/components/settings/TabIntegracoes';
import { TabCertificados } from '@/components/settings/TabCertificados';
import { TabPrivacidade } from '@/components/settings/TabPrivacidade';
import { TabLicenca } from '@/components/settings/TabLicenca';
import { TabAuditoria } from '@/components/settings/TabAuditoria';
import { TabAutenticacao } from '@/components/settings/TabAutenticacao';
import { TabEmail } from '@/components/settings/TabEmail';
import { TabWhatsApp } from '@/components/settings/TabWhatsApp';
import { TabBackups } from '@/components/settings/TabBackups';
import { TabSistema } from '@/components/settings/TabSistema';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent } from '@/components/ui/Tabs';
import { PillTabsList } from '@/components/ui/PillTabs';

export default function SettingsPage() {
  const toast = useToast();
  // ?tab= (ex.: primeiro login com password temporária). Lido do URL em vez de
  // useSearchParams para não exigir <Suspense> nesta página client.
  const {
    data: user,
    isLoading: loading,
    error: queryError,
  } = useCurrentUser();
  const initialTab =
    typeof window === 'undefined'
      ? 'perfil'
      : (new URLSearchParams(window.location.search).get('tab') ?? 'perfil');
  const error = queryError?.message ?? '';

  if (loading)
    return (
      <div className="py-15 text-center text-ink-faint text-sm">
        A carregar perfil...
      </div>
    );

  if (error)
    return (
      <div className="bg-danger-subtle border border-danger rounded-lg p-6 text-danger-ink text-sm">
        {error === 'Unauthorized' || error.includes('401')
          ? 'Sessão expirada. Faz login novamente.'
          : error}
      </div>
    );

  if (!user) return null;

  // Separadores de configuração da organização: só ADMIN (docs/modulo_settings.md).
  const isAdmin = user.role?.name === 'ADMIN';
  const visibleNav = NAV.filter((t) => !t.adminOnly || isAdmin);

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-ink m-0">Definições</h1>
        </div>
        <Button onClick={() => logout()} intent="ghost" className="text-ink">
          Terminar Sessão
        </Button>
      </div>

      {/* ── Tabs — barra glassmorphism partilhada (components/ui/PillTabs). ── */}
      <Tabs defaultValue={initialTab} className="mb-6">
        <PillTabsList items={visibleNav.map((t) => ({ ...t, id: t.key }))} />

        {/* ── Conteúdo ── */}
        <TabsContent value="perfil">
          <TabPerfil user={user} />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="visao-geral">
            <TabVisaoGeral />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="utilizadores">
            <TabUtilizadores />
          </TabsContent>
        )}

        <TabsContent value="seguranca">
          <TabSeguranca isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="permissoes">
          <TabPermissoes user={user} />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="notificacoes">
            <TabNotificacoes />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="integracoes">
            <TabIntegracoes />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="certificados">
            <TabCertificados />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="privacidade">
            <TabPrivacidade />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="licenca">
            <TabLicenca />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="auditoria">
            <TabAuditoria />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="autenticacao">
            <TabAutenticacao />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="email">
            <TabEmail />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="whatsapp">
            <TabWhatsApp />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="backups">
            <TabBackups />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="sistema">
            <TabSistema />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
