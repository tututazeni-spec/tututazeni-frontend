// lib/tabNavigation.ts
// Salta para uma aba do módulo a partir de qualquer ponto da página (ex.: um
// KPI "Pendentes" que abre a aba "Aprovações"). Não depende do estado de cada
// página: as abas (PillNav, PillTabsList/TabsTrigger) expõem `data-tab-id` e
// aqui limitamo-nos a activá-las como o utilizador faria.
//
// A procura sobe a partir do elemento de origem e pára no primeiro antepassado
// que contenha a aba pedida — assim, com abas dentro de abas, ganha sempre o
// conjunto de abas mais próximo do card.

function findTab(id: string, from?: Element | null): HTMLElement | null {
  const selector = `[data-tab-id="${CSS.escape(id)}"]`;
  let scope: Element | null = from ?? null;
  while (scope) {
    const hit = scope.querySelector<HTMLElement>(selector);
    if (hit) return hit;
    scope = scope.parentElement;
  }
  return document.querySelector<HTMLElement>(selector);
}

function activate(tab: HTMLElement): void {
  // Radix activa no mousedown (não no click); os botões do PillNav no click.
  // Disparar os dois é seguro: activar uma aba já activa não faz nada.
  tab.dispatchEvent(
    new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 }),
  );
  tab.click();
}

/** Activa a aba `id` e leva o utilizador até ela. Devolve false se não existir. */
export function goToTab(id: string, from?: Element | null): boolean {
  if (typeof document === 'undefined') return false;
  const tab = findTab(id, from);
  if (!tab) return false;
  activate(tab);
  const bar = tab.closest('[role="tablist"]') ?? tab;
  bar.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  return true;
}
