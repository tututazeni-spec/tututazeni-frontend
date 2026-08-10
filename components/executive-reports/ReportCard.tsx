// components/executive-reports/ReportCard.tsx
// Cartão de relatório usado na lista. Extraído de
// app/(platform)/executive-reports/page.tsx.

'use client';

import { formatDate as fmtDate } from '@/lib/format';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar } from './atoms';
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
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className={`text-xs px-2 py-0.5 rounded font-medium ${typeCfg.cls}`}
            >
              {typeCfg.icon} {typeCfg.label}
            </span>
            <StatusBadge value={report.status} map={STATUS_CFG} />
            {report.confidentiality === 'CONFIDENTIAL' && (
              <span className="text-xs text-gray-400">🔒 Confidencial</span>
            )}
          </div>
          <div className="text-sm font-semibold text-gray-900 line-clamp-1">
            {report.title}
          </div>
          {report.period && (
            <div className="text-xs text-gray-400 mt-0.5">
              📅 {report.period}
            </div>
          )}
        </div>
      </div>

      {/* Mini KPI overview */}
      <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
        <span>📊 {report.metrics.length} KPIs</span>
        {redCount > 0 && (
          <span className="text-red-600 font-medium">
            🔴 {redCount} em risco
          </span>
        )}
        {report.risks.length > 0 && (
          <span>⚠ {report.risks.length} risco(s)</span>
        )}
        {report._count && <span>👁 {report._count.accessLogs} acessos</span>}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <Avatar
            name={report.generatedBy.fullName}
            avatarUrl={report.generatedBy.avatarUrl}
            size="sm"
          />
          <span>{report.generatedBy.fullName}</span>
        </div>
        <span>{fmtDate(report.createdAt)}</span>
      </div>
    </div>
  );
}
