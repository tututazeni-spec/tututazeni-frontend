"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type LeaveType   = "FERIAS" | "DOENCA" | "MATERNIDADE" | "PATERNIDADE" | "LUTO" | "CASAMENTO" | "OUTRO";
type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

interface Department { id: number; name: string; }
interface LeaveUser  { id: number; fullName: string; email?: string; department?: Department; }

interface LeaveRequest {
  id: number;
  userId: number;
  type: LeaveType;
  startDate: string;
  endDate: string;
  workDays?: number;
  reason?: string;
  documentUrl?: string;
  status: LeaveStatus;
  approverNote?: string;
  approvedAt?: string;
  createdAt: string;
  user: LeaveUser;
  approver?: { id: number; fullName: string };
}

interface PaginatedLeave {
  data: LeaveRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface LeaveBalance {
  id: number;
  userId: number;
  vacationDays: number;
  sickDays: number;
  otherDays: number;
}

interface CalendarEntry {
  id: number;
  userId: number;
  type: LeaveType;
  startDate: string;
  endDate: string;
  workDays?: number;
  user: { id: number; fullName: string };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_CFG: Record<LeaveType, { label: string; color: string; bg: string; icon: string }> = {
  FERIAS:      { label: "Férias",      color: "#0891b2", bg: "#ecfeff", icon: "🏖️" },
  DOENCA:      { label: "Doença",      color: "#dc2626", bg: "#fef2f2", icon: "🏥" },
  MATERNIDADE: { label: "Maternidade", color: "#db2777", bg: "#fdf2f8", icon: "👶" },
  PATERNIDADE: { label: "Paternidade", color: "#7c3aed", bg: "#f5f3ff", icon: "👨👶" },
  LUTO:        { label: "Luto",        color: "#475569", bg: "#f1f5f9", icon: "🕊️" },
  CASAMENTO:   { label: "Casamento",   color: "#d97706", bg: "#fffbeb", icon: "💍" },
  OUTRO:       { label: "Outro",       color: "#64748b", bg: "#f8fafc", icon: "📋" },
};

const STATUS_CFG: Record<LeaveStatus, { label: string; color: string; bg: string; icon: string }> = {
  PENDING:   { label: "Pendente",  color: "#d97706", bg: "#fffbeb", icon: "⏳" },
  APPROVED:  { label: "Aprovado",  color: "#16a34a", bg: "#f0fdf4", icon: "✓"  },
  REJECTED:  { label: "Rejeitado", color: "#dc2626", bg: "#fef2f2", icon: "✗"  },
  CANCELLED: { label: "Cancelado", color: "#94a3b8", bg: "#f8fafc", icon: "○"  },
};

const CALENDAR_COLORS: Record<LeaveType, string> = {
  FERIAS: "#0891b2", DOENCA: "#dc2626", MATERNIDADE: "#db2777",
  PATERNIDADE: "#7c3aed", LUTO: "#475569", CASAMENTO: "#d97706", OUTRO: "#64748b",
};

// ─── Utilities ────────────────────────────────────────────────────────────────

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });

const fmtDateShort = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}

