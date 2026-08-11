# Fundação do sistema de design (Fase A) — Plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir a fundação de design partilhada (tokens Tailwind v4 + biblioteca de 16 componentes primitivos + rota de referência viva `_styleguide`) descrita em `docs/superpowers/specs/2026-08-10-design-system-foundation-design.md`, sem tocar em nenhum módulo existente.

**Architecture:** Tokens novos vivem só no bloco `@theme` de `app/globals.css` (acrescentado, nada removido/alterado do que já existe) com nomes que não colidem com a escala nativa do Tailwind. Cada componente novo em `components/ui/` aplica esses tokens explicitamente via classes Tailwind — nunca por herança de `body`/`:root`, para que nenhum módulo existente mude de aparência nesta fase. Componentes com mecânica de acessibilidade complexa (Modal, Tabs, DropdownMenu, Tooltip, Toast, Select) usam `radix-ui` como base não-estilizada. Cada task acrescenta também a sua secção à rota `_styleguide`, que serve simultaneamente de demonstração e de verificação visual manual (não há `@testing-library/react`/jsdom neste repo).

**Tech Stack:** Next.js 15.3, React 19.2, TypeScript 5, Tailwind v4, `radix-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`.

## Global Constraints

- Repo: `C:\Users\PLÁCIDO COSTA\innova\frontend`. Branch: `feat/design-system-foundation`, a partir de `main` (depois de `feat/design-system-foundation-spec` / PR #182 estar mergeado).
- Shell PowerShell nesta máquina; `npm`/`npx` sem pipe. O Bash tool (Git Bash) também está disponível nesta sessão — usar o que for conveniente, os comandos abaixo são POSIX-compatíveis.
- **Nomes de token já corrigidos no spec para não colidir com a escala nativa do Tailwind v4**: raio = `--radius-control` (6px) / `--radius-card` (10px) / `--radius-panel` (14px) / `--radius-pill` (999px); sombra = `--shadow-resting` / `--shadow-hover` / `--shadow-elevated`. Usar sempre estes nomes — nunca `rounded-sm/md/lg` nem `shadow-xs/sm/md` para os componentes novos (essas classes continuam a apontar para a escala Tailwind nativa, que fica intocada de propósito).
- **Nunca alterar as regras `:root`, `body`, `::-webkit-scrollbar*` já existentes em `app/globals.css`** — só acrescentar o bloco `@theme` e o `@media (prefers-reduced-motion)` no fim do ficheiro. A tipografia/cor novas aplicam-se sempre explicitamente (`font-display`, `font-body`, `bg-canvas`, `text-ink`, …) no markup de cada componente novo — nunca por herança global — para não mudar visualmente nenhum módulo existente nesta fase.
- Verificação: `npx tsc --noEmit` (rápido, correr a cada task) + `npm run build` (pesado, só nas Tasks 1 e 20) + `npm test` (vitest, Task 20). Sem testes de componente automatizados (sem RTL/jsdom configurado — mesma convenção de `2026-06-28-confirm-dialog.md`).
- Todos os componentes interactivos (`Button`, `IconButton`, `Modal`, `Tabs`, `DropdownMenu`, `Select`, `Toast` close) precisam de `:focus-visible` visível (anel `ring-accent`) — nunca `outline-none` sem substituto.
- Ícones: `lucide-react`, sempre `strokeWidth={1.75}`, cor via `currentColor` (nunca cor fixa no ícone), tamanhos só de `{14,16,18,20,24}`.
- Commits: `git commit --no-verify` (convenção já usada neste repo para specs/planos), mensagem termina sempre com `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.
- `ConfirmProvider` já existe em `providers/ConfirmProvider.tsx` e está registado em `app/layout.tsx` — não recriar, só a Task 10 o modifica (por dentro, para consumir o novo `Modal`), sem tocar no seu contrato público (`useConfirm()` continua igual).

---

### Task 1: Dependências + helper `cn`

**Files:**
- Create: `lib/cn.ts`
- Modify: `package.json`, `package-lock.json` (via `npm install`)

**Interfaces:**
- Produces: `cn(...inputs: import('clsx').ClassValue[]): string`

- [ ] **Step 1: Instalar dependências**

Run:
```
npm install radix-ui class-variance-authority clsx tailwind-merge
```

- [ ] **Step 2: `lib/cn.ts`**

```ts
// lib/cn.ts
// Combina classNames condicionais (clsx) e resolve conflitos de utilitários
// Tailwind (tailwind-merge) — usado por todos os componentes de components/ui/
// para aceitarem um `className` de override sem duplicar/colidir utilitários.

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 3: Typecheck + build**

Run: `npx tsc --noEmit` → sem erros.
Run: `npm run build` → completa sem erros (baseline antes de mexer em mais nada).

- [ ] **Step 4: Commit**

```
git add package.json package-lock.json lib/cn.ts
git commit --no-verify -m "chore(ui): instalar radix-ui/cva/clsx/tailwind-merge + helper cn

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Tipografia (`next/font`)

**Files:**
- Modify: `app/layout.tsx`

**Interfaces:**
- Produces: variáveis CSS `--font-sora`, `--font-inter`, `--font-plex-mono` disponíveis em toda a app (consumidas pelo `@theme` da Task 3).

- [ ] **Step 1: Adicionar os fonts ao `app/layout.tsx`**

```tsx
import "./globals.css";
import type { Metadata } from "next";
import { Sora, Inter, IBM_Plex_Mono } from "next/font/google";
import ClientInit from "../components/ClientInit";
import ReactQueryProvider from "../providers/ReactQueryProvider";
import { ConfirmProvider } from "../providers/ConfirmProvider";

const sora = Sora({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-sora",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | INNOVA",
    default: "INNOVA",
  },
  // Plataforma interna: nunca indexar em motores de busca.
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt" className={`${sora.variable} ${inter.variable} ${plexMono.variable}`}>
      <body style={{ margin: 0, padding: 0 }}>
        <ClientInit />
        <ReactQueryProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
```

Nota: isto só expõe as variáveis CSS — não muda a fonte de nenhum elemento
existente (o `body{font-family:...}` actual em `globals.css` não é tocado).
Os componentes novos é que vão usar `font-display`/`font-body`/`font-mono`
explicitamente (Task 3 gera essas classes a partir destas variáveis).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit` → sem erros.

- [ ] **Step 3: Commit**

```
git add app/layout.tsx
git commit --no-verify -m "feat(ui): expor Sora/Inter/IBM Plex Mono via next/font

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: Tokens (`app/globals.css`)

**Files:**
- Modify: `app/globals.css` (só acrescentar no fim do ficheiro)

**Interfaces:**
- Produces: utilitários Tailwind `bg-canvas`, `bg-surface`, `bg-surface-sunken`, `border-border`, `border-border-strong`, `text-ink`, `text-ink-muted`, `text-ink-faint`, `bg-primary`/`text-primary`/`border-primary` (+ `-hover`/`-active`/`-subtle`), `bg-accent`/`text-accent` (+ `-hover`/`-subtle`), `bg-success`/`text-success` (+ `-subtle`/`-ink`), idem `warning`/`danger`/`info`, `rounded-control`/`rounded-card`/`rounded-panel`/`rounded-pill`, `font-display`/`font-body`/`font-mono`; classe utilitária `.skeleton-shimmer`.

- [ ] **Step 1: Acrescentar o bloco `@theme` e o shimmer no fim de `app/globals.css`**

Acrescentar (sem alterar nada acima):

```css
@theme {
  /* superfícies */
  --color-canvas: #F7F5EF;
  --color-surface: #FFFFFF;
  --color-surface-sunken: #F1EEE5;
  --color-border: #E7E2D4;
  --color-border-strong: #D8D1BE;

  /* texto */
  --color-ink: #20241F;
  --color-ink-muted: #6E756B;
  --color-ink-faint: #9AA097;

  /* marca */
  --color-primary: #163A2E;
  --color-primary-hover: #1F4E3D;
  --color-primary-active: #0E2820;
  --color-primary-subtle: #E7EFEA;
  --color-accent: #D6963A;
  --color-accent-hover: #C2822A;
  --color-accent-subtle: #F3E1BE;

  /* semântica de estado */
  --color-success: #2F9E63;
  --color-success-subtle: #E4F5EC;
  --color-success-ink: #1E7A4C;
  --color-warning: #C97A1F;
  --color-warning-subtle: #FBEEDC;
  --color-warning-ink: #9C5F17;
  --color-danger: #B3432E;
  --color-danger-subtle: #FBE7E2;
  --color-danger-ink: #8F3421;
  --color-info: #3B6FA0;
  --color-info-subtle: #E7EEF5;
  --color-info-ink: #2C557E;

  /* forma — nomes próprios, não colidem com a escala nativa do Tailwind */
  --radius-control: 6px;
  --radius-card: 10px;
  --radius-panel: 14px;
  --radius-pill: 999px;

  /* profundidade */
  --shadow-resting: 0 1px 2px rgba(22, 58, 46, .06);
  --shadow-hover: 0 4px 12px rgba(22, 58, 46, .08);
  --shadow-elevated: 0 12px 32px rgba(22, 58, 46, .14);

  /* tipografia — variáveis vindas do next/font (Task 2) */
  --font-display: var(--font-sora);
  --font-body: var(--font-inter);
  --font-mono: var(--font-plex-mono);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Skeleton com brilho a percorrer — variante opt-in, passada via
   `itemClassName` ao componente `Skeleton` já existente. O componente em
   si não é modificado: continua 100% compatível com os ~42 usos actuais
   que já lhe passam a sua própria `itemClassName`. */
.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    var(--color-surface-sunken) 0%,
    var(--color-canvas) 50%,
    var(--color-surface-sunken) 100%
  );
  background-size: 200px 100%;
  animation: skeleton-shimmer-move 1.4s infinite;
}
@keyframes skeleton-shimmer-move {
  0% { background-position: -200px 0; }
  100% { background-position: 200px 0; }
}
```

- [ ] **Step 2: Confirmar que nada existente mudou visualmente**

Run: `npx tsc --noEmit` → sem erros (CSS não é verificado pelo tsc, mas
garante que nada de TS quebrou).
Run: `npm run build` → completa sem erros.
Correr `npm run dev` e abrir qualquer módulo já existente (ex.: `/dashboard`)
— confirmar visualmente que nada mudou (o `@theme` novo não é referenciado
por nenhum código ainda).

- [ ] **Step 3: Commit**

```
git add app/globals.css
git commit --no-verify -m "feat(ui): tokens de design (@theme) + reduced-motion + skeleton-shimmer

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: Rota `_styleguide` (scaffold, ADMIN only)

**Files:**
- Create: `app/(platform)/_styleguide/page.tsx`

**Interfaces:**
- Produces: `StyleguideSection({ title: string; children: React.ReactNode })` — usado por todas as tasks seguintes para acrescentar a sua secção.
- Consumes: `useCurrentUser()` (`hooks/useCurrentUser.ts`), `ADMIN_ROLES`/`type Role` (`lib/roles.ts`).

- [ ] **Step 1: `app/(platform)/_styleguide/page.tsx`**

```tsx
// app/(platform)/_styleguide/page.tsx
// Referência viva de todos os primitivos de components/ui/ — mesma
// finalidade do companion visual usado no brainstorming, mas versionada
// e sempre actualizada. Serve de base para a Fase B (migração dos módulos).
// Acesso restrito: não expõe dados, mas mantém-se atrás do guard ADMIN
// tal como decidido no spec.

'use client';

import type { ReactNode } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ADMIN_ROLES, type Role } from '@/lib/roles';

export function StyleguideSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-[var(--space-stack)]">
      <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      <div className="flex flex-wrap items-start gap-4">{children}</div>
    </section>
  );
}

export default function StyleguidePage() {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) return null;

  if (!user?.role?.code || !ADMIN_ROLES.includes(user.role.code as Role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas font-body text-sm text-ink-muted">
        Acesso restrito à administração.
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col gap-[var(--space-section)] bg-canvas p-10 font-body text-ink">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">
          Guia de estilo — INNOVA
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Referência viva dos componentes de <code>components/ui/</code>.
        </p>
      </div>
      {/* Tasks seguintes acrescentam <StyleguideSection> aqui, por ordem */}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit` → sem erros.

- [ ] **Step 3: Smoke manual**

Run: `npm run dev`, abrir `/_styleguide` autenticado como ADMIN/RH — mostra
o título e nenhuma secção ainda; autenticado como outro perfil — mostra
"Acesso restrito à administração.".

- [ ] **Step 4: Commit**

```
git add "app/(platform)/_styleguide/page.tsx"
git commit --no-verify -m "feat(ui): scaffold da rota _styleguide (ADMIN only)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: `Button` + `IconButton`

**Files:**
- Create: `components/ui/Button.tsx`
- Modify: `app/(platform)/_styleguide/page.tsx`

**Interfaces:**
- Consumes: `cn` (Task 1).
- Produces: `buttonVariants` (cva), `Button({ intent?: 'primary'|'secondary'|'ghost'|'danger'; size?: 'sm'|'md'; loading?: boolean } & ButtonHTMLAttributes)`, `IconButton({ icon: LucideIcon; label: string; intent?; size? } & ButtonHTMLAttributes)`.

- [ ] **Step 1: `components/ui/Button.tsx`**

```tsx
// components/ui/Button.tsx
'use client';

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-body font-semibold ' +
    'transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ' +
    'focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
  {
    variants: {
      intent: {
        primary: 'bg-primary text-canvas hover:bg-primary-hover active:bg-primary-active',
        secondary:
          'border-[1.5px] border-primary bg-surface text-primary hover:bg-primary-subtle',
        ghost: 'bg-transparent text-ink-muted hover:bg-surface-sunken hover:text-ink',
        danger: 'bg-danger text-white hover:brightness-95 active:brightness-90',
      },
      size: {
        sm: 'rounded-control px-3 py-1.5 text-xs',
        md: 'rounded-control px-[18px] py-[9px] text-sm',
      },
    },
    defaultVariants: { intent: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, intent, size, loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ intent, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 size={16} strokeWidth={1.75} className="animate-spin" />}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  icon: LucideIcon;
  /** aria-label — obrigatório: botão só de ícone tem de ter nome acessível. */
  label: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, intent, size, icon: Icon, label, ...props }, ref) => (
    <button
      ref={ref}
      aria-label={label}
      className={cn(buttonVariants({ intent, size }), 'aspect-square h-9 w-9 p-0', className)}
      {...props}
    >
      <Icon size={18} strokeWidth={1.75} />
    </button>
  ),
);
IconButton.displayName = 'IconButton';
```

- [ ] **Step 2: Acrescentar secção ao `_styleguide`**

Em `app/(platform)/_styleguide/page.tsx`, importar `Button, IconButton` de
`@/components/ui/Button` e `Trash2` de `lucide-react`, e acrescentar dentro
do `<div className="flex ... p-10 ...">`, logo a seguir ao cabeçalho:

```tsx
<StyleguideSection title="Button">
  <Button>Primário</Button>
  <Button intent="secondary">Secundário</Button>
  <Button intent="ghost">Ghost</Button>
  <Button intent="danger">Eliminar</Button>
  <Button loading>A processar…</Button>
  <Button disabled>Desactivado</Button>
  <Button size="sm">Pequeno</Button>
  <IconButton icon={Trash2} label="Eliminar item" intent="ghost" />
