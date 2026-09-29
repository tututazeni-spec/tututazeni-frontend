# Fase 0 — Reconhecimento

> Repositório: `tututazeni-frontend` (pasta `frontend/` dentro de `innova/`, git próprio).
> Branch: `feat/novo-design` (criada a partir de `main`, commit `41393b1`).

## 0. Nota de setup corrigida

O PDF e `_design-source/design-system/` tinham sido colocados na raiz do
repositório **backend** (`innova/`, repo `tututazeni-backend`), e a branch
`feat/novo-design` também tinha sido criada aí por engano. Ambos foram
movidos para este repositório (`frontend/_design-source/` e
`frontend/docs/GUIA-CLAUDE-CODE-NOVO-DESIGN.pdf`) e a branch foi recriada
aqui, a partir de `frontend/main` actualizado. O repositório backend foi
deixado limpo em `main`, sem branch nem ficheiros novos.

## 1. Stack e configuração confirmada

| Parâmetro                    | Valor                                                                                                                                                                                                                                           |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Next.js                      | 15.3.6, App Router                                                                                                                                                                                                                              |
| React                        | 19.2.3                                                                                                                                                                                                                                          |
| TypeScript                   | ^5                                                                                                                                                                                                                                              |
| Alias de importação          | `@/*` → raiz do repo                                                                                                                                                                                                                            |
| Estilos                      | **Tailwind CSS v4** (config 100% em CSS via `@theme` em `app/globals.css`, sem `tailwind.config.js`). Não há CSS Modules nem styled-components no projecto.                                                                                     |
| Ícones                       | `lucide-react` **já instalado** (^1.7.0) — não é preciso `npm i`.                                                                                                                                                                               |
| Fonte actual                 | Sora (display) + Inter (body) + IBM Plex Mono (dados), self-hosted via `next/font/local` (ficheiros `.woff2` no repo, não `next/font/google` — ver risco 4).                                                                                    |
| Gráficos                     | **Nenhuma biblioteca de gráficos instalada** (sem Chart.js/Recharts/D3). Não há nada a remover na Fase 7 nesse ponto.                                                                                                                           |
| Sessão/utilizador            | `hooks/useCurrentUser.ts` (React Query sobre cookie httpOnly `token`), `hooks/useCurrentRole.ts` para RBAC.                                                                                                                                     |
| Middleware                   | `middleware.ts` — protege tudo exceto `/login` (público) e `/verify`, `/health` (abertos), via cookie `token`.                                                                                                                                  |
| Grupo de rotas autenticadas  | **`app/(platform)/`, já existe** — layout próprio (`app/(platform)/layout.tsx`) com `<Sidebar />` + `<Topbar />`. A Fase 2 do guia (criar grupo `(app)`) já está feita sob outro nome; não é preciso criar nada, só adaptar o layout existente. |
| Rotas públicas fora do grupo | `app/login/`, `app/page.tsx`, `app/error.tsx`, `app/global-error.tsx`, `app/health/`.                                                                                                                                                           |
| `tenantName`                 | Não existe no código actual (nem em `Topbar.tsx` nem em `useCurrentUser`). Consistente com o guia: usar `"INNOVA"` por omissão até existir em Definições.                                                                                       |

## 2. ⚠️ Risco principal — já existe um design system completo, é diferente do novo

Isto é o achado mais importante da Fase 0 e muda a estratégia de execução.

Este projecto **já tem um design system totalmente implementado e aplicado a
todos os módulos** (rollout "Vagas 1-5", concluído — ver `components/ui/`,
16 componentes: `Card`, `Button`, `Badge`, `Table`, `FormField`, `ProgressBar`,
`Avatar`, `Modal`, `Tabs`, `Select`, `Combobox`, `DropdownMenu`, `Tooltip`,
`Toast`, `EmptyState`, `KpiCard`, `Skeleton`, `Pagination`, `ConfirmDialog`,
`StatusBadge`, `PathProgress`) e uma rota `/styleguide` que o documenta.

Esse sistema actual (`app/globals.css`, bloco `@theme`) é:

