'use client';

// ─── app/(dashboard)/documents/page.tsx ──────────────────────────────────────
// INNOVA — Document Repository (estilo Google Drive)
//
// Container: gere filtros/vista/modal/drawer; delega apresentação aos
// componentes em components/documents/. Ver memory
// project_innova_component_separation_audit.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import {
  FolderOpen,
  Grid,
  List,
  RefreshCcw,
  Search,
  Upload,
  X,
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import {
  CATEGORY_CONFIG,
  SENSITIVITY_CONFIG,
} from '@/components/documents/constants';
import {
  useDashboard,
  useDocuments,
  useTags,
} from '@/components/documents/hooks';
import { UploadModal } from '@/components/documents/UploadModal';
import { Sidebar } from '@/components/documents/Sidebar';
import { DocCard } from '@/components/documents/DocCard';
import { DocRow } from '@/components/documents/DocRow';
import { DetailDrawer } from '@/components/documents/DetailDrawer';
import { INITIAL_DOC_FILTERS } from '@/components/documents/constants';
import type {
  DocCategory,
  DocFilters,
  Document,
  ViewMode,
} from '@/components/documents/types';

export default function DocumentRepositoryPage() {
  const [view, setView] = useState<ViewMode>('grid');
  const [filters, setFilters] = useState<DocFilters>(INITIAL_DOC_FILTERS);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  function updateFilters(patch: Partial<DocFilters>) {
    setFilters((f) => ({ ...f, ...patch }));
  }

  const { data, loading, refetch } = useDocuments(filters);
  const dashboard = useDashboard();
  const allTags = useTags();

  const handleDownload = async (doc: Document) => {
    try {
      const result = await apiClient.get<{ fileUrl: string }>(
        `/documents/${doc.id}/download`,
      );
      window.open(result.fileUrl, '_blank');
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex">
      <Sidebar
        filters={filters}
        updateFilters={updateFilters}
        dashboard={dashboard}
        allTags={allTags}
        onNewDocument={() => setShowUpload(true)}
      />

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-3">
          <div className="flex-1 relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              placeholder="Pesquisar por nome, tag, OCR text..."
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            />
            {filters.search && (
              <button
                onClick={() => updateFilters({ search: '' })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <select
            value={filters.sensitivity}
            onChange={(e) => updateFilters({ sensitivity: e.target.value })}
            className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas as sensibilidades</option>
            {Object.entries(SENSITIVITY_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>

          {/* View toggle */}
          <div className="flex bg-gray-100 rounded-xl overflow-hidden">
            <button
              onClick={() => setView('grid')}
              className={`p-2.5 transition-colors ${view === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Grid size={15} />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-2.5 transition-colors ${view === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <List size={15} />
            </button>
          </div>

          <button
            onClick={() => refetch()}
            className="p-2.5 text-gray-500 border border-gray-200 bg-white rounded-xl hover:bg-gray-50"
          >
            <RefreshCcw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* KPIs strip */}
        {dashboard && (
          <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-6 text-xs">
            {[
              {
                label: 'Total',
                value: dashboard.kpis.total,
                color: 'text-gray-900',
              },
              {
                label: 'Activos',
                value: dashboard.kpis.active,
                color: 'text-emerald-700',
              },
              {
                label: 'Expirados',
                value: dashboard.kpis.expired,
                color: 'text-red-600',
              },
              {
                label: 'A Expirar',
                value: dashboard.kpis.expiringSoon,
                color: 'text-amber-700',
              },
              {
                label: 'Tamanho',
                value: `${dashboard.kpis.totalSizeGB} GB`,
                color: 'text-blue-700',
              },
              {
                label: 'Downloads (30d)',
                value: dashboard.kpis.recentDownloads,
                color: 'text-violet-700',
              },
            ].map((k) => (
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
              <span className="font-semibold text-gray-900">
                {data?.meta?.total ?? 0}
              </span>{' '}
              documentos
              {filters.category &&
                ` · ${CATEGORY_CONFIG[filters.category as DocCategory]?.label}`}
              {filters.tag && ` · #${filters.tag}`}
              {filters.expiringSoon && ' · A Expirar'}
            </p>
          </div>

          {loading ? (
            view === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-44 bg-gray-100 rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-12 bg-gray-100 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            )
          ) : data?.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <FolderOpen size={48} className="mb-4 opacity-30" />
              <p className="text-sm font-medium">Nenhum documento encontrado</p>
              <button
                onClick={() => setShowUpload(true)}
                className="mt-4 flex items-center gap-1.5 px-4 py-2 text-sm text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50"
              >
                <Upload size={14} /> Publicar primeiro documento
              </button>
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {data?.data.map((d) => (
                <DocCard
                  key={d.id}
                  doc={d}
                  onView={setSelectedDoc}
                  onDownload={handleDownload}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/60 border-b border-gray-100">
                    {[
                      'Documento',
                      'Categoria',
                      'Autor',
                      'Tamanho',
                      'Validade',
                      'Versão',
                      '',
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data?.data.map((d) => (
                    <DocRow
                      key={d.id}
                      doc={d}
                      onView={setSelectedDoc}
                      onDownload={handleDownload}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Drawer */}
      {selectedDoc && (
        <DetailDrawer
          doc={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onDownload={handleDownload}
        />
      )}

      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} onSuccess={refetch} />
      )}
    </div>
  );
}
