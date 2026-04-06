"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Competency { id: number; name: string; }
interface Scenario {
  id: number; title: string; description: string;
  difficulty: string; maxScore: number; active: boolean;
  competency?: Competency;
}
interface Session {
  id: number; scenarioId: number; status: string;
  score?: number; feedback?: string;
  startedAt: string; completedAt?: string;
  scenario: Scenario & { competency?: Competency };
}
interface LeaderEntry {
  id: number; score: number;
  user: { id: number; fullName: string };
}

// ─── Maps ─────────────────────────────────────────────────────────────────────
const DIFFICULTY_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  EASY:   { label: "Fácil",   color: "#16a34a", bg: "#ecfdf5", icon: "🟢" },
  MEDIUM: { label: "Médio",   color: "#f59e0b", bg: "#fffbeb", icon: "🟡" },
  HARD:   { label: "Difícil", color: "#dc2626", bg: "#fef2f2", icon: "🔴" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  IN_PROGRESS: { label: "Em Progresso", color: "#f59e0b", bg: "#fffbeb" },
  COMPLETED:   { label: "Concluído",    color: "#16a34a", bg: "#ecfdf5" },
  FAILED:      { label: "Falhado",      color: "#dc2626", bg: "#fef2f2" },
};

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
      <p style={{ margin: 0, fontSize: 13, color: type === "success" ? "#16a34a" : "#dc2626", fontWeight: 600 }}>{msg}</p>
    </div>
  );
}

// ─── Score Bar ────────────────────────────────────────────────────────────────
function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? "#16a34a" : score >= 40 ? "#f59e0b" : "#dc2626";
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${score}%`, background: color, borderRadius: 3, transition: "width 0.6s" }} />
      </div>
      <p style={{ margin: "4px 0 0", fontSize: 12, color, fontWeight: 700 }}>{score} / 100</p>
    </div>
  );
}

// ─── Modal: Iniciar Simulação ─────────────────────────────────────────────────
function StartModal({ scenario, onClose, onStarted }: {
  scenario: Scenario; onClose: () => void; onStarted: (session: Session) => void;
}) {
  const [loading, setLoading] = useState(false);
  const diff = DIFFICULTY_CONFIG[scenario.difficulty] ?? { label: scenario.difficulty, color: "#64748b", bg: "#f8fafc", icon: "⚪" };

  async function start() {
    setLoading(true);
    try {
      const session = await api.post<Session>("/avatar-training/start", { scenarioId: scenario.id });
      onStarted(session);
      onClose();
    } catch (e: any) {
      alert(e.message ?? "Erro ao iniciar sessão");
    } finally { setLoading(false); }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500, background: "rgba(15,23,42,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }} onClick={onClose}>
      <div style={{ ...card, width: "100%", maxWidth: 460, boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1e293b" }}>🤖 Iniciar Simulação</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
        </div>

        <div style={{ padding: "16px 20px", background: "#f8fafc", borderRadius: 10, marginBottom: 20 }}>
          <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "#1e293b" }}>{scenario.title}</h3>
          <p style={{ margin: "0 0 12px", fontSize: 13, color: "#475569" }}>{scenario.description}</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: diff.bg, color: diff.color }}>
              {diff.icon} {diff.label}
            </span>
            {scenario.competency && (
              <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "#eff6ff", color: "#1e40af" }}>
                🧠 {scenario.competency.name}
              </span>
            )}
            <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "#fef3c7", color: "#92400e" }}>
              ⭐ Máx: {scenario.maxScore} pts
            </span>
          </div>
        </div>

        <div style={{ padding: "12px 16px", background: "#eff6ff", borderRadius: 8, marginBottom: 20, border: "1px solid #bfdbfe" }}>
          <p style={{ margin: 0, fontSize: 12, color: "#1e40af", fontWeight: 600 }}>
            ℹ️ Precisas de ≥ 70 pontos para ganhar pontos de gamificação. Boa sorte!
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={btnGhost}>Cancelar</button>
          <button onClick={start} disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}>
            {loading ? "A iniciar..." : "▶️ Iniciar Agora"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Concluir Sessão ───────────────────────────────────────────────────
function CompleteModal({ session, onClose, onCompleted }: {
  session: Session; onClose: () => void; onCompleted: () => void;
}) {
  const [score, setScore]       = useState(70);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading]   = useState(false);

  async function complete() {
    setLoading(true);
    try {
      await api.post(`/avatar-training/complete/${session.id}`, { score, feedback });
      onCompleted();
      onClose();
    } catch (e: any) {
      alert(e.message ?? "Erro ao concluir sessão");
    } finally { setLoading(false); }
  }

  const pts = score >= 70 ? Math.round(score / 10) : 0;
  const color = score >= 70 ? "#16a34a" : score >= 40 ? "#f59e0b" : "#dc2626";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500, background: "rgba(15,23,42,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }} onClick={onClose}>
      <div style={{ ...card, width: "100%", maxWidth: 460, boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1e293b" }}>🏁 Concluir Sessão</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
        </div>

        <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b" }}>
          Cenário: <strong>{session.scenario.title}</strong>
        </p>

        <div style={{ marginBottom: 20 }}>
          <span style={labelStyle}>Pontuação (0–100)</span>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <input type="range" min={0} max={100} value={score}
              onChange={e => setScore(+e.target.value)}
              style={{ flex: 1, accentColor: color }} />
            <span style={{ fontSize: 28, fontWeight: 800, color, minWidth: 48, textAlign: "right" }}>{score}</span>
          </div>
          <div style={{ height: 6, background: "#e2e8f0", borderRadius: 3, marginTop: 8, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${score}%`, background: color, borderRadius: 3, transition: "width 0.2s" }} />
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 12, color: "#64748b" }}>
            {score >= 70
              ? `✅ Aprovado — ganharás ${pts} pontos de gamificação`
              : "❌ Abaixo de 70 — sem pontos atribuídos"}
          </p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <span style={labelStyle}>Feedback (opcional)</span>
          <textarea style={{ ...inputStyle, height: 80, resize: "vertical" }}
            value={feedback} onChange={e => setFeedback(e.target.value)}
            placeholder="Descreve como correu a simulação..." />
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={btnGhost}>Cancelar</button>
          <button onClick={complete} disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}>
            {loading ? "A guardar..." : "✅ Concluir"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Leaderboard ───────────────────────────────────────────────────────
function LeaderboardModal({ scenario, onClose }: { scenario: Scenario; onClose: () => void }) {
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<LeaderEntry[]>(`/avatar-training/leaderboard/${scenario.id}`)
      .then(setEntries).finally(() => setLoading(false));
  }, [scenario.id]);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500, background: "rgba(15,23,42,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }} onClick={onClose}>
      <div style={{ ...card, width: "100%", maxWidth: 440, boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1e293b" }}>🏆 Leaderboard</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
        </div>
        <p style={{ margin: "0 0 20px", fontSize: 13, color: "#64748b" }}>{scenario.title}</p>

        {loading ? (
          <p style={{ textAlign: "center", color: "#94a3b8", padding: 24 }}>A carregar...</p>
        ) : entries.length === 0 ? (
          <p style={{ textAlign: "center", color: "#94a3b8", padding: 24 }}>Sem sessões concluídas ainda.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {entries.map((e, i) => (
              <div key={e.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px", borderRadius: 10,
                background: i === 0 ? "#fffbeb" : i === 1 ? "#f8fafc" : "#fff",
                border: `1px solid ${i === 0 ? "#fde68a" : "#e2e8f0"}`,
              }}>
                <span style={{ fontSize: 22, minWidth: 28 }}>{medals[i] ?? `#${i + 1}`}</span>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{e.user.fullName}</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: i === 0 ? "#f59e0b" : "#1e40af" }}>{e.score}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Scenario Card ────────────────────────────────────────────────────────────
function ScenarioCard({ scenario, onStart, onLeaderboard }: {
  scenario: Scenario; onStart: () => void; onLeaderboard: () => void;
}) {
  const diff = DIFFICULTY_CONFIG[scenario.difficulty] ?? { label: scenario.difficulty, color: "#64748b", bg: "#f8fafc", icon: "⚪" };

  return (
    <div style={{ ...card, display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12, background: diff.bg,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0,
        }}>🤖</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>{scenario.title}</h3>
          <p style={{ margin: 0, fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{scenario.description}</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: diff.bg, color: diff.color }}>
          {diff.icon} {diff.label}
        </span>
        {scenario.competency && (
          <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "#eff6ff", color: "#1e40af" }}>
            🧠 {scenario.competency.name}
          </span>
        )}
        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "#fef3c7", color: "#92400e" }}>
          ⭐ {scenario.maxScore} pts
        </span>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onStart} style={{ ...btnPrimary, flex: 1, textAlign: "center" }}>
          ▶️ Iniciar
        </button>
        <button onClick={onLeaderboard} style={{ ...btnGhost, padding: "10px 14px" }} title="Ver Ranking">
          🏆
        </button>
      </div>
    </div>
  );
}

// ─── History Card ─────────────────────────────────────────────────────────────
function HistoryCard({ session, onComplete }: { session: Session; onComplete: () => void }) {
  const st = STATUS_CONFIG[session.status] ?? { label: session.status, color: "#64748b", bg: "#f8fafc" };

  return (
    <div style={{ ...card, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
              {session.scenario.title}
            </p>
            <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: st.bg, color: st.color }}>
              {st.label}
            </span>
          </div>
          {session.scenario.competency && (
            <p style={{ margin: "0 0 4px", fontSize: 12, color: "#64748b" }}>
              🧠 {session.scenario.competency.name}
            </p>
          )}
          <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>
            {new Date(session.startedAt).toLocaleString("pt-PT")}
          </p>
        </div>

        <div style={{ textAlign: "right", flexShrink: 0 }}>
          {session.status === "COMPLETED" && session.score !== undefined ? (
            <div>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: session.score >= 70 ? "#16a34a" : "#dc2626" }}>
                {session.score}
              </p>
              <p style={{ margin: 0, fontSize: 10, color: "#94a3b8" }}>pontos</p>
            </div>
          ) : session.status === "IN_PROGRESS" ? (
            <button onClick={onComplete} style={{ ...btnPrimary, padding: "8px 14px", fontSize: 12 }}>
              🏁 Concluir
            </button>
          ) : null}
        </div>
      </div>

      {session.feedback && (
        <div style={{ marginTop: 10, padding: "8px 12px", background: "#f8fafc", borderRadius: 8 }}>
          <p style={{ margin: 0, fontSize: 12, color: "#475569", fontStyle: "italic" }}>"{session.feedback}"</p>
        </div>
      )}

      {session.status === "COMPLETED" && session.score !== undefined && (
        <ScoreBar score={session.score} />
      )}
    </div>
  );
}

// ─── Tab ─────────────────────────────────────────────────────────────────────
type Tab = "scenarios" | "history";

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function AvatarTrainingPage() {
  const [tab, setTab]           = useState<Tab>("scenarios");
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [history, setHistory]   = useState<Session[]>([]);
  const [loading, setLoading]   = useState(true);
  const [startTarget, setStartTarget] = useState<Scenario | null>(null);
  const [completeTarget, setCompleteTarget] = useState<Session | null>(null);
  const [leaderTarget, setLeaderTarget] = useState<Scenario | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error") { setToast({ msg, type }); }

  async function fetchAll() {
    setLoading(true);
    try {
      const [sc, hi] = await Promise.all([
        api.get<Scenario[]>("/avatar-training/scenarios"),
        api.get<Session[]>("/avatar-training/my-history"),
      ]);
      setScenarios(sc);
      setHistory(hi);
    } catch (e: any) {
      showToast(e.message ?? "Erro ao carregar dados", "error");
    } finally { setLoading(false); }
  }

  useEffect(() => { fetchAll(); }, []);

  const completedSessions = history.filter(h => h.status === "COMPLETED");
  const inProgressSessions = history.filter(h => h.status === "IN_PROGRESS");
  const avgScore = completedSessions.length
    ? Math.round(completedSessions.reduce((s, h) => s + (h.score ?? 0), 0) / completedSessions.length)
    : 0;

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", margin: 0 }}>
          🤖 Avatar Training
        </h1>
        <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
          Simulações interactivas para desenvolver competências
        </p>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Cenários",         value: scenarios.length, icon: "🎮", color: "#1e40af", bg: "#eff6ff" },
          { label: "Sessões Concluídas", value: completedSessions.length, icon: "✅", color: "#16a34a", bg: "#ecfdf5" },
          { label: "Em Progresso",     value: inProgressSessions.length, icon: "⏳", color: "#f59e0b", bg: "#fffbeb" },
          { label: "Média de Pontos",  value: avgScore, icon: "⭐", color: "#7c3aed", bg: "#f5f3ff" },
        ].map(s => (
          <div key={s.label} style={{ ...card, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: s.bg, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
            }}>{s.icon}</div>
            <div>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</p>
              <p style={{ margin: 0, fontSize: 11, color: "#64748b", fontWeight: 600 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 10, padding: 4, marginBottom: 24, width: "fit-content" }}>
        {([
          { key: "scenarios", label: "🎮 Cenários" },
          { key: "history",   label: "📋 Histórico" },
        ] as { key: Tab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: "8px 20px", border: "none", cursor: "pointer", fontSize: 13,
            fontWeight: tab === t.key ? 700 : 500, borderRadius: 8,
            background: tab === t.key ? "#1e40af" : "transparent",
            color: tab === t.key ? "#fff" : "#64748b", transition: "all 0.15s",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── Conteúdo ── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#94a3b8", fontSize: 14 }}>
          A carregar...
        </div>
      ) : tab === "scenarios" ? (
        scenarios.length === 0 ? (
          <div style={{ ...card, textAlign: "center", padding: 60 }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>🤖</p>
            <p style={{ color: "#94a3b8", fontSize: 14, margin: 0 }}>Nenhum cenário disponível de momento.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {scenarios.map(s => (
              <ScenarioCard key={s.id} scenario={s}
                onStart={() => setStartTarget(s)}
                onLeaderboard={() => setLeaderTarget(s)} />
            ))}
          </div>
        )
      ) : (
        history.length === 0 ? (
          <div style={{ ...card, textAlign: "center", padding: 60 }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>📋</p>
            <p style={{ color: "#94a3b8", fontSize: 14, margin: 0 }}>Ainda não tens sessões. Inicia um cenário!</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {history.map(h => (
              <HistoryCard key={h.id} session={h}
                onComplete={() => setCompleteTarget(h)} />
            ))}
          </div>
        )
      )}

      {/* ── Modais ── */}
      {startTarget && (
        <StartModal scenario={startTarget} onClose={() => setStartTarget(null)}
          onStarted={() => { fetchAll(); showToast("Sessão iniciada!", "success"); }} />
      )}
      {completeTarget && (
        <CompleteModal session={completeTarget} onClose={() => setCompleteTarget(null)}
          onCompleted={() => { fetchAll(); showToast("Sessão concluída com sucesso!", "success"); }} />
      )}
      {leaderTarget && (
        <LeaderboardModal scenario={leaderTarget} onClose={() => setLeaderTarget(null)} />
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}