"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Integration {
  id: number;
  name: string;
  type: string;
  endpoint: string;
  baseUrl?: string;
  apiKey?: string;
  active: boolean;
  config?: any;
  createdAt: string;
}

interface IntegrationLog {
  id: number;
  integrationId: number;
  status: string;
  statusCode?: number;
  message?: string;
  createdAt: string;
}

interface TestResult {
  success: boolean;
  statusCode?: number;
  message: string;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const btnPrimary: React.CSSProperties = {
  padding: "10px 20px", background: "#1e40af", color: "#fff",
  border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
};
const btnGhost: React.CSSProperties = {
  padding: "10px 20px", background: "#f1f5f9", color: "#475569",
  border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
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
const card: React.CSSProperties = {
  background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0",
};

// ─── TYPE / STATUS badges ─────────────────────────────────────────────────────
const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  REST:     { bg: "#eff6ff", color: "#1e40af" },
  WEBHOOK:  { bg: "#f5f3ff", color: "#8b5cf6" },
  SOAP:     { bg: "#fff7ed", color: "#ea580c" },
  GRAPHQL:  { bg: "#ecfdf5", color: "#10b981" },
};

function TypeBadge({ type }: { type: string }) {
  const c = TYPE_COLORS[type.toUpperCase()] ?? { bg: "#f1f5f9", color: "#64748b" };
  return (
    <span style={{
      padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
      background: c.bg, color: c.color,
    }}>{type}</span>
  );
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{
        width: 8, height: 8, borderRadius: "50%",
        background: active ? "#22c55e" : "#94a3b8",
        boxShadow: active ? "0 0 0 2px #bbf7d0" : "none",
      }} />
      <span style={{ fontSize: 12, color: active ? "#16a34a" : "#94a3b8", fontWeight: 600 }}>
        {active ? "Activa" : "Inactiva"}
      </span>
    </div>
  );
}

// ─── Modal: Nova Integração ───────────────────────────────────────────────────
function ModalNova({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    name: "", type: "REST", endpoint: "", baseUrl: "", apiKey: "", active: true,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState("");

  function set(k: string, v: any) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.endpoint) { setErr("Nome e endpoint são obrigatórios."); return; }
    setSaving(true); setErr("");
    try {
      // POST /api-integrations — body: { name, type, endpoint, baseUrl?, apiKey?, active? }
      await api.post("/api-integrations", {
        name:     form.name,
        type:     form.type,
        endpoint: form.endpoint,
        baseUrl:  form.baseUrl || undefined,
        apiKey:   form.apiKey  || undefined,
        active:   form.active,
      });
      onSave();
    } catch (e: any) { setErr(e.message ?? "Erro ao criar integração"); }
    finally { setSaving(false); }
  }

  const TYPES = ["REST", "WEBHOOK", "SOAP", "GRAPHQL", "OTHER"];

  return (
    <Overlay>
      <Modal title="Nova Integração" onClose={onClose}>
        <form onSubmit={submit}>
          <Field label="Nome">
            <input value={form.name} onChange={e => set("name", e.target.value)}
              style={inputStyle} placeholder="ex: Sistema de RH" required />
          </Field>
          <Field label="Tipo">
            <select value={form.type} onChange={e => set("type", e.target.value)} style={inputStyle}>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Endpoint (URL base da API)">
            <input value={form.endpoint} onChange={e => set("endpoint", e.target.value)}
              style={inputStyle} placeholder="https://api.exemplo.com" required />
          </Field>
          <Field label="Base URL (opcional)">
            <input value={form.baseUrl} onChange={e => set("baseUrl", e.target.value)}
              style={inputStyle} placeholder="https://exemplo.com" />
          </Field>
          <Field label="API Key (opcional)">
            <input value={form.apiKey} onChange={e => set("apiKey", e.target.value)}
              style={inputStyle} placeholder="sk-..." type="password" />
          </Field>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <input type="checkbox" id="active" checked={form.active}
              onChange={e => set("active", e.target.checked)} style={{ width: 16, height: 16 }} />
            <label htmlFor="active" style={{ fontSize: 13, color: "#1e293b", cursor: "pointer" }}>
              Activar imediatamente
            </label>
          </div>
          {err && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 12 }}>{err}</p>}
          <ModalFooter onClose={onClose} saving={saving} label="Criar Integração" />
        </form>
      </Modal>
    </Overlay>
  );
}

