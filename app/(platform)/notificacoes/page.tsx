"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotificationLog {
  id: number;
  userId: number;
  type: string;
  message: string;
  success: boolean;
  createdAt: string;
  user?: { id: number; fullName: string };
}

interface NotificationStats {
  total: number;
  success: number;
  failed: number;
  successRate: number;
  byType: { type: string; _count: number }[];
}

interface AutomationRule {
  id: number;
  name: string;
  trigger: string;
  action: string;
  condition: string;
  active: boolean;
  createdAt: string;
}

interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_CFG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  LEAVE_UPDATE:      { label: "Licença",       color: "#0891b2", bg: "#ecfeff", icon: "🏖️" },
  ENROLLMENT:        { label: "Inscrição",      color: "#7c3aed", bg: "#f5f3ff", icon: "📚" },
  EVALUATION:        { label: "Avaliação",      color: "#d97706", bg: "#fffbeb", icon: "⭐" },
  PAYSLIP:           { label: "Recibo",         color: "#16a34a", bg: "#f0fdf4", icon: "💰" },
  TASK:              { label: "Tarefa",         color: "#2563eb", bg: "#eff6ff", icon: "✅" },
  BIRTHDAY:          { label: "Aniversário",    color: "#db2777", bg: "#fdf2f8", icon: "🎂" },
  SYSTEM:            { label: "Sistema",        color: "#64748b", bg: "#f1f5f9", icon: "⚙️" },
  COURSE_COMPLETED:  { label: "Curso",          color: "#059669", bg: "#ecfdf5", icon: "🎓" },
  REMINDER:          { label: "Lembrete",       color: "#ea580c", bg: "#fff7ed", icon: "⏰" },
};

function getTypeCfg(type: string) {
  return TYPE_CFG[type] ?? { label: type, color: "#64748b", bg: "#f1f5f9", icon: "🔔" };
}

const TRIGGER_OPTIONS = [
  "USER_CREATED", "ENROLLMENT_CREATED", "COURSE_COMPLETED",
  "LEAVE_REQUESTED", "LEAVE_APPROVED", "EVALUATION_SUBMITTED",
  "BIRTHDAY", "CONTRACT_EXPIRING", "TASK_ASSIGNED",
];

