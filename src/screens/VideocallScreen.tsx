import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import {
  LiveKitRoom,
  VideoTrack,
  useTracks,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { PhoneOff, Mic, MicOff, Camera, CameraOff } from 'lucide-react';

export function VideocallScreen() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [url, setUrl] = useState('');
  const [roomName, setRoomName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bookingId) return;

    const connect = async () => {
      try {
        // First get the booking to know the roomId
        const booking = await api.get<{ booking: { roomId: string } }>(`/videocall/booking/${bookingId}`);
        const room = `videocall:${booking.booking.roomId}`;

        const data = await api.post<{ token: string; url: string }>('/livekit/token', {
          roomName: room,
          bookingId,
          kind: 'videocall',
        });
        setToken(data.token);
        setUrl(data.url);
        setRoomName(room);
      } catch {
        setError('No se pudo conectar a la videollamada');
      }
    };

    connect();
  }, [bookingId]);

  const handleEnd = () => {
    navigate(`/valorar/${bookingId}`, { replace: true });
  };

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
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-neutral-400 text-sm">Conectando videollamada...</p>
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom serverUrl={url} token={token} connect video audio>
      <VideocallUI onEnd={handleEnd} />
    </LiveKitRoom>
  );
}

function VideocallUI({ onEnd }: { onEnd: () => void }) {
  const tracks = useTracks([Track.Source.Camera, Track.Source.Microphone]);
  const [micMuted, setMicMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);

  const remoteCameraTrack = tracks.find(
    (t) => !t.participant.isLocal && t.source === Track.Source.Camera,
  );
  const localCameraTrack = tracks.find(
    (t) => t.participant.isLocal && t.source === Track.Source.Camera,
  );

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Remote video (full screen) */}
      <div className="flex-1 flex items-center justify-center">
        {remoteCameraTrack ? (
          <VideoTrack trackRef={remoteCameraTrack} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-full bg-surface-light flex items-center justify-center">
              <Camera size={32} className="text-neutral-500" />
            </div>
            <p className="text-neutral-500 text-sm">Esperando video...</p>
          </div>
        )}
      </div>

      {/* Local video (PiP) */}
      {localCameraTrack && !camOff && (
        <div className="absolute top-12 right-4 w-28 h-40 rounded-xl overflow-hidden border-2 border-border shadow-xl">
          <VideoTrack trackRef={localCameraTrack} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Bottom controls */}
      <div className="safe-bottom absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent">
        <div className="flex items-center justify-center gap-6 pb-8 pt-12">
          <button
            onClick={() => setMicMuted(!micMuted)}
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              micMuted ? 'bg-danger' : 'bg-white/20'
            }`}
          >
            {micMuted ? <MicOff size={20} className="text-white" /> : <Mic size={20} className="text-white" />}
          </button>

          <button
            onClick={onEnd}
            className="w-16 h-16 rounded-full bg-danger flex items-center justify-center"
          >
            <PhoneOff size={28} className="text-white" />
          </button>

          <button
            onClick={() => setCamOff(!camOff)}
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              camOff ? 'bg-danger' : 'bg-white/20'
            }`}
          >
            {camOff ? <CameraOff size={20} className="text-white" /> : <Camera size={20} className="text-white" />}
          </button>
        </div>
      </div>
    </div>
  );
}
