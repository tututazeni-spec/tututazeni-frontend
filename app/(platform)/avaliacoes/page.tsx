"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Question {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  weight: number;
}

interface Assessment {
  id: number;
  courseId: number;
  title: string;
  passScore: number;
  questions: Question[];
  _count?: { assessmentAttempts: number };
}

interface Attempt {
  id: number;
  assessmentId: number;
  userId: number;
  score: number;
  passed: boolean;
  createdAt: string;
  assessment?: { title: string; passScore: number };
  correctAnswers?: number;
  total?: number;
}

interface Course { id: number; title: string }

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

// ─── Helpers ─────────────────────────────────────────────────────────────────
function PassBadge({ passed, score }: { passed: boolean; score: number }) {
  return (
    <span style={{
      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: passed ? "#ecfdf5" : "#fef2f2",
      color: passed ? "#16a34a" : "#dc2626",
    }}>
      {passed ? "✓ Aprovado" : "✗ Reprovado"} — {score}%
    </span>
  );
}

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
      width: wide ? 700 : 520, maxWidth: "95vw", maxHeight: "90vh",
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
    <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 16 }}>
      <button type="button" onClick={onClose} style={btnGhost}>Cancelar</button>
      <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>
        {saving ? "A guardar..." : label}
      </button>
    </div>
  );
}

