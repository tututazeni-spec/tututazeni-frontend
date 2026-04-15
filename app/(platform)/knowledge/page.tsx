'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Author { id: number; fullName: string; }
interface Category { id: number; name: string; }
interface Tag { id: number; name: string; }
interface Article {
  id: number;
  title: string;
  description?: string;
  content: string;
  authorId: number;
  categoryId?: number;
  createdAt: string;
  updatedAt: string;
  author: Author;
  category?: Category;
  tags: Tag[];
  likes?: number;
  views?: number;
  userLiked?: boolean;
  _count?: { interactions: number };
}
interface PaginatedArticles {
  data: Article[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── API Layer ────────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

const api = {
  categories: () => apiFetch<Category[]>('/knowledge/categories'),
  articles: (params: Record<string, string | number | undefined>) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v !== undefined && q.set(k, String(v)));
    return apiFetch<PaginatedArticles>(`/knowledge?${q}`);
  },
  article: (id: number) => apiFetch<Article>(`/knowledge/${id}`),
  trending: () => apiFetch<Article[]>('/knowledge/trending?limit=5'),
  search: (q: string) => apiFetch<Article[]>(`/knowledge/search?q=${encodeURIComponent(q)}`),
  createArticle: (dto: object) => apiFetch<Article>('/knowledge', { method: 'POST', body: JSON.stringify(dto) }),
  updateArticle: (id: number, dto: object) => apiFetch<Article>(`/knowledge/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
  deleteArticle: (id: number) => apiFetch<{ message: string }>(`/knowledge/${id}`, { method: 'DELETE' }),
  interact: (dto: { articleId: number; action: string }) =>
    apiFetch<{ liked?: boolean; action?: string; done?: boolean }>('/knowledge/interact', { method: 'POST', body: JSON.stringify(dto) }),
  createCategory: (dto: { name: string }) => apiFetch<Category>('/knowledge/categories', { method: 'POST', body: JSON.stringify(dto) }),
};

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
}
function readingTime(content: string) {
  return Math.max(1, Math.ceil(content.split(' ').length / 200));
}
function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const Icon = {
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  ),
  Plus: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  Heart: ({ filled }: { filled?: boolean }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  Bookmark: ({ filled }: { filled?: boolean }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
    </svg>
  ),
  Share: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/>
    </svg>
  ),
  Eye: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  Trending: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
    </svg>
  ),
  Tag: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  ),
  Close: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Edit: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  Trash: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
  Clock: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Folder: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const colors = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color + '22', border: `1.5px solid ${color}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 600, color, flexShrink: 0,
      fontFamily: 'inherit',
    }}>
      {getInitials(name)}
    </div>
  );
}

function TagBadge({ name }: { name: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 20,
      fontSize: 11, fontWeight: 500,
      background: 'var(--tag-bg, rgba(79,70,229,0.08))',
      color: 'var(--tag-color, #4f46e5)',
      border: '1px solid var(--tag-border, rgba(79,70,229,0.15))',
      letterSpacing: '0.01em',
    }}>
      {name}
    </span>
  );
}

function CategoryBadge({ name }: { name: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 6,
      fontSize: 11, fontWeight: 500,
      background: 'rgba(8,145,178,0.08)',
      color: '#0891b2',
      border: '1px solid rgba(8,145,178,0.15)',
    }}>
      <Icon.Folder /> {name}
    </span>
  );
}

function Spinner({ size = 20 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: '2px solid rgba(79,70,229,0.15)',
      borderTopColor: '#4f46e5',
      animation: 'ks-spin 0.7s linear infinite',
    }} />
  );
}

// ─── Article Card ─────────────────────────────────────────────────────────────

