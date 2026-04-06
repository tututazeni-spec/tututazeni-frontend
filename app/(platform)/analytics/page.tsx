"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Overview {
  users: { total: number; active: number };
  courses: { total: number; active: number };
  enrollments: { total: number; completed: number; completionRate: number };
  engagement: { totalPoints: number; totalBadges: number; totalLearningPaths: number; activeMicroLearnings: number };
}

interface LearningAnalytics {
  enrollmentsByStatus: { status: string; _count: number }[];
  topCourses: { course: { id: number; title: string; category?: string }; totalCompleted: number; totalEnrollments: number; avgScore?: number }[];
  performanceByPeriod: { period: string; _avg: { score: number } }[];
  monthlyEnrollments: { month: string; count: number }[];
}

interface EngagementMetrics {
  totalUsers: number;
  activeUsersLast30Days: number;
  engagementRate: number;
  microLearningViews: number;
  knowledgeInteractions: number;
  aiTutorSessions: number;
  topUsers: { user: { id: number; fullName: string }; points: number }[];
}

interface ROI {
  impacts: { id: number; courseId: number; metric: string; impactRate: number; calculatedAt: string }[];
  totalHoursInvested: number;
  totalCompletions: number;
}

interface Snapshot {
  id: number;
  totalUsers: number;
  totalCoursesCompleted: number;
  averageScore: number;
  activePlans: number;
  generatedAt: string;
  department?: { name: string };
}

interface Department { id: number; name: string }

