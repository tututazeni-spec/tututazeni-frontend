'use client';

// ─── app/(dashboard)/documents/page.tsx ──────────────────────────────────────
// INNOVA — Document Repository (estilo Google Drive)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileText, Folder, Upload, Search, Filter, Grid, List,
  Download, Share2, Trash2, Archive, Edit2, Eye, Clock,
  Shield, AlertCircle, CheckCircle2, X, Plus, Tag,
  MoreHorizontal, ChevronRight, BarChart3, RefreshCcw,
  Link2, Lock, File, Image, Video, FileSpreadsheet, Loader2,
  History, FolderOpen, Star, SortAsc,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type DocCategory = 'PERSONAL'|'LABOUR'|'LEARNING'|'CORPORATE'|'RECRUITMENT'|'COMPLIANCE'|'HEALTH'|'PAYROLL'|'LEAVE'|'OTHER';
type DocSensitivity = 'PUBLIC'|'INTERNAL'|'CONFIDENTIAL'|'RESTRICTED'|'SECRET';
type DocStatus = 'DRAFT'|'ACTIVE'|'EXPIRED'|'ARCHIVED'|'DELETED';

interface Document {
  id: number; title: string; description?: string; category: DocCategory;
  sensitivity: DocSensitivity; status: DocStatus; mimeType: string;
  fileUrl: string; version: string; fileSize?: number; tags: string[];
  downloadCount: number; expiresAt?: string; retentionUntil?: string;
  createdAt: string; department?: string;
  createdBy?: { id: number; name: string };
  owner?: { id: number; name: string };
  _count?: { versions: number; downloads: number };
}

interface DashboardData {
  kpis: {
    total: number; active: number; expired: number; expiringSoon: number;
    archived: number; newThisMonth: number; recentDownloads: number; totalSizeGB: number;
  };
  byCategory: Array<{ category: string; _count: number }>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<DocCategory, { label: string; color: string }> = {
  PERSONAL:    { label: 'Pessoal',       color: 'bg-blue-100 text-blue-700'    },
  LABOUR:      { label: 'Trabalhista',   color: 'bg-amber-100 text-amber-700'  },
  LEARNING:    { label: 'Aprendizagem',  color: 'bg-purple-100 text-purple-700'},
  CORPORATE:   { label: 'Corporativo',   color: 'bg-gray-100 text-gray-700'    },
  RECRUITMENT: { label: 'Recrutamento',  color: 'bg-cyan-100 text-cyan-700'    },
  COMPLIANCE:  { label: 'Compliance',    color: 'bg-red-100 text-red-700'      },
  HEALTH:      { label: 'Saúde',         color: 'bg-green-100 text-green-700'  },
  PAYROLL:     { label: 'Payroll',       color: 'bg-emerald-100 text-emerald-700'},
  LEAVE:       { label: 'Licença',       color: 'bg-orange-100 text-orange-700'},
  OTHER:       { label: 'Outro',         color: 'bg-gray-100 text-gray-500'    },
};

const SENSITIVITY_CONFIG: Record<DocSensitivity, { label: string; icon: any; color: string }> = {
  PUBLIC:       { label: 'Público',        icon: CheckCircle2, color: 'text-emerald-600' },
  INTERNAL:     { label: 'Interno',        icon: FileText,     color: 'text-blue-600'    },
  CONFIDENTIAL: { label: 'Confidencial',   icon: Lock,         color: 'text-amber-600'   },
  RESTRICTED:   { label: 'Restrito',       icon: Shield,       color: 'text-orange-600'  },
  SECRET:       { label: 'Secreto',        icon: Shield,       color: 'text-red-600'      },
};

const MIME_ICONS: Record<string, any> = {
  'application/pdf':  FileText,
  'image/':           Image,
  'video/':           Video,
  'application/vnd':  FileSpreadsheet,
};

function getFileIcon(mimeType: string) {
  for (const [key, Icon] of Object.entries(MIME_ICONS)) {
    if (mimeType.startsWith(key)) return Icon;
  }
  return File;
}

function formatBytes(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

// ─── API ──────────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL ?? '/api';

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('innova_token') : null;
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `Error ${res.status}` }));
    throw new Error(err.message ?? `Error ${res.status}`);
  }
  return res.json();
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useDocuments(search: string, category: string, sensitivity: string, tag: string, expiringSoon: boolean) {
  const [data, setData]     = useState<{ data: Document[]; meta: any } | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)       params.set('search', search);
      if (category)     params.set('category', category);
      if (sensitivity)  params.set('sensitivity', sensitivity);
      if (tag)          params.set('tag', tag);
      if (expiringSoon) params.set('expiringSoon', 'true');
      setData(await apiFetch(`/documents?${params}`));
    } catch {}
    finally { setLoading(false); }
  }, [search, category, sensitivity, tag, expiringSoon]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, refetch: fetch };
}

