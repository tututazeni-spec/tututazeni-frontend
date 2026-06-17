// src/app/(dashboard)/knowledge/page.tsx
'use client';

import { useState } from 'react';
import { keepPreviousData, useQueryClient } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { sanitizeHtml } from '@/lib/sanitize';

// ─── Types ────────────────────────────────────────────────────────────────────

type ArticleStatus = 'DRAFT' | 'IN_REVIEW' | 'PUBLISHED' | 'ARCHIVED';
type ArticleAccess = 'PUBLIC' | 'DEPARTMENT' | 'ROLE' | 'CONFIDENTIAL';

interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  _count: { articles: number };
  children?: Category[];
}

interface Article {
  id: number;
  title: string;
  summary: string | null;
  content: string;
  status: ArticleStatus;
  accessLevel: ArticleAccess;
  mandatory: boolean;
  readingMinutes: number;
  viewCount: number;
  avgRating: number | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  author: { id: number; fullName: string; avatarUrl: string | null };
  category: { id: number; name: string; icon: string | null; color: string | null } | null;
  tags: Array<{ id: number; name: string }>;
  _count: { comments: number; questions: number; acknowledgements: number };
  userBookmarked?: boolean;
  userRating?: number | null;
  userAcknowledged?: boolean;
  comments?: Comment[];
  questions?: Question[];
}

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  author: { id: number; fullName: string; avatarUrl: string | null };
  replies?: Comment[];
}

interface Question {
  id: number;
  question: string;
  answer: string | null;
  answeredAt: string | null;
  createdAt: string;
  askedBy: { id: number; fullName: string };
}

interface SearchResult {
  id: number;
  title: string;
  summary: string | null;
  category: { name: string; icon: string | null } | null;
  tags: Array<{ name: string }>;
  viewCount: number;
}

interface Dashboard {
  articles: { total: number; published: number; stale: number };
  views: number;
  emptySearches: number;
  topArticles: Article[];
  recentlyUpdated: Article[];
  knowledgeGaps: Array<{ query: string; searches: number }>;
}

type View = 'portal' | 'library' | 'article' | 'dashboard';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'hoje';
  if (days === 1) return 'ontem';
  if (days < 7) return `há ${days} dias`;
  return fmtDate(d);
}

function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
    </div>
  );
}

function Avatar({ name, avatarUrl, size = 'sm' }: { name: string; avatarUrl?: string | null; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
  return avatarUrl ? (
    <img src={avatarUrl} alt={name} className={`${dim} rounded-full object-cover flex-shrink-0`} />
  ) : (
    <div className={`${dim} rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold flex-shrink-0`}>
      {initials(name)}
    </div>
  );
}

// ─── Badges ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ArticleStatus }) {
  const cfg: Record<ArticleStatus, { label: string; cls: string }> = {
    DRAFT:     { label: 'Rascunho',   cls: 'bg-gray-100 text-gray-500' },
    IN_REVIEW: { label: 'Em revisão', cls: 'bg-amber-50 text-amber-700' },
    PUBLISHED: { label: 'Publicado',  cls: 'bg-emerald-50 text-emerald-700' },
    ARCHIVED:  { label: 'Arquivado',  cls: 'bg-gray-100 text-gray-400' },
  };
  const { label, cls } = cfg[status];
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{label}</span>;
}

