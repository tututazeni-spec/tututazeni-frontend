// components/ai-tutor/ChatView.tsx
// Vista "Chat": conversa em tempo real com o tutor IA (Ísis),
// incluindo início de sessão, envio de mensagens, rating e acções
// rápidas. Extraído de app/(platform)/ai-tutor/page.tsx.

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Send, Volume2, VolumeX } from 'lucide-react';
import Image from 'next/image';
import { useApiMutation } from '@/hooks/useApiQuery';
import { toSpeakable, unlockSpeech, useSpeech } from '@/hooks/useSpeech';
import {
  fetchIsisSpeech,
  pcmDurationMs,
  splitPcm,
} from '@/lib/isisAvatarSpeech';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { Button, IconButton } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/providers/ToastProvider';
import { QUICK_ACTIONS } from './constants';
import { MessageBubble } from './MessageBubble';
import {
  IsisSimliAvatar,
  type AvatarStatus,
  type IsisSimliAvatarHandle,
} from './IsisSimliAvatar';
import { MicButton } from './MicButton';
import { SpeakingText } from './SpeakingText';
import type {
  Message,
  SendMessageResponse,
  StartSessionResponse,
} from './types';

// Silêncio máximo (ms) antes de terminar o modo conversa.
const CONVERSATION_IDLE_MS = 10_000;

// Interromper o Ísis por voz exige que o microfone fique aberto enquanto ela
// fala. Com colunas ele ouve a voz dela e, se o filtro de eco falha, corta a
// fala e trata-a como nova pergunta (loop). Por defeito o microfone fica
// fechado enquanto ela fala; para a calar usa-se "Parar voz" ou o microfone.
const ALLOW_VOICE_INTERRUPT = false;

// Palavras que interrompem sempre (mesmo que existam no texto falado, ex.: "para").
const STOP_WORD = /^(pára|para|chega|espera|stop|cala)/i;

const words = (t: string) =>
  t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

// O microfone apanha a voz do Ísis nas colunas: se quase todas as palavras
// ouvidas estão no texto que ela está a dizer, é eco e não o utilizador.
function isEcho(heard: string, spoken: string): boolean {
  const h = words(heard);
  if (h.length === 0) return true;
  if (h.length <= 3 && STOP_WORD.test(heard.trim())) return false;
  const pool = new Set(words(spoken));
  return h.filter((w) => pool.has(w)).length / h.length >= 0.6;
}

const PERSONALITIES = [
  { id: 'FRIENDLY', label: 'Amigável' },
  { id: 'PROFESSIONAL', label: 'Profissional' },
  { id: 'COACH', label: 'Coach' },
  { id: 'GAMIFIED', label: 'Gamificado' },
] as const;

// Avatar da Ísis — substitui o antigo círculo com a letra "N".
// A imagem fica em: public/images/isis-avatar.png
function IsisAvatar({
  size = 'md',
  onClick,
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}) {
  const dimensions = {
    sm: 64,
    md: 88,
    lg: 192,
  }[size];

  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      onClick={onClick}
      className={`rounded-full overflow-hidden border-2 border-[#D4A017] flex-shrink-0 ${
        onClick
          ? 'hover:scale-105 transition-transform duration-300 cursor-pointer'
          : ''
      } ${className}`}
      style={{ width: dimensions, height: dimensions }}
    >
      <Image
        src="/images/isis-avatar.png"
        alt="Ísis - Tutor IA"
        width={dimensions}
        height={dimensions}
        className="object-cover w-full h-full"
      />
    </Wrapper>
  );
}

