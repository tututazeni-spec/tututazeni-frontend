// components/users/profile/RecordsViews.tsx
// Documentos, férias/licenças e presenças (apresentação).

import {
  CalendarCheck,
  CalendarDays,
  Clock,
  UserCheck,
  UserX,
} from 'lucide-react';
import { formatDate as fmtDate } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
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
import { EmptyState, LoadingRows } from './shared';
import {
  approvedIntent,
  attendanceIntent,
  recentAttendance,
  sensitivityIntent,
} from './logic';
import {
  type DocumentsResponse,
  type LeaveRequestsResponse,
  type LeaveBalanceEntry,
  type AttendanceResponse,
} from '../types';

export function DocumentsView({
  data,
  isLoading,
}: QueryData<DocumentsResponse>) {
  if (isLoading) return <LoadingRows />;
  if (!data || data.data.length === 0)
    return <EmptyState>Sem documentos associados</EmptyState>;

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Documento</TableHeaderCell>
          <TableHeaderCell>Categoria</TableHeaderCell>
          <TableHeaderCell>Sensibilidade</TableHeaderCell>
          <TableHeaderCell>Criado em</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.data.map((d) => (
          <TableRow key={d.id}>
            <TableCell className="text-sm font-medium text-ink">
              {d.title}
            </TableCell>
            <TableCell className="text-xs text-ink-muted">
              {d.category ?? '—'}
            </TableCell>
            <TableCell>
              <Badge intent={sensitivityIntent(d.sensitivity)}>
                {d.sensitivity}
              </Badge>
            </TableCell>
            <TableCell className="text-xs text-ink-faint">
              {fmtDate(d.createdAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function LeaveView({
  requests,
  balance,
  isLoading,
}: {
  requests: LeaveRequestsResponse | undefined;
  balance: LeaveBalanceEntry[] | undefined;
  isLoading: boolean;
}) {
  if (isLoading) return <LoadingRows />;

  return (
    <div className="space-y-4">
      {balance && balance.length > 0 && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {balance.map((b) => (
            <NavyStatCard
              icon={CalendarDays}
              tone="blue"
              key={b.leaveTypeCode}
              label={b.leaveTypeCode}
              value={b.balance}
              sub={`${b.used} usados`}
            />
          ))}
        </div>
      )}
      {!requests || requests.data.length === 0 ? (
        <EmptyState>Sem pedidos de férias/licença</EmptyState>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Tipo</TableHeaderCell>
              <TableHeaderCell>Período</TableHeaderCell>
              <TableHeaderCell>Dias</TableHeaderCell>
              <TableHeaderCell>Estado</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.data.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-sm text-ink">
                  {r.leaveTypeCode}
                </TableCell>
                <TableCell className="text-xs text-ink-faint">
                  {fmtDate(r.startDate)} — {fmtDate(r.endDate)}
                </TableCell>
                <TableCell className="text-xs font-mono text-ink-muted">
                  {r.workDays}
                </TableCell>
                <TableCell>
                  <Badge intent={approvedIntent(r.status)}>{r.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

export function AttendanceView({
  data,
  isLoading,
}: QueryData<AttendanceResponse>) {
  if (isLoading) return <LoadingRows />;
  if (!data || data.records.length === 0)
    return <EmptyState>Sem registos de presença</EmptyState>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <NavyStatCard
          icon={CalendarCheck}
          tone="green"
          label="Taxa de presença"
          value={`${data.summary.attendanceRate}%`}
        />
        <NavyStatCard
          icon={UserCheck}
          tone="blue"
          label="Presente"
          value={data.summary.presentDays}
        />
        <NavyStatCard
          icon={Clock}
          tone="orange"
          label="Atrasos"
          value={data.summary.lateDays}
        />
        <NavyStatCard
          icon={UserX}
          tone="red"
          label="Ausências"
          value={data.summary.absentDays}
        />
      </div>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Data</TableHeaderCell>
            <TableHeaderCell>Entrada</TableHeaderCell>
            <TableHeaderCell>Saída</TableHeaderCell>
            <TableHeaderCell>Estado</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {recentAttendance(data.records).map((r) => (
            <TableRow key={r.id}>
              <TableCell className="text-xs text-ink-faint">
                {fmtDate(r.date)}
              </TableCell>
              <TableCell className="text-xs font-mono text-ink-muted">
                {r.clockIn ?? '—'}
              </TableCell>
              <TableCell className="text-xs font-mono text-ink-muted">
                {r.clockOut ?? '—'}
              </TableCell>
              <TableCell>
                <Badge intent={attendanceIntent(r.status)}>{r.status}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
