'use client';

// ─── app/(dashboard)/documents/page.tsx ──────────────────────────────────────
// INNOVA — Document Repository (estilo Google Drive)
//
// Container: gere filtros/vista/modal/drawer; delega apresentação aos
// componentes em components/documents/. Ver memory
// project_innova_component_separation_audit. Migrado para a fundação de
// design: classes Tailwind cruas passam a tokens; input de pesquisa passa a
// Input; select de sensibilidade passa a Select (Radix); botão de refresh
// passa a IconButton; skeletons de loading passam a Skeleton; estado vazio
// passa a EmptyState; tabela crua passa a Table/TableHead/TableBody/
// TableRow/TableHeaderCell (components/ui/).
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import {
  FolderOpen,
  Grid,
  List,
  RefreshCcw,
  Search,
  X,
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
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

const SENSITIVITY_ITEMS = [
  { value: 'ALL', label: 'Todas as sensibilidades' },
  ...Object.entries(SENSITIVITY_CONFIG).map(([k, v]) => ({
    value: k,
    label: v.label,
  })),
];

const TABLE_HEADERS = [
  'Documento',
  'Categoria',
  'Autor',
  'Tamanho',
  'Validade',
  'Versão',
  '',
];

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
    <div className="min-h-screen bg-canvas flex">
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
        <div className="bg-surface border-b border-border px-6 py-4 flex items-center gap-3">
          <div className="flex-1 relative">
            <Search
              size={16}
              strokeWidth={1.75}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <Input
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              placeholder="Pesquisar por nome, tag, OCR text..."
              className="w-full pl-9 pr-8"
            />
            {filters.search && (
              <button
                onClick={() => updateFilters({ search: '' })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-muted"
              >
                <X size={14} strokeWidth={1.75} />
              </button>
            )}
          </div>

          <Select
            items={SENSITIVITY_ITEMS}
            value={filters.sensitivity || 'ALL'}
            onValueChange={(v) =>
              updateFilters({ sensitivity: v === 'ALL' ? '' : v })
            }
          />

          {/* View toggle */}
          <div className="flex bg-surface-sunken rounded-control overflow-hidden">
            <button
              onClick={() => setView('grid')}
              className={`p-2.5 transition-colors ${view === 'grid' ? 'bg-surface text-primary shadow-resting' : 'text-ink-muted hover:text-ink'}`}
            >
              <Grid size={15} strokeWidth={1.75} />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-2.5 transition-colors ${view === 'list' ? 'bg-surface text-primary shadow-resting' : 'text-ink-muted hover:text-ink'}`}
            >
              <List size={15} strokeWidth={1.75} />
            </button>
          </div>

          <IconButton
            icon={RefreshCcw}
            label="Actualizar"
            intent="ghost"
            onClick={() => refetch()}
            className={loading ? 'animate-spin' : ''}
          />
        </div>

        {/* KPIs strip */}
        {dashboard && (
          <div className="bg-surface border-b border-border px-6 py-3 flex items-center gap-6 text-xs">
            {[
              {
                label: 'Total',
                value: dashboard.kpis.total,
                className: 'text-ink',
              },
              {
                label: 'Activos',
                value: dashboard.kpis.active,
                className: 'text-success-ink',
              },
              {
                label: 'Expirados',
                value: dashboard.kpis.expired,
                className: 'text-danger',
              },
              {
                label: 'A Expirar',
                value: dashboard.kpis.expiringSoon,
                className: 'text-warning-ink',
              },
              {
                label: 'Tamanho',
                value: `${dashboard.kpis.totalSizeGB} GB`,
                className: 'text-info-ink',
              },
              {
                label: 'Downloads (30d)',
                value: dashboard.kpis.recentDownloads,
                className: 'text-primary',
              },
            ].map((k) => (
              <div key={k.label} className="flex items-center gap-1.5">
                <span className="text-ink-faint">{k.label}:</span>
                <span className={`font-bold ${k.className}`}>{k.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-ink-muted">
              <span className="font-semibold text-ink">
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
              <Skeleton
                rows={8}
                wrapperClassName="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse"
                itemClassName="h-44 rounded-panel bg-surface-sunken"
              />
            ) : (
              <Skeleton
                rows={6}
                wrapperClassName="space-y-2 animate-pulse"
                itemClassName="h-12 rounded-card bg-surface-sunken"
              />
            )
          ) : data?.data.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="Nenhum documento encontrado"
              description="Publique o primeiro documento do repositório."
              action={{
                label: 'Publicar primeiro documento',
                onClick: () => setShowUpload(true),
              }}
            />
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
            <Table>
              <TableHead>
                <TableRow className="hover:bg-transparent">
                  {TABLE_HEADERS.map((h) => (
                    <TableHeaderCell key={h} className="whitespace-nowrap">
                      {h}
                    </TableHeaderCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data?.data.map((d) => (
                  <DocRow
                    key={d.id}
                    doc={d}
                    onView={setSelectedDoc}
                    onDownload={handleDownload}
                  />
                ))}
              </TableBody>
            </Table>
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
