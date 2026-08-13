# Migração do módulo roles-permissions (Fase B, Vaga 2 Lote 1) — Plano

**Goal:** Migrar `components/roles-permissions/**` + `app/(platform)/roles-permissions/**`
para consumir exclusivamente `components/ui/`, eliminando `atoms.tsx` e toda a paleta
Tailwind crua, sem alterar dados/comportamento (módulo ACL — só camada visual).

## Mapeamento de `atoms.tsx`

- `Skeleton` → `@/components/ui/Skeleton` directo nos 3 consumidores (`RolesTab`,
  `MatrixTab`, `GovernanceTab`), com `itemClassName="skeleton-shimmer h-16 rounded-card"`
  `wrapperClassName="space-y-3"` (mesmo padrão do automation/lms/monitoring já migrados).
  `atoms.tsx` é eliminado (`git rm`) depois de confirmar `grep -rn "from './atoms'"` → 0.

## Ficheiros e mapeamento de primitivos

- `RolesTab.tsx`: `Card`+`CardBody` (painel lista + painel detalhe), `Input` (pesquisa,
  ícone `Search` sobreposto), `Avatar` (iniciais do role e dos utilizadores — substitui os
  círculos `bg-indigo-100`/`bg-indigo-200` manuais), `Button` (`intent="secondary"` para
  Clonar, `intent="danger"` para Remover — já há confirm() a proteger a acção), `Badge`
  (`intent="neutral"` + `className="font-data"` para as pills de permissão), `EmptyState`
  (estado sem role seleccionado), `Skeleton`.
- `MatrixTab.tsx`: `Button` (`intent={activo ? 'primary' : 'secondary'}` para os chips de
  subject — mesmo padrão dos filtros do `ExecutionsTab` do automation), `Table`+`TableHead`+
  `TableBody`+`TableRow`+`TableHeaderCell`+`TableCell` (substituem a tabela HTML crua),
  `CheckCircle` vira `text-success`, `Skeleton`.
- `SimulatorTab.tsx`: `Card`+`CardBody` (form), `FormField`+`Input` (User ID/Recurso/Acção),
  `Button` (`loading` prop no lugar do texto condicional manual, mantém o texto condicional
  para preservar a cópia exacta), caixa de veredicto usa tokens `success`/`danger`
  (`border-success bg-success-subtle` / `border-danger bg-danger-subtle`, mesmo padrão do
  `recentFails` do `StatsTab` do automation) em vez de `emerald`/`red` cru. Círculos de
  veredicto e da cadeia de decisão idem (`bg-success`/`bg-danger` + `text-canvas`).
- `GovernanceTab.tsx`: `KpiCard` (4 métricas, intent dinâmico onde a cor dependia de valor —
  mesmo padrão do `StatsTab` do automation), `Card`+`CardBody` (distribuição por role),
  `ProgressBar` mono-cor (barra por role), caixa de alertas com mapa local
  `ALERT_STYLES: Record<string, string>` (ALERT→danger, WARNING→warning, INFO→info,
  declarado no próprio ficheiro — mesmo padrão do `STATUS_INTENT` local do
  `ExecutionsTab`), caixa "roles sem utilizadores" vira `border-warning bg-warning-subtle`
  (emoji `⚠️` mantido tal-e-qual, é conteúdo, não cor). `Skeleton`.
- `app/(platform)/roles-permissions/page.tsx`: `Tabs`/`TabsList`/`TabsTrigger`/
  `TabsContent` (Radix, mesmo padrão do automation) em vez do `useState<Tab>` manual;
  cabeçalho usa `rounded-control bg-accent-subtle` + `text-accent` (mesmo padrão do
  cabeçalho do automation).
- `constants.ts`, `types.ts`: não tocados (sem cor crua).

## Ícones fora do conjunto permitido `{14,16,18,20,24}` a corrigir

`Search size={13}`→14, `ChevronRight size={12}`→14, `Copy size={12}`→14,
`Trash2 size={12}`→14, `Icon size={15}` (tabs da page) →16 (passa a ser gerido pelo
`TabsTrigger`). `Shield size={36}` desaparece — substituído pelo ícone interno fixo (20) do
`EmptyState`.

## Constraints

- Zero alterações a dados/comportamento — mesmos endpoints, `queryKeys`, `useConfirm`,
  `prompt()` nativo do clone (não é uma cor, não migra).
- Zero paleta Tailwind crua no final.
- `Card` sem `interactive` (nenhum card deste módulo tem acção de clique própria — os
  itens clicáveis da lista de roles são `<button>` dentro, não o `Card`).
- `ProgressBar` mono-cor — sem tentativa de recolorir.
- Ícones lucide-react, `strokeWidth={1.75}`, tamanhos em `{14,16,18,20,24}`.
