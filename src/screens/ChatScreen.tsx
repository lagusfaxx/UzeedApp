import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import type { Conversation, Message } from '@/lib/types';
import { MessageCircle, ArrowLeft, Send, Image, ChevronRight } from 'lucide-react';

export function ChatInbox() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get<{ conversations: Conversation[] }>('/messages/inbox')
      .then(({ conversations }) => setConversations(conversations))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="safe-top">
      <div className="px-5 pt-4 pb-2">
        <h1 className="text-xl font-bold">Mensajes</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="px-5 py-16 text-center">
          <MessageCircle size={40} className="text-neutral-600 mx-auto mb-3" />
          <p className="text-neutral-500">Sin conversaciones</p>
          <p className="text-neutral-600 text-sm mt-1">Los mensajes con clientes aparecerán aquí</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {conversations.map(({ other, lastMessage, unreadCount }) => (
            <button
              key={other.id}
              onClick={() => navigate(`/chat/${other.id}`)}
              className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-surface/50 transition-colors text-left"
            >
              {other.avatarUrl ? (
                <img src={other.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-surface-light flex items-center justify-center text-lg font-bold text-neutral-500 shrink-0">
                  {other.displayName?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm truncate">{other.displayName || other.username || 'Usuario'}</p>
                  <span className="text-[10px] text-neutral-500 shrink-0 ml-2">
                    {formatRelative(lastMessage.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-sm text-neutral-400 truncate">
                    {lastMessage.body.startsWith('ATTACHMENT_IMAGE:') ? '📷 Imagen' : lastMessage.body}
                  </p>
                  {unreadCount > 0 && (
                    <span className="bg-primary text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shrink-0 ml-2">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight size={16} className="text-neutral-600 shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ChatConversation() {
  const { userId } = useParams<{ userId: string }>();
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [other, setOther] = useState<any>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const fetchMessages = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await api.get<{ messages: Message[]; other: any }>(`/messages/${userId}`);
      setMessages(data.messages);
      setOther(data.other);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 5000);
    return () => clearInterval(pollRef.current);
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const sanitized = text.trim().slice(0, 2000);
    if (!sanitized || sending) return;
    setSending(true);
    try {
      await api.post(`/messages/${userId}`, { body: sanitized });
      setText('');
      await fetchMessages();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-950">
      {/* Header */}
      <div className="safe-top bg-surface border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate('/chat')} className="text-neutral-400 p-1">
            <ArrowLeft size={22} />
          </button>
          {other?.avatarUrl ? (
            <img src={other.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-surface-light flex items-center justify-center text-sm font-bold text-neutral-500">
              {other?.displayName?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate">{other?.displayName || 'Cargando...'}</p>
            {other?.city && <p className="text-[11px] text-neutral-500">{other.city}</p>}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-neutral-600 text-sm py-8">Inicia la conversación</p>
        ) : (
          messages.map((msg) => {
            const mine = msg.fromId === me?.id;
            const isImage = msg.body.startsWith('ATTACHMENT_IMAGE:');
            const rawUrl = isImage ? msg.body.replace('ATTACHMENT_IMAGE:', '') : null;
            const imageUrl = rawUrl && /^https:\/\//.test(rawUrl) ? rawUrl : null;

            return (
              <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
                  mine
                    ? 'bg-primary text-white rounded-br-md'
                    : 'bg-surface-light text-white rounded-bl-md'
                }`}>
                  {isImage && imageUrl ? (
                    <img src={imageUrl} alt="Imagen adjunta" className="rounded-lg max-w-full max-h-60 object-cover" />
                  ) : (
                    <p className="text-sm leading-relaxed break-words">{msg.body}</p>
                  )}
                  <p className={`text-[10px] mt-1 ${mine ? 'text-white/60' : 'text-neutral-500'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-surface border-t border-border safe-bottom">
        <div className="flex items-end gap-2 px-4 py-3">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Escribe un mensaje..."
            className="flex-1 bg-surface-light rounded-full px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="bg-primary hover:bg-primary/90 disabled:opacity-30 rounded-full p-2.5 transition-all shrink-0"
          >
            <Send size={18} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

function formatRelative(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
}
