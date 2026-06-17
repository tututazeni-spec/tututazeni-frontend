'use client';

// ─── app/(dashboard)/attendance/page.tsx ─────────────────────────────────────
// INNOVA — Módulo de Presenças (Attendance)
// Dependências: lucide-react, Tailwind CSS
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import {
  Clock, LogIn, LogOut, QrCode, MapPin, Users, Calendar,
  CheckCircle2, XCircle, AlertCircle, TrendingUp, TrendingDown,
  BarChart3, FileText, Bell, ChevronRight, Search, Filter,
  RefreshCcw, Download, Plus, Eye, Check, X, Loader2,
  Briefcase, Moon, Sun, Sunset, Zap, Coffee, ArrowUpRight,
  UserCheck, UserX, Timer, Award,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type AttendanceStatus =
  | 'PRESENT' | 'LATE' | 'PARTIAL' | 'ABSENT'
  | 'JUSTIFIED' | 'REMOTE' | 'ON_LEAVE' | 'HOLIDAY' | 'RECORDED';

type LeaveType = 'VACATION' | 'SICK_LEAVE' | 'MATERNITY' | 'PATERNITY'
  | 'JUSTIFIED_ABSENCE' | 'BEREAVEMENT' | 'TRAINING' | 'OTHER';

type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

interface AttendanceRecord {
  id: number;
  userId: number;
  date: string;
  status: AttendanceStatus;
  context: string;
  method: string;
  clockIn?: string;
  clockOut?: string;
  workMinutes?: number;
  hoursWorked?: number;
  overtimeMinutes?: number;
  locationLabel?: string;
  notes?: string;
  user?: { id: number; name: string; email: string; employee?: { department: string; avatarUrl?: string } };
}

interface DashboardData {
  date: string;
  kpis: {
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    checkedInNow: number;
    pendingLeaves: number;
    pendingJustifications: number;
    pendingOvertime: number;
    attendanceRate: number;
  };
  presentList: Array<{ id: number; name: string; department: string; clockIn: string; status: string }>;
  absentList:  Array<{ id: number; name: string; department: string }>;
  lateList:    Array<{ id: number; name: string; clockIn: string }>;
}

interface LeaveBalance {
  type: string;
  entitled: number;
  used: number;
  remaining: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; dot: string; icon: any }> = {
  PRESENT:   { label: 'Presente',   color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', icon: CheckCircle2 },
  LATE:      { label: 'Atrasado',   color: 'bg-amber-100 text-amber-700',    dot: 'bg-amber-500',   icon: Clock },
  PARTIAL:   { label: 'Parcial',    color: 'bg-blue-100 text-blue-700',      dot: 'bg-blue-400',    icon: Timer },
  ABSENT:    { label: 'Ausente',    color: 'bg-red-100 text-red-700',        dot: 'bg-red-500',     icon: XCircle },
  JUSTIFIED: { label: 'Justificado',color: 'bg-violet-100 text-violet-700',  dot: 'bg-violet-500',  icon: FileText },
  REMOTE:    { label: 'Remoto',     color: 'bg-cyan-100 text-cyan-700',      dot: 'bg-cyan-500',    icon: Briefcase },
  ON_LEAVE:  { label: 'Licença',    color: 'bg-indigo-100 text-indigo-700',  dot: 'bg-indigo-400',  icon: Calendar },
  HOLIDAY:   { label: 'Feriado',    color: 'bg-gray-100 text-gray-600',      dot: 'bg-gray-400',    icon: Sun },
  RECORDED:  { label: 'Gravação',   color: 'bg-purple-100 text-purple-700',  dot: 'bg-purple-400',  icon: Award },
};

const LEAVE_LABELS: Record<LeaveType, string> = {
  VACATION:          'Férias',
  SICK_LEAVE:        'Licença Médica',
  MATERNITY:         'Licença Maternidade',
  PATERNITY:         'Licença Paternidade',
  JUSTIFIED_ABSENCE: 'Falta Justificada',
  BEREAVEMENT:       'Luto',
  TRAINING:          'Formação Externa',
  OTHER:             'Outras Licenças',
};

const LEAVE_STATUS_CONFIG: Record<LeaveStatus, { label: string; color: string }> = {
  PENDING:   { label: 'Pendente',  color: 'bg-amber-100 text-amber-700' },
  APPROVED:  { label: 'Aprovado',  color: 'bg-emerald-100 text-emerald-700' },
  REJECTED:  { label: 'Rejeitado', color: 'bg-red-100 text-red-700' },
  CANCELLED: { label: 'Cancelado', color: 'bg-gray-100 text-gray-500' },
};

// ─── Hooks (React Query) ──────────────────────────────────────────────────────

function useDashboard() {
  // Presenças ao vivo → polling de 60s.
  const q = useApiQuery<DashboardData>(
    queryKeys.attendance.dashboard(), '/attendance/dashboard',
    { staleTime: STALE_TIME.DYNAMIC, refetchInterval: 60_000 },
  );
  return { data: q.data ?? null, loading: q.isLoading, refetch: q.refetch };
}

function useMyAttendance(from?: string, to?: string) {
  const params = { from, to };
  const q = useApiQuery<any>(
    queryKeys.attendance.my(params), '/attendance/my',
    { params, staleTime: STALE_TIME.DYNAMIC },
  );
  return { data: q.data ?? null, loading: q.isLoading, refetch: q.refetch };
}

function useLeaveBalance() {
  const q = useApiQuery<LeaveBalance[]>(
    queryKeys.attendance.leaveBalance(), '/attendance/my/leave-balance',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  return q.data ?? [];
}

// ─── Small Components ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: AttendanceStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.ABSENT;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

function KpiTile({
  label, value, icon: Icon, sub, color = 'blue', trend,
}: {
  label: string; value: string | number; icon: any; sub?: string;
  color?: 'blue' | 'emerald' | 'amber' | 'red' | 'violet'; trend?: 'up' | 'down';
}) {
  const colors = {
    blue:    'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber:   'bg-amber-50 text-amber-600 border-amber-100',
    red:     'bg-red-50 text-red-600 border-red-100',
    violet:  'bg-violet-50 text-violet-600 border-violet-100',
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-xl border ${colors[color]}`}>
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        {trend === 'up'   && <ArrowUpRight size={14} className="text-emerald-500 flex-shrink-0 mt-1" />}
        {trend === 'down' && <TrendingDown size={14} className="text-red-400 flex-shrink-0 mt-1" />}
      </div>
    </div>
  );
}

function Avatar({ name, src, size = 'sm' }: { name: string; src?: string; size?: 'sm' | 'md' }) {
  const s = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  const colors = ['bg-violet-500','bg-blue-500','bg-emerald-500','bg-amber-500','bg-rose-500'];
  const color  = colors[name.charCodeAt(0) % colors.length];
  if (src) return <img src={src} alt={name} className={`${s} rounded-full object-cover`} />;
  return (
    <div className={`${s} ${color} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}>
      {name.split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase()}
    </div>
  );
}

function MinutesToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h${m > 0 ? ` ${m}m` : ''}`;
}

// ─── Clock-in Widget ──────────────────────────────────────────────────────────

function ClockWidget({ onAction }: { onAction: () => void }) {
  const [time, setTime]     = useState(new Date());
  const [status, setStatus] = useState<'idle' | 'checked-in' | 'checked-out'>('idle');
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [error, setError]   = useState('');
  const [notes, setNotes]   = useState('');

  // Relógio ao vivo (sem rede).
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Verificar se já tem clock-in hoje (query cacheada).
  const todayStr = new Date().toISOString().split('T')[0];
  const { data: todayData } = useApiQuery<any>(
    queryKeys.attendance.my({ from: todayStr }), '/attendance/my',
    { params: { from: todayStr }, staleTime: STALE_TIME.DYNAMIC },
  );

  useEffect(() => {
    if (!todayData || status !== 'idle') return;
    const rec = todayData.records?.find((r: any) => {
      const d = new Date(r.date).toDateString();
      return d === new Date().toDateString() && r.context === 'WORK';
    });
    if (rec?.clockIn && !rec.clockOut) {
      setStatus('checked-in');
      setClockInTime(rec.clockIn);
    } else if (rec?.clockOut) {
      setStatus('checked-out');
      setClockInTime(rec.clockIn);
    }
  }, [todayData, status]);

  const clockIn = useApiMutation(
    () => apiClient.post('/attendance/clock-in', { method: 'MANUAL', context: 'WORK', notes }),
    {
      invalidateKeys: [queryKeys.attendance.all],
      onSuccess: () => {
        setStatus('checked-in');
        setClockInTime(time.toTimeString().slice(0, 5));
        onAction();
      },
      onError: (e) => setError(e.message),
    },
  );

  const clockOut = useApiMutation(
    () => apiClient.post('/attendance/clock-out', {}),
    {
      invalidateKeys: [queryKeys.attendance.all],
      onSuccess: () => { setStatus('checked-out'); onAction(); },
      onError: (e) => setError(e.message),
    },
  );

  const loading = clockIn.isPending || clockOut.isPending;
  const handleClockIn = () => { setError(''); clockIn.mutate(undefined); };
  const handleClockOut = () => { setError(''); clockOut.mutate(undefined); };

  const timeStr = time.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = time.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg">
      <div className="text-center mb-6">
        <p className="text-blue-200 text-sm capitalize">{dateStr}</p>
        <p className="text-5xl font-bold mt-1 tabular-nums tracking-tight">{timeStr}</p>
      </div>

      {status === 'idle' && (
        <div className="space-y-3">
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notas (opcional)..."
            rows={2}
            className="w-full px-3 py-2 text-sm bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none"
          />
          <button
            onClick={handleClockIn}
            disabled={loading}
            className="w-full py-3 bg-white text-blue-700 font-bold rounded-2xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
            Check-in
          </button>
        </div>
      )}

      {status === 'checked-in' && (
        <div className="space-y-3">
          <div className="bg-white/10 rounded-2xl p-3 text-center">
            <p className="text-blue-200 text-xs">Entrada registada</p>
            <p className="text-2xl font-bold mt-0.5">{clockInTime}</p>
          </div>
          <button
            onClick={handleClockOut}
            disabled={loading}
            className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
            Check-out
          </button>
        </div>
      )}

      {status === 'checked-out' && (
        <div className="bg-white/10 rounded-2xl p-4 text-center">
          <CheckCircle2 size={28} className="mx-auto mb-2 text-emerald-300" />
          <p className="text-sm text-blue-100">Dia registado com sucesso</p>
          <p className="text-xs text-blue-200 mt-0.5">Entrada: {clockInTime}</p>
        </div>
      )}

      {error && (
        <div className="mt-3 p-2.5 bg-red-500/20 border border-red-400/30 rounded-xl text-xs text-red-200 text-center">
          {error}
        </div>
      )}
    </div>
  );
}

// ─── Leave Request Modal ──────────────────────────────────────────────────────

function LeaveModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm]   = useState({ type: 'VACATION', startDate: '', endDate: '', reason: '', halfDay: false });
  const [error, setError] = useState('');

  const submit = useApiMutation(
    () => apiClient.post('/attendance/leaves', form),
    {
      invalidateKeys: [queryKeys.attendance.all],
      onSuccess: () => { onSuccess(); onClose(); },
      onError: (e) => setError(e.message),
    },
  );
  const loading = submit.isPending;

  const handleSubmit = () => {
    if (!form.startDate || !form.endDate || !form.reason) { setError('Preencha todos os campos'); return; }
    setError('');
    submit.mutate(undefined);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900">Solicitar Licença</h2>
            <p className="text-sm text-gray-500 mt-0.5">Preencha os dados da solicitação</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-4">
          {error && <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm"><AlertCircle size={16}/>{error}</div>}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de Licença</label>
            <select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              {Object.entries(LEAVE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Início <span className="text-red-500">*</span></label>
              <input type="date" value={form.startDate} onChange={e => setForm(f => ({...f, startDate: e.target.value}))}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fim <span className="text-red-500">*</span></label>
              <input type="date" value={form.endDate} onChange={e => setForm(f => ({...f, endDate: e.target.value}))}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Motivo <span className="text-red-500">*</span></label>
            <textarea value={form.reason} onChange={e => setForm(f => ({...f, reason: e.target.value}))}
              rows={3} placeholder="Descreva brevemente o motivo..."
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.halfDay} onChange={e => setForm(f => ({...f, halfDay: e.target.checked}))}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm text-gray-700">Meio período</span>
          </label>
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 size={15} className="animate-spin" /> : null}
            Enviar Pedido
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── History Table ────────────────────────────────────────────────────────────

function AttendanceHistory({ records }: { records: AttendanceRecord[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50">
        <h3 className="font-semibold text-gray-900 text-sm">Histórico de Presenças</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/60">
              {['Data', 'Entrada', 'Saída', 'Horas', 'Horas Extra', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {records.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">Nenhum registo encontrado</td></tr>
            )}
            {records.map(r => (
              <tr key={r.id} className="hover:bg-blue-50/20 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {new Date(r.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 font-mono">{r.clockIn ?? '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-600 font-mono">{r.clockOut ?? '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {r.workMinutes ? MinutesToTime(r.workMinutes) : '—'}
                </td>
                <td className="px-4 py-3 text-sm">
                  {(r.overtimeMinutes ?? 0) > 0
                    ? <span className="text-amber-600 font-medium">+{MinutesToTime(r.overtimeMinutes!)}</span>
                    : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Leave Balance Bars ───────────────────────────────────────────────────────

function LeaveBalanceCard({ balances }: { balances: LeaveBalance[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-semibold text-gray-900 text-sm mb-4">Saldo de Licenças</h3>
      <div className="space-y-3">
        {balances.map(b => {
          const pct = b.entitled > 0 ? Math.round((b.used / b.entitled) * 100) : 0;
          const type = b.type as LeaveType;
          return (
            <div key={b.type}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">{LEAVE_LABELS[type] ?? b.type}</span>
                <span className="text-xs font-semibold text-gray-900">{b.remaining} / {b.entitled} dias</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${pct > 80 ? 'bg-red-400' : pct > 50 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

function DashboardTab({ data, loading, refetch }: { data: DashboardData | null; loading: boolean; refetch: () => void }) {
  if (loading) return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
      {Array.from({length:8}).map((_,i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}
    </div>
  );

  if (!data) return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
      <BarChart3 size={48} className="mb-4 opacity-30" />
      <p>Dashboard não disponível</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiTile label="Presentes Hoje"    value={data.kpis.totalPresent}      icon={UserCheck} color="emerald" trend="up" />
        <KpiTile label="Ausentes"          value={data.kpis.totalAbsent}       icon={UserX}     color="red"    trend="down" />
        <KpiTile label="Atrasos"           value={data.kpis.totalLate}         icon={Clock}     color="amber" />
        <KpiTile label="Taxa de Presença"  value={`${data.kpis.attendanceRate}%`} icon={TrendingUp} color="blue" />
        <KpiTile label="Activos Agora"     value={data.kpis.checkedInNow}      icon={Timer}     color="violet" />
        <KpiTile label="Pedidos Licença"   value={data.kpis.pendingLeaves}     icon={Calendar}  color="amber" sub="pendentes" />
        <KpiTile label="Justificativas"    value={data.kpis.pendingJustifications} icon={FileText} color="amber" sub="pendentes" />
        <KpiTile label="Horas Extra"       value={data.kpis.pendingOvertime}   icon={Zap}       color="violet" sub="pendentes" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Presentes */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 className="font-semibold text-gray-900 text-sm">Presentes</h3>
              <span className="text-xs text-gray-400">({data.presentList.length})</span>
            </div>
          </div>
          <div className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
            {data.presentList.length === 0 && (
              <p className="px-5 py-6 text-sm text-gray-400 text-center">Nenhum registo</p>
            )}
            {data.presentList.map(p => (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={p.name} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.name}</p>
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
            <span className="text-xs text-gray-400">({data.absentList.length})</span>
          </div>
          <div className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
            {data.absentList.length === 0 && (
              <p className="px-5 py-6 text-sm text-gray-400 text-center">Nenhuma ausência hoje</p>
            )}
            {data.absentList.map(p => (
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

// ─── Main Page ────────────────────────────────────────────────────────────────

type TabKey = 'overview' | 'my' | 'team' | 'leaves';

export default function AttendancePage() {
  const [tab, setTab]             = useState<TabKey>('overview');
  const [showLeave, setShowLeave] = useState(false);
  const [period, setPeriod]       = useState(() => {
    const now = new Date();
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
      to:   new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0],
    };
  });

  const { data: dashboard, loading: dashLoading, refetch: dashRefetch } = useDashboard();
  const { data: myData, loading: myLoading, refetch: myRefetch }        = useMyAttendance(period.from, period.to);
  const leaveBalance = useLeaveBalance();

  const tabs: Array<{ key: TabKey; label: string; icon: any }> = [
    { key: 'overview', label: 'Visão Geral',     icon: BarChart3 },
    { key: 'my',       label: 'Minhas Presenças', icon: Clock     },
    { key: 'team',     label: 'Equipa',           icon: Users     },
    { key: 'leaves',   label: 'Licenças',         icon: Calendar  },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-5 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Presenças</h1>
            <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
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
              <RefreshCcw size={15} className={dashLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* Left column — clock widget */}
          <div className="w-72 flex-shrink-0 space-y-4">
            <ClockWidget onAction={() => { dashRefetch(); myRefetch(); }} />
            {leaveBalance.length > 0 && <LeaveBalanceCard balances={leaveBalance} />}
          </div>

          {/* Right column — tabs */}
          <div className="flex-1 min-w-0 space-y-5">
            {/* Tab bar */}
            <div className="flex bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 gap-1">
              {tabs.map(t => (
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
              <DashboardTab data={dashboard} loading={dashLoading} refetch={dashRefetch} />
            )}

            {tab === 'my' && (
              <div className="space-y-4">
                {/* Period selector */}
                <div className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <span className="text-sm text-gray-500">Período:</span>
                  <input type="date" value={period.from}
                    onChange={e => setPeriod(p => ({...p, from: e.target.value}))}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <span className="text-gray-400">→</span>
                  <input type="date" value={period.to}
                    onChange={e => setPeriod(p => ({...p, to: e.target.value}))}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                {/* Summary cards */}
                {myData?.summary && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <KpiTile label="Dias Presentes"  value={myData.summary.presentDays}  icon={CheckCircle2} color="emerald" />
                    <KpiTile label="Ausências"        value={myData.summary.absentDays}   icon={XCircle}      color="red" />
                    <KpiTile label="Atrasos"          value={myData.summary.lateDays}     icon={Clock}        color="amber" />
                    <KpiTile label="Taxa de Presença" value={`${myData.summary.attendanceRate}%`} icon={TrendingUp} color="blue" />
                  </div>
                )}

                {myLoading
                  ? <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
                  : <AttendanceHistory records={myData?.records ?? []} />}
              </div>
            )}

            {tab === 'team' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
                  <Users size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">Vista de equipa disponível com role Gestor+</p>
                  <p className="text-xs mt-1">Filtra por departamento, verifica ausências e aprova pedidos</p>
                </div>
              </div>
            )}

            {tab === 'leaves' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900">Meus Pedidos de Licença</h3>
                  <button onClick={() => setShowLeave(true)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors">
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
          onSuccess={() => { myRefetch(); setTab('leaves'); }}
        />
      )}
    </div>
  );
}