// components/competencies/cardColors.ts
// Cor do cartão do catálogo (CatalogView, CARD_COLORS) e do modal de detalhe:
// mesma ordem e mesmo id → mesma cor. No catálogo a cor é a 50% de
// opacidade; aqui devolve-se o equivalente sólido (misturado com branco)
// para o modal não ficar transparente. Manter em sincronia com CARD_COLORS.

const CARD_HEX = [
  '#0F1F3D',
  '#1E40AF',
  '#0F766E',
  '#6D28D9',
  '#B91C1C',
  '#B45309',
  '#BE185D',
  '#15803D',
];

export function cardSolidColor(id: number): string {
  const base = CARD_HEX[Math.abs(id) % CARD_HEX.length];
  return `color-mix(in srgb, ${base} 50%, white)`;
}
