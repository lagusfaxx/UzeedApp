import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, MessageCircle, Video, Image, Flag, Heart } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface Profile {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string;
  coverUrl: string;
  bio: string;
  city: string;
  serviceCategory: string;
  serviceDescription: string;
  profileType: string;
}

interface GalleryItem {
  id: string;
  type: "IMAGE" | "VIDEO";
  url: string;
}

interface ServiceItem {
  id: string;
  name: string;
  price: number;
}

interface Post {
  id: string;
  content: string;
}

interface ProfileResponse {
  profile: Profile;
  posts: Post[];
  serviceItems: ServiceItem[];
  gallery: GalleryItem[];
  isSubscribed: boolean;
  isOwner: boolean;
}

export function ProfessionalViewScreen() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();

  const { user } = useAuth();
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    if (!username) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get<ProfileResponse>(`/profiles/${username}`);
        setData(res);
        // Check if this professional is in favorites
        api.get<{ isFavorite: boolean }>(`/favorites/check/${res.profile.id}`)
          .then(({ isFavorite }) => setIsFavorite(isFavorite))
          .catch(() => {});
      } catch {
        setError("No se pudo cargar el perfil.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-950 px-6 text-white">
        <p className="text-neutral-400">{error ?? "Perfil no encontrado."}</p>
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
        >
          Volver
        </button>
      </div>
    );
  }

  const { profile, gallery } = data;

  return (
    <div className="min-h-screen bg-neutral-950 pb-10">
      {/* Cover image */}
      <div className="relative h-[200px] w-full">
        {profile.coverUrl ? (
          <img
            src={profile.coverUrl}
            alt="Cover"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-surface" />
        )}

        {/* Back button overlay */}
        <button
          onClick={() => navigate(-1)}
          className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm"
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>

        {/* Favorite button */}
        {user?.profileType !== 'PROFESSIONAL' && (
          <button
            onClick={async () => {
              if (favLoading || !data) return;
              setFavLoading(true);
              try {
                if (isFavorite) {
                  await api.delete(`/favorites/${data.profile.id}`);
                  setIsFavorite(false);
                } else {
                  await api.post(`/favorites/${data.profile.id}`);
                  setIsFavorite(true);
                }
              } catch {}
              setFavLoading(false);
            }}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm"
          >
            <Heart
              className={`h-5 w-5 ${isFavorite ? 'text-danger fill-danger' : 'text-white'}`}
            />
          </button>
        )}
      </div>

      {/* Avatar overlapping cover */}
      <div className="relative mx-auto -mt-14 w-full max-w-lg px-6">
        <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-neutral-950">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-surface text-3xl font-bold text-primary">
              {profile.displayName?.charAt(0)?.toUpperCase() ?? "?"}
            </div>
          )}
        </div>
      </div>

      {/* Profile info */}
      <div className="mx-auto mt-4 w-full max-w-lg px-6">
        <h1 className="text-2xl font-bold text-white">{profile.displayName}</h1>
        <p className="text-sm text-neutral-400">@{profile.username}</p>

        {profile.city && (
          <div className="mt-2 flex items-center gap-1 text-sm text-neutral-400">
            <MapPin className="h-4 w-4" />
            <span>{profile.city}</span>
          </div>
        )}

        {/* Service category badge */}
        {profile.serviceCategory && (
          <span className="mt-3 inline-block rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary">
            {profile.serviceCategory}
          </span>
        )}

        {/* Bio */}
        {profile.bio && (
          <p className="mt-4 text-sm leading-relaxed text-neutral-300">
            {profile.bio}
          </p>
        )}

        {/* Service description */}
        {profile.serviceDescription && (
          <div className="mt-4 rounded-xl border border-border bg-surface p-4">
            <p className="text-sm leading-relaxed text-neutral-300">
              {profile.serviceDescription}
            </p>
          </div>
        )}

        {/* Gallery grid */}
        {gallery.length > 0 && (
          <div className="mt-6">
            <div className="mb-3 flex items-center gap-2">
              <Image className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold text-white">Galeria</h2>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {gallery.map((item) => (
                <div
                  key={item.id}
                  className="relative aspect-square overflow-hidden rounded-lg bg-surface"
                >
                  {item.type === "IMAGE" ? (
                    <img
                      src={item.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="relative h-full w-full">
                      <video
                        src={item.url}
                        className="h-full w-full object-cover"
                        muted
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Video className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={() => navigate(`/chat/${profile.id}`)}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white active:opacity-80"
          >
            <MessageCircle className="h-5 w-5" />
            Enviar mensaje
          </button>

          <button
            onClick={() => navigate(`/agendar/${profile.id}`)}
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface py-3 text-sm font-semibold text-white active:opacity-80"
          >
            <Video className="h-5 w-5 text-primary" />
            Agendar videollamada
          </button>

          <button
            onClick={() => navigate(`/reportar/${profile.id}`)}
            className="flex items-center justify-center gap-2 py-2 text-xs text-neutral-500 active:text-neutral-300"
          >
            <Flag className="h-3.5 w-3.5" />
            Reportar usuario
          </button>
        </div>
      </div>
    </div>
  );
}
