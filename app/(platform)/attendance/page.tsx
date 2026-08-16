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
import { Button, IconButton } from '@/components/ui/Button';
import { ClockWidget } from '@/components/attendance/ClockWidget';
import { AttendanceHistory } from '@/components/attendance/AttendanceHistory';
import { DashboardTab } from '@/components/attendance/DashboardTab';
import { LeaveBalanceCard } from '@/components/attendance/LeaveBalanceCard';
import { LeaveModal } from '@/components/attendance/LeaveModal';
import { KpiCard } from '@/components/ui/KpiCard';
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
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <div className="bg-surface border-b border-border px-6 py-5 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-ink">Presenças</h1>
            <p className="text-sm text-ink-muted">
              {new Date().toLocaleDateString('pt-PT', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              intent="secondary"
              size="sm"
              onClick={() => setShowLeave(true)}
            >
              <Plus size={15} /> Pedir Licença
            </Button>
            <IconButton
              icon={RefreshCcw}
              label="Atualizar dados"
              intent="secondary"
              onClick={() => dashRefetch()}
              className={dashLoading ? 'animate-spin' : ''}
            />
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
            <div className="flex bg-surface rounded-panel border border-border shadow-sm p-1.5 gap-1">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm rounded-control font-medium transition-colors ${
                    tab === t.key
                      ? 'bg-primary text-canvas shadow-sm'
                      : 'text-ink-muted hover:text-ink hover:bg-surface-sunken'
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
                <div className="flex items-center gap-3 bg-surface rounded-panel border border-border shadow-sm p-4">
                  <span className="text-sm text-ink-muted">Período:</span>
                  <input
                    type="date"
                    value={period.from}
                    onChange={(e) =>
                      setPeriod((p) => ({ ...p, from: e.target.value }))
                    }
                    className="px-3 py-1.5 text-sm border border-border rounded-control focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-ink-muted">→</span>
                  <input
                    type="date"
                    value={period.to}
                    onChange={(e) =>
                      setPeriod((p) => ({ ...p, to: e.target.value }))
                    }
                    className="px-3 py-1.5 text-sm border border-border rounded-control focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Summary cards */}
                {myData?.summary && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <KpiCard
                      label="Dias Presentes"
                      value={myData.summary.presentDays}
                      icon={CheckCircle2}
                      intent="success"
                    />
                    <KpiCard
                      label="Ausências"
                      value={myData.summary.absentDays}
                      icon={XCircle}
                      intent="danger"
                    />
                    <KpiCard
                      label="Atrasos"
                      value={myData.summary.lateDays}
                      icon={Clock}
                      intent="warning"
                    />
                    <KpiCard
                      label="Taxa de Presença"
                      value={`${myData.summary.attendanceRate}%`}
                      icon={TrendingUp}
                      intent="primary"
                    />
                  </div>
                )}

                {myLoading ? (
                  <div className="h-48 bg-surface-sunken rounded-panel animate-pulse" />
                ) : (
                  <AttendanceHistory records={myData?.records ?? []} />
                )}
              </div>
            )}

            {tab === 'team' && (
              <div className="space-y-4">
                <div className="bg-surface rounded-panel border border-border shadow-sm p-8 text-center text-ink-muted">
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
                  <h3 className="font-semibold text-ink">
                    Meus Pedidos de Licença
                  </h3>
                  <Button
                    intent="secondary"
                    size="sm"
                    onClick={() => setShowLeave(true)}
                  >
                    <Plus size={14} /> Novo Pedido
                  </Button>
                </div>
                <div className="bg-surface rounded-panel border border-border shadow-sm p-8 text-center text-ink-muted">
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
