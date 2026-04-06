"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Competency {
  id: number; name: string; description?: string;
  _count?: { userCompetencies: number; courses: number };
}
interface UserCompetency {
  id: number; level: number; evaluatedAt?: string;
  competency: Competency;
}
interface GapItem {
  competency: Competency; requiredLevel: number;
  currentLevel: number; gap: number; met: boolean;
}
interface GapResult { gaps: GapItem[]; totalGap: number; readinessPercent: number; }

// ─── Styles ───────────────────────────────────────────────────────────────────
const card: React.CSSProperties = { background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: 24 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, color: "#1e293b", background: "#fff", outline: "none", boxSizing: "border-box" };
const labelStyle: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#64748b", marginBottom: 6 };
const btnPrimary: React.CSSProperties = { padding: "10px 20px", background: "#1e40af", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" };
const btnGhost: React.CSSProperties = { padding: "10px 18px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const LEVEL_CONFIG = [
  { label: "Básico",       color: "#94a3b8", bg: "#f8fafc" },
  { label: "Elementar",   color: "#f59e0b", bg: "#fffbeb" },
  { label: "Intermédio",  color: "#0ea5e9", bg: "#f0f9ff" },
  { label: "Avançado",    color: "#1e40af", bg: "#eff6ff" },
  { label: "Especialista",color: "#16a34a", bg: "#ecfdf5" },
];

function LevelBadge({ level }: { level: number }) {
  const cfg = LEVEL_CONFIG[level - 1] ?? { label: `Nível ${level}`, color: "#64748b", bg: "#f8fafc" };
  return <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color }}>{cfg.label} ({level}/5)</span>;
}

function LevelBar({ level, max = 5, color }: { level: number; max?: number; color?: string }) {
  const pct = (level / max) * 100;
  const c = color ?? (pct >= 80 ? "#16a34a" : pct >= 60 ? "#1e40af" : pct >= 40 ? "#f59e0b" : "#dc2626");
  return (
    <div>
      <div style={{ height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: c, borderRadius: 3, transition: "width 0.5s" }} />
      </div>
      <p style={{ margin: "3px 0 0", fontSize: 11, color: c, fontWeight: 600 }}>{level}/{max}</p>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }: { msg: string; type: "success"|"error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, []);
  return <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 999, background: type === "success" ? "#ecfdf5" : "#fef2f2", border: `1px solid ${type === "success" ? "#bbf7d0" : "#fecaca"}`, borderRadius: 12, padding: "14px 20px", maxWidth: 360, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", gap: 10 }}><span style={{ fontSize: 18 }}>{type === "success" ? "✅" : "❌"}</span><p style={{ margin: 0, fontSize: 13, color: type === "success" ? "#16a34a" : "#dc2626", fontWeight: 600 }}>{msg}</p></div>;
}

// ─── Modal: Criar Competência ─────────────────────────────────────────────────
function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try { await api.post("/competencies", form); onCreated(); onClose(); }
    catch (e: any) { alert(e.message); } finally { setSaving(false); }
  }
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ ...card, width: "100%", maxWidth: 440, boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1e293b" }}>🧠 Nova Competência</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
        </div>
        <form onSubmit={submit}>
          <div style={{ marginBottom: 14 }}><span style={labelStyle}>Nome *</span><input style={inputStyle} value={form.name} onChange={e => set("name", e.target.value)} placeholder="Ex: Liderança" required /></div>
          <div style={{ marginBottom: 20 }}><span style={labelStyle}>Descrição</span><textarea style={{ ...inputStyle, height: 72, resize: "vertical" }} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Descreve a competência..." /></div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={btnGhost}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>{saving ? "A criar..." : "Criar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal: Atribuir Competência a Utilizador ─────────────────────────────────
