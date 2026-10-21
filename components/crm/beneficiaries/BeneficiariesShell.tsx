'use client';
// components/crm/beneficiaries/BeneficiariesShell.tsx
//
// Configuração do CrmShell para beneficiários. Client component porque os
// ícones (funções) não atravessam a fronteira server→client do layout.

import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  CalendarClock,
  FileBarChart,
  LayoutDashboard,
  UserPlus,
  Users,
} from 'lucide-react';
import { CrmShell, type CrmNavItem } from '../CrmShell';

const BASE = '/crm/beneficiaries';

const ITEMS: readonly CrmNavItem[] = [
  { label: 'Lista', hint: 'Todos os beneficiários', icon: Users, href: BASE },
  {
    label: 'Painel',
    hint: 'Visão geral do CRM',
    icon: LayoutDashboard,
    href: `${BASE}/dashboard`,
  },
  {
    label: 'Acompanhamentos',
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

export function BeneficiariesShell({ children }: { children: ReactNode }) {
  return (
    <CrmShell
      title="Beneficiários"
      banner="/images/crm beneficiarios.jpg"
      base={BASE}
      items={ITEMS}
      navVariant="pills"
      action={
        <Link
          href={`${BASE}/novo`}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#0F1F3D] px-5 py-3 font-body text-sm font-semibold text-white shadow-lg transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F1F3D]/40"
        >
          <UserPlus size={16} strokeWidth={2} />
          Novo Beneficiário
        </Link>
      }
    >
      {children}
    </CrmShell>
  );
}
