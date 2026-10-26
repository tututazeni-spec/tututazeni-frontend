// components/certificates/ImageUploadField.tsx
// Carregamento de uma imagem do modelo (logótipo, fundo, assinatura). Valida o
// tipo (PNG/JPEG) e o tamanho (≤ 2 MB) antes de enviar; o backend volta a validar
// pelos bytes. Nunca se aceitam SVG nem ligações externas.

'use client';

import { useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { API_URL } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { IMAGE_TYPES, MAX_IMAGE_BYTES } from './templateLabels';
import type { AssetMeta } from './types';

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () =>
      reject(new Error('Não foi possível ler o ficheiro.'));
    reader.readAsDataURL(file);
  });
}

export interface ImageUploadFieldProps {
  kind: AssetMeta['kind'];
  label: string;
  /** Id da imagem guardada, se existir. */
  value?: string;
  onChange: (assetId: string | undefined) => void;
  note?: string;
}

export function ImageUploadField({
  kind,
  label,
  value,
  onChange,
  note,
}: ImageUploadFieldProps) {
  const [error, setError] = useState<string | null>(null);
  const inputId = `img-${kind}`;

  const upload = useApiMutation(
    (file: string) =>
      apiClient.post<AssetMeta>('/certificates/assets', { kind, file }),
    {
      onSuccess: (meta) => {
        setError(null);
        onChange(meta.id);
      },
      onError: (e) => setError(e.message),
    },
  );

  async function onFile(file: File | undefined) {
    setError(null);
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      setError('Só são aceites imagens PNG ou JPEG.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('A imagem excede 2 MB.');
      return;
    }
    try {
      upload.mutate(await readAsDataUrl(file));
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Não foi possível ler o ficheiro.',
      );
    }
  }

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="flex items-center gap-3">
        {value && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            loading="lazy"
            decoding="async"
            src={`${API_URL}/certificates/assets/${value}`}
            alt={`${label} guardado`}
            className="h-12 max-w-[120px] rounded border border-border object-contain bg-surface-sunken"
          />
        )}
        <input
          id={inputId}
          type="file"
          accept="image/png,image/jpeg"
          disabled={upload.isPending}
          onChange={(e) => {
            void onFile(e.target.files?.[0]);
            e.target.value = '';
          }}
          className="block text-sm text-ink"
        />
        {value && (
          <Button intent="ghost" size="sm" onClick={() => onChange(undefined)}>
            Remover
          </Button>
        )}
      </div>
      <p className="text-xs text-ink-muted">PNG ou JPEG, até 2 MB.</p>
      {note && <p className="text-xs text-ink-muted">{note}</p>}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
