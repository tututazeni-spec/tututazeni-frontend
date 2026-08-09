// components/documents/DocCard.tsx
// Cartão de documento na vista em grelha. Extraído de
// app/(platform)/documents/page.tsx.

'use client';

import { useState } from 'react';
import { AlertCircle, Download, Eye, MoreHorizontal } from 'lucide-react';
import { CATEGORY_CONFIG, SENSITIVITY_CONFIG, getFileIcon } from './constants';
import { formatBytes } from './utils';
import type { Document } from './types';

interface DocCardProps {
  doc: Document;
  onView: (d: Document) => void;
  onDownload: (d: Document) => void;
}

export function DocCard({ doc, onView, onDownload }: DocCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
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
      className={`bg-white rounded-2xl border p-4 hover:shadow-md transition-all group cursor-pointer ${isExpired ? 'border-red-100 bg-red-50/20' : isExpiringSoon ? 'border-amber-100' : 'border-gray-100 hover:border-blue-200'}`}
      onClick={() => onView(doc)}
    >
      {/* Icon + menu */}
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${isExpired ? 'bg-red-100' : 'bg-blue-50'}`}
        >
          <Icon
            size={20}
            className={isExpired ? 'text-red-500' : 'text-blue-600'}
          />
        </div>
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal size={15} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl border border-gray-100 shadow-lg z-20 py-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(doc);
                  setMenuOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 w-full"
              >
                <Download size={12} /> Download
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onView(doc);
                  setMenuOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 w-full"
              >
                <Eye size={12} /> Ver detalhe
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
        {doc.title}
      </p>

      {/* Meta */}
      <div className="mt-2 flex flex-wrap gap-1">
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${catCfg.color}`}
        >
          {catCfg.label}
        </span>
        {doc.version !== '1.0' && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
            v{doc.version}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <SensIcon size={11} className={sensCfg.color} />
          <span className={sensCfg.color}>{sensCfg.label}</span>
        </div>
        <span>{formatBytes(doc.fileSize)}</span>
      </div>

      {/* Expiry warning */}
      {(isExpiringSoon || isExpired) && (
        <div
          className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${isExpired ? 'text-red-600' : 'text-amber-600'}`}
        >
          <AlertCircle size={11} />
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
              className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded"
            >
              {t}
            </span>
          ))}
          {doc.tags.length > 3 && (
            <span className="text-xs text-gray-400">
              +{doc.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
