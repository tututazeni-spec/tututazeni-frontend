# Otimização de Performance do Frontend — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduzir re-renders e custo de carregamento via React Compiler (auto-memoização), `next/image` (46 imagens) e virtualização das listas grandes (`users`/`employees` — na prática resolvida por paginação no servidor, ver Tasks 3/4), sem alterar comportamento.

**Architecture:** 3 fases independentes. Fase 1 liga o React Compiler no build (memoiza tudo). Fase 2 troca `<img>` por `next/image`. Fase 3 virtualiza `users` e `employees` com `@tanstack/react-virtual` — **resolvida por paginação no servidor em vez disso, ver Tasks 3/4.**

**Tech Stack:** Next.js 15.3, React 19.2, TypeScript 5, ESLint 9 (flat config), Tailwind 4.

## Global Constraints

- Sem testes automatizados no projeto → verificação por `npm run build` (`next build`), `npx tsc --noEmit`, `npm run dev` (smoke) e `npm run lint`. `next build` é pesado na máquina sob carga — paciência; `tsc --noEmit` é o gate rápido.
- React Compiler: `babel-plugin-react-compiler` + `experimental: { reactCompiler: true }` no `next.config.ts`, preservando `images`/`rewrites`.
- `next/image`: `alt` SEMPRE; SVG/data-URI inline ficam como `<img>`; preservar as classes Tailwind; mapear o tamanho (Tailwind `w-6 h-6` = 24px) para `width`/`height`, ou usar `fill` + container dimensionado.
- ~~Virtualização: `@tanstack/react-virtual`; SÓ `users` e `employees`.~~ Obsoleto — resolvido por paginação no servidor (ver Tasks 3/4).
- Regras INNOVA: `fullName` (nunca `name`) no User; datas dd/MM/yyyy; moeda AOA; frontend porta 3000 / backend 4000 (rewrites já configurados).
- Shell PowerShell; `npm`/`npx` sem pipe (ou `cmd /c "... > log 2>&1"`). Comandos git/npm no frontend correm com a CWD no repo do frontend (`C:\Users\Placido Costa\innova-frontend`).
- Commits `--no-verify`, terminam com: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`

---

### Task 1: Fase 1 — Ligar o React Compiler

**Files:**

- Modify: `next.config.ts`
- Modify: `eslint.config.mjs` (regra do compiler — best-effort)
- Modify: `package.json` / `package-lock.json` (nova devDependency)

**Interfaces:**

- Produces: build com auto-memoização ativa.

- [ ] **Step 1: Instalar o babel plugin do compiler**

Run: `npm install --save-dev babel-plugin-react-compiler@latest --no-audit --no-fund`
Expected: adiciona `babel-plugin-react-compiler` a devDependencies.

- [ ] **Step 2: Ativar no `next.config.ts`**

Substituir o objeto `nextConfig` por (preservando `images` e `rewrites` existentes):

```ts
const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/:path*',
      },
    ];
  },
};
```

- [ ] **Step 3: (Best-effort) regra ESLint do compiler em `eslint.config.mjs`**

Tentar instalar e ativar a regra de visibilidade dos bailouts:
Run: `npm install --save-dev eslint-plugin-react-hooks@latest --no-audit --no-fund`
Depois, em `eslint.config.mjs`, acrescentar um bloco de regras:

```js
  {
    rules: {
      "react-hooks/react-compiler": "warn",
    },
  },
```

Se a regra não existir nesta versão ou o flat-config der erro, **REVERTER este passo** (remover o bloco e o pacote se não usado) e seguir — não é bloqueante. O build do compiler já reporta os componentes saltados. Documenta no relatório se foi mantido ou revertido.

- [ ] **Step 4: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 5: Verificar build (gate principal do compiler)**

Run: `npm run build`
Expected: `next build` completa sem erros. Nos logs, o React Compiler indica os componentes compilados/saltados.
(Se demasiado lento na máquina, deixar correr em background e aguardar; não cancelar.)

- [ ] **Step 6: Smoke em dev**

Run: `npm run dev` (arrancar; abrir/observar que compila sem erros de runtime). Parar a seguir.
Expected: arranca sem erros; uma página pesada (ex.: `/employees`) renderiza.

- [ ] **Step 7: Commit**

```
git add next.config.ts eslint.config.mjs package.json package-lock.json
git commit --no-verify -m "perf(react): ligar o React Compiler (auto-memoizacao)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Fase 2 — Converter `<img>` para `next/image`

**Files:**

- Modify: todos os `.tsx` com `<img ...>` raw (exceto SVG/data-URI). São ~46 ocorrências.

**Interfaces:**

