"use client";
import { useEffect, useState, useReducer } from "react";
import { useApiQuery, useApiMutation } from "../../../../hooks/useApiQuery";
import { useAutoDismiss } from "../../../../hooks/useAutoDismiss";
import { apiClient } from "../../../../lib/apiClient";
import { queryKeys } from "../../../../lib/queryKeys";
import { STALE_TIME } from "../../../../lib/queryClient";
import { useConfirm } from "../../../../providers/ConfirmProvider";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Lesson {
  id: number; moduleId: number; title: string;
  contentType: string; videoUrl?: string; pdfUrl?: string; seq: number;
}
interface CourseModule {
  id: number; courseId: number; title: string; seq: number;
  lessons: Lesson[];
}
interface LessonProgress {
  id: number; lessonId: number; completed: boolean; completedAt?: string;
  lesson: Lesson & { module: CourseModule };
}

// ─── Maps ─────────────────────────────────────────────────────────────────────
const CONTENT_TYPE: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  VIDEO: { icon: "🎬", color: "#dc2626", bg: "#fef2f2", label: "Vídeo" },
  AVATAR: { icon: "🤖", color: "#7c3aed", bg: "#f5f3ff", label: "Avatar" },
  PDF: { icon: "📄", color: "#f59e0b", bg: "#fffbeb", label: "PDF" },
  QUIZ: { icon: "❓", color: "#0ea5e9", bg: "#f0f9ff", label: "Quiz" },
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const card: React.CSSProperties = { background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: 24 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, color: "#1e293b", background: "#fff", outline: "none", boxSizing: "border-box" };
const labelStyle: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#64748b", marginBottom: 6 };
const btnPrimary: React.CSSProperties = { padding: "10px 20px", background: "#1e40af", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" };
const btnGhost: React.CSSProperties = { padding: "10px 18px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" };
const btnDanger: React.CSSProperties = { padding: "6px 12px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer" };

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  useAutoDismiss(onClose, 4000);
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 999, background: type === "success" ? "#ecfdf5" : "#fef2f2", border: `1px solid ${type === "success" ? "#bbf7d0" : "#fecaca"}`, borderRadius: 12, padding: "14px 20px", maxWidth: 360, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 18 }}>{type === "success" ? "✅" : "❌"}</span>
      <p style={{ margin: 0, fontSize: 13, color: type === "success" ? "#16a34a" : "#dc2626", fontWeight: 600 }}>{msg}</p>
    </div>
  );
}

