"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Session {
  id: number;
  courseId?: number;
  startedAt: string;
  endedAt?: string;
  course?: { id: number; title: string };
  _count?: { messages: number };
}

interface Message {
  id: number;
  role: "USER" | "ASSISTANT";
  content: string;
  tokensUsed?: number;
  createdAt: string;
}

interface SessionDetail extends Session {
  messages: Message[];
}

interface Provider {
  provider: string;
  model?: string;
  free?: boolean;
}

interface Stats {
  totalSessions: number;
  totalMessages: number;
  totalTokensUsed: number;
  currentProvider: Provider;
  cost: string;
}

interface Course { id: number; title: string }

// ─── Shared Styles ────────────────────────────────────────────────────────────
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

// ─── Modal: Nova Sessão ───────────────────────────────────────────────────────
function ModalNovaSessao({ courses, onClose, onStart }: {
  courses: Course[]; onClose: () => void;
  onStart: (session: any, greeting: string, provider: Provider) => void;
}) {
  const [courseId, setCourseId] = useState("");
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setErr("");
    try {
      // POST /ai-tutor/sessions — StartAiSessionDto: { courseId? }
      const res = await api.post<any>("/ai-tutor/sessions", {
        ...(courseId ? { courseId: +courseId } : {}),
      });
      onStart(res.session, res.greeting, res.provider);
    } catch (e: any) { setErr(e.message ?? "Erro ao iniciar sessão"); }
    finally { setSaving(false); }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200,
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, padding: 32, width: 440,
        boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: 0 }}>Nova Sessão com AI Tutor</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#94a3b8" }}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div style={{ marginBottom: 20 }}>
            <span style={labelStyle}>Curso (opcional)</span>
            <select value={courseId} onChange={e => setCourseId(e.target.value)} style={inputStyle}>
              <option value="">Sem contexto de curso (geral)</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>
              Seleccionar um curso dá contexto ao tutor para respostas mais relevantes.
            </p>
          </div>
          {err && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 12 }}>{err}</p>}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={btnGhost}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>
              {saving ? "A iniciar..." : "🤖 Iniciar Sessão"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Chat View ────────────────────────────────────────────────────────────────
function ChatView({ session, greeting, provider, onEnd, onBack }: {
  session: Session;
  greeting: string;
  provider: Provider;
  onEnd: () => void;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState("");
  const [sending, setSending]   = useState(false);
  const [ended, setEnded]       = useState(!!session.endedAt);
  const bottomRef               = useRef<HTMLDivElement>(null);

  // Mensagem de boas vindas do sistema
  useEffect(() => {
    if (greeting) {
      setMessages([{
        id: 0, role: "ASSISTANT", content: greeting,
        createdAt: new Date().toISOString(),
      }]);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function send() {
    if (!input.trim() || sending || ended) return;
    const userMsg: Message = {
      id: Date.now(), role: "USER", content: input,
      createdAt: new Date().toISOString(),
    };
    setMessages(m => [...m, userMsg]);
    setInput("");
    setSending(true);
    try {
      // POST /ai-tutor/sessions/message — SendAiMessageDto: { sessionId, message }
      const res = await api.post<any>("/ai-tutor/sessions/message", {
        sessionId: session.id,
        message: userMsg.content,
      });
      setMessages(m => [...m, {
        id: res.message.id,
        role: "ASSISTANT",
        content: res.message.content,
        tokensUsed: res.message.tokensUsed,
        createdAt: res.message.createdAt,
      }]);
    } catch (e: any) {
      setMessages(m => [...m, {
        id: Date.now(), role: "ASSISTANT",
        content: `Erro: ${e.message ?? "Não foi possível obter resposta"}`,
        createdAt: new Date().toISOString(),
      }]);
    } finally { setSending(false); }
  }

  async function encerrar() {
    if (!confirm("Encerrar esta sessão?")) return;
    try {
      // PATCH /ai-tutor/sessions/:id/end
      await api.patch(`/ai-tutor/sessions/${session.id}/end`, {});
      setEnded(true);
      onEnd();
    } catch (e: any) { alert(e.message); }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 140px)" }}>
      {/* Header do chat */}
      <div style={{
        background: "#fff", borderRadius: "12px 12px 0 0", border: "1px solid #e2e8f0",
        borderBottom: "none", padding: "14px 20px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onBack} style={{ ...btnGhost, padding: "6px 12px", fontSize: 12 }}>
            ← Voltar
          </button>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: ended ? "#94a3b8" : "#22c55e",
              }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>
                {session.course?.title ? `AI Tutor — ${session.course.title}` : "AI Tutor — Geral"}
              </span>
            </div>
            <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>
              {provider.provider} {provider.model ? `· ${provider.model}` : ""} · {provider.free ? "Gratuito" : ""}
            </p>
          </div>
        </div>
        {!ended && (
          <button onClick={encerrar} style={{
            padding: "6px 14px", background: "#fef2f2", color: "#dc2626",
            border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>
            Encerrar Sessão
          </button>
        )}
        {ended && (
          <span style={{
            padding: "4px 12px", background: "#f1f5f9", color: "#64748b",
            borderRadius: 20, fontSize: 11, fontWeight: 600,
          }}>Sessão encerrada</span>
        )}
      </div>

      {/* Mensagens */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "20px",
        background: "#f8fafc", border: "1px solid #e2e8f0", borderTop: "none", borderBottom: "none",
      }}>
        {messages.map((msg, i) => (
          <div key={msg.id ?? i} style={{
            display: "flex", justifyContent: msg.role === "USER" ? "flex-end" : "flex-start",
            marginBottom: 16,
          }}>
            {msg.role === "ASSISTANT" && (
              <div style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0, marginRight: 10,
                background: "linear-gradient(135deg, #1e40af, #6366f1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14,
              }}>🤖</div>
            )}
            <div style={{ maxWidth: "70%" }}>
              <div style={{
                background: msg.role === "USER" ? "#1e40af" : "#fff",
                color: msg.role === "USER" ? "#fff" : "#1e293b",
                padding: "12px 16px", borderRadius: msg.role === "USER"
                  ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                fontSize: 14, lineHeight: 1.6,
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                border: msg.role === "ASSISTANT" ? "1px solid #e2e8f0" : "none",
                whiteSpace: "pre-wrap",
              }}>
                {msg.content}
              </div>
              <div style={{
                fontSize: 10, color: "#94a3b8", marginTop: 4,
                textAlign: msg.role === "USER" ? "right" : "left",
              }}>
                {new Date(msg.createdAt).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                {msg.tokensUsed ? ` · ${msg.tokensUsed} tokens` : ""}
              </div>
            </div>
            {msg.role === "USER" && (
              <div style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0, marginLeft: 10,
                background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
              }}>👤</div>
            )}
          </div>
        ))}

        {/* Indicador de typing */}
        {sending && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, #1e40af, #6366f1)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
            }}>🤖</div>
            <div style={{
              background: "#fff", border: "1px solid #e2e8f0", borderRadius: "16px 16px 16px 4px",
              padding: "12px 16px", display: "flex", gap: 4, alignItems: "center",
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: "50%", background: "#94a3b8",
                  animation: `bounce 1s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        background: "#fff", border: "1px solid #e2e8f0", borderRadius: "0 0 12px 12px",
        padding: "12px 16px", display: "flex", gap: 10, alignItems: "flex-end",
      }}>
        {ended ? (
          <p style={{ flex: 1, color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "10px 0", margin: 0 }}>
            Esta sessão foi encerrada. Inicia uma nova sessão para continuar.
          </p>
        ) : (
          <>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Escreve a tua pergunta... (Enter para enviar, Shift+Enter para nova linha)"
              rows={2}
              style={{
                flex: 1, resize: "none", border: "1.5px solid #e2e8f0", borderRadius: 10,
                padding: "10px 14px", fontSize: 14, color: "#1e293b", outline: "none",
                fontFamily: "inherit", lineHeight: 1.5,
              }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || sending}
              style={{
                ...btnPrimary, padding: "12px 20px", borderRadius: 10, fontSize: 20,
                opacity: !input.trim() || sending ? 0.5 : 1,
              }}
            >
              ↑
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}

// ─── Session Card ─────────────────────────────────────────────────────────────
function SessionCard({ session, onOpen }: { session: Session; onOpen: () => void }) {
  const isActive = !session.endedAt;
  return (
    <div
      onClick={onOpen}
      style={{
        background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0",
        padding: "14px 16px", cursor: "pointer", transition: "all 0.15s",
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "#1e40af")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "#e2e8f0")}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 16 }}>🤖</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
              {session.course?.title ?? "Sessão Geral"}
            </span>
          </div>
          <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
            {session._count?.messages ?? 0} mensagens ·{" "}
            {new Date(session.startedAt).toLocaleDateString("pt-PT")}
          </p>
        </div>
        <span style={{
          padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700,
          background: isActive ? "#f0fdf4" : "#f1f5f9",
          color: isActive ? "#16a34a" : "#94a3b8",
        }}>
          {isActive ? "● Activa" : "Encerrada"}
        </span>
      </div>
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function AiTutorPage() {
  const [sessions, setSessions]     = useState<Session[]>([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [courses, setCourses]       = useState<Course[]>([]);
  const [provider, setProvider]     = useState<Provider | null>(null);
  const [stats, setStats]           = useState<Stats | null>(null);
  const [modalNova, setModalNova]   = useState(false);

  // Estado do chat activo
  const [activeSession, setActiveSession]   = useState<Session | null>(null);
  const [activeGreeting, setActiveGreeting] = useState("");
  const [activeProvider, setActiveProvider] = useState<Provider>({ provider: "AI" });

  const LIMIT = 10;

  function loadSessions(p = 1) {
    setLoading(true);
    // GET /ai-tutor/sessions
    api.get<any>(`/ai-tutor/sessions?page=${p}&limit=${LIMIT}`)
      .then(res => {
        setSessions(res?.data ?? []);
        setTotal(res?.total ?? 0);
        setTotalPages(res?.totalPages ?? 1);
        setPage(p);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }

  async function openSession(session: Session) {
    try {
      // GET /ai-tutor/sessions/:id
      const detail = await api.get<SessionDetail>(`/ai-tutor/sessions/${session.id}`);
      setActiveSession(detail);
      setActiveGreeting("");
      setActiveProvider(provider ?? { provider: "AI" });
    } catch (e: any) { alert(e.message); }
  }

  useEffect(() => {
    loadSessions(1);
    // GET /ai-tutor/provider
    api.get<Provider>("/ai-tutor/provider").then(setProvider).catch(() => {});
    // GET /ai-tutor/stats
    api.get<Stats>("/ai-tutor/stats").then(setStats).catch(() => {});
    // Cursos para o modal
    api.get<any>("/courses?limit=200").then(r => setCourses(r?.data ?? [])).catch(() => {});
  }, []);

  // Se está em modo chat
  if (activeSession) {
    return (
      <ChatView
        session={activeSession}
        greeting={activeGreeting}
        provider={activeProvider}
        onEnd={() => loadSessions(1)}
        onBack={() => { setActiveSession(null); loadSessions(1); }}
      />
    );
  }

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", margin: 0 }}>
            🤖 AI Tutor
          </h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
            Tutor com Inteligência Artificial — {provider ? `${provider.provider} · Gratuito` : "A carregar..."}
          </p>
        </div>
        <button onClick={() => setModalNova(true)} style={{ ...btnPrimary, fontSize: 13 }}>
          + Nova Sessão
        </button>
      </div>

      {/* ── Stats ── */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total Sessões",  value: stats.totalSessions,   color: "#1e40af", bg: "#eff6ff" },
            { label: "Mensagens",      value: stats.totalMessages,    color: "#8b5cf6", bg: "#f5f3ff" },
            { label: "Tokens Usados",  value: stats.totalTokensUsed,  color: "#0891b2", bg: "#ecfeff" },
            { label: "Custo",          value: "GRÁTIS 🎉",            color: "#16a34a", bg: "#f0fdf4" },
          ].map(s => (
            <div key={s.label} style={{
              background: s.bg, borderRadius: 10, padding: "14px 18px",
              border: `1px solid ${s.color}22`,
            }}>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: s.color, textTransform: "uppercase", letterSpacing: 0.8 }}>
                {s.label}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: s.label === "Custo" ? 16 : 24, fontWeight: 800, color: s.color }}>
                {typeof s.value === "number" ? s.value.toLocaleString("pt-PT") : s.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Provider Info ── */}
      {provider && (
        <div style={{
          background: "linear-gradient(135deg, #1e40af08, #6366f108)",
          border: "1px solid #1e40af22", borderRadius: 12, padding: "16px 20px",
          marginBottom: 24, display: "flex", alignItems: "center", gap: 16,
        }}>
          <span style={{ fontSize: 28 }}>🤖</span>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
              Fornecedor Activo: {provider.provider}
              {provider.model && <span style={{ color: "#64748b", fontWeight: 400 }}> · {provider.model}</span>}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#16a34a", fontWeight: 600 }}>
              ✓ Sem custo de API — utilização gratuita
            </p>
          </div>
        </div>
      )}

      {/* ── Erro ── */}
      {error && (
        <div style={{
          background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8,
          padding: 14, color: "#dc2626", fontSize: 13, marginBottom: 16,
        }}>{error}</div>
      )}

      {/* ── Lista de Sessões ── */}
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", margin: 0 }}>
          As Minhas Sessões <span style={{ color: "#94a3b8", fontWeight: 400, fontSize: 14 }}>({total})</span>
        </h2>
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
          A carregar sessões...
        </div>
      ) : sessions.length === 0 ? (
        <div style={{
          padding: 60, textAlign: "center", background: "#fff",
          borderRadius: 12, border: "1px solid #e2e8f0",
        }}>
          <p style={{ fontSize: 40, margin: "0 0 12px" }}>🤖</p>
          <p style={{ fontSize: 16, fontWeight: 600, color: "#1e293b", margin: "0 0 8px" }}>
            Ainda sem sessões
          </p>
          <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 20px" }}>
            Inicia a tua primeira sessão com o AI Tutor
          </p>
          <button onClick={() => setModalNova(true)} style={btnPrimary}>
            + Nova Sessão
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
          {sessions.map(s => (
            <SessionCard key={s.id} session={s} onOpen={() => openSession(s)} />
          ))}
        </div>
      )}

      {/* ── Paginação ── */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
          <button onClick={() => loadSessions(page - 1)} disabled={page === 1}
            style={{ ...btnGhost, padding: "8px 16px", opacity: page === 1 ? 0.4 : 1 }}>
            ← Anterior
          </button>
          <span style={{ fontSize: 13, color: "#64748b", padding: "8px 16px" }}>
            {page} / {totalPages}
          </span>
          <button onClick={() => loadSessions(page + 1)} disabled={page === totalPages}
            style={{ ...btnGhost, padding: "8px 16px", opacity: page === totalPages ? 0.4 : 1 }}>
            Seguinte →
          </button>
        </div>
      )}

      {/* ── Modal Nova Sessão ── */}
      {modalNova && (
        <ModalNovaSessao
          courses={courses}
          onClose={() => setModalNova(false)}
          onStart={(session, greeting, prov) => {
            setModalNova(false);
            setActiveSession(session);
            setActiveGreeting(greeting);
            setActiveProvider(prov);
            loadSessions(1);
          }}
        />
      )}
    </div>
  );
}