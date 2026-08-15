# Migração do módulo settings (Fase B, Vaga 5 — piloto Trilha 2) — Plano

> Para workers agênticos: segue `superpowers:subagent-driven-development` /
> `superpowers:executing-plans`. Este documento é a receita completa —
> executa as tasks pela ordem indicada, marca cada checkbox `- [ ]` → `- [x]`
> à medida que avanças, corre a task de verificação final antes de abrires PR.

## Goal

Eliminar todo o estilo inline `style={{ color: '#hex', ... }}` e todos os
objectos de estilo hardcoded em `components/settings/**` e
`app/(platform)/settings/page.tsx`, substituindo por classes Tailwind com
os tokens semânticos de `app/globals.css` e pelos componentes partilhados
de `components/ui/`. Zero data/behavior changes — a UI deve continuar
funcionalmente idêntica (mesmos campos, mesma lógica de submit/validação,
mesmos estados), só a camada visual muda de fonte (inline hex → tokens +
componentes).

Este é o módulo-piloto da Vaga 5 / Trilha 2 (o "anti-padrão" aqui é
`style={{color:'#hex'}}` em vez de classes Tailwind com paleta crua, que
foi o anti-padrão das Vagas 1-4). Corre sozinho antes dos outros 4 módulos
da Vaga 5 (`courses-modulos`, `live-classes`, `evaluation360`,
`scalability`), que só arrancam depois deste estar mergeado e revisto.
`login` fica fora de âmbito (decisão humana de identidade visual pendente).

## Architecture

`components/settings/` tem 6 ficheiros: `styles.ts` (objectos de estilo
partilhados), `Toast.tsx` (toast local reimplementado à mão), `TabPerfil.tsx`,
`TabPermissoes.tsx`, `TabSeguranca.tsx` (as 3 tabs), mais
`app/(platform)/settings/page.tsx` (shell: header, tab switcher, error/loading
states, gestão do toast local). O padrão é o mesmo já visto no resto do
Fase B: um módulo reimplementa à mão componentes (botão, input, badge, tabs,
toast, avatar em gradiente) que já existem em `components/ui/` — a migração
é substituir a reimplementação pelo componente partilhado, não só trocar
cores.

`<ToastProvider>` já está montado globalmente em `app/layout.tsx` (linha 50,
`<ToastProvider>{children}</ToastProvider>`) e `useToast()` já tem precedente
de uso em `app/(platform)/styleguide/page.tsx` e
`app/(platform)/work-declaration/page.tsx` — não é preciso montar nada de
novo, só importar `useToast` de `@/providers/ToastProvider` e usar.

## Tech Stack

Next.js (App Router) + React + TypeScript + Tailwind v4 (`@theme` tokens em
`app/globals.css`) + `class-variance-authority` (Button) + Radix UI (Tabs,
Toast) + `lucide-react` (ícones) + `lib/cn.ts` (clsx + tailwind-merge).

## Global Constraints

- Repo: `tututazeni-frontend` (frontend/ do projecto INNOVA), branch a
  partir de `main` sincronizada.
- Zero mudanças de comportamento/dados — só a camada visual muda.
- Zero `style={{ color: ... }}` ou qualquer hex cru (`#rrggbb`/`#rgb`) no
  fim da migração em `components/settings/**` e `app/(platform)/settings/page.tsx`.
  Layout inline não-cor (ex.: `gridColumn`, `gap` pontuais que não tenham
  classe Tailwind directa) pode ficar, mas prefere sempre a classe Tailwind
  equivalente quando existir. Excepção documentada: a escala ordinal de
  força de password (`strColor`) mapeia para `danger`/`warning`/`primary`/
  `success` na ordem fraca/razoável/boa/forte — ver tabela de mapeamento e
  Task 3.
- Não inventes componentes novos — reutiliza os já existentes em
  `components/ui/` (`Button`, `Input`, `FormField`, `Card`/`CardHeader`/
  `CardBody`/`CardFooter`, `Badge`, `Avatar`, `Tabs`/`TabsList`/`TabsTrigger`/
  `TabsContent`) e `useToast` de `providers/ToastProvider`. Só cria markup
  bespoke tokenizado (`bg-*`, `text-*`, `border-*` das classes do tema) onde
  não haja primitivo exacto (ex.: painel de pontos/gamificação, ícone de
  role em gradiente na tab de permissões).
