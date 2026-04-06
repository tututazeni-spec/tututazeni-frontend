"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Me {
  id: number;
  fullName: string;
  email: string;
  active: boolean;
  createdAt: string;
  role?: { name: string; permissions: { name: string }[] };
  unit?: { name: string };
  department?: { name: string };
  position?: { name: string; level?: string };
  profile?: { bio: string };
  points?: { points: number };
  badgeAwards?: { badge: { name: string; description?: string }; awardedAt: string }[];
}

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
  background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24,
};

// ─── Tab ─────────────────────────────────────────────────────────────────────
type Tab = "perfil" | "seguranca" | "permissoes";

const TAB_STYLE = (active: boolean): React.CSSProperties => ({
  padding: "8px 20px", border: "none", cursor: "pointer", fontSize: 13,
  fontWeight: active ? 700 : 500, borderRadius: 8,
  background: active ? "#1e40af" : "transparent",
  color: active ? "#fff" : "#64748b", transition: "all 0.15s",
});

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 300,
      background: type === "success" ? "#ecfdf5" : "#fef2f2",
      border: `1px solid ${type === "success" ? "#bbf7d0" : "#fecaca"}`,
      borderRadius: 12, padding: "14px 20px", maxWidth: 340,
      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <span style={{ fontSize: 18 }}>{type === "success" ? "✅" : "❌"}</span>
      <p style={{ margin: 0, fontSize: 13, color: type === "success" ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
        {msg}
      </p>
    </div>
  );
}

