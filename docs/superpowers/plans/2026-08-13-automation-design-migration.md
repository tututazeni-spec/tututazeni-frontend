# Migração do módulo automation (Fase B) — Plano

**Goal:** Migrar `components/automation/**` + `app/(platform)/automation/page.tsx` para
consumir exclusivamente `components/ui/`, eliminando `atoms.tsx` e toda a paleta Tailwind
crua, sem alterar dados/comportamento.

## Mapeamento de `atoms.tsx`

- `Skeleton` → `@/components/ui/Skeleton` directo (já é o que `atoms.tsx` fazia por dentro,
  só que com `itemClassName` cru `bg-slate-100`). Consumidores passam explicitamente
  `itemClassName="skeleton-shimmer h-16 rounded-card"` (mesmo padrão do piloto engagement).
- `CATEGORY_COLOR` (`Record<string,string>` de classes cruas) → novo
  `components/automation/constants.ts` com `CATEGORY_INTENT: Record<string, BadgeProps['intent']>`,
  consumido via `<Badge intent={CATEGORY_INTENT[cat] ?? 'neutral'}>`. 7 categorias para 5
  intents do `Badge` — mapeamento por afinidade semântica, partilha de intent é aceitável
  (mesmo padrão de `STATUS_INTENT`/`TYPE_INTENT` no piloto engagement).
- `TRIGGER_LABEL` → move para `components/automation/constants.ts` sem alterações (não tem cor).

## Ficheiros e mapeamento de primitivos

- `ExecutionsTab.tsx`: `Badge` (status), `Button` (filtros + retry), `Card`, `EmptyState`,
  `Skeleton`. Dot de status vira classe token (`bg-success`/`bg-danger`/`bg-warning`).
- `RulesTab.tsx`: `Badge` (categoria), `Button`/`IconButton` (acções), `Card`, `EmptyState`,
  `Skeleton`. `font-mono` da acção vira `font-data`.
- `StatsTab.tsx`: `KpiCard` (4 métricas, intent dinâmico onde a cor dependia de valor),
  `Card`+`CardBody`, `Badge` (categoria), `ProgressBar` (barra por categoria), `Skeleton`.
- `TemplatesTab.tsx`: `Card`+`CardBody`, `Badge`, `Button` (aplicar), `Skeleton`.
- `app/(platform)/automation/page.tsx`: `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent`
  (Radix, mesmo padrão do piloto engagement) em vez do `useState<Tab>` manual.
- `types.ts`: não tocado (só interfaces, sem cor).

## Constraints

- Zero alterações a dados/comportamento — mesmos endpoints, mesmos `queryKeys`, mesma lógica
  condicional (só migra a camada visual).
- Zero paleta Tailwind crua no final.
- `Card` sem `interactive` (nenhum card deste módulo tem acção de clique própria).
- `ProgressBar` mono-cor — sem tentativa de recolorir.
- Ícones lucide-react, `strokeWidth={1.75}`, tamanhos em `{14,16,18,20,24}`.
