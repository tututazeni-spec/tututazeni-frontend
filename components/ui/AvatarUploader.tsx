// frontend/components/ui/AvatarUploader.tsx
// Afordância de upload da foto de perfil: o Avatar actual + botões.
// Redimensiona no browser (lib/image) e delega a persistência ao
// useUpdateAvatar. Reutilizado no Topbar (dentro de um Modal) e na
// aba Perfil das Definições (inline).

'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { useToast } from '@/providers/ToastProvider';
import { useUpdateAvatar } from '@/hooks/useUpdateAvatar';
import { resizeImageToDataUrl, MAX_UPLOAD_BYTES } from '@/lib/image';

interface AvatarUploaderProps {
  name: string;
  url?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarUploader({ name, url, size = 'lg' }: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const notify = useToast();
  const { setAvatar, removeAvatar, saving } = useUpdateAvatar();
  const [processing, setProcessing] = useState(false);
  const busy = saving || processing;

  async function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite re-seleccionar o mesmo ficheiro depois
    if (!file) return;

    if (file.size > MAX_UPLOAD_BYTES) {
      notify({ title: 'Imagem demasiado grande (máx. 8 MB)', intent: 'danger' });
      return;
    }

    setProcessing(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      setAvatar(dataUrl);
    } catch (err) {
      const tooLarge = err instanceof Error && err.message === 'IMAGE_TOO_LARGE';
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
    <div className="flex items-center gap-4">
      <Avatar name={name} url={url ?? undefined} size={size} />
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
          loading={busy}
          onClick={() => inputRef.current?.click()}
        >
          {url ? 'Alterar foto' : 'Carregar foto'}
        </Button>
        {url && (
          <Button
            type="button"
            intent="ghost"
            size="sm"
            disabled={busy}
            onClick={() => removeAvatar()}
          >
            Remover foto
          </Button>
        )}
      </div>
    </div>
  );
}