// ─── Tab: Perfil ──────────────────────────────────────────────────────────────
function TabPerfil({ user }: { user: Me }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {/* Cartão principal */}
      <div style={{ ...card, gridColumn: "1 / -1" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* Avatar */}
          <div style={{
            width: 80, height: 80, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, #1e40af, #6366f1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32, fontWeight: 800, color: "#fff",
          }}>
            {user.fullName.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1e293b" }}>
              {user.fullName}
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: "#64748b" }}>{user.email}</p>
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              {user.role && (
                <span style={{
                  padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                  background: "#eff6ff", color: "#1e40af",
                }}>{user.role.name}</span>
              )}
              <span style={{
                padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                background: user.active ? "#ecfdf5" : "#fef2f2",
                color: user.active ? "#16a34a" : "#dc2626",
              }}>
                {user.active ? "● Activo" : "● Inactivo"}
              </span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>Pontos</p>
            <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 800, color: "#f59e0b" }}>
              ⭐ {user.points?.points?.toLocaleString("pt-PT") ?? 0}
            </p>
          </div>
        </div>

        {user.profile?.bio && (
          <div style={{ marginTop: 16, padding: "12px 16px", background: "#f8fafc", borderRadius: 8 }}>
            <p style={{ margin: 0, fontSize: 13, color: "#475569", fontStyle: "italic" }}>
              "{user.profile.bio}"
            </p>
          </div>
        )}
      </div>

      {/* Info organizacional */}
      <div style={card}>
        <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
          📋 Informação Organizacional
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { label: "Departamento", value: user.department?.name },
            { label: "Unidade",      value: user.unit?.name },
            { label: "Cargo",        value: user.position?.name },
            { label: "Nível",        value: user.position?.level },
            { label: "Membro desde", value: new Date(user.createdAt).toLocaleDateString("pt-PT", { year: "numeric", month: "long" }) },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>{label}</span>
              <span style={{ fontSize: 13, color: "#1e293b", fontWeight: 500 }}>{value ?? "—"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      <div style={card}>
        <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
          🏅 Badges Recentes
        </h3>
        {!user.badgeAwards?.length ? (
          <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
            Nenhum badge conquistado ainda.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {user.badgeAwards.map((b, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 12px", background: "#fffbeb",
                borderRadius: 10, border: "1px solid #fde68a",
              }}>
                <span style={{ fontSize: 22 }}>🏅</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                    {b.badge.name}
                  </p>
                  {b.badge.description && (
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>
                      {b.badge.description}
                    </p>
                  )}
                </div>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>
                  {new Date(b.awardedAt).toLocaleDateString("pt-PT")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Segurança ───────────────────────────────────────────────────────────
function TabSeguranca({ onToast }: { onToast: (msg: string, type: "success" | "error") => void }) {
  const [form, setForm] = useState({
    currentPassword: "", newPassword: "", confirmPassword: "",
  });
  const [saving, setSaving]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      onToast("As senhas não coincidem.", "error"); return;
    }
    if (form.newPassword.length < 6) {
      onToast("A nova senha deve ter pelo menos 6 caracteres.", "error"); return;
    }
    setSaving(true);
    try {
      // POST /auth/change-password — ChangePasswordDto: { currentPassword, newPassword }
      await api.post("/auth/change-password", {
        currentPassword: form.currentPassword,
        newPassword:     form.newPassword,
      });
      onToast("Senha alterada com sucesso!", "success");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (e: any) {
      onToast(e.message ?? "Erro ao alterar senha", "error");
    } finally { setSaving(false); }
  }

  const strength = (p: string) => {
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8)    s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };

  const pw = form.newPassword;
  const str = strength(pw);
  const strLabel = ["", "Fraca", "Razoável", "Boa", "Forte"];
  const strColor = ["", "#dc2626", "#f59e0b", "#1e40af", "#16a34a"];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {/* Alterar senha */}
      <div style={card}>
        <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>
          🔑 Alterar Senha
        </h3>
        <form onSubmit={submit}>
          <div style={{ marginBottom: 16 }}>
            <span style={labelStyle}>Senha Actual</span>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                value={form.currentPassword}
                onChange={e => set("currentPassword", e.target.value)}
                style={{ ...inputStyle, paddingRight: 44 }}
                placeholder="••••••••"
                required
              />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 16,
              }}>
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <span style={labelStyle}>Nova Senha</span>
            <input
              type="password"
              value={form.newPassword}
              onChange={e => set("newPassword", e.target.value)}
              style={inputStyle}
              placeholder="••••••••"
              required minLength={6}
            />
            {pw && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 4, borderRadius: 2,
                      background: i <= str ? strColor[str] : "#e2e8f0",
                      transition: "background 0.3s",
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: 11, color: strColor[str], fontWeight: 600 }}>
                  {strLabel[str]}
                </span>
              </div>
            )}
          </div>

          <div style={{ marginBottom: 20 }}>
            <span style={labelStyle}>Confirmar Nova Senha</span>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={e => set("confirmPassword", e.target.value)}
              style={{
                ...inputStyle,
                borderColor: form.confirmPassword && form.confirmPassword !== form.newPassword
                  ? "#dc2626" : "#e2e8f0",
              }}
              placeholder="••••••••"
              required
            />
            {form.confirmPassword && form.confirmPassword !== form.newPassword && (
              <p style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}>As senhas não coincidem</p>
            )}
          </div>

          <button
            type="submit"
            disabled={saving || form.newPassword !== form.confirmPassword}
            style={{ ...btnPrimary, width: "100%", opacity: saving ? 0.7 : 1 }}
          >
            {saving ? "A alterar..." : "Alterar Senha"}
          </button>
        </form>
      </div>

      {/* Dicas de segurança */}
      <div style={card}>
        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>
          🛡️ Dicas de Segurança
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { icon: "✅", text: "Usa pelo menos 8 caracteres", ok: pw.length >= 8 },
            { icon: "✅", text: "Inclui letras maiúsculas", ok: /[A-Z]/.test(pw) },
            { icon: "✅", text: "Inclui números", ok: /[0-9]/.test(pw) },
            { icon: "✅", text: "Inclui caracteres especiais", ok: /[^A-Za-z0-9]/.test(pw) },
          ].map(tip => (
            <div key={tip.text} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 12px", borderRadius: 8,
              background: pw ? (tip.ok ? "#ecfdf5" : "#f8fafc") : "#f8fafc",
              border: `1px solid ${pw ? (tip.ok ? "#bbf7d0" : "#e2e8f0") : "#e2e8f0"}`,
              transition: "all 0.2s",
            }}>
              <span style={{ fontSize: 14 }}>{pw && tip.ok ? "✅" : "⬜"}</span>
              <span style={{ fontSize: 13, color: pw && tip.ok ? "#16a34a" : "#64748b" }}>
                {tip.text}
              </span>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 20, padding: "12px 16px", background: "#fffbeb",
          borderRadius: 10, border: "1px solid #fde68a",
        }}>
          <p style={{ margin: 0, fontSize: 12, color: "#92400e", fontWeight: 600 }}>
            ⚠️ O token de acesso expira em 15 minutos. Serás redirecionado para o login automaticamente.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Permissões ──────────────────────────────────────────────────────────
