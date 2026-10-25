// Guarda contra a deriva de listas de papéis: se um componente declarar uma
// constante local com exactamente os mesmos papéis de um conjunto partilhado
// de lib/roles.ts, o conjunto deve ser importado — duas cópias deixam de
// acompanhar o backend em simultâneo (ver project_innova_role_array_drift).

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as roles from './roles';

const ROOT = join(__dirname, '..');
const SCAN_DIRS = ['components', 'app', 'hooks'];

const shared = Object.entries(roles)
  .filter(([, v]) => Array.isArray(v) && v.length > 0)
  .map(([name, v]) => ({ name, key: [...(v as string[])].sort().join('|') }));

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

// const NOME[: tipo] = [ 'A', 'B' ]   ou   = new Set(['A', 'B'])
const DECL =
  /^\s*(?:export\s+)?const\s+(\w+)[^=\n]*=\s*(?:new Set(?:<[^>]*>)?\()?\[([^\]]*)\]/gm;

// Coincidências de conteúdo sem a mesma semântica: o conjunto partilhado está
// ligado a outro guard do backend (ver comentários em lib/roles.ts).
const ALLOWED = new Set([
  'components/avatar-training/constants.ts:PROGRESS_ROLES',
  'app/(platform)/processes/page.tsx:AUDIT_EXPORT_ROLES',
]);

describe('listas de papéis locais', () => {
  it('não repetem um conjunto já exportado por lib/roles.ts', () => {
    const offenders: string[] = [];
    for (const dir of SCAN_DIRS) {
      for (const file of walk(join(ROOT, dir))) {
        const src = readFileSync(file, 'utf8');
        for (const m of src.matchAll(DECL)) {
          // só literais puros: sem spread, objectos nem expressões
          if (!/^(\s*'[A-Z_]+'\s*,?)+\s*$/.test(m[2])) continue;
          const items = [...m[2].matchAll(/'([A-Z_]+)'/g)].map((x) => x[1]);
          const isOnlyRoles =
            items.length >= 2 &&
            items.every((i) => (roles.AUTHENTICATED_ROLES as string[]).includes(i));
          if (!isOnlyRoles) continue;
          const key = [...new Set(items)].sort().join('|');
          const dup = shared.find((s) => s.key === key);
          const id = `${relative(ROOT, file).replaceAll('\\', '/')}:${m[1]}`;
          if (dup && !ALLOWED.has(id)) {
            offenders.push(
              `${relative(ROOT, file)}: ${m[1]} repete ${dup.name} — importar de @/lib/roles`,
            );
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
