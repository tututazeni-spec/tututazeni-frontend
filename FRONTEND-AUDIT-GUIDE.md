# INNOVA — Auditoria de Frontend (Sénior 20 Anos)
> Next.js + TypeScript + Tailwind CSS
> Análise completa antes da produção | 6000 funcionários

---

## COMO USAR ESTE GUIA

```
1. Coloca este ficheiro na raiz do projecto frontend
2. Cola o prompt no Claude Code (última secção)
3. O Claude Code audita e corrige por prioridade
4. Verifica cada ponto antes de ir para produção
```

---

## ⚠️ REGRAS OBRIGATÓRIAS DO PROJECTO INNOVA

```
- fullName (NUNCA name) no modelo User
- Token JWT → httpOnly cookie (NUNCA localStorage)
- Rotas protegidas → middleware.ts obrigatório
- Listas grandes → paginação server-side
- Loading states → em TODAS as operações
- Error Boundary → configurado globalmente
- noindex/nofollow → em todas as páginas
- Datas → formato dd/MM/yyyy (Angola)
- Moeda → AOA (Kwanza)
- Fuso horário → UTC+1 (WAT)
- Backend porta 4000 | Frontend porta 3000
```

---

## PRIORIDADE 1 — CRÍTICO (resolver antes da produção)

### 1.1 — Token JWT — onde está guardado?

```
❌ NUNCA aceitar:
   localStorage.setItem('token', ...)
   sessionStorage.setItem('token', ...)

✅ CORRECTO:
   httpOnly cookie (o servidor define o cookie,
   o JavaScript nunca acede directamente)

Como verificar:
→ Procura no código: localStorage
→ Procura: sessionStorage
→ Procura: document.cookie
→ Verifica lib/auth.ts ou hooks/useAuth.ts

Como corrigir (se estiver em localStorage):
→ Backend envia Set-Cookie: token=...; HttpOnly
→ Frontend nunca toca no token directamente
→ Cada request envia o cookie automaticamente
```

### 1.2 — Middleware de protecção de rotas

```
Deve existir: frontend/middleware.ts

Conteúdo mínimo:
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token');
  const isAuth = !!token;
  const isLoginPage = request.nextUrl.pathname === '/login';

  if (!isAuth && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (isAuth && isLoginPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|favicon.ico).*)'],
};

Como verificar:
→ ls frontend/middleware.ts
→ Se não existir → criar obrigatoriamente
```

### 1.3 — Listas sem paginação

```
O perigo:
→ Listar 6000 utilizadores sem paginar
→ O browser congela
→ O servidor envia dados desnecessários

Verificar em:
→ GET /users → tem ?page= e ?limit= ?
→ GET /courses → paginado?
→ GET /enrollment → paginado?
→ Relatórios RH → paginados?

Solução correcta:
// Backend: sempre retornar
{
  data: [...],
  total: 6000,
  page: 1,
  limit: 20,
  totalPages: 300
}

// Frontend: componente de paginação
```

### 1.4 — Loading states em todas as operações

```
Verificar se TODAS as operações têm:
→ Botão disabled durante o submit
→ Spinner ou skeleton loader durante fetch
→ Mensagem de erro se falhar
→ Mensagem de sucesso se passar

Padrão correcto:
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');

const handleSubmit = async () => {
  setLoading(true);
  setError('');
  try {
    await api.post('/courses', data);
    toast.success('Curso criado com sucesso!');
  } catch (e) {
    setError('Não foi possível criar o curso.');
  } finally {
    setLoading(false);
  }
};

<button disabled={loading}>
  {loading ? 'A guardar...' : 'Guardar'}
</button>
```

### 1.5 — Error Boundary global

```
Sem Error Boundary:
→ Um erro num componente deita TUDO abaixo
→ Ecrã branco para todos os utilizadores

Criar: frontend/app/error.tsx

'use client';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2>Algo correu mal.</h2>
      <button onClick={reset}>Tentar novamente</button>
    </div>
  );
}
```

### 1.6 — Interceptor de 401 automático

```
Quando o token expira → utilizador deve fazer logout automático.
Sem isto → erros silenciosos e dados não carregam.

Criar: frontend/lib/api.ts

import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,  // envia cookies httpOnly
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirou → logout automático
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## PRIORIDADE 2 — IMPORTANTE (semana 1 de produção)

### 2.1 — Bundle size

```
Verificar:
cd frontend
npm run build

