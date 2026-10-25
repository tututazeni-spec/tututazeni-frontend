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
  /** Domínio Jitsi (JITSI_DOMAIN); omisso = meet.jit.si público. */
  jitsiDomain?: string;
}

const SIMLI = 'https://api.simli.ai wss://api.simli.ai https://*.simli.ai wss://*.simli.ai';
// O Simli gere o seu próprio projecto LiveKit (o host é devolvido por eles ao
// abrir a sessão, não é nosso), por isso o wildcard não pode ser reduzido a um
// subdomínio fixo sem partir o avatar.
const LIVEKIT = 'https://*.livekit.cloud wss://*.livekit.cloud';
// Embeds de vídeo das lições (fileSrc.ts / live-classes/utils.ts) e salas Jitsi.
const BASE_FRAME_HOSTS = [
  'https://www.youtube.com',
  'https://player.vimeo.com',
  'https://drive.google.com',
];

/** Aceita só um hostname válido; qualquer outra coisa cai no Jitsi público. */
export function resolveJitsiDomain(raw: string | undefined): string {
  const d = (raw ?? '').trim().toLowerCase();
  return /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?(:\d{1,5})?$/.test(d) ? d : 'meet.jit.si';
}

export function parseImageHosts(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean);
}

export function buildCsp({ nonce, isDev, imageHosts, jitsiDomain }: CspOptions): string {
  const jitsi = `https://${resolveJitsiDomain(jitsiDomain)}`;
  const frameHosts = [...BASE_FRAME_HOSTS, jitsi];
  const imgExtra = imageHosts.length
    ? ['https://img.youtube.com', ...imageHosts.map((h) => `https://${h}`)].join(' ')
    : 'https:';
  return [
    "default-src 'self'",
    // 'unsafe-eval' só em dev: o Fast Refresh do `next dev` usa eval().
    `script-src 'self' 'nonce-${nonce}' blob: ${jitsi}${isDev ? " 'unsafe-eval'" : ''}`,
    // Estilos inline: React style={}, <style> do login e Tailwind. Risco bem menor
    // que scripts inline; apertar com nonces de estilo fica para depois.
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${imgExtra}`,
    "font-src 'self' data:",
    `connect-src 'self' ${SIMLI} ${LIVEKIT}`,
    "media-src 'self' blob: mediastream:",
    `frame-src 'self' blob: ${frameHosts.join(' ')}`,
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    'upgrade-insecure-requests',
  ].join('; ');
}
