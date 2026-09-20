// components/content-library/CorporateDocsTab.tsx
// Separador "Documentos Corporativos" (docs/biblioteca.md) — normas,
// políticas, circulares, ordens de serviço, leis & regulamentos,
// procedimentos & manuais, formulários & modelos. Reaproveita tal e qual o
// módulo document-repository (rotas /documents/*, já com fluxo de
// aprovação/versionamento/confirmação de leitura) — só a apresentação é
// nova: filtros rápidos (Todos/Não lidos/Obrigatórios/Recentes/Favoritos/Em
// vigor/Expirados/Arquivo) + chips de categoria restritos ao subconjunto
// "documento corporativo" do DocCategoryType (a Sidebar de
// components/documents/ continua a mostrar as 25 categorias, para a página
// completa /documents — aqui mostramos só as relevantes a este separador).

'use client';

import { useState } from 'react';
import { CheckCircle2, FileText, Plus } from 'lucide-react';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { useToast } from '@/providers/ToastProvider';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { CATEGORY_CONFIG } from '@/components/documents/constants';
import { DetailDrawer } from '@/components/documents/DetailDrawer';
import { DocCard } from '@/components/documents/DocCard';
import {
  useConfirmRead,
  useDocuments,
  useFavoriteDocuments,
  usePendingReads,
  useRecentDocuments,
} from '@/components/documents/hooks';
import { UploadModal } from '@/components/documents/UploadModal';
import {
  CORPORATE_DOC_CATEGORIES,
  type Document,
  type DocFilters,
} from '@/components/documents/types';

type QuickFilter = 'all' | 'unread' | 'mandatory' | 'recent' | 'favorites' | 'active' | 'expired' | 'archived';

const QUICK_FILTERS: { id: QuickFilter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'unread', label: 'Não lidos' },
  { id: 'mandatory', label: 'Obrigatórios' },
  { id: 'recent', label: 'Recentes' },
  { id: 'favorites', label: 'Favoritos' },
  { id: 'active', label: 'Em vigor' },
  { id: 'expired', label: 'Expirados' },
  { id: 'archived', label: 'Arquivo' },
];

const AUTHOR_ROLES = ['ADMIN', 'RH', 'GESTOR'];

export function CorporateDocsTab() {
  const role = useCurrentRole();
  const notify = useToast();
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [category, setCategory] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const statusFilterMap: Partial<Record<QuickFilter, DocFilters['status']>> = {
    active: 'ACTIVE',
    expired: 'EXPIRED',
    archived: 'ARCHIVED',
  };

  const filters: DocFilters = {
    search: '',
    category,
    sensitivity: '',
    tag: '',
    expiringSoon: false,
    status: statusFilterMap[quickFilter] ?? '',
    requiresReadConfirmation: quickFilter === 'mandatory',
  };

  const usingList = quickFilter !== 'unread' && quickFilter !== 'recent' && quickFilter !== 'favorites';
  const { data: listData, loading: listLoading, refetch } = useDocuments(filters);
  const { data: pending, loading: pendingLoading } = usePendingReads();
  const { data: recent, loading: recentLoading } = useRecentDocuments();
  const { data: favorites, loading: favLoading } = useFavoriteDocuments();
  const confirmRead = useConfirmRead();

  const canAuthor = !!role && AUTHOR_ROLES.includes(role);

  const handleDownload = async (doc: Document) => {
    try {
      const result = await apiClient.get<{ fileUrl: string }>(`/documents/${doc.id}/download`);
      window.open(result.fileUrl, '_blank');
    } catch (e) {
      reportError(e, { source: 'CorporateDocsTab.handleDownload' });
      notify({ title: e instanceof Error ? e.message : String(e), intent: 'danger' });
    }
  };

  const docsToShow: Document[] =
    quickFilter === 'recent' ? recent : quickFilter === 'favorites' ? favorites : (listData?.data ?? []);
  const loading =
    quickFilter === 'recent' ? recentLoading : quickFilter === 'favorites' ? favLoading : listLoading;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-ink">Documentos Corporativos</h2>
          <p className="text-sm text-ink-muted">
            Normas, políticas, circulares, ordens de serviço, leis & regulamentos, procedimentos,
            formulários e modelos.
          </p>
        </div>
        {canAuthor && (
          <Button size="sm" onClick={() => setShowUpload(true)}>
            <Plus size={14} strokeWidth={1.75} /> Novo Documento
          </Button>
        )}
      </div>

      {/* Filtros rápidos */}
      <div className="flex flex-wrap gap-2">
        {QUICK_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setQuickFilter(f.id)}
            className={`px-3 py-1.5 text-xs rounded-pill border transition-colors ${
              quickFilter === f.id
                ? 'bg-primary text-canvas border-primary'
                : 'bg-surface text-ink-muted border-border hover:bg-surface-sunken'
            }`}
          >
            {f.label}
            {f.id === 'unread' && pending.length > 0 && (
              <span className="ml-1.5 rounded-pill bg-danger px-1.5 text-[10px] text-white">
                {pending.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Categorias */}
      {usingList && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setCategory('')}
            className={`px-2.5 py-1 text-xs rounded-control ${!category ? 'bg-primary-subtle text-primary font-semibold' : 'text-ink-muted hover:bg-surface-sunken'}`}
          >
            Todas as categorias
          </button>
          {CORPORATE_DOC_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(category === c ? '' : c)}
              className={`px-2.5 py-1 text-xs rounded-control ${category === c ? 'bg-primary-subtle text-primary font-semibold' : 'text-ink-muted hover:bg-surface-sunken'}`}
            >
              {CATEGORY_CONFIG[c].label}
            </button>
          ))}
        </div>
      )}

      {/* Conteúdo */}
      {quickFilter === 'unread' ? (
        pendingLoading ? (
          <Skeleton rows={4} />
        ) : pending.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Tudo lido"
            description="Não tem leituras obrigatórias pendentes."
          />
        ) : (
          <div className="space-y-2">
            {pending.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-card border border-border bg-surface p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{p.title}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge intent={CATEGORY_CONFIG[p.category].intent}>
                      {CATEGORY_CONFIG[p.category].label}
                    </Badge>
                    {p.deadline && (
                      <span className={`text-xs ${p.overdue ? 'text-danger' : 'text-ink-faint'}`}>
                        {p.overdue ? 'Prazo expirado: ' : 'Prazo: '}
                        {new Date(p.deadline).toLocaleDateString('pt-PT')}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => confirmRead.mutate(p.id)}
                  loading={confirmRead.isPending}
                >
                  <CheckCircle2 size={14} strokeWidth={1.75} /> Confirmar leitura
                </Button>
              </div>
            ))}
          </div>
        )
      ) : loading ? (
        <Skeleton
          rows={8}
          wrapperClassName="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          itemClassName="h-40 rounded-panel bg-surface-sunken"
        />
      ) : docsToShow.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhum documento encontrado"
          description="Não há documentos para o filtro seleccionado."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {docsToShow.map((d) => (
            <DocCard key={d.id} doc={d} onView={setSelectedDoc} onDownload={handleDownload} />
          ))}
        </div>
      )}

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
