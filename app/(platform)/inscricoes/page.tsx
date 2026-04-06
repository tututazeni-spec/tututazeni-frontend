"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
type EnrollmentStatus = "EM_ANDAMENTO" | "CONCLUIDO" | "CANCELADO";

interface Enrollment {
  id: number;
  userId: number;
  courseId: number;
  status: EnrollmentStatus;
  enrolledAt: string;
  user?: { id: number; fullName: string; email: string };
  course?: { id: number; title: string; workloadHours?: number; category?: string };
  certificate?: { id: number; validationCode: string; fileUrl?: string };
  _count?: { progresses: number };
}

interface Course { id: number; title: string; category?: string }
interface User   { id: number; fullName: string; email: string }

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_MAP: Record<EnrollmentStatus, { label: string; bg: string; color: string }> = {
  EM_ANDAMENTO: { label: "Em Andamento", bg: "#fff7ed", color: "#ea580c" },
  CONCLUIDO:    { label: "Concluído",    bg: "#f0fdf4", color: "#16a34a" },
  CANCELADO:    { label: "Cancelado",    bg: "#fef2f2", color: "#dc2626" },
};

function Badge({ status }: { status: EnrollmentStatus }) {
  const s = STATUS_MAP[status] ?? { label: status, bg: "#f1f5f9", color: "#64748b" };
  return (
    <span style={{
      background: s.bg, color: s.color, padding: "3px 10px",
      borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
    }}>{s.label}</span>
  );
}

// ─── Shared Styles ────────────────────────────────────────────────────────────
const input: React.CSSProperties = {
  width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0",
  borderRadius: 8, fontSize: 14, color: "#1e293b", background: "#fff",
  outline: "none", boxSizing: "border-box",
};
const btnPrimary: React.CSSProperties = {
  padding: "10px 20px", background: "#1e40af", color: "#fff",
  border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
};
const btnGhost: React.CSSProperties = {
  padding: "10px 20px", background: "#f1f5f9", color: "#475569",
  border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
};
const label: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 1,
  textTransform: "uppercase", color: "#64748b", marginBottom: 6,
};

// ─── Modal: Nova Inscrição ────────────────────────────────────────────────────
function ModalNova({ users, courses, onClose, onSave }: {
  users: User[]; courses: Course[];
  onClose: () => void; onSave: () => void;
}) {
  const [userId, setUserId]     = useState("");
  const [courseId, setCourseId] = useState("");
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !courseId) { setErr("Preencha todos os campos."); return; }
    setSaving(true); setErr("");
    try {
      // POST /enrollments — CreateEnrollmentDto: { userId, courseId }
      await api.post("/enrollments", { userId: +userId, courseId: +courseId });
      onSave();
    } catch (e: any) { setErr(e.message ?? "Erro ao criar inscrição"); }
    finally { setSaving(false); }
  }

  return (
    <Overlay>
      <Modal title="Nova Inscrição" onClose={onClose}>
        <form onSubmit={submit}>
          <div style={{ marginBottom: 16 }}>
            <span style={label}>Utilizador</span>
            <select value={userId} onChange={e => setUserId(e.target.value)} style={input} required>
              <option value="">Seleccionar utilizador...</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.fullName} — {u.email}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <span style={label}>Curso</span>
            <select value={courseId} onChange={e => setCourseId(e.target.value)} style={input} required>
              <option value="">Seleccionar curso...</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          {err && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 12 }}>{err}</p>}
          <ModalFooter onClose={onClose} saving={saving} label="Criar Inscrição" />
        </form>
      </Modal>
    </Overlay>
  );
}