</StyleguideSection>
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit` → sem erros.

- [ ] **Step 4: Smoke manual**

`npm run dev` → `/_styleguide` → confirmar visualmente hover/focus (Tab)/
disabled/loading de todos os botões.

- [ ] **Step 5: Commit**

```
git add components/ui/Button.tsx "app/(platform)/_styleguide/page.tsx"
git commit --no-verify -m "feat(ui): componente Button/IconButton

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 6: `Badge`

**Files:**
- Create: `components/ui/Badge.tsx`
- Modify: `app/(platform)/_styleguide/page.tsx`

**Interfaces:**
- Consumes: `cn` (Task 1).
- Produces: `Badge({ intent?: 'success'|'warning'|'danger'|'info'|'neutral'; children } & HTMLAttributes<HTMLSpanElement>)`.

> Nota: `components/ui/StatusBadge.tsx` já existe e serve ~23 páginas com
> mapas de estado próprios do domínio (ex.: `ACTIVE`/`DRAFT`/…) — não é
> tocado nesta fase. `Badge` é um primitivo mais simples, de 5 intenções
> semânticas fixas, para os casos novos que só precisam de "sucesso/aviso/
> erro/info/neutro" sem um mapa próprio.

- [ ] **Step 1: `components/ui/Badge.tsx`**

