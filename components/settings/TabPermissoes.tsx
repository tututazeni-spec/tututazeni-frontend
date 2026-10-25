// components/settings/TabPermissoes.tsx
// Tab "Permissões": role actual e permissões agrupadas por prefixo. ADMIN/RH
// vêem também a gestão completa de perfis e matriz (RolesPermissionsView —
// docs/modulo_settings.md §2, já existente, reutilizada sem duplicar).
// Migrado para componentes UI + tokens de design.

'use client';

import type { CurrentUser as Me } from '@/hooks/useCurrentUser';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody } from '@/components/ui/Card';
import { DepartmentScopePanel } from '@/components/settings/DepartmentScopePanel';
import { RolesPermissionsView } from '@/components/roles-permissions/RolesPermissionsView';

interface TabPermissoesProps {
  user: Me;
}

// Nomes técnicos das permissões ("módulo:acção") em português.
const MODULE_PT: Record<string, string> = {
  acl: 'Controlo de acessos',
  avatar: 'Avatar',
  content: 'Conteúdos',
  dashboard: 'Painel',
  engagement: 'Engajamento',
  evaluation: 'Avaliação',
  history: 'Histórico',
  lms: 'Formação (LMS)',
  payroll: 'Folha salarial',
  performance: 'Desempenho',
  reports: 'Relatórios',
  roi: 'Retorno do investimento',
  sensitive: 'Dados sensíveis',
  talent: 'Talento',
  users: 'Utilizadores',
};
const ACTION_PT: Record<string, string> = {
  view: 'Ver',
  view_all: 'Ver tudo',
  create: 'Criar',
  update: 'Editar',
  delete: 'Eliminar',
  export: 'Exportar',
  approve: 'Aprovar',
  manage: 'Gerir',
  read: 'Ver',
};

function splitPermission(name: string): [string, string] {
  const [module, ...rest] = name.split(/[:.]/);
  return [module || 'outros', rest.join('.')];
}

function moduleLabel(module: string): string {
  return MODULE_PT[module] ?? module.charAt(0).toUpperCase() + module.slice(1);
}

function permissionLabel(name: string): string {
  const [module, action] = splitPermission(name);
  if (!action) return moduleLabel(module);
  return `${ACTION_PT[action] ?? action.replace(/_/g, ' ')} ${moduleLabel(module).toLowerCase()}`;
}

export function TabPermissoes({ user }: TabPermissoesProps) {
  const permissions = user.role?.permissions ?? [];
  const canManageRoles =
    user.role?.name === 'ADMIN' || user.role?.name === 'RH';

  const grouped = permissions.reduce(
    (acc, p) => {
      const [group] = splitPermission(p.name);
      if (!acc[group]) acc[group] = [];
      acc[group].push(p.name);
      return acc;
    },
    {} as Record<string, string[]>,
  );

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Role info */}
      <div className="col-span-2 overflow-hidden rounded-panel bg-gradient-to-br from-brand via-brand-mid to-brand-dark p-5 text-white shadow-[0_8px_24px_rgba(15,31,61,0.25)]">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 flex flex-shrink-0 items-center justify-center rounded-card bg-white/15 text-xl font-bold text-on-brand-accent">
            {user.role?.name?.charAt(0) ?? '?'}
          </div>
          <div>
            <p className="m-0 font-display text-base font-bold text-white">
              Função: {user.role?.name ?? 'Sem função'}
            </p>
            <p className="mt-1 text-sm text-white/70">
              {permissions.length} permissões activas
            </p>
          </div>
        </div>
      </div>

      {/* Permissões agrupadas */}
      {Object.keys(grouped).length === 0 ? (
        <Card className="col-span-2">
          <CardBody>
            <p className="text-ink-faint text-sm text-center py-10">
              Nenhuma permissão específica atribuída à tua função.
            </p>
          </CardBody>
        </Card>
      ) : (
        Object.entries(grouped).map(([group, perms]) => (
          <Card key={group}>
            <CardBody>
              <h4 className="mb-3 text-xs font-bold text-ink uppercase tracking-wider">
                {moduleLabel(group)}
              </h4>
              <div className="flex flex-wrap gap-2">
                {perms.map((p) => (
                  <Badge key={p} intent="info" className="text-ink">
                    {permissionLabel(p)}
                  </Badge>
                ))}
              </div>
            </CardBody>
          </Card>
        ))
      )}

      {user.role?.name === 'ADMIN' && (
        <div className="col-span-2">
          <DepartmentScopePanel />
        </div>
      )}

      {canManageRoles && (
        <div className="col-span-2 -mx-6">
          <RolesPermissionsView />
        </div>
      )}
    </div>
  );
}
