'use client';
// components/crm/beneficiaries/BeneficiariesNav.tsx
//
// Navegação partilhada do CRM de beneficiários (Lista, Dashboard,
// Follow-ups, Relatório) em "glassmorphism": contentor translúcido com
// desfoque e pílulas com ícone, título e subtítulo. A aba activa vem da
// rota actual e ganha gradiente azul, sombra e um visto à direita.
// `NewBeneficiaryButton` é a acção principal e fica FORA da barra, no
// canto superior direito do cabeçalho de cada página.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarClock,
  CircleCheck,
  FileBarChart,
  LayoutDashboard,
  UserPlus,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/cn';

const BASE = '/crm/beneficiaries';

const NAV = [
  { label: 'Lista', hint: 'Todos os beneficiários', icon: Users, href: BASE },
  {
    label: 'Dashboard',
    hint: 'Visão geral do CRM',
    icon: LayoutDashboard,
    href: `${BASE}/dashboard`,
  },
  {
    label: 'Follow-ups',
    hint: 'Acompanhamentos pendentes',
    icon: CalendarClock,
    href: `${BASE}/follow-ups`,
  },
  {
    label: 'Relatório',
    hint: 'Análise por período',
    icon: FileBarChart,
    href: `${BASE}/report`,
  },
];

export function BeneficiariesNav() {
  const pathname = usePathname() ?? '';
  // "Lista" só fica activa na rota exacta, senão ficaria activa em todas.
  const isActive = (href: string) =>
    href === BASE
      ? pathname === BASE
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl"
      >
        <div className="absolute -left-16 top-0 h-40 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-10 bottom-0 h-40 w-72 rounded-full bg-primary/15 blur-3xl" />
      </div>

      <nav
        aria-label="Navegação de beneficiários"
        className="relative rounded-3xl border border-white/60 bg-white/50 p-3 shadow-[0_8px_32px_rgba(31,38,135,0.12)] backdrop-blur-xl"
      >
        <div className="flex flex-wrap items-center justify-center gap-2">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 whitespace-nowrap rounded-full border py-2 pl-2 pr-4 text-left font-body backdrop-blur transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                  active
                    ? 'border-transparent bg-gradient-to-r from-primary to-primary/70 text-white shadow-lg'
                    : 'border-white/70 bg-white/60 text-ink shadow-sm hover:bg-white/80',
                )}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                    active
                      ? 'bg-white/20 text-white'
                      : 'bg-white/70 text-ink/70',
                  )}
                >
                  <Icon size={16} strokeWidth={1.75} />
                </span>
                <span className="flex flex-col items-start leading-tight">
                  <span className="text-sm font-semibold">{item.label}</span>
                  <span
                    className={cn(
                      'text-xs',
                      active ? 'opacity-85' : 'opacity-70',
                    )}
                  >
                    {item.hint}
                  </span>
                </span>
                {active && (
                  <CircleCheck size={16} strokeWidth={2} className="shrink-0" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function NewBeneficiaryButton() {
  return (
    <Link
      href={`${BASE}/novo`}
      className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-ink px-5 py-3 font-body text-sm font-semibold text-white shadow-lg transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
    >
      <UserPlus size={16} strokeWidth={2} />
      Novo Beneficiário
    </Link>
  );
}