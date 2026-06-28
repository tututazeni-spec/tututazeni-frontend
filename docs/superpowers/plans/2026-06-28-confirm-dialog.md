# ConfirmDialog acessível + migração dos window.confirm — Plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir os `window.confirm` por um modal de confirmação acessível e reutilizável (`useConfirm`), sem mudar o comportamento.

**Architecture:** Um `ConfirmProvider` (Context) no root renderiza um `ConfirmDialog` acessível e expõe `useConfirm()` que devolve `confirm(options): Promise<boolean>`. Os 11 ficheiros com `window.confirm` migram para `await confirm({...})`.

**Tech Stack:** Next.js 15.3, React 19.2, TypeScript 5, Tailwind 4.

## Global Constraints

- Sem testes automatizados → verificar por `npx tsc --noEmit` e `npm run build` (`next build`, pesado — aguardar; `tsc` é o gate rápido; OOM → `node --max-old-space-size=4096 node_modules/typescript/bin/tsc --noEmit`).
- `useConfirm()` devolve `confirm(options: ConfirmOptions): Promise<boolean>`. **SEMPRE `await`** (sem await, `!confirm(...)` é sempre falsy → não confirma). Como `confirm` espera um OBJETO, qualquer `confirm('string')` não-migrado dá erro de tsc (safety-net).
- 0 `window.confirm`/`confirm('...')` restantes no fim.
- Comportamento inalterado: Cancelar não age; Confirmar age.
- Trabalha no repo `C:\Users\Placido Costa\innova-frontend`. Shell PowerShell; `npm`/`npx` sem pipe (ou `cmd /c`).
- Commits `--no-verify`, terminam com: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`

---

### Task 1: Primitivo (ConfirmProvider + ConfirmDialog + useConfirm)

**Files:**
- Create: `providers/ConfirmProvider.tsx`
- Create: `components/ui/ConfirmDialog.tsx`
- Modify: `app/layout.tsx` (envolver children + import)

**Interfaces:**
- Produces: `useConfirm(): (options: ConfirmOptions) => Promise<boolean>`; `ConfirmOptions = { title: string; message?: string; confirmLabel?: string; cancelLabel?: string; destructive?: boolean }`.

- [ ] **Step 1: `providers/ConfirmProvider.tsx`**
```tsx
'use client';
import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;
const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const close = useCallback((result: boolean) => {
    setOptions(null);
    resolverRef.current?.(result);
    resolverRef.current = null;
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <ConfirmDialog {...options} onCancel={() => close(false)} onConfirm={() => close(true)} />
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm deve ser usado dentro de <ConfirmProvider>');
  return ctx;
}
```

- [ ] **Step 2: `components/ui/ConfirmDialog.tsx`**
```tsx
'use client';
import { useEffect, useRef } from 'react';
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
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby={message ? 'confirm-message' : undefined}
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="text-lg font-semibold text-gray-900">{title}</h2>
        {message && <p id="confirm-message" className="mt-2 text-sm text-gray-600">{message}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Registar no `app/layout.tsx`**
Adicionar o import no topo:
```tsx
import { ConfirmProvider } from "../providers/ConfirmProvider";
```
E envolver os children (dentro do `ReactQueryProvider`):
```tsx
<ReactQueryProvider>
  <ConfirmProvider>{children}</ConfirmProvider>
</ReactQueryProvider>
```

- [ ] **Step 4: Typecheck + build**
Run: `npx tsc --noEmit` → sem erros.
Run: `npm run build` → completa sem erros.

- [ ] **Step 5: Commit**
```
git add providers/ConfirmProvider.tsx components/ui/ConfirmDialog.tsx app/layout.tsx
git commit --no-verify -m "feat(ui): ConfirmDialog acessivel + useConfirm

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Migrar grupo 1 (users, roles-permissions, enrollments, events)

**Files:**
- Modify: `app/(platform)/users/page.tsx`, `app/(platform)/roles-permissions/page.tsx`, `app/(platform)/enrollments/page.tsx`, `app/(platform)/events/page.tsx`

**Interfaces:**
- Consumes: `useConfirm` (Task 1).

- [ ] **Step 1: Migrar cada ficheiro (padrão)**
Em cada ficheiro: importar `import { useConfirm } from '@/providers/ConfirmProvider';` (ou caminho relativo correto) e no topo do componente `const confirm = useConfirm();`. Depois, para cada `if (!confirm('…')) return;` / `if (!window.confirm('…')) return;`, substituir por:
```ts
if (!(await confirm({ title: '<pergunta curta>', message: 'Esta ação não pode ser anulada.', confirmLabel: '<verbo, ex.: Apagar>', destructive: true }))) return;
```
Garantir que o handler envolvente é `async`. Exemplos reais:
- `users/page.tsx` — `if (!confirm(\`${act} este utilizador?\`)) return;` →
  ```ts
  if (!(await confirm({ title: `${act} este utilizador?`, confirmLabel: act, destructive: true }))) return;
  ```
- `roles-permissions/page.tsx` — `onClick={() => { if (confirm('Remover role?')) apiClient.delete(...).then(...) }}` →
  ```tsx
  onClick={async () => { if (await confirm({ title: 'Remover role?', confirmLabel: 'Remover', destructive: true })) apiClient.delete(...).then(...); }}
  ```
- `enrollments`/`events` — localizar os `confirm('…')` e aplicar o mesmo padrão (handler async + `await confirm({...})`).

- [ ] **Step 2: Confirmar 0 confirm() nestes ficheiros**
Run (PowerShell): procurar `confirm(` nos 4 ficheiros — só deve aparecer `await confirm({` (não `confirm('` nem `window.confirm`).

- [ ] **Step 3: Typecheck**
Run: `npx tsc --noEmit` → sem erros (se ficar algum `confirm('string')`, o tsc acusa).

- [ ] **Step 4: Commit**
```
git add "app/(platform)/users/page.tsx" "app/(platform)/roles-permissions/page.tsx" "app/(platform)/enrollments/page.tsx" "app/(platform)/events/page.tsx"
git commit --no-verify -m "refactor(ui): migrar window.confirm para useConfirm (grupo 1)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Migrar grupo 2 (courses learn, courses modulos, live-classes, leave)

**Files:**
- Modify: `app/(platform)/courses/[courseId]/learn/page.tsx`, `app/(platform)/courses/modulos/page.tsx`, `app/(platform)/live-classes/page.tsx`, `app/(platform)/leave/page.tsx`

**Interfaces:**
- Consumes: `useConfirm` (Task 1).

- [ ] **Step 1: Migrar cada ficheiro**
Mesmo padrão da Task 2 Step 1: `const confirm = useConfirm();` no topo do componente; cada `confirm('…')`/`window.confirm('…')` → `await confirm({ title, message?, confirmLabel, destructive: true })`; handlers `async`. Adaptar título/verbo ao contexto (apagar módulo, cancelar aula, cancelar pedido de férias, etc.).

- [ ] **Step 2: Confirmar 0 confirm() nestes ficheiros** (como Task 2 Step 2).

- [ ] **Step 3: Typecheck**
Run: `npx tsc --noEmit` → sem erros.

- [ ] **Step 4: Commit**
```
git add "app/(platform)/courses/[courseId]/learn/page.tsx" "app/(platform)/courses/modulos/page.tsx" "app/(platform)/live-classes/page.tsx" "app/(platform)/leave/page.tsx"
git commit --no-verify -m "refactor(ui): migrar window.confirm para useConfirm (grupo 2)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Migrar grupo 3 (api-integrations, automation, processes) + verificação final

**Files:**
- Modify: `app/(platform)/api-integrations/page.tsx`, `app/(platform)/automation/page.tsx`, `app/(platform)/processes/page.tsx`

**Interfaces:**
- Consumes: `useConfirm` (Task 1).

- [ ] **Step 1: Migrar cada ficheiro**
Mesmo padrão. Adaptar título/verbo (apagar integração, apagar regra de automação, apagar processo, etc.).

- [ ] **Step 2: Confirmar 0 `window.confirm`/`confirm('` em TODO o projeto**
Run (PowerShell, no repo):
```
Get-ChildItem -Recurse -Filter *.tsx | Where-Object FullName -notmatch 'node_modules|\.next|ConfirmProvider|ConfirmDialog' | Select-String -Pattern "window\.confirm|confirm\('|confirm\(`"
```
Expected: 0 resultados (só deve existir `await confirm({` nos call-sites e a definição em ConfirmProvider/ConfirmDialog).

- [ ] **Step 3: Typecheck + build**
Run: `npx tsc --noEmit` → sem erros.
Run: `npm run build` → completa sem erros.

- [ ] **Step 4: Commit**
```
git add "app/(platform)/api-integrations/page.tsx" "app/(platform)/automation/page.tsx" "app/(platform)/processes/page.tsx"
git commit --no-verify -m "refactor(ui): migrar window.confirm para useConfirm (grupo 3) + verificacao

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Notas de execução
- **Atenção ao `await`**: o erro mais provável é esquecer o `await` (o tsc não o apanha — `!Promise` é sempre falsy → confirma sempre). Reler cada call-site migrado.
- Se um ficheiro usar `confirm(...)` para uma ação NÃO destrutiva (ex.: confirmar antes de submeter algo benigno), migrar à mesma para o modal, com `destructive: false` e verbo adequado.
- Cada componente migrado tem de ser client component (`'use client'` — já são, são páginas interativas).
