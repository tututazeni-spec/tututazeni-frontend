"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AutomationRule {
  id: number;
  name: string;
  trigger: string;
  condition: string;
  action: string;
  active: boolean;
  createdAt?: string;
}

interface RunResult {
  executed: number;
  results: { ruleId: number; name: string; success: boolean; result?: any; error?: string }[];
}

// ─── Maps ─────────────────────────────────────────────────────────────────────
const TRIGGER_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  BIRTHDAY_TODAY:       { label: "Aniversário Hoje",         icon: "🎂", color: "#f59e0b" },
  PENDING_LEAVE_3_DAYS: { label: "Licença Pendente (3 dias)", icon: "📅", color: "#6366f1" },
  ENROLLMENT_EXPIRING:  { label: "Inscrição a Expirar",      icon: "📚", color: "#0ea5e9" },
  PAYSLIP_DUE:          { label: "Recibos Pendentes",         icon: "💰", color: "#10b981" },
};

const ACTION_LABELS: Record<string, string> = {
  SEND_BIRTHDAY_NOTIFICATION: "Enviar notificação de aniversário",
  NOTIFY_MANAGER:             "Notificar gestor",
  NOTIFY_LEARNER:             "Notificar colaborador",
  NOTIFY_HR:                  "Notificar RH",
};

const TRIGGER_OPTIONS = Object.entries(TRIGGER_LABELS).map(([k, v]) => ({ value: k, label: `${v.icon} ${v.label}` }));
const ACTION_OPTIONS = Object.entries(ACTION_LABELS).map(([k, v]) => ({ value: k, label: v }));

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
      <p style={{ margin: 0, fontSize: 13, color: type === "success" ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
        {msg}
      </p>
    </div>
  );
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function Toggle({ active, onChange }: { active: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} style={{
      width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
      background: active ? "#1e40af" : "#cbd5e1", position: "relative",
      transition: "background 0.2s", flexShrink: 0,
    }}>
      <span style={{
        position: "absolute", top: 3, left: active ? 22 : 2,
        width: 18, height: 18, borderRadius: "50%", background: "#fff",
        transition: "left 0.2s", display: "block",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </button>
  );
}

// ─── Rule Card ────────────────────────────────────────────────────────────────
function RuleCard({ rule, onToggle }: { rule: AutomationRule; onToggle: () => void }) {
  const trigger = TRIGGER_LABELS[rule.trigger] ?? { label: rule.trigger, icon: "⚡", color: "#64748b" };
  const action = ACTION_LABELS[rule.action] ?? rule.action;

  return (
    <div style={{
      ...card, padding: 20,
      borderLeft: `4px solid ${rule.active ? trigger.color : "#e2e8f0"}`,
      opacity: rule.active ? 1 : 0.65,
      transition: "opacity 0.2s, border-color 0.2s",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        {/* Icon */}
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: rule.active ? `${trigger.color}18` : "#f1f5f9",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22,
        }}>
          {trigger.icon}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
              {rule.name}
            </h3>
            <span style={{
              padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700,
              background: rule.active ? "#ecfdf5" : "#f1f5f9",
              color: rule.active ? "#16a34a" : "#94a3b8",
            }}>
              {rule.active ? "ACTIVA" : "INACTIVA"}
            </span>
          </div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "#64748b" }}>
              <span style={{ fontWeight: 600 }}>Gatilho:</span> {trigger.label}
            </span>
            <span style={{ fontSize: 12, color: "#64748b" }}>
              <span style={{ fontWeight: 600 }}>Acção:</span> {action}
            </span>
          </div>
        </div>

        {/* Toggle */}
        <Toggle active={rule.active} onChange={onToggle} />
      </div>
    </div>
  );
}

