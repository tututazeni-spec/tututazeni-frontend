"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Course {
  id: number; title: string; description?: string; category?: string;
  workloadHours?: number; mandatory: boolean; active: boolean; createdAt: string;
  _count?: { enrollments: number; feedbacks: number };
  competencies?: { competency: { id: number; name: string } }[];
  analytics?: { totalEnrollments: number; totalCompleted: number };
  feedbacks?: { id: number; comment: string; rating: number; user: { fullName: string } }[];
}
interface Analytics {
  analytics: { totalEnrollments: number; totalCompleted: number } | null;
  enrollmentsByStatus: { status: string; _count: number }[];
  feedbackStats: { _avg: { rating: number | null }; _count: number };
  recentActivity: { id: number; user: { fullName: string }; enrolledAt: string; status: string }[];
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const card: React.CSSProperties = { background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: 24 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, color: "#1e293b", background: "#fff", outline: "none", boxSizing: "border-box" };
const labelStyle: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#64748b", marginBottom: 6 };
const btnPrimary: React.CSSProperties = { padding: "10px 20px", background: "#1e40af", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" };
const btnGhost: React.CSSProperties = { padding: "10px 18px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" };
const btnDanger: React.CSSProperties = { padding: "7px 12px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer" };

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, []);
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 999, background: type === "success" ? "#ecfdf5" : "#fef2f2", border: `1px solid ${type === "success" ? "#bbf7d0" : "#fecaca"}`, borderRadius: 12, padding: "14px 20px", maxWidth: 360, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 18 }}>{type === "success" ? "✅" : "❌"}</span>
      <p style={{ margin: 0, fontSize: 13, color: type === "success" ? "#16a34a" : "#dc2626", fontWeight: 600 }}>{msg}</p>
    </div>
  );
}

// ─── Stars ────────────────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <span>
      {[1,2,3,4,5].map(n => (
        <span key={n} style={{ color: n <= Math.round(rating) ? "#f59e0b" : "#e2e8f0", fontSize: 14 }}>★</span>
      ))}
    </span>
  );
}

