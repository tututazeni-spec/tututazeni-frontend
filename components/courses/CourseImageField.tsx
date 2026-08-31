// components/courses/CourseImageField.tsx
// Campo opcional de imagem do curso, partilhado por CreateCourseModal e
// EditCourseModal. Redimensiona no browser (lib/courseImage) e guarda o
// resultado (data URL JPEG) no estado do formulário do pai via onChange.
// Padrão espelhado de components/ui/AvatarUploader.tsx.

'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/providers/ToastProvider';
import {
  resizeCourseImageToDataUrl,
  MAX_UPLOAD_BYTES,
} from '@/lib/courseImage';

interface CourseImageFieldProps {
  /** data URL da imagem actual, ou null/'' se não houver. */
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}

export function CourseImageField({ value, onChange }: CourseImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const notify = useToast();
  const [processing, setProcessing] = useState(false);

  async function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite re-seleccionar o mesmo ficheiro depois
    if (!file) return;

    if (file.size > MAX_UPLOAD_BYTES) {
      notify({
        title: 'Imagem demasiado grande (máx. 8 MB)',
        intent: 'danger',
      });
      return;
    }

    setProcessing(true);
    try {
      onChange(await resizeCourseImageToDataUrl(file));
    } catch (err) {
      const tooLarge =
        err instanceof Error && err.message === 'IMAGE_TOO_LARGE';
      notify({
        title: tooLarge
          ? 'Não foi possível comprimir a imagem o suficiente — tenta outra'
          : 'Não foi possível processar a imagem',
        intent: 'danger',
      });
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="flex items-start gap-4">
      <div className="relative aspect-video w-40 flex-shrink-0 overflow-hidden rounded-card bg-surface-sunken">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt="Pré-visualização da imagem do curso"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-faint">
            <ImageIcon size={28} strokeWidth={1.5} />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          hidden
          onChange={onFileChange}
        />
        <Button
          type="button"
          intent="secondary"
          size="sm"
          loading={processing}
          onClick={() => inputRef.current?.click()}
        >
          {value ? 'Alterar imagem' : 'Carregar imagem'}
        </Button>
        {value && (
          <Button
            type="button"
            intent="ghost"
            size="sm"
            disabled={processing}
            onClick={() => onChange(null)}
          >
            Remover imagem
          </Button>
        )}
        <p className="text-xs text-ink-faint">Opcional · PNG, JPEG ou WebP</p>
      </div>
    </div>
  );
}
