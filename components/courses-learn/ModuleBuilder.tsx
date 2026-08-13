// components/courses-learn/ModuleBuilder.tsx
// Construtor admin de módulos (criar/renomear/publicar/eliminar) — auto-
// contido (dados próprios via useApiQuery/useApiMutation + apresentação).
// Extraído de app/(platform)/courses/[courseId]/learn/page.tsx.

'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Layers, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { useConfirm } from '@/providers/ConfirmProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Badge } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { fmtDuration, lessonIcon, moduleTypeLabel } from './utils';
import type { CourseDetail, Module } from './types';

interface ModuleBuilderProps {
  courseId: number;
}

export function ModuleBuilder({ courseId }: ModuleBuilderProps) {
  const qc = useQueryClient();
  const [editingModule, setEditingModule] = useState<number | null>(null);
  const [creatingModule, setCreatingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');

  const { data: course, isLoading: loading } = useApiQuery<CourseDetail>(
    queryKeys.courses.detail(courseId),
    `/courses/${courseId}`,
    { enabled: !!courseId, staleTime: STALE_TIME.DYNAMIC },
  );
  const modules: Module[] = course?.modules ?? [];
  const reload = () =>
    qc.invalidateQueries({ queryKey: queryKeys.courses.detail(courseId) });

  const createModule = useApiMutation(
    () => {
      const maxSeq = modules.reduce((m, mod) => Math.max(m, mod.seq), -1);
      return apiClient.post('/modules', {
        courseId,
        title: newModuleTitle,
        seq: maxSeq + 1,
      });
    },
    {
      invalidateKeys: [queryKeys.courses.detail(courseId)],
      onSuccess: () => {
        setNewModuleTitle('');
        setCreatingModule(false);
      },
      onError: (e) => alert(e.message),
    },
  );
  const saving = createModule.isPending;

  const handleCreateModule = () => {
    if (!newModuleTitle.trim()) return;
    createModule.mutate(undefined);
  };

  const handlePublish = async (moduleId: number) => {
    try {
      await apiClient.patch(`/modules/${moduleId}/publish`, {});
      await reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  const confirm = useConfirm();
  const handleDelete = async (moduleId: number) => {
    if (
      !(await confirm({
        title: 'Eliminar módulo?',
        message: 'Esta ação não pode ser desfeita.',
        confirmLabel: 'Eliminar',
        destructive: true,
      }))
    )
      return;
    try {
      await apiClient.delete(`/modules/${moduleId}`);
      await reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  if (loading)
    return <Skeleton rows={4} itemClassName="skeleton-shimmer h-12 rounded-card" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="font-body text-xs font-medium text-ink-faint uppercase tracking-wide">
          {modules.length} módulos
        </div>
        <Button size="sm" onClick={() => setCreatingModule(true)}>
          <Plus size={14} strokeWidth={1.75} />
          Adicionar módulo
        </Button>
      </div>

      {/* Create module form */}
      {creatingModule && (
        <div className="mb-4 p-4 rounded-card border border-primary bg-primary-subtle">
          <div className="font-body text-xs font-medium text-primary mb-2">
            Novo módulo
          </div>
          <Input
            type="text"
            placeholder="Título do módulo"
            value={newModuleTitle}
            onChange={(e) => setNewModuleTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateModule()}
            autoFocus
            className="w-full mb-2 bg-surface"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleCreateModule}
              disabled={!newModuleTitle.trim() || saving}
            >
              {saving ? 'A criar…' : 'Criar'}
            </Button>
            <Button
              size="sm"
              intent="secondary"
              onClick={() => {
                setCreatingModule(false);
                setNewModuleTitle('');
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Module list */}
      <div className="space-y-2">
        {modules.map((mod, idx) => (
          <Card key={mod.id} className="overflow-hidden">
            {/* Module header */}
            <div className="flex items-center gap-3 px-4 py-3">
              {/* Drag handle */}
              <span className="text-ink-faint cursor-grab text-sm">⠿</span>
              <div className="w-5 h-5 rounded-full bg-surface-sunken flex items-center justify-center font-data text-xs text-ink-muted flex-shrink-0">
                {idx + 1}
              </div>
              <div className="flex-1">
                {editingModule === mod.id ? (
                  <Input
                    type="text"
                    defaultValue={mod.title}
                    autoFocus
                    onBlur={async (e) => {
                      if (e.target.value !== mod.title) {
                        await apiClient.put(`/modules/${mod.id}`, {
                          title: e.target.value,
                        });
                        await reload();
                      }
                      setEditingModule(null);
                    }}
                    className="text-sm font-medium w-full"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-body text-sm font-medium text-ink">
                      {mod.title}
                    </span>
                    {mod.type && (
                      <span className="font-body text-xs text-ink-faint">
                        {moduleTypeLabel(mod.type)}
                      </span>
                    )}
                    <Badge intent={mod.status === 'PUBLISHED' ? 'success' : 'neutral'}>
                      {mod.status === 'PUBLISHED' ? 'Publicado' : 'Rascunho'}
                    </Badge>
                    {!mod.mandatory && <Badge intent="info">Opcional</Badge>}
                  </div>
                )}
                <div className="font-body text-xs text-ink-faint mt-0.5">
                  {mod._count.lessons} aulas
                  {mod.dripDays ? ` · Drip: ${mod.dripDays} dias` : ''}
                  {mod.progressionType === 'SEQUENTIAL'
                    ? ' · Sequencial'
                    : ' · Livre'}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-1">
                <IconButton
                  icon={Pencil}
                  label="Editar"
                  intent="ghost"
                  onClick={() => setEditingModule(mod.id)}
                />
                {mod.status === 'DRAFT' && (
                  <IconButton
                    icon={Upload}
                    label="Publicar"
                    intent="ghost"
                    className="hover:bg-success-subtle hover:text-success-ink"
                    onClick={() => handlePublish(mod.id)}
                  />
                )}
                <IconButton
                  icon={Trash2}
                  label="Eliminar"
                  intent="ghost"
                  className="hover:bg-danger-subtle hover:text-danger"
                  onClick={() => handleDelete(mod.id)}
                />
              </div>
            </div>

            {/* Lessons preview */}
            {mod.lessons.length > 0 && (
              <div className="border-t border-border px-4 py-2">
                {mod.lessons.slice(0, 3).map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center gap-2 py-1 font-body text-xs text-ink-muted"
                  >
                    <span>{lessonIcon(l.type)}</span>
                    <span className="truncate">{l.title}</span>
                    {l.durationMinutes && (
                      <span className="text-ink-faint">
                        {fmtDuration(l.durationMinutes)}
                      </span>
                    )}
                  </div>
                ))}
                {mod.lessons.length > 3 && (
                  <div className="font-body text-xs text-ink-faint mt-1">
                    +{mod.lessons.length - 3} mais aulas
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}

        {modules.length === 0 && (
          <EmptyState
            icon={Layers}
            title="Sem módulos"
            description="Adicione o primeiro módulo acima."
          />
        )}
      </div>
    </div>
  );
}
