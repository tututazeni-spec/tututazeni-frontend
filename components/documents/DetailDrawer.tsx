// components/documents/DetailDrawer.tsx
// Painel lateral de detalhe do documento seleccionado. Extraído de
// app/(platform)/documents/page.tsx.

'use client';

import { Download, History, Share2, X } from 'lucide-react';
import { CATEGORY_CONFIG } from './constants';
import { formatBytes } from './utils';
import type { Document } from './types';

interface DetailDrawerProps {
  doc: Document;
  onClose: () => void;
  onDownload: (d: Document) => void;
}

export function DetailDrawer({ doc, onClose, onDownload }: DetailDrawerProps) {
  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex justify-end"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">{doc.title}</h2>
              <span
                className={`mt-1 inline-block text-xs px-2.5 py-0.5 rounded-full font-medium ${CATEGORY_CONFIG[doc.category]?.color}`}
              >
                {CATEGORY_CONFIG[doc.category]?.label}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"
            >
              <X size={18} />
            </button>
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
              className="flex justify-between py-2 border-b border-gray-50 last:border-0 text-sm"
            >
              <span className="text-gray-500">{row.label}</span>
              <span className="font-medium text-gray-900">{row.value}</span>
            </div>
          ))}

          {doc.tags.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {doc.tags.map((t) => (
                  <span
                    key={t}
                    className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => onDownload(doc)}
              className="flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Download size={15} /> Download
            </button>
            <button className="flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <Share2 size={15} /> Partilhar
            </button>
            <button className="flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <History size={15} /> Histórico de versões
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
