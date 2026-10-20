// components/ai-tutor/visemes.ts
// 12 visemas (poses da boca) para a sincronização labial da Ísis e a regra que
// converte texto em português em visemas. Cada visema tem uma imagem em
// public/images/isis-visemes/<id>.png (mesmas dimensões e enquadramento do
// retrato base). Enquanto uma imagem não existir usa-se o retrato actual.

export const VISEMES = [
  'rest', // boca fechada em repouso — silêncio, pausas
  'mbp', // lábios fechados e premidos — m, b, p
  'fv', // dentes de cima no lábio de baixo — f, v
  'a', // aberta, grande — a
  'e', // meio aberta, esticada — e, é, consoantes velares (c, k, q, g)
  'i', // esticada, dentes quase juntos — i, s, z, t, d, n, l
  'o', // arredondada, média — o, ó
  'u', // arredondada, pequena e projetada — u
  'chj', // lábios projectados com dentes — ch, j, x
  'r', // língua levantada, boca entreaberta — r, rr
  'ao', // arredondada com dentes visíveis — ã, õ, ão, ou
  'lhnh', // língua contra o palato/dentes — lh, nh
] as const;

export type Viseme = (typeof VISEMES)[number];

export const visemeSrc = (v: Viseme): string => `/images/isis-visemes/${v}.png`;

// Retratos já existentes, usados até as imagens do visema serem adicionadas.
export const FALLBACK_CLOSED = '/images/isis-avatar.png';
export const FALLBACK_OPEN = '/images/isis-avatar-mouth-open.png';
const OPEN_VISEMES: ReadonlySet<Viseme> = new Set([
  'a',
  'e',
  'o',
  'u',
  'ao',
  'chj',
  'r',
]);
export const fallbackFor = (v: Viseme): string =>
  OPEN_VISEMES.has(v) ? FALLBACK_OPEN : FALLBACK_CLOSED;

const strip = (c: string) =>
  c.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const VOWEL_VISEME: Record<string, Viseme> = {
  a: 'a',
  e: 'e',
  i: 'i',
  o: 'o',
  u: 'u',
};
const PAUSE = /[\s.,;:!?…()"'-]/;

// Um visema por carácter do texto (mesmo índice que `charIndex` do
// speechSynthesis). Dígrafos (ch, lh, nh, rr, ão, ou) ocupam os dois caracteres.
export function textToVisemes(text: string): Viseme[] {
  const out: Viseme[] = new Array(text.length).fill('rest');
  const lower = text.toLowerCase();
  let prev: Viseme = 'rest';

  for (let i = 0; i < text.length; i++) {
    const ch = lower[i];
    const next = lower[i + 1] ?? '';
    const two = ch + next;
    let v: Viseme;
    let span = 1;

    if (PAUSE.test(ch)) {
      v = 'rest';
    } else if (two === 'ch') {
      v = 'chj';
      span = 2;
    } else if (two === 'lh' || two === 'nh') {
      v = 'lhnh';
      span = 2;
    } else if (two === 'rr') {
      v = 'r';
      span = 2;
    } else if (two === 'ou') {
      v = 'ao';
      span = 2;
    } else if (ch === 'ã' || ch === 'õ') {
      v = 'ao';
      // "ão", "ões": o 'o' seguinte faz parte do mesmo som
      if (strip(next) === 'o' || next === 'õ') span = 2;
    } else if ((ch === 'q' || ch === 'g') && next === 'u') {
      // "que", "gui": o u é mudo, a boca já vai para a vogal seguinte
      v = 'e';
    } else if ('mbp'.includes(ch)) {
      v = 'mbp';
    } else if ('fv'.includes(ch)) {
      v = 'fv';
    } else if (ch === 'j' || ch === 'x') {
      v = 'chj';
    } else if (ch === 'r') {
      v = 'r';
    } else if ('szçtdnl'.includes(ch)) {
      v = 'i';
    } else if ('ckqg'.includes(ch)) {
      v = 'e';
    } else if (ch === 'h') {
      v = prev; // mudo
    } else {
      v = VOWEL_VISEME[strip(ch)] ?? 'e';
    }

    for (let k = 0; k < span && i + k < text.length; k++) out[i + k] = v;
    prev = v;
    i += span - 1;
  }
  return out;
}
