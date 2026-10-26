// lib/theme.ts
// Preferência de tema (claro/escuro/sistema). Guardada num cookie para o
// servidor a ler em app/layout.tsx e emitir já <html data-theme="…">: sem script
// inline (a CSP tem nonce) e sem piscar o tema errado à primeira pintura.

export const THEMES = ['light', 'dark', 'system'] as const;
export type Theme = (typeof THEMES)[number];

export const DEFAULT_THEME: Theme = 'light';
export const THEME_COOKIE = 'innova-theme';

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** Valida um valor vindo de um cookie; qualquer coisa inesperada cai no tema por omissão. */
export function parseTheme(value: string | undefined | null): Theme {
  return (THEMES as readonly string[]).includes(value ?? '')
    ? (value as Theme)
    : DEFAULT_THEME;
}

/** Aplica o tema ao <html> e persiste-o. Só no browser. */
export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
}

/** Tema atualmente aplicado ao <html>. Só no browser. */
export function currentTheme(): Theme {
  return parseTheme(document.documentElement.dataset.theme);
}
