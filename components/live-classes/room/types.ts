// components/live-classes/room/types.ts
// Tipos da sala Jitsi de uma aula ao vivo (rota /live-classes/[id]) —
// endpoint de detalhe devolve uma forma diferente da lista em
// components/live-classes/types.ts (sem `messages`/`postEvaluation`), por
// isso mantém-se um tipo próprio em vez de reutilizar o partilhado.
// Extraído de app/(platform)/live-classes/[id]/page.tsx.

export interface LiveClass {
  id: number;
  topic: string;
  scheduledAt: string;
  duration: number;
  zoomMeetingId?: string;
  recordingUrl?: string;
  course?: { id: number; title: string };
  _count?: { attendances: number };
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: new (
      domain: string,
      options: JitsiOptions,
    ) => JitsiAPI;
  }
}

export interface JitsiOptions {
  roomName: string;
  parentNode: HTMLElement;
  width?: string | number;
  height?: string | number;
  configOverwrite?: Record<string, unknown>;
  interfaceConfigOverwrite?: Record<string, unknown>;
  userInfo?: { displayName?: string; email?: string };
  lang?: string;
}

export interface JitsiAPI {
  addEventListeners: (
    events: Record<string, (...args: unknown[]) => void>,
  ) => void;
  executeCommand: (command: string, ...args: unknown[]) => void;
  getNumberOfParticipants: () => number;
  dispose: () => void;
}

export type RecordingState = 'idle' | 'recording' | 'stopped';

export interface RecordingData {
  blob: Blob;
  url: string;
  duration: number; // seconds
  size: number; // bytes
}
