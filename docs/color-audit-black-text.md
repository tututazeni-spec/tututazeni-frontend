# Auditoria de cor de texto — conversão para preto padrão

> **Estado: apenas levantamento (scan). Nenhuma mudança de código foi feita.**
> Pedido do utilizador: trocar para preto todo o texto (letras/números) colorido do
> frontend, EXCEPTO (a) texto branco dentro de cards escuros, (b) cores de estado
> semânticas (sucesso/aviso/erro/info) e (c) padrões existentes de "troca de cor ao
> clicar / seleccionar". Os ficheiros brutos de cada categoria estão em
> `frontend/.color-audit/*.txt` (grep `ficheiro:linha`), não commitados — este
> documento é o resumo navegável.

Metodologia: o projecto usa Tailwind v4 com tokens `@theme` em `app/globals.css`
(não há cores Tailwind cruas espalhadas — quase tudo passa por classes geradas a
partir de `--color-*`). Por isso a varredura foi feita por token/utility, não por
componente a componente. Contagens = nº de ocorrências (grep `-n`), não nº de ficheiros
únicos, salvo indicação contrária.

---

## 1. EXCLUIR — cores semânticas de estado (decisão do utilizador)

Sucesso/aviso/erro/info em badges, alertas, ícones de estado. **Não tocar.**

| Classe/token | Ocorrências | Ficheiro de detalhe |
|---|---|---|
| `text-success`, `text-success-ink`, `text-warning`, `text-warning-ink`, `text-danger`, `text-danger-ink`, `text-info`, `text-info-ink` | 661 | `exclude_semantic-status.txt` |
| `text-green-*`, `text-red-*` (Tailwind cru, só na página pública `/verify/[code]`) | 4 | `exclude_raw-tailwind-semantic.txt` |

`components/ui/Badge.tsx` e `components/ui/StatusBadge.tsx` (usado por ~23 páginas
via `lib/statusBadge.ts`) são os dois pontos centrais que geram a esmagadora
maioria destes 661 — confirmado que só usam os 4 tokens semânticos + `neutral`
(cinza). Não há paleta "arco-íris" escondida por categoria.

## 2. EXCLUIR — branco dentro de card escuro / padrão de toggle ao clicar

Não existe uso do Tailwind `text-white` cru para este padrão (esse só aparece 3x,
em `components/ui/Button.tsx`, nos variants `danger`/`success`/`warning` — texto
branco sobre botão colorido, semântico, fora de âmbito também).

O padrão real de "fica branco ao seleccionar/clicar e volta à cor normal ao
seleccionar outro" usa o token `text-canvas` (quase-branco, `#f7f5ef`) emparelhado
com `bg-primary` (verde escuro), tipicamente dentro de um ternário `estado
selecionado ? 'bg-primary text-canvas' : 'outra-cor'`. Encontrado em **135
ocorrências / ~69 ficheiros** — ex.: toggles de vista grid/lista (`employees`,
`documents`), tabs de filtro activo (`attendance`, `leave`), contadores de filtro
activo. **Manter tal como está**, ficheiro completo em `exclude_text-canvas.txt`.

## 3. EXCLUIR — cinza/neutro já próximo de preto (não é "cor")

