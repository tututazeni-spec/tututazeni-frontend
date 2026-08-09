// components/courses-learn/ModuleBuilder.tsx
// Construtor admin de módulos (criar/renomear/publicar/eliminar) — auto-
// contido (dados próprios via useApiQuery/useApiMutation + apresentação).
// Extraído de app/(platform)/courses/[courseId]/learn/page.tsx.

'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { useConfirm } from '@/providers/ConfirmProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { fmtDuration, lessonIcon, moduleTypeLabel } from './utils';
import { Skeleton } from './atoms';
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

  if (loading) return <Skeleton rows={4} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          {modules.length} módulos
        </div>
        <button
          onClick={() => setCreatingModule(true)}
          className="px-3 py-1.5 bg-blue-700 text-white text-xs font-medium rounded-lg hover:bg-blue-800"
        >
          + Adicionar módulo
        </button>
      </div>

      {/* Create module form */}
      {creatingModule && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <div className="text-xs font-medium text-blue-700 mb-2">
            Novo módulo
          </div>
          <input
            type="text"
            placeholder="Título do módulo"
            value={newModuleTitle}
            onChange={(e) => setNewModuleTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateModule()}
            autoFocus
            className="w-full text-sm border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white mb-2"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreateModule}
              disabled={!newModuleTitle.trim() || saving}
              className="px-3 py-1.5 bg-blue-700 text-white text-xs font-medium rounded-lg disabled:opacity-50"
            >
              {saving ? 'A criar…' : 'Criar'}
            </button>
            <button
              onClick={() => {
                setCreatingModule(false);
                setNewModuleTitle('');
              }}
              className="px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Module list */}
      <div className="space-y-2">
        {modules.map((mod, idx) => (
          <div
            key={mod.id}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden"
          >
            {/* Module header */}
            <div className="flex items-center gap-3 px-4 py-3">
              {/* Drag handle */}
              <span className="text-gray-300 cursor-grab text-sm">⠿</span>
              <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-mono flex-shrink-0">
                {idx + 1}
              </div>
              <div className="flex-1">
                {editingModule === mod.id ? (
                  <input
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
                    className="text-sm font-medium border border-blue-300 rounded px-2 py-0.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {mod.title}
                    </span>
                    {mod.type && (
                      <span className="text-xs text-gray-400">
                        {moduleTypeLabel(mod.type)}
                      </span>
                    )}
                    <span
                      className={`text-xs px-1.5 rounded ${mod.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}
                    >
                      {mod.status === 'PUBLISHED' ? 'Publicado' : 'Rascunho'}
                    </span>
                    {!mod.mandatory && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-1.5 rounded">
                        Opcional
                      </span>
                    )}
                  </div>
                )}
                <div className="text-xs text-gray-400 mt-0.5">
                  {mod._count.lessons} aulas
                  {mod.dripDays ? ` · Drip: ${mod.dripDays} dias` : ''}
                  {mod.progressionType === 'SEQUENTIAL'
                    ? ' · Sequencial'
                    : ' · Livre'}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-1">
                <button
                  onClick={() => setEditingModule(mod.id)}
                  className="w-7 h-7 text-xs text-gray-400 hover:text-gray-700 border border-gray-200 rounded-lg flex items-center justify-center"
                  title="Editar"
                >
                  ✏
                </button>
                {mod.status === 'DRAFT' && (
                  <button
                    onClick={() => handlePublish(mod.id)}
                    className="w-7 h-7 text-xs text-emerald-600 hover:text-emerald-800 border border-emerald-200 rounded-lg flex items-center justify-center"
                    title="Publicar"
                  >
                    ↑
                  </button>
                )}
                <button
                  onClick={() => handleDelete(mod.id)}
                  className="w-7 h-7 text-xs text-red-400 hover:text-red-600 border border-red-100 rounded-lg flex items-center justify-center"
                  title="Eliminar"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Lessons preview */}
            {mod.lessons.length > 0 && (
              <div className="border-t border-gray-100 px-4 py-2">
                {mod.lessons.slice(0, 3).map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center gap-2 py-1 text-xs text-gray-500"
                  >
                    <span>{lessonIcon(l.type)}</span>
                    <span className="truncate">{l.title}</span>
                    {l.durationMinutes && (
                      <span className="text-gray-300">
                        {fmtDuration(l.durationMinutes)}
                      </span>
                    )}
                  </div>
                ))}
                {mod.lessons.length > 3 && (
                  <div className="text-xs text-gray-400 mt-1">
                    +{mod.lessons.length - 3} mais aulas
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {modules.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
            Sem módulos. Adicione o primeiro módulo acima.
          </div>
        )}
      </div>
    </div>
  );
}
