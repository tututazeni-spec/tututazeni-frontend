"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface MyDashboard {
  user: { id: number; fullName: string; position?: { name: string }; department?: { name: string } };
  learning: { inProgress: number; completed: number; pendingAssessments: number };
  gamification: { totalPoints: number; recentBadges: { badge: { name: string; description?: string }; awardedAt: string }[] };
  career: { plan: { id: number; goal: string; status: string } | null };
}
interface ManagerDashboard {
  team: { size: number; activeEnrollments: number; completedEnrollments: number };
  pending: { leaves: number; declarations: number };
}
interface OrgSummary {
  users: { total: number; active: number };
  courses: { total: number; enrollmentsThisMonth: number; completionsThisMonth: number };
  timestamp: string;
}

// ─── Slideshow images ─────────────────────────────────────────────────────────
// Substitui os URLs pelos teus — recomendado: 1400×400 px (banner horizontal)
const SLIDES = [
  { url: "/images/banner1.jpg", caption: "Aprende. Cresce. Inova." },
  { url: "/images/banner2.jpg", caption: "Formação de excelência." },
  { url: "/images/banner3.jpg", caption: "Desenvolve competências." },
  { url: "/images/banner4.jpg", caption: "Conhecimento partilhado." },
];

// ─── Slideshow ────────────────────────────────────────────────────────────────
function Slideshow() {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setCurrent(c => (c + 1) % SLIDES.length);
        setFading(false);
      }, 400);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  function goTo(i: number) {
    if (i === current) return;
    setFading(true);
    setTimeout(() => { setCurrent(i); setFading(false); }, 400);
  }

  const slide = SLIDES[current];

  return (
    <div style={{ position: "relative", width: "100%", borderRadius: 16, overflow: "hidden", marginBottom: 32, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
      {/* Image */}
      <div style={{
        width: "100%", height: 340,
        backgroundImage: `url(${slide.url})`,
        backgroundSize: "cover", backgroundPosition: "center",
        transition: "opacity 0.4s ease",
        opacity: fading ? 0 : 1,
      }}>
        {/* Gradient overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(90deg, rgba(10,20,60,0.72) 0%, rgba(10,20,60,0.35) 60%, rgba(10,20,60,0.10) 100%)",
        }} />
        {/* Caption */}
        <div style={{
          position: "absolute", bottom: 48, left: 40, right: "40%",
          opacity: fading ? 0 : 1, transition: "opacity 0.4s ease",
        }}>
          <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1.3, textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
            {slide.caption}
          </p>
        </div>
      </div>

      {/* Dot indicators */}
      <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8 }}>
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => goTo(i)} style={{
            width: i === current ? 24 : 8, height: 8, borderRadius: 4,
            background: i === current ? "#fff" : "rgba(255,255,255,0.45)",
            border: "none", cursor: "pointer", padding: 0,
            transition: "all 0.3s ease",
          }} />
        ))}
      </div>

      {/* Prev / Next arrows */}
      {[{ dir: -1, pos: "left" as const }, { dir: 1, pos: "right" as const }].map(({ dir, pos }) => (
        <button key={pos} onClick={() => goTo((current + dir + SLIDES.length) % SLIDES.length)} style={{
          position: "absolute", top: "50%", [pos]: 16, transform: "translateY(-50%)",
          width: 36, height: 36, borderRadius: "50%", border: "none", cursor: "pointer",
          background: "rgba(255,255,255,0.18)", color: "#fff", fontSize: 18, fontWeight: 700,
          backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background 0.2s",
        }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.35)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
        >
          {dir === -1 ? "‹" : "›"}
        </button>
      ))}

      {/* Slide counter */}
      <div style={{ position: "absolute", top: 16, right: 16, padding: "4px 10px", borderRadius: 20, background: "rgba(0,0,0,0.35)", color: "#fff", fontSize: 11, fontWeight: 700, backdropFilter: "blur(4px)" }}>
        {current + 1} / {SLIDES.length}
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, bg, sub }: { icon: string; label: string; value: string | number; color: string; bg: string; sub?: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: 20, display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{icon}</div>
      <div>
        <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color }}>{value}</p>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b", fontWeight: 600 }}>{label}</p>
        {sub && <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>{sub}</p>}
      </div>
    </div>
  );
}

