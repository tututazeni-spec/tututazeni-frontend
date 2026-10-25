# Regras do design system (Fase 1)

Fonte única: `app/globals.css` (`@theme`). O lint (`design/tokens-only`,
`react/forbid-elements`) sinaliza desvios como `warn` em `app/` e `components/`.

| Tema | Regra |
|---|---|
| Cor de marca | `bg-brand`, `text-brand`, `text-brand-muted`, `border-brand-line`, `bg-brand-soft` — nunca `[#0F1F3D]`, `[#49658A]`, `[#E3EAF4]` |
| Cor de estado | `success` / `warning` / `danger` / `info` com `-subtle` (fundo) e `-ink` (texto) — nunca `red-500`, `green-100`… |
| Raios | `rounded-control` (6) · `rounded-card` (10) · `rounded-panel` (14) · `rounded-pill` — nunca `lg/xl/2xl/3xl` |
| Sombras | `shadow-resting` · `shadow-hover` · `shadow-elevated` |
| Texto | Mínimo `text-micro` (11px). Título de página `text-page`, de secção `text-section` |
| Espaço | Padding de card `p-card` (20px) · dentro da secção `gap-stack` (16px) · entre secções `gap-section` (40px) |
| Cabeçalhos | `PageHeader` (h1, um por ecrã) e `SectionHeader` (h2). Módulos com foto: `ModuleBanner` |
| Controlos | `Button`/`IconButton`, `Input`, `Select`, `Textarea` de `components/ui/` — nunca `<button>`/`<input>`/`<select>` crus |
| Carregamento | `Skeleton` — nunca `animate-pulse` manual nem "A carregar…" em texto |
| Vazio | `EmptyState` (ícone + título + descrição + acção) |
| Ícones | `lucide-react`, `strokeWidth={1.75}` |
| Movimento | `transition-colors` / `transition-shadow` (150ms) — nunca `transition-all` |

Referência viva: rota `/styleguide` (ADMIN).
