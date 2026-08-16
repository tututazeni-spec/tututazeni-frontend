// components/settings/TabPermissoes.tsx
// Tab "Permissões": role actual e permissões agrupadas por prefixo.
// Migrado para componentes UI + tokens de design.

'use client';

import type { CurrentUser as Me } from '@/hooks/useCurrentUser';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody } from '@/components/ui/Card';

interface TabPermissoesProps {
  user: Me;
}

export function TabPermissoes({ user }: TabPermissoesProps) {
  const permissions = user.role?.permissions ?? [];

  const grouped = permissions.reduce(
    (acc, p) => {
      const parts = p.name.split('.');
      const group = parts[0] ?? 'outros';
      if (!acc[group]) acc[group] = [];
      acc[group].push(p.name);
      return acc;
    },
    {} as Record<string, string[]>,
  );

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Role info */}
      <Card className="col-span-2">
        <CardBody>
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-canvas font-bold text-xl flex-shrink-0">
              {user.role?.name?.charAt(0) ?? '?'}
            </div>
            <div>
              <p className="m-0 text-base font-bold text-ink">
                Role: {user.role?.name ?? 'Sem role'}
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                {permissions.length} permissões activas
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Permissões agrupadas */}
      {Object.keys(grouped).length === 0 ? (
        <Card className="col-span-2">
          <CardBody>
            <p className="text-ink-faint text-sm text-center py-10">
              Nenhuma permissão específica atribuída ao teu role.
            </p>
          </CardBody>
        </Card>
      ) : (
        Object.entries(grouped).map(([group, perms]) => (
          <Card key={group}>
            <CardBody>
              <h4 className="mb-3 text-xs font-bold text-info-ink uppercase tracking-wider">
                {group}
              </h4>
              <div className="flex flex-wrap gap-2">
                {perms.map((p) => (
                  <Badge key={p} intent="info">
                    ✓ {p}
                  </Badge>
                ))}
              </div>
            </CardBody>
          </Card>
        ))
      )}
    </div>
  );
}
