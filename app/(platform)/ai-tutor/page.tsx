// src/app/(dashboard)/ai-tutor/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { sanitizeHtml } from '@/lib/sanitize';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: number;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
  latencyMs: number | null;
  rating: number | null;
  provider: string | null;
  agentAction: string | null;
}

interface Session {
  id: number;
  courseId: number | null;
  startedAt: string;
  endedAt: string | null;
  course?: { id: number; title: string } | null;
  _count?: { messages: number };
}

interface GeneratedContent {
  type: string;
  content: any;
  raw: string;
  provider: string;
}

interface Recommendation {
  courses:        Array<{ id: number; title: string; category: string; workloadHours: number | null }>;
  competencyGaps: string[];
  aiInsight:      string;
  provider:       string;
}

type View = 'chat' | 'history' | 'generate' | 'recommendations';

const QUICK_ACTIONS = [
  { label: '❓ Explicar de outra forma', value: 'Podes explicar isso de outra forma, com um exemplo prático?' },
  { label: '📝 Resumo',                 value: 'Faz um resumo dos pontos mais importantes até agora' },
  { label: '🎯 Próximo passo',          value: 'O que devo estudar ou fazer a seguir?' },
  { label: '💡 Exemplo real',           value: 'Podes dar um exemplo prático e real desta matéria?' },
  { label: '📊 Quiz rápido',            value: 'Cria um quiz de 5 perguntas sobre o que acabámos de discutir' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function Skeleton({ rows = 3, h = 'h-12' }: { rows?: number; h?: string }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => <div key={i} className={`${h} bg-gray-100 rounded-xl`} />)}
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map(i => (
        <div key={i} className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg, onRate }: { msg: Message; onRate: (id: number, r: number) => void }) {
  const isUser = msg.role === 'USER';
  const [hover, setHover] = useState(false);

  // Formatar markdown simples
  const formatContent = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g,     '<em>$1</em>')
      .replace(/\n/g,            '<br/>');
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold mr-2 flex-shrink-0 mt-1">
          N
        </div>
      )}
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-blue-700 text-white rounded-tr-sm'
              : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
          }`}
        >
          <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(formatContent(msg.content)) }} />
        </div>

        <div className={`flex items-center gap-2 mt-1 px-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-xs text-gray-400">{fmtDate(msg.createdAt)}</span>
          {msg.latencyMs && <span className="text-xs text-gray-300">{msg.latencyMs}ms</span>}

          {/* Rating para mensagens do tutor */}
          {!isUser && hover && !msg.rating && (
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map(r => (
                <button key={r} onClick={() => onRate(msg.id, r)} className="text-gray-300 hover:text-amber-400 text-xs">★</button>
              ))}
            </div>
          )}
          {!isUser && msg.rating && (
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map(r => (
                <span key={r} className={`text-xs ${r <= msg.rating! ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── View: Chat ───────────────────────────────────────────────────────────────

function ChatView() {
  const [session, setSession]     = useState<{ id: number; greeting: string } | null>(null);
  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState('');
  const [thinking, setThinking]   = useState(false);
  const [starting, setStarting]   = useState(false);
  const [personality, setPersonality] = useState('FRIENDLY');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const start = async () => {
    setStarting(true);
    try {
      const res: any = await apiClient.post('/ai-tutor/sessions', { personality });
      setSession({ id: res.session.id, greeting: res.greeting });
      setMessages([{
        id: 0, role: 'ASSISTANT', content: res.greeting,
        createdAt: new Date().toISOString(), latencyMs: null, rating: null,
        provider: res.provider?.provider ?? null, agentAction: null,
      }]);
    } catch (e: any) { alert(e.message); }
    finally { setStarting(false); }
  };

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || !session || thinking) return;
    setInput('');

    const userMsg: Message = {
      id: Date.now(), role: 'USER', content: msg,
      createdAt: new Date().toISOString(), latencyMs: null, rating: null, provider: null, agentAction: null,
    };
    setMessages(prev => [...prev, userMsg]);
    setThinking(true);

    try {
      const res: any = await apiClient.post('/ai-tutor/sessions/message', {
        sessionId: session.id, message: msg,
      });
      setMessages(prev => [...prev, {
        id:          res.message.id,
        role:        'ASSISTANT',
        content:     res.message.content,
        createdAt:   res.message.createdAt,
        latencyMs:   res.latencyMs,
        rating:      null,
        provider:    res.provider,
        agentAction: res.message.agentAction,
      }]);
    } catch (e: any) {
      setMessages(prev => [...prev, {
        id: Date.now(), role: 'ASSISTANT',
        content: `⚠️ Erro: ${e.message}`,
        createdAt: new Date().toISOString(), latencyMs: null, rating: null, provider: null, agentAction: null,
      }]);
    } finally { setThinking(false); }
  };

  const handleRate = async (msgId: number, rating: number) => {
    await apiClient.patch('/ai-tutor/messages/rate', { messageId: msgId, rating }).catch(() => {});
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, rating } : m));
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold mb-5">
          N
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">NOVA — Tutor IA INNOVA</h2>
        <p className="text-sm text-gray-500 mb-6 text-center max-w-sm">
          O teu assistente de aprendizagem inteligente. Disponível 24/7 para dúvidas, quizzes, resumos e muito mais.
        </p>

        <div className="flex gap-2 mb-5">
          {[
            { id: 'FRIENDLY',     label: '😊 Amigável' },
            { id: 'PROFESSIONAL', label: '💼 Profissional' },
            { id: 'COACH',        label: '🎯 Coach' },
            { id: 'GAMIFIED',     label: '🏆 Gamificado' },
          ].map(p => (
            <button key={p.id} onClick={() => setPersonality(p.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                personality === p.id ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <button onClick={start} disabled={starting}
          className="px-8 py-3 bg-blue-700 text-white font-semibold rounded-xl hover:bg-blue-800 disabled:opacity-60 shadow-lg shadow-blue-200">
          {starting ? 'A iniciar…' : '🚀 Iniciar conversa com NOVA'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[75vh] bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-700 to-purple-700 text-white">
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">N</div>
        <div>
          <div className="text-sm font-semibold">NOVA — Tutor IA</div>
          <div className="text-xs text-blue-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
            Online · Sessão #{session.id}
          </div>
        </div>
        <button
          onClick={() => { setSession(null); setMessages([]); }}
          className="ml-auto text-xs text-white/60 hover:text-white">
          Nova sessão
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50">
        {messages.map(m => (
          <MessageBubble key={m.id} msg={m} onRate={handleRate} />
        ))}
        {thinking && (
          <div className="flex justify-start mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold mr-2 flex-shrink-0">N</div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm shadow-sm">
              <TypingDots />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick actions */}
      <div className="px-3 py-2 bg-white border-t border-gray-100 flex gap-1.5 overflow-x-auto">
        {QUICK_ACTIONS.map(a => (
          <button key={a.label} onClick={() => send(a.value)}
            className="flex-shrink-0 px-2.5 py-1 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 whitespace-nowrap">
            {a.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-3 py-3 bg-white border-t border-gray-100 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Escreve a tua pergunta…"
          disabled={thinking}
          className="flex-1 text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || thinking}
          className="px-4 py-2.5 bg-blue-700 text-white rounded-xl hover:bg-blue-800 disabled:opacity-40 font-medium text-sm"
        >
          ➤
        </button>
      </div>
    </div>
  );
}

// ─── View: History ────────────────────────────────────────────────────────────

function HistoryView() {
  const [selected, setSelected] = useState<number | null>(null);
  const [detail, setDetail]     = useState<{ messages: Message[] } | null>(null);

  const { data: sessionsResp, isLoading: loading } = useApiQuery<{ data: Session[] }>(
    queryKeys.aiTutor.sessions(), '/ai-tutor/sessions',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const sessions = sessionsResp?.data ?? [];

  const loadDetail = async (id: number) => {
    setSelected(id);
    const s: any = await apiClient.get(`/ai-tutor/sessions/${id}`);
    setDetail({ messages: s.messages });
  };

  if (loading) return <Skeleton rows={4} />;

  if (selected && detail) {
    return (
      <div>
        <button onClick={() => { setSelected(null); setDetail(null); }}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4">
          ← Voltar
        </button>
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 max-h-[65vh] overflow-y-auto">
          {detail.messages.map(m => (
            <div key={m.id} className={`flex ${m.role === 'USER' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                m.role === 'USER' ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-800'
              }`}>
                {m.content}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map(s => (
        <div key={s.id} onClick={() => loadDetail(s.id)}
          className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:shadow-sm">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">N</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900">
              Sessão #{s.id}{s.course ? ` · ${s.course.title}` : ''}
            </div>
            <div className="text-xs text-gray-400">{fmtDate(s.startedAt)}</div>
          </div>
          <div className="text-xs text-gray-400 flex-shrink-0">{s._count?.messages ?? 0} mensagens</div>
          {s.endedAt ? (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Encerrada</span>
          ) : (
            <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">Activa</span>
          )}
        </div>
      ))}
      {sessions.length === 0 && (
        <div className="py-10 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
          Nenhuma sessão iniciada ainda
        </div>
      )}
    </div>
  );
}

// ─── View: Generate ───────────────────────────────────────────────────────────

function GenerateView() {
  const [type, setType]     = useState<'QUIZ' | 'FLASHCARDS' | 'SUMMARY' | 'STUDY_PLAN'>('QUIZ');
  const [topic, setTopic]   = useState('');
  const [count, setCount]   = useState(5);
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!topic.trim()) { alert('Introduz um tema'); return; }
    setLoading(true);
    try {
      const res = await apiClient.post<GeneratedContent>('/ai-tutor/generate', { type, topic, count });
      setResult(res);
    } catch (e: any) { alert(e.message); }
    finally { setLoading(false); }
  };

  const renderContent = () => {
    if (!result) return null;

    if (type === 'QUIZ' && Array.isArray(result.content)) {
      return (
        <div className="space-y-4">
          {result.content.map((q: any, i: number) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-sm font-semibold text-gray-900 mb-3">{i + 1}. {q.question}</div>
              <div className="space-y-1.5">
                {(q.options ?? []).map((opt: string, j: number) => (
                  <div key={j} className={`text-sm px-3 py-2 rounded-lg ${
                    opt.startsWith(q.correct) ? 'bg-emerald-50 text-emerald-700 font-medium' : 'bg-gray-50 text-gray-700'
                  }`}>
                    {opt}
                  </div>
                ))}
              </div>
              {q.explanation && (
                <div className="mt-3 text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">💡 {q.explanation}</div>
              )}
            </div>
          ))}
        </div>
      );
    }

    if (type === 'FLASHCARDS' && Array.isArray(result.content)) {
      return (
        <div className="grid grid-cols-2 gap-3">
          {result.content.map((c: any, i: number) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs text-gray-400 mb-1">FRENTE</div>
              <div className="text-sm font-semibold text-gray-900 mb-3">{c.front}</div>
              <div className="h-px bg-gray-100 mb-3" />
              <div className="text-xs text-gray-400 mb-1">VERSO</div>
              <div className="text-sm text-gray-700">{c.back}</div>
            </div>
          ))}
        </div>
      );
    }

    // SUMMARY ou raw text
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
        {typeof result.content === 'string' ? result.content : result.raw}
      </div>
    );
  };

  return (
    <div>
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <div className="text-sm font-semibold text-gray-900 mb-4">Geração de conteúdo com IA</div>

        {/* Tipo */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {([
            { id: 'QUIZ',       label: '📊 Quiz' },
            { id: 'FLASHCARDS', label: '🃏 Flashcards' },
            { id: 'SUMMARY',    label: '📝 Resumo' },
            { id: 'STUDY_PLAN', label: '📅 Plano de estudo' },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setType(t.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                type === t.id ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tema */}
        <input
          type="text" placeholder="Tema (ex: Gestão de riscos de crédito, Liderança situacional…)"
          value={topic} onChange={e => setTopic(e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
        />

        {type !== 'SUMMARY' && type !== 'STUDY_PLAN' && (
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs text-gray-500">Quantidade:</span>
            {[3, 5, 8, 10].map(n => (
              <button key={n} onClick={() => setCount(n)}
                className={`w-8 h-8 text-xs rounded-lg ${count === n ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {n}
              </button>
            ))}
          </div>
        )}

        <button onClick={generate} disabled={loading || !topic.trim()}
          className="w-full py-2.5 bg-blue-700 text-white text-sm font-semibold rounded-xl hover:bg-blue-800 disabled:opacity-50">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              A gerar com IA…
            </span>
          ) : `⚡ Gerar ${type === 'QUIZ' ? 'Quiz' : type === 'FLASHCARDS' ? 'Flashcards' : type === 'SUMMARY' ? 'Resumo' : 'Plano de estudo'}`}
        </button>
      </div>

      {result && (
        <div>
          <div className="text-xs text-gray-400 mb-3">Gerado por {result.provider}</div>
          {renderContent()}
        </div>
      )}
    </div>
  );
}

