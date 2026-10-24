'use client';

import { useState } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Bell, ListChecks, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Alert } from '../types';
import { SEVERITY, SectionHeader, timeAgo } from './shared';

interface AlertsTabProps {
  alerts: Alert[];
  onResolve: (id: string) => void;
}

type AlertFilter = 'ALL' | 'CRITICAL' | 'WARNING';

const ALERT_FILTERS: Array<{
  key: AlertFilter;
  label: string;
  icon: typeof Bell;
}> = [
  { key: 'ALL', label: 'Todos', icon: ListChecks },
  { key: 'CRITICAL', label: 'Críticos', icon: TriangleAlert },
  { key: 'WARNING', label: 'Avisos', icon: Bell },
];

export function AlertsTab({ alerts, onResolve }: AlertsTabProps) {
  const [filter, setFilter] = useState<AlertFilter>('ALL');
  const shown =
    filter === 'ALL' ? alerts : alerts.filter((a) => a.severity === filter);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <SectionHeader
          title="Alertas de Sistema"
          sub="Monitorização automática de performance, integrações e compliance"
        />
        {/* Separadores no desenho do separador Talento (dashboard-rh):
            moldura com borda, activo em navy #0F1F3D. */}
        <div className="flex flex-col gap-1 rounded-panel border border-border bg-surface p-1.5 shadow-sm">
          {ALERT_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              className={cn(
                'flex items-center justify-center gap-2 rounded-control px-3 py-1 font-body text-xs font-medium transition-colors',
                filter === f.key
                  ? 'bg-[#0F1F3D] text-canvas shadow-sm'
                  : 'text-ink-muted hover:bg-surface-sunken hover:text-ink',
              )}
            >
              <f.icon size={13} strokeWidth={1.75} />
              {f.label}
            </button>
          ))}
        </div>
      </div>
      {shown.length === 0 && (
        <Card>
          <CardBody>
            <p className="font-body text-sm text-ink-muted">
              Sem alertas nesta categoria.
            </p>
          </CardBody>
        </Card>
      )}
      <div className="flex flex-col gap-3">
        {shown.map((alert) => {
          const sev = SEVERITY[alert.severity];
          return (
            <Card key={alert.id} className={cn('border-l-2', sev.border)}>
              <CardBody className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="mb-1.5 flex items-center gap-2">
                    <Badge intent={sev.intent} dot={false}>
                      {sev.label}
                    </Badge>
                    <span className="font-body text-[11px] uppercase tracking-wide text-ink-faint">
                      {alert.category}
                    </span>
                    <span className="font-body text-[11px] text-ink-faint">
                      · {timeAgo(alert.createdAt)}
                    </span>
                  </div>
                  <p className="font-body text-sm font-semibold text-ink">
                    {alert.title}
                  </p>
                  <p className="mt-1 font-body text-sm leading-relaxed text-ink-muted">
                    {alert.message}
                  </p>
                </div>
                <Button
                  intent="ghost"
                  size="sm"
                  onClick={() => onResolve(alert.id)}
                >
                  Resolver
                </Button>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