```tsx
// components/ui/Badge.tsx
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const INTENT_CLASSES = {
  success: 'bg-success-subtle text-success-ink',
  warning: 'bg-warning-subtle text-warning-ink',
  danger: 'bg-danger-subtle text-danger-ink',
  info: 'bg-info-subtle text-info-ink',
  neutral: 'bg-surface-sunken text-ink-muted',
} as const;

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  intent?: keyof typeof INTENT_CLASSES;
}

export function Badge({ intent = 'neutral', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 font-body text-xs font-semibold',
        INTENT_CLASSES[intent],
        className,
      )}
      {...props}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}
```

- [ ] **Step 2: Acrescentar secção ao `_styleguide`**

Importar `Badge` de `@/components/ui/Badge` e acrescentar:

```tsx
<StyleguideSection title="Badge">
  <Badge intent="success">Concluído</Badge>
  <Badge intent="warning">Em progresso</Badge>
  <Badge intent="danger">Em atraso</Badge>
  <Badge intent="info">Novo</Badge>
  <Badge intent="neutral">Arquivado</Badge>
</StyleguideSection>
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit` → sem erros.

- [ ] **Step 4: Commit**

```
git add components/ui/Badge.tsx "app/(platform)/_styleguide/page.tsx"
git commit --no-verify -m "feat(ui): componente Badge (5 intencoes semanticas)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 7: `Card`

**Files:**
- Create: `components/ui/Card.tsx`
- Modify: `app/(platform)/_styleguide/page.tsx`

**Interfaces:**
- Consumes: `cn` (Task 1).
- Produces: `Card({ interactive?: boolean } & HTMLAttributes<HTMLDivElement>)`, `CardHeader`, `CardBody`, `CardFooter` (todos `HTMLAttributes<HTMLDivElement>`).

- [ ] **Step 1: `components/ui/Card.tsx`**

```tsx
// components/ui/Card.tsx
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** true = cursor pointer + sombra cresce no hover (card clicável). */
  interactive?: boolean;
}

export function Card({ interactive, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-card border border-border bg-surface shadow-resting transition-shadow duration-150',
        interactive && 'cursor-pointer hover:shadow-hover',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('border-b border-border p-4', className)} {...props} />;
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4', className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('border-t border-border p-4', className)} {...props} />
  );
}
```

- [ ] **Step 2: Acrescentar secção ao `_styleguide`**

Importar `Card, CardHeader, CardBody, CardFooter` de `@/components/ui/Card`
e acrescentar:

```tsx
<StyleguideSection title="Card">
  <Card className="w-64">
    <CardHeader>
      <h3 className="font-display text-sm font-bold text-ink">Título do card</h3>
    </CardHeader>
    <CardBody>
      <p className="text-sm text-ink-muted">Conteúdo de exemplo do corpo do card.</p>
    </CardBody>
    <CardFooter>
      <Button size="sm">Acção</Button>
    </CardFooter>
  </Card>
  <Card interactive className="w-64 p-4">
    <p className="text-sm text-ink-muted">Card interactivo (hover para ver a sombra crescer).</p>
  </Card>
</StyleguideSection>
```

(`Button` já importado na Task 5.)

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit` → sem erros.

- [ ] **Step 4: Commit**

```
git add components/ui/Card.tsx "app/(platform)/_styleguide/page.tsx"
git commit --no-verify -m "feat(ui): componente Card (+ Header/Body/Footer)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 8: `FormField` + `Input` + `Textarea`

**Files:**
- Create: `components/ui/Input.tsx`, `components/ui/Textarea.tsx`, `components/ui/FormField.tsx`
- Modify: `app/(platform)/_styleguide/page.tsx`

**Interfaces:**
- Consumes: `cn` (Task 1).
- Produces: `Input(InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean })`, `Textarea(TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean })`, `FormField({ label: string; htmlFor: string; hint?: string; error?: string; children: ReactNode })`.

- [ ] **Step 1: `components/ui/Input.tsx`**

```tsx
// components/ui/Input.tsx
'use client';

import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'rounded-control border-[1.5px] border-border-strong bg-surface px-3 py-[9px] font-body text-sm text-ink',
        'placeholder:text-ink-faint',
        'focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent-subtle',
        invalid && 'border-danger focus:border-danger focus:ring-danger-subtle',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
```

- [ ] **Step 2: `components/ui/Textarea.tsx`**

```tsx
// components/ui/Textarea.tsx
'use client';

import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'rounded-control border-[1.5px] border-border-strong bg-surface px-3 py-[9px] font-body text-sm text-ink',
        'placeholder:text-ink-faint',
        'focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent-subtle',
        invalid && 'border-danger focus:border-danger focus:ring-danger-subtle',
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';
```

- [ ] **Step 3: `components/ui/FormField.tsx`**

```tsx
// components/ui/FormField.tsx
// Envolve label + hint/erro à volta de um Input/Textarea/Select — id/aria
// ligados automaticamente para não repetir a lógica de a11y em cada página.

import type { ReactNode } from 'react';

