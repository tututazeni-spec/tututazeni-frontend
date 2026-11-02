'use client';

// Renderiza os filhos só quando o papel já é conhecido e NÃO é o do instrutor externo.
// Usado nos componentes de telemetria (uso, NPS, desempenho): o backend recusa-os ao externo
// (só alcança o que a fase 3 lhe abre), por isso nem chegam a fazer o pedido.

import type { ReactNode } from 'react';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { isExternalInstructorRole } from '@/lib/roles';

export function NotForExternal({ children }: { children: ReactNode }) {
  const role = useCurrentRole();
  if (!role || isExternalInstructorRole(role)) return null;
  return <>{children}</>;
}