function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  useEffect(() => {
    apiFetch<DashboardData>('/documents/dashboard').then(setData).catch(() => {});
  }, []);
  return data;
}

function useTags() {
  const [tags, setTags] = useState<Array<{ tag: string; count: number }>>([]);
  useEffect(() => {
    apiFetch<Array<{ tag: string; count: number }>>('/documents/tags').then(setTags).catch(() => {});
  }, []);
  return tags;
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────

function UploadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm]     = useState({
    title: '', description: '', category: 'CORPORATE' as DocCategory,
    sensitivity: 'INTERNAL' as DocSensitivity, fileUrl: '', mimeType: 'application/pdf',
    fileSize: 0, tags: [] as string[], expiresAt: '', department: '',
  });
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm(f => ({ ...f, tags: [...f.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.fileUrl) { setError('Título e ficheiro são obrigatórios'); return; }
    setLoading(true); setError('');
    try {
      await apiFetch('/documents', { method: 'POST', body: JSON.stringify(form) });
      onSuccess(); onClose();
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div><h2 className="font-bold text-gray-900">Publicar Documento</h2><p className="text-sm text-gray-500 mt-0.5">Preencha os metadados</p></div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"><X size={18}/></button>
        </div>

        <div className="p-6 space-y-4">
          {error && <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm"><AlertCircle size={15}/>{error}</div>}

          {/* Área de upload */}
          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-blue-300 hover:bg-blue-50/30 transition-colors cursor-pointer">
            <Upload size={28} className="mx-auto text-gray-300 mb-2"/>
            <p className="text-sm text-gray-500">Arraste o ficheiro ou clique para carregar</p>
            <p className="text-xs text-gray-400 mt-1">PDF, DOCX, XLS, imagens — máx. 100MB</p>
            <input type="text" value={form.fileUrl} onChange={e => setForm(f => ({...f, fileUrl: e.target.value}))}
              placeholder="(temporário: cole a URL do ficheiro)"
              className="mt-3 w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Título <span className="text-red-500">*</span></label>
            <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Categoria</label>
              <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value as DocCategory}))}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                {Object.entries(CATEGORY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sensibilidade</label>
              <select value={form.sensitivity} onChange={e => setForm(f => ({...f, sensitivity: e.target.value as DocSensitivity}))}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                {Object.entries(SENSITIVITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Departamento</label>
              <input value={form.department} onChange={e => setForm(f => ({...f, department: e.target.value}))}
                placeholder="Ex: Tecnologia"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Validade</label>
              <input type="date" value={form.expiresAt} onChange={e => setForm(f => ({...f, expiresAt: e.target.value}))}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tags</label>
            <div className="flex gap-2">
              <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Ex: contrato, 2026"
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={addTag} className="px-3 py-2 text-sm bg-gray-100 rounded-xl hover:bg-gray-200 text-gray-600"><Plus size={14}/></button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.tags.map(t => (
                  <span key={t} className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {t}
                    <button onClick={() => setForm(f => ({...f, tags: f.tags.filter(x => x !== t)}))}><X size={10}/></button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
          <div className="flex-1"/>
          <button onClick={handleSubmit} disabled={loading}
            className="px-5 py-2.5 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            {loading ? <Loader2 size={14} className="animate-spin"/> : <Upload size={14}/>} Publicar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Document Card (Grid) ─────────────────────────────────────────────────────

function DocCard({ doc, onView, onDownload }: {
  doc: Document; onView: (d: Document) => void; onDownload: (d: Document) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const Icon = getFileIcon(doc.mimeType);
  const catCfg = CATEGORY_CONFIG[doc.category];
  const sensCfg = SENSITIVITY_CONFIG[doc.sensitivity];
  const SensIcon = sensCfg.icon;

  const isExpiringSoon = doc.expiresAt && new Date(doc.expiresAt) < new Date(Date.now() + 30 * 86400000) && doc.status === 'ACTIVE';
  const isExpired      = doc.status === 'EXPIRED';

  return (
    <div className={`bg-white rounded-2xl border p-4 hover:shadow-md transition-all group cursor-pointer ${isExpired ? 'border-red-100 bg-red-50/20' : isExpiringSoon ? 'border-amber-100' : 'border-gray-100 hover:border-blue-200'}`}
      onClick={() => onView(doc)}>
      {/* Icon + menu */}
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isExpired ? 'bg-red-100' : 'bg-blue-50'}`}>
          <Icon size={20} className={isExpired ? 'text-red-500' : 'text-blue-600'} />
        </div>
        <div className="relative">
          <button onClick={e => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal size={15}/>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl border border-gray-100 shadow-lg z-20 py-1">
              <button onClick={e => { e.stopPropagation(); onDownload(doc); setMenuOpen(false); }}
                className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 w-full"><Download size={12}/> Download</button>
              <button onClick={e => { e.stopPropagation(); onView(doc); setMenuOpen(false); }}
                className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 w-full"><Eye size={12}/> Ver detalhe</button>
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{doc.title}</p>

      {/* Meta */}
      <div className="mt-2 flex flex-wrap gap-1">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catCfg.color}`}>{catCfg.label}</span>
        {doc.version !== '1.0' && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">v{doc.version}</span>}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <SensIcon size={11} className={sensCfg.color}/>
          <span className={sensCfg.color}>{sensCfg.label}</span>
        </div>
        <span>{formatBytes(doc.fileSize)}</span>
      </div>

      {/* Expiry warning */}
      {(isExpiringSoon || isExpired) && (
        <div className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${isExpired ? 'text-red-600' : 'text-amber-600'}`}>
          <AlertCircle size={11}/>
          {isExpired ? 'Expirado' : `Expira ${new Date(doc.expiresAt!).toLocaleDateString('pt-PT')}`}
        </div>
      )}

      {/* Tags */}
      {doc.tags.length > 0 && (
        <div className="mt-2 flex gap-1 flex-wrap">
          {doc.tags.slice(0, 3).map(t => (
            <span key={t} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{t}</span>
          ))}
          {doc.tags.length > 3 && <span className="text-xs text-gray-400">+{doc.tags.length - 3}</span>}
        </div>
      )}
    </div>
  );
}

// ─── Document Row (List view) ─────────────────────────────────────────────────

function DocRow({ doc, onView, onDownload }: { doc: Document; onView: (d: Document) => void; onDownload: (d: Document) => void }) {
  const Icon   = getFileIcon(doc.mimeType);
  const catCfg = CATEGORY_CONFIG[doc.category];
  const isExpired = doc.status === 'EXPIRED';
  const isExpiring = doc.expiresAt && new Date(doc.expiresAt) < new Date(Date.now() + 30 * 86400000);

  return (
    <tr className="hover:bg-gray-50/50 group cursor-pointer" onClick={() => onView(doc)}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Icon size={16} className={isExpired ? 'text-red-400' : 'text-blue-500'} />
          <div>
            <p className={`text-sm font-medium group-hover:text-blue-600 transition-colors ${isExpired ? 'text-red-700' : 'text-gray-900'}`}>{doc.title}</p>
            {doc.tags.length > 0 && <p className="text-xs text-gray-400">{doc.tags.slice(0,3).join(' · ')}</p>}
          </div>
        </div>
      </td>
      <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catCfg.color}`}>{catCfg.label}</span></td>
      <td className="px-4 py-3 text-xs text-gray-500">{doc.createdBy?.name ?? '—'}</td>
      <td className="px-4 py-3 text-xs text-gray-500">{formatBytes(doc.fileSize)}</td>
      <td className="px-4 py-3 text-xs">
        {isExpired ? <span className="text-red-600 font-medium">Expirado</span>
         : isExpiring ? <span className="text-amber-600 font-medium">{new Date(doc.expiresAt!).toLocaleDateString('pt-PT')}</span>
         : <span className="text-gray-400">{doc.expiresAt ? new Date(doc.expiresAt).toLocaleDateString('pt-PT') : '—'}</span>}
      </td>
      <td className="px-4 py-3 text-xs text-gray-400">v{doc.version}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={e => { e.stopPropagation(); onView(doc); }} className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600"><Eye size={13}/></button>
          <button onClick={e => { e.stopPropagation(); onDownload(doc); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"><Download size={13}/></button>
        </div>
      </td>
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type ViewMode = 'grid' | 'list';

export default function DocumentRepositoryPage() {
  const [view, setView]             = useState<ViewMode>('grid');
  const [search, setSearch]         = useState('');
  const [category, setCategory]     = useState('');
  const [sensitivity, setSensitivity] = useState('');
  const [activeTag, setActiveTag]   = useState('');
  const [expiringSoon, setExpiringSoon] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  const { data, loading, refetch } = useDocuments(search, category, sensitivity, activeTag, expiringSoon);
  const dashboard = useDashboard();
  const allTags   = useTags();

  const handleDownload = async (doc: Document) => {
    try {
      const result = await apiFetch<{ fileUrl: string }>(`/documents/${doc.id}/download`);
      window.open(result.fileUrl, '_blank');
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex">
      {/* Sidebar */}
      <div className="w-56 flex-shrink-0 bg-white border-r border-gray-100 p-4 space-y-6">
        <div>
          <button onClick={() => setShowUpload(true)}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-sm">
            <Plus size={15}/> Novo Documento
          </button>
        </div>

        {/* Quick filters */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Filtros</p>
          <div className="space-y-1">
            {[
              { label: 'Todos os documentos', icon: Folder, action: () => { setCategory(''); setExpiringSoon(false); setActiveTag(''); } },
              { label: 'A Expirar',           icon: AlertCircle, action: () => setExpiringSoon(true), badge: dashboard?.kpis.expiringSoon },
            ].map(item => (
              <button key={item.label} onClick={item.action}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 rounded-xl hover:bg-gray-100 transition-colors text-left">
                <item.icon size={15} className="text-gray-400"/>
                <span className="flex-1">{item.label}</span>
                {item.badge != null && item.badge > 0 && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">{item.badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Categorias</p>
          <div className="space-y-1">
            {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
              <button key={k} onClick={() => { setCategory(category === k ? '' : k); setExpiringSoon(false); }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-xl transition-colors text-left ${category === k ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}>
                <span className={`w-2 h-2 rounded-full ${v.color.split(' ')[0]}`}/>
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tag cloud */}
        {allTags.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {allTags.slice(0, 12).map(t => (
                <button key={t.tag} onClick={() => setActiveTag(activeTag === t.tag ? '' : t.tag)}
                  className={`text-xs px-2 py-0.5 rounded-full transition-colors ${activeTag === t.tag ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {t.tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Pesquisar por nome, tag, OCR text..."
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"/>
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={14}/></button>}
          </div>

          <select value={sensitivity} onChange={e => setSensitivity(e.target.value)}
            className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Todas as sensibilidades</option>
            {Object.entries(SENSITIVITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>

          {/* View toggle */}
          <div className="flex bg-gray-100 rounded-xl overflow-hidden">
            <button onClick={() => setView('grid')} className={`p-2.5 transition-colors ${view === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <Grid size={15}/>
            </button>
            <button onClick={() => setView('list')} className={`p-2.5 transition-colors ${view === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <List size={15}/>
            </button>
          </div>

          <button onClick={refetch} className="p-2.5 text-gray-500 border border-gray-200 bg-white rounded-xl hover:bg-gray-50">
            <RefreshCcw size={15} className={loading ? 'animate-spin' : ''}/>
          </button>
        </div>

        {/* KPIs strip */}
        {dashboard && (
          <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-6 text-xs">
            {[
              { label: 'Total', value: dashboard.kpis.total,         color: 'text-gray-900' },
              { label: 'Activos', value: dashboard.kpis.active,       color: 'text-emerald-700' },
              { label: 'Expirados', value: dashboard.kpis.expired,   color: 'text-red-600' },
              { label: 'A Expirar', value: dashboard.kpis.expiringSoon, color: 'text-amber-700' },
              { label: 'Tamanho', value: `${dashboard.kpis.totalSizeGB} GB`, color: 'text-blue-700' },
              { label: 'Downloads (30d)', value: dashboard.kpis.recentDownloads, color: 'text-violet-700' },
            ].map(k => (
              <div key={k.label} className="flex items-center gap-1.5">
                <span className="text-gray-400">{k.label}:</span>
                <span className={`font-bold ${k.color}`}>{k.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-900">{data?.meta?.total ?? 0}</span> documentos
              {category && ` · ${CATEGORY_CONFIG[category as DocCategory]?.label}`}
              {activeTag && ` · #${activeTag}`}
              {expiringSoon && ' · A Expirar'}
            </p>
          </div>

          {loading ? (
            view === 'grid'
              ? <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">{Array.from({length:8}).map((_,i) => <div key={i} className="h-44 bg-gray-100 rounded-2xl"/>)}</div>
              : <div className="space-y-2">{Array.from({length:6}).map((_,i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse"/>)}</div>
          ) : data?.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <FolderOpen size={48} className="mb-4 opacity-30"/>
              <p className="text-sm font-medium">Nenhum documento encontrado</p>
              <button onClick={() => setShowUpload(true)} className="mt-4 flex items-center gap-1.5 px-4 py-2 text-sm text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50">
                <Upload size={14}/> Publicar primeiro documento
              </button>
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {data?.data.map(d => <DocCard key={d.id} doc={d} onView={setSelectedDoc} onDownload={handleDownload}/>)}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/60 border-b border-gray-100">
                    {['Documento','Categoria','Autor','Tamanho','Validade','Versão',''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data?.data.map(d => <DocRow key={d.id} doc={d} onView={setSelectedDoc} onDownload={handleDownload}/>)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Drawer */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex justify-end" onClick={() => setSelectedDoc(null)}>
          <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-bold text-gray-900 text-lg">{selectedDoc.title}</h2>
                  <span className={`mt-1 inline-block text-xs px-2.5 py-0.5 rounded-full font-medium ${CATEGORY_CONFIG[selectedDoc.category]?.color}`}>
                    {CATEGORY_CONFIG[selectedDoc.category]?.label}
                  </span>
                </div>
                <button onClick={() => setSelectedDoc(null)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"><X size={18}/></button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {[
                { label: 'Versão', value: selectedDoc.version },
                { label: 'Tamanho', value: formatBytes(selectedDoc.fileSize) },
                { label: 'Departamento', value: selectedDoc.department ?? '—' },
                { label: 'Criado por', value: selectedDoc.createdBy?.name ?? '—' },
                { label: 'Proprietário', value: selectedDoc.owner?.name ?? '—' },
                { label: 'Validade', value: selectedDoc.expiresAt ? new Date(selectedDoc.expiresAt).toLocaleDateString('pt-PT') : '—' },
                { label: 'Retenção legal', value: selectedDoc.retentionUntil ? new Date(selectedDoc.retentionUntil).toLocaleDateString('pt-PT') : '—' },
                { label: 'Downloads', value: String(selectedDoc.downloadCount ?? 0) },
                { label: 'Versões', value: String(selectedDoc._count?.versions ?? 1) },
              ].map(row => (
                <div key={row.label} className="flex justify-between py-2 border-b border-gray-50 last:border-0 text-sm">
                  <span className="text-gray-500">{row.label}</span>
                  <span className="font-medium text-gray-900">{row.value}</span>
                </div>
              ))}

              {selectedDoc.tags.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDoc.tags.map(t => (
                      <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2">
                <button onClick={() => handleDownload(selectedDoc)}
                  className="flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors">
                  <Download size={15}/> Download
                </button>
                <button className="flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  <Share2 size={15}/> Partilhar
                </button>
                <button className="flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  <History size={15}/> Histórico de versões
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onSuccess={refetch}/>}
    </div>
  );
}