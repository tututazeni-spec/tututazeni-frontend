'use client';
// Container: gere o curso seleccionado, o estado do modal activo (via
// modalReducer) e o toast; delega apresentação aos componentes em
// components/courses-modulos/. Ver memory
// project_innova_component_separation_audit.

import { useReducer, useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { CONTENT_TYPE } from '@/components/courses-modulos/constants';
import { modalReducer } from '@/components/courses-modulos/modalReducer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { Card, CardBody } from '@/components/ui/Card';
import { ModuleModal } from '@/components/courses-modulos/ModuleModal';
import { LessonModal } from '@/components/courses-modulos/LessonModal';
import { ProgressModal } from '@/components/courses-modulos/ProgressModal';
import { ModuleBlock } from '@/components/courses-modulos/ModuleBlock';
import type { CourseModule, Lesson } from '@/components/courses-modulos/types';

export default function CourseModulesPage() {
  const [courseIdInput, setCourseIdInput] = useState('');
  const [submittedCourseId, setSubmittedCourseId] = useState<number | null>(
    null,
  );
  const [modal, dispatchModal] = useReducer(modalReducer, { kind: 'none' });
  const toast = useToast();

  // ── Fetch curso ──────────────────────────────────────────────────────────
  function loadCourse() {
    if (!courseIdInput) return;
    setSubmittedCourseId(+courseIdInput);
  }

  const {
    data: course,
    isLoading: loading,
    isError,
    error,
    refetch,
  } = useApiQuery<{ modules?: CourseModule[] }>(
    queryKeys.courses.detail(submittedCourseId ?? ''),
    `/courses/${submittedCourseId}`,
    { enabled: submittedCourseId !== null, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const modules = course?.modules ?? [];
  const status: 'empty' | 'loading' | 'error' | 'ready' =
    submittedCourseId === null
      ? 'empty'
      : loading
        ? 'loading'
        : isError
          ? 'error'
          : 'ready';
  const loaded = status === 'ready';

  const confirm = useConfirm();
  // ── Delete module ─────────────────────────────────────────────────────────
  async function deleteModule(mod: CourseModule) {
    if (
      !(await confirm({
        title: `Remover módulo "${mod.title}"?`,
        confirmLabel: 'Remover',
        destructive: true,
      }))
    )
      return;
    try {
      await apiClient.delete(`/modules/${mod.id}`);
      await refetch();
      toast({ title: 'Módulo removido', intent: 'success' });
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : String(e),
        intent: 'danger',
      });
    }
  }

  // ── Delete lesson ─────────────────────────────────────────────────────────
  async function deleteLesson(lesson: Lesson) {
    if (
      !(await confirm({
        title: `Remover lição "${lesson.title}"?`,
        confirmLabel: 'Remover',
        destructive: true,
      }))
    )
      return;
    try {
      await apiClient.delete(`/lessons/${lesson.id}`);
      await refetch();
      toast({ title: 'Lição removida', intent: 'success' });
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : String(e),
        intent: 'danger',
      });
    }
  }

  // Stats
  const totalLessons = modules.reduce((s, m) => s + m.lessons.length, 0);
  const byType = Object.keys(CONTENT_TYPE)
    .map((k) => ({
      key: k,
      ...CONTENT_TYPE[k],
      count: modules
        .flatMap((m) => m.lessons)
        .filter((l) => l.contentType === k).length,
    }))
    .filter((t) => t.count > 0);

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex justify-between items-start mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink m-0">
            Módulos & Lições
          </h1>
          <p className="text-ink-muted text-sm mt-1">
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => dispatchModal({ type: 'openProgress' })}
            intent="ghost"
            className="bg-primary-subtle"
          >
            Progresso
          </Button>
          {loaded && (
            <Button
              onClick={() => dispatchModal({ type: 'openNewModule' })}
              intent="primary"
            >
              + Novo Módulo
            </Button>
          )}
        </div>
      </div>

      {/* ── Selector de curso ── */}
      <Card className="mb-6">
        <CardBody>
          <h3 className="m-0 mb-3.5 text-sm font-bold text-ink">
            🔍 Seleccionar Curso
          </h3>
          <div className="flex gap-3 items-end flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <FormField label="ID do Curso" htmlFor="courseId">
                <Input
                  id="courseId"
                  type="number"
                  value={courseIdInput}
                  onChange={(e) => {
                    setCourseIdInput(e.target.value);
                    setSubmittedCourseId(null);
                  }}
                  placeholder="Ex: 1"
                  onKeyDown={(e) => e.key === 'Enter' && loadCourse()}
                />
              </FormField>
            </div>
            <Button
              onClick={loadCourse}
              disabled={loading || !courseIdInput}
              intent="primary"
              loading={loading}
            >
              {loading ? 'A carregar...' : 'Carregar Curso'}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* ── Stats (quando carregado) ── */}
      {loaded && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3 mb-6">
          <Card>
            <CardBody className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-info-subtle flex items-center justify-center text-lg">
              </div>
              <div>
                <p className="m-0 text-xl font-extrabold text-primary">
                  {modules.length}
                </p>
                <p className="m-0 text-xs text-ink-muted">Módulos</p>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success-subtle flex items-center justify-center text-lg">
                📖
              </div>
              <div>
                <p className="m-0 text-xl font-extrabold text-success">
                  {totalLessons}
                </p>
                <p className="m-0 text-xs text-ink-muted">Lições</p>
              </div>
            </CardBody>
          </Card>
          {byType.map((t) => (
            <Card key={t.key}>
              <CardBody className="p-4 flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                  style={{
                    background: t.bg,
                  }}
                >
                  {t.icon}
                </div>
                <div>
                  <p
                    className="m-0 text-xl font-extrabold"
                    style={{
                      color: t.color,
                    }}
                  >
                    {t.count}
                  </p>
                  <p className="m-0 text-xs text-ink-muted">{t.label}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* ── Lista de módulos ── */}
      {status === 'error' ? (
        <Card>
          <CardBody className="text-center py-12 px-4">
            <p className="text-3xl mb-3">⚠️</p>
            <p className="text-danger text-sm">
              {error?.message ?? 'Curso não encontrado'}
            </p>
          </CardBody>
        </Card>
      ) : status !== 'ready' ? (
        <Card>
          <CardBody className="text-center py-12 px-4">
            <p className="text-3xl mb-3"></p>
            <p className="text-ink-faint text-sm">
              Insere o ID do curso para gerir os seus módulos e lições.
            </p>
          </CardBody>
        </Card>
      ) : modules.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12 px-4">
            <p className="text-3xl mb-3">📦</p>
            <p className="text-ink-faint text-sm mb-4">
              Este curso não tem módulos ainda.
            </p>
            <Button
              onClick={() => dispatchModal({ type: 'openNewModule' })}
              intent="primary"
            >
              + Criar Primeiro Módulo
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {modules
            .sort((a, b) => a.seq - b.seq)
            .map((mod) => (
              <ModuleBlock
                key={mod.id}
                mod={mod}
                onEditModule={() =>
                  dispatchModal({ type: 'openEditModule', mod })
                }
                onDeleteModule={() => deleteModule(mod)}
                onAddLesson={() =>
                  dispatchModal({ type: 'openNewLesson', moduleId: mod.id })
                }
                onEditLesson={(l) =>
                  dispatchModal({
                    type: 'openEditLesson',
                    moduleId: mod.id,
                    lesson: l,
                  })
                }
                onDeleteLesson={deleteLesson}
              />
            ))}
        </div>
      )}

      {/* ── Modais ── */}
      {modal.kind === 'module' && (
        <ModuleModal
          courseId={submittedCourseId!}
          editing={modal.editing}
          onClose={() => dispatchModal({ type: 'close' })}
          onSaved={() => {
            refetch();
            toast({
              title: modal.editing ? 'Módulo actualizado!' : 'Módulo criado!',
              intent: 'success',
            });
          }}
        />
      )}
      {modal.kind === 'lesson' && (
        <LessonModal
          moduleId={modal.moduleId}
          editing={modal.editing}
          onClose={() => dispatchModal({ type: 'close' })}
          onSaved={async () => {
            await refetch();
            toast({
              title: modal.editing ? 'Lição actualizada!' : 'Lição criada!',
              intent: 'success',
            });
          }}
        />
      )}
      {modal.kind === 'progress' && (
        <ProgressModal
          onClose={() => dispatchModal({ type: 'close' })}
          onMarked={() =>
            toast({
              title: 'Lição marcada como concluída!',
              intent: 'success',
            })
          }
        />
      )}
    </div>
  );
}
