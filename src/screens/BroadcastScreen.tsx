import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import {
  LiveKitRoom,
  VideoTrack,
  useLocalParticipant,
  useTracks,
  useRemoteParticipants,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { Radio, X, Users, StopCircle } from 'lucide-react';

export function BroadcastScreen() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'setup' | 'live'>('setup');
  const [title, setTitle] = useState('');
  const [privateShowPrice, setPrivateShowPrice] = useState('100');
  const [token, setToken] = useState('');
  const [url, setUrl] = useState('');
  const [streamId, setStreamId] = useState('');
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  const handleStart = async () => {
    setStarting(true);
    setError('');
    try {
      const data = await api.post<{ stream: { id: string } }>('/live/start', {
        title: title || undefined,
        privateShowPrice: parseInt(privateShowPrice) || 100,
      });
      const sid = data.stream.id;
      setStreamId(sid);

      const lk = await api.post<{ token: string; url: string }>('/livekit/token', {
        roomName: `live:${sid}`,
        streamId: sid,
        kind: 'live',
      });
      setToken(lk.token);
      setUrl(lk.url);
      setStep('live');
    } catch (err: any) {
      setError(err?.message || 'Error al iniciar el live');
    } finally {
      setStarting(false);
    }
  };

  const handleStop = async () => {
    try {
      await api.post(`/live/${streamId}/end`);
    } catch { /* ignore */ }
    navigate('/lives');
  };

  if (step === 'setup') {
    return (
      <div className="min-h-screen bg-neutral-950 safe-top safe-bottom px-5">
        <div className="flex items-center justify-between pt-4 mb-8">
          <h1 className="text-xl font-bold">Iniciar Live</h1>
          <button onClick={() => navigate('/lives')} className="text-neutral-400 p-1">
            <X size={22} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">Título (opcional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Mi transmisión en vivo"
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">Precio show privado (tokens)</label>
            <input
              type="number"
              value={privateShowPrice}
              onChange={(e) => setPrivateShowPrice(e.target.value)}
              min={1}
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
            />
          </div>

          {error && (
            <p className="text-danger text-sm bg-danger/10 rounded-lg py-2 px-3">{error}</p>
          )}

          <button
            onClick={handleStart}
            disabled={starting}
            className="w-full bg-danger hover:bg-danger/90 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 mt-4"
          >
            {starting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Radio size={18} />
                Comenzar transmisión
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom serverUrl={url} token={token} connect video audio>
      <BroadcastUI onStop={handleStop} title={title} />
    </LiveKitRoom>
  );
}

function BroadcastUI({ onStop, title }: { onStop: () => void; title: string }) {
  const tracks = useTracks([Track.Source.Camera]);
  const participants = useRemoteParticipants();
  const localTrack = tracks.find((t) => t.participant.isLocal);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Top bar */}
      <div className="safe-top absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-danger text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              EN VIVO
            </span>
            <span className="flex items-center gap-1 text-white/70 text-xs">
              <Users size={12} />
              {participants.length}
            </span>
            {title && <span className="text-white/50 text-xs truncate max-w-[120px]">{title}</span>}
          </div>
          <button
            onClick={onStop}
            className="bg-danger/80 hover:bg-danger text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1"
          >
            <StopCircle size={14} />
            Terminar
          </button>
        </div>
      </div>

      {/* Camera preview */}
      <div className="flex-1 flex items-center justify-center">
        {localTrack ? (
          <VideoTrack trackRef={localTrack} className="w-full h-full object-cover" />
        ) : (
          <p className="text-neutral-500 text-sm">Activando cámara...</p>
        )}
      </div>
    </div>
  );
}
