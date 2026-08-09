// components/employees/StatusBadge.tsx
// Badge de estado do colaborador. Extraído verbatim de
// app/(platform)/employees/page.tsx — mantido como implementação local (não
// migrado para o components/ui/StatusBadge.tsx genérico nesta passagem,
// porque a variante 'dot' genérica deriva a cor do indicador de `bg-current`
// (a cor do texto), enquanto aqui o indicador tem uma cor explícita própria
// (STATUS_CONFIG.dot); migrar mudaria o tom visual do ponto — fora do
// âmbito de um refactor puramente estrutural. Candidato a follow-up.

import { STATUS_CONFIG } from './constants';
import type { EmployeeStatus } from '@/hooks/useEmployees';

export interface StatusBadgeProps {
  status: EmployeeStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.INACTIVE;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
