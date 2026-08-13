# Migração do módulo api-integrations (Fase B, Vaga 2 Lote 1) — Plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar `components/api-integrations/**` + `app/(platform)/api-integrations/**` para consumir exclusivamente `components/ui/` (Fase A), eliminando `atoms.tsx` e toda a paleta Tailwind crua (indigo/slate/emerald/amber/red/teal), sem alterar nenhum comportamento de dados. Segue o mesmo padrão validado no piloto `engagement` (PR #185) e na Vaga 1 (`library`, `academic`, etc.).

**Architecture:** Cada tab (`ApiKeysTab`, `IntegrationsTab`, `MonitoringTab`, `WebhooksTab`) é auto-contida (dados próprios via `useApiQuery`/`apiClient` + apresentação) — cada task migra um ficheiro, trocando só a camada visual. `atoms.tsx` só tem 2 exports: `Skeleton` (wrapper fino sobre `components/ui/Skeleton`, mapeia 1:1 — cada consumidor passa a chamar `components/ui/Skeleton` directamente com as classes token) e `HEALTH_CONFIG` (mapa `health -> {color,bg,dot}` cru; não tem equivalente 1:1 em `components/ui`, por isso cada consumidor que precisa dele define localmente um `HEALTH_INTENT: Record<string, BadgeProps['intent']>` — mesmo padrão que `STATUS_INTENT`/`TYPE_INTENT` já usados em `engagement/SurveysTab.tsx` e `engagement/FeedbackTab.tsx` — e usa `Badge` para o pill de estado, eliminando a necessidade de um `dot` cru separado (o `Badge` da Fase A já desenha o seu próprio ponto via `bg-current`).

**Tech Stack:** Next.js 15.3, React 19.2, TypeScript 5, Tailwind v4, `components/ui/` (Fase A, PR #183).

## Global Constraints

- Repo: `C:\Users\PLÁCIDO COSTA\innova\frontend`. Branch: `refactor/api-integrations-design-migration`, a partir de `main`.
- **Zero alterações a dados/comportamento** — mesmos endpoints, mesmos `queryKeys`, mesmos payloads de mutation (`apiClient.post/patch/delete`), mesma lógica de `useConfirm`/`prompt`/`alert`. Só a apresentação muda.
- **Zero classes de cor Tailwind cruas** em `components/api-integrations/**` e `app/(platform)/api-integrations/**` no final — só tokens da Fase A.
- **Não criar componentes novos em `components/ui/`.**
- **`Card` sem prop `interactive`** — nenhuma linha deste módulo tem acção de clique própria no próprio card.
- Ícones: `lucide-react`, sempre `strokeWidth={1.75}`, tamanhos só de `{14,16,18,20,24}` (o código actual usa `size={9..13}` em vários sítios — arredondar sempre para cima ao valor permitido mais próximo: 9/10/12/13 → 14).
- Verificação: `npx tsc --noEmit` (cada task) + `npm run build` + `npm test` (Task 8, verificação final).
- Commits: `git commit --no-verify`, mensagem termina sempre com `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.
- `types.ts` não é tocado — só interfaces TypeScript, sem cor nenhuma.

---

### Task 1: `components/api-integrations/ApiKeysTab.tsx`

**Interfaces:** Consumes `Badge`, `Button`, `IconButton`, `Card`, `EmptyState`, `Skeleton` (`@/components/ui/*`).

- [ ] Reescrever para: `Card` a envolver a lista (`divide-y divide-border`); alerta de nova key com `border-success bg-success-subtle`/`text-success-ink`; código da key com `font-data text-ink`; `IconButton` (ghost) para copiar; `Button size="sm" intent="ghost"` para "Confirmar que guardei"; dot de estado activo com `bg-success`/`bg-border-strong`; scopes como spans `bg-surface-sunken text-ink-muted`; botões rotate/revoke como `IconButton` ghost com `hover:bg-warning-subtle hover:text-warning-ink` / `hover:bg-danger-subtle hover:text-danger-ink`; `EmptyState` (icon `Key`) quando lista vazia.
- [ ] `npx tsc --noEmit`
- [ ] Commit: `refactor(api-integrations): migrar ApiKeysTab para a fundacao de design`

### Task 2: `components/api-integrations/IntegrationsTab.tsx`

**Interfaces:** Consumes `Badge`, `Button`, `IconButton`, `Card`, `EmptyState`, `Skeleton`.

- [ ] Reescrever: header count + `Button` "Nova Integração"; cada linha vira `Card` com chip de ícone tokenizado (`HEALTH_INTENT` local, `bg-{intent}-subtle text-{intent}`); `Badge` para health + `Badge` para ACTIVE/INACTIVE; `IconButton` ghost para testar (com `RefreshCw` a girar) e toggle; `EmptyState` (icon `Plug`) quando vazio.
- [ ] `npx tsc --noEmit`
- [ ] Commit: `refactor(api-integrations): migrar IntegrationsTab para a fundacao de design`

### Task 3: `components/api-integrations/MonitoringTab.tsx`

**Interfaces:** Consumes `Badge`, `Card`/`CardBody`, `KpiCard`, `Skeleton`.

- [ ] Reescrever: 4 KPIs via `KpiCard` (`intent` primary/accent/success-ou-danger/warning, `className="w-full"` em grid 2/4 colunas); bloco "Saúde das Integrações" em `Card`, cada linha com `Badge` (HEALTH_INTENT local) em vez do dot+pill cru; taxa de erro por linha com `text-danger`/`text-success` (sentido comunicado por texto, não por barra); rodapé "Actualizado" com `text-ink-faint`.
- [ ] `npx tsc --noEmit`
- [ ] Commit: `refactor(api-integrations): migrar MonitoringTab para a fundacao de design`

### Task 4: `components/api-integrations/WebhooksTab.tsx`

**Interfaces:** Consumes `Badge`, `Button`, `IconButton`, `Card`, `EmptyState`, `Skeleton`.

- [ ] Reescrever: header + `Button` "Novo Webhook"; cada webhook em `Card`; `Badge` ACTIVE/INACTIVE; url em `font-data text-ink-faint`; tags de eventos como spans `bg-primary-subtle text-primary font-data`; botão remover como `IconButton` ghost com hover danger; stats delivered/failed com `text-success`/`text-danger`; `EmptyState` (icon `Zap`) quando vazio.
- [ ] `npx tsc --noEmit`
- [ ] Commit: `refactor(api-integrations): migrar WebhooksTab para a fundacao de design`

### Task 5: `app/(platform)/api-integrations/page.tsx`

**Interfaces:** Consumes `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent`.

- [ ] Reescrever container: header com `bg-surface border-border`, chip de ícone `bg-primary-subtle text-primary`, título `text-ink`/`font-display`, subtítulo `text-ink-faint`; separadores via `Tabs` (Radix) em vez do `useState`+botões manuais — mesmos 4 tabs, mesma ordem, `TabsContent` a renderizar o mesmo componente que já renderizava.
- [ ] `npx tsc --noEmit`
- [ ] Commit: `refactor(api-integrations): migrar page.tsx para Tabs da fundacao`

### Task 6: Eliminar `atoms.tsx` + grep de confirmação

- [ ] `grep -rn "from './atoms'" components/api-integrations/` → 0 resultados.
- [ ] `git rm components/api-integrations/atoms.tsx`
- [ ] `grep -rniE "(violet|indigo|slate|amber|emerald|red|teal|purple|blue|green|yellow|orange|gray|zinc|neutral|stone|cyan|sky|rose|pink|fuchsia|lime)-[0-9]{2,3}|text-white\b" components/api-integrations/ "app/(platform)/api-integrations"` → 0 resultados.
- [ ] `npx tsc --noEmit` → sem erros.
- [ ] Commit: `refactor(api-integrations): eliminar atoms.tsx (consolidado em components/ui/)`

### Task 7: Verificação final

- [ ] `npm run build` → sem erros, rota `/api-integrations` presente.
- [ ] `npm test` → 43/43 verde.
- [ ] Push da branch + `gh pr create`.

---

## Notas de execução

- Ordem real: Tasks 1-4 são independentes entre si (cada tab é auto-contida); Task 5 (page.tsx) não depende delas tecnicamente (só troca o shell de tabs), mas corre depois para não ficar `tsc` a acusar erro num ficheiro que ainda não existe/mudou. Task 6 só depois de 1-4 (todos os consumidores de `./atoms` migrados).
- `HEALTH_INTENT` é definido localmente em `IntegrationsTab.tsx` e em `MonitoringTab.tsx` (não centralizado num ficheiro `constants.ts` novo) — mesmo padrão dos mapas `STATUS_INTENT`/`TYPE_INTENT` locais já usados no módulo `engagement`.
- `Skeleton` de `components/ui` tem `itemClassName` por omissão com `bg-slate-100` (não tocado, é `components/ui`) — todos os call-sites deste módulo passam `itemClassName` explícito com tokens, por isso nunca aparece cru nos ficheiros migrados.