// ─── Modal: Logs ──────────────────────────────────────────────────────────────
function ModalLogs({ integration, onClose }: { integration: Integration; onClose: () => void }) {
  const [logs, setLogs]   = useState<IntegrationLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // GET /api-integrations/:id/logs
    api.get<IntegrationLog[]>(`/api-integrations/${integration.id}/logs?limit=50`)
      .then(setLogs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [integration.id]);

  return (
    <Overlay>
      <Modal title={`Logs — ${integration.name}`} onClose={onClose} wide>
        {loading ? (
          <p style={{ color: "#94a3b8", textAlign: "center", padding: 32 }}>A carregar logs...</p>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>
            <p style={{ fontSize: 28, margin: "0 0 8px" }}>📋</p>
            <p style={{ fontSize: 13 }}>Sem logs registados ainda. Teste a integração para gerar logs.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto", maxHeight: 420, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead style={{ position: "sticky", top: 0, background: "#f8fafc", zIndex: 1 }}>
                <tr>
                  {["Estado", "Código HTTP", "Mensagem", "Data/Hora"].map(h => (
                    <th key={h} style={{
                      padding: "10px 14px", textAlign: "left", fontWeight: 700,
                      color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{
                        padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                        background: log.status === "OK" ? "#ecfdf5" : "#fef2f2",
                        color: log.status === "OK" ? "#10b981" : "#dc2626",
                      }}>{log.status}</span>
                    </td>
                    <td style={{ padding: "10px 14px", color: "#64748b", fontFamily: "monospace" }}>
                      {log.statusCode ?? "—"}
                    </td>
                    <td style={{ padding: "10px 14px", color: "#1e293b", maxWidth: 300 }}>
                      {log.message ?? "—"}
                    </td>
                    <td style={{ padding: "10px 14px", color: "#94a3b8", fontSize: 12, whiteSpace: "nowrap" }}>
                      {new Date(log.createdAt).toLocaleString("pt-PT")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
          <button onClick={onClose} style={btnGhost}>Fechar</button>
        </div>
      </Modal>
    </Overlay>
  );
}

// ─── Integration Card ─────────────────────────────────────────────────────────
function IntegrationCard({
  integration, onToggle, onTest, onLogs, testing,
}: {
  integration: Integration;
  onToggle: () => void;
  onTest: () => void;
  onLogs: () => void;
  testing: boolean;
}) {
  return (
    <div style={{
      ...card, overflow: "hidden",
      opacity: integration.active ? 1 : 0.7,
      transition: "all 0.2s",
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 20px", borderBottom: "1px solid #f1f5f9",
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 20 }}>
              {integration.type === "REST" ? "🔗" :
               integration.type === "WEBHOOK" ? "⚡" :
               integration.type === "GRAPHQL" ? "🔮" : "🔌"}
            </span>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>
              {integration.name}
            </span>
            <TypeBadge type={integration.type} />
          </div>
          <StatusDot active={integration.active} />
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "14px 20px" }}>
        <div style={{ marginBottom: 10 }}>
          <span style={{ ...labelStyle, marginBottom: 4 }}>Endpoint</span>
          <p style={{
            margin: 0, fontSize: 12, color: "#475569", fontFamily: "monospace",
            background: "#f8fafc", padding: "6px 10px", borderRadius: 6,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {integration.endpoint}
          </p>
        </div>
        {integration.baseUrl && (
          <div style={{ marginBottom: 10 }}>
            <span style={{ ...labelStyle, marginBottom: 4 }}>Base URL</span>
            <p style={{
              margin: 0, fontSize: 12, color: "#475569", fontFamily: "monospace",
              background: "#f8fafc", padding: "6px 10px", borderRadius: 6,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {integration.baseUrl}
            </p>
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>API Key:</span>
          <span style={{ fontSize: 12, color: integration.apiKey ? "#10b981" : "#94a3b8", fontWeight: 600 }}>
            {integration.apiKey ? "✓ Configurada" : "Não configurada"}
          </span>
        </div>
      </div>

      {/* Footer: Acções */}
      <div style={{
        padding: "12px 20px", background: "#f8fafc", borderTop: "1px solid #f1f5f9",
        display: "flex", gap: 8, flexWrap: "wrap",
      }}>
        <button
          onClick={onTest}
          disabled={testing}
          style={{
            padding: "6px 14px", background: testing ? "#f1f5f9" : "#eff6ff",
            color: testing ? "#94a3b8" : "#1e40af",
            border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: testing ? "not-allowed" : "pointer",
          }}
        >
          {testing ? "A testar..." : "🔍 Testar"}
        </button>
        <button
          onClick={onLogs}
          style={{
            padding: "6px 14px", background: "#f5f3ff", color: "#8b5cf6",
            border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}
        >
          📋 Logs
        </button>
        <button
          onClick={onToggle}
          style={{
            padding: "6px 14px",
            background: integration.active ? "#fef2f2" : "#f0fdf4",
            color: integration.active ? "#dc2626" : "#16a34a",
            border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}
        >
          {integration.active ? "⏸ Desactivar" : "▶ Activar"}
        </button>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#94a3b8", alignSelf: "center" }}>
          {new Date(integration.createdAt).toLocaleDateString("pt-PT")}
        </span>
      </div>
    </div>
  );
}

// ─── Helpers UI ───────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <span style={labelStyle}>{label}</span>
      {children}
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200,
    }}>{children}</div>
  );
}

function Modal({ title, onClose, children, wide }: {
  title: string; onClose: () => void; children: React.ReactNode; wide?: boolean;
}) {
  return (
    <div style={{
      background: "#fff", borderRadius: 16, padding: 32,
      width: wide ? 640 : 480, maxWidth: "95vw", maxHeight: "90vh",
      overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: 0 }}>{title}</h2>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#94a3b8" }}>✕</button>
      </div>
      {children}
    </div>
  );
}

function ModalFooter({ onClose, saving, label }: { onClose: () => void; saving: boolean; label: string }) {
  return (
    <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
      <button type="button" onClick={onClose} style={btnGhost}>Cancelar</button>
      <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>
        {saving ? "A guardar..." : label}
      </button>
    </div>
  );
}

// ─── Toast de resultado de teste ─────────────────────────────────────────────
function TestToast({ result, onClose }: { result: TestResult; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 300,
      background: result.success ? "#ecfdf5" : "#fef2f2",
      border: `1px solid ${result.success ? "#bbf7d0" : "#fecaca"}`,
      borderRadius: 12, padding: "14px 20px", maxWidth: 340,
      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
      animation: "slideIn 0.3s ease",
    }}>
      <style>{`@keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <span style={{ fontSize: 20 }}>{result.success ? "✅" : "❌"}</span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: result.success ? "#16a34a" : "#dc2626" }}>
            {result.success ? "Conexão estabelecida" : "Falha na conexão"}
          </p>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: "#64748b" }}>
            {result.message}
            {result.statusCode ? ` (HTTP ${result.statusCode})` : ""}
          </p>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 16 }}>✕</button>
      </div>
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function IntegracoesPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [search, setSearch]             = useState("");
  const [filterType, setFilterType]     = useState("");
  const [filterActive, setFilterActive] = useState("");
  const [modalNova, setModalNova]       = useState(false);
  const [modalLogs, setModalLogs]       = useState<Integration | null>(null);
  const [testing, setTesting]           = useState<Record<number, boolean>>({});
  const [testResult, setTestResult]     = useState<TestResult | null>(null);

  function load() {
    setLoading(true);
    // GET /api-integrations
    api.get<Integration[]>("/api-integrations")
      .then(res => setIntegrations(Array.isArray(res) ? res : []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function toggle(id: number) {
    try {
      // PATCH /api-integrations/:id/toggle
      await api.patch(`/api-integrations/${id}/toggle`, {});
      load();
    } catch (e: any) { alert(e.message); }
  }

  async function test(id: number) {
    setTesting(t => ({ ...t, [id]: true }));
    try {
      // POST /api-integrations/:id/test
      const res = await api.post<TestResult>(`/api-integrations/${id}/test`, {});
      setTestResult(res);
    } catch (e: any) {
      setTestResult({ success: false, message: e.message ?? "Erro ao testar" });
    } finally {
      setTesting(t => ({ ...t, [id]: false }));
    }
  }

  // Filtros locais
  const filtered = integrations.filter(i => {
    const matchSearch = !search ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.endpoint.toLowerCase().includes(search.toLowerCase());
    const matchType   = !filterType   || i.type === filterType;
    const matchActive = !filterActive ||
      (filterActive === "active" ? i.active : !i.active);
    return matchSearch && matchType && matchActive;
  });

  const types    = [...new Set(integrations.map(i => i.type))];
  const activas  = integrations.filter(i => i.active).length;
  const inativas = integrations.length - activas;

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", margin: 0 }}>🔌 Integrações</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
            Gestão de integrações com sistemas externos — {integrations.length} configuradas
          </p>
        </div>
        <button onClick={() => setModalNova(true)} style={btnPrimary}>
          + Nova Integração
        </button>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total",    value: integrations.length, color: "#1e40af", bg: "#eff6ff" },
          { label: "Activas",  value: activas,             color: "#16a34a", bg: "#f0fdf4" },
          { label: "Inactivas", value: inativas,           color: "#94a3b8", bg: "#f1f5f9" },
        ].map(s => (
          <div key={s.label} style={{
            background: s.bg, borderRadius: 10, padding: "14px 18px",
            border: `1px solid ${s.color}22`,
          }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: s.color, textTransform: "uppercase", letterSpacing: 0.8 }}>{s.label}</p>
            <p style={{ margin: "4px 0 0", fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Filtros ── */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <input
          placeholder="Pesquisar por nome ou endpoint..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, width: 300 }}
        />
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ ...inputStyle, width: 150 }}>
          <option value="">Todos os tipos</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterActive} onChange={e => setFilterActive(e.target.value)} style={{ ...inputStyle, width: 160 }}>
          <option value="">Todos os estados</option>
          <option value="active">Activas</option>
          <option value="inactive">Inactivas</option>
        </select>
        {(search || filterType || filterActive) && (
          <button onClick={() => { setSearch(""); setFilterType(""); setFilterActive(""); }} style={{ ...btnGhost, padding: "10px 14px" }}>
            ✕ Limpar
          </button>
        )}
      </div>

      {/* ── Erro ── */}
      {error && (
        <div style={{
          background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8,
          padding: 14, color: "#dc2626", fontSize: 13, marginBottom: 16,
        }}>{error}</div>
      )}

      {/* ── Grid de Integrações ── */}
      {loading ? (
        <div style={{ padding: 60, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
          A carregar integrações...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          padding: 60, textAlign: "center", background: "#fff",
          borderRadius: 12, border: "1px solid #e2e8f0",
        }}>
          <p style={{ fontSize: 32, margin: "0 0 12px" }}>🔌</p>
          <p style={{ fontSize: 14, fontWeight: 500, color: "#1e293b" }}>
            {integrations.length === 0 ? "Nenhuma integração configurada" : "Nenhuma integração encontrada"}
          </p>
          <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 4, marginBottom: 20 }}>
            {integrations.length === 0
              ? "Configura a primeira integração com um sistema externo"
              : "Tenta ajustar os filtros de pesquisa"}
          </p>
          {integrations.length === 0 && (
            <button onClick={() => setModalNova(true)} style={btnPrimary}>
              + Nova Integração
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
          {filtered.map(i => (
            <IntegrationCard
              key={i.id}
              integration={i}
              onToggle={() => toggle(i.id)}
              onTest={() => test(i.id)}
              onLogs={() => setModalLogs(i)}
              testing={testing[i.id] ?? false}
            />
          ))}
        </div>
      )}

      {/* ── Modais ── */}
      {modalNova && (
        <ModalNova
          onClose={() => setModalNova(false)}
          onSave={() => { setModalNova(false); load(); }}
        />
      )}
      {modalLogs && (
        <ModalLogs
          integration={modalLogs}
          onClose={() => setModalLogs(null)}
        />
      )}

      {/* ── Toast de resultado de teste ── */}
      {testResult && (
        <TestToast result={testResult} onClose={() => setTestResult(null)} />
      )}
    </div>
  );
}