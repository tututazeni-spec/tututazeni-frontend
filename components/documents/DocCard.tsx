// components/documents/DocCard.tsx
// Cartão de documento na vista em grelha. Desenho igual ao dos cartões do
// separador Repositório (content-library/ContentCard): miniatura em cima com
// ícone do ficheiro, selos no canto e acções à direita; corpo com selo de
// categoria, título e linha de metadados. A informação é a do documento
// (categoria, versão, sensibilidade, tamanho, validade, tags).

'use client';

import {
  AlertCircle,
  Download,
  Eye,
  MoreHorizontal,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody } from '@/components/ui/Card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { CATEGORY_CONFIG, SENSITIVITY_CONFIG, getFileIcon } from './constants';
import { formatBytes } from '@/lib/format';
import type { Document } from './types';
import { formatDateNumeric } from '@/lib/format';

interface DocCardProps {
  doc: Document;
  onView: (d: Document) => void;
  onDownload: (d: Document) => void;
  /** Só passado a quem pode apagar (ADMIN): envia para a reciclagem. */
  onDelete?: (d: Document) => void;
}

export function DocCard({ doc, onView, onDownload, onDelete }: DocCardProps) {
  const Icon = getFileIcon(doc.mimeType);
  const catCfg = CATEGORY_CONFIG[doc.category];
  const sensCfg = SENSITIVITY_CONFIG[doc.sensitivity];
  const SensIcon = sensCfg.icon;

  const isExpiringSoon =
    doc.expiresAt &&
    new Date(doc.expiresAt) < new Date(Date.now() + 30 * 86400000) &&
    doc.status === 'ACTIVE';
  const isExpired = doc.status === 'EXPIRED';

  const open = () => onView(doc);
  // O olho da miniatura abre o ficheiro carregado; o resto do cartão abre o detalhe.
  const openFile = () => onDownload(doc);

  return (
    <Card className="group cursor-pointer overflow-hidden transition-shadow hover:shadow-hover">
      {/* Miniatura */}
      <div
        className={`relative flex h-36 items-center justify-center ${isExpired ? 'bg-danger-subtle' : 'bg-surface-sunken'}`}
        onClick={openFile}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openFile();
          }
        }}
      >
        <Icon
          size={24}
          strokeWidth={1.75}
          className={isExpired ? 'text-danger' : 'text-ink-faint'}
        />
        {/* Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-ink/20 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface/90 shadow-elevated">
            <Eye size={18} strokeWidth={1.75} className="text-ink" />
          </div>
        </div>
        {/* Selos */}
        <div className="absolute left-2 top-2 flex gap-1">
          {isExpired && (
            <span className="rounded bg-danger px-1.5 py-0.5 font-body text-micro font-bold text-canvas">
              EXPIRADO
            </span>
          )}
          {doc.version !== '1.0' && (
            <span className="rounded bg-primary px-1.5 py-0.5 font-body text-micro font-bold text-canvas">
              v{doc.version}
            </span>
          )}
        </div>
        {/* Acções */}
        <div
          className="absolute right-2 top-2 flex gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {onDelete && (
            <button
              onClick={() => onDelete(doc)}
              aria-label="Apagar documento"
              className="rounded-full bg-surface/80 p-1.5 transition-colors hover:bg-surface"
            >
              <Trash2 size={14} strokeWidth={1.75} className="text-danger" />
            </button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Mais ações"
                className="rounded-full bg-surface/80 p-1.5 transition-colors hover:bg-surface"
              >
                <MoreHorizontal
                  size={14}
                  strokeWidth={1.75}
                  className="text-ink-muted"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onDownload(doc)}>
                <span className="flex items-center gap-2">
                  <Download size={13} strokeWidth={1.75} /> Download
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={open}>
                <span className="flex items-center gap-2">
                  <Eye size={13} strokeWidth={1.75} /> Ver detalhe
                </span>
              </DropdownMenuItem>
              {onDelete && (
                <DropdownMenuItem onSelect={() => onDelete(doc)}>
                  <span className="flex items-center gap-2 text-danger">
                    <Trash2 size={13} strokeWidth={1.75} /> Apagar
                  </span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Corpo */}
      <CardBody className="p-3" onClick={open}>
        <div className="mb-1.5 flex items-center gap-2">
          <Badge intent={catCfg.intent} className="py-0">
            {catCfg.label}
          </Badge>
        </div>

        <h4 className="mb-1 line-clamp-2 font-body text-sm font-semibold leading-snug text-ink">
          {doc.title}
        </h4>

        <div className="flex items-center gap-3 font-body text-micro text-ink-faint">
          <span className="flex items-center gap-0.5">
            <SensIcon size={14} strokeWidth={1.75} className={sensCfg.color} />
            <span className={sensCfg.color}>{sensCfg.label}</span>
          </span>
          <span>{formatBytes(doc.fileSize)}</span>
        </div>

        {(isExpiringSoon || isExpired) && (
          <div
            className={`mt-2 flex items-center gap-1.5 font-body text-micro font-medium ${isExpired ? 'text-danger' : 'text-warning-ink'}`}
          >
            <AlertCircle size={14} strokeWidth={1.75} />
            {isExpired
              ? 'Expirado'
              : `Expira ${formatDateNumeric(doc.expiresAt!)}`}
          </div>
        )}

        {doc.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {doc.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded bg-surface-sunken px-1.5 py-0.5 font-body text-micro text-ink-muted"
              >
                {t}
              </span>
            ))}
            {doc.tags.length > 3 && (
              <span className="font-body text-micro text-ink-faint">
                +{doc.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
