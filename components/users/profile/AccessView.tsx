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
import { InfoCard, LoadingRows } from './shared';
import { accessProfileRows, accessSessionRows } from './logic';
import { type AccessOverview } from '../types';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  translateAction,
  translateResource,
} from '@/components/roles-permissions/permissionLabels';

// Módulo em português; "Dashboard" mantém-se como está.
const moduleLabel = (subject: string): string =>
  subject.toUpperCase() === 'DASHBOARD'
    ? 'Dashboard'
    : translateResource(subject);

// O `name` das permissões vem da API em formatos inconsistentes; o rótulo é
// composto por acção + módulo, que são fiáveis.
const permissionLabel = (p: { action: string; subject: string }): string =>
  `${translateAction(p.action)} · ${moduleLabel(p.subject)}`;

export function AccessView({ data, isLoading }: QueryData<AccessOverview>) {
  if (isLoading) return <LoadingRows />;
  if (!data) return <EmptyState title="Sem dados de acesso" />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-5">
        <InfoCard title="Perfil de acesso" rows={accessProfileRows(data)} />
        <InfoCard title="Sessão" rows={accessSessionRows(data)} />
      </div>

      {data.authorizedModules.length > 0 && (
        <Card className="overflow-hidden">
          <div className="bg-brand/60 px-4 py-3 text-xs font-medium uppercase tracking-wide text-white">
            Módulos autorizados
          </div>
          <div className="flex flex-wrap gap-1.5 p-5">
            {data.authorizedModules.map((m) => (
              <Badge key={m} intent="info">
                {moduleLabel(m)}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="bg-brand/60 px-4 py-3 text-xs font-medium uppercase tracking-wide text-white">
          Permissões do perfil ({data.permissions.length})
        </div>
        {data.permissions.length === 0 ? (
          <EmptyState title="Sem permissões atribuídas ao perfil" />
        ) : (
          <Table>
            <TableHead className="bg-brand-dark [&_th]:text-white">
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
                    {permissionLabel(p)}
                  </TableCell>
                  <TableCell className="text-xs text-ink-muted">
                    {translateAction(p.action)}
                  </TableCell>
                  <TableCell className="text-xs text-ink-muted">
                    {moduleLabel(p.subject)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card className="overflow-hidden">
        <div className="bg-brand/60 px-4 py-3 text-xs font-medium uppercase tracking-wide text-white">
          Permissões especiais ({data.specialPermissions.length})
        </div>
        {data.specialPermissions.length === 0 ? (
          <EmptyState title="Sem permissões especiais concedidas" />
        ) : (
          <Table>
            <TableHead className="bg-brand-dark [&_th]:text-white">
              <TableRow>
                <TableHeaderCell>Permissão</TableHeaderCell>
                <TableHeaderCell>Concedida em</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.specialPermissions.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-xs font-medium text-ink">
                    {permissionLabel(p)}
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