function StarRating({ value, max = 5 }: { value: number | null; max?: number }) {
  if (!value) return <span className="text-xs text-gray-300">Sem avaliação</span>;
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => i + 1).map(s => (
        <span key={s} className={`text-sm ${s <= Math.round(value) ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
      ))}
      <span className="text-xs text-gray-400 ml-1">{value.toFixed(1)}</span>
    </div>
  );
}

// ─── Article Card ─────────────────────────────────────────────────────────────

function ArticleCard({ article, onClick }: { article: Article; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1">
          {article.category && (
            <div className="flex items-center gap-1.5 mb-1.5">
              {article.category.icon && <span className="text-sm">{article.category.icon}</span>}
              <span className="text-xs text-blue-600 font-medium">{article.category.name}</span>
            </div>
          )}
          <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors leading-tight">
            {article.title}
          </div>
        </div>
        {article.mandatory && (
          <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded flex-shrink-0">Obrigatório</span>
        )}
      </div>

      {article.summary && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">{article.summary}</p>
      )}

      <div className="flex flex-wrap gap-1.5 mb-3">
        {article.tags.slice(0, 4).map(t => (
          <span key={t.id} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">#{t.name}</span>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <Avatar name={article.author.fullName} avatarUrl={article.author.avatarUrl} size="sm" />
          <span>{article.author.fullName}</span>
        </div>
        <div className="flex items-center gap-3">
          <span>👁 {article.viewCount}</span>
          <span>⏱ {article.readingMinutes}min</span>
          {article.avgRating && <span>★ {article.avgRating.toFixed(1)}</span>}
          <span>{timeAgo(article.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── View: Portal ─────────────────────────────────────────────────────────────

function PortalView({ onSelectArticle, onSearch }: {
  onSelectArticle: (id: number) => void;
  onSearch: (q: string) => void;
}) {
  const [searchQ, setSearchQ]       = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching]   = useState(false);

  // Categorias e trending em paralelo (cache).
  const catsQ = useApiQuery<Category[]>(
    queryKeys.knowledge.categories(), '/knowledge/categories',
    { staleTime: STALE_TIME.STATIC },
  );
  const trendQ = useApiQuery<Article[]>(
    queryKeys.knowledge.trending(), '/knowledge/trending',
    { params: { limit: 6 }, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const categories = catsQ.data ?? [];
  const trending = trendQ.data ?? [];
  const loading = catsQ.isLoading;

  const handleSearch = async () => {
    if (!searchQ.trim()) return;
    setSearching(true);
    try {
      const results = await apiClient.get<SearchResult[]>('/knowledge/search', {
        params: { q: searchQ },
      });
      setSearchResults(results);
    } finally { setSearching(false); }
  };

  if (loading) return <Skeleton rows={3} />;

  return (
    <div className="space-y-8">
      {/* Search hero */}
      <div className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl p-8 text-center">
        <div className="text-2xl font-bold text-white mb-2">Base de Conhecimento INNOVA</div>
        <div className="text-blue-200 text-sm mb-5">Encontra políticas, processos, guias e muito mais</div>
        <div className="flex gap-2 max-w-xl mx-auto">
          <input
            type="text"
            placeholder="Pesquisar artigos, políticas, processos…"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="flex-1 text-sm px-4 py-3 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
          <button
            onClick={handleSearch}
            disabled={searching}
            className="px-5 py-3 bg-white text-blue-700 text-sm font-semibold rounded-xl hover:bg-blue-50 disabled:opacity-50"
          >
            {searching ? '…' : '🔍 Pesquisar'}
          </button>
        </div>
      </div>

      {/* Search results */}
      {searchResults !== null && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-gray-900">{searchResults.length} resultados para &quot;{searchQ}&quot;</div>
            <button onClick={() => setSearchResults(null)} className="text-xs text-gray-400 hover:text-gray-700">Limpar</button>
          </div>
          {searchResults.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
              🔍 Sem resultados. Esta pesquisa foi registada para análise de gaps de conhecimento.
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults.map(r => (
                <div
                  key={r.id}
                  onClick={() => onSelectArticle(r.id)}
                  className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 cursor-pointer hover:shadow-sm"
                >
                  {r.category?.icon && <span className="text-xl flex-shrink-0">{r.category.icon}</span>}
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{r.title}</div>
                    {r.summary && <p className="text-xs text-gray-500 truncate">{r.summary}</p>}
                  </div>
                  <span className="text-xs text-gray-400">👁 {r.viewCount}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Categorias */}
      {!searchResults && (
        <>
          <div>
            <div className="text-sm font-semibold text-gray-900 mb-4">Categorias</div>
            <div className="grid grid-cols-4 gap-3">
              {categories.map(cat => (
                <div
                  key={cat.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:shadow-sm hover:border-blue-200 transition-all text-center"
                >
                  <div className="text-3xl mb-2">{cat.icon ?? '📄'}</div>
                  <div className="text-xs font-medium text-gray-900">{cat.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{cat._count.articles} artigos</div>
                </div>
              ))}
            </div>
          </div>

          {/* Trending */}
          <div>
            <div className="text-sm font-semibold text-gray-900 mb-4">🔥 Em destaque</div>
            <div className="grid grid-cols-3 gap-4">
              {trending.map(art => (
                <ArticleCard key={art.id} article={art} onClick={() => onSelectArticle(art.id)} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── View: Library ────────────────────────────────────────────────────────────

function LibraryView({ onSelectArticle }: { onSelectArticle: (id: number) => void }) {
  const [search, setSearch]     = useState('');
  const [categoryId] = useState('');
  const [sortBy, setSortBy]     = useState('RECENT');
  const [page, setPage]         = useState(1);
  const debouncedSearch = useDebounce(search);
  const params = { page, limit: 12, sortBy, search: debouncedSearch, categoryId };

  const { data, isLoading: loading } = useApiQuery<{ data: Article[]; total: number }>(
    queryKeys.knowledge.list(params), '/knowledge',
    { params, staleTime: STALE_TIME.SEMI_STATIC, placeholderData: keepPreviousData },
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          type="text" placeholder="Pesquisar…"
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 min-w-[200px] text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="RECENT">Mais recentes</option>
          <option value="POPULAR">Mais vistos</option>
          <option value="RATING">Melhor avaliados</option>
          <option value="UPDATED">Actualizados</option>
        </select>
        <span className="text-xs text-gray-400">{data?.total ?? 0} artigos</span>
      </div>

      {loading ? <Skeleton /> : (
        <div className="grid grid-cols-3 gap-4">
          {data?.data.map(article => (
            <ArticleCard key={article.id} article={article} onClick={() => onSelectArticle(article.id)} />
          ))}
          {data?.data.length === 0 && (
            <div className="col-span-3 py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
              Sem artigos encontrados
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── View: Article Detail ─────────────────────────────────────────────────────

function ArticleDetailView({ articleId, onBack }: { articleId: number; onBack: () => void }) {
  const qc = useQueryClient();
  const [comment, setComment]   = useState('');
  const [posting, setPosting]   = useState(false);
  const [rating, setRating]     = useState(0);
  const [hovRating, setHovRating] = useState(0);
  const [acknowledging, setAcknowledging] = useState(false);

  const articleKey = queryKeys.knowledge.article(articleId);
  const { data: article, isLoading: loading } = useApiQuery<Article>(
    articleKey, `/knowledge/${articleId}`,
    { enabled: !!articleId, staleTime: STALE_TIME.DYNAMIC },
  );

  const handleBookmark = async () => {
    if (!article) return;
    try {
      const res = await apiClient.post<any>('/knowledge/interact', { articleId, action: 'BOOKMARK' });
      qc.setQueryData<Article>(articleKey, prev => prev ? { ...prev, userBookmarked: res.active } : prev);
    } catch (e: any) { alert(e.message); }
  };

  const handleRate = async (score: number) => {
    try {
      await apiClient.post('/knowledge/rate', { articleId, score });
      setRating(score);
    } catch (e: any) { alert(e.message); }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    setPosting(true);
    try {
      await apiClient.post('/knowledge/comments', { articleId, content: comment });
      setComment('');
      await qc.invalidateQueries({ queryKey: articleKey });
    } catch (e: any) { alert(e.message); }
    finally { setPosting(false); }
  };

  const handleAcknowledge = async () => {
    setAcknowledging(true);
    try {
      await apiClient.post('/knowledge/acknowledge', { articleId });
      qc.setQueryData<Article>(articleKey, prev => prev ? { ...prev, userAcknowledged: true } : prev);
    } catch (e: any) { alert(e.message); }
    finally { setAcknowledging(false); }
  };

  const displayRating = hovRating || rating || article?.userRating || 0;

  if (loading || !article) return <Skeleton rows={6} />;

  return (
    <div className="grid grid-cols-[1fr_260px] gap-6">
      {/* Main content */}
      <div>
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5">
          ← Voltar
        </button>

        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5">
          {article.category && (
            <div className="flex items-center gap-1.5 mb-2">
              {article.category.icon && <span>{article.category.icon}</span>}
              <span className="text-xs text-blue-600 font-medium">{article.category.name}</span>
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{article.title}</h1>
          {article.summary && <p className="text-sm text-gray-600 mb-4">{article.summary}</p>}

          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 mb-4">
            <div className="flex items-center gap-2">
              <Avatar name={article.author.fullName} avatarUrl={article.author.avatarUrl} size="sm" />
              <span>{article.author.fullName}</span>
            </div>
            <span>📅 {fmtDate(article.updatedAt)}</span>
            <span>⏱ {article.readingMinutes} min de leitura</span>
            <span>👁 {article.viewCount} visualizações</span>
            <StatusBadge status={article.status} />
            {article.mandatory && <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded">Obrigatório</span>}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {article.tags.map(t => (
              <span key={t.id} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded">#{t.name}</span>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5">
          <div
            className="prose prose-sm max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }}
          />
        </div>

        {/* Comentários */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-sm font-semibold text-gray-900 mb-4">
            💬 Comentários ({article._count.comments})
          </div>
          <div className="flex gap-3 mb-4">
            <textarea
              value={comment} onChange={e => setComment(e.target.value)}
              rows={2} placeholder="Escreve um comentário…"
              className="flex-1 text-sm border border-gray-200 rounded-xl px-4 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleComment}
              disabled={!comment.trim() || posting}
              className="px-4 py-2 bg-blue-700 text-white text-xs font-medium rounded-xl disabled:opacity-50 flex-shrink-0"
            >
              {posting ? '…' : 'Enviar'}
            </button>
          </div>
          <div className="space-y-4">
            {article.comments?.map(c => (
              <div key={c.id} className="flex gap-3">
                <Avatar name={c.author.fullName} avatarUrl={c.author.avatarUrl} size="sm" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-900">{c.author.fullName}</span>
                    <span className="text-xs text-gray-400">{timeAgo(c.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-700">{c.content}</p>
                  {c.replies?.map(r => (
                    <div key={r.id} className="flex gap-2 mt-2 ml-4">
                      <Avatar name={r.author.fullName} avatarUrl={r.author.avatarUrl} size="sm" />
                      <div>
                        <span className="text-xs font-medium text-gray-800">{r.author.fullName} </span>
                        <span className="text-sm text-gray-700">{r.content}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Acções */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <button
            onClick={handleBookmark}
            className={`w-full py-2.5 text-sm font-medium rounded-lg transition-colors ${
              article.userBookmarked
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {article.userBookmarked ? '🔖 Guardado' : '🔖 Guardar'}
          </button>

          {article.mandatory && !article.userAcknowledged && (
            <button
              onClick={handleAcknowledge}
              disabled={acknowledging}
              className="w-full py-2.5 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {acknowledging ? '…' : '✅ Li e estou ciente'}
            </button>
          )}
          {article.userAcknowledged && (
            <div className="py-2.5 text-center text-xs text-emerald-700 font-medium bg-emerald-50 rounded-lg">
              ✓ Confirmado
            </div>
          )}
        </div>

        {/* Rating */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-400 mb-2">Avaliar artigo</div>
          <div className="flex gap-1 mb-1">
            {[1, 2, 3, 4, 5].map(s => (
              <button
                key={s}
                onClick={() => handleRate(s)}
                onMouseEnter={() => setHovRating(s)}
                onMouseLeave={() => setHovRating(0)}
                className={`text-2xl transition-colors hover:scale-110 ${
                  s <= displayRating ? 'text-amber-400' : 'text-gray-200'
                }`}
              >
                ★
              </button>
            ))}
          </div>
          {article.avgRating && (
            <div className="text-xs text-gray-400">Média: {article.avgRating.toFixed(1)}/5</div>
          )}
        </div>

        {/* Stats */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-xs text-gray-500">
          {[
            ['Visualizações',    article.viewCount],
            ['Comentários',      article._count.comments],
            ['Perguntas',        article._count.questions],
            ['Confirmações',     article._count.acknowledgements],
            ['Publicado',        article.publishedAt ? fmtDate(article.publishedAt) : '—'],
            ['Actualizado',      fmtDate(article.updatedAt)],
          ].map(([l, v]) => (
            <div key={String(l)} className="flex justify-between">
              <span>{l}</span>
              <span className="font-medium text-gray-800">{v}</span>
            </div>
          ))}
        </div>

        {/* Q&A */}
        {article.questions && article.questions.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xs font-medium text-gray-700 mb-3">❓ Perguntas ({article._count.questions})</div>
            {article.questions.slice(0, 3).map(q => (
              <div key={q.id} className="mb-3 pb-3 border-b border-gray-100 last:border-0">
                <p className="text-xs font-medium text-gray-800 mb-1">{q.question}</p>
                {q.answer ? (
                  <p className="text-xs text-gray-600 pl-2 border-l-2 border-emerald-300">{q.answer}</p>
                ) : (
                  <p className="text-xs text-gray-400 italic">Sem resposta</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── View: Admin Dashboard ────────────────────────────────────────────────────

function AdminDashboardView() {
  const { data, isLoading } = useApiQuery<Dashboard>(
    queryKeys.knowledge.adminDashboard(), '/knowledge/admin/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading || !data) return <Skeleton rows={4} />;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total artigos',       value: data.articles.total   },
          { label: 'Publicados',          value: data.articles.published, color: 'text-emerald-600' },
          { label: 'Total visualizações', value: data.views            },
          { label: 'Artigos desactualiz.',value: data.articles.stale,   color: data.articles.stale > 0 ? 'text-amber-600' : undefined },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            <div className={`text-2xl font-semibold font-mono ${color ?? 'text-gray-900'}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Gaps de conhecimento */}
      {data.knowledgeGaps.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="text-sm font-semibold text-amber-800 mb-3">
            🔍 Gaps de Conhecimento — Buscas sem resultado ({data.emptySearches})
          </div>
          <div className="grid grid-cols-2 gap-2">
            {data.knowledgeGaps.map(gap => (
              <div key={gap.query} className="flex justify-between text-xs py-1.5 border-b border-amber-100">
                <span className="text-amber-800 font-medium">&quot;{gap.query}&quot;</span>
                <span className="text-amber-600">{gap.searches}× buscado</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top artigos */}
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
            Mais vistos
          </div>
          {data.topArticles.map((a, idx) => (
            <div key={a.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0">
              <span className="text-lg font-bold font-mono text-gray-200 w-5 text-center">{idx + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-900 truncate">{a.title}</div>
                <div className="text-xs text-gray-400">{a.author.fullName}</div>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">👁 {a.viewCount}</span>
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
            Actualizados recentemente
          </div>
          {data.recentlyUpdated.map(a => (
            <div key={a.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-900 truncate">{a.title}</div>
                <div className="text-xs text-gray-400">{a.author.fullName}</div>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(a.updatedAt)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page principal ───────────────────────────────────────────────────────────

const NAV: Array<{ id: View; label: string }> = [
  { id: 'portal',    label: '🏠 Portal' },
  { id: 'library',   label: '📚 Biblioteca' },
  { id: 'dashboard', label: '📊 Admin' },
];

const TITLES: Record<View, string> = {
  portal:    'Base de Conhecimento',
  library:   'Biblioteca de Artigos',
  article:   'Artigo',
  dashboard: 'Dashboard Admin',
};

export default function KnowledgePage() {
  const [view, setView]         = useState<View>('portal');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleSelectArticle = (id: number) => { setSelectedId(id); setView('article'); };
  const handleBack          = () => { setSelectedId(null); setView('library'); };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{TITLES[view]}</h1>
          <p className="text-sm text-gray-400 mt-0.5">INNOVA — Gestão do Conhecimento</p>
        </div>
        <button
          onClick={() => alert('Abrir editor de artigo')}
          className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800"
        >
          + Novo artigo
        </button>
      </div>

      {/* Tabs */}
      {view !== 'article' && (
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          {NAV.map(n => (
            <button key={n.id} onClick={() => setView(n.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                view === n.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>
      )}

      {view === 'portal'    && <PortalView onSelectArticle={handleSelectArticle} onSearch={() => {}} />}
      {view === 'library'   && <LibraryView onSelectArticle={handleSelectArticle} />}
      {view === 'article' && selectedId !== null && (
        <ArticleDetailView articleId={selectedId} onBack={handleBack} />
      )}
      {view === 'dashboard' && <AdminDashboardView />}
    </div>
  );
}