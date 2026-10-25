// components/live-classes/room/utils.ts
// Formatação de bytes/duração para o painel de gravação. Extraído de
// app/(platform)/live-classes/[id]/page.tsx.

export function fmtDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
