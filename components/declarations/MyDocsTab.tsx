// components/declarations/MyDocsTab.tsx
// Separador "Minhas Declarações" — lista de pedidos de documento do
// utilizador. Puramente apresentacional. Extraído de
// app/(platform)/declarations/page.tsx.

import { Download, FileText, Plus } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import type { DocRequest } from './types';

export interface MyDocsTabProps {
  myDocs: { data: DocRequest[] } | null;
  onRequestNew: () => void;
}

export function MyDocsTab({ myDocs, onRequestNew }: MyDocsTabProps) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            Meus Pedidos de Declaração
          </h2>
          <span className="text-xs text-gray-400">
            {myDocs?.data.length ?? 0} total
          </span>
        </div>
        <div className="divide-y divide-gray-50">
          {myDocs?.data.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-gray-400">
              <FileText size={40} className="mb-3 opacity-30" />
              <p className="text-sm">Nenhum pedido ainda</p>
              <button
                onClick={onRequestNew}
                className="mt-3 flex items-center gap-1.5 px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50"
              >
                <Plus size={13} /> Solicitar primeira declaração
              </button>
            </div>
          ) : (
            myDocs?.data.map((d) => (
              <div
                key={d.id}
                className="px-5 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {d.template?.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {d.purpose?.name && `${d.purpose.name} · `}
                      {new Date(d.createdAt).toLocaleDateString('pt-PT')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {d.referenceNumber && (
                    <span className="text-xs font-mono text-gray-400">
                      {d.referenceNumber}
                    </span>
                  )}
                  <StatusBadge status={d.status} type="doc" />
                  {(d.status === 'GENERATED' || d.status === 'ISSUED') && (
                    <button
                      aria-label="Descarregar"
                      className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Download size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