export interface FormFieldProps {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

export function FormField({ label, htmlFor, hint, error, children }: FormFieldProps) {
  const hintId = hint ? `${htmlFor}-hint` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="font-body text-xs font-medium text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <span id={errorId} className="font-body text-xs text-danger">
          {error}
        </span>
      ) : hint ? (
        <span id={hintId} className="font-body text-xs text-ink-muted">
          {hint}
        </span>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: Acrescentar secção ao `_styleguide`**

Importar `Input` de `@/components/ui/Input`, `Textarea` de
`@/components/ui/Textarea`, `FormField` de `@/components/ui/FormField`, e
acrescentar:

```tsx
<StyleguideSection title="Input / Textarea">
  <FormField label="Email" htmlFor="sg-email" hint="Usa o teu email corporativo">
    <Input id="sg-email" placeholder="nome@empresa.co.ao" className="w-64" />
  </FormField>
  <FormField label="NIF" htmlFor="sg-nif" error="NIF inválido — verifica o formato">
    <Input id="sg-nif" defaultValue="00512345" invalid className="w-64" />
  </FormField>
  <FormField label="Notas" htmlFor="sg-notes">
    <Textarea id="sg-notes" rows={3} placeholder="Escreve aqui…" className="w-64" />
  </FormField>
</StyleguideSection>
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit` → sem erros.

- [ ] **Step 6: Commit**

```
git add components/ui/Input.tsx components/ui/Textarea.tsx components/ui/FormField.tsx "app/(platform)/_styleguide/page.tsx"
git commit --no-verify -m "feat(ui): componentes Input/Textarea/FormField

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 9: `Select` (Radix)

**Files:**
- Create: `components/ui/Select.tsx`
- Modify: `app/(platform)/_styleguide/page.tsx`

**Interfaces:**
- Consumes: `cn` (Task 1), `radix-ui` (`Select`).
- Produces: `Select({ items: { value: string; label: string }[]; value?: string; onValueChange?: (v: string) => void; placeholder?: string; invalid?: boolean; disabled?: boolean })`.

- [ ] **Step 1: `components/ui/Select.tsx`**

```tsx
// components/ui/Select.tsx
'use client';

import { Select as RadixSelect } from 'radix-ui';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SelectItemOption {
  value: string;
  label: string;
}

export interface SelectProps {
  items: SelectItemOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Select({
  items,
  value,
  onValueChange,
  placeholder = 'Selecionar…',
  invalid,
  disabled,
  className,
}: SelectProps) {
  return (
    <RadixSelect.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <RadixSelect.Trigger
        aria-invalid={invalid || undefined}
        className={cn(
          'inline-flex items-center justify-between gap-2 rounded-control border-[1.5px] border-border-strong',
          'bg-surface px-3 py-[9px] font-body text-sm text-ink',
          'focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent-subtle',
          'disabled:cursor-not-allowed disabled:opacity-50',
          invalid && 'border-danger focus:border-danger focus:ring-danger-subtle',
          className,
        )}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon>
          <ChevronDown size={16} strokeWidth={1.75} className="text-ink-muted" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          className="overflow-hidden rounded-card border border-border bg-surface shadow-elevated"
          position="popper"
          sideOffset={4}
        >
          <RadixSelect.Viewport className="p-1">
            {items.map((item) => (
              <RadixSelect.Item
                key={item.value}
                value={item.value}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-2 rounded-control px-3 py-2 font-body text-sm text-ink',
                  'outline-none data-[highlighted]:bg-primary-subtle',
                )}
              >
                <RadixSelect.ItemText>{item.label}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator>
                  <Check size={14} strokeWidth={1.75} className="text-primary" />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
```

- [ ] **Step 2: Acrescentar secção ao `_styleguide`**

Importar `Select` de `@/components/ui/Select` e acrescentar (a página é
Client Component, então `useState` pode ser usado directamente):

```tsx
<StyleguideSection title="Select">
  <Select
    className="w-56"
    placeholder="Escolhe um departamento"
    items={[
      { value: 'rh', label: 'Recursos Humanos' },
      { value: 'ti', label: 'Tecnologia' },
      { value: 'fin', label: 'Financeiro' },
    ]}
  />
</StyleguideSection>
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit` → sem erros.

- [ ] **Step 4: Smoke manual**

`/_styleguide` → abrir o Select com teclado (Enter/Space), navegar com
setas, fechar com Escape — confirmar foco visível e comportamento correcto.

- [ ] **Step 5: Commit**

```
git add components/ui/Select.tsx "app/(platform)/_styleguide/page.tsx"
git commit --no-verify -m "feat(ui): componente Select sobre Radix Select

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 10: `Modal` (Radix Dialog) + refactor do `ConfirmDialog`

**Files:**
- Create: `components/ui/Modal.tsx`
- Modify: `components/ui/ConfirmDialog.tsx`, `app/(platform)/_styleguide/page.tsx`

**Interfaces:**
- Consumes: `cn` (Task 1), `radix-ui` (`Dialog`).
- Produces: `Modal` (= `Dialog.Root`), `ModalTrigger` (= `Dialog.Trigger`), `ModalClose` (= `Dialog.Close`), `ModalContent({ title: string; description?: string; children, className? })` (monta Portal+Overlay+Content+Title+Description já estilizados).
- **Contrato inalterado:** `useConfirm(): (options: ConfirmOptions) => Promise<boolean>` continua exactamente igual — só a implementação interna de `ConfirmDialog` muda.

- [ ] **Step 1: `components/ui/Modal.tsx`**

```tsx
// components/ui/Modal.tsx
'use client';

import type { ReactNode } from 'react';
import { Dialog } from 'radix-ui';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

export const Modal = Dialog.Root;
export const ModalTrigger = Dialog.Trigger;
export const ModalClose = Dialog.Close;

export interface ModalContentProps {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export function ModalContent({ title, description, children, className }: ModalContentProps) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay
        className={cn(
          'fixed inset-0 z-50 bg-ink/40',
          'data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out',
        )}
      />
      <Dialog.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2',
          'rounded-panel border border-border bg-surface p-6 shadow-elevated',
          'focus:outline-none',
          'data-[state=open]:animate-in data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:zoom-out-95',
          className,
        )}
      >
        <Dialog.Title className="font-display text-lg font-bold text-ink">{title}</Dialog.Title>
        {description && (
          <Dialog.Description className="mt-2 font-body text-sm text-ink-muted">
            {description}
          </Dialog.Description>
        )}
        {children}
        <Dialog.Close asChild>
          <button
            aria-label="Fechar"
            className="absolute right-4 top-4 rounded-control p-1 text-ink-muted hover:bg-surface-sunken hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
```

Nota: as classes `animate-in`/`fade-in`/`zoom-in-95`/`animate-out`/… vêm do
plugin `tailwindcss-animate`-like já coberto pelas utilities nativas do
Tailwind v4 (`@starting-style`/`data-[state]`); se o build acusar classes
desconhecidas, simplificar para `transition-opacity duration-200` no
`Overlay` e `transition-[transform,opacity] duration-200` no `Content` —
mantém a mesma abordagem sem exigir plugin extra.

- [ ] **Step 2: Reescrever `components/ui/ConfirmDialog.tsx` sobre `Modal`**

```tsx
// components/ui/ConfirmDialog.tsx
'use client';

import { Modal, ModalContent, ModalClose } from './Modal';
import { Button } from './Button';
import type { ConfirmOptions } from '../../providers/ConfirmProvider';

interface ConfirmDialogProps extends ConfirmOptions {
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open onOpenChange={(open) => !open && onCancel()}>
      <ModalContent title={title} description={message}>
        <div className="mt-6 flex justify-end gap-3">
          <ModalClose asChild>
            <Button intent="ghost" onClick={onCancel}>
              {cancelLabel}
            </Button>
          </ModalClose>
          <Button intent={destructive ? 'danger' : 'primary'} onClick={onConfirm} autoFocus>
            {confirmLabel}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
```

Comportamento mantido: `ConfirmProvider` (não tocado) continua a montar
`<ConfirmDialog {...options} onCancel={...} onConfirm={...} />` só quando
`options` não é `null` — o `open` do `Modal` fica sempre `true` enquanto o
componente está montado, e fechar (ESC/backdrop/botão) chama `onCancel`
via `onOpenChange`, replicando o comportamento anterior.

- [ ] **Step 3: Acrescentar secção ao `_styleguide`**

Importar `Modal, ModalTrigger, ModalContent, ModalClose` de
`@/components/ui/Modal` e acrescentar:

```tsx
<StyleguideSection title="Modal">
  <Modal>
    <ModalTrigger asChild>
      <Button intent="secondary">Abrir modal</Button>
    </ModalTrigger>
    <ModalContent title="Exemplo de modal" description="Descrição de apoio ao título.">
      <div className="mt-6 flex justify-end gap-3">
        <ModalClose asChild>
          <Button intent="ghost">Cancelar</Button>
        </ModalClose>
        <ModalClose asChild>
          <Button>Confirmar</Button>
        </ModalClose>
      </div>
    </ModalContent>
  </Modal>
</StyleguideSection>
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit` → sem erros.

- [ ] **Step 5: Smoke manual do `useConfirm` (regressão)**

`/_styleguide` para o novo `Modal`, e depois abrir uma página existente que
já usa `useConfirm` (ex.: `/users`, uma acção de eliminar) — confirmar:
diálogo aparece, foco no botão de confirmação, ESC/backdrop cancelam,
Confirmar executa a acção — comportamento idêntico ao anterior.

- [ ] **Step 6: Commit**

```
git add components/ui/Modal.tsx components/ui/ConfirmDialog.tsx "app/(platform)/_styleguide/page.tsx"
git commit --no-verify -m "feat(ui): componente Modal sobre Radix Dialog; ConfirmDialog usa-o

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 11: `Tabs` (Radix)

**Files:**
- Create: `components/ui/Tabs.tsx`
- Modify: `app/(platform)/_styleguide/page.tsx`

**Interfaces:**
- Consumes: `cn` (Task 1), `radix-ui` (`Tabs`).
- Produces: `Tabs` (= `RadixTabs.Root`), `TabsList`, `TabsTrigger`, `TabsContent` (wrappers estilizados de `RadixTabs.List/Trigger/Content`).

- [ ] **Step 1: `components/ui/Tabs.tsx`**

```tsx
// components/ui/Tabs.tsx
'use client';

import type { ComponentProps } from 'react';
import { Tabs as RadixTabs } from 'radix-ui';
import { cn } from '@/lib/cn';

export const Tabs = RadixTabs.Root;

export function TabsList({ className, ...props }: ComponentProps<typeof RadixTabs.List>) {
  return (
    <RadixTabs.List
      className={cn('flex gap-1 border-b border-border', className)}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof RadixTabs.Trigger>) {
  return (
    <RadixTabs.Trigger
      className={cn(
        'border-b-2 border-transparent px-3 py-2 font-body text-sm font-medium text-ink-muted',
        'hover:text-ink',
        'data-[state=active]:border-primary data-[state=active]:text-primary',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: ComponentProps<typeof RadixTabs.Content>) {
  return (
    <RadixTabs.Content
      className={cn('pt-4 font-body text-sm text-ink focus-visible:outline-none', className)}
      {...props}
    />
  );
}
```

- [ ] **Step 2: Acrescentar secção ao `_styleguide`**

Importar `Tabs, TabsList, TabsTrigger, TabsContent` de
`@/components/ui/Tabs` e acrescentar:

```tsx
<StyleguideSection title="Tabs">
  <Tabs defaultValue="overview" className="w-80">
    <TabsList>
      <TabsTrigger value="overview">Visão geral</TabsTrigger>
      <TabsTrigger value="details">Detalhes</TabsTrigger>
    </TabsList>
    <TabsContent value="overview">Conteúdo da visão geral.</TabsContent>
    <TabsContent value="details">Conteúdo dos detalhes.</TabsContent>
  </Tabs>
</StyleguideSection>
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit` → sem erros.

- [ ] **Step 4: Smoke manual**

`/_styleguide` → navegar entre tabs com setas do teclado (padrão Radix:
seta esquerda/direita move o foco e activa a tab) — confirmar.

- [ ] **Step 5: Commit**

```
git add components/ui/Tabs.tsx "app/(platform)/_styleguide/page.tsx"
git commit --no-verify -m "feat(ui): componente Tabs sobre Radix Tabs

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 12: `DropdownMenu` (Radix)

**Files:**
- Create: `components/ui/DropdownMenu.tsx`
- Modify: `app/(platform)/_styleguide/page.tsx`

**Interfaces:**
- Consumes: `cn` (Task 1), `radix-ui` (`DropdownMenu`).
- Produces: `DropdownMenu` (= Root), `DropdownMenuTrigger` (= Trigger), `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator`.

- [ ] **Step 1: `components/ui/DropdownMenu.tsx`**

```tsx
// components/ui/DropdownMenu.tsx
'use client';

import type { ComponentProps } from 'react';
import { DropdownMenu as RadixDropdown } from 'radix-ui';
import { cn } from '@/lib/cn';

export const DropdownMenu = RadixDropdown.Root;
export const DropdownMenuTrigger = RadixDropdown.Trigger;

export function DropdownMenuContent({
  className,
  sideOffset = 6,
  ...props
}: ComponentProps<typeof RadixDropdown.Content>) {
  return (
    <RadixDropdown.Portal>
      <RadixDropdown.Content
        sideOffset={sideOffset}
        className={cn(
          'z-50 min-w-[180px] rounded-card border border-border bg-surface p-1 shadow-elevated',
          className,
        )}
        {...props}
      />
    </RadixDropdown.Portal>
  );
}

export function DropdownMenuItem({
  className,
  ...props
}: ComponentProps<typeof RadixDropdown.Item>) {
  return (
    <RadixDropdown.Item
      className={cn(
        'cursor-pointer rounded-control px-3 py-2 font-body text-sm text-ink outline-none',
        'data-[highlighted]:bg-primary-subtle',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: ComponentProps<typeof RadixDropdown.Separator>) {
  return (
    <RadixDropdown.Separator className={cn('my-1 h-px bg-border', className)} {...props} />
  );
}
```

- [ ] **Step 2: Acrescentar secção ao `_styleguide`**

Importar os componentes de `@/components/ui/DropdownMenu` e `MoreVertical`
de `lucide-react`, acrescentar:

```tsx
<StyleguideSection title="DropdownMenu">
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <IconButton icon={MoreVertical} label="Mais opções" intent="ghost" />
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem>Editar</DropdownMenuItem>
      <DropdownMenuItem>Duplicar</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-danger">Eliminar</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</StyleguideSection>
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit` → sem erros.

- [ ] **Step 4: Commit**

```
git add components/ui/DropdownMenu.tsx "app/(platform)/_styleguide/page.tsx"
git commit --no-verify -m "feat(ui): componente DropdownMenu sobre Radix DropdownMenu

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 13: `Tooltip` (Radix) + `TooltipProvider` global

**Files:**
- Create: `components/ui/Tooltip.tsx`
- Modify: `app/layout.tsx`, `app/(platform)/_styleguide/page.tsx`

**Interfaces:**
- Consumes: `cn` (Task 1), `radix-ui` (`Tooltip`).
- Produces: `TooltipProvider` (registado uma vez no root layout), `Tooltip({ content: ReactNode; children: ReactNode; side?: 'top'|'right'|'bottom'|'left' })`.

- [ ] **Step 1: `components/ui/Tooltip.tsx`**

```tsx
// components/ui/Tooltip.tsx
'use client';

import type { ReactNode } from 'react';
import { Tooltip as RadixTooltip } from 'radix-ui';

export const TooltipProvider = RadixTooltip.Provider;

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  return (
    <RadixTooltip.Root delayDuration={400}>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={6}
          className="z-50 rounded-control bg-ink px-2.5 py-1.5 font-body text-xs text-canvas shadow-hover"
        >
          {content}
          <RadixTooltip.Arrow className="fill-ink" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
```

- [ ] **Step 2: Registar `TooltipProvider` em `app/layout.tsx`**

Importar `{ TooltipProvider } from "../components/ui/Tooltip"` e envolver
`children` (dentro do `ConfirmProvider`, um único provider partilhado —
`delayDuration` fica consistente em toda a app):

```tsx
<ReactQueryProvider>
  <ConfirmProvider>
    <TooltipProvider>{children}</TooltipProvider>
  </ConfirmProvider>
</ReactQueryProvider>
```

- [ ] **Step 3: Acrescentar secção ao `_styleguide`**

Importar `Tooltip` de `@/components/ui/Tooltip` e acrescentar:

```tsx
<StyleguideSection title="Tooltip">
  <Tooltip content="Texto de apoio">
    <Button intent="secondary">Passa o rato aqui</Button>
  </Tooltip>
</StyleguideSection>
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit` → sem erros.

- [ ] **Step 5: Commit**

```
git add components/ui/Tooltip.tsx app/layout.tsx "app/(platform)/_styleguide/page.tsx"
git commit --no-verify -m "feat(ui): componente Tooltip sobre Radix Tooltip + provider global

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 14: `Toast` (Radix) + `ToastProvider` global

**Files:**
- Create: `components/ui/Toast.tsx`, `providers/ToastProvider.tsx`
- Modify: `app/layout.tsx`, `app/(platform)/_styleguide/page.tsx`

**Interfaces:**
- Consumes: `cn` (Task 1), `radix-ui` (`Toast`).
- Produces: `ToastProvider` (registado no root layout), `useToast(): (options: ToastOptions) => void` — `ToastOptions = { title: string; description?: string; intent?: 'success'|'danger'|'info' }`.

- [ ] **Step 1: `components/ui/Toast.tsx`** (peças visuais)

```tsx
// components/ui/Toast.tsx
'use client';

import { Toast as RadixToast } from 'radix-ui';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { ToastOptions } from '../../providers/ToastProvider';

const INTENT_ICON = { success: CheckCircle2, danger: XCircle, info: Info } as const;
const INTENT_COLOR = {
  success: 'text-success',
  danger: 'text-danger',
  info: 'text-info',
} as const;

export interface ToastItemProps extends ToastOptions {
  id: string;
  onOpenChange: (open: boolean) => void;
}

export function ToastItem({ title, description, intent = 'info', onOpenChange }: ToastItemProps) {
  const Icon = INTENT_ICON[intent];
  return (
    <RadixToast.Root
      onOpenChange={onOpenChange}
      duration={4000}
      className={cn(
        'flex items-start gap-3 rounded-card border border-border bg-surface p-4 shadow-elevated',
        'data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-2',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out',
      )}
    >
      <Icon size={20} strokeWidth={1.75} className={cn('shrink-0', INTENT_COLOR[intent])} />
      <div className="flex-1">
        <RadixToast.Title className="font-body text-sm font-semibold text-ink">
          {title}
        </RadixToast.Title>
        {description && (
          <RadixToast.Description className="mt-0.5 font-body text-xs text-ink-muted">
            {description}
          </RadixToast.Description>
        )}
      </div>
      <RadixToast.Close aria-label="Fechar notificação" className="text-ink-faint hover:text-ink">
        <X size={16} strokeWidth={1.75} />
      </RadixToast.Close>
    </RadixToast.Root>
  );
}

export function ToastViewport() {
  return (
    <RadixToast.Viewport className="fixed bottom-4 right-4 z-[100] flex w-80 flex-col gap-2 outline-none" />
  );
}
```

- [ ] **Step 2: `providers/ToastProvider.tsx`** (estado + `useToast`)

```tsx
// providers/ToastProvider.tsx
'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { Toast as RadixToast } from 'radix-ui';
import { ToastItem, ToastViewport } from '../components/ui/Toast';

export interface ToastOptions {
  title: string;
  description?: string;
  intent?: 'success' | 'danger' | 'info';
}

interface ToastEntry extends ToastOptions {
  id: string;
}

type ToastFn = (options: ToastOptions) => void;
const ToastContext = createContext<ToastFn | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const showToast = useCallback<ToastFn>((options) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...options, id }]);
  }, []);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      <RadixToast.Provider swipeDirection="right">
        {children}
        {toasts.map((t) => (
          <ToastItem
            key={t.id}
            {...t}
            onOpenChange={(open) => !open && remove(t.id)}
          />
        ))}
        <ToastViewport />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastFn {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast deve ser usado dentro de <ToastProvider>');
  return ctx;
}
```

- [ ] **Step 3: Registar `ToastProvider` em `app/layout.tsx`**

```tsx
import { ToastProvider } from "../providers/ToastProvider";
```
```tsx
<ReactQueryProvider>
  <ConfirmProvider>
    <TooltipProvider>
      <ToastProvider>{children}</ToastProvider>
    </TooltipProvider>
  </ConfirmProvider>
</ReactQueryProvider>
```

- [ ] **Step 4: Acrescentar secção ao `_styleguide`**

Importar `useToast` de `@/providers/ToastProvider` e acrescentar (dentro do
componente `StyleguidePage`, antes do `return`):

```tsx
const toast = useToast();
```

E na JSX:

```tsx
<StyleguideSection title="Toast">
  <Button onClick={() => toast({ title: 'Guardado com sucesso', intent: 'success' })}>
    Disparar toast de sucesso
  </Button>
  <Button
    intent="danger"
    onClick={() => toast({ title: 'Falha ao guardar', description: 'Tenta novamente.', intent: 'danger' })}
  >
    Disparar toast de erro
  </Button>
</StyleguideSection>
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit` → sem erros.

- [ ] **Step 6: Smoke manual**

`/_styleguide` → disparar os dois toasts, confirmar auto-dismiss aos 4s,
pausa em hover (comportamento nativo do Radix `Toast.Root`), fecho manual
pelo botão X.

- [ ] **Step 7: Commit**

```
git add components/ui/Toast.tsx providers/ToastProvider.tsx app/layout.tsx "app/(platform)/_styleguide/page.tsx"
git commit --no-verify -m "feat(ui): Toast/useToast sobre Radix Toast + provider global

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 15: `Table`

**Files:**
- Create: `components/ui/Table.tsx`
- Modify: `app/(platform)/_styleguide/page.tsx`

**Interfaces:**
- Consumes: `cn` (Task 1).
- Produces: `Table`, `TableHead`, `TableBody`, `TableRow`, `TableHeaderCell`, `TableCell` (todos wrappers de elementos HTML de tabela nativos).

- [ ] **Step 1: `components/ui/Table.tsx`**

```tsx
// components/ui/Table.tsx
import type {
  HTMLAttributes,
  TableHTMLAttributes,
  ThHTMLAttributes,
  TdHTMLAttributes,
} from 'react';
import { cn } from '@/lib/cn';

export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto rounded-card border border-border">
      <table className={cn('w-full border-collapse font-body text-sm text-ink', className)} {...props} />
    </div>
  );
}

export function TableHead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('bg-surface-sunken', className)} {...props} />;
}

export function TableBody(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} />;
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'border-b border-border transition-colors duration-150 last:border-0 hover:bg-surface-sunken/60',
        className,
      )}
      {...props}
    />
  );
}

export function TableHeaderCell({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-ink-muted',
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-3', className)} {...props} />;
}
```

- [ ] **Step 2: Acrescentar secção ao `_styleguide`**

Importar os componentes de `@/components/ui/Table` e acrescentar:

```tsx
<StyleguideSection title="Table">
  <Table>
    <TableHead>
      <TableRow>
        <TableHeaderCell>Nome</TableHeaderCell>
        <TableHeaderCell>Departamento</TableHeaderCell>
        <TableHeaderCell>Estado</TableHeaderCell>
      </TableRow>
    </TableHead>
    <TableBody>
      <TableRow>
        <TableCell>Ana Silva</TableCell>
        <TableCell>Recursos Humanos</TableCell>
        <TableCell><Badge intent="success">Activo</Badge></TableCell>
      </TableRow>
      <TableRow>
        <TableCell>João Pedro</TableCell>
        <TableCell>Tecnologia</TableCell>
        <TableCell><Badge intent="neutral">Inactivo</Badge></TableCell>
      </TableRow>
    </TableBody>
  </Table>
</StyleguideSection>
```

(`Badge` já importado na Task 6.)

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit` → sem erros.

- [ ] **Step 4: Commit**

```
git add components/ui/Table.tsx "app/(platform)/_styleguide/page.tsx"
git commit --no-verify -m "feat(ui): primitivos de Table

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 16: `Avatar`

**Files:**
- Create: `components/ui/Avatar.tsx`
- Modify: `app/(platform)/_styleguide/page.tsx`

**Interfaces:**
- Consumes: `cn` (Task 1).
- Produces: `Avatar({ name: string; url?: string; size?: 'sm'|'md'|'lg' })`.

- [ ] **Step 1: `components/ui/Avatar.tsx`**

```tsx
// components/ui/Avatar.tsx
// Consolida a implementação que existia localmente em
// components/engagement/atoms.tsx — gradiente determinístico pelo nome,
// para a mesma pessoa ter sempre a mesma cor em qualquer módulo.

import Image from 'next/image';
import { cn } from '@/lib/cn';

const GRADIENTS = [
  'from-primary to-accent',
  'from-info to-primary',
  'from-accent to-danger',
  'from-success to-info',
] as const;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

function gradientFor(name: string): (typeof GRADIENTS)[number] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return GRADIENTS[hash % GRADIENTS.length];
}

const SIZE_CLASSES = { sm: 'h-7 w-7 text-[10px]', md: 'h-9 w-9 text-xs', lg: 'h-12 w-12 text-sm' } as const;

export interface AvatarProps {
  name: string;
  url?: string;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}

export function Avatar({ name, url, size = 'md', className }: AvatarProps) {
  if (url) {
    return (
      <div className={cn('relative overflow-hidden rounded-full', SIZE_CLASSES[size], className)}>
        <Image src={url} alt={name} fill className="object-cover" />
      </div>
    );
  }
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-gradient-to-br font-body font-semibold text-canvas',
        gradientFor(name),
        SIZE_CLASSES[size],
        className,
      )}
    >
      {getInitials(name)}
    </div>
  );
}
```

- [ ] **Step 2: Acrescentar secção ao `_styleguide`**

Importar `Avatar` de `@/components/ui/Avatar` e acrescentar:

```tsx
<StyleguideSection title="Avatar">
  <Avatar name="Ana Silva" size="sm" />
  <Avatar name="João Pedro" size="md" />
  <Avatar name="Marta Costa" size="lg" />