// ─── Modal: Criar Regra ───────────────────────────────────────────────────────
function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", trigger: "", action: "", condition: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.trigger || !form.action) { setError("Preenche todos os campos obrigatórios."); return; }
    setSaving(true);
    try {
      await api.post("/automation/rules", form);
      onCreated();
      onClose();
    } catch (e: any) {
      setError(e.message ?? "Erro ao criar regra");
    } finally { setSaving(false); }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500,
      background: "rgba(15,23,42,0.45)", display: "flex",
      alignItems: "center", justifyContent: "center", padding: 16,
    }} onClick={onClose}>
      <div style={{ ...card, width: "100%", maxWidth: 480, boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1e293b" }}>
            ⚡ Nova Regra de Automação
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
        </div>

        <form onSubmit={submit}>
          <div style={{ marginBottom: 16 }}>
            <span style={labelStyle}>Nome da Regra *</span>
            <input style={inputStyle} value={form.name} onChange={e => set("name", e.target.value)}
              placeholder="Ex: Notificação de aniversário" required />
          </div>

          <div style={{ marginBottom: 16 }}>
            <span style={labelStyle}>Gatilho (Trigger) *</span>
            <select style={{ ...inputStyle }} value={form.trigger} onChange={e => set("trigger", e.target.value)} required>
              <option value="">Selecciona um gatilho...</option>
              {TRIGGER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <span style={labelStyle}>Acção *</span>
            <select style={{ ...inputStyle }} value={form.action} onChange={e => set("action", e.target.value)} required>
              <option value="">Selecciona uma acção...</option>
              {ACTION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 20 }}>
            <span style={labelStyle}>Condição (opcional)</span>
            <input style={inputStyle} value={form.condition} onChange={e => set("condition", e.target.value)}
              placeholder="Ex: department = RH" />
          </div>

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
              <p style={{ margin: 0, fontSize: 13, color: "#dc2626" }}>{error}</p>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={btnGhost}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>
              {saving ? "A criar..." : "Criar Regra"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Painel: Resultado da Execução ────────────────────────────────────────────
function RunResultPanel({ result, onClose }: { result: RunResult; onClose: () => void }) {
  return (
    <div style={{
      ...card, marginTop: 24,
      border: "1px solid #bfdbfe", background: "#eff6ff",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1e40af" }}>
          🚀 Resultado da Execução — {result.executed} regra(s) processada(s)
        </h3>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#94a3b8" }}>×</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {result.results.map((r, i) => (
          <div key={i} style={{
            padding: "10px 14px", borderRadius: 8,
            background: r.success ? "#ecfdf5" : "#fef2f2",
            border: `1px solid ${r.success ? "#bbf7d0" : "#fecaca"}`,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 16 }}>{r.success ? "✅" : "❌"}</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{r.name}</p>
              {r.error && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#dc2626" }}>{r.error}</p>}
              {r.result?.message && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#475569" }}>{r.result.message}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function AutomacoesPage() {
  const [rules, setRules]           = useState<AutomationRule[]>([]);
  const [loading, setLoading]       = useState(true);
  const [running, setRunning]       = useState(false);
  const [initing, setIniting]       = useState(false);
  const [showModal, setShowModal]   = useState(false);
  const [runResult, setRunResult]   = useState<RunResult | null>(null);
  const [toast, setToast]           = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [filter, setFilter]         = useState<"all" | "active" | "inactive">("all");

  function showToast(msg: string, type: "success" | "error") { setToast({ msg, type }); }

  async function fetchRules() {
    try {
      const data = await api.get<AutomationRule[]>("/automation/rules");
      setRules(data);
    } catch (e: any) {
      showToast(e.message ?? "Erro ao carregar regras", "error");
    } finally { setLoading(false); }
  }

  useEffect(() => { fetchRules(); }, []);

  async function toggleRule(id: number) {
    try {
      await api.patch(`/automation/rules/${id}/toggle`, {});
      setRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
    } catch (e: any) {
      showToast(e.message ?? "Erro ao alterar regra", "error");
    }
  }

  async function runAll() {
    setRunning(true);
    setRunResult(null);
    try {
      const res = await api.post<RunResult>("/automation/run", {});
      setRunResult(res);
      showToast(`${res.executed} regra(s) executada(s) com sucesso!`, "success");
    } catch (e: any) {
      showToast(e.message ?? "Erro na execução", "error");
    } finally { setRunning(false); }
  }

  async function initDefaults() {
    setIniting(true);
    try {
      const res = await api.post<{ created: number; message: string }>("/automation/rules/init-defaults", {});
      showToast(res.message, "success");
      fetchRules();
    } catch (e: any) {
      showToast(e.message ?? "Erro ao inicializar", "error");
    } finally { setIniting(false); }
  }

  const filtered = rules.filter(r =>
    filter === "all" ? true : filter === "active" ? r.active : !r.active
  );

  const activeCount   = rules.filter(r => r.active).length;
  const inactiveCount = rules.filter(r => !r.active).length;

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", margin: 0 }}>
            ⚡ Automações
          </h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
            Regras automáticas de notificação e processos de RH
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={initDefaults} disabled={initing} style={{ ...btnGhost, opacity: initing ? 0.7 : 1 }}>
            {initing ? "A inicializar..." : "🔧 Inicializar Padrões"}
          </button>
          <button onClick={runAll} disabled={running} style={{
            ...btnGhost, background: "#fef3c7", color: "#92400e",
            opacity: running ? 0.7 : 1,
          }}>
            {running ? "⏳ A executar..." : "▶️ Executar Todas"}
          </button>
          <button onClick={() => setShowModal(true)} style={btnPrimary}>
            + Nova Regra
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total de Regras", value: rules.length, icon: "⚡", color: "#1e40af", bg: "#eff6ff" },
          { label: "Regras Activas",  value: activeCount,  icon: "✅", color: "#16a34a", bg: "#ecfdf5" },
          { label: "Regras Inactivas",value: inactiveCount,icon: "⏸️", color: "#94a3b8", bg: "#f8fafc" },
        ].map(s => (
          <div key={s.label} style={{ ...card, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, background: s.bg,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0,
            }}>
              {s.icon}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</p>
              <p style={{ margin: 0, fontSize: 12, color: "#64748b", fontWeight: 600 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Resultado execução ── */}
      {runResult && <RunResultPanel result={runResult} onClose={() => setRunResult(null)} />}

      {/* ── Filtros ── */}
      <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 10, padding: 4, marginBottom: 20, width: "fit-content" }}>
        {(["all", "active", "inactive"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "7px 18px", border: "none", cursor: "pointer", fontSize: 13,
            fontWeight: filter === f ? 700 : 500, borderRadius: 8,
            background: filter === f ? "#1e40af" : "transparent",
            color: filter === f ? "#fff" : "#64748b", transition: "all 0.15s",
          }}>
            {f === "all" ? "Todas" : f === "active" ? "Activas" : "Inactivas"}
          </button>
        ))}
      </div>

      {/* ── Lista de Regras ── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#94a3b8", fontSize: 14 }}>
          A carregar regras...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ ...card, textAlign: "center", padding: 60 }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>⚡</p>
          <p style={{ color: "#94a3b8", fontSize: 14, margin: 0 }}>
            {rules.length === 0
              ? 'Nenhuma regra criada. Clica em "Inicializar Padrões" para começar.'
              : "Nenhuma regra nesta categoria."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(rule => (
            <RuleCard key={rule.id} rule={rule} onToggle={() => toggleRule(rule.id)} />
          ))}
        </div>
      )}

      {/* ── Info Box ── */}
      <div style={{
        marginTop: 24, padding: "14px 18px", borderRadius: 10,
        background: "#fffbeb", border: "1px solid #fde68a",
      }}>
        <p style={{ margin: 0, fontSize: 12, color: "#92400e", fontWeight: 600 }}>
          ℹ️ As regras são executadas automaticamente pelo sistema. Podes também executar manualmente clicando em "Executar Todas".
          Algumas funcionalidades (aniversários, licenças) requerem campos adicionais no schema da base de dados.
        </p>
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <CreateModal
          onClose={() => setShowModal(false)}
          onCreated={() => { fetchRules(); showToast("Regra criada com sucesso!", "success"); }}
        />
      )}

      {/* ── Toast ── */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}