- **Tema claro apenas** — `color-scheme: light` fixado deliberadamente
  (comentário no código explica que isto evita que o "Auto Dark Mode" do
  Chrome/Edge tente escurecer conteúdo montado em Portal — modais, toasts —
  e deixe texto ilegível). Ver risco 4.
- Paleta verde/dourado em tons claros: `--color-primary` (`#163a2e`,
  verde escuro), `--color-accent` (`#d6963a`, dourado), fundo
  `--color-canvas` (`#f7f5ef`, bege muito claro).
- Fontes Sora/Inter/Plex Mono, não Plus Jakarta Sans.
- Nomes de tokens diferentes dos do pacote novo (`--color-primary` vs.
  `--accent`; `--color-surface` vs. `--card`; etc.) — não há colisão directa
  de nomes, mas há duas fontes de verdade se ambos coexistirem.

O pacote novo em `_design-source/design-system/` propõe um **dashboard
escuro** (`--bg`, `--sidebar`, `--card`, `--card-soft`, tokens `--accent` /
`--accent-contrast`), fonte Plus Jakarta Sans, com troca de marca
`data-brand="gold"`, e componentes com nomes muito próximos mas API
diferente (`Card`, `Grid`, `Button`, `Pill`, `Badge`, `Avatar`, `Progress`,
`Field`, `DataTable`).

**Escala do que seria afectado:** 73 páginas em `app/(platform)/`, 581
ficheiros em `components/` (fora de `components/ui/`). Uso actual dos
componentes existentes (contagem aproximada por import):
`Button` ~330 ficheiros, `Card` ~207, `Modal` ~103, `Avatar` ~103,
`FormField` ~99, `Badge` ~100, `ProgressBar` ~68, `Table` ~45, `Tabs` ~30.

**Decisão que preciso que aproves antes da Fase 1:** dado que a Regra de
Ouro nº 6 do guia diz "reutiliza antes de criar", e que praticamente todo
componente do pacote novo tem equivalente directo no `components/ui/`
actual, a estratégia mais segura e barata é:

- **Opção A (recomendada): retonizar no lugar.** Manter os componentes
  actuais (`Card`, `Button`, `Badge`, `Table`→`DataTable`, `FormField`→
  `Field`, `ProgressBar`→`Progress`, `Avatar`) e só trocar os tokens/CSS por
  trás deles para a paleta escura nova, acrescentando o que falta (`Grid`,
  `Pill`, os 5 gráficos SVG, um `AppShell` que substitua `Sidebar`+`Topbar`
  actuais preservando o filtro de RBAC que já lá está). As 73 páginas não
  precisam de tocar em imports — herdam o novo visual automaticamente. É
  isto que o Anexo A do guia ("Antes → Depois") sugere quando o "antes" já é
  um destes componentes.
- **Opção B (literal ao guia):** copiar os componentes novos de
  `_design-source/` para `src/components/ui` com os nomes/API do pacote
  (`Field`, `DataTable`, `Progress`, `Pill`...) e migrar as 73 páginas módulo
  a módulo na Fase 5, apagando os componentes antigos no fim. Fiel ao texto
  do guia, mas ~3-4x mais trabalho e risco de regressão, para um resultado
  visualmente igual à Opção A.

Vou seguir a **Opção A** salvo indicação em contrário, porque cumpre o
objetivo (visual novo em toda a plataforma) com muito menos superfície de
mudança e menos risco de quebrar comportamento — mas quero confirmação
explícita antes de tocar em `components/ui/`, já que o guia pede isto no
ponto de paragem.

## 3. Outros riscos identificados

1. **Tailwind v4 sem ficheiro de config.** O guia assume
   `tailwind.config.*` com `theme.extend.colors`. Aqui a ponte tokens↔Tailwind
   já é feita directamente em `app/globals.css` via `@theme` — vou seguir o
   mesmo padrão (adicionar/ajustar tokens no bloco `@theme` existente) em vez
   de criar um ficheiro de config que o projecto não usa.
2. **`_design-source/` não é um ZIP** — já veio descompactado (o utilizador
   entregou a pasta directamente). Sem impacto, só a nota fica desactualizada
   face ao guia.
