# Migração do módulo ai-tutor (Vaga 2, Lote 1) — Plano

**Goal:** Migrar `components/ai-tutor/**` + `app/(platform)/ai-tutor/**` para
consumir exclusivamente `components/ui/`, eliminando `atoms.tsx` e toda a
paleta Tailwind crua (blue/purple/gray/emerald/amber/green), sem alterar
nenhum comportamento de dados. Mesmo padrão da migração piloto de
`engagement` (`docs/superpowers/plans/2026-08-11-engagement-design-migration.md`).

**Tech Stack:** Next.js 15.3, React 19.2, TypeScript 5, Tailwind v4,
`components/ui/` (Fase A, PR #183).

## Mapeamento atoms.tsx → components/ui/

| Export local (`atoms.tsx`) | Consumidores | Destino |
|---|---|---|
| `Skeleton({ rows })` | `HistoryView`, `RecommendationsView` | `@/components/ui/Skeleton` directo, com `itemClassName="skeleton-shimmer h-12 rounded-card"` (mesmo padrão já usado em `components/engagement/*`) |
| `TypingDots()` | `ChatView` (indicador "a escrever") | inline em `ChatView.tsx` (JSX local, `bg-accent` em vez de `bg-blue-400`) — não é promovido a componente novo, é bespoke local como o selector de humor em `MoodCheckin.tsx` |

Depois de `ChatView`/`HistoryView`/`RecommendationsView` migrados, `atoms.tsx`
é eliminado (`git rm`) e confirmado com
`grep -rn "from './atoms'" components/ai-tutor/` → 0 resultados.

## Ficheiro a ficheiro

1. **`MessageBubble.tsx`** — avatar "N" → `Avatar name="NOVA"`; bolha do
   utilizador → `div` com `bg-primary text-canvas rounded-card` (Card força
   `bg-surface`, não serve para a bolha colorida); bolha do assistente →
   `Card`; estrelas de rating (`★` texto + `text-amber-400`) → ícone
   `Star` (lucide-react, `size={14}`) com `fill-current text-warning-ink`
   quando preenchido, `text-ink-faint` quando vazio.
2. **`ChatView.tsx`** — selector de personalidade e botão "Iniciar" →
   `Button` (`intent` primary/secondary conforme selecção activa, mesmo
   padrão de `FeedbackTab.tsx`); avatar do header/estado vazio → `Avatar`;
   input de mensagem → `Input`; botão enviar → `IconButton` com ícone
   `Send`; quick actions → `Button size="sm" intent="secondary"`;
   `TypingDots` inline com tokens.
3. **`GenerateView.tsx`** — selector de tipo e quantidade → `Button`
   (mesmo padrão toggle); campo de tema → `Input`; botão gerar → `Button`
   com `loading` (remove o SVG spinner manual, o `Button` já tem um
   embutido); cards de resultado (quiz/flashcards/resumo) → `Card`;
   opção correta do quiz → tokens `success`; explicação → tokens `info`.
4. **`HistoryView.tsx`** — botão "Voltar" → `Button intent="ghost"` +
   ícone `ArrowLeft` (mesmo padrão de `LibraryItemView.tsx`); linha de
   sessão clicável → `Card interactive` (tem `onClick` próprio — é o caso
   em que `interactive` é legítimo); estado "Encerrada"/"Activa" →
   `Badge`; lista vazia → `EmptyState`; loading → `Skeleton`.
5. **`RecommendationsView.tsx`** — caixa de insight → `Card` com
   `bg-gradient-to-r from-primary-subtle to-accent-subtle`; avatar →
   `Avatar`; gaps de competência → `Badge intent="warning"`; lista de
   cursos → `Card`, ícone de curso `bg-primary-subtle text-primary`.
6. **`app/(platform)/ai-tutor/page.tsx`** — grupo de navegação por pills
   (`bg-gray-100 p-1 rounded-xl`) → `Tabs`/`TabsList`/`TabsTrigger`/
   `TabsContent` (`@/components/ui/Tabs`), controlado (`value`/
   `onValueChange`) para preservar o título dinâmico `TITLES[view]`.
7. **`atoms.tsx`** — eliminado (`git rm`) depois do passo 2.

`constants.ts` e `types.ts` não têm cor nenhuma — não são tocados.

## Constraints (ver prompt da task para a lista completa)

Zero dados/comportamento alterado · zero Tailwind cru no final · sem
componentes novos em `components/ui/` · `Card` sem `interactive` salvo
clique próprio · `ProgressBar` não é usado aqui (não há barras de
progresso neste módulo) · ícones lucide-react `strokeWidth={1.75}`,
tamanhos `{14,16,18,20,24}`.

## Verificação

`npx tsc --noEmit` → sem erros · grep de `from './atoms'` → 0 · grep de
cores cruas (`(violet|indigo|slate|amber|emerald|red|teal|purple|blue|
green|yellow|orange|gray|zinc|neutral|stone|cyan|sky|rose|pink|fuchsia|
lime)-[0-9]{2,3}|text-white\b`) → 0 · `npm run build` → sem erros ·
`npm test` → 43/43 verde.
