"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Position   { id: number; name: string; }
interface Department { id: number; name: string; }
interface Competency { id: number; name: string; category: string; }

interface TeamMember {
  id: number;
  fullName: string;
  email: string;
  role: string;
  position?: Position;
  points?: { total: number }[];
  performanceReviews?: { overallScore: number; period: string }[];
}

interface Leader {
  id: number;
  fullName: string;
  email: string;
  role: string;
  position?: Position;
  department?: Department;
  _count?: { directReports: number };
  competencies?: { competency: Competency; score?: number }[];
  leaderProfile?: LeaderProfile;
}

interface LeaderProfile {
  id?: number;
  userId: number;
  leadershipStyle?: string;
  strengths?: string;
  developmentAreas?: string;
  user?: { id: number; fullName: string };
}

interface DashboardMetrics {
  pendingLeaves: number;
  activeEnrollments: number;
  avgPerformance: number;
  openTasks: number;
}

interface LeaderDashboard {
  leader: { id: number };
  team: { count: number; members: TeamMember[] };
  metrics: DashboardMetrics;
}

interface PerformanceReview {
  id: number;
  overallScore: number;
  period: string;
  createdAt: string;
  user: { id: number; fullName: string; position?: Position };
}

// ─── Utilities ────────────────────────────────────────────────────────────────

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}

