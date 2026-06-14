# INNOVA — Frontend

Interface web da plataforma corporativa **Academia Corporativa + Recursos Humanos** da INNOVA.
Construída em **Next.js 15 + React 19 + TypeScript**.

> Backend (API) correspondente: [tututazeni-backend](https://github.com/tututazeni-spec/tututazeni-backend)

---

## 🛠️ Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI | React 19 |
| Linguagem | TypeScript |
| Estilos | Tailwind CSS 4 |
| Estado / dados | Zustand, TanStack React Query |
| HTTP | Axios |
| Ícones | lucide-react |

A aplicação corre na **porta `3000`** e consome a API do backend na **porta `4000`**.

---

## 🚀 Arranque

### Pré-requisitos
- Node.js `20.x`
- Backend INNOVA a correr em `http://localhost:4000`

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
npm run dev            # servidor de desenvolvimento em http://localhost:3000
```

### Produção

```bash
npm run build          # build de produção
npm run start          # arranca o build
```

### Lint

```bash
npm run lint
```

---

## 📁 Estrutura

```
app/
  (platform)/          # páginas autenticadas (dashboard, courses, users, development-plans, ...)
    layout.tsx         # layout com Sidebar + Topbar
  login/               # página de autenticação
  layout.tsx           # layout raiz
components/            # componentes partilhados (Sidebar, Topbar, ...)
hooks/                 # hooks React
lib/                   # utilitários e cliente HTTP
services/              # chamadas à API
store/                 # estado global (Zustand)
providers/             # React Query provider
```

---

## 🔑 Autenticação

O login (`/login`) autentica contra `POST /auth/login` do backend e guarda o token JWT em `localStorage`.
As páginas da área `(platform)` usam esse token no header `Authorization: Bearer <token>`.

---

*Projeto privado — INNOVA.*