`text-ink` (#20241f, quase preto), `text-ink-muted` (#6e756b, cinza), `text-ink-faint`
(#9aa097, cinza esverdeado claro) — 2591 ocorrências, `exclude_neutral-ink.txt`.
São a paleta neutra do design system, não "cores coloridas" no sentido que o
utilizador descreveu. Não incluído nos candidatos.

## 4. JÁ CONFORME — `text-black`

80 ocorrências / 25 ficheiros já usam `text-black` Tailwind cru diretamente
(`already-compliant_text-black.txt`) — sobretudo em `components/analytics/`
(HRDashboardView, ManagerView). Nenhuma ação necessária aqui.

---

## 5. CANDIDATOS a converter para preto

### 5.1 `text-accent` / `text-accent-hover` (dourado/âmbar `#d6963a`, marca)
**48 ocorrências**, ficheiro `candidate_text-accent.txt`. Uso: ícones+texto de
destaque decorativo (sparkles, bookmarks, códigos de programa/curso, contagem de
avaliação/estrelas preenchidas, links hover). Não é semântico, não é
branco-em-card-escuro → candidato directo.

⚠️ **Caso especial — widgets de avaliação por estrelas** (ver secção 5.4 abaixo):
`text-accent` é usado como a cor da estrela "preenchida", em oposição a
`text-border-strong` (estrela "vazia"). Converter só `text-accent` para preto sem
decidir o que fazer ao par deixaria as duas ficarem visualmente quase iguais.

### 5.2 `text-primary` / `text-primary-hover` (verde escuro `#163a2e`, marca)
**167 ocorrências / ~115 ficheiros**, ficheiro `candidate_text-primary.txt`. É de
longe o maior candidato e o mais heterogéneo — três padrões distintos dentro dele:

- **(a) Decorativo puro** — títulos, ícones, links com sublinhado, labels em
  maiúsculas (`work-declaration`, `academic/ProgramDetailView`, `acl/OverviewTab`,
  etc.). Candidato limpo a preto.
- **(b) Estado "activo/seleccionado" sobre fundo claro** (~30 ocorrências, dentro
  de ternários com `bg-primary-subtle`/`border-primary` no mesmo `className`, ex.:
  `employees/page.tsx:204`, `reports/page.tsx:64`, `career-plans/GoalCard.tsx`).
  **Isto não é o padrão branco-em-card-escuro que o utilizador pediu para manter**
  (o texto nunca fica branco, só passa de cinza a verde) — mas é um sinal visual
  de selecção que desaparece se virar preto igual ao resto. Precisa de decisão
  explícita do utilizador antes de mexer: fundo/borda continuam a marcar a selecção
  mesmo sem o texto verde, mas perde-se um reforço visual.
- **(c) Cor de "fill" de `<input type="checkbox"/radio">`** — não é texto visível
  (letra/número), é o truque do plugin de forms do Tailwind que usa `text-{cor}`
  para pintar o check/radio marcado (ex.: `assessments/QuestionPlayer.tsx:118,151`,
  `attendance/LeaveModal.tsx:157`). **Fora de âmbito** do pedido ("letras e
  números"), mas uma substituição cega de `text-primary`→preto também mudaria isto
  (efeito colateral inofensivo, mas vale assinalar antes de fazer find-replace em
  massa).

### 5.3 Cores arbitrárias hardcoded (fora do design system)
- `text-[#b45309]` (âmbar/dourado) — 2 ocorrências: `avatar-training/LeaderboardTab.tsx:70`,
  `engagement/RecognitionTab.tsx:162`. Parece decorativo (troféu/destaque), candidato.
- `style={{ color: '#...' }}` inline — 5 ocorrências, `candidate_inline-style-hex.txt`.
  Destas, `#64748b`/`#94a3b8` (cinza) e `#0f172a` (já quase preto) em `app/error.tsx`,
  `app/global-error.tsx`, `Topbar.tsx`, `feedback/page.tsx` — **já neutros, não são
  "coloridos"**, provavelmente não precisam de mudar. Nenhum hex realmente colorido
  encontrado nesta categoria.

### 5.4 Caso especial — pares "preenchido/vazio" (estrelas de avaliação)
`text-border-strong` usado como texto em 6 sítios, sempre como o lado "vazio" de um
par com `text-accent` (estrela preenchida): `competencies/MyProfileView.tsx:91`,
`events/DetailView.tsx:321`, `knowledge/AdminDashboardView.tsx:90`,
`knowledge/ArticleDetailView.tsx:317`, `onboarding/MyPlanView.tsx:426,470`.
Ficheiro: `special_star-rating-unfilled_text-border-strong.txt`. **Não decidir
isto isoladamente** — depende da decisão sobre `text-accent` em 5.1.

---

## 6. Bug encontrado (não relacionado com o pedido, a título informativo)

`text-primary-ink` é usado em 3 linhas de `components/attendance/ClockWidgetView.tsx`
(58, 89, 109) mas **não existe nenhum token `--color-primary-ink` definido** em
`app/globals.css` → é uma classe Tailwind inexistente, não gera CSS nenhum, o texto
cai no `color` herdado do `body` (quase preto por acaso). Provavelmente um typo por
`text-primary`. Não bloqueia o pedido actual (já está ~preto por acidente), mas é
uma correcção separada que vale a pena fazer nalgum momento.

---

## 7. Resumo para a próxima sessão (decisão de trabalho)

Quando quiseres avançar com as mudanças, a ordem sugerida é:

1. `text-accent`/`text-accent-hover` decorativo (5.1) + `text-[#b45309]` (5.3) → preto,
   **decidindo primeiro** o que fazer ao par de estrelas (5.4) para não quebrar o
   contraste preenchido/vazio.
2. `text-primary` decorativo puro (5.2a) → preto.
3. `text-primary` em estado activo/seleccionado sobre fundo claro (5.2b) → decisão
   explícita (manter verde como reforço de selecção, ou uniformizar a preto).
4. `text-primary` em `<input>` de checkbox/radio (5.2c) → excluir do find-replace em
   massa (não é texto visível), ou aceitar o efeito colateral se for irrelevante.
5. Confirmar que nada em `exclude_text-canvas.txt` foi tocado por engano.
