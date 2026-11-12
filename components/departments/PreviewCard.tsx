// components/departments/PreviewCard.tsx
// Cartão de resumo partilhado pelas abas do módulo Departamentos (Responsáveis,
// Colaboradores, Hierarquia): mesmo desenho do painel de Estrutura
// organizacional, mas a sobrepor a tabela em vez de a empurrar.

'use client';

import type { ReactNode } from 'react';
import { X, type LucideIcon } from 'lucide-react';
import { HeaderIllustration, PreviewField } from './StructureView';

export interface PreviewCardField {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
}

interface PreviewCardProps {
  /** Texto de acessibilidade do painel. */
  ariaLabel: string;
  /** Avatar / ícone circular do cabeçalho. */
  lead: ReactNode;
  title: string;
  subtitle?: string | null;
  fields: PreviewCardField[];
  /** Botões da secção "Acções" (omitida se não houver). */
  actions?: ReactNode;
  onClose: () => void;
}

export const PREVIEW_ACTION_BUTTON =
  'mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-panel border border-brand bg-surface text-base font-semibold text-brand transition-opacity duration-200 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';

export function PreviewCard({
  ariaLabel,
  lead,
  title,
  subtitle,
  fields,
  actions,
  onClose,
}: PreviewCardProps) {
  return (
    <div className="fixed right-6 top-24 z-40 max-h-[calc(100vh-7rem)] w-[380px] max-w-[calc(100vw-3rem)] overflow-y-auto rounded-[24px] shadow-[0_16px_48px_rgba(15,31,61,0.30)]">
      <aside
        aria-label={ariaLabel}
        className="overflow-hidden rounded-[24px] border border-brand-line bg-brand-soft"
      >
        <div className="relative h-44 overflow-hidden bg-gradient-to-br from-brand to-[#0756D9] px-5 pt-5 sm:h-52">
          <span className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#078BFF]/20" />
          <span className="pointer-events-none absolute -bottom-12 left-1/3 h-32 w-32 rotate-45 rounded-panel bg-white/5" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X size={16} strokeWidth={1.75} />
          </button>
          <div className="relative flex items-center gap-3 pr-8">
            {lead}
            <div className="min-w-0">
              <div className="break-words text-xl font-bold leading-tight text-white">
                {title}
              </div>
              {subtitle && (
                <div className="mt-0.5 text-sm tracking-wider text-[#BFDBFF]">
                  {subtitle}
                </div>
              )}
            </div>
          </div>
          <div className="absolute -bottom-2 right-2 h-28 w-36 sm:h-32 sm:w-40">
            <HeaderIllustration />
          </div>
        </div>

        <div className="relative -mt-5 rounded-t-[24px] bg-surface px-5 pb-5 pt-2">
          <dl>
            {fields.map((f) => (
              <PreviewField key={f.label} icon={f.icon} label={f.label}>
                {f.value}
              </PreviewField>
            ))}
          </dl>
          {actions && (
            <>
              <div className="mt-3 text-xs font-medium uppercase tracking-wide text-[#7186A8]">
                Acções
              </div>
              {actions}
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
