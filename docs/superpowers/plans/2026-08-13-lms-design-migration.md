# Migração do módulo lms — Plano

> Segue o padrão validado em `docs/superpowers/plans/2026-08-11-engagement-design-migration.md`
> (piloto Fase B, PR #185). `lms` não tem `atoms.tsx` — 5 ficheiros no total,
> ~48 ocorrências de cor Tailwind crua.

**Goal:** Migrar `components/lms/**` + `app/(platform)/lms/**` (`paths`,
`my-paths`, `sessions`) para consumir exclusivamente `components/ui/`,
eliminando toda a paleta Tailwind crua (blue/purple/green/red/yellow/gray).
Zero alterações a dados/comportamento.

**Ficheiros:**
- `components/lms/types.ts` — `LEVEL_COLORS`/`STATUS_COLORS` (classes
  Tailwind cruas) → `LEVEL_INTENT`/`STATUS_INTENT` (`BadgeProps['intent']`).
  `PLATFORM_ICONS` fica igual (são emojis, não cor).
- `components/lms/shared.tsx` — `ErrorBanner`/`CardGridSkeleton`/
  `ListSkeleton`/`MyPathsSkeleton` → `Button`, `Skeleton` da fundação.
- `components/lms/LearningPathsView.tsx` — `Input`, `Card`/`CardBody`,
  `Badge`, `Button`, `EmptyState`; links de navegação (`<a>`) restilizados
  com `buttonVariants` (exportado por `Button.tsx`) em vez de classes cruas.
- `components/lms/MyPathsView.tsx` — `Stat` local → `KpiCard`; cards de
  percurso → `Card`/`CardBody` + `Badge` + `ProgressBar`; `EmptyState`.
- `components/lms/LiveSessionsView.tsx` — `Card`/`CardBody`, `Button`,
  `EmptyState`.
- As 4 páginas em `app/(platform)/lms/**` são containers finos (hook +
  `<XView {...props} />`) sem classes cruas — não precisam de alteração.

**App/(platform)/lms/**: confirmado sem paleta crua (containers finos), não
precisam de commit próprio.

## Constraints
- Zero alterações a dados/comportamento — mesmos props, mesmos handlers.
- Zero classes Tailwind cruas no final.
- Não criar componentes novos em `components/ui/`.
- `Card` sem prop `interactive` (nenhum destes cards tem `onClick` próprio —
  o clique está sempre num `Button` filho).
- `ProgressBar` mono-cor — aceite (percursos não comunicavam sentido pela
  cor da barra, só progresso).
- Ícones lucide-react, `strokeWidth={1.75}`, tamanhos de `{14,16,18,20,24}`.
- Emojis de conteúdo (🎓, 🟦🟪🟩🟧🔗) mantidos — não são paleta Tailwind.

## Ordem de execução (commits granulares)
1. `components/lms/types.ts` — mapas de cor → intent.
2. `components/lms/shared.tsx` — ErrorBanner/Skeletons.
3. `components/lms/LearningPathsView.tsx`.
4. `components/lms/MyPathsView.tsx`.
5. `components/lms/LiveSessionsView.tsx`.
6. Verificação final: `npx tsc --noEmit`, grep de paleta crua, `npm run
   build`, `npm test`.
7. Commit final (se necessário) + push + PR.

Cada task: typecheck (`npx tsc --noEmit`, tolerando erros só nos ficheiros
ainda não migrados) + commit granular, `git commit --no-verify`.
