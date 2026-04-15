"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type User = { id: number; fullName: string; email: string };

type InstructorProfile = {
  id: number;
  userId: number;
  bio?: string;
  expertiseArea: string;
  approved: boolean;
  ratingAverage: number;
  totalCourses: number;
  user: User;
  reviews?: Review[];
  marketplaceCourses?: MarketplaceCourse[];
  payouts?: Payout[];
  _count?: { reviews: number; marketplaceCourses: number; courses?: number };
};

type Review = {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  user: { id: number; fullName: string };
};

type MarketplaceCourse = {
  id: number;
  title: string;
  price: number;
  createdAt: string;
  instructor?: InstructorProfile;
};

type Payout = {
  id: number;
  amount: number;
  createdAt: string;
};

// ─── Utility ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA", maximumFractionDigits: 0 }).format(n);

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });

// ─── UI Primitives ────────────────────────────────────────────────────────────

const Stars = ({ value }: { value: number }) => (
  <span style={{ color: "var(--color-text-warning)", fontSize: 13, letterSpacing: 1 }}>
    {Array.from({ length: 5 }, (_, i) => (i < Math.round(value) ? "★" : "☆")).join("")}
  </span>
);

const Badge = ({ approved }: { approved: boolean }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 4,
    fontSize: 11, fontWeight: 500, padding: "3px 8px",
    borderRadius: "var(--border-radius-md)",
    background: approved ? "var(--color-background-success)" : "var(--color-background-warning)",
    color: approved ? "var(--color-text-success)" : "var(--color-text-warning)",
  }}>
    {approved ? "✓ Aprovado" : "⏳ Pendente"}
  </span>
);

const Avatar = ({ name, size = 36 }: { name: string; size?: number }) => {
  const initials = name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  const palette = [
    { bg: "#B5D4F4", color: "#0C447C" },
    { bg: "#9FE1CB", color: "#085041" },
    { bg: "#CECBF6", color: "#3C3489" },
    { bg: "#F5C4B3", color: "#712B13" },
    { bg: "#FAC775", color: "#633806" },
  ];
  const c = palette[name.charCodeAt(0) % palette.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: c.bg, color: c.color, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 500,
    }}>
      {initials}
    </div>
  );
};