// ─── Modal: Criar / Editar Curso ──────────────────────────────────────────────
function CourseModal({ editing, categories, onClose, onSaved }: {
  editing: Course | null; categories: string[];
  onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: editing?.title ?? "",
    description: editing?.description ?? "",
    category: editing?.category ?? "",
    workloadHours: editing?.workloadHours ?? "",
    mandatory: editing?.mandatory ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  function set(k: string, v: any) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      const payload = { ...form, workloadHours: form.workloadHours ? +form.workloadHours : undefined };
      if (editing) await api.put(`/courses/${editing.id}`, payload);
      else await api.post("/courses", payload);
      onSaved(); onClose();
    } catch (e: any) { setError(e.message ?? "Erro ao guardar"); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ ...card, width: "100%", maxWidth: 520, boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1e293b" }}>{editing ? "✏️ Editar Curso" : "📚 Novo Curso"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
        </div>
        <form onSubmit={submit}>
          <div style={{ marginBottom: 14 }}><span style={labelStyle}>Título *</span><input style={inputStyle} value={form.title} onChange={e => set("title", e.target.value)} required /></div>
          <div style={{ marginBottom: 14 }}><span style={labelStyle}>Descrição</span><textarea style={{ ...inputStyle, height: 72, resize: "vertical" }} value={form.description} onChange={e => set("description", e.target.value)} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <span style={labelStyle}>Categoria</span>
              <input style={inputStyle} list="cats" value={form.category} onChange={e => set("category", e.target.value)} placeholder="Ex: Liderança" />
              <datalist id="cats">{categories.map(c => <option key={c} value={c ?? ""} />)}</datalist>
            </div>
            <div><span style={labelStyle}>Carga Horária (h)</span><input style={inputStyle} type="number" min={0} value={form.workloadHours} onChange={e => set("workloadHours", e.target.value)} /></div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input type="checkbox" checked={form.mandatory} onChange={e => set("mandatory", e.target.checked)} style={{ width: 16, height: 16, accentColor: "#1e40af" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>Curso Obrigatório</span>
            </label>
          </div>
          {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}><p style={{ margin: 0, fontSize: 13, color: "#dc2626" }}>{error}</p></div>}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={btnGhost}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>{saving ? "A guardar..." : editing ? "Guardar Alterações" : "Criar Curso"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal: Feedback ──────────────────────────────────────────────────────────
function FeedbackModal({ course, onClose, onSaved }: { course: Course; onClose: () => void; onSaved: () => void }) {
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);
  const [saving, setSaving] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try { await api.post(`/courses/${course.id}/feedback`, { comment, rating }); onSaved(); onClose(); }
    catch (e: any) { alert(e.message); } finally { setSaving(false); }
  }
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ ...card, width: "100%", maxWidth: 420, boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1e293b" }}>⭐ Avaliar Curso</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
        </div>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b" }}>{course.title}</p>
        <form onSubmit={submit}>
          <div style={{ marginBottom: 16 }}>
            <span style={labelStyle}>Classificação</span>
            <div style={{ display: "flex", gap: 8 }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} type="button" onClick={() => setRating(n)} style={{ fontSize: 28, background: "none", border: "none", cursor: "pointer", color: n <= rating ? "#f59e0b" : "#e2e8f0", transition: "color 0.1s" }}>★</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 20 }}><span style={labelStyle}>Comentário *</span><textarea style={{ ...inputStyle, height: 80, resize: "vertical" }} value={comment} onChange={e => setComment(e.target.value)} required placeholder="Partilha a tua opinião sobre o curso..." /></div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={btnGhost}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>{saving ? "A enviar..." : "Enviar Avaliação"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal: Detalhe do Curso ──────────────────────────────────────────────────
function CourseDetailModal({ course, onClose, onEdit, onDelete, onFeedback, showToast }: {
  course: Course; onClose: () => void; onEdit: () => void;
  onDelete: () => void; onFeedback: () => void;
  showToast: (m: string, t: "success" | "error") => void;
}) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [detail, setDetail] = useState<Course | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    api.get<Course>(`/courses/${course.id}`).then(setDetail).catch(() => {});
    setLoadingAnalytics(true);
    api.get<Analytics>(`/courses/${course.id}/analytics`).then(setAnalytics).catch(() => {}).finally(() => setLoadingAnalytics(false));
  }, [course.id]);

  const c = detail ?? course;
  const avgRating = analytics?.feedbackStats._avg.rating ?? 0;
  const completionRate = analytics?.analytics
    ? analytics.analytics.totalEnrollments > 0
      ? Math.round((analytics.analytics.totalCompleted / analytics.analytics.totalEnrollments) * 100)
      : 0
    : 0;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ ...card, width: "100%", maxWidth: 640, maxHeight: "92vh", overflow: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1e293b" }}>{c.title}</h2>
              <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: c.active ? "#ecfdf5" : "#f8fafc", color: c.active ? "#16a34a" : "#94a3b8" }}>{c.active ? "Activo" : "Inactivo"}</span>
              {c.mandatory && <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: "#eff6ff", color: "#1e40af" }}>Obrigatório</span>}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {c.category && <span style={{ fontSize: 12, color: "#64748b" }}>📂 {c.category}</span>}
              {c.workloadHours && <span style={{ fontSize: 12, color: "#64748b" }}>⏱️ {c.workloadHours}h</span>}
              {avgRating > 0 && <span style={{ fontSize: 12, color: "#f59e0b" }}>⭐ {avgRating.toFixed(1)}</span>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0, marginLeft: 12 }}>
            <button onClick={onFeedback} style={{ ...btnGhost, padding: "7px 12px", fontSize: 12 }}>⭐ Avaliar</button>
            <button onClick={onEdit} style={{ ...btnGhost, padding: "7px 12px", fontSize: 12 }}>✏️</button>
            <button onClick={onDelete} style={{ ...btnDanger }}>🗑️</button>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
          </div>
        </div>

        {c.description && <p style={{ margin: "0 0 20px", fontSize: 13, color: "#475569", lineHeight: 1.6 }}>{c.description}</p>}

        {/* Analytics */}
        {!loadingAnalytics && analytics && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
            {[
              { label: "Inscrições", value: analytics.analytics?.totalEnrollments ?? 0, icon: "👥", color: "#1e40af" },
              { label: "Concluídos", value: analytics.analytics?.totalCompleted ?? 0, icon: "✅", color: "#16a34a" },
              { label: "Taxa Conclusão", value: `${completionRate}%`, icon: "📊", color: "#7c3aed" },
              { label: "Avaliações", value: analytics.feedbackStats._count, icon: "⭐", color: "#f59e0b" },
            ].map(s => (
              <div key={s.label} style={{ padding: "12px", background: "#f8fafc", borderRadius: 10, textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 18 }}>{s.icon}</p>
                <p style={{ margin: "4px 0 0", fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</p>
                <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Competências */}
        {c.competencies && c.competencies.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#1e293b" }}>🧠 Competências</h3>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {c.competencies.map(cc => (
                <span key={cc.competency.id} style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "#eff6ff", color: "#1e40af" }}>{cc.competency.name}</span>
              ))}
            </div>
          </div>
        )}

        {/* Módulos */}
        {(c as any).modules?.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#1e293b" }}>📦 Módulos ({(c as any).modules.length})</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {(c as any).modules.map((m: any) => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#f8fafc", borderRadius: 8 }}>
                  <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 700, minWidth: 20 }}>{m.seq}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", flex: 1 }}>{m.title}</span>
                  <span style={{ fontSize: 11, color: "#64748b" }}>{m.lessons?.length ?? 0} lições</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feedbacks recentes */}
        {c.feedbacks && c.feedbacks.length > 0 && (
          <div>
            <h3 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#1e293b" }}>💬 Avaliações Recentes</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {c.feedbacks.slice(0, 5).map(f => (
                <div key={f.id} style={{ padding: "10px 14px", background: "#f8fafc", borderRadius: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>{f.user.fullName}</span>
                    <Stars rating={f.rating} />
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: "#64748b", fontStyle: "italic" }}>"{f.comment}"</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actividade recente */}
        {analytics?.recentActivity && analytics.recentActivity.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <h3 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#1e293b" }}>🕐 Actividade Recente</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {analytics.recentActivity.slice(0, 5).map(a => (
                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#f8fafc", borderRadius: 8 }}>
                  <span style={{ fontSize: 13, color: "#1e293b", flex: 1 }}>{a.user.fullName}</span>
                  <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: a.status === "CONCLUIDO" ? "#ecfdf5" : "#fffbeb", color: a.status === "CONCLUIDO" ? "#16a34a" : "#f59e0b" }}>{a.status}</span>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>{new Date(a.enrolledAt).toLocaleDateString("pt-PT")}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Course Card ──────────────────────────────────────────────────────────────
