'use client';

// ─── app/(dashboard)/employees/page.tsx ──────────────────────────────────────
// INNOVA — Módulo de Colaboradores
// Dependências: lucide-react, @tanstack/react-query, axios (ou fetch), date-fns
// Styling: Tailwind CSS
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, SlidersHorizontal, Users, UserPlus, Download, RefreshCcw,
  ChevronDown, ChevronRight, Eye, Edit2, Trash2, MoreHorizontal,
  Building2, MapPin, Briefcase, Calendar, Star, BookOpen,
  TrendingUp, Award, Clock, Filter, X, CheckCircle2, AlertCircle,
  ArrowUpRight, BarChart3, Loader2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED' | 'SUSPENDED';
type SeniorityLevel = 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD' | 'MANAGER' | 'DIRECTOR' | 'C_LEVEL';
type WorkMode = 'REMOTE' | 'HYBRID' | 'ON_SITE';
type ContractType =
  | 'INDEFINITE'
  | 'FIXED_TERM'
  | 'UNCERTAIN_TERM'
  | 'APPRENTICESHIP'
  | 'INTERNSHIP'
  | 'SERVICE_PROVISION'
  | 'TEMPORARY_PLACEMENT'
  | 'PART_TIME';

interface Employee {
  id: number;
  matricula?: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: string;
  jobTitle?: string;
  department?: string;
  location?: string;
  seniority?: SeniorityLevel;
  contractType?: ContractType;
  workMode?: WorkMode;
  status: EmployeeStatus;
  joinedAt: string;
  manager?: { id: number; name: string; avatarUrl?: string };
  _count?: {
    contracts: number;
    feedbacks: number;
    pdis: number;
    employeeSkills: number;
    documents: number;
  };
}

interface EmployeeStats {
  avgFeedbackScore: number;
  totalFeedbacks: number;
  completedCourses: number;
  totalSkills: number;
  pdiProgress: number;
  activePdiTitle?: string;
  totalHoursWorked: number;
  totalBadges: number;
}

interface FilterState {
  search: string;
  department: string;
  status: string;
  seniority: string;
  workMode: string;
  contractType: string;
}