function Spinner() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "3rem 0", gap: 12 }}>
      <div style={{ width: 28, height: 28, border: "3px solid #e2e8f0", borderTopColor: "#1e40af", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>A carregar...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function EmptyState({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--color-text-secondary)" }}>
      <p style={{ fontSize: 32, margin: "0 0 8px" }}>🎓</p>
      <p style={{ fontSize: 14, margin: "0 0 16px" }}>{message}</p>
      {action}
    </div>
  );
}

// ─── Modal: Registar Instrutor ────────────────────────────────────────────────

function ModalRegistar({ onClose, onRegistered }: { onClose: () => void; onRegistered: () => void }) {
  const [form, setForm] = useState({ userId: "", expertiseArea: "", bio: "" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.userId || !form.expertiseArea) { setErr("ID do utilizador e área de especialidade são obrigatórios."); return; }
    setSaving(true); setErr("");
    try {
      // POST /instructors — CreateInstructorDto: { userId, expertiseArea, bio? }
      await api.post("/instructors", {
        userId: +form.userId,
        expertiseArea: form.expertiseArea,
        bio: form.bio || undefined,
      });
      onRegistered();
      onClose();
    } catch (e: any) { setErr(e.message ?? "Erro ao registar instrutor"); }
    finally { setSaving(false); }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px",
    border: "1px solid var(--color-border-tertiary)",
    borderRadius: "var(--border-radius-md)",
    fontSize: 13, outline: "none", boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 11, fontWeight: 700,
    letterSpacing: 0.8, textTransform: "uppercase",
    color: "var(--color-text-secondary)", marginBottom: 5,
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ background: "var(--color-background-primary)", borderRadius: "var(--border-radius-lg)", padding: 28, width: "100%", maxWidth: 460, boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>🎓 Registar Instrutor</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--color-text-secondary)", lineHeight: 1 }}>✕</button>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <span style={labelStyle}>ID do Utilizador *</span>
            <input
              style={inputStyle}
              type="number"
              placeholder="ex: 42"
              value={form.userId}
              onChange={e => set("userId", e.target.value)}
              required
            />
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--color-text-secondary)" }}>
              O utilizador já deve estar registado na plataforma.
            </p>
          </div>

          <div>
            <span style={labelStyle}>Área de Especialidade *</span>
            <input
              style={inputStyle}
              placeholder="ex: React & Next.js, Gestão de Projetos..."
              value={form.expertiseArea}
              onChange={e => set("expertiseArea", e.target.value)}
              required
            />
          </div>

          <div>
            <span style={labelStyle}>Bio <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(opcional)</span></span>
            <textarea
              style={{ ...inputStyle, height: 80, resize: "vertical", fontFamily: "inherit" }}
              placeholder="Breve descrição da experiência do instrutor..."
              value={form.bio}
              onChange={e => set("bio", e.target.value)}
            />
          </div>

          {err && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px" }}>
              <p style={{ margin: 0, fontSize: 13, color: "#dc2626" }}>{err}</p>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ padding: "8px 18px", background: "var(--color-background-secondary)", border: "none", borderRadius: "var(--border-radius-md)", fontSize: 13, cursor: "pointer" }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving} style={{ padding: "8px 18px", background: "#1e40af", color: "#fff", border: "none", borderRadius: "var(--border-radius-md)", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? "A registar..." : "Registar Instrutor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Instructor Card ──────────────────────────────────────────────────────────

function InstructorCard({ p, onView, onApprove, onRevoke }: {
  p: InstructorProfile;
  onView: (p: InstructorProfile) => void;
  onApprove: (id: number) => void;
  onRevoke: (id: number) => void;
}) {
  return (
    <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <Avatar name={p.user.fullName} size={42} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 500, fontSize: 14, color: "var(--color-text-primary)" }}>{p.user.fullName}</span>
            <Badge approved={p.approved} />
          </div>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-secondary)" }}>{p.expertiseArea}</p>
          <p style={{ margin: "1px 0 0", fontSize: 11, color: "var(--color-text-tertiary)" }}>{p.user.email}</p>
        </div>
      </div>

      {p.bio && (
        <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {p.bio}
        </p>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        {[
          { label: "Avaliação", value: <><Stars value={p.ratingAverage} /> <span style={{ fontSize: 12, fontWeight: 500 }}>{p.ratingAverage.toFixed(1)}</span></> },
          { label: "Cursos", value: <span style={{ fontSize: 16, fontWeight: 500 }}>{p.totalCourses}</span> },
          { label: "Reviews", value: <span style={{ fontSize: 16, fontWeight: 500 }}>{p._count?.reviews ?? 0}</span> },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "8px 10px", flex: 1, textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 10, color: "var(--color-text-secondary)" }}>{s.label}</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, marginTop: 2 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => onView(p)} style={{ flex: 1, fontSize: 12, padding: "6px 0" }}>Ver perfil</button>
        {p.approved
          ? <button onClick={() => onRevoke(p.id)} style={{ fontSize: 12, padding: "6px 12px", color: "var(--color-text-danger)", borderColor: "var(--color-border-danger)" }}>Revogar</button>
          : <button onClick={() => onApprove(p.id)} style={{ fontSize: 12, padding: "6px 12px", color: "var(--color-text-success)", borderColor: "var(--color-border-success)" }}>Aprovar</button>}
      </div>
    </div>
  );
}

// ─── Instructor Detail ────────────────────────────────────────────────────────

