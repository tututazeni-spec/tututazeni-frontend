# Rollout Fase B — migração em lote dos módulos restantes para a fundação de design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:dispatching-parallel-agents para correr os módulos de cada vaga em paralelo; cada módulo, dentro da sua sub-tarefa, usa superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans sobre o seu próprio plano detalhado (ver Task 0). Steps usam checkbox (`- [ ]`) para tracking.

**Goal:** Sequenciar a migração dos **61 módulos restantes** de `components/**` (todos excepto `ui/` e `engagement/`, já feito em PR #185) para consumir exclusivamente `components/ui/` (Fase A, PR #183), eliminando toda a paleta Tailwind crua e todo `atoms.tsx`/`style={{ color: '#hex' }}` — sem alterar nenhum comportamento de dados, replicando o padrão validado pelo piloto `engagement` (PR #185).

**Architecture:** Este documento é um **plano de rollout**, não um plano de implementação linha-a-linha — a essa escala (61 módulos, ~340 ficheiros, ~6300 ocorrências de estilo a migrar) escrever aqui o JSX final de cada ficheiro seria inventar código não lido, violando a regra "No Placeholders" da própria disciplina de planeamento pelo lado oposto (fantasiar em vez de especificar). Em vez disso: (1) inventariamos e classificamos os 61 módulos com dados reais do repositório (abaixo); (2) definimos duas trilhas de migração com receitas reutilizáveis, generalizadas a partir do piloto; (3) sequenciamos em vagas por risco/tamanho; (4) cada módulo, ao ser puxado para execução, recebe o seu **próprio plano detalhado** (mesmo formato de `2026-08-11-engagement-design-migration.md`, código real lido do ficheiro nesse momento) antes de qualquer commit — é assim que o próprio piloto foi feito (spec PR #184 → plano detalhado → execução).

**Tech Stack:** Next.js 15.3, React 19.2, TypeScript 5, Tailwind v4, `components/ui/` (Fase A, PR #183), `radix-ui`.

## Global Constraints

- Repo: `C:\Users\PLÁCIDO COSTA\innova\frontend`. `main` protegido — sempre worktree + branch + PR + CI verde (`build`) antes de squash-merge, nunca push directo.
- **Um módulo = uma branch = um PR** (convenção já estabelecida neste repo para as séries `refactor/*-view-split`, `feat/any-cleanup-*-page`, etc.) — não juntar vários módulos num só PR, mesmo dentro da mesma vaga.
- **Zero alterações a dados/comportamento** — mesmos endpoints, `queryKeys`, payloads de mutation, lógica de filtros. Só a apresentação muda. Idêntico à constraint do piloto.
- **Trilha 1 (classes Tailwind cruas):** zero `violet/indigo/slate/amber/emerald/red/teal/purple/blue/green/yellow/orange/gray/zinc/neutral/stone/cyan/sky/rose/pink/fuchsia/lime-[0-9]{2,3}` e `text-white` fixo no módulo migrado. `atoms.tsx` local eliminado assim que o último consumidor deixar de o importar.
- **Trilha 2 (estilo inline `style={{ color: '#hex' }}`):** zero literais de cor hex/rgb em `style={{...}}` nos ficheiros migrados — substituídos por classes de token (`bg-primary`, `text-ink-muted`, etc.) ou, onde `style` é genuinamente necessário (ex.: `width: '${pct}%'` calculado), mantém-se só a propriedade não-cor.
- **Não criar componentes novos em `components/ui/`** durante este rollout — gaps conhecidos (`Checkbox`) ficam como workaround nativo (`<input type="checkbox" className="accent-primary">`, já usado em `FeedbackTab`), tal como decidido no piloto. Se 3+ módulos independentes precisarem do mesmo gap, isso é motivo para pausar e abrir uma mini-task dedicada em `components/ui/` — não para inventar um componente ad-hoc a meio de um módulo.
- **`Card` sem a prop `interactive`** — bug conhecido (`tabIndex`/`role="button"` aplicados mesmo sem `onClick`), não replicar.
- **`ProgressBar` é mono-cor** (`bg-accent`) — onde a cor da barra comunicava sentido, mover essa informação para texto/ponto adjacente (padrão já usado em `AnalyticsTab`/`OverviewTab` do engagement).
- Verificação por módulo: `npx tsc --noEmit` + os dois greps do piloto (paleta crua / hex em `style`) + `npm run build` + `npm test` (43 testes pré-existentes, nenhum destes módulos tem testes próprios — confirma só que nada foi afectado) antes do commit final de cada PR.
- Ícones: `lucide-react`, `strokeWidth={1.75}`, tamanhos só de `{14,16,18,20,24}`.
- Commits: `git commit --no-verify`, mensagem termina sempre com `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.
- Cada módulo corre no seu próprio worktree (`superpowers:using-git-worktrees`) para permitir paralelismo real dentro de uma vaga sem colisão de working tree.

---

## Inventário (dados reais, 2026-08-13 — `grep` sobre `components/<módulo>`)

61 unidades de migração = 63 subdirectórios de `components/` menos `ui/` e `engagement/` (já feito).

### Trilha 1 — classes Tailwind cruas (55 módulos)

Contagem = ocorrências de `(violet|indigo|slate|amber|emerald|red|teal|purple|blue|green|yellow|orange|gray|zinc|neutral|stone|cyan|sky|rose|pink|fuchsia|lime)-[0-9]{2,3}` ou `text-white` em `components/<módulo>/**`.

| Tier | Critério (raw hits) | Módulos (raw / ficheiros / atoms.tsx) |
|---|---|---|
| **S — pequeno** | < 60 | certification (19/2/não), dashboard-institutional (19/3/**sim**), library (37/5/não), search (47/5/não), lms (48/5/não), notifications (48/4/não), work-declaration (49/7/não), monitoring (50/5/não), academic (54/5/não), automation (59/6/**sim**) |
| **M — médio** | 60–109 | api-integrations (70/6/**sim**), reports (73/9/**sim**), courses-learn (75/9/**sim**), ai-tutor (75/8/**sim**), roles-permissions (77/7/**sim**), micro-learning (80/10/**sim**), executive-reports (84/8/**sim**), audit (86/10/**sim**), career-plans (87/10/**sim**), competency-map (87/9/não), instructor (87/7/**sim**), documents (89/9/não), development-plans (96/8/**sim**), organization (97/9/**sim**), departments (97/8/**sim**), history (97/9/**sim**), knowledge (95/9/**sim**), trainings (93/9/**sim**), events (93/8/**sim**), leader (100/9/**sim**), assessments (103/9/não), learning-paths (103/9/**sim**), sucession (103/8/**sim**), onboarding (104/8/**sim**), leave (105/12/não) |
| **L — grande** | 110–159 | competencies (116/8/**sim**), enrollments (117/9/**sim**), performance (117/8/**sim**), users (119/9/não), leadership (120/9/**sim**), dashboard (121/7/**sim**), content-library (122/10/**sim**), payslips (122/10/**sim**), employees (125/11/não), roi-impact (125/9/**sim**), career (130/7/**sim**), courses (129/10/não), dashboard-rh (131/9/**sim**), declarations (133/10/não), analytics (136/9/**sim**), talent-development (156/9/**sim**), avatar-training (159/11/**sim**) |
| **XL — muito grande** | ≥ 160 | processes (160/8/não), evaluation (167/10/**sim**), crm (201/14/não) |

### Trilha 2 — `style={{ color: '#hex' }}` inline, sem classes Tailwind de cor (6 módulos)

Padrão diferente — não aparece no grep de paleta crua acima porque não usa classes Tailwind para cor. Contagem = literais hex (`#[0-9a-fA-F]{3,6}`) + atributos `style={{`.

| Módulo | Ficheiros | Hex | `style={{` |
|---|---|---|---|
| courses-modulos | 10 | 57 | 76 |
| settings | 6 | 61 | 65 |
| live-classes | 15 | 129 | 137 |
| evaluation360 | 9 | 123 | 158 |
| scalability | 2 | 163 | 128 |

**`login` sai desta tabela — investigado na Vaga 0, não é o mesmo padrão** (ver secção "Excepção — login" abaixo).

---

### Task 0: Recipe genérica (referência para todos os planos detalhados de módulo)

**Não é executável directamente** — é o molde que todo plano detalhado de módulo (Trilha 1) deve seguir, generalizado das Tasks 1-9 de `2026-08-11-engagement-design-migration.md`:

1. Ler todos os ficheiros do módulo (`components/<módulo>/**`, `app/(platform)/<rota-correspondente>/**`) e o seu `types.ts`/`constants.ts` se existirem.
2. Se houver `atoms.tsx`: mapear cada export local (`KpiCard`, `Avatar`, `Skeleton`, `ProgressBar`, …) para o equivalente em `components/ui/`; confirmar assinatura de props compatível (ex.: `ProgressBar` da Fase A não tem prop `color`).
3. Migrar ficheiro a ficheiro (constants/types primeiro se tiverem cor embutida, depois cada tab/view, container por último) — uma task por ficheiro, mesmo padrão de commit granular do piloto.
4. Após o último consumidor de `atoms.tsx` ser migrado: `git rm components/<módulo>/atoms.tsx`.
5. Grep de confirmação (zero resultados esperados):
   ```
   grep -rn "from './atoms'" components/<módulo>/
   grep -rniE "(violet|indigo|slate|amber|emerald|red|teal|purple|blue|green|yellow|orange|gray|zinc|neutral|stone|cyan|sky|rose|pink|fuchsia|lime)-[0-9]{2,3}|text-white\b" components/<módulo>/ "app/(platform)/<rota>"
   ```
6. `npx tsc --noEmit` → sem erros.
7. `npm run build` → sem erros, rota presente na tabela.
8. `npm test` → 43/43 verde.
9. Commit final + push + PR (título `refactor(<módulo>): migrar para a fundação de design`, corpo a referenciar PR #183/#185) → aguardar `build` CI verde → squash-merge.

**Recipe Trilha 2** (módulos `style={{ color: '#hex' }}`) — mesmos passos 1, 3, 6-9, mas o passo 2/5 muda:
- Mapear cada literal hex para o token semântico mais próximo (ex.: `#163A2E` → `primary`, ver tabela de tokens em `app/globals.css`); onde o hex não corresponde a nenhum token existente, é sinal de que a cor era decorativa/arbitrária — decidir caso a caso se vira `ink-faint`/`border` ou se é genuinamente um valor de dados (ex.: cor de um gráfico) que fica fora do escopo deste rollout (ver nota de gráficos abaixo).
- Grep de confirmação troca para: `grep -rn "#[0-9a-fA-F]\{3,6\}" components/<módulo>/`.

**Excepção — `login` (achado na Vaga 0, 2026-08-13):** não segue nenhum dos
dois padrões acima. `components/login/LoginView.tsx` (ficheiro único) é uma
página bespoke com uma tag `<style>{` `` `...` `` `}</style>` inteira embutida —
CSS à mão (`.login-card`, `.login-btn`, `@keyframes cardIn`, etc.), um
`@import url('https://fonts.googleapis.com/css2?family=Montserrat...')` que
contorna por completo o `next/font` já estabelecido (Sora/Inter/IBM Plex
Mono, Task 2 do plano da Fase A), uma imagem de fundo própria
(`/images/login-bg.jpg`) e uma paleta azul (`#0a2560`, `#1a4bb5`,
`#22c55e`, `#64748b`...) sem nenhuma relação com os tokens verde-pinho/ocre
da Fase A. Migrar isto não é uma troca mecânica de classes — é redesenhar a
página de login na linguagem visual nova, uma decisão de identidade que
precisa de confirmação humana antes de qualquer plano detalhado (mantém a
marca própria da página pública, ou herda os tokens internos da app?). Por
isso `login` **não** é o piloto da Trilha 2 — fica de fora das duas
trilhas, tratado à parte só depois dessa decisão ser tomada.

**Nota — módulos com visualização de dados (`analytics`, `roi-impact`, `avatar-training`, partes de `evaluation`/`competencies`):** cores usadas como *codificação de dados* num gráfico (ex.: série A vs série B) não são o mesmo problema que cor decorativa/estado — não forçar essas para os 6 tokens semânticos (`primary/accent/success/warning/danger/info`) só para "zerar o grep"; documentar no plano detalhado desse módulo qual sub-conjunto de cores é decorativo (migra) vs. codificação de série (fica, ou usa uma paleta categórica à parte — fora do escopo deste rollout, não inventar aqui).

---

### Task 1: Vaga 0 — validação dos módulos "raw=0"

**Files:** Nenhum — só investigação, precede a Vaga 1.

- [x] **Step 1:** Confirmar manualmente (leitura directa, não só grep) que os 6 módulos da Trilha 2 realmente não têm nenhuma classe Tailwind de paleta crua escondida atrás de `cn()`/template strings dinâmicas que o grep estático não apanhe (o piloto já mostrou que isto é uma classe de bug recorrente — ver `project_innova_schema_code_drift` como precedente do mesmo género de "o grep simples não chega").
- [x] **Step 2:** Para `login` especificamente, confirmar se usa classes Tailwind arbitrárias (`bg-[#...]`) — se sim, entra na Trilha 1 com uma regra de grep adicional (`\[#[0-9a-fA-F]{3,6}\]`) em vez da Trilha 2 pura.
- [x] **Step 3:** Registar os achados como comentário na abertura do plano detalhado de cada um destes 6 módulos (não neste documento — este é o rollout, não o plano de execução).

---

### Task 2: Vaga 1 — Trilha 1, Tier S (10 módulos, piloto de escala)

**Files:** Um plano detalhado por módulo, gerado no momento da execução (Task 0 recipe).

**Módulos:** certification, dashboard-institutional, library, search, lms, notifications, work-declaration, monitoring, academic, automation.

- [x] **Step 1:** Confirmar que este é o primeiro lote a correr com **múltiplos módulos em paralelo** (via `superpowers:dispatching-parallel-agents`, um worktree por módulo) — objectivo desta vaga não é só migrar 10 módulos pequenos, é validar que o processo do piloto (que correu sequencialmente, um único módulo) também funciona em paralelo sem colisão (cada módulo é auto-contido, sem ficheiros partilhados fora de `components/ui/` que ninguém aqui escreve).
- [x] **Step 2:** Para cada módulo, gerar o plano detalhado (Task 0 recipe) e executá-lo até PR aberto.
- [x] **Step 3:** Aguardar os 10 PRs com CI (`build`) verde; squash-merge cada um (auto-merge conforme preferência já registada).
- [x] **Step 4:** Antes de avançar para a Vaga 2, rever se algum destes 10 módulos revelou um gap de `components/ui/` não coberto pelo piloto (ex.: precisa de `Checkbox`, de uma variante de `Table` não usada em `engagement`) — se sim, é o ponto de decisão da constraint "3+ módulos independentes" acima.

**Concluído 2026-08-13 (PRs #187-#196).** Achados que ajustam as vagas
seguintes (ver `project_innova_design_system_rollout_wave1` na memória):
(1) despachar 10 agentes em paralelo de uma vez contribuiu para bater num
limite de sessão da conta a meio da vaga — reduzir a concorrência por lote
nas vagas seguintes; (2) o ficheiro deste plano de rollout tem de estar
**commitado** antes de despachar agentes com `isolation: "worktree"` — um
worktree bifurca do HEAD do branch, não do working tree sujo do
orquestrador, por isso um plano só escrito localmente fica invisível aos
agentes (mitigado nessa vaga inline-ando a receita em cada prompt; a
fazer bem desta vez é commitar primeiro); (3) o checkout principal do
orquestrador precisa de `npm install` corrido depois de qualquer PR que
mexa em dependências (`node_modules` desactualizado deu falsos positivos
de erro de tsc na verificação final).

---

### Task 3: Vaga 2 — Trilha 1, Tier M (25 módulos, 5 lotes de 5)

**Files:** Um plano detalhado por módulo.

**Ajuste pós-Vaga 1:** em vez de 3 lotes de ~8-9 módulos em paralelo,
reduzir para **5 lotes sequenciais de 5 módulos em paralelo cada**, com
verificação (`tsc`/`build`/`test` no `main` sincronizado) entre lotes —
concorrência mais baixa por lote para não repetir o limite de sessão que
interrompeu a Vaga 1.

- **Lote 1:** api-integrations, reports, courses-learn, ai-tutor, roles-permissions
- **Lote 2:** micro-learning, executive-reports, audit, career-plans, competency-map
- **Lote 3:** instructor, documents, development-plans, organization, departments
- **Lote 4:** history, knowledge, trainings, events, leader
- **Lote 5:** assessments, learning-paths, sucession, onboarding, leave

- [x] **Step 1:** Sub-dividir em 3 lotes de ~8-9 módulos para paralelismo controlado (não despachar os 25 de uma vez — mesmo tecto de concorrência usado nas séries `any-cleanup`/`view-split` deste repo, tipicamente 1 branch por agente de cada vez com revisão entre lotes).
- [x] **Step 2:** Para cada módulo, gerar o plano detalhado (Task 0 recipe) e executá-lo até PR aberto.
- [x] **Step 3:** Aguardar CI verde por PR; squash-merge cada um.

---

### Task 4: Vaga 3 — Trilha 1, Tier L (17 módulos)

**Files:** Um plano detalhado por módulo.

**Módulos:** competencies, enrollments, performance, users, leadership, dashboard, content-library, payslips, employees, roi-impact, career, courses, dashboard-rh, declarations, analytics, talent-development, avatar-training.

- [x] **Step 1:** Mesma sub-divisão em lotes de ~6 módulos que a Vaga 2. `analytics`, `roi-impact`, `avatar-training` e `talent-development` têm visualização de dados — aplicar a nota "gráficos" da Task 0 recipe; sinalizar no plano detalhado desses 4 quais cores são decorativas vs. codificação de série antes de tocar em qualquer ficheiro.
- [x] **Step 2:** Para cada módulo, gerar o plano detalhado e executá-lo até PR aberto.
- [x] **Step 3:** Aguardar CI verde por PR; squash-merge cada um.

---

### Task 5: Vaga 4 — Trilha 1, Tier XL (3 módulos, maior risco)

**Files:** Um plano detalhado por módulo.

**Módulos:** processes, evaluation, crm.

- [x] **Step 1:** Correr estes 3 **sequencialmente**, não em paralelo — são os módulos com mais ficheiros (`crm` tem 14, incluindo as 3 sub-rotas `beneficiaries`/`funders`/`partners`) e mais ocorrências de estilo (201 em `crm`); o risco de um plano detalhado ficar desactualizado a meio da execução por um ficheiro que mudou é maior aqui do que nos tiers menores.
- [x] **Step 2:** Para `crm`, confirmar antes de planear se `beneficiaries`/`funders`/`partners` partilham componentes suficientes para ser um único plano detalhado ou se compensa dividir em 3 PRs (`crm-beneficiaries`, `crm-funders`, `crm-partners`) — decisão a tomar com o código à frente, não aqui.
- [x] **Step 3:** Para cada módulo, gerar o plano detalhado e executá-lo até PR aberto; aguardar CI verde; squash-merge.

---

### Task 6: Vaga 5 — Trilha 2 (5 módulos, técnica diferente; `login` fica fora)

**Files:** Um plano detalhado por módulo, usando a "Recipe Trilha 2" da Task 0.

- [x] **Step 1:** Correr `settings` sozinho primeiro — é o piloto da Trilha 2 (menor soma hex+`style`, 6 ficheiros), tal como `engagement` foi o piloto da Trilha 1. Confirma se a técnica "mapear hex → token" funciona sem surpresas antes de escalar.
- [x] **Step 2:** Após `settings` mergeado e revisto, despachar os restantes 4 (`courses-modulos`, `live-classes`, `evaluation360`, `scalability`) — podem correr em paralelo entre si (módulos auto-contidos), pela ordem crescente de complexidade: courses-modulos, live-classes, evaluation360, scalability.
- [x] **Step 3:** Para cada módulo, gerar o plano detalhado (Recipe Trilha 2) e executá-lo até PR aberto; aguardar CI verde; squash-merge.
- [ ] **Step 4 (fora desta vaga, bloqueado em decisão humana):** `login` não entra em nenhuma execução automática — precisa de uma decisão explícita do utilizador sobre identidade visual (ver secção "Excepção — login" no inventário) antes de sequer se escrever um plano detalhado para ele.

---

### Task 6b: Vaga 6 — gap descoberto na verificação final (2 módulos, `acl` + `attendance`)

**Achado 2026-08-16, ao retomar o rollout para a verificação final:** o
inventário original da Task 0 (2026-08-13) contava 63 subdirectórios de
`components/` menos `ui/`/`engagement/` = 61 módulos. Essa contagem estava
errada — `components/acl/` e `components/attendance/` existiam já nessa
data (PRs #166 e #98/#137, ambos anteriores a 13/08) e nunca entraram em
nenhuma das duas tabelas de inventário (Trilha 1 nem Trilha 2). Não se
sabe se foi um erro do comando de `grep` usado nessa altura ou um lapso
manual — mas o efeito é que estes 2 módulos ficaram fora de todas as 6
vagas seguintes e só apareceram ao correr a Task 7 (Passo 1: `atoms.tsx`
não deu 0 resultados).

Ambos seguem o padrão Trilha 1 (paleta Tailwind crua + `atoms.tsx` local
que embrulha `components/ui/`):

| Módulo | Ficheiros | Raw hits | `atoms.tsx` |
|---|---|---|---|
| acl | 7 | 81 | sim |
| attendance | 10 | 111 | sim |

- [ ] **Step 1:** Correr os dois em paralelo (auto-contidos, mesmo padrão da Vaga 1/2) — plano detalhado por módulo (Task 0 recipe), executar até PR aberto.
- [ ] **Step 2:** Aguardar CI (`build`) verde por PR; squash-merge cada um.
- [ ] **Step 3:** Só depois de ambos mergeados, avançar para a Task 7 (verificação final) — a Task 7 já tinha sido tentada uma vez e falhado o Passo 1 precisamente por causa deste gap.

---

### Task 7: Verificação final do rollout

**Files:** Nenhum novo — só verificação, depois da última vaga.

- [ ] **Step 1:** `find components -maxdepth 2 -iname "atoms.tsx"` → 0 resultados em todo o repo.
- [ ] **Step 2:** `grep -rniE "(violet|indigo|slate|amber|emerald|red|teal|purple|blue|green|yellow|orange|gray|zinc|neutral|stone|cyan|sky|rose|pink|fuchsia|lime)-[0-9]{2,3}|text-white\b" components/ "app/(platform)/"` → 0 resultados fora de excepções documentadas (paleta de série de gráfico, ver Task 0).
- [ ] **Step 3:** `npm run build` completo → sem erros, todas as rotas presentes.
- [ ] **Step 4:** `npm test` → 43/43 verde.
- [ ] **Step 5:** Actualizar a memória do projecto: Fase B do sistema de design concluída, todos os `atoms.tsx` eliminados, ambas as trilhas fechadas.

---

## Notas de execução

- As vagas são sequenciais entre si (0 → 1 → 2 → 3 → 4 → 5), mas os módulos **dentro** de uma vaga são independentes e paralelizáveis, excepto a Vaga 4 (correr sequencialmente) e o primeiro módulo da Vaga 5 (`login`, piloto antes de escalar).
- Cada módulo migrado é **um PR separado** — no fim do rollout esperam-se ~61 PRs adicionais no histórico do `tututazeni-frontend`, cada um pequeno e revisável isoladamente, mesmo padrão das séries `refactor/*-view-split`/`feat/any-cleanup-*` já existentes neste repo.
- Este documento não fixa datas nem atribui módulos a agentes específicos — é um roteiro de sequenciamento e uma receita reutilizável; a decisão de "começar a Vaga 1 agora" é do utilizador.
- Se uma vaga revelar uma técnica ou bug não previsto aqui (à semelhança do `--font-mono`/private-folder do Fase A ou do `GRADE_COLOR`/`.split` do piloto), documentar na memória do projecto e, se afectar vagas futuras, actualizar este documento antes de continuar.