// ─── Modal: Criar Avaliação ───────────────────────────────────────────────────
function ModalCriar({ courses, onClose, onSave }: {
  courses: Course[]; onClose: () => void; onSave: () => void;
}) {
  const [courseId, setCourseId] = useState("");
  const [title, setTitle]       = useState("");
  const [passScore, setPassScore] = useState(70);
  const [questions, setQuestions] = useState([
    { question: "", options: ["", "", "", ""], correctIndex: 0, weight: 1 },
  ]);
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState("");

  function addQuestion() {
    setQuestions(q => [...q, { question: "", options: ["", "", "", ""], correctIndex: 0, weight: 1 }]);
  }

  function removeQuestion(i: number) {
    setQuestions(q => q.filter((_, idx) => idx !== i));
  }

  function setQ(i: number, field: string, value: any) {
    setQuestions(q => q.map((q2, idx) => idx === i ? { ...q2, [field]: value } : q2));
  }

  function setOption(qi: number, oi: number, value: string) {
    setQuestions(q => q.map((q2, idx) => {
      if (idx !== qi) return q2;
      const opts = [...q2.options];
      opts[oi] = value;
      return { ...q2, options: opts };
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!courseId || !title) { setErr("Preencha o curso e o título."); return; }
    if (questions.some(q => !q.question || q.options.some(o => !o))) {
      setErr("Preencha todas as perguntas e opções."); return;
    }
    setSaving(true); setErr("");
    try {
      // POST /assessments — CreateAssessmentDto: { courseId, title, passScore, questions }
      await api.post("/assessments", {
        courseId: +courseId, title, passScore,
        questions: questions.map(q => ({
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          weight: q.weight,
        })),
      });
      onSave();
    } catch (e: any) { setErr(e.message ?? "Erro ao criar"); }
    finally { setSaving(false); }
  }

  return (
    <Overlay>
      <Modal title="Nova Avaliação" onClose={onClose} wide>
        <form onSubmit={submit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <span style={labelStyle}>Curso</span>
              <select value={courseId} onChange={e => setCourseId(e.target.value)} style={inputStyle} required>
                <option value="">Seleccionar curso...</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <span style={labelStyle}>Pontuação Mínima (%)</span>
              <input
                type="number" min={0} max={100} value={passScore}
                onChange={e => setPassScore(+e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <Field label="Título da Avaliação">
            <input value={title} onChange={e => setTitle(e.target.value)}
              style={inputStyle} placeholder="ex: Quiz Módulo 1" required />
          </Field>

          {/* Perguntas */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={labelStyle}>Perguntas ({questions.length})</span>
              <button type="button" onClick={addQuestion} style={{ ...btnGhost, padding: "6px 14px", fontSize: 12 }}>
                + Pergunta
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16, maxHeight: 360, overflowY: "auto", paddingRight: 4 }}>
              {questions.map((q, qi) => (
                <div key={qi} style={{
                  background: "#f8fafc", borderRadius: 10, padding: 16,
                  border: "1px solid #e2e8f0",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#1e40af" }}>
                      Pergunta {qi + 1}
                    </span>
                    {questions.length > 1 && (
                      <button type="button" onClick={() => removeQuestion(qi)} style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "#dc2626", fontSize: 13, fontWeight: 600,
                      }}>Remover</button>
                    )}
                  </div>

                  <input
                    value={q.question}
                    onChange={e => setQ(qi, "question", e.target.value)}
                    style={{ ...inputStyle, marginBottom: 10, background: "#fff" }}
                    placeholder="Escreve a pergunta..."
                    required
                  />

                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {q.options.map((opt, oi) => (
                      <div key={oi} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input
                          type="radio" name={`correct-${qi}`}
                          checked={q.correctIndex === oi}
                          onChange={() => setQ(qi, "correctIndex", oi)}
                          style={{ width: 16, height: 16, accentColor: "#1e40af" }}
                        />
                        <input
                          value={opt}
                          onChange={e => setOption(qi, oi, e.target.value)}
                          style={{
                            ...inputStyle, flex: 1, background: "#fff",
                            borderColor: q.correctIndex === oi ? "#1e40af" : "#e2e8f0",
                          }}
                          placeholder={`Opção ${oi + 1}${q.correctIndex === oi ? " (correcta)" : ""}`}
                          required
                        />
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>Peso:</span>
                    <input
                      type="number" min={1} max={10} value={q.weight}
                      onChange={e => setQ(qi, "weight", +e.target.value)}
                      style={{ ...inputStyle, width: 70, background: "#fff" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {err && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 12 }}>{err}</p>}
          <ModalFooter onClose={onClose} saving={saving} label="Criar Avaliação" />
        </form>
      </Modal>
    </Overlay>
  );
}

// ─── Modal: Fazer Quiz ────────────────────────────────────────────────────────
function ModalQuiz({ assessment, onClose, onDone }: {
  assessment: Assessment; onClose: () => void;
  onDone: (result: any) => void;
}) {
  const [answers, setAnswers]   = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]     = useState<any>(null);
  const [err, setErr]           = useState("");

  const answered = Object.keys(answers).length;
  const total    = assessment.questions.length;
  const allAnswered = answered === total;

  async function submit() {
    if (!allAnswered) { setErr("Responde a todas as perguntas antes de submeter."); return; }
    setSubmitting(true); setErr("");
    try {
      // POST /assessments/submit — SubmitAssessmentDto: { assessmentId, answers }
      const res = await api.post<any>("/assessments/submit", {
        assessmentId: assessment.id,
        answers: assessment.questions.map((_, i) => answers[i] ?? 0),
      });
      setResult(res);
    } catch (e: any) { setErr(e.message ?? "Erro ao submeter"); }
    finally { setSubmitting(false); }
  }

  return (
    <Overlay>
      <Modal title={assessment.title} onClose={onClose} wide>
        {result ? (
          /* Resultado */
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 100, height: 100, borderRadius: "50%", margin: "0 auto 20px",
              background: result.passed ? "#ecfdf5" : "#fef2f2",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 44,
            }}>
              {result.passed ? "🎉" : "😔"}
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: "0 0 8px" }}>
              {result.passed ? "Aprovado!" : "Não Aprovado"}
            </h3>
            <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 24px" }}>
              {result.passed
                ? "Parabéns! Concluíste a avaliação com sucesso."
                : `Precisas de ${assessment.passScore}% para passar. Tenta novamente!`}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
              {[
                { label: "Pontuação",    value: `${result.score}%`,            color: result.passed ? "#16a34a" : "#dc2626" },
                { label: "Correctas",   value: `${result.correctAnswers}/${result.total}`, color: "#1e40af" },
                { label: "Mínimo",      value: `${assessment.passScore}%`,     color: "#64748b" },
              ].map(s => (
                <div key={s.label} style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 16px" }}>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8 }}>{s.label}</p>
                  <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>

            {result.passed && (
              <div style={{
                background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10,
                padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#92400e",
              }}>
                🏆 +50 pontos adicionados ao teu perfil!
              </div>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={onClose} style={btnGhost}>Fechar</button>
              <button onClick={() => onDone(result)} style={btnPrimary}>Ver Tentativas</button>
            </div>
          </div>
        ) : (
          /* Quiz */
          <div>
            {/* Progresso */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  {answered} de {total} respondidas
                </span>
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  Mínimo: {assessment.passScore}%
                </span>
              </div>
              <div style={{ background: "#e2e8f0", borderRadius: 10, height: 6, overflow: "hidden" }}>
                <div style={{
                  width: `${(answered / total) * 100}%`, height: "100%",
                  background: "#1e40af", borderRadius: 10, transition: "width 0.3s",
                }} />
              </div>
            </div>

            {/* Perguntas */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20, maxHeight: 420, overflowY: "auto", paddingRight: 4 }}>
              {assessment.questions.map((q, qi) => (
                <div key={q.id} style={{
                  background: answers[qi] !== undefined ? "#f0fdf4" : "#f8fafc",
                  borderRadius: 12, padding: 16,
                  border: `1px solid ${answers[qi] !== undefined ? "#bbf7d0" : "#e2e8f0"}`,
                  transition: "all 0.2s",
                }}>
                  <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600, color: "#1e293b" }}>
                    <span style={{ color: "#1e40af" }}>{qi + 1}.</span> {q.question}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {q.options.map((opt, oi) => (
                      <button
                        key={oi}
                        type="button"
                        onClick={() => setAnswers(a => ({ ...a, [qi]: oi }))}
                        style={{
                          padding: "10px 14px", borderRadius: 8, textAlign: "left",
                          fontSize: 13, cursor: "pointer", transition: "all 0.15s",
                          background: answers[qi] === oi ? "#1e40af" : "#fff",
                          color: answers[qi] === oi ? "#fff" : "#1e293b",
                          border: `1.5px solid ${answers[qi] === oi ? "#1e40af" : "#e2e8f0"}`,
                          fontWeight: answers[qi] === oi ? 600 : 400,
                        }}
                      >
                        <span style={{
                          display: "inline-block", width: 22, height: 22, borderRadius: "50%",
                          background: answers[qi] === oi ? "rgba(255,255,255,0.2)" : "#f1f5f9",
                          textAlign: "center", lineHeight: "22px", fontSize: 11,
                          fontWeight: 700, marginRight: 8,
                          color: answers[qi] === oi ? "#fff" : "#64748b",
                        }}>
                          {String.fromCharCode(65 + oi)}
                        </span>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {err && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 12 }}>{err}</p>}

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 20 }}>
              <button type="button" onClick={onClose} style={btnGhost}>Cancelar</button>
              <button
                onClick={submit}
                disabled={submitting || !allAnswered}
                style={{
                  ...btnPrimary,
                  opacity: submitting || !allAnswered ? 0.6 : 1,
                  cursor: !allAnswered ? "not-allowed" : "pointer",
                }}
              >
                {submitting ? "A submeter..." : `Submeter (${answered}/${total})`}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </Overlay>
  );
}

// ─── Modal: Detalhe + Editar Avaliação ───────────────────────────────────────
function ModalDetalhe({ id, onClose, onDelete }: {
  id: number; onClose: () => void; onDelete: () => void;
}) {
  const [data, setData]     = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    // GET /assessments/:id
    api.get<Assessment>(`/assessments/${id}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [id]);

  async function remove() {
    if (!confirm("Remover esta avaliação permanentemente?")) return;
    setDeleting(true);
    try {
      // DELETE /assessments/:id
      await api.delete(`/assessments/${id}`);
      onDelete();
    } catch (e: any) { alert(e.message); setDeleting(false); }
  }

  return (
    <Overlay>
      <Modal title="Detalhe da Avaliação" onClose={onClose} wide>
        {loading ? (
          <p style={{ color: "#94a3b8", textAlign: "center", padding: 32 }}>A carregar...</p>
        ) : !data ? (
          <p style={{ color: "#ef4444" }}>Erro ao carregar avaliação.</p>
        ) : (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Curso ID",       value: `#${data.courseId}` },
                { label: "Pontuação Mínima", value: `${data.passScore}%` },
                { label: "Tentativas",     value: data._count?.assessmentAttempts ?? 0 },
              ].map(s => (
                <div key={s.label} style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 14px" }}>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8 }}>{s.label}</p>
                  <p style={{ margin: "4px 0 0", fontSize: 18, fontWeight: 800, color: "#1e293b" }}>{s.value}</p>
                </div>
              ))}
            </div>

            <p style={{ ...labelStyle, marginBottom: 12 }}>Perguntas ({data.questions.length})</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 360, overflowY: "auto" }}>
              {data.questions.map((q, i) => (
                <div key={q.id} style={{
                  background: "#f8fafc", borderRadius: 10, padding: "14px 16px",
                  border: "1px solid #e2e8f0",
                }}>
                  <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                    <span style={{ color: "#1e40af" }}>{i + 1}.</span> {q.question}
                    <span style={{ marginLeft: 8, fontSize: 11, color: "#94a3b8" }}>peso: {q.weight}</span>
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {q.options.map((opt, oi) => (
                      <div key={oi} style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "6px 10px", borderRadius: 6,
                        background: oi === q.correctIndex ? "#ecfdf5" : "transparent",
                        border: `1px solid ${oi === q.correctIndex ? "#bbf7d0" : "transparent"}`,
                      }}>
                        <span style={{
                          width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                          background: oi === q.correctIndex ? "#10b981" : "#e2e8f0",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10, fontWeight: 700,
                          color: oi === q.correctIndex ? "#fff" : "#64748b",
                        }}>
                          {String.fromCharCode(65 + oi)}
                        </span>
                        <span style={{ fontSize: 13, color: "#1e293b", fontWeight: oi === q.correctIndex ? 600 : 400 }}>
                          {opt}
                          {oi === q.correctIndex && <span style={{ marginLeft: 6, color: "#10b981", fontSize: 11 }}>✓ Correcta</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
              <button
                onClick={remove}
                disabled={deleting}
                style={{
                  padding: "10px 20px", background: "#fef2f2", color: "#dc2626",
                  border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
                  cursor: "pointer", opacity: deleting ? 0.7 : 1,
                }}
              >
                {deleting ? "A remover..." : "🗑 Remover Avaliação"}
              </button>
              <button onClick={onClose} style={btnGhost}>Fechar</button>
            </div>
          </div>
        )}
      </Modal>
    </Overlay>
  );
}

// ─── Tab: Tentativas ──────────────────────────────────────────────────────────
function TabTentativas() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    // GET /assessments/attempts/my
    api.get<Attempt[]>("/assessments/attempts/my")
      .then(res => setAttempts(Array.isArray(res) ? res : []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: "#94a3b8", padding: 32, textAlign: "center" }}>A carregar tentativas...</p>;

  if (attempts.length === 0) return (
    <div style={{ padding: 60, textAlign: "center", ...card }}>
      <p style={{ fontSize: 32, margin: "0 0 8px" }}>📝</p>
      <p style={{ fontSize: 14, color: "#94a3b8" }}>Ainda sem tentativas de avaliação.</p>
    </div>
  );

  return (
    <div style={{ ...card, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#f8fafc" }}>
            {["Avaliação", "Pontuação", "Resultado", "Correctas", "Data"].map(h => (
              <th key={h} style={{
                padding: "11px 16px", textAlign: "left", fontWeight: 700,
                color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6,
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {attempts.map(a => (
            <tr key={a.id} style={{ borderTop: "1px solid #f1f5f9" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#fafafa")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <td style={{ padding: "12px 16px", fontWeight: 600, color: "#1e293b" }}>
                {a.assessment?.title ?? `Avaliação #${a.assessmentId}`}
              </td>
              <td style={{ padding: "12px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ background: "#e2e8f0", borderRadius: 10, height: 8, width: 80, overflow: "hidden" }}>
                    <div style={{
                      width: `${a.score}%`, height: "100%", borderRadius: 10,
                      background: a.passed ? "#10b981" : "#ef4444",
                    }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: a.passed ? "#16a34a" : "#dc2626" }}>
                    {a.score}%
                  </span>
                </div>
              </td>
              <td style={{ padding: "12px 16px" }}>
                <PassBadge passed={a.passed} score={a.score} />
              </td>
              <td style={{ padding: "12px 16px", color: "#64748b" }}>
                {a.correctAnswers !== undefined ? `${a.correctAnswers}/${a.total}` : "—"}
              </td>
              <td style={{ padding: "12px 16px", color: "#94a3b8", fontSize: 12, whiteSpace: "nowrap" }}>
                {new Date(a.createdAt).toLocaleDateString("pt-PT")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
type Tab = "avaliacoes" | "tentativas";

export default function AssessmentsPage() {
  const [tab, setTab]                   = useState<Tab>("avaliacoes");
  const [assessments, setAssessments]   = useState<Assessment[]>([]);
  const [courses, setCourses]           = useState<Course[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [search, setSearch]             = useState("");
  const [filterCourse, setFilterCourse] = useState("");
  const [modalCriar, setModalCriar]     = useState(false);
  const [modalQuiz, setModalQuiz]       = useState<Assessment | null>(null);
  const [modalDetalhe, setModalDetalhe] = useState<number | null>(null);

  function load() {
    setLoading(true);
    // Carrega todos os cursos e para cada um os assessments
    api.get<any>("/courses?limit=200")
      .then(async res => {
        const cs: Course[] = res?.data ?? [];
        setCourses(cs);
        // GET /assessments/course/:courseId para cada curso
        const all = await Promise.all(
          cs.slice(0, 20).map(c =>
            api.get<Assessment[]>(`/assessments/course/${c.id}`)
              .then(a => (Array.isArray(a) ? a : []))
              .catch(() => [])
          )
        );
        setAssessments(all.flat());
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const filtered = assessments.filter(a => {
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase());
    const matchCourse = !filterCourse || a.courseId === +filterCourse;
    return matchSearch && matchCourse;
  });

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
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", margin: 0 }}>⭐ Avaliações</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
            Quizzes e avaliações dos cursos — {assessments.length} avaliações
          </p>
        </div>
        <button onClick={() => setModalCriar(true)} style={btnPrimary}>
          + Nova Avaliação
        </button>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Avaliações", value: assessments.length,
            color: "#1e40af", bg: "#eff6ff" },
          { label: "Total Tentativas",
            value: assessments.reduce((s, a) => s + (a._count?.assessmentAttempts ?? 0), 0),
            color: "#8b5cf6", bg: "#f5f3ff" },
          { label: "Cursos com Avaliação",
            value: new Set(assessments.map(a => a.courseId)).size,
            color: "#10b981", bg: "#ecfdf5" },
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

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 10, padding: 4, marginBottom: 20, width: "fit-content" }}>
        <button onClick={() => setTab("avaliacoes")} style={TAB_STYLE(tab === "avaliacoes")}>
          📋 Avaliações
        </button>
        <button onClick={() => setTab("tentativas")} style={TAB_STYLE(tab === "tentativas")}>
          📊 As Minhas Tentativas
        </button>
      </div>

      {/* ── Erro ── */}
      {error && (
        <div style={{
          background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8,
          padding: 14, color: "#dc2626", fontSize: 13, marginBottom: 16,
        }}>{error}</div>
      )}

      {/* ══ TAB: AVALIAÇÕES ══ */}
      {tab === "avaliacoes" && (
        <>
          {/* Filtros */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <input
              placeholder="Pesquisar avaliações..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ ...inputStyle, width: 280 }}
            />
            <select
              value={filterCourse} onChange={e => setFilterCourse(e.target.value)}
              style={{ ...inputStyle, width: 220 }}
            >
              <option value="">Todos os cursos</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            {(search || filterCourse) && (
              <button onClick={() => { setSearch(""); setFilterCourse(""); }}
                style={{ ...btnGhost, padding: "10px 14px" }}>✕</button>
            )}
          </div>

          {/* Grid de avaliações */}
          {loading ? (
            <div style={{ padding: 60, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
              A carregar avaliações...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center", ...card }}>
              <p style={{ fontSize: 32, margin: "0 0 12px" }}>📋</p>
              <p style={{ fontSize: 14, fontWeight: 500, color: "#1e293b" }}>
                {assessments.length === 0 ? "Nenhuma avaliação criada" : "Nenhuma avaliação encontrada"}
              </p>
              <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 4, marginBottom: 20 }}>
                {assessments.length === 0 && "Cria a primeira avaliação para um curso"}
              </p>
              {assessments.length === 0 && (
                <button onClick={() => setModalCriar(true)} style={btnPrimary}>+ Nova Avaliação</button>
              )}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
              {filtered.map(a => {
                const course = courses.find(c => c.id === a.courseId);
                return (
                  <div key={a.id} style={{
                    ...card, overflow: "hidden",
                    transition: "box-shadow 0.2s",
                  }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)")}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
                  >
                    {/* Header */}
                    <div style={{ padding: "16px 18px", borderBottom: "1px solid #f1f5f9" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1e293b" }}>{a.title}</p>
                          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8" }}>
                            {course?.title ?? `Curso #${a.courseId}`}
                          </p>
                        </div>
                        <span style={{
                          padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                          background: "#fff7ed", color: "#ea580c",
                        }}>
                          Min: {a.passScore}%
                        </span>
                      </div>
                    </div>

                    {/* Body */}
                    <div style={{ padding: "12px 18px" }}>
                      <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
                        <div style={{ textAlign: "center" }}>
                          <p style={{ margin: 0, fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6 }}>Perguntas</p>
                          <p style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 800, color: "#1e40af" }}>{a.questions.length}</p>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <p style={{ margin: 0, fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6 }}>Tentativas</p>
                          <p style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 800, color: "#8b5cf6" }}>{a._count?.assessmentAttempts ?? 0}</p>
                        </div>
                      </div>
                    </div>

                    {/* Acções */}
                    <div style={{
                      padding: "10px 18px", background: "#f8fafc",
                      borderTop: "1px solid #f1f5f9", display: "flex", gap: 8,
                    }}>
                      <button
                        onClick={() => setModalQuiz(a)}
                        style={{
                          flex: 1, padding: "8px", background: "#1e40af", color: "#fff",
                          border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer",
                        }}
                      >
                        ▶ Fazer Quiz
                      </button>
                      <button
                        onClick={() => setModalDetalhe(a.id)}
                        style={{
                          padding: "8px 14px", background: "#f1f5f9", color: "#475569",
                          border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
                        }}
                      >
                        Ver
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ══ TAB: TENTATIVAS ══ */}
      {tab === "tentativas" && <TabTentativas />}

      {/* ── Modais ── */}
      {modalCriar && (
        <ModalCriar
          courses={courses}
          onClose={() => setModalCriar(false)}
          onSave={() => { setModalCriar(false); load(); }}
        />
      )}
      {modalQuiz && (
        <ModalQuiz
          assessment={modalQuiz}
          onClose={() => setModalQuiz(null)}
          onDone={() => { setModalQuiz(null); setTab("tentativas"); }}
        />
      )}
      {modalDetalhe !== null && (
        <ModalDetalhe
          id={modalDetalhe}
          onClose={() => setModalDetalhe(null)}
          onDelete={() => { setModalDetalhe(null); load(); }}
        />
      )}
    </div>
  );
}