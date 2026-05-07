
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "../../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LiveClass {
  id: number;
  topic: string;
  scheduledAt: string;
  duration: number;
  zoomMeetingId?: string;
  recordingUrl?: string;
  course?: { id: number; title: string };
  _count?: { attendances: number };
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: new (domain: string, options: JitsiOptions) => JitsiAPI;
  }
}

interface JitsiOptions {
  roomName: string;
  parentNode: HTMLElement;
  width?: string | number;
  height?: string | number;
  configOverwrite?: Record<string, unknown>;
  interfaceConfigOverwrite?: Record<string, unknown>;
  userInfo?: { displayName?: string; email?: string };
  lang?: string;
}

interface JitsiAPI {
  addEventListeners: (events: Record<string, (...args: any[]) => void>) => void;
  executeCommand: (command: string, ...args: unknown[]) => void;
  getNumberOfParticipants: () => number;
  dispose: () => void;
}

// ─── Recording state ──────────────────────────────────────────────────────────

type RecordingState = "idle" | "recording" | "stopped";

interface RecordingData {
  blob: Blob;
  url: string;
  duration: number; // seconds
  size: number;     // bytes
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function fmtDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ─── Recording Hook ───────────────────────────────────────────────────────────

function useRecording() {
  const [state, setState]           = useState<RecordingState>("idle");
  const [data, setData]             = useState<RecordingData | null>(null);
  const [elapsed, setElapsed]       = useState(0);
  const [error, setError]           = useState("");
  const mediaRecorderRef            = useRef<MediaRecorder | null>(null);
  const chunksRef                   = useRef<Blob[]>([]);
  const streamRef                   = useRef<MediaStream | null>(null);
  const timerRef                    = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef                = useRef<number>(0);

  const start = useCallback(async () => {
    setError("");
    try {
      // Ask user to share screen (includes audio if available)
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: true,
      });
      streamRef.current = stream;

      // Choose best supported format
      const mimeType = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm",
        "video/mp4",
      ].find(t => MediaRecorder.isTypeSupported(t)) ?? "video/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url  = URL.createObjectURL(blob);
        const dur  = Math.round((Date.now() - startTimeRef.current) / 1000);
        setData({ blob, url, duration: dur, size: blob.size });
        setState("stopped");
        // Cleanup stream tracks
        streamRef.current?.getTracks().forEach(t => t.stop());
      };

      // If user stops share via browser UI, stop recording cleanly
      stream.getVideoTracks()[0].onended = () => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
        }
        if (timerRef.current) clearInterval(timerRef.current);
      };

      recorder.start(1000); // chunk every second
      startTimeRef.current = Date.now();
      setState("recording");

      // Elapsed timer
      timerRef.current = setInterval(() => {
        setElapsed(Math.round((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

    } catch (e: any) {
      if (e.name === "NotAllowedError") {
        setError("Permissão de partilha de ecrã negada.");
      } else {
        setError(e.message ?? "Erro ao iniciar gravação.");
      }
    }
  }, []);

  const stop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const reset = useCallback(() => {
    if (data?.url) URL.revokeObjectURL(data.url);
    setData(null);
    setElapsed(0);
    setError("");
    setState("idle");
    chunksRef.current = [];
  }, [data]);

  const download = useCallback((filename: string) => {
    if (!data) return;
    const a = document.createElement("a");
    a.href = data.url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [data]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (data?.url) URL.revokeObjectURL(data.url);
    };
  }, []);

  return { state, data, elapsed, error, start, stop, reset, download };
}

// ─── Jitsi Room Component ─────────────────────────────────────────────────────

