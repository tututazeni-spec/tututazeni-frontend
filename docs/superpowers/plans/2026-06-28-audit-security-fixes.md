# Fixes de Segurança/Limpeza da Auditoria — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminar 3 desvios pontuais da auditoria frontend (token em localStorage no PDF; `dangerouslySetInnerHTML` por regex; `setItem("user")` não usado) sem mudar o comportamento visível.

**Architecture:** 3 edições pequenas e independentes em 3 ficheiros, alinhando-os ao padrão de auth por cookie httpOnly e ao sanitizer. Verificação por tsc + build + smoke (sem testes no projeto).

**Tech Stack:** Next.js 15.3, React 19.2, TypeScript 5.

## Global Constraints

- Trabalha no repo do frontend `C:\Users\Placido Costa\innova-frontend` (`Set-Location` ou `git -C`).
- Sem testes automatizados → verificar por `npx tsc --noEmit` (rápido) e `npm run build` (`next build`, pesado — aguardar, não cancelar). `tsc` OOM → `node --max-old-space-size=4096 node_modules/typescript/bin/tsc --noEmit`.
- Comportamento visível inalterado (PDF descarrega via cookie; preview mostra o mesmo texto; settings funciona).
- Shell PowerShell; `npm`/`npx` sem pipe (ou `cmd /c`).
- Commits `--no-verify`, terminam com: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`

---

### Task 1: Aplicar os 3 fixes da auditoria

**Files:**
- Modify: `components/ui/PdfDownloadButton.tsx`
- Modify: `app/(platform)/declarations/page.tsx`
- Modify: `app/(platform)/settings/page.tsx`

- [ ] **Step 1: `PdfDownloadButton.tsx` — usar cookie em vez de token localStorage**

Substituir o bloco `const res = await fetch(...)` (o que tem o header `Authorization`) por:
```ts
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/pdf/${type}/${id}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );
```
(Remove o `headers: { Authorization: \`Bearer ${localStorage.getItem('token')}\` }`. O cookie httpOnly passa a autenticar, como no `lib/api.ts`.)

- [ ] **Step 2: `declarations/page.tsx` — remover o `dangerouslySetInnerHTML` por regex**

Substituir a linha:
```tsx
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans" dangerouslySetInnerHTML={{ __html: preview.previewHtml.replace(/<[^>]*>/g, ' ').trim() }} />
```
por (mesmo output — texto puro, sem vetor de injeção):
```tsx
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans">{preview.previewHtml.replace(/<[^>]*>/g, ' ').trim()}</pre>
```

- [ ] **Step 3: `settings/page.tsx` — remover o `localStorage` de `user`**

Remover estas duas linhas (nada lê `getItem("user")`; a sessão vive no Zustand `authStore`):
```ts
        localStorage.setItem("user", JSON.stringify({ fullName: res.fullName, email: res.email }));
```
e a linha pareada (agora redundante):
```ts
        localStorage.removeItem("user");
```
Manter o resto da lógica à volta (mensagens de sucesso, atualização do estado/store) intacta.

- [ ] **Step 4: Confirmar que não restam acessos problemáticos**

Run (PowerShell, no repo): localizar `localStorage.getItem('token')` e `setItem("user"` — não devem aparecer:
```
Get-ChildItem -Recurse -Filter *.tsx | Where-Object FullName -notmatch 'node_modules|\.next' | Select-String "getItem\('token'\)|setItem\(""user"""
```
Expected: 0 resultados (em código; comentários não contam).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 6: Build**

Run: `npm run build`
Expected: completa sem erros.

- [ ] **Step 7: Commit**

```
git add "components/ui/PdfDownloadButton.tsx" "app/(platform)/declarations/page.tsx" "app/(platform)/settings/page.tsx"
git commit --no-verify -m "fix(security): PDF via cookie httpOnly, remover XSS por regex e user em localStorage

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

## Notas
- Só estas 3 mudanças; não toques noutros ficheiros.
- `noindex` NÃO precisa de alteração (o `app/layout.tsx` já tem `robots: { index: false, follow: false }`).
- Se o `settings/page.tsx` usar o objeto guardado em `user` algures (procura `getItem("user")` antes de remover) — pela auditoria não usa, mas confirma; se usar, substitui a leitura pela fonte real (store/endpoint) em vez de partir.
