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
import { CONTENT_TYPE } from '@/components/courses-modulos/constants';
import { modalReducer } from '@/components/courses-modulos/modalReducer';
import {
  card,
  inputStyle,
  labelStyle,
  btnPrimary,
  btnGhost,
} from '@/components/courses-modulos/styles';
import { Toast } from '@/components/courses-modulos/Toast';
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

  const [toast, setToast] = useState<{
    msg: string;
    type: 'success' | 'error';
  } | null>(null);
  function showToast(msg: string, type: 'success' | 'error') {
    setToast({ msg, type });
  }

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
      showToast('Módulo removido', 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : String(e), 'error');
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
      showToast('Lição removida', 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : String(e), 'error');
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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: '#1e293b',
              margin: 0,
            }}
          >
            📦 Módulos & Lições
          </h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>
            Estrutura de conteúdo dos cursos
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => dispatchModal({ type: 'openProgress' })}
            style={{ ...btnGhost, background: '#f5f3ff', color: '#7c3aed' }}
          >
            📊 Progresso
          </button>
          {loaded && (
            <button
              onClick={() => dispatchModal({ type: 'openNewModule' })}
              style={btnPrimary}
            >
              + Novo Módulo
            </button>
          )}
        </div>
      </div>

      {/* ── Selector de curso ── */}
      <div style={{ ...card, marginBottom: 24 }}>
        <h3
          style={{
            margin: '0 0 14px',
            fontSize: 14,
            fontWeight: 700,
            color: '#1e293b',
          }}
        >
          🔍 Seleccionar Curso
        </h3>
        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'flex-end',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: 200 }}>
            <span style={labelStyle}>ID do Curso</span>
            <input
              style={inputStyle}
              type="number"
              value={courseIdInput}
              onChange={(e) => {
                setCourseIdInput(e.target.value);
                setSubmittedCourseId(null);
              }}
              placeholder="Ex: 1"
              onKeyDown={(e) => e.key === 'Enter' && loadCourse()}
            />
          </div>
          <button
            onClick={loadCourse}
            disabled={loading || !courseIdInput}
            style={{ ...btnPrimary, opacity: !courseIdInput ? 0.5 : 1 }}
          >
            {loading ? 'A carregar...' : 'Carregar Curso'}
          </button>
        </div>
      </div>

      {/* ── Stats (quando carregado) ── */}
      {loaded && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 12,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              ...card,
              padding: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
              }}
            >
              📦
            </div>
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 800,
                  color: '#1e40af',
                }}
              >
                {modules.length}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>
                Módulos
              </p>
            </div>
          </div>
          <div
            style={{
              ...card,
              padding: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: '#ecfdf5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
              }}
            >
              📖
            </div>
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 800,
                  color: '#16a34a',
                }}
              >
                {totalLessons}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>
                Lições
              </p>
            </div>
          </div>
          {byType.map((t) => (
            <div
              key={t.key}
              style={{
                ...card,
                padding: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: t.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                }}
              >
                {t.icon}
              </div>
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 20,
                    fontWeight: 800,
                    color: t.color,
                  }}
                >
                  {t.count}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>
                  {t.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Lista de módulos ── */}
      {status === 'error' ? (
        <div style={{ ...card, textAlign: 'center', padding: 60 }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>⚠️</p>
          <p style={{ color: '#dc2626', fontSize: 14 }}>
            {error?.message ?? 'Curso não encontrado'}
          </p>
        </div>
      ) : status !== 'ready' ? (
        <div style={{ ...card, textAlign: 'center', padding: 60 }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>📦</p>
          <p style={{ color: '#94a3b8', fontSize: 14 }}>
            Insere o ID do curso para gerir os seus módulos e lições.
          </p>
        </div>
      ) : modules.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: 60 }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>📦</p>
          <p style={{ color: '#94a3b8', fontSize: 14, margin: '0 0 16px' }}>
            Este curso não tem módulos ainda.
          </p>
          <button
            onClick={() => dispatchModal({ type: 'openNewModule' })}
            style={btnPrimary}
          >
            + Criar Primeiro Módulo
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
            showToast(
              modal.editing ? 'Módulo actualizado!' : 'Módulo criado!',
              'success',
            );
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
            showToast(
              modal.editing ? 'Lição actualizada!' : 'Lição criada!',
              'success',
            );
          }}
        />
      )}
      {modal.kind === 'progress' && (
        <ProgressModal
          onClose={() => dispatchModal({ type: 'close' })}
          onMarked={() => showToast('Lição marcada como concluída!', 'success')}
        />
      )}
      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