Resultado a analisar:
Route (app)                    Size     First Load JS
┌ ○ /login                    5 kB     90 kB        ✅
├ ○ /dashboard                45 kB    130 kB       ✅
├ ○ /courses                  120 kB   205 kB       ⚠️
└ ○ /users                    300 kB   385 kB       ❌

Thresholds:
✅ < 150KB First Load → excelente
⚠️ 150-300KB         → aceitável
❌ > 300KB            → optimizar

Como reduzir:
→ dynamic(() => import('./HeavyComponent'))
→ Remover dependências não usadas
→ Verificar: npx @next/bundle-analyzer
```

### 2.2 — Tipagem TypeScript completa

```
Verificar:
cd frontend
npx tsc --noEmit 2>&1 | head -30

Zero erros = ✅
Erros = corrigir antes da produção

Tipos partilhados com o backend:
→ Criar: shared/types/user.ts
  export interface User {
    id: string;
    fullName: string;   // REGRA: nunca name
    email: string;
    roleId: string;
  }

→ Nunca usar any nas respostas da API
→ Tipar sempre o retorno dos fetch/axios
```

### 2.3 — Cache de dados com React Query

```
Sem cache:
→ Cada navegação refaz o fetch
→ Dashboard de 4.8 min nos E2E
→ Servidor sobrecarregado

Com React Query:
npm install @tanstack/react-query

// hooks/useCourses.ts
import { useQuery } from '@tanstack/react-query';

export function useCourses() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: () => api.get('/courses').then(r => r.data),
    staleTime: 5 * 60 * 1000,  // 5 minutos de cache
  });
}

Impacto esperado:
→ Dashboard de 4.8 min → < 1 min (dados cacheados)
→ 80% menos requests ao backend
```

### 2.4 — Virtualização de listas longas

```
Lista de 6000 utilizadores sem virtualização:
→ Browser cria 6000 elementos DOM
→ Scroll lento e uso excessivo de RAM

Solução:
npm install @tanstack/react-virtual

// Só renderiza os items visíveis no ecrã
// 6000 items → mesmo desempenho que 20 items
```

### 2.5 — Imagens optimizadas

```
Verificar se usa Next.js Image:

// ❌ Nunca:
<img src="/avatar.jpg" />

// ✅ Sempre:
import Image from 'next/image';
<Image src="/avatar.jpg" width={40} height={40} alt="Avatar" />

Impacto:
→ Lazy loading automático
→ Formato WebP automático
→ Redimensionamento automático
→ Core Web Vitals melhoram
```

---

## PRIORIDADE 3 — MELHORIAS (mês 1)

### 3.1 — Acessibilidade

```
Verificar com axe DevTools (extensão Chrome):

Pontos críticos:
→ Todos os inputs têm <label htmlFor="...">?
→ Botões sem texto têm aria-label?
→ Imagens têm alt?
→ Contraste de cores ≥ 4.5:1?
→ Navegação por Tab funciona?

Para 6000 funcionários há garantidamente
pessoas com limitações visuais ou motoras.
WCAG AA é o standard mínimo profissional.
```

### 3.2 — Responsividade mobile

```
Verificar no Chrome DevTools (F12):
→ Toggle Device Toolbar
→ Testa em: 375px (iPhone), 768px (tablet)

Pontos críticos:
→ Tabelas complexas funcionam em mobile?
  (scroll horizontal ou layout alternativo)
→ Sidebar colapsa em mobile?
→ Formulários usáveis com teclado virtual?
→ Touch targets mínimo 44×44px?
```

### 3.3 — SEO e Metadata

```
Criar: frontend/app/layout.tsx

export const metadata = {
  robots: 'noindex, nofollow',  // não indexar no Google
  title: {
    template: '%s | INNOVA',
    default: 'INNOVA',
  },
};

// Cada página tem title único:
// export const metadata = { title: 'Dashboard' };
// → "Dashboard | INNOVA" na aba do browser
```

### 3.4 — Confirmação antes de acções destrutivas

```
Verificar se existe confirmação em:
→ Apagar utilizador
→ Apagar curso
→ Apagar PDI
→ Arquivar funcionário

Padrão:
const confirmar = window.confirm('Tens a certeza?');
// ou melhor: modal de confirmação customizado
if (!confirmar) return;
await api.delete(`/users/${id}`);
```

### 3.5 — Internacionalização Angola

```
Datas:
→ format(date, 'dd/MM/yyyy') ← correcto para Angola
→ format(date, 'MM/dd/yyyy') ← errado (americano)

