// components/onboarding/SectionTitleBar.tsx
// Barra de título dos cards (desenho "titulo do video.jpeg"): faixa clara com
// sombra suave, ícone e título a azul marinho a negrito, separador • e info
// secundária. Partilhada por PlanDetailModal e TemplateDetailModal.

import { ChevronDown, type LucideIcon } from 'lucide-react';

export function SectionTitleBar({
  icon: Icon,
  title,
  meta,
  expanded,
  onToggle,
}: {
  icon: LucideIcon;
  title: string;
  meta?: string;
  /** Com `onToggle`, a barra passa a ser um botão (acordeão). */
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const bar = (
    <>
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
      {onToggle && (
        <ChevronDown
          size={18}
          strokeWidth={2}
          aria-hidden
          className={`ml-auto shrink-0 text-brand-dark transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      )}
    </>
  );
  const cls =
    'mb-2 flex w-full items-center gap-3 overflow-hidden rounded-card bg-gradient-to-r from-white via-white to-brand-subtle px-4 py-2.5 text-left shadow-[0_2px_10px_rgba(15,31,61,0.10)]';
  if (onToggle) {
    return (
      <button
        type="button"
        aria-expanded={expanded}
        onClick={onToggle}
        className={`${cls} cursor-pointer`}
      >
        {bar}
      </button>
    );
  }
  return <div className={cls}>{bar}</div>;
}
