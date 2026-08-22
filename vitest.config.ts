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
import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    exclude: [...configDefaults.exclude, '.claude/**'],
  },
});
