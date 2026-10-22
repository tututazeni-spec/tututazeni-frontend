// Content-Security-Policy com nonce por pedido (auditoria A-1, ponto 4).
// Emitida pelo middleware.ts; o Next lê o nonce do header CSP do pedido e
// aplica-o aos seus scripts inline de hidratação — por isso já não há
// 'unsafe-inline' em script-src.
//
// Sem 'strict-dynamic' de propósito: ele ignora as fontes de host e blob:, e o
// AudioWorklet do avatar Simli carrega-se de um blob:.

export interface CspOptions {
  nonce: string;
  isDev: boolean;
  /** Hostnames https permitidos para imagens externas; vazio = qualquer https. */
  imageHosts: string[];
}

const SIMLI = 'https://api.simli.ai wss://api.simli.ai https://*.simli.ai wss://*.simli.ai';
const LIVEKIT = 'https://*.livekit.cloud wss://*.livekit.cloud';
// Embeds de vídeo das lições (fileSrc.ts / live-classes/utils.ts) e salas Jitsi.
const FRAME_HOSTS = [
  'https://www.youtube.com',
  'https://player.vimeo.com',
  'https://drive.google.com',
  'https://meet.jit.si',
];

export function parseImageHosts(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean);
}

export function buildCsp({ nonce, isDev, imageHosts }: CspOptions): string {
  const imgExtra = imageHosts.length
    ? ['https://img.youtube.com', ...imageHosts.map((h) => `https://${h}`)].join(' ')
    : 'https:';
  return [
    "default-src 'self'",
    // 'unsafe-eval' só em dev: o Fast Refresh do `next dev` usa eval().
    `script-src 'self' 'nonce-${nonce}' blob: https://meet.jit.si${isDev ? " 'unsafe-eval'" : ''}`,
    // Estilos inline: React style={}, <style> do login e Tailwind. Risco bem menor
    // que scripts inline; apertar com nonces de estilo fica para depois.
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${imgExtra}`,
    "font-src 'self' data:",
    `connect-src 'self' ${SIMLI} ${LIVEKIT}`,
    "media-src 'self' blob: mediastream:",
    `frame-src 'self' blob: ${FRAME_HOSTS.join(' ')}`,
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    'upgrade-insecure-requests',
  ].join('; ');
}
