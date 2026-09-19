// components/courses/ModulosView.tsx
// Vista "Módulos & Lições" (fundida na página única de Cursos — antigo
// separador de sidebar próprio em /courses/modulos, ver
// app/(platform)/courses/modulos/page.tsx que agora só redirecciona para
// cá). Gere o curso seleccionado, o estado do modal activo (via
// modalReducer) e o toast; delega apresentação aos componentes em
// components/courses-modulos/. Ver memory
// project_innova_component_separation_audit.
//
// O título "Módulos & Lições" já é mostrado pelo cabeçalho da página-mãe
// (TITLES[nav.view] em app/(platform)/courses/page.tsx) — este componente
// só renderiza as acções (Progresso / + Novo Módulo), não repete o h1.

import { useEffect, useReducer, useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Search, BookMarked, AlertTriangle, Package } from 'lucide-react';
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

interface ModulosViewProps {
  /** Deep-link vindo da aba Gestão ("Gerir módulos" num curso) ou de um
   *  bookmark antigo para /courses/modulos?courseId=N (ver redirect em
   *  app/(platform)/courses/modulos/page.tsx). */
  initialCourseId?: number;
}

export function ModulosView({ initialCourseId }: ModulosViewProps) {
  const [courseIdInput, setCourseIdInput] = useState(
    initialCourseId ? String(initialCourseId) : '',
  );
  const [submittedCourseId, setSubmittedCourseId] = useState<number | null>(
    initialCourseId ?? null,
  );
  const [modal, dispatchModal] = useReducer(modalReducer, { kind: 'none' });
  const toast = useToast();

  // Sincroniza sempre que o pai muda o courseId (ex.: clicar "Gerir
  // módulos" noutro curso enquanto já se está nesta aba) — ao contrário da
  // antiga leitura única de window.location no mount, este componente fica
  // montado enquanto se navega entre abas da página de Cursos.
  useEffect(() => {
    if (initialCourseId === undefined) return;
    setCourseIdInput(String(initialCourseId));
    setSubmittedCourseId(initialCourseId);
  }, [initialCourseId]);

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
  // Rotas reais são aninhadas sob /courses (courses.controller.ts) — não
  // existe nenhum /modules ou /lessons de topo no backend; a versão anterior
  // apontava para essas rotas inexistentes e rebentava sempre com 404.
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
      await apiClient.delete(`/courses/${submittedCourseId}/modules/${mod.id}`);
      await refetch();
      toast({ title: 'Módulo removido', intent: 'success' });
    } catch (e) {
      reportError(e, { source: 'ModulosView.deleteModule' });
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
      await apiClient.delete(`/courses/lessons/${lesson.id}`);
      await refetch();
      toast({ title: 'Lição removida', intent: 'success' });
    } catch (e) {
      reportError(e, { source: 'ModulosView.deleteLesson' });
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
      count: modules.flatMap((m) => m.lessons).filter((l) => l.type === k)
        .length,
    }))
    .filter((t) => t.count > 0);

  return (
    <div>
      {/* ── Acções ── */}
      <div className="flex justify-end items-start mb-6 flex-wrap gap-3">
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
          <h3 className="m-0 mb-3.5 flex items-center gap-1.5 text-sm font-bold text-ink">
            <Search size={16} strokeWidth={1.75} /> Seleccionar Curso
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
              <div className="w-10 h-10 rounded-lg bg-info-subtle flex items-center justify-center text-lg"></div>
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
              <div className="w-10 h-10 rounded-lg bg-success-subtle flex items-center justify-center text-success">
                <BookMarked size={18} strokeWidth={1.75} />
              </div>
              <div>
                <p className="m-0 text-xl font-extrabold text-success">
                  {totalLessons}
                </p>
                <p className="m-0 text-xs text-ink-muted">Lições</p>
              </div>
            </CardBody>
          </Card>
          {byType.map((t) => {
            const TypeIcon = t.icon;
            return (
              <Card key={t.key}>
                <CardBody className="p-4 flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{
                      background: t.bg,
                      color: t.color,
                    }}
                  >
                    <TypeIcon size={18} strokeWidth={1.75} />
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
            );
          })}
        </div>
      )}

      {/* ── Lista de módulos ── */}
      {status === 'error' ? (
        <Card>
          <CardBody className="text-center py-12 px-4">
            <AlertTriangle
              size={40}
              strokeWidth={1.5}
              className="mx-auto mb-3 text-danger"
            />
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
            <Package
              size={40}
              strokeWidth={1.5}
              className="mx-auto mb-3 text-ink-faint"
            />
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
          otherModules={modules}
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
          // Relê a lição a partir de `modules` (em vez do snapshot estático
          // `modal.editing`) para que actividades/recursos adicionados via
          // onRefresh apareçam na lista sem fechar o modal.
          editing={
            modal.editing
              ? (modules.flatMap((m) => m.lessons).find((l) => l.id === modal.editing?.id) ??
                modal.editing)
              : null
          }
          otherLessons={modules.find((m) => m.id === modal.moduleId)?.lessons ?? []}
          onClose={() => dispatchModal({ type: 'close' })}
          onSaved={async () => {
            await refetch();
            toast({
              title: modal.editing ? 'Lição actualizada!' : 'Lição criada!',
              intent: 'success',
            });
          }}
          onRefresh={refetch}
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
