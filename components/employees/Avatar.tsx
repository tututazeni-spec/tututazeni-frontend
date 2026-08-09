// components/employees/Avatar.tsx
// Avatar com fallback de iniciais + cor derivada do nome (hash simples) e
// tratamento de erro de imagem. Distinto do Avatar genérico usado no
// dashboard (props/tamanhos diferentes) — mantido local ao módulo.
// Extraído de app/(platform)/employees/page.tsx.

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getInitials } from '@/lib/format';

export interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ src, name, size = 'md' }: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
  };
  const initials = getInitials(name);
  const [imgError, setImgError] = useState(false);

  const colors = [
    'bg-violet-500',
    'bg-blue-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-indigo-500',
  ];
  const color = colors[name.charCodeAt(0) % colors.length];

  if (!src || imgError) {
    return (
      <div
        className={`${sizes[size]} ${color} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className={`${sizes[size]} relative rounded-full overflow-hidden ring-2 ring-white flex-shrink-0`}
    >
      <Image
        src={src}
        alt={name}
        fill
        className="rounded-full object-cover"
        onError={() => setImgError(true)}
      />
    </div>
  );
}
