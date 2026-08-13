# Migração do módulo library (Fase B, lote) — Plano

**Goal:** Migrar `components/library/**` + `app/(platform)/library/**` (incluindo
`library/[id]` e `library/novo`) para consumir exclusivamente `components/ui/`
(Fase A), eliminando toda a paleta Tailwind crua. Módulo não tem `atoms.tsx`
próprio — os dois helpers de apresentação locais (`Info`, `Field`) e os dois
skeletons (`GridSkeleton`, `DetailSkeleton`) em `components/library/shared.tsx`
ficam, só trocam classes cruas por tokens (não há motivo para os eliminar,
não duplicam nada de `components/ui/`).

**Architecture:** 5 ficheiros com cor crua: `shared.tsx`, `LibraryListView.tsx`,
`LibraryItemView.tsx`, `LibraryCreateView.tsx`, `app/(platform)/library/[id]/page.tsx`.
`types.ts`, `layout.tsx`, `page.tsx` (raiz) e `novo/page.tsx` não têm cor —
não são tocados. `shared.tsx` migra primeiro (consumido por `LibraryListView`
e `[id]/page.tsx`).

## Global Constraints

- Zero alterações a dados/comportamento — mesmos hooks (`useLibraryList`,
  `useLibraryItem`, `useCreateLibraryItem`), mesmas props, mesma lógica.
- Zero classes Tailwind cruas no final.
- Sem criar componentes novos em `components/ui/`.
- `Card` sem prop `interactive` — os cards de recurso na grelha são clicáveis
  via `<Link>` a envolver o `Card` (não via `onClick` do próprio Card), por
  isso não levam `interactive`; o hover de sombra é replicado via className
  (`hover:shadow-hover`) directamente.
- Filtro "Todos os tipos" (`typeFilter === ''`) não é representável nativamente
  no `Select` da Fase A (Radix rejeita `value=""` num `Select.Item`) — mapeia-se
  para um sentinel `'ALL'` só na camada de apresentação; `onTypeFilterChange`
  continua a ser chamado com `''` como antes (contrato externo inalterado).
- `font-mono` → `font-data` (único uso: código do item em `LibraryItemView`).
- Ícones lucide-react: `strokeWidth={1.75}`, tamanhos `{14,16,18,20,24}`.
- Commits: `git commit --no-verify`, mensagem termina com
  `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.

## Tasks

1. `components/library/shared.tsx` — `Info`/`Field` para tokens; `GridSkeleton`/
   `DetailSkeleton` para usar `Skeleton` (`@/components/ui/Skeleton`).
2. `components/library/LibraryListView.tsx` — `Button`, `Input`, `Select`,
   `Card`/`CardBody`, `EmptyState`; card de recurso envolvido em `<Link>`.
3. `components/library/LibraryItemView.tsx` — `Button`, `Card`/`CardBody`,
   `Badge`, `Input`; `font-mono` → `font-data`.
4. `components/library/LibraryCreateView.tsx` — `Button`, `Card`/`CardBody`,
   `FormField`, `Input`, `Select`, `Textarea`.
5. `app/(platform)/library/[id]/page.tsx` — banner de erro para tokens +
   `Button`.
6. Verificação final: `npx tsc --noEmit`, grep de paleta crua, `npm run build`,
   `npm test`.
