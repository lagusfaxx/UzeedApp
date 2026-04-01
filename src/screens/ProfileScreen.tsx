import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import type { User } from '@/lib/types';
import {
  LogOut, Camera, Save, MapPin, Phone, Mail, Briefcase,
  ChevronRight, Edit3, Check, X, Shield
} from 'lucide-react';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export function ProfileScreen() {
  const { user, logout, refresh } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
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

  useEffect(() => {
    api.get<{ user: User }>('/profile/me').then(({ user }) => {
      setProfile(user);
      setForm({
        displayName: user.displayName || '',
        bio: user.bio || '',
        phone: user.phone || '',
        city: user.city || '',
        serviceCategory: user.serviceCategory || '',
        serviceDescription: user.serviceDescription || '',
      });
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/profile', form);
      await refresh();
      setEditing(false);
      const { user } = await api.get<{ user: User }>('/profile/me');
      setProfile(user);
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
        // Web fallback: file input
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
      const { user } = await api.get<{ user: User }>('/profile/me');
      setProfile(user);
    } catch (err) {
      console.error('Avatar upload failed:', err);
    }
  };

  const displayUser = profile || user;

  return (
    <div className="safe-top">
      {/* Header */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <h1 className="text-xl font-bold">Mi Perfil</h1>
        <button
          onClick={logout}
          className="text-neutral-400 hover:text-danger transition-colors p-2"
        >
          <LogOut size={20} />
        </button>
      </div>

      <div className="px-5 space-y-5 pb-6">
        {/* Avatar card */}
        <div className="bg-surface rounded-2xl p-5 flex items-center gap-4">
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
              <p className="text-neutral-400 text-sm">@{displayUser.username}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              {displayUser?.profileType && (
                <span className="text-xs bg-primary/20 text-primary-light px-2 py-0.5 rounded-full">
                  {displayUser.profileType}
                </span>
              )}
              {displayUser?.isVerified && (
                <Shield size={14} className="text-success" />
              )}
            </div>
          </div>
        </div>

        {/* Info card */}
        <div className="bg-surface rounded-2xl divide-y divide-border">
          <InfoRow icon={Mail} label="Email" value={displayUser?.email || ''} />
          <InfoRow icon={Phone} label="Teléfono" value={displayUser?.phone || 'Sin registrar'} />
          <InfoRow icon={MapPin} label="Ciudad" value={displayUser?.city || 'Sin registrar'} />
          <InfoRow icon={Briefcase} label="Categoría" value={displayUser?.serviceCategory || 'Sin definir'} />
        </div>

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
          <div className="bg-surface rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Editar datos</h3>
              <button onClick={() => setEditing(false)} className="text-neutral-400">
                <X size={18} />
              </button>
            </div>

            <EditField label="Nombre" value={form.displayName} onChange={(v) => setForm({ ...form, displayName: v })} />
            <EditField label="Teléfono" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} type="tel" />
            <EditField label="Ciudad" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
            <EditField label="Categoría de servicio" value={form.serviceCategory} onChange={(v) => setForm({ ...form, serviceCategory: v })} />

            <div>
              <label className="block text-xs text-neutral-400 mb-1.5">Descripción</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={3}
                className="w-full bg-neutral-950 border border-border rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-primary resize-none"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={16} />
                  Guardar cambios
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <Icon size={18} className="text-neutral-500 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-neutral-500">{label}</p>
        <p className="text-sm truncate">{value}</p>
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