function scoreColor(score: number) {
  if (score >= 4)  return { color: "#16a34a", bg: "#f0fdf4" };
  if (score >= 3)  return { color: "#2563eb", bg: "#eff6ff" };
  if (score >= 2)  return { color: "#d97706", bg: "#fffbeb" };
  return           { color: "#dc2626", bg: "#fef2f2" };
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function Avatar({ name, size = 36, role }: { name: string; size?: number; role?: string }) {
  const palette: Record<string, string> = {
    ADMIN: "#7c3aed", DIRECTOR: "#0369a1", GESTOR: "#0891b2", default: "#475569",
  };
  const color = palette[role ?? "default"] ?? palette.default;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: color + "18", border: `2px solid ${color}33`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.34, fontWeight: 700, color,
    }}>
      {getInitials(name)}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    ADMIN:    { label: "Admin",    color: "#7c3aed", bg: "#f5f3ff" },
    DIRECTOR: { label: "Director", color: "#0369a1", bg: "#e0f2fe" },
    GESTOR:   { label: "Gestor",   color: "#0891b2", bg: "#ecfeff" },
  };
  const s = map[role] ?? { label: role, color: "#64748b", bg: "#f1f5f9" };
  return (
    <span style={{ padding: "2px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: s.bg, color: s.color, textTransform: "uppercase", letterSpacing: 0.6 }}>
      {s.label}
    </span>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const { color, bg } = scoreColor(score);
  return (
    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 800, background: bg, color }}>
      {score.toFixed(1)}
    </span>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "60px 0" }}>
      <div style={{ width: 32, height: 32, border: "3px solid #e2e8f0", borderTopColor: "#0891b2", borderRadius: "50%", animation: "ldr-spin 0.7s linear infinite" }} />
      <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>A carregar...</p>
      <style>{`@keyframes ldr-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      background: type === "success" ? "#f0fdf4" : "#fef2f2",
      border: `1px solid ${type === "success" ? "#bbf7d0" : "#fecaca"}`,
      borderRadius: 12, padding: "12px 18px", maxWidth: 340,
      boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
      display: "flex", alignItems: "center", gap: 10,
      animation: "ldr-fadein 0.2s ease",
    }}>
      <span style={{ fontSize: 16 }}>{type === "success" ? "✓" : "✗"}</span>
      <p style={{ margin: 0, fontSize: 13, color: type === "success" ? "#16a34a" : "#dc2626", fontWeight: 500 }}>{msg}</p>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", marginLeft: "auto", color: "#94a3b8", fontSize: 16 }}>×</button>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color, bg, sub }: {
  icon: string; label: string; value: string | number;
  color: string; bg: string; sub?: string;
}) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 46, height: 46, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</p>
        <p style={{ margin: "2px 0 0", fontSize: 24, fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>{sub}</p>}
      </div>
    </div>
  );
}

// ─── Score Bar ────────────────────────────────────────────────────────────────

function ScoreBar({ score, max = 5 }: { score: number; max?: number }) {
  const pct = Math.min((score / max) * 100, 100);
  const { color } = scoreColor(score);
  return (
    <div>
      <div style={{ height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

// ─── Modal: Perfil de Liderança ───────────────────────────────────────────────

function ProfileModal({ leaders, initial, onClose, onSaved }: {
  leaders: Leader[];
  initial?: Leader | null;
  onClose: () => void;
  onSaved: (profile: LeaderProfile) => void;
}) {
  const [form, setForm] = useState<{
    userId: string; leadershipStyle: string; strengths: string; developmentAreas: string;
  }>({
    userId:           initial?.id?.toString() ?? "",
    leadershipStyle:  initial?.leaderProfile?.leadershipStyle ?? "",
    strengths:        initial?.leaderProfile?.strengths ?? "",
    developmentAreas: initial?.leaderProfile?.developmentAreas ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState("");

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.userId) { setErr("Selecciona um líder."); return; }
    setSaving(true); setErr("");
    try {
      // POST /leaders/profile — CreateLeaderProfileDto
      const saved = await api.post<LeaderProfile>("/leaders/profile", {
        userId:           +form.userId,
        leadershipStyle:  form.leadershipStyle  || undefined,
        strengths:        form.strengths        || undefined,
        developmentAreas: form.developmentAreas || undefined,
      });
      onSaved(saved);
      onClose();
    } catch (e: any) { setErr(e.message ?? "Erro ao guardar"); }
    finally { setSaving(false); }
  }

  const inp: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: 10,
    border: "1px solid #e2e8f0", fontSize: 13.5,
    color: "#1e293b", background: "#f8fafc",
    fontFamily: "inherit", outline: "none", boxSizing: "border-box",
  };
  const lbl: React.CSSProperties = {
    display: "block", fontSize: 10, fontWeight: 700, letterSpacing: 0.8,
    textTransform: "uppercase", color: "#64748b", marginBottom: 5,
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 28, width: "100%", maxWidth: 500, boxShadow: "0 24px 60px rgba(0,0,0,0.2)", animation: "ldr-up 0.2s ease" }}
        onClick={e => e.stopPropagation()}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1e293b" }}>
            {initial ? "✏️ Editar Perfil de Liderança" : "🌟 Novo Perfil de Liderança"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>×</button>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <span style={lbl}>Líder *</span>
            <select value={form.userId} onChange={e => set("userId", e.target.value)} style={inp} required disabled={!!initial}>
              <option value="">Seleccionar líder...</option>
              {leaders.map(l => <option key={l.id} value={l.id}>{l.fullName} — {l.position?.name ?? l.role}</option>)}
            </select>
          </div>

          <div>
            <span style={lbl}>Estilo de Liderança</span>
            <input value={form.leadershipStyle} onChange={e => set("leadershipStyle", e.target.value)} style={inp}
              placeholder="ex: Transformacional, Democrático, Coaching..." />
          </div>

          <div>
            <span style={lbl}>Pontos Fortes</span>
            <textarea value={form.strengths} onChange={e => set("strengths", e.target.value)}
              style={{ ...inp, height: 72, resize: "vertical", lineHeight: 1.55 }}
              placeholder="Descreve os pontos fortes deste líder..." />
          </div>

          <div>
            <span style={lbl}>Áreas de Desenvolvimento</span>
            <textarea value={form.developmentAreas} onChange={e => set("developmentAreas", e.target.value)}
              style={{ ...inp, height: 72, resize: "vertical", lineHeight: 1.55 }}
              placeholder="Áreas onde o líder deve crescer..." />
          </div>

          {err && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626" }}>{err}</div>}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ padding: "9px 20px", borderRadius: 10, background: "transparent", border: "1px solid #e2e8f0", cursor: "pointer", fontSize: 13, color: "#64748b", fontFamily: "inherit" }}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ padding: "9px 22px", borderRadius: 10, background: saving ? "#7dd3fc" : "#0891b2", border: "none", cursor: saving ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 }}>
              {saving && <div style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "ldr-spin 0.7s linear infinite" }} />}
              {saving ? "A guardar..." : "Guardar Perfil"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal: Dashboard de Líder ────────────────────────────────────────────────

function DashboardModal({ leader, onClose }: { leader: Leader; onClose: () => void }) {
  const [dashboard, setDashboard]   = useState<LeaderDashboard | null>(null);
  const [performance, setPerformance] = useState<PerformanceReview[]>([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState<"team" | "performance">("team");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      // GET /leaders/:id/dashboard
      api.get<LeaderDashboard>(`/leaders/${leader.id}/dashboard`),
      // GET /leaders/:id/team-performance
      api.get<PerformanceReview[]>(`/leaders/${leader.id}/team-performance`),
    ])
      .then(([d, p]) => { setDashboard(d); setPerformance(Array.isArray(p) ? p : []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [leader.id]);

  const TABS = [
    { key: "team",        label: "👥 Equipa"    },
    { key: "performance", label: "📊 Performance" },
  ] as const;

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: "7px 16px", border: "none", cursor: "pointer", fontSize: 12.5,
    fontWeight: active ? 700 : 500, borderRadius: 8,
    background: active ? "#0891b2" : "transparent",
    color: active ? "#fff" : "#64748b", transition: "all 0.15s",
  });

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, overflowY: "auto" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 700, maxHeight: "92vh", overflow: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.2)", animation: "ldr-up 0.2s ease" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: "22px 28px 18px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
            <Avatar name={leader.fullName} size={52} role={leader.role} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: "#1e293b" }}>{leader.fullName}</h2>
                <RoleBadge role={leader.role} />
              </div>
              {leader.position && <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b" }}>{leader.position.name}</p>}
              {leader.department && <p style={{ margin: "1px 0 0", fontSize: 12, color: "#94a3b8" }}>🏢 {leader.department.name}</p>}
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
          </div>

          {/* Metrics */}
          {dashboard && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {[
                { icon: "👥", label: "Equipa",         value: dashboard.team.count,              color: "#0891b2", bg: "#ecfeff" },
                { icon: "⏳", label: "Licenças Pend.", value: dashboard.metrics.pendingLeaves,    color: "#d97706", bg: "#fffbeb" },
                { icon: "📚", label: "Formações",      value: dashboard.metrics.activeEnrollments, color: "#7c3aed", bg: "#f5f3ff" },
                { icon: "✅", label: "Tarefas Abertas",value: dashboard.metrics.openTasks,        color: "#dc2626", bg: "#fef2f2" },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 18 }}>{s.icon}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</p>
                  <p style={{ margin: 0, fontSize: 10, color: "#64748b" }}>{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Avg performance highlight */}
        {dashboard && (
          <div style={{ margin: "0 28px", marginTop: 16, padding: "12px 16px", background: "linear-gradient(135deg, #0c4a6e, #0891b2)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>Performance Média da Equipa</p>
              <p style={{ margin: "2px 0 0", fontSize: 28, fontWeight: 800, color: "#fff" }}>
                {dashboard.metrics.avgPerformance.toFixed(1)} <span style={{ fontSize: 14, fontWeight: 400, opacity: 0.7 }}>/ 5.0</span>
              </p>
            </div>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>
              🎯
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ padding: "14px 28px 0" }}>
          <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 10, padding: 4, width: "fit-content" }}>
            {TABS.map(t => <button key={t.key} onClick={() => setActiveTab(t.key)} style={tabBtn(activeTab === t.key)}>{t.label}</button>)}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "16px 28px 24px" }}>
          {loading ? <Spinner /> : (
            <>
              {/* TEAM */}
              {activeTab === "team" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {(dashboard?.team.members ?? []).length === 0
                    ? <p style={{ color: "#94a3b8", textAlign: "center", padding: 24, fontSize: 13 }}>Sem membros de equipa.</p>
                    : (dashboard?.team.members ?? []).map(m => {
                        const lastReview = m.performanceReviews?.[0];
                        const pts = m.points?.reduce((s, p) => s + p.total, 0) ?? 0;
                        return (
                          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#f8fafc", borderRadius: 10 }}>
                            <Avatar name={m.fullName} size={36} role={m.role} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: "#1e293b" }}>{m.fullName}</p>
                              <p style={{ margin: "1px 0 0", fontSize: 11.5, color: "#64748b" }}>
                                {m.position?.name ?? m.role}
                                {pts > 0 && <span style={{ marginLeft: 8, color: "#d97706" }}>⭐ {pts} pts</span>}
                              </p>
                            </div>
                            {lastReview && (
                              <div style={{ textAlign: "right" }}>
                                <ScoreBadge score={lastReview.overallScore} />
                                <p style={{ margin: "2px 0 0", fontSize: 10, color: "#94a3b8" }}>{lastReview.period}</p>
                              </div>
                            )}
                          </div>
                        );
                      })
                  }
                </div>
              )}

              {/* PERFORMANCE */}
              {activeTab === "performance" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {performance.length === 0
                    ? <p style={{ color: "#94a3b8", textAlign: "center", padding: 24, fontSize: 13 }}>Sem avaliações de performance.</p>
                    : performance.map(r => {
                        const { color, bg } = scoreColor(r.overallScore);
                        return (
                          <div key={r.id} style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                              <Avatar name={r.user.fullName} size={32} />
                              <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{r.user.fullName}</p>
                                <p style={{ margin: "1px 0 0", fontSize: 11, color: "#64748b" }}>{r.user.position?.name ?? ""} · {r.period}</p>
                              </div>
                              <ScoreBadge score={r.overallScore} />
                            </div>
                            <ScoreBar score={r.overallScore} />
                            <p style={{ margin: "4px 0 0", fontSize: 10, color: "#94a3b8", textAlign: "right" }}>{fmtDate(r.createdAt)}</p>
                          </div>
                        );
                      })
                  }
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Leader Card ──────────────────────────────────────────────────────────────

function LeaderCard({ leader, onView, onEditProfile }: {
  leader: Leader;
  onView: () => void;
  onEditProfile: () => void;
}) {
  const [hov, setHov] = useState(false);
  const competencies = leader.competencies?.slice(0, 3) ?? [];
  const directReports = leader._count?.directReports ?? 0;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? "#fafcff" : "#fff",
        border: `1px solid ${hov ? "#bae6fd" : "#e2e8f0"}`,
        borderRadius: 16, padding: "18px 20px",
        transition: "all 0.18s ease",
        transform: hov ? "translateY(-2px)" : "none",
        display: "flex", flexDirection: "column", gap: 12,
      }}
    >
      {/* Top */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <Avatar name={leader.fullName} size={46} role={leader.role} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14.5, fontWeight: 700, color: "#1e293b" }}>{leader.fullName}</span>
            <RoleBadge role={leader.role} />
          </div>
          {leader.position && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>{leader.position.name}</p>}
          {leader.department && <p style={{ margin: "1px 0 0", fontSize: 11, color: "#94a3b8" }}>🏢 {leader.department.name}</p>}
        </div>
        <div style={{ textAlign: "center", background: "#ecfeff", borderRadius: 10, padding: "6px 10px", flexShrink: 0 }}>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0891b2" }}>{directReports}</p>
          <p style={{ margin: 0, fontSize: 9, color: "#0891b2", fontWeight: 700, textTransform: "uppercase" }}>Equipa</p>
        </div>
      </div>

      {/* Leadership profile */}
      {leader.leaderProfile?.leadershipStyle && (
        <div style={{ padding: "8px 12px", background: "#f0f9ff", borderRadius: 8, borderLeft: "3px solid #0891b2" }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#0369a1", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 2 }}>Estilo de Liderança</p>
          <p style={{ margin: 0, fontSize: 13, color: "#1e293b" }}>{leader.leaderProfile.leadershipStyle}</p>
        </div>
      )}

      {/* Strengths */}
      {leader.leaderProfile?.strengths && (
        <p style={{ margin: 0, fontSize: 12.5, color: "#475569", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          💪 {leader.leaderProfile.strengths}
        </p>
      )}

      {/* Competencies */}
      {competencies.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {competencies.map(c => (
            <span key={c.competency.id} style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10.5, fontWeight: 600, background: "#f5f3ff", color: "#7c3aed", border: "1px solid #e9d5ff" }}>
              {c.competency.name}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, paddingTop: 4, borderTop: "1px solid #f1f5f9" }}>
        <button onClick={onView} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: "#0891b2", color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: "pointer", transition: "opacity 0.15s" }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")} onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
          Ver Dashboard
        </button>
        <button onClick={onEditProfile} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "transparent", fontSize: 12.5, fontWeight: 600, cursor: "pointer", color: "#64748b" }}>
          ✏️ Perfil
        </button>
      </div>
    </div>
  );
}

// ─── My Dashboard Section ─────────────────────────────────────────────────────

function MyDashboard() {
  const [dashboard, setDashboard]   = useState<LeaderDashboard | null>(null);
  const [performance, setPerformance] = useState<PerformanceReview[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [activeTab, setActiveTab]   = useState<"team" | "performance">("team");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      // GET /leaders/my-dashboard
      api.get<LeaderDashboard>("/leaders/my-dashboard"),
    ])
      .then(([d]) => {
        setDashboard(d);
        // GET /leaders/:id/team-performance
        return api.get<PerformanceReview[]>(`/leaders/${d.leader.id}/team-performance`);
      })
      .then(p => setPerformance(Array.isArray(p) ? p : []))
      .catch(e => setError(e.message ?? "Erro ao carregar dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  if (error) return (
    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: 20, color: "#dc2626", fontSize: 13 }}>
      ❌ {error}
    </div>
  );

  if (!dashboard) return null;

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: "7px 16px", border: "none", cursor: "pointer", fontSize: 12.5,
    fontWeight: active ? 700 : 500, borderRadius: 8,
    background: active ? "#0891b2" : "transparent",
    color: active ? "#fff" : "#64748b",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
        <StatCard icon="👥" label="Membros da Equipa"  value={dashboard.team.count}                   color="#0891b2" bg="#ecfeff" />
        <StatCard icon="🎯" label="Performance Média" value={dashboard.metrics.avgPerformance.toFixed(1)} color="#7c3aed" bg="#f5f3ff" sub="escala 0–5" />
        <StatCard icon="⏳" label="Licenças Pendentes" value={dashboard.metrics.pendingLeaves}         color="#d97706" bg="#fffbeb" />
        <StatCard icon="📚" label="Formações Activas"  value={dashboard.metrics.activeEnrollments}     color="#0369a1" bg="#e0f2fe" />
        <StatCard icon="✅" label="Tarefas em Aberto"  value={dashboard.metrics.openTasks}             color="#dc2626" bg="#fef2f2" />
      </div>

      {/* Tabs */}
      <div>
        <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 10, padding: 4, width: "fit-content", marginBottom: 16 }}>
          <button onClick={() => setActiveTab("team")}        style={tabBtn(activeTab === "team")}>👥 Equipa ({dashboard.team.count})</button>
          <button onClick={() => setActiveTab("performance")} style={tabBtn(activeTab === "performance")}>📊 Performance</button>
        </div>

        {/* Team list */}
        {activeTab === "team" && (
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            {dashboard.team.members.length === 0
              ? <p style={{ padding: 32, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Sem membros na equipa.</p>
              : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                      {["Colaborador", "Cargo", "Pontos", "Última Avaliação"].map(h => (
                        <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.team.members.map(m => {
                      const review = m.performanceReviews?.[0];
                      const pts = m.points?.reduce((s, p) => s + p.total, 0) ?? 0;
                      return (
                        <tr key={m.id} style={{ borderBottom: "1px solid #f1f5f9" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#fafafa")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <Avatar name={m.fullName} size={32} role={m.role} />
                              <div>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{m.fullName}</p>
                                <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{m.email}</p>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: 13, color: "#64748b" }}>{m.position?.name ?? "—"}</td>
                          <td style={{ padding: "12px 16px" }}>
                            {pts > 0
                              ? <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "#fffbeb", color: "#d97706" }}>⭐ {pts}</span>
                              : <span style={{ color: "#94a3b8", fontSize: 12 }}>—</span>}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            {review
                              ? <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <ScoreBadge score={review.overallScore} />
                                  <span style={{ fontSize: 11, color: "#94a3b8" }}>{review.period}</span>
                                </div>
                              : <span style={{ color: "#94a3b8", fontSize: 12 }}>Sem avaliação</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
          </div>
        )}

        {/* Performance chart-style */}
        {activeTab === "performance" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {performance.length === 0
              ? <p style={{ padding: 32, textAlign: "center", color: "#94a3b8", fontSize: 13, background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0" }}>Sem avaliações de performance registadas.</p>
              : performance.map(r => {
                  const { color, bg } = scoreColor(r.overallScore);
                  return (
                    <div key={r.id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "14px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <Avatar name={r.user.fullName} size={34} />
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: "#1e293b" }}>{r.user.fullName}</p>
                          <p style={{ margin: 0, fontSize: 11.5, color: "#64748b" }}>{r.user.position?.name ?? ""} · {r.period}</p>
                        </div>
                        <ScoreBadge score={r.overallScore} />
                      </div>
                      <ScoreBar score={r.overallScore} />
                    </div>
                  );
                })
            }
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type MainTab = "my" | "all";

export default function LiderancaPage() {
  const [mainTab, setMainTab]   = useState<MainTab>("my");
  const [leaders, setLeaders]   = useState<Leader[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [search, setSearch]     = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Modals
  const [viewLeader, setViewLeader]     = useState<Leader | null>(null);
  const [editLeader, setEditLeader]     = useState<Leader | null>(null);
  const [showNewProfile, setShowNewProfile] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const showToast = (msg: string, type: "success" | "error") => setToast({ msg, type });

  const loadLeaders = useCallback(async () => {
    setLoading(true); setError("");
    try {
      // GET /leaders
      const res = await api.get<Leader[]>("/leaders");
      setLeaders(Array.isArray(res) ? res : (res as any)?.data ?? []);
    } catch (e: any) { setError(e.message ?? "Erro ao carregar líderes"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (mainTab === "all") loadLeaders();
  }, [mainTab, loadLeaders]);

  function handleProfileSaved(profile: LeaderProfile) {
    setLeaders(prev => prev.map(l =>
      l.id === profile.userId ? { ...l, leaderProfile: profile } : l
    ));
    showToast("Perfil de liderança guardado!", "success");
    setShowNewProfile(false);
    setEditLeader(null);
  }

  const filtered = leaders.filter(l => {
    const matchSearch = !search ||
      l.fullName.toLowerCase().includes(search.toLowerCase()) ||
      l.position?.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.department?.name?.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || l.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roles = [...new Set(leaders.map(l => l.role))];

  const mainTabBtn = (active: boolean): React.CSSProperties => ({
    padding: "9px 22px", border: "none", cursor: "pointer", fontSize: 13.5,
    fontWeight: active ? 700 : 500, borderRadius: 9,
    background: active ? "#0891b2" : "transparent",
    color: active ? "#fff" : "#64748b", transition: "all 0.15s",
  });

  return (
    <>
      <style>{`
        @keyframes ldr-spin   { to { transform: rotate(360deg); } }
        @keyframes ldr-up     { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        @keyframes ldr-fadein { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: none; } }
      `}</style>

      <div>
        {/* ── Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#1e293b" }}>👑 Liderança</h1>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: "#64748b" }}>
              Gestão de líderes, equipas, performance e perfis de liderança
            </p>
          </div>
          {mainTab === "all" && (
            <button onClick={() => setShowNewProfile(true)} style={{ padding: "9px 20px", background: "#0891b2", color: "#fff", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              🌟 Novo Perfil de Liderança
            </button>
          )}
        </div>

        {/* ── Main Tabs ── */}
        <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 11, padding: 4, marginBottom: 24, width: "fit-content" }}>
          <button onClick={() => setMainTab("my")}  style={mainTabBtn(mainTab === "my")}>🙋 O Meu Dashboard</button>
          <button onClick={() => setMainTab("all")} style={mainTabBtn(mainTab === "all")}>👥 Todos os Líderes</button>
        </div>

        {/* ═══════════════════════════════════════
            TAB: MEU DASHBOARD
        ═══════════════════════════════════════ */}
        {mainTab === "my" && <MyDashboard />}

        {/* ═══════════════════════════════════════
            TAB: TODOS OS LÍDERES
        ═══════════════════════════════════════ */}
        {mainTab === "all" && (
          <>
            {/* Filtros */}
            <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
              <input
                placeholder="🔍 Pesquisar por nome, cargo, departamento..."
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ flex: "1 1 280px", maxWidth: 360, padding: "9px 13px", borderRadius: 9, border: "1px solid #e2e8f0", fontSize: 13.5, color: "#1e293b", background: "#fff", outline: "none" }}
              />
              <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                style={{ padding: "9px 13px", borderRadius: 9, border: "1px solid #e2e8f0", fontSize: 13.5, color: "#1e293b", background: "#fff", outline: "none", minWidth: 160 }}>
                <option value="">Todos os roles</option>
                {roles.map((r, i) => <option key={`${r}-${i}`} value={r}>{r}</option>)}
              </select>
              {(search || roleFilter) && (
                <button onClick={() => { setSearch(""); setRoleFilter(""); }}
                  style={{ padding: "9px 14px", borderRadius: 9, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 13, color: "#64748b" }}>
                  ✕ Limpar
                </button>
              )}
            </div>

            {/* Erro */}
            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: 16, color: "#dc2626", fontSize: 13, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>❌ {error}</span>
                <button onClick={loadLeaders} style={{ padding: "5px 12px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 7, fontSize: 12, cursor: "pointer" }}>Tentar novamente</button>
              </div>
            )}

            {/* Grid */}
            {loading
              ? <Spinner />
              : leaders.length === 0
                ? (
                  <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: "60px 24px", textAlign: "center" }}>
                    <p style={{ fontSize: 36, marginBottom: 12 }}>👑</p>
                    <p style={{ fontSize: 15, fontWeight: 600, color: "#1e293b", margin: "0 0 8px" }}>Sem líderes registados</p>
                    <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 20px" }}>Os utilizadores com role GESTOR, DIRECTOR ou ADMIN aparecerão aqui.</p>
                  </div>
                ) : filtered.length === 0
                  ? <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, padding: 32 }}>Nenhum líder corresponde aos filtros.</p>
                  : (
                    <>
                      <p style={{ margin: "0 0 14px", fontSize: 12.5, color: "#94a3b8" }}>
                        {filtered.length} líder{filtered.length !== 1 ? "es" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
                      </p>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
                        {filtered.map(l => (
                          <LeaderCard
                            key={l.id}
                            leader={l}
                            onView={() => setViewLeader(l)}
                            onEditProfile={() => setEditLeader(l)}
                          />
                        ))}
                      </div>
                    </>
                  )
            }
          </>
        )}
      </div>

      {/* ── Modals ── */}
      {viewLeader && (
        <DashboardModal leader={viewLeader} onClose={() => setViewLeader(null)} />
      )}

      {(showNewProfile || editLeader) && (
        <ProfileModal
          leaders={leaders}
          initial={editLeader}
          onClose={() => { setShowNewProfile(false); setEditLeader(null); }}
          onSaved={handleProfileSaved}
        />
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
