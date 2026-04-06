"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Permission {
  id: number;
  name: string;
  action: string;
  subject: string;
  roleId: number;
}

interface Role {
  id: number;
  name: string;
  description?: string;
  permissions?: Permission[];
}

interface MyPermissions {
  userId: number;
  role: string;
  permissions: string[];
}

// ─── Shared Styles ────────────────────────────────────────────────────────────
const btnPrimary: React.CSSProperties = {
  padding: "10px 20px", background: "#1e40af", color: "#fff",
  border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
};
const btnGhost: React.CSSProperties = {
  padding: "10px 20px", background: "#f1f5f9", color: "#475569",
  border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
};
const btnDanger: React.CSSProperties = {
  padding: "6px 12px", background: "#fef2f2", color: "#dc2626",
  border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer",
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

// ─── Modal: Criar Permissão ───────────────────────────────────────────────────
function ModalCriarPermissao({ roles, onClose, onSave }: {
  roles: Role[]; onClose: () => void; onSave: () => void;
}) {
  const [name, setName]       = useState("");
  const [action, setAction]   = useState("");
  const [subject, setSubject] = useState("");
  const [roleId, setRoleId]   = useState("");
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState("");

  const ACTIONS  = ["read", "create", "update", "delete", "manage"];
  const SUBJECTS = ["users", "courses", "enrollments", "reports", "settings", "all"];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !action || !subject || !roleId) { setErr("Preencha todos os campos."); return; }
    setSaving(true); setErr("");
    try {
      // POST /acl/permissions — body: { name, action, subject, roleId }
      await api.post("/acl/permissions", { name, action, subject, roleId: +roleId });
      onSave();
    } catch (e: any) { setErr(e.message ?? "Erro ao criar permissão"); }
    finally { setSaving(false); }
  }

  return (
    <Overlay>
      <Modal title="Nova Permissão" onClose={onClose}>
        <form onSubmit={submit}>
          <Field label="Nome da Permissão">
            <input
              value={name} onChange={e => setName(e.target.value)}
              style={inputStyle} placeholder="ex: courses.read"
              required
            />
          </Field>
          <Field label="Acção">
            <select value={action} onChange={e => setAction(e.target.value)} style={inputStyle} required>
              <option value="">Seleccionar acção...</option>
              {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </Field>
          <Field label="Recurso (Subject)">
            <select value={subject} onChange={e => setSubject(e.target.value)} style={inputStyle} required>
              <option value="">Seleccionar recurso...</option>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Atribuir ao Role">
            <select value={roleId} onChange={e => setRoleId(e.target.value)} style={inputStyle} required>
              <option value="">Seleccionar role...</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </Field>
          {err && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 12 }}>{err}</p>}
          <ModalFooter onClose={onClose} saving={saving} label="Criar Permissão" />
        </form>
      </Modal>
    </Overlay>
  );
}

// ─── Modal: Atribuir Permissão a Role ────────────────────────────────────────
function ModalAtribuir({ roles, permissions, onClose, onSave }: {
  roles: Role[]; permissions: Permission[];
  onClose: () => void; onSave: () => void;
}) {
  const [roleId, setRoleId]           = useState("");
  const [permissionId, setPermissionId] = useState("");
  const [saving, setSaving]           = useState(false);
  const [err, setErr]                 = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!roleId || !permissionId) { setErr("Seleccione o role e a permissão."); return; }
    setSaving(true); setErr("");
    try {
      // POST /acl/roles/:roleId/permissions/:permissionId
      await api.post(`/acl/roles/${roleId}/permissions/${permissionId}`, {});
      onSave();
    } catch (e: any) { setErr(e.message ?? "Erro ao atribuir"); }
    finally { setSaving(false); }
  }

  return (
    <Overlay>
      <Modal title="Atribuir Permissão a Role" onClose={onClose}>
        <form onSubmit={submit}>
          <Field label="Role">
            <select value={roleId} onChange={e => setRoleId(e.target.value)} style={inputStyle} required>
              <option value="">Seleccionar role...</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </Field>
          <Field label="Permissão">
            <select value={permissionId} onChange={e => setPermissionId(e.target.value)} style={inputStyle} required>
              <option value="">Seleccionar permissão...</option>
              {permissions.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.action} · {p.subject})</option>
              ))}
            </select>
          </Field>
          {err && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 12 }}>{err}</p>}
          <ModalFooter onClose={onClose} saving={saving} label="Atribuir" />
        </form>
      </Modal>
    </Overlay>
  );
}