// ─── Styles ───────────────────────────────────────────────────────────────────
const btnPrimary: React.CSSProperties = {
  padding: "10px 20px", background: "#1e40af", color: "#fff",
  border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
};
const btnGhost: React.CSSProperties = {
  padding: "10px 20px", background: "#f1f5f9", color: "#475569",
  border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
};
const card: React.CSSProperties = {
  background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20,
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, bg, icon }: {
  label: string; value: string | number; sub?: string;
  color: string; bg: string; icon: string;
}) {
  return (
    <div style={{ ...card, display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14, background: bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22, flexShrink: 0,
      }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</p>
        <p style={{ margin: "4px 0 0", fontSize: 26, fontWeight: 800, color }}>{value}</p>
        {sub && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>{sub}</p>}
      </div>
    </div>
  );
}

// ─── Bar Chart (CSS) ──────────────────────────────────────────────────────────
function BarChart({ data, color = "#1e40af", height = 160 }: {
  data: { label: string; value: number }[]; color?: string; height?: number;
}) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height, padding: "0 4px" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
            <div style={{
              width: "100%", height: `${Math.max((d.value / max) * 100, 2)}%`,
              background: color, borderRadius: "4px 4px 0 0", transition: "height 0.5s ease",
              position: "relative",
            }}>
              <span style={{
                position: "absolute", top: -20, left: "50%", transform: "translateX(-50%)",
                fontSize: 10, fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap",
              }}>{d.value}</span>
            </div>
          </div>
          <span style={{ fontSize: 9, color: "#94a3b8", textAlign: "center", lineHeight: 1.2 }}>
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Donut Chart (SVG) ───────────────────────────────────────────────────────
function DonutChart({ value, max, color, label }: {
  value: number; max: number; color: string; label: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const r = 36, c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ position: "relative", width: 88, height: 88 }}>
        <svg width="88" height="88" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
          <circle
            cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${dash} ${c}`} strokeDashoffset={c / 4}
            strokeLinecap="round" style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0, display: "flex",
          alignItems: "center", justifyContent: "center",
          fontSize: 15, fontWeight: 800, color: "#1e293b",
        }}>{Math.round(pct)}%</div>
      </div>
      <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500, textAlign: "center" }}>{label}</span>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", margin: 0 }}>{title}</h2>
      {action}
    </div>
  );
}

// ─── Tab ─────────────────────────────────────────────────────────────────────
type Tab = "overview" | "learning" | "engagement" | "roi" | "snapshots";

const TAB_STYLE = (active: boolean): React.CSSProperties => ({
  padding: "8px 18px", border: "none", cursor: "pointer", fontSize: 13,
  fontWeight: active ? 700 : 500, borderRadius: 8,
  background: active ? "#1e40af" : "transparent",
  color: active ? "#fff" : "#64748b",
  transition: "all 0.15s",
});

const STATUS_LABEL: Record<string, string> = {
  EM_ANDAMENTO: "Em Andamento",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};
const STATUS_COLOR: Record<string, string> = {
  EM_ANDAMENTO: "#f59e0b",
  CONCLUIDO: "#10b981",
  CANCELADO: "#ef4444",
};

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [tab, setTab]                   = useState<Tab>("overview");
  const [overview, setOverview]         = useState<Overview | null>(null);
  const [learning, setLearning]         = useState<LearningAnalytics | null>(null);
  const [engagement, setEngagement]     = useState<EngagementMetrics | null>(null);
  const [roi, setRoi]                   = useState<ROI | null>(null);
  const [snapshots, setSnapshots]       = useState<Snapshot[]>([]);
  const [departments, setDepartments]   = useState<Department[]>([]);
  const [deptId, setDeptId]             = useState("");
  const [generating, setGenerating]     = useState(false);
  const [loading, setLoading]           = useState<Record<Tab, boolean>>({
    overview: true, learning: true, engagement: true, roi: false, snapshots: false,
  });
  const [error, setError]               = useState("");

  // Carregar dados por tab
  useEffect(() => {
    // Overview sempre
    api.get<Overview>("/analytics/overview")
      .then(setOverview)
      .catch(e => setError(e.message))
      .finally(() => setLoading(l => ({ ...l, overview: false })));

    // Learning
    api.get<LearningAnalytics>("/analytics/learning")
      .then(setLearning)
      .finally(() => setLoading(l => ({ ...l, learning: false })));

    // Engagement
    api.get<EngagementMetrics>("/analytics/engagement")
      .then(setEngagement)
      .finally(() => setLoading(l => ({ ...l, engagement: false })));

    // Departments para filtros
    api.get<any>("/departments?limit=100")
      .then(r => setDepartments(r?.data ?? r ?? []))
      .catch(() => {});
  }, []);

  function loadRoi() {
    setLoading(l => ({ ...l, roi: true }));
    api.get<ROI>("/analytics/roi")
      .then(setRoi)
      .catch(e => setError(e.message))
      .finally(() => setLoading(l => ({ ...l, roi: false })));
  }

  function loadSnapshots() {
    setLoading(l => ({ ...l, snapshots: true }));
    api.get<Snapshot[]>("/analytics/snapshots")
      .then(setSnapshots)
      .catch(e => setError(e.message))
      .finally(() => setLoading(l => ({ ...l, snapshots: false })));
  }

  async function generateSnapshot() {
    setGenerating(true);
    try {
      // POST /analytics/snapshots/generate
      await api.post("/analytics/snapshots/generate", {});
      loadSnapshots();
    } catch (e: any) { alert(e.message); }
    finally { setGenerating(false); }
  }

  function handleTab(t: Tab) {
    setTab(t);
    if (t === "roi" && !roi) loadRoi();
    if (t === "snapshots" && snapshots.length === 0) loadSnapshots();
  }

  const isLoading = loading[tab];

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", margin: 0 }}>📊 Analytics</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
            Análise e inteligência organizacional em tempo real
          </p>
        </div>
      </div>

      {/* ── KPIs rápidos (sempre visíveis) ── */}
      {overview && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          <KpiCard icon="👥" label="Utilizadores Activos" value={overview.users.active}
            sub={`${overview.users.total} no total`} color="#1e40af" bg="#eff6ff" />
          <KpiCard icon="📚" label="Cursos Activos" value={overview.courses.active}
            sub={`${overview.courses.total} no total`} color="#8b5cf6" bg="#f5f3ff" />
          <KpiCard icon="✅" label="Taxa de Conclusão" value={`${overview.enrollments.completionRate}%`}
            sub={`${overview.enrollments.completed} concluídos`} color="#10b981" bg="#ecfdf5" />
          <KpiCard icon="🏆" label="Total de Pontos" value={overview.engagement.totalPoints.toLocaleString("pt-PT")}
            sub={`${overview.engagement.totalBadges} badges atribuídos`} color="#f59e0b" bg="#fffbeb" />
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 10, padding: 4, marginBottom: 24, width: "fit-content" }}>
        {([
          { key: "overview",   label: "📈 Visão Geral" },
          { key: "learning",   label: "🎓 Aprendizagem" },
          { key: "engagement", label: "⚡ Engagement" },
          { key: "roi",        label: "💰 ROI" },
          { key: "snapshots",  label: "📸 Snapshots" },
        ] as { key: Tab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => handleTab(t.key)} style={TAB_STYLE(tab === t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Erro ── */}
      {error && (
        <div style={{
          background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8,
          padding: 14, color: "#dc2626", fontSize: 13, marginBottom: 16,
        }}>{error}</div>
      )}

      {isLoading && (
        <div style={{ padding: 60, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
          A carregar dados...
        </div>
      )}

      {/* ══════ TAB: OVERVIEW ══════ */}
      {tab === "overview" && !isLoading && overview && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Donut charts */}
          <div style={{ ...card }}>
            <SectionHeader title="Métricas Chave" />
            <div style={{ display: "flex", justifyContent: "space-around", padding: "12px 0" }}>
              <DonutChart
                value={overview.users.active} max={overview.users.total}
                color="#1e40af" label="Utilizadores Activos"
              />
              <DonutChart
                value={overview.enrollments.completed} max={overview.enrollments.total}
                color="#10b981" label="Cursos Concluídos"
              />
              <DonutChart
                value={overview.courses.active} max={overview.courses.total}
                color="#8b5cf6" label="Cursos Activos"
              />
            </div>
          </div>

          {/* Stats de engagement */}
          <div style={{ ...card }}>
            <SectionHeader title="Engagement" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { label: "Micro Learnings", value: overview.engagement.activeMicroLearnings, icon: "⚡" },
                { label: "Percursos",       value: overview.engagement.totalLearningPaths,   icon: "🗺️" },
                { label: "Badges",          value: overview.engagement.totalBadges,          icon: "🏅" },
                { label: "Total Pontos",    value: overview.engagement.totalPoints,          icon: "⭐" },
              ].map(s => (
                <div key={s.label} style={{
                  background: "#f8fafc", borderRadius: 10, padding: "12px 14px",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <span style={{ fontSize: 20 }}>{s.icon}</span>
                  <div>
                    <p style={{ margin: 0, fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>{s.label}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 18, fontWeight: 800, color: "#1e293b" }}>
                      {s.value.toLocaleString("pt-PT")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inscrições totais */}
          <div style={{ ...card, gridColumn: "1 / -1" }}>
            <SectionHeader title="Inscrições — Resumo" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                { label: "Total",        value: overview.enrollments.total,     color: "#1e40af", bg: "#eff6ff" },
                { label: "Concluídas",   value: overview.enrollments.completed, color: "#10b981", bg: "#ecfdf5" },
                { label: "Taxa Conclusão", value: `${overview.enrollments.completionRate}%`, color: "#f59e0b", bg: "#fffbeb" },
              ].map(s => (
                <div key={s.label} style={{
                  background: s.bg, borderRadius: 10, padding: "16px 20px",
                  border: `1px solid ${s.color}22`, textAlign: "center",
                }}>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: s.color, textTransform: "uppercase", letterSpacing: 0.8 }}>{s.label}</p>
                  <p style={{ margin: "6px 0 0", fontSize: 32, fontWeight: 800, color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════ TAB: LEARNING ══════ */}
      {tab === "learning" && !isLoading && learning && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Inscrições por estado */}
          <div style={card}>
            <SectionHeader title="Inscrições por Estado" />
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
              {learning.enrollmentsByStatus.map(s => (
                <div key={s.status}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: "#1e293b", fontWeight: 500 }}>
                      {STATUS_LABEL[s.status] ?? s.status}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: STATUS_COLOR[s.status] ?? "#64748b" }}>
                      {s._count}
                    </span>
                  </div>
                  <div style={{ background: "#e2e8f0", borderRadius: 10, height: 8, overflow: "hidden" }}>
                    <div style={{
                      width: `${Math.min((s._count / (learning.enrollmentsByStatus.reduce((a, b) => a + b._count, 0) || 1)) * 100, 100)}%`,
                      height: "100%", background: STATUS_COLOR[s.status] ?? "#94a3b8",
                      borderRadius: 10, transition: "width 0.5s ease",
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inscrições mensais */}
          <div style={card}>
            <SectionHeader title="Inscrições Mensais (12 meses)" />
            {learning.monthlyEnrollments.length > 0 ? (
              <div style={{ marginTop: 24 }}>
                <BarChart
                  data={learning.monthlyEnrollments.slice(-8).map(m => ({
                    label: m.month.slice(5), value: m.count,
                  }))}
                  color="#1e40af"
                  height={140}
                />
              </div>
            ) : (
              <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: 20 }}>
                Sem dados mensais disponíveis.
              </p>
            )}
          </div>

          {/* Top Cursos */}
          <div style={{ ...card, gridColumn: "1 / -1" }}>
            <SectionHeader title="Top 10 Cursos por Conclusões" />
            {learning.topCourses.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: 20 }}>
                Sem dados de cursos disponíveis.
              </p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {["#", "Curso", "Categoria", "Conclusões", "Inscrições", "Taxa"].map(h => (
                        <th key={h} style={{
                          padding: "10px 14px", textAlign: "left", fontWeight: 700,
                          color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6,
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {learning.topCourses.map((c, i) => {
                      const rate = c.totalEnrollments > 0
                        ? Math.round((c.totalCompleted / c.totalEnrollments) * 100) : 0;
                      return (
                        <tr key={c.course.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "10px 14px", color: "#94a3b8", fontSize: 12 }}>
                            {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                          </td>
                          <td style={{ padding: "10px 14px", fontWeight: 600, color: "#1e293b" }}>
                            {c.course.title}
                          </td>
                          <td style={{ padding: "10px 14px" }}>
                            {c.course.category ? (
                              <span style={{
                                padding: "2px 8px", background: "#eff6ff", color: "#1e40af",
                                borderRadius: 6, fontSize: 11, fontWeight: 600,
                              }}>{c.course.category}</span>
                            ) : "—"}
                          </td>
                          <td style={{ padding: "10px 14px", fontWeight: 700, color: "#10b981" }}>
                            {c.totalCompleted}
                          </td>
                          <td style={{ padding: "10px 14px", color: "#64748b" }}>
                            {c.totalEnrollments}
                          </td>
                          <td style={{ padding: "10px 14px", minWidth: 100 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ flex: 1, background: "#e2e8f0", borderRadius: 10, height: 6, overflow: "hidden" }}>
                                <div style={{ width: `${rate}%`, height: "100%", background: "#10b981", borderRadius: 10 }} />
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 700, color: "#10b981", minWidth: 32 }}>
                                {rate}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Performance por período */}
          {learning.performanceByPeriod.length > 0 && (
            <div style={{ ...card, gridColumn: "1 / -1" }}>
              <SectionHeader title="Performance Média por Período" />
              <BarChart
                data={learning.performanceByPeriod.slice(0, 8).map(p => ({
                  label: p.period,
                  value: Math.round(p._avg.score ?? 0),
                }))}
                color="#8b5cf6"
                height={120}
              />
            </div>
          )}
        </div>
      )}

      {/* ══════ TAB: ENGAGEMENT ══════ */}
      {tab === "engagement" && !isLoading && engagement && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Métricas principais */}
          <div style={card}>
            <SectionHeader title="Métricas de Engagement" />
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <DonutChart
                value={engagement.activeUsersLast30Days}
                max={engagement.totalUsers}
                color="#10b981"
                label="Activos nos últimos 30 dias"
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "Utilizadores Totais",    value: engagement.totalUsers,             icon: "👥" },
                { label: "Taxa de Engagement",     value: `${engagement.engagementRate}%`,   icon: "📈" },
                { label: "Micro Learning Views",   value: engagement.microLearningViews,     icon: "⚡" },
                { label: "Interacções Conhecimento", value: engagement.knowledgeInteractions, icon: "📖" },
                { label: "Sessões AI Tutor",       value: engagement.aiTutorSessions,        icon: "🤖" },
              ].map(s => (
                <div key={s.label} style={{
                  background: "#f8fafc", borderRadius: 8, padding: "10px 12px",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span style={{ fontSize: 18 }}>{s.icon}</span>
                  <div>
                    <p style={{ margin: 0, fontSize: 10, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 800, color: "#1e293b" }}>
                      {typeof s.value === "number" ? s.value.toLocaleString("pt-PT") : s.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard */}
          <div style={card}>
            <SectionHeader title="🏆 Top 5 Utilizadores" />
            {engagement.topUsers.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: 20 }}>
                Sem dados de pontuação.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {engagement.topUsers.map((u, i) => (
                  <div key={u.user.id} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 12px", background: i === 0 ? "#fffbeb" : "#f8fafc",
                    borderRadius: 10, border: i === 0 ? "1px solid #fde68a" : "1px solid #f1f5f9",
                  }}>
                    <span style={{ fontSize: 20, minWidth: 28, textAlign: "center" }}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                    </span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{u.user.fullName}</p>
                    </div>
                    <span style={{
                      fontSize: 14, fontWeight: 800, color: "#f59e0b",
                      background: "#fffbeb", padding: "3px 10px", borderRadius: 20,
                    }}>
                      ⭐ {u.points.toLocaleString("pt-PT")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Barra de engagement visual */}
          <div style={{ ...card, gridColumn: "1 / -1" }}>
            <SectionHeader title="Taxa de Engagement por Canal" />
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
              {[
                { label: "Utilizadores Activos (30d)", value: engagement.activeUsersLast30Days, max: engagement.totalUsers, color: "#10b981" },
                { label: "Micro Learning Views",       value: engagement.microLearningViews,     max: Math.max(engagement.microLearningViews, 1), color: "#f59e0b" },
                { label: "Interacções Conhecimento",   value: engagement.knowledgeInteractions,  max: Math.max(engagement.knowledgeInteractions, 1), color: "#8b5cf6" },
                { label: "Sessões AI Tutor",           value: engagement.aiTutorSessions,        max: Math.max(engagement.aiTutorSessions, 1), color: "#1e40af" },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: "#475569", fontWeight: 500 }}>{s.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>
                      {s.value.toLocaleString("pt-PT")}
                    </span>
                  </div>
                  <div style={{ background: "#e2e8f0", borderRadius: 10, height: 10, overflow: "hidden" }}>
                    <div style={{
                      width: `${Math.min((s.value / s.max) * 100, 100)}%`,
                      height: "100%", background: s.color, borderRadius: 10,
                      transition: "width 0.6s ease",
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════ TAB: ROI ══════ */}
      {tab === "roi" && !loading.roi && roi && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <KpiCard icon="⏱️" label="Horas Investidas em Formação"
            value={roi.totalHoursInvested.toLocaleString("pt-PT")}
            sub="horas totais de conteúdo concluído"
            color="#1e40af" bg="#eff6ff" />
          <KpiCard icon="🎓" label="Total de Conclusões"
            value={roi.totalCompletions.toLocaleString("pt-PT")}
            sub="cursos concluídos na plataforma"
            color="#10b981" bg="#ecfdf5" />

          <div style={{ ...card, gridColumn: "1 / -1" }}>
            <SectionHeader title="Impacto de Treinamento Registado" />
            {roi.impacts.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: 30 }}>
                Nenhum impacto de treinamento registado ainda.
              </p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {["Curso ID", "Métrica", "Taxa de Impacto", "Calculado em"].map(h => (
                        <th key={h} style={{
                          padding: "10px 14px", textAlign: "left", fontWeight: 700,
                          color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6,
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {roi.impacts.map(imp => (
                      <tr key={imp.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "10px 14px", color: "#64748b" }}>#{imp.courseId}</td>
                        <td style={{ padding: "10px 14px", fontWeight: 600, color: "#1e293b" }}>{imp.metric}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{
                            padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                            background: imp.impactRate >= 70 ? "#ecfdf5" : imp.impactRate >= 40 ? "#fffbeb" : "#fef2f2",
                            color: imp.impactRate >= 70 ? "#10b981" : imp.impactRate >= 40 ? "#f59e0b" : "#ef4444",
                          }}>
                            {imp.impactRate.toFixed(1)}%
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px", color: "#64748b", fontSize: 12 }}>
                          {new Date(imp.calculatedAt).toLocaleDateString("pt-PT")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════ TAB: SNAPSHOTS ══════ */}
      {tab === "snapshots" && !loading.snapshots && (
        <div>
          <SectionHeader
            title="Snapshots do Dashboard"
            action={
              <button
                onClick={generateSnapshot}
                disabled={generating}
                style={{ ...btnPrimary, opacity: generating ? 0.7 : 1 }}
              >
                {generating ? "A gerar..." : "📸 Gerar Snapshot"}
              </button>
            }
          />

          {snapshots.length === 0 ? (
            <div style={{
              ...card, padding: 60, textAlign: "center", color: "#94a3b8",
            }}>
              <p style={{ fontSize: 32, margin: "0 0 12px" }}>📸</p>
              <p style={{ fontSize: 14, fontWeight: 500 }}>Nenhum snapshot gerado ainda</p>
              <p style={{ fontSize: 13, marginTop: 4, marginBottom: 20 }}>
                Gera um snapshot para guardar o estado actual da organização
              </p>
              <button onClick={generateSnapshot} disabled={generating} style={btnPrimary}>
                {generating ? "A gerar..." : "📸 Gerar Primeiro Snapshot"}
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
              {snapshots.map(s => (
                <div key={s.id} style={{
                  ...card, borderLeft: "4px solid #1e40af",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#1e40af" }}>
                        {s.department?.name ?? "Organização Geral"}
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>
                        {new Date(s.generatedAt).toLocaleDateString("pt-PT", {
                          day: "2-digit", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span style={{
                      padding: "2px 8px", background: "#eff6ff", color: "#1e40af",
                      borderRadius: 6, fontSize: 10, fontWeight: 700,
                    }}>#{s.id}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[
                      { label: "Utilizadores",  value: s.totalUsers },
                      { label: "Concluídos",    value: s.totalCoursesCompleted },
                      { label: "Média Score",   value: `${s.averageScore.toFixed(1)}%` },
                      { label: "Planos Activos", value: s.activePlans },
                    ].map(m => (
                      <div key={m.label} style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 10px" }}>
                        <p style={{ margin: 0, fontSize: 9, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{m.label}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 800, color: "#1e293b" }}>{m.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}