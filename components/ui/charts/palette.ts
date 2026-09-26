// components/ui/charts/palette.ts
// Paleta de série para os gráficos do design system (categorical/status
// encoding) — excepção documentada, mesmo padrão de
// components/evaluation360/colors.ts: o chrome dos gráficos (eixos, grelha,
// texto, fundo, tooltip) usa sempre os tokens semânticos directamente; só as
// cores de série de dados vivem aqui.
//
// CATEGORICAL foi validado com o validador de paletas da skill "dataviz"
// (scripts/validate_palette.js, modo "light") — todos os checks passam.
// Duas notas sobre porque não são simplesmente os 6 tokens de estado da
// plataforma tal e qual:
//  - --color-primary (#163a2e) fica de fora da série: é escuro/pouco
//    saturado demais para uma marca pequena (falha lightness band + chroma
//    floor no validador) — o seu papel continua a ser chrome de marca, não
//    série de dados.
//  - --color-info (#3b6fa0) fica de fora e é substituído, só aqui, por um
//    azul mais saturado da mesma família (#1f6fb8): o tom original lê como
//    cinzento em marcas pequenas (falha o "chroma floor"). O chrome/UI fora
//    dos gráficos continua a usar --color-info tal e qual.
export const CATEGORICAL = [
  'var(--color-accent)', // #d6963a
  '#1f6fb8', // azul de gráfico — variante saturada de --color-info
  'var(--color-success)', // #2f9e63
  'var(--color-danger)', // #b3432e
] as const;

// Acima de 4 categorias, o resto agrupa-se em "Outros" — nunca se gera uma
// 5ª cor (regra da skill dataviz: uma série extra nunca é um hue novo).
export const CATEGORICAL_OTHER_LABEL = 'Outros';
export const CATEGORICAL_OTHER_COLOR = 'var(--color-ink-faint)';

export function categoricalColor(index: number): string {
  return CATEGORICAL[index % CATEGORICAL.length];
}

// Estados (bom/aviso/grave/crítico) — reutiliza os tokens semânticos já
// usados em Badge/StatusBadge/alertas no resto da app; "crítico" usa o tom
// mais escuro já existente de danger (--color-danger-ink), não uma cor nova.
export const STATUS = {
  good: 'var(--color-success)',
  warning: 'var(--color-warning)',
  serious: 'var(--color-danger)',
  critical: 'var(--color-danger-ink)',
} as const;

export type StatusKey = keyof typeof STATUS;
