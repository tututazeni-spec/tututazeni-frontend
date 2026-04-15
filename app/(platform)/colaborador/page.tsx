"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | "REMOTE" | "JUSTIFIED";

interface Employee {
  id: number;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
  _count?: { contracts: number; evaluations: number };
  contracts?: Contract[];
  feedbacks?: Feedback360[];
  careerPlans?: CareerPlan[];
  attendances?: AttendanceRecord[];
}

interface Contract {
  id: number;
  employeeId: number;
  startDate: string;
  endDate: string;
  status: string;
}

interface Feedback360 {
  id: number;
  evaluatorName: string;
  evaluatorRole: string;
  score: number;
  comments: string;
  evaluatedAt: string;
}

interface CareerPlan {
  id: number;
  employeeId: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
}

interface AttendanceRecord {
  id: number;
  employeeId: number;
  date: string;
  clockIn?: string;
  clockOut?: string;
  hoursWorked?: number;
  workMinutes?: number;
  status: AttendanceStatus;
  notes?: string;
  justification?: string;
}

interface Stats {
  totalContracts: number;
  avgFeedbackScore: number;
  totalFeedbacks: number;
  activeCareerPlans: number;
  totalHoursWorked: number;
  avgDailyHours: number;
}

interface MonthlyReport {
  period: string;
  summary: {
    userId: number;
    present: number;
    absent: number;
    late: number;
    justified: number;
    totalWorkMin: number;
  }[];
}