// ─── Modal: Inscrição em Massa ────────────────────────────────────────────────
function ModalBulk({ courses, onClose, onSave }: {
  courses: Course[]; onClose: () => void; onSave: () => void;
}) {
  const [courseId, setCourseId] = useState("");
  const [rawIds, setRawIds]     = useState("");
  const [saving, setSaving]     = useState(false);
  const [result, setResult]     = useState<{ success: number; errors: number } | null>(null);
  const [err, setErr]           = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const userIds = rawIds.split(/[\n,]+/).map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    if (!courseId || userIds.length === 0) { setErr("Preencha o curso e pelo menos um ID."); return; }
    setSaving(true); setErr("");
    try {
      // POST /enrollments/bulk — BulkEnrollDto: { userIds, courseId }
      const res = await api.post<any>("/enrollments/bulk", { userIds, courseId: +courseId });
      setResult(res);
    } catch (e: any) { setErr(e.message ?? "Erro"); }
    finally { setSaving(false); }
  }

  return (
    <Overlay>
      <Modal title="Inscrição em Massa" onClose={onClose}>
        {result ? (
          <div>
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: 16, marginBottom: 20 }}>
              <p style={{ color: "#16a34a", fontWeight: 700, margin: 0 }}>✓ {result.success} inscrições criadas com sucesso</p>
              {result.errors > 0 && <p style={{ color: "#ea580c", margin: "4px 0 0", fontSize: 13 }}>{result.errors} falharam (já inscritos ou inválidos)</p>}
            </div>
            <button onClick={onSave} style={btnPrimary}>Fechar</button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div style={{ marginBottom: 16 }}>
              <span style={label}>Curso</span>
              <select value={courseId} onChange={e => setCourseId(e.target.value)} style={input} required>
                <option value="">Seleccionar curso...</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <span style={label}>IDs dos Utilizadores (um por linha ou separados por vírgula)</span>
              <textarea
                value={rawIds}
                onChange={e => setRawIds(e.target.value)}
                style={{ ...input, height: 100, resize: "vertical", fontFamily: "monospace" }}
                placeholder={"1\n2\n3\nou: 1, 2, 3"}
                required
              />
            </div>
            {err && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 12 }}>{err}</p>}
            <ModalFooter onClose={onClose} saving={saving} label="Inscrever em Massa" />
          </form>
        )}
      </Modal>
    </Overlay>
  );
}

// ─── Modal: Alterar Estado ────────────────────────────────────────────────────
function ModalStatus({ enrollment, onClose, onSave }: {
  enrollment: Enrollment; onClose: () => void; onSave: () => void;
}) {
  const [status, setStatus] = useState<EnrollmentStatus>(enrollment.status);
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setErr("");
    try {
      // PUT /enrollments/:id/status — UpdateEnrollmentStatusDto: { status }
      await api.put(`/enrollments/${enrollment.id}/status`, { status });
      onSave();
    } catch (e: any) { setErr(e.message ?? "Erro ao actualizar"); }
    finally { setSaving(false); }
  }

  return (
    <Overlay>
      <Modal title="Alterar Estado" onClose={onClose}>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
          <strong>{enrollment.user?.fullName}</strong> — {enrollment.course?.title}
        </p>
        <form onSubmit={submit}>
          <div style={{ marginBottom: 16 }}>
            <span style={label}>Novo Estado</span>
            <select value={status} onChange={e => setStatus(e.target.value as EnrollmentStatus)} style={input}>
              <option value="EM_ANDAMENTO">Em Andamento</option>
              <option value="CONCLUIDO">Concluído</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </div>
          {err && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 12 }}>{err}</p>}
          <ModalFooter onClose={onClose} saving={saving} label="Guardar" />
        </form>
      </Modal>
    </Overlay>
  );
}

