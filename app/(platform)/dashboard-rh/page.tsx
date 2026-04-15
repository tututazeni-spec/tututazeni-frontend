"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FullDashboard {
  headcount: {
    totalActive: number;
    totalInactive: number;
    turnoverRate: number;
  };
  recruitment: {
    newHiresThisMonth: number;
    hiringTrend: number;
  };
  pendingActions: {
    leaves: number;
    payslips: number;
    declarations: number;
  };
  retention: {
    avgTenureMonths: number;
    approvedLeavesThisMonth: number;
  };
  distribution: {
    byDepartment: { departmentId: number; _count: number }[];
    byPosition:   { positionId:   number; _count: number }[];
  };
  generatedAt: string;
}

interface Anniversary {
  id: number;
  fullName: string;
  hireDate: string;
  years: number;
  department?: { name: string };
}

interface TrendPoint {
  month: string;
  count: number;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: "#fff",
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  padding: 20,
};

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 1,
  textTransform: "uppercase",
  color: "#64748b",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTrend(v: number) {
  if (v > 0) return { label: `+${v}%`, color: "#16a34a" };
  if (v < 0) return { label: `${v}%`,  color: "#dc2626" };
  return { label: "0%", color: "#94a3b8" };
}

function formatMonths(m: number) {
  const years = Math.floor(m / 12);
  const months = Math.round(m % 12);
  if (years === 0) return `${months}m`;
  return months > 0 ? `${years}a ${months}m` : `${years}a`;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color = "#1e40af", bg = "#eff6ff" }: {
  icon: string; label: string; value: string | number;
  sub?: React.ReactNode; color?: string; bg?: string;
}) {
  return (
    <div style={{ ...card, display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ ...labelStyle, margin: "0 0 4px" }}>{label}</p>
        <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
        {sub && <div style={{ marginTop: 4 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── Pending Badge ────────────────────────────────────────────────────────────

function PendingItem({ label, count, color, bg }: { label: string; count: number; color: string; bg: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: bg, borderRadius: 8, border: `1px solid ${color}22` }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{label}</span>
      <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 800, background: bg, color, border: `1px solid ${color}44` }}>{count}</span>
    </div>
  );
}

// ─── Trend Chart (SVG) ────────────────────────────────────────────────────────

function TrendChart({ data }: { data: TrendPoint[] }) {
  if (!data.length) return null;
  const W = 520, H = 140, PAD = 28;
  const counts = data.map(d => d.count);
  const min = Math.min(...counts);
  const max = Math.max(...counts);
  const range = max - min || 1;
  const pts = data.map((d, i) => {
    const x = PAD + (i / Math.max(data.length - 1, 1)) * (W - PAD * 2);
    const y = PAD + ((max - d.count) / range) * (H - PAD * 2);
    return { x, y, ...d };
  });
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaD = `${pathD} L${pts[pts.length - 1].x},${H - PAD} L${pts[0].x},${H - PAD} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 140 }}>
      <defs>
        <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#1e40af" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#1e40af" stopOpacity="0"    />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#tg)" />
      <path d={pathD} fill="none" stroke="#1e40af" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4} fill="#1e40af" />
          <text x={p.x} y={H - 4} textAnchor="middle" fontSize={9} fill="#94a3b8">{p.month.slice(5)}</text>
          <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize={10} fontWeight="700" fill="#1e40af">{p.count}</text>
        </g>
      ))}
    </svg>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
      {children}
    </h2>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────

export default function DashboardRhPage() {
  const [dashboard, setDashboard]         = useState<FullDashboard | null>(null);
  const [anniversaries, setAnniversaries] = useState<Anniversary[]>([]);
  const [trend, setTrend]                 = useState<TrendPoint[]>([]);
  const [trendMonths, setTrendMonths]     = useState(6);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const [dash, ann, tr] = await Promise.all([
        api.get<FullDashboard>("/dashboard-rh"),
        api.get<Anniversary[]>("/dashboard-rh/anniversaries"),
        api.get<TrendPoint[]>(`/dashboard-rh/headcount-trend?months=${trendMonths}`),
      ]);
      setDashboard(dash);
      setAnniversaries(ann);
      setTrend(tr);
    } catch (e: any) {
      setError(e.message ?? "Erro ao carregar dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [trendMonths]);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 80, gap: 16 }}>
        <div style={{ width: 36, height: 36, border: "3px solid #e2e8f0", borderTopColor: "#1e40af", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        <p style={{ color: "#94a3b8", fontSize: 14 }}>A carregar dashboard RH...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: 24, color: "#dc2626", fontSize: 14 }}>
        ❌ {error}
        <button onClick={load} style={{ marginLeft: 16, padding: "6px 14px", background: "#1e40af", color: "#fff", border: "none", borderRadius: 7, fontSize: 13, cursor: "pointer" }}>Tentar novamente</button>
      </div>
    );
  }

  if (!dashboard) return null;

  const { headcount, recruitment, pendingActions, retention } = dashboard;
  const hiringTrendFmt = formatTrend(recruitment.hiringTrend);
  const totalPending = pendingActions.leaves + pendingActions.payslips + pendingActions.declarations;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", margin: 0 }}>🏢 Dashboard RH</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
            Painel de Recursos Humanos — actualizado em {new Date(dashboard.generatedAt).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <button onClick={load} style={{ padding: "9px 18px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          🔄 Actualizar
        </button>
      </div>

      {/* ── Headcount ── */}
      <section>
        <SectionTitle>👥 Headcount</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
          <StatCard icon="👥" label="Colaboradores Activos" value={headcount.totalActive} color="#1e40af" bg="#eff6ff" />
          <StatCard icon="🚪" label="Inactivos" value={headcount.totalInactive} color="#dc2626" bg="#fef2f2" />
          <StatCard
            icon="📉" label="Taxa de Rotatividade" value={`${headcount.turnoverRate}%`}
            color={headcount.turnoverRate > 15 ? "#dc2626" : headcount.turnoverRate > 8 ? "#f59e0b" : "#16a34a"}
            bg={headcount.turnoverRate > 15 ? "#fef2f2" : headcount.turnoverRate > 8 ? "#fffbeb" : "#ecfdf5"}
          />
          <StatCard
            icon="🆕" label="Novas Contratações (mês)"
            value={recruitment.newHiresThisMonth}
            color="#16a34a" bg="#ecfdf5"
            sub={
              <span style={{ fontSize: 11, color: hiringTrendFmt.color, fontWeight: 600 }}>
                {hiringTrendFmt.label} vs. mês anterior
              </span>
            }
          />
          <StatCard
            icon="⏳" label="Tempo Médio de Empresa"
            value={formatMonths(retention.avgTenureMonths)}
            color="#7c3aed" bg="#f5f3ff"
          />
          <StatCard
            icon="✅" label="Licenças Aprovadas (mês)"
            value={retention.approvedLeavesThisMonth}
            color="#0369a1" bg="#f0f9ff"
          />
        </div>
      </section>

      {/* ── Acções Pendentes ── */}
      <section>
        <div style={{ ...card }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <SectionTitle>⏰ Acções Pendentes</SectionTitle>
            {totalPending > 0 && (
              <span style={{ padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 800, background: "#fef2f2", color: "#dc2626" }}>
                {totalPending} pendentes
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <PendingItem label="Pedidos de Licença"       count={pendingActions.leaves}       color="#f59e0b" bg="#fffbeb" />
            <PendingItem label="Recibos de Vencimento"    count={pendingActions.payslips}     color="#1e40af" bg="#eff6ff" />
            <PendingItem label="Declarações de Trabalho"  count={pendingActions.declarations} color="#8b5cf6" bg="#f5f3ff" />
          </div>
        </div>
      </section>

      {/* ── Tendência de Headcount ── */}
      <section>
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <SectionTitle>📈 Evolução do Headcount</SectionTitle>
            <div style={{ display: "flex", gap: 6 }}>
              {[3, 6, 12].map(m => (
                <button key={m} onClick={() => setTrendMonths(m)} style={{ padding: "5px 12px", border: "none", borderRadius: 7, fontSize: 12, fontWeight: trendMonths === m ? 700 : 500, cursor: "pointer", background: trendMonths === m ? "#1e40af" : "#f1f5f9", color: trendMonths === m ? "#fff" : "#64748b" }}>
                  {m}m
                </button>
              ))}
            </div>
          </div>
          <TrendChart data={trend} />
          {trend.length === 0 && <p style={{ textAlign: "center", color: "#94a3b8", padding: 20, fontSize: 13 }}>Sem dados de tendência.</p>}
        </div>
      </section>

      {/* ── Distribuição ── */}
      <section>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

          {/* Por Departamento */}
          <div style={card}>
            <SectionTitle>🏗️ Por Departamento</SectionTitle>
            {dashboard.distribution.byDepartment.length === 0
              ? <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: 16 }}>Sem dados.</p>
              : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {dashboard.distribution.byDepartment
                    .sort((a, b) => b._count - a._count)
                    .slice(0, 8)
                    .map((d, i) => {
                      const maxCount = Math.max(...dashboard.distribution.byDepartment.map(x => x._count));
                      const pct = Math.round((d._count / maxCount) * 100);
                      return (
                        <div key={i}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                            <span style={{ fontSize: 12, color: "#64748b" }}>Depto #{d.departmentId}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>{d._count}</span>
                          </div>
                          <div style={{ height: 5, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: "#1e40af", borderRadius: 3 }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
          </div>

          {/* Por Função */}
          <div style={card}>
            <SectionTitle>💼 Por Função</SectionTitle>
            {dashboard.distribution.byPosition.length === 0
              ? <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: 16 }}>Sem dados.</p>
              : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {dashboard.distribution.byPosition
                    .sort((a, b) => b._count - a._count)
                    .slice(0, 8)
                    .map((p, i) => {
                      const maxCount = Math.max(...dashboard.distribution.byPosition.map(x => x._count));
                      const pct = Math.round((p._count / maxCount) * 100);
                      return (
                        <div key={i}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                            <span style={{ fontSize: 12, color: "#64748b" }}>Cargo #{p.positionId}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>{p._count}</span>
                          </div>
                          <div style={{ height: 5, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: "#6366f1", borderRadius: 3 }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
          </div>
        </div>
      </section>

      {/* ── Aniversários de Empresa ── */}
      <section>
        <div style={card}>
          <SectionTitle>🎂 Aniversários de Empresa Este Mês</SectionTitle>
          {anniversaries.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: 20 }}>Nenhum aniversário de empresa este mês.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {anniversaries.map(a => (
                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 14px", background: "#f8fafc", borderRadius: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#1e40af,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                    {a.fullName.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{a.fullName}</p>
                    {a.department && <p style={{ margin: "1px 0 0", fontSize: 11, color: "#94a3b8" }}>{a.department.name}</p>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800, background: "#fffbeb", color: "#f59e0b" }}>
                      🎉 {a.years} {a.years === 1 ? "ano" : "anos"}
                    </span>
                    <p style={{ margin: "3px 0 0", fontSize: 10, color: "#94a3b8" }}>
                      desde {new Date(a.hireDate).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}