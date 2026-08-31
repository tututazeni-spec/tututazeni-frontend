// components/ui/Avatar.tsx
// Consolida a implementação que existia localmente em
// components/engagement/atoms.tsx — gradiente determinístico pelo nome,
// para a mesma pessoa ter sempre a mesma cor em qualquer módulo.

import Image from 'next/image';
import { cn } from '@/lib/cn';

const GRADIENTS = [
  'from-primary to-accent',
  'from-info to-primary',
  'from-accent to-danger',
  'from-success to-info',
] as const;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

function gradientFor(name: string): (typeof GRADIENTS)[number] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return GRADIENTS[hash % GRADIENTS.length];
}

const SIZE_CLASSES = { sm: 'h-7 w-7 text-[10px]', md: 'h-9 w-9 text-xs', lg: 'h-12 w-12 text-sm' } as const;

export interface AvatarProps {
  name: string;
  url?: string;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}

export function Avatar({ name, url, size = 'md', className }: AvatarProps) {
  if (url) {
    const isData = url.startsWith('data:');
    return (
      <div className={cn('relative overflow-hidden rounded-full', SIZE_CLASSES[size], className)}>
        {isData ? (
          // next/image não processa data URIs; <img> nativo evita-o.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <Image src={url} alt={name} fill className="object-cover" />
        )}
      </div>
    );
  }
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-gradient-to-br font-body font-semibold text-canvas',
        gradientFor(name),
        SIZE_CLASSES[size],
        className,
      )}
    >
      {getInitials(name)}
    </div>
  );
}