// ─── View: Recommendations ────────────────────────────────────────────────────

function RecommendationsView() {
  const { data, isLoading: loading } = useApiQuery<Recommendation>(
    queryKeys.aiTutor.recommendations(), '/ai-tutor/recommendations',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (loading) return <Skeleton rows={4} />;
  if (!data)   return null;

  return (
    <div className="space-y-5">
      {/* AI Insight */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">N</div>
          <span className="text-xs font-semibold text-blue-700">Insight do NOVA</span>
          <span className="text-xs text-gray-400 ml-auto">{data.provider}</span>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{data.aiInsight}</p>
      </div>

      {/* Gaps */}
      {data.competencyGaps.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">⚡ Gaps de competência identificados</div>
          <div className="flex flex-wrap gap-2">
            {data.competencyGaps.map(g => (
              <span key={g} className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg border border-amber-200">{g}</span>
            ))}
          </div>
        </div>
      )}

      {/* Cursos */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
          Cursos recomendados
        </div>
        {data.courses.map(c => (
          <div key={c.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 text-lg flex-shrink-0">
              🎓
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{c.title}</div>
              <div className="text-xs text-gray-400">{c.category}{c.workloadHours ? ` · ${c.workloadHours}h` : ''}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page principal ───────────────────────────────────────────────────────────

const NAV: Array<{ id: View; label: string }> = [
  { id: 'chat',            label: '💬 Chat' },
  { id: 'generate',        label: '⚡ Gerar conteúdo' },
  { id: 'recommendations', label: '🎯 Recomendações' },
  { id: 'history',         label: '🕐 Histórico' },
];

const TITLES: Record<View, string> = {
  chat:            'NOVA — Tutor IA',
  generate:        'Gerar conteúdo com IA',
  recommendations: 'Recomendações personalizadas',
  history:         'Histórico de sessões',
};

export default function AiTutorPage() {
  const [view, setView] = useState<View>('chat');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{TITLES[view]}</h1>
          <p className="text-sm text-gray-400 mt-0.5">INNOVA — Assistente de Aprendizagem Inteligente</p>
        </div>
      </div>

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

      {view === 'chat'            && <ChatView />}
      {view === 'generate'        && <GenerateView />}
      {view === 'recommendations' && <RecommendationsView />}
      {view === 'history'         && <HistoryView />}
    </div>
  );
}