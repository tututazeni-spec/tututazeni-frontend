// components/ai-tutor/visemes.ts
// 15 visemas (poses da boca) para a sincronização labial da Ísis e a regra que
// converte texto em português em visemas. Cada visema tem uma imagem em
// public/images/isis-visemes/<id>.png (mesmas dimensões e enquadramento do
// retrato base). Enquanto uma imagem não existir usa-se o visema "pai" ou o
// retrato actual.

export const VISEMES = [
  'rest', // boca fechada em repouso — silêncio, pausas
  'mbp', // lábios fechados e premidos — m, b, p
  'fv', // dentes de cima no lábio de baixo — f, v
  'a', // aberta, grande — a tónico
  'e', // meio aberta, esticada — e, é, ê, consoantes velares (c, k, q, g)
  'i', // esticada, língua nos dentes — i, t, d, n, l
  'sz', // esticada, dentes juntos — s, z, ç
  'o', // arredondada, média — o, ô
  'oa', // arredondada, bem aberta — ó
  'u', // arredondada, pequena e projetada — u, o átono
  'schwa', // quase fechada, lábios entreabertos — e/a átonos (pt-PT)
  'chj', // lábios projectados com dentes — ch, j, x
  'r', // língua levantada, boca entreaberta — r, rr
  'ao', // arredondada com dentes visíveis — ã, õ, ão, ou
  'lhnh', // língua contra o palato/dentes — lh, nh
] as const;

export type Viseme = (typeof VISEMES)[number];

export const visemeSrc = (v: Viseme): string => `/images/isis-visemes/${v}.png`;

// Se a imagem de um visema ainda não existe, tenta-se o visema "pai".
export const PARENT_VISEME: Partial<Record<Viseme, Viseme>> = {
  sz: 'i',
  oa: 'o',
  schwa: 'e',
  u: 'o',
};

// Piscar e expressões (não são visemas). `blink.png` é um PNG transparente só
// com as pálpebras fechadas, para se sobrepor a qualquer pose da boca; as
// expressões são imagens completas, mostradas fora da fala.
export const BLINK_SRC = '/images/isis-visemes/blink.png';
export const EXPRESSIONS = ['smile', 'thinking'] as const;
export type Expression = (typeof EXPRESSIONS)[number];
export const expressionSrc = (e: Expression): string =>
  `/images/isis-visemes/expr-${e}.png`;

// Retratos já existentes, usados até as imagens do visema serem adicionadas.
export const FALLBACK_CLOSED = '/images/isis-avatar.png';
export const FALLBACK_OPEN = '/images/isis-avatar-mouth-open.png';
const OPEN_VISEMES: ReadonlySet<Viseme> = new Set([
  'a',
  'e',
  'o',
  'oa',
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
const ACCENTED = /[áâéêíóôú]/;
// Palavras átonas: todas as vogais ficam reduzidas.
const CLITICS = new Set(
  'a as o os e de do da dos das que se me te lhe lhes no na nos nas em um uma com por ao aos'.split(
    ' ',
  ),
);

// Um visema por carácter do texto (mesmo índice que `charIndex` do
// speechSynthesis). Dígrafos (ch, lh, nh, rr, ão, ou) ocupam os dois caracteres.
export function textToVisemes(text: string): Viseme[] {
  const out: Viseme[] = new Array(text.length).fill('rest');
  const lower = text.toLowerCase();
  const plainVowel: boolean[] = new Array(text.length).fill(false);
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
    } else if ('szç'.includes(ch)) {
      v = 'sz';
    } else if ('tdnl'.includes(ch)) {
      v = 'i';
    } else if ('ckqg'.includes(ch)) {
      v = 'e';
    } else if (ch === 'h') {
      v = prev; // mudo
    } else if (ch === 'ó') {
      v = 'oa';
      plainVowel[i] = true;
    } else {
      v = VOWEL_VISEME[strip(ch)] ?? 'e';
      plainVowel[i] = strip(ch) in VOWEL_VISEME;
    }

    for (let k = 0; k < span && i + k < text.length; k++) out[i + k] = v;
    prev = v;
    i += span - 1;
  }

  reduceUnstressed(lower, out, plainVowel);
  return out;
}

// Português europeu: vogais átonas reduzem-se (e/a → schwa, o → u). A sílaba
// tónica vem do acento gráfico ou, sem acento, da terminação da palavra.
function reduceUnstressed(
  lower: string,
  out: Viseme[],
  plainVowel: boolean[],
): void {
  const wordRe = /[a-zà-ú]+/g;
  let m: RegExpExecArray | null;
  while ((m = wordRe.exec(lower))) {
    const word = m[0];
    const base = m.index;
    // núcleos: sequências de vogais orais contíguas (ditongo = um núcleo)
    const nuclei: { from: number; to: number }[] = [];
    for (let i = 0; i < word.length; i++) {
      if (!plainVowel[base + i]) continue;
      const from = i;
      while (i + 1 < word.length && plainVowel[base + i + 1]) i++;
      nuclei.push({ from, to: i });
    }
    if (nuclei.length === 0) continue;

    let stressed = -1;
    if (!CLITICS.has(word)) {
      stressed = nuclei.findIndex((n) =>
        ACCENTED.test(word.slice(n.from, n.to + 1)),
      );
      if (stressed < 0) {
        const paroxytone = /(?:[aeo]s?|[aeo]ns?|[ae]m)$/.test(word);
        stressed =
          paroxytone && nuclei.length > 1
            ? nuclei.length - 2
            : nuclei.length - 1;
      }
    }

    nuclei.forEach((n, idx) => {
      if (idx === stressed || n.from !== n.to) return; // só vogais simples
      const at = base + n.from;
      const c = word[n.from];
      if (c === 'e' || c === 'a') out[at] = 'schwa';
      else if (c === 'o') out[at] = 'u';
    });
  }
}

// Escolhe a pose a mostrar para uma janela de amostras: a mais frequente, com
// peso duplo para os fechos de lábios (m/b/p, f/v) para não serem "comidos" pela
// vogal seguinte; em empate ganha a mais recente.
export function pickViseme(samples: readonly Viseme[]): Viseme {
  if (samples.length === 0) return 'rest';
  const score = new Map<Viseme, number>();
  let best: Viseme = samples[samples.length - 1];
  let bestScore = 0;
  for (const v of samples) {
    const w = v === 'mbp' || v === 'fv' ? 2 : 1;
    score.set(v, (score.get(v) ?? 0) + w);
  }
  samples.forEach((v) => {
    const sc = score.get(v) ?? 0;
    if (sc >= bestScore) {
      best = v;
      bestScore = sc;
    }
  });
  return best;
}
