# Migração do módulo work-declaration — Plano

**Goal:** Migrar `components/work-declaration/**` + `app/(platform)/work-declaration/page.tsx` para
consumir exclusivamente `components/ui/` (Fase A), eliminando toda a paleta Tailwind crua (o módulo
era um tema escuro bespoke — `#070d18`/`#111827`/`sky`/`slate`/`emerald`/`amber`/`red` — sem
nenhum token da fundação). Puramente visual: zero alterações a dados/comportamento (mock data,
handlers, filtros).

**Nota:** os tokens da fundação (`bg-canvas` etc.) resolvem para uma paleta clara (`#F7F5EF`
canvas, `#FFFFFF` surface) — não há ainda variante dark no `@theme`. A página muda de um tema
escuro bespoke para o tema claro standard do resto da app, tal como aconteceu no piloto engagement
(violeta escuro → canvas/surface claros).

## Global Constraints

- Zero classes de cor Tailwind cruas (`sky-*`, `slate-*`, `emerald-*`, `amber-*`, `red-*`,
  `indigo-*`, `text-white`, `bg-[#...]`, `border-white/*`, `bg-black/*`) no final.
- Zero alterações a dados/comportamento — mesmo mock data, mesmos handlers (`handleAction`,
  filtros de pesquisa/estado), mesma lógica de passos do `CreateModal`.
- Não criar componentes novos em `components/ui/`.
- `Card` sem `interactive` (nenhum card deste módulo tem acção de clique própria).
- `ProgressBar` não é usado aqui (não há barras de progresso neste módulo).
- Ícones `lucide-react`: `strokeWidth={1.75}`, tamanhos só de `{14,16,18,20,24}`.
- Commits: `git commit --no-verify`, mensagem termina sempre com
  `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.

## Decisões de mapeamento

- **`StatCard.tsx`** → passa a wrapper fino sobre `KpiCard` (`@/components/ui/KpiCard`); prop
  `accent: string` (classe Tailwind crua) → `intent: KpiCardProps['intent']`; prop
  `icon: React.ReactNode` → `icon: LucideIcon` (KpiCard instancia o ícone internamente).
  Mapeamento de cor: Total→`primary` (sem opção "neutral" no KpiCard), Assinadas→`success`,
  Emitidas→`info`, Rascunhos→`warning`.
- **`StatusBadge.tsx`** → passa a wrapper fino sobre `Badge` (`@/components/ui/Badge`); o ícone
  por-status é descartado (consistente com o precedente do piloto engagement — `SurveysTab`/
  `FeedbackTab` usam `Badge` só com texto, a cor semântica já comunica o estado via o ponto do
  `Badge`).
- **`constants.tsx` → `constants.ts`** (deixa de ter JSX depois do ponto acima) — `STATUS_META`
  muda de `{ label, color, bg, icon }` para `{ label, intent }` (forma consumida directamente por
  `Badge`/`StatusBadge` novo).
- **`DeclarationRow.tsx`** → `<tr>`/`<td>` crus → `TableRow`/`TableCell` (`@/components/ui/Table`);
  botões de ícone → `IconButton`; o menu de acções local (`useState` + `absolute`) → `DropdownMenu`
  (Radix, `@/components/ui/DropdownMenu`) — remove o `useState(menuOpen)` bespoke.
- **`CreateModal.tsx`** → `Modal`/`ModalContent` (`@/components/ui/Modal`, Radix Dialog) em vez do
  backdrop+painel bespoke; inputs → `Input`/`FormField`/`Select`; botões → `Button`. Renderizado
  sempre com `open` (o `page.tsx` já só monta `<CreateModal>` quando `showCreateModal` é `true`),
  `onOpenChange` chama `onClose`.
- **`page.tsx`** → grelha decorativa de fundo (linhas brancas translúcidas, deco só para o tema
  escuro) é removida — não tem equivalente nos tokens claros e não existe noutras páginas já
  migradas (engagement não tem nada equivalente). Toast local (`useState`+`setTimeout` bespoke) é
  substituído por `useToast()` do `providers/ToastProvider` (já montado no `app/layout.tsx`) — o
  visual/timing do toast muda ligeiramente (Radix Toast, 4000ms em vez de 3500ms) mas o
  comportamento de disparo (uma mensagem de sucesso por acção) mantém-se idêntico. Tabela usa
  `TableHead`/`TableBody`/`TableHeaderCell` directamente (não o wrapper `Table` — esse já embrulha
  num `div` com borda+cantos arredondados próprios, o que duplicaria a borda à volta do cabeçalho/
  rodapé partilhado da secção). Estado vazio → `EmptyState`.

## Ordem de execução

1. `types.ts` — sem alterações (sem cor).
2. `mockData.ts` — sem alterações (sem cor).
3. `constants.tsx` → `constants.ts` (rename + `STATUS_META` novo formato).
4. `StatusBadge.tsx` (consome `constants.ts` novo).
5. `StatCard.tsx`.
6. `DeclarationRow.tsx` (consome `StatusBadge.tsx` + `constants.ts`).
7. `CreateModal.tsx`.
8. `app/(platform)/work-declaration/page.tsx` (consome todos os anteriores).
9. Verificação final: `tsc --noEmit`, grep de paleta crua, `npm run build`, `npm test`.
10. Commit final + push + PR.

Cada ficheiro migra num commit próprio; a ordem acima respeita as dependências reais
(`constants` → `StatusBadge`/`DeclarationRow`; `StatusBadge` → `DeclarationRow`; todos →
`page.tsx`).