- Ícones: `lucide-react`, `strokeWidth={1.75}`, tamanhos de `{14,16,18,20,24}`.
- Commit com `git commit --no-verify`, mensagens a terminar com
  `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.
- PR contra `main`, à espera do check `quality` (CI) ficar verde antes de
  squash-merge — nunca contornar a protecção do branch.

## Mapeamento de tokens (referência para todas as tasks)

| Hex/uso actual | Token/classe destino | Nota |
|---|---|---|
| `#1e40af` (botão primário, ícones activos, tab activa, força-senha "boa") | `primary` | |
| `#f1f5f9`/`#475569` (botão ghost) | `surface-sunken` / `ink-muted` | |
| `#e2e8f0` (borders de input/card) | `border` (ou `border-strong` se já era mais escuro) | |
| `#1e293b` (texto principal) | `ink` | |
| `#64748b`/`#94a3b8` (texto secundário/placeholder) | `ink-muted` / `ink-faint` | |
| `#fff`/superfícies de card | `surface` | |
| `#dc2626`/`#fef2f2`/`#fecaca` (erro, logout, força-senha "fraca") | `danger` / `danger-subtle` / `danger-ink` | |
| `#16a34a`/`#ecfdf5`/`#bbf7d0` (activo, sucesso, força-senha "forte", dicas ok) | `success` / `success-subtle` / `success-ink` | |
| `#f59e0b` (força-senha "razoável") | `warning` | única ocorrência onde `#f59e0b` mapeia para warning — ordinal genuína de força |
| `#fffbeb`/`#fde68a`/`#92400e` (aviso de expiração de token em `TabSeguranca`) | `warning-subtle` / `warning` / `warning-ink` | aviso de caução real |
| `#fffbeb`/`#fde68a` (painel "badges recentes" e pontos em `TabPerfil`) | `accent-subtle` / `accent` | **não** warning — é decorativo/gamificação, não caução (distinto do caso acima) |
| `#eff6ff`/`#1e40af`/`#bfdbfe` (badge de role, pills de permissão) | `info-subtle` / `info-ink` / `info` | **não** primary mesmo sendo azul — primary neste tema é verde-escuro |
| gradiente `#1e40af`→`#6366f1` (avatar/ícone de role) | `<Avatar>` (perfil) / `bg-gradient-to-br from-primary to-accent` (ícone de role em Permissões, sem primitivo exacto) | |

---

### Task 1: `components/settings/styles.ts`

- [x] Remove `btnPrimary`, `btnGhost`, `inputStyle`, `labelStyle`, `card`,
      `TAB_STYLE` — todos substituídos por componentes/classe nas tasks
      seguintes.
- [x] Mantém `NAV` inalterado (não tem cor, só metadata das tabs).
- [x] Se o ficheiro ficar reduzido a só `NAV`, está bem — não elimines o
      ficheiro, só encolhe-o.

### Task 2: `components/settings/Toast.tsx`

- [x] Elimina o ficheiro por completo. É substituído pelo `useToast()`
      global de `providers/ToastProvider` (já montado em `app/layout.tsx`,
      já usado em `styleguide` e `work-declaration` — segue o mesmo padrão
      dessas páginas).
- [x] Remove qualquer import deste ficheiro nos restantes ficheiros do
      módulo (ver Task 6).

### Task 3: `components/settings/TabSeguranca.tsx`

- [x] Substitui o array `strColor = ['', '#dc2626', '#f59e0b', '#1e40af', '#16a34a']`
      por classes Tailwind condicionais indexadas (`text-danger`,
      `text-warning`, `text-primary`, `text-success`) — mesma lógica
      ordinal 1-4, só a fonte da cor muda.
- [x] Ícone mostrar/ocultar password: `#94a3b8` → `text-ink-faint`.
- [x] Input de confirmação de password: troca a lógica manual de
      `borderColor` por `<Input invalid={mismatch}>` (o componente já trata
      o estado inválido internamente).
- [x] Mensagem de mismatch: `#dc2626` → `text-danger`.
- [x] Substitui os `<input>`/`<label>` manuais por `<FormField label="...">`
      envolvendo `<Input>`.
- [x] Botão de submit: troca `btnPrimary` + `opacity: saving ? 0.7 : 1`
      manuais por `<Button intent="primary" loading={saving}>`.
- [x] Painel de dicas de segurança: estado `ok` (`#ecfdf5`/`#bbf7d0`/`#16a34a`)
      → `bg-success-subtle border-success text-success-ink`; estado
      default (`#f8fafc`/`#e2e8f0`/`#64748b`) → `bg-surface-sunken
      border-border text-ink-muted`.
- [x] Caixa de aviso de expiração de token: `#fffbeb`/`#fde68a`/`#92400e`
      → `bg-warning-subtle border-warning text-warning-ink` (é um aviso de
      caução genuíno — mantém-se warning, ao contrário do painel de badges
      em `TabPerfil`).
- [x] Substitui a chamada `onToast(msg, 'success'|'error')` por
      `useToast()({ title: msg, intent: 'success'|'danger' })`.

