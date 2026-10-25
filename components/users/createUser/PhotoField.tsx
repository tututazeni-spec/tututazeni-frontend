// components/users/createUser/PhotoField.tsx
// Fotografia do utilizador: URL ou ficheiro carregado (apresentação).

import { X } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button, IconButton } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { isUploadedPhoto } from './logic';

interface PhotoFieldProps {
  avatarUrl: string;
  fullName: string;
  processing: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenPicker: () => void;
  onUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}

export function PhotoField({
  avatarUrl,
  fullName,
  processing,
  inputRef,
  onFileChange,
  onOpenPicker,
  onUrlChange,
  onClear,
}: PhotoFieldProps) {
  return (
    <FormField
      label="Fotografia (URL ou ficheiro até 3 MB)"
      htmlFor="avatarUrl"
    >
      <div className="flex items-center gap-2">
        {isUploadedPhoto(avatarUrl) ? (
          <div className="flex min-h-[48px] w-full items-center gap-2 rounded-control border-[1.5px] border-border-strong bg-surface px-2 py-1.5">
            <Avatar name={fullName || '?'} url={avatarUrl} size="sm" />
            <div className="min-w-0 flex-1 truncate text-sm text-ink">
              Fotografia carregada
            </div>
            <IconButton
              icon={X}
              label="Remover fotografia"
              intent="ghost"
              size="compact"
              type="button"
              onClick={onClear}
            />
          </div>
        ) : (
          <Input
            id="avatarUrl"
            value={avatarUrl}
            onChange={onUrlChange}
            className="w-full"
            placeholder="https://…"
          />
        )}
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
          onClick={onOpenPicker}
        >
          Carregar
        </Button>
      </div>
    </FormField>
  );
}
