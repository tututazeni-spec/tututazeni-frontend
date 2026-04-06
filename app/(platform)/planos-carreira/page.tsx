"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Position { name: string; level?: string; }
interface Department { name: string; }
interface UserRef { id: number; fullName: string; position?: Position; department?: Department; }
interface CareerGoal {
  id: number; careerPlanId: number; title: string;
  description?: string; category?: string;
  status: string; progress: number;
  dueDate?: string; completedAt?: string; createdAt: string;
}
interface CareerPlan {
  id: number; userId: number; title: string;
  description?: string; targetPosition?: string;
  targetDate?: string; status: string;
  createdAt: string;
  user?: UserRef;
  mentor?: { id: number; fullName: string };
  goals: CareerGoal[];
  _count?: { goals: number };
}
interface Progress {
  planId: number; total: number; completed: number; progress: number; goals: CareerGoal[];
}

// ─── Maps ─────────────────────────────────────────────────────────────────────
const PLAN_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:     { label: "Rascunho",  color: "#94a3b8", bg: "#f8fafc" },
  ACTIVE:    { label: "Activo",    color: "#16a34a", bg: "#ecfdf5" },
  COMPLETED: { label: "Concluído", color: "#1e40af", bg: "#eff6ff" },
  PAUSED:    { label: "Pausado",   color: "#f59e0b", bg: "#fffbeb" },
};
const GOAL_STATUS: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  PENDING:     { label: "Pendente",      color: "#94a3b8", bg: "#f8fafc",  icon: "⏳" },
  IN_PROGRESS: { label: "Em Progresso",  color: "#f59e0b", bg: "#fffbeb",  icon: "🔄" },
  COMPLETED:   { label: "Concluído",     color: "#16a34a", bg: "#ecfdf5",  icon: "✅" },
  CANCELLED:   { label: "Cancelado",     color: "#dc2626", bg: "#fef2f2",  icon: "❌" },
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: 24,
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0",
  borderRadius: 8, fontSize: 14, color: "#1e293b", background: "#fff",
  outline: "none", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 1,
  textTransform: "uppercase", color: "#64748b", marginBottom: 6,
};
const btnPrimary: React.CSSProperties = {
  padding: "10px 20px", background: "#1e40af", color: "#fff",
  border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
};
const btnGhost: React.CSSProperties = {
  padding: "10px 18px", background: "#f1f5f9", color: "#475569",
  border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
};
const btnSuccess: React.CSSProperties = {
  padding: "8px 14px", background: "#ecfdf5", color: "#16a34a",
  border: "1px solid #bbf7d0", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
};

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, []);
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 999,
      background: type === "success" ? "#ecfdf5" : "#fef2f2",
      border: `1px solid ${type === "success" ? "#bbf7d0" : "#fecaca"}`,
      borderRadius: 12, padding: "14px 20px", maxWidth: 360,
      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <span style={{ fontSize: 18 }}>{type === "success" ? "✅" : "❌"}</span>
      <p style={{ margin: 0, fontSize: 13, color: type === "success" ? "#16a34a" : "#dc2626", fontWeight: 600 }}>{msg}</p>
    </div>
  );
}

// ─── Progress Ring ────────────────────────────────────────────────────────────
function ProgressRing({ pct, size = 64 }: { pct: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color = pct >= 80 ? "#16a34a" : pct >= 40 ? "#f59e0b" : "#1e40af";
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={6} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: "stroke-dashoffset 0.6s" }} />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        style={{ fontSize: 13, fontWeight: 800, fill: color }}>{pct}%</text>
    </svg>
  );
}