// ─── Painel: Role Detail ──────────────────────────────────────────────────────
function RoleDetail({ role, onRevoke }: {
  role: Role; onRevoke: (roleId: number, permId: number) => void;
}) {
  const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
    ADMIN:       { bg: "#fef2f2", color: "#dc2626" },
    RH:          { bg: "#fff7ed", color: "#ea580c" },
    LIDER:       { bg: "#eff6ff", color: "#1e40af" },
    COLABORADOR: { bg: "#f0fdf4", color: "#16a34a" },
  };
  const c = ROLE_COLORS[role.name] ?? { bg: "#f1f5f9", color: "#64748b" };

  return (
    <div style={{
      background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0",
      overflow: "hidden", marginBottom: 16,
    }}>
      {/* Header do role */}
      <div style={{
        padding: "14px 20px", background: c.bg,
        borderBottom: "1px solid #e2e8f0",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            width: 32, height: 32, borderRadius: 8, background: c.color,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 800, fontSize: 13,
          }}>
            {role.name.charAt(0)}
          </span>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#1e293b" }}>{role.name}</p>
            {role.description && (
              <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>{role.description}</p>
            )}
          </div>
        </div>
        <span style={{
          padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
          background: c.color + "22", color: c.color,
        }}>
          {role.permissions?.length ?? 0} permissões
        </span>
      </div>

      {/* Permissões */}
      <div style={{ padding: 16 }}>
        {!role.permissions?.length ? (
          <p style={{ color: "#94a3b8", fontSize: 13, margin: 0, textAlign: "center", padding: "8px 0" }}>
            Nenhuma permissão atribuída
          </p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {role.permissions.map(p => (
              <div key={p.id} style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "#f8fafc", border: "1px solid #e2e8f0",
                borderRadius: 8, padding: "5px 10px",
              }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: "#1e293b" }}>{p.name}</span>
                <span style={{ fontSize: 10, color: "#64748b" }}>({p.action} · {p.subject})</span>
                <button
                  onClick={() => onRevoke(role.id, p.id)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "#94a3b8", fontSize: 14, lineHeight: 1, padding: 0,
                    marginLeft: 2,
                  }}
                  title="Revogar permissão"
                >×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Helpers UI ───────────────────────────────────────────────────────────────
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

function Modal({ title, onClose, children }: {
  title: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div style={{
      background: "#fff", borderRadius: 16, padding: 32, width: 480,
      maxWidth: "95vw", boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
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
    <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
      <button type="button" onClick={onClose} style={btnGhost}>Cancelar</button>
      <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>
        {saving ? "A guardar..." : label}
      </button>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
type Tab = "minhas" | "permissoes" | "roles";

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function AclPage() {
  const [tab, setTab]                 = useState<Tab>("minhas");
  const [myPerms, setMyPerms]         = useState<MyPermissions | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles]             = useState<Role[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [search, setSearch]           = useState("");
  const [modalCriar, setModalCriar]   = useState(false);
  const [modalAtribuir, setModalAtribuir] = useState(false);

  function loadAll() {
    setLoading(true);
    Promise.all([
      // GET /acl/my-permissions
      api.get<MyPermissions>("/acl/my-permissions").catch(() => null),
      // GET /acl/permissions
      api.get<Permission[]>("/acl/permissions").catch(() => []),
      // GET roles (via roles-permissions ou roles)
      api.get<any>("/roles").catch(() => []),
    ]).then(async ([mp, perms, rolesData]) => {
      setMyPerms(mp);
      setPermissions(Array.isArray(perms) ? perms : []);

      // Para cada role, buscar as suas permissões
      const rolesArr: Role[] = Array.isArray(rolesData)
        ? rolesData
        : (rolesData?.data ?? []);

      const rolesWithPerms = await Promise.all(
        rolesArr.map(async (r: Role) => {
          try {
            // GET /acl/roles/:roleId/permissions
            const detail = await api.get<Role>(`/acl/roles/${r.id}/permissions`);
            return { ...r, permissions: detail?.permissions ?? [] };
          } catch { return { ...r, permissions: [] }; }
        })
      );
      setRoles(rolesWithPerms);
    })
    .catch(e => setError(e.message))
    .finally(() => setLoading(false));
  }

  useEffect(() => { loadAll(); }, []);

  async function revogar(roleId: number, permId: number) {
    if (!confirm("Revogar esta permissão do role?")) return;
    try {
      // DELETE /acl/roles/:roleId/permissions/:permissionId
      await api.delete(`/acl/roles/${roleId}/permissions/${permId}`);
      loadAll();
    } catch (e: any) { alert(e.message); }
  }

  const filteredPerms = search
    ? permissions.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.action.toLowerCase().includes(search.toLowerCase()) ||
        p.subject.toLowerCase().includes(search.toLowerCase())
      )
    : permissions;

  const TAB_STYLE = (active: boolean): React.CSSProperties => ({
    padding: "8px 20px", border: "none", cursor: "pointer", fontSize: 13,
    fontWeight: active ? 700 : 500, borderRadius: 8,
    background: active ? "#1e40af" : "transparent",
    color: active ? "#fff" : "#64748b",
    transition: "all 0.15s",
  });

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", margin: 0 }}>
            🔐 Controlo de Acessos (ACL)
          </h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
            Gestão de roles, permissões e acessos da plataforma
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setModalAtribuir(true)} style={btnGhost}>
            Atribuir Permissão
          </button>
          <button onClick={() => setModalCriar(true)} style={btnPrimary}>
            + Nova Permissão
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Permissões", value: permissions.length, color: "#1e40af", bg: "#eff6ff" },
          { label: "Roles",            value: roles.length,       color: "#8b5cf6", bg: "#f5f3ff" },
          { label: "O Meu Role",       value: myPerms?.role ?? "—", color: "#0891b2", bg: "#ecfeff" },
        ].map(s => (
          <div key={s.label} style={{
            background: s.bg, borderRadius: 10, padding: "14px 18px",
            border: `1px solid ${s.color}22`,
          }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: s.color, textTransform: "uppercase", letterSpacing: 0.8 }}>{s.label}</p>
            <p style={{ margin: "4px 0 0", fontSize: typeof s.value === "number" ? 26 : 18, fontWeight: 800, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 10, padding: 4, marginBottom: 20, width: "fit-content" }}>
        {([
          { key: "minhas",    label: "As Minhas Permissões" },
          { key: "permissoes", label: "Todas as Permissões" },
          { key: "roles",     label: "Roles & Permissões" },
        ] as { key: Tab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={TAB_STYLE(tab === t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Erro ── */}
      {error && (
        <div style={{
          background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8,
          padding: 14, color: "#dc2626", fontSize: 13, marginBottom: 16,
        }}>{error}</div>
      )}

      {loading ? (
        <div style={{ padding: 60, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
          A carregar dados de acesso...
        </div>
      ) : (
        <>
          {/* ── Tab: Minhas Permissões ── */}
          {tab === "minhas" && myPerms && (
            <div>
              <div style={{
                background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0",
                padding: 24, marginBottom: 16,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: "linear-gradient(135deg, #1e40af, #6366f1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontWeight: 800, fontSize: 18,
                  }}>
                    {myPerms.role?.charAt(0) ?? "?"}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1e293b" }}>
                      Role: {myPerms.role ?? "Sem role"}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
                      {myPerms.permissions.length} permissões activas
                    </p>
                  </div>
                </div>

                {myPerms.permissions.length === 0 ? (
                  <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: 20 }}>
                    Nenhuma permissão atribuída ao teu role.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {myPerms.permissions.map(p => (
                      <span key={p} style={{
                        padding: "5px 12px", background: "#eff6ff", color: "#1e40af",
                        borderRadius: 20, fontSize: 12, fontWeight: 600,
                        border: "1px solid #bfdbfe",
                      }}>
                        ✓ {p}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Tab: Todas as Permissões ── */}
          {tab === "permissoes" && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <input
                  placeholder="Pesquisar permissões..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ ...inputStyle, width: 300 }}
                />
              </div>
              <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                {filteredPerms.length === 0 ? (
                  <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
                    Nenhuma permissão encontrada.
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        {["#", "Nome", "Acção", "Recurso", "Role ID"].map(h => (
                          <th key={h} style={{
                            padding: "11px 16px", textAlign: "left", fontWeight: 700,
                            color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6,
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPerms.map((p, i) => (
                        <tr key={p.id} style={{ borderTop: "1px solid #f1f5f9" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#fafafa")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >
                          <td style={{ padding: "11px 16px", color: "#94a3b8", fontSize: 12 }}>{i + 1}</td>
                          <td style={{ padding: "11px 16px", fontWeight: 600, color: "#1e293b" }}>{p.name}</td>
                          <td style={{ padding: "11px 16px" }}>
                            <span style={{
                              padding: "2px 8px", borderRadius: 6,
                              background: "#f0fdf4", color: "#16a34a",
                              fontSize: 11, fontWeight: 700,
                            }}>{p.action}</span>
                          </td>
                          <td style={{ padding: "11px 16px" }}>
                            <span style={{
                              padding: "2px 8px", borderRadius: 6,
                              background: "#eff6ff", color: "#1e40af",
                              fontSize: 11, fontWeight: 700,
                            }}>{p.subject}</span>
                          </td>
                          <td style={{ padding: "11px 16px", color: "#64748b" }}>Role #{p.roleId}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── Tab: Roles & Permissões ── */}
          {tab === "roles" && (
            <div>
              {roles.length === 0 ? (
                <div style={{
                  padding: 60, textAlign: "center", background: "#fff",
                  borderRadius: 12, border: "1px solid #e2e8f0", color: "#94a3b8", fontSize: 14,
                }}>
                  Nenhum role encontrado.
                </div>
              ) : (
                roles.map(r => (
                  <RoleDetail key={r.id} role={r} onRevoke={revogar} />
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* ── Modais ── */}
      {modalCriar && (
        <ModalCriarPermissao
          roles={roles}
          onClose={() => setModalCriar(false)}
          onSave={() => { setModalCriar(false); loadAll(); }}
        />
      )}
      {modalAtribuir && (
        <ModalAtribuir
          roles={roles}
          permissions={permissions}
          onClose={() => setModalAtribuir(false)}
          onSave={() => { setModalAtribuir(false); loadAll(); }}
        />
      )}
    </div>
  );
}