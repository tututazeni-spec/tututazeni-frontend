# Documentação do frontend

Ponto de entrada. Cada guia responde a uma pergunta diferente.

| Quero saber…                                                                                           | Ler                                                          |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| Onde pôr um componente, como desenhar as props, que estados cobrir, acessibilidade, desempenho, testes | [`arquitetura-componentes.md`](./arquitetura-componentes.md) |
| Que cores, raios, sombras e componentes usar (regras que o lint verifica)                              | [`design-system-rules.md`](./design-system-rules.md)         |
| Como ler e escrever dados (React Query, keys, `staleTime`, optimistic UI)                              | [`../DATA-FETCHING-GUIDE.md`](../DATA-FETCHING-GUIDE.md)     |
| Checklist de auditoria antes de produção                                                               | [`../FRONTEND-AUDIT-GUIDE.md`](../FRONTEND-AUDIT-GUIDE.md)   |
| Como fazer deploy                                                                                      | [`deploy.md`](./deploy.md)                                   |
| Histórico de decisões e planos por módulo                                                              | `superpowers/` (specs e plans) e `design-migration/`         |

## Catálogo de componentes

- `npm run storybook` — histórias dos primitivos de `components/ui/` (hoje: Button, EmptyState, AlertCard, Skeleton, PageSkeleton, Pagination, VirtualList).
- Rota `/styleguide` (só ADMIN) — referência viva dentro da app.

## Comandos de verificação

```bash
npx tsc --noEmit            # tipos
npx eslint <ficheiros>      # inclui jsx-a11y e regras do design system (avisos)
npx vitest run <caminho>    # testes (incluem auditoria axe em components/ui/a11y.test.tsx)
npx next build              # tamanho por rota (First Load JS)
```
