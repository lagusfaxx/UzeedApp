import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import {
  LiveKitRoom,
  VideoTrack,
  useRemoteParticipants,
  useRoomContext,
  useTracks,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { ArrowLeft, Users, X } from 'lucide-react';

export function LiveWatchScreen() {
  const { streamId } = useParams<{ streamId: string }>();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!streamId) return;
    api.post<{ token: string; url: string }>('/livekit/token', {
      roomName: `live:${streamId}`,
      streamId,
      kind: 'live',
    })
      .then(({ token, url }) => {
        setToken(token);
        setUrl(url);
      })
      .catch(() => setError('No se pudo conectar al live'));
  }, [streamId]);

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-danger mb-4">{error}</p>
          <button onClick={() => navigate('/lives')} className="text-primary text-sm">Volver</button>
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
      <LiveViewerUI onClose={() => navigate('/lives')} />
    </LiveKitRoom>
  );
}

function LiveViewerUI({ onClose }: { onClose: () => void }) {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);
  const participants = useRemoteParticipants();
  const videoTrack = tracks.find(
    (t) => t.source === Track.Source.Camera || t.source === Track.Source.ScreenShare,
  );

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Top bar */}
      <div className="safe-top absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-danger/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              EN VIVO
            </span>
            <span className="flex items-center gap-1 text-white/70 text-xs">
              <Users size={12} />
              {participants.length + 1}
            </span>
          </div>
          <button onClick={onClose} className="text-white/70 p-1">
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Video */}
      <div className="flex-1 flex items-center justify-center">
        {videoTrack ? (
          <VideoTrack trackRef={videoTrack} className="w-full h-full object-contain" />
        ) : (
          <p className="text-neutral-500 text-sm">Esperando video del transmisor...</p>
        )}
      </div>
    </div>
  );
}
