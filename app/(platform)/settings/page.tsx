'use client';
import { logout } from '@/lib/apiClient';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/providers/ToastProvider';
import { NAV } from '@/components/settings/styles';
import { TabPerfil } from '@/components/settings/TabPerfil';
import { TabPermissoes } from '@/components/settings/TabPermissoes';
import { TabSeguranca } from '@/components/settings/TabSeguranca';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import type { Tab } from '@/components/settings/types';

export default function SettingsPage() {
  const toast = useToast();
  const {
    data: user,
    isLoading: loading,
    error: queryError,
  } = useCurrentUser();
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

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-ink m-0">Definições</h1>
        </div>
        <Button
          onClick={logout}
          intent="ghost"
          className="text-danger hover:bg-danger-subtle"
        >
          Terminar Sessão
        </Button>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="perfil" className="mb-6">
        <TabsList className="bg-surface-sunken">
          {NAV.map((t) => (
            <TabsTrigger key={t.key} value={t.key}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Conteúdo ── */}
        <TabsContent value="perfil">
          <TabPerfil user={user} />
        </TabsContent>

        <TabsContent value="seguranca">
          <TabSeguranca />
        </TabsContent>

        <TabsContent value="permissoes">
          <TabPermissoes user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