export function ChatView() {
  const notify = useToast();
  const [session, setSession] = useState<{
    id: number;
    greeting: string;
  } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [personality, setPersonality] = useState('FRIENDLY');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const browserVoice = useSpeech();
  const avatarRef = useRef<IsisSimliAvatarHandle>(null);
  const avatarTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [avatarStatus, setAvatarStatus] = useState<AvatarStatus>('idle');
  // A Ísis está a falar pelo avatar (da geração da voz até acabar o áudio).
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarText, setAvatarText] = useState('');
  const avatarConnected = avatarStatus === 'connected';

  const stopBrowserVoice = browserVoice.stop;
  const stop = useCallback(() => {
    if (avatarTimer.current) clearTimeout(avatarTimer.current);
    avatarTimer.current = null;
    avatarRef.current?.interrupt();
    setAvatarBusy(false);
    stopBrowserVoice();
  }, [stopBrowserVoice]);

  const speaking = browserVoice.speaking || avatarBusy;
  const spokenText = avatarBusy ? avatarText : browserVoice.spokenText;
  // Pelo avatar o texto aparece inteiro; só a voz do browser o vai acendendo.
  const charIndex = avatarBusy ? avatarText.length : browserVoice.charIndex;

  // Com o avatar ligado a voz vem da ElevenLabs, enviada ao Simli; sem
  // avatar (ou se a voz falhar) cai na voz do browser — plano B.
  const speak = useCallback(
    async (markdown: string) => {
      const text = toSpeakable(markdown);
      if (!text) return;
      if (!avatarConnected) {
        browserVoice.speak(markdown);
        return;
      }
      setAvatarText(text);
      setAvatarBusy(true);
      try {
        const pcm = await fetchIsisSpeech(text);
        for (const chunk of splitPcm(pcm)) avatarRef.current?.sendAudio(chunk);
        avatarTimer.current = setTimeout(
          () => setAvatarBusy(false),
          pcmDurationMs(pcm) + 1000,
        );
      } catch (e) {
        reportError(e, { source: 'ChatView.speak' });
        setAvatarBusy(false);
        browserVoice.speak(markdown);
      }
    },
    [avatarConnected, browserVoice],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const startSession = useApiMutation(
    (p: string) =>
      apiClient.post<StartSessionResponse>('/ai-tutor/sessions', {
        personality: p,
      }),
    {
      onSuccess: (res) => {
        setSession({ id: res.session.id, greeting: res.greeting });
        setMessages([
          {
            id: 0,
            role: 'ASSISTANT',
            content: res.greeting,
            createdAt: new Date().toISOString(),
            latencyMs: null,
            rating: null,
            provider: res.provider?.provider ?? null,
            agentAction: null,
          },
        ]);
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );
  const starting = startSession.isPending;
  const start = () => startSession.mutate(personality);

  // viaVoice: a resposta só é falada quando a pergunta foi feita por voz,
  // para quem escreve não ser surpreendido com som.
  const send = async (text?: string, viaVoice = false) => {
    const msg = (text ?? input).trim();
    if (!msg || !session || thinking) return;
    setInput('');

    const userMsg: Message = {
      id: Date.now(),
      role: 'USER',
      content: msg,
      createdAt: new Date().toISOString(),
      latencyMs: null,
      rating: null,
      provider: null,
      agentAction: null,
    };
    setMessages((prev) => [...prev, userMsg]);
    setThinking(true);

    try {
      const res = await apiClient.post<SendMessageResponse>(
        '/ai-tutor/sessions/message',
        {
          sessionId: session.id,
          message: msg,
        },
      );
      setMessages((prev) => [
        ...prev,
        {
          id: res.message.id,
          role: 'ASSISTANT',
          content: res.message.content,
          createdAt: res.message.createdAt,
          latencyMs: res.latencyMs,
          rating: null,
          provider: res.provider,
          agentAction: res.message.agentAction,
          sourceLabels: res.sources?.map((s) => s.label),
        },
      ]);
      if (voiceEnabled && (viaVoice || avatarConnected))
        void speak(res.message.content);
    } catch (e) {
      reportError(e, { source: 'ChatView.sendMessage' });
      const errMsg = e instanceof Error ? e.message : String(e);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: 'ASSISTANT',
          content: `Erro: ${errMsg}`,
          createdAt: new Date().toISOString(),
          latencyMs: null,
          rating: null,
          provider: null,
          agentAction: null,
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const voice = useVoiceInput((text) => {
    if (!text) return;
    // Enquanto o Ísis fala, o que é só eco da voz dela é ignorado; o resto é
    // o utilizador a interromper: calar a voz e tratar como nova pergunta.
    if (speaking) {
      if (!ALLOW_VOICE_INTERRUPT || isEcho(text, spokenText)) return;
      stop();
    }
    // Só "pára"/"chega": calar sem enviar nada ao tutor.
    if (words(text).length <= 2 && STOP_WORD.test(text.trim())) return;
    void send(text, true);
  });

  // Modo conversa: um clique mantém a conversa activa. O reconhecimento do
  // browser pára sozinho após cada frase, por isso reabre-se enquanto a
  // conversa durar. Pausa quando o Ísis pensa ou fala (para não ouvir a
  // própria voz) e termina após 10 s sem o utilizador falar; a contagem
  // recomeça sempre que o Ísis acaba de falar.
  const [conversation, setConversation] = useState(false);
  const { start: startListening, stop: stopListening } = voice;
  const paused = thinking || speaking;

  const endConversation = () => {
    setConversation(false);
    stopListening();
    stop();
  };

  // Ao carregar no microfone o tutor cala-se primeiro; o unlock cobre o
  // Safari/iPhone, que só fala a partir de um toque.
  const onMicClick = () => {
    if (conversation) {
      endConversation();
      return;
    }
    stop();
    unlockSpeech();
    setConversation(true);
  };

  // Reabre o microfone quando a conversa está activa e ninguém está a falar.
  useEffect(() => {
    if (!conversation || paused || voice.listening || voice.error) return;
    const t = setTimeout(startListening, 250);
    return () => clearTimeout(t);
  }, [conversation, paused, voice.listening, voice.error, startListening]);

  // Pausa o microfone enquanto o Ísis pensa ou fala.
  useEffect(() => {
    if (thinking || (speaking && !ALLOW_VOICE_INTERRUPT)) stopListening();
  }, [thinking, speaking, stopListening]);

  // 10 s de silêncio terminam a conversa; ouvir voz (interim) reinicia a contagem.
  useEffect(() => {
    if (!conversation || paused) return;
    const t = setTimeout(() => {
      setConversation(false);
      stopListening();
    }, CONVERSATION_IDLE_MS);
    return () => clearTimeout(t);
  }, [conversation, paused, voice.interim, stopListening]);

  // Interromper por voz: se, enquanto fala, o Ísis ouvir algo que não é eco
  // da própria voz, cala-se logo (a pergunta segue quando a frase terminar).
  useEffect(() => {
    if (
      ALLOW_VOICE_INTERRUPT &&
      conversation &&
      speaking &&
      voice.interim &&
      !isEcho(voice.interim, spokenText)
    ) {
      stop();
    }
  }, [conversation, speaking, voice.interim, spokenText, stop]);

  // Sem permissão (ou erro do microfone) não vale a pena continuar.
  useEffect(() => {
    if (voice.error) setConversation(false);
  }, [voice.error]);

  const handleRate = async (msgId: number, rating: number) => {
    try {
      await apiClient.patch('/ai-tutor/messages/rate', {
        messageId: msgId,
        rating,
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, rating } : m)),
      );
    } catch (e) {
      reportError(e, { source: 'ChatView.handleRate' });
      notify({
        title: 'Não foi possível avaliar a mensagem',
        intent: 'danger',
      });
    }
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <IsisAvatar size="lg" onClick={start} className="mb-5" />
        <p className="font-body text-sm text-ink-faint mb-6 text-center max-w-sm">
          O teu assistente de aprendizagem inteligente. Disponível 24/7 para
          dúvidas, questionários, resumos e muito mais.
        </p>

        <div className="flex gap-2 mb-5">
          {PERSONALITIES.map((p) => (
            <Button
              key={p.id}
              size="sm"
              intent={personality === p.id ? 'primary' : 'secondary'}
              onClick={() => setPersonality(p.id)}
            >
              {p.label}
            </Button>
          ))}
        </div>

        <Button onClick={start} loading={starting}>
          {starting ? 'A iniciar…' : 'Iniciar conversa com Ísis'}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-4 h-[75vh]">
      <div className="flex flex-col flex-1 min-w-0 bg-surface border border-border rounded-panel overflow-hidden shadow-resting">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-primary text-canvas">
          <div>
            <div className="font-body text-sm font-semibold">
              Ísis — Tutor IA
            </div>
            <div className="font-body text-xs text-canvas/80 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-success rounded-full" />
              Online · Sessão #{session.id}
            </div>
          </div>
          <button
            onClick={() => {
              if (voiceEnabled) stop();
              setVoiceEnabled((v) => !v);
            }}
            className="ml-auto text-canvas/80 hover:text-canvas"
            title={
              voiceEnabled
                ? 'Desligar resposta por voz'
                : 'Ligar resposta por voz'
            }
          >
            {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button
            onClick={() => {
              endConversation();
              setSession(null);
              setMessages([]);
            }}
            className="font-body text-xs text-canvas/70 hover:text-canvas"
          >
            Nova sessão
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 bg-surface-sunken">
          {messages.map((m) => (
            <MessageBubble key={m.id} msg={m} onRate={handleRate} />
          ))}
          {thinking && (
            <div className="flex justify-start mb-3">
              <IsisAvatar size="sm" className="mr-2" />
              <div className="bg-surface border border-border rounded-card shadow-resting">
                <div className="flex items-center gap-1 px-4 py-3">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-accent rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          {speaking && (
            <div className="mb-3 rounded-card border border-border bg-surface p-3">
              <SpeakingText text={spokenText} charIndex={charIndex} />
              <button
                onClick={stop}
                className="mt-2 font-body text-xs text-[#D4A017]"
              >
                Parar voz
              </button>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick actions */}
        <div className="px-3 py-2 bg-surface border-t border-border flex gap-1.5 overflow-x-auto">
          {QUICK_ACTIONS.map((a) => (
            <Button
              key={a.label}
              size="sm"
              intent="secondary"
              onClick={() => send(a.value)}
              className="flex-shrink-0 whitespace-nowrap"
            >
              {a.label}
            </Button>
          ))}
        </div>

        {/* Input */}
        {(conversation || voice.error) && (
          <div className="px-3 pt-2 bg-surface font-body text-sm">
            {voice.error ? (
              <p className="text-red-600">{voice.error}</p>
            ) : (
              <p className="text-gray-500">
                {paused
                  ? 'Conversa activa — o Ísis está a responder…'
                  : voice.interim ||
                    'A ouvir… (diz algo; termina após 10 s de silêncio)'}
              </p>
            )}
          </div>
        )}
        <div className="px-3 py-3 bg-surface border-t border-border flex gap-2">
          {voice.supported && (
            <MicButton listening={conversation} onClick={onMicClick} />
          )}
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Escreve a tua pergunta…"
            disabled={thinking}
            className="flex-1"
          />
          <IconButton
            icon={Send}
            label="Enviar mensagem"
            onClick={() => send()}
            disabled={!input.trim() || thinking}
          />
        </div>
      </div>

      {/* Retrato da Ísis — fica ao lado do chat */}
      <aside
        className={`hidden lg:block lg:w-[22rem] xl:w-[36rem] 2xl:w-[40rem] flex-shrink-0 self-start rounded-panel overflow-hidden border-2 shadow-resting transition-colors ${
          speaking ? 'border-[#D4A017]' : 'border-border'
        }`}
      >
        <IsisSimliAvatar
          ref={avatarRef}
          onStatusChange={setAvatarStatus}
          className="w-full aspect-square"
        />
      </aside>
    </div>
  );
}