// ─── Modal: Criar Plano ───────────────────────────────────────────────────────
function CreatePlanModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ userId: "", title: "", description: "", targetPosition: "", targetDate: "", mentorId: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.userId || !form.title) { setError("Utilizador e título são obrigatórios."); return; }
    setSaving(true);
    try {
      await api.post("/career-plans", {
        userId: +form.userId, title: form.title,
        description: form.description || undefined,
        targetPosition: form.targetPosition || undefined,
        targetDate: form.targetDate || undefined,
        mentorId: form.mentorId ? +form.mentorId : undefined,
      });
      onCreated(); onClose();
    } catch (e: any) { setError(e.message ?? "Erro ao criar plano"); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ ...card, width: "100%", maxWidth: 500, boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1e293b" }}>🗺️ Novo Plano de Carreira</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
        </div>
        <form onSubmit={submit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <span style={labelStyle}>ID do Utilizador *</span>
              <input style={inputStyle} type="number" value={form.userId} onChange={e => set("userId", e.target.value)} placeholder="Ex: 1" required />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <span style={labelStyle}>Título do Plano *</span>
              <input style={inputStyle} value={form.title} onChange={e => set("title", e.target.value)} placeholder="Ex: Plano de Desenvolvimento 2025" required />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <span style={labelStyle}>Descrição</span>
              <textarea style={{ ...inputStyle, height: 72, resize: "vertical" }} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Objectivos gerais do plano..." />
            </div>
            <div>
              <span style={labelStyle}>Cargo Alvo</span>
              <input style={inputStyle} value={form.targetPosition} onChange={e => set("targetPosition", e.target.value)} placeholder="Ex: Gestor Sénior" />
            </div>
            <div>
              <span style={labelStyle}>Data Alvo</span>
              <input style={inputStyle} type="date" value={form.targetDate} onChange={e => set("targetDate", e.target.value)} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <span style={labelStyle}>ID do Mentor (opcional)</span>
              <input style={inputStyle} type="number" value={form.mentorId} onChange={e => set("mentorId", e.target.value)} placeholder="Ex: 5" />
            </div>
          </div>
          {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginTop: 14 }}><p style={{ margin: 0, fontSize: 13, color: "#dc2626" }}>{error}</p></div>}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
            <button type="button" onClick={onClose} style={btnGhost}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>{saving ? "A criar..." : "Criar Plano"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal: Adicionar Objectivo ───────────────────────────────────────────────
function AddGoalModal({ planId, onClose, onAdded }: { planId: number; onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({ title: "", description: "", category: "", dueDate: "" });
  const [saving, setSaving] = useState(false);
  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/career-plans/goals", {
        careerPlanId: planId, title: form.title,
        description: form.description || undefined,
        category: form.category || undefined,
        dueDate: form.dueDate || undefined,
      });
      onAdded(); onClose();
    } catch (e: any) { alert(e.message ?? "Erro ao adicionar objectivo"); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ ...card, width: "100%", maxWidth: 440, boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1e293b" }}>🎯 Novo Objectivo</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
        </div>
        <form onSubmit={submit}>
          <div style={{ marginBottom: 14 }}>
            <span style={labelStyle}>Título *</span>
            <input style={inputStyle} value={form.title} onChange={e => set("title", e.target.value)} placeholder="Ex: Obter certificação PMP" required />
          </div>
          <div style={{ marginBottom: 14 }}>
            <span style={labelStyle}>Descrição</span>
            <textarea style={{ ...inputStyle, height: 68, resize: "vertical" }} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Detalhe do objectivo..." />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
            <div>
              <span style={labelStyle}>Categoria</span>
              <input style={inputStyle} value={form.category} onChange={e => set("category", e.target.value)} placeholder="Ex: Formação" />
            </div>
            <div>
              <span style={labelStyle}>Data Limite</span>
              <input style={inputStyle} type="date" value={form.dueDate} onChange={e => set("dueDate", e.target.value)} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={btnGhost}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>{saving ? "A adicionar..." : "Adicionar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal: Detalhe do Plano ──────────────────────────────────────────────────
function PlanDetailModal({ plan, onClose, onRefresh, showToast }: {
  plan: CareerPlan; onClose: () => void; onRefresh: () => void;
  showToast: (msg: string, type: "success" | "error") => void;
}) {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    api.get<Progress>(`/career-plans/${plan.id}/progress`).then(setProgress).catch(() => {});
  }, [plan.id]);

  async function activate() {
    setActivating(true);
    try {
      await api.patch(`/career-plans/${plan.id}/activate`, {});
      showToast("Plano activado!", "success");
      onRefresh(); onClose();
    } catch (e: any) { showToast(e.message ?? "Erro", "error"); }
    finally { setActivating(false); }
  }

  async function updateGoal(goalId: number, status: string, prog?: number) {
    try {
      await api.patch(`/career-plans/goals/${goalId}/status`, { status, progress: prog });
      const updated = await api.get<Progress>(`/career-plans/${plan.id}/progress`);
      setProgress(updated);
      showToast("Objectivo actualizado!", "success");
    } catch (e: any) { showToast(e.message ?? "Erro", "error"); }
  }

  const st = PLAN_STATUS[plan.status] ?? { label: plan.status, color: "#64748b", bg: "#f8fafc" };
  const goals = progress?.goals ?? plan.goals ?? [];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ ...card, width: "100%", maxWidth: 620, maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1e293b" }}>{plan.title}</h2>
              <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color }}>{st.label}</span>
            </div>
            {plan.user && <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>👤 {plan.user.fullName}</p>}
            {plan.mentor && <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b" }}>🎓 Mentor: {plan.mentor.fullName}</p>}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8", marginLeft: 12 }}>×</button>
        </div>

        {/* Info row */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
          {plan.targetPosition && (
            <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "#eff6ff", color: "#1e40af" }}>
              🎯 {plan.targetPosition}
            </span>
          )}
          {plan.targetDate && (
            <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "#fef3c7", color: "#92400e" }}>
              📅 {new Date(plan.targetDate).toLocaleDateString("pt-PT")}
            </span>
          )}
        </div>

        {plan.description && (
          <div style={{ padding: "12px 16px", background: "#f8fafc", borderRadius: 8, marginBottom: 20 }}>
            <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>{plan.description}</p>
          </div>
        )}

        {/* Progress */}
        {progress && (
          <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "16px 20px", background: "#eff6ff", borderRadius: 10, marginBottom: 20, border: "1px solid #bfdbfe" }}>
            <ProgressRing pct={progress.progress} size={72} />
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Progresso Geral</p>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
                {progress.completed} de {progress.total} objectivo(s) concluído(s)
              </p>
            </div>
          </div>
        )}

        {/* Goals */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1e293b" }}>🎯 Objectivos</h3>
          <button onClick={() => setShowAddGoal(true)} style={{ ...btnPrimary, padding: "7px 14px", fontSize: 12 }}>+ Objectivo</button>
        </div>

        {goals.length === 0 ? (
          <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "20px 0" }}>Nenhum objectivo adicionado.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            {goals.map(g => {
              const gs = GOAL_STATUS[g.status] ?? { label: g.status, color: "#64748b", bg: "#f8fafc", icon: "⚪" };
              return (
                <div key={g.id} style={{ padding: "14px 16px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fafafa" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{gs.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{g.title}</p>
                        <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: gs.bg, color: gs.color }}>{gs.label}</span>
                        {g.category && <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: "#f1f5f9", color: "#64748b" }}>{g.category}</span>}
                      </div>
                      {g.description && <p style={{ margin: "0 0 6px", fontSize: 12, color: "#64748b" }}>{g.description}</p>}
                      {g.dueDate && <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>📅 {new Date(g.dueDate).toLocaleDateString("pt-PT")}</p>}
                      {/* Progress bar */}
                      {g.status === "IN_PROGRESS" && (
                        <div style={{ marginTop: 8 }}>
                          <div style={{ height: 4, background: "#e2e8f0", borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${g.progress}%`, background: "#f59e0b", borderRadius: 2 }} />
                          </div>
                          <p style={{ margin: "3px 0 0", fontSize: 11, color: "#f59e0b", fontWeight: 600 }}>{g.progress}%</p>
                        </div>
                      )}
                    </div>
                    {/* Quick actions */}
                    {g.status !== "COMPLETED" && g.status !== "CANCELLED" && (
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        {g.status === "PENDING" && (
                          <button onClick={() => updateGoal(g.id, "IN_PROGRESS", 10)} style={{ ...btnGhost, padding: "5px 10px", fontSize: 11 }}>▶️</button>
                        )}
                        <button onClick={() => updateGoal(g.id, "COMPLETED", 100)} style={{ ...btnSuccess, padding: "5px 10px", fontSize: 11 }}>✅</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Activate */}
        {plan.status === "DRAFT" && (
          <button onClick={activate} disabled={activating} style={{ ...btnPrimary, width: "100%", opacity: activating ? 0.7 : 1 }}>
            {activating ? "A activar..." : "✅ Activar Plano"}
          </button>
        )}

        {showAddGoal && (
          <AddGoalModal planId={plan.id} onClose={() => setShowAddGoal(false)}
            onAdded={async () => {
              const updated = await api.get<Progress>(`/career-plans/${plan.id}/progress`);
              setProgress(updated);
              showToast("Objectivo adicionado!", "success");
            }} />
        )}
      </div>
    </div>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────
function PlanCard({ plan, onClick }: { plan: CareerPlan; onClick: () => void }) {
  const st = PLAN_STATUS[plan.status] ?? { label: plan.status, color: "#64748b", bg: "#f8fafc" };
  const total = plan._count?.goals ?? plan.goals?.length ?? 0;
  const completed = plan.goals?.filter(g => g.status === "COMPLETED").length ?? 0;
  const pct = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div onClick={onClick} style={{ ...card, cursor: "pointer", transition: "box-shadow 0.15s", borderLeft: `4px solid ${st.color}` }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)")}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div style={{
          width: 46, height: 46, borderRadius: 12, background: st.bg, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
        }}>🗺️</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{plan.title}</h3>
            <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: st.bg, color: st.color }}>{st.label}</span>
          </div>
          {plan.user && <p style={{ margin: "0 0 4px", fontSize: 12, color: "#64748b" }}>👤 {plan.user.fullName}</p>}
          {plan.targetPosition && <p style={{ margin: "0 0 4px", fontSize: 12, color: "#64748b" }}>🎯 {plan.targetPosition}</p>}
          {plan.targetDate && <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>📅 {new Date(plan.targetDate).toLocaleDateString("pt-PT")}</p>}
        </div>
        {total > 0 && <ProgressRing pct={pct} size={56} />}
      </div>
      {total > 0 && (
        <p style={{ margin: "12px 0 0", fontSize: 12, color: "#94a3b8" }}>
          {completed}/{total} objectivos concluídos
        </p>
      )}
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
type Tab = "my" | "all";

export default function CareerPlansPage() {
  const [tab, setTab]           = useState<Tab>("my");
  const [myPlan, setMyPlan]     = useState<CareerPlan | null | undefined>(undefined);
  const [allPlans, setAllPlans] = useState<CareerPlan[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<CareerPlan | null>(null);
  const [toast, setToast]       = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [filterStatus, setFilterStatus] = useState("");

  function showToast(msg: string, type: "success" | "error") { setToast({ msg, type }); }

  async function fetchAll() {
    setLoading(true);
    try {
      const [my, all] = await Promise.all([
        api.get<CareerPlan | null>("/career-plans/my").catch(() => null),
        api.get<{ data: CareerPlan[] }>("/career-plans").catch(() => ({ data: [] })),
      ]);
      setMyPlan(my);
      setAllPlans(all.data ?? []);
    } catch (e: any) {
      showToast(e.message ?? "Erro ao carregar", "error");
    } finally { setLoading(false); }
  }

  useEffect(() => { fetchAll(); }, []);

  const filtered = filterStatus ? allPlans.filter(p => p.status === filterStatus) : allPlans;
  const stats = {
    total: allPlans.length,
    active: allPlans.filter(p => p.status === "ACTIVE").length,
    completed: allPlans.filter(p => p.status === "COMPLETED").length,
    draft: allPlans.filter(p => p.status === "DRAFT").length,
  };

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", margin: 0 }}>🗺️ Planos de Carreira</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Desenvolvimento e progressão profissional</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={btnPrimary}>+ Novo Plano</button>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total",       value: stats.total,     icon: "🗺️", color: "#1e40af", bg: "#eff6ff" },
          { label: "Activos",     value: stats.active,    icon: "✅", color: "#16a34a", bg: "#ecfdf5" },
          { label: "Concluídos",  value: stats.completed, icon: "🏁", color: "#7c3aed", bg: "#f5f3ff" },
          { label: "Rascunhos",   value: stats.draft,     icon: "📝", color: "#94a3b8", bg: "#f8fafc" },
        ].map(s => (
          <div key={s.label} style={{ ...card, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{s.icon}</div>
            <div>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</p>
              <p style={{ margin: 0, fontSize: 11, color: "#64748b", fontWeight: 600 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 10, padding: 4, marginBottom: 24, width: "fit-content" }}>
        {([{ key: "my", label: "👤 Meu Plano" }, { key: "all", label: "📋 Todos os Planos" }] as { key: Tab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: "8px 20px", border: "none", cursor: "pointer", fontSize: 13,
            fontWeight: tab === t.key ? 700 : 500, borderRadius: 8,
            background: tab === t.key ? "#1e40af" : "transparent",
            color: tab === t.key ? "#fff" : "#64748b", transition: "all 0.15s",
          }}>{t.label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#94a3b8", fontSize: 14 }}>A carregar...</div>
      ) : tab === "my" ? (
        myPlan ? (
          <PlanCard plan={myPlan} onClick={() => setSelected(myPlan)} />
        ) : (
          <div style={{ ...card, textAlign: "center", padding: 60 }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>🗺️</p>
            <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 16px" }}>Ainda não tens um plano de carreira activo.</p>
            <button onClick={() => setShowCreate(true)} style={btnPrimary}>+ Criar Plano</button>
          </div>
        )
      ) : (
        <div>
          {/* Filtro */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {["", "DRAFT", "ACTIVE", "COMPLETED", "PAUSED"].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)} style={{
                padding: "6px 14px", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, borderRadius: 8,
                background: filterStatus === s ? "#1e40af" : "#f1f5f9",
                color: filterStatus === s ? "#fff" : "#64748b", transition: "all 0.15s",
              }}>
                {s === "" ? "Todos" : PLAN_STATUS[s]?.label ?? s}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div style={{ ...card, textAlign: "center", padding: 60 }}>
              <p style={{ color: "#94a3b8", fontSize: 14 }}>Nenhum plano encontrado.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
              {filtered.map(p => <PlanCard key={p.id} plan={p} onClick={() => setSelected(p)} />)}
            </div>
          )}
        </div>
      )}

      {/* ── Modais ── */}
      {showCreate && (
        <CreatePlanModal onClose={() => setShowCreate(false)}
          onCreated={() => { fetchAll(); showToast("Plano criado com sucesso!", "success"); }} />
      )}
      {selected && (
        <PlanDetailModal plan={selected} onClose={() => setSelected(null)}
          onRefresh={fetchAll} showToast={showToast} />
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}