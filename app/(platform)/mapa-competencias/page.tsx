"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Mapping {
  id: number; currentLevel: number; targetLevel: number;
  notes?: string; assessedAt?: string;
  competency: { id: number; name: string; description?: string };
}
interface MyMap { userId: number; mappings: Mapping[]; gapCount: number; gaps: Mapping[]; }
interface DeptSummary { name: string; avgCurrent: number; avgTarget: number; gap: number; count: number; }
interface DeptMap { departmentId: number; totalUsers: number; summary: DeptSummary[]; }
interface GapItem { user: { id: number; fullName: string; department?: { name: string } }; competency: { name: string }; currentLevel: number; targetLevel: number; gap: number; }
interface GapAnalysis { totalGaps: number; gaps: GapItem[]; }

// ─── Styles ───────────────────────────────────────────────────────────────────
const card: React.CSSProperties = { background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: 24 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, color: "#1e293b", background: "#fff", outline: "none", boxSizing: "border-box" };
const labelStyle: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#64748b", marginBottom: 6 };
const btnPrimary: React.CSSProperties = { padding: "10px 20px", background: "#1e40af", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" };
const btnGhost: React.CSSProperties = { padding: "10px 18px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" };

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

// ─── Dual Bar ─────────────────────────────────────────────────────────────────
function DualBar({ current, target, max = 5 }: { current: number; target: number; max?: number }) {
  const hasGap = target > current;
  return (
    <div style={{ position: "relative", height: 10, background: "#e2e8f0", borderRadius: 5, overflow: "hidden" }}>
      {/* target */}
      <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${(target / max) * 100}%`, background: "#bfdbfe", borderRadius: 5 }} />
      {/* current */}
      <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${(current / max) * 100}%`, background: hasGap ? "#f97316" : "#16a34a", borderRadius: 5, transition: "width 0.5s" }} />
    </div>
  );
}

