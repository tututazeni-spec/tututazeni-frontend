// components/documents/DocCard.tsx
// Cartão de documento na vista em grelha. Extraído de
// app/(platform)/documents/page.tsx. Migrado para a fundação de design:
// classes Tailwind cruas passam a tokens; pill de categoria passa a Badge;
// menu de acções local (useState + posicionamento absolute manual) passa a
// DropdownMenu (Radix, components/ui/DropdownMenu), mesmo padrão de
// components/work-declaration/DeclarationRow.tsx.

'use client';

import { AlertCircle, Download, Eye, MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { CATEGORY_CONFIG, SENSITIVITY_CONFIG, getFileIcon } from './constants';
import { formatBytes } from './utils';
import type { Document } from './types';

interface DocCardProps {
  doc: Document;
  onView: (d: Document) => void;
  onDownload: (d: Document) => void;
}

export function DocCard({ doc, onView, onDownload }: DocCardProps) {
  const Icon = getFileIcon(doc.mimeType);
  const catCfg = CATEGORY_CONFIG[doc.category];
  const sensCfg = SENSITIVITY_CONFIG[doc.sensitivity];
  const SensIcon = sensCfg.icon;

  const isExpiringSoon =
    doc.expiresAt &&
    new Date(doc.expiresAt) < new Date(Date.now() + 30 * 86400000) &&
    doc.status === 'ACTIVE';
  const isExpired = doc.status === 'EXPIRED';

  return (
    <div
      className={`bg-surface rounded-panel border p-4 hover:shadow-hover transition-all group cursor-pointer ${isExpired ? 'border-danger-subtle bg-danger-subtle/40' : isExpiringSoon ? 'border-warning-subtle' : 'border-border hover:border-primary-subtle'}`}
      onClick={() => onView(doc)}
    >
      {/* Icon + menu */}
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-control flex items-center justify-center ${isExpired ? 'bg-danger-subtle' : 'bg-primary-subtle'}`}
        >
          <Icon
            size={20}
            strokeWidth={1.75}
            className={isExpired ? 'text-danger' : 'text-primary'}
          />
        </div>
        <div
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <IconButton
                icon={MoreHorizontal}
                label="Mais ações"
                intent="ghost"
                className="h-7 w-7"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onDownload(doc)}>
                <span className="flex items-center gap-2">
                  <Download size={13} strokeWidth={1.75} /> Download
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onView(doc)}>
                <span className="flex items-center gap-2">
                  <Eye size={13} strokeWidth={1.75} /> Ver detalhe
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Title */}
      <p className="text-sm font-semibold text-ink truncate group-hover:text-primary transition-colors">
        {doc.title}
      </p>

      {/* Meta */}
      <div className="mt-2 flex flex-wrap gap-1">
        <Badge intent={catCfg.intent} className="py-0">
          {catCfg.label}
        </Badge>
        {doc.version !== '1.0' && (
          <span className="text-xs px-2 py-0.5 rounded-pill bg-surface-sunken text-ink-muted">
            v{doc.version}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-ink-faint">
        <div className="flex items-center gap-1">
          <SensIcon size={11} strokeWidth={1.75} className={sensCfg.color} />
          <span className={sensCfg.color}>{sensCfg.label}</span>
        </div>
        <span>{formatBytes(doc.fileSize)}</span>
      </div>

      {/* Expiry warning */}
      {(isExpiringSoon || isExpired) && (
        <div
          className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${isExpired ? 'text-danger' : 'text-warning-ink'}`}
        >
          <AlertCircle size={11} strokeWidth={1.75} />
          {isExpired
            ? 'Expirado'
            : `Expira ${new Date(doc.expiresAt!).toLocaleDateString('pt-PT')}`}
        </div>
      )}

      {/* Tags */}
      {doc.tags.length > 0 && (
        <div className="mt-2 flex gap-1 flex-wrap">
          {doc.tags.slice(0, 3).map((t) => (
            <span
              key={t}
              className="text-xs bg-surface-sunken text-ink-muted px-1.5 py-0.5 rounded"
            >
              {t}
            </span>
          ))}
          {doc.tags.length > 3 && (
            <span className="text-xs text-ink-faint">
              +{doc.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
