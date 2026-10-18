'use client';
// components/crm/funders/FundersShell.tsx
//
// Configuração do CrmShell para financiadores (ver CrmShell).

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Banknote, FileBarChart, LayoutDashboard, Plus } from 'lucide-react';
import { CrmShell, type CrmNavItem } from '../CrmShell';

const BASE = '/crm/funders';

const ITEMS: readonly CrmNavItem[] = [
  {
    label: 'Lista',
    hint: 'Todos os financiadores',
    icon: Banknote,
    href: BASE,
  },
  {
    label: 'Dashboard',
    hint: 'Visão geral',
    icon: LayoutDashboard,
    href: `${BASE}/dashboard`,
  },
  {
    label: 'Relatório por período',
    hint: 'Análise e exportação',
    icon: FileBarChart,
    href: `${BASE}/report`,
  },
];

export function FundersShell({ children }: { children: ReactNode }) {
  return (
    <CrmShell
      title="Financiadores"
      banner="/images/crm financiadores.jpg"
      base={BASE}
      items={ITEMS}
      action={
        <Link
          href={`${BASE}/novo`}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#0F1F3D] px-5 py-3 font-body text-sm font-bold text-white shadow-lg transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F1F3D]/40"
        >
          <Plus className="h-4 w-4" />
          Novo Financiador
        </Link>
      }
    >
      {children}
    </CrmShell>
  );
}
