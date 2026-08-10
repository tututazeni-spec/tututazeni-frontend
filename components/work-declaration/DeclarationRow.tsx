// components/work-declaration/DeclarationRow.tsx
// Linha da tabela de declarações, com menu de acções. Extraído de
// app/(platform)/work-declaration/page.tsx.

'use client';

import { useState } from 'react';
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
import { TYPE_LABELS } from './constants';
import { StatusBadge } from './StatusBadge';
import type { Declaration } from './types';

interface DeclarationRowProps {
  dec: Declaration;
  onAction: (action: string, id: string) => void;
}

export function DeclarationRow({ dec, onAction }: DeclarationRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
      {/* Code + Title */}
      <td className="px-5 py-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-mono text-slate-500">{dec.code}</span>
          <span className="text-sm font-medium text-white leading-snug">
            {dec.title}
          </span>
          <span className="text-xs text-slate-500">
            {TYPE_LABELS[dec.type]}
          </span>
        </div>
      </td>

      {/* Employee */}
      <td className="px-5 py-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-white">{dec.employeeName}</span>
          <span className="text-xs text-slate-500">
            {dec.employeeRole} · {dec.department}
          </span>
        </div>
      </td>

      {/* Status */}
      <td className="px-5 py-4">
        <StatusBadge status={dec.status} />
      </td>

      {/* Dates */}
      <td className="px-5 py-4 text-xs text-slate-400">
        <div className="flex flex-col gap-1">
          <span>Criada: {dec.createdAt}</span>
          {dec.issuedAt && <span>Emitida: {dec.issuedAt}</span>}
          {dec.expiresAt && (
            <span
              className={
                dec.status === 'expired' ? 'text-amber-400' : 'text-slate-500'
              }
            >
              Expira: {dec.expiresAt}
            </span>
          )}
        </div>
      </td>

      {/* Actions */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onAction('view', dec.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Ver detalhes"
          >
            <Eye size={14} />
          </button>
          {(dec.status === 'issued' || dec.status === 'signed') && (
            <button
              onClick={() => onAction('pdf', dec.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-sky-900/30 transition-colors"
              title="Exportar PDF"
            >
              <Download size={14} />
            </button>
          )}
          {dec.status === 'draft' && (
            <button
              onClick={() => onAction('issue', dec.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-900/30 transition-colors"
              title="Emitir"
            >
              <ArrowUpRight size={14} />
            </button>
          )}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <MoreHorizontal size={14} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 z-50 w-44 rounded-xl bg-[#1a2235] border border-white/10 shadow-xl py-1">
                <button
                  onClick={() => {
                    onAction('send-email', dec.id);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5"
                >
                  <Send size={13} /> Enviar por email
                </button>
                <button
                  onClick={() => {
                    onAction('qr', dec.id);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5"
                >
                  <QrCode size={13} /> Ver QR Code
                </button>
                {dec.status === 'issued' && (
                  <button
                    onClick={() => {
                      onAction('sign', dec.id);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-emerald-400 hover:bg-emerald-900/20"
                  >
                    <FileSignature size={13} /> Assinar
                  </button>
                )}
                {(dec.status === 'issued' || dec.status === 'signed') && (
                  <button
                    onClick={() => {
                      onAction('revoke', dec.id);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-900/20"
                  >
                    <XCircle size={13} /> Revogar
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}