// ─── Modal: Detalhe ───────────────────────────────────────────────────────────
function ModalDetalhe({ id, onClose }: { id: number; onClose: () => void }) {
  const [data, setData]   = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // GET /enrollments/:id
    api.get<any>(`/enrollments/${id}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [id]);

  async function gerarCertificado() {
    try {
      // POST /enrollments/:id/certificate
      await api.post(`/enrollments/${id}/certificate`, {});
      alert("Certificado gerado com sucesso!");
      onClose();
    } catch (e: any) { alert(e.message); }
  }

  return (
    <Overlay>
      <Modal title="Detalhe da Inscrição" onClose={onClose} wide>
        {loading ? (
          <p style={{ color: "#94a3b8", textAlign: "center", padding: 32 }}>A carregar...</p>
        ) : !data ? (
          <p style={{ color: "#ef4444" }}>Erro ao carregar dados.</p>
        ) : (
          <div>
            {/* Info básica */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[
                { l: "Utilizador", v: data.user?.fullName },
                { l: "Email",      v: data.user?.email },
                { l: "Curso",      v: data.course?.title },
                { l: "Estado",     v: <Badge status={data.status} /> },
                { l: "Progresso",  v: `${data.progressPercent ?? 0}% (${data.completedLessons ?? 0}/${data.totalLessons ?? 0} lições)` },
                { l: "Inscrito em", v: data.enrolledAt ? new Date(data.enrolledAt).toLocaleDateString("pt-PT") : "—" },
              ].map(({ l, v }) => (
                <div key={l} style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 14px" }}>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8 }}>{l}</p>
                  <p style={{ margin: "4px 0 0", fontSize: 14, color: "#1e293b", fontWeight: 500 }}>{v ?? "—"}</p>
                </div>
              ))}
            </div>

            {/* Barra de progresso */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ ...label, marginBottom: 8 }}>Progresso do curso</p>
              <div style={{ background: "#e2e8f0", borderRadius: 20, height: 10, overflow: "hidden" }}>
                <div style={{
                  width: `${data.progressPercent ?? 0}%`, height: "100%",
                  background: "linear-gradient(90deg, #1e40af, #3b82f6)", borderRadius: 20,
                  transition: "width 0.5s ease",
                }} />
              </div>
            </div>

            {/* Certificado */}
            {data.certificate ? (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: 14, marginBottom: 16 }}>
                <p style={{ margin: 0, color: "#16a34a", fontWeight: 700, fontSize: 13 }}>✓ Certificado emitido</p>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>Código: {data.certificate.validationCode}</p>
              </div>
            ) : data.status === "CONCLUIDO" ? (
              <button onClick={gerarCertificado} style={{ ...btnPrimary, marginBottom: 16 }}>
                Gerar Certificado
              </button>
            ) : null}

            {/* Tentativas */}
            {data.attempts?.length > 0 && (
              <div>
                <p style={label}>Tentativas de Avaliação</p>
                {data.attempts.slice(0, 3).map((a: any) => (
                  <div key={a.id} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 12px", background: "#f8fafc", borderRadius: 6, marginBottom: 6,
                  }}>
                    <span style={{ fontSize: 13, color: "#1e293b" }}>{a.evaluation?.title ?? `Tentativa #${a.id}`}</span>
                    <span style={{ fontSize: 12, color: a.passed ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
                      {a.scorePercent != null ? `${a.scorePercent}%` : "—"} {a.passed ? "✓" : "✗"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </Overlay>
  );
}

// ─── Overlay + Modal helpers ──────────────────────────────────────────────────
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
      width: wide ? 600 : 440, maxWidth: "95vw", maxHeight: "90vh",
      overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: 0 }}>{title}</h2>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#94a3b8", lineHeight: 1 }}>✕</button>
      </div>
      {children}
    </div>
  );
}