// ─── Utilities ────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-PT", {
    day: "2-digit", month: "short", year: "numeric",
  });
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-PT", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}
function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min  = Math.floor(diff / 60_000);
  const h    = Math.floor(diff / 3_600_000);
  const d    = Math.floor(diff / 86_400_000);
  if (min < 1)  return "agora mesmo";
  if (min < 60) return `há ${min}m`;
  if (h < 24)   return `há ${h}h`;
  return `há ${d}d`;
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const p = ["#0891b2", "#7c3aed", "#16a34a", "#d97706", "#dc2626", "#db2777"];
  const c = p[name.charCodeAt(0) % p.length];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, background: c + "18", border: `2px solid ${c}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.34, fontWeight: 700, color: c }}>
      {getInitials(name)}
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  const s = getTypeCfg(type);
  return (
    <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10.5, fontWeight: 700, background: s.bg, color: s.color, whiteSpace: "nowrap" }}>
      {s.icon} {s.label}
    </span>
  );
}

function SuccessBadge({ success }: { success: boolean }) {
  return (
    <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10.5, fontWeight: 700, background: success ? "#f0fdf4" : "#fef2f2", color: success ? "#16a34a" : "#dc2626" }}>
      {success ? "✓ Enviada" : "✗ Falhou"}
    </span>
  );
}

function Spinner({ size = 26 }: { size?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "48px 0" }}>
      <div style={{ width: size, height: size, border: "3px solid #e2e8f0", borderTopColor: "#f59e0b", borderRadius: "50%", animation: "ntf-spin 0.7s linear infinite" }} />
      <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>A carregar...</p>
    </div>
  );
}

function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error" | "info"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3800); return () => clearTimeout(t); }, []);
  const c = {
    success: { bg: "#f0fdf4", bd: "#bbf7d0", cl: "#16a34a", ic: "✓" },
    error:   { bg: "#fef2f2", bd: "#fecaca", cl: "#dc2626", ic: "✗" },
    info:    { bg: "#fffbeb", bd: "#fde68a", cl: "#d97706", ic: "🔔" },
  }[type];
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: c.bg, border: `1px solid ${c.bd}`, borderRadius: 12, padding: "12px 18px", maxWidth: 340, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", gap: 10, animation: "ntf-in 0.2s ease" }}>
      <span style={{ width: 22, height: 22, borderRadius: "50%", background: c.cl + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: c.cl, fontWeight: 800, flexShrink: 0 }}>{c.ic}</span>
      <p style={{ margin: 0, fontSize: 13, color: c.cl, fontWeight: 500 }}>{msg}</p>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", marginLeft: "auto", fontSize: 16, lineHeight: 1 }}>×</button>
    </div>
  );
}

function useToast() {
  const [t, setT] = useState<{ msg: string; type: "success" | "error" | "info"; k: number } | null>(null);
  const show = useCallback((msg: string, type: "success" | "error" | "info" = "info") =>
    setT({ msg, type, k: Date.now() }), []);
  return { showToast: show, toastNode: t ? <Toast key={t.k} msg={t.msg} type={t.type} onClose={() => setT(null)} /> : null };
}

const CARD: React.CSSProperties = { background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0" };
const INP:  React.CSSProperties = { width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13.5, color: "#1e293b", background: "#f8fafc", fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
const LBL:  React.CSSProperties = { display: "block", fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: "#64748b", marginBottom: 5 };

// ─── Stats Section ────────────────────────────────────────────────────────────

function StatsSection({ stats }: { stats: NotificationStats }) {
  const maxCount = Math.max(...stats.byType.map(b => b._count), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Main stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
        {[
          { label: "Total Enviadas",  value: stats.total,       color: "#1e293b", bg: "#f1f5f9", icon: "📨" },
          { label: "Com Sucesso",     value: stats.success,     color: "#16a34a", bg: "#f0fdf4", icon: "✓"  },
          { label: "Falharam",        value: stats.failed,      color: "#dc2626", bg: "#fef2f2", icon: "✗"  },
          { label: "Taxa de Sucesso", value: `${stats.successRate}%`, color: "#d97706", bg: "#fffbeb", icon: "📊" },
        ].map(s => (
          <div key={s.label} style={{ ...CARD, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{s.icon}</div>
            <div>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.7 }}>{s.label}</p>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Success rate bar */}
      <div style={{ ...CARD, padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Taxa de Entrega Global</p>
          <span style={{ fontSize: 20, fontWeight: 800, color: stats.successRate >= 90 ? "#16a34a" : stats.successRate >= 70 ? "#d97706" : "#dc2626" }}>
            {stats.successRate}%
          </span>
        </div>
        <div style={{ height: 10, background: "#e2e8f0", borderRadius: 5, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${stats.successRate}%`, background: stats.successRate >= 90 ? "#16a34a" : stats.successRate >= 70 ? "#d97706" : "#dc2626", borderRadius: 5, transition: "width 0.8s ease" }} />
        </div>
      </div>

      {/* By type */}
      {stats.byType.length > 0 && (
        <div style={{ ...CARD, padding: "16px 20px" }}>
          <p style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Por Tipo</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {stats.byType.slice(0, 8).map(b => {
              const s = getTypeCfg(b.type);
              const pct = Math.round((b._count / maxCount) * 100);
              return (
                <div key={b.type}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12.5, color: "#475569", display: "flex", alignItems: "center", gap: 5 }}>
                      {s.icon} {s.label}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{b._count}</span>
                  </div>
                  <div style={{ height: 5, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: s.color, borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── My Notifications ─────────────────────────────────────────────────────────

function MyNotifications({ showToast }: { showToast: (m: string, t: "success" | "error" | "info") => void }) {
  const [data, setData]           = useState<NotificationLog[]>([]);
  const [total, setTotal]         = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);
  const [filterType, setFilterType] = useState("");

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page: String(p), limit: "20" });
      if (filterType) q.set("type", filterType);
      const res = await api.get<Paginated<NotificationLog>>(`/notifications/my?${q}`);
      setData(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setPage(res.page);
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setLoading(false); }
  }, [filterType]);

  useEffect(() => { load(1); }, [filterType]);

  // Group by day
  const grouped = data.reduce<Record<string, NotificationLog[]>>((acc, n) => {
    const day = new Date(n.createdAt).toDateString();
    if (!acc[day]) acc[day] = [];
    acc[day].push(n);
    return acc;
  }, {});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Filter */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ ...INP, maxWidth: 200 }}>
          <option value="">Todos os tipos</option>
          {Object.entries(TYPE_CFG).map(([k, v]) => (
            <option key={k} value={k}>{v.icon} {v.label}</option>
          ))}
        </select>
        {filterType && (
          <button onClick={() => setFilterType("")} style={{ padding: "9px 14px", borderRadius: 9, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 12.5, color: "#64748b" }}>
            ✕ Limpar
          </button>
        )}
        <p style={{ margin: 0, fontSize: 12.5, color: "#94a3b8", alignSelf: "center" }}>{total} notificações</p>
      </div>

      {loading ? <Spinner /> : data.length === 0 ? (
        <div style={{ ...CARD, padding: "52px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 36, margin: "0 0 10px" }}>🔔</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", margin: "0 0 4px" }}>Sem notificações</p>
          <p style={{ fontSize: 13, color: "#94a3b8" }}>Não tens notificações{filterType ? " deste tipo" : ""} ainda.</p>
        </div>
      ) : (
        <>
          {Object.entries(grouped).map(([day, items]) => (
            <div key={day}>
              {/* Day header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.7 }}>
                  {new Date(day).toLocaleDateString("pt-PT", { weekday: "long", day: "2-digit", month: "long" })}
                </span>
                <div style={{ flex: 1, height: 1, background: "#f1f5f9" }} />
              </div>

              {/* Notifications */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {items.map(n => {
                  const s = getTypeCfg(n.type);
                  return (
                    <div key={n.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px", background: "#fff", borderRadius: 12, border: "1px solid #f1f5f9", borderLeft: `3px solid ${s.color}` }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                        {s.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                          <TypeBadge type={n.type} />
                          <span style={{ fontSize: 11, color: "#94a3b8" }}>{timeAgo(n.createdAt)}</span>
                          {!n.success && <SuccessBadge success={n.success} />}
                        </div>
                        <p style={{ margin: 0, fontSize: 13.5, color: "#1e293b", lineHeight: 1.55 }}>{n.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
              <button onClick={() => load(page - 1)} disabled={page === 1} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 12.5, opacity: page === 1 ? 0.4 : 1 }}>← Anterior</button>
              <span style={{ padding: "8px 14px", fontSize: 13, color: "#64748b" }}>{page} / {totalPages}</span>
              <button onClick={() => load(page + 1)} disabled={page === totalPages} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 12.5, opacity: page === totalPages ? 0.4 : 1 }}>Seguinte →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── All Logs (Admin) ─────────────────────────────────────────────────────────

function AllLogs({ showToast }: { showToast: (m: string, t: "success" | "error" | "info") => void }) {
  const [data, setData]           = useState<NotificationLog[]>([]);
  const [total, setTotal]         = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);
  const [filterType, setFilterType]       = useState("");
  const [filterSuccess, setFilterSuccess] = useState<"" | "true" | "false">("");

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page: String(p), limit: "20" });
      if (filterType)    q.set("type", filterType);
      if (filterSuccess) q.set("success", filterSuccess);
      const res = await api.get<Paginated<NotificationLog>>(`/notifications?${q}`);
      setData(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setPage(res.page);
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setLoading(false); }
  }, [filterType, filterSuccess]);

  useEffect(() => { load(1); }, [filterType, filterSuccess]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Filtros */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ ...INP, maxWidth: 200 }}>
          <option value="">Todos os tipos</option>
          {Object.entries(TYPE_CFG).map(([k, v]) => (
            <option key={k} value={k}>{v.icon} {v.label}</option>
          ))}
        </select>
        <select value={filterSuccess} onChange={e => setFilterSuccess(e.target.value as any)} style={{ ...INP, maxWidth: 160 }}>
          <option value="">Todos os estados</option>
          <option value="true">✓ Com Sucesso</option>
          <option value="false">✗ Falhadas</option>
        </select>
        {(filterType || filterSuccess) && (
          <button onClick={() => { setFilterType(""); setFilterSuccess(""); }} style={{ padding: "9px 14px", borderRadius: 9, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 12.5, color: "#64748b" }}>
            ✕ Limpar
          </button>
        )}
        <p style={{ margin: 0, fontSize: 12.5, color: "#94a3b8" }}>{total} registos</p>
      </div>

      {/* Tabela */}
      {loading ? <Spinner /> : (
        <div style={{ ...CARD, overflow: "hidden" }}>
          {data.length === 0 ? (
            <div style={{ padding: "52px 24px", textAlign: "center", color: "#94a3b8" }}>
              <p style={{ fontSize: 30, margin: "0 0 8px" }}>📭</p>
              <p style={{ fontSize: 14 }}>Nenhuma notificação encontrada.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    {["Utilizador", "Tipo", "Mensagem", "Estado", "Data"].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map(n => (
                    <tr key={n.id} style={{ borderBottom: "1px solid #f1f5f9" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#fafafa")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <td style={{ padding: "11px 14px" }}>
                        {n.user ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Avatar name={n.user.fullName} size={28} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{n.user.fullName}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: "#94a3b8" }}>#{n.userId}</span>
                        )}
                      </td>
                      <td style={{ padding: "11px 14px" }}><TypeBadge type={n.type} /></td>
                      <td style={{ padding: "11px 14px", maxWidth: 260 }}>
                        <p style={{ margin: 0, fontSize: 13, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.message}</p>
                      </td>
                      <td style={{ padding: "11px 14px" }}><SuccessBadge success={n.success} /></td>
                      <td style={{ padding: "11px 14px", fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap" }}>{fmtDateTime(n.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderTop: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: 12.5, color: "#64748b" }}>Página {page} de {totalPages}</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => load(page - 1)} disabled={page === 1} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 12.5, opacity: page === 1 ? 0.4 : 1 }}>← Anterior</button>
                <button onClick={() => load(page + 1)} disabled={page === totalPages} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 12.5, opacity: page === totalPages ? 0.4 : 1 }}>Seguinte →</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Send Notifications ───────────────────────────────────────────────────────

type SendMode = "single" | "bulk" | "all";

function SendPanel({ showToast }: { showToast: (m: string, t: "success" | "error" | "info") => void }) {
  const [mode, setMode]           = useState<SendMode>("single");
  const [type, setType]           = useState("SYSTEM");
  const [message, setMessage]     = useState("");
  const [userId, setUserId]       = useState("");
  const [userIds, setUserIds]     = useState("");
  const [saving, setSaving]       = useState(false);
  const [result, setResult]       = useState<string | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSaving(true); setResult(null);
    try {
      if (mode === "single") {
        if (!userId) { showToast("ID do utilizador obrigatório.", "error"); setSaving(false); return; }
        await api.post("/notifications/send", { userId: +userId, type, message });
        setResult("✓ Notificação enviada com sucesso!");
        showToast("Notificação enviada!", "success");

      } else if (mode === "bulk") {
        const ids = userIds.split(/[\n,]+/).map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        if (!ids.length) { showToast("Introduz pelo menos um ID.", "error"); setSaving(false); return; }
        const res = await api.post<{ sent: number }>("/notifications/send-bulk", { userIds: ids, type, message });
        setResult(`✓ ${res.sent} notificações enviadas!`);
        showToast(`${res.sent} notificações enviadas!`, "success");

      } else {
        const res = await api.post<{ sent: number }>("/notifications/send-all", { type, message });
        setResult(`✓ Notificação enviada a ${res.sent} utilizadores activos!`);
        showToast(`Enviado a ${res.sent} utilizadores!`, "success");
      }

      setMessage(""); setUserId(""); setUserIds("");
    } catch (e: any) { showToast(e.message ?? "Erro ao enviar", "error"); }
    finally { setSaving(false); }
  }

  const MODE_BTN = (m: SendMode, label: string): React.CSSProperties => ({
    flex: 1, padding: "8px 0", border: "none", cursor: "pointer", fontSize: 13,
    fontWeight: mode === m ? 700 : 500, borderRadius: 8,
    background: mode === m ? "#f59e0b" : "transparent",
    color: mode === m ? "#fff" : "#64748b", transition: "all 0.15s",
  });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>

      {/* Form */}
      <div style={{ ...CARD, padding: 22 }}>
        <h3 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>📤 Enviar Notificação</h3>

        {/* Mode selector */}
        <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 10, padding: 4, marginBottom: 18 }}>
          <button style={MODE_BTN("single", "Individual")} onClick={() => setMode("single")}>👤 Individual</button>
          <button style={MODE_BTN("bulk",   "Em Massa")}   onClick={() => setMode("bulk")}>👥 Em Massa</button>
          <button style={MODE_BTN("all",    "Todos")}      onClick={() => setMode("all")}>📢 Todos</button>
        </div>

        <form onSubmit={send} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mode === "single" && (
            <div>
              <span style={LBL}>ID do Utilizador *</span>
              <input value={userId} onChange={e => setUserId(e.target.value)} style={INP} type="number" placeholder="ex: 42" required />
            </div>
          )}

          {mode === "bulk" && (
            <div>
              <span style={LBL}>IDs dos Utilizadores (um por linha ou vírgula)</span>
              <textarea value={userIds} onChange={e => setUserIds(e.target.value)} style={{ ...INP, height: 80, resize: "vertical", fontFamily: "monospace" }} placeholder={"1\n2\n3\nou: 1, 2, 3"} required />
            </div>
          )}

          {mode === "all" && (
            <div style={{ padding: "10px 14px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 9 }}>
              <p style={{ margin: 0, fontSize: 13, color: "#92400e", fontWeight: 600 }}>
                ⚠️ Esta acção envia a notificação a <strong>todos os utilizadores activos</strong>.
              </p>
            </div>
          )}

          <div>
            <span style={LBL}>Tipo *</span>
            <select value={type} onChange={e => setType(e.target.value)} style={INP}>
              {Object.entries(TYPE_CFG).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {v.label}</option>
              ))}
              <option value="SYSTEM">⚙️ Sistema</option>
            </select>
          </div>

          <div>
            <span style={LBL}>Mensagem *</span>
            <textarea value={message} onChange={e => setMessage(e.target.value)} style={{ ...INP, height: 90, resize: "vertical", lineHeight: 1.55 }} placeholder="Escreve a mensagem a enviar..." required />
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "#94a3b8" }}>{message.length} caracteres</p>
          </div>

          {result && (
            <div style={{ padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 9, fontSize: 13, color: "#16a34a", fontWeight: 600 }}>
              {result}
            </div>
          )}

          <button type="submit" disabled={saving || !message.trim()} style={{ padding: "10px", borderRadius: 10, background: saving || !message.trim() ? "#fcd34d" : "#f59e0b", border: "none", cursor: saving || !message.trim() ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {saving && <div style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "ntf-spin 0.7s linear infinite" }} />}
            {saving ? "A enviar..." : mode === "all" ? "📢 Enviar a Todos" : mode === "bulk" ? "👥 Enviar em Massa" : "📤 Enviar"}
          </button>
        </form>
      </div>

      {/* Quick templates */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ ...CARD, padding: 18 }}>
          <h4 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: "#1e293b" }}>⚡ Templates Rápidos</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { icon: "🎓", label: "Novo curso disponível", type: "ENROLLMENT",  msg: "Existe um novo curso disponível na plataforma Innova. Acede já e inscreve-te!" },
              { icon: "⏰", label: "Lembrete de avaliação",  type: "EVALUATION",  msg: "Tens uma avaliação pendente. Acede à plataforma e completa-a antes do prazo." },
              { icon: "💰", label: "Recibo disponível",       type: "PAYSLIP",     msg: "O teu recibo de vencimento já está disponível. Consulta na área pessoal." },
              { icon: "🏖️", label: "Pedido aprovado",         type: "LEAVE_UPDATE", msg: "O teu pedido de licença foi aprovado. Boas férias!" },
              { icon: "📅", label: "Manutenção programada",   type: "SYSTEM",      msg: "A plataforma estará em manutenção hoje das 22h às 23h. Pedimos desculpa pelo inconveniente." },
            ].map(t => (
              <button key={t.label} onClick={() => { setType(t.type); setMessage(t.msg); }}
                style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderRadius: 9, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#fde68a"; e.currentTarget.style.background = "#fffbeb"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#fff"; }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{t.icon}</span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: "#1e293b" }}>{t.label}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.msg}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        {message && (
          <div style={{ ...CARD, padding: 18 }}>
            <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.7 }}>Pré-visualização</p>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: getTypeCfg(type).bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                {getTypeCfg(type).icon}
              </div>
              <div>
                <div style={{ marginBottom: 4 }}><TypeBadge type={type} /></div>
                <p style={{ margin: 0, fontSize: 13.5, color: "#1e293b", lineHeight: 1.55 }}>{message}</p>
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "#94a3b8" }}>agora mesmo</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Automation Rules ─────────────────────────────────────────────────────────

