// components/crm/beneficiaries/PhotoField.tsx
// Upload da fotografia do beneficiário (máx. 4 MB). Guardada como data-URL
// em `photoUrl`, mesmo padrão do avatar de utilizador.

import { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PHOTO_MAX_BYTES } from './formConfig';

interface PhotoFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export function PhotoField({ value, onChange }: PhotoFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  const pick = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('O ficheiro tem de ser uma imagem.');
      return;
    }
    if (file.size > PHOTO_MAX_BYTES) {
      setError('Fotografia demasiado grande (máx. 4 MB).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setError('');
      onChange(String(reader.result));
    };
    reader.onerror = () => setError('Falha ao ler a fotografia.');
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-center gap-4">
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          loading="lazy"
          decoding="async"
          src={value}
          alt="Fotografia do beneficiário"
          className="h-20 w-20 rounded-card border border-border object-cover"
        />
      ) : (
        <div className="flex h-20 w-20 items-center justify-center rounded-card border border-dashed border-border-strong text-ink-faint">
          <ImagePlus size={24} strokeWidth={1.5} aria-hidden />
        </div>
      )}
      <div className="space-y-1">
        <div className="flex gap-2">
          <Button
            type="button"
            intent="secondary"
            onClick={() => inputRef.current?.click()}
          >
            {value ? 'Mudar fotografia' : 'Carregar fotografia'}
          </Button>
          {value && (
            <Button
              type="button"
              intent="secondary"
              onClick={() => {
                setError('');
                onChange('');
              }}
            >
              <X size={14} strokeWidth={1.75} aria-hidden />
              Remover
            </Button>
          )}
        </div>
        <p className="font-body text-xs text-ink-muted">
          Imagem JPG, PNG ou WebP, até 4 MB.
        </p>
        {error && (
          <p role="alert" className="font-body text-xs text-danger">
            {error}
          </p>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
}