3. **Fonte:** o guia pede `next/font/google` para Plus Jakarta Sans. Este
   projecto evita deliberadamente `next/font/google` (comentário em
   `app/layout.tsx`: builds bloqueavam em rede lenta por causa do fetch a
   `fonts.googleapis.com` em tempo de compilação). Vou seguir o mesmo padrão
   do projecto — self-host o `.woff2` da Plus Jakarta Sans via
   `next/font/local` — em vez de introduzir `next/font/google` de novo.
4. **`color-scheme: light` fixado + tema escuro novo.** Se o novo design for
   escuro, o `viewport.colorScheme` e o `:root { color-scheme: light }`
   actuais têm de mudar para `dark`, e o problema original que motivou
   fixá-los (Auto Dark Mode do browser a reescrever conteúdo em Portal —
   modais/toasts) precisa de ser revalidado sob o tema escuro, não só
   ignorado. Vou testar isto explicitamente antes de fechar a Fase 1.
5. **`lang="pt"` actual vs. `lang="pt-PT"` pedido pelo guia** — mudança
   trivial, sem risco, na Fase 1.
6. **`app/(platform)/layout.tsx` tem estilos inline com valores soltos**
   (`marginLeft: "240px"`, `background: "#f8fafc"`) — candidatos naturais a
   virar tokens/CSS Module quando o `AppShell` for adaptado na Fase 2.
7. **Dispersão de cores actual:** 114 ocorrências de hex de 6 dígitos em
   `app/` + `components/` (`.tsx`/`.css`). Número de referência para
   comparar na Fase 7.
8. **RBAC do menu já existe e é real** (ver memória: sidebar auditada contra
   `@Roles()` reais do backend). A Fase 2 do guia diz "reutiliza-a, não a
   reescrevas" — vou preservar a lógica de filtro de `components/Sidebar.tsx`
   tal e qual, só mudando a apresentação.

## 4. Módulos e rotas (app/(platform)/), para ordenar a Fase 5

73 páginas em 61 pastas de módulo. Agrupamento proposto, seguindo a ordem
sugerida no guia e ajustado aos módulos reais deste projecto:

| Lote                                                           | Módulos (pasta em `app/(platform)/`)                                                                                                                                                                                                                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A                                                              | `courses`, `courses/modulos`, `courses/[courseId]`, `trainings`, `enrollments`                                                                                                                                                                                                                          |
| B                                                              | `crm`, `crm/beneficiaries`, `crm/partners`, `crm/funders`                                                                                                                                                                                                                                               |
| C                                                              | `development-plans` (PDI), `career`, `competencies`, `competency-map`                                                                                                                                                                                                                                   |
| D                                                              | `evaluation`, `evaluation360`, `assessments`, `feedback`                                                                                                                                                                                                                                                |
| E                                                              | `events`, `live-classes`, `onboarding`                                                                                                                                                                                                                                                                  |
| F                                                              | `organization`, `departments`, `employees`, `users`, `roles-permissions`, `acl`, `settings`                                                                                                                                                                                                             |
| G                                                              | `library`, `content-library`, `knowledge`, `automation`, `processes`, `api-integrations`, `scalability`, `ai-tutor`                                                                                                                                                                                     |
| H (fora da lista original do guia, específicos deste projecto) | `dashboard-rh`, `dashboard/institutional`, `analytics`, `executive-reports`, `reports`, `monitoring`, `monitoring/indicators`, `audit`, `attendance`, `leave`, `payroll`, `payslips`, `declarations`, `work-declaration`, `documents`, `history`, `notifications`, `roi-impact`, `search`, `styleguide` |

`styleguide` é a página que documenta o design system **actual** — decisão
pendente na Fase 8: atualizá-la para o novo sistema ou remover.

## 5. Comandos de verificação

- Typecheck: `npx tsc --noEmit`
- Lint: `npm run lint`
- Build: `npm run build`
- Testes: `npm test` (vitest)
- Não há script de typecheck dedicado no `package.json`; vou usar
  `npx tsc --noEmit` diretamente como pede o guia.
