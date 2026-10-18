// components/trainings/FileOrLinkField.tsx
// Campo "ficheiro ou link": carrega um ficheiro (PDF, PNG, JPG ou WebP, máx.
// 4 MB) que vai inline como data URL, ou aceita um endereço https. O valor é a
// string guardada em `fileUrl`/`documentUrl` (validada no backend por
// @IsAllowedFileUrl). Partilhado pelos Documentos da formação e pelo Formador.

'use client';

import { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DOC_ACCEPT, useDocUpload } from '@/components/leave/useDocUpload';

interface FileOrLinkFieldProps {
  id: string;
  value: string;
  /** `fileName` só vem quando o valor é um ficheiro acabado de carregar. */
  onChange: (value: string, fileName?: string) => void;
}

export function FileOrLinkField({ id, value, onChange }: FileOrLinkFieldProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const isFile = value.startsWith('data:');

  const upload = useDocUpload((_, doc) => {
    setFileName(doc.fileName);
    onChange(doc.fileUrl, doc.fileName);
  });

  return (
    <div className="space-y-2">
      <input
        ref={upload.inputRef}
        type="file"
        accept={DOC_ACCEPT}
        hidden
        onChange={upload.onChange}
      />
      <div className="flex items-center gap-2">
        <Button
          type="button"
          intent="secondary"
          size="sm"
          onClick={() => upload.pick(0)}
        >
          <Upload size={14} strokeWidth={1.75} />
          {isFile ? 'Trocar ficheiro' : 'Carregar ficheiro'}
        </Button>
        {isFile && (
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
            onClick={() => {
              setFileName(null);
              onChange('');
            }}
          >
            <X size={12} strokeWidth={2} />
            Remover
          </button>
        )}
      </div>
      {isFile ? (
        <p className="truncate text-xs text-ink-muted">
          {fileName ?? 'Ficheiro carregado'}
        </p>
      ) : (
        <Input
          id={id}
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
          className="w-full"
        />
      )}
      <p className="text-xs text-ink-faint">
        PDF, PNG, JPG ou WebP, máx. 4 MB — ou indique um endereço https.
      </p>
    </div>
  );
}
