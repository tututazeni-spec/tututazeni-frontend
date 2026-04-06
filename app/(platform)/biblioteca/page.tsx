"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Content { id: number; title: string; description?: string; type: string; url: string; active: boolean; createdAt: string; }

// ─── Maps ─────────────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  VIDEO:        { icon: "🎬", color: "#dc2626", bg: "#fef2f2" },
  PDF:          { icon: "📄", color: "#f59e0b", bg: "#fffbeb" },
  PRESENTATION: { icon: "📊", color: "#1e40af", bg: "#eff6ff" },
  ARTICLE:      { icon: "📝", color: "#16a34a", bg: "#ecfdf5" },
  PODCAST:      { icon: "🎙️", color: "#7c3aed", bg: "#f5f3ff" },
  INFOGRAPHIC:  { icon: "🖼️", color: "#0ea5e9", bg: "#f0f9ff" },
  QUIZ:         { icon: "❓", color: "#f97316", bg: "#fff7ed" },
  TEMPLATE:     { icon: "📋", color: "#64748b", bg: "#f8fafc" },
};
const TYPES = Object.keys(TYPE_CONFIG);

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

// ─── Modal: Criar / Editar Conteúdo ──────────────────────────────────────────
function ContentModal({ editing, onClose, onSaved }: {
  editing: Content | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: editing?.title ?? "",
    description: editing?.description ?? "",
    type: editing?.type ?? "ARTICLE",
    fileUrl: editing?.url ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      if (editing) {
        await api.put(`/content-library/${editing.id}`, form);
      } else {
        await api.post("/content-library", form);
      }
      onSaved(); onClose();
    } catch (e: any) {
      setError(e.message ?? "Erro ao guardar");
    } finally { setSaving(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ ...card, width: "100%", maxWidth: 480, boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1e293b" }}>
            {editing ? "✏️ Editar Conteúdo" : "📚 Novo Conteúdo"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button>
        </div>
        <form onSubmit={submit}>
          <div style={{ marginBottom: 14 }}>
            <span style={labelStyle}>Título *</span>
            <input style={inputStyle} value={form.title} onChange={e => set("title", e.target.value)} placeholder="Ex: Guia de Onboarding" required />
          </div>
          <div style={{ marginBottom: 14 }}>
            <span style={labelStyle}>Descrição</span>
            <textarea style={{ ...inputStyle, height: 72, resize: "vertical" }} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Breve descrição do conteúdo..." />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <span style={labelStyle}>Tipo *</span>
              <select style={inputStyle} value={form.type} onChange={e => set("type", e.target.value)} required>
                {TYPES.map(t => (
                  <option key={t} value={t}>{TYPE_CONFIG[t].icon} {t}</option>
                ))}
              </select>
            </div>
            <div>
              <span style={labelStyle}>URL do Ficheiro *</span>
              <input style={inputStyle} value={form.fileUrl} onChange={e => set("fileUrl", e.target.value)} placeholder="https://..." required />
            </div>
          </div>

          {/* Preview do tipo seleccionado */}
          <div style={{ padding: "10px 14px", background: TYPE_CONFIG[form.type]?.bg ?? "#f8fafc", borderRadius: 8, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>{TYPE_CONFIG[form.type]?.icon ?? "📄"}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: TYPE_CONFIG[form.type]?.color ?? "#64748b" }}>
              Tipo: {form.type}
            </span>
          </div>

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
              <p style={{ margin: 0, fontSize: 13, color: "#dc2626" }}>{error}</p>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={btnGhost}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>
              {saving ? "A guardar..." : editing ? "Guardar Alterações" : "Publicar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Content Card ─────────────────────────────────────────────────────────────
function ContentCard({ content, isBookmarked, onBookmark, onView, onEdit }: {
  content: Content;
  isBookmarked: boolean;
  onBookmark: () => void;
  onView: () => void;
  onEdit: () => void;
}) {
  const tc = TYPE_CONFIG[content.type] ?? { icon: "📄", color: "#64748b", bg: "#f8fafc" };

  return (
    <div style={{ ...card, padding: 20, display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: tc.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
          {tc.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{content.title}</h3>
          <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: tc.bg, color: tc.color }}>{content.type}</span>
        </div>
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          {/* Editar */}
          <button onClick={onEdit} title="Editar" style={{ background: "#f1f5f9", border: "none", borderRadius: 7, cursor: "pointer", padding: "5px 8px", fontSize: 14, color: "#64748b" }}>✏️</button>
          {/* Bookmark */}
          <button onClick={onBookmark} title={isBookmarked ? "Remover dos guardados" : "Guardar"} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: isBookmarked ? "#f59e0b" : "#cbd5e1", padding: "2px" }}>
            {isBookmarked ? "🔖" : "📌"}
          </button>
        </div>
      </div>

      {/* Descrição */}
      {content.description && (
        <p style={{ margin: "0 0 12px", fontSize: 12, color: "#64748b", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: 1.5 }}>
          {content.description}
        </p>
      )}

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
        <span style={{ fontSize: 11, color: "#94a3b8" }}>{new Date(content.createdAt).toLocaleDateString("pt-PT")}</span>
        <a
          href={content.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onView}
          style={{ padding: "7px 14px", background: "#eff6ff", color: "#1e40af", borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: "none" }}
        >
          ▶️ Abrir
        </a>
      </div>
    </div>
  );
}

// ─── Tab ─────────────────────────────────────────────────────────────────────
type Tab = "all" | "recommended" | "bookmarks";

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function BibliotecaPage() {
  const [tab, setTab] = useState<Tab>("all");
  const [contents, setContents] = useState<Content[]>([]);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [total, setTotal] = useState(0);

  // Modal state — null = closed, Content = edit, "new" = create
  const [modalTarget, setModalTarget] = useState<Content | "new" | null>(null);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error") { setToast({ msg, type }); }

  // ── Fetch ─────────────────────────────────────────────────────────────────
  async function fetchContents() {
    setLoading(true);
    try {
      let data: Content[] = [];
      if (tab === "recommended") {
        data = await api.get<Content[]>("/content-library/recommended");
        setTotal(data.length);
      } else if (tab === "bookmarks") {
        data = await api.get<Content[]>("/content-library/bookmarks");
        setTotal(data.length);
      } else {
        const p = new URLSearchParams();
        if (search) p.set("search", search);
        if (typeFilter) p.set("type", typeFilter);
        p.set("limit", "40");
        const res = await api.get<any>(`/content-library?${p}`);
        data = res.data ?? res;
        setTotal(res.total ?? data.length);
      }
      setContents(data);
    } catch (e: any) {
      showToast(e.message ?? "Erro ao carregar conteúdos", "error");
    } finally { setLoading(false); }
  }

  useEffect(() => { fetchContents(); }, [tab, search, typeFilter]);

  // ── Bookmark toggle ───────────────────────────────────────────────────────
  async function toggleBookmark(id: number) {
    try {
      const r = await api.patch<{ bookmarked: boolean }>(`/content-library/${id}/bookmark`, {});
      if (r.bookmarked) {
        setBookmarks(b => [...b, id]);
        showToast("Guardado nos favoritos!", "success");
      } else {
        setBookmarks(b => b.filter(x => x !== id));
        showToast("Removido dos guardados", "success");
        if (tab === "bookmarks") fetchContents();
      }
    } catch (e: any) { showToast(e.message, "error"); }
  }

  // ── View ──────────────────────────────────────────────────────────────────
  async function view(id: number) {
    await api.patch(`/content-library/${id}/view`, {}).catch(() => {});
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  const countByType = TYPES.map(t => ({
    type: t,
    count: contents.filter(c => c.type === t).length,
    ...TYPE_CONFIG[t],
  })).filter(t => t.count > 0);

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", margin: 0 }}>📚 Biblioteca de Conteúdos</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Artigos, vídeos, PDFs e mais — {total} conteúdos</p>
        </div>
        <button onClick={() => setModalTarget("new")} style={btnPrimary}>+ Publicar Conteúdo</button>
      </div>

      {/* ── Mini stats por tipo ── */}
      {tab === "all" && countByType.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {countByType.map(t => (
            <div key={t.type} onClick={() => setTypeFilter(typeFilter === t.type ? "" : t.type)} style={{ padding: "6px 14px", borderRadius: 20, background: typeFilter === t.type ? t.bg : "#f8fafc", border: `1.5px solid ${typeFilter === t.type ? t.color : "#e2e8f0"}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 14 }}>{t.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: typeFilter === t.type ? t.color : "#64748b" }}>{t.type} ({t.count})</span>
            </div>
          ))}
          {typeFilter && <button onClick={() => setTypeFilter("")} style={{ padding: "6px 14px", borderRadius: 20, background: "none", border: "1.5px solid #fecaca", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#dc2626" }}>× Limpar filtro</button>}
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 10, padding: 4, marginBottom: 20, width: "fit-content" }}>
        {([["all", "📚 Todos"], ["recommended", "⭐ Recomendados"], ["bookmarks", "🔖 Guardados"]] as [Tab, string][]).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding: "8px 18px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: tab === k ? 700 : 500, borderRadius: 8, background: tab === k ? "#1e40af" : "transparent", color: tab === k ? "#fff" : "#64748b", transition: "all 0.15s" }}>{l}</button>
        ))}
      </div>

      {/* ── Pesquisa (só tab all) ── */}
      {tab === "all" && (
        <input
          style={{ ...inputStyle, maxWidth: 300, marginBottom: 20 }}
          placeholder="🔍 Pesquisar conteúdo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      )}

      {/* ── Grid ── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#94a3b8", fontSize: 14 }}>A carregar...</div>
      ) : contents.length === 0 ? (
        <div style={{ ...card, textAlign: "center", padding: 60 }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>📚</p>
          <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 16px" }}>
            {tab === "bookmarks" ? "Ainda não guardaste nenhum conteúdo." : "Nenhum conteúdo encontrado."}
          </p>
          {tab === "all" && <button onClick={() => setModalTarget("new")} style={btnPrimary}>+ Publicar Conteúdo</button>}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {contents.map(c => (
            <ContentCard
              key={c.id}
              content={c}
              isBookmarked={bookmarks.includes(c.id)}
              onBookmark={() => toggleBookmark(c.id)}
              onView={() => view(c.id)}
              onEdit={() => setModalTarget(c)}
            />
          ))}
        </div>
      )}

      {/* ── Modal Criar/Editar ── */}
      {modalTarget !== null && (
        <ContentModal
          editing={modalTarget === "new" ? null : modalTarget}
          onClose={() => setModalTarget(null)}
          onSaved={() => {
            fetchContents();
            showToast(modalTarget === "new" ? "Conteúdo publicado!" : "Conteúdo actualizado!", "success");
          }}
        />
      )}

      {/* ── Toast ── */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}