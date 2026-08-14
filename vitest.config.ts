// vitest.config.ts
// Sem isto, o vitest corria com os defaults puros — que não excluem
// `.claude/worktrees/**`. Este repo usa um worktree por módulo/agente
// durante o rollout do sistema de design (ver
// docs/superpowers/plans/2026-08-13-design-system-rollout-fase-b.md), cada
// um com a sua própria cópia de `lib/*.test.ts`. Com um worktree activo
// (ex.: durante uma migração em curso), `npm test` corrido na raiz do
// checkout principal apanhava também os testes desses worktrees —
// inflacionando a contagem real de 4 ficheiros/43 testes para múltiplos
// disso, dando a falsa impressão de um baseline diferente do que a CI
// reporta (a CI corre sempre a partir de um checkout limpo, sem
// `.claude/`, por isso nunca teve este problema).
import { defineConfig } from 'vitest/config';
import { configDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, '.claude/**'],
  },
});
