"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Badge { id: number; name: string; description?: string; _count?: { awards: number }; }
interface BadgeAward { badge: { name: string; description?: string }; awardedAt: string; }
interface MyPoints { points: number; badges?: BadgeAward[]; }
interface LeaderEntry { rank: number; userId: number; points: number; user?: { fullName: string }; }

// ─── Styles ───────────────────────────────────────────────────────────────────
const card: React.CSSProperties = { background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: 24 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, color: "#1e293b", background: "#fff", outline: "none", boxSizing: "border-box" };
const labelStyle: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#64748b", marginBottom: 6 };
const btnPrimary: React.CSSProperties = { padding: "10px 20px", background: "#1e40af", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" };
const btnGhost: React.CSSProperties = { padding: "8px 14px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" };
const btnDanger: React.CSSProperties = { padding: "6px 10px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer" };

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

// ─── Modal: Criar Badge ───────────────────────────────────────────────────────
function CreateBadgeModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      await api.post("/gamification/badges", { name, description: description || undefined });
      onCreated(); onClose();
    } catch (e: any) { setError(e.message ?? "Erro ao criar badge"); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ ...card, width: "100%", maxWidth: 420, boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1e293b" }}>🏅 Novo Badge</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
        </div>
        <form onSubmit={submit}>
          <div style={{ marginBottom: 14 }}><span style={labelStyle}>Nome *</span><input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Campeão de Formação" required /></div>
          <div style={{ marginBottom: 20 }}><span style={labelStyle}>Descrição</span><textarea style={{ ...inputStyle, height: 72, resize: "vertical" }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Como se conquista este badge..." /></div>
          {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}><p style={{ margin: 0, fontSize: 13, color: "#dc2626" }}>{error}</p></div>}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={btnGhost}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>{saving ? "A criar..." : "Criar Badge"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal: Atribuir Badge ────────────────────────────────────────────────────
function AwardModal({ badges, onClose, onAwarded }: { badges: Badge[]; onClose: () => void; onAwarded: () => void }) {
  const [userId, setUserId] = useState("");
  const [badgeId, setBadgeId] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      await api.post("/gamification/badges/award", { userId: +userId, badgeId: +badgeId });
      onAwarded(); onClose();
    } catch (e: any) { alert(e.message); } finally { setSaving(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ ...card, width: "100%", maxWidth: 400, boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1e293b" }}>🎯 Atribuir Badge</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
        </div>
        <form onSubmit={submit}>
          <div style={{ marginBottom: 14 }}><span style={labelStyle}>ID do Utilizador *</span><input style={inputStyle} type="number" value={userId} onChange={e => setUserId(e.target.value)} required /></div>
          <div style={{ marginBottom: 20 }}>
            <span style={labelStyle}>Badge *</span>
            <select style={inputStyle} value={badgeId} onChange={e => setBadgeId(e.target.value)} required>
              <option value="">Selecciona um badge...</option>
              {badges.map(b => <option key={b.id} value={b.id}>🏅 {b.name}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={btnGhost}>Cancelar</button>
            <button type="submit" disabled={saving || !badgeId} style={{ ...btnPrimary, opacity: (saving || !badgeId) ? 0.7 : 1 }}>{saving ? "A atribuir..." : "Atribuir"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal: Adicionar Pontos ──────────────────────────────────────────────────
function AddPointsModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [userId, setUserId] = useState("");
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      await api.post("/gamification/points/add", { userId: +userId, points: +points, reason: reason || undefined });
      onAdded(); onClose();
    } catch (e: any) { alert(e.message); } finally { setSaving(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ ...card, width: "100%", maxWidth: 400, boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1e293b" }}>⭐ Adicionar Pontos</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
        </div>
        <form onSubmit={submit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div><span style={labelStyle}>ID Utilizador *</span><input style={inputStyle} type="number" value={userId} onChange={e => setUserId(e.target.value)} required /></div>
            <div><span style={labelStyle}>Pontos *</span><input style={inputStyle} type="number" min={1} value={points} onChange={e => setPoints(e.target.value)} required /></div>
          </div>
          <div style={{ marginBottom: 20 }}><span style={labelStyle}>Motivo</span><input style={inputStyle} value={reason} onChange={e => setReason(e.target.value)} placeholder="Ex: Conclusão de curso especial" /></div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={btnGhost}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>{saving ? "A adicionar..." : "Adicionar Pontos"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Tab ─────────────────────────────────────────────────────────────────────
type Tab = "leaderboard" | "badges" | "my";

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function GamificacaoPage() {
  const [tab, setTab] = useState<Tab>("leaderboard");
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [myPoints, setMyPoints] = useState<MyPoints | null>(null);
  const [loading, setLoading] = useState(true);
  const [initing, setIniting] = useState(false);
  const [showCreateBadge, setShowCreateBadge] = useState(false);
  const [showAward, setShowAward] = useState(false);
  const [showAddPoints, setShowAddPoints] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error") { setToast({ msg, type }); }

  async function fetchAll() {
    setLoading(true);
    try {
      const [lb, bg, mp] = await Promise.all([
        api.get<LeaderEntry[]>("/gamification/leaderboard"),
        api.get<Badge[]>("/gamification/badges"),
        api.get<MyPoints>("/gamification/my-points").catch(() => null),
      ]);
      setLeaderboard(lb); setBadges(bg); setMyPoints(mp);
    } catch (e: any) { showToast(e.message ?? "Erro", "error"); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchAll(); }, []);

  async function initDefaults() {
    setIniting(true);
    try {
      const r = await api.post<any>("/gamification/badges/init-defaults", {});
      showToast(r.message, "success"); fetchAll();
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setIniting(false); }
  }

  async function deleteBadge(id: number, name: string) {
    if (!confirm(`Remover o badge "${name}"? Esta acção é irreversível.`)) return;
    try {
      await api.delete(`/gamification/badges/${id}`);
      showToast("Badge removido!", "success"); fetchAll();
    } catch (e: any) { showToast(e.message, "error"); }
  }

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", margin: 0 }}>🎮 Gamificação</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Pontos, badges e ranking da organização</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={initDefaults} disabled={initing} style={{ ...btnGhost, opacity: initing ? 0.7 : 1 }}>🏅 Inicializar Badges</button>
          <button onClick={() => setShowCreateBadge(true)} style={btnGhost}>+ Badge</button>
          <button onClick={() => setShowAward(true)} style={btnGhost}>🎯 Atribuir Badge</button>
          <button onClick={() => setShowAddPoints(true)} style={btnPrimary}>⭐ Adicionar Pontos</button>
        </div>
      </div>

      {/* Banner dos meus pontos */}
      {myPoints && (
        <div style={{ ...card, marginBottom: 24, background: "linear-gradient(135deg,#1e40af,#6366f1)", border: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>Os meus pontos</p>
              <p style={{ margin: "4px 0 0", fontSize: 42, fontWeight: 800, color: "#fff" }}>
                ⭐ {(myPoints.points ?? 0).toLocaleString("pt-PT")}
              </p>
            </div>
            {myPoints.badges && myPoints.badges.length > 0 && (
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>
                  Badges conquistados ({myPoints.badges.length})
                </p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {myPoints.badges.slice(0, 8).map((b, i) => (
                    <span key={i} style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "rgba(255,255,255,0.2)", color: "#fff" }}>
                      🏅 {b.badge.name}
                    </span>
                  ))}
                  {myPoints.badges.length > 8 && (
                    <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                      +{myPoints.badges.length - 8} mais
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 10, padding: 4, marginBottom: 24, width: "fit-content" }}>
        {([
          ["leaderboard", "🏆 Ranking"],
          ["badges",      "🏅 Badges"],
          ["my",          "👤 Os Meus"],
        ] as [Tab, string][]).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding: "8px 20px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: tab === k ? 700 : 500, borderRadius: 8, background: tab === k ? "#1e40af" : "transparent", color: tab === k ? "#fff" : "#64748b", transition: "all 0.15s" }}>{l}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>A carregar...</div>
      ) : (
        <>
          {/* ── RANKING ── */}
          {tab === "leaderboard" && (
            <div style={card}>
              <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>🏆 Top Colaboradores</h3>
              {leaderboard.length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: 24 }}>Sem dados de ranking.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {leaderboard.map((e, i) => (
                    <div key={e.userId} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 10, background: i === 0 ? "#fffbeb" : i === 1 ? "#f8fafc" : "#fff", border: `1px solid ${i === 0 ? "#fde68a" : "#e2e8f0"}` }}>
                      <span style={{ fontSize: 24, minWidth: 32, textAlign: "center" }}>{medals[i] ?? `#${i + 1}`}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{e.user?.fullName ?? `Utilizador #${e.userId}`}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>ID: {e.userId}</p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: i === 0 ? "#f59e0b" : "#1e40af" }}>
                          ⭐ {e.points.toLocaleString("pt-PT")}
                        </p>
                        <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>pontos</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── BADGES ── */}
          {tab === "badges" && (
            <div>
              {badges.length === 0 ? (
                <div style={{ ...card, textAlign: "center", padding: 60 }}>
                  <p style={{ fontSize: 32, marginBottom: 12 }}>🏅</p>
                  <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 16px" }}>
                    Nenhum badge criado. Clica em "Inicializar Badges" para criar os padrão.
                  </p>
                  <button onClick={initDefaults} disabled={initing} style={{ ...btnPrimary, opacity: initing ? 0.7 : 1 }}>
                    🏅 Inicializar Badges Padrão
                  </button>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 16 }}>
                  {badges.map(b => (
                    <div key={b.id} style={{ ...card, textAlign: "center", position: "relative" }}>
                      {/* Botão remover */}
                      <button
                        onClick={() => deleteBadge(b.id, b.name)}
                        title="Remover badge"
                        style={{ ...btnDanger, position: "absolute", top: 12, right: 12, padding: "4px 8px", fontSize: 12 }}
                      >🗑️</button>

                      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#f59e0b,#ef4444)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 12px" }}>
                        🏅
                      </div>
                      <h3 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{b.name}</h3>
                      {b.description && (
                        <p style={{ margin: "0 0 10px", fontSize: 12, color: "#64748b", lineHeight: 1.4 }}>{b.description}</p>
                      )}
                      {b._count !== undefined && (
                        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "#fef3c7", color: "#92400e" }}>
                          🏆 {b._count.awards} atribuições
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── OS MEUS ── */}
          {tab === "my" && (
            !myPoints || !(myPoints.badges?.length) ? (
              <div style={{ ...card, textAlign: "center", padding: 60 }}>
                <p style={{ fontSize: 32, marginBottom: 12 }}>🏅</p>
                <p style={{ color: "#94a3b8", fontSize: 14 }}>Ainda não conquistaste nenhum badge.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {myPoints.badges.map((b, i) => (
                  <div key={i} style={{ ...card, padding: 16, display: "flex", alignItems: "center", gap: 14, borderLeft: "4px solid #f59e0b" }}>
                    <span style={{ fontSize: 28, flexShrink: 0 }}>🏅</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{b.badge.name}</p>
                      {b.badge.description && (
                        <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>{b.badge.description}</p>
                      )}
                    </div>
                    <span style={{ fontSize: 12, color: "#94a3b8", flexShrink: 0 }}>
                      {new Date(b.awardedAt).toLocaleDateString("pt-PT")}
                    </span>
                  </div>
                ))}
              </div>
            )
          )}
        </>
      )}

      {/* Modais */}
      {showCreateBadge && (
        <CreateBadgeModal
          onClose={() => setShowCreateBadge(false)}
          onCreated={() => { fetchAll(); showToast("Badge criado!", "success"); }}
        />
      )}
      {showAward && (
        <AwardModal
          badges={badges}
          onClose={() => setShowAward(false)}
          onAwarded={() => { fetchAll(); showToast("Badge atribuído! 🎉", "success"); }}
        />
      )}
      {showAddPoints && (
        <AddPointsModal
          onClose={() => setShowAddPoints(false)}
          onAdded={() => { fetchAll(); showToast("Pontos adicionados! ⭐", "success"); }}
        />
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