function CourseCard({ course, onClick }: { course: Course; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{ ...card, cursor: "pointer", transition: "box-shadow 0.15s" }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)")}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg,#1e40af,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>📚</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>{course.title}</h3>
            <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: course.active ? "#ecfdf5" : "#f8fafc", color: course.active ? "#16a34a" : "#94a3b8" }}>{course.active ? "Activo" : "Inactivo"}</span>
            {course.mandatory && <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: "#fef3c7", color: "#92400e" }}>Obrigatório</span>}
          </div>
          {course.description && <p style={{ margin: "0 0 8px", fontSize: 12, color: "#64748b", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{course.description}</p>}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {course.category && <span style={{ fontSize: 11, color: "#94a3b8" }}>📂 {course.category}</span>}
            {course.workloadHours && <span style={{ fontSize: 11, color: "#94a3b8" }}>⏱️ {course.workloadHours}h</span>}
            {course._count && <span style={{ fontSize: 11, color: "#94a3b8" }}>👥 {course._count.enrollments} inscrições</span>}
            {course._count && course._count.feedbacks > 0 && <span style={{ fontSize: 11, color: "#f59e0b" }}>⭐ {course._count.feedbacks} avaliações</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
type Tab = "all" | "mandatory" | "inactive";

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function CursosPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [page, setPage] = useState(1);

  const [courseModal, setCourseModal] = useState<Course | "new" | null>(null);
  const [detailModal, setDetailModal] = useState<Course | null>(null);
  const [feedbackModal, setFeedbackModal] = useState<Course | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error") { setToast({ msg, type }); }

  async function fetchCourses() {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) p.set("search", search);
      if (categoryFilter) p.set("category", categoryFilter);
      if (tab === "mandatory") p.set("mandatory", "true");
      if (tab === "inactive") p.set("active", "false");
      else if (tab === "all") p.set("active", "true");
      const res = await api.get<any>(`/courses?${p}`);
      setCourses(res.data ?? []); setTotal(res.total ?? 0);
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    api.get<string[]>("/courses/categories").then(c => setCategories(c.filter(Boolean) as string[])).catch(() => {});
  }, []);

  useEffect(() => { fetchCourses(); }, [search, categoryFilter, tab, page]);

  async function deleteCourse(id: number) {
    if (!confirm("Remover este curso?")) return;
    try {
      await api.delete(`/courses/${id}`);
      showToast("Curso removido!", "success");
      fetchCourses();
      setDetailModal(null);
    } catch (e: any) { showToast(e.message, "error"); }
  }

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", margin: 0 }}>📚 Cursos</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Catálogo de cursos — {total} no total</p>
        </div>
        <button onClick={() => setCourseModal("new")} style={btnPrimary}>+ Novo Curso</button>
      </div>

      {/* ── Filtros ── */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <input style={{ ...inputStyle, maxWidth: 260 }} placeholder="🔍 Pesquisar curso..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        <select style={{ ...inputStyle, maxWidth: 180 }} value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}>
          <option value="">Todas as categorias</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 10, padding: 4, marginBottom: 24, width: "fit-content" }}>
        {([["all","📚 Activos"],["mandatory","⚠️ Obrigatórios"],["inactive","⏸️ Inactivos"]] as [Tab,string][]).map(([k,l]) => (
          <button key={k} onClick={() => { setTab(k); setPage(1); }} style={{ padding: "8px 18px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: tab === k ? 700 : 500, borderRadius: 8, background: tab === k ? "#1e40af" : "transparent", color: tab === k ? "#fff" : "#64748b", transition: "all 0.15s" }}>{l}</button>
        ))}
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>A carregar...</div>
      ) : courses.length === 0 ? (
        <div style={{ ...card, textAlign: "center", padding: 60 }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>📚</p>
          <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 16px" }}>Nenhum curso encontrado.</p>
          <button onClick={() => setCourseModal("new")} style={btnPrimary}>+ Criar Primeiro Curso</button>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {courses.map(c => <CourseCard key={c.id} course={c} onClick={() => setDetailModal(c)} />)}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Página {page} — {courses.length} de {total}</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} style={{ ...btnGhost, padding: "6px 14px", opacity: page === 1 ? 0.5 : 1 }}>← Anterior</button>
              <button onClick={() => setPage(p => p+1)} disabled={courses.length < 20} style={{ ...btnGhost, padding: "6px 14px", opacity: courses.length < 20 ? 0.5 : 1 }}>Seguinte →</button>
            </div>
          </div>
        </>
      )}

      {/* ── Modais ── */}
      {courseModal !== null && (
        <CourseModal editing={courseModal === "new" ? null : courseModal} categories={categories} onClose={() => setCourseModal(null)}
          onSaved={() => { fetchCourses(); showToast(courseModal === "new" ? "Curso criado!" : "Curso actualizado!", "success"); }} />
      )}
      {detailModal && (
        <CourseDetailModal course={detailModal} onClose={() => setDetailModal(null)}
          onEdit={() => { setCourseModal(detailModal); setDetailModal(null); }}
          onDelete={() => deleteCourse(detailModal.id)}
          onFeedback={() => { setFeedbackModal(detailModal); setDetailModal(null); }}
          showToast={showToast} />
      )}
      {feedbackModal && (
        <FeedbackModal course={feedbackModal} onClose={() => setFeedbackModal(null)}
          onSaved={() => { showToast("Avaliação enviada!", "success"); }} />
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}