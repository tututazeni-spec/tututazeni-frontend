// lib/isisAvatarSpeech.ts
// Voz da Ísis para o avatar Simli. O backend gera o áudio na ElevenLabs
// (a chave nunca chega ao browser) já em PCM16 mono a 16 kHz, o formato que
// o Simli exige, por isso não há conversão aqui.
import { API_URL } from '@/lib/api';

export const PCM_BYTES_PER_SECOND = 16000 * 2;
// Pedaços enviados ao Simli por chamada de sendAudioData.
const CHUNK_BYTES = 6000;

export async function fetchIsisSpeech(text: string): Promise<Uint8Array> {
  const res = await fetch(`${API_URL}/ai-tutor/avatar/speech`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`Voz da Ísis indisponível (${res.status})`);
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