function AutomationPanel({ showToast }: { showToast: (m: string, t: "success" | "error" | "info") => void }) {
  const [rules, setRules]       = useState<AutomationRule[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ name: "", trigger: "", action: "", condition: "" });
  const [saving, setSaving]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<AutomationRule[]>("/notifications/automation-rules");
      setRules(Array.isArray(res) ? res : []);
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);

  async function toggle(id: number) {
    try {
      const updated = await api.patch<AutomationRule>(`/notifications/automation-rules/${id}/toggle`, {});
      setRules(prev => prev.map(r => r.id === id ? updated : r));
      showToast("Regra actualizada!", "success");
    } catch (e: any) { showToast(e.message, "error"); }
  }

  async function createRule(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await api.post<AutomationRule>("/notifications/automation-rules", form);
      setRules(prev => [created, ...prev]);
      setForm({ name: "", trigger: "", action: "", condition: "" });
      setShowForm(false);
      showToast("Regra criada!", "success");
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setSaving(false); }
  }

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b" }}>⚙️ Regras de Automação</p>
          <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "#64748b" }}>Notificações automáticas baseadas em eventos da plataforma</p>
        </div>
        <button onClick={() => setShowForm(s => !s)} style={{ padding: "8px 18px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          {showForm ? "Cancelar" : "+ Nova Regra"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div style={{ ...CARD, padding: 20 }}>
          <h4 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Criar Regra de Automação</h4>
          <form onSubmit={createRule} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <span style={LBL}>Nome da Regra *</span>
                <input value={form.name} onChange={e => set("name", e.target.value)} style={INP} placeholder="ex: Notificar novo colaborador" required />
              </div>
              <div>
                <span style={LBL}>Gatilho (Trigger) *</span>
                <select value={form.trigger} onChange={e => set("trigger", e.target.value)} style={INP} required>
                  <option value="">Seleccionar gatilho...</option>
                  {TRIGGER_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <span style={LBL}>Acção *</span>
                <input value={form.action} onChange={e => set("action", e.target.value)} style={INP} placeholder="ex: SEND_NOTIFICATION" required />
              </div>
              <div>
                <span style={LBL}>Condição</span>
                <input value={form.condition} onChange={e => set("condition", e.target.value)} style={INP} placeholder='ex: role === "ADMIN"' />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: "8px 18px", borderRadius: 9, border: "1px solid #e2e8f0", background: "transparent", cursor: "pointer", fontSize: 13, color: "#64748b", fontFamily: "inherit" }}>Cancelar</button>
              <button type="submit" disabled={saving} style={{ padding: "8px 18px", borderRadius: 9, background: "#f59e0b", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "inherit", opacity: saving ? 0.7 : 1 }}>
                {saving ? "A criar..." : "Criar Regra"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rules list */}
      {loading ? <Spinner /> : rules.length === 0 ? (
        <div style={{ ...CARD, padding: "48px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 32, margin: "0 0 10px" }}>⚙️</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", margin: "0 0 6px" }}>Sem regras de automação</p>
          <p style={{ fontSize: 13, color: "#94a3b8" }}>Cria regras para enviar notificações automáticas.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rules.map(rule => (
            <div key={rule.id} style={{ ...CARD, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, opacity: rule.active ? 1 : 0.6 }}>
              {/* Status dot */}
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: rule.active ? "#16a34a" : "#94a3b8", flexShrink: 0 }} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{rule.name}</p>
                  <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10.5, fontWeight: 700, background: rule.active ? "#f0fdf4" : "#f1f5f9", color: rule.active ? "#16a34a" : "#94a3b8" }}>
                    {rule.active ? "Activa" : "Inactiva"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11.5, color: "#64748b", background: "#eff6ff", padding: "1px 7px", borderRadius: 6, fontWeight: 600 }}>
                    ⚡ {rule.trigger}
                  </span>
                  <span style={{ fontSize: 11.5, color: "#64748b", background: "#f5f3ff", padding: "1px 7px", borderRadius: 6, fontWeight: 600 }}>
                    ▶ {rule.action}
                  </span>
                  {rule.condition && (
                    <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace", background: "#f8fafc", padding: "1px 7px", borderRadius: 6 }}>
                      if: {rule.condition}
                    </span>
                  )}
                </div>
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "#94a3b8" }}>Criada em {fmtDate(rule.createdAt)}</p>
              </div>

              {/* Toggle */}
              <button
                onClick={() => toggle(rule.id)}
                style={{ padding: "7px 16px", borderRadius: 9, border: `1px solid ${rule.active ? "#fecaca" : "#bbf7d0"}`, background: rule.active ? "#fef2f2" : "#f0fdf4", color: rule.active ? "#dc2626" : "#16a34a", fontSize: 12.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                {rule.active ? "⏸ Desactivar" : "▶ Activar"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type MainTab = "my" | "all" | "send" | "automation" | "stats";

export default function NotificacoesPage() {
  const { showToast, toastNode } = useToast();

  const [tab, setTab]           = useState<MainTab>("my");
  const [stats, setStats]       = useState<NotificationStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Load stats when needed
  useEffect(() => {
    if (tab === "stats" && !stats) {
      setLoadingStats(true);
      api.get<NotificationStats>("/notifications/stats")
        .then(setStats)
        .catch(e => showToast(e.message, "error"))
        .finally(() => setLoadingStats(false));
    }
  }, [tab]);

  const tabBtn = (active: boolean, danger = false): React.CSSProperties => ({
    padding: "8px 18px", border: "none", cursor: "pointer", fontSize: 13,
    fontWeight: active ? 700 : 500, borderRadius: 9,
    background: active ? (danger ? "#f59e0b" : "#f59e0b") : "transparent",
    color: active ? "#fff" : "#64748b", transition: "all 0.15s",
  });

  const TABS: { key: MainTab; label: string }[] = [
    { key: "my",         label: "🔔 As Minhas"    },
    { key: "all",        label: "📋 Todos os Logs" },
    { key: "send",       label: "📤 Enviar"        },
    { key: "automation", label: "⚙️ Automações"   },
    { key: "stats",      label: "📊 Estatísticas"  },
  ];

  return (
    <>
      <style>{`
        @keyframes ntf-spin { to { transform: rotate(360deg); } }
        @keyframes ntf-up   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
        @keyframes ntf-in   { from{opacity:0;transform:translateX(18px)} to{opacity:1;transform:none} }
      `}</style>

      <div>
        {/* ── Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#1e293b" }}>🔔 Notificações</h1>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: "#64748b" }}>
              Centro de notificações, envio e automações da plataforma Innova
            </p>
          </div>
          {/* Quick send button */}
          <button onClick={() => setTab("send")} style={{ padding: "9px 20px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            📤 Enviar Notificação
          </button>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 11, padding: 4, marginBottom: 24, width: "fit-content", flexWrap: "wrap" }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={tabBtn(tab === t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════
            CONTENT
        ══════════════════════════════════════ */}
        {tab === "my"         && <MyNotifications showToast={showToast} />}
        {tab === "all"        && <AllLogs showToast={showToast} />}
        {tab === "send"       && <SendPanel showToast={showToast} />}
        {tab === "automation" && <AutomationPanel showToast={showToast} />}
        {tab === "stats"      && (
          loadingStats ? <Spinner /> :
          !stats ? null :
          <StatsSection stats={stats} />
        )}
      </div>

      {toastNode}
    </>
  );
}