function TabPermissoes({ user }: { user: Me }) {
  const permissions = user.role?.permissions ?? [];

  const grouped = permissions.reduce((acc, p) => {
    const parts = p.name.split(".");
    const group = parts[0] ?? "outros";
    if (!acc[group]) acc[group] = [];
    acc[group].push(p.name);
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {/* Role info */}
      <div style={{ ...card, gridColumn: "1 / -1" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: "linear-gradient(135deg, #1e40af, #6366f1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 800, fontSize: 20,
          }}>
            {user.role?.name?.charAt(0) ?? "?"}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1e293b" }}>
              Role: {user.role?.name ?? "Sem role"}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
              {permissions.length} permissões activas
            </p>
          </div>
        </div>
      </div>

      {/* Permissões agrupadas */}
      {Object.keys(grouped).length === 0 ? (
        <div style={{ ...card, gridColumn: "1 / -1", textAlign: "center", padding: 40 }}>
          <p style={{ color: "#94a3b8", fontSize: 13 }}>
            Nenhuma permissão específica atribuída ao teu role.
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([group, perms]) => (
          <div key={group} style={card}>
            <h4 style={{ margin: "0 0 14px", fontSize: 12, fontWeight: 700, color: "#1e40af", textTransform: "uppercase", letterSpacing: 0.8 }}>
              {group}
            </h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {perms.map(p => (
                <span key={p} style={{
                  padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe",
                }}>
                  ✓ {p}
                </span>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [tab, setTab]       = useState<Tab>("perfil");
  const [user, setUser]     = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");
  const [toast, setToast]   = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error") {
    setToast({ msg, type });
  }

  useEffect(() => {
    // GET /auth/me
    api.get<Me>("/auth/me")
      .then(res => {
        setUser(res);
        // Guardar no localStorage para o Topbar
        localStorage.setItem("user", JSON.stringify({ fullName: res.fullName, email: res.email }));
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }

  if (loading) return (
    <div style={{ padding: 60, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
      A carregar perfil...
    </div>
  );

  if (error) return (
    <div style={{
      background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12,
      padding: 24, color: "#dc2626", fontSize: 13,
    }}>
      {error === "Unauthorized" || error.includes("401")
        ? "Sessão expirada. Faz login novamente."
        : error}
    </div>
  );

  if (!user) return null;

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", margin: 0 }}>
            ⚙️ Definições
          </h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
            Perfil, segurança e permissões da conta
          </p>
        </div>
        <button onClick={logout} style={{
          ...btnGhost, color: "#dc2626", background: "#fef2f2",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          🚪 Terminar Sessão
        </button>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 10, padding: 4, marginBottom: 24, width: "fit-content" }}>
        {([
          { key: "perfil",      label: "👤 Perfil" },
          { key: "seguranca",   label: "🔑 Segurança" },
          { key: "permissoes",  label: "🔐 Permissões" },
        ] as { key: Tab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={TAB_STYLE(tab === t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Conteúdo ── */}
      {tab === "perfil"     && <TabPerfil user={user} />}
      {tab === "seguranca"  && <TabSeguranca onToast={showToast} />}
      {tab === "permissoes" && <TabPermissoes user={user} />}

      {/* ── Toast ── */}
      {toast && (
        <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}