</StyleguideSection>
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit` → sem erros.

- [ ] **Step 4: Commit**

```
git add components/ui/Avatar.tsx "app/(platform)/_styleguide/page.tsx"
git commit --no-verify -m "feat(ui): componente Avatar (iniciais + gradiente deterministico)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 17: `ProgressBar` + `PathProgress` (assinatura)

**Files:**
- Create: `components/ui/ProgressBar.tsx`, `components/ui/PathProgress.tsx`
- Modify: `app/(platform)/_styleguide/page.tsx`

**Interfaces:**
- Consumes: `cn` (Task 1).
- Produces: `ProgressBar({ value: number; className? })`, `PathProgress({ steps: { label: string; status: 'done'|'current'|'pending' }[] })`.

> `PathProgress` é o motivo de assinatura da direcção "Percurso" — só deve
> ser usado onde a ordem representa uma sequência real (progresso de curso/
> módulo, PDI, plano de carreira, wizard multi-passo), nunca como decoração.

- [ ] **Step 1: `components/ui/ProgressBar.tsx`**

```tsx
// components/ui/ProgressBar.tsx
import { cn } from '@/lib/cn';

export interface ProgressBarProps {
  /** 0–100 */
  value: number;
  className?: string;
}

export function ProgressBar({ value, className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-1.5 w-full rounded-pill bg-surface-sunken', className)}
    >
      <div
        className="h-full rounded-pill bg-accent transition-[width] duration-300"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
```