// ─── Modal: Registar Mapeamento ───────────────────────────────────────────────
function UpsertModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ userId: "", competencyId: "", currentLevel: "1", targetLevel: "3", assessedById: "", notes: "" });
  const [saving, setSaving] = useState(false);
  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      await api.post("/competency-map", {
        userId: +form.userId, competencyId: +form.competencyId,
        currentLevel: +form.currentLevel, targetLevel: +form.targetLevel,
        assessedById: form.assessedById ? +form.assessedById : undefined,
        notes: form.notes || undefined,
      });
      onSaved(); onClose();
    } catch (e: any) { alert(e.message); } finally { setSaving(false); }
  }

  const LevelSelect = ({ k, val }: { k: string; val: string }) => (
    <div style={{ display: "flex", gap: 6 }}>
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button" onClick={() => set(k, String(n))} style={{ flex: 1, padding: "7px 0", border: `2px solid ${+val === n ? "#1e40af" : "#e2e8f0"}`, borderRadius: 7, background: +val === n ? "#eff6ff" : "#fff", color: +val === n ? "#1e40af" : "#94a3b8", fontWeight: +val === n ? 700 : 500, cursor: "pointer", fontSize: 13 }}>{n}</button>
      ))}
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ ...card, width: "100%", maxWidth: 480, boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1e293b" }}>🗺️ Registar Mapeamento</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
        </div>
        <form onSubmit={submit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div><span style={labelStyle}>ID Utilizador *</span><input style={inputStyle} type="number" value={form.userId} onChange={e => set("userId", e.target.value)} required /></div>
            <div><span style={labelStyle}>ID Competência *</span><input style={inputStyle} type="number" value={form.competencyId} onChange={e => set("competencyId", e.target.value)} required /></div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <span style={labelStyle}>Nível Actual</span>
            <LevelSelect k="currentLevel" val={form.currentLevel} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <span style={labelStyle}>Nível Alvo</span>
            <LevelSelect k="targetLevel" val={form.targetLevel} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div><span style={labelStyle}>ID Avaliador</span><input style={inputStyle} type="number" value={form.assessedById} onChange={e => set("assessedById", e.target.value)} /></div>
          </div>
          <div style={{ marginBottom: 20 }}><span style={labelStyle}>Notas</span><textarea style={{ ...inputStyle, height: 68, resize: "vertical" }} value={form.notes} onChange={e => set("notes", e.target.value)} /></div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={btnGhost}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>{saving ? "A guardar..." : "Guardar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Tab Types ────────────────────────────────────────────────────────────────
type Tab = "my" | "dept" | "gap";

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function CompetencyMapPage() {
  const [tab, setTab] = useState<Tab>("my");
  const [myMap, setMyMap] = useState<MyMap | null>(null);
  const [deptMap, setDeptMap] = useState<DeptMap | null>(null);
  const [gapData, setGapData] = useState<GapAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [deptId, setDeptId] = useState("");
  const [gapDeptId, setGapDeptId] = useState("");
  const [showUpsert, setShowUpsert] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  async function fetchMy() {
    setLoading(true);
    try { const d = await api.get<MyMap>("/competency-map/my"); setMyMap(d); }
    catch {} finally { setLoading(false); }
  }

  async function fetchDept() {
    if (!deptId) return;
    setLoading(true);
    try { const d = await api.get<DeptMap>(`/competency-map/department/${deptId}`); setDeptMap(d); }
    catch (e: any) { setToast({ msg: e.message, type: "error" }); } finally { setLoading(false); }
  }

  async function fetchGap() {
    setLoading(true);
    try {
      const p = gapDeptId ? `?departmentId=${gapDeptId}` : "";
      const d = await api.get<GapAnalysis>(`/competency-map/gap-analysis${p}`);
      setGapData(d);
    } catch (e: any) { setToast({ msg: e.message, type: "error" }); } finally { setLoading(false); }
  }

  useEffect(() => { if (tab === "my") fetchMy(); }, [tab]);

  const myStats = myMap ? {
    total: myMap.mappings.length,
    gaps: myMap.gapCount,
    avgCurrent: myMap.mappings.length ? +(myMap.mappings.reduce((s, m) => s + m.currentLevel, 0) / myMap.mappings.length).toFixed(1) : 0,
    ready: myMap.mappings.filter(m => m.currentLevel >= m.targetLevel).length,
  } : null;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", margin: 0 }}>🗺️ Mapa de Competências</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Níveis actuais, alvos e análise de lacunas</p>
        </div>
        <button onClick={() => setShowUpsert(true)} style={btnPrimary}>+ Registar Mapeamento</button>
      </div>

      {/* Stats (tab my) */}
      {tab === "my" && myStats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Competências Mapeadas", value: myStats.total, icon: "🧠", color: "#1e40af", bg: "#eff6ff" },
            { label: "Com Lacuna",            value: myStats.gaps,  icon: "⚡", color: "#f59e0b", bg: "#fffbeb" },
            { label: "Nível Médio Actual",    value: myStats.avgCurrent, icon: "📊", color: "#7c3aed", bg: "#f5f3ff" },
            { label: "Objectivos Atingidos",  value: myStats.ready, icon: "✅", color: "#16a34a", bg: "#ecfdf5" },
          ].map(s => (
            <div key={s.label} style={{ ...card, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{s.icon}</div>
              <div><p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</p><p style={{ margin: 0, fontSize: 11, color: "#64748b", fontWeight: 600 }}>{s.label}</p></div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 10, padding: 4, marginBottom: 24, width: "fit-content" }}>
        {([["my","👤 O Meu Mapa"],["dept","🏢 Departamento"],["gap","🔍 Análise de Gaps"]] as [Tab,string][]).map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding: "8px 20px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: tab === k ? 700 : 500, borderRadius: 8, background: tab === k ? "#1e40af" : "transparent", color: tab === k ? "#fff" : "#64748b", transition: "all 0.15s" }}>{l}</button>
        ))}
      </div>

      {/* ── Tab: Meu Mapa ── */}
      {tab === "my" && (
        loading ? <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>A carregar...</div> :
        !myMap || myMap.mappings.length === 0 ? (
          <div style={{ ...card, textAlign: "center", padding: 60 }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>🗺️</p>
            <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 16px" }}>Ainda não tens competências mapeadas.</p>
            <button onClick={() => setShowUpsert(true)} style={btnPrimary}>+ Registar Mapeamento</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {myMap.mappings.map(m => {
              const hasGap = m.targetLevel > m.currentLevel;
              return (
                <div key={m.id} style={{ ...card, padding: 18, borderLeft: `4px solid ${hasGap ? "#f97316" : "#16a34a"}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{m.competency.name}</h3>
                        {hasGap
                          ? <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: "#fff7ed", color: "#f97316" }}>Gap: {m.targetLevel - m.currentLevel}</span>
                          : <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: "#ecfdf5", color: "#16a34a" }}>✅ Atingido</span>}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 8 }}>
                        <div>
                          <p style={{ margin: "0 0 4px", fontSize: 11, color: "#64748b" }}>Nível Actual <strong style={{ color: "#f97316" }}>{m.currentLevel}/5</strong></p>
                          <DualBar current={m.currentLevel} target={m.targetLevel} />
                        </div>
                        <div>
                          <p style={{ margin: "0 0 4px", fontSize: 11, color: "#64748b" }}>Nível Alvo <strong style={{ color: "#1e40af" }}>{m.targetLevel}/5</strong></p>
                          <div style={{ height: 10, background: "#e2e8f0", borderRadius: 5, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${(m.targetLevel / 5) * 100}%`, background: "#bfdbfe", borderRadius: 5 }} />
                          </div>
                        </div>
                      </div>
                      {m.notes && <p style={{ margin: 0, fontSize: 12, color: "#64748b", fontStyle: "italic" }}>"{m.notes}"</p>}
                    </div>
                    {m.assessedAt && (
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>Avaliado em</p>
                        <p style={{ margin: "2px 0 0", fontSize: 12, color: "#475569", fontWeight: 600 }}>{new Date(m.assessedAt).toLocaleDateString("pt-PT")}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── Tab: Departamento ── */}
      {tab === "dept" && (
        <div>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap" }}>
            <div style={{ minWidth: 200 }}><span style={labelStyle}>ID do Departamento</span><input style={inputStyle} type="number" value={deptId} onChange={e => setDeptId(e.target.value)} placeholder="Ex: 1" /></div>
            <button onClick={fetchDept} disabled={!deptId || loading} style={{ ...btnPrimary, opacity: !deptId ? 0.5 : 1 }}>🔍 Carregar</button>
          </div>

          {loading && deptMap === null ? <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>A carregar...</div> :
            !deptMap ? <div style={{ ...card, textAlign: "center", padding: 60 }}><p style={{ fontSize: 32, marginBottom: 12 }}>🏢</p><p style={{ color: "#94a3b8", fontSize: 14 }}>Insere o ID do departamento para ver o mapa.</p></div> :
            <div>
              <div style={{ ...card, marginBottom: 16, background: "#eff6ff", border: "1px solid #bfdbfe" }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e40af" }}>Departamento #{deptMap.departmentId} — {deptMap.totalUsers} colaboradores activos</p>
              </div>
              {deptMap.summary.length === 0 ? <div style={{ ...card, textAlign: "center", padding: 40 }}><p style={{ color: "#94a3b8" }}>Sem dados de competências para este departamento.</p></div> :
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {deptMap.summary.sort((a, b) => b.gap - a.gap).map((s, i) => (
                    <div key={i} style={{ ...card, padding: 16, borderLeft: `4px solid ${s.gap > 1 ? "#f97316" : s.gap > 0 ? "#f59e0b" : "#16a34a"}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{s.name}</h3>
                            <div style={{ display: "flex", gap: 8 }}>
                              <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "#eff6ff", color: "#1e40af" }}>Actual: {s.avgCurrent}</span>
                              <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "#f1f5f9", color: "#64748b" }}>Alvo: {s.avgTarget}</span>
                              {s.gap > 0 && <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "#fff7ed", color: "#f97316" }}>Gap: {s.gap}</span>}
                            </div>
                          </div>
                          <DualBar current={s.avgCurrent} target={s.avgTarget} />
                          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#94a3b8" }}>{s.count} avaliações</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>}
            </div>}
        </div>
      )}

      {/* ── Tab: Gap Analysis ── */}
      {tab === "gap" && (
        <div>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap" }}>
            <div style={{ minWidth: 200 }}><span style={labelStyle}>ID Departamento (opcional)</span><input style={inputStyle} type="number" value={gapDeptId} onChange={e => setGapDeptId(e.target.value)} placeholder="Todos os departamentos" /></div>
            <button onClick={fetchGap} disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}>🔍 Analisar Gaps</button>
          </div>

          {loading && !gapData ? <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>A carregar...</div> :
            !gapData ? <div style={{ ...card, textAlign: "center", padding: 60 }}><p style={{ fontSize: 32, marginBottom: 12 }}>🔍</p><p style={{ color: "#94a3b8", fontSize: 14 }}>Clica em "Analisar Gaps" para ver os resultados.</p></div> :
            <div>
              <div style={{ ...card, marginBottom: 16, background: gapData.totalGaps > 20 ? "#fef2f2" : "#fffbeb", border: `1px solid ${gapData.totalGaps > 20 ? "#fecaca" : "#fde68a"}` }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: gapData.totalGaps > 20 ? "#dc2626" : "#92400e" }}>⚠️ {gapData.totalGaps} lacuna(s) identificada(s)</p>
              </div>
              {gapData.gaps.length === 0 ? <div style={{ ...card, textAlign: "center", padding: 40 }}><p style={{ color: "#16a34a", fontSize: 14, fontWeight: 600 }}>✅ Sem lacunas identificadas!</p></div> :
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {gapData.gaps.slice(0, 50).map((g, i) => (
                    <div key={i} style={{ ...card, padding: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{g.user.fullName}</span>
                            {g.user.department && <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, background: "#f1f5f9", color: "#64748b" }}>{g.user.department.name}</span>}
                            <span style={{ fontSize: 13, color: "#64748b" }}>→ {g.competency.name}</span>
                          </div>
                          <DualBar current={g.currentLevel} target={g.targetLevel} />
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: g.gap > 2 ? "#dc2626" : "#f97316" }}>{g.gap}</p>
                          <p style={{ margin: 0, fontSize: 10, color: "#94a3b8" }}>gap</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {gapData.gaps.length > 50 && <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 13 }}>+{gapData.gaps.length - 50} mais lacunas...</p>}
                </div>}
            </div>}
        </div>
      )}

      {showUpsert && <UpsertModal onClose={() => setShowUpsert(false)} onSaved={() => { if (tab === "my") fetchMy(); setToast({ msg: "Mapeamento guardado!", type: "success" }); }} />}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}