interface HeadcountStats {
  total: number;
  byStatus: Array<{ status: string; _count: number }>;
  byDepartment: Array<{ department: string; _count: number }>;
  recentHires: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<EmployeeStatus, { label: string; color: string; dot: string }> = {
  ACTIVE:     { label: 'Ativo',      color: 'bg-emerald-100 text-emerald-700',  dot: 'bg-emerald-500' },
  INACTIVE:   { label: 'Inativo',    color: 'bg-gray-100 text-gray-600',        dot: 'bg-gray-400'    },
  ON_LEAVE:   { label: 'Afastado',   color: 'bg-amber-100 text-amber-700',      dot: 'bg-amber-500'   },
  TERMINATED: { label: 'Desligado',  color: 'bg-red-100 text-red-700',          dot: 'bg-red-500'     },
  SUSPENDED:  { label: 'Suspenso',   color: 'bg-orange-100 text-orange-700',    dot: 'bg-orange-500'  },
};

const SENIORITY_LABELS: Record<SeniorityLevel, string> = {
  JUNIOR: 'Júnior', MID: 'Pleno', SENIOR: 'Sênior',
  LEAD: 'Líder', MANAGER: 'Gerente', DIRECTOR: 'Diretor', C_LEVEL: 'C-Level',
};

const WORKMODE_LABELS: Record<WorkMode, string> = {
  REMOTE: 'Remoto', HYBRID: 'Híbrido', ON_SITE: 'Presencial',
};

// Tipos de contrato — Lei Geral do Trabalho de Angola (Lei n.º 7/15)
const CONTRACT_LABELS: Record<ContractType, string> = {
  INDEFINITE:          'Tempo Indeterminado',
  FIXED_TERM:          'A Prazo Certo',
  UNCERTAIN_TERM:      'A Prazo Incerto',
  APPRENTICESHIP:      'Aprendizagem',
  INTERNSHIP:          'Estágio Profissional',
  SERVICE_PROVISION:   'Prestação de Serviços',
  TEMPORARY_PLACEMENT: 'Cedência Temporária',
  PART_TIME:           'Tempo Parcial',
};

// Tooltips descritivos para o formulário
const CONTRACT_DESCRIPTIONS: Record<ContractType, string> = {
  INDEFINITE:          'Vínculo permanente — regime geral (Art. 12.º)',
  FIXED_TERM:          'Duração máxima 3 anos, renovável 2× (Art. 13.º)',
  UNCERTAIN_TERM:      'Obra ou serviço determinado sem data fim definida (Art. 14.º)',
  APPRENTICESHIP:      'Formação profissional + trabalho, até 25 anos (Art. 230.º)',
  INTERNSHIP:          'Inserção no mercado de trabalho — estágio profissional',
  SERVICE_PROVISION:   'Trabalhador independente / consultor externo',
  TEMPORARY_PLACEMENT: 'Cedência por empresa de trabalho temporário',
  PART_TIME:           'Jornada inferior à normal (Art. 103.º)',
};

// ─── API Helpers ──────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '/api';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('innova_token') : null;
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

function useEmployees(filters: FilterState, page: number) {
  const [data, setData]       = useState<{ data: Employee[]; meta: any } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (filters.search)      params.set('search', filters.search);
      if (filters.department)  params.set('department', filters.department);
      if (filters.status)      params.set('status', filters.status);
      if (filters.seniority)   params.set('seniority', filters.seniority);
      if (filters.workMode)    params.set('workMode', filters.workMode);
      if (filters.contractType)params.set('contractType', filters.contractType);

      const result = await apiFetch<{ data: Employee[]; meta: any }>(`/employees?${params}`);
      setData(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

function useHeadcount() {
  const [stats, setStats]     = useState<HeadcountStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiFetch<HeadcountStats>('/employees/headcount')
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { stats, loading };
}

// ─── Utility Components ───────────────────────────────────────────────────────

function Avatar({ src, name, size = 'md' }: { src?: string; name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base' };
  const initials = name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover ring-2 ring-white`}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    );
  }
  const colors = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500'];
  const color  = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`${sizes[size]} ${color} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}>
      {initials}
    </div>
  );
}

function StatusBadge({ status }: { status: EmployeeStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.INACTIVE;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function KpiCard({
  label, value, icon: Icon, trend, color = 'blue',
}: {
  label: string; value: string | number; icon: any; trend?: string; color?: string;
}) {
  const colors: Record<string, string> = {
    blue:    'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet:  'bg-violet-50 text-violet-600',
    amber:   'bg-amber-50 text-amber-600',
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-xl ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {trend && <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><ArrowUpRight size={12} />{trend}</p>}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-3 bg-gray-100 rounded w-24" />
          <div className="h-3 bg-gray-100 rounded w-20" />
        </div>
      </div>
    </div>
  );
}

// ─── Employee Card ─────────────────────────────────────────────────────────────

function EmployeeCard({ employee, onView, onEdit }: {
  employee: Employee;
  onView: (e: Employee) => void;
  onEdit: (e: Employee) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const tenure = useMemo(() => {
    const joined = new Date(employee.joinedAt);
    const now    = new Date();
    const years  = now.getFullYear() - joined.getFullYear();
    const months = now.getMonth() - joined.getMonth();
    const total  = years * 12 + months;
    if (total < 12) return `${total}m de empresa`;
    return `${Math.floor(total / 12)}a ${total % 12}m de empresa`;
  }, [employee.joinedAt]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-md transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar src={employee.avatarUrl} name={employee.name} size="md" />
          <div>
            <h3 className="font-semibold text-gray-900 text-sm leading-tight group-hover:text-blue-600 transition-colors">
              {employee.name}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{employee.jobTitle ?? employee.role}</p>
            {employee.matricula && (
              <p className="text-xs text-gray-400 font-mono">{employee.matricula}</p>
            )}
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl border border-gray-100 shadow-lg z-20 py-1">
              <button
                onClick={() => { onView(employee); setMenuOpen(false); }}
                className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 w-full"
              >
                <Eye size={13} /> Ver perfil
              </button>
              <button
                onClick={() => { onEdit(employee); setMenuOpen(false); }}
                className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 w-full"
              >
                <Edit2 size={13} /> Editar
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1.5 mb-4">
        {employee.department && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Building2 size={12} className="flex-shrink-0 text-gray-400" />
            <span className="truncate">{employee.department}</span>
          </div>
        )}
        {employee.location && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <MapPin size={12} className="flex-shrink-0 text-gray-400" />
            <span className="truncate">{employee.location}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Calendar size={12} className="flex-shrink-0 text-gray-400" />
          <span>{tenure}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
        <StatusBadge status={employee.status} />
        <div className="flex items-center gap-2">
          {employee.seniority && (
            <span className="text-xs text-gray-400 font-medium">
              {SENIORITY_LABELS[employee.seniority]}
            </span>
          )}
          {employee.workMode && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
              {WORKMODE_LABELS[employee.workMode]}
            </span>
          )}
        </div>
      </div>

      {employee._count && (
        <div className="mt-3 pt-3 border-t border-gray-50 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-sm font-bold text-gray-900">{employee._count.employeeSkills}</p>
            <p className="text-xs text-gray-400">Skills</p>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{employee._count.pdis}</p>
            <p className="text-xs text-gray-400">PDIs</p>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{employee._count.feedbacks}</p>
            <p className="text-xs text-gray-400">Feedbacks</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Employee Row (List view) ──────────────────────────────────────────────────

function EmployeeRow({ employee, onView, onEdit }: {
  employee: Employee;
  onView: (e: Employee) => void;
  onEdit: (e: Employee) => void;
}) {
  return (
    <tr className="hover:bg-blue-50/30 transition-colors group cursor-pointer" onClick={() => onView(employee)}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar src={employee.avatarUrl} name={employee.name} size="sm" />
          <div>
            <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {employee.name}
            </p>
            <p className="text-xs text-gray-400">{employee.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-gray-700">{employee.jobTitle ?? employee.role}</p>
        <p className="text-xs text-gray-400">{employee.department ?? '—'}</p>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">{employee.location ?? '—'}</td>
      <td className="px-4 py-3">
        {employee.seniority ? (
          <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
            {SENIORITY_LABELS[employee.seniority]}
          </span>
        ) : '—'}
      </td>
      <td className="px-4 py-3"><StatusBadge status={employee.status} /></td>
      <td className="px-4 py-3">
        <p className="text-xs text-gray-500">
          {new Date(employee.joinedAt).toLocaleDateString('pt-BR')}
        </p>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={e => { e.stopPropagation(); onView(employee); }}
            className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onEdit(employee); }}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <Edit2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Filter Panel ─────────────────────────────────────────────────────────────

function FilterPanel({
  filters, onChange, onClose,
}: {
  filters: FilterState;
  onChange: (f: Partial<FilterState>) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-gray-100 shadow-xl z-30 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Filtros</h3>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500">
          <X size={16} />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Departamento</label>
          <input
            value={filters.department}
            onChange={e => onChange({ department: e.target.value })}
            placeholder="Ex: Tecnologia"
            className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</label>
          <select
            value={filters.status}
            onChange={e => onChange({ status: e.target.value })}
            className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Todos</option>
            <option value="ACTIVE">Ativo</option>
            <option value="INACTIVE">Inativo</option>
            <option value="ON_LEAVE">Afastado</option>
            <option value="TERMINATED">Desligado</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Senioridade</label>
          <select
            value={filters.seniority}
            onChange={e => onChange({ seniority: e.target.value })}
            className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Todos</option>
            {Object.entries(SENIORITY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Modalidade</label>
          <select
            value={filters.workMode}
            onChange={e => onChange({ workMode: e.target.value })}
            className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Todos</option>
            {Object.entries(WORKMODE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Contrato</label>
          <select
            value={filters.contractType}
            onChange={e => onChange({ contractType: e.target.value })}
            className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Todos</option>
            {Object.entries(CONTRACT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => onChange({ department: '', status: '', seniority: '', workMode: '', contractType: '' })}
          className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Limpar filtros
        </button>
      </div>
    </div>
  );
}

// ─── Create Employee Modal ────────────────────────────────────────────────────

function CreateEmployeeModal({ onClose, onSuccess }: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm]       = useState({ name: '', email: '', role: '', department: '', joinedAt: '', seniority: '', workMode: '', contractType: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.role || !form.joinedAt) {
      setError('Preencha os campos obrigatórios');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await apiFetch('/employees', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      onSuccess();
      onClose();
    } catch (e: any) {
      setError('Erro ao criar colaborador. Verifique os dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Novo Colaborador</h2>
              <p className="text-sm text-gray-500 mt-0.5">Preencha os dados básicos</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm">
              <AlertCircle size={16} />{error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Nome completo <span className="text-red-500">*</span>
              </label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Ana Ferreira"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                E-mail corporativo <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ana@empresa.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Cargo <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Desenvolvedor"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Departamento</label>
                <input
                  value={form.department}
                  onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Tecnologia"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Data de admissão <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.joinedAt}
                onChange={e => setForm(f => ({ ...f, joinedAt: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Senioridade</label>
                <select
                  value={form.seniority}
                  onChange={e => setForm(f => ({ ...f, seniority: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">—</option>
                  {Object.entries(SENIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Modalidade</label>
                <select
                  value={form.workMode}
                  onChange={e => setForm(f => ({ ...f, workMode: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">—</option>
                  {Object.entries(WORKMODE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Contrato</label>
                <select
                  value={form.contractType}
                  onChange={e => setForm(f => ({ ...f, contractType: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">—</option>
                  {Object.entries(CONTRACT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Criando...</> : 'Criar Colaborador'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Pagination ────────────────────────────────────────────────────────────────

function Pagination({
  page, totalPages, onPage,
}: {
  page: number; totalPages: number; onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    if (totalPages <= 5) return i + 1;
    if (page <= 3) return i + 1;
    if (page >= totalPages - 2) return totalPages - 4 + i;
    return page - 2 + i;
  });

  return (
    <div className="flex items-center justify-center gap-1 mt-6">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className="px-3 py-1.5 text-sm rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        ←
      </button>
      {pages.map(p => (
        <button
          key={p}
          onClick={() => onPage(p)}
          className={`w-9 h-9 text-sm rounded-xl transition-colors font-medium ${
            p === page
              ? 'bg-blue-600 text-white shadow-sm'
              : 'border border-gray-200 hover:bg-gray-50 text-gray-700'
          }`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        className="px-3 py-1.5 text-sm rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        →
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EmployeesPage() {
  const [view, setView]               = useState<'grid' | 'list'>('grid');
  const [page, setPage]               = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreate, setShowCreate]   = useState(false);
  const [selected, setSelected]       = useState<Employee | null>(null);
  const [filters, setFilters]         = useState<FilterState>({
    search: '', department: '', status: 'ACTIVE',
    seniority: '', workMode: '', contractType: '',
  });

  const { data, loading, error, refetch } = useEmployees(filters, page);
  const { stats } = useHeadcount();

  const updateFilters = useCallback((f: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...f }));
    setPage(1);
  }, []);

  const activeFilterCount = Object.entries(filters).filter(([k, v]) =>
    k !== 'search' && v !== '' && v !== 'ACTIVE'
  ).length + (filters.status && filters.status !== 'ACTIVE' ? 1 : 0);

  const handleExport = async () => {
    try {
      const result = await apiFetch<{ data: any[] }>('/employees/export');
      const csv = [
        Object.keys(result.data[0] ?? {}).join(','),
        ...result.data.map(row => Object.values(row).join(','))
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `colaboradores-${Date.now()}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* ── Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-5 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Colaboradores</h1>
              <p className="text-sm text-gray-500">
                {stats ? `${stats.total} ativos` : 'Gestão de pessoas e talentos'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Download size={15} /> Exportar
              </button>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
              >
                <UserPlus size={15} /> Novo Colaborador
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* ── KPIs */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              label="Total Ativos"
              value={stats.total}
              icon={Users}
              color="blue"
              trend={`+${stats.recentHires} este mês`}
            />
            {stats.byStatus?.find(s => s.status === 'ON_LEAVE') && (
              <KpiCard
                label="Afastados"
                value={stats.byStatus.find(s => s.status === 'ON_LEAVE')?._count ?? 0}
                icon={AlertCircle}
                color="amber"
              />
            )}
            <KpiCard
              label="Departamentos"
              value={stats.byDepartment?.length ?? '—'}
              icon={Building2}
              color="violet"
            />
            <KpiCard
              label="Admissões Recentes"
              value={stats.recentHires ?? 0}
              icon={UserPlus}
              color="emerald"
              trend="últimos 30 dias"
            />
          </div>
        )}

        {/* ── Toolbar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={filters.search}
              onChange={e => updateFilters({ search: e.target.value })}
              placeholder="Buscar por nome, e-mail, matrícula, cargo..."
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
            {filters.search && (
              <button
                onClick={() => updateFilters({ search: '' })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm border rounded-xl transition-colors shadow-sm ${
                showFilters || activeFilterCount > 0
                  ? 'border-blue-300 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal size={15} />
              Filtros
              {activeFilterCount > 0 && (
                <span className="bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {showFilters && (
              <FilterPanel
                filters={filters}
                onChange={updateFilters}
                onClose={() => setShowFilters(false)}
              />
            )}
          </div>

          <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <button
              onClick={() => setView('grid')}
              className={`p-2.5 transition-colors ${view === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <rect x="1" y="1" width="5.5" height="5.5" rx="1" fill="currentColor" />
                <rect x="8.5" y="1" width="5.5" height="5.5" rx="1" fill="currentColor" />
                <rect x="1" y="8.5" width="5.5" height="5.5" rx="1" fill="currentColor" />
                <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" fill="currentColor" />
              </svg>
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-2.5 transition-colors ${view === 'list' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <rect x="1" y="2" width="13" height="2" rx="1" fill="currentColor" />
                <rect x="1" y="6.5" width="13" height="2" rx="1" fill="currentColor" />
                <rect x="1" y="11" width="13" height="2" rx="1" fill="currentColor" />
              </svg>
            </button>
          </div>

          <button
            onClick={refetch}
            className="p-2.5 text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
          >
            <RefreshCcw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* ── Result count */}
        {data && !loading && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-900">{data.meta.total}</span> colaboradores encontrados
            </p>
            {data.meta.total > 0 && (
              <p className="text-xs text-gray-400">
                Página {data.meta.page} de {data.meta.totalPages}
              </p>
            )}
          </div>
        )}

        {/* ── Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-700">
            <AlertCircle size={18} className="flex-shrink-0" />
            <div>
              <p className="font-medium">Erro ao carregar colaboradores</p>
              <p className="text-xs text-red-500 mt-0.5">{error}</p>
            </div>
            <button onClick={refetch} className="ml-auto text-xs underline hover:no-underline">Tentar novamente</button>
          </div>
        )}

        {/* ── Grid View */}
        {view === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
              : data?.data.map(emp => (
                  <EmployeeCard
                    key={emp.id}
                    employee={emp}
                    onView={setSelected}
                    onEdit={e => setSelected(e)} // edição abre o perfil; navegação dedicada a definir
                  />
                ))}
            {!loading && data?.data.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                <Users size={48} className="mb-4 opacity-30" />
                <p className="text-lg font-medium">Nenhum colaborador encontrado</p>
                <p className="text-sm mt-1">Tente ajustar os filtros ou adicione um novo colaborador</p>
                <button
                  onClick={() => setShowCreate(true)}
                  className="mt-4 flex items-center gap-2 px-4 py-2 text-sm text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
                >
                  <UserPlus size={15} /> Adicionar Colaborador
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── List View */}
        {view === 'list' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-gray-100">
                    {['Colaborador', 'Cargo / Depto', 'Localidade', 'Senioridade', 'Status', 'Admissão', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading
                    ? Array.from({ length: 8 }).map((_, i) => (
                        <tr key={i}>
                          {Array.from({ length: 7 }).map((_, j) => (
                            <td key={j} className="px-4 py-3">
                              <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: j === 0 ? '140px' : '80px' }} />
                            </td>
                          ))}
                        </tr>
                      ))
                    : data?.data.map(emp => (
                        <EmployeeRow
                          key={emp.id}
                          employee={emp}
                          onView={setSelected}
                          onEdit={e => setSelected(e)}
                        />
                      ))}
                </tbody>
              </table>
              {!loading && data?.data.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Users size={40} className="mb-3 opacity-30" />
                  <p className="text-sm font-medium">Nenhum resultado</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Pagination */}
        {data && (
          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            onPage={setPage}
          />
        )}
      </div>

      {/* ── Create Modal */}
      {showCreate && (
        <CreateEmployeeModal
          onClose={() => setShowCreate(false)}
          onSuccess={refetch}
        />
      )}

      {/* ── Quick Preview Drawer */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex justify-end" onClick={() => setSelected(null)}>
          <div
            className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar src={selected.avatarUrl} name={selected.name} size="lg" />
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{selected.name}</h2>
                    <p className="text-sm text-gray-500">{selected.jobTitle ?? selected.role}</p>
                    {selected.matricula && (
                      <p className="text-xs font-mono text-gray-400 mt-0.5">{selected.matricula}</p>
                    )}
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <StatusBadge status={selected.status} />

              <div className="space-y-3">
                {[
                  { icon: Building2, label: 'Departamento', value: selected.department },
                  { icon: MapPin, label: 'Localidade', value: selected.location },
                  { icon: Briefcase, label: 'Contrato', value: selected.contractType ? CONTRACT_LABELS[selected.contractType as ContractType] : undefined },
                  { icon: TrendingUp, label: 'Senioridade', value: selected.seniority ? SENIORITY_LABELS[selected.seniority as SeniorityLevel] : undefined },
                  { icon: Calendar, label: 'Admissão', value: new Date(selected.joinedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) },
                  { icon: Users, label: 'Gestor', value: selected.manager?.name },
                ].filter(row => row.value).map(row => (
                  <div key={row.label} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <row.icon size={16} className="text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-500 w-24 flex-shrink-0">{row.label}</span>
                    <span className="text-sm font-medium text-gray-900 flex-1">{row.value}</span>
                  </div>
                ))}
              </div>

              {selected._count && (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Skills', value: selected._count.employeeSkills, icon: Star },
                    { label: 'PDIs', value: selected._count.pdis, icon: TrendingUp },
                    { label: 'Docs', value: selected._count.documents, icon: BookOpen },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                      <s.icon size={16} className="text-gray-400 mx-auto mb-1" />
                      <p className="text-xl font-bold text-gray-900">{s.value}</p>
                      <p className="text-xs text-gray-500">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2">
                <a
                  href={`/employees/${selected.id}`}
                  className="flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
                >
                  <Eye size={15} /> Ver perfil completo
                </a>
                <a
                  href={`/employees/${selected.id}/edit`}
                  className="flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <Edit2 size={15} /> Editar dados
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}