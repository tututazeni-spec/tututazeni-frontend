"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | "REMOTE" | "JUSTIFIED";

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

// ─── Helpers ─────────────────────────────────────────────────────────────────
const STATUS_MAP: Record<AttendanceStatus, { label: string; bg: string; color: string; icon: string }> = {
  PRESENT:   { label: "Presente",   bg: "#ecfdf5", color: "#16a34a", icon: "✓" },
  ABSENT:    { label: "Ausente",    bg: "#fef2f2", color: "#dc2626", icon: "✗" },
  LATE:      { label: "Atrasado",   bg: "#fff7ed", color: "#ea580c", icon: "⏰" },
  HALF_DAY:  { label: "Meio-dia",   bg: "#fffbeb", color: "#d97706", icon: "◑" },
  REMOTE:    { label: "Remoto",     bg: "#eff6ff", color: "#1e40af", icon: "🏠" },
  JUSTIFIED: { label: "Justificado", bg: "#f5f3ff", color: "#8b5cf6", icon: "📋" },
};

function StatusBadge({ status }: { status: AttendanceStatus }) {
  const s = STATUS_MAP[status] ?? { label: status, bg: "#f1f5f9", color: "#64748b", icon: "?" };
  return (
    <span style={{
      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: s.bg, color: s.color, whiteSpace: "nowrap",
    }}>
      {s.icon} {s.label}
    </span>
  );
}

