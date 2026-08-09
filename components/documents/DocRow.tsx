// components/documents/DocRow.tsx
// Linha de documento na vista em lista. Extraído de
// app/(platform)/documents/page.tsx.

'use client';

import { Download, Eye } from 'lucide-react';
import { CATEGORY_CONFIG, getFileIcon } from './constants';
import { formatBytes } from './utils';
import type { Document } from './types';

interface DocRowProps {
  doc: Document;
  onView: (d: Document) => void;
  onDownload: (d: Document) => void;
}

export function DocRow({ doc, onView, onDownload }: DocRowProps) {
  const Icon = getFileIcon(doc.mimeType);
  const catCfg = CATEGORY_CONFIG[doc.category];
  const isExpired = doc.status === 'EXPIRED';
  const isExpiring =
    doc.expiresAt &&
    new Date(doc.expiresAt) < new Date(Date.now() + 30 * 86400000);

  return (
    <tr
      className="hover:bg-gray-50/50 group cursor-pointer"
      onClick={() => onView(doc)}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Icon
            size={16}
            className={isExpired ? 'text-red-400' : 'text-blue-500'}
          />
          <div>
            <p
              className={`text-sm font-medium group-hover:text-blue-600 transition-colors ${isExpired ? 'text-red-700' : 'text-gray-900'}`}
            >
              {doc.title}
            </p>
            {doc.tags.length > 0 && (
              <p className="text-xs text-gray-400">
                {doc.tags.slice(0, 3).join(' · ')}
              </p>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${catCfg.color}`}
        >
          {catCfg.label}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-gray-500">
        {doc.createdBy?.name ?? '—'}
      </td>
      <td className="px-4 py-3 text-xs text-gray-500">
        {formatBytes(doc.fileSize)}
      </td>
      <td className="px-4 py-3 text-xs">
        {isExpired ? (
          <span className="text-red-600 font-medium">Expirado</span>
        ) : isExpiring ? (
          <span className="text-amber-600 font-medium">
            {new Date(doc.expiresAt!).toLocaleDateString('pt-PT')}
          </span>
        ) : (
          <span className="text-gray-400">
            {doc.expiresAt
              ? new Date(doc.expiresAt).toLocaleDateString('pt-PT')
              : '—'}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-gray-400">v{doc.version}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView(doc);
            }}
            className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600"
          >
            <Eye size={13} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload(doc);
            }}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            <Download size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
}