### Task 4: `components/settings/TabPerfil.tsx`

- [x] Avatar em gradiente hardcoded (`linear-gradient(135deg, #1e40af, #6366f1)`)
      → `<Avatar name={user.fullName} size="lg" />`.
- [x] Badge de role (`#eff6ff`/`#1e40af`) → `<Badge intent="info">`.
- [x] Badge activo/inactivo (`#ecfdf5`/`#16a34a` vs `#fef2f2`/`#dc2626`) →
      `<Badge intent="success">`/`<Badge intent="danger">`.
- [x] Display de pontos (`#f59e0b`) → `accent` (`text-accent`,
      painel/ícone em `bg-accent-subtle`) — é gamificação/conquista, não
      aviso.
- [x] Tabela de info organizacional: `text-ink` / `text-ink-muted` /
      `border-border` simples.
- [x] Painel "badges recentes" (`#fffbeb`/`#fde68a`) → `bg-accent-subtle
      border-accent` — mesmo raciocínio que os pontos: painel decorativo de
      conquista, não um aviso (contrasta com a caixa de expiração de token
      em `TabSeguranca`, que É um aviso real).
- [x] Troca cards manuais (`style={card}`) por `<Card><CardBody>...</CardBody></Card>`.

### Task 5: `components/settings/TabPermissoes.tsx`

- [x] Ícone de role em gradiente (`#1e40af`→`#6366f1`, mesmo padrão do
      avatar em `TabPerfil`): não há primitivo `Avatar` exacto para um
      ícone (não é uma foto/iniciais de pessoa) — usa
      `bg-gradient-to-br from-primary to-accent` tokenizado directamente
      no lugar do gradiente hardcoded.
- [x] Pills de permissão (`#eff6ff`/`#1e40af`/`#bfdbfe`) → `<Badge intent="info">`
      (é uma tag informativa, não a cor `primary` do tema apesar de
      visualmente azul — `primary` aqui é verde-escuro).
- [x] Troca cards manuais por `<Card><CardBody>`.
- [x] Texto de nome de role/contagem de permissões: `text-ink`/`text-ink-muted`.

### Task 6: `app/(platform)/settings/page.tsx`

- [x] Remove o import de `components/settings/Toast.tsx` e todo o estado
      local `toast`/`setToast`/`showToast` — substitui por
      `const toast = useToast();` de `@/providers/ToastProvider`, chamado
      como `toast({ title, intent })` nos pontos onde antes se chamava
      `showToast(...)`. Passa esta mesma função (ou wrapper equivalente)
      às tabs em vez da prop `onToast` local, se essa prop mudar de
      assinatura — confirma as assinaturas usadas nas 3 tabs migradas nas
      Tasks 3-5 e ajusta a prop passada para bater certo.
- [x] Texto de loading: `#94a3b8` → `text-ink-faint`.
- [x] Bloco de erro: `#fef2f2`/`#fecaca`/`#dc2626` →
      `bg-danger-subtle border-danger text-danger-ink`.
- [x] Header: `h1` `#1e293b` → `text-ink`; subtítulo `#64748b` →
      `text-ink-muted`.
- [x] Botão de logout: troca `btnGhost` com override manual de
      `#dc2626`/`#fef2f2` por
      `<Button intent="ghost" className="text-danger hover:bg-danger-subtle">`
      (confirmado seguro: `cn()`/tailwind-merge em `lib/cn.ts` resolve
      correctamente classes conflituantes, a classe passada por último
      ganha).
- [x] Tab switcher manual (`NAV.map` + `TAB_STYLE`, wrapper `#f1f5f9`) →
      substitui por completo por `<Tabs><TabsList><TabsTrigger>...
      <TabsContent>` de `components/ui/Tabs.tsx`. Nota: isto muda o
      visual de "pills activo/inactivo" para "tab sublinhada activa" —
      é uma mudança visual aceite, consistente com o padrão já usado nas
      migrações anteriores (consolidar no primitivo partilhado tal como
      está, não recriar o visual antigo em cima dele). Os dados de `NAV`
      (label/ícone/chave de cada tab) continuam a vir de `styles.ts`.

### Task 7: Verificação final

- [x] `npx tsc --noEmit` — zero erros.
- [x] `grep -rn "#[0-9a-fA-F]\{3,6\}" components/settings app/\(platform\)/settings`
      — zero resultados (fora de comentários/docs).
- [x] `npm run build` — build limpo, rota `/settings` presente.
- [x] `npm test` — todos os testes continuam a passar (baseline: 4
      ficheiros / 43 testes na `main`; confirma que este número não desceu).
- [x] Abre PR contra `main`, espera o check `quality` (CI) ficar verde,
      squash-merge. (PR #245, merged 2026-08-15T21:34:29Z)
