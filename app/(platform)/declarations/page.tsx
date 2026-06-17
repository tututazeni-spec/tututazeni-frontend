'use client';

// ─── app/(dashboard)/declarations/page.tsx ───────────────────────────────────
// INNOVA — Módulo de Declarações (Documentos + Work Declarations)
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import {
  FileText, Plus, Check, X, Eye, Download, Clock, Shield,
  RefreshCcw, AlertCircle, ChevronRight, Loader2,
  CheckCircle2, XCircle, Timer, FileCheck, Clipboard,
  Users, BarChart3, Bell, Settings, QrCode, Send,
  BookOpen, Calendar, ArrowUpRight, Filter,
} from 'lucide-react';
import { useApiQuery } from '../../../hooks/useApiQuery';
import { apiClient } from '../../../lib/apiClient';
import { queryKeys } from '../../../lib/queryKeys';
import { STALE_TIME } from '../../../lib/queryClient';

// ─── Types ────────────────────────────────────────────────────────────────────

type DocStatus  = 'DRAFT'|'PENDING'|'APPROVED'|'REJECTED'|'GENERATED'|'ISSUED'|'EXPIRED';
type WorkStatus = 'DRAFT'|'PENDING'|'SUBMITTED'|'APPROVED'|'REJECTED'|'EXPIRED';
type WorkDeclType = 'ONBOARDING'|'PERIODIC'|'EVENT'|'RESIGNATION'|'DIVERSITY'|'COMPLIANCE'|'GENERAL';

interface Template {
  id: number; name: string; language: string; version: number;
  requiresApproval: boolean; active: boolean;
  purpose?: { id: number; name: string; category: string };
  variables?: string[];
}

interface Purpose { id: number; name: string; category: string; requiresApproval: boolean }

interface DocRequest {
  id: number; userId: number; status: DocStatus; createdAt: string;
  addressedTo?: string; observations?: string;
  referenceNumber?: string; verificationCode?: string;
  generatedAt?: string; issuedAt?: string; expiresAt?: string;
  template?: { id: number; name: string; language: string };
  purpose?: { id: number; name: string };
  user?: { id: number; name: string; email: string; employee?: { department: string } };
}

interface WorkForm {
  id: number; title: string; type: WorkDeclType; mandatory: boolean;
  periodicity?: string; description?: string; active: boolean;
  questions?: Array<{ id: number; key: string; label: string; fieldType: string; required: boolean; options: string[]; conditionalKey?: string; conditionalValue?: string; order: number }>;
  _count?: { submissions: number };
}

interface WorkSubmission {
  id: number; userId: number; status: WorkStatus; submittedAt?: string;
  form?: { id: number; title: string; type: WorkDeclType };
  user?: { id: number; name: string; employee?: { department: string } };
  answers?: Array<{ questionKey: string; value: string; question?: { label: string } }>;
}

interface DashboardData {
  kpis: { pending: number; generated: number; issued: number; total: number };
}

