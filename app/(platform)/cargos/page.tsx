"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Department { id: number; name: string; _count?: { users: number; units: number }; units?: Unit[]; }
interface Unit { id: number; name: string; tipo: string; province?: string; departmentId?: number; department?: Department; _count?: { users: number }; }
interface Role { id: number; name: string; description?: string; permissions?: { id: number; name: string }[]; _count?: { users: number }; }
interface Position { id: number; name: string; level?: string; department?: string; _count?: { users: number; successionPlans: number }; }
interface CareerPosition { id: number; title: string; description?: string; level: string; competencies?: { competency: { name: string }; requiredLevel: number }[]; _count?: { users: number }; }
interface CareerHistory { id: number; positionId: number; startedAt: string; endedAt?: string; position: CareerPosition; }

// ─── Styles ───────────────────────────────────────────────────────────────────
const card: React.CSSProperties = { background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: 24 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, color: "#1e293b", background: "#fff", outline: "none", boxSizing: "border-box" };
const labelStyle: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#64748b", marginBottom: 6 };
const btnPrimary: React.CSSProperties = { padding: "10px 20px", background: "#1e40af", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" };
const btnGhost: React.CSSProperties = { padding: "8px 14px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" };
const btnDanger: React.CSSProperties = { padding: "6px 12px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer" };

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

// ─── Generic Modal ────────────────────────────────────────────────────────────
function GenericModal({ title, fields, onClose, onSave }: {
  title: string;
  fields: { key: string; label: string; type?: string; options?: string[]; required?: boolean }[];
  onClose: () => void;
  onSave: (data: Record<string, any>) => Promise<void>;
}) {
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  function set(k: string, v: any) { setForm(f => ({ ...f, [k]: v })); }
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    try { await onSave(form); onClose(); }
    catch (e: any) { setError(e.message ?? "Erro ao guardar"); }
    finally { setSaving(false); }
  }
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ ...card, width: "100%", maxWidth: 460, boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1e293b" }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
        </div>
        <form onSubmit={submit}>
          {fields.map(f => (
            <div key={f.key} style={{ marginBottom: 14 }}>
              <span style={labelStyle}>{f.label}{f.required ? " *" : ""}</span>
              {f.options ? (
                <select style={inputStyle} value={form[f.key] ?? ""} onChange={e => set(f.key, e.target.value)} required={f.required}>
                  <option value="">Selecciona...</option>
                  {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input style={inputStyle} type={f.type ?? "text"} value={form[f.key] ?? ""} onChange={e => set(f.key, f.type === "number" ? +e.target.value : e.target.value)} required={f.required} />
              )}
            </div>
          ))}
          {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}><p style={{ margin: 0, fontSize: 13, color: "#dc2626" }}>{error}</p></div>}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
            <button type="button" onClick={onClose} style={btnGhost}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>{saving ? "A guardar..." : "Criar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title, count, onAdd, addLabel }: { title: string; count: number; onAdd: () => void; addLabel: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1e293b" }}>{title}</h2>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>{count} registo(s)</p>
      </div>
      <button onClick={onAdd} style={btnPrimary}>+ {addLabel}</button>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
