import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import {
  LiveKitRoom,
  VideoTrack,
  useRemoteParticipants,
  useTracks,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { Gift, Send, Users, X } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatMessage {
  id: string;
  userId: string;
  message: string;
  createdAt: string;
}

interface TipOption {
  id: string;
  label: string;
  price: number;
  emoji: string;
  isActive: boolean;
}

interface StreamHost {
  id: string;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
}

interface StreamData {
  id: string;
  hostId: string;
  title: string | null;
  isActive: boolean;
  viewerCount: number;
  host: StreamHost;
  messages: ChatMessage[];
  tipOptions: TipOption[];
  privateShowPrice: number;
}

interface StreamResponse {
  stream: StreamData;
}

interface SendChatResponse {
  message: ChatMessage;
}

interface TipAnimation {
  id: string;
  emoji: string;
  label: string;
  price: number;
  ts: number;
}

// ---------------------------------------------------------------------------
// Main exported component — fetches LiveKit token, then renders LiveKitRoom
// ---------------------------------------------------------------------------

export function LiveWatchScreen() {
  const { streamId } = useParams<{ streamId: string }>();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!streamId) return;
    api
      .post<{ token: string; url: string }>('/livekit/token', {
        roomName: `live:${streamId}`,
        streamId,
        kind: 'live',
      })
      .then(({ token: t, url: u }) => {
        setToken(t);
        setUrl(u);
      })
      .catch(() => setError('No se pudo conectar al live'));
  }, [streamId]);

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-danger mb-4">{error}</p>
          <button
            onClick={() => navigate('/lives')}
            className="text-primary text-sm"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  if (!token || !url) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <LiveKitRoom serverUrl={url} token={token} connect>
      <LiveViewerUI
        streamId={streamId!}
        onClose={() => navigate('/lives')}
      />
    </LiveKitRoom>
  );
}

// ---------------------------------------------------------------------------
// Inner UI — rendered inside LiveKitRoom context
// ---------------------------------------------------------------------------

