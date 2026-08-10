// components/attendance/DashboardTab.tsx
// Separador "Visão Geral" — KPIs + listas de presentes/ausentes ao
// vivo. Extraído de app/(platform)/attendance/page.tsx.

'use client';

import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Timer,
  TrendingUp,
  UserCheck,
  UserX,
  Zap,
} from 'lucide-react';
import { Avatar, KpiTile, StatusBadge } from './atoms';
import type { AttendanceStatus, DashboardData } from './types';

interface DashboardTabProps {
  data: DashboardData | null;
  loading: boolean;
  refetch: () => void;
}

export function DashboardTab({ data, loading, refetch }: DashboardTabProps) {
  if (loading)
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-28 bg-gray-100 rounded-2xl" />
        ))}
      </div>
    );

  if (!data)
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <BarChart3 size={48} className="mb-4 opacity-30" />
        <p>Dashboard não disponível</p>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiTile
          label="Presentes Hoje"
          value={data.kpis.totalPresent}
          icon={UserCheck}
          color="emerald"
          trend="up"
        />
        <KpiTile
          label="Ausentes"
          value={data.kpis.totalAbsent}
          icon={UserX}
          color="red"
          trend="down"
        />
        <KpiTile
          label="Atrasos"
          value={data.kpis.totalLate}
          icon={Clock}
          color="amber"
        />
        <KpiTile
          label="Taxa de Presença"
          value={`${data.kpis.attendanceRate}%`}
          icon={TrendingUp}
          color="blue"
        />
        <KpiTile
          label="Activos Agora"
          value={data.kpis.checkedInNow}
          icon={Timer}
          color="violet"
        />
        <KpiTile
          label="Pedidos Licença"
          value={data.kpis.pendingLeaves}
          icon={Calendar}
          color="amber"
          sub="pendentes"
        />
        <KpiTile
          label="Justificativas"
          value={data.kpis.pendingJustifications}
          icon={FileText}
          color="amber"
          sub="pendentes"
        />
        <KpiTile
          label="Horas Extra"
          value={data.kpis.pendingOvertime}
          icon={Zap}
          color="violet"
          sub="pendentes"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Presentes */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 className="font-semibold text-gray-900 text-sm">Presentes</h3>
              <span className="text-xs text-gray-400">
                ({data.presentList.length})
              </span>
            </div>
          </div>
          <div className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
            {data.presentList.length === 0 && (
              <p className="px-5 py-6 text-sm text-gray-400 text-center">
                Nenhum registo
              </p>
            )}
            {data.presentList.map((p) => (
              <div
                key={p.id}
                className="px-5 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={p.name} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {p.name}
                    </p>
                    <p className="text-xs text-gray-400">{p.department}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono text-gray-600">{p.clockIn}</p>
                  <StatusBadge status={p.status as AttendanceStatus} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ausentes */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <h3 className="font-semibold text-gray-900 text-sm">Ausentes</h3>
            <span className="text-xs text-gray-400">
              ({data.absentList.length})
            </span>
          </div>
          <div className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
            {data.absentList.length === 0 && (
              <p className="px-5 py-6 text-sm text-gray-400 text-center">
                Nenhuma ausência hoje
              </p>
            )}
            {data.absentList.map((p) => (
              <div key={p.id} className="px-5 py-3 flex items-center gap-3">
                <Avatar name={p.name} />
                <div>
                  <p className="text-sm font-medium text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.department}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