function JitsiRoom({ liveClass, onJoined, onLeft }: {
  liveClass: LiveClass;
  onJoined: () => void;
  onLeft: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef       = useRef<JitsiAPI | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [participants, setParticipants] = useState(0);

  const roomName = `innova-live-${liveClass.id}-${liveClass.topic
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .slice(0, 30)}`;

  useEffect(() => {
    // Load Jitsi External API script dynamically
    const existing = document.getElementById("jitsi-api-script");
    if (existing) {
      initJitsi();
      return;
    }
    const script = document.createElement("script");
    script.id  = "jitsi-api-script";
    script.src = "https://meet.jit.si/external_api.js";
    script.async = true;
    script.onload = initJitsi;
    script.onerror = () => console.error("Falha ao carregar Jitsi External API");
    document.head.appendChild(script);

    return () => {
      apiRef.current?.dispose();
    };
  }, []);

  function initJitsi() {
    if (!containerRef.current || !window.JitsiMeetExternalAPI) return;

    const jitsi = new window.JitsiMeetExternalAPI("meet.jit.si", {
      roomName,
      parentNode: containerRef.current,
      width: "100%",
      height: "100%",
      lang: "pt",
      configOverwrite: {
        startWithAudioMuted:        false,
        startWithVideoMuted:        false,
        disableModeratorIndicator:  false,
        enableEmailInStats:         false,
        enableClosePage:            false,
        prejoinPageEnabled:         false, // Skip pre-join screen
        disableDeepLinking:         true,
        disableLocalVideoFlip:      false,
        defaultLanguage:            "pt",
        subject:                    liveClass.topic,
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK:         false,
        SHOW_WATERMARK_FOR_GUESTS:    false,
        SHOW_BRAND_WATERMARK:         false,
        BRAND_WATERMARK_LINK:         "",
        DEFAULT_REMOTE_DISPLAY_NAME:  "Participante",
        TOOLBAR_BUTTONS: [
          "microphone", "camera", "closedcaptions", "desktop",
          "fullscreen", "fodeviceselection", "hangup", "chat",
          "recording", "livestreaming", "etherpad",
          "sharedvideo", "settings", "raisehand",
          "videoquality", "filmstrip", "participants-pane",
          "feedback", "stats", "shortcuts", "tileview",
          "select-background", "download", "help",
          "mute-everyone", "security",
        ],
        SETTINGS_SECTIONS:    ["devices", "language", "moderator"],
        VIDEO_QUALITY_LABEL_DISABLED: false,
        HIDE_INVITE_MORE_HEADER:      false,
        MOBILE_APP_PROMO:             false,
        APP_NAME:                     "Innova Academy",
        NATIVE_APP_NAME:              "Innova Academy",
      },
    });

    apiRef.current = jitsi;

    jitsi.addEventListeners({
      videoConferenceJoined: () => {
        setLoaded(true);
        setParticipants(jitsi.getNumberOfParticipants());
        onJoined();
      },
      videoConferenceLeft: () => { onLeft(); },
      participantJoined: () => { setParticipants(jitsi.getNumberOfParticipants()); },
      participantLeft:   () => { setParticipants(jitsi.getNumberOfParticipants()); },
    });
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#0f172a", borderRadius: 14, overflow: "hidden" }}>
      {!loaded && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, zIndex: 10, background: "#0f172a" }}>
          <div style={{ width: 36, height: 36, border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "#dc2626", borderRadius: "50%", animation: "lc-spin 0.8s linear infinite" }} />
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, margin: 0 }}>A conectar à sala Jitsi...</p>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, margin: 0 }}>Sala: {roomName}</p>
        </div>
      )}
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      {loaded && participants > 0 && (
        <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.6)", borderRadius: 8, padding: "4px 10px", fontSize: 12, color: "#fff", display: "flex", alignItems: "center", gap: 5, pointerEvents: "none", zIndex: 20 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
          {participants} participante{participants !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}

// ─── Recording Panel ──────────────────────────────────────────────────────────

function RecordingPanel({ liveClass, onUrlSaved }: {
  liveClass: LiveClass;
  onUrlSaved: (url: string) => void;
}) {
  const rec = useRecording();
  const [savingUrl, setSavingUrl]   = useState(false);
  const [customUrl, setCustomUrl]   = useState(liveClass.recordingUrl ?? "");
  const [urlSaved, setUrlSaved]     = useState(false);
  const [showHelp, setShowHelp]     = useState(false);

  const filename = `innova-aula-${liveClass.id}-${Date.now()}.webm`;

  async function saveUrl(url: string) {
    if (!url) return;
    setSavingUrl(true);
    try {
      await api.put(`/live-classes/${liveClass.id}`, {
        courseId:     liveClass.course?.id,
        topic:        liveClass.topic,
        scheduledAt:  liveClass.scheduledAt,
        duration:     liveClass.duration,
        recordingUrl: url,
      });
      setUrlSaved(true);
      onUrlSaved(url);
    } catch (e: any) { alert(e.message); }
    finally { setSavingUrl(false); }
  }

  return (
    <div style={{ background: "#0f172a", borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", gap: 16, color: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>🎬 Gravação</h3>
        <button onClick={() => setShowHelp(h => !h)} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 6, padding: "3px 8px", cursor: "pointer", color: "#94a3b8", fontSize: 11 }}>
          {showHelp ? "Ocultar ajuda" : "Como funciona?"}
        </button>
      </div>

      {showHelp && (
        <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: 14, fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
          <p style={{ margin: "0 0 6px", color: "#f1f5f9", fontWeight: 600 }}>Passos para gravar:</p>
          <ol style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 4 }}>
            <li>Clica em <strong style={{ color: "#dc2626" }}>Iniciar Gravação</strong></li>
            <li>Selecciona a janela/ecrã com a aula Jitsi</li>
            <li>Quando terminar, clica <strong style={{ color: "#dc2626" }}>Parar</strong></li>
            <li>Faz download do vídeo (.webm)</li>
            <li>Carrega o ficheiro para Google Drive, YouTube (não listado) ou outro serviço</li>
            <li>Cola o link público abaixo e clica <strong>Guardar URL</strong></li>
          </ol>
        </div>
      )}

      {/* Recording controls */}
      <div>
        {rec.error && (
          <div style={{ background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#fca5a5", marginBottom: 10 }}>
            ⚠️ {rec.error}
          </div>
        )}

        {rec.state === "idle" && (
          <button onClick={rec.start} style={{ width: "100%", padding: "11px", borderRadius: 10, background: "#dc2626", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#fff", display: "inline-block" }} />
            Iniciar Gravação do Ecrã
          </button>
        )}

        {rec.state === "recording" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 10 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#dc2626", display: "inline-block", animation: "lc-ping 1.2s ease-in-out infinite" }} />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#fca5a5" }}>A gravar...</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: "#fff", fontFamily: "monospace" }}>{fmtDuration(rec.elapsed)}</span>
            </div>
            <button onClick={rec.stop} style={{ width: "100%", padding: "10px", borderRadius: 10, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span style={{ width: 12, height: 12, background: "#fff", display: "inline-block", borderRadius: 2 }} />
              Parar Gravação
            </button>
          </div>
        )}

        {rec.state === "stopped" && rec.data && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Preview */}
            <video
              src={rec.data.url}
              controls
              style={{ width: "100%", borderRadius: 10, background: "#000", maxHeight: 160 }}
            />

            <div style={{ display: "flex", gap: 6, fontSize: 11, color: "#64748b" }}>
              <span>⏱️ {fmtDuration(rec.data.duration)}</span>
              <span>·</span>
              <span>💾 {fmtBytes(rec.data.size)}</span>
              <span>·</span>
              <span>WebM</span>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => rec.download(filename)}
                style={{ flex: 1, padding: "9px", borderRadius: 9, background: "#16a34a", border: "none", color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                📥 Download (.webm)
              </button>
              <button
                onClick={rec.reset}
                style={{ padding: "9px 14px", borderRadius: 9, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#94a3b8", fontSize: 12, cursor: "pointer" }}>
                🔄 Nova
              </button>
            </div>

            <p style={{ margin: 0, fontSize: 11, color: "#64748b", lineHeight: 1.5 }}>
              Após fazer download, carrega o vídeo para Google Drive, YouTube ou outro serviço e cola o link abaixo.
            </p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />

      {/* Save URL */}
      <div>
        <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.7 }}>
          URL da Gravação
        </p>

        {liveClass.recordingUrl && !urlSaved && (
          <div style={{ padding: "8px 12px", background: "rgba(22,163,74,0.12)", border: "1px solid rgba(22,163,74,0.25)", borderRadius: 8, fontSize: 12, color: "#4ade80", marginBottom: 8 }}>
            ✓ Gravação anterior disponível
          </div>
        )}

        {urlSaved && (
          <div style={{ padding: "8px 12px", background: "rgba(22,163,74,0.12)", border: "1px solid rgba(22,163,74,0.25)", borderRadius: 8, fontSize: 12, color: "#4ade80", marginBottom: 8 }}>
            ✓ URL guardada com sucesso!
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={customUrl}
            onChange={e => { setCustomUrl(e.target.value); setUrlSaved(false); }}
            placeholder="https://drive.google.com/... ou https://youtu.be/..."
            style={{ flex: 1, padding: "8px 10px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#f1f5f9", fontSize: 12, outline: "none" }}
          />
          <button
            onClick={() => saveUrl(customUrl)}
            disabled={!customUrl || savingUrl}
            style={{ padding: "8px 14px", borderRadius: 9, background: "#7c3aed", border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", opacity: !customUrl ? 0.5 : 1 }}>
            {savingUrl ? "..." : "Guardar"}
          </button>
        </div>

        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
          <p style={{ margin: 0, fontSize: 10.5, color: "#475569", fontWeight: 600 }}>Serviços gratuitos sugeridos:</p>
          {[
            { name: "Google Drive", url: "https://drive.google.com", icon: "📁" },
            { name: "YouTube (não listado)", url: "https://studio.youtube.com", icon: "▶" },
            { name: "Vimeo (free)", url: "https://vimeo.com", icon: "🎬" },
          ].map(s => (
            <a key={s.name} href={s.url} target="_blank" rel="noreferrer"
              style={{ fontSize: 11, color: "#64748b", textDecoration: "none", display: "flex", alignItems: "center", gap: 5 }}>
              {s.icon} {s.name} ↗
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LiveRoomPage() {
  const params   = useParams<{ id: string }>();
  const router   = useRouter();
  const classId  = parseInt(params.id);

  const [liveClass, setLiveClass]   = useState<LiveClass | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [joined, setJoined]         = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [showSidebar, setShowSidebar] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    api.get<LiveClass>(`/live-classes/${classId}`)
      .then(setLiveClass)
      .catch(e => setError(e.message ?? "Aula não encontrada"))
      .finally(() => setLoading(false));
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [classId]);

  async function handleJoined() {
    setJoined(true);
    try { await api.post(`/live-classes/${classId}/join`, {}); } catch { /* silent */ }
    // Session timer
    const start = Date.now();
    timerRef.current = setInterval(() => {
      setSessionTime(Math.round((Date.now() - start) / 1000));
    }, 1000);
  }

  async function handleLeft() {
    if (timerRef.current) clearInterval(timerRef.current);
    try { await api.post(`/live-classes/${classId}/leave`, {}); } catch { /* silent */ }
    router.push("/live");
  }

  // Loading
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", flexDirection: "column", gap: 16, background: "#0f172a" }}>
        <style>{`@keyframes lc-spin{to{transform:rotate(360deg)}}@keyframes lc-ping{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.5)}}`}</style>
        <div style={{ width: 36, height: 36, border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "#dc2626", borderRadius: "50%", animation: "lc-spin 0.8s linear infinite" }} />
        <p style={{ color: "rgba(255,255,255,0.5)", margin: 0, fontSize: 14 }}>A preparar a sala...</p>
      </div>
    );
  }

  if (error || !liveClass) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0f172a", flexDirection: "column", gap: 12 }}>
        <p style={{ color: "#fca5a5", fontSize: 16 }}>❌ {error || "Aula não encontrada"}</p>
        <button onClick={() => router.push("/live")} style={{ padding: "9px 20px", background: "#dc2626", border: "none", borderRadius: 9, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
          ← Voltar
        </button>
      </div>
    );
  }

  const scheduledEnd = new Date(liveClass.scheduledAt).getTime() + liveClass.duration * 60_000;
  const isRunning    = Date.now() <= scheduledEnd;

  return (
    <>
      <style>{`
        @keyframes lc-spin { to { transform: rotate(360deg); } }
        @keyframes lc-ping { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.5)} }
        body { margin:0; padding:0; background:#0f172a; }
      `}</style>

      <div style={{ display: "flex", height: "100vh", background: "#0f172a", overflow: "hidden" }}>

        {/* ── Main area ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Top bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 18px", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
            {/* Back */}
            <button onClick={() => router.push("/live")} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, padding: "6px 12px", color: "#94a3b8", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              ← Sair
            </button>

            {/* Live indicator */}
            {isRunning && joined && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 20 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#dc2626", display: "inline-block", animation: "lc-ping 1.2s ease-in-out infinite" }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: "#dc2626" }}>AO VIVO</span>
              </div>
            )}

            {/* Title */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {liveClass.topic}
              </p>
              {liveClass.course && (
                <p style={{ margin: 0, fontSize: 11.5, color: "#64748b" }}>📚 {liveClass.course.title} · {fmtDate(liveClass.scheduledAt)} {fmtTime(liveClass.scheduledAt)}</p>
              )}
            </div>

            {/* Session timer */}
            {joined && (
              <div style={{ textAlign: "center", background: "rgba(255,255,255,0.06)", borderRadius: 9, padding: "6px 12px" }}>
                <p style={{ margin: 0, fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.7 }}>Sessão</p>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#f1f5f9", fontFamily: "monospace" }}>{fmtDuration(sessionTime)}</p>
              </div>
            )}

            {/* Toggle sidebar */}
            <button onClick={() => setShowSidebar(s => !s)} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, padding: "7px 12px", color: "#94a3b8", fontSize: 12, cursor: "pointer" }}>
              {showSidebar ? "Ocultar ▶" : "◀ Painel"}
            </button>
          </div>

          {/* Jitsi room */}
          <div style={{ flex: 1, padding: 14, overflow: "hidden" }}>
            <JitsiRoom
              liveClass={liveClass}
              onJoined={handleJoined}
              onLeft={handleLeft}
            />
          </div>
        </div>

        {/* ── Sidebar ── */}
        {showSidebar && (
          <div style={{ width: 320, borderLeft: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", overflowY: "auto", background: "#0f172a", gap: 0, flexShrink: 0 }}>

            {/* Class info */}
            <div style={{ padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.7 }}>Informações da Aula</p>
              {[
                { label: "Data",       value: fmtDate(liveClass.scheduledAt) },
                { label: "Início",     value: fmtTime(liveClass.scheduledAt) },
                { label: "Duração",    value: `${liveClass.duration} min` },
                { label: "Sala Jitsi", value: `innova-live-${liveClass.id}` },
              ].map(f => (
                <div key={f.label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ fontSize: 11.5, color: "#475569" }}>{f.label}</span>
                  <span style={{ fontSize: 11.5, color: "#94a3b8", fontFamily: f.label === "Sala Jitsi" ? "monospace" : undefined, fontSize: f.label === "Sala Jitsi" ? 10 : 11.5 }}>{f.value}</span>
                </div>
              ))}

              {/* Existing recording link */}
              {liveClass.recordingUrl && (
                <a href={liveClass.recordingUrl} target="_blank" rel="noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, padding: "7px 12px", background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 8, color: "#a78bfa", fontSize: 12, textDecoration: "none", fontWeight: 600 }}>
                  🎬 Ver Gravação Anterior ↗
                </a>
              )}
            </div>

            {/* Recording panel */}
            <div style={{ padding: 16, flex: 1 }}>
              <RecordingPanel
                liveClass={liveClass}
                onUrlSaved={url => setLiveClass(lc => lc ? { ...lc, recordingUrl: url } : lc)}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
