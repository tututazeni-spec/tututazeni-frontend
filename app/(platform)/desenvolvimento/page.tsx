"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
 
// ─── Types ────────────────────────────────────────────────────────────────────
interface Certificate { id: number; type: string; validationCode: string; fileUrl: string; createdAt: string; }
interface DevelopmentPlan {
  id: number; userId: number; goal: string; status: string; createdAt: string;
  user?: { id: number; fullName: string; email: string };
  certificates?: Certificate[];
}
interface Stats { total: number; active: number; completed: number; completionRate: number; }
 
// ─── Maps ─────────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  DRAFT:     { label: "Rascunho",  color: "#94a3b8", bg: "#f8fafc",  icon: "📝" },
  ACTIVE:    { label: "Activo",    color: "#16a34a", bg: "#ecfdf5",  icon: "🟢" },
  COMPLETED: { label: "Concluído", color: "#1e40af", bg: "#eff6ff",  icon: "✅" },
  CANCELLED: { label: "Cancelado", color: "#dc2626", bg: "#fef2f2",  icon: "❌" },
};
 
// ─── Styles ───────────────────────────────────────────────────────────────────
const card: React.CSSProperties = { background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: 24 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, color: "#1e293b", background: "#fff", outline: "none", boxSizing: "border-box" };
const labelStyle: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#64748b", marginBottom: 6 };
const btnPrimary: React.CSSProperties = { padding: "10px 20px", background: "#1e40af", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" };
const btnGhost: React.CSSProperties = { padding: "8px 14px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" };
const btnDanger: React.CSSProperties = { padding: "6px 12px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer" };
 
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
 
// ─── Modal: Criar Plano ───────────────────────────────────────────────────────
function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ userId: "", goal: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }
 
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      await api.post("/development-plans", { userId: +form.userId, goal: form.goal });
      onCreated(); onClose();
    } catch (e: any) { setError(e.message ?? "Erro ao criar plano"); }
    finally { setSaving(false); }
  }
 
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ ...card, width: "100%", maxWidth: 460, boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1e293b" }}>🚀 Novo Plano de Desenvolvimento</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
        </div>
        <form onSubmit={submit}>
          <div style={{ marginBottom: 14 }}>
            <span style={labelStyle}>ID do Colaborador *</span>
            <input style={inputStyle} type="number" value={form.userId} onChange={e => set("userId", e.target.value)} placeholder="Ex: 1" required />
          </div>
          <div style={{ marginBottom: 20 }}>
            <span style={labelStyle}>Objectivo do Plano *</span>
            <textarea style={{ ...inputStyle, height: 96, resize: "vertical" }} value={form.goal} onChange={e => set("goal", e.target.value)} placeholder="Descreve o objectivo de desenvolvimento..." required />
          </div>
          {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}><p style={{ margin: 0, fontSize: 13, color: "#dc2626" }}>{error}</p></div>}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={btnGhost}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>{saving ? "A criar..." : "Criar Plano"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
 
// ─── Modal: Detalhe do Plano ──────────────────────────────────────────────────
function PlanDetailModal({ plan, onClose, onRefresh, showToast }: {
  plan: DevelopmentPlan; onClose: () => void;
  onRefresh: () => void; showToast: (m: string, t: "success" | "error") => void;
}) {
  const [completing, setCompleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
 
  const st = STATUS_CONFIG[plan.status] ?? { label: plan.status, color: "#64748b", bg: "#f8fafc", icon: "⚪" };
 
  async function complete() {
    if (!confirm("Marcar como concluído? Será gerado um certificado e atribuídos 200 pontos.")) return;
    setCompleting(true);
    try {
      await api.patch(`/development-plans/${plan.id}/complete`, {});
      showToast("Plano concluído! Certificado gerado e 200 pontos atribuídos. 🎉", "success");
      onRefresh(); onClose();
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setCompleting(false); }
  }
 
  async function cancel() {
    if (!confirm("Cancelar este plano?")) return;
    setCancelling(true);
    try {
      await api.patch(`/development-plans/${plan.id}/cancel`, {});
      showToast("Plano cancelado.", "success");
      onRefresh(); onClose();
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setCancelling(false); }
  }
 
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ ...card, width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 24 }}>{st.icon}</span>
              <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color }}>{st.label}</span>
            </div>
            {plan.user && <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>👤 {plan.user.fullName} — {plan.user.email}</p>}
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "#94a3b8" }}>Criado em {new Date(plan.createdAt).toLocaleDateString("pt-PT")}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
        </div>
 
        {/* Objectivo */}
        <div style={{ padding: "16px", background: "#f8fafc", borderRadius: 10, marginBottom: 20 }}>
          <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.8 }}>Objectivo</p>
          <p style={{ margin: 0, fontSize: 14, color: "#1e293b", lineHeight: 1.6 }}>{plan.goal}</p>
        </div>
 
        {/* Certificados */}
        {plan.certificates && plan.certificates.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>🎓 Certificados</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {plan.certificates.map(cert => (
                <div key={cert.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "#fffbeb", borderRadius: 10, border: "1px solid #fde68a" }}>
                  <span style={{ fontSize: 24 }}>🏆</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{cert.type}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>Código: {cert.validationCode}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>{new Date(cert.createdAt).toLocaleDateString("pt-PT")}</p>
                  </div>
                  <a href={cert.fileUrl} style={{ padding: "6px 12px", background: "#1e40af", color: "#fff", borderRadius: 7, fontSize: 11, fontWeight: 700, textDecoration: "none" }}>📥 Ver</a>
                </div>
              ))}
            </div>
          </div>
        )}
 
        {/* Acções */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {plan.status === "ACTIVE" && (
            <>
              <button onClick={complete} disabled={completing} style={{ ...btnPrimary, flex: 1, opacity: completing ? 0.7 : 1 }}>
                {completing ? "A concluir..." : "✅ Marcar como Concluído"}
              </button>
              <button onClick={cancel} disabled={cancelling} style={{ ...btnDanger, opacity: cancelling ? 0.7 : 1 }}>
                {cancelling ? "..." : "❌ Cancelar"}
              </button>
            </>
          )}
          {plan.status === "DRAFT" && (
            <button onClick={cancel} disabled={cancelling} style={{ ...btnDanger, opacity: cancelling ? 0.7 : 1 }}>
              {cancelling ? "..." : "❌ Cancelar"}
            </button>
          )}
          {(plan.status === "COMPLETED" || plan.status === "CANCELLED") && (
            <p style={{ margin: 0, fontSize: 13, color: "#94a3b8", padding: "10px 0" }}>
              {plan.status === "COMPLETED" ? "✅ Este plano foi concluído." : "❌ Este plano foi cancelado."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
 
// ─── Plan Card ────────────────────────────────────────────────────────────────
function PlanCard({ plan, onClick }: { plan: DevelopmentPlan; onClick: () => void }) {
  const st = STATUS_CONFIG[plan.status] ?? { label: plan.status, color: "#64748b", bg: "#f8fafc", icon: "⚪" };
  return (
    <div onClick={onClick} style={{ ...card, cursor: "pointer", borderLeft: `4px solid ${st.color}`, transition: "box-shadow 0.15s" }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)")}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: st.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{st.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: st.bg, color: st.color }}>{st.label}</span>
            {plan.user && <span style={{ fontSize: 12, color: "#64748b" }}>👤 {plan.user.fullName}</span>}
            {plan.certificates && plan.certificates.length > 0 && (
              <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: "#fffbeb", color: "#92400e" }}>🎓 {plan.certificates.length} cert.</span>
            )}
          </div>
          <p style={{ margin: "0 0 6px", fontSize: 13, color: "#1e293b", fontWeight: 600, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{plan.goal}</p>
          <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{new Date(plan.createdAt).toLocaleDateString("pt-PT")}</p>
        </div>
      </div>
    </div>
  );
}
 
// ─── Tab ─────────────────────────────────────────────────────────────────────
type Tab = "my" | "all";
 
// ─── Página Principal ─────────────────────────────────────────────────────────
export default function DesenvolvimentoPage() {
  const [tab, setTab] = useState<Tab>("my");
  const [myPlans, setMyPlans] = useState<DevelopmentPlan[]>([]);
  const [allPlans, setAllPlans] = useState<DevelopmentPlan[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<DevelopmentPlan | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
 
  function showToast(msg: string, type: "success" | "error") { setToast({ msg, type }); }
 
  async function fetchAll() {
    setLoading(true);
    try {
      const [my, st, all] = await Promise.all([
        api.get<DevelopmentPlan[]>("/development-plans/my"),
        api.get<Stats>("/development-plans/my/stats"),
        api.get<any>("/development-plans").catch(() => ({ data: [] })),
      ]);
      setMyPlans(my); setStats(st);
      setAllPlans(all.data ?? []);
    } catch (e: any) { showToast(e.message ?? "Erro ao carregar", "error"); }
    finally { setLoading(false); }
  }
 
  useEffect(() => { fetchAll(); }, []);
 
  const filteredAll = filterStatus ? allPlans.filter(p => p.status === filterStatus) : allPlans;
 
  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", margin: 0 }}>🚀 Planos de Desenvolvimento</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Crescimento profissional e objectivos de desenvolvimento</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={btnPrimary}>+ Novo Plano</button>
      </div>
 
      {/* Stats */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Total",           value: stats.total,          icon: "📋", color: "#1e293b", bg: "#f1f5f9" },
            { label: "Activos",         value: stats.active,         icon: "🟢", color: "#16a34a", bg: "#ecfdf5" },
            { label: "Concluídos",      value: stats.completed,      icon: "✅", color: "#1e40af", bg: "#eff6ff" },
            { label: "Taxa Conclusão",  value: `${stats.completionRate}%`, icon: "📊", color: "#7c3aed", bg: "#f5f3ff" },
          ].map(s => (
            <div key={s.label} style={{ ...card, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: s.bg, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{s.icon}</div>
              <div><p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</p><p style={{ margin: 0, fontSize: 11, color: "#64748b", fontWeight: 600 }}>{s.label}</p></div>
            </div>
          ))}
        </div>
      )}
 
      {/* Info box */}
      <div style={{ padding: "12px 16px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, marginBottom: 24 }}>
        <p style={{ margin: 0, fontSize: 12, color: "#92400e", fontWeight: 600 }}>
          🎓 Ao concluir um plano, é gerado automaticamente um certificado de desenvolvimento e atribuídos <strong>200 pontos</strong> de gamificação.
        </p>
      </div>
 
      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 10, padding: 4, marginBottom: 24, width: "fit-content" }}>
        {([["my","👤 Os Meus Planos"],["all","📋 Todos os Planos"]] as [Tab,string][]).map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding: "8px 20px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: tab === k ? 700 : 500, borderRadius: 8, background: tab === k ? "#1e40af" : "transparent", color: tab === k ? "#fff" : "#64748b", transition: "all 0.15s" }}>{l}</button>
        ))}
      </div>
 
      {/* Filtro status (tab all) */}
      {tab === "all" && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {["", "DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: "6px 14px", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, borderRadius: 8, background: filterStatus === s ? "#1e40af" : "#f1f5f9", color: filterStatus === s ? "#fff" : "#64748b", transition: "all 0.15s" }}>
              {s === "" ? "Todos" : STATUS_CONFIG[s]?.label ?? s}
            </button>
          ))}
        </div>
      )}
 
      {/* Lista */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>A carregar...</div>
      ) : tab === "my" ? (
        myPlans.length === 0 ? (
          <div style={{ ...card, textAlign: "center", padding: 60 }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>🚀</p>
            <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 16px" }}>Ainda não tens planos de desenvolvimento.</p>
            <button onClick={() => setShowCreate(true)} style={btnPrimary}>+ Criar Primeiro Plano</button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {myPlans.map(p => <PlanCard key={p.id} plan={p} onClick={() => setSelected(p)} />)}
          </div>
        )
      ) : (
        filteredAll.length === 0 ? (
          <div style={{ ...card, textAlign: "center", padding: 60 }}><p style={{ color: "#94a3b8", fontSize: 14 }}>Nenhum plano encontrado.</p></div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {filteredAll.map(p => <PlanCard key={p.id} plan={p} onClick={() => setSelected(p)} />)}
          </div>
        )
      )}
 
      {/* Modais */}
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={() => { fetchAll(); showToast("Plano criado com sucesso!", "success"); }} />}
      {selected && <PlanDetailModal plan={selected} onClose={() => setSelected(null)} onRefresh={fetchAll} showToast={showToast} />}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}