function AssignModal({ onClose, onAssigned, competencies }: { onClose: () => void; onAssigned: () => void; competencies: Competency[] }) {
  const [form, setForm] = useState({ userId: "", competencyId: "", level: "3" });
  const [saving, setSaving] = useState(false);
  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try { await api.post("/competencies/user", { userId: +form.userId, competencyId: +form.competencyId, level: +form.level }); onAssigned(); onClose(); }
    catch (e: any) { alert(e.message); } finally { setSaving(false); }
  }
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ ...card, width: "100%", maxWidth: 440, boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1e293b" }}>🎯 Atribuir Competência</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
        </div>
        <form onSubmit={submit}>
          <div style={{ marginBottom: 14 }}><span style={labelStyle}>ID do Utilizador *</span><input style={inputStyle} type="number" value={form.userId} onChange={e => set("userId", e.target.value)} required /></div>
          <div style={{ marginBottom: 14 }}>
            <span style={labelStyle}>Competência *</span>
            <select style={inputStyle} value={form.competencyId} onChange={e => set("competencyId", e.target.value)} required>
              <option value="">Selecciona...</option>
              {competencies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 20 }}>
            <span style={labelStyle}>Nível (1–5)</span>
            <div style={{ display: "flex", gap: 8 }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} type="button" onClick={() => set("level", String(n))} style={{ flex: 1, padding: "8px 0", border: `2px solid ${+form.level === n ? LEVEL_CONFIG[n-1].color : "#e2e8f0"}`, borderRadius: 8, background: +form.level === n ? LEVEL_CONFIG[n-1].bg : "#fff", color: +form.level === n ? LEVEL_CONFIG[n-1].color : "#94a3b8", fontWeight: +form.level === n ? 700 : 500, cursor: "pointer", fontSize: 13 }}>
                  {n}
                </button>
              ))}
            </div>
            <p style={{ margin: "6px 0 0", fontSize: 12, color: LEVEL_CONFIG[+form.level-1]?.color }}>{LEVEL_CONFIG[+form.level-1]?.label}</p>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={btnGhost}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>{saving ? "A atribuir..." : "Atribuir"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Gap Analysis Panel ───────────────────────────────────────────────────────
function GapPanel({ onClose }: { onClose: () => void }) {
  const [userId, setUserId] = useState("");
  const [positionId, setPositionId] = useState("");
  const [result, setResult] = useState<GapResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function analyse() {
    if (!userId || !positionId) return;
    setLoading(true);
    try { const r = await api.get<GapResult>(`/competencies/user/${userId}/gap/${positionId}`); setResult(r); }
    catch (e: any) { alert(e.message); } finally { setLoading(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ ...card, width: "100%", maxWidth: 560, maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1e293b" }}>📊 Análise de Gap</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
        </div>
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 140 }}><span style={labelStyle}>ID Utilizador</span><input style={inputStyle} type="number" value={userId} onChange={e => setUserId(e.target.value)} placeholder="Ex: 1" /></div>
          <div style={{ flex: 1, minWidth: 140 }}><span style={labelStyle}>ID Cargo/Posição</span><input style={inputStyle} type="number" value={positionId} onChange={e => setPositionId(e.target.value)} placeholder="Ex: 2" /></div>
          <div style={{ display: "flex", alignItems: "flex-end" }}><button onClick={analyse} disabled={loading || !userId || !positionId} style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}>{loading ? "..." : "Analisar"}</button></div>
        </div>

        {result && (
          <>
            {/* Readiness */}
            <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "16px 20px", background: result.readinessPercent >= 80 ? "#ecfdf5" : result.readinessPercent >= 50 ? "#fffbeb" : "#fef2f2", borderRadius: 10, marginBottom: 20, border: `1px solid ${result.readinessPercent >= 80 ? "#bbf7d0" : result.readinessPercent >= 50 ? "#fde68a" : "#fecaca"}` }}>
              <div style={{ textAlign: "center", flexShrink: 0 }}>
                <p style={{ margin: 0, fontSize: 36, fontWeight: 800, color: result.readinessPercent >= 80 ? "#16a34a" : result.readinessPercent >= 50 ? "#f59e0b" : "#dc2626" }}>{result.readinessPercent}%</p>
                <p style={{ margin: 0, fontSize: 11, color: "#64748b", fontWeight: 600 }}>Prontidão</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Gap Total: {result.totalGap} pontos</p>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>{result.gaps.filter(g => g.met).length} de {result.gaps.length} competências atingidas</p>
              </div>
            </div>

            {/* Gap list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {result.gaps.map((g, i) => (
                <div key={i} style={{ padding: "12px 16px", borderRadius: 10, background: g.met ? "#f0fdf4" : "#fef9f0", border: `1px solid ${g.met ? "#bbf7d0" : "#fed7aa"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{g.competency.name}</p>
                    <span style={{ fontSize: 12, fontWeight: 700, color: g.met ? "#16a34a" : "#f97316" }}>{g.met ? "✅ Atingida" : `Gap: ${g.gap}`}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div><p style={{ margin: "0 0 4px", fontSize: 11, color: "#64748b" }}>Nível Actual</p><LevelBar level={g.currentLevel} color={g.met ? "#16a34a" : "#f97316"} /></div>
                    <div><p style={{ margin: "0 0 4px", fontSize: 11, color: "#64748b" }}>Nível Requerido</p><LevelBar level={g.requiredLevel} color="#1e40af" /></div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
type Tab = "catalog"|"my";

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function CompetenciasPage() {
  const [tab, setTab] = useState<Tab>("catalog");
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [myComps, setMyComps] = useState<UserCompetency[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showGap, setShowGap] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success"|"error" } | null>(null);

  function showToast(msg: string, type: "success"|"error") { setToast({ msg, type }); }

  async function fetchAll() {
    setLoading(true);
    try {
      const p = new URLSearchParams({ limit: "50" });
      if (search) p.set("search", search);
      const [res, my] = await Promise.all([
        api.get<any>(`/competencies?${p}`),
        api.get<UserCompetency[]>("/competencies/my").catch(() => []),
      ]);
      setCompetencies(res.data ?? []); setTotal(res.total ?? 0);
      setMyComps(my);
    } catch {} finally { setLoading(false); }
  }

  useEffect(() => { fetchAll(); }, [search]);

  // Stats
  const avgLevel = myComps.length ? +(myComps.reduce((s, c) => s + c.level, 0) / myComps.length).toFixed(1) : 0;
  const maxLevel = myComps.length ? Math.max(...myComps.map(c => c.level)) : 0;
  const gapComps = myComps.filter(c => c.level < 4).length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", margin: 0 }}>🧠 Competências</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Catálogo de competências e perfil de desenvolvimento</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => setShowGap(true)} style={{ ...btnGhost, background: "#f5f3ff", color: "#7c3aed" }}>📊 Análise de Gap</button>
          <button onClick={() => setShowAssign(true)} style={btnGhost}>🎯 Atribuir</button>
          <button onClick={() => setShowCreate(true)} style={btnPrimary}>+ Nova Competência</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total no Catálogo", value: total, icon: "🧠", color: "#1e40af", bg: "#eff6ff" },
          { label: "Minhas Competências", value: myComps.length, icon: "👤", color: "#16a34a", bg: "#ecfdf5" },
          { label: "Nível Médio", value: avgLevel, icon: "📊", color: "#7c3aed", bg: "#f5f3ff" },
          { label: "A Desenvolver", value: gapComps, icon: "⚡", color: "#f59e0b", bg: "#fffbeb" },
        ].map(s => (
          <div key={s.label} style={{ ...card, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{s.icon}</div>
            <div><p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</p><p style={{ margin: 0, fontSize: 11, color: "#64748b", fontWeight: 600 }}>{s.label}</p></div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 10, padding: 4, marginBottom: 24, width: "fit-content" }}>
        {([["catalog","📚 Catálogo"],["my","👤 As Minhas"]] as [Tab,string][]).map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding: "8px 20px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: tab === k ? 700 : 500, borderRadius: 8, background: tab === k ? "#1e40af" : "transparent", color: tab === k ? "#fff" : "#64748b", transition: "all 0.15s" }}>{l}</button>
        ))}
      </div>

      {/* Pesquisa */}
      {tab === "catalog" && (
        <input style={{ ...inputStyle, maxWidth: 300, marginBottom: 20 }} placeholder="🔍 Pesquisar competência..." value={search} onChange={e => setSearch(e.target.value)} />
      )}

      {loading ? <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>A carregar...</div> :

        tab === "catalog" ? (
          competencies.length === 0 ? (
            <div style={{ ...card, textAlign: "center", padding: 60 }}><p style={{ fontSize: 32, marginBottom: 12 }}>🧠</p><p style={{ color: "#94a3b8", fontSize: 14 }}>Nenhuma competência no catálogo.</p></div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
              {competencies.map(c => (
                <div key={c.id} style={{ ...card, padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🧠</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{c.name}</h3>
                      {c.description && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{c.description}</p>}
                    </div>
                  </div>
                  {c._count && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "#f1f5f9", color: "#64748b" }}>👥 {c._count.userCompetencies} colaboradores</span>
                      <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "#eff6ff", color: "#1e40af" }}>📚 {c._count.courses} cursos</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          myComps.length === 0 ? (
            <div style={{ ...card, textAlign: "center", padding: 60 }}>
              <p style={{ fontSize: 32, marginBottom: 12 }}>🧠</p>
              <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 16px" }}>Ainda não tens competências atribuídas.</p>
              <button onClick={() => setShowAssign(true)} style={btnPrimary}>🎯 Atribuir Competência</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {myComps.map(uc => (
                <div key={uc.id} style={{ ...card, padding: 16, borderLeft: `4px solid ${LEVEL_CONFIG[uc.level-1]?.color ?? "#64748b"}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{uc.competency.name}</h3>
                        <LevelBadge level={uc.level} />
                      </div>
                      {uc.competency.description && <p style={{ margin: "0 0 8px", fontSize: 12, color: "#64748b" }}>{uc.competency.description}</p>}
                      <LevelBar level={uc.level} />
                    </div>
                    {uc.evaluatedAt && (
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>Avaliado em</p>
                        <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b", fontWeight: 600 }}>{new Date(uc.evaluatedAt).toLocaleDateString("pt-PT")}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )
      }

      {/* Modais */}
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={() => { fetchAll(); showToast("Competência criada!", "success"); }} />}
      {showAssign && <AssignModal onClose={() => setShowAssign(false)} competencies={competencies} onAssigned={() => { fetchAll(); showToast("Competência atribuída!", "success"); }} />}
      {showGap && <GapPanel onClose={() => setShowGap(false)} />}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}