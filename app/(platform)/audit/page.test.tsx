// Regressão: o efeito que salta para o primeiro separador disponível
// (quando `view` deixa de estar em `nav` para o role actual) usava
// `// eslint-disable-next-line react-hooks/exhaustive-deps` — o React
// Compiler desiste de optimizar o componente sempre que uma regra de hooks
// está desligada. Fixed reescrevendo `nav` como `useMemo(..., [role])` para
// o efeito poder depender de `[nav, view]` sem disable nem loop infinito.
// Este teste garante que o comportamento (saltar de "logs" para "Apagados"
// quando o role é DIRECTOR, que não vê "logs") continua correcto.
import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

let currentRole: string | undefined = 'ADMIN';
vi.mock('@/hooks/useCurrentRole', () => ({
  useCurrentRole: () => currentRole,
}));

vi.mock('@/components/audit/LogsView', () => ({ LogsView: () => <div>logs-view</div> }));
vi.mock('@/components/audit/StatsView', () => ({ StatsView: () => <div>stats-view</div> }));
vi.mock('@/components/audit/AnomaliesView', () => ({
  AnomaliesView: () => <div>anomalies-view</div>,
}));
vi.mock('@/components/audit/TimelineView', () => ({
  TimelineView: () => <div>timeline-view</div>,
}));
vi.mock('@/components/audit/DeletedCyclesView', () => ({
  DeletedCyclesView: () => <div>deleted-view</div>,
}));

import AuditPage from './page';

describe('AuditPage — separador por role', () => {
  test('ADMIN arranca em Logs', () => {
    currentRole = 'ADMIN';
    render(<AuditPage />);
    expect(screen.getByText('logs-view')).toBeInTheDocument();
  });

  test('DIRECTOR (sem acesso a Logs) salta automaticamente para Apagados', () => {
    currentRole = 'DIRECTOR';
    render(<AuditPage />);
    expect(screen.getByText('deleted-view')).toBeInTheDocument();
    expect(screen.queryByText('logs-view')).not.toBeInTheDocument();
  });
});
