// components/live-classes/YoutubeThumbnail.tsx
// Thumbnail do YouTube com fallback silencioso em erro. Extraído de
// app/(platform)/live-classes/page.tsx.

'use client';

import { useState } from 'react';
import Image from 'next/image';

export interface YoutubeThumbnailProps {
  src: string;
  alt: string;
}

export function YoutubeThumbnail({ src, alt }: YoutubeThumbnailProps) {
  const [thumbError, setThumbError] = useState(false);
  if (thumbError) return null;
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover opacity-70"
      onError={() => setThumbError(true)}
    />
  );
}