- [ ] **Step 2: `components/ui/PathProgress.tsx`**

```tsx
// components/ui/PathProgress.tsx
// Motivo de assinatura da direcção "Percurso": indicador de passos em
// ponto-e-linha. Usar só para sequências reais — progresso de curso/
// módulo, PDI, plano de carreira, wizard multi-passo.
import { cn } from '@/lib/cn';

export interface PathStep {
  label: string;
  status: 'done' | 'current' | 'pending';
}

export interface PathProgressProps {
  steps: PathStep[];
  className?: string;
}

export function PathProgress({ steps, className }: PathProgressProps) {
  return (
    <ol className={cn('flex items-center', className)}>
      {steps.map((step, i) => (
        <li key={step.label} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center gap-1">
            <span
              className={cn(
                'h-2.5 w-2.5 rounded-full',
                step.status === 'pending' ? 'bg-border-strong' : 'bg-primary',
                step.status === 'current' && 'ring-2 ring-accent-subtle ring-offset-2 ring-offset-canvas',
              )}
              aria-current={step.status === 'current' ? 'step' : undefined}
            />
            <span className="whitespace-nowrap font-body text-[10px] text-ink-muted">
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                'mx-1 h-0.5 flex-1',
                step.status === 'done' ? 'bg-primary' : 'bg-border-strong',
              )}
            />
          )}
        </li>
      ))}
    </ol>
  );
}
```

