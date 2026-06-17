# Guia de Data Fetching — INNOVA Frontend

Camada de dados optimizada com **React Query** (TanStack Query v5). Substitui o
padrão antigo de `useEffect` + `useState` + `fetch` inline (com `localStorage`
Bearer, que era código morto — a auth é por **cookie httpOnly**).

## A fundação (já criada)

| Ficheiro | Responsabilidade |
|---|---|
| `lib/apiClient.ts` | Cliente HTTP único: cookie httpOnly, `AbortSignal`, erros tipados (`ApiError`), params enxutos, monitorização. |
| `lib/performanceMonitor.ts` | Regista tempo de resposta e erros por endpoint. Em dev: `window.__innovaPerf.getStats()`. |
| `lib/queryClient.ts` | `QueryClient` configurado: camadas de cache (`STALE_TIME`), retry com exponential backoff (sem repetir 4xx). |
| `lib/queryKeys.ts` | Factory central de query-keys (cache/dedup/invalidação consistentes). |
| `hooks/useApiQuery.ts` | `useApiQuery` (GET), `useApiMutation`, `useOptimisticMutation`. |
| `hooks/useDebounce.ts` | Debounce para campos de pesquisa. |
| `providers/ReactQueryProvider.tsx` | Montado em `app/layout.tsx`. |

## As 10 regras → onde estão aplicadas

1. **Sem waterfall / paralelo** — cada `useApiQuery` é independente e corre em paralelo (ver `dashboard/page.tsx`).
2. **Caching estratégico** — `STALE_TIME.STATIC|SEMI_STATIC|DYNAMIC|REALTIME` em `lib/queryClient.ts`.
3. **Loading states** — `isLoading` (1ª carga) e `isFetching` (refetch em fundo).
4. **Optimistic UI** — `useOptimisticMutation` (ver detalhe do beneficiário).
5. **Retry com backoff** — global no `QueryClient` (`retry` + `retryDelay`).
6. **Biblioteca especializada** — React Query.
7. **Payloads enxutos** — `apiClient` omite params `null`/`''`; pede só o necessário.
8. **Polling inteligente** — `refetchInterval` (alertas do dashboard a 60s).
9. **Cancelamento** — o `signal` do React Query é passado ao `fetch`; aborta ao desmontar/mudar key.
10. **Monitorização** — `performanceMonitor` regista tempo e erros de cada pedido.

## Como migrar uma página (receita)

### Antes
```tsx
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
useEffect(() => {
  fetch(`${API}/recurso?page=${page}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  })
    .then(r => r.json()).then(setData).finally(() => setLoading(false));
}, [page]);
```

### Depois
```tsx
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';

const params = { page, limit: 20, search };          // null/'' são omitidos
const { data, isLoading, isFetching, isError, error, refetch } =
  useApiQuery<RecursoList>(
    queryKeys.recurso.list(params), '/recurso',
    { params, staleTime: STALE_TIME.DYNAMIC, placeholderData: keepPreviousData },
  );
```

### Mutação com Optimistic UI
```tsx
const add = useOptimisticMutation<Detail, NewItem>({
  key: queryKeys.recurso.detail(id),
  mutationFn: (item) => apiClient.post(`/recurso/${id}/itens`, item),
  applyOptimistic: (prev, item) =>
    prev && { ...prev, itens: [{ ...item, id: `optimistic-${Date.now()}`, _optimistic: true }, ...prev.itens] },
  onError: (e) => alert(e.message),
});
add.mutate(form); // a UI actualiza já; rollback automático em erro
```

### Mutação simples (invalida listas)
```tsx
const create = useApiMutation(
  (body) => apiClient.post('/recurso', body),
  { invalidateKeys: [queryKeys.recurso.lists()] },
);
```

## Regras ao migrar

- **Nunca** usar `localStorage`/`Authorization: Bearer` — a auth é cookie httpOnly via `apiClient`.
- Adicionar a key do recurso em `lib/queryKeys.ts` antes de usar.
- Escolher o `staleTime` certo: catálogos/roles → `STATIC`; listas → `DYNAMIC`.
- Pesquisa: envolver o termo em `useDebounce` e pôr `enabled: term.length >= 2`.
- Paginação: `placeholderData: keepPreviousData` evita o flash entre páginas.

## Páginas já migradas (referência)
- `app/(platform)/dashboard/page.tsx` — paralelo, dedup de alerts (3×→1×), polling, debounce na pesquisa.
- `app/(platform)/crm/beneficiaries/page.tsx` — lista com debounce + paginação suave.
- `app/(platform)/crm/beneficiaries/[id]/page.tsx` — detalhe com cancelamento + optimistic UI.

Restam ~75 páginas com o padrão antigo (`useEffect`+`fetch`). Aplicar esta receita a cada uma.
