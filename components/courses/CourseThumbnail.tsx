// components/courses/CourseThumbnail.tsx
// Imagem do curso nas listas/detalhe. Uma só implementação para os 3 sítios
// que antes duplicavam o bloco `thumbnailUrl ? <Image> : 📚`
// (CourseCard, MyEnrollmentsView, CourseDetailView):
//   - data: URI  → <img> nativo (next/image não processa data URIs — mesma
//                  razão do ramo em components/ui/Avatar.tsx)
//   - URL normal → next/image
//   - nada       → emoji 📚 (fallback, a imagem é sempre opcional)
// Preenche o wrapper do consumidor (que mantém `relative` + o rácio).

import Image from 'next/image';
import { cn } from '@/lib/cn';

interface CourseThumbnailProps {
  src: string | null | undefined;
  alt: string;
  /** Classe do tamanho do emoji de fallback (ex.: 'text-4xl', 'text-2xl'). */
  fallbackClassName?: string;
  className?: string;
}

export function CourseThumbnail({
  src,
  alt,
  fallbackClassName = 'text-4xl',
  className,
}: CourseThumbnailProps) {
  if (src) {
    if (src.startsWith('data:')) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className={cn(
            'absolute inset-0 h-full w-full object-cover',
            className,
          )}
        />
      );
    }
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={cn('object-cover', className)}
      />
    );
  }
  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center text-ink-faint',
        fallbackClassName,
      )}
    >
      📚
    </div>
  );
}
