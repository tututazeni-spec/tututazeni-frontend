// components/onboarding/SectionTitleBar.tsx
// Barra de título dos cards (desenho "titulo do video.jpeg"): faixa clara com
// sombra suave, ícone e título a azul marinho a negrito, separador • e info
// secundária. Partilhada por PlanDetailModal e TemplateDetailModal.

import type { LucideIcon } from 'lucide-react';

export function SectionTitleBar({
  icon: Icon,
  title,
  meta,
}: {
  icon: LucideIcon;
  title: string;
  meta?: string;
}) {
  return (
    <div className="mb-2 flex items-center gap-3 overflow-hidden rounded-card bg-gradient-to-r from-white via-white to-brand-subtle px-4 py-2.5 shadow-[0_2px_10px_rgba(15,31,61,0.10)]">
      <Icon
        size={22}
        strokeWidth={2}
        className="shrink-0 text-brand-dark"
        aria-hidden
      />
      <span className="min-w-0 truncate font-body text-sm font-extrabold text-brand-dark">
        {title}
      </span>
      {meta && (
        <>
          <span aria-hidden className="text-ink-faint">
            •
          </span>
          <span className="font-body text-xs text-ink-faint">{meta}</span>
        </>
      )}
    </div>
  );
}
