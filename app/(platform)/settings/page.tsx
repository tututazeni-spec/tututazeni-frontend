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
import { Button } from '@/components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';

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
  const isAdmin = user.role?.code === 'ADMIN';
  const visibleNav = NAV.filter((t) => !t.adminOnly || isAdmin);

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-ink m-0">Definições</h1>
        </div>
        <Button onClick={logout} intent="ghost" className="text-ink">
          Terminar Sessão
        </Button>
      </div>

      {/* ── Tabs — formato de "cartão": cada trigger é um cartão
          independente (borda + fundo branco + rounded), sem fundo
          bg-surface-sunken de grupo. Alinhadas horizontal e verticalmente
          (justify-center + items-center no TabsList, flex items-center em
          cada TabsTrigger) com largura mínima uniforme. Estado activo usa
          data-[state=active] do Radix para aplicar destaque azul
          (borda/fundo/texto primary). ── */}
      <Tabs defaultValue={initialTab} className="mb-6">
        <TabsList className="flex w-full flex-wrap items-center justify-center gap-2 bg-transparent p-0">
          {visibleNav.map((t) => (
            <TabsTrigger
              key={t.key}
              value={t.key}
              className="flex min-w-[140px] items-center justify-center whitespace-nowrap rounded-lg border border-border bg-white px-4 py-2 text-center text-sm font-medium text-foreground shadow-none
                         data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

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
      </Tabs>
    </div>
  );
}
