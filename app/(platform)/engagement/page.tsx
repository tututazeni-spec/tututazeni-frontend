"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Question { id: number; text: string; type: string; order: number; }
interface Survey {
  id: number; title: string; description?: string; status: string;
  endDate?: string; createdAt: string;
  questions?: Question[];
  _count?: { responses: number; questions: number };
}
interface SurveyResults {
  survey: { id: number; title: string };
  totalResponses: number; avgScore: number;
  questionStats: { question: string; avgScore: number; responses: number }[];
}
interface EngagementIndex {
  currentIndex: number; trend: number;
  history: { surveyId: number; title: string; date: string; avgScore: number; responses: number }[];
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const card: React.CSSProperties = { background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: 24 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, color: "#1e293b", background: "#fff", outline: "none", boxSizing: "border-box" };
const labelStyle: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#64748b", marginBottom: 6 };
const btnPrimary: React.CSSProperties = { padding: "10px 20px", background: "#1e40af", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" };
const btnGhost: React.CSSProperties = { padding: "8px 14px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" };

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

// ─── Score Gauge ──────────────────────────────────────────────────────────────
function ScoreGauge({ score, max = 5, size = 100 }: { score: number; max?: number; size?: number }) {
  const pct = score / max;
  const color = pct >= 0.8 ? "#16a34a" : pct >= 0.6 ? "#1e40af" : pct >= 0.4 ? "#f59e0b" : "#dc2626";
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - pct * circ;
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={8} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} style={{ transition: "stroke-dashoffset 0.6s" }} />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" style={{ fontSize: size * 0.22, fontWeight: 800, fill: color }}>{score.toFixed(1)}</text>
    </svg>
  );
}

