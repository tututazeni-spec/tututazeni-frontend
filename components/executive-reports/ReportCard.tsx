// components/executive-reports/ReportCard.tsx
// Cartão de relatório usado na lista. Extraído de
// app/(platform)/executive-reports/page.tsx.

'use client';

import { Lock } from 'lucide-react';
import { formatDate as fmtDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { STATUS_CFG, TYPE_CFG } from './constants';
import type { Report } from './types';

interface ReportCardProps {
  report: Report;
  onClick: () => void;
}

export function ReportCard({ report, onClick }: ReportCardProps) {
  const typeCfg = TYPE_CFG[report.type];
  const redCount = report.metrics.filter((m) => m.status === 'RED').length;

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="cursor-pointer p-5 transition-shadow hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'rounded px-2 py-0.5 font-body text-xs font-medium',
                typeCfg.bg,
                typeCfg.color,
              )}
            >
              {typeCfg.icon} {typeCfg.label}
            </span>
            <StatusBadge value={report.status} map={STATUS_CFG} />
            {report.confidentiality === 'CONFIDENTIAL' && (
              <span className="flex items-center gap-1 font-body text-xs text-ink-faint">
                <Lock size={14} strokeWidth={1.75} /> Confidencial
              </span>
            )}
          </div>
          <div className="line-clamp-1 font-body text-sm font-semibold text-ink">
            {report.title}
          </div>
          {report.period && (
            <div className="mt-0.5 font-body text-xs text-ink-faint">
              📅 {report.period}
            </div>
          )}
        </div>
      </div>

      {/* Mini KPI overview */}
      <div className="mb-3 flex items-center gap-3 font-body text-xs text-ink-faint">
        <span>📊 {report.metrics.length} KPIs</span>
        {redCount > 0 && (
          <span className="font-medium text-danger">🔴 {redCount} em risco</span>
        )}
        {report.risks.length > 0 && <span>⚠ {report.risks.length} risco(s)</span>}
        {report._count && <span>👁 {report._count.accessLogs} acessos</span>}
      </div>

      <div className="flex items-center justify-between font-body text-xs text-ink-faint">
        <div className="flex items-center gap-2">
          <Avatar name={report.generatedBy.fullName} url={report.generatedBy.avatarUrl ?? undefined} size="sm" />
          <span>{report.generatedBy.fullName}</span>
        </div>
        <span>{fmtDate(report.createdAt)}</span>
      </div>
    </Card>
  );
}
