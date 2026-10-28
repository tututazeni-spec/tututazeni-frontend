'use client';
// components/crm/CrmShell.tsx
//
// Cabeçalho + navegação partilhados pelos 3 sub-módulos do CRM
// (beneficiaries/partners/funders), montado no layout.tsx de cada um.
// Mesmo desenho do dashboard-rh: o ícone ao lado do título e o subtítulo
// seguem a pílula activa (rota actual), com o mesmo texto `hint` da pílula.
// Rotas que não estão em `items` (novo, [id]) têm o seu próprio cabeçalho,
// por isso o shell não renderiza nada nelas.

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CircleCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { pillClass } from '@/components/ui/Pills';

export interface CrmNavItem {
  label: string;
  hint: string;
  icon: LucideIcon;
  href: string;
}

export interface CrmShellProps {
  title: string;
  /** Rota da lista; só fica activa na rota exacta. */
  base: string;
  items: readonly CrmNavItem[];
  /** Acção principal (ex.: "Novo X"), mostrada à direita do título. */
  action?: ReactNode;
  /** 'pills' = separadores no desenho das pílulas do dashboard-rh (Talento). */
  navVariant?: 'glass' | 'pills';
  /** Foto do cabeçalho (em /public). Sem ela, mantém o cabeçalho simples. */
  banner?: string;
  children: ReactNode;
}

export function CrmShell({
  title,
  base,
  items,
  action,
  navVariant = 'glass',
  banner,
  children,
}: CrmShellProps) {
  const pathname = usePathname() ?? '';
  const isActive = (href: string) =>
    href === base
      ? pathname === base
      : pathname === href || pathname.startsWith(`${href}/`);

  const active = items.find((item) => isActive(item.href));
  if (!active) return <>{children}</>;

  const ActiveIcon = active.icon;

  return (
    <>
      <div className="px-6 pt-6">
        {banner ? (
          // Mesmo desenho do banner de app/(platform)/courses/page.tsx: o
          // gradiente #0F1F3D só cobre a metade inferior (o ecrã com o título,
          // à esquerda, fica intacto) e a navegação sobe 2rem para cima da foto.
          <header className="relative h-44 overflow-hidden rounded-panel shadow-[0_8px_32px_rgba(15,31,61,0.18)] sm:h-56">
            <Image
              src={banner}
              alt=""
              fill
              priority
              sizes="(min-width: 1280px) 1216px, 100vw"
              className="object-cover object-center"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-brand/90 via-brand/35 to-transparent"
            />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 px-5 pb-10 sm:px-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-panel bg-white/20 text-white">
                  <ActiveIcon
                    size={22}
                    strokeWidth={1.8}
                    className="transition-all duration-300"
                  />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
                    {title}
                  </h1>
                  <p className="mt-0.5 font-body text-xs text-white/90">
                    {active.hint}
                  </p>
                </div>
              </div>
              {/* O botão de acção é azul-escuro; sobre o gradiente passa a branco
                  e, ao passar o cursor, inverte (azul-escuro com letra branca).
                  A borda branca mantém o contorno visível sobre o gradiente. */}
              <div className="[&_a]:border [&_a]:border-white [&_a]:!bg-surface [&_a]:!text-brand [&_a]:transition-colors [&_a:hover]:!bg-brand [&_a:hover]:!text-white [&_a:hover]:!opacity-100 [&_a:hover]:!brightness-100">
                {action}
              </div>
            </div>
          </header>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-panel bg-primary/10 text-primary">
                <ActiveIcon
                  size={22}
                  strokeWidth={1.8}
                  className="transition-all duration-300"
                />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-ink">
                  {title}
                </h1>
                <p className="mt-0.5 font-body text-xs text-ink-muted">
                  {active.hint}
                </p>
              </div>
            </div>
            {action}
          </div>
        )}

        <div
          className={cn(
            banner && navVariant === 'glass'
              ? 'relative z-10 -mt-8 px-3 sm:px-6'
              : 'mt-6',
          )}
        >
          {navVariant === 'pills' ? (
            <nav
              aria-label={`Navegação de ${title.toLowerCase()}`}
              className="flex flex-wrap gap-2"
            >
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={item === active ? 'page' : undefined}
                  className={pillClass(item === active)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          ) : (
            <div className="relative">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 overflow-hidden rounded-panel"
              >
                <div className="absolute -left-16 top-0 h-40 w-72 rounded-full bg-primary/20 blur-3xl" />
                <div className="absolute -right-10 bottom-0 h-40 w-72 rounded-full bg-primary/15 blur-3xl" />
              </div>

              <nav
                aria-label={`Navegação de ${title.toLowerCase()}`}
                className="relative rounded-panel border border-white/60 bg-white/50 p-3 shadow-[0_8px_32px_rgba(31,38,135,0.12)] backdrop-blur-xl"
              >
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const on = item === active;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={on ? 'page' : undefined}
                        className={cn(
                          'flex items-center gap-3 whitespace-nowrap rounded-full border py-2 pl-2 pr-4 text-left font-body backdrop-blur transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                          on
                            ? 'border-transparent bg-brand text-white shadow-lg'
                            : 'border-white/70 bg-white/60 text-[#20241f] shadow-sm duration-200 hover:scale-105 hover:border-primary hover:bg-white/80 hover:shadow-md motion-reduce:hover:scale-100',
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                            on
                              ? 'bg-white/20 text-white'
                              : 'bg-white/70 text-[#20241f]/70',
                          )}
                        >
                          <Icon size={16} strokeWidth={1.75} />
                        </span>
                        <span className="flex flex-col items-start leading-tight">
                          <span className="text-sm font-semibold">
                            {item.label}
                          </span>
                          <span
                            className={cn(
                              'text-xs',
                              on ? 'opacity-85' : 'opacity-70',
                            )}
                          >
                            {item.hint}
                          </span>
                        </span>
                        {on && (
                          <CircleCheck
                            size={16}
                            strokeWidth={2}
                            className="shrink-0"
                          />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </nav>
            </div>
          )}
        </div>
      </div>
      {children}
    </>
  );
}
