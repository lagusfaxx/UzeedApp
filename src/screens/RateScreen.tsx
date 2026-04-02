import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { ArrowLeft, Star, Send, Check } from 'lucide-react';

const QUICK_TAGS = [
  'Puntual', 'Amable', 'Profesional', 'Buena comunicación',
  'Recomendable', 'Atento/a', 'Excelente servicio',
];

export function RateScreen() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) return;
    setLoading(true);
    try {
      await api.post(`/videocall/bookings/${bookingId}/review`, {
        hearts: rating,
        comment: comment.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
      });
      setDone(true);
    } catch {
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-6 safe-top">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-4">
            <Check size={28} className="text-success" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Gracias por tu valoración</h2>
          <p className="text-neutral-400 text-sm mb-6">
            Tu opinión ayuda a mejorar la comunidad
          </p>
          <button
            onClick={() => navigate('/lives')}
            className="bg-surface text-white font-medium py-3 px-8 rounded-xl"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 safe-top safe-bottom">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="text-neutral-400 p-1">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-semibold">Valorar sesión</h1>
      </div>

      <div className="px-5 py-8 space-y-8">
        {/* Stars */}
        <div className="text-center">
          <p className="text-neutral-400 text-sm mb-4">¿Cómo fue tu experiencia?</p>
          <div className="flex items-center justify-center gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                onClick={() => setRating(i)}
                className="transition-transform active:scale-90"
              >
                <Star
                  size={40}
                  className={i <= rating ? 'text-warning fill-warning' : 'text-neutral-700'}
                  strokeWidth={1.5}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-white font-medium mt-3">
              {rating === 5 ? 'Excelente' : rating === 4 ? 'Muy buena' : rating === 3 ? 'Buena' : rating === 2 ? 'Regular' : 'Mala'}
            </p>
          )}
        </div>

        {/* Quick tags */}
        <div>
          <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider mb-3">
            Etiquetas rápidas
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3.5 py-2 rounded-full text-sm font-medium border transition-all ${
                  tags.includes(tag)
                    ? 'bg-primary/15 border-primary text-white'
                    : 'bg-surface border-border text-neutral-400'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div>
          <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider mb-2">
            Comentario (opcional)
          </p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Comparte tu experiencia..."
            className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-primary resize-none"
          />
          <p className="text-[11px] text-neutral-600 mt-1 text-right">{comment.length}/500</p>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={rating === 0 || loading}
          className="w-full bg-gradient-to-r from-primary to-violet-500 disabled:from-neutral-800 disabled:to-neutral-800 disabled:text-neutral-500 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:shadow-none"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Send size={16} />
              Enviar valoración
            </>
          )}
        </button>
      </div>
    </div>
  );
}
