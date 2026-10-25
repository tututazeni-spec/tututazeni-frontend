// components/users/profile/AccessView.tsx
// Acesso e permissões (apresentação). Dados: hooks/useUserProfileData.ts.

import { formatDate as fmtDate } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import type { QueryData } from '@/hooks/useUserProfileData';
import { InfoCard, EmptyState, LoadingRows } from './shared';
import { accessProfileRows, accessSessionRows } from './logic';
import { type AccessOverview } from '../types';

export function AccessView({ data, isLoading }: QueryData<AccessOverview>) {
  if (isLoading) return <LoadingRows />;
  if (!data) return <EmptyState>Sem dados de acesso</EmptyState>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-5">
        <InfoCard title="Perfil de acesso" rows={accessProfileRows(data)} />
        <InfoCard title="Sessão" rows={accessSessionRows(data)} />
      </div>

      {data.authorizedModules.length > 0 && (
        <Card className="p-5">
          <div className="text-xs font-medium text-ink-faint uppercase tracking-wide mb-3">
            Módulos autorizados
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.authorizedModules.map((m) => (
              <Badge key={m} intent="info">
                {m}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border text-xs font-medium text-ink-faint uppercase tracking-wide">
          Permissões do perfil ({data.permissions.length})
        </div>
        {data.permissions.length === 0 ? (
          <EmptyState>Sem permissões atribuídas ao perfil</EmptyState>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Permissão</TableHeaderCell>
                <TableHeaderCell>Acção</TableHeaderCell>
                <TableHeaderCell>Módulo</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.permissions.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-xs font-medium text-ink">
                    {p.name}
                  </TableCell>
                  <TableCell className="text-xs text-ink-muted">
                    {p.action}
                  </TableCell>
                  <TableCell className="text-xs text-ink-muted">
                    {p.subject}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border text-xs font-medium text-ink-faint uppercase tracking-wide">
          Permissões especiais ({data.specialPermissions.length})
        </div>
        {data.specialPermissions.length === 0 ? (
          <EmptyState>Sem permissões especiais concedidas</EmptyState>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Permissão</TableHeaderCell>
                <TableHeaderCell>Concedida em</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.specialPermissions.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-xs font-medium text-ink">
                    {p.name}
                  </TableCell>
                  <TableCell className="text-xs text-ink-muted">
                    {p.grantedAt ? fmtDate(p.grantedAt) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
