import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { api, API_BASE } from '@/lib/api';
import type { User } from '@/lib/types';
import {
  LogOut, Camera, Save, MapPin, Phone, Mail, Briefcase,
  Edit3, X, Shield, Image, Plus, Trash2,
  Video, ChevronRight, FileText, AlertTriangle
} from 'lucide-react';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export function ProfileScreen() {
  const { user, logout, refresh } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<User | null>(null);
  const [gallery, setGallery] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    displayName: '',
    bio: '',
    phone: '',
    city: '',
    serviceCategory: '',
    serviceDescription: '',
  });

  const isPro = user?.profileType === 'PROFESSIONAL';

  const fetchProfile = useCallback(async () => {
    const { user: u } = await api.get<{ user: User }>('/profile/me');
    setProfile(u);
    setForm({
      displayName: u.displayName || '',
      bio: u.bio || '',
      phone: u.phone || '',
      city: u.city || '',
      serviceCategory: u.serviceCategory || '',
      serviceDescription: u.serviceDescription || '',
    });
    if (isPro) {
      api.get<{ media: any[] }>('/profile/media')
        .then(({ media }) => setGallery(media))
        .catch(() => {});
    }
  }, [isPro]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/profile', form);
      await refresh();
      await fetchProfile();
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatar = async () => {
    try {
      let blob: Blob;
      if (Capacitor.isNativePlatform()) {
        const photo = await CapCamera.getPhoto({
          quality: 80,
          allowEditing: true,
          resultType: CameraResultType.Uri,
          source: CameraSource.Prompt,
        });
        const response = await fetch(photo.webPath!);
        blob = await response.blob();
      } else {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        const file = await new Promise<File | null>((resolve) => {
          input.onchange = () => resolve(input.files?.[0] || null);
          input.click();
        });
        if (!file) return;
        blob = file;
      }
      const fd = new FormData();
      fd.append('file', blob, 'avatar.jpg');
      await api.upload('/profile/avatar', fd);
      await refresh();
      await fetchProfile();
    } catch {
      // Upload failed silently
    }
  };

  const handleAddMedia = async () => {
    try {
      let blob: Blob;
      if (Capacitor.isNativePlatform()) {
        const photo = await CapCamera.getPhoto({
          quality: 85,
          allowEditing: false,
          resultType: CameraResultType.Uri,
          source: CameraSource.Prompt,
        });
        const response = await fetch(photo.webPath!);
        blob = await response.blob();
      } else {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        const file = await new Promise<File | null>((resolve) => {
          input.onchange = () => resolve(input.files?.[0] || null);
          input.click();
        });
        if (!file) return;
        blob = file;
      }
      const fd = new FormData();
      fd.append('files', blob, 'photo.jpg');
      await api.upload('/profile/media', fd);
      await fetchProfile();
    } catch {
      // Upload failed silently
    }
  };

  const handleDeleteMedia = async (id: string) => {
    await api.delete(`/profile/media/${id}`);
    setGallery((prev) => prev.filter((m) => m.id !== id));
  };

  const displayUser = profile || user;

  return (
    <div className="safe-top">
      {/* Header */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <h1 className="text-xl font-bold">Mi Perfil</h1>
        <button
          onClick={logout}
          className="text-neutral-500 hover:text-danger transition-colors p-2"
        >
          <LogOut size={18} />
        </button>
      </div>

      <div className="px-5 space-y-4 pb-6">
        {/* Avatar + Info card */}
        <div className="bg-surface rounded-2xl p-5">
          <div className="flex items-center gap-4">
            <button onClick={handleAvatar} className="relative shrink-0">
              {displayUser?.avatarUrl ? (
                <img
                  src={displayUser.avatarUrl}
                  alt=""
                  className="w-20 h-20 rounded-full object-cover border-2 border-border"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-surface-light border-2 border-border flex items-center justify-center text-2xl font-bold text-neutral-500">
                  {displayUser?.displayName?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1.5">
                <Camera size={12} className="text-white" />
              </div>
            </button>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold truncate">{displayUser?.displayName || 'Sin nombre'}</h2>
              {displayUser?.username && (
                <p className="text-neutral-500 text-sm">@{displayUser.username}</p>
              )}
              <div className="flex items-center gap-2 mt-1.5">
                {displayUser?.profileType && (
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    isPro ? 'bg-primary/15 text-primary-light' : 'bg-surface-lighter text-neutral-400'
                  }`}>
                    {isPro ? 'PROFESIONAL' : 'CLIENTE'}
                  </span>
                )}
                {displayUser?.isVerified && (
                  <Shield size={14} className="text-success" />
                )}
              </div>
            </div>
          </div>

          {/* Verified badge */}
          {displayUser?.isVerified && (
            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border">
              <Shield size={14} className="text-primary" />
              <span className="text-xs text-primary-light font-medium">Cuenta verificada</span>
            </div>
          )}
        </div>

        {/* Info rows */}
        <div className="bg-surface rounded-2xl divide-y divide-border">
          <InfoRow icon={Mail} label="Email" value={displayUser?.email || ''} />
          <InfoRow icon={Phone} label="Teléfono" value={displayUser?.phone || 'Sin registrar'} />
          <InfoRow icon={MapPin} label="Ciudad" value={displayUser?.city || 'Sin registrar'} />
          {isPro && (
            <InfoRow icon={Briefcase} label="Categoría" value={displayUser?.serviceCategory || 'Sin definir'} />
          )}
        </div>

        {/* Videocall config — professionals only */}
        {isPro && (
          <button
            onClick={() => navigate('/videocall-config')}
            className="w-full bg-surface hover:bg-surface-light rounded-2xl p-4 flex items-center gap-3 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Video size={18} className="text-primary-light" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold">Configurar videollamadas</p>
              <p className="text-[11px] text-neutral-500">Precio, duración y disponibilidad</p>
            </div>
            <ChevronRight size={16} className="text-neutral-600" />
          </button>
        )}

        {/* Gallery — professionals only */}
        {isPro && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Galería</h3>
              <button
                onClick={handleAddMedia}
                className="flex items-center gap-1.5 text-primary text-xs font-semibold"
              >
                <Plus size={14} />
                Agregar
              </button>
            </div>
            {gallery.length === 0 ? (
              <div className="bg-surface rounded-2xl p-6 text-center">
                <Image size={28} className="text-neutral-600 mx-auto mb-2" />
                <p className="text-neutral-500 text-sm">Sin fotos aún</p>
                <p className="text-neutral-600 text-xs mt-1">Agrega fotos para mostrar tu perfil</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5 rounded-2xl overflow-hidden">
                {gallery.map((item) => (
                  <div key={item.id} className="relative aspect-square group">
                    <img src={item.url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => handleDeleteMedia(item.id)}
                      className="absolute top-1.5 right-1.5 bg-black/60 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={12} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Edit section */}
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="w-full bg-surface hover:bg-surface-light text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors border border-border"
          >
            <Edit3 size={16} />
            Editar perfil
          </button>
        ) : (
          <div className="bg-surface rounded-2xl p-4 space-y-3.5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold">Editar datos</h3>
              <button onClick={() => setEditing(false)} className="text-neutral-500">
                <X size={18} />
              </button>
            </div>

            <EditField label="Nombre" value={form.displayName} onChange={(v) => setForm({ ...form, displayName: v })} />
            <EditField label="Teléfono" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} type="tel" />
            <EditField label="Ciudad" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />

            {isPro && (
              <>
                <EditField label="Categoría de servicio" value={form.serviceCategory} onChange={(v) => setForm({ ...form, serviceCategory: v })} />
                <div>
                  <label className="block text-xs text-neutral-400 mb-1.5">Descripción</label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    rows={3}
                    placeholder="Describe tu perfil profesional (mín. 20 caracteres)"
                    className="w-full bg-neutral-950 border border-border rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-primary resize-none"
                  />
                </div>
              </>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-gradient-to-r from-primary to-violet-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={16} />
                  Guardar cambios
                </>
              )}
            </button>
          </div>
        )}

        {/* Account & Legal section */}
        <div className="bg-surface rounded-2xl divide-y divide-border">
          <a
            href={`${API_BASE}/legal/privacidad`}
            target="_blank"
            rel="noopener"
            className="flex items-center gap-3 px-4 py-3.5"
          >
            <Shield size={16} className="text-neutral-500 shrink-0" />
            <span className="text-sm flex-1">Política de Privacidad</span>
            <ChevronRight size={14} className="text-neutral-600" />
          </a>
          <a
            href={`${API_BASE}/legal/terminos`}
            target="_blank"
            rel="noopener"
            className="flex items-center gap-3 px-4 py-3.5"
          >
            <FileText size={16} className="text-neutral-500 shrink-0" />
            <span className="text-sm flex-1">Términos de Servicio</span>
            <ChevronRight size={14} className="text-neutral-600" />
          </a>
          <button
            onClick={() => navigate('/eliminar-cuenta')}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
          >
            <AlertTriangle size={16} className="text-danger shrink-0" />
            <span className="text-sm text-danger flex-1">Eliminar cuenta</span>
            <ChevronRight size={14} className="text-neutral-600" />
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <Icon size={16} className="text-neutral-500 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-neutral-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm truncate mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function EditField({ label, value, onChange, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-neutral-400 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-neutral-950 border border-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
      />
    </div>
  );
}