function LiveViewerUI({
  streamId,
  onClose,
}: {
  streamId: string;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);
  const participants = useRemoteParticipants();

  // Stream state
  const [stream, setStream] = useState<StreamData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [viewerCount, setViewerCount] = useState(0);

  // Chat input
  const [chatText, setChatText] = useState('');
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Tip overlay
  const [tipOpen, setTipOpen] = useState(false);
  const [tipping, setTipping] = useState<string | null>(null);

  // Tip animations
  const [tipAnimations, setTipAnimations] = useState<TipAnimation[]>([]);
  const knownMessageIds = useRef<Set<string>>(new Set());

  // Pick the first available video track (camera or screenshare)
  const videoTrack = tracks.find(
    (t) =>
      t.source === Track.Source.Camera ||
      t.source === Track.Source.ScreenShare,
  );

  // ------- Data fetching helpers -------

  const fetchStream = useCallback(async () => {
    try {
      const { stream: s } = await api.get<StreamResponse>(
        `/live/${streamId}`,
      );
      setStream(s);
      setViewerCount(s.viewerCount);

      // Detect new tip messages (messages whose text matches a tip option emoji)
      const tipOptions = s.tipOptions.filter((o) => o.isActive);
      const tipEmojis = new Set(tipOptions.map((o) => o.emoji));

      for (const msg of s.messages) {
        if (!knownMessageIds.current.has(msg.id)) {
          knownMessageIds.current.add(msg.id);

          // Check if this message looks like a tip (contains a tip emoji)
          const matchedOption = tipOptions.find(
            (o) =>
              msg.message.includes(o.emoji) &&
              msg.message.toLowerCase().includes('tip'),
          );
          if (matchedOption) {
            const anim: TipAnimation = {
              id: msg.id,
              emoji: matchedOption.emoji,
              label: matchedOption.label,
              price: matchedOption.price,
              ts: Date.now(),
            };
            setTipAnimations((prev) => [...prev, anim]);
          }
        }
      }

      setMessages(s.messages);
    } catch {
      // Silently ignore polling errors
    }
  }, [streamId]);

  // ------- Mount / unmount lifecycle -------

  useEffect(() => {
    // Join
    api.post(`/live/${streamId}/join`).catch(() => {});
    fetchStream();

    // Poll every 5 seconds
    const interval = setInterval(fetchStream, 5000);

    return () => {
      clearInterval(interval);
      // Leave — fire-and-forget
      api.post(`/live/${streamId}/leave`).catch(() => {});
    };
  }, [streamId, fetchStream]);

  // ------- Auto-scroll chat -------

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ------- Expire tip animations after 3 seconds -------

  useEffect(() => {
    if (tipAnimations.length === 0) return;
    const timer = setTimeout(() => {
      const now = Date.now();
      setTipAnimations((prev) => prev.filter((a) => now - a.ts < 3000));
    }, 3000);
    return () => clearTimeout(timer);
  }, [tipAnimations]);

  // ------- Handlers -------

  const handleSendChat = async () => {
    const text = chatText.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const { message } = await api.post<SendChatResponse>(
        `/live/${streamId}/chat`,
        { message: text },
      );
      setMessages((prev) => [...prev, message]);
      setChatText('');
    } catch {
      // Ignore
    } finally {
      setSending(false);
    }
  };

  const handleTip = async (option: TipOption) => {
    if (tipping) return;
    setTipping(option.id);
    try {
      await api.post(`/live/${streamId}/tip`, {
        amount: option.price,
        optionId: option.id,
      });
      // Show local animation immediately
      setTipAnimations((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          emoji: option.emoji,
          label: option.label,
          price: option.price,
          ts: Date.now(),
        },
      ]);
      setTipOpen(false);
    } catch {
      // Ignore
    } finally {
      setTipping(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendChat();
    }
  };

  // ------- Render -------

  const activeTipOptions = (stream?.tipOptions ?? []).filter(
    (o) => o.isActive,
  );

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* ---- Full-screen video ---- */}
      <div className="absolute inset-0">
        {videoTrack ? (
          <VideoTrack
            trackRef={videoTrack}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-neutral-500 text-sm">
              Esperando video del transmisor...
            </p>
          </div>
        )}
      </div>

      {/* ---- Top bar overlay ---- */}
      <div className="safe-top absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Host info */}
            {stream?.host && (
              <div className="flex items-center gap-2">
                {stream.host.avatarUrl ? (
                  <img
                    src={stream.host.avatarUrl}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover border border-white/20"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-neutral-700 border border-white/20" />
                )}
                <span className="text-white text-sm font-medium truncate max-w-[120px]">
                  {stream.host.displayName ?? stream.host.username ?? 'Host'}
                </span>
              </div>
            )}

            <span className="inline-flex items-center gap-1 bg-danger/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              EN VIVO
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-white/70 text-xs">
              <Users size={12} />
              {viewerCount || participants.length + 1}
            </span>
            <button
              onClick={onClose}
              className="text-white/70 p-1 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {stream?.title && (
          <p className="px-4 pb-2 text-white/60 text-xs truncate">
            {stream.title}
          </p>
        )}
      </div>

      {/* ---- Tip animations (floating) ---- */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center gap-2">
        {tipAnimations.map((a) => (
          <div
            key={a.id}
            className="animate-bounce bg-yellow-500/80 text-white rounded-full px-4 py-2 text-sm font-bold shadow-lg"
          >
            {a.emoji} {a.label} — ${a.price}
          </div>
        ))}
      </div>

      {/* ---- Chat overlay + input ---- */}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col pointer-events-none">
        {/* Scrollable message list */}
        <div className="max-h-[40vh] overflow-y-auto px-3 pb-1 pointer-events-auto scrollbar-hide">
          <div className="flex flex-col gap-1.5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="flex items-start gap-1.5 max-w-[80%]"
              >
                <div className="bg-black/50 backdrop-blur-sm rounded-lg px-2.5 py-1.5">
                  <span className="text-primary text-[11px] font-semibold mr-1.5">
                    {msg.userId === user?.id
                      ? 'Yo'
                      : msg.userId === stream?.hostId
                        ? stream?.host?.displayName ?? 'Host'
                        : msg.userId.slice(0, 6)}
                  </span>
                  <span className="text-white/90 text-xs">{msg.message}</span>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input bar */}
        <div className="bg-gradient-to-t from-black/90 via-black/70 to-transparent pt-4 pb-safe px-3 pointer-events-auto">
          <div className="flex items-center gap-2">
            {/* Tip button */}
            {activeTipOptions.length > 0 && (
              <button
                onClick={() => setTipOpen((v) => !v)}
                className="shrink-0 w-10 h-10 rounded-full bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-400 hover:bg-yellow-500/30 transition-colors"
              >
                <Gift size={18} />
              </button>
            )}

            {/* Text input */}
            <div className="flex-1 flex items-center bg-white/10 backdrop-blur-sm rounded-full border border-white/10 overflow-hidden">
              <input
                type="text"
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe un mensaje..."
                className="flex-1 bg-transparent text-white text-sm px-4 py-2.5 outline-none placeholder:text-white/30"
                maxLength={300}
              />
              <button
                onClick={handleSendChat}
                disabled={!chatText.trim() || sending}
                className="shrink-0 w-10 h-10 flex items-center justify-center text-primary disabled:text-white/20 transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Tip options overlay ---- */}
      {tipOpen && (
        <div className="absolute inset-0 z-30 flex items-end justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setTipOpen(false)}
          />

          {/* Sheet */}
          <div className="relative w-full max-w-md bg-neutral-900/95 backdrop-blur-md rounded-t-2xl p-4 pb-safe z-10 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-sm">
                Enviar propina
              </h3>
              <button
                onClick={() => setTipOpen(false)}
                className="text-white/50 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {activeTipOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleTip(option)}
                  disabled={tipping === option.id}
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-3 transition-colors disabled:opacity-50"
                >
                  <span className="text-2xl">{option.emoji}</span>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-white text-xs font-medium">
                      {option.label}
                    </span>
                    <span className="text-yellow-400 text-[11px] font-semibold">
                      ${option.price}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
