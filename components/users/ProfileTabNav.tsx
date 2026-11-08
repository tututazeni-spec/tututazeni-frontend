// components/users/ProfileTabNav.tsx
// Cabeçalho "Funções e Permissões" do perfil do colaborador (design de
// public/images/funções do user.jpeg): painel com ícone de escudo + título e,
// por baixo, os separadores em pílulas brancas. O separador activo (o que foi
// clicado) fica azul-marinho #0F1F3D (--color-brand-ink) com letras brancas.

'use client';

import { ShieldUser } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface ProfileTabNavItem {
  id: string;
  label: string;
}

interface ProfileTabNavProps {
  items: readonly ProfileTabNavItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

export function ProfileTabNav({
  items,
  value,
  onChange,
  className,
}: ProfileTabNavProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-panel border border-white/70 bg-gradient-to-br from-white via-brand-soft to-primary/20 p-4 shadow-[0_8px_32px_rgba(31,38,135,0.10)] sm:p-5',
        className,
      )}
    >
      <div className="mb-4 flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-primary shadow-sm">
          <ShieldUser size={30} strokeWidth={1.75} />
        </span>
        <span aria-hidden className="h-8 w-px bg-brand-line" />
        <h3 className="font-body text-2xl font-semibold text-brand-ink">
          Funções e Permissões
        </h3>
      </div>

      <div
        role="tablist"
        aria-label="Separadores do perfil"
        className="flex flex-wrap gap-2.5"
      >
        {items.map((item) => {
          const active = item.id === value;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(item.id)}
              className={cn(
                'rounded-full border px-5 py-2.5 font-body text-sm font-medium shadow-sm transition-colors duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ink/40',
                active
                  ? 'border-transparent bg-brand-ink text-white shadow-md hover:bg-brand-ink hover:text-white'
                  : 'border-white/80 bg-white/80 text-brand-ink hover:border-brand-ink/40 hover:bg-white',
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
