// components/documents/DocRow.tsx
// Linha de documento na vista em lista. Extraído de
// app/(platform)/documents/page.tsx. Migrado para a fundação de design:
// `<tr>`/`<td>` crus passam a TableRow/TableCell (components/ui/Table); pill
// de categoria passa a Badge; classes Tailwind cruas passam a tokens.

'use client';

import { Download, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/Button';
import { TableCell, TableRow } from '@/components/ui/Table';
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
    <TableRow className="group cursor-pointer" onClick={() => onView(doc)}>
      <TableCell>
        <div className="flex items-center gap-3">
          <Icon
            size={16}
            strokeWidth={1.75}
            className={isExpired ? 'text-danger' : 'text-primary'}
          />
          <div>
            <p
              className={`text-sm font-medium group-hover:text-primary transition-colors ${isExpired ? 'text-danger-ink' : 'text-ink'}`}
            >
              {doc.title}
            </p>
            {doc.tags.length > 0 && (
              <p className="text-xs text-ink-faint">
                {doc.tags.slice(0, 3).join(' · ')}
              </p>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge intent={catCfg.intent} className="py-0">
          {catCfg.label}
        </Badge>
      </TableCell>
      <TableCell className="text-xs text-ink-muted">
        {doc.createdBy?.name ?? '—'}
      </TableCell>
      <TableCell className="text-xs text-ink-muted">
        {formatBytes(doc.fileSize)}
      </TableCell>
      <TableCell className="text-xs">
        {isExpired ? (
          <span className="text-danger font-medium">Expirado</span>
        ) : isExpiring ? (
          <span className="text-warning-ink font-medium">
            {new Date(doc.expiresAt!).toLocaleDateString('pt-PT')}
          </span>
        ) : (
          <span className="text-ink-faint">
            {doc.expiresAt
              ? new Date(doc.expiresAt).toLocaleDateString('pt-PT')
              : '—'}
          </span>
        )}
      </TableCell>
      <TableCell className="text-xs text-ink-faint">v{doc.version}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <IconButton
            icon={Eye}
            label="Ver detalhe"
            intent="ghost"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              onView(doc);
            }}
          />
          <IconButton
            icon={Download}
            label="Download"
            intent="ghost"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              onDownload(doc);
            }}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}
