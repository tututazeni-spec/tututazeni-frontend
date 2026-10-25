// eslint-rules/design-tokens.mjs
//
// Regra local do design system: sinaliza classes Tailwind que fogem aos tokens
// definidos em app/globals.css (@theme). Corre sobre qualquer string literal ou
// template de ficheiros .tsx, por isso apanha className="…", cn("…") e cva("…").
// Severidade `warn` (ver eslint.config.mjs): dá visibilidade e impede que o
// desvio cresça sem bloquear os ~módulos ainda por migrar.

const PALETTE =
  'gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';

const CHECKS = [
  {
    id: 'hex',
    re: /\b(?:bg|text|border|ring|from|to|via|fill|stroke|divide|outline|shadow)-\[#[0-9a-fA-F]{3,8}\]/,
    message:
      'Cor em hex dentro de className. Use um token de app/globals.css (brand, brand-muted, brand-line, ink, border, success/warning/danger/info…).',
  },
  {
    id: 'palette',
    re: new RegExp(
      `\b(?:bg|text|border|ring|from|to|via|fill|stroke|divide)-(?:${PALETTE})-\d{2,3}\b`,
    ),
    message:
      'Cor da paleta nativa do Tailwind. Use os tokens de estado (success/warning/danger/info e *-subtle/*-ink) ou de marca.',
  },
  {
    id: 'radius',
    re: /\brounded(?:-(?:t|r|b|l|tl|tr|bl|br|s|e))?-(?:lg|xl|2xl|3xl)\b/,
    message:
      'Raio fora da escala. Use rounded-control (6px), rounded-card (10px), rounded-panel (14px) ou rounded-pill.',
  },
  {
    id: 'micro-text',
    re: /\btext-\[(?:8|9|10)px\]/,
    message:
      'Texto abaixo de 11px é ilegível. Use text-micro (11px) como mínimo, ou text-xs.',
  },
  {
    id: 'transition-all',
    re: /\btransition-all\b/,
    message:
      'transition-all anima propriedades que não devia (layout, sombras). Use transition-colors ou transition-shadow.',
  },
  {
    id: 'manual-pulse',
    re: /\banimate-pulse\b/,
    message:
      'Carregamento feito à mão. Use <Skeleton> de components/ui/Skeleton.',
  },
];

const rule = {
  meta: {
    type: 'suggestion',
    schema: [],
    messages: Object.fromEntries(CHECKS.map((c) => [c.id, c.message])),
  },
  create(context) {
    function check(node, text) {
      for (const c of CHECKS) {
        if (c.re.test(text)) context.report({ node, messageId: c.id });
      }
    }
    return {
      Literal(node) {
        if (typeof node.value === 'string') check(node, node.value);
      },
      TemplateElement(node) {
        check(node, node.value.cooked ?? node.value.raw);
      },
    };
  },
};

const plugin = {
  rules: { 'tokens-only': rule },
};

export default plugin;
