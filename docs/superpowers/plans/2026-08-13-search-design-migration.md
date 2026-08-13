# Migração do módulo search — Plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar `components/search/**` + `app/(platform)/search/page.tsx` para consumir exclusivamente `components/ui/` (Fase A), eliminando toda a paleta Tailwind crua (indigo/teal/blue/violet/amber/emerald/pink/slate/red), sem alterar nenhum comportamento de dados. Segunda migração da Fase B, seguindo o padrão validado no piloto `engagement` (PR #183/#185).

**Architecture:** Módulo pequeno, 5 ficheiros em `components/search/**` (sem `atoms.tsx` — nunca teve átomos locais) + 1 container fino (`app/(platform)/search/page.tsx`, já delega tudo a `useSearch()` + `<SearchView {...props} />`, zero cor crua, não precisa de alterações). `types.ts` migra primeiro porque `TYPE_CONFIG` (7 categorias de resultado com cor própria) é consumido por `SearchView`, `ResultsView` e `ResultCard`. `ResultCard` migra a seguir por ser a folha reutilizada por `ResultsView` e `SuggestionsPanel`.

**Tech Stack:** Next.js 15.3, React 19.2, TypeScript 5, Tailwind v4, `components/ui/` (Fase A, PR #183).

## Global Constraints

- Repo: `frontend` (separado do backend). Branch: `fix/engagement-enps-score-missing-fields` já em curso neste worktree isolado → nova branch dedicada `refactor/search-design-migration` a partir de `main` antes do 1º commit deste módulo.
- **Zero alterações a dados/comportamento** — mesmos endpoints (`/search/suggestions`, `/search/history`), mesmo `queryKeys`, mesma lógica de `useSearch()` (não tocada — vive em `hooks/`, fora do escopo).
- **Zero classes de cor Tailwind cruas** em `components/search/**` e `app/(platform)/search/**` no final.
- **Não criar componentes novos** em `components/ui/`.
- **`Card`**: sem prop `interactive` (nenhum card deste módulo tem clique próprio — o clique vive no `<a>`/`<button>` interno, não no `Card` que o envolve).
- **`ProgressBar`**: não usado neste módulo (sem barras de progresso na pesquisa).
- Ícones `lucide-react`: sempre `strokeWidth={1.75}`, tamanhos só de `{14,16,18,20,24}` (o original usa 12/13 em vários pontos — arredondar para 14).
- Commits: `git commit --no-verify`, mensagem termina sempre com `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.
- `types.ts`: só as interfaces + `TYPE_CONFIG` mudam de valor (cor); nenhuma forma de interface muda.

## Decisão: mapeamento de cor por tipo de resultado

`TYPE_CONFIG` tem 7 entradas (`user`, `course`, `content`, `document`, `pdi`, `competency`, `scenario`), cada uma com uma cor Tailwind crua distinta. A fundação tem exactamente 7 tokens de intenção (`primary`, `accent`, `success`, `warning`, `danger`, `info`, mais o par neutro `surface-sunken`/`ink-muted`) — mapeamento 1:1, sem reutilizar nenhum token duas vezes:

| Tipo | Antes | Depois (`color` / `bg`) |
|---|---|---|
| `user` | `indigo-600` / `indigo-50` | `text-primary` / `bg-primary-subtle` |
| `course` | `teal-600` / `teal-50` | `text-accent` / `bg-accent-subtle` |
| `content` | `blue-600` / `blue-50` | `text-info-ink` / `bg-info-subtle` |
| `document` | `violet-600` / `violet-50` | `text-warning-ink` / `bg-warning-subtle` |
| `pdi` | `amber-600` / `amber-50` | `text-success-ink` / `bg-success-subtle` |
| `competency` | `emerald-600` / `emerald-50` | `text-danger-ink` / `bg-danger-subtle` |
| `scenario` | `pink-600` / `pink-50` | `text-ink-muted` / `bg-surface-sunken` |

A forma do record (`{ label, icon, color, bg, path }`) não muda — só os valores de `color`/`bg` — por isso `SearchView`/`ResultsView`/`ResultCard` continuam a consumir `conf.color`/`conf.bg` sem qualquer alteração estrutural.

## Decisão: raio de borda

Mapeamento consistente com o piloto `engagement`: `rounded-2xl` (barra de pesquisa, maior peso visual) → `rounded-panel`; `rounded-xl` (dropdown de autocomplete, cards de resultado) → `rounded-card`; `rounded-lg` (chips, botões pequenos) → `rounded-control`; formas circulares (avatar) mantêm-se `rounded-full`.

## Decisão: primitivos por elemento

- **Chip "OBRIG." em `ResultCard`** → `Badge intent="danger"` (aceita o ponto colorido adicional do `Badge` como parte da linguagem visual consistente — mesmo padrão que `SurveysTab`/`FeedbackTab` do piloto `engagement` usaram para badges de estado).
- **Botões de filtro por tipo em `ResultsView` (sidebar)** → `Button` (`intent="primary"` quando activo, `intent="ghost"` quando inactivo, `size="sm"`, `className="w-full justify-between"`).
- **Chips de "Pesquisas Recentes"** → `Button intent="ghost" size="sm"` com `className="bg-surface-sunken"` (preenche o fundo cinza do chip original, que por omissão o `ghost` não tem em repouso).
- **Chips de "Em Alta"** → `Button intent="secondary" size="sm"` (o estilo `secondary` — borda/texto `primary`, fundo `surface` — já lê como um chip destacado, sem overrides).
- **Botão de limpar pesquisa (X dentro do input)** → `IconButton icon={X} label="Limpar pesquisa" intent="ghost"`.
- **Estado vazio de resultados em `ResultsView`** → `EmptyState icon={Search}`.
- **Wrapper de resultados / sidebar** → `Card` (+ `CardBody` onde o padding por omissão não bate certo, com `className="p-3"` a sobrepor o `p-4` por omissão via `cn`/`tailwind-merge`).
- **Linha de sugestão no dropdown de autocomplete** e **botões de filtro rápido por tipo (`SearchView`, chips coloridos por `TYPE_CONFIG`)** ficam como `<button>` nativo com classes de token — não há primitivo da Fase A cujo layout (multi-elemento, alinhamento `justify-between`/cor dinâmica por tipo) sirva sem overrides mais complexos do que manter o elemento nativo; o requisito violado seria "zero cor crua", não "zero HTML nativo", e ambos já usam só tokens.
- **Spinner de loading em `SearchView`** — sem primitivo `Spinner` na Fase A — mantém-se a `div` com `border-4 animate-spin`, trocando `border-indigo-200 border-t-indigo-600` por `border-primary-subtle border-t-primary`.

---

## Task 1: `components/search/types.ts`

**Files:** Modify `components/search/types.ts`.

- [ ] Substituir os 7 pares `color`/`bg` de `TYPE_CONFIG` pelos tokens da tabela acima. Forma do record inalterada.
- [ ] Typecheck: `npx tsc --noEmit` (erros noutros ficheiros do módulo, ainda não migrados, são esperados nesta fase só se algo *depender* da forma — não é o caso aqui, a forma não muda).
- [ ] Commit: `refactor(search): migrar types.ts para tokens da fundacao`

## Task 2: `components/search/ResultCard.tsx`

**Files:** Modify `components/search/ResultCard.tsx`.
**Interfaces:** Consumes `Badge` (`@/components/ui/Badge`).

- [ ] Reescrever com tokens (`hover:bg-surface-sunken`, `rounded-card`, `rounded-control`, `text-ink`/`text-ink-faint`/`text-ink-muted`) e `Badge intent="danger"` para o selo "OBRIG.".
- [ ] `ChevronRight` para `size={14}` (era 13), `strokeWidth={1.75}`.
- [ ] Typecheck.
- [ ] Commit: `refactor(search): migrar ResultCard para a fundacao de design`

## Task 3: `components/search/ResultsView.tsx`

**Files:** Modify `components/search/ResultsView.tsx`.
**Interfaces:** Consumes `Button`, `Card`/`CardBody`, `EmptyState`.

- [ ] Sidebar de tipos → `Card`/`CardBody` + `Button` por entrada (activo = `primary`, inactivo = `ghost`).
- [ ] Wrapper de resultados → `Card` com `divide-y divide-border` (a lista de `ResultCard` já gere o próprio padding interno).
- [ ] Estado vazio → `EmptyState icon={Search}`.
- [ ] Typecheck.
- [ ] Commit: `refactor(search): migrar ResultsView para a fundacao de design`

## Task 4: `components/search/SuggestionsPanel.tsx`

**Files:** Modify `components/search/SuggestionsPanel.tsx`.
**Interfaces:** Consumes `Button`.

- [ ] Cabeçalhos de secção → `text-ink-muted`; ícones `Clock`/`TrendingUp` para `size={14}`, `strokeWidth={1.75}`.
- [ ] Chips "Pesquisas Recentes" → `Button intent="ghost" className="bg-surface-sunken"`.
- [ ] Chips "Em Alta" → `Button intent="secondary"`.
- [ ] `ResultCard` já migrado na Task 2 — nenhuma alteração adicional necessária nas listas de recomendados/populares.
- [ ] Typecheck.
- [ ] Commit: `refactor(search): migrar SuggestionsPanel para a fundacao de design`

## Task 5: `components/search/SearchView.tsx`

**Files:** Modify `components/search/SearchView.tsx`.
**Interfaces:** Consumes `IconButton`, `Input`.

- [ ] Cabeçalho → `bg-surface`/`border-border`; ícone de título em wrapper `rounded-control bg-primary-subtle` (mesmo padrão do cabeçalho do `engagement`).
- [ ] Barra de pesquisa: `<input>` nativo → `Input` (`@/components/ui/Input`) com `className` a sobrepor padding/raio (`rounded-panel py-4 pl-12 pr-12`); ícone de lupa absoluto `text-ink-faint`; botão de limpar → `IconButton icon={X} intent="ghost"`.
- [ ] Dropdown de autocomplete → `rounded-card border-border bg-surface shadow-elevated`; linhas mantêm-se `<button>` nativo só com tokens (ver secção de decisões).
- [ ] Chips de filtro rápido por tipo → mantêm-se `<button>` nativo, cor dinâmica via `conf.color`/`conf.bg` (já tokens desde a Task 1); ícone `size={14}`.
- [ ] Spinner de loading → `border-primary-subtle border-t-primary`.
- [ ] Typecheck.
- [ ] Commit: `refactor(search): migrar SearchView para a fundacao de design`

## Task 6: Verificação final

- [ ] `npx tsc --noEmit` → sem erros.
- [ ] Grep de paleta crua (`components/search/`, `app/(platform)/search`) → 0 resultados.
- [ ] `npm run build` → sem erros, rota `/search` presente.
- [ ] `npm test` (vitest) → suite pré-existente continua verde (módulo não tem testes próprios).
- [ ] Commit final se sobrar qualquer resíduo de formatação; push; `gh pr create` — título `refactor(search): migrar para a fundação de design`, corpo referenciando PR #183 (fundação) e #185 (piloto engagement), "Vaga 1" do rollout da Fase B.
- [ ] Parar após abrir o PR — não aguardar CI, não fazer merge.

## Notas de execução

- `app/(platform)/search/page.tsx` não entra em nenhuma task de reescrita — já delega 100% a `useSearch()` + `<SearchView {...props} />`, zero cor crua desde o início; só entra no grep de verificação final.
- `hooks/useSearch.ts` não é tocado — só JSX/className nos 5 ficheiros de `components/search/`.