interface WorkDashboard {
  kpis: { total: number; pending: number; approved: number; rejected: number; expired: number; completionRate: number };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DOC_STATUS: Record<DocStatus, { label: string; color: string; icon: any }> = {
  DRAFT:     { label: 'Rascunho',   color: 'bg-gray-100 text-gray-600',      icon: FileText    },
  PENDING:   { label: 'Pendente',   color: 'bg-amber-100 text-amber-700',    icon: Clock       },
  APPROVED:  { label: 'Aprovado',   color: 'bg-blue-100 text-blue-700',      icon: Check       },
  REJECTED:  { label: 'Rejeitado',  color: 'bg-red-100 text-red-700',        icon: XCircle     },
  GENERATED: { label: 'Gerado',     color: 'bg-emerald-100 text-emerald-700',icon: FileCheck   },
  ISSUED:    { label: 'Emitido',    color: 'bg-violet-100 text-violet-700',  icon: CheckCircle2},
  EXPIRED:   { label: 'Expirado',   color: 'bg-gray-100 text-gray-400',      icon: Timer       },
};

const WORK_STATUS: Record<WorkStatus, { label: string; color: string }> = {
  DRAFT:     { label: 'Rascunho',   color: 'bg-gray-100 text-gray-600'       },
  PENDING:   { label: 'Pendente',   color: 'bg-amber-100 text-amber-700'     },
  SUBMITTED: { label: 'Submetida',  color: 'bg-blue-100 text-blue-700'       },
  APPROVED:  { label: 'Aprovada',   color: 'bg-emerald-100 text-emerald-700' },
  REJECTED:  { label: 'Rejeitada',  color: 'bg-red-100 text-red-700'         },
  EXPIRED:   { label: 'Expirada',   color: 'bg-gray-100 text-gray-400'       },
};

const WORK_TYPE_LABELS: Record<WorkDeclType, string> = {
  ONBOARDING: 'Onboarding', PERIODIC: 'Periódica', EVENT: 'Evento',
  RESIGNATION: 'Desligamento', DIVERSITY: 'Diversidade',
  COMPLIANCE: 'Compliance', GENERAL: 'Geral',
};

// ─── Utility ──────────────────────────────────────────────────────────────────

function StatusBadge({ status, type = 'doc' }: { status: string; type?: 'doc'|'work' }) {
  const cfg = type === 'doc'
    ? DOC_STATUS[status as DocStatus] ?? DOC_STATUS.DRAFT
    : { ...WORK_STATUS[status as WorkStatus] ?? WORK_STATUS.DRAFT, icon: Clock };
  const Icon = (cfg as any).icon ?? Clock;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
      <Icon size={11} />{cfg.label}
    </span>
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

// ─── New Document Request Modal ───────────────────────────────────────────────

function NewDocRequestModal({ templates, purposes, onClose, onSuccess }: {
  templates: Template[]; purposes: Purpose[];
  onClose: () => void; onSuccess: () => void;
}) {
  const [step, setStep]         = useState<1|2|3>(1);
  const [form, setForm]         = useState({ templateId: 0, purposeId: 0, addressedTo: '', observations: '', saveAsDraft: false });
  const [preview, setPreview]   = useState<any>(null);
  const [loading, setLoading]   = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError]       = useState('');
  const selected = templates.find(t => t.id === form.templateId);

  const loadPreview = async () => {
    if (!form.templateId) return;
    setPreviewLoading(true);
    try { setPreview(await apiClient.get(`/declarations/documents/templates/${form.templateId}/preview`)); }
    catch {}
    finally { setPreviewLoading(false); }
  };

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      await apiClient.post('/declarations/documents', { ...form, purposeId: form.purposeId || undefined });
      onSuccess(); onClose();
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900">Solicitar Declaração</h2>
              <div className="flex gap-1.5 mt-1.5">
                {[1,2,3].map(s => <div key={s} className={`h-1.5 w-8 rounded-full transition-colors ${step >= s ? 'bg-blue-600' : 'bg-gray-200'}`} />)}
                <span className="text-xs text-gray-400 ml-1">Passo {step}/3</span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"><X size={18}/></button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {error && <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm"><AlertCircle size={15}/>{error}</div>}

          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Seleccione o tipo de declaração</p>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {templates.map(t => (
                  <button key={t.id} onClick={() => setForm(f => ({...f, templateId: t.id}))}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${form.templateId === t.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}>
                    <div className={`p-2 rounded-xl flex-shrink-0 ${form.templateId === t.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                      <FileText size={16}/>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{t.purpose?.name} · v{t.version} · {t.language}</p>
                      {t.requiresApproval && <span className="text-xs text-amber-600 mt-0.5 flex items-center gap-1"><Clock size={10}/>Requer aprovação</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Finalidade</label>
                <select value={form.purposeId} onChange={e => setForm(f => ({...f, purposeId: +e.target.value}))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value={0}>Seleccionar finalidade...</option>
                  {purposes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Dirigida a (opcional)</label>
                <input value={form.addressedTo} onChange={e => setForm(f => ({...f, addressedTo: e.target.value}))}
                  placeholder="Ex: Banco Angolano de Investimentos"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Observações</label>
                <textarea value={form.observations} onChange={e => setForm(f => ({...f, observations: e.target.value}))}
                  rows={2} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <button onClick={loadPreview} className="w-full py-2 text-sm text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
                {previewLoading ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14}/>}
                {preview ? 'Recarregar Preview' : 'Ver Preview'}
              </button>
              {preview && (
                <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 max-h-48 overflow-y-auto">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans" dangerouslySetInnerHTML={{ __html: preview.previewHtml.replace(/<[^>]*>/g, ' ').trim() }} />
                </div>
              )}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Template</span><span className="font-medium">{selected?.name}</span></div>
                {form.addressedTo && <div className="flex justify-between"><span className="text-gray-500">Dirigida a</span><span className="font-medium">{form.addressedTo}</span></div>}
                <div className="flex justify-between"><span className="text-gray-500">Aprovação</span><span className={selected?.requiresApproval ? 'text-amber-600' : 'text-emerald-600'}>{selected?.requiresApproval ? 'Necessária' : 'Automática'}</span></div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.saveAsDraft} onChange={e => setForm(f => ({...f, saveAsDraft: e.target.checked}))}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                <span className="text-sm text-gray-700">Guardar como rascunho</span>
              </label>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3">
          {step > 1 && <button onClick={() => setStep(s => (s-1) as any)} className="px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">← Voltar</button>}
          <button onClick={onClose} className="px-3 py-2.5 text-sm text-gray-500 hover:text-gray-700">Cancelar</button>
          <div className="flex-1"/>
          {step < 3
            ? <button onClick={() => setStep(s => (s+1) as any)} disabled={step === 1 && !form.templateId}
                className="px-5 py-2.5 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-40">Continuar →</button>
            : <button onClick={handleSubmit} disabled={loading}
                className="px-5 py-2.5 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                {loading ? <Loader2 size={14} className="animate-spin"/> : null}
                {form.saveAsDraft ? 'Guardar' : 'Submeter'}
              </button>}
        </div>
      </div>
    </div>
  );
}

// ─── Work Declaration Form Modal ──────────────────────────────────────────────

function WorkDeclFormModal({ form, onClose, onSuccess }: {
  form: WorkForm; onClose: () => void; onSuccess: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const questions = (form.questions ?? []).filter(q => {
    if (!q.conditionalKey) return true;
    return answers[q.conditionalKey] == q.conditionalValue;
  }).sort((a, b) => a.order - b.order);

  const handleSubmit = async (draft = false) => {
    setLoading(true); setError('');
    try {
      await apiClient.post('/declarations/work/submit', {
        formId: form.id,
        answers: Object.entries(answers).map(([key, value]) => ({ key, value })),
        saveAsDraft: draft,
      });
      onSuccess(); onClose();
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-start justify-between">
          <div>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{WORK_TYPE_LABELS[form.type]}</span>
            <h2 className="font-bold text-gray-900 mt-1.5">{form.title}</h2>
            {form.description && <p className="text-sm text-gray-500 mt-0.5">{form.description}</p>}
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 flex-shrink-0"><X size={18}/></button>
        </div>

        <div className="p-6 space-y-5">
          {error && <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm"><AlertCircle size={15}/>{error}</div>}

          {questions.map(q => (
            <div key={q.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {q.label}
                {q.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {['TEXT','TEXTAREA'].includes(q.fieldType) && (
                q.fieldType === 'TEXTAREA'
                  ? <textarea value={answers[q.key] ?? ''} onChange={e => setAnswers(a => ({...a, [q.key]: e.target.value}))}
                      rows={3} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                  : <input value={answers[q.key] ?? ''} onChange={e => setAnswers(a => ({...a, [q.key]: e.target.value}))}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              )}

              {q.fieldType === 'BOOLEAN' && (
                <div className="flex gap-3">
                  {['Sim','Não'].map(opt => (
                    <button key={opt} onClick={() => setAnswers(a => ({...a, [q.key]: opt === 'Sim'}))}
                      className={`flex-1 py-2.5 text-sm rounded-xl border-2 font-medium transition-colors ${answers[q.key] === (opt === 'Sim') ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {['SELECT','MULTI_SELECT'].includes(q.fieldType) && (
                <select value={answers[q.key] ?? ''} onChange={e => setAnswers(a => ({...a, [q.key]: e.target.value}))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">Seleccionar...</option>
                  {q.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              )}

              {q.fieldType === 'DATE' && (
                <input type="date" value={answers[q.key] ?? ''}
                  onChange={e => setAnswers(a => ({...a, [q.key]: e.target.value}))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              )}

              {q.fieldType === 'NUMBER' && (
                <input type="number" value={answers[q.key] ?? ''} onChange={e => setAnswers(a => ({...a, [q.key]: +e.target.value}))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              )}
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3">
          <button onClick={() => handleSubmit(true)} disabled={loading}
            className="px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
            Guardar Rascunho
          </button>
          <div className="flex-1"/>
          <button onClick={onClose} className="px-3 py-2.5 text-sm text-gray-500 hover:text-gray-700">Cancelar</button>
          <button onClick={() => handleSubmit(false)} disabled={loading}
            className="px-5 py-2.5 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            {loading ? <Loader2 size={14} className="animate-spin"/> : <Send size={14}/>} Submeter
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type TabKey = 'docs-my' | 'docs-admin' | 'work-my' | 'work-admin';

export default function DeclarationsPage() {
  const [tab, setTab]              = useState<TabKey>('docs-my');
  const [showDocModal, setShowDocModal] = useState(false);
  const [showWorkModal, setShowWorkModal] = useState<WorkForm | null>(null);

  const templatesQuery = useApiQuery<Template[]>(
    queryKeys.declarations.templates(), '/declarations/documents/templates',
    { staleTime: STALE_TIME.STATIC },
  );
  const purposesQuery = useApiQuery<Purpose[]>(
    queryKeys.declarations.purposes(), '/declarations/documents/purposes',
    { staleTime: STALE_TIME.STATIC },
  );
  const myDocsQuery = useApiQuery<{ data: DocRequest[] }>(
    queryKeys.declarations.myDocs(), '/declarations/documents/my',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const allDocsQuery = useApiQuery<{ data: DocRequest[] }>(
    queryKeys.declarations.allDocs(), '/declarations/documents',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const pendingWorkQuery = useApiQuery<{ pending: WorkForm[]; total: number }>(
    queryKeys.declarations.workPending(), '/declarations/work/my/pending',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const workSubsQuery = useApiQuery<{ data: WorkSubmission[] }>(
    queryKeys.declarations.workSubmissions(), '/declarations/work/my/submissions',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const docDashQuery = useApiQuery<DashboardData>(
    queryKeys.declarations.docDashboard(), '/declarations/documents/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const workDashQuery = useApiQuery<WorkDashboard>(
    queryKeys.declarations.workDashboard(), '/declarations/work/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  const templates   = templatesQuery.data ?? [];
  const purposes    = purposesQuery.data ?? [];
  const myDocs      = myDocsQuery.data ?? null;
  const allDocs     = allDocsQuery.data ?? null;
  const pendingWork = pendingWorkQuery.data ?? null;
  const workSubs    = workSubsQuery.data ?? null;
  const docDash     = docDashQuery.data ?? null;
  const workDash    = workDashQuery.data ?? null;
  const loading     = templatesQuery.isFetching || myDocsQuery.isFetching;

  const load = () => {
    [templatesQuery, purposesQuery, myDocsQuery, allDocsQuery,
     pendingWorkQuery, workSubsQuery, docDashQuery, workDashQuery]
      .forEach(q => q.refetch());
  };

  const tabs: Array<{ key: TabKey; label: string; icon: any; badge?: number }> = [
    { key: 'docs-my',    label: 'Minhas Declarações', icon: FileText,  },
    { key: 'work-my',    label: 'Formulários',        icon: Clipboard, badge: pendingWork?.total },
    { key: 'docs-admin', label: 'Gerir Pedidos',      icon: BarChart3, },
    { key: 'work-admin', label: 'Compliance',         icon: Shield,    },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-5 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Declarações</h1>
            <p className="text-sm text-gray-500">Documentos formais e compliance</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowDocModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
              <Plus size={15}/> Solicitar Declaração
            </button>
            <button onClick={load} className="p-2 text-gray-500 border border-gray-200 bg-white rounded-xl hover:bg-gray-50">
              <RefreshCcw size={15} className={loading ? 'animate-spin' : ''}/>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">
        {/* Tabs */}
        <div className="flex bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 gap-1 w-fit">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-xl font-medium transition-colors relative ${tab === t.key ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
              <t.icon size={15}/>{t.label}
              {t.badge != null && t.badge > 0 && (
                <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${tab === t.key ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}`}>{t.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* MY DOCS */}
        {tab === 'docs-my' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">Meus Pedidos de Declaração</h2>
                <span className="text-xs text-gray-400">{myDocs?.data.length ?? 0} total</span>
              </div>
              <div className="divide-y divide-gray-50">
                {myDocs?.data.length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-gray-400">
                    <FileText size={40} className="mb-3 opacity-30"/>
                    <p className="text-sm">Nenhum pedido ainda</p>
                    <button onClick={() => setShowDocModal(true)} className="mt-3 flex items-center gap-1.5 px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50">
                      <Plus size={13}/> Solicitar primeira declaração
                    </button>
                  </div>
                ) : myDocs?.data.map(d => (
                  <div key={d.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FileText size={16} className="text-blue-600"/>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{d.template?.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {d.purpose?.name && `${d.purpose.name} · `}
                          {new Date(d.createdAt).toLocaleDateString('pt-PT')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {d.referenceNumber && <span className="text-xs font-mono text-gray-400">{d.referenceNumber}</span>}
                      <StatusBadge status={d.status} type="doc"/>
                      {(d.status === 'GENERATED' || d.status === 'ISSUED') && (
                        <button className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Download size={14}/>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MY WORK FORMS */}
        {tab === 'work-my' && (
          <div className="space-y-4">
            {(pendingWork?.pending.length ?? 0) > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5"/>
                <div>
                  <p className="text-sm font-semibold text-amber-900">{pendingWork!.total} declaração(ões) pendente(s)</p>
                  <p className="text-xs text-amber-700 mt-0.5">Complete os formulários abaixo para manter o seu perfil actualizado.</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {pendingWork?.pending.map(f => (
                <div key={f.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between hover:border-blue-100 hover:shadow-md transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Clipboard size={18} className="text-blue-600"/>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{f.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{WORK_TYPE_LABELS[f.type]} {f.periodicity ? `· ${f.periodicity}` : ''}</p>
                      {f.mandatory && <span className="text-xs text-red-600 font-medium">Obrigatória</span>}
                    </div>
                  </div>
                  <button onClick={() => setShowWorkModal(f)}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors">
                    Preencher <ChevronRight size={14}/>
                  </button>
                </div>
              ))}
              {pendingWork?.pending.length === 0 && (
                <div className="flex flex-col items-center py-16 text-gray-400">
                  <CheckCircle2 size={40} className="mb-3 opacity-30"/>
                  <p className="text-sm font-medium">Sem formulários pendentes</p>
                </div>
              )}
            </div>

            {/* My submissions */}
            {(workSubs?.data.length ?? 0) > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50"><h3 className="text-sm font-semibold text-gray-900">Histórico de Submissões</h3></div>
                <div className="divide-y divide-gray-50">
                  {workSubs?.data.map(s => (
                    <div key={s.id} className="px-5 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{s.form?.title}</p>
                        <p className="text-xs text-gray-400">{s.submittedAt ? new Date(s.submittedAt).toLocaleDateString('pt-PT') : '—'}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${WORK_STATUS[s.status]?.color}`}>
                        {WORK_STATUS[s.status]?.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* DOCS ADMIN */}
        {tab === 'docs-admin' && (
          <div className="space-y-5">
            {docDash && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard label="Pendentes"  value={docDash.kpis.pending}   icon={Clock}        color="amber" />
                <KpiCard label="Gerados"    value={docDash.kpis.generated} icon={FileCheck}    color="blue" />
                <KpiCard label="Emitidos"   value={docDash.kpis.issued}    icon={CheckCircle2} color="emerald" />
                <KpiCard label="Total"      value={docDash.kpis.total}     icon={FileText}     color="violet" />
              </div>
            )}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50"><h2 className="text-sm font-semibold text-gray-900">Todos os Pedidos</h2></div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/60">
                      {['Colaborador','Template','Finalidade','Estado','Data','Acções'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {allDocs?.data.map(d => (
                      <tr key={d.id} className="hover:bg-gray-50/40 group">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{d.user?.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{d.template?.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{d.purpose?.name ?? '—'}</td>
                        <td className="px-4 py-3"><StatusBadge status={d.status} type="doc"/></td>
                        <td className="px-4 py-3 text-xs text-gray-400">{new Date(d.createdAt).toLocaleDateString('pt-PT')}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {d.status === 'PENDING' && (
                              <button onClick={async () => { await apiClient.patch(`/declarations/documents/${d.id}/approve`, { approved: true }); load(); }}
                                className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-600"><Check size={13}/></button>
                            )}
                            {d.status === 'APPROVED' && (
                              <button onClick={async () => { await apiClient.patch(`/declarations/documents/${d.id}/generate`, {}); load(); }}
                                className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600"><FileCheck size={13}/></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* WORK ADMIN */}
        {tab === 'work-admin' && (
          <div className="space-y-5">
            {workDash && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard label="Pendentes"    value={workDash.kpis.pending}        icon={Clock}        color="amber" />
                <KpiCard label="Aprovadas"    value={workDash.kpis.approved}       icon={CheckCircle2} color="emerald" />
                <KpiCard label="Conformidade" value={`${workDash.kpis.completionRate}%`} icon={Shield} color="blue" />
                <KpiCard label="Total"        value={workDash.kpis.total}          icon={BarChart3}    color="violet" />
              </div>
            )}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">Submissões de Declarações</h2>
                <button onClick={async () => { await apiClient.post('/declarations/work/trigger/periodic', {}); load(); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
                  <Bell size={12}/> Enviar lembretes
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/60">
                      {['Colaborador','Formulário','Tipo','Estado','Submissão','Acções'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {workSubs?.data.map(s => (
                      <tr key={s.id} className="hover:bg-gray-50/40 group">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.user?.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{s.form?.title}</td>
                        <td className="px-4 py-3 text-xs"><span className="px-2 py-0.5 bg-gray-100 rounded-full">{s.form?.type ? WORK_TYPE_LABELS[s.form.type] : '—'}</span></td>
                        <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${WORK_STATUS[s.status]?.color}`}>{WORK_STATUS[s.status]?.label}</span></td>
                        <td className="px-4 py-3 text-xs text-gray-400">{s.submittedAt ? new Date(s.submittedAt).toLocaleDateString('pt-PT') : '—'}</td>
                        <td className="px-4 py-3">
                          {s.status === 'SUBMITTED' && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={async () => { await apiClient.patch(`/declarations/work/submissions/${s.id}/review`, { approved: true }); load(); }}
                                className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-600"><Check size={13}/></button>
                              <button onClick={async () => { await apiClient.patch(`/declarations/work/submissions/${s.id}/review`, { approved: false }); load(); }}
                                className="p-1.5 rounded-lg hover:bg-red-100 text-red-600"><X size={13}/></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {workSubs?.data.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">Sem submissões</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {showDocModal && (
        <NewDocRequestModal templates={templates} purposes={purposes}
          onClose={() => setShowDocModal(false)} onSuccess={load} />
      )}

      {showWorkModal && (
        <WorkDeclFormModal form={showWorkModal}
          onClose={() => setShowWorkModal(null)} onSuccess={load} />
      )}
    </div>
  );
}