function formatMinutes(min: number) {
  if (!min) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h${m > 0 ? `${m}m` : ""}` : `${m}m`;
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

// ─── Clock Widget ─────────────────────────────────────────────────────────────
function ClockWidget({ onRefresh }: { onRefresh: () => void }) {
  const [status, setStatus]     = useState<ClockStatus | null>(null);
  const [loading, setLoading]   = useState(true);
  const [clocking, setClocking] = useState(false);
  const [notes, setNotes]       = useState("");
  const [time, setTime]         = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    // GET /attendance/my — verificar se já fez clock-in hoje
    api.get<any[]>("/attendance/my")
      .then(records => {
        const today = new Date().toDateString();
        const todayRecord = (records ?? []).find(r =>
          new Date(r.date).toDateString() === today
        );
        setStatus({
          hasClockIn:  !!todayRecord?.clockIn,
          hasClockOut: !!todayRecord?.clockOut,
          clockIn:     todayRecord?.clockIn,
          clockOut:    todayRecord?.clockOut,
        });
      })
      .catch(() => setStatus({ hasClockIn: false, hasClockOut: false }))
      .finally(() => setLoading(false));
  }, []);

  async function doClockIn() {
    setClocking(true);
    try {
      // POST /attendance/clock-in — ClockInDto: { notes? }
      await api.post("/attendance/clock-in", { notes: notes || undefined });
      setStatus(s => ({ ...s!, hasClockIn: true, clockIn: time.toTimeString().slice(0, 5) }));
      setNotes("");
      onRefresh();
    } catch (e: any) { alert(e.message); }
    finally { setClocking(false); }
  }

  async function doClockOut() {
    setClocking(true);
    try {
      // POST /attendance/clock-out
      await api.post("/attendance/clock-out", {});
      setStatus(s => ({ ...s!, hasClockOut: true, clockOut: time.toTimeString().slice(0, 5) }));
      onRefresh();
    } catch (e: any) { alert(e.message); }
    finally { setClocking(false); }
  }

  const hh = time.getHours().toString().padStart(2, "0");
  const mm = time.getMinutes().toString().padStart(2, "0");
  const ss = time.getSeconds().toString().padStart(2, "0");

  return (
    <div style={{
      ...card, padding: 24,
      background: "linear-gradient(135deg, #0f172a, #1e3a5f)",
      border: "none", color: "#fff",
    }}>
      {/* Relógio */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1.5 }}>
          {new Date().toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <p style={{ margin: "8px 0 0", fontSize: 48, fontWeight: 800, fontFamily: "monospace", letterSpacing: 2, color: "#f1f5f9" }}>
          {hh}:{mm}<span style={{ color: "#64748b", fontSize: 32 }}>:{ss}</span>
        </p>
      </div>

      {/* Status do dia */}
      {!loading && status && (
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 20 }}>
          <div style={{
            textAlign: "center", background: "rgba(255,255,255,0.08)",
            borderRadius: 10, padding: "10px 20px",
          }}>
            <p style={{ margin: 0, fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>Entrada</p>
            <p style={{ margin: "4px 0 0", fontSize: 18, fontWeight: 800, color: status.hasClockIn ? "#22c55e" : "#94a3b8" }}>
              {status.clockIn ?? "—"}
            </p>
          </div>
          <div style={{
            textAlign: "center", background: "rgba(255,255,255,0.08)",
            borderRadius: 10, padding: "10px 20px",
          }}>
            <p style={{ margin: 0, fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>Saída</p>
            <p style={{ margin: "4px 0 0", fontSize: 18, fontWeight: 800, color: status.hasClockOut ? "#22c55e" : "#94a3b8" }}>
              {status.clockOut ?? "—"}
            </p>
          </div>
        </div>
      )}

      {/* Notas (só antes do clock-in) */}
      {!loading && status && !status.hasClockIn && (
        <input
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Nota de entrada (opcional)..."
          style={{
            ...inputStyle, marginBottom: 12,
            background: "rgba(255,255,255,0.1)", color: "#fff",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        />
      )}

      {/* Botões */}
      {!loading && status && (
        <div style={{ display: "flex", gap: 10 }}>
          {!status.hasClockIn ? (
            <button
              onClick={doClockIn}
              disabled={clocking}
              style={{
                flex: 1, padding: "14px", background: "#22c55e", color: "#fff",
                border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700,
                cursor: clocking ? "not-allowed" : "pointer", opacity: clocking ? 0.7 : 1,
              }}
            >
              {clocking ? "A registar..." : "▶ Clock-In (Entrada)"}
            </button>
          ) : !status.hasClockOut ? (
            <button
              onClick={doClockOut}
              disabled={clocking}
              style={{
                flex: 1, padding: "14px", background: "#ef4444", color: "#fff",
                border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700,
                cursor: clocking ? "not-allowed" : "pointer", opacity: clocking ? 0.7 : 1,
              }}
            >
              {clocking ? "A registar..." : "⏹ Clock-Out (Saída)"}
            </button>
          ) : (
            <div style={{
              flex: 1, padding: "14px", background: "rgba(34,197,94,0.15)",
              borderRadius: 10, textAlign: "center",
              border: "1px solid rgba(34,197,94,0.3)",
            }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#22c55e" }}>
                ✓ Dia completo registado
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Modal: Registar Presença Manual ─────────────────────────────────────────
function ModalRegistar({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    userId: "", date: new Date().toISOString().slice(0, 10),
    clockIn: "", clockOut: "", status: "PRESENT", justification: "", notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState("");

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.userId || !form.date) { setErr("ID do utilizador e data são obrigatórios."); return; }
    setSaving(true); setErr("");
    try {
      // POST /attendance — CreateAttendanceDto
      await api.post("/attendance", {
        userId:        +form.userId,
        date:          form.date,
        clockIn:       form.clockIn   || undefined,
        clockOut:      form.clockOut  || undefined,
        status:        form.status    || undefined,
        justification: form.justification || undefined,
        notes:         form.notes     || undefined,
      });
      onSave();
    } catch (e: any) { setErr(e.message ?? "Erro ao registar"); }
    finally { setSaving(false); }
  }

  return (
    <Overlay>
      <Modal title="Registar Presença Manual" onClose={onClose}>
        <form onSubmit={submit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="ID Utilizador">
              <input value={form.userId} onChange={e => set("userId", e.target.value)}
                style={inputStyle} placeholder="ex: 1" type="number" required />
            </Field>
            <Field label="Data">
              <input value={form.date} onChange={e => set("date", e.target.value)}
                style={inputStyle} type="date" required />
            </Field>
            <Field label="Hora Entrada">
              <input value={form.clockIn} onChange={e => set("clockIn", e.target.value)}
                style={inputStyle} type="time" />
            </Field>
            <Field label="Hora Saída">
              <input value={form.clockOut} onChange={e => set("clockOut", e.target.value)}
                style={inputStyle} type="time" />
            </Field>
          </div>
          <Field label="Estado">
            <select value={form.status} onChange={e => set("status", e.target.value)} style={inputStyle}>
              {Object.entries(STATUS_MAP).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </Field>
          {(form.status === "ABSENT" || form.status === "JUSTIFIED") && (
            <Field label="Justificação">
              <input value={form.justification} onChange={e => set("justification", e.target.value)}
                style={inputStyle} placeholder="Motivo da ausência..." />
            </Field>
          )}
          <Field label="Notas">
            <input value={form.notes} onChange={e => set("notes", e.target.value)}
              style={inputStyle} placeholder="Observações adicionais..." />
          </Field>
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
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      // GET /attendance/report?year=&month=
      const res = await api.get<MonthlyReport>(
        `/attendance/report?year=${year}&month=${month}`
      );
      setReport(res);
    } catch (e: any) { alert(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

  return (
    <Overlay>
      <Modal title="Relatório Mensal de Presenças" onClose={onClose} wide>
        {/* Filtros */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <span style={labelStyle}>Mês</span>
            <select value={month} onChange={e => setMonth(+e.target.value)} style={inputStyle}>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <span style={labelStyle}>Ano</span>
            <input value={year} onChange={e => setYear(+e.target.value)}
              style={inputStyle} type="number" min={2020} max={2030} />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button onClick={load} style={btnPrimary}>Gerar</button>
          </div>
        </div>

        {loading ? (
          <p style={{ color: "#94a3b8", textAlign: "center", padding: 32 }}>A gerar relatório...</p>
        ) : !report ? null : report.summary.length === 0 ? (
          <p style={{ color: "#94a3b8", textAlign: "center", padding: 32, fontSize: 13 }}>
            Sem dados para {MONTHS[month - 1]} {year}.
          </p>
        ) : (
          <div style={{ overflowX: "auto", maxHeight: 400, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead style={{ position: "sticky", top: 0, background: "#f8fafc", zIndex: 1 }}>
                <tr>
                  {["Utilizador", "Presentes", "Ausentes", "Atrasados", "Justificados", "Tempo Total"].map(h => (
                    <th key={h} style={{
                      padding: "10px 14px", textAlign: "left", fontWeight: 700,
                      color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.summary.map((s, i) => (
                  <tr key={i} style={{ borderTop: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "#1e293b" }}>
                      Utilizador #{s.userId}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ color: "#16a34a", fontWeight: 700 }}>{s.present}</span>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ color: "#dc2626", fontWeight: 700 }}>{s.absent}</span>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ color: "#ea580c", fontWeight: 700 }}>{s.late}</span>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ color: "#8b5cf6", fontWeight: 700 }}>{s.justified}</span>
                    </td>
                    <td style={{ padding: "10px 14px", color: "#1e40af", fontWeight: 600 }}>
                      {formatMinutes(s.totalWorkMin)}
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

// ─── Helpers UI ───────────────────────────────────────────────────────────────
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
      width: wide ? 680 : 480, maxWidth: "95vw", maxHeight: "90vh",
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

// ─── Tab Types ────────────────────────────────────────────────────────────────
type Tab = "minhas" | "todas";

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function AttendancePage() {
  const [tab, setTab]                   = useState<Tab>("minhas");
  const [myRecords, setMyRecords]       = useState<AttendanceRecord[]>([]);
  const [allRecords, setAllRecords]     = useState<AttendanceRecord[]>([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFrom, setFilterFrom]     = useState("");
  const [filterTo, setFilterTo]         = useState("");
  const [modalRegistar, setModalRegistar]   = useState(false);
  const [modalRelatorio, setModalRelatorio] = useState(false);

  const LIMIT = 20;

  function loadMy() {
    setLoading(true);
    // GET /attendance/my
    const params = new URLSearchParams();
    if (filterFrom) params.set("from", filterFrom);
    if (filterTo)   params.set("to",   filterTo);
    api.get<AttendanceRecord[]>(`/attendance/my?${params}`)
      .then(res => setMyRecords(Array.isArray(res) ? res : []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }

  function loadAll(p = 1) {
    setLoading(true);
    // GET /attendance
    const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
    if (filterStatus) params.set("status", filterStatus);
    if (filterFrom)   params.set("from",   filterFrom);
    if (filterTo)     params.set("to",     filterTo);
    api.get<any>(`/attendance?${params}`)
      .then(res => {
        setAllRecords(res?.data ?? []);
        setTotal(res?.total ?? 0);
        setPage(p);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (tab === "minhas") loadMy();
    else loadAll(1);
  }, [tab, filterStatus, filterFrom, filterTo]);

  const records = tab === "minhas" ? myRecords : allRecords;
  const totalPages = Math.ceil(total / LIMIT);

  // Stats da tab "minhas"
  const myPresent   = myRecords.filter(r => r.status === "PRESENT" || r.status === "REMOTE").length;
  const myAbsent    = myRecords.filter(r => r.status === "ABSENT").length;
  const myLate      = myRecords.filter(r => r.status === "LATE").length;
  const myTotalMin  = myRecords.reduce((s, r) => s + (r.workMinutes ?? (r.hoursWorked ?? 0) * 60), 0);

  const TAB_STYLE = (active: boolean): React.CSSProperties => ({
    padding: "8px 20px", border: "none", cursor: "pointer", fontSize: 13,
    fontWeight: active ? 700 : 500, borderRadius: 8,
    background: active ? "#1e40af" : "transparent",
    color: active ? "#fff" : "#64748b", transition: "all 0.15s",
  });

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", margin: 0 }}>
            🕐 Controlo de Presenças
          </h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
            Gestão de entradas, saídas e presenças
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setModalRelatorio(true)} style={btnGhost}>
            📊 Relatório Mensal
          </button>
          <button onClick={() => setModalRegistar(true)} style={btnPrimary}>
            + Registar Manual
          </button>
        </div>
      </div>

      {/* ── Clock Widget ── */}
      <div style={{ marginBottom: 20 }}>
        <ClockWidget onRefresh={loadMy} />
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 10, padding: 4, marginBottom: 20, width: "fit-content" }}>
        <button onClick={() => setTab("minhas")} style={TAB_STYLE(tab === "minhas")}>
          👤 As Minhas Presenças
        </button>
        <button onClick={() => setTab("todas")} style={TAB_STYLE(tab === "todas")}>
          👥 Todas as Presenças
        </button>
      </div>

      {/* ── Stats (tab minhas) ── */}
      {tab === "minhas" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Presenças",       value: myPresent,          color: "#16a34a", bg: "#f0fdf4" },
            { label: "Ausências",       value: myAbsent,           color: "#dc2626", bg: "#fef2f2" },
            { label: "Atrasos",         value: myLate,             color: "#ea580c", bg: "#fff7ed" },
            { label: "Tempo Total",     value: formatMinutes(myTotalMin), color: "#1e40af", bg: "#eff6ff" },
          ].map(s => (
            <div key={s.label} style={{
              background: s.bg, borderRadius: 10, padding: "14px 18px",
              border: `1px solid ${s.color}22`,
            }}>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: s.color, textTransform: "uppercase", letterSpacing: 0.8 }}>{s.label}</p>
              <p style={{ margin: "4px 0 0", fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Filtros ── */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <span style={{ ...labelStyle, marginBottom: 4 }}>De</span>
          <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)}
            style={{ ...inputStyle, width: 160 }} />
        </div>
        <div>
          <span style={{ ...labelStyle, marginBottom: 4 }}>Até</span>
          <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)}
            style={{ ...inputStyle, width: 160 }} />
        </div>
        {tab === "todas" && (
          <div>
            <span style={{ ...labelStyle, marginBottom: 4 }}>Estado</span>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              style={{ ...inputStyle, width: 160 }}>
              <option value="">Todos</option>
              {Object.entries(STATUS_MAP).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        )}
        {(filterFrom || filterTo || filterStatus) && (
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button onClick={() => { setFilterFrom(""); setFilterTo(""); setFilterStatus(""); }}
              style={{ ...btnGhost, padding: "10px 14px" }}>✕ Limpar</button>
          </div>
        )}
      </div>

      {/* ── Erro ── */}
      {error && (
        <div style={{
          background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8,
          padding: 14, color: "#dc2626", fontSize: 13, marginBottom: 16,
        }}>{error}</div>
      )}

      {/* ── Tabela ── */}
      <div style={{ ...card, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
            A carregar registos...
          </div>
        ) : records.length === 0 ? (
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
                    tab === "todas" ? "Utilizador" : null,
                    "Data", "Estado", "Entrada", "Saída", "Tempo", "Notas",
                  ].filter(Boolean).map(h => (
                    <th key={h!} style={{
                      padding: "11px 16px", textAlign: "left", fontWeight: 700,
                      color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6,
                      whiteSpace: "nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id} style={{ borderTop: "1px solid #f1f5f9" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#fafafa")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    {tab === "todas" && (
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: "#1e293b" }}>
                        #{r.employeeId}
                      </td>
                    )}
                    <td style={{ padding: "12px 16px", color: "#1e293b", whiteSpace: "nowrap" }}>
                      {new Date(r.date).toLocaleDateString("pt-PT", {
                        weekday: "short", day: "2-digit", month: "short",
                      })}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <StatusBadge status={r.status} />
                    </td>
                    <td style={{ padding: "12px 16px", color: "#16a34a", fontWeight: 600, fontFamily: "monospace" }}>
                      {r.clockIn ?? "—"}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#dc2626", fontWeight: 600, fontFamily: "monospace" }}>
                      {r.clockOut ?? "—"}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#1e40af", fontWeight: 600 }}>
                      {formatMinutes(r.workMinutes ?? (r.hoursWorked ?? 0) * 60)}
                    </td>
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

      {/* ── Paginação (tab todas) ── */}
      {tab === "todas" && totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
          <span style={{ fontSize: 13, color: "#64748b" }}>
            {total} registos no total
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => loadAll(page - 1)} disabled={page === 1}
              style={{ ...btnGhost, padding: "8px 16px", opacity: page === 1 ? 0.4 : 1 }}>
              ← Anterior
            </button>
            <span style={{ padding: "8px 14px", fontSize: 13, color: "#64748b" }}>
              {page} / {totalPages}
            </span>
            <button onClick={() => loadAll(page + 1)} disabled={page === totalPages}
              style={{ ...btnGhost, padding: "8px 16px", opacity: page === totalPages ? 0.4 : 1 }}>
              Seguinte →
            </button>
          </div>
        </div>
      )}

      {/* ── Modais ── */}
      {modalRegistar && (
        <ModalRegistar
          onClose={() => setModalRegistar(false)}
          onSave={() => { setModalRegistar(false); tab === "minhas" ? loadMy() : loadAll(1); }}
        />
      )}
      {modalRelatorio && (
        <ModalRelatorio onClose={() => setModalRelatorio(false)} />
      )}
    </div>
  );
}