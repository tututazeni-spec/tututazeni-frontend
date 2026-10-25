// lib/isisAvatarSpeech.ts
// Voz da Ísis para o avatar Simli. O backend gera o áudio na ElevenLabs
// (a chave nunca chega ao browser) já em PCM16 mono a 16 kHz, o formato que
// o Simli exige, por isso não há conversão aqui.
import { apiClient } from '@/lib/apiClient';

export const PCM_BYTES_PER_SECOND = 16000 * 2;
// Pedaços enviados ao Simli por chamada de sendAudioData.
const CHUNK_BYTES = 6000;

export async function fetchIsisSpeech(text: string): Promise<Uint8Array> {
  const res = await apiClient.postRaw(
    '/ai-tutor/avatar/speech',
    { text },
    { errorMessage: 'Voz da Ísis indisponível' },
  );
  return new Uint8Array(await res.arrayBuffer());
}

export function splitPcm(pcm: Uint8Array): Uint8Array[] {
  const chunks: Uint8Array[] = [];
  for (let i = 0; i < pcm.length; i += CHUNK_BYTES) {
    chunks.push(pcm.subarray(i, i + CHUNK_BYTES));
  }
  return chunks;
}

export function pcmDurationMs(pcm: Uint8Array): number {
  return (pcm.length / PCM_BYTES_PER_SECOND) * 1000;
}

const FIRST_PIECE_MAX = 160;
const PIECE_MAX = 260;

/**
 * Parte o texto em pedaços para a voz começar já na 1.ª frase: o 1.º pedaço é
 * só a primeira frase (curta), os seguintes juntam frases até PIECE_MAX.
 */
export function splitForSpeech(text: string): string[] {
  const sentences = text.match(/[^.!?…]+[.!?…]*\s*/g)?.map((s) => s.trim()) ?? [
    text,
  ];
  const pieces: string[] = [];
  let current = '';
  for (const sentence of sentences.filter(Boolean)) {
    const max = pieces.length === 0 ? FIRST_PIECE_MAX : PIECE_MAX;
    if (pieces.length === 0 && current === '') {
      // 1.º pedaço: a frase inteira, sem juntar nada.
      pieces.push(sentence);
      continue;
    }
    if (current && (current + ' ' + sentence).length > max) {
      pieces.push(current);
      current = sentence;
    } else {
      current = current ? current + ' ' + sentence : sentence;
    }
  }
  if (current) pieces.push(current);
  return pieces;
}
