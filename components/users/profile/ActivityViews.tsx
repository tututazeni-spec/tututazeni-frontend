// components/users/profile/ActivityViews.tsx
// Histórico e actividade (apresentação).

import { CalendarDays, CheckCircle2, Flame, Zap } from 'lucide-react';
import { formatDate as fmtDate } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import type { QueryData } from '@/hooks/useUserProfileData';
import { LoadingRows } from './shared';
import { type UserTimelineResponse, type UserActivityStats } from '../types';
import { EmptyState } from '@/components/ui/EmptyState';

export function HistoryView({
  data,
  isLoading,
}: QueryData<UserTimelineResponse>) {
  if (isLoading) return <LoadingRows />;
  if (!data || data.data.length === 0)
    return <EmptyState title="Sem histórico registado" />;

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Evento</TableHeaderCell>
          <TableHeaderCell>Módulo</TableHeaderCell>
          <TableHeaderCell>Data</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.data.map((e) => (
          <TableRow key={e.id}>
            <TableCell>
              <span className="mr-2">{e.icon}</span>
              <span className="text-sm text-ink">{e.title ?? e.category}</span>
              {e.milestone && (
                <Badge intent="warning" className="ml-2">
                  Marco
                </Badge>
              )}
            </TableCell>
            <TableCell className="text-xs text-ink-muted">{e.module}</TableCell>
            <TableCell className="text-xs text-ink-faint">
              {fmtDate(e.timestamp)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function ActivityView({
  data,
  isLoading,
}: QueryData<UserActivityStats>) {
  if (isLoading) return <LoadingRows />;
  if (!data) return <EmptyState title="Sem dados de actividade" />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <NavyStatCard
          icon={Flame}
          tone="orange"
          label="Sequência activa"
          value={`${data.streak} dias`}
        />
        <NavyStatCard
          icon={CalendarDays}
          tone="blue"
          label="Dias activos (1 ano)"
          value={data.activeDays}
        />
        <NavyStatCard
          icon={CheckCircle2}
          tone="green"
          label="Taxa de conclusão"
          value={`${data.completionRate}%`}
        />
        <NavyStatCard
          icon={Zap}
          tone="blue"
          label="Pontos (XP)"
          value={data.xpPoints}
        />
      </div>
      <Card className="p-5">
        <div className="text-xs font-medium text-ink-faint uppercase tracking-wide mb-3">
          Actividade por categoria
        </div>
        {Object.keys(data.byCategory).length === 0 ? (
          <div className="text-xs text-ink-faint">
            Sem eventos no último ano
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(data.byCategory).map(([cat, count]) => (
              <Badge key={cat} intent="neutral">
                {cat}: {count}
              </Badge>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
