// components/declarations/DocsAdminTab.tsx
// Separador "Gerir Pedidos" — KPIs + tabela de todos os pedidos de
// documento, com aprovar/gerar. Puramente apresentacional; as acções
// (aprovar/gerar) chegam via props — quem chama a API e recarrega os dados
// é o container. Migrado para a fundação de design: <table> cru passa a
// Table/TableHead/TableBody/TableRow/TableHeaderCell/TableCell
// (components/ui/Table); botões de acção passam a IconButton
// (components/ui/Button). Extraído de app/(platform)/declarations/page.tsx.

import { Check, CheckCircle2, Clock, FileCheck, FileText } from 'lucide-react';
import { IconButton } from '@/components/ui/Button';
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
import type { DashboardData, DocRequest } from './types';

export interface DocsAdminTabProps {
  docDash: DashboardData | null;
  allDocs: { data: DocRequest[] } | null;
  onApprove: (id: number) => void;
  onGenerate: (id: number) => void;
}

const HEADERS = ['Colaborador', 'Template', 'Finalidade', 'Estado', 'Data', 'Acções'];

export function DocsAdminTab({
  docDash,
  allDocs,
  onApprove,
  onGenerate,
}: DocsAdminTabProps) {
  return (
    <div className="space-y-5">
      {docDash && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard label="Pendentes" value={docDash.kpis.pending} icon={Clock} intent="warning" />
          <KpiCard label="Gerados" value={docDash.kpis.generated} icon={FileCheck} intent="info" />
          <KpiCard
            label="Emitidos"
            value={docDash.kpis.issued}
            icon={CheckCircle2}
            intent="success"
          />
          <KpiCard label="Total" value={docDash.kpis.total} icon={FileText} intent="accent" />
        </div>
      )}
      <div>
        <h2 className="mb-3 font-display text-sm font-semibold text-ink">Todos os Pedidos</h2>
        <Table>
          <TableHead>
            <TableRow>
              {HEADERS.map((h) => (
                <TableHeaderCell key={h}>{h}</TableHeaderCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {allDocs?.data.map((d) => (
              <TableRow key={d.id} className="group">
                <TableCell className="font-body text-sm font-medium text-ink">
                  {d.user?.name}
                </TableCell>
                <TableCell className="font-body text-sm text-ink-muted">
                  {d.template?.name}
                </TableCell>
                <TableCell className="font-body text-sm text-ink-faint">
                  {d.purpose?.name ?? '—'}
                </TableCell>
                <TableCell>
                  <StatusBadge status={d.status} type="doc" />
                </TableCell>
                <TableCell className="font-body text-xs text-ink-faint">
                  {new Date(d.createdAt).toLocaleDateString('pt-PT')}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {d.status === 'PENDING' && (
                      <IconButton
                        icon={Check}
                        label="Aprovar"
                        intent="ghost"
                        onClick={() => onApprove(d.id)}
                      />
                    )}
                    {d.status === 'APPROVED' && (
                      <IconButton
                        icon={FileCheck}
                        label="Gerar documento"
                        intent="ghost"
                        onClick={() => onGenerate(d.id)}
                      />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
