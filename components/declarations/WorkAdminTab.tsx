// components/declarations/WorkAdminTab.tsx
// Separador "Compliance" — KPIs + tabela de submissões de vínculo laboral,
// com rever/rejeitar e disparo de lembretes. Puramente apresentacional; as
// acções chegam via props. Migrado para a fundação de design: <table> cru
// passa a Table/TableHead/TableBody/TableRow/TableHeaderCell/TableCell
// (components/ui/Table); botões passam a Button/IconButton
// (components/ui/Button); estado passa a StatusBadge local (Badge da
// fundação). O pill de "Tipo" não é um estado — fica como pílula neutra de
// tokens em vez do Badge (que sempre desenha o ponto de estado). Extraído
// de app/(platform)/declarations/page.tsx.

import { Bell, BarChart3, Check, CheckCircle2, Clock, Shield, X } from 'lucide-react';
import { Button, IconButton } from '@/components/ui/Button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import { KpiCard } from './KpiCard';
import { StatusBadge } from './StatusBadge';
import { WORK_TYPE_LABELS } from './constants';
import type { WorkDashboard, WorkSubmission } from './types';

export interface WorkAdminTabProps {
  workDash: WorkDashboard | null;
  workSubs: { data: WorkSubmission[] } | null;
  onReview: (id: number, approved: boolean) => void;
  onTriggerReminders: () => void;
}

const HEADERS = ['Colaborador', 'Formulário', 'Tipo', 'Estado', 'Submissão', 'Acções'];

export function WorkAdminTab({
  workDash,
  workSubs,
  onReview,
  onTriggerReminders,
}: WorkAdminTabProps) {
  return (
    <div className="space-y-5">
      {workDash && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard label="Pendentes" value={workDash.kpis.pending} icon={Clock} intent="warning" />
          <KpiCard
            label="Aprovadas"
            value={workDash.kpis.approved}
            icon={CheckCircle2}
            intent="success"
          />
          <KpiCard
            label="Conformidade"
            value={`${workDash.kpis.completionRate}%`}
            icon={Shield}
            intent="info"
          />
          <KpiCard label="Total" value={workDash.kpis.total} icon={BarChart3} intent="accent" />
        </div>
      )}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold text-ink">
            Submissões de Declarações
          </h2>
          <Button intent="secondary" size="sm" onClick={onTriggerReminders}>
            <Bell size={14} strokeWidth={1.75} /> Enviar lembretes
          </Button>
        </div>
        <Table>
          <TableHead>
            <TableRow>
              {HEADERS.map((h) => (
                <TableHeaderCell key={h}>{h}</TableHeaderCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {workSubs?.data.map((s) => (
              <TableRow key={s.id} className="group">
                <TableCell className="font-body text-sm font-medium text-ink">
                  {s.user?.name}
                </TableCell>
                <TableCell className="font-body text-sm text-ink-muted">{s.form?.title}</TableCell>
                <TableCell>
                  <span className="rounded-pill bg-surface-sunken px-2 py-0.5 font-body text-xs text-ink-muted">
                    {s.form?.type ? WORK_TYPE_LABELS[s.form.type] : '—'}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusBadge status={s.status} type="work" />
                </TableCell>
                <TableCell className="font-body text-xs text-ink-faint">
                  {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString('pt-PT') : '—'}
                </TableCell>
                <TableCell>
                  {s.status === 'SUBMITTED' && (
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <IconButton
                        icon={Check}
                        label="Aprovar"
                        intent="ghost"
                        onClick={() => onReview(s.id, true)}
                      />
                      <IconButton
                        icon={X}
                        label="Rejeitar"
                        intent="ghost"
                        onClick={() => onReview(s.id, false)}
                      />
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {workSubs?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center font-body text-sm text-ink-faint">
                  Sem submissões
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