Moeda:
→ new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA'
  }).format(valor)
→ Resultado: AOA 150.000,00

Fuso horário:
→ Angola é UTC+1 (WAT — West Africa Time)
→ new Date().toLocaleString('pt-AO', {
    timeZone: 'Africa/Luanda'
  })

Números:
→ 1.000.000 (ponto = milhar, vírgula = decimal)
→ Usar pt-AO locale
```

---

## CHECKLIST FINAL ANTES DA PRODUÇÃO

### Segurança
```
□ Token JWT em httpOnly cookie (não localStorage)
□ middleware.ts protege todas as rotas privadas
□ Zero passwords ou secrets em NEXT_PUBLIC_*
□ inputs sem XSS (sem dangerouslySetInnerHTML não sanitizado)
□ noindex/nofollow em todas as páginas
```

### Funcionalidade
```
□ Loading states em todas as operações
□ Mensagens de erro claras (não "Erro 500")
□ Confirmação antes de apagar dados
□ Logout automático quando token expira (401)
□ Error Boundary global configurado
□ Paginação em todas as listas (users, courses, etc.)
```

### Performance
```
□ npm run build sem warnings de bundle > 300KB
□ Next.js Image em todas as imagens
□ Lazy loading em componentes pesados
□ React Query para cache de dados do servidor
□ Listas longas com virtualização
```

### Qualidade
```
□ npx tsc --noEmit → zero erros TypeScript
□ Zero any nas respostas da API
□ Zero console.log esquecidos em produção
□ Variáveis de ambiente em .env.local (nunca no código)
```

---

## PROMPT PARA O CLAUDE CODE

```
Concentra-te APENAS na auditoria e correcção
do frontend INNOVA antes da produção.
NÃO corras testes de carga (Artillery).
NÃO corras testes de API (Bruno CLI).
NÃO modifiques load-tests/ nem bruno/.

Lê o FRONTEND-AUDIT-GUIDE.md na raiz
e executa a auditoria por prioridade.

FASE 1 — DIAGNÓSTICO COMPLETO (não corrigir ainda):
Lê os seguintes ficheiros e reporta o estado:

1. Onde está o token JWT guardado?
   grep -r "localStorage\|sessionStorage\|cookie" frontend/
   grep -r "token\|accessToken" frontend/lib/ frontend/hooks/

2. middleware.ts existe?
   cat frontend/middleware.ts 2>/dev/null

3. Listas têm paginação?
   grep -r "page\|limit\|pagination" frontend/app/

4. Loading states existem?
   grep -r "loading\|isLoading\|disabled" frontend/app/

5. Error Boundary existe?
   cat frontend/app/error.tsx 2>/dev/null

6. Interceptor de 401 existe?
   grep -r "401\|interceptor" frontend/lib/

7. Bundle size:
   cd frontend && npm run build 2>&1 | tail -30

8. Erros TypeScript:
   cd frontend && npx tsc --noEmit 2>&1 | wc -l

Mostra um relatório assim:
✅ ou ❌ para cada ponto
com a localização exacta do problema

FASE 2 — CORRIGE POR PRIORIDADE:
Corrige os pontos ❌ por esta ordem:
1. Token JWT (segurança crítica)
2. middleware.ts (rotas desprotegidas)
3. Error Boundary (crashes)
4. Interceptor 401 (sessão expirada)
5. Paginação (performance)
6. Loading states (UX)
7. Bundle size (se > 300KB)
8. TypeScript errors

Após cada correcção:
- Confirma que o frontend ainda arranca
- npm run dev sem erros
- Faz commit parcial

A cada 20 minutos faz commit:
git add -A
git commit -m "fix: frontend audit - [o que corrigiste]" --no-verify

REGRAS OBRIGATÓRIAS DO INNOVA:
- fullName (nunca name) no modelo User
- Token JWT → httpOnly cookie (NUNCA localStorage)
- Rotas protegidas → middleware.ts
- Listas → paginação server-side
- Backend porta 4000 | Frontend porta 3000
- Angola: datas dd/MM/yyyy, moeda AOA, UTC+1

No final:
git add -A
git commit -m "fix: frontend audit complete - production ready" --no-verify
git push origin main
```

---

*INNOVA — Frontend Audit Guide v1.0*
*Análise de sénior com 20 anos de experiência*
*Verificar antes de produção com 6000 funcionários*
