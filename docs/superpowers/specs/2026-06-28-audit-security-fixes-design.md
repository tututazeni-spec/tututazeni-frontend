# Spec — Fixes pontuais de segurança/limpeza (auditoria frontend)

> Data: 2026-06-28
> Repo: innova-frontend (Next.js 15.3 + React 19.2)
> Branch: `fix/audit-security`
> Origem: auditoria contra o `FRONTEND-AUDIT-GUIDE.md`. Itens bounded (os P3
> amplos — a11y, confirmações destrutivas — ficam para ciclo dedicado).

## Contexto

A app autentica corretamente por **httpOnly cookie** (`lib/api.ts` usa
`credentials: 'include'` e nunca lê o token em JS; `services/api.ts` axios com
`withCredentials: true`). A auditoria encontrou 3 desvios pontuais:

1. `components/ui/PdfDownloadButton.tsx` lê `localStorage.getItem('token')` e
   envia-o num header `Authorization` — único sítio que usa um token em
   localStorage (inconsistente; provavelmente até partido, pois o token vive no
   cookie). Risco/inconsistência de segurança.
2. `app/(platform)/declarations/page.tsx` usa `dangerouslySetInnerHTML` com
   `preview.previewHtml.replace(/<[^>]*>/g, ' ')` — strip de tags por regex (não o
   sanitizer do projeto). Como tira **todas** as tags, o resultado é texto puro.
3. `app/(platform)/settings/page.tsx` faz `localStorage.setItem("user", …)` com
   dados do utilizador — **nunca lido** (não há `getItem("user")`; a sessão vive
   no Zustand `authStore`).

**Já correto (sem alteração):** `noindex/nofollow` — o `app/layout.tsx` já tem
`robots: { index: false, follow: false }` (a auditoria por string falhou; usa-se a
forma objeto).

## Objetivo

Eliminar os 3 desvios sem mudar o comportamento visível (PDF continua a
descarregar via cookie; o preview mostra o mesmo texto; o login/settings funciona).

## Design

1. **`PdfDownloadButton.tsx`** — no `fetch` do PDF, usar `credentials: 'include'`
   e **remover** o header `Authorization: Bearer ${localStorage.getItem('token')}`.
   O cookie httpOnly passa a autenticar (como no `lib/api.ts`).
2. **`declarations/page.tsx`** — substituir
   `<pre … dangerouslySetInnerHTML={{ __html: preview.previewHtml.replace(/<[^>]*>/g, ' ').trim() }} />`
   por renderização de texto puro:
   `<pre …>{preview.previewHtml.replace(/<[^>]*>/g, ' ').trim()}</pre>`
   (mesmo output, sem vetor de injeção).
3. **`settings/page.tsx`** — remover a linha `localStorage.setItem("user", …)` (e
   o `localStorage.removeItem("user")` pareado, agora redundante). Nada lê `user`.

## Verificação (sem testes automatizados)

- `npx tsc --noEmit` → zero erros.
- `npm run build` → completa sem erros.
- `npm run dev` smoke: login/settings funciona; o botão de PDF descarrega; a
  página de declarations mostra o preview.

## Critério de sucesso

1. `PdfDownloadButton` não lê `localStorage`; usa `credentials: 'include'`.
2. Nenhum `dangerouslySetInnerHTML` com strip por regex em `declarations`.
3. Sem `localStorage.setItem("user")`.
4. `tsc` limpo e `next build` verde; comportamento inalterado.

## Fora de âmbito

- P3 amplos: acessibilidade (labels/`htmlFor` em todos os formulários) e
  confirmações destrutivas em todos os deletes — ciclo dedicado.
- Restantes pontos já feitos (middleware, error boundary, 401, React Query,
  paginação, next/image, compiler, i18n, noindex).