- Consumes: nada (independente da Fase 1).

- [ ] **Step 1: Listar todas as ocorrências de `<img`**

Run (PowerShell): localizar todas — `Get-ChildItem -Recurse -Filter *.tsx | Select-String '<img\s'`. Anota a lista no relatório.

- [ ] **Step 2: Converter cada `<img>` (regras)**

Para cada ficheiro, no topo: `import Image from 'next/image';` (uma vez). Converter cada `<img ... />`:

- **Avatar/thumbnail com tamanho Tailwind fixo** (`w-6 h-6`, `w-10 h-10`, …): usar `width`/`height` em px equivalentes (`w-6 h-6`→24, `w-8`→32, `w-10`→40, `w-12`→48, `w-16`→64, `w-20`→80, `w-24`→96), mantendo `className`.
  - Antes: `<img src={avatarUrl} alt={name} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />`
  - Depois: `<Image src={avatarUrl} alt={name} width={24} height={24} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />`
- **Imagem responsiva sem tamanho fixo** (`w-full`, `max-h-48`, etc.): usar `fill` dentro de um container `relative` com altura definida.
  - Antes: `<img src={question.mediaUrl} alt="Media" className="w-full max-h-48 object-contain" />`
  - Depois:
    ```tsx
    <div className="relative w-full h-48">
      <Image
        src={question.mediaUrl}
        alt="Media"
        fill
        className="object-contain"
      />
    </div>
    ```
- **`alt` obrigatório** — se faltar, acrescentar um `alt` descritivo (ou `alt=""` se decorativa).
- **Tamanho dinâmico via classe variável** (`${dim}`/`${s}`): se não der para mapear a px de forma fiável, usar `fill` + container dimensionado pela mesma classe.
- **EXCEÇÃO:** se o `src` for um `.svg` literal ou `data:` URI, **NÃO converter** — deixar `<img>` (e adicionar um comentário `{/* eslint-disable-next-line @next/next/no-img-element */}` se o lint reclamar).

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: completa sem erros; sem warnings `@next/next/no-img-element` (exceto os SVG/data-URI deixados de propósito).

- [ ] **Step 5: Commit**

```
git add -A
git commit --no-verify -m "perf(image): converter <img> para next/image (lazy-load, webp)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3 e Task 4: Fase 3a/3b — Virtualizar `users`/`employees` — **RESOLVIDO POR PAGINAÇÃO (2026-08-20)**

> Estas duas tasks ficaram por executar enquanto o resto do plano avançava, e
> entretanto `UserListView` (`components/users/UserListView.tsx`) e
> `useEmployees` (`hooks/useEmployees.ts`) passaram a paginar no servidor
> (`limit: 20` por página, via `useApiQuery`/React Query com `keepPreviousData`)
> em vez de carregar as ~6000 linhas de uma vez para o cliente. O DOM nunca
> chega a ter mais do que uma página de linhas montadas, que é exactamente o
> problema que `@tanstack/react-virtual` resolveria — instalá-lo e aplicar o
> template abaixo seria reconstruir manualmente, com scroll infinito, o que a
> paginação já resolve de graça (YAGNI). Nota: `app/(platform)/users/page.tsx`
> também já não é onde a lista é renderizada — foi extraída para
> `components/users/UserListView.tsx` — pelo que os caminhos de ficheiro
> originais abaixo estão desactualizados de qualquer forma. Sem acção
> necessária; secção mantida só como registo histórico da decisão.
>
> Ver auditoria de performance de 2026-08-20 (React Compiler bailout
> visibility) para o contexto completo desta decisão.

<details>
<summary>Plano original (não executado, obsoleto)</summary>

- Task 3 instalaria `@tanstack/react-virtual` e virtualizaria a lista em
  `app/(platform)/users/page.tsx` com um `useVirtualizer` (container com scroll
  fixo + linhas absolutamente posicionadas via `getVirtualItems()`).
- Task 4 aplicaria o mesmo template a `app/(platform)/employees/page.tsx`.

</details>

---

## Notas de execução

- **Ordem das fases é independente**, mas a Task 4 depende da Task 3 (instala o `@tanstack/react-virtual`).
- **Build lento:** `next build` na máquina sob carga pode demorar muito — correr em background e aguardar, não cancelar. `tsc --noEmit` é o gate rápido entre passos.
- **Comportamento inalterado** é o critério-chave em todas as fases: o compiler preserva semântica; o next/image mantém o visual; a virtualização mantém os mesmos dados/ordem.
- **Verificação final (após as 4 tasks):** `npm run build` limpo + `tsc --noEmit` limpo + smoke a `/employees`, `/users`, e uma página com imagens.
