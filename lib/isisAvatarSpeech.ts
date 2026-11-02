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
  return trimSilence(new Uint8Array(await res.arrayBuffer()));
}

const SILENCE_AMPLITUDE = 300; // ~ -40 dB em PCM16
const KEEP_PAD_BYTES = 640; // 20 ms de margem à volta da fala

/**
 * Corta o silêncio do início e do fim de cada frase. A ElevenLabs devolve
 * cada frase com uns décimos de segundo de silêncio nas pontas; com a voz
 * pedida frase a frase isso vira pausas que fazem o avatar "travar" entre
 * frases e dessincronizam o texto, que usa a duração do áudio.
 */
export function trimSilence(pcm: Uint8Array): Uint8Array {
  const samples = pcm.length >> 1;
  if (samples === 0) return pcm;
  const view = new DataView(pcm.buffer, pcm.byteOffset, samples * 2);
  const loud = (i: number) =>
    Math.abs(view.getInt16(i * 2, true)) > SILENCE_AMPLITUDE;
  let first = 0;
  while (first < samples && !loud(first)) first++;
  if (first === samples) return pcm; // tudo silêncio: não mexer
  let last = samples - 1;
  while (last > first && !loud(last)) last--;
  const pad = KEEP_PAD_BYTES >> 1;
  const start = Math.max(0, first - pad) * 2;
  const end = Math.min(samples, last + 1 + pad) * 2;
  return pcm.subarray(start, end);
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
