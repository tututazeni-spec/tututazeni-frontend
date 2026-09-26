'use client';

// Módulo "Utilizadores" único na sidebar: junta o directório/gestão de
// utilizadores (separadores Utilizadores/Diretório/Dashboard/Importação/
// Histórico & Auditoria) ao ex-módulo Roles-Permissions ("Permissões por
// Cargos"), sem fundir dados — esse separador continua a bater no seu
// próprio controller. O separador 'permissions' delega num componente que
// já traz o seu próprio h1 (usado também pela rota standalone
// /roles-permissions, que continua a existir), por isso o cabeçalho
// genérico do container fica só para os separadores originais de
// utilizadores. Ver components/users/constants.ts.
//
// O separador "Colaboradores" (ex-módulo Employees) foi removido — ver
// nota em components/users/constants.ts. Substituído por "Importação"
// (ImportView) e "Histórico & Auditoria" (AuditHistoryView).

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { NAV, TITLES } from '@/components/users/constants';
import { CreateUserView } from '@/components/users/CreateUserView';
import { DashboardView } from '@/components/users/DashboardView';
import { DirectoryView } from '@/components/users/DirectoryView';
import { UserListView } from '@/components/users/UserListView';
import { UserProfile } from '@/components/users/UserProfile';
import { ImportView } from '@/components/users/ImportView';
import { AuditHistoryView } from '@/components/users/AuditHistoryView';
import { RolesPermissionsView } from '@/components/roles-permissions/RolesPermissionsView';
import type { Nav } from '@/components/users/types';

export default function UsersPage() {
  const [nav, setNav] = useState<Nav>({ view: 'list' });

  const handleSelect = (id: number) =>
    setNav({ view: 'detail', selectedId: id });
  const handleBack = () => setNav({ view: 'list' });
  const handleCreate = () => setNav({ view: 'create' });
  const handleCreated = () => setNav({ view: 'list' });

  const hasOwnHeader = nav.view === 'permissions';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      {!hasOwnHeader && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-ink">
              {TITLES[nav.view]}
            </h1>
            <p className="text-sm text-ink-faint mt-0.5"></p>
          </div>
          {nav.view === 'list' && (
            <div className="flex gap-2">
              <Button onClick={handleCreate}>
                <Plus size={16} strokeWidth={1.75} />
                Novo utilizador
              </Button>
              <Button intent="secondary" onClick={() => setNav({ view: 'import' })}>
                Importar
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      {nav.view !== 'detail' && nav.view !== 'create' && (
        <div className="flex w-fit flex-wrap gap-1 mb-6 rounded-control bg-surface-sunken p-1">
          {NAV.map((n) => (
            <Button
              key={n.id}
              size="sm"
              intent={nav.view === n.id ? 'primary' : 'ghost'}
              onClick={() => setNav({ view: n.id })}
            >
              {n.label}
            </Button>
          ))}
        </div>
      )}

      {nav.view === 'list' && (
        <UserListView onSelect={handleSelect} onCreate={handleCreate} />
      )}
      {nav.view === 'detail' && (
        <UserProfile userId={nav.selectedId} onBack={handleBack} />
      )}
      {nav.view === 'create' && (
        <CreateUserView onBack={handleBack} onCreated={handleCreated} />
      )}
      {nav.view === 'dashboard' && <DashboardView />}
      {nav.view === 'directory' && <DirectoryView onSelect={handleSelect} />}
      {nav.view === 'import' && <ImportView />}
      {nav.view === 'audit' && <AuditHistoryView />}
      {nav.view === 'permissions' && <RolesPermissionsView />}
    </div>
  );
}
