# Migração do módulo certification (Fase B, vaga 1) — Plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar `components/certification/**` + `app/(platform)/certification/**` para
consumir exclusivamente `components/ui/` (Fase A, PR #183), eliminando toda a paleta
Tailwind crua, seguindo o mesmo padrão validado no piloto engagement (PR #185), sem
alterar nenhum comportamento de dados.

**Architecture:** O módulo tem apenas 2 ficheiros próprios: `components/certification/types.ts`
(interfaces + constantes de domínio, zero cor — não é tocado) e
`components/certification/TemplatesView.tsx` (componente de apresentação puro, recebe todas
as props de `hooks/useCertificateTemplates.ts` via `app/(platform)/certification/templates/page.tsx`,
que já está separado em container/view desde o commit `0918c2d`). Não há `atoms.tsx` local a
eliminar. `app/(platform)/certification/templates/page.tsx` e `layout.tsx` não têm classes de
cor — não precisam de alterações.

**Tech Stack:** Next.js 15.3, React 19.2, TypeScript 5, Tailwind v4, `components/ui/` (Fase A, PR #183).

## Global Constraints

- Repo: `C:\Users\PLÁCIDO COSTA\innova\frontend`. Branch: `refactor/certification-design-migration`, a partir de `main`.
- **Zero alterações a dados/comportamento** — mesmos endpoints, mesmos `queryKeys`, mesmos payloads de mutation, mesma lógica de filtros/validação. Só a apresentação muda. `hooks/useCertificateTemplates.ts` não é tocado.
- **Zero classes de cor Tailwind cruas** (`gray-*`, `blue-*`, `red-*`, `green-*`, etc., `text-white` como cor fixa) em `components/certification/**` e `app/(platform)/certification/**` no final — só tokens da Fase A.
- **Não criar componentes novos.** O checkbox "Template por omissão" fica `<input type="checkbox">` nativo com `accent-primary`, tal como o piloto engagement fez para o checkbox "Enviar anonimamente" do `FeedbackTab`.
- **`font-mono` está banido** — o textarea de HTML do template usa `font-data` (token da Fase A para conteúdo em monoespaçado), não `font-mono`.
- **`Card` sem `interactive`** — nenhum elemento deste módulo tem acção de clique própria.
- Verificação: `npx tsc --noEmit` (após a task) + grep de paleta crua + `npm run build` + `npm test`.
- Ícones: `lucide-react`, sempre `strokeWidth={1.75}`, tamanhos só de `{14,16,18,20,24}`.
- Commits: `git commit --no-verify`, mensagem termina sempre com `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.
- `types.ts` não é tocado — só interfaces/constantes TypeScript, sem cor nenhuma.

---

### Task 1: `components/certification/TemplatesView.tsx`

**Files:**
- Modify: `components/certification/TemplatesView.tsx`

**Interfaces:**
- Consumes: `Badge`, `Button`, `FormField`, `Input`, `Select`, `Skeleton`, `Textarea` (`@/components/ui/*`).
- Props (`TemplatesViewProps`) e assinatura do componente **não mudam** — mesmo contrato com `app/(platform)/certification/templates/page.tsx` e `hooks/useCertificateTemplates.ts`.

- [ ] **Step 1: Reescrever `components/certification/TemplatesView.tsx`**

```tsx
// components/certification/TemplatesView.tsx

import { TEMPLATE_TYPES } from './types';
import type { Template, TemplateForm } from './types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Textarea } from '@/components/ui/Textarea';

interface TemplatesViewProps {
  data: Template[];
  loading: boolean;
  error: string;
  onRetry: () => void;
  showForm: boolean;
  setShowForm: (updater: (s: boolean) => boolean) => void;
  form: TemplateForm;
  setForm: (form: TemplateForm) => void;
  submit: (e: React.FormEvent) => void;
  saving: boolean;
}

const TEMPLATE_TYPE_ITEMS = TEMPLATE_TYPES.map((t) => ({ value: t, label: t }));

export function TemplatesView({
  data,
  loading,
  error,
  onRetry,
  showForm,
  setShowForm,
  form,
  setForm,
  submit,
  saving,
}: TemplatesViewProps) {
  if (loading)
    return (
      <div className="p-6">
        <Skeleton
          rows={3}
          wrapperClassName="space-y-4"
          itemClassName="skeleton-shimmer h-20 rounded-card"
        />
      </div>
    );

  if (error)
    return (
      <div className="p-6">
        <div className="rounded-card border border-danger bg-danger-subtle p-4 font-body text-sm text-danger-ink">
          {error}
          <Button intent="ghost" size="sm" onClick={onRetry} className="ml-4">
            Tentar novamente
          </Button>
        </div>
      </div>
    );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            Templates de Certificado
          </h1>
          <p className="font-body text-sm text-ink-faint">{data.length} templates</p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Cancelar' : '+ Novo Template'}
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={submit}
          className="grid grid-cols-1 gap-4 rounded-card border border-border bg-surface p-6 shadow-resting md:grid-cols-2"
        >
          <FormField label="Nome *" htmlFor="template-name">
            <Input
              id="template-name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </FormField>

          <FormField label="Tipo" htmlFor="template-type">
            <Select
              items={TEMPLATE_TYPE_ITEMS}
              value={form.type}
              onValueChange={(v) => setForm({ ...form, type: v })}
            />
          </FormField>

          <div className="md:col-span-2">
            <FormField label="Descrição" htmlFor="template-description">
              <Input
                id="template-description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </FormField>
          </div>

          <div className="md:col-span-2">
            <FormField
              label="HTML ({{recipientName}}, {{title}}, {{date}})"
              htmlFor="template-html"
            >
              <Textarea
                id="template-html"
                required
                value={form.html}
                onChange={(e) => setForm({ ...form, html: e.target.value })}
                className="font-data text-sm"
                rows={4}
              />
            </FormField>
          </div>

          <FormField label="Signatário" htmlFor="template-signatory-name">
            <Input
              id="template-signatory-name"
              value={form.signatoryName}
              onChange={(e) => setForm({ ...form, signatoryName: e.target.value })}
            />
          </FormField>

          <FormField label="Cargo do signatário" htmlFor="template-signatory-title">
            <Input
              id="template-signatory-title"
              value={form.signatoryTitle}
              onChange={(e) => setForm({ ...form, signatoryTitle: e.target.value })}
            />
          </FormField>

          <FormField label="Validade (dias)" htmlFor="template-validity-days">
            <Input
              id="template-validity-days"
              type="number"
              value={form.validityDays}
              onChange={(e) => setForm({ ...form, validityDays: e.target.value })}
            />
          </FormField>

          <label className="mt-6 flex items-center gap-2 font-body text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              className="rounded accent-primary"
            />
            Template por omissão para este tipo
          </label>

          <div className="md:col-span-2">
            <Button type="submit" disabled={saving} loading={saving}>
              {saving ? 'A guardar...' : 'Criar Template'}
            </Button>
          </div>
        </form>
      )}

      <div className="divide-y divide-border rounded-card border border-border bg-surface shadow-resting">
        {data.length === 0 ? (
          <p className="p-4 font-body text-sm text-ink-faint">Sem templates criados</p>
        ) : (
          data.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-4">
              <div>
                <p className="flex items-center gap-2 font-body text-sm font-medium text-ink">
                  {t.name}
                  {t.isDefault && <Badge intent="info">Padrão</Badge>}
                </p>
                <p className="font-body text-xs text-ink-faint">
                  {t.type}
                  {t.validityDays ? ` · válido ${t.validityDays} dias` : ' · sem expiração'}
                  {' · '}
                  {t._count?.certificates ?? 0} emitidos
                </p>
              </div>
              <Badge intent={t.isActive ? 'success' : 'neutral'}>
                {t.isActive ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

Notas:
- `interface TemplatesViewProps` deixa de ser `export`ada (não era consumida fora deste
  ficheiro — `page.tsx` só importa `TemplatesView`); mantém-se local tal como estava, sem
  mudar o contrato real.
- Estado "Activo/Inactivo" passa de texto colorido a `Badge` (`success`/`neutral`) — mesma
  informação, primitivo da Fase A em vez de `className` condicional cru.
- Botão "Tentar novamente" passa de link sublinhado para `Button intent="ghost" size="sm"`
  — mantém a intenção (acção secundária dentro da mensagem de erro).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit` → sem erros.

- [ ] **Step 3: Commit**

```
git add components/certification/TemplatesView.tsx
git commit --no-verify -m "refactor(certification): migrar TemplatesView para a fundacao de design

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Verificação final

- [ ] **Step 1: Grep de paleta crua**

```
grep -rniE "(violet|indigo|slate|amber|emerald|red|teal|purple|blue|green|yellow|orange|gray|zinc|neutral|stone|cyan|sky|rose|pink|fuchsia|lime)-[0-9]{2,3}|text-white\b" components/certification/ "app/(platform)/certification"
```
Expected: 0 resultados.

- [ ] **Step 2: Typecheck completo**

Run: `npx tsc --noEmit` → sem erros.

- [ ] **Step 3: Build completo**

Run: `npm run build` → completa sem erros, rota `/certification/templates` presente.

- [ ] **Step 4: Testes unitários**

Run: `npm test` (vitest) → testes pré-existentes continuam verdes (este módulo não tem testes próprios).

- [ ] **Step 5: Push + PR**

```
git push -u origin refactor/certification-design-migration
gh pr create --title "refactor(certification): migrar para a fundação de design" --body "..."
```

Não esperar pelo CI nem fazer merge — a orquestração central trata do merge depois de
todos os módulos da vaga 1 (Tier S) abrirem PR.
