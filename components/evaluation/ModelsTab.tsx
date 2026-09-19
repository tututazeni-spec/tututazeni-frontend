// components/evaluation/ModelsTab.tsx
// Separador "Modelos" (docs/modulo_evaluation.md pt.4) — biblioteca de
// modelos de avaliação (critérios+pesos+escala), usados pelo ciclo/wizard
// "Nova Avaliação". Mesmo padrão de acesso que CriteriaTab.

'use client';

import { useState } from 'react';
import { Layers, Pencil, Plus, Star } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { ADMIN_ROLES } from '@/lib/roles';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { TemplateFormModal } from './TemplateFormModal';
import type { EvalTemplate } from './types';

export function ModelsTab() {
  const role = useCurrentRole();
  const isAdmin = !!role && ADMIN_ROLES.includes(role);
  const notify = useToast();
  const confirm = useConfirm();

  const { data: templates = [], isLoading: loading } = useApiQuery<EvalTemplate[]>(
    queryKeys.evaluation.templates(),
    '/evaluations/templates',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  // 'new' = modal aberto para criar; um id = a editar (a lista só traz
  // `_count.criteria`, por isso busca-se o detalhe completo — com os links
  // criteriaId+weight — antes de montar o modal).
  const [editingId, setEditingId] = useState<number | 'new' | undefined>(undefined);
  const { data: editingDetail } = useApiQuery<EvalTemplate>(
    queryKeys.evaluation.templateDetail(typeof editingId === 'number' ? editingId : 0),
    `/evaluations/templates/${editingId}`,
    { enabled: typeof editingId === 'number' },
  );

  const remove = async (t: EvalTemplate) => {
    if (
      await confirm({
        title: `Remover o modelo "${t.name}"?`,
        message: 'Ciclos já criados a partir deste modelo não são afectados.',
        confirmLabel: 'Remover',
        destructive: true,
      })
    ) {
      try {
        await apiClient.delete(`/evaluations/templates/${t.id}`);
        notify({ title: 'Modelo removido', intent: 'success' });
      } catch {
        notify({ title: 'Não foi possível remover o modelo', intent: 'danger' });
      }
    }
  };

  if (loading)
    return (
      <Skeleton rows={3} wrapperClassName="space-y-3" itemClassName="skeleton-shimmer h-20 rounded-card" />
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-ink">Modelos de Avaliação</h3>
        {isAdmin && (
          <Button size="sm" onClick={() => setEditingId('new')}>
            <Plus size={16} strokeWidth={1.75} /> Novo Modelo
          </Button>
        )}
      </div>

      {templates.length === 0 ? (
        <EmptyState
          title="Sem modelos criados"
          description="Cria um modelo para reutilizar em ciclos e avaliações."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {templates.map((t) => (
            <Card key={t.id}>
              <CardBody>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-ink truncate">{t.name}</p>
                      {t.isDefault && (
                        <Badge intent="success">
                          <Star size={11} strokeWidth={1.75} className="inline mr-1" />
                          Por omissão
                        </Badge>
                      )}
                      {!t.isActive && <Badge intent="neutral">Inactivo</Badge>}
                    </div>
                    <p className="text-xs text-ink-faint mt-0.5">{t.type}</p>
                    {t.description && (
                      <p className="text-sm text-ink-muted mt-2 line-clamp-2">{t.description}</p>
                    )}
                    <p className="text-xs text-ink-faint mt-2">
                      <Layers size={13} strokeWidth={1.75} className="inline align-[-2px]" />{' '}
                      {t._count?.criteria ?? t.criteria?.length ?? 0} critérios
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="flex shrink-0 gap-1">
                      <Button
                        size="sm"
                        intent="ghost"
                        aria-label={`Editar ${t.name}`}
                        onClick={() => setEditingId(t.id)}
                      >
                        <Pencil size={14} strokeWidth={1.75} />
                      </Button>
                      <Button
                        size="sm"
                        intent="ghost"
                        aria-label={`Remover ${t.name}`}
                        onClick={() => remove(t)}
                      >
                        Remover
                      </Button>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {editingId === 'new' && (
        <TemplateFormModal template={null} onClose={() => setEditingId(undefined)} />
      )}
      {typeof editingId === 'number' && editingDetail && (
        <TemplateFormModal
          template={editingDetail}
          onClose={() => setEditingId(undefined)}
        />
      )}
    </div>
  );
}