- [ ] **Step 3: Acrescentar secção ao `_styleguide`**

Importar `ProgressBar` de `@/components/ui/ProgressBar` e `PathProgress` de
`@/components/ui/PathProgress`, acrescentar:

```tsx
<StyleguideSection title="ProgressBar / PathProgress">
  <ProgressBar value={64} className="w-64" />
  <PathProgress
    className="w-96"
    steps={[
      { label: 'Introdução', status: 'done' },
      { label: 'Fundamentos', status: 'done' },
      { label: 'Prática', status: 'current' },
      { label: 'Avaliação', status: 'pending' },
      { label: 'Certificado', status: 'pending' },
    ]}
  />
</StyleguideSection>
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit` → sem erros.

- [ ] **Step 5: Commit**

```
git add components/ui/ProgressBar.tsx components/ui/PathProgress.tsx "app/(platform)/_styleguide/page.tsx"
git commit --no-verify -m "feat(ui): ProgressBar + PathProgress (motivo de assinatura)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 18: `KpiCard`

**Files:**
- Create: `components/ui/KpiCard.tsx`
- Modify: `app/(platform)/_styleguide/page.tsx`

**Interfaces:**
- Consumes: `cn` (Task 1), `Card`/`CardBody` (Task 7).
- Produces: `KpiCard({ icon: LucideIcon; label: string; value: string|number; sub?: string; trend?: number; intent?: 'primary'|'accent'|'success'|'warning'|'danger'|'info' })`.

- [ ] **Step 1: `components/ui/KpiCard.tsx`**

```tsx
// components/ui/KpiCard.tsx
// Consolida os `KpiCard` locais (ex.: components/engagement/atoms.tsx).
import type { LucideIcon } from 'lucide-react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Card } from './Card';

const INTENT_CLASSES = {
  primary: 'bg-primary-subtle text-primary',
  accent: 'bg-accent-subtle text-accent',
  success: 'bg-success-subtle text-success-ink',
  warning: 'bg-warning-subtle text-warning-ink',
  danger: 'bg-danger-subtle text-danger-ink',
  info: 'bg-info-subtle text-info-ink',
} as const;

export interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  /** % — positivo mostra seta a subir a verde, negativo a descer a vermelho. */
  trend?: number;
  intent?: keyof typeof INTENT_CLASSES;
  className?: string;
}

export function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  intent = 'primary',
  className,
}: KpiCardProps) {
  return (
    <Card className={cn('w-48 p-4', className)}>
      <div className="mb-3 flex items-start justify-between">
        <div className={cn('rounded-control p-2', INTENT_CLASSES[intent])}>
          <Icon size={18} strokeWidth={1.75} />
        </div>
        {trend !== undefined && (
          <span
            className={cn(
              'flex items-center gap-0.5 font-body text-xs font-medium',
              trend >= 0 ? 'text-success' : 'text-danger',
            )}
          >
            {trend >= 0 ? <TrendingUp size={12} strokeWidth={1.75} /> : <TrendingDown size={12} strokeWidth={1.75} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="font-display text-2xl font-bold text-ink">{value}</p>
      <p className="mt-0.5 font-body text-xs text-ink-muted">{label}</p>
      {sub && <p className="mt-0.5 font-body text-[10px] text-ink-faint">{sub}</p>}
    </Card>
  );
}
```

- [ ] **Step 2: Acrescentar secção ao `_styleguide`**

Importar `KpiCard` de `@/components/ui/KpiCard` e `Target` de
`lucide-react`, acrescentar:

```tsx
<StyleguideSection title="KpiCard">
  <KpiCard icon={Target} label="Progresso" value="78%" intent="primary" trend={4} />
  <KpiCard icon={Target} label="eNPS" value="8.4" intent="accent" trend={-2} sub="vs. trimestre anterior" />
</StyleguideSection>
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit` → sem erros.

- [ ] **Step 4: Commit**

```
git add components/ui/KpiCard.tsx "app/(platform)/_styleguide/page.tsx"
git commit --no-verify -m "feat(ui): componente KpiCard

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 19: `EmptyState` + demonstração do `Skeleton` (shimmer)

**Files:**
- Create: `components/ui/EmptyState.tsx`
- Modify: `app/(platform)/_styleguide/page.tsx`

**Interfaces:**
- Consumes: `cn` (Task 1), `Button` (Task 5).
- Produces: `EmptyState({ icon: LucideIcon; title: string; description: string; action?: { label: string; onClick: () => void } })`.
- `Skeleton` (`components/ui/Skeleton.tsx`) **não é modificado** — a Task 3 já
  criou a classe `.skeleton-shimmer`, consumida aqui só via `itemClassName`.

- [ ] **Step 1: `components/ui/EmptyState.tsx`**

```tsx
// components/ui/EmptyState.tsx
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-card border border-dashed border-border-strong bg-surface p-10 text-center',
        className,
      )}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-subtle">
        <Icon size={20} strokeWidth={1.75} className="text-accent" />
      </div>
      <div>
        <h3 className="font-display text-sm font-bold text-ink">{title}</h3>
        <p className="mt-1 max-w-xs font-body text-xs text-ink-muted">{description}</p>
      </div>
      {action && (
        <Button size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Acrescentar secção ao `_styleguide`**

Importar `EmptyState` de `@/components/ui/EmptyState`, `Skeleton` de
`@/components/ui/Skeleton`, e `Target` (já importado na Task 18),
acrescentar:

```tsx
<StyleguideSection title="EmptyState">
  <EmptyState
    icon={Target}
    title="Ainda não tens objectivos definidos"
    description="Cria o teu primeiro objectivo de desenvolvimento para começares a acompanhar o teu percurso."
    action={{ label: 'Criar objectivo', onClick: () => {} }}
    className="w-80"
  />
</StyleguideSection>
<StyleguideSection title="Skeleton (shimmer)">
  <Skeleton
    rows={3}
    wrapperClassName="flex w-64 flex-col gap-2"
    itemClassName="skeleton-shimmer h-4 rounded-control"
  />
</StyleguideSection>
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit` → sem erros.

- [ ] **Step 4: Commit**

```
git add components/ui/EmptyState.tsx "app/(platform)/_styleguide/page.tsx"
git commit --no-verify -m "feat(ui): componente EmptyState + demo do skeleton shimmer

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 20: Verificação final

**Files:**
- Nenhum novo — só verificação.

- [ ] **Step 1: Typecheck completo**

Run: `npx tsc --noEmit` → sem erros.

- [ ] **Step 2: Build completo**

Run: `npm run build` → completa sem erros.

- [ ] **Step 3: Testes unitários (vitest)**

Run: `npm test` → verde (confirma que nada em `lib/*.test.ts` foi afectado
— nenhuma das tasks tocou em `lib/format.ts`, `lib/roles.ts`,
`lib/statusBadge.ts`, `lib/validation.ts`).

- [ ] **Step 4: Smoke de acessibilidade por teclado**

`npm run dev`, abrir `/_styleguide` como ADMIN/RH e, só com Tab/Shift+Tab/
Enter/Space/Escape/setas, confirmar para cada secção:
- `Button`/`IconButton`: anel de foco visível, `Enter`/`Space` activam.
- `Select`: `Enter` abre, setas navegam, `Enter` selecciona, `Escape` fecha.
- `Modal`: foco entra no diálogo ao abrir, `Escape` fecha, foco volta ao
  trigger ao fechar (comportamento nativo do Radix `Dialog`).
- `Tabs`: setas esquerda/direita alternam entre tabs.
- `DropdownMenu`: `Enter`/`Space` abre, setas navegam, `Escape` fecha.
- `Tooltip`: aparece ao focar o trigger por teclado (não só hover).
- `Toast`: fecho pelo botão X funciona por teclado.

- [ ] **Step 5: Confirmar que nenhum módulo existente mudou**

Abrir 2–3 módulos existentes ao acaso (ex.: `/dashboard`, `/courses`,
`/payslips`) e confirmar visualmente que continuam exactamente iguais a
antes desta fase — nenhum deles importa nada de `components/ui/` novo
ainda (isso é a Fase B).

- [ ] **Step 6: Push + PR**

```
git push -u origin feat/design-system-foundation
gh pr create --title "feat(ui): fundação do sistema de design (Fase A)" --body "Implementa docs/superpowers/specs/2026-08-10-design-system-foundation-design.md — tokens + 16 componentes partilhados em components/ui/ + rota _styleguide (ADMIN only). Nenhum módulo existente é alterado nesta fase; ConfirmDialog é refeito sobre o novo Modal sem mudar o contrato de useConfirm()."
```

Aguardar o check `quality` (CI) ficar verde antes de squash-merge, tal como
o resto do projecto.

---

## Notas de execução

- Cada task acrescenta exactamente uma secção a `app/(platform)/_styleguide/page.tsx` — se duas tasks forem executadas por agentes diferentes fora de ordem, resolver o conflito de merge mantendo as duas secções (a ordem entre secções não importa).
- Se o build acusar as classes `animate-in`/`fade-in`/`zoom-in-95`/`slide-in-from-bottom-2` (Tasks 10 e 14) como desconhecidas — este projecto não tem o plugin `tailwindcss-animate` instalado — substituir por transições simples (`transition-opacity duration-200`, `transition-[transform,opacity] duration-200`) em vez de instalar mais uma dependência só para isto.
- `radix-ui` (pacote unificado) exporta cada primitivo como namespace nomeado — sempre `import { Dialog } from 'radix-ui'` e não `@radix-ui/react-dialog` directamente.
- Nenhuma task escreve em `Enrollment`/Prisma/backend — este plano é 100% `frontend/`.
