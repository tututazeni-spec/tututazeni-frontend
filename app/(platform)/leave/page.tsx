'use client';

// ─── app/(dashboard)/leave/page.tsx ──────────────────────────────────────────
// INNOVA — Módulo de Gestão de Ausências (Leave Management)
// Deps: lucide-react, Tailwind CSS
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import {
  Calendar, Plus, Clock, Check, X, AlertCircle,
  ChevronLeft, ChevronRight, Users, BarChart3,
  FileText, Loader2, TrendingUp, TrendingDown,
  Bell, Settings, Filter, Download, Eye,
  CheckCircle2, XCircle, Timer, Sun, Briefcase,
  ArrowUpRight, RefreshCcw, ChevronDown,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type LeaveStatus = 'DRAFT'|'PENDING'|'APPROVED'|'REJECTED'|'CANCELLED'|'EXPIRED';
type DurationMode = 'FULL_DAY'|'HALF_AM'|'HALF_PM'|'HOURS';
type LeaveCategory = 'STATUTORY'|'MEDICAL'|'FAMILY'|'TRAINING'|'FLEXIBLE'|'UNPAID'|'OTHER';

interface LeaveType {
  code: string; name: string; category: LeaveCategory;
  color: string; icon: string; isPaid: boolean;
  annualLimit?: number; requiresDocument: boolean;
  allowHalfDay: boolean; active: boolean;
}

interface LeaveBalance {
  leaveTypeCode: string; balance: number; used: number;
  pendingDays: number; futureBalance: number; effectiveBalance: number;
  leaveType: { name: string; code: string; color: string; icon: string };
}

interface LeaveRequest {
  id: number; userId: number; leaveTypeCode: string; status: LeaveStatus;
  startDate: string; endDate: string; workDays: number; reason?: string;
  durationMode: DurationMode;
  leaveType?: LeaveType;
  user?: { id: number; name: string; email: string; employee?: { department: string; avatarUrl?: string } };
  approvals?: Array<{ id: number; level: number; decision?: string; approver: { name: string } }>;
}

interface DashboardData {
  year: number;
  kpis: { pending: number; approved: number; activeNow: number; totalWorkDays: number };
  byType: Array<{ code: string; name: string; count: number; days: number }>;
  byMonth: Array<{ month: number; count: number; days: number }>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<LeaveStatus, { label: string; color: string; icon: any }> = {
  DRAFT:     { label: 'Rascunho',  color: 'bg-gray-100 text-gray-600',      icon: FileText     },
  PENDING:   { label: 'Pendente',  color: 'bg-amber-100 text-amber-700',    icon: Clock        },
  APPROVED:  { label: 'Aprovado',  color: 'bg-emerald-100 text-emerald-700',icon: CheckCircle2 },
  REJECTED:  { label: 'Rejeitado', color: 'bg-red-100 text-red-700',        icon: XCircle      },
  CANCELLED: { label: 'Cancelado', color: 'bg-gray-100 text-gray-500',      icon: X            },
  EXPIRED:   { label: 'Expirado',  color: 'bg-gray-100 text-gray-400',      icon: Timer        },
};

const CATEGORY_LABELS: Record<LeaveCategory, string> = {
  STATUTORY: 'Estatutária', MEDICAL: 'Médica', FAMILY: 'Família',
  TRAINING: 'Formação', FLEXIBLE: 'Flexível', UNPAID: 'Não Remunerada', OTHER: 'Outro',
};

const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

// ─── Hooks (React Query) ──────────────────────────────────────────────────────

function useLeaveTypes() {
  // Catálogo quase imutável → cache longa (STATIC).
  const q = useApiQuery<LeaveType[]>(
    queryKeys.leave.types(), '/leave/types',
    { staleTime: STALE_TIME.STATIC },
  );
  return q.data ?? [];
}

function useMyBalance() {
  const q = useApiQuery<LeaveBalance[]>(
    queryKeys.leave.myBalance(), '/leave/my/balance',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  return { balances: q.data ?? [], loading: q.isLoading, refetch: q.refetch };
}

function useMyRequests() {
  const q = useApiQuery<{ data: LeaveRequest[]; meta: any }>(
    queryKeys.leave.myRequests(), '/leave/my',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  return { data: q.data ?? null, loading: q.isLoading, refetch: q.refetch };
}

function useDashboard() {
  const q = useApiQuery<DashboardData>(
    queryKeys.leave.dashboard(), '/leave/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  return { data: q.data ?? null, loading: q.isLoading, refetch: q.refetch };
}

function usePendingApprovals() {
  // Fila de aprovações → polling de 60s.
  const q = useApiQuery<LeaveRequest[]>(
    queryKeys.leave.pendingApprovals(), '/leave/pending-approvals',
    { staleTime: STALE_TIME.DYNAMIC, refetchInterval: 60_000 },
  );
  return { data: q.data ?? [], loading: q.isLoading, refetch: q.refetch };
}

// ─── Utility Components ───────────────────────────────────────────────────────

function StatusBadge({ status }: { status: LeaveStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
      <Icon size={11} />{cfg.label}
    </span>
  );
}

function BalanceBar({ balance }: { balance: LeaveBalance }) {
  const total = (balance.leaveType as any)?.annualLimit ?? (balance.balance + balance.used);
  const usedPct   = total > 0 ? Math.round((balance.used / total) * 100) : 0;
  const pendingPct= total > 0 ? Math.round((balance.pendingDays / total) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-gray-900 text-sm">{balance.leaveType.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {balance.effectiveBalance} dias disponíveis
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">{balance.balance}</p>
          <p className="text-xs text-gray-400">de {total} dias</p>
        </div>
      </div>

      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
        <div
          className="h-full rounded-l-full transition-all"
          style={{ width: `${usedPct}%`, backgroundColor: balance.leaveType.color ?? '#3B82F6' }}
        />
        {pendingPct > 0 && (
          <div
            className="h-full transition-all opacity-40"
            style={{ width: `${pendingPct}%`, backgroundColor: balance.leaveType.color ?? '#3B82F6' }}
          />
        )}
      </div>

      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: balance.leaveType.color }} />
          {balance.used} usados
        </span>
        {balance.pendingDays > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-300" />
            {balance.pendingDays} pendentes
          </span>
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, color = 'blue', sub }: {
  label: string; value: string|number; icon: any; color?: string; sub?: string;
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600', emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600', violet: 'bg-violet-50 text-violet-600',
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-xl ${colors[color]}`}><Icon size={18} /></div>
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
          {sub && <p className="text-xs text-gray-400">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── New Leave Request Modal ──────────────────────────────────────────────────

function NewLeaveModal({
  leaveTypes, balances, onClose, onSuccess,
}: {
  leaveTypes: LeaveType[];
  balances: LeaveBalance[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep]       = useState<1|2|3>(1);
  const [form, setForm]       = useState({
    leaveTypeCode: '', startDate: '', endDate: '',
    durationMode: 'FULL_DAY' as DurationMode,
    reason: '', saveAsDraft: false,
  });
  const [conflicts, setConflicts] = useState<any>(null);
  const [error, setError]         = useState('');

  const selectedType  = leaveTypes.find(t => t.code === form.leaveTypeCode);
  const selectedBalance = balances.find(b => b.leaveTypeCode === form.leaveTypeCode);

  const checkConflicts = async () => {
    if (!form.startDate || !form.endDate) return;
    try {
      const r = await apiClient.get<any>('/leave/conflict-check', {
        params: { userId: 'me', startDate: form.startDate, endDate: form.endDate },
      });
      setConflicts(r);
    } catch {}
  };

  const create = useApiMutation(
    () => apiClient.post('/leave', form),
    {
      invalidateKeys: [queryKeys.leave.all],
      onSuccess: () => { onSuccess(); onClose(); },
      onError: (e) => setError(e.message),
    },
  );
  const loading = create.isPending;

  const handleSubmit = () => {
    if (!form.leaveTypeCode || !form.startDate || !form.endDate) {
      setError('Preencha todos os campos obrigatórios'); return;
    }
    setError('');
    create.mutate(undefined);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900">Solicitar Licença</h2>
              <div className="flex items-center gap-2 mt-1">
                {[1,2,3].map(s => (
                  <div key={s} className={`h-1.5 w-8 rounded-full transition-colors ${step >= s ? 'bg-blue-600' : 'bg-gray-200'}`} />
                ))}
                <span className="text-xs text-gray-400 ml-1">Passo {step} de 3</span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"><X size={18} /></button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm">
              <AlertCircle size={16} />{error}
            </div>
          )}

          {/* STEP 1: Tipo */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Seleccione o tipo de licença</p>
              <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto pr-1">
                {leaveTypes.map(lt => {
                  const bal = balances.find(b => b.leaveTypeCode === lt.code);
                  return (
                    <button
                      key={lt.code}
                      onClick={() => setForm(f => ({ ...f, leaveTypeCode: lt.code }))}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                        form.leaveTypeCode === lt.code
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: lt.color + '20', color: lt.color }}>
                        <Calendar size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{lt.name}</p>
                        <p className="text-xs text-gray-400">{CATEGORY_LABELS[lt.category]} · {lt.isPaid ? 'Remunerada' : 'Não remunerada'}</p>
                      </div>
                      {bal && (
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold" style={{ color: lt.color }}>{bal.effectiveBalance}</p>
                          <p className="text-xs text-gray-400">dias</p>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Datas */}
          {step === 2 && (
            <div className="space-y-4">
              {selectedType && (
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: selectedType.color + '15' }}>
                  <Calendar size={16} style={{ color: selectedType.color }} />
                  <span className="text-sm font-medium" style={{ color: selectedType.color }}>{selectedType.name}</span>
                  {selectedBalance && <span className="text-xs ml-auto" style={{ color: selectedType.color }}>{selectedBalance.effectiveBalance} dias disponíveis</span>}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Início <span className="text-red-500">*</span></label>
                  <input type="date" value={form.startDate}
                    onChange={e => { setForm(f => ({...f, startDate: e.target.value})); setConflicts(null); }}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Fim <span className="text-red-500">*</span></label>
                  <input type="date" value={form.endDate} min={form.startDate}
                    onChange={e => { setForm(f => ({...f, endDate: e.target.value})); setConflicts(null); }}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {selectedType?.allowHalfDay && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Duração</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['FULL_DAY','HALF_AM','HALF_PM'].map(mode => (
                      <button key={mode} onClick={() => setForm(f => ({...f, durationMode: mode as DurationMode}))}
                        className={`py-2 text-xs rounded-xl border-2 font-medium transition-colors ${form.durationMode === mode ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                        {mode === 'FULL_DAY' ? 'Dia inteiro' : mode === 'HALF_AM' ? 'Manhã' : 'Tarde'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {form.startDate && form.endDate && !conflicts && (
                <button onClick={checkConflicts}
                  className="w-full py-2 text-sm text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors">
                  Verificar conflitos
                </button>
              )}

              {conflicts && (
                <div className={`p-3 rounded-xl text-sm ${conflicts.hasUserConflict || conflicts.isAtRisk ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                  {conflicts.hasUserConflict && <p className="font-medium">⚠️ Já tem uma ausência neste período</p>}
                  {!conflicts.hasUserConflict && conflicts.isAtRisk && (
                    <p>⚠️ {conflicts.teamConflictCount} colega(s) ausente(s) no mesmo período</p>
                  )}
                  {!conflicts.hasUserConflict && !conflicts.isAtRisk && <p>✓ Sem conflitos detectados</p>}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Motivo {selectedType?.requiresDocument ? <span className="text-red-500">*</span> : '(opcional)'}
                </label>
                <textarea value={form.reason} onChange={e => setForm(f => ({...f, reason: e.target.value}))}
                  rows={3} placeholder="Descreva o motivo da ausência..."
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
          )}

          {/* STEP 3: Confirmação */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 text-sm">Resumo do Pedido</h3>
                {[
                  { label: 'Tipo', value: selectedType?.name },
                  { label: 'Período', value: `${form.startDate} → ${form.endDate}` },
                  { label: 'Duração', value: form.durationMode === 'FULL_DAY' ? 'Dia inteiro' : form.durationMode === 'HALF_AM' ? 'Manhã' : 'Tarde' },
                  { label: 'Motivo', value: form.reason || '—' },
                  { label: 'Remunerada', value: selectedType?.isPaid ? 'Sim' : 'Não' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between text-sm">
                    <span className="text-gray-500">{row.label}</span>
                    <span className="font-medium text-gray-900">{row.value}</span>
                  </div>
                ))}
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.saveAsDraft}
                  onChange={e => setForm(f => ({...f, saveAsDraft: e.target.checked}))}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                <span className="text-sm text-gray-700">Guardar como rascunho (não enviar ainda)</span>
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex gap-3">
          {step > 1 && (
            <button onClick={() => setStep(s => (s - 1) as any)}
              className="px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
              ← Voltar
            </button>
          )}
          <button onClick={onClose} className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700">
            Cancelar
          </button>
          <div className="flex-1" />
          {step < 3 ? (
            <button
              onClick={() => setStep(s => (s + 1) as any)}
              disabled={step === 1 && !form.leaveTypeCode}
              className="px-5 py-2.5 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              Continuar →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading}
              className="px-5 py-2.5 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
              {loading ? <Loader2 size={15} className="animate-spin" /> : null}
              {form.saveAsDraft ? 'Guardar Rascunho' : 'Enviar Pedido'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Request Row ──────────────────────────────────────────────────────────────

function RequestRow({ request, onCancel, onView }: {
  request: LeaveRequest; onCancel: (id: number) => void; onView: (r: LeaveRequest) => void;
}) {
  const start = new Date(request.startDate).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
  const end   = new Date(request.endDate).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <tr className="hover:bg-gray-50/50 group cursor-pointer" onClick={() => onView(request)}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: request.leaveType?.color ?? '#3B82F6' }} />
          <span className="text-sm font-medium text-gray-900">{request.leaveType?.name ?? request.leaveTypeCode}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">{start} → {end}</td>
      <td className="px-4 py-3 text-sm text-gray-700 font-medium">{request.workDays}d</td>
      <td className="px-4 py-3"><StatusBadge status={request.status} /></td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={e => { e.stopPropagation(); onView(request); }}
            className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600"><Eye size={13} /></button>
          {['PENDING','DRAFT'].includes(request.status) && (
            <button onClick={e => { e.stopPropagation(); onCancel(request.id); }}
              className="p-1.5 rounded-lg hover:bg-red-100 text-red-600"><X size={13} /></button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Approval Card ────────────────────────────────────────────────────────────

function ApprovalCard({ request, onDecide }: { request: LeaveRequest; onDecide: (id: number, action: string) => void }) {
  const [loading, setLoading] = useState(false);
  const handle = async (action: string) => {
    setLoading(true);
    try { await onDecide(request.id, action); } finally { setLoading(false); }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-blue-100 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
            {(request.user?.name ?? 'U')[0]}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{request.user?.name}</p>
            <p className="text-xs text-gray-400">{request.user?.employee?.department}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: request.leaveType?.color ?? '#3B82F6' }} />
          <p className="text-xs text-gray-500 mt-0.5">{request.leaveType?.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
        <div className="bg-gray-50 rounded-xl p-2.5">
          <p className="text-gray-400">Início</p>
          <p className="font-semibold text-gray-900 mt-0.5">{new Date(request.startDate).toLocaleDateString('pt-PT')}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-2.5">
          <p className="text-gray-400">Dias</p>
          <p className="font-semibold text-gray-900 mt-0.5">{request.workDays} dias úteis</p>
        </div>
      </div>

      {request.reason && (
        <p className="text-xs text-gray-500 bg-gray-50 rounded-xl p-2.5 mb-4 line-clamp-2">{request.reason}</p>
      )}

      <div className="flex gap-2">
        <button onClick={() => handle('REJECT')} disabled={loading}
          className="flex-1 py-2 text-xs font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-40 flex items-center justify-center gap-1">
          {loading ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />} Rejeitar
        </button>
        <button onClick={() => handle('APPROVE')} disabled={loading}
          className="flex-1 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-1">
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Aprovar
        </button>
      </div>
    </div>
  );
}

// ─── Monthly Bar Chart ────────────────────────────────────────────────────────

function MonthlyChart({ data }: { data: Array<{ month: number; count: number; days: number }> }) {
  const max = Math.max(...data.map(d => d.days), 1);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-semibold text-gray-900 text-sm mb-4">Dias de Ausência por Mês</h3>
      <div className="flex items-end gap-1.5 h-24">
        {data.map(d => (
          <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full bg-blue-100 rounded-t-md transition-all hover:bg-blue-200"
              style={{ height: `${(d.days / max) * 100}%`, minHeight: d.days > 0 ? '4px' : '0' }} />
            <span className="text-xs text-gray-400">{MONTH_NAMES[d.month - 1]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type TabKey = 'my' | 'approvals' | 'dashboard';

export default function LeavePage() {
  const [tab, setTab]         = useState<TabKey>('my');
  const [showModal, setShowModal] = useState(false);

  const leaveTypes                         = useLeaveTypes();
  const { balances, loading: bLoading, refetch: bRefetch } = useMyBalance();
  const { data: myData, loading: mLoading, refetch: mRefetch } = useMyRequests();
  const { data: dashboard, loading: dLoading, refetch: dRefetch }  = useDashboard();
  const { data: pending, loading: pLoading, refetch: pRefetch } = usePendingApprovals();

  const approve = useApiMutation(
    ({ id, action }: { id: number; action: string }) =>
      apiClient.patch(`/leave/${id}/approve`, { action }),
    {
      invalidateKeys: [queryKeys.leave.pendingApprovals(), queryKeys.leave.dashboard()],
      onError: (e) => alert(e.message),
    },
  );

  const cancel = useApiMutation(
    (id: number) => apiClient.patch(`/leave/${id}/cancel`, {}),
    {
      invalidateKeys: [queryKeys.leave.myRequests(), queryKeys.leave.myBalance()],
      onError: (e) => alert(e.message),
    },
  );

  const bulkApprove = useApiMutation(
    (ids: number[]) =>
      apiClient.post('/leave/bulk-approve', { requestIds: ids, action: 'APPROVE' }),
    {
      invalidateKeys: [queryKeys.leave.pendingApprovals(), queryKeys.leave.dashboard()],
      onError: (e) => alert(e.message),
    },
  );

  // ApprovalCard faz `await onDecide(...)` para gerir o seu loading; engolimos o
  // erro aqui (o alert já é tratado no onError da mutação).
  const handleApprovalDecide = async (requestId: number, action: string) => {
    try { await approve.mutateAsync({ id: requestId, action }); } catch { /* tratado */ }
  };

  const handleCancel = (requestId: number) => {
    if (!confirm('Tem a certeza que quer cancelar este pedido?')) return;
    cancel.mutate(requestId);
  };

  const tabs: Array<{ key: TabKey; label: string; icon: any; badge?: number }> = [
    { key: 'my',        label: 'Minhas Ausências', icon: Calendar },
    { key: 'approvals', label: 'Aprovações',        icon: CheckCircle2, badge: pending.length },
    { key: 'dashboard', label: 'Dashboard RH',      icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-5 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Gestão de Ausências</h1>
            <p className="text-sm text-gray-500">Licenças, férias e afastamentos</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { mRefetch(); bRefetch(); dRefetch(); pRefetch(); }}
              className="p-2 text-gray-500 border border-gray-200 bg-white rounded-xl hover:bg-gray-50 transition-colors">
              <RefreshCcw size={15} />
            </button>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
              <Plus size={15} /> Solicitar Licença
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">
        {/* Tab bar */}
        <div className="flex bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 gap-1 w-fit">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-xl font-medium transition-colors relative ${
                tab === t.key ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}>
              <t.icon size={15} />{t.label}
              {t.badge != null && t.badge > 0 && (
                <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${tab === t.key ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}`}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* MY LEAVE */}
        {tab === 'my' && (
          <div className="space-y-5">
            {/* Balance grid */}
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Saldo de Licenças</h2>
              {bLoading
                ? <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-pulse">{Array.from({length:3}).map((_,i)=><div key={i} className="h-28 bg-gray-100 rounded-2xl"/>)}</div>
                : balances.length === 0
                  ? <p className="text-sm text-gray-400 py-4">Sem saldos configurados.</p>
                  : <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {balances.map(b => <BalanceBar key={b.leaveTypeCode} balance={b} />)}
                    </div>}
            </div>

            {/* Requests table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">Meus Pedidos</h2>
                <span className="text-xs text-gray-400">{myData?.meta?.total ?? 0} total</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/60">
                      {['Tipo','Período','Dias','Estado',''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {mLoading
                      ? Array.from({length:5}).map((_,i) => (
                          <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse"/></td></tr>
                        ))
                      : myData?.data.length === 0
                        ? <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400 text-sm">Nenhum pedido encontrado</td></tr>
                        : myData?.data.map(r => <RequestRow key={r.id} request={r} onCancel={handleCancel} onView={() => {}} />)}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* APPROVALS */}
        {tab === 'approvals' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">Pedidos Pendentes de Aprovação</h2>
              {pending.length > 1 && (
                <button onClick={() => bulkApprove.mutate(pending.map(r => r.id))}
                  disabled={bulkApprove.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors disabled:opacity-50">
                  <Check size={13} /> Aprovar todos ({pending.length})
                </button>
              )}
            </div>

            {pLoading
              ? <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">{Array.from({length:4}).map((_,i)=><div key={i} className="h-48 bg-gray-100 rounded-2xl"/>)}</div>
              : pending.length === 0
                ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <CheckCircle2 size={48} className="mb-4 opacity-30" />
                    <p className="text-sm font-medium">Sem pedidos pendentes</p>
                    <p className="text-xs mt-1">Todos os pedidos foram processados</p>
                  </div>
                )
                : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pending.map(r => <ApprovalCard key={r.id} request={r} onDecide={handleApprovalDecide} />)}
                  </div>
                )}
          </div>
        )}

        {/* DASHBOARD */}
        {tab === 'dashboard' && (
          <div className="space-y-5">
            {dLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">{Array.from({length:4}).map((_,i)=><div key={i} className="h-24 bg-gray-100 rounded-2xl"/>)}</div>
            ) : dashboard ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard label="Pendentes"      value={dashboard.kpis.pending}      icon={Clock}        color="amber" />
                  <KpiCard label="Aprovados"      value={dashboard.kpis.approved}     icon={CheckCircle2} color="emerald" />
                  <KpiCard label="Ausentes Hoje"  value={dashboard.kpis.activeNow}    icon={Users}        color="blue" />
                  <KpiCard label="Dias Perdidos"  value={dashboard.kpis.totalWorkDays} icon={TrendingDown} color="violet" sub="no ano" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Por tipo */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="font-semibold text-gray-900 text-sm mb-4">Distribuição por Tipo</h3>
                    <div className="space-y-3">
                      {dashboard.byType.map(t => {
                        const total = dashboard.kpis.totalWorkDays || 1;
                        const pct   = Math.round((t.days / total) * 100);
                        const lt    = leaveTypes.find(l => l.code === t.code);
                        return (
                          <div key={t.code}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-medium text-gray-700">{t.name}</span>
                              <span className="text-gray-400">{t.days} dias ({t.count} pedidos)</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: lt?.color ?? '#3B82F6' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <MonthlyChart data={dashboard.byMonth} />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <BarChart3 size={48} className="mb-4 opacity-30" />
                <p>Dashboard não disponível</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <NewLeaveModal
          leaveTypes={leaveTypes}
          balances={balances}
          onClose={() => setShowModal(false)}
          onSuccess={() => { mRefetch(); bRefetch(); dRefetch(); }}
        />
      )}
    </div>
  );
}