type Tab = "departments" | "units" | "positions" | "roles" | "careers";

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function CargosPage() {
  const [tab, setTab] = useState<Tab>("departments");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [careers, setCareers] = useState<CareerPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [initingRoles, setInitingRoles] = useState(false);

  function showToast(msg: string, type: "success" | "error") { setToast({ msg, type }); }

  async function fetchAll() {
    setLoading(true);
    try {
      const [d, u, p, r, c] = await Promise.all([
        api.get<Department[]>("/departments"),
        api.get<Unit[]>("/units"),
        api.get<Position[]>("/positions"),
        api.get<Role[]>("/roles"),
        api.get<CareerPosition[]>("/careers/ladder"),
      ]);
      setDepartments(d); setUnits(u); setPositions(p); setRoles(r); setCareers(c);
    } catch (e: any) { showToast(e.message ?? "Erro ao carregar", "error"); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchAll(); }, []);

  async function remove(endpoint: string, id: number, name: string) {
    if (!confirm(`Remover "${name}"?`)) return;
    try { await api.delete(`${endpoint}/${id}`); showToast("Removido com sucesso!", "success"); fetchAll(); }
    catch (e: any) { showToast(e.message, "error"); }
  }

  async function initRoles() {
    setInitingRoles(true);
    try { const r = await api.post<any>("/roles/init-defaults", {}); showToast(`${r.created} roles criados!`, "success"); fetchAll(); }
    catch (e: any) { showToast(e.message, "error"); } finally { setInitingRoles(false); }
  }

  const TABS: [Tab, string, string][] = [
    ["departments", "🏢 Departamentos", `${departments.length}`],
    ["units",       "📍 Unidades",      `${units.length}`],
    ["positions",   "💼 Cargos",        `${positions.length}`],
    ["roles",       "🔑 Roles",         `${roles.length}`],
    ["careers",     "🗺️ Carreira",      `${careers.length}`],
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", margin: 0 }}>🏗️ Estrutura Organizacional</h1>
        <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Departamentos, unidades, cargos, roles e percursos de carreira</p>
      </div>

      {/* Stats rápidas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Departamentos", value: departments.length, icon: "🏢", color: "#1e40af", bg: "#eff6ff" },
          { label: "Unidades",      value: units.length,       icon: "📍", color: "#16a34a", bg: "#ecfdf5" },
          { label: "Cargos",        value: positions.length,   icon: "💼", color: "#7c3aed", bg: "#f5f3ff" },
          { label: "Roles",         value: roles.length,       icon: "🔑", color: "#f59e0b", bg: "#fffbeb" },
          { label: "Carreira",      value: careers.length,     icon: "🗺️", color: "#0ea5e9", bg: "#f0f9ff" },
        ].map(s => (
          <div key={s.label} style={{ ...card, padding: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{s.icon}</div>
            <div><p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</p><p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>{s.label}</p></div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 10, padding: 4, marginBottom: 24, flexWrap: "wrap" }}>
        {TABS.map(([k, l, count]) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding: "8px 16px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: tab === k ? 700 : 500, borderRadius: 8, background: tab === k ? "#1e40af" : "transparent", color: tab === k ? "#fff" : "#64748b", transition: "all 0.15s", display: "flex", alignItems: "center", gap: 6 }}>
            {l} <span style={{ fontSize: 11, padding: "1px 6px", borderRadius: 20, background: tab === k ? "rgba(255,255,255,0.25)" : "#e2e8f0", color: tab === k ? "#fff" : "#64748b" }}>{count}</span>
          </button>
        ))}
      </div>

      {loading ? <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>A carregar...</div> : (
        <>
          {/* ── DEPARTAMENTOS ── */}
          {tab === "departments" && (
            <div>
              <SectionHeader title="🏢 Departamentos" count={departments.length} onAdd={() => setModal("dept")} addLabel="Departamento" />
              {departments.length === 0 ? <div style={{ ...card, textAlign: "center", padding: 40 }}><p style={{ color: "#94a3b8" }}>Nenhum departamento criado.</p></div> :
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                  {departments.map(d => (
                    <div key={d.id} style={{ ...card, padding: 18 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 10, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🏢</div>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{d.name}</h3>
                          <div style={{ display: "flex", gap: 8 }}>
                            <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "#eff6ff", color: "#1e40af" }}>👥 {d._count?.users ?? 0} colaboradores</span>
                            <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "#ecfdf5", color: "#16a34a" }}>📍 {d._count?.units ?? 0} unidades</span>
                          </div>
                        </div>
                        <button onClick={() => remove("/departments", d.id, d.name)} style={btnDanger}>🗑️</button>
                      </div>
                      {d.units && d.units.length > 0 && (
                        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #f1f5f9" }}>
                          {d.units.map(u => <span key={u.id} style={{ display: "inline-block", margin: "2px", padding: "2px 8px", borderRadius: 20, fontSize: 10, background: "#f1f5f9", color: "#64748b" }}>📍 {u.name}</span>)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>}
              {modal === "dept" && <GenericModal title="🏢 Novo Departamento" fields={[{ key: "name", label: "Nome", required: true }]} onClose={() => setModal(null)} onSave={async data => { await api.post("/departments", data); showToast("Departamento criado!", "success"); fetchAll(); }} />}
            </div>
          )}

          {/* ── UNIDADES ── */}
          {tab === "units" && (
            <div>
              <SectionHeader title="📍 Unidades" count={units.length} onAdd={() => setModal("unit")} addLabel="Unidade" />
              {units.length === 0 ? <div style={{ ...card, textAlign: "center", padding: 40 }}><p style={{ color: "#94a3b8" }}>Nenhuma unidade criada.</p></div> :
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                  {units.map(u => (
                    <div key={u.id} style={{ ...card, padding: 18 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 10, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>📍</div>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{u.name}</h3>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 11, background: "#f1f5f9", color: "#64748b" }}>{u.tipo}</span>
                            {u.province && <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 11, background: "#f0f9ff", color: "#0ea5e9" }}>📌 {u.province}</span>}
                            {u.department && <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 11, background: "#eff6ff", color: "#1e40af" }}>🏢 {u.department.name}</span>}
                            <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 11, background: "#ecfdf5", color: "#16a34a" }}>👥 {u._count?.users ?? 0}</span>
                          </div>
                        </div>
                        <button onClick={() => remove("/units", u.id, u.name)} style={btnDanger}>🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>}
              {modal === "unit" && <GenericModal title="📍 Nova Unidade" fields={[
                { key: "name", label: "Nome", required: true },
                { key: "tipo", label: "Tipo", required: true, options: ["SEDE", "REGIONAL", "FILIAL", "DELEGAÇÃO"] },
                { key: "province", label: "Província" },
                { key: "departmentId", label: "ID do Departamento", type: "number" },
              ]} onClose={() => setModal(null)} onSave={async data => { await api.post("/units", data); showToast("Unidade criada!", "success"); fetchAll(); }} />}
            </div>
          )}

          {/* ── CARGOS / POSIÇÕES ── */}
          {tab === "positions" && (
            <div>
              <SectionHeader title="💼 Cargos" count={positions.length} onAdd={() => setModal("position")} addLabel="Cargo" />
              {positions.length === 0 ? <div style={{ ...card, textAlign: "center", padding: 40 }}><p style={{ color: "#94a3b8" }}>Nenhum cargo criado.</p></div> :
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
                  {positions.map(p => (
                    <div key={p.id} style={{ ...card, padding: 18 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 10, background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>💼</div>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{p.name}</h3>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {p.level && <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 11, background: "#eff6ff", color: "#1e40af" }}>{p.level}</span>}
                            {p.department && <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 11, background: "#f1f5f9", color: "#64748b" }}>🏢 {p.department}</span>}
                            <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 11, background: "#ecfdf5", color: "#16a34a" }}>👥 {p._count?.users ?? 0}</span>
                          </div>
                        </div>
                        <button onClick={() => remove("/positions", p.id, p.name)} style={btnDanger}>🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>}
              {modal === "position" && <GenericModal title="💼 Novo Cargo" fields={[
                { key: "name", label: "Nome", required: true },
                { key: "level", label: "Nível", options: ["JUNIOR", "PLENO", "SENIOR", "ESPECIALISTA", "GESTOR", "DIRECTOR"] },
                { key: "department", label: "Departamento" },
              ]} onClose={() => setModal(null)} onSave={async data => { await api.post("/positions", data); showToast("Cargo criado!", "success"); fetchAll(); }} />}
            </div>
          )}

          {/* ── ROLES ── */}
          {tab === "roles" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1e293b" }}>🔑 Roles</h2>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>{roles.length} registo(s)</p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={initRoles} disabled={initingRoles} style={{ ...btnGhost, opacity: initingRoles ? 0.7 : 1 }}>🔧 Inicializar Padrões</button>
                  <button onClick={() => setModal("role")} style={btnPrimary}>+ Role</button>
                </div>
              </div>
              {roles.length === 0 ? <div style={{ ...card, textAlign: "center", padding: 40 }}><p style={{ color: "#94a3b8", margin: "0 0 16px" }}>Nenhuma role criada.</p><button onClick={initRoles} style={btnPrimary}>🔧 Inicializar Padrões</button></div> :
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {roles.map(r => (
                    <div key={r.id} style={{ ...card, padding: 18 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#1e40af,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 18, flexShrink: 0 }}>{r.name.charAt(0)}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{r.name}</h3>
                            <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 11, background: "#eff6ff", color: "#1e40af" }}>👥 {r._count?.users ?? 0} utilizadores</span>
                          </div>
                          {r.description && <p style={{ margin: "0 0 8px", fontSize: 12, color: "#64748b" }}>{r.description}</p>}
                          {r.permissions && r.permissions.length > 0 && (
                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                              {r.permissions.slice(0, 6).map(p => (
                                <span key={p.id} style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: "#ecfdf5", color: "#16a34a" }}>✓ {p.name}</span>
                              ))}
                              {r.permissions.length > 6 && <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, color: "#94a3b8" }}>+{r.permissions.length - 6}</span>}
                            </div>
                          )}
                        </div>
                        <button onClick={() => remove("/roles", r.id, r.name)} style={btnDanger}>🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>}
              {modal === "role" && <GenericModal title="🔑 Nova Role" fields={[
                { key: "name", label: "Nome", required: true },
                { key: "description", label: "Descrição" },
              ]} onClose={() => setModal(null)} onSave={async data => { await api.post("/roles", data); showToast("Role criada!", "success"); fetchAll(); }} />}
            </div>
          )}

          {/* ── CARREIRA ── */}
          {tab === "careers" && (
            <div>
              <SectionHeader title="🗺️ Percurso de Carreira" count={careers.length} onAdd={() => setModal("career")} addLabel="Posição" />
              {careers.length === 0 ? <div style={{ ...card, textAlign: "center", padding: 40 }}><p style={{ color: "#94a3b8" }}>Nenhuma posição de carreira definida.</p></div> :
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {careers.map((c, i) => (
                    <div key={c.id} style={{ ...card, padding: 18, borderLeft: "4px solid #0ea5e9" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: "#f0f9ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                          {i + 1 === 1 ? "🥉" : i + 1 === 2 ? "🥈" : i + 1 === 3 ? "🥇" : "⭐"}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1e293b" }}>{c.title}</h3>
                            <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "#f0f9ff", color: "#0ea5e9" }}>Nível {c.level}</span>
                            <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 11, background: "#eff6ff", color: "#1e40af" }}>👥 {c._count?.users ?? 0}</span>
                          </div>
                          {c.description && <p style={{ margin: "0 0 8px", fontSize: 12, color: "#64748b" }}>{c.description}</p>}
                          {c.competencies && c.competencies.length > 0 && (
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              {c.competencies.map((comp, j) => (
                                <span key={j} style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: "#f5f3ff", color: "#7c3aed" }}>🧠 {comp.competency.name} (nível {comp.requiredLevel})</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>}
              {modal === "career" && <GenericModal title="🗺️ Nova Posição de Carreira" fields={[
                { key: "title", label: "Título", required: true },
                { key: "description", label: "Descrição" },
                { key: "level", label: "Nível", required: true, options: ["1", "2", "3", "4", "5"] },
              ]} onClose={() => setModal(null)} onSave={async data => { await api.post("/careers/positions", data); showToast("Posição criada!", "success"); fetchAll(); }} />}
            </div>
          )}
        </>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}