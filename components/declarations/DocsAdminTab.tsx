// components/declarations/DocsAdminTab.tsx
// Separador "Gerir Pedidos" — KPIs + tabela de todos os pedidos de
// documento, com aprovar/gerar. Puramente apresentacional; as acções
// (aprovar/gerar) chegam via props — quem chama a API e recarrega os dados
// é o container. Extraído de app/(platform)/declarations/page.tsx.

import { Check, CheckCircle2, Clock, FileCheck, FileText } from 'lucide-react';
import { KpiCard } from './KpiCard';
import { StatusBadge } from './StatusBadge';
import type { DashboardData, DocRequest } from './types';

export interface DocsAdminTabProps {
  docDash: DashboardData | null;
  allDocs: { data: DocRequest[] } | null;
  onApprove: (id: number) => void;
  onGenerate: (id: number) => void;
}

export function DocsAdminTab({
  docDash,
  allDocs,
  onApprove,
  onGenerate,
}: DocsAdminTabProps) {
  return (
    <div className="space-y-5">
      {docDash && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            label="Pendentes"
            value={docDash.kpis.pending}
            icon={Clock}
            color="amber"
          />
          <KpiCard
            label="Gerados"
            value={docDash.kpis.generated}
            icon={FileCheck}
            color="blue"
          />
          <KpiCard
            label="Emitidos"
            value={docDash.kpis.issued}
            icon={CheckCircle2}
            color="emerald"
          />
          <KpiCard
            label="Total"
            value={docDash.kpis.total}
            icon={FileText}
            color="violet"
          />
        </div>
      )}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">
            Todos os Pedidos
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/60">
                {[
                  'Colaborador',
                  'Template',
                  'Finalidade',
                  'Estado',
                  'Data',
                  'Acções',
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {allDocs?.data.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50/40 group">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {d.user?.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {d.template?.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {d.purpose?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={d.status} type="doc" />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(d.createdAt).toLocaleDateString('pt-PT')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {d.status === 'PENDING' && (
                        <button
                          onClick={() => onApprove(d.id)}
                          className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-600"
                        >
                          <Check size={13} />
                        </button>
                      )}
                      {d.status === 'APPROVED' && (
                        <button
                          onClick={() => onGenerate(d.id)}
                          className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600"
                        >
                          <FileCheck size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
