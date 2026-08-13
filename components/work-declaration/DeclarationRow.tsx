// components/work-declaration/DeclarationRow.tsx
// Linha da tabela de declarações, com menu de acções. Extraído de
// app/(platform)/work-declaration/page.tsx. `<tr>`/`<td>` crus passam a
// TableRow/TableCell (components/ui/Table); botões de ícone passam a
// IconButton; o menu de acções local (useState + posicionamento absolute
// manual) passa a DropdownMenu (Radix, components/ui/DropdownMenu) — já
// não precisa do useState(menuOpen) bespoke.

'use client';

import {
  ArrowUpRight,
  Download,
  Eye,
  FileSignature,
  MoreHorizontal,
  QrCode,
  Send,
  XCircle,
} from 'lucide-react';
import { IconButton } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { TableCell, TableRow } from '@/components/ui/Table';
import { TYPE_LABELS } from './constants';
import { StatusBadge } from './StatusBadge';
import type { Declaration } from './types';

interface DeclarationRowProps {
  dec: Declaration;
  onAction: (action: string, id: string) => void;
}

export function DeclarationRow({ dec, onAction }: DeclarationRowProps) {
  return (
    <TableRow className="group">
      {/* Code + Title */}
      <TableCell>
        <div className="flex flex-col gap-0.5">
          <span className="font-data text-xs text-ink-faint">{dec.code}</span>
          <span className="font-body text-sm font-medium leading-snug text-ink">
            {dec.title}
          </span>
          <span className="font-body text-xs text-ink-faint">{TYPE_LABELS[dec.type]}</span>
        </div>
      </TableCell>

      {/* Employee */}
      <TableCell>
        <div className="flex flex-col gap-0.5">
          <span className="font-body text-sm text-ink">{dec.employeeName}</span>
          <span className="font-body text-xs text-ink-faint">
            {dec.employeeRole} · {dec.department}
          </span>
        </div>
      </TableCell>

      {/* Status */}
      <TableCell>
        <StatusBadge status={dec.status} />
      </TableCell>

      {/* Dates */}
      <TableCell className="font-body text-xs text-ink-muted">
        <div className="flex flex-col gap-1">
          <span>Criada: {dec.createdAt}</span>
          {dec.issuedAt && <span>Emitida: {dec.issuedAt}</span>}
          {dec.expiresAt && (
            <span className={dec.status === 'expired' ? 'text-warning-ink' : 'text-ink-faint'}>
              Expira: {dec.expiresAt}
            </span>
          )}
        </div>
      </TableCell>

      {/* Actions */}
      <TableCell>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <IconButton
            icon={Eye}
            label="Ver detalhes"
            intent="ghost"
            onClick={() => onAction('view', dec.id)}
          />
          {(dec.status === 'issued' || dec.status === 'signed') && (
            <IconButton
              icon={Download}
              label="Exportar PDF"
              intent="ghost"
              onClick={() => onAction('pdf', dec.id)}
            />
          )}
          {dec.status === 'draft' && (
            <IconButton
              icon={ArrowUpRight}
              label="Emitir"
              intent="ghost"
              onClick={() => onAction('issue', dec.id)}
            />
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <IconButton icon={MoreHorizontal} label="Mais ações" intent="ghost" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onAction('send-email', dec.id)}>
                <span className="flex items-center gap-2">
                  <Send size={13} strokeWidth={1.75} /> Enviar por email
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onAction('qr', dec.id)}>
                <span className="flex items-center gap-2">
                  <QrCode size={13} strokeWidth={1.75} /> Ver QR Code
                </span>
              </DropdownMenuItem>
              {dec.status === 'issued' && (
                <DropdownMenuItem
                  className="text-success"
                  onSelect={() => onAction('sign', dec.id)}
                >
                  <span className="flex items-center gap-2">
                    <FileSignature size={13} strokeWidth={1.75} /> Assinar
                  </span>
                </DropdownMenuItem>
              )}
              {(dec.status === 'issued' || dec.status === 'signed') && (
                <DropdownMenuItem
                  className="text-danger"
                  onSelect={() => onAction('revoke', dec.id)}
                >
                  <span className="flex items-center gap-2">
                    <XCircle size={13} strokeWidth={1.75} /> Revogar
                  </span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}
