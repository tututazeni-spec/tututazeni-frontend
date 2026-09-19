// components/live-classes/MaterialsView.tsx
// Separador "Materiais" (docs/aulas-ao-vivo.md secção 11) — agrega os
// materiais ligados às aulas (LiveClass.materialDocumentIds) e às sessões
// (LiveClassSession.materialDocumentIds, "materiais específicos da sessão")
// contra o repositório da Biblioteca (Document), mesmo padrão de FK "solta"
// que o resto do módulo já usa para isto (ver live-classes.service.ts#listMaterials).

'use client';

import { useState } from 'react';
import { FileText, Plus, Trash2, ExternalLink } from 'lucide-react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDateTime } from '@/lib/format';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import type { LiveClass, MaterialRow, PaginatedMeta } from './types';

function formatFileSize(bytes: number | null) {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AddMaterialModal({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const [liveClassId, setLiveClassId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [docSearch, setDocSearch] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<{ id: number; title: string } | null>(null);

  const { data: classesData } = useApiQuery<{ data: LiveClass[] }>(
    queryKeys.liveClasses.list({ limit: 100 }),
    '/live-classes',
    { params: { limit: 100 }, staleTime: STALE_TIME.DYNAMIC },
  );
  const classItems = (classesData?.data ?? []).map((c) => ({ value: String(c.id), label: c.topic }));

  const { data: sessions } = useApiQuery<{ id: number; seq: number }[]>(
    queryKeys.liveClasses.sessions(Number(liveClassId)),
    `/live-classes/${liveClassId}/sessions`,
    { staleTime: STALE_TIME.DYNAMIC, enabled: !!liveClassId },
  );
  const sessionItems = [
    { value: '', label: 'Material da aula (não de uma sessão específica)' },
    ...(sessions ?? []).map((s) => ({ value: String(s.id), label: `Sessão ${s.seq}` })),
  ];

  const { data: docResults } = useApiQuery<{ data: { id: number; title: string }[] }>(
    ['documents-picker', docSearch],
    '/documents',
    { params: { search: docSearch, limit: 10 }, staleTime: STALE_TIME.DYNAMIC, enabled: docSearch.length >= 2 },
  );

  const add = useApiMutation(
    () =>
      sessionId
        ? apiClient.post(`/live-classes/${liveClassId}/sessions/${sessionId}/materials`, {
            documentId: selectedDoc!.id,
          })
        : apiClient.post(`/live-classes/${liveClassId}/materials`, { documentId: selectedDoc!.id }),
    {
      invalidateKeys: [queryKeys.liveClasses.all],
      onSuccess: () => {
        toast({ title: 'Material associado.', intent: 'success' });
        onClose();
      },
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent title="Adicionar material">
        <div className="mt-4 space-y-4">
          <FormField label="Aula" htmlFor="mat-class">
            <Select
              items={classItems}
              value={liveClassId}
              onValueChange={(v) => {
                setLiveClassId(v);
                setSessionId('');
              }}
              placeholder="Escolher aula…"
              className="w-full"
            />
          </FormField>
          {liveClassId && (
            <FormField label="Âmbito" htmlFor="mat-session">
              <Select items={sessionItems} value={sessionId} onValueChange={setSessionId} className="w-full" />
            </FormField>
          )}
          <FormField label="Documento da Biblioteca" htmlFor="mat-doc">
            <Input
              id="mat-doc"
              placeholder="Pesquisar por título…"
              value={selectedDoc ? selectedDoc.title : docSearch}
              onChange={(e) => {
                setSelectedDoc(null);
                setDocSearch(e.target.value);
              }}
              className="w-full"
            />
            {!selectedDoc && docSearch.length >= 2 && (
              <div className="mt-1 max-h-40 overflow-y-auto rounded-control border border-border">
                {(docResults?.data ?? []).length === 0 ? (
                  <p className="px-3 py-2 font-body text-xs text-ink-faint">Sem resultados.</p>
                ) : (
                  docResults!.data.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setSelectedDoc(d)}
                      className="block w-full px-3 py-2 text-left font-body text-sm text-ink hover:bg-surface-sunken"
                    >
                      {d.title}
                    </button>
                  ))
                )}
              </div>
            )}
          </FormField>
        </div>
        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button intent="secondary" className="flex-1 justify-center" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="flex-1 justify-center"
            disabled={!liveClassId || !selectedDoc}
            loading={add.isPending}
            onClick={() => add.mutate(undefined)}
          >
            Associar
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}

export function MaterialsView({ canManage }: { canManage: boolean }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const params = { page, limit: 20, ...(search ? { search } : {}) };
  const { data, isLoading } = useApiQuery<PaginatedMeta<MaterialRow>>(
    queryKeys.liveClasses.materials(params),
    '/live-classes/materials',
    { params, staleTime: STALE_TIME.DYNAMIC, placeholderData: keepPreviousData },
  );
  const rows = data?.data ?? [];
  const totalPages = data?.meta.totalPages ?? 1;

  const remove = useApiMutation(
    (ref: { liveClassId: number; sessionId: number | null; documentId: number }) =>
      apiClient.delete(
        ref.sessionId
          ? `/live-classes/${ref.liveClassId}/sessions/${ref.sessionId}/materials/${ref.documentId}`
          : `/live-classes/${ref.liveClassId}/materials/${ref.documentId}`,
      ),
    {
      invalidateKeys: [queryKeys.liveClasses.all],
      onSuccess: () => toast({ title: 'Material removido.', intent: 'success' }),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  async function onRemove(row: MaterialRow, ref: MaterialRow['referencedBy'][number]) {
    const ok = await confirm({
      title: `Remover "${row.document.title}" de "${ref.topic}"?`,
      confirmLabel: 'Remover',
      destructive: true,
    });
    if (ok) remove.mutate({ liveClassId: ref.liveClassId, sessionId: ref.sessionId, documentId: row.document.id });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          placeholder="Pesquisar materiais…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-64"
        />
        {canManage && (
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus size={14} strokeWidth={1.75} />
            Adicionar material
          </Button>
        )}
      </div>

      {isLoading ? (
        <Skeleton rows={4} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Sem materiais"
          description="Os materiais aparecem aqui quando são associados a uma aula ou sessão (Etapa 5 do assistente, ou 'Adicionar material')."
        />
      ) : (
        <Card className="divide-y divide-border">
          {rows.map((row) => (
            <div key={row.document.id} className="flex flex-wrap items-start gap-3 px-4 py-3">
              <FileText size={16} strokeWidth={1.75} className="mt-0.5 shrink-0 text-ink-faint" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-ink">{row.document.title}</span>
                  <a
                    href={row.document.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-ink-faint hover:text-ink"
                  >
                    <ExternalLink size={12} strokeWidth={1.75} />
                  </a>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 font-body text-xs text-ink-faint">
                  <span>{row.document.category}</span>
                  <span>· {formatFileSize(row.document.fileSize)}</span>
                  <span>· {formatDateTime(row.document.createdAt)}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {row.referencedBy.map((ref) => (
                    <span
                      key={`${ref.liveClassId}-${ref.sessionId ?? 0}`}
                      className="inline-flex items-center gap-1 rounded bg-surface-sunken px-2 py-0.5 font-body text-xs text-ink-muted"
                    >
                      {ref.topic}
                      {ref.sessionSeq ? ` · Sessão ${ref.sessionSeq}` : ''}
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => onRemove(row, ref)}
                          className="ml-1 text-ink-faint hover:text-danger-ink"
                        >
                          <Trash2 size={11} strokeWidth={1.75} />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button intent="ghost" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            ← Anterior
          </Button>
          <span className="py-2 px-3 text-sm text-ink-muted">
            {page} / {totalPages}
          </span>
          <Button intent="ghost" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
            Seguinte →
          </Button>
        </div>
      )}

      {showAdd && <AddMaterialModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
