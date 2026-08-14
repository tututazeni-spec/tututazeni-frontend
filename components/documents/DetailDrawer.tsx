// components/documents/DetailDrawer.tsx
// Painel lateral de detalhe do documento seleccionado. Extraído de
// app/(platform)/documents/page.tsx. Migrado para a fundação de design:
// classes Tailwind cruas passam a tokens; pill de categoria passa a Badge;
// botões de acção passam a Button; botão fechar passa a IconButton. Mantém-
// se bespoke (não Radix Dialog) — é um painel lateral, não há um componente
// "Drawer" na fundação (components/ui/) e não é para inventar um a meio
// deste módulo; comportamento idêntico ao original (fecha por clique no
// backdrop ou no X).

'use client';

import { Download, History, Share2, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { CATEGORY_CONFIG } from './constants';
import { formatBytes } from './utils';
import type { Document } from './types';

interface DetailDrawerProps {
  doc: Document;
  onClose: () => void;
  onDownload: (d: Document) => void;
}

export function DetailDrawer({ doc, onClose, onDownload }: DetailDrawerProps) {
  const catCfg = CATEGORY_CONFIG[doc.category];

  return (
    <div
      className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-40 flex justify-end"
      onClick={onClose}
    >
      <div
        className="bg-surface w-full max-w-md h-full overflow-y-auto shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-border">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-bold text-ink text-lg">{doc.title}</h2>
              {catCfg && (
                <Badge intent={catCfg.intent} className="mt-1.5">
                  {catCfg.label}
                </Badge>
              )}
            </div>
            <IconButton icon={X} label="Fechar" intent="ghost" onClick={onClose} />
          </div>
        </div>

        <div className="p-6 space-y-4">
          {[
            { label: 'Versão', value: doc.version },
            { label: 'Tamanho', value: formatBytes(doc.fileSize) },
            { label: 'Departamento', value: doc.department ?? '—' },
            {
              label: 'Criado por',
              value: doc.createdBy?.name ?? '—',
            },
            {
              label: 'Proprietário',
              value: doc.owner?.name ?? '—',
            },
            {
              label: 'Validade',
              value: doc.expiresAt
                ? new Date(doc.expiresAt).toLocaleDateString('pt-PT')
                : '—',
            },
            {
              label: 'Retenção legal',
              value: doc.retentionUntil
                ? new Date(doc.retentionUntil).toLocaleDateString('pt-PT')
                : '—',
            },
            {
              label: 'Downloads',
              value: String(doc.downloadCount ?? 0),
            },
            {
              label: 'Versões',
              value: String(doc._count?.versions ?? 1),
            },
          ].map((row) => (
            <div
              key={row.label}
              className="flex justify-between py-2 border-b border-border last:border-0 text-sm"
            >
              <span className="text-ink-muted">{row.label}</span>
              <span className="font-medium text-ink">{row.value}</span>
            </div>
          ))}

          {doc.tags.length > 0 && (
            <div>
              <p className="text-xs text-ink-muted mb-2">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {doc.tags.map((t) => (
                  <span
                    key={t}
                    className="text-xs bg-surface-sunken text-ink-muted px-2 py-0.5 rounded-pill"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <Button onClick={() => onDownload(doc)}>
              <Download size={15} strokeWidth={1.75} /> Download
            </Button>
            <Button intent="secondary">
              <Share2 size={15} strokeWidth={1.75} /> Partilhar
            </Button>
            <Button intent="secondary">
              <History size={15} strokeWidth={1.75} /> Histórico de versões
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
