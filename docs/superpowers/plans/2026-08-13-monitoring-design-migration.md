# Migração do módulo monitoring (Fase B, Vaga 1) — Plano

**Goal:** Migrar `components/monitoring/**` + `app/(platform)/monitoring/**` (incluindo
`evaluations`, `indicators`, `okrs`) para consumir exclusivamente `components/ui/`
(Fase A, PR #183), eliminando toda a paleta Tailwind crua (`gray-*`, `blue-*`,
`green-*`, `yellow-*`, `red-*`), sem alterar nenhum comportamento de dados. Segue a
receita genérica validada pelo piloto `engagement` (PR #185).

**Architecture:** O módulo já segue o padrão container/view — os 4 ficheiros em
`app/(platform)/monitoring/**` são containers finos (hook de dados + `<XView {...props} />`)
sem cor crua nenhuma, por isso não precisam de alteração. Todo o trabalho está em
`components/monitoring/**`: `types.ts` (interfaces + dois mapas `STATUS_COLORS` que
passam a `STATUS_INTENT` no formato `BadgeProps['intent']`), `shared.tsx`
(`ErrorBanner`/`ListSkeleton` usados pelas 3 views), e as 3 views
(`OkrsView`, `EvaluationsView`, `IndicatorsView`).

## Global Constraints

- Repo: `C:\Users\PLÁCIDO COSTA\innova\frontend`. Branch:
  `refactor/monitoring-design-migration`, a partir de `main`.
- Zero alterações a dados/comportamento — mesmos hooks (`useOkrs`, `useMonitoringEvaluations`,
  `useIndicators`), mesmas props, mesma lógica. Só a apresentação muda.
- Zero classes Tailwind cruas (`gray-*`, `blue-*`, `green-*`, `yellow-*`, `red-*`,
  `text-white`) no final em `components/monitoring/**` e `app/(platform)/monitoring/**`.
- Não criar componentes novos em `components/ui/`. `buttonVariants` (exportado de
  `Button.tsx`) pode ser reaproveitado num `<a>` de navegação — não é um componente novo.
- `Card` sem prop `interactive` (nenhum card deste módulo tem `onClick` próprio).
- `ProgressBar` é mono-cor (`bg-accent`) — este módulo não recolore barras por sentido
  (só progresso 0-100%), por isso não há informação a mover para texto adjacente.
- Estados vazios full-width (`cycles.length === 0`, `objectives.length === 0`,
  `data.length === 0` na tabela) usam `EmptyState` onde o layout permite (fora de `<td>`);
  mensagens curtas dentro de listas já contidas por um card (`Nada pendente.`) só trocam
  a cor para `text-ink-faint`, sem virar `EmptyState` (evita aninhar blocos com borda
  dentro de outro bloco com borda).
- `<select>` nativo (filtro de ciclo OKR) migra para `Select` (`@/components/ui/Select`) —
  troca de apresentação, mesmo `value`/`onValueChange` semântico.
- `<table>` nativa (IndicatorsView) migra para `Table`/`TableHead`/`TableBody`/`TableRow`/
  `TableHeaderCell`/`TableCell`. Coluna `código` usa `font-data` (nunca `font-mono`).
- Listas com `divide-y divide-gray-100` trocam para `border-b border-border last:border-0`
  em cada item (mesmo padrão comprovado usado internamente por `TableRow`), em vez de
  `divide-border` (utilitário não confirmado no resto do código-base).
- Ícones: `lucide-react`, `strokeWidth={1.75}`, tamanhos só `{14,16,18,20,24}`
  (`EmptyState` já aplica isto internamente aos ícones que lhe são passados).
- Verificação: `npx tsc --noEmit` (cada task) + grep de paleta crua + `npm run build` +
  `npm test` (Task final).
- Commits: `git commit --no-verify`, mensagem termina sempre com
  `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.

---

### Task 1: `components/monitoring/types.ts`

- [ ] Substituir `OKR_STATUS_COLORS`/`EVALUATION_STATUS_COLORS` (classes Tailwind cruas)
      por `OKR_STATUS_INTENT`/`EVALUATION_STATUS_INTENT` (`Record<string, BadgeProps['intent']>`),
      importando `type { BadgeProps }` de `@/components/ui/Badge`. Interfaces inalteradas.
- [ ] `npx tsc --noEmit` — vai acusar erro nas 2 views que ainda importam os nomes antigos;
      confirmar que é exactamente isso e avançar.
- [ ] Commit: `refactor(monitoring): migrar types.ts para intent maps da fundacao`

### Task 2: `components/monitoring/shared.tsx`

- [ ] `ErrorBanner`: `bg-red-50 border-red-200 text-red-700` → `rounded-card border
      border-danger bg-danger-subtle text-danger-ink`; botão "Tentar novamente" vira
      `Button` (`intent="ghost" size="sm"`).
- [ ] `ListSkeleton`: reimplementar sobre `@/components/ui/Skeleton`, preservando as props
      `rows`/`height` (via `itemClassName` computado) e o wrapper `p-6 space-y-4`.
- [ ] `npx tsc --noEmit`.
- [ ] Commit: `refactor(monitoring): migrar shared.tsx para a fundacao de design`

### Task 3: `components/monitoring/OkrsView.tsx`

- [ ] Header: `h1` → `font-display text-2xl font-bold text-ink`; links de navegação
      ("Indicadores"/"Avaliações") viram `<a className={buttonVariants({ intent:
      'secondary', size: 'sm' })}>`.
- [ ] `<select>` de ciclo → `Select` (`items` derivado de `cycles`).
- [ ] Estados vazios (sem ciclos / sem objectivos) → `EmptyState`.
- [ ] Card de objectivo: `bg-white rounded-lg shadow` → `<Card className="p-5">`; barra de
      progresso → `<ProgressBar value={obj.progress} className="h-2 mb-4" />` (substitui o
      `Math.min` manual, `ProgressBar` já clampa); tile de key-result `bg-gray-50 rounded-lg`
      → `rounded-control bg-surface-sunken`; badge de estado do KR → `Badge` com
      `OKR_STATUS_INTENT`.
- [ ] `npx tsc --noEmit`.
- [ ] Commit: `refactor(monitoring): migrar OkrsView para a fundacao de design`

### Task 4: `components/monitoring/EvaluationsView.tsx`

- [ ] Header + link "← OKRs" → tokens (`text-primary hover:underline`).
- [ ] Listas (`toComplete`/`mine`): container `bg-white rounded-lg shadow` →
      `rounded-card border border-border bg-surface shadow-resting`; cada linha ganha
      `border-b border-border last:border-0` (troca do `divide-y divide-gray-100` do pai).
- [ ] Botão "Avaliar"/"A submeter..." → `Button` `size="sm"`, mantendo o texto condicional
      exacto (não usar a prop `loading` do `Button`, que trocaria o texto por um spinner
      genérico — preservar o texto original é o que a constraint de zero-alteração-de-dados
      exige aqui).
- [ ] Badge de estado da avaliação → `Badge` com `EVALUATION_STATUS_INTENT`.
- [ ] `npx tsc --noEmit`.
- [ ] Commit: `refactor(monitoring): migrar EvaluationsView para a fundacao de design`

### Task 5: `components/monitoring/IndicatorsView.tsx`

- [ ] Header + link "← OKRs" → tokens.
- [ ] `<table>` nativa → `Table`/`TableHead`/`TableBody`/`TableRow`/`TableHeaderCell`/
      `TableCell`; coluna `código` → `font-data text-primary` (nunca `font-mono`).
- [ ] Paginação (`Anterior`/`Próxima`) → `Button intent="secondary" size="sm"`.
- [ ] `npx tsc --noEmit`.
- [ ] Commit: `refactor(monitoring): migrar IndicatorsView para a fundacao de design`

### Task 6: Verificação final

- [ ] `npx tsc --noEmit` completo — sem erros.
- [ ] Grep de paleta crua:
      `grep -rniE "(violet|indigo|slate|amber|emerald|red|teal|purple|blue|green|yellow|orange|gray|zinc|neutral|stone|cyan|sky|rose|pink|fuchsia|lime)-[0-9]{2,3}|text-white\b" components/monitoring/ "app/(platform)/monitoring"`
      → 0 resultados.
- [ ] `npm run build` → sem erros.
- [ ] `npm test` → verde.
- [ ] Commit final se necessário (fixups), push, `gh pr create`.

---

## Notas de execução

- As 4 páginas em `app/(platform)/monitoring/**` (incluindo `okrs/layout.tsx`) não têm cor
  crua nenhuma — só ligam hook a view. Confirmado por leitura antes deste plano; não geram
  task própria.
- `types.ts` não é "puro" neste módulo (tem os 2 mapas de cor por estado, papel equivalente
  ao `constants.ts` do piloto engagement) — por isso é tocado na Task 1, ao contrário da
  regra do piloto (`types.ts não é tocado`), que só se aplicava lá porque o engagement tinha
  um `constants.ts` separado para esse papel.
