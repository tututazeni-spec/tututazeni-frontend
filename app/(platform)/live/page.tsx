"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LiveClass {
  id: number;
  topic: string;
  scheduledAt: string;
  duration: number;
  recordingUrl?: string;
  zoomMeetingId?: string;
  course?: { id: number; title: string };
  _count?: { attendances: number; messages: number };
  postEvaluation?: { id: number; averageScore: number };
}

interface PaginatedClasses {
  data: LiveClass[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-PT", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}
function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}
function isVideoUrl(url: string) {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url) ||
    url.includes("drive.google.com") ||
    url.includes("youtu");
}
function getEmbedUrl(url: string): string | null {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`;
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  // Google Drive
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (driveMatch) return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
  return null;
}

type ClassStatus = "live" | "upcoming" | "past";
function getStatus(scheduledAt: string, duration: number): ClassStatus {
  const now = Date.now();
  const s = new Date(scheduledAt).getTime();
  const e = s + duration * 60_000;
  if (now >= s && now <= e) return "live";
  if (now < s) return "upcoming";
  return "past";
}

// ─── Components ───────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "52px 0" }}>
      <div style={{ width: 28, height: 28, border: "3px solid #e2e8f0", borderTopColor: "#dc2626", borderRadius: "50%", animation: "lv-spin 0.7s linear infinite" }} />
      <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>A carregar...</p>
    </div>
  );
}

function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error" | "info"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  const c = { success: { bg: "#f0fdf4", bd: "#bbf7d0", cl: "#16a34a" }, error: { bg: "#fef2f2", bd: "#fecaca", cl: "#dc2626" }, info: { bg: "#eff6ff", bd: "#bfdbfe", cl: "#2563eb" } }[type];
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: c.bg, border: `1px solid ${c.bd}`, borderRadius: 12, padding: "12px 18px", boxShadow: "0 8px 24px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: c.cl, fontWeight: 500 }}>
      {msg}
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: c.cl, fontSize: 16, marginLeft: 8 }}>×</button>
    </div>
  );
}

// ─── Recording Player Modal ───────────────────────────────────────────────────

function RecordingModal({ lc, onClose }: { lc: LiveClass; onClose: () => void }) {
  const embedUrl = lc.recordingUrl ? getEmbedUrl(lc.recordingUrl) : null;
  const isNative = lc.recordingUrl ? isVideoUrl(lc.recordingUrl) && !embedUrl : false;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#0f172a", borderRadius: 20, width: "100%", maxWidth: 800, boxShadow: "0 32px 80px rgba(0,0,0,0.5)", overflow: "hidden", animation: "lv-up 0.2s ease" }}>

        {/* Header */}
        <div style={{ padding: "16px 22px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: "#f1f5f9" }}>{lc.topic}</p>
            {lc.course && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>📚 {lc.course.title} · {fmtDate(lc.scheduledAt)}</p>}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <a href={lc.recordingUrl!} target="_blank" rel="noreferrer"
              style={{ padding: "6px 12px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#94a3b8", fontSize: 12, textDecoration: "none" }}>
              Abrir ↗
            </a>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#94a3b8" }}>×</button>
          </div>
        </div>

        {/* Player */}
        <div style={{ position: "relative", background: "#000", aspectRatio: "16/9" }}>
          {embedUrl ? (
            <iframe src={embedUrl} style={{ width: "100%", height: "100%", border: "none" }} allowFullScreen allow="autoplay; fullscreen; picture-in-picture" />
          ) : isNative ? (
            <video src={lc.recordingUrl!} controls style={{ width: "100%", height: "100%" }} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 14, padding: 24 }}>
              <p style={{ fontSize: 40, margin: 0 }}>🎬</p>
              <p style={{ color: "#94a3b8", fontSize: 14, margin: 0 }}>Este formato não suporta pré-visualização inline.</p>
              <a href={lc.recordingUrl!} target="_blank" rel="noreferrer"
                style={{ padding: "9px 20px", background: "#dc2626", border: "none", borderRadius: 9, color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                Abrir Gravação ↗
              </a>
            </div>
          )}
        </div>

        {/* Info footer */}
        <div style={{ padding: "12px 22px", display: "flex", gap: 20, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {[
            { label: "Duração planeada", value: `${lc.duration} min`                           },
            { label: "Participantes",    value: lc._count?.attendances ?? 0                    },
            { label: "Avaliação",        value: lc.postEvaluation ? `⭐ ${lc.postEvaluation.averageScore.toFixed(1)}/5` : "Sem avaliação" },
          ].map(f => (
            <div key={f.label}>
              <p style={{ margin: 0, fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: 0.6 }}>{f.label}</p>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>{f.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page (tabs: Sala Ao Vivo + Gravações) ───────────────────────────────

type MainTab = "live" | "recordings";

export default function LivePage() {
  const router = useRouter();
  const [tab, setTab]               = useState<MainTab>("live");
  const [classes, setClasses]       = useState<LiveClass[]>([]);
  const [upcoming, setUpcoming]     = useState<LiveClass[]>([]);
  const [recordings, setRecordings] = useState<LiveClass[]>([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [filterCourseId, setFilterCourseId] = useState("");
  const [viewRecording, setViewRecording]   = useState<LiveClass | null>(null);
  const [showCreate, setShowCreate]         = useState(false);
  const [editClass, setEditClass]           = useState<LiveClass | null>(null);
  const [toast, setToast]                   = useState<{ msg: string; type: "success"|"error"|"info" } | null>(null);

  const showToast = (msg: string, type: "success"|"error"|"info") => setToast({ msg, type });

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const loadClasses = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page: String(p), limit: "12" });
      if (filterCourseId) q.set("courseId", filterCourseId);
      const res = await api.get<PaginatedClasses>(`/live-classes?${q}`);
      setClasses(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setPage(res.page);
      // Extract recordings
      setRecordings(res.data.filter(lc => lc.recordingUrl));
    } catch (e: any) { showToast(e.message ?? "Erro", "error"); }
    finally { setLoading(false); }
  }, [filterCourseId]);

  const loadUpcoming = useCallback(async () => {
    try {
      const res = await api.get<LiveClass[]>("/live-classes/upcoming");
      setUpcoming(Array.isArray(res) ? res : []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { loadClasses(1); loadUpcoming(); }, [filterCourseId]);
  useEffect(() => { const t = setInterval(loadUpcoming, 30_000); return () => clearInterval(t); }, []);

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function deleteClass(lc: LiveClass) {
    if (!confirm(`Eliminar "${lc.topic}"?`)) return;
    try {
      await api.delete(`/live-classes/${lc.id}`);
      setClasses(prev => prev.filter(x => x.id !== lc.id));
      setRecordings(prev => prev.filter(x => x.id !== lc.id));
      showToast("Aula eliminada.", "info");
    } catch (e: any) { showToast(e.message, "error"); }
  }

  // ── Filters ────────────────────────────────────────────────────────────────

  const filtered = tab === "recordings"
    ? recordings.filter(lc =>
        !search ||
        lc.topic.toLowerCase().includes(search.toLowerCase()) ||
        lc.course?.title?.toLowerCase().includes(search.toLowerCase())
      )
    : classes.filter(lc =>
        !search ||
        lc.topic.toLowerCase().includes(search.toLowerCase()) ||
        lc.course?.title?.toLowerCase().includes(search.toLowerCase())
      );

  const liveNow       = upcoming.filter(lc => getStatus(lc.scheduledAt, lc.duration) === "live").length;
  const upcomingCount = upcoming.filter(lc => getStatus(lc.scheduledAt, lc.duration) === "upcoming").length;

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: "9px 22px", border: "none", cursor: "pointer", fontSize: 13,
    fontWeight: active ? 700 : 500, borderRadius: 9,
    background: active ? "#dc2626" : "transparent",
    color: active ? "#fff" : "#64748b", transition: "all 0.15s",
  });

  const INP: React.CSSProperties = { padding: "9px 13px", borderRadius: 9, border: "1px solid #e2e8f0", fontSize: 13.5, color: "#1e293b", background: "#fff", outline: "none", boxSizing: "border-box" as const };
  const CARD: React.CSSProperties = { background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0" };

  return (
    <>
      <style>{`
        @keyframes lv-spin { to { transform: rotate(360deg); } }
        @keyframes lv-up   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
        @keyframes lv-ping { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.5)} }
      `}</style>

      <div>
        {/* ── Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 10 }}>
              🔴 Aulas ao Vivo
              {liveNow > 0 && (
                <span style={{ padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 800, background: "#fef2f2", color: "#dc2626", animation: "lv-ping 1.5s ease-in-out infinite" }}>
                  {liveNow} AO VIVO
                </span>
              )}
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: "#64748b" }}>
              Aulas ao vivo com Jitsi Meet · {recordings.length} gravações disponíveis
            </p>
          </div>
          <button onClick={() => router.push("/live/create")} style={{ padding: "9px 20px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            🎥 Nova Aula
          </button>
        </div>

        {/* ── Stats ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 22 }}>
          {[
            { icon: "🔴", label: "Ao Vivo",     value: liveNow,        color: "#dc2626", bg: "#fef2f2" },
            { icon: "📅", label: "Agendadas",    value: upcomingCount,  color: "#d97706", bg: "#fffbeb" },
            { icon: "🎬", label: "Gravações",    value: recordings.length, color: "#7c3aed", bg: "#f5f3ff" },
            { icon: "🎥", label: "Total Aulas",  value: total,          color: "#0891b2", bg: "#ecfeff" },
          ].map(s => (
            <div key={s.label} style={{ ...CARD, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{s.icon}</div>
              <div>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.7 }}>{s.label}</p>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Upcoming strip ── */}
        {upcoming.filter(lc => getStatus(lc.scheduledAt, lc.duration) !== "past").length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.8 }}>📅 Próximas Sessões</p>
            <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }}>
              {upcoming.filter(lc => getStatus(lc.scheduledAt, lc.duration) !== "past").map(lc => {
                const status = getStatus(lc.scheduledAt, lc.duration);
                return (
                  <div key={lc.id} onClick={() => router.push(`/live/${lc.id}`)}
                    style={{ flexShrink: 0, background: "#fff", border: `1px solid ${status === "live" ? "#fca5a5" : "#e2e8f0"}`, borderRadius: 12, padding: "12px 16px", cursor: "pointer", minWidth: 200, maxWidth: 240, borderLeft: status === "live" ? "4px solid #dc2626" : undefined }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                      {status === "live" && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#dc2626", display: "inline-block", animation: "lv-ping 1.2s ease-in-out infinite" }} />}
                      <span style={{ fontSize: 10, fontWeight: 800, color: status === "live" ? "#dc2626" : "#d97706", textTransform: "uppercase" }}>
                        {status === "live" ? "Ao Vivo Agora" : "Agendada"}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lc.topic}</p>
                    <p style={{ margin: "3px 0 0", fontSize: 11, color: "#64748b" }}>{fmtDate(lc.scheduledAt)} · {fmtTime(lc.scheduledAt)}</p>
                    <div style={{ marginTop: 8 }}>
                      <span style={{ padding: "4px 10px", background: status === "live" ? "#dc2626" : "#1e293b", color: "#fff", borderRadius: 7, fontSize: 11, fontWeight: 700 }}>
                        {status === "live" ? "▶ Entrar Agora" : "Ver Sala"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Tabs ── */}
        <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 11, padding: 4, marginBottom: 20, width: "fit-content" }}>
          <button onClick={() => setTab("live")}       style={tabBtn(tab === "live")}>🎥 Todas as Aulas</button>
          <button onClick={() => setTab("recordings")} style={tabBtn(tab === "recordings")}>🎬 Gravações ({recordings.length})</button>
        </div>

        {/* ── Search ── */}
        <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Pesquisar por tópico ou curso..." style={{ ...INP, minWidth: 260 }} />
          {tab === "live" && (
            <input value={filterCourseId} onChange={e => setFilterCourseId(e.target.value)} placeholder="ID do Curso" type="number" style={{ ...INP, width: 130 }} />
          )}
          {(search || filterCourseId) && (
            <button onClick={() => { setSearch(""); setFilterCourseId(""); }} style={{ padding: "9px 14px", borderRadius: 9, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 12.5, color: "#64748b" }}>✕</button>
          )}
        </div>

        {/* ══════════════════════════════════════
            TAB: TODAS AS AULAS
        ══════════════════════════════════════ */}
        {tab === "live" && (
          loading ? <Spinner /> : filtered.length === 0 ? (
            <div style={{ ...CARD, padding: "52px 24px", textAlign: "center" }}>
              <p style={{ fontSize: 34, margin: "0 0 10px" }}>🎥</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", margin: "0 0 6px" }}>Sem aulas encontradas</p>
              <p style={{ fontSize: 13, color: "#94a3b8" }}>Cria a primeira sessão de formação ao vivo.</p>
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
                {filtered.map(lc => {
                  const status = getStatus(lc.scheduledAt, lc.duration);
                  const isLive = status === "live";
                  return (
                    <div key={lc.id} style={{ ...CARD, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12, borderLeft: isLive ? "4px solid #dc2626" : undefined }}>
                      {/* Status + Topic */}
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 11, background: isLive ? "#fef2f2" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                          {isLive ? "🔴" : status === "upcoming" ? "🎥" : "📹"}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 3, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 9.5, fontWeight: 800, padding: "2px 7px", borderRadius: 20, background: isLive ? "#fef2f2" : status === "upcoming" ? "#fffbeb" : "#f1f5f9", color: isLive ? "#dc2626" : status === "upcoming" ? "#d97706" : "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>
                              {isLive ? "● Ao Vivo" : status === "upcoming" ? "Agendada" : "Concluída"}
                            </span>
                            {lc.recordingUrl && <span style={{ fontSize: 9.5, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: "#f5f3ff", color: "#7c3aed" }}>🎬 Gravação</span>}
                          </div>
                          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lc.topic}</h3>
                          {lc.course && <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "#64748b" }}>📚 {lc.course.title}</p>}
                        </div>
                      </div>

                      {/* Meta */}
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {[
                          { v: fmtDate(lc.scheduledAt), i: "📅" },
                          { v: fmtTime(lc.scheduledAt), i: "⏰" },
                          { v: `${lc.duration}min`,     i: "⏱️" },
                          { v: String(lc._count?.attendances ?? 0), i: "👥" },
                        ].map(m => (
                          <span key={m.i} style={{ fontSize: 11.5, color: "#64748b" }}>{m.i} {m.v}</span>
                        ))}
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", gap: 8, paddingTop: 4, borderTop: "1px solid #f1f5f9" }}>
                        <button
                          onClick={() => router.push(`/live/${lc.id}`)}
                          style={{ flex: 2, padding: "8px", borderRadius: 8, border: "none", background: isLive ? "#dc2626" : "#1e293b", color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                          {isLive ? "🔴 Entrar Agora" : "Abrir Sala"}
                        </button>
                        {lc.recordingUrl && (
                          <button onClick={() => setViewRecording(lc)} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1px solid #e9d5ff", background: "#f5f3ff", color: "#7c3aed", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                            🎬 Ver
                          </button>
                        )}
                        <button onClick={() => deleteClass(lc)} style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #fecaca", background: "#fef2f2", fontSize: 12, cursor: "pointer", color: "#dc2626" }}>🗑️</button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
                  <button onClick={() => loadClasses(page - 1)} disabled={page === 1} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 12.5, opacity: page === 1 ? 0.4 : 1 }}>← Anterior</button>
                  <span style={{ padding: "8px 14px", fontSize: 13, color: "#64748b" }}>{page} / {totalPages}</span>
                  <button onClick={() => loadClasses(page + 1)} disabled={page === totalPages} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 12.5, opacity: page === totalPages ? 0.4 : 1 }}>Seguinte →</button>
                </div>
              )}
            </>
          )
        )}

        {/* ══════════════════════════════════════
            TAB: GRAVAÇÕES
        ══════════════════════════════════════ */}
        {tab === "recordings" && (
          filtered.length === 0 ? (
            <div style={{ ...CARD, padding: "52px 24px", textAlign: "center" }}>
              <p style={{ fontSize: 34, margin: "0 0 10px" }}>🎬</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", margin: "0 0 6px" }}>Sem gravações disponíveis</p>
              <p style={{ fontSize: 13, color: "#94a3b8" }}>As gravações aparecem aqui após as aulas terminarem e o URL ser guardado.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
              {filtered.map(lc => {
                const embedUrl = lc.recordingUrl ? getEmbedUrl(lc.recordingUrl) : null;
                return (
                  <div key={lc.id} style={{ ...CARD, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                    {/* Thumbnail / Preview */}
                    <div
                      onClick={() => setViewRecording(lc)}
                      style={{ position: "relative", background: "#0f172a", aspectRatio: "16/9", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {embedUrl?.includes("youtube") ? (
                        <img
                          src={`https://img.youtube.com/vi/${embedUrl.split("/embed/")[1]?.split("?")[0]}/hqdefault.jpg`}
                          alt={lc.topic}
                          style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.7 }}
                          onError={e => (e.currentTarget.style.display = "none")}
                        />
                      ) : null}
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(220,38,38,0.9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>▶</div>
                      </div>
                      <div style={{ position: "absolute", bottom: 8, left: 10, background: "rgba(0,0,0,0.7)", borderRadius: 6, padding: "2px 8px", fontSize: 11, color: "#fff", fontWeight: 600 }}>
                        {lc.duration} min
                      </div>
                    </div>

                    {/* Info */}
                    <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b", lineHeight: 1.35 }}>{lc.topic}</h3>
                      {lc.course && <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>📚 {lc.course.title}</p>}
                      <p style={{ margin: 0, fontSize: 11.5, color: "#94a3b8" }}>📅 {fmtDate(lc.scheduledAt)}</p>

                      <div style={{ display: "flex", gap: 6, marginTop: "auto" }}>
                        <button onClick={() => setViewRecording(lc)} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: "#0f172a", color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                          ▶ Ver Gravação
                        </button>
                        <a href={lc.recordingUrl!} target="_blank" rel="noreferrer"
                          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "transparent", fontSize: 12, color: "#64748b", textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                          ↗
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* ── Modals ── */}
      {viewRecording && <RecordingModal lc={viewRecording} onClose={() => setViewRecording(null)} />}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}


