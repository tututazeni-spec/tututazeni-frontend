// lib/audioCache.ts
// Helpers puros de sanitização/cache de áudio, extraídos de
// components/CourseAvatarReader.tsx — eram funções de topo de ficheiro
// misturadas com o JSX do player, mas não dependem de React nem de estado
// do componente, por isso vivem melhor aqui (testáveis isoladamente).

/** Remove markdown/HTML do texto da lição antes de o enviar para TTS. */
export function sanitizeText(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*|__|\*|_/g, '')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Chave de cache baseada num hash simples do texto (primeiros 200 chars). */
export function cacheKey(text: string): string {
  let hash = 0;
  for (let i = 0; i < Math.min(text.length, 200); i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return `innova_audio_${Math.abs(hash)}`;
}

/** Guarda o blob de áudio em sessionStorage (base64) para não gastar quota. */
export function saveAudioCache(key: string, blob: Blob): void {
  try {
    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        sessionStorage.setItem(key, reader.result as string);
      } catch {
        /* quota excedida — ignorar */
      }
    };
    reader.readAsDataURL(blob);
  } catch {
    /* ignorar */
  }
}

/** Recupera áudio em cache, se existir. */
export function loadAudioCache(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}
