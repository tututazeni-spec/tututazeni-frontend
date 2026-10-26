import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseTheme } from './theme';

const css = readFileSync(join(__dirname, '../app/globals.css'), 'utf8');

/** Declarações `--nome: valor;` de um bloco, a partir do seletor dado. */
function declarations(selector: string): Map<string, string> {
  const start = css.indexOf(selector);
  expect(start, `seletor ${selector}`).toBeGreaterThanOrEqual(0);
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
  const out = new Map<string, string>();
  for (const m of body.matchAll(/(--[\w-]+|color-scheme):\s*([^;]+);/g)) {
    out.set(m[1], m[2].trim().replace(/\s+/g, ' '));
  }
  return out;
}

describe('parseTheme', () => {
  it.each(['light', 'dark', 'system'])('aceita %s', (t) => {
    expect(parseTheme(t)).toBe(t);
  });
  it.each([undefined, null, '', 'DARK', 'blue', 'dark; x'])(
    'cai em light para %s',
    (t) => {
      expect(parseTheme(t as string | undefined)).toBe('light');
    },
  );
});

describe('app/globals.css — tema escuro', () => {
  const dark = declarations(":root[data-theme='dark'] {");
  const system = declarations("  :root[data-theme='system'] {");

  it('o bloco "system" é igual ao bloco "dark"', () => {
    expect([...system.entries()]).toEqual([...dark.entries()]);
  });

  it('só redefine variáveis que existem no tema claro', () => {
    const light = new Set([...css.matchAll(/(--[\w-]+):/g)].map((m) => m[1]));
    const missing = [...dark.keys()].filter(
      (k) => k.startsWith('--') && !light.has(k),
    );
    // cada variável escura tem de estar declarada também fora do bloco escuro
    const lightOnly = css.slice(0, css.indexOf('Tema escuro'));
    const notInLight = missing.concat(
      [...dark.keys()].filter(
        (k) => k.startsWith('--') && !lightOnly.includes(`${k}:`),
      ),
    );
    expect(notInLight).toEqual([]);
  });

  it('declara color-scheme: dark', () => {
    expect(dark.get('color-scheme')).toBe('dark');
  });
});
