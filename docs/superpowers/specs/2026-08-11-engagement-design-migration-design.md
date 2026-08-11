# Spec — Migração do módulo `engagement` para a fundação de design (Fase B, piloto)

> Data: 2026-08-11
> Repo: innova-frontend (Next.js 15.3 + React 19.2 + Tailwind v4)
> Branch: `feat/engagement-design-migration`
> Origem: piloto da Fase B — primeira migração real de um módulo existente
> para a biblioteca `components/ui/` construída na Fase A (PR #183). Módulo
> escolhido porque `KpiCard`/`Avatar` da Fase A foram literalmente
> desenhados a partir do `components/engagement/atoms.tsx` deste módulo.

## Contexto

`components/engagement/` tem 6 ficheiros (~700 linhas): `atoms.tsx`
(KpiCard/Avatar/ProgressBar/Skeleton locais — `Skeleton` já delega para o
partilhado), `MoodCheckin.tsx`, e 5 separadores (`OverviewTab`,
`SurveysTab`, `RecognitionTab`, `FeedbackTab`, `AnalyticsTab`), montados
por `app/(platform)/engagement/page.tsx`. Usa paleta própria
(violeta/índigo/slate/amber/emerald/red), badges/botões/tabs/inputs
manuais, e reimplementa `KpiCard`/`Avatar`/`ProgressBar` — tudo já coberto
pela Fase A.

**Decisão confirmada com o utilizador**: o módulo perde a cor violeta
própria e passa a usar a paleta unificada (`primary`/`accent`) — é
precisamente o objectivo desta fase, não um efeito colateral a evitar.

**Gap conhecido**: a Fase A não construiu um `Checkbox`. O checkbox
"Enviar anonimamente" em `FeedbackTab` fica nativo (`<input
type="checkbox">`), só com `accent-color` a apontar para o token
`--color-primary` em vez da cor por omissão do browser — não se inventa
um componente novo a meio deste piloto. Fica registado como item em falta
para o backlog da Fase A.

## Objectivo

Migrar os 6 ficheiros de `components/engagement/` (+ `page.tsx`) para
consumir exclusivamente `components/ui/`, sem alterar nenhum
comportamento (mesmos endpoints, mesmos dados, mesma lógica de filtros/
mutations) — só a camada de apresentação muda. `atoms.tsx` é eliminado no
final. Validar, na prática, que a biblioteca da Fase A cobre as
necessidades reais de um módulo — qualquer lacuna encontrada aqui informa
o plano de rollout dos restantes ~59 módulos.

## Design

### Mapa de substituição

| Hoje (local) | Passa a ser |
|---|---|
| `atoms.tsx` completo | eliminado — todos os consumidores importam de `@/components/ui/*` |
| Barra de separadores em `page.tsx` (`<button>` + `border-b-2` à mão) | `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` |
| Botões "Actualizar", "Novo Survey", "Enviar" (kudos/feedback), "Responder" | `Button` (`primary`/`secondary`/`ghost`, `size="sm"` onde already compacto) |
| Pills de filtro activo/inactivo (status de survey, tipo de feedback, métrica do heatmap) | `Button` `size="sm"`, `intent="primary"` quando activo / `intent="ghost"` quando inactivo |
| Badges de estado — `SurveysTab.STATUS_COLOR`, `FeedbackTab.TYPE_COLOR` | `Badge`, mapa: `DRAFT`/`ARCHIVED`→`neutral`, `ACTIVE`/`RECOGNITION`→`success`, `PAUSED`/`MANAGER`→`warning`, `COMPLETED`/`OPEN`/`PEER`→`info`, `ANONYMOUS`→`neutral` |
| Inputs de texto (kudos: destinatário + mensagem; feedback: textarea) | `Input`/`Textarea` (sem `FormField` — são campos inline sem label visível, mesmo padrão actual) |
| 3 empty states (`SurveysTab`, `RecognitionTab`, `FeedbackTab`) | `EmptyState` |
| 4 `KpiCard` em `OverviewTab` | `KpiCard` da Fase A — troca só os `intent`s (`primary`/`accent`/`success`/`danger` consoante o valor, ex.: eNPS negativo → `danger`) |
| `Avatar` (recognitions, feedback, leaderboard) | `Avatar` da Fase A — assinatura idêntica (`name`/`url`/`size`), troca só a prop `size` de número (8/10) para `'sm'|'md'|'lg'` |
| `ProgressBar` (eNPS breakdown, survey participation, analytics history) | `ProgressBar` da Fase A — perde a prop `color` livre (era uma cor Tailwind arbitrária por chamada); mapear cada uso para o token semântico mais próximo (ex.: barra de "Promotores" → sem cor custom, usa o `bg-accent` por omissão do componente; barras que hoje codificam sentido por cor — emerald/amber/red consoante o valor — precisam de continuar a comunicar isso: usar `<Badge>`/texto complementar ao lado em vez de recolorir a barra, já que o `ProgressBar` da Fase A é deliberadamente mono-cor) |
| Skeleton (loading) | usa directamente `@/components/ui/Skeleton` com `itemClassName="skeleton-shimmer h-12 rounded-card"` (shimmer da Fase A) em vez do `bg-slate-100` actual |
| Paleta violeta/índigo/slate/amber/emerald/red espalhada | tokens `bg-primary`/`text-primary`/`bg-accent`/`text-accent`/`bg-surface`/`text-ink`/`text-ink-muted`/`bg-success-subtle`/`text-success-ink`/etc. |
| Cantos/sombras (`rounded-xl`, `border-slate-100`, `hover:shadow-md`) | `rounded-card`, `border-border`, `shadow-resting`/`hover:shadow-hover` — ou, onde fizer sentido estrutural (KPIs, cards de conteúdo), o próprio componente `Card`/`CardBody` em vez de `<div>` solto |

### Fora do mapa de substituição (mantém-se)

- `MoodCheckin`'s selector de humor (5 emojis com escala 1-5) é um padrão
  visual bespoke sem equivalente na Fase A — mantém-se como está
  estruturalmente, só troca `border-violet-500`/`bg-white` pelos tokens
  (`border-primary`/`bg-surface`).
- Toda a lógica de dados (`useApiQuery`, `useApiMutation`, `apiClient`,
  `queryKeys`) — zero alterações.
- `atoms.tsx`'s `getInitials` (já delega para o mesmo padrão do `Avatar`
  da Fase A) — não precisa de migração própria, desaparece com o resto do
  ficheiro.

## Critério de sucesso

1. `components/engagement/atoms.tsx` eliminado.
2. Zero classes de cor Tailwind cruas (`violet-*`, `indigo-*`, `slate-*`,
   `amber-*`, `emerald-*`, `red-*`) em `components/engagement/**` e
   `app/(platform)/engagement/page.tsx` — só tokens da Fase A.
3. Todos os 6 ficheiros + `page.tsx` compilam (`tsc --noEmit`) e o
   `next build` inclui a rota `/engagement` sem erros.
4. Nenhum endpoint, parâmetro de query, payload de mutation ou nome de
   `queryKey` é alterado — comportamento idêntico ao actual.
5. `npm test` (vitest) continua 43/43 — este módulo não tem testes
   próprios, mas nada aqui deve tocar `lib/*.test.ts`.

## Fora de âmbito

- Qualquer outro módulo além de `engagement` — fica para o plano de lote
  da Fase B, a desenhar depois de validar este piloto.
- Construir um `Checkbox` novo — fica registado como gap, não resolvido
  aqui.
- Alterar comportamento/dados — só apresentação.