// ─── Tab ──────────────────────────────────────────────────────────────────────
type Tab = "my" | "manager" | "org";

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>("my");
  const [myData, setMyData] = useState<MyDashboard | null>(null);
  const [managerData, setManagerData] = useState<ManagerDashboard | null>(null);
  const [orgData, setOrgData] = useState<OrgSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (tab === "my") {
      api.get<MyDashboard>("/dashboard/my").then(setMyData).catch(() => {}).finally(() => setLoading(false));
    } else if (tab === "manager") {
      api.get<ManagerDashboard>("/dashboard/manager").then(setManagerData).catch(() => {}).finally(() => setLoading(false));
    } else {
      api.get<OrgSummary>("/dashboard/organization").then(setOrgData).catch(() => {}).finally(() => setLoading(false));
    }
  }, [tab]);

  const completionRate = myData
    ? (myData.learning.inProgress + myData.learning.completed) > 0
      ? Math.round((myData.learning.completed / (myData.learning.inProgress + myData.learning.completed)) * 100)
      : 0
    : 0;

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ marginBottom: 0 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", margin: "0 0 4px" }}>
          🏠 Dashboard
        </h1>
        <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 20px" }}>
          Visão geral da plataforma INNOVA
        </p>
      </div>

      {/* ── Slideshow ── */}
      <Slideshow />

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 10, padding: 4, marginBottom: 28, width: "fit-content" }}>
        {([
          ["my",      "👤 O Meu Dashboard"],
          ["manager", "👥 Gestor"],
          ["org",     "🏢 Organização"],
        ] as [Tab, string][]).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding: "8px 20px", border: "none", cursor: "pointer", fontSize: 13,
            fontWeight: tab === k ? 700 : 500, borderRadius: 8,
            background: tab === k ? "#1e40af" : "transparent",
            color: tab === k ? "#fff" : "#64748b", transition: "all 0.15s",
          }}>{l}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>A carregar...</div>
      ) : (

        /* ── TAB: O MEU DASHBOARD ── */
        tab === "my" && myData ? (
          <div>
            {/* Boas-vindas */}
            <div style={{ background: "linear-gradient(135deg, #1e40af, #6366f1)", borderRadius: 16, padding: "24px 28px", marginBottom: 24, color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, opacity: 0.8, fontWeight: 600 }}>Bem-vindo de volta,</p>
                <h2 style={{ margin: "4px 0 6px", fontSize: 22, fontWeight: 800 }}>{myData.user.fullName} 👋</h2>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {myData.user.position && <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, background: "rgba(255,255,255,0.18)", fontWeight: 600 }}>{myData.user.position.name}</span>}
                  {myData.user.department && <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, background: "rgba(255,255,255,0.18)", fontWeight: 600 }}>{myData.user.department.name}</span>}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>Os teus pontos</p>
                <p style={{ margin: "4px 0 0", fontSize: 36, fontWeight: 800 }}>⭐ {myData.gamification.totalPoints.toLocaleString("pt-PT")}</p>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
              <StatCard icon="📚" label="Em Progresso" value={myData.learning.inProgress} color="#1e40af" bg="#eff6ff" />
              <StatCard icon="✅" label="Cursos Concluídos" value={myData.learning.completed} color="#16a34a" bg="#ecfdf5" />
              <StatCard icon="📊" label="Taxa de Conclusão" value={`${completionRate}%`} color="#7c3aed" bg="#f5f3ff" />
              <StatCard icon="⚠️" label="Avaliações Pendentes" value={myData.learning.pendingAssessments} color="#f59e0b" bg="#fffbeb" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Badges recentes */}
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: 22 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>🏅 Badges Recentes</h3>
                {myData.gamification.recentBadges.length === 0 ? (
                  <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "16px 0" }}>Nenhum badge conquistado ainda.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {myData.gamification.recentBadges.map((b, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#fffbeb", borderRadius: 10, border: "1px solid #fde68a" }}>
                        <span style={{ fontSize: 24 }}>🏅</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{b.badge.name}</p>
                          {b.badge.description && <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>{b.badge.description}</p>}
                        </div>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>{new Date(b.awardedAt).toLocaleDateString("pt-PT")}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Plano de carreira */}
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: 22 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>🗺️ Plano de Desenvolvimento</h3>
                {!myData.career.plan ? (
                  <div style={{ textAlign: "center", padding: "20px 0" }}>
                    <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 12px" }}>Ainda não tens um plano activo.</p>
                    <a href="/planos-carreira" style={{ padding: "8px 16px", background: "#1e40af", color: "#fff", borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>Criar Plano</a>
                  </div>
                ) : (
                  <div style={{ padding: "16px", background: "#eff6ff", borderRadius: 10, border: "1px solid #bfdbfe" }}>
                    <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "#1e40af" }}>🎯 {myData.career.plan.goal}</p>
                    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: myData.career.plan.status === "ACTIVE" ? "#ecfdf5" : "#f1f5f9", color: myData.career.plan.status === "ACTIVE" ? "#16a34a" : "#64748b" }}>
                      {myData.career.plan.status}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

        /* ── TAB: GESTOR ── */
        ) : tab === "manager" && managerData ? (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
              <StatCard icon="👥" label="Tamanho da Equipa" value={managerData.team.size} color="#1e40af" bg="#eff6ff" />
              <StatCard icon="📚" label="Inscrições Activas" value={managerData.team.activeEnrollments} color="#f59e0b" bg="#fffbeb" />
              <StatCard icon="✅" label="Cursos Concluídos" value={managerData.team.completedEnrollments} color="#16a34a" bg="#ecfdf5" />
              <StatCard icon="📋" label="Licenças Pendentes" value={managerData.pending.leaves} color="#dc2626" bg="#fef2f2" />
            </div>

            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: 22 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>⚠️ Pendentes de Aprovação</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Pedidos de Licença", value: managerData.pending.leaves, icon: "📅", color: "#f59e0b", href: "/leave" },
                  { label: "Declarações de Trabalho", value: managerData.pending.declarations, icon: "📄", color: "#1e40af", href: "/declarations" },
                ].map(item => (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", background: item.value > 0 ? "#fffbeb" : "#f8fafc", borderRadius: 10, border: `1px solid ${item.value > 0 ? "#fde68a" : "#e2e8f0"}` }}>
                    <span style={{ fontSize: 22 }}>{item.icon}</span>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#1e293b", flex: 1 }}>{item.label}</p>
                    <span style={{ padding: "4px 14px", borderRadius: 20, fontSize: 14, fontWeight: 800, background: item.value > 0 ? "#fef3c7" : "#f1f5f9", color: item.value > 0 ? "#92400e" : "#94a3b8" }}>{item.value}</span>
                    {item.value > 0 && <a href={item.href} style={{ padding: "6px 12px", background: "#1e40af", color: "#fff", borderRadius: 7, fontSize: 11, fontWeight: 600, textDecoration: "none" }}>Ver</a>}
                  </div>
                ))}
              </div>
            </div>
          </div>

        /* ── TAB: ORGANIZAÇÃO ── */
        ) : tab === "org" && orgData ? (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
              <StatCard icon="👥" label="Total Utilizadores" value={orgData.users.total} color="#1e293b" bg="#f1f5f9" sub={`${orgData.users.active} activos`} />
              <StatCard icon="📚" label="Cursos Activos" value={orgData.courses.total} color="#1e40af" bg="#eff6ff" />
              <StatCard icon="✍️" label="Inscrições este Mês" value={orgData.courses.enrollmentsThisMonth} color="#f59e0b" bg="#fffbeb" />
              <StatCard icon="🎓" label="Conclusões este Mês" value={orgData.courses.completionsThisMonth} color="#16a34a" bg="#ecfdf5" />
            </div>

            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: 22 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>📊 Resumo Executivo</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ padding: "16px", background: "#eff6ff", borderRadius: 10, border: "1px solid #bfdbfe" }}>
                  <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#1e40af" }}>👥 Recursos Humanos</p>
                  {[
                    { label: "Total de colaboradores", value: orgData.users.total },
                    { label: "Colaboradores activos", value: orgData.users.active },
                    { label: "Inativos", value: orgData.users.total - orgData.users.active },
                  ].map(s => (
                    <div key={s.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #dbeafe" }}>
                      <span style={{ fontSize: 12, color: "#64748b" }}>{s.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>{s.value}</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding: "16px", background: "#ecfdf5", borderRadius: 10, border: "1px solid #bbf7d0" }}>
                  <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#16a34a" }}>📚 Aprendizagem</p>
                  {[
                    { label: "Cursos disponíveis", value: orgData.courses.total },
                    { label: "Novas inscrições (mês)", value: orgData.courses.enrollmentsThisMonth },
                    { label: "Conclusões (mês)", value: orgData.courses.completionsThisMonth },
                  ].map(s => (
                    <div key={s.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #bbf7d0" }}>
                      <span style={{ fontSize: 12, color: "#64748b" }}>{s.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <p style={{ margin: "14px 0 0", fontSize: 11, color: "#94a3b8", textAlign: "right" }}>
                Actualizado em {new Date(orgData.timestamp).toLocaleString("pt-PT")}
              </p>
            </div>
          </div>
        ) : null
      )}
    </div>
  );
}