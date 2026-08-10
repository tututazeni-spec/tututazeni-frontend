'use client';

// ─── app/(dashboard)/attendance/page.tsx ─────────────────────────────────────
// INNOVA — Módulo de Presenças (Attendance)
//
// Container: gere separadores/período/modal; delega dados+apresentação
// aos componentes em components/attendance/. Ver memory
// project_innova_component_separation_audit.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCcw,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ClockWidget } from '@/components/attendance/ClockWidget';
import { AttendanceHistory } from '@/components/attendance/AttendanceHistory';
import { DashboardTab } from '@/components/attendance/DashboardTab';
import { LeaveBalanceCard } from '@/components/attendance/LeaveBalanceCard';
import { LeaveModal } from '@/components/attendance/LeaveModal';
import { KpiTile } from '@/components/attendance/atoms';
import {
  useDashboard,
  useLeaveBalance,
  useMyAttendance,
} from '@/components/attendance/hooks';

type TabKey = 'overview' | 'my' | 'team' | 'leaves';

export default function AttendancePage() {
  const [tab, setTab] = useState<TabKey>('overview');
  const [showLeave, setShowLeave] = useState(false);
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split('T')[0],
      to: new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0],
    };
  });

  const {
    data: dashboard,
    loading: dashLoading,
    refetch: dashRefetch,
  } = useDashboard();
  const {
    data: myData,
    loading: myLoading,
    refetch: myRefetch,
  } = useMyAttendance(period.from, period.to);
  const leaveBalance = useLeaveBalance();

  const tabs: Array<{ key: TabKey; label: string; icon: LucideIcon }> = [
    { key: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { key: 'my', label: 'Minhas Presenças', icon: Clock },
    { key: 'team', label: 'Equipa', icon: Users },
    { key: 'leaves', label: 'Licenças', icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-5 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Presenças</h1>
            <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString('pt-PT', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLeave(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Plus size={15} /> Pedir Licença
            </button>
            <button
              onClick={() => dashRefetch()}
              className="p-2 text-gray-500 hover:text-gray-700 border border-gray-200 bg-white rounded-xl hover:bg-gray-50 transition-colors"
            >
              <RefreshCcw
                size={15}
                className={dashLoading ? 'animate-spin' : ''}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* Left column — clock widget */}
          <div className="w-72 flex-shrink-0 space-y-4">
            <ClockWidget
              onAction={() => {
                dashRefetch();
                myRefetch();
              }}
            />
            {leaveBalance.length > 0 && (
              <LeaveBalanceCard balances={leaveBalance} />
            )}
          </div>

          {/* Right column — tabs */}
          <div className="flex-1 min-w-0 space-y-5">
            {/* Tab bar */}
            <div className="flex bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 gap-1">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm rounded-xl font-medium transition-colors ${
                    tab === t.key
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <t.icon size={15} />
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              ))}
            </div>

            {/* Tab content */}
            {tab === 'overview' && (
              <DashboardTab
                data={dashboard}
                loading={dashLoading}
                refetch={dashRefetch}
              />
            )}

            {tab === 'my' && (
              <div className="space-y-4">
                {/* Period selector */}
                <div className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <span className="text-sm text-gray-500">Período:</span>
                  <input
                    type="date"
                    value={period.from}
                    onChange={(e) =>
                      setPeriod((p) => ({ ...p, from: e.target.value }))
                    }
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-400">→</span>
                  <input
                    type="date"
                    value={period.to}
                    onChange={(e) =>
                      setPeriod((p) => ({ ...p, to: e.target.value }))
                    }
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Summary cards */}
                {myData?.summary && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <KpiTile
                      label="Dias Presentes"
                      value={myData.summary.presentDays}
                      icon={CheckCircle2}
                      color="emerald"
                    />
                    <KpiTile
                      label="Ausências"
                      value={myData.summary.absentDays}
                      icon={XCircle}
                      color="red"
                    />
                    <KpiTile
                      label="Atrasos"
                      value={myData.summary.lateDays}
                      icon={Clock}
                      color="amber"
                    />
                    <KpiTile
                      label="Taxa de Presença"
                      value={`${myData.summary.attendanceRate}%`}
                      icon={TrendingUp}
                      color="blue"
                    />
                  </div>
                )}

                {myLoading ? (
                  <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
                ) : (
                  <AttendanceHistory records={myData?.records ?? []} />
                )}
              </div>
            )}

            {tab === 'team' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
                  <Users size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">
                    Vista de equipa disponível com role Gestor+
                  </p>
                  <p className="text-xs mt-1">
                    Filtra por departamento, verifica ausências e aprova pedidos
                  </p>
                </div>
              </div>
            )}

            {tab === 'leaves' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900">
                    Meus Pedidos de Licença
                  </h3>
                  <button
                    onClick={() => setShowLeave(true)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
                  >
                    <Plus size={14} /> Novo Pedido
                  </button>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
                  <Calendar size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Nenhum pedido de licença</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showLeave && (
        <LeaveModal
          onClose={() => setShowLeave(false)}
          onSuccess={() => {
            myRefetch();
            setTab('leaves');
          }}
        />
      )}
    </div>
  );
}