function daysBetween(start: string, end: string) {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.ceil(diff / 86400000) + 1);
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function Avatar({ name, size = 34 }: { name: string; size?: number }) {
  const p = ["#0891b2", "#7c3aed", "#16a34a", "#d97706", "#dc2626", "#db2777"];
  const c = p[name.charCodeAt(0) % p.length];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, background: c + "18", border: `2px solid ${c}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.34, fontWeight: 700, color: c }}>
      {getInitials(name)}
    </div>
  );
}

function TypeBadge({ type }: { type: LeaveType }) {
  const s = TYPE_CFG[type] ?? { label: type, color: "#64748b", bg: "#f1f5f9", icon: "•" };
  return (
    <span style={{ padding: "2px 9px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, whiteSpace: "nowrap" }}>
      {s.icon} {s.label}
    </span>
  );
}

function StatusBadge({ status }: { status: LeaveStatus }) {
  const s = STATUS_CFG[status] ?? { label: status, color: "#64748b", bg: "#f8fafc", icon: "•" };
  return (
    <span style={{ padding: "2px 9px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, whiteSpace: "nowrap" }}>
      {s.icon} {s.label}
    </span>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "52px 0" }}>
      <div style={{ width: 28, height: 28, border: "3px solid #e2e8f0", borderTopColor: "#0891b2", borderRadius: "50%", animation: "lv-spin 0.7s linear infinite" }} />
      <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>A carregar...</p>
    </div>
  );
}

function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error" | "info"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3800); return () => clearTimeout(t); }, []);
  const c = { success: { bg: "#f0fdf4", bd: "#bbf7d0", cl: "#16a34a", ic: "✓" }, error: { bg: "#fef2f2", bd: "#fecaca", cl: "#dc2626", ic: "✗" }, info: { bg: "#eff6ff", bd: "#bfdbfe", cl: "#2563eb", ic: "ℹ" } }[type];
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: c.bg, border: `1px solid ${c.bd}`, borderRadius: 12, padding: "12px 18px", maxWidth: 340, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", gap: 10, animation: "lv-in 0.2s ease" }}>
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

// ─── Balance Card ─────────────────────────────────────────────────────────────

function BalanceCard({ balance, compact = false }: { balance: LeaveBalance; compact?: boolean }) {
  const items = [
    { label: "Férias",  value: balance.vacationDays, icon: "🏖️", color: "#0891b2", bg: "#ecfeff", max: 22 },
    { label: "Doença",  value: balance.sickDays,     icon: "🏥", color: "#dc2626", bg: "#fef2f2", max: 15 },
    { label: "Outros",  value: balance.otherDays,    icon: "📋", color: "#7c3aed", bg: "#f5f3ff", max: 5  },
  ];

  if (compact) {
    return (
      <div style={{ display: "flex", gap: 10 }}>
        {items.map(s => (
          <div key={s.label} style={{ flex: 1, background: s.bg, borderRadius: 10, padding: "10px 12px", textAlign: "center", border: `1px solid ${s.color}22` }}>
            <p style={{ margin: 0, fontSize: 18 }}>{s.icon}</p>
            <p style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</p>
            <p style={{ margin: 0, fontSize: 10, color: "#64748b" }}>{s.label}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
      {items.map(s => {
        const pct = Math.min((s.value / s.max) * 100, 100);
        return (
          <div key={s.label} style={{ ...CARD, padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{s.icon}</div>
              <div>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.7 }}>{s.label}</p>
                <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value} <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 400 }}>dias</span></p>
              </div>
            </div>
            <div style={{ height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: s.color, borderRadius: 3, transition: "width 0.5s" }} />
            </div>
            <p style={{ margin: "3px 0 0", fontSize: 10.5, color: "#94a3b8" }}>{s.value} de {s.max} disponíveis</p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Modal: Submeter Pedido ───────────────────────────────────────────────────

function ModalPedido({ onClose, onCreated, currentUserId }: {
  onClose: () => void;
  onCreated: () => void;
  currentUserId?: number;
}) {
  const [form, setForm] = useState({
    userId:      currentUserId?.toString() ?? "",
    type:        "FERIAS" as LeaveType,
    startDate:   "",
    endDate:     "",
    reason:      "",
    documentUrl: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState("");
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const preview = form.startDate && form.endDate ? daysBetween(form.startDate, form.endDate) : 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.userId || !form.startDate || !form.endDate) { setErr("Preenche todos os campos obrigatórios."); return; }
    if (new Date(form.endDate) < new Date(form.startDate)) { setErr("A data de fim não pode ser anterior ao início."); return; }
    setSaving(true); setErr("");
    try {
      // POST /leave
      await api.post("/leave", {
        userId:      +form.userId,
        type:        form.type,
        startDate:   form.startDate,
        endDate:     form.endDate,
        reason:      form.reason      || undefined,
        documentUrl: form.documentUrl || undefined,
      });
      onCreated();
      onClose();
    } catch (e: any) { setErr(e.message ?? "Erro ao submeter pedido"); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 28, width: "100%", maxWidth: 500, boxShadow: "0 24px 60px rgba(0,0,0,0.2)", animation: "lv-up 0.2s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1e293b" }}>📋 Novo Pedido de Licença</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {!currentUserId && (
            <div>
              <span style={LBL}>ID do Colaborador *</span>
              <input value={form.userId} onChange={e => set("userId", e.target.value)} style={INP} type="number" placeholder="ex: 42" required />
            </div>
          )}

          <div>
            <span style={LBL}>Tipo de Licença *</span>
            <select value={form.type} onChange={e => set("type", e.target.value)} style={INP}>
              {(Object.entries(TYPE_CFG) as [LeaveType, any][]).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {v.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <span style={LBL}>Data de Início *</span>
              <input value={form.startDate} onChange={e => set("startDate", e.target.value)} style={INP} type="date" required />
            </div>
            <div>
              <span style={LBL}>Data de Fim *</span>
              <input value={form.endDate} onChange={e => set("endDate", e.target.value)} style={INP} type="date" required />
            </div>
          </div>

          {preview > 0 && (
            <div style={{ padding: "10px 14px", background: "#ecfeff", border: "1px solid #a5f3fc", borderRadius: 9, fontSize: 13, color: "#0891b2", fontWeight: 600 }}>
              📅 Duração estimada: <strong>{preview} dias</strong> (dias corridos)
            </div>
          )}

          <div>
            <span style={LBL}>Motivo</span>
            <textarea value={form.reason} onChange={e => set("reason", e.target.value)} style={{ ...INP, height: 70, resize: "vertical", lineHeight: 1.55 }} placeholder="Descreve o motivo do pedido..." />
          </div>

          <div>
            <span style={LBL}>URL do Documento</span>
            <input value={form.documentUrl} onChange={e => set("documentUrl", e.target.value)} style={INP} placeholder="https://..." />
          </div>

          {err && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626" }}>{err}</div>}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ padding: "9px 20px", borderRadius: 10, background: "transparent", border: "1px solid #e2e8f0", cursor: "pointer", fontSize: 13, color: "#64748b", fontFamily: "inherit" }}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ padding: "9px 22px", borderRadius: 10, background: saving ? "#67e8f9" : "#0891b2", border: "none", cursor: saving ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 }}>
              {saving && <div style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "lv-spin 0.7s linear infinite" }} />}
              {saving ? "A submeter..." : "Submeter Pedido"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal: Aprovar / Rejeitar ────────────────────────────────────────────────

function ModalAprovar({ request, onClose, onDone, showToast }: {
  request: LeaveRequest;
  onClose: () => void;
  onDone: () => void;
  showToast: (m: string, t: "success" | "error" | "info") => void;
}) {
  const [status, setStatus]   = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [note, setNote]       = useState("");
  const [saving, setSaving]   = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      // PATCH /leave/:id/approve
      await api.patch(`/leave/${request.id}/approve`, { status, approverNote: note || undefined });
      showToast(status === "APPROVED" ? "Pedido aprovado!" : "Pedido rejeitado.", status === "APPROVED" ? "success" : "info");
      onDone();
      onClose();
    } catch (e: any) { showToast(e.message ?? "Erro", "error"); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 28, width: "100%", maxWidth: 440, boxShadow: "0 24px 60px rgba(0,0,0,0.2)", animation: "lv-up 0.2s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1e293b" }}>⚖️ Decisão sobre Pedido</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
        </div>

        {/* Request summary */}
        <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: 10, marginBottom: 18, display: "flex", gap: 12, alignItems: "center" }}>
          <Avatar name={request.user.fullName} size={38} />
          <div>
            <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: "#1e293b" }}>{request.user.fullName}</p>
            <div style={{ display: "flex", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
              <TypeBadge type={request.type} />
              <span style={{ fontSize: 12, color: "#64748b" }}>{fmtDate(request.startDate)} → {fmtDate(request.endDate)}</span>
              {request.workDays && <span style={{ fontSize: 12, color: "#0891b2", fontWeight: 600 }}>{request.workDays} dias úteis</span>}
            </div>
            {request.reason && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>"{request.reason}"</p>}
          </div>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Decision toggle */}
          <div>
            <span style={LBL}>Decisão *</span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {(["APPROVED", "REJECTED"] as const).map(s => (
                <button key={s} type="button" onClick={() => setStatus(s)}
                  style={{ padding: "10px", borderRadius: 10, border: `2px solid ${status === s ? (s === "APPROVED" ? "#16a34a" : "#dc2626") : "#e2e8f0"}`, background: status === s ? (s === "APPROVED" ? "#f0fdf4" : "#fef2f2") : "#fff", cursor: "pointer", fontSize: 13, fontWeight: status === s ? 700 : 500, color: status === s ? (s === "APPROVED" ? "#16a34a" : "#dc2626") : "#64748b", transition: "all 0.15s" }}>
                  {s === "APPROVED" ? "✓ Aprovar" : "✗ Rejeitar"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span style={LBL}>Nota do Aprovador</span>
            <textarea value={note} onChange={e => setNote(e.target.value)} style={{ ...INP, height: 72, resize: "vertical", lineHeight: 1.55 }} placeholder="Observações adicionais (opcional)..." />
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={{ padding: "9px 20px", borderRadius: 10, background: "transparent", border: "1px solid #e2e8f0", cursor: "pointer", fontSize: 13, color: "#64748b", fontFamily: "inherit" }}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ padding: "9px 22px", borderRadius: 10, background: status === "APPROVED" ? "#16a34a" : "#dc2626", border: "none", cursor: saving ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "inherit", opacity: saving ? 0.7 : 1 }}>
              {saving ? "A guardar..." : status === "APPROVED" ? "Confirmar Aprovação" : "Confirmar Rejeição"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal: Saldo do Colaborador ──────────────────────────────────────────────

function ModalSaldo({ onClose, onSaved, showToast }: {
  onClose: () => void;
  onSaved: () => void;
  showToast: (m: string, t: "success" | "error" | "info") => void;
}) {
  const [userId, setUserId]           = useState("");
  const [balance, setBalance]         = useState<LeaveBalance | null>(null);
  const [loadingBal, setLoadingBal]   = useState(false);
  const [form, setForm]               = useState({ vacationDays: "", sickDays: "", otherDays: "" });
  const [saving, setSaving]           = useState(false);

  async function fetchBalance() {
    if (!userId) return;
    setLoadingBal(true);
    try {
      // GET /leave/balance/:userId
      const b = await api.get<LeaveBalance>(`/leave/balance/${userId}`);
      setBalance(b);
      setForm({ vacationDays: b.vacationDays.toString(), sickDays: b.sickDays.toString(), otherDays: b.otherDays.toString() });
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setLoadingBal(false); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      // PUT /leave/balance/:userId
      await api.put(`/leave/balance/${userId}`, {
        vacationDays: +form.vacationDays,
        sickDays:     +form.sickDays,
        otherDays:    +form.otherDays,
      });
      showToast("Saldo actualizado!", "success");
      onSaved();
      onClose();
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 28, width: "100%", maxWidth: 440, boxShadow: "0 24px 60px rgba(0,0,0,0.2)", animation: "lv-up 0.2s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1e293b" }}>🗂️ Gerir Saldo de Licenças</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <input value={userId} onChange={e => setUserId(e.target.value)} style={{ ...INP, flex: 1 }} type="number" placeholder="ID do colaborador..." />
          <button onClick={fetchBalance} disabled={!userId || loadingBal}
            style={{ padding: "9px 16px", borderRadius: 10, background: "#0891b2", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit", opacity: !userId ? 0.5 : 1 }}>
            {loadingBal ? "..." : "Carregar"}
          </button>
        </div>

        {balance && (
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ padding: "10px 14px", background: "#f0fdf4", borderRadius: 9, fontSize: 12.5, color: "#16a34a", fontWeight: 500, marginBottom: 4 }}>
              ✓ Saldo carregado para o utilizador #{userId}
            </div>
            {[
              { key: "vacationDays", label: "Dias de Férias", icon: "🏖️" },
              { key: "sickDays",     label: "Dias de Doença",  icon: "🏥" },
              { key: "otherDays",    label: "Outros Dias",     icon: "📋" },
            ].map(f => (
              <div key={f.key}>
                <span style={LBL}>{f.icon} {f.label}</span>
                <input value={(form as any)[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} style={INP} type="number" min={0} max={365} />
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
              <button type="button" onClick={onClose} style={{ padding: "9px 20px", borderRadius: 10, background: "transparent", border: "1px solid #e2e8f0", cursor: "pointer", fontSize: 13, color: "#64748b", fontFamily: "inherit" }}>Cancelar</button>
              <button type="submit" disabled={saving} style={{ padding: "9px 22px", borderRadius: 10, background: "#0891b2", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "inherit", opacity: saving ? 0.7 : 1 }}>
                {saving ? "A guardar..." : "Actualizar Saldo"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Modal: Detalhe do Pedido ─────────────────────────────────────────────────

function ModalDetalhe({ request, onClose, onApprove, onCancel, showToast }: {
  request: LeaveRequest;
  onClose: () => void;
  onApprove: () => void;
  onCancel: () => void;
  showToast: (m: string, t: "success" | "error" | "info") => void;
}) {
  const [full, setFull]     = useState<LeaveRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<LeaveRequest>(`/leave/${request.id}`)
      .then(setFull)
      .catch(() => setFull(request))
      .finally(() => setLoading(false));
  }, [request.id]);

  const r = full ?? request;

  async function handleCancel() {
    if (!confirm("Cancelar este pedido?")) return;
    try {
      // PATCH /leave/:id/cancel
      await api.patch(`/leave/${r.id}/cancel`, {});
      showToast("Pedido cancelado.", "info");
      onCancel();
      onClose();
    } catch (e: any) { showToast(e.message, "error"); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.2)", animation: "lv-up 0.2s ease" }}>

        {/* Header */}
        <div style={{ padding: "22px 26px 16px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
                <TypeBadge type={r.type} />
                <StatusBadge status={r.status} />
              </div>
              <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>Pedido #{r.id} · submetido em {fmtDate(r.createdAt)}</p>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
          </div>
        </div>

        {loading ? <Spinner /> : (
          <div style={{ padding: "18px 26px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
            {/* User */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar name={r.user.fullName} size={44} />
              <div>
                <p style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: "#1e293b" }}>{r.user.fullName}</p>
                {r.user.email && <p style={{ margin: "1px 0 0", fontSize: 12, color: "#94a3b8" }}>{r.user.email}</p>}
                {r.user.department && <p style={{ margin: "1px 0 0", fontSize: 12, color: "#64748b" }}>🏢 {r.user.department.name}</p>}
              </div>
            </div>

            {/* Dates */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {[
                { label: "Início",      value: fmtDate(r.startDate), icon: "📅" },
                { label: "Fim",         value: fmtDate(r.endDate),   icon: "📅" },
                { label: "Dias Úteis",  value: r.workDays ?? "—",    icon: "⏳" },
              ].map(s => (
                <div key={s.label} style={{ background: "#f8fafc", borderRadius: 9, padding: "10px 12px", textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 16 }}>{s.icon}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{s.value}</p>
                  <p style={{ margin: 0, fontSize: 10, color: "#64748b" }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Reason */}
            {r.reason && (
              <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: 9, borderLeft: "3px solid #0891b2" }}>
                <p style={{ margin: "0 0 3px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.7 }}>Motivo</p>
                <p style={{ margin: 0, fontSize: 13.5, color: "#1e293b", lineHeight: 1.55 }}>{r.reason}</p>
              </div>
            )}

            {/* Document */}
            {r.documentUrl && (
              <a href={r.documentUrl} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, color: "#2563eb", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                📄 Ver Documento Anexo
              </a>
            )}

            {/* Approver note */}
            {r.approverNote && (
              <div style={{ padding: "10px 14px", background: r.status === "APPROVED" ? "#f0fdf4" : "#fef2f2", borderRadius: 9, borderLeft: `3px solid ${r.status === "APPROVED" ? "#16a34a" : "#dc2626"}` }}>
                <p style={{ margin: "0 0 3px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.7 }}>Nota do Aprovador</p>
                <p style={{ margin: 0, fontSize: 13, color: "#1e293b" }}>{r.approverNote}</p>
                {r.approver && <p style={{ margin: "4px 0 0", fontSize: 11, color: "#94a3b8" }}>— {r.approver.fullName}{r.approvedAt ? ` · ${fmtDate(r.approvedAt)}` : ""}</p>}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, paddingTop: 4, borderTop: "1px solid #f1f5f9" }}>
              {r.status === "PENDING" && (
                <>
                  <button onClick={onApprove} style={{ flex: 1, padding: "9px", borderRadius: 9, border: "none", background: "#16a34a", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    ⚖️ Aprovar / Rejeitar
                  </button>
                  <button onClick={handleCancel} style={{ padding: "9px 14px", borderRadius: 9, border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    Cancelar Pedido
                  </button>
                </>
              )}
              {r.status === "APPROVED" && (
                <button onClick={handleCancel} style={{ padding: "9px 14px", borderRadius: 9, border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Cancelar (devolver dias)
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Calendar View ────────────────────────────────────────────────────────────

function CalendarView() {
  const [entries, setEntries]   = useState<CalendarEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [year, setYear]         = useState(new Date().getFullYear());
  const [month, setMonth]       = useState(new Date().getMonth()); // 0-indexed
  const [deptId, setDeptId]     = useState("");

  const loadCalendar = useCallback(async () => {
    setLoading(true);
    try {
      // GET /leave/calendar?year=&departmentId=
      const q = new URLSearchParams({ year: String(year) });
      if (deptId) q.set("departmentId", deptId);
      const res = await api.get<CalendarEntry[]>(`/leave/calendar?${q}`);
      setEntries(Array.isArray(res) ? res : []);
    } catch { setEntries([]); }
    finally { setLoading(false); }
  }, [year, deptId]);

  useEffect(() => { loadCalendar(); }, [loadCalendar]);

  const MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const DAYS   = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

  // Build calendar grid for current month
  const firstDay   = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Entries in this month
  const monthEntries = entries.filter(e => {
    const s = new Date(e.startDate);
    const en = new Date(e.endDate);
    const mStart = new Date(year, month, 1);
    const mEnd   = new Date(year, month + 1, 0);
    return s <= mEnd && en >= mStart;
  });

  function getEntriesForDay(day: number): CalendarEntry[] {
    const date = new Date(year, month, day);
    return monthEntries.filter(e => {
      const s = new Date(e.startDate);
      const en = new Date(e.endDate);
      s.setHours(0,0,0,0); en.setHours(23,59,59,999);
      return date >= s && date <= en;
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f1f5f9", borderRadius: 10, padding: "6px 10px" }}>
          <button onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#64748b", padding: "2px 6px" }}>←</button>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", minWidth: 130, textAlign: "center" }}>
            {MONTHS[month]} {year}
          </span>
          <button onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#64748b", padding: "2px 6px" }}>→</button>
        </div>
        <input value={deptId} onChange={e => setDeptId(e.target.value)} placeholder="ID Departamento (opcional)" type="number"
          style={{ ...INP, maxWidth: 220 }} />
        <button onClick={() => setDeptId("")} style={{ padding: "9px 14px", borderRadius: 9, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 12.5, color: "#64748b" }}>Todos</button>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {(Object.entries(TYPE_CFG) as [LeaveType, any][]).map(([k, v]) => (
          <span key={k} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#64748b" }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: CALENDAR_COLORS[k], display: "inline-block" }} />
            {v.label}
          </span>
        ))}
      </div>

      {/* Grid */}
      {loading ? <Spinner /> : (
        <div style={{ ...CARD, overflow: "hidden" }}>
          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid #e2e8f0" }}>
            {DAYS.map(d => (
              <div key={d} style={{ padding: "8px 6px", textAlign: "center", fontSize: 11, fontWeight: 700, color: d === "Dom" || d === "Sáb" ? "#94a3b8" : "#64748b", background: "#f8fafc" }}>{d}</div>
            ))}
          </div>
          {/* Day cells */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} style={{ borderRight: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9", minHeight: 72, background: "#fafafa" }} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const dayEntries = getEntriesForDay(day);
              const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
              const isWeekend = [0, 6].includes(new Date(year, month, day).getDay());
              return (
                <div key={day} style={{ borderRight: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9", minHeight: 72, padding: "6px", background: isToday ? "#eff6ff" : isWeekend ? "#fafafa" : "#fff", position: "relative" }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: isToday ? 800 : 500, color: isToday ? "#2563eb" : isWeekend ? "#94a3b8" : "#475569", width: isToday ? 22 : "auto", height: isToday ? 22 : "auto", borderRadius: "50%", background: isToday ? "#2563eb" : "transparent", color: isToday ? "#fff" : undefined, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {day}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 3 }}>
                    {dayEntries.slice(0, 2).map((e, i) => (
                      <div key={i} style={{ padding: "1px 5px", borderRadius: 4, fontSize: 9.5, fontWeight: 600, background: CALENDAR_COLORS[e.type] + "22", color: CALENDAR_COLORS[e.type], borderLeft: `2px solid ${CALENDAR_COLORS[e.type]}`, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {e.user.fullName.split(" ")[0]}
                      </div>
                    ))}
                    {dayEntries.length > 2 && (
                      <span style={{ fontSize: 9.5, color: "#94a3b8" }}>+{dayEntries.length - 2} mais</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Entries list for month */}
      {monthEntries.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.7 }}>
            Ausências em {MONTHS[month]} {year} ({monthEntries.length})
          </p>
          {monthEntries.map(e => (
            <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#fff", border: "1px solid #e2e8f0", borderLeft: `4px solid ${CALENDAR_COLORS[e.type]}`, borderRadius: 9 }}>
              <Avatar name={e.user.fullName} size={32} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{e.user.fullName}</p>
                <p style={{ margin: 0, fontSize: 11.5, color: "#64748b" }}>{fmtDateShort(e.startDate)} → {fmtDateShort(e.endDate)}{e.workDays ? ` · ${e.workDays} dias úteis` : ""}</p>
              </div>
              <TypeBadge type={e.type} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Leave Request Row ────────────────────────────────────────────────────────

function LeaveRow({ request, onView, showApprove }: {
  request: LeaveRequest;
  onView: () => void;
  showApprove: boolean;
}) {
  return (
    <tr style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer" }}
      onMouseEnter={e => (e.currentTarget.style.background = "#fafafa")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
      onClick={onView}>
      <td style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar name={request.user.fullName} size={32} />
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{request.user.fullName}</p>
            {request.user.department && <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{request.user.department.name}</p>}
          </div>
        </div>
      </td>
      <td style={{ padding: "12px 16px" }}><TypeBadge type={request.type} /></td>
      <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#64748b", whiteSpace: "nowrap" }}>
        {fmtDate(request.startDate)} → {fmtDate(request.endDate)}
      </td>
      <td style={{ padding: "12px 16px" }}>
        {request.workDays && <span style={{ fontSize: 12, fontWeight: 700, color: "#0891b2" }}>{request.workDays}d</span>}
      </td>
      <td style={{ padding: "12px 16px" }}><StatusBadge status={request.status} /></td>
      <td style={{ padding: "12px 16px", fontSize: 11.5, color: "#94a3b8" }}>{fmtDate(request.createdAt)}</td>
      <td style={{ padding: "12px 16px" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={onView} style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid #e2e8f0", background: "#fff", fontSize: 11.5, fontWeight: 600, cursor: "pointer", color: "#475569" }}>
            Ver
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type MainTab = "my" | "all" | "calendar";

export default function LeaveManagementPage() {
  const { showToast, toastNode } = useToast();

  const [mainTab, setMainTab]   = useState<MainTab>("my");

  // My data
  const [myRequests, setMyRequests]   = useState<LeaveRequest[]>([]);
  const [myBalance, setMyBalance]     = useState<LeaveBalance | null>(null);
  const [loadingMy, setLoadingMy]     = useState(true);

  // All data (admin)
  const [allRequests, setAllRequests]   = useState<LeaveRequest[]>([]);
  const [allTotal, setAllTotal]         = useState(0);
  const [allPage, setAllPage]           = useState(1);
  const [allTotalPages, setAllTotalPages] = useState(1);
  const [loadingAll, setLoadingAll]     = useState(false);
  const [filterType, setFilterType]     = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFrom, setFilterFrom]     = useState("");
  const [filterTo, setFilterTo]         = useState("");

  // Modals
  const [showPedido, setShowPedido]   = useState(false);
  const [showSaldo, setShowSaldo]     = useState(false);
  const [viewRequest, setViewRequest] = useState<LeaveRequest | null>(null);
  const [approveReq, setApproveReq]   = useState<LeaveRequest | null>(null);

  // ── Load my data ────────────────────────────────────────────────────────────

  const loadMy = useCallback(async () => {
    setLoadingMy(true);
    try {
      const [reqs, bal] = await Promise.all([
        api.get<any>("/leave/my-requests"),          // GET /leave/my-requests
        api.get<LeaveBalance>("/leave/balance/me"),  // GET /leave/balance/me
      ]);
      setMyRequests(reqs?.data ?? (Array.isArray(reqs) ? reqs : []));
      setMyBalance(bal);
    } catch (e: any) { showToast(e.message ?? "Erro ao carregar", "error"); }
    finally { setLoadingMy(false); }
  }, []);

  // ── Load all (admin) ────────────────────────────────────────────────────────

  const loadAll = useCallback(async (p = 1) => {
    setLoadingAll(true);
    try {
      const q = new URLSearchParams({ page: String(p), limit: "20" });
      if (filterType)   q.set("type", filterType);
      if (filterStatus) q.set("status", filterStatus);
      if (filterFrom)   q.set("from", filterFrom);
      if (filterTo)     q.set("to", filterTo);
      // GET /leave
      const res = await api.get<any>(`/leave?${q}`);
      setAllRequests(res?.data ?? []);
      setAllTotal(res?.total ?? 0);
      setAllTotalPages(res?.totalPages ?? 1);
      setAllPage(p);
    } catch (e: any) { showToast(e.message ?? "Erro", "error"); }
    finally { setLoadingAll(false); }
  }, [filterType, filterStatus, filterFrom, filterTo]);

  useEffect(() => { if (mainTab === "my") loadMy(); }, [mainTab]);
  useEffect(() => { if (mainTab === "all") loadAll(1); }, [mainTab, filterType, filterStatus, filterFrom, filterTo]);

  // ── Derived stats ────────────────────────────────────────────────────────────

  const myPending  = myRequests.filter(r => r.status === "PENDING").length;
  const myApproved = myRequests.filter(r => r.status === "APPROVED").length;

  const adminPending  = allRequests.filter(r => r.status === "PENDING").length;
  const adminApproved = allRequests.filter(r => r.status === "APPROVED").length;

  const mainTabBtn = (active: boolean): React.CSSProperties => ({
    padding: "9px 22px", border: "none", cursor: "pointer", fontSize: 13,
    fontWeight: active ? 700 : 500, borderRadius: 9,
    background: active ? "#0891b2" : "transparent",
    color: active ? "#fff" : "#64748b", transition: "all 0.15s",
  });

  const TABLE_HEADERS = ["Colaborador", "Tipo", "Período", "Dias", "Estado", "Submetido", ""];

  return (
    <>
      <style>{`
        @keyframes lv-spin { to { transform: rotate(360deg); } }
        @keyframes lv-up   { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:none; } }
        @keyframes lv-in   { from { opacity:0; transform:translateX(18px); } to { opacity:1; transform:none; } }
      `}</style>

      <div>
        {/* ── Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#1e293b" }}>🏖️ Férias & Licenças</h1>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: "#64748b" }}>Gestão de pedidos de férias, doença e outros tipos de licença</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => setShowSaldo(true)} style={{ padding: "9px 18px", background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              🗂️ Gerir Saldos
            </button>
            <button onClick={() => setShowPedido(true)} style={{ padding: "9px 18px", background: "#0891b2", color: "#fff", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              + Novo Pedido
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 11, padding: 4, marginBottom: 24, width: "fit-content" }}>
          <button onClick={() => setMainTab("my")}       style={mainTabBtn(mainTab === "my")}>🙋 Os Meus Pedidos</button>
          <button onClick={() => setMainTab("all")}      style={mainTabBtn(mainTab === "all")}>📋 Todos os Pedidos</button>
          <button onClick={() => setMainTab("calendar")} style={mainTabBtn(mainTab === "calendar")}>📅 Calendário</button>
        </div>

        {/* ═════════════════════════════════════
            TAB: OS MEUS PEDIDOS
        ═════════════════════════════════════ */}
        {mainTab === "my" && (
          <>
            {loadingMy ? <Spinner /> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Balance */}
                {myBalance && (
                  <div>
                    <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.7 }}>
                      💼 O Meu Saldo de Dias
                    </p>
                    <BalanceCard balance={myBalance} />
                  </div>
                )}

                {/* Quick stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
                  {[
                    { label: "Total Pedidos",  value: myRequests.length, color: "#0891b2", bg: "#ecfeff", icon: "📋" },
                    { label: "Pendentes",      value: myPending,         color: "#d97706", bg: "#fffbeb", icon: "⏳" },
                    { label: "Aprovados",      value: myApproved,        color: "#16a34a", bg: "#f0fdf4", icon: "✓"  },
                  ].map(s => (
                    <div key={s.label} style={{ ...CARD, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{s.icon}</div>
                      <div>
                        <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.7 }}>{s.label}</p>
                        <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* My requests list */}
                {myRequests.length === 0 ? (
                  <div style={{ ...CARD, padding: "52px 24px", textAlign: "center" }}>
                    <p style={{ fontSize: 34, marginBottom: 12 }}>🏖️</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", margin: "0 0 6px" }}>Sem pedidos de licença</p>
                    <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 18px" }}>Ainda não submeteste nenhum pedido.</p>
                    <button onClick={() => setShowPedido(true)} style={{ padding: "9px 22px", background: "#0891b2", color: "#fff", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                      + Submeter Pedido
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {myRequests.map(r => (
                      <div key={r.id} onClick={() => setViewRequest(r)} style={{ ...CARD, padding: "14px 18px", cursor: "pointer", borderLeft: `4px solid ${STATUS_CFG[r.status].color}`, transition: "all 0.15s" }}
                        onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)")}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                          <div style={{ flex: 1, minWidth: 160 }}>
                            <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
                              <TypeBadge type={r.type} />
                              <StatusBadge status={r.status} />
                            </div>
                            <p style={{ margin: 0, fontSize: 12.5, color: "#64748b" }}>
                              {fmtDate(r.startDate)} → {fmtDate(r.endDate)}
                              {r.workDays ? <span style={{ marginLeft: 8, color: "#0891b2", fontWeight: 700 }}>{r.workDays} dias úteis</span> : null}
                            </p>
                            {r.reason && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>"{r.reason}"</p>}
                          </div>
                          {r.approver && (
                            <div style={{ textAlign: "right" }}>
                              <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>Aprovado por</p>
                              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#475569" }}>{r.approver.fullName}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ═════════════════════════════════════
            TAB: TODOS OS PEDIDOS (ADMIN)
        ═════════════════════════════════════ */}
        {mainTab === "all" && (
          <>
            {/* Admin stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Total",        value: allTotal,      color: "#0891b2", bg: "#ecfeff", icon: "📋" },
                { label: "Pendentes",    value: adminPending,  color: "#d97706", bg: "#fffbeb", icon: "⏳" },
                { label: "Aprovados",    value: adminApproved, color: "#16a34a", bg: "#f0fdf4", icon: "✓"  },
              ].map(s => (
                <div key={s.label} style={{ ...CARD, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{s.icon}</div>
                  <div>
                    <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.7 }}>{s.label}</p>
                    <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
              <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ ...INP, maxWidth: 170 }}>
                <option value="">Todos os tipos</option>
                {(Object.entries(TYPE_CFG) as [LeaveType, any][]).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...INP, maxWidth: 170 }}>
                <option value="">Todos os estados</option>
                {(Object.entries(STATUS_CFG) as [LeaveStatus, any][]).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, color: "#64748b" }}>De</span>
                <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} style={{ ...INP, width: 150 }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, color: "#64748b" }}>Até</span>
                <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} style={{ ...INP, width: 150 }} />
              </div>
              {(filterType || filterStatus || filterFrom || filterTo) && (
                <button onClick={() => { setFilterType(""); setFilterStatus(""); setFilterFrom(""); setFilterTo(""); }}
                  style={{ padding: "9px 14px", borderRadius: 9, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 12.5, color: "#64748b" }}>
                  ✕ Limpar
                </button>
              )}
            </div>

            {/* Table */}
            {loadingAll ? <Spinner /> : (
              <div style={{ ...CARD, overflow: "hidden" }}>
                {allRequests.length === 0
                  ? <div style={{ padding: "52px 24px", textAlign: "center", color: "#94a3b8" }}>
                      <p style={{ fontSize: 30, margin: "0 0 10px" }}>📋</p>
                      <p style={{ fontSize: 14 }}>Nenhum pedido encontrado.</p>
                    </div>
                  : (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                            {TABLE_HEADERS.map(h => (
                              <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, whiteSpace: "nowrap" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {allRequests.map(r => (
                            <LeaveRow
                              key={r.id}
                              request={r}
                              onView={() => setViewRequest(r)}
                              showApprove={r.status === "PENDING"}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                {/* Pagination */}
                {allTotalPages > 1 && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderTop: "1px solid #f1f5f9" }}>
                    <span style={{ fontSize: 12.5, color: "#64748b" }}>Página {allPage} de {allTotalPages} · {allTotal} pedidos</span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => loadAll(allPage - 1)} disabled={allPage === 1} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: allPage === 1 ? "not-allowed" : "pointer", fontSize: 12.5, color: "#475569", opacity: allPage === 1 ? 0.4 : 1 }}>← Anterior</button>
                      <button onClick={() => loadAll(allPage + 1)} disabled={allPage === allTotalPages} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: allPage === allTotalPages ? "not-allowed" : "pointer", fontSize: 12.5, color: "#475569", opacity: allPage === allTotalPages ? 0.4 : 1 }}>Seguinte →</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ═════════════════════════════════════
            TAB: CALENDÁRIO
        ═════════════════════════════════════ */}
        {mainTab === "calendar" && <CalendarView />}
      </div>

      {/* ── Modals ── */}
      {showPedido && (
        <ModalPedido
          onClose={() => setShowPedido(false)}
          onCreated={() => {
            showToast("Pedido submetido com sucesso!", "success");
            mainTab === "my" ? loadMy() : loadAll(1);
          }}
        />
      )}

      {showSaldo && (
        <ModalSaldo
          onClose={() => setShowSaldo(false)}
          onSaved={() => { if (mainTab === "my") loadMy(); }}
          showToast={showToast}
        />
      )}

      {viewRequest && (
        <ModalDetalhe
          request={viewRequest}
          onClose={() => setViewRequest(null)}
          onApprove={() => { setApproveReq(viewRequest); setViewRequest(null); }}
          onCancel={() => { mainTab === "my" ? loadMy() : loadAll(allPage); }}
          showToast={showToast}
        />
      )}

      {approveReq && (
        <ModalAprovar
          request={approveReq}
          onClose={() => setApproveReq(null)}
          onDone={() => { loadAll(allPage); setApproveReq(null); }}
          showToast={showToast}
        />
      )}

      {toastNode}
    </>
  );
}
