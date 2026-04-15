"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Event {
  id: number; title: string; description?: string;
  startAt: string; endAt: string; location?: string;
  organizer?: { id: number; fullName: string };
  participants?: Participant[];
  _count?: { participants: number };
}
interface Participant {
  status: string;
  user: { id: number; fullName: string; email: string };
}

// ─── Maps ─────────────────────────────────────────────────────────────────────
const PART_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:   { label: "Pendente",   color: "#f59e0b", bg: "#fffbeb" },
  CONFIRMED: { label: "Confirmado", color: "#16a34a", bg: "#ecfdf5" },
  CANCELED:  { label: "Cancelado",  color: "#dc2626", bg: "#fef2f2" },
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const card: React.CSSProperties = { background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: 24 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, color: "#1e293b", background: "#fff", outline: "none", boxSizing: "border-box" };
const labelStyle: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#64748b", marginBottom: 6 };
const btnPrimary: React.CSSProperties = { padding: "10px 20px", background: "#1e40af", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" };
const btnGhost: React.CSSProperties = { padding: "8px 14px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" };
const btnDanger: React.CSSProperties = { padding: "6px 12px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer" };
const btnSuccess: React.CSSProperties = { padding: "6px 12px", background: "#ecfdf5", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer" };

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

// ─── Modal: Criar / Editar Evento ─────────────────────────────────────────────
function EventModal({ editing, onClose, onSaved }: {
  editing: Event | null; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: editing?.title ?? "",
    description: editing?.description ?? "",
    startAt: editing?.startAt ? editing.startAt.slice(0, 16) : "",
    endAt: editing?.endAt ? editing.endAt.slice(0, 16) : "",
    location: editing?.location ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      if (editing) await api.put(`/events/${editing.id}`, form);
      else await api.post("/events", form);
      onSaved(); onClose();
    } catch (e: any) { setError(e.message ?? "Erro ao guardar"); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ ...card, width: "100%", maxWidth: 500, boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1e293b" }}>{editing ? "✏️ Editar Evento" : "📅 Novo Evento"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
        </div>
        <form onSubmit={submit}>
          <div style={{ marginBottom: 14 }}><span style={labelStyle}>Título *</span><input style={inputStyle} value={form.title} onChange={e => set("title", e.target.value)} required /></div>
          <div style={{ marginBottom: 14 }}><span style={labelStyle}>Descrição</span><textarea style={{ ...inputStyle, height: 72, resize: "vertical" }} value={form.description} onChange={e => set("description", e.target.value)} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div><span style={labelStyle}>Início *</span><input style={inputStyle} type="datetime-local" value={form.startAt} onChange={e => set("startAt", e.target.value)} required /></div>
            <div><span style={labelStyle}>Fim *</span><input style={inputStyle} type="datetime-local" value={form.endAt} onChange={e => set("endAt", e.target.value)} required /></div>
          </div>
          <div style={{ marginBottom: 20 }}><span style={labelStyle}>Local</span><input style={inputStyle} value={form.location} onChange={e => set("location", e.target.value)} placeholder="Ex: Sala de Reuniões A" /></div>
          {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}><p style={{ margin: 0, fontSize: 13, color: "#dc2626" }}>{error}</p></div>}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={btnGhost}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>{saving ? "A guardar..." : editing ? "Guardar Alterações" : "Criar Evento"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal: Detalhe do Evento ─────────────────────────────────────────────────
function EventDetailModal({ event, onClose, onEdit, onDelete, onJoin, onLeave, isMyEvent, showToast }: {
  event: Event; onClose: () => void; onEdit: () => void; onDelete: () => void;
  onJoin: () => void; onLeave: () => void; isMyEvent: boolean;
  showToast: (m: string, t: "success" | "error") => void;
}) {
  const [detail, setDetail] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingPart, setUpdatingPart] = useState<number | null>(null);

  useEffect(() => {
    api.get<Event>(`/events/${event.id}`).then(setDetail).catch(() => {}).finally(() => setLoading(false));
  }, [event.id]);

  async function updateParticipantStatus(userId: number, status: string) {
    setUpdatingPart(userId);
    try {
      await api.patch(`/events/${event.id}/participants/${userId}/status`, { status });
      const updated = await api.get<Event>(`/events/${event.id}`);
      setDetail(updated);
      showToast("Estado actualizado!", "success");
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setUpdatingPart(null); }
  }

  const e = detail ?? event;
  const start = new Date(e.startAt);
  const end = new Date(e.endAt);
  const isUpcoming = start > new Date();
  const isPast = end < new Date();
  const participants = detail?.participants ?? [];
  const confirmed = participants.filter(p => p.status === "CONFIRMED").length;
  const pending = participants.filter(p => p.status === "PENDING").length;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ ...card, width: "100%", maxWidth: 600, maxHeight: "92vh", overflow: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }} onClick={ev => ev.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700, color: "#1e293b" }}>{e.title}</h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: isUpcoming ? "#eff6ff" : isPast ? "#f8fafc" : "#ecfdf5", color: isUpcoming ? "#1e40af" : isPast ? "#94a3b8" : "#16a34a" }}>
                {isUpcoming ? "🔜 Próximo" : isPast ? "⌛ Passado" : "🟢 A decorrer"}
              </span>
              {e.organizer && <span style={{ fontSize: 12, color: "#64748b" }}>👤 {e.organizer.fullName}</span>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0, marginLeft: 12 }}>
            <button onClick={onEdit} style={btnGhost}>✏️</button>
            <button onClick={onDelete} style={btnDanger}>🗑️</button>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
          </div>
        </div>

        {/* Info */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: 10 }}>
            <p style={{ margin: "0 0 2px", fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>INÍCIO</p>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{start.toLocaleString("pt-PT", { dateStyle: "medium", timeStyle: "short" })}</p>
          </div>
          <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: 10 }}>
            <p style={{ margin: "0 0 2px", fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>FIM</p>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{end.toLocaleString("pt-PT", { dateStyle: "medium", timeStyle: "short" })}</p>
          </div>
        </div>

        {e.location && (
          <div style={{ padding: "10px 14px", background: "#f0f9ff", borderRadius: 10, marginBottom: 20, border: "1px solid #bae6fd" }}>
            <p style={{ margin: 0, fontSize: 13, color: "#0369a1" }}>📍 {e.location}</p>
          </div>
        )}

        {e.description && (
          <div style={{ padding: "12px 16px", background: "#f8fafc", borderRadius: 10, marginBottom: 20 }}>
            <p style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.6 }}>{e.description}</p>
          </div>
        )}

        {/* Inscrição pessoal */}
        {isUpcoming && (
          <div style={{ marginBottom: 20 }}>
            {isMyEvent
              ? <button onClick={onLeave} style={{ ...btnDanger, width: "100%", padding: "10px" }}>❌ Cancelar Inscrição</button>
              : <button onClick={onJoin} style={{ ...btnPrimary, width: "100%" }}>✅ Inscrever-me</button>}
          </div>
        )}

        {/* Participantes */}
        {loading ? <p style={{ textAlign: "center", color: "#94a3b8" }}>A carregar participantes...</p> : (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b" }}>👥 Participantes ({participants.length})</h3>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "#ecfdf5", color: "#16a34a" }}>✅ {confirmed}</span>
                <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "#fffbeb", color: "#f59e0b" }}>⏳ {pending}</span>
              </div>
            </div>
            {participants.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "16px 0" }}>Nenhum participante inscrito.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {participants.map((p, i) => {
                  const ps = PART_STATUS[p.status] ?? { label: p.status, color: "#64748b", bg: "#f8fafc" };
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#f8fafc", borderRadius: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#1e40af,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                        {p.user.fullName.charAt(0)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.user.fullName}</p>
                        <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{p.user.email}</p>
                      </div>
                      <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: ps.bg, color: ps.color, flexShrink: 0 }}>{ps.label}</span>
                      {/* Acções de gestão */}
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        {p.status !== "CONFIRMED" && (
                          <button
                            onClick={() => updateParticipantStatus(p.user.id, "CONFIRMED")}
                            disabled={updatingPart === p.user.id}
                            style={{ ...btnSuccess, padding: "4px 8px", fontSize: 11 }}
                            title="Confirmar"
                          >✅</button>
                        )}
                        {p.status !== "CANCELED" && (
                          <button
                            onClick={() => updateParticipantStatus(p.user.id, "CANCELED")}
                            disabled={updatingPart === p.user.id}
                            style={{ ...btnDanger, padding: "4px 8px" }}
                            title="Cancelar"
                          >❌</button>
                        )}
                        {p.status !== "PENDING" && (
                          <button
                            onClick={() => updateParticipantStatus(p.user.id, "PENDING")}
                            disabled={updatingPart === p.user.id}
                            style={{ ...btnGhost, padding: "4px 8px", fontSize: 11 }}
                            title="Repor para Pendente"
                          >⏳</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Event Card ───────────────────────────────────────────────────────────────
function EventCard({ event, isMyEvent, onView, onJoin, onLeave }: {
  event: Event; isMyEvent: boolean;
  onView: () => void; onJoin: () => void; onLeave: () => void;
}) {
  const start = new Date(event.startAt);
  const end = new Date(event.endAt);
  const isUpcoming = start > new Date();
  const isPast = end < new Date();
  const borderColor = isUpcoming ? "#1e40af" : isPast ? "#94a3b8" : "#16a34a";

  return (
    <div style={{ ...card, borderLeft: `4px solid ${borderColor}`, cursor: "pointer", transition: "box-shadow 0.15s" }}
      onClick={onView}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)")}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        {/* Date box */}
        <div style={{ width: 52, height: 52, borderRadius: 12, background: isUpcoming ? "#eff6ff" : "#f8fafc", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: borderColor, textTransform: "uppercase" }}>{start.toLocaleDateString("pt-PT", { month: "short" })}</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", lineHeight: 1 }}>{start.getDate()}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{event.title}</h3>
            {isMyEvent && <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: "#ecfdf5", color: "#16a34a" }}>Inscrito</span>}
          </div>
          {event.description && <p style={{ margin: "0 0 6px", fontSize: 12, color: "#64748b", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{event.description}</p>}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "#64748b" }}>🕐 {start.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })} – {end.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}</span>
            {event.location && <span style={{ fontSize: 11, color: "#64748b" }}>📍 {event.location}</span>}
            {event.organizer && <span style={{ fontSize: 11, color: "#64748b" }}>👤 {event.organizer.fullName}</span>}
            {event._count && <span style={{ fontSize: 11, color: "#64748b" }}>👥 {event._count.participants}</span>}
          </div>
        </div>
        {/* Quick action */}
        {isUpcoming && (
          <div onClick={e => e.stopPropagation()} style={{ flexShrink: 0 }}>
            {isMyEvent
              ? <button onClick={onLeave} style={{ ...btnDanger, padding: "6px 12px", fontSize: 12 }}>Cancelar</button>
              : <button onClick={onJoin} style={{ ...btnPrimary, padding: "6px 12px", fontSize: 12 }}>Inscrever</button>}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab ─────────────────────────────────────────────────────────────────────
type Tab = "upcoming" | "all" | "my";

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function EventosPage() {
  const [tab, setTab] = useState<Tab>("upcoming");
  const [events, setEvents] = useState<Event[]>([]);
  const [myEventIds, setMyEventIds] = useState<Set<number>>(new Set());
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [eventModal, setEventModal] = useState<Event | "new" | null>(null);
  const [detailModal, setDetailModal] = useState<Event | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error") { setToast({ msg, type }); }

  async function fetchEvents() {
    setLoading(true);
    try {
      let data: Event[] = [];
      if (tab === "upcoming") {
        data = await api.get<Event[]>("/events/upcoming");
        setTotal(data.length);
      } else if (tab === "my") {
        const my = await api.get<any[]>("/events/my");
        data = my.map((e: any) => e.event ?? e).filter(Boolean);
        setTotal(data.length);
      } else {
        const p = new URLSearchParams({ page: String(page), limit: "20" });
        if (search) p.set("search", search);
        const res = await api.get<any>(`/events?${p}`);
        data = res.data ?? []; setTotal(res.total ?? 0);
      }
      setEvents(data);
      // Carregar meus eventos para saber quais estou inscrito
      const myEv = await api.get<any[]>("/events/my").catch(() => []);
      setMyEventIds(new Set(myEv.map((e: any) => (e.event ?? e)?.id).filter(Boolean)));
    } catch (e: any) { showToast(e.message ?? "Erro", "error"); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchEvents(); }, [tab, search, page]);

  async function join(id: number) {
    try { await api.post(`/events/${id}/join`, {}); fetchEvents(); showToast("Inscrição realizada! ✅", "success"); }
    catch (e: any) { showToast(e.message, "error"); }
  }

  async function leave(id: number) {
    try { await api.post(`/events/${id}/leave`, {}); fetchEvents(); showToast("Inscrição cancelada.", "success"); }
    catch (e: any) { showToast(e.message, "error"); }
  }

  async function deleteEvent(id: number) {
    if (!confirm("Remover este evento?")) return;
    try { await api.delete(`/events/${id}`); fetchEvents(); setDetailModal(null); showToast("Evento removido.", "success"); }
    catch (e: any) { showToast(e.message, "error"); }
  }

  const upcomingCount = events.filter(e => new Date(e.startAt) > new Date()).length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", margin: 0 }}>📅 Eventos</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Formações, workshops e eventos organizacionais — {total} encontrados</p>
        </div>
        <button onClick={() => setEventModal("new")} style={btnPrimary}>+ Novo Evento</button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 10, padding: 4, marginBottom: 20, width: "fit-content" }}>
        {([
          ["upcoming", "🔜 Próximos"],
          ["all",      "📋 Todos"],
          ["my",       "👤 Os Meus"],
        ] as [Tab, string][]).map(([k, l]) => (
          <button key={k} onClick={() => { setTab(k); setPage(1); }} style={{ padding: "8px 20px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: tab === k ? 700 : 500, borderRadius: 8, background: tab === k ? "#1e40af" : "transparent", color: tab === k ? "#fff" : "#64748b", transition: "all 0.15s" }}>{l}</button>
        ))}
      </div>

      {/* Pesquisa (tab all) */}
      {tab === "all" && (
        <input style={{ ...inputStyle, maxWidth: 300, marginBottom: 20 }} placeholder="🔍 Pesquisar evento..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
      )}

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>A carregar...</div>
      ) : events.length === 0 ? (
        <div style={{ ...card, textAlign: "center", padding: 60 }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>📅</p>
          <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 16px" }}>
            {tab === "upcoming" ? "Sem eventos próximos." : tab === "my" ? "Ainda não estás inscrito em nenhum evento." : "Nenhum evento encontrado."}
          </p>
          <button onClick={() => setEventModal("new")} style={btnPrimary}>+ Criar Evento</button>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {events.map(e => (
              <EventCard
                key={e.id} event={e}
                isMyEvent={myEventIds.has(e.id)}
                onView={() => setDetailModal(e)}
                onJoin={() => join(e.id)}
                onLeave={() => leave(e.id)}
              />
            ))}
          </div>
          {tab === "all" && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
              <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Página {page} — {events.length} de {total}</p>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} style={{ ...btnGhost, opacity: page===1?0.5:1 }}>← Anterior</button>
                <button onClick={() => setPage(p => p+1)} disabled={events.length<20} style={{ ...btnGhost, opacity: events.length<20?0.5:1 }}>Seguinte →</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modais */}
      {eventModal !== null && (
        <EventModal
          editing={eventModal === "new" ? null : eventModal}
          onClose={() => setEventModal(null)}
          onSaved={() => { fetchEvents(); showToast(eventModal === "new" ? "Evento criado!" : "Evento actualizado!", "success"); }}
        />
      )}
      {detailModal && (
        <EventDetailModal
          event={detailModal}
          onClose={() => setDetailModal(null)}
          onEdit={() => { setEventModal(detailModal); setDetailModal(null); }}
          onDelete={() => deleteEvent(detailModal.id)}
          onJoin={() => { join(detailModal.id); setDetailModal(null); }}
          onLeave={() => { leave(detailModal.id); setDetailModal(null); }}
          isMyEvent={myEventIds.has(detailModal.id)}
          showToast={showToast}
        />
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