// ─── Modal: Módulo ────────────────────────────────────────────────────────────
function ModuleModal({ courseId, editing, onClose, onSaved }: {
  courseId: number; editing: CourseModule | null;
  onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState({ title: editing?.title ?? "", seq: editing?.seq ?? 1 });
  const [saving, setSaving] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) await apiClient.put(`/modules/${editing.id}`, { title: form.title, seq: +form.seq });
      else await apiClient.post("/modules", { courseId, title: form.title, seq: +form.seq });
      onSaved(); onClose();
    } catch (e: any) { alert(e.message); } finally { setSaving(false); }
  }
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ ...card, width: "100%", maxWidth: 420, boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1e293b" }}>{editing ? "✏️ Editar Módulo" : "📦 Novo Módulo"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
        </div>
        <form onSubmit={submit}>
          <div style={{ marginBottom: 14 }}><span style={labelStyle}>Título *</span><input style={inputStyle} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required /></div>
          <div style={{ marginBottom: 20 }}><span style={labelStyle}>Sequência</span><input style={inputStyle} type="number" min={1} value={form.seq} onChange={e => setForm(f => ({ ...f, seq: +e.target.value }))} /></div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={btnGhost}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>{saving ? "A guardar..." : editing ? "Guardar" : "Criar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal: Lição ─────────────────────────────────────────────────────────────
function LessonModal({ moduleId, editing, onClose, onSaved }: {
  moduleId: number; editing: Lesson | null;
  onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: editing?.title ?? "",
    contentType: editing?.contentType ?? "VIDEO",
    videoUrl: editing?.videoUrl ?? "",
    pdfUrl: editing?.pdfUrl ?? "",
    seq: editing?.seq ?? 1,
  });
  const [saving, setSaving] = useState(false);
  function set(k: string, v: string | number) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { moduleId, title: form.title, contentType: form.contentType, seq: +form.seq, videoUrl: form.videoUrl || undefined, pdfUrl: form.pdfUrl || undefined };
      if (editing) await apiClient.put(`/lessons/${editing.id}`, payload);
      else await apiClient.post("/lessons", payload);
      onSaved(); onClose();
    } catch (e: any) { alert(e.message); } finally { setSaving(false); }
  }

  const ct = CONTENT_TYPE[form.contentType];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ ...card, width: "100%", maxWidth: 480, boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1e293b" }}>{editing ? "✏️ Editar Lição" : "📖 Nova Lição"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
        </div>
        <form onSubmit={submit}>
          <div style={{ marginBottom: 14 }}><span style={labelStyle}>Título *</span><input style={inputStyle} value={form.title} onChange={e => set("title", e.target.value)} required /></div>
          <div style={{ marginBottom: 14 }}>
            <span style={labelStyle}>Tipo de Conteúdo *</span>
            <div style={{ display: "flex", gap: 8 }}>
              {Object.entries(CONTENT_TYPE).map(([k, v]) => (
                <button key={k} type="button" onClick={() => set("contentType", k)} style={{ flex: 1, padding: "8px 0", border: `2px solid ${form.contentType === k ? v.color : "#e2e8f0"}`, borderRadius: 8, background: form.contentType === k ? v.bg : "#fff", cursor: "pointer", fontSize: 18, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <span>{v.icon}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: form.contentType === k ? v.color : "#94a3b8" }}>{v.label}</span>
                </button>
              ))}
            </div>
          </div>
          {(form.contentType === "VIDEO" || form.contentType === "AVATAR") && (
            <div style={{ marginBottom: 14 }}><span style={labelStyle}>URL do Vídeo</span><input style={inputStyle} value={form.videoUrl} onChange={e => set("videoUrl", e.target.value)} placeholder="https://..." /></div>
          )}
          {form.contentType === "PDF" && (
            <div style={{ marginBottom: 14 }}><span style={labelStyle}>URL do PDF</span><input style={inputStyle} value={form.pdfUrl} onChange={e => set("pdfUrl", e.target.value)} placeholder="https://..." /></div>
          )}
          <div style={{ marginBottom: 20 }}><span style={labelStyle}>Sequência</span><input style={inputStyle} type="number" min={1} value={form.seq} onChange={e => set("seq", +e.target.value)} /></div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={btnGhost}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>{saving ? "A guardar..." : editing ? "Guardar" : "Criar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal: Progresso ─────────────────────────────────────────────────────────
function ProgressModal({ onClose, onMarked }: { onClose: () => void; onMarked: () => void }) {
  const [enrollmentId, setEnrollmentId] = useState("");
  const [lessonId, setLessonId] = useState("");

  const progressQuery = useApiMutation(
    (enrId: string) => apiClient.get<LessonProgress[]>(`/lessons/progress/${enrId}`),
    { onError: (e) => alert(e.message) },
  );
  const progress = progressQuery.data ?? [];
  const loading = progressQuery.isPending;
  const loadProgress = () => { if (enrollmentId) progressQuery.mutate(enrollmentId); };

  const markCompleteMutation = useApiMutation(
    () => apiClient.post("/lessons/progress", { enrollmentId: +enrollmentId, lessonId: +lessonId }),
    {
      onSuccess: () => { onMarked(); loadProgress(); },
      onError: (e) => alert(e.message),
    },
  );
  const marking = markCompleteMutation.isPending;
  const markComplete = () => { if (enrollmentId && lessonId) markCompleteMutation.mutate(undefined); };

  const completedCount = progress.filter(p => p.completed).length;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ ...card, width: "100%", maxWidth: 540, maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1e293b" }}>📊 Progresso de Matrícula</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
        </div>

        {/* Marcar como concluída */}
        <div style={{ padding: "16px", background: "#f8fafc", borderRadius: 10, marginBottom: 20 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#1e293b" }}>✅ Marcar Lição como Concluída</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, alignItems: "flex-end" }}>
            <div><span style={labelStyle}>ID Matrícula</span><input style={inputStyle} type="number" value={enrollmentId} onChange={e => setEnrollmentId(e.target.value)} placeholder="Ex: 1" /></div>
            <div><span style={labelStyle}>ID Lição</span><input style={inputStyle} type="number" value={lessonId} onChange={e => setLessonId(e.target.value)} placeholder="Ex: 3" /></div>
            <button onClick={markComplete} disabled={marking || !enrollmentId || !lessonId} style={{ ...btnPrimary, opacity: marking ? 0.7 : 1, whiteSpace: "nowrap" }}>
              {marking ? "..." : "✅ Marcar"}
            </button>
          </div>
        </div>

        {/* Ver progresso */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}><span style={labelStyle}>Ver Progresso (ID Matrícula)</span><input style={inputStyle} type="number" value={enrollmentId} onChange={e => setEnrollmentId(e.target.value)} placeholder="Ex: 1" /></div>
            <button onClick={loadProgress} disabled={loading || !enrollmentId} style={{ ...btnGhost, opacity: !enrollmentId ? 0.5 : 1 }}>🔍 Ver</button>
          </div>
        </div>

        {progress.length > 0 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#eff6ff", borderRadius: 8, marginBottom: 12, border: "1px solid #bfdbfe" }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1e40af" }}>{completedCount} / {progress.length} lições concluídas</p>
              <div style={{ flex: 1, height: 6, background: "#bfdbfe", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${progress.length ? (completedCount / progress.length) * 100 : 0}%`, background: "#1e40af", borderRadius: 3 }} />
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {progress.map(p => {
                const ct = CONTENT_TYPE[p.lesson.contentType] ?? { icon: "📖", color: "#64748b", bg: "#f8fafc", label: p.lesson.contentType };
                return (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 8, background: p.completed ? "#ecfdf5" : "#f8fafc", border: `1px solid ${p.completed ? "#bbf7d0" : "#e2e8f0"}` }}>
                    <span style={{ fontSize: 18 }}>{ct.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{p.lesson.title}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>ID: {p.lessonId} · {ct.label}</p>
                    </div>
                    {p.completed
                      ? <span style={{ fontSize: 12, fontWeight: 700, color: "#16a34a" }}>✅ {p.completedAt ? new Date(p.completedAt).toLocaleDateString("pt-PT") : "Concluída"}</span>
                      : <span style={{ fontSize: 12, color: "#94a3b8" }}>Pendente</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Lesson Row ───────────────────────────────────────────────────────────────
function LessonRow({ lesson, onEdit, onDelete }: { lesson: Lesson; onEdit: () => void; onDelete: () => void }) {
  const ct = CONTENT_TYPE[lesson.contentType] ?? { icon: "📖", color: "#64748b", bg: "#f8fafc", label: lesson.contentType };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
      <span style={{ fontSize: 14, color: "#94a3b8", minWidth: 20, textAlign: "center", fontWeight: 700 }}>{lesson.seq}</span>
      <span style={{ fontSize: 18 }}>{ct.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lesson.title}</p>
        <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
          <span style={{ padding: "1px 7px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: ct.bg, color: ct.color }}>{ct.label}</span>
          {lesson.videoUrl && <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: "#1e40af" }}>🔗 Vídeo</a>}
          {lesson.pdfUrl && <a href={lesson.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: "#f59e0b" }}>🔗 PDF</a>}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button onClick={onEdit} style={{ ...btnGhost, padding: "5px 10px", fontSize: 12 }}>✏️</button>
        <button onClick={onDelete} style={{ ...btnDanger, padding: "5px 10px" }}>🗑️</button>
      </div>
    </div>
  );
}

// ─── Module Block ─────────────────────────────────────────────────────────────
function ModuleBlock({ mod, onEditModule, onDeleteModule, onAddLesson, onEditLesson, onDeleteLesson }: {
  mod: CourseModule;
  onEditModule: () => void; onDeleteModule: () => void;
  onAddLesson: () => void;
  onEditLesson: (l: Lesson) => void; onDeleteLesson: (l: Lesson) => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ ...card, padding: 0, overflow: "hidden" }}>
      {/* Module header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", background: "#f8fafc", borderBottom: open ? "1px solid #e2e8f0" : "none", cursor: "pointer" }} onClick={() => setOpen(o => !o)}>
        <span style={{ fontSize: 18 }}>{open ? "📂" : "📁"}</span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{mod.title}</p>
          <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>Módulo {mod.seq} · {mod.lessons.length} lição(ões)</p>
        </div>
        <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
          <button onClick={onAddLesson} style={{ ...btnPrimary, padding: "5px 10px", fontSize: 12 }}>+ Lição</button>
          <button onClick={onEditModule} style={{ ...btnGhost, padding: "5px 10px", fontSize: 12 }}>✏️</button>
          <button onClick={onDeleteModule} style={{ ...btnDanger, padding: "5px 10px" }}>🗑️</button>
        </div>
      </div>
      {/* Lessons */}
      {open && (
        <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
          {mod.lessons.length === 0
            ? <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "12px 0", margin: 0 }}>Nenhuma lição. Clica em &quot;+ Lição&quot; para adicionar.</p>
            : mod.lessons.map(l => (
                <LessonRow key={l.id} lesson={l}
                  onEdit={() => onEditLesson(l)}
                  onDelete={() => onDeleteLesson(l)} />
              ))}
        </div>
      )}
    </div>
  );
}

// ─── Modal trio (module / lesson / progress) ───────────────────────────────────
type ModalState =
  | { kind: "none" }
  | { kind: "module"; editing: CourseModule | null }
  | { kind: "lesson"; moduleId: number; editing: Lesson | null }
  | { kind: "progress" };

type ModalAction =
  | { type: "openNewModule" }
  | { type: "openEditModule"; mod: CourseModule }
  | { type: "openNewLesson"; moduleId: number }
  | { type: "openEditLesson"; moduleId: number; lesson: Lesson }
  | { type: "openProgress" }
  | { type: "close" };

function modalReducer(_state: ModalState, action: ModalAction): ModalState {
  switch (action.type) {
    case "openNewModule":  return { kind: "module", editing: null };
    case "openEditModule": return { kind: "module", editing: action.mod };
    case "openNewLesson":  return { kind: "lesson", moduleId: action.moduleId, editing: null };
    case "openEditLesson": return { kind: "lesson", moduleId: action.moduleId, editing: action.lesson };
    case "openProgress":   return { kind: "progress" };
    case "close":          return { kind: "none" };
  }
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function CourseModulesPage() {
  const [courseIdInput, setCourseIdInput] = useState("");
  const [submittedCourseId, setSubmittedCourseId] = useState<number | null>(null);
  const [modal, dispatchModal] = useReducer(modalReducer, { kind: "none" });

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  function showToast(msg: string, type: "success" | "error") { setToast({ msg, type }); }

  // ── Fetch curso ──────────────────────────────────────────────────────────
  function loadCourse() {
    if (!courseIdInput) return;
    setSubmittedCourseId(+courseIdInput);
  }

  const { data: course, isLoading: loading, isError, error, refetch } = useApiQuery<{ modules?: CourseModule[] }>(
    queryKeys.courses.detail(submittedCourseId ?? ""), `/courses/${submittedCourseId}`,
    { enabled: submittedCourseId !== null, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const modules = course?.modules ?? [];
  const status: "empty" | "loading" | "error" | "ready" =
    submittedCourseId === null ? "empty" :
    loading ? "loading" :
    isError ? "error" :
    "ready";
  const loaded = status === "ready";

  const confirm = useConfirm();
  // ── Delete module ─────────────────────────────────────────────────────────
  async function deleteModule(mod: CourseModule) {
    if (!(await confirm({ title: `Remover módulo "${mod.title}"?`, confirmLabel: 'Remover', destructive: true }))) return;
    try {
      await apiClient.delete(`/modules/${mod.id}`);
      await refetch();
      showToast("Módulo removido", "success");
    } catch (e: any) { showToast(e.message, "error"); }
  }

  // ── Delete lesson ─────────────────────────────────────────────────────────
  async function deleteLesson(lesson: Lesson) {
    if (!(await confirm({ title: `Remover lição "${lesson.title}"?`, confirmLabel: 'Remover', destructive: true }))) return;
    try {
      await apiClient.delete(`/lessons/${lesson.id}`);
      await refetch();
      showToast("Lição removida", "success");
    } catch (e: any) { showToast(e.message, "error"); }
  }

  // Stats
  const totalLessons = modules.reduce((s, m) => s + m.lessons.length, 0);
  const byType = Object.keys(CONTENT_TYPE).map(k => ({
    key: k, ...CONTENT_TYPE[k],
    count: modules.flatMap(m => m.lessons).filter(l => l.contentType === k).length,
  })).filter(t => t.count > 0);

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", margin: 0 }}>📦 Módulos & Lições</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Estrutura de conteúdo dos cursos</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => dispatchModal({ type: "openProgress" })} style={{ ...btnGhost, background: "#f5f3ff", color: "#7c3aed" }}>📊 Progresso</button>
          {loaded && <button onClick={() => dispatchModal({ type: "openNewModule" })} style={btnPrimary}>+ Novo Módulo</button>}
        </div>
      </div>

      {/* ── Selector de curso ── */}
      <div style={{ ...card, marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>🔍 Seleccionar Curso</h3>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <span style={labelStyle}>ID do Curso</span>
            <input style={inputStyle} type="number" value={courseIdInput} onChange={e => { setCourseIdInput(e.target.value); setSubmittedCourseId(null); }} placeholder="Ex: 1" onKeyDown={e => e.key === "Enter" && loadCourse()} />
          </div>
          <button onClick={loadCourse} disabled={loading || !courseIdInput} style={{ ...btnPrimary, opacity: !courseIdInput ? 0.5 : 1 }}>
            {loading ? "A carregar..." : "Carregar Curso"}
          </button>
        </div>
      </div>

      {/* ── Stats (quando carregado) ── */}
      {loaded && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
          <div style={{ ...card, padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📦</div>
            <div><p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1e40af" }}>{modules.length}</p><p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>Módulos</p></div>
          </div>
          <div style={{ ...card, padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📖</div>
            <div><p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#16a34a" }}>{totalLessons}</p><p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>Lições</p></div>
          </div>
          {byType.map(t => (
            <div key={t.key} style={{ ...card, padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{t.icon}</div>
              <div><p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: t.color }}>{t.count}</p><p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>{t.label}</p></div>
            </div>
          ))}
        </div>
      )}

      {/* ── Lista de módulos ── */}
      {status === "error" ? (
        <div style={{ ...card, textAlign: "center", padding: 60 }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>⚠️</p>
          <p style={{ color: "#dc2626", fontSize: 14 }}>{error?.message ?? "Curso não encontrado"}</p>
        </div>
      ) : status !== "ready" ? (
        <div style={{ ...card, textAlign: "center", padding: 60 }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>📦</p>
          <p style={{ color: "#94a3b8", fontSize: 14 }}>Insere o ID do curso para gerir os seus módulos e lições.</p>
        </div>
      ) : modules.length === 0 ? (
        <div style={{ ...card, textAlign: "center", padding: 60 }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>📦</p>
          <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 16px" }}>Este curso não tem módulos ainda.</p>
          <button onClick={() => dispatchModal({ type: "openNewModule" })} style={btnPrimary}>+ Criar Primeiro Módulo</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {modules.sort((a, b) => a.seq - b.seq).map(mod => (
            <ModuleBlock
              key={mod.id} mod={mod}
              onEditModule={() => dispatchModal({ type: "openEditModule", mod })}
              onDeleteModule={() => deleteModule(mod)}
              onAddLesson={() => dispatchModal({ type: "openNewLesson", moduleId: mod.id })}
              onEditLesson={l => dispatchModal({ type: "openEditLesson", moduleId: mod.id, lesson: l })}
              onDeleteLesson={deleteLesson}
            />
          ))}
        </div>
      )}

      {/* ── Modais ── */}
      {modal.kind === "module" && (
        <ModuleModal
          courseId={submittedCourseId!}
          editing={modal.editing}
          onClose={() => dispatchModal({ type: "close" })}
          onSaved={() => { refetch(); showToast(modal.editing ? "Módulo actualizado!" : "Módulo criado!", "success"); }}
        />
      )}
      {modal.kind === "lesson" && (
        <LessonModal
          moduleId={modal.moduleId}
          editing={modal.editing}
          onClose={() => dispatchModal({ type: "close" })}
          onSaved={async () => { await refetch(); showToast(modal.editing ? "Lição actualizada!" : "Lição criada!", "success"); }}
        />
      )}
      {modal.kind === "progress" && (
        <ProgressModal
          onClose={() => dispatchModal({ type: "close" })}
          onMarked={() => showToast("Lição marcada como concluída!", "success")}
        />
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}