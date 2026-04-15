"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Metric { id: number; label: string; value: number; }
interface Report {
  id: number; title: string; filePath: string; format: string; createdAt: string;
  generatedBy?: { id: number; fullName: string };
  department?: { id: number; name: string };
  metrics?: Metric[];
}

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

// ─── Modal: Criar Relatório Manual ───────────────────────────────────────────
function CreateReportModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [metrics, setMetrics] = useState([
    { label: "Total de Colaboradores", value: "" },
    { label: "Colaboradores Ativos", value: "" },
    { label: "Cursos Concluídos", value: "" },
    { label: "Taxa de Conclusão (%)", value: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function setM(i: number, k: string, v: string) { setMetrics(m => m.map((item, idx) => idx === i ? { ...item, [k]: v } : item)); }
  function addMetric() { setMetrics(m => [...m, { label: "", value: "" }]); }
  function removeMetric(i: number) { setMetrics(m => m.filter((_, idx) => idx !== i)); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (metrics.some(m => !m.label || m.value === "")) { setError("Todos os campos das métricas são obrigatórios."); return; }
    setSaving(true); setError("");
    try {
      await api.post("/executive-reports", {
        title, format: "PDF",
        departmentId: departmentId ? +departmentId : undefined,
        metrics: metrics.map(m => ({ label: m.label, value: +m.value })),
      });
      onCreated(); onClose();
    } catch (e: any) { setError(e.message ?? "Erro ao criar relatório"); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ ...card, width: "100%", maxWidth: 560, maxHeight: "92vh", overflow: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1e293b" }}>📄 Novo Relatório Executivo</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
        </div>
        <form onSubmit={submit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <span style={labelStyle}>Título *</span>
              <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Relatório Executivo Q2 2026" required />
            </div>
            <div>
              <span style={labelStyle}>ID Departamento (opcional)</span>
              <input style={inputStyle} type="number" value={departmentId} onChange={e => setDepartmentId(e.target.value)} placeholder="Ex: 3" />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <div style={{ padding: "10px 14px", background: "#eff6ff", borderRadius: 8, border: "1px solid #bfdbfe", width: "100%" }}>
                <p style={{ margin: 0, fontSize: 12, color: "#1e40af", fontWeight: 600 }}>📄 Formato: PDF</p>
              </div>
            </div>
          </div>

          {/* Métricas */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={labelStyle}>Métricas *</span>
              <button type="button" onClick={addMetric} style={{ ...btnGhost, padding: "4px 10px", fontSize: 11 }}>+ Métrica</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {metrics.map((m, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input style={{ ...inputStyle, flex: 2 }} value={m.label} onChange={e => setM(i, "label", e.target.value)} placeholder="Label da métrica..." required />
                  <input style={{ ...inputStyle, flex: 1 }} type="number" value={m.value} onChange={e => setM(i, "value", e.target.value)} placeholder="Valor" required />
                  {metrics.length > 1 && <button type="button" onClick={() => removeMetric(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: 18, flexShrink: 0 }}>×</button>}
                </div>
              ))}
            </div>
          </div>

          {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}><p style={{ margin: 0, fontSize: 13, color: "#dc2626" }}>{error}</p></div>}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={btnGhost}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>{saving ? "A criar..." : "Criar Relatório"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal: Ver Relatório ─────────────────────────────────────────────────────
function ReportDetailModal({ report, onClose, onDelete }: {
  report: Report; onClose: () => void; onDelete: () => void;
}) {
  const [detail, setDetail] = useState<Report | null>(null);
  useEffect(() => { api.get<Report>(`/executive-reports/${report.id}`).then(setDetail).catch(() => {}); }, [report.id]);
  const r = detail ?? report;
  const metrics = r.metrics ?? [];
  const maxVal = metrics.length ? Math.max(...metrics.map(m => m.value), 1) : 1;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ ...card, width: "100%", maxWidth: 580, maxHeight: "92vh", overflow: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 700, color: "#1e293b" }}>{r.title}</h2>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {r.generatedBy && <span style={{ fontSize: 12, color: "#64748b" }}>👤 {r.generatedBy.fullName}</span>}
              {r.department && <span style={{ fontSize: 12, color: "#64748b" }}>🏢 {r.department.name}</span>}
              <span style={{ fontSize: 12, color: "#94a3b8" }}>📅 {new Date(r.createdAt).toLocaleDateString("pt-PT")}</span>
              <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: "#fef2f2", color: "#dc2626" }}>📄 {r.format}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0, marginLeft: 12 }}>
            <a href={r.filePath} style={{ ...btnGhost, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>📥 Descarregar</a>
            <button onClick={onDelete} style={btnDanger}>🗑️</button>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
          </div>
        </div>

        {/* Métricas */}
        {metrics.length === 0 ? (
          <p style={{ color: "#94a3b8", textAlign: "center", padding: 24 }}>Sem métricas disponíveis.</p>
        ) : (
          <div>
            {/* KPI cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 12, marginBottom: 24 }}>
              {metrics.map((m, i) => {
                const colors = ["#1e40af","#16a34a","#7c3aed","#f59e0b","#dc2626","#0ea5e9","#f97316"];
                const bgs = ["#eff6ff","#ecfdf5","#f5f3ff","#fffbeb","#fef2f2","#f0f9ff","#fff7ed"];
                const c = colors[i % colors.length];
                const bg = bgs[i % bgs.length];
                return (
                  <div key={m.id} style={{ padding: "14px 16px", background: bg, borderRadius: 12, borderLeft: `4px solid ${c}` }}>
                    <p style={{ margin: "0 0 4px", fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{m.label}</p>
                    <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: c }}>{m.value.toLocaleString("pt-PT")}</p>
                  </div>
                );
              })}
            </div>

            {/* Bar chart */}
            <div style={card}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>📊 Visualização das Métricas</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {metrics.map((m, i) => {
                  const pct = Math.round((m.value / maxVal) * 100);
                  const colors = ["#1e40af","#16a34a","#7c3aed","#f59e0b","#dc2626","#0ea5e9","#f97316"];
                  const color = colors[i % colors.length];
                  return (
                    <div key={m.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>{m.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color }}>{m.value.toLocaleString("pt-PT")}</span>
                      </div>
                      <div style={{ height: 8, background: "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 0.5s" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function ExecutivePdfPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [deptIdAuto, setDeptIdAuto] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<Report | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error") { setToast({ msg, type }); }

  async function fetchReports() {
    setLoading(true);
    try {
      const res = await api.get<any>("/executive-reports");
      setReports(res.data ?? []); setTotal(res.total ?? 0);
    } catch (e: any) { showToast(e.message ?? "Erro", "error"); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchReports(); }, []);

  async function autoGenerate() {
    setGenerating(true);
    try {
      const p = deptIdAuto ? `?departmentId=${deptIdAuto}` : "";
      const r = await api.post<Report>(`/executive-reports/auto-generate${p}`, {});
      showToast("Relatório gerado automaticamente! 📄", "success");
      fetchReports();
    } catch (e: any) { showToast(e.message ?? "Erro ao gerar", "error"); }
    finally { setGenerating(false); }
  }

  async function deleteReport(id: number) {
    if (!confirm("Remover este relatório?")) return;
    try {
      await api.delete(`/executive-reports/${id}`);
      showToast("Relatório removido.", "success");
      fetchReports(); setSelected(null);
    } catch (e: any) { showToast(e.message, "error"); }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", margin: 0 }}>📄 Relatórios Executivos</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Relatórios PDF com métricas organizacionais — {total} no total</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={btnPrimary}>+ Criar Relatório</button>
      </div>

      {/* Auto-generate */}
      <div style={{ ...card, marginBottom: 24, background: "linear-gradient(135deg,#1e40af,#6366f1)", border: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#fff" }}>⚡ Geração Automática</h3>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.75)" }}>Gera um relatório com as métricas actuais da organização automaticamente — utilizadores, cursos, desempenho e gamificação.</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
            <input style={{ ...inputStyle, maxWidth: 160, background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", fontSize: 13 }} type="number" value={deptIdAuto} onChange={e => setDeptIdAuto(e.target.value)} placeholder="ID dept (opcional)" />
            <button onClick={autoGenerate} disabled={generating} style={{ padding: "10px 20px", background: "#fff", color: "#1e40af", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: generating ? 0.7 : 1, whiteSpace: "nowrap" }}>
              {generating ? "⏳ A gerar..." : "🚀 Gerar Agora"}
            </button>
          </div>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>A carregar...</div>
      ) : reports.length === 0 ? (
        <div style={{ ...card, textAlign: "center", padding: 60 }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>📄</p>
          <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 16px" }}>Nenhum relatório criado ainda.</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={autoGenerate} disabled={generating} style={{ ...btnPrimary, opacity: generating ? 0.7 : 1 }}>⚡ Gerar Automaticamente</button>
            <button onClick={() => setShowCreate(true)} style={btnGhost}>+ Manual</button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {reports.map(r => (
            <div key={r.id} onClick={() => setSelected(r)} style={{ ...card, cursor: "pointer", transition: "box-shadow 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)")}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: 12, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>📄</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</h3>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {r.generatedBy && <span style={{ fontSize: 12, color: "#64748b" }}>👤 {r.generatedBy.fullName}</span>}
                    {r.department && <span style={{ fontSize: 12, color: "#64748b" }}>🏢 {r.department.name}</span>}
                    {r.metrics && <span style={{ fontSize: 12, color: "#64748b" }}>📊 {r.metrics.length} métricas</span>}
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>📅 {new Date(r.createdAt).toLocaleDateString("pt-PT")}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                  <a href={r.filePath} style={{ ...btnGhost, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12 }}>📥</a>
                  <button onClick={() => deleteReport(r.id)} style={btnDanger}>🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modais */}
      {showCreate && <CreateReportModal onClose={() => setShowCreate(false)} onCreated={() => { fetchReports(); showToast("Relatório criado!", "success"); }} />}
      {selected && <ReportDetailModal report={selected} onClose={() => setSelected(null)} onDelete={() => deleteReport(selected.id)} />}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