function ArticleCard({
  article, onClick, onLike, onBookmark,
}: {
  article: Article;
  onClick: () => void;
  onLike: () => void;
  onBookmark: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--card-hover-bg, rgba(79,70,229,0.025))' : 'var(--color-background-primary, #fff)',
        border: `1px solid ${hovered ? 'rgba(79,70,229,0.25)' : 'rgba(0,0,0,0.07)'}`,
        borderRadius: 14, padding: '20px 22px',
        cursor: 'pointer', transition: 'all 0.18s ease',
        display: 'flex', flexDirection: 'column', gap: 12,
        transform: hovered ? 'translateY(-2px)' : 'none',
      }}
    >
      <div onClick={onClick} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {article.category && <CategoryBadge name={article.category.name} />}
        </div>

        <h3 style={{
          margin: 0, fontSize: 16, fontWeight: 600,
          color: 'var(--color-text-primary)',
          lineHeight: 1.4,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {article.title}
        </h3>

        {article.description && (
          <p style={{
            margin: 0, fontSize: 13.5, color: 'var(--color-text-secondary)',
            lineHeight: 1.6,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {article.description}
          </p>
        )}

        {article.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {article.tags.slice(0, 4).map(t => <TagBadge key={t.id} name={t.name} />)}
            {article.tags.length > 4 && (
              <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', alignSelf: 'center' }}>
                +{article.tags.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar name={article.author.fullName} size={26} />
          <div>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)' }}>
              {article.author.fullName}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-secondary)', fontSize: 11 }}>
              <Icon.Clock /> {formatDate(article.createdAt)}
              <span style={{ opacity: 0.4 }}>·</span>
              <Icon.Clock /> {readingTime(article.content)} min
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {article.views !== undefined && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: 'var(--color-text-secondary)', marginRight: 6 }}>
              <Icon.Eye /> {article.views}
            </span>
          )}
          <button
            onClick={e => { e.stopPropagation(); onLike(); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: article.userLiked ? 'rgba(220,38,38,0.08)' : 'transparent',
              border: '1px solid ' + (article.userLiked ? 'rgba(220,38,38,0.2)' : 'rgba(0,0,0,0.08)'),
              borderRadius: 8, padding: '4px 8px',
              cursor: 'pointer', fontSize: 12, color: article.userLiked ? '#dc2626' : 'var(--color-text-secondary)',
              transition: 'all 0.15s', fontFamily: 'inherit',
            }}
          >
            <Icon.Heart filled={article.userLiked} />
            {(article.likes ?? 0) > 0 && article.likes}
          </button>
          <button
            onClick={e => { e.stopPropagation(); onBookmark(); }}
            style={{
              display: 'flex', alignItems: 'center',
              background: 'transparent', border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: 8, padding: '4px 8px', cursor: 'pointer',
              color: 'var(--color-text-secondary)', transition: 'all 0.15s', fontFamily: 'inherit',
            }}
          >
            <Icon.Bookmark />
          </button>
        </div>
      </div>
    </article>
  );
}

// ─── Article Detail Modal ──────────────────────────────────────────────────────

function ArticleDetail({
  article, onClose, onLike, onDelete, onEdit,
}: {
  article: Article;
  onClose: () => void;
  onLike: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '24px 16px', overflowY: 'auto',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        width: '100%', maxWidth: 760,
        background: 'var(--color-background-primary, #fff)',
        borderRadius: 20, overflow: 'hidden',
        border: '1px solid rgba(0,0,0,0.08)',
        animation: 'ks-slideup 0.2s ease',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 28px', borderBottom: '1px solid rgba(0,0,0,0.06)',
          display: 'flex', alignItems: 'flex-start', gap: 12, justifyContent: 'space-between',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {article.category && <CategoryBadge name={article.category.name} />}
            </div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.35 }}>
              {article.title}
            </h2>
            {article.description && (
              <p style={{ margin: '8px 0 0', fontSize: 14.5, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                {article.description}
              </p>
            )}
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: 8,
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0, color: 'var(--color-text-secondary)',
          }}><Icon.Close /></button>
        </div>

        {/* Meta */}
        <div style={{
          padding: '14px 28px', borderBottom: '1px solid rgba(0,0,0,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar name={article.author.fullName} size={34} />
            <div>
              <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {article.author.fullName}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                {formatDate(article.createdAt)} · {readingTime(article.content)} min de leitura
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {article.views !== undefined && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                <Icon.Eye /> {article.views} visualizações
              </span>
            )}
            <button onClick={onLike} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: article.userLiked ? 'rgba(220,38,38,0.08)' : 'transparent',
              border: '1px solid ' + (article.userLiked ? 'rgba(220,38,38,0.2)' : 'rgba(0,0,0,0.1)'),
              borderRadius: 8, padding: '5px 12px',
              cursor: 'pointer', fontSize: 13, color: article.userLiked ? '#dc2626' : 'var(--color-text-secondary)',
              fontFamily: 'inherit',
            }}>
              <Icon.Heart filled={article.userLiked} />
              {article.likes ?? 0} gostos
            </button>
            <button onClick={onEdit} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'transparent', border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: 8, padding: '5px 10px', cursor: 'pointer',
              color: 'var(--color-text-secondary)', fontFamily: 'inherit',
            }}><Icon.Edit /></button>
            <button onClick={onDelete} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)',
              borderRadius: 8, padding: '5px 10px', cursor: 'pointer',
              color: '#dc2626', fontFamily: 'inherit',
            }}><Icon.Trash /></button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px 28px' }}>
          <div style={{
            fontSize: 15, lineHeight: 1.8, color: 'var(--color-text-primary)',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {article.content}
          </div>

          {article.tags.length > 0 && (
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Tags</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {article.tags.map(t => <TagBadge key={t.id} name={t.name} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Article Form Modal ───────────────────────────────────────────────────────

function ArticleForm({
  initial, categories, onSave, onClose,
}: {
  initial?: Article | null;
  categories: Category[];
  onSave: (dto: object) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    content: initial?.content ?? '',
    categoryId: initial?.categoryId ?? '',
    tags: initial?.tags.map(t => t.name).join(', ') ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  async function handleSubmit() {
    if (!form.title.trim() || !form.content.trim()) {
      setError('Título e conteúdo são obrigatórios.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
      await onSave({
        title: form.title,
        description: form.description || undefined,
        content: form.content,
        categoryId: form.categoryId ? Number(form.categoryId) : undefined,
        tags: tags.length ? tags : undefined,
      });
    } catch {
      setError('Erro ao guardar artigo. Tenta novamente.');
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 10,
    border: '1px solid rgba(0,0,0,0.12)', fontSize: 14,
    background: 'var(--color-background-secondary, #f9f9f9)',
    color: 'var(--color-text-primary)', fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '24px 16px', overflowY: 'auto',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        width: '100%', maxWidth: 640,
        background: 'var(--color-background-primary, #fff)',
        borderRadius: 20, overflow: 'hidden',
        border: '1px solid rgba(0,0,0,0.08)',
        animation: 'ks-slideup 0.2s ease',
      }}>
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {initial ? 'Editar artigo' : 'Novo artigo'}
          </h2>
          <button onClick={onClose} style={{
            background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: 8,
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--color-text-secondary)',
          }}><Icon.Close /></button>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 10,
              background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)',
              fontSize: 13, color: '#dc2626',
            }}>{error}</div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Título *
            </label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Título do artigo..." style={inputStyle} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Descrição
            </label>
            <input value={form.description} onChange={e => set('description', e.target.value)} placeholder="Resumo breve..." style={inputStyle} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Conteúdo *
            </label>
            <textarea value={form.content} onChange={e => set('content', e.target.value)} placeholder="Escreve o conteúdo aqui..." rows={8} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Categoria
              </label>
              <select value={form.categoryId} onChange={e => set('categoryId', e.target.value)} style={{ ...inputStyle }}>
                <option value="">Sem categoria</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Tags (separadas por vírgula)
              </label>
              <input value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="ex: onboarding, rh, processos" style={inputStyle} />
            </div>
          </div>
        </div>

        <div style={{
          padding: '16px 24px', borderTop: '1px solid rgba(0,0,0,0.06)',
          display: 'flex', justifyContent: 'flex-end', gap: 10,
        }}>
          <button onClick={onClose} style={{
            padding: '9px 20px', borderRadius: 10,
            background: 'transparent', border: '1px solid rgba(0,0,0,0.1)',
            cursor: 'pointer', fontSize: 14, color: 'var(--color-text-secondary)', fontFamily: 'inherit',
          }}>Cancelar</button>
          <button onClick={handleSubmit} disabled={saving} style={{
            padding: '9px 22px', borderRadius: 10,
            background: saving ? 'rgba(79,70,229,0.5)' : '#4f46e5',
            border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: 14, fontWeight: 600, color: '#fff', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            {saving && <Spinner size={14} />}
            {saving ? 'A guardar...' : (initial ? 'Atualizar' : 'Publicar artigo')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Trending Sidebar ─────────────────────────────────────────────────────────

function TrendingSidebar({ articles, onSelect }: { articles: Article[]; onSelect: (a: Article) => void }) {
  return (
    <div style={{
      background: 'var(--color-background-primary, #fff)',
      border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: '18px 18px', height: 'fit-content',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <div style={{ color: '#f59e0b' }}><Icon.Trending /></div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Em tendência
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {articles.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>Sem tendências recentes.</p>
        )}
        {articles.map((a, i) => (
          <button key={a.id} onClick={() => onSelect(a)} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 8px',
            background: 'transparent', border: 'none', borderRadius: 10,
            cursor: 'pointer', textAlign: 'left', width: '100%',
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(79,70,229,0.05)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <span style={{
              minWidth: 22, height: 22, borderRadius: 6,
              background: i === 0 ? '#4f46e5' : i === 1 ? '#818cf8' : 'rgba(0,0,0,0.07)',
              color: i < 2 ? '#fff' : 'var(--color-text-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, flexShrink: 0,
            }}>{i + 1}</span>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {a.title}
              </p>
              {a.author && (
                <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--color-text-secondary)' }}>
                  {a.author.fullName}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Categories Sidebar Panel ─────────────────────────────────────────────────

function CategoriesSidebar({
  categories, selected, onSelect,
}: { categories: Category[]; selected?: number; onSelect: (id?: number) => void; }) {
  return (
    <div style={{
      background: 'var(--color-background-primary, #fff)',
      border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: '18px', height: 'fit-content',
    }}>
      <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        Categorias
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <button onClick={() => onSelect(undefined)} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
          background: !selected ? 'rgba(79,70,229,0.08)' : 'transparent',
          color: !selected ? '#4f46e5' : 'var(--color-text-secondary)',
          fontSize: 13, fontWeight: !selected ? 600 : 400, fontFamily: 'inherit', textAlign: 'left',
          transition: 'all 0.15s',
        }}>
          Todos os artigos
        </button>
        {categories.map(c => (
          <button key={c.id} onClick={() => onSelect(c.id)} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: selected === c.id ? 'rgba(79,70,229,0.08)' : 'transparent',
            color: selected === c.id ? '#4f46e5' : 'var(--color-text-secondary)',
            fontSize: 13, fontWeight: selected === c.id ? 600 : 400, fontFamily: 'inherit', textAlign: 'left',
            transition: 'all 0.15s', width: '100%',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon.Folder /> {c.name}
            </span>
            {(c as any)._count?.articles !== undefined && (
              <span style={{ fontSize: 11, background: 'rgba(0,0,0,0.07)', borderRadius: 20, padding: '1px 7px', color: 'var(--color-text-secondary)' }}>
                {(c as any)._count.articles}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function KnowledgePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [trending, setTrending] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Article[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [detailArticle, setDetailArticle] = useState<Article | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editArticle, setEditArticle] = useState<Article | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  const loadArticles = useCallback(async (p = 1, catId?: number) => {
    setLoading(true);
    try {
      const res = await api.articles({ page: p, limit: 12, categoryId: catId });
      setArticles(res.data);
      setTotalPages(res.totalPages);
      setPage(res.page);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadArticles(1, selectedCategory);
  }, [selectedCategory, loadArticles]);

  useEffect(() => {
    api.categories().then(setCategories).catch(() => {});
    api.trending().then(setTrending).catch(() => {});
  }, []);

  // Search debounce
  useEffect(() => {
    clearTimeout(searchTimer.current);
    if (!searchQuery.trim()) { setSearchResults(null); return; }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await api.search(searchQuery.trim());
        setSearchResults(res);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 380);
    return () => clearTimeout(searchTimer.current);
  }, [searchQuery]);

  async function handleLike(article: Article) {
    try {
      const res = await api.interact({ articleId: article.id, action: 'LIKE' });
      const updater = (a: Article) =>
        a.id !== article.id ? a : {
          ...a,
          userLiked: res.liked !== false,
          likes: res.liked === false ? (a.likes ?? 1) - 1 : (a.likes ?? 0) + 1,
        };
      setArticles(arr => arr.map(updater));
      if (detailArticle?.id === article.id) setDetailArticle(a => a ? updater(a) : a);
    } catch { /* ignore */ }
  }

  async function handleBookmark(article: Article) {
    try {
      await api.interact({ articleId: article.id, action: 'BOOKMARK' });
    } catch { /* ignore */ }
  }

  async function openDetail(article: Article) {
    try {
      const full = await api.article(article.id);
      setDetailArticle(full);
    } catch { setDetailArticle(article); }
  }

  async function handleCreate(dto: object) {
    const created = await api.createArticle(dto);
    setArticles(prev => [created, ...prev]);
    setShowForm(false);
  }

  async function handleUpdate(dto: object) {
    if (!editArticle) return;
    const updated = await api.updateArticle(editArticle.id, dto);
    setArticles(prev => prev.map(a => a.id === updated.id ? updated : a));
    if (detailArticle?.id === updated.id) setDetailArticle(updated);
    setEditArticle(null);
  }

  async function handleDelete() {
    if (!detailArticle) return;
    if (!confirm('Tens a certeza que queres remover este artigo?')) return;
    try {
      await api.deleteArticle(detailArticle.id);
      setArticles(prev => prev.filter(a => a.id !== detailArticle.id));
      setDetailArticle(null);
    } catch { alert('Erro ao remover artigo.'); }
  }

  const displayArticles = searchResults ?? articles;

  return (
    <>
      <style>{`
        @keyframes ks-spin { to { transform: rotate(360deg); } }
        @keyframes ks-slideup { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        @keyframes ks-fadein { from { opacity: 0; } to { opacity: 1; } }
        * { box-sizing: border-box; }
        :root {
          --tag-bg: rgba(79,70,229,0.07);
          --tag-color: #4f46e5;
          --tag-border: rgba(79,70,229,0.15);
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --tag-bg: rgba(129,140,248,0.12);
            --tag-color: #a5b4fc;
            --tag-border: rgba(129,140,248,0.2);
            --card-hover-bg: rgba(129,140,248,0.05);
          }
        }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: 'var(--color-background-tertiary, #f6f6f4)',
        fontFamily: 'var(--font-sans, system-ui, sans-serif)',
      }}>
        {/* Top Bar */}
        <div style={{
          background: 'var(--color-background-primary, #fff)',
          borderBottom: '1px solid rgba(0,0,0,0.07)',
          position: 'sticky', top: 0, zIndex: 100,
        }}>
          <div style={{ maxWidth: 1260, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, height: 60 }}>
              {/* Logo / Title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: 'linear-gradient(135deg, #4f46e5, #818cf8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1 }}>
                    Knowledge Base
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1 }}>
                    Base de conhecimento
                  </p>
                </div>
              </div>

              {/* Search */}
              <div style={{ flex: 1, position: 'relative', maxWidth: 480 }}>
                <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)', pointerEvents: 'none', display: 'flex' }}>
                  {searching ? <Spinner size={15} /> : <Icon.Search />}
                </div>
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Pesquisar artigos, tags, conteúdo..."
                  style={{
                    width: '100%', padding: '8px 12px 8px 38px',
                    borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)',
                    background: 'var(--color-background-secondary, #f5f5f5)',
                    fontSize: 14, color: 'var(--color-text-primary)', fontFamily: 'inherit', outline: 'none',
                  }}
                />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(''); setSearchResults(null); }} style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'flex',
                  }}><Icon.Close /></button>
                )}
              </div>

              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setShowForm(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 10,
                    background: '#4f46e5', border: 'none',
                    color: '#fff', fontSize: 13.5, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'background 0.15s',
                  }}
                >
                  <Icon.Plus /> Novo artigo
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ maxWidth: 1260, margin: '0 auto', padding: '28px 24px', display: 'grid', gridTemplateColumns: '220px 1fr 240px', gap: 24, alignItems: 'start' }}>

          {/* Left: Categories */}
          <div style={{ position: 'sticky', top: 80 }}>
            <CategoriesSidebar
              categories={categories}
              selected={selectedCategory}
              onSelect={id => { setSelectedCategory(id); setSearchQuery(''); setSearchResults(null); setPage(1); }}
            />
          </div>

          {/* Main: Articles */}
          <main>
            {/* Status bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                {searchResults !== null ? (
                  <p style={{ margin: 0, fontSize: 13.5, color: 'var(--color-text-secondary)' }}>
                    <strong style={{ color: 'var(--color-text-primary)' }}>{searchResults.length}</strong> resultado{searchResults.length !== 1 ? 's' : ''} para &ldquo;{searchQuery}&rdquo;
                  </p>
                ) : (
                  <p style={{ margin: 0, fontSize: 13.5, color: 'var(--color-text-secondary)' }}>
                    {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'Todos os artigos'}
                  </p>
                )}
              </div>
            </div>

            {loading && !articles.length ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
                <Spinner size={32} />
              </div>
            ) : displayArticles.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '80px 24px',
                background: 'var(--color-background-primary, #fff)',
                borderRadius: 16, border: '1px solid rgba(0,0,0,0.07)',
              }}>
                <div style={{ fontSize: 42, marginBottom: 16, opacity: 0.4 }}>📚</div>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {searchResults !== null ? 'Sem resultados encontrados' : 'Nenhum artigo publicado'}
                </p>
                <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--color-text-secondary)' }}>
                  {searchResults !== null ? 'Tenta pesquisar por outras palavras-chave.' : 'Sê o primeiro a partilhar conhecimento!'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 16 }}>
                {displayArticles.map(a => (
                  <ArticleCard
                    key={a.id}
                    article={a}
                    onClick={() => openDetail(a)}
                    onLike={() => handleLike(a)}
                    onBookmark={() => handleBookmark(a)}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!searchResults && totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 28 }}>
                <button
                  disabled={page <= 1}
                  onClick={() => loadArticles(page - 1, selectedCategory)}
                  style={{
                    padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)',
                    background: 'var(--color-background-primary, #fff)', cursor: page > 1 ? 'pointer' : 'not-allowed',
                    fontSize: 13, color: page > 1 ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    fontFamily: 'inherit', opacity: page <= 1 ? 0.4 : 1,
                  }}
                >← Anterior</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .map((p, idx, arr) => (
                    <>
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span key={`ellipsis-${p}`} style={{ padding: '7px 4px', fontSize: 13, color: 'var(--color-text-secondary)' }}>…</span>
                      )}
                      <button
                        key={p}
                        onClick={() => loadArticles(p, selectedCategory)}
                        style={{
                          width: 36, height: 36, borderRadius: 8,
                          border: '1px solid ' + (p === page ? '#4f46e5' : 'rgba(0,0,0,0.1)'),
                          background: p === page ? '#4f46e5' : 'var(--color-background-primary, #fff)',
                          color: p === page ? '#fff' : 'var(--color-text-primary)',
                          cursor: 'pointer', fontSize: 13, fontWeight: p === page ? 600 : 400,
                          fontFamily: 'inherit',
                        }}
                      >{p}</button>
                    </>
                  ))
                }
                <button
                  disabled={page >= totalPages}
                  onClick={() => loadArticles(page + 1, selectedCategory)}
                  style={{
                    padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)',
                    background: 'var(--color-background-primary, #fff)', cursor: page < totalPages ? 'pointer' : 'not-allowed',
                    fontSize: 13, color: page < totalPages ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    fontFamily: 'inherit', opacity: page >= totalPages ? 0.4 : 1,
                  }}
                >Seguinte →</button>
              </div>
            )}
          </main>

          {/* Right: Trending */}
          <div style={{ position: 'sticky', top: 80 }}>
            <TrendingSidebar articles={trending} onSelect={openDetail} />
          </div>
        </div>
      </div>

      {/* Modals */}
      {detailArticle && (
        <ArticleDetail
          article={detailArticle}
          onClose={() => setDetailArticle(null)}
          onLike={() => handleLike(detailArticle)}
          onDelete={handleDelete}
          onEdit={() => { setEditArticle(detailArticle); setDetailArticle(null); }}
        />
      )}
      {(showForm || editArticle) && (
        <ArticleForm
          initial={editArticle}
          categories={categories}
          onSave={editArticle ? handleUpdate : handleCreate}
          onClose={() => { setShowForm(false); setEditArticle(null); }}
        />
      )}
    </>
  );
}












