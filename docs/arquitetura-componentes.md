# Arquitetura de componentes — guia do frontend

Complementa `design-system-rules.md` (tokens e regras de lint) e
`DATA-FETCHING-GUIDE.md` (React Query). Este documento responde a: **onde vai
cada coisa, como desenhar a API de um componente, e como cobrir carregamento,
vazio, erro e acessibilidade**. Tudo aqui descreve padrões que já existem no
código; os exemplos apontam para ficheiros reais.

Catálogo visual dos primitivos: `npm run storybook` (histórias em
`components/ui/*.stories.tsx`) e a rota `/styleguide` (ADMIN).

---

## 1. Camadas

```
app/(platform)/<modulo>/page.tsx   rota fina: compõe, não contém lógica
components/<modulo>/*View.tsx      ecrãs/abas do módulo (container)
components/<modulo>/*Card|Modal    apresentação do módulo
hooks/use<Recurso>.ts              dados + mutações (React Query)
components/ui/*                    primitivos partilhados (design system)
lib/ , providers/                  utilitários e contextos globais
```

Regras de dependência (só para baixo):

- `components/ui/` **não importa** de `components/<modulo>/` nem de `hooks/` de domínio.
  Recebe tudo por props. É o que permite catalogá-lo no Storybook e testá-lo isolado.
- Um módulo não importa de outro módulo. Se dois módulos precisam do mesmo
  componente, sobe para `components/ui/` (foi assim com `Pagination`, `Skeleton`, `AlertCard`).
- `page.tsx` só compõe `*View`. Lógica de dados vive em hooks, não na página.

### Onde pôr um componente novo

| Pergunta                                           | Resposta                                                                               |
| -------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Serve a mais de um módulo e não conhece o domínio? | `components/ui/`                                                                       |
| Conhece o domínio (cursos, PDI, recibos…)?         | `components/<modulo>/`                                                                 |
| É um ecrã/aba inteiro com dados?                   | `<Nome>View.tsx` no módulo                                                             |
| É só lógica de dados/estado, sem JSX?              | `hooks/use<Nome>.ts`                                                                   |
| Tipos, constantes e helpers só do módulo?          | `types.ts`, `constants.ts`, `utils.ts` junto ao módulo (ver `components/enrollments/`) |

Container vs. apresentação: o `*View` busca dados (via hook) e decide estados;
os `*Card`/`*Modal` recebem dados prontos por props e emitem callbacks.

---

## 2. Design de props / API

Convenções seguidas pelos primitivos em `components/ui/`:

1. **Interface exportada e nomeada** `XProps` (regra de lint `consistent-type-definitions`: `interface`, não `type`).
2. **Estender o elemento nativo** quando o componente o embrulha
   (`ButtonHTMLAttributes`, `InputHTMLAttributes`), para `aria-*`, `onClick`, `data-*` passarem sem boilerplate.
3. **Variantes com `cva`**, não com combinações de booleanos.
   `Button` expõe `intent` (`primary`, `secondary`, `danger`…) e `size`; nunca `isPrimary`/`isDanger`.
4. **`className` aceite e fundido com `cn()`** (`lib/cn.ts`, que resolve conflitos Tailwind e conhece a escala `rounded-control/card/panel/pill`). O consumidor ajusta layout, não identidade visual.
5. **`forwardRef`** em `Button`, `Input` e `Textarea`, para foco programático e integração com bibliotecas.
6. **Estado como props booleanas simples e descritivas**: `loading`, `disabled`, `invalid`.
   `Button loading` desativa e anuncia `aria-busy`; `Input invalid` marca `aria-invalid`.
7. **Acessibilidade obrigatória no tipo**: `IconButton` exige `label` (vira `aria-label`); `ModalContent` exige `title`. Se não dá para esquecer, não se esquece.
8. **Padrão composto (Radix)** para widgets com partes: `Modal`/`ModalContent`/`ModalClose`, `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent`.
9. **Sem lógica de negócio nem fetch** em `ui/`. O módulo decide o que cada ação faz (ver `Pills.tsx`).

### Exemplo: botão com estado de carregamento

```tsx
import { Button, IconButton } from '@/components/ui/Button';
import { Plus } from 'lucide-react';

<Button intent="primary" loading={mutation.isPending} onClick={save}>
  Guardar
</Button>

<IconButton icon={Plus} label="Adicionar curso" onClick={openCreate} />
```

---

## 3. Os quatro estados de um ecrã com dados

Todo o ecrã que lê dados tem de tratar **carregar, erro, vazio e com dados**.
Não improvisar: usar os blocos partilhados.

| Estado     | Componente                        | Nota                                                                                     |
| ---------- | --------------------------------- | ---------------------------------------------------------------------------------------- |
| A carregar | `Skeleton`                        | Nunca `animate-pulse` manual nem texto "A carregar…". Tem `role="status"` e `aria-busy`. |
| Erro       | `QueryError` (ou `QueryBoundary`) | Com «Tentar novamente». Evita mostrar zeros/lista vazia quando a query falhou.           |
| Vazio      | `EmptyState`                      | Ícone + título + descrição + ação opcional. `variant="inline"` dentro de cartões.        |
| Com dados  | o conteúdo                        | Se já há dados em cache e o refetch falha, mostram-se os dados (o toast global avisa).   |

`QueryBoundary` junta os quatro (menos o vazio, que depende do dado):

```tsx
const query = useApiQuery<Course[]>(
  queryKeys.courses.list(params),
  '/courses',
  {
    params,
    staleTime: STALE_TIME.DYNAMIC,
  },
);

<QueryBoundary query={query} errorTitle="Não foi possível carregar os cursos">
  {(courses) =>
    courses.length === 0 ? (
      <EmptyState
        icon={BookOpen}
        title="Ainda não há cursos"
        description="Quando um curso for publicado aparece aqui."
        action={{ label: 'Criar curso', onClick: openCreate }}
      />
    ) : (
      <CourseGrid courses={courses} />
    )
  }
</QueryBoundary>;
```

Erros fora de queries: cada rota tem `error.tsx` (`RouteError`) e há
`app/global-error.tsx`; erros de render isolados usam `ErrorBoundary`.
Falhas de mutação vão para `useToast()`; nunca `alert()`.

### Feedback ao utilizador

| Situação                               | Ferramenta                                                               |
| -------------------------------------- | ------------------------------------------------------------------------ |
| Resultado de uma ação (gravou, falhou) | `useToast()` → `toast({ title, description?, intent })`                  |
| Confirmar ação destrutiva              | `useConfirm()` → `await confirm({ title, message, destructive: true })`  |
| Aviso persistente no ecrã              | `AlertCard` (`danger`/`warning`/`info`/`success`)                        |
| Formulário                             | `FormField` (label + hint + erro) a envolver `Input`/`Select`/`Textarea` |

---

## 4. Dados: onde e como

Detalhe completo em `DATA-FETCHING-GUIDE.md`. Resumo:

- Leitura: `useApiQuery(key, path, options)`; escrita: `useApiMutation` / `useOptimisticMutation`.
- A key vem de `lib/queryKeys.ts`; o `staleTime` de `STALE_TIME` (`STATIC`, `SEMI_STATIC`, `DYNAMIC`…).
- Cancelamento, cache, retry e dedup vêm do `QueryClient`; não reimplementar com `useEffect` + `fetch`.
- Auth é cookie httpOnly via `apiClient`; nunca `localStorage` nem `Authorization` manual.
- Pesquisa: `useDebounce` + `enabled: term.length >= 2`. Paginação: `placeholderData: keepPreviousData`.

---

## 5. Responsividade

- **Mobile-first** com Tailwind: estilo base para ecrã estreito, `sm:`/`md:`/`lg:` para alargar.
- Barras de ações passam para baixo do título em ecrãs estreitos (`PageHeader actions`, `AlertCard`).
- Texto mínimo `text-micro` (11px); alvos de toque confortáveis (os botões de ícone têm 32–36px).
- Tabelas largas: `Table` (usada pelo `DataTable`) tem `overflow-x-auto`; não partir o layout da página.
- Testar sempre a ~360px de largura antes de dar um ecrã como fechado.

---

## 6. Acessibilidade — checklist por componente

O lint (`jsx-a11y`, como `warn`) e os testes axe (`components/ui/a11y.test.tsx`)
apanham a maior parte. O que fica para revisão manual:

- [ ] Tudo o que é clicável é `<button>`/`<a>` (ou `Button`/`LinkButton`), nunca `<div onClick>`.
- [ ] Cada controlo tem nome acessível: `<label htmlFor>`/`FormField`, ou `aria-label` se só tem ícone.
- [ ] Erro de campo ligado ao campo (`invalid` → `aria-invalid`) e mensagem visível.
- [ ] Estado de carregamento anunciado (`aria-busy` / `role="status"`).
- [ ] Modais: título obrigatório, foco preso e devolvido (Radix). Atenção: o `Modal` atual bloqueia sempre `Esc` e o clique fora (para não perder dados de formulários), por isso só fecha pelos botões. É uma exceção às práticas WAI-ARIA para diálogos; se um modal for só informativo, vale a pena permitir `Esc`.
- [ ] Foco visível (`focus-visible:ring-*`) e navegação completa por teclado.
- [ ] Informação nunca só por cor: junta ícone ou texto (`Badge`, `AlertCard` têm ícone/texto).
- [ ] Animações respeitam `motion-reduce:`.
- [ ] Vídeo/áudio com legendas (`<track>`) quando o conteúdo as tiver.

Ao criar ou alterar um primitivo de `components/ui/`, acrescentar o caso a
`a11y.test.tsx` e uma história ao Storybook.

---

## 7. Testes

- Runner: Vitest + Testing Library (`npm test`). Ficheiro `X.test.tsx` junto ao componente.
- Testar **comportamento visível** (papéis, texto, eventos), não detalhes de implementação.
- Primitivos novos: um caso em `a11y.test.tsx` (axe) e, se tiverem lógica, um teste próprio (ver `Pagination.test.tsx`, `Select.test.tsx`).
- Hooks com lógica: `renderHook` (ver `useFormState.test.ts`).

---

## 8. Boas práticas (resumo)

1. Reutilizar antes de criar: procurar em `components/ui/` e no Storybook.
2. Tokens do design system, nunca cores/raios/sombras avulsos (o lint avisa).
3. Elementos nativos crus (`button`, `input`, `select`, `textarea`) → usar os componentes de `ui/`.
4. HTML dinâmico só via `SafeHtml` (sanitiza com DOMPurify).
5. Sem `any`; props em `interface XProps`.
6. Todo o ecrã com dados cobre carregar / erro / vazio / dados.
7. Texto de interface em português simples, sem enums crus nem mensagens de ORM/SQL.
8. Avisos em banner → `AlertCard`; seletores de período → `PeriodPills`; atalhos → `ShortcutPills`.
9. Antes de dar por concluído: `npx tsc --noEmit`, `npx eslint <ficheiros>`, `npx prettier --check` e os testes do módulo.