function ModalFooter({ onClose, saving, label: lbl }: { onClose: () => void; saving: boolean; label: string }) {
  return (
    <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
      <button type="button" onClick={onClose} style={btnGhost}>Cancelar</button>
      <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>
        {saving ? "A guardar..." : lbl}
      </button>
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function InscricoesPage() {
  const [enrollments, setEnrollments]   = useState<Enrollment[]>([]);
  const [total, setTotal]               = useState(0);
  const [totalPages, setTotalPages]     = useState(1);
  const [page, setPage]                 = useState(1);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [search, setSearch]             = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [users, setUsers]               = useState<User[]>([]);
  const [courses, setCourses]           = useState<Course[]>([]);

  // Modais
  const [modalNova, setModalNova]       = useState(false);
  const [modalBulk, setModalBulk]       = useState(false);
  const [modalStatus, setModalStatus]   = useState<Enrollment | null>(null);
  const [modalDetalhe, setModalDetalhe] = useState<number | null>(null);

  const LIMIT = 15;

  function load(p = 1) {
    setLoading(true);
    // GET /enrollments — EnrollmentFilterDto: { page, limit, userId?, courseId?, status? }
    const params = new URLSearchParams({
      page: String(p), limit: String(LIMIT),
      ...(filterStatus ? { status: filterStatus } : {}),
    });
    api.get<any>(`/enrollments?${params}`)
      .then(res => {
        setEnrollments(res?.data ?? []);
        setTotal(res?.total ?? 0);
        setTotalPages(res?.totalPages ?? 1);
        setPage(p);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(1); }, [filterStatus]);

  useEffect(() => {
    // Carregar listas para os selects dos modais
    api.get<any>("/users?limit=500").then(r => setUsers(r?.data ?? [])).catch(() => {});
    api.get<any>("/courses?limit=500").then(r => setCourses(r?.data ?? [])).catch(() => {});
  }, []);

  async function cancelar(id: number) {
    if (!confirm("Tem a certeza que pretende cancelar esta inscrição?")) return;
    try {
      // PATCH /enrollments/:id/cancel
      await api.patch(`/enrollments/${id}/cancel`, {});
      load(page);
    } catch (e: any) { alert(e.message); }
  }

  // Filtro local por pesquisa
  const filtered = search
    ? enrollments.filter(e =>
        e.user?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        e.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
        e.course?.title?.toLowerCase().includes(search.toLowerCase())
      )
    : enrollments;

  // Stats da página actual
  const emAndamento = enrollments.filter(e => e.status === "EM_ANDAMENTO").length;
  const concluidos  = enrollments.filter(e => e.status === "CONCLUIDO").length;
  const cancelados  = enrollments.filter(e => e.status === "CANCELADO").length;

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", margin: 0 }}>Inscrições</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
            {total} inscrições no total
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setModalBulk(true)} style={{ ...btnGhost, fontSize: 13 }}>
            ⚡ Em Massa
          </button>
          <button onClick={() => setModalNova(true)} style={{ ...btnPrimary, fontSize: 13 }}>
            + Nova Inscrição
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total",        value: total,       color: "#1e40af", bg: "#eff6ff" },
          { label: "Em Andamento", value: emAndamento, color: "#ea580c", bg: "#fff7ed" },
          { label: "Concluídos",   value: concluidos,  color: "#16a34a", bg: "#f0fdf4" },
          { label: "Cancelados",   value: cancelados,  color: "#dc2626", bg: "#fef2f2" },
        ].map(s => (
          <div key={s.label} style={{
            background: s.bg, borderRadius: 10, padding: "14px 18px",
            border: `1px solid ${s.color}22`, cursor: s.label !== "Total" ? "pointer" : "default",
          }}
            onClick={() => {
              if (s.label === "Em Andamento") setFilterStatus("EM_ANDAMENTO");
              else if (s.label === "Concluídos") setFilterStatus("CONCLUIDO");
              else if (s.label === "Cancelados") setFilterStatus("CANCELADO");
            }}
          >
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: s.color, textTransform: "uppercase", letterSpacing: 0.8 }}>
              {s.label}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Filtros ── */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <input
          placeholder="Pesquisar por utilizador, email ou curso..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...input, width: 320 }}
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{ ...input, width: 180 }}
        >
          <option value="">Todos os estados</option>
          <option value="EM_ANDAMENTO">Em Andamento</option>
          <option value="CONCLUIDO">Concluído</option>
          <option value="CANCELADO">Cancelado</option>
        </select>
        {filterStatus && (
          <button onClick={() => setFilterStatus("")} style={{ ...btnGhost, padding: "10px 14px" }}>
            ✕ Limpar filtro
          </button>
        )}
      </div>

      {/* ── Erro ── */}
      {error && (
        <div style={{
          background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8,
          padding: 14, color: "#dc2626", fontSize: 13, marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      {/* ── Tabela ── */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: "center" }}>
            <div style={{
              width: 32, height: 32, border: "3px solid #e2e8f0", borderTopColor: "#1e40af",
              borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 12px",
            }} />
            <p style={{ color: "#94a3b8", fontSize: 14 }}>A carregar inscrições...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: "#94a3b8" }}>
            <p style={{ fontSize: 32, margin: "0 0 8px" }}>📋</p>
            <p style={{ fontSize: 14, fontWeight: 500 }}>Nenhuma inscrição encontrada</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Tente ajustar os filtros ou criar uma nova inscrição</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  {["#", "Utilizador", "Curso", "Estado", "Progresso", "Data", "Certificado", "Acções"].map(h => (
                    <th key={h} style={{
                      padding: "11px 16px", textAlign: "left", fontWeight: 700,
                      color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6,
                      whiteSpace: "nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((e, i) => (
                  <tr
                    key={e.id}
                    style={{ borderTop: "1px solid #f1f5f9", transition: "background 0.1s" }}
                    onMouseEnter={ev => (ev.currentTarget.style.background = "#fafafa")}
                    onMouseLeave={ev => (ev.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "12px 16px", color: "#94a3b8", fontSize: 12 }}>
                      {(page - 1) * LIMIT + i + 1}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 600, color: "#1e293b" }}>
                        {e.user?.fullName ?? `Utilizador #${e.userId}`}
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                        {e.user?.email ?? ""}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", maxWidth: 220 }}>
                      <div style={{ fontWeight: 500, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {e.course?.title ?? `Curso #${e.courseId}`}
                      </div>
                      {e.course?.workloadHours && (
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                          {e.course.workloadHours}h
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <Badge status={e.status} />
                    </td>
                    <td style={{ padding: "12px 16px", minWidth: 100 }}>
                      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>
                        {e._count?.progresses ?? 0} lições
                      </div>
                      <div style={{ background: "#e2e8f0", borderRadius: 10, height: 6, overflow: "hidden" }}>
                        <div style={{
                          width: `${Math.min((e._count?.progresses ?? 0) * 10, 100)}%`,
                          height: "100%", background: "#1e40af", borderRadius: 10,
                        }} />
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#64748b", whiteSpace: "nowrap", fontSize: 12 }}>
                      {e.enrolledAt ? new Date(e.enrolledAt).toLocaleDateString("pt-PT") : "—"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {e.certificate ? (
                        <span style={{ color: "#16a34a", fontSize: 11, fontWeight: 700 }}>✓ Emitido</span>
                      ) : (
                        <span style={{ color: "#cbd5e1", fontSize: 11 }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "nowrap" }}>
                        <button
                          onClick={() => setModalDetalhe(e.id)}
                          style={{
                            padding: "5px 10px", background: "#f1f5f9", color: "#475569",
                            border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer",
                          }}
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => setModalStatus(e)}
                          style={{
                            padding: "5px 10px", background: "#eff6ff", color: "#1e40af",
                            border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer",
                          }}
                        >
                          Estado
                        </button>
                        {e.status !== "CANCELADO" && (
                          <button
                            onClick={() => cancelar(e.id)}
                            style={{
                              padding: "5px 10px", background: "#fef2f2", color: "#dc2626",
                              border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer",
                            }}
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Paginação ── */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
          <span style={{ fontSize: 13, color: "#64748b" }}>
            A mostrar {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} de {total}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => load(page - 1)}
              disabled={page === 1}
              style={{ ...btnGhost, padding: "8px 16px", opacity: page === 1 ? 0.4 : 1 }}
            >
              ← Anterior
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = Math.max(1, page - 2) + i;
              if (p > totalPages) return null;
              return (
                <button key={p} onClick={() => load(p)} style={{
                  padding: "8px 13px", border: "none", borderRadius: 8, fontSize: 13,
                  fontWeight: p === page ? 700 : 400, cursor: "pointer",
                  background: p === page ? "#1e40af" : "#f1f5f9",
                  color: p === page ? "#fff" : "#475569",
                }}>{p}</button>
              );
            })}
            <button
              onClick={() => load(page + 1)}
              disabled={page === totalPages}
              style={{ ...btnGhost, padding: "8px 16px", opacity: page === totalPages ? 0.4 : 1 }}
            >
              Seguinte →
            </button>
          </div>
        </div>
      )}

      {/* ── Modais ── */}
      {modalNova && (
        <ModalNova
          users={users} courses={courses}
          onClose={() => setModalNova(false)}
          onSave={() => { setModalNova(false); load(1); }}
        />
      )}
      {modalBulk && (
        <ModalBulk
          courses={courses}
          onClose={() => setModalBulk(false)}
          onSave={() => { setModalBulk(false); load(1); }}
        />
      )}
      {modalStatus && (
        <ModalStatus
          enrollment={modalStatus}
          onClose={() => setModalStatus(null)}
          onSave={() => { setModalStatus(null); load(page); }}
        />
      )}
      {modalDetalhe !== null && (
        <ModalDetalhe
          id={modalDetalhe}
          onClose={() => setModalDetalhe(null)}
        />
      )}
    </div>
  );
}