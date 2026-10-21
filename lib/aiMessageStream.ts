// lib/aiMessageStream.ts
// Cliente do SSE POST /ai-tutor/sessions/message/stream: entrega o texto da
// resposta à medida que é gerado e devolve a resposta final (evento `done`).
import { API_URL } from '@/lib/api';
import type { SendMessageResponse } from '@/components/ai-tutor/types';

export interface SseEvent {
  event: string;
  data: string;
}

/** Separa o buffer em eventos SSE completos; o que sobra fica em `rest`. */
export function parseSseBuffer(buffer: string): {
  events: SseEvent[];
  rest: string;
} {
  const parts = buffer.split(/\r?\n\r?\n/);
  const rest = parts.pop() ?? '';
  const events: SseEvent[] = [];
  for (const part of parts) {
    let event = 'message';
    const data: string[] = [];
    for (const line of part.split(/\r?\n/)) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) data.push(line.slice(5).trim());
    }
    if (data.length) events.push({ event, data: data.join('\n') });
  }
  return { events, rest };
}

export async function streamAiMessage(
  body: { sessionId: number; message: string; maxTokens?: number },
  onToken: (delta: string) => void,
  signal?: AbortSignal,
): Promise<SendMessageResponse> {
  const res = await fetch(`${API_URL}/ai-tutor/sessions/message/stream`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message ?? `Erro ${res.status} ao falar com a Ísis`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let final: SendMessageResponse | null = null;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parsed = parseSseBuffer(buffer);
    buffer = parsed.rest;
    for (const ev of parsed.events) {
      const payload = JSON.parse(ev.data) as Record<string, unknown>;
      if (ev.event === 'token') onToken(String(payload.t ?? ''));
      else if (ev.event === 'done')
        final = payload as unknown as SendMessageResponse;
      else if (ev.event === 'error') {
        throw new Error(String(payload.message ?? 'Erro ao gerar a resposta'));
      }
    }
  }
  if (!final) throw new Error('A resposta da Ísis terminou sem conteúdo');
  return final;
}