function InstructorDetail({ p, onBack, onPayout, onApprove, onRevoke }: {
  p: InstructorProfile;
  onBack: () => void;
  onPayout: (id: number, amount: number) => void;
  onApprove: (id: number) => void;
  onRevoke: (id: number) => void;
}) {
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutLoading, setPayoutLoading] = useState(false);

  const handlePayout = async () => {
    const amt = parseFloat(payoutAmount);
    if (isNaN(amt) || amt <= 0) return;
    setPayoutLoading(true);
    try {
      // POST /instructors/:id/payouts — { amount }
      await api.post(`/instructors/${p.id}/payouts`, { amount: amt });
      onPayout(p.id, amt);
      setPayoutAmount("");
    } catch (e: any) { alert(e.message); }
    finally { setPayoutLoading(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <button onClick={onBack} style={{ alignSelf: "flex-start", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>← Voltar</button>

      {/* Header */}
      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1.5rem" }}>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <Avatar name={p.user.fullName} size={56} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>{p.user.fullName}</h2>
              <Badge approved={p.approved} />
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--color-text-secondary)" }}>{p.user.email}</p>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--color-text-secondary)" }}>Área: {p.expertiseArea}</p>
            {p.bio && <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.6, color: "var(--color-text-primary)" }}>{p.bio}</p>}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: "1.25rem" }}>
          {[
            { label: "Avaliação média", value: `${p.ratingAverage.toFixed(1)} ★` },
            { label: "Total de cursos",  value: p.totalCourses },
            { label: "Reviews",          value: p._count?.reviews ?? 0 },
          ].map(s => (
            <div key={s.label} style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "12px 16px" }}>
              <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-secondary)" }}>{s.label}</p>
              <p style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 500 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Acções de aprovação */}
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          {p.approved
            ? <button onClick={() => onRevoke(p.id)} style={{ fontSize: 12, padding: "6px 14px", color: "var(--color-text-danger)", borderColor: "var(--color-border-danger)" }}>Revogar aprovação</button>
            : <button onClick={() => onApprove(p.id)} style={{ fontSize: 12, padding: "6px 14px", color: "var(--color-text-success)", borderColor: "var(--color-border-success)" }}>✓ Aprovar instrutor</button>}
        </div>
      </div>

      {/* Marketplace Courses */}
      {p.marketplaceCourses && p.marketplaceCourses.length > 0 && (
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1.25rem" }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 500 }}>Cursos no marketplace</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {p.marketplaceCourses.map(c => (
              <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)" }}>
                <span style={{ fontSize: 13 }}>{c.title}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-info)" }}>{fmt(c.price)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      {p.reviews && p.reviews.length > 0 && (
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1.25rem" }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 500 }}>Últimas avaliações</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {p.reviews.map(r => (
              <div key={r.id} style={{ borderTop: "0.5px solid var(--color-border-tertiary)", paddingTop: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Avatar name={r.user.fullName} size={28} />
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{r.user.fullName}</span>
                  <Stars value={r.rating} />
                  <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--color-text-tertiary)" }}>{fmtDate(r.createdAt)}</span>
                </div>
                <p style={{ margin: "6px 0 0 36px", fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>{r.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payouts */}
      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1.25rem" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 500 }}>Registar pagamento</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="number"
            placeholder="Valor em AOA"
            value={payoutAmount}
            onChange={e => setPayoutAmount(e.target.value)}
            style={{ flex: 1 }}
          />
          <button onClick={handlePayout} disabled={payoutLoading || !payoutAmount} style={{ fontSize: 13, padding: "0 16px" }}>
            {payoutLoading ? "A processar..." : "Registar"}
          </button>
        </div>

        {p.payouts && p.payouts.length > 0 && (
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
            {p.payouts.map(pay => (
              <div key={pay.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)" }}>
                <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{fmtDate(pay.createdAt)}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-success)" }}>{fmt(pay.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Marketplace Tab ──────────────────────────────────────────────────────────

function MarketplaceTab() {
  const [courses, setCourses] = useState<MarketplaceCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    // GET /instructors/marketplace
    api.get<MarketplaceCourse[]>("/instructors/marketplace")
      .then(res => setCourses(Array.isArray(res) ? res : (res as any)?.data ?? []))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  async function publish(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !price) return;
    setSaving(true); setErr("");
    try {
      // POST /instructors/marketplace — { title, price }
      const created = await api.post<MarketplaceCourse>("/instructors/marketplace", { title, price: +price });
      setCourses(prev => [created, ...prev]);
      setTitle(""); setPrice(""); setShowForm(false);
    } catch (e: any) { setErr(e.message ?? "Erro ao publicar"); }
    finally { setSaving(false); }
  }

  if (loading) return <Spinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>{courses.length} cursos no marketplace</p>
        <button onClick={() => setShowForm(!showForm)} style={{ fontSize: 12, padding: "6px 14px" }}>
          {showForm ? "Cancelar" : "+ Novo curso"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={publish} style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1.25rem", display: "flex", flexDirection: "column", gap: 10 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>Novo curso no marketplace</h3>
          <input placeholder="Título do curso" value={title} onChange={e => setTitle(e.target.value)} required />
          <input type="number" placeholder="Preço (AOA)" value={price} onChange={e => setPrice(e.target.value)} required />
          {err && <p style={{ margin: 0, fontSize: 13, color: "#dc2626" }}>{err}</p>}
          <button type="submit" disabled={saving} style={{ alignSelf: "flex-start", fontSize: 13, padding: "6px 16px" }}>
            {saving ? "A publicar..." : "Publicar curso"}
          </button>
        </form>
      )}

      {courses.length === 0
        ? <EmptyState message="Ainda não há cursos no marketplace." action={<button onClick={() => setShowForm(true)} style={{ fontSize: 13, padding: "7px 16px" }}>+ Adicionar primeiro curso</button>} />
        : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            {courses.map(c => (
              <div key={c.id} style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1rem 1.25rem" }}>
                <h4 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 500 }}>{c.title}</h4>
                {c.instructor && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                    <Avatar name={c.instructor.user.fullName} size={22} />
                    <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{c.instructor.user.fullName}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, paddingTop: 8, borderTop: "0.5px solid var(--color-border-tertiary)" }}>
                  <span style={{ fontSize: 15, fontWeight: 500, color: "var(--color-text-info)" }}>{fmt(c.price)}</span>
                  <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{fmtDate(c.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

// ─── My Profile Tab ───────────────────────────────────────────────────────────

function MyProfileTab() {
  const [profile, setProfile] = useState<InstructorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [area, setArea] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    // GET /instructors/my-profile
    api.get<InstructorProfile>("/instructors/my-profile")
      .then(p => { setProfile(p); setBio(p.bio ?? ""); setArea(p.expertiseArea); })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    if (!profile) return;
    setSaving(true); setErr("");
    try {
      // PUT /instructors/my-profile — { bio?, expertiseArea }
      await api.put("/instructors/my-profile", { bio: bio || undefined, expertiseArea: area });
      setProfile(p => p ? { ...p, bio, expertiseArea: area } : p);
      setEditing(false);
    } catch (e: any) { setErr(e.message ?? "Erro ao guardar"); }
    finally { setSaving(false); }
  }

  if (loading) return <Spinner />;

  if (!profile) {
    return (
      <EmptyState
        message="Ainda não tens um perfil de instrutor. Pede a um administrador para te registar."
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: 640 }}>
      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <Avatar name={profile.user.fullName} size={52} />
            <div>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 500 }}>{profile.user.fullName}</h2>
              <p style={{ margin: "3px 0 4px", fontSize: 12, color: "var(--color-text-secondary)" }}>{profile.user.email}</p>
              <Badge approved={profile.approved} />
            </div>
          </div>
          <button onClick={() => setEditing(!editing)} style={{ fontSize: 12, padding: "5px 12px" }}>
            {editing ? "Cancelar" : "Editar"}
          </button>
        </div>

        {editing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, color: "var(--color-text-secondary)", display: "block", marginBottom: 4 }}>Área de especialidade</label>
              <input value={area} onChange={e => setArea(e.target.value)} style={{ width: "100%" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--color-text-secondary)", display: "block", marginBottom: 4 }}>Bio</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} style={{ width: "100%", resize: "vertical" }} />
            </div>
            {err && <p style={{ margin: 0, fontSize: 13, color: "#dc2626" }}>{err}</p>}
            <button onClick={save} disabled={saving} style={{ alignSelf: "flex-start", fontSize: 13, padding: "6px 16px" }}>
              {saving ? "A guardar..." : "Guardar alterações"}
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: "Especialidade", value: area },
              { label: "Bio", value: bio },
            ].filter(f => f.value).map(f => (
              <div key={f.label} style={{ display: "flex", gap: 8 }}>
                <span style={{ fontSize: 12, color: "var(--color-text-secondary)", minWidth: 90 }}>{f.label}</span>
                <span style={{ fontSize: 13, lineHeight: 1.6 }}>{f.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Histórico de pagamentos */}
      {profile.payouts && profile.payouts.length > 0 && (
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1.25rem" }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 500 }}>Histórico de pagamentos</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {profile.payouts.map(pay => (
              <div key={pay.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)" }}>
                <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{fmtDate(pay.createdAt)}</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-success)" }}>{fmt(pay.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InstructorPage() {
  const [tab, setTab] = useState<"list" | "marketplace" | "my-profile">("list");
  const [instructors, setInstructors] = useState<InstructorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterApproved, setFilterApproved] = useState<"all" | "approved" | "pending">("all");
  const [detail, setDetail] = useState<InstructorProfile | null>(null);
  const [showRegistar, setShowRegistar] = useState(false);

  const loadInstructors = useCallback(async () => {
    setLoading(true); setError("");
    try {
      // GET /instructors
      const res = await api.get<any>("/instructors");
      setInstructors(Array.isArray(res) ? res : res?.data ?? []);
    } catch (e: any) { setError(e.message ?? "Erro ao carregar instrutores"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadInstructors(); }, [loadInstructors]);

  const handleApprove = async (id: number) => {
    try {
      // PATCH /instructors/:id/approve
      await api.patch(`/instructors/${id}/approve`, {});
      setInstructors(prev => prev.map(p => p.id === id ? { ...p, approved: true } : p));
      if (detail?.id === id) setDetail(d => d ? { ...d, approved: true } : d);
    } catch (e: any) { alert(e.message); }
  };

  const handleRevoke = async (id: number) => {
    try {
      // PATCH /instructors/:id/revoke
      await api.patch(`/instructors/${id}/revoke`, {});
      setInstructors(prev => prev.map(p => p.id === id ? { ...p, approved: false } : p));
      if (detail?.id === id) setDetail(d => d ? { ...d, approved: false } : d);
    } catch (e: any) { alert(e.message); }
  };

  const handlePayout = (id: number, amount: number) => {
    const newPayout: Payout = { id: Date.now(), amount, createdAt: new Date().toISOString() };
    setDetail(d => d ? { ...d, payouts: [newPayout, ...(d.payouts ?? [])] } : d);
  };

  const filtered = instructors.filter(p => {
    const matchSearch = !search ||
      p.user.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.expertiseArea.toLowerCase().includes(search.toLowerCase()) ||
      p.user.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filterApproved === "all" ||
      (filterApproved === "approved" ? p.approved : !p.approved);
    return matchSearch && matchStatus;
  });

  const totalApproved = instructors.filter(p => p.approved).length;
  const totalPending  = instructors.filter(p => !p.approved).length;
  const avgRating = instructors.length
    ? (instructors.reduce((s, p) => s + p.ratingAverage, 0) / instructors.length).toFixed(1)
    : "—";

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "1.5rem 1rem" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: 12 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 500 }}>🎓 Instrutores</h1>
        <button
          onClick={() => setShowRegistar(true)}
          style={{ fontSize: 13, padding: "8px 18px", background: "#1e40af", color: "#fff", border: "none", borderRadius: "var(--border-radius-md)", fontWeight: 600, cursor: "pointer" }}
        >
          + Registar Instrutor
        </button>
      </div>

      {/* ── Stats ── */}
      {!detail && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12, marginBottom: "1.5rem" }}>
          {[
            { label: "Total de instrutores", value: instructors.length },
            { label: "Aprovados",            value: totalApproved      },
            { label: "Pendentes",            value: totalPending        },
            { label: "Avaliação média",      value: avgRating !== "—" ? `${avgRating} ★` : "—" },
          ].map(s => (
            <div key={s.label} style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "12px 16px" }}>
              <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-secondary)" }}>{s.label}</p>
              <p style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 500 }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Tabs ── */}
      {!detail && (
        <div style={{ display: "flex", gap: 4, marginBottom: "1.25rem", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          {([
            { key: "list",        label: "Todos os instrutores" },
            { key: "marketplace", label: "Marketplace"          },
            { key: "my-profile",  label: "Meu perfil"           },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ fontSize: 13, padding: "8px 14px", border: "none", background: "transparent", borderBottom: tab === t.key ? "2px solid var(--color-text-primary)" : "2px solid transparent", color: tab === t.key ? "var(--color-text-primary)" : "var(--color-text-secondary)", borderRadius: 0, cursor: "pointer" }}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Detail ── */}
      {detail && (
        <InstructorDetail
          p={detail}
          onBack={() => setDetail(null)}
          onPayout={handlePayout}
          onApprove={handleApprove}
          onRevoke={handleRevoke}
        />
      )}

      {/* ── List Tab ── */}
      {!detail && tab === "list" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Filtros */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              placeholder="Pesquisar por nome, email ou área..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: "1 1 220px" }}
            />
            <select value={filterApproved} onChange={e => setFilterApproved(e.target.value as any)} style={{ flex: "0 0 160px" }}>
              <option value="all">Todos os estados</option>
              <option value="approved">Aprovados</option>
              <option value="pending">Pendentes</option>
            </select>
          </div>

          {/* Erro */}
          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: 12, color: "#dc2626", fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>❌ {error}</span>
              <button onClick={loadInstructors} style={{ fontSize: 12, padding: "4px 10px" }}>Tentar novamente</button>
            </div>
          )}

          {/* Conteúdo */}
          {loading ? <Spinner /> : instructors.length === 0 ? (
            <EmptyState
              message="Ainda não há instrutores registados na plataforma."
              action={
                <button onClick={() => setShowRegistar(true)} style={{ fontSize: 13, padding: "8px 18px", background: "#1e40af", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>
                  + Registar primeiro instrutor
                </button>
              }
            />
          ) : (
            <>
              <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-tertiary)" }}>
                {filtered.length} instrutor{filtered.length !== 1 ? "es" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
              </p>
              {filtered.length === 0
                ? <EmptyState message="Nenhum instrutor corresponde aos filtros." />
                : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                    {filtered.map(p => (
                      <InstructorCard key={p.id} p={p} onView={setDetail} onApprove={handleApprove} onRevoke={handleRevoke} />
                    ))}
                  </div>
                )}
            </>
          )}
        </div>
      )}

      {/* ── Marketplace Tab ── */}
      {!detail && tab === "marketplace" && <MarketplaceTab />}

      {/* ── My Profile Tab ── */}
      {!detail && tab === "my-profile" && <MyProfileTab />}

      {/* ── Modal Registar ── */}
      {showRegistar && (
        <ModalRegistar
          onClose={() => setShowRegistar(false)}
          onRegistered={() => { loadInstructors(); }}
        />
      )}
    </div>
  );
}