// ─── Modal: Criar Inquérito ───────────────────────────────────────────────────
function CreateSurveyModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [endDate, setEndDate] = useState("");
  const [questions, setQuestions] = useState([{ text: "", type: "RATING", order: 1 }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function addQuestion() { setQuestions(q => [...q, { text: "", type: "RATING", order: q.length + 1 }]); }
  function removeQuestion(i: number) { setQuestions(q => q.filter((_, idx) => idx !== i).map((q, idx) => ({ ...q, order: idx + 1 }))); }
  function setQ(i: number, k: string, v: string) { setQuestions(q => q.map((item, idx) => idx === i ? { ...item, [k]: v } : item)); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (questions.some(q => !q.text)) { setError("Todas as perguntas precisam de texto."); return; }
    setSaving(true); setError("");
    try {
      await api.post("/engagement/surveys", { title, description: description || undefined, endDate: endDate || undefined, questions });
      onCreated(); onClose();
    } catch (e: any) { setError(e.message ?? "Erro ao criar inquérito"); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ ...card, width: "100%", maxWidth: 560, maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1e293b" }}>📋 Novo Inquérito</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
        </div>
        <form onSubmit={submit}>
          <div style={{ marginBottom: 14 }}><span style={labelStyle}>Título *</span><input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Inquérito de Satisfação Q2 2026" required /></div>
          <div style={{ marginBottom: 14 }}><span style={labelStyle}>Descrição</span><textarea style={{ ...inputStyle, height: 60, resize: "vertical" }} value={description} onChange={e => setDescription(e.target.value)} /></div>
          <div style={{ marginBottom: 20 }}><span style={labelStyle}>Data de Fecho</span><input style={inputStyle} type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>

          <div style={{ marginBottom: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={labelStyle}>Perguntas *</span>
              <button type="button" onClick={addQuestion} style={{ ...btnGhost, padding: "5px 10px", fontSize: 12 }}>+ Pergunta</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {questions.map((q, i) => (
                <div key={i} style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", minWidth: 20 }}>{i + 1}.</span>
                    <input style={{ ...inputStyle, fontSize: 13 }} value={q.text} onChange={e => setQ(i, "text", e.target.value)} placeholder="Texto da pergunta..." required />
                    <select style={{ ...inputStyle, maxWidth: 110, fontSize: 12 }} value={q.type} onChange={e => setQ(i, "type", e.target.value)}>
                      <option value="RATING">Classificação</option>
                      <option value="TEXT">Texto</option>
                      <option value="YESNO">Sim/Não</option>
                    </select>
                    {questions.length > 1 && <button type="button" onClick={() => removeQuestion(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: 16, flexShrink: 0 }}>×</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", margin: "14px 0" }}><p style={{ margin: 0, fontSize: 13, color: "#dc2626" }}>{error}</p></div>}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
            <button type="button" onClick={onClose} style={btnGhost}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>{saving ? "A criar..." : "Criar Inquérito"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal: Responder Inquérito ───────────────────────────────────────────────
function RespondModal({ survey, onClose, onResponded }: { survey: Survey; onClose: () => void; onResponded: () => void }) {
  const [detail, setDetail] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<Record<number, { value: number; comment: string }>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { api.get<Survey>(`/engagement/surveys/${survey.id}`).then(setDetail).catch(() => {}); }, [survey.id]);

  function setAnswer(qId: number, value: number) { setAnswers(a => ({ ...a, [qId]: { value, comment: a[qId]?.comment ?? "" } })); }
  function setComment(qId: number, comment: string) { setAnswers(a => ({ ...a, [qId]: { value: a[qId]?.value ?? 3, comment } })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const qs = detail?.questions ?? [];
    const missing = qs.filter(q => !answers[q.id]);
    if (missing.length) { setError(`Responde a todas as ${qs.length} perguntas.`); return; }
    setSaving(true); setError("");
    try {
      const payload = { surveyId: survey.id, answers: Object.entries(answers).map(([qId, a]) => ({ questionId: +qId, value: a.value, comment: a.comment || undefined })) };
      const res = await api.post<any>("/engagement/surveys/respond", payload);
      if (res.alreadySubmitted) { onClose(); return; }
      onResponded(); onClose();
    } catch (e: any) { setError(e.message ?? "Erro ao submeter"); }
    finally { setSaving(false); }
  }

  const questions = detail?.questions ?? [];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ ...card, width: "100%", maxWidth: 540, maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1e293b" }}>📝 {survey.title}</h2>
            {survey.description && <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>{survey.description}</p>}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
        </div>

        {!detail ? <p style={{ textAlign: "center", color: "#94a3b8", padding: 20 }}>A carregar perguntas...</p> : (
          <form onSubmit={submit}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
              {questions.map((q, i) => (
                <div key={q.id} style={{ padding: "16px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                  <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{i + 1}. {q.text}</p>
                  {q.type === "RATING" && (
                    <div>
                      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        {[1, 2, 3, 4, 5].map(n => (
                          <button key={n} type="button" onClick={() => setAnswer(q.id, n)} style={{ flex: 1, padding: "10px 0", border: `2px solid ${answers[q.id]?.value === n ? "#1e40af" : "#e2e8f0"}`, borderRadius: 8, background: answers[q.id]?.value === n ? "#eff6ff" : "#fff", color: answers[q.id]?.value === n ? "#1e40af" : "#94a3b8", fontWeight: answers[q.id]?.value === n ? 800 : 500, cursor: "pointer", fontSize: 16 }}>
                            {n}
                          </button>
                        ))}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 10, color: "#94a3b8" }}>Discordo totalmente</span>
                        <span style={{ fontSize: 10, color: "#94a3b8" }}>Concordo totalmente</span>
                      </div>
                    </div>
                  )}
                  {q.type === "YESNO" && (
                    <div style={{ display: "flex", gap: 10 }}>
                      {[[1, "✅ Sim"], [0, "❌ Não"]].map(([v, l]) => (
                        <button key={v} type="button" onClick={() => setAnswer(q.id, +v)} style={{ flex: 1, padding: "10px", border: `2px solid ${answers[q.id]?.value === +v ? "#1e40af" : "#e2e8f0"}`, borderRadius: 8, background: answers[q.id]?.value === +v ? "#eff6ff" : "#fff", color: answers[q.id]?.value === +v ? "#1e40af" : "#475569", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>{l}</button>
                      ))}
                    </div>
                  )}
                  {q.type === "TEXT" && (
                    <div>
                      <input type="hidden" value={answers[q.id]?.value ?? 3} onChange={() => {}} />
                      {!answers[q.id] && <button type="button" onClick={() => setAnswer(q.id, 3)} style={{ display: "none" }} />}
                      <textarea style={{ ...inputStyle, height: 64, resize: "vertical" }} value={answers[q.id]?.comment ?? ""} onChange={e => { setAnswer(q.id, 3); setComment(q.id, e.target.value); }} placeholder="A tua resposta..." onClick={() => !answers[q.id] && setAnswer(q.id, 3)} />
                    </div>
                  )}
                  <div style={{ marginTop: 8 }}>
                    <input style={{ ...inputStyle, fontSize: 12, padding: "6px 10px" }} value={answers[q.id]?.comment ?? ""} onChange={e => setComment(q.id, e.target.value)} placeholder="Comentário opcional..." />
                  </div>
                </div>
              ))}
            </div>
            {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}><p style={{ margin: 0, fontSize: 13, color: "#dc2626" }}>{error}</p></div>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" onClick={onClose} style={btnGhost}>Cancelar</button>
              <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>{saving ? "A submeter..." : "Submeter Respostas"}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Modal: Resultados ────────────────────────────────────────────────────────
function ResultsModal({ surveyId, onClose }: { surveyId: number; onClose: () => void }) {
  const [results, setResults] = useState<SurveyResults | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get<SurveyResults>(`/engagement/surveys/${surveyId}/results`).then(setResults).catch(() => {}).finally(() => setLoading(false)); }, [surveyId]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ ...card, width: "100%", maxWidth: 540, maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1e293b" }}>📊 Resultados</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
        </div>
        {loading ? <p style={{ textAlign: "center", color: "#94a3b8", padding: 24 }}>A carregar...</p> :
          !results ? <p style={{ textAlign: "center", color: "#94a3b8" }}>Sem resultados disponíveis.</p> : (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "16px 20px", background: "#eff6ff", borderRadius: 12, marginBottom: 20, border: "1px solid #bfdbfe" }}>
                <ScoreGauge score={results.avgScore} />
                <div>
                  <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#1e293b" }}>{results.survey.title}</h3>
                  <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>{results.totalResponses} resposta(s)</p>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#1e40af", fontWeight: 600 }}>Média geral: {results.avgScore}/5</p>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {results.questionStats.map((qs, i) => {
                  const pct = (qs.avgScore / 5) * 100;
                  const color = pct >= 80 ? "#16a34a" : pct >= 60 ? "#1e40af" : pct >= 40 ? "#f59e0b" : "#dc2626";
                  return (
                    <div key={i} style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e293b", flex: 1 }}>{i + 1}. {qs.question}</p>
                        <span style={{ fontSize: 14, fontWeight: 800, color, marginLeft: 12 }}>{qs.avgScore}</span>
                      </div>
                      <div style={{ height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.5s" }} />
                      </div>
                      <p style={{ margin: "4px 0 0", fontSize: 11, color: "#94a3b8" }}>{qs.responses} resposta(s)</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
      </div>
    </div>
  );
}

// ─── Survey Card ──────────────────────────────────────────────────────────────
function SurveyCard({ survey, onRespond, onResults }: { survey: Survey; onRespond: () => void; onResults: () => void }) {
  const isActive = survey.status === "ACTIVE";
  return (
    <div style={{ ...card, borderLeft: `4px solid ${isActive ? "#1e40af" : "#94a3b8"}` }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: isActive ? "#eff6ff" : "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>📋</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{survey.title}</h3>
            <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: isActive ? "#eff6ff" : "#f8fafc", color: isActive ? "#1e40af" : "#94a3b8" }}>{survey.status}</span>
          </div>
          {survey.description && <p style={{ margin: "0 0 6px", fontSize: 12, color: "#64748b" }}>{survey.description}</p>}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {survey._count && <span style={{ fontSize: 11, color: "#94a3b8" }}>📝 {survey._count.questions} perguntas</span>}
            {survey._count && <span style={{ fontSize: 11, color: "#94a3b8" }}>👥 {survey._count.responses} respostas</span>}
            {survey.endDate && <span style={{ fontSize: 11, color: "#94a3b8" }}>📅 Até {new Date(survey.endDate).toLocaleDateString("pt-PT")}</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button onClick={onResults} style={btnGhost}>📊 Resultados</button>
          {isActive && <button onClick={onRespond} style={btnPrimary}>📝 Responder</button>}
        </div>
      </div>
    </div>
  );
}

// ─── Tab ─────────────────────────────────────────────────────────────────────
type Tab = "active" | "all" | "index";

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function EngagementPage() {
  const [tab, setTab] = useState<Tab>("active");
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [allSurveys, setAllSurveys] = useState<Survey[]>([]);
  const [engIndex, setEngIndex] = useState<EngagementIndex | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [respondTarget, setRespondTarget] = useState<Survey | null>(null);
  const [resultsTarget, setResultsTarget] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error") { setToast({ msg, type }); }

  async function fetchAll() {
    setLoading(true);
    try {
      const [active, all, idx] = await Promise.all([
        api.get<Survey[]>("/engagement/surveys"),
        api.get<Survey[]>("/engagement/surveys/all").catch(() => []),
        api.get<EngagementIndex>("/engagement/index").catch(() => null),
      ]);
      setSurveys(active); setAllSurveys(all); setEngIndex(idx);
    } catch (e: any) { showToast(e.message ?? "Erro", "error"); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchAll(); }, []);

  const displayed = tab === "active" ? surveys : tab === "all" ? allSurveys : [];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", margin: 0 }}>💬 Engagement</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Inquéritos de satisfação e índice de engajamento</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={btnPrimary}>+ Novo Inquérito</button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 10, padding: 4, marginBottom: 24, width: "fit-content" }}>
        {([
          ["active", `📋 Activos (${surveys.length})`],
          ["all",    `📂 Todos (${allSurveys.length})`],
          ["index",  "📈 Índice de Engagement"],
        ] as [Tab, string][]).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding: "8px 18px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: tab === k ? 700 : 500, borderRadius: 8, background: tab === k ? "#1e40af" : "transparent", color: tab === k ? "#fff" : "#64748b", transition: "all 0.15s" }}>{l}</button>
        ))}
      </div>

      {loading ? <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>A carregar...</div> : (

        /* ── ÍNDICE DE ENGAGEMENT ── */
        tab === "index" ? (
          !engIndex ? <div style={{ ...card, textAlign: "center", padding: 60 }}><p style={{ color: "#94a3b8" }}>Sem dados de índice disponíveis. Completa alguns inquéritos primeiro.</p></div> : (
            <div>
              {/* Score principal */}
              <div style={{ ...card, marginBottom: 24, display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap", background: engIndex.currentIndex >= 4 ? "linear-gradient(135deg,#ecfdf5,#d1fae5)" : engIndex.currentIndex >= 3 ? "linear-gradient(135deg,#eff6ff,#dbeafe)" : "linear-gradient(135deg,#fffbeb,#fef3c7)", border: "none" }}>
                <ScoreGauge score={engIndex.currentIndex} size={120} />
                <div>
                  <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, color: "#1e293b" }}>Índice de Engagement</h2>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: "#1e293b" }}>{engIndex.currentIndex}/5</span>
                    <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 700, background: engIndex.trend >= 0 ? "#ecfdf5" : "#fef2f2", color: engIndex.trend >= 0 ? "#16a34a" : "#dc2626" }}>
                      {engIndex.trend >= 0 ? "▲" : "▼"} {Math.abs(engIndex.trend)} vs anterior
                    </span>
                  </div>
                  <p style={{ margin: "6px 0 0", fontSize: 13, color: "#64748b" }}>Baseado nos últimos {engIndex.history.length} inquérito(s) concluído(s)</p>
                </div>
              </div>

              {/* Histórico */}
              {engIndex.history.length > 0 && (
                <div style={card}>
                  <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>📈 Histórico de Inquéritos</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {engIndex.history.map((h, i) => {
                      const pct = (h.avgScore / 5) * 100;
                      const color = pct >= 80 ? "#16a34a" : pct >= 60 ? "#1e40af" : pct >= 40 ? "#f59e0b" : "#dc2626";
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 14px", background: "#f8fafc", borderRadius: 10 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.title}</p>
                            <div style={{ display: "flex", gap: 8 }}>
                              <span style={{ fontSize: 11, color: "#94a3b8" }}>📅 {new Date(h.date).toLocaleDateString("pt-PT")}</span>
                              <span style={{ fontSize: 11, color: "#94a3b8" }}>👥 {h.responses} respostas</span>
                            </div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color }}>{h.avgScore}</p>
                            <div style={{ height: 4, width: 80, background: "#e2e8f0", borderRadius: 2, overflow: "hidden", marginTop: 4 }}>
                              <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2 }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )

        /* ── LISTA INQUÉRITOS ── */
        ) : displayed.length === 0 ? (
          <div style={{ ...card, textAlign: "center", padding: 60 }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>📋</p>
            <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 16px" }}>{tab === "active" ? "Nenhum inquérito activo." : "Nenhum inquérito criado."}</p>
            <button onClick={() => setShowCreate(true)} style={btnPrimary}>+ Criar Inquérito</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {displayed.map(s => (
              <SurveyCard key={s.id} survey={s}
                onRespond={() => setRespondTarget(s)}
                onResults={() => setResultsTarget(s.id)} />
            ))}
          </div>
        )
      )}

      {/* Modais */}
      {showCreate && <CreateSurveyModal onClose={() => setShowCreate(false)} onCreated={() => { fetchAll(); showToast("Inquérito criado!", "success"); }} />}
      {respondTarget && <RespondModal survey={respondTarget} onClose={() => setRespondTarget(null)} onResponded={() => { fetchAll(); showToast("Resposta submetida! Obrigado. 🎉", "success"); }} />}
      {resultsTarget !== null && <ResultsModal surveyId={resultsTarget} onClose={() => setResultsTarget(null)} />}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
