// components/declarations/MyDocsTab.tsx
// Separador "Minhas Declarações" — lista de pedidos de documento do
// utilizador. Puramente apresentacional. Migrado para a fundação de
// design: card/lista bespoke passam a Card/CardHeader (components/ui/Card),
// o estado vazio passa a EmptyState (components/ui/EmptyState), e o botão
// de descarregar passa a IconButton (components/ui/Button). Extraído de
// app/(platform)/declarations/page.tsx.

import { Download, FileText } from 'lucide-react';
import { IconButton } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from './StatusBadge';
import type { DocRequest } from './types';

export interface MyDocsTabProps {
  myDocs: { data: DocRequest[] } | null;
  onRequestNew: () => void;
}

export function MyDocsTab({ myDocs, onRequestNew }: MyDocsTabProps) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold text-ink">
          Meus Pedidos de Declaração
        </h2>
        <span className="font-body text-xs text-ink-faint">
          {myDocs?.data.length ?? 0} total
        </span>
      </CardHeader>
      {myDocs?.data.length === 0 ? (
        <div className="p-5">
          <EmptyState
            icon={FileText}
            title="Nenhum pedido ainda"
            description="Solicite a sua primeira declaração para a ver aqui."
            action={{ label: 'Solicitar primeira declaração', onClick: onRequestNew }}
          />
        </div>
      ) : (
        <div className="divide-y divide-border">
          {myDocs?.data.map((d) => (
            <div key={d.id} className="group flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-control bg-info-subtle">
                  <FileText size={16} strokeWidth={1.75} className="text-info-ink" />
                </div>
                <div>
                  <p className="font-body text-sm font-semibold text-ink">{d.template?.name}</p>
                  <p className="mt-0.5 font-body text-xs text-ink-faint">
                    {d.purpose?.name && `${d.purpose.name} · `}
                    {new Date(d.createdAt).toLocaleDateString('pt-PT')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {d.referenceNumber && (
                  <span className="font-data text-xs text-ink-faint">{d.referenceNumber}</span>
                )}
                <StatusBadge status={d.status} type="doc" />
                {(d.status === 'GENERATED' || d.status === 'ISSUED') && (
                  <IconButton
                    icon={Download}
                    label="Descarregar"
                    intent="ghost"
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
