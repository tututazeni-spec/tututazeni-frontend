# Deploy do frontend

O frontend corre no **mesmo VPS** do backend, como serviço `frontend` (×2
réplicas) atrás do Caddy. Rota `/` → frontend; `/api/*` → backend.

## Fluxo

1. PR → `Frontend Quality` verde → merge para `main`.
2. `.github/workflows/deploy.yml`:
   - `build`: `docker build` → push `ghcr.io/tututazeni-spec/tututazeni-frontend:sha-<sha>` + `:latest`.
   - `notify-backend`: `repository_dispatch` (`frontend-updated`, `client_payload.tag`)
     para `tututazeni-spec/tututazeni-backend`.
3. O workflow **Deploy** do backend faz o rollout health-gated (pull das duas
   imagens, `up -d`, espera todas as réplicas `app` + `frontend` saudáveis,
   rollback automático em falha).

## Secret necessário (repo do frontend)

`BACKEND_DISPATCH_TOKEN` — PAT fine-grained com `contents: write` **apenas** no
repo `tututazeni-spec/tututazeni-backend`. Sem ele, a imagem é publicada mas o
rollout não arranca (recuperável com *Run workflow* manual no backend).

## Env de runtime

- `PORT=3000`
- `API_INTERNAL_URL=http://app:4000` — usado por SSR / route handlers e pelo
  `rewrites()` do `next.config.ts` (inerte em produção, o Caddy interseta `/api`).

Detalhe completo do rollout: `docs/deploy/runbook.md` no repo do backend.