interface ClockStatus {
  hasClockIn: boolean;
  hasClockOut: boolean;
  clockIn?: string;
  clockOut?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<AttendanceStatus, { label: string; bg: string; color: string; icon: string }> = {
  PRESENT:   { label: "Presente",    bg: "#ecfdf5", color: "#16a34a", icon: "✓"  },
  ABSENT:    { label: "Ausente",     bg: "#fef2f2", color: "#dc2626", icon: "✗"  },
  LATE:      { label: "Atrasado",    bg: "#fff7ed", color: "#ea580c", icon: "⏰" },
  HALF_DAY:  { label: "Meio-dia",    bg: "#fffbeb", color: "#d97706", icon: "◑"  },
  REMOTE:    { label: "Remoto",      bg: "#eff6ff", color: "#1e40af", icon: "🏠" },
  JUSTIFIED: { label: "Justificado", bg: "#f5f3ff", color: "#8b5cf6", icon: "📋" },
};

const CONTRACT_STATUS: Record<string, { color: string; bg: string }> = {
  active:   { color: "#16a34a", bg: "#ecfdf5" },
  inactive: { color: "#94a3b8", bg: "#f8fafc" },
  expired:  { color: "#dc2626", bg: "#fef2f2" },
  pending:  { color: "#f59e0b", bg: "#fffbeb" },
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: "#fff",
  borderRadius: 12,
  border: "1px solid #e2e8f0",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1.5px solid #e2e8f0",
  borderRadius: 8,
  fontSize: 14,
  color: "#1e293b",
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 1,
  textTransform: "uppercase",
  color: "#64748b",
  marginBottom: 6,
};

const btnPrimary: React.CSSProperties = {
  padding: "10px 20px",
  background: "#1e40af",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const btnGhost: React.CSSProperties = {
  padding: "10px 20px",
  background: "#f1f5f9",
  color: "#475569",
  border: "none",
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const btnDanger: React.CSSProperties = {
  padding: "6px 12px",
  background: "#fef2f2",
  color: "#dc2626",
  border: "1px solid #fecaca",
  borderRadius: 7,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMinutes(min: number) {
  if (!min) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h${m > 0 ? `${m}m` : ""}` : `${m}m`;
}

function StatusBadge({ status }: { status: AttendanceStatus }) {
  const s = STATUS_MAP[status] ?? { label: status, bg: "#f1f5f9", color: "#64748b", icon: "?" };
  return (
    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, whiteSpace: "nowrap" }}>
      {s.icon} {s.label}
    </span>
  );
}

// ─── UI Primitives ────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <span style={labelStyle}>{label}</span>
      {children}
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
      {children}
    </div>
  );
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: wide ? 680 : 480, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }}>
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

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 999, background: type === "success" ? "#ecfdf5" : "#fef2f2", border: `1px solid ${type === "success" ? "#bbf7d0" : "#fecaca"}`, borderRadius: 12, padding: "14px 20px", maxWidth: 360, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 18 }}>{type === "success" ? "✅" : "❌"}</span>
      <p style={{ margin: 0, fontSize: 13, color: type === "success" ? "#16a34a" : "#dc2626", fontWeight: 600 }}>{msg}</p>
    </div>
  );
}

// ─── Clock Widget ─────────────────────────────────────────────────────────────

function ClockWidget({ onRefresh }: { onRefresh: () => void }) {
  const [status, setStatus] = useState<ClockStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [clocking, setClocking] = useState(false);
  const [notes, setNotes] = useState("");
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    api.get<any[]>("/attendance/my")
      .then(records => {
        const today = new Date().toDateString();
        const rec = (records ?? []).find(r => new Date(r.date).toDateString() === today);
        setStatus({ hasClockIn: !!rec?.clockIn, hasClockOut: !!rec?.clockOut, clockIn: rec?.clockIn, clockOut: rec?.clockOut });
      })
      .catch(() => setStatus({ hasClockIn: false, hasClockOut: false }))
      .finally(() => setLoading(false));
  }, []);

  async function doClockIn() {
    setClocking(true);
    try {
      await api.post("/attendance/clock-in", { notes: notes || undefined });
      setStatus(s => ({ ...s!, hasClockIn: true, clockIn: time.toTimeString().slice(0, 5) }));
      setNotes("");
      onRefresh();
    } catch (e: any) { alert(e.message); } finally { setClocking(false); }
  }

  async function doClockOut() {
    setClocking(true);
    try {
      await api.post("/attendance/clock-out", {});
      setStatus(s => ({ ...s!, hasClockOut: true, clockOut: time.toTimeString().slice(0, 5) }));
      onRefresh();
    } catch (e: any) { alert(e.message); } finally { setClocking(false); }
  }

  const hh = time.getHours().toString().padStart(2, "0");
  const mm = time.getMinutes().toString().padStart(2, "0");
  const ss = time.getSeconds().toString().padStart(2, "0");

  return (
    <div style={{ ...card, padding: 24, background: "linear-gradient(135deg, #0f172a, #1e3a5f)", border: "none", color: "#fff" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1.5 }}>
          {new Date().toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <p style={{ margin: "8px 0 0", fontSize: 48, fontWeight: 800, fontFamily: "monospace", letterSpacing: 2, color: "#f1f5f9" }}>
          {hh}:{mm}<span style={{ color: "#64748b", fontSize: 32 }}>:{ss}</span>
        </p>
      </div>

      {!loading && status && (
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 20 }}>
          {[
            { label: "Entrada", value: status.clockIn,  active: status.hasClockIn  },
            { label: "Saída",   value: status.clockOut, active: status.hasClockOut },
          ].map(item => (
            <div key={item.label} style={{ textAlign: "center", background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 20px" }}>
              <p style={{ margin: 0, fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>{item.label}</p>
              <p style={{ margin: "4px 0 0", fontSize: 18, fontWeight: 800, color: item.active ? "#22c55e" : "#94a3b8" }}>{item.value ?? "—"}</p>
            </div>
          ))}
        </div>
      )}

      {!loading && status && !status.hasClockIn && (
        <input
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Nota de entrada (opcional)..."
          style={{ ...inputStyle, marginBottom: 12, background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}
        />
      )}

      {!loading && status && (
        <div style={{ display: "flex", gap: 10 }}>
          {!status.hasClockIn ? (
            <button onClick={doClockIn} disabled={clocking} style={{ flex: 1, padding: "14px", background: "#22c55e", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: clocking ? "not-allowed" : "pointer", opacity: clocking ? 0.7 : 1 }}>
              {clocking ? "A registar..." : "▶ Clock-In (Entrada)"}
            </button>
          ) : !status.hasClockOut ? (
            <button onClick={doClockOut} disabled={clocking} style={{ flex: 1, padding: "14px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: clocking ? "not-allowed" : "pointer", opacity: clocking ? 0.7 : 1 }}>
              {clocking ? "A registar..." : "⏹ Clock-Out (Saída)"}
            </button>
          ) : (
            <div style={{ flex: 1, padding: "14px", background: "rgba(34,197,94,0.15)", borderRadius: 10, textAlign: "center", border: "1px solid rgba(34,197,94,0.3)" }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#22c55e" }}>✓ Dia completo registado</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Modal: Criar Colaborador ─────────────────────────────────────────────────

function CreateEmployeeModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", role: "", joinedAt: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    try { await api.post("/employees", form); onCreated(); onClose(); }
    catch (e: any) { setError(e.message ?? "Erro ao criar"); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ ...card, padding: 24, width: "100%", maxWidth: 460, boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1e293b" }}>👤 Novo Colaborador</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
        </div>
        <form onSubmit={submit}>
          <Field label="Nome *"><input style={inputStyle} value={form.name} onChange={e => set("name", e.target.value)} required /></Field>
          <Field label="Email *"><input style={inputStyle} type="email" value={form.email} onChange={e => set("email", e.target.value)} required /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Função *"><input style={inputStyle} value={form.role} onChange={e => set("role", e.target.value)} placeholder="Ex: Gestor" required /></Field>
            <Field label="Data de Entrada *"><input style={inputStyle} type="date" value={form.joinedAt} onChange={e => set("joinedAt", e.target.value)} required /></Field>
          </div>
          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
              <p style={{ margin: 0, fontSize: 13, color: "#dc2626" }}>{error}</p>
            </div>
          )}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={btnGhost}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>{saving ? "A criar..." : "Criar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal: Detalhe do Colaborador ────────────────────────────────────────────

function EmployeeDetailModal({ employee, onClose, onRefresh, showToast }: {
  employee: Employee;
  onClose: () => void;
  onRefresh: () => void;
  showToast: (m: string, t: "success" | "error") => void;
}) {
  const [detail, setDetail] = useState<Employee | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [feedback, setFeedback] = useState<{ feedbacks: Feedback360[]; averageScore: number } | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "contracts" | "attendance" | "feedback" | "career">("info");
  const [loading, setLoading] = useState(true);

  const [contractForm, setContractForm] = useState({ startDate: "", endDate: "", status: "active" });
  const [attendanceForm, setAttendanceForm] = useState({
    date: "", clockIn: "", clockOut: "", hoursWorked: "",
    status: "PRESENT" as AttendanceStatus, notes: "", justification: "",
  });
  const [feedbackForm, setFeedbackForm] = useState({ evaluatorName: "", evaluatorRole: "", score: "3", comments: "", evaluatedAt: "" });
  const [careerForm, setCareerForm] = useState({ title: "", description: "", startDate: "", endDate: "", status: "active" });
  const [saving, setSaving] = useState(false);

  async function reload() {
    return api.get<Employee>(`/employees/${employee.id}`);
  }

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get<Employee>(`/employees/${employee.id}`),
      api.get<Stats>(`/employees/${employee.id}/stats`),
      api.get<{ feedbacks: Feedback360[]; averageScore: number }>(`/employees/${employee.id}/feedback360`),
    ]).then(([d, s, f]) => { setDetail(d); setStats(s); setFeedback(f); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [employee.id]);

  async function addContract() {
    setSaving(true);
    try {
      await api.post("/employees/contracts", { employeeId: employee.id, ...contractForm });
      showToast("Contrato criado!", "success");
      setDetail(await reload());
    } catch (e: any) { showToast(e.message, "error"); } finally { setSaving(false); }
  }

  async function addAttendance() {
    setSaving(true);
    try {
      await api.post("/employees/attendance", {
        employeeId: employee.id,
        date: attendanceForm.date,
        clockIn: attendanceForm.clockIn || undefined,
        clockOut: attendanceForm.clockOut || undefined,
        hoursWorked: attendanceForm.hoursWorked ? +attendanceForm.hoursWorked : undefined,
        status: attendanceForm.status,
        notes: attendanceForm.notes || undefined,
        justification: attendanceForm.justification || undefined,
      });
      showToast("Presença registada!", "success");
      setDetail(await reload());
    } catch (e: any) { showToast(e.message, "error"); } finally { setSaving(false); }
  }

  async function addFeedback() {
    setSaving(true);
    try {
      await api.post("/employees/feedback360", { employeeId: employee.id, ...feedbackForm, score: +feedbackForm.score });
      showToast("Feedback adicionado!", "success");
      setFeedback(await api.get<any>(`/employees/${employee.id}/feedback360`));
    } catch (e: any) { showToast(e.message, "error"); } finally { setSaving(false); }
  }

  async function addCareerPlan() {
    setSaving(true);
    try {
      await api.post("/employees/career-plans", { employeeId: employee.id, ...careerForm });
      showToast("Plano de carreira criado!", "success");
      setDetail(await reload());
    } catch (e: any) { showToast(e.message, "error"); } finally { setSaving(false); }
  }

  async function updateContractStatus(id: number, status: string) {
    try {
      await api.patch(`/employees/contracts/${id}/status`, { status });
      showToast("Contrato actualizado!", "success");
      setDetail(await reload());
    } catch (e: any) { showToast(e.message, "error"); }
  }

  const e = detail ?? employee;
  const TABS = [
    { key: "info",       label: "ℹ️ Info"       },
    { key: "contracts",  label: "📄 Contratos"  },
    { key: "attendance", label: "🕐 Presenças"  },
    { key: "feedback",   label: "⭐ Feedback"   },
    { key: "career",     label: "🗺️ Carreira"  },
  ] as const;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ ...card, padding: 24, width: "100%", maxWidth: 680, maxHeight: "92vh", overflow: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }} onClick={ev => ev.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#1e40af,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 22, flexShrink: 0 }}>
            {e.name.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1e293b" }}>{e.name}</h2>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b" }}>{e.email} · <span style={{ fontWeight: 600 }}>{e.role}</span></p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>Desde {new Date(e.joinedAt).toLocaleDateString("pt-PT")}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
            {[
              { label: "Contratos",        value: stats.totalContracts,          icon: "📄", color: "#1e40af" },
              { label: "Média Feedback",   value: stats.avgFeedbackScore.toFixed(1), icon: "⭐", color: "#f59e0b" },
              { label: "Horas Trabalhadas",value: stats.totalHoursWorked.toFixed(0), icon: "⏱️", color: "#16a34a" },
            ].map(s => (
              <div key={s.label} style={{ padding: 12, background: "#f8fafc", borderRadius: 10, textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 20 }}>{s.icon}</p>
                <p style={{ margin: "4px 0 0", fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</p>
                <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 10, padding: 4, marginBottom: 20, flexWrap: "wrap" }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{ padding: "7px 14px", border: "none", cursor: "pointer", fontSize: 12, fontWeight: activeTab === t.key ? 700 : 500, borderRadius: 8, background: activeTab === t.key ? "#1e40af" : "transparent", color: activeTab === t.key ? "#fff" : "#64748b" }}>
              {t.label}
            </button>
          ))}
        </div>

        {loading
          ? <div style={{ textAlign: "center", padding: 30, color: "#94a3b8" }}>A carregar...</div>
          : (
            <>
              {/* ── INFO ── */}
              {activeTab === "info" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { label: "Nome completo",  value: e.name },
                    { label: "Email",          value: e.email },
                    { label: "Função",         value: e.role },
                    { label: "Data de entrada",value: new Date(e.joinedAt).toLocaleDateString("pt-PT") },
                    { label: "Contratos",      value: e._count?.contracts ?? detail?.contracts?.length ?? 0 },
                    { label: "Avaliações",     value: e._count?.evaluations ?? 0 },
                  ].map(f => (
                    <div key={f.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#f8fafc", borderRadius: 8 }}>
                      <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{f.label}</span>
                      <span style={{ fontSize: 13, color: "#1e293b", fontWeight: 500 }}>{f.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* ── CONTRATOS ── */}
              {activeTab === "contracts" && (
                <div>
                  <div style={{ ...card, padding: 16, marginBottom: 16, background: "#f8fafc" }}>
                    <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#1e293b" }}>+ Novo Contrato</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                      <div><span style={labelStyle}>Início</span><input style={inputStyle} type="date" value={contractForm.startDate} onChange={e => setContractForm(f => ({ ...f, startDate: e.target.value }))} /></div>
                      <div><span style={labelStyle}>Fim</span><input style={inputStyle} type="date" value={contractForm.endDate} onChange={e => setContractForm(f => ({ ...f, endDate: e.target.value }))} /></div>
                      <div>
                        <span style={labelStyle}>Estado</span>
                        <select style={inputStyle} value={contractForm.status} onChange={e => setContractForm(f => ({ ...f, status: e.target.value }))}>
                          {["active", "inactive", "expired", "pending"].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <button onClick={addContract} disabled={saving} style={{ ...btnPrimary, marginTop: 10, opacity: saving ? 0.7 : 1 }}>Adicionar Contrato</button>
                  </div>
                  {(detail?.contracts ?? []).length === 0
                    ? <p style={{ color: "#94a3b8", textAlign: "center", padding: 16 }}>Sem contratos.</p>
                    : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {(detail?.contracts ?? []).map(c => {
                          const st = CONTRACT_STATUS[c.status] ?? { color: "#64748b", bg: "#f8fafc" };
                          return (
                            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#f8fafc", borderRadius: 8 }}>
                              <div style={{ flex: 1 }}>
                                <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: st.bg, color: st.color }}>{c.status}</span>
                                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>{new Date(c.startDate).toLocaleDateString("pt-PT")} → {new Date(c.endDate).toLocaleDateString("pt-PT")}</p>
                              </div>
                              <select style={{ ...inputStyle, maxWidth: 120, padding: "4px 8px", fontSize: 11 }} value={c.status} onChange={ev => updateContractStatus(c.id, ev.target.value)}>
                                {["active", "inactive", "expired", "pending"].map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    )}
                </div>
              )}

              {/* ── PRESENÇAS ── */}
              {activeTab === "attendance" && (
                <div>
                  <div style={{ ...card, padding: 16, marginBottom: 16, background: "#f8fafc" }}>
                    <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#1e293b" }}>+ Registar Presença</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                      <div><span style={labelStyle}>Data</span><input style={inputStyle} type="date" value={attendanceForm.date} onChange={e => setAttendanceForm(f => ({ ...f, date: e.target.value }))} /></div>
                      <div><span style={labelStyle}>Entrada</span><input style={inputStyle} type="time" value={attendanceForm.clockIn} onChange={e => setAttendanceForm(f => ({ ...f, clockIn: e.target.value }))} /></div>
                      <div><span style={labelStyle}>Saída</span><input style={inputStyle} type="time" value={attendanceForm.clockOut} onChange={e => setAttendanceForm(f => ({ ...f, clockOut: e.target.value }))} /></div>
                      <div><span style={labelStyle}>Horas</span><input style={inputStyle} type="number" min={0} max={24} step={0.5} value={attendanceForm.hoursWorked} onChange={e => setAttendanceForm(f => ({ ...f, hoursWorked: e.target.value }))} /></div>
                      <div>
                        <span style={labelStyle}>Estado</span>
                        <select style={inputStyle} value={attendanceForm.status} onChange={e => setAttendanceForm(f => ({ ...f, status: e.target.value as AttendanceStatus }))}>
                          {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                      </div>
                      <div><span style={labelStyle}>Notas</span><input style={inputStyle} value={attendanceForm.notes} onChange={e => setAttendanceForm(f => ({ ...f, notes: e.target.value }))} /></div>
                    </div>
                    {(attendanceForm.status === "ABSENT" || attendanceForm.status === "JUSTIFIED") && (
                      <div style={{ marginBottom: 10 }}>
                        <span style={labelStyle}>Justificação</span>
                        <input style={inputStyle} value={attendanceForm.justification} onChange={e => setAttendanceForm(f => ({ ...f, justification: e.target.value }))} placeholder="Motivo da ausência..." />
                      </div>
                    )}
                    <button onClick={addAttendance} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>Registar</button>
                  </div>
                  {(detail?.attendances ?? []).length === 0
                    ? <p style={{ color: "#94a3b8", textAlign: "center", padding: 16 }}>Sem registos de presença.</p>
                    : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {(detail?.attendances ?? []).map((a, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#f8fafc", borderRadius: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", minWidth: 90 }}>{new Date(a.date).toLocaleDateString("pt-PT")}</span>
                            <StatusBadge status={a.status} />
                            {a.clockIn  && <span style={{ fontSize: 11, color: "#16a34a", fontFamily: "monospace" }}>▶ {a.clockIn}</span>}
                            {a.clockOut && <span style={{ fontSize: 11, color: "#dc2626", fontFamily: "monospace" }}>⏹ {a.clockOut}</span>}
                            <span style={{ fontSize: 12, color: "#64748b", marginLeft: "auto" }}>
                              ⏱️ {formatMinutes((a.workMinutes ?? 0) || (a.hoursWorked ?? 0) * 60)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              )}

              {/* ── FEEDBACK 360 ── */}
              {activeTab === "feedback" && (
                <div>
                  {feedback && (
                    <div style={{ padding: "12px 16px", background: "#fffbeb", borderRadius: 10, border: "1px solid #fde68a", marginBottom: 16 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#92400e" }}>
                        ⭐ Média: {feedback.averageScore.toFixed(1)} / 5 ({feedback.feedbacks.length} avaliações)
                      </p>
                    </div>
                  )}
                  <div style={{ ...card, padding: 16, marginBottom: 16, background: "#f8fafc" }}>
                    <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#1e293b" }}>+ Novo Feedback 360°</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                      <div><span style={labelStyle}>Avaliador</span><input style={inputStyle} value={feedbackForm.evaluatorName} onChange={e => setFeedbackForm(f => ({ ...f, evaluatorName: e.target.value }))} /></div>
                      <div><span style={labelStyle}>Função</span><input style={inputStyle} value={feedbackForm.evaluatorRole} onChange={e => setFeedbackForm(f => ({ ...f, evaluatorRole: e.target.value }))} /></div>
                      <div>
                        <span style={labelStyle}>Pontuação (1-5)</span>
                        <div style={{ display: "flex", gap: 6 }}>
                          {[1, 2, 3, 4, 5].map(n => (
                            <button key={n} type="button" onClick={() => setFeedbackForm(f => ({ ...f, score: String(n) }))} style={{ flex: 1, padding: "6px 0", border: `2px solid ${+feedbackForm.score === n ? "#f59e0b" : "#e2e8f0"}`, borderRadius: 7, background: +feedbackForm.score === n ? "#fffbeb" : "#fff", color: +feedbackForm.score === n ? "#f59e0b" : "#94a3b8", fontWeight: 700, cursor: "pointer" }}>
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div><span style={labelStyle}>Data</span><input style={inputStyle} type="date" value={feedbackForm.evaluatedAt} onChange={e => setFeedbackForm(f => ({ ...f, evaluatedAt: e.target.value }))} /></div>
                    </div>
                    <div style={{ marginBottom: 10 }}><span style={labelStyle}>Comentários</span><textarea style={{ ...inputStyle, height: 60, resize: "vertical" }} value={feedbackForm.comments} onChange={e => setFeedbackForm(f => ({ ...f, comments: e.target.value }))} /></div>
                    <button onClick={addFeedback} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>Adicionar Feedback</button>
                  </div>
                  {(feedback?.feedbacks ?? []).length === 0
                    ? <p style={{ color: "#94a3b8", textAlign: "center", padding: 16 }}>Sem feedbacks.</p>
                    : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {(feedback?.feedbacks ?? []).map((f, i) => (
                          <div key={i} style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: 10 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{f.evaluatorName} <span style={{ fontSize: 11, color: "#94a3b8" }}>({f.evaluatorRole})</span></span>
                              <span style={{ fontSize: 14, color: "#f59e0b", fontWeight: 800 }}>{"★".repeat(f.score)}{"☆".repeat(5 - f.score)}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: 12, color: "#64748b", fontStyle: "italic" }}>"{f.comments}"</p>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              )}

              {/* ── CARREIRA ── */}
              {activeTab === "career" && (
                <div>
                  <div style={{ ...card, padding: 16, marginBottom: 16, background: "#f8fafc" }}>
                    <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#1e293b" }}>+ Novo Plano de Carreira</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                      <div style={{ gridColumn: "1/-1" }}><span style={labelStyle}>Título</span><input style={inputStyle} value={careerForm.title} onChange={e => setCareerForm(f => ({ ...f, title: e.target.value }))} /></div>
                      <div style={{ gridColumn: "1/-1" }}><span style={labelStyle}>Descrição</span><textarea style={{ ...inputStyle, height: 60, resize: "vertical" }} value={careerForm.description} onChange={e => setCareerForm(f => ({ ...f, description: e.target.value }))} /></div>
                      <div><span style={labelStyle}>Início</span><input style={inputStyle} type="date" value={careerForm.startDate} onChange={e => setCareerForm(f => ({ ...f, startDate: e.target.value }))} /></div>
                      <div><span style={labelStyle}>Fim</span><input style={inputStyle} type="date" value={careerForm.endDate} onChange={e => setCareerForm(f => ({ ...f, endDate: e.target.value }))} /></div>
                    </div>
                    <button onClick={addCareerPlan} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>Criar Plano</button>
                  </div>
                  {(detail?.careerPlans ?? []).length === 0
                    ? <p style={{ color: "#94a3b8", textAlign: "center", padding: 16 }}>Sem planos de carreira.</p>
                    : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {(detail?.careerPlans ?? []).map((cp, i) => (
                          <div key={i} style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: 10, borderLeft: "4px solid #1e40af" }}>
                            <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{cp.title}</p>
                            <p style={{ margin: "0 0 6px", fontSize: 12, color: "#64748b" }}>{cp.description}</p>
                            <div style={{ display: "flex", gap: 8 }}>
                              <span style={{ fontSize: 11, color: "#94a3b8" }}>📅 {new Date(cp.startDate).toLocaleDateString("pt-PT")} → {new Date(cp.endDate).toLocaleDateString("pt-PT")}</span>
                              <span style={{ padding: "1px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: "#eff6ff", color: "#1e40af" }}>{cp.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              )}
            </>
          )}
      </div>
    </div>
  );
}

// ─── Modal: Registar Presença Manual ─────────────────────────────────────────

function ModalRegistar({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({ userId: "", date: new Date().toISOString().slice(0, 10), clockIn: "", clockOut: "", status: "PRESENT", justification: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.userId || !form.date) { setErr("ID do utilizador e data são obrigatórios."); return; }
    setSaving(true); setErr("");
    try {
      await api.post("/attendance", {
        userId: +form.userId,
        date: form.date,
        clockIn: form.clockIn || undefined,
        clockOut: form.clockOut || undefined,
        status: form.status || undefined,
        justification: form.justification || undefined,
        notes: form.notes || undefined,
      });
      onSave();
    } catch (e: any) { setErr(e.message ?? "Erro ao registar"); } finally { setSaving(false); }
  }

  return (
    <Overlay>
      <Modal title="Registar Presença Manual" onClose={onClose}>
        <form onSubmit={submit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="ID Utilizador"><input value={form.userId} onChange={e => set("userId", e.target.value)} style={inputStyle} placeholder="ex: 1" type="number" required /></Field>
            <Field label="Data"><input value={form.date} onChange={e => set("date", e.target.value)} style={inputStyle} type="date" required /></Field>
            <Field label="Hora Entrada"><input value={form.clockIn} onChange={e => set("clockIn", e.target.value)} style={inputStyle} type="time" /></Field>
            <Field label="Hora Saída"><input value={form.clockOut} onChange={e => set("clockOut", e.target.value)} style={inputStyle} type="time" /></Field>
          </div>
          <Field label="Estado">
            <select value={form.status} onChange={e => set("status", e.target.value)} style={inputStyle}>
              {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </Field>
          {(form.status === "ABSENT" || form.status === "JUSTIFIED") && (
            <Field label="Justificação"><input value={form.justification} onChange={e => set("justification", e.target.value)} style={inputStyle} placeholder="Motivo da ausência..." /></Field>
          )}
          <Field label="Notas"><input value={form.notes} onChange={e => set("notes", e.target.value)} style={inputStyle} placeholder="Observações adicionais..." /></Field>
          {err && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 12 }}>{err}</p>}
          <ModalFooter onClose={onClose} saving={saving} label="Registar" />
        </form>
      </Modal>
    </Overlay>
  );
}

// ─── Modal: Relatório Mensal ──────────────────────────────────────────────────

function ModalRelatorio({ onClose }: { onClose: () => void }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  async function load() {
    setLoading(true);
    try { setReport(await api.get<MonthlyReport>(`/attendance/report?year=${year}&month=${month}`)); }
    catch (e: any) { alert(e.message); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  return (
    <Overlay>
      <Modal title="Relatório Mensal de Presenças" onClose={onClose} wide>
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <span style={labelStyle}>Mês</span>
            <select value={month} onChange={e => setMonth(+e.target.value)} style={inputStyle}>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <span style={labelStyle}>Ano</span>
            <input value={year} onChange={e => setYear(+e.target.value)} style={inputStyle} type="number" min={2020} max={2030} />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button onClick={load} style={btnPrimary}>Gerar</button>
          </div>
        </div>

        {loading ? (
          <p style={{ color: "#94a3b8", textAlign: "center", padding: 32 }}>A gerar relatório...</p>
        ) : !report ? null : report.summary.length === 0 ? (
          <p style={{ color: "#94a3b8", textAlign: "center", padding: 32, fontSize: 13 }}>Sem dados para {MONTHS[month - 1]} {year}.</p>
        ) : (
          <div style={{ overflowX: "auto", maxHeight: 400, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead style={{ position: "sticky", top: 0, background: "#f8fafc", zIndex: 1 }}>
                <tr>
                  {["Utilizador", "Presentes", "Ausentes", "Atrasados", "Justificados", "Tempo Total"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.summary.map((s, i) => (
                  <tr key={i} style={{ borderTop: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "#1e293b" }}>Utilizador #{s.userId}</td>
                    <td style={{ padding: "10px 14px" }}><span style={{ color: "#16a34a", fontWeight: 700 }}>{s.present}</span></td>
                    <td style={{ padding: "10px 14px" }}><span style={{ color: "#dc2626", fontWeight: 700 }}>{s.absent}</span></td>
                    <td style={{ padding: "10px 14px" }}><span style={{ color: "#ea580c", fontWeight: 700 }}>{s.late}</span></td>
                    <td style={{ padding: "10px 14px" }}><span style={{ color: "#8b5cf6", fontWeight: 700 }}>{s.justified}</span></td>
                    <td style={{ padding: "10px 14px", color: "#1e40af", fontWeight: 600 }}>{formatMinutes(s.totalWorkMin)}</td>
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

// ─── Página Principal ─────────────────────────────────────────────────────────

type MainTab = "colaboradores" | "presencas";
type AttSubTab = "minhas" | "todas";

export default function ColaboradorPage() {
  const [mainTab, setMainTab] = useState<MainTab>("colaboradores");

  // ── Colaboradores ──
  const [employees, setEmployees]     = useState<Employee[]>([]);
  const [empTotal, setEmpTotal]       = useState(0);
  const [loadingEmp, setLoadingEmp]   = useState(true);
  const [search, setSearch]           = useState("");
  const [roleFilter, setRoleFilter]   = useState("");
  const [empPage, setEmpPage]         = useState(1);
  const [showCreate, setShowCreate]   = useState(false);
  const [selected, setSelected]       = useState<Employee | null>(null);

  // ── Presenças ──
  const [attTab, setAttTab]           = useState<AttSubTab>("minhas");
  const [myRecords, setMyRecords]     = useState<AttendanceRecord[]>([]);
  const [allRecords, setAllRecords]   = useState<AttendanceRecord[]>([]);
  const [attTotal, setAttTotal]       = useState(0);
  const [attPage, setAttPage]         = useState(1);
  const [loadingAtt, setLoadingAtt]   = useState(false);
  const [attError, setAttError]       = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFrom, setFilterFrom]   = useState("");
  const [filterTo, setFilterTo]       = useState("");
  const [modalRegistar, setModalRegistar]   = useState(false);
  const [modalRelatorio, setModalRelatorio] = useState(false);

  // ── Toast ──
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  function showToast(msg: string, type: "success" | "error") { setToast({ msg, type }); }

  const LIMIT = 20;

  // ── Fetch employees ──
  async function fetchEmployees() {
    setLoadingEmp(true);
    try {
      const p = new URLSearchParams({ page: String(empPage), limit: "20" });
      if (search)     p.set("search", search);
      if (roleFilter) p.set("role", roleFilter);
      const res = await api.get<any>(`/employees?${p}`);
      setEmployees(res.data ?? []);
      setEmpTotal(res.total ?? 0);
    } catch (e: any) { showToast(e.message, "error"); } finally { setLoadingEmp(false); }
  }

  useEffect(() => { fetchEmployees(); }, [search, roleFilter, empPage]);

  // ── Fetch attendance ──
  function loadMy() {
    setLoadingAtt(true); setAttError("");
    const p = new URLSearchParams();
    if (filterFrom) p.set("from", filterFrom);
    if (filterTo)   p.set("to", filterTo);
    api.get<AttendanceRecord[]>(`/attendance/my?${p}`)
      .then(res => setMyRecords(Array.isArray(res) ? res : []))
      .catch(e => setAttError(e.message))
      .finally(() => setLoadingAtt(false));
  }

  function loadAll(p = 1) {
    setLoadingAtt(true); setAttError("");
    const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
    if (filterStatus) params.set("status", filterStatus);
    if (filterFrom)   params.set("from", filterFrom);
    if (filterTo)     params.set("to", filterTo);
    api.get<any>(`/attendance?${params}`)
      .then(res => { setAllRecords(res?.data ?? []); setAttTotal(res?.total ?? 0); setAttPage(p); })
      .catch(e => setAttError(e.message))
      .finally(() => setLoadingAtt(false));
  }

  useEffect(() => {
    if (mainTab === "presencas") {
      attTab === "minhas" ? loadMy() : loadAll(1);
    }
  }, [mainTab, attTab, filterStatus, filterFrom, filterTo]);

  async function removeEmployee(id: number, name: string) {
    if (!confirm(`Remover "${name}"?`)) return;
    try { await api.delete(`/employees/${id}`); showToast("Colaborador removido!", "success"); fetchEmployees(); }
    catch (e: any) { showToast(e.message, "error"); }
  }

  // ── Attendance derived stats ──
  const attRecords    = attTab === "minhas" ? myRecords : allRecords;
  const attTotalPages = Math.ceil(attTotal / LIMIT);
  const myPresent     = myRecords.filter(r => r.status === "PRESENT" || r.status === "REMOTE").length;
  const myAbsent      = myRecords.filter(r => r.status === "ABSENT").length;
  const myLate        = myRecords.filter(r => r.status === "LATE").length;
  const myTotalMin    = myRecords.reduce((s, r) => s + (r.workMinutes ?? (r.hoursWorked ?? 0) * 60), 0);

  const mainTabBtn = (active: boolean): React.CSSProperties => ({
    padding: "9px 22px", border: "none", cursor: "pointer", fontSize: 14,
    fontWeight: active ? 700 : 500, borderRadius: 8,
    background: active ? "#1e40af" : "transparent",
    color: active ? "#fff" : "#64748b",
  });

  const subTabBtn = (active: boolean): React.CSSProperties => ({
    padding: "8px 20px", border: "none", cursor: "pointer", fontSize: 13,
    fontWeight: active ? 700 : 500, borderRadius: 8,
    background: active ? "#1e40af" : "transparent",
    color: active ? "#fff" : "#64748b",
  });

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", margin: 0 }}>
            {mainTab === "colaboradores" ? "👤 Colaboradores (HR)" : "🕐 Controlo de Presenças"}
          </h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
            {mainTab === "colaboradores"
              ? `Gestão de colaboradores, contratos, presenças e feedback — ${empTotal} no total`
              : "Gestão de entradas, saídas e presenças"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {mainTab === "colaboradores"
            ? <button onClick={() => setShowCreate(true)} style={btnPrimary}>+ Novo Colaborador</button>
            : <>
                <button onClick={() => setModalRelatorio(true)} style={btnGhost}>📊 Relatório Mensal</button>
                <button onClick={() => setModalRegistar(true)} style={btnPrimary}>+ Registar Manual</button>
              </>}
        </div>
      </div>

      {/* ── Main Tabs ── */}
      <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 10, padding: 4, marginBottom: 24, width: "fit-content" }}>
        <button onClick={() => setMainTab("colaboradores")} style={mainTabBtn(mainTab === "colaboradores")}>👤 Colaboradores</button>
        <button onClick={() => setMainTab("presencas")}     style={mainTabBtn(mainTab === "presencas")}>🕐 Presenças</button>
      </div>

      {/* ════════════════════════════════════════════════
          COLABORADORES
      ════════════════════════════════════════════════ */}
      {mainTab === "colaboradores" && (
        <>
          {/* Filtros */}
          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            <input style={{ ...inputStyle, maxWidth: 280 }} placeholder="🔍 Pesquisar nome ou email..." value={search} onChange={e => { setSearch(e.target.value); setEmpPage(1); }} />
            <input style={{ ...inputStyle, maxWidth: 180 }} placeholder="Filtrar por função..."        value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setEmpPage(1); }} />
          </div>

          {/* Tabela / Empty */}
          {loadingEmp
            ? <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>A carregar...</div>
            : employees.length === 0
              ? (
                <div style={{ ...card, padding: 60, textAlign: "center" }}>
                  <p style={{ fontSize: 32, marginBottom: 12 }}>👤</p>
                  <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 16px" }}>Nenhum colaborador encontrado.</p>
                  <button onClick={() => setShowCreate(true)} style={btnPrimary}>+ Criar Colaborador</button>
                </div>
              ) : (
                <div style={card}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                        {["Colaborador", "Função", "Entrada", "Contratos", "Avaliações", "Acções"].map(h => (
                          <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.8 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map(emp => (
                        <tr key={emp.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#1e40af,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                                {emp.name.charAt(0)}
                              </div>
                              <div>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{emp.name}</p>
                                <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{emp.email}</p>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: 12, fontSize: 13, color: "#64748b" }}>{emp.role}</td>
                          <td style={{ padding: 12, fontSize: 12, color: "#94a3b8" }}>{new Date(emp.joinedAt).toLocaleDateString("pt-PT")}</td>
                          <td style={{ padding: 12 }}><span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "#eff6ff", color: "#1e40af" }}>{emp._count?.contracts ?? 0}</span></td>
                          <td style={{ padding: 12 }}><span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "#f1f5f9", color: "#64748b" }}>{emp._count?.evaluations ?? 0}</span></td>
                          <td style={{ padding: 12 }}>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button onClick={() => setSelected(emp)} style={{ ...btnGhost, padding: "8px 14px", fontSize: 12 }}>Ver</button>
                              <button onClick={() => removeEmployee(emp.id, emp.name)} style={btnDanger}>🗑️</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Paginação */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderTop: "1px solid #f1f5f9" }}>
                    <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Página {empPage} — {employees.length} de {empTotal}</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setEmpPage(p => Math.max(1, p - 1))} disabled={empPage === 1} style={{ ...btnGhost, padding: "8px 16px", opacity: empPage === 1 ? 0.5 : 1 }}>← Anterior</button>
                      <button onClick={() => setEmpPage(p => p + 1)} disabled={employees.length < 20} style={{ ...btnGhost, padding: "8px 16px", opacity: employees.length < 20 ? 0.5 : 1 }}>Seguinte →</button>
                    </div>
                  </div>
                </div>
              )}
        </>
      )}

      {/* ════════════════════════════════════════════════
          PRESENÇAS
      ════════════════════════════════════════════════ */}
      {mainTab === "presencas" && (
        <>
          {/* Clock Widget */}
          <div style={{ marginBottom: 20 }}>
            <ClockWidget onRefresh={loadMy} />
          </div>

          {/* Sub-tabs */}
          <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 10, padding: 4, marginBottom: 20, width: "fit-content" }}>
            <button onClick={() => setAttTab("minhas")} style={subTabBtn(attTab === "minhas")}>👤 As Minhas Presenças</button>
            <button onClick={() => setAttTab("todas")}  style={subTabBtn(attTab === "todas")}>👥 Todas as Presenças</button>
          </div>

          {/* Stats (tab minhas) */}
          {attTab === "minhas" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Presenças",   value: myPresent,              color: "#16a34a", bg: "#f0fdf4" },
                { label: "Ausências",   value: myAbsent,               color: "#dc2626", bg: "#fef2f2" },
                { label: "Atrasos",     value: myLate,                 color: "#ea580c", bg: "#fff7ed" },
                { label: "Tempo Total", value: formatMinutes(myTotalMin), color: "#1e40af", bg: "#eff6ff" },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: "14px 18px", border: `1px solid ${s.color}22` }}>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: s.color, textTransform: "uppercase", letterSpacing: 0.8 }}>{s.label}</p>
                  <p style={{ margin: "4px 0 0", fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Filtros */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <span style={{ ...labelStyle, marginBottom: 4 }}>De</span>
              <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} style={{ ...inputStyle, width: 160 }} />
            </div>
            <div>
              <span style={{ ...labelStyle, marginBottom: 4 }}>Até</span>
              <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} style={{ ...inputStyle, width: 160 }} />
            </div>
            {attTab === "todas" && (
              <div>
                <span style={{ ...labelStyle, marginBottom: 4 }}>Estado</span>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: 160 }}>
                  <option value="">Todos</option>
                  {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            )}
            {(filterFrom || filterTo || filterStatus) && (
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <button onClick={() => { setFilterFrom(""); setFilterTo(""); setFilterStatus(""); }} style={{ ...btnGhost, padding: "10px 14px" }}>✕ Limpar</button>
              </div>
            )}
          </div>

          {/* Erro */}
          {attError && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: 14, color: "#dc2626", fontSize: 13, marginBottom: 16 }}>{attError}</div>
          )}

          {/* Tabela */}
          <div style={{ ...card, overflow: "hidden" }}>
            {loadingAtt
              ? <div style={{ padding: 60, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>A carregar registos...</div>
              : attRecords.length === 0
                ? (
                  <div style={{ padding: 60, textAlign: "center", color: "#94a3b8" }}>
                    <p style={{ fontSize: 32, margin: "0 0 8px" }}>📅</p>
                    <p style={{ fontSize: 14 }}>Nenhum registo de presença encontrado.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: "#f8fafc" }}>
                          {[
                            attTab === "todas" ? "Utilizador" : null,
                            "Data", "Estado", "Entrada", "Saída", "Tempo", "Notas",
                          ].filter(Boolean).map(h => (
                            <th key={h!} style={{ padding: "11px 16px", textAlign: "left", fontWeight: 700, color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6, whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {attRecords.map(r => (
                          <tr key={r.id} style={{ borderTop: "1px solid #f1f5f9" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "#fafafa")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                            {attTab === "todas" && (
                              <td style={{ padding: "12px 16px", fontWeight: 600, color: "#1e293b" }}>#{r.employeeId}</td>
                            )}
                            <td style={{ padding: "12px 16px", color: "#1e293b", whiteSpace: "nowrap" }}>
                              {new Date(r.date).toLocaleDateString("pt-PT", { weekday: "short", day: "2-digit", month: "short" })}
                            </td>
                            <td style={{ padding: "12px 16px" }}><StatusBadge status={r.status} /></td>
                            <td style={{ padding: "12px 16px", color: "#16a34a", fontWeight: 600, fontFamily: "monospace" }}>{r.clockIn  ?? "—"}</td>
                            <td style={{ padding: "12px 16px", color: "#dc2626", fontWeight: 600, fontFamily: "monospace" }}>{r.clockOut ?? "—"}</td>
                            <td style={{ padding: "12px 16px", color: "#1e40af", fontWeight: 600 }}>{formatMinutes(r.workMinutes ?? (r.hoursWorked ?? 0) * 60)}</td>
                            <td style={{ padding: "12px 16px", color: "#64748b", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {r.justification || r.notes || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
          </div>

          {/* Paginação (todas) */}
          {attTab === "todas" && attTotalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
              <span style={{ fontSize: 13, color: "#64748b" }}>{attTotal} registos no total</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => loadAll(attPage - 1)} disabled={attPage === 1} style={{ ...btnGhost, padding: "8px 16px", opacity: attPage === 1 ? 0.4 : 1 }}>← Anterior</button>
                <span style={{ padding: "8px 14px", fontSize: 13, color: "#64748b" }}>{attPage} / {attTotalPages}</span>
                <button onClick={() => loadAll(attPage + 1)} disabled={attPage === attTotalPages} style={{ ...btnGhost, padding: "8px 16px", opacity: attPage === attTotalPages ? 0.4 : 1 }}>Seguinte →</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Modais globais ── */}
      {showCreate && (
        <CreateEmployeeModal onClose={() => setShowCreate(false)} onCreated={() => { fetchEmployees(); showToast("Colaborador criado!", "success"); }} />
      )}
      {selected && (
        <EmployeeDetailModal employee={selected} onClose={() => setSelected(null)} onRefresh={fetchEmployees} showToast={showToast} />
      )}
      {modalRegistar && (
        <ModalRegistar onClose={() => setModalRegistar(false)} onSave={() => { setModalRegistar(false); attTab === "minhas" ? loadMy() : loadAll(1); }} />
      )}
      {modalRelatorio && (
        <ModalRelatorio onClose={() => setModalRelatorio(false)} />
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
