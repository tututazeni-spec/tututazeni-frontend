'use client';
// components/crm/partners/PartnersShell.tsx
//
// Configuração do CrmShell para parceiros (ver CrmShell).

import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  CalendarClock,
  FileBarChart,
  Flag,
  Handshake,
  LayoutDashboard,
  Plus,
} from 'lucide-react';
import { CrmShell, type CrmNavItem } from '../CrmShell';

const BASE = '/crm/partners';

const ITEMS: readonly CrmNavItem[] = [
  { label: 'Lista', hint: 'Todos os parceiros', icon: Handshake, href: BASE },
  {
    label: 'Painel',
    hint: 'Visão geral',
    icon: LayoutDashboard,
    href: `${BASE}/dashboard`,
  },
  {
    label: 'Contratos a expirar',
    hint: 'Renovações próximas',
    icon: CalendarClock,
    href: `${BASE}/expiring-contracts`,
  },
  {
    label: 'Marcos em atraso',
    hint: 'Acção necessária',
    icon: Flag,
    href: `${BASE}/overdue-milestones`,
  },
  {
    label: 'Relatório',
    hint: 'Análise e exportação',
    icon: FileBarChart,
    href: `${BASE}/report`,
  },
];

export function PartnersShell({ children }: { children: ReactNode }) {
  return (
    <CrmShell
      title="Parceiros"
      banner="/images/crm parceiros.jpg"
      base={BASE}
      items={ITEMS}
      action={
        <Link
          href={`${BASE}/novo`}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#0F1F3D] px-5 py-3 font-body text-sm font-bold text-white shadow-lg transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F1F3D]/40"
        >
          <Plus className="h-4 w-4" />
          Novo Parceiro
        </Link>
      }
    >
      {children}
    </CrmShell>
  );
}
