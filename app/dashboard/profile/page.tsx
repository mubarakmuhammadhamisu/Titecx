'use client';

import GlowCard from '@/components/AppShell/GlowCard';
import {
  Mail, MapPin, Briefcase, Settings, Save, Edit2,
  Lock, Eye, EyeOff, LogOut, Trash2, AlertTriangle,
  CheckCircle2, X, Camera,
} from 'lucide-react';
import React, { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

// ── Delete Modal ──────────────────────────────────────────────────────────────
function DeleteModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => Promise<{ error?: string }> }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleDelete() {
    if (input !== 'DELETE') return;
    setLoading(true);
    const result = await onConfirm();
    if (result?.error) { setError(result.error); setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gray-900 border border-red-500/40 rounded-2xl p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Delete Account</h2>
              <p className="text-xs text-red-400 font-medium">This cannot be undone</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 p-1"><X size={18} /></button>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 space-y-2 text-sm text-red-300">
          <p className="font-semibold text-red-200 mb-1">The following will be permanently deleted:</p>
          {['Your account and login credentials', 'All enrolled courses and progress', 'All lesson completions', 'All payment records', 'Your profile, avatar, and bio'].map((item) => (
            <div key={item} className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />{item}</div>
          ))}
        </div>
        <div>
          <label className="text-sm text-gray-400">Type <span className="font-bold text-white font-mono">DELETE</span> to confirm</label>
          <input type="text" value={input} onChange={(e) => setInput(e.target.value.toUpperCase())} placeholder="Type DELETE here"
            className="mt-2 w-full px-4 py-3 rounded-lg bg-gray-800 border border-red-500/30 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-red-500/60 transition font-mono" />
        </div>
        {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 text-sm font-medium transition">Cancel</button>
          <button onClick={handleDelete} disabled={input !== 'DELETE' || loading}
            className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            <Trash2 size={15} />{loading ? 'Deleting...' : 'Delete Forever'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Profile Page ──────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, enrolledCourses, logout, updateProfile, updatePreferences, updateAvatar, updatePassword, deleteAccount } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwForm, setPwForm] = useState({ new: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError]     = useState('');
  const [prefError, setPrefError]         = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const completed = enrolledCourses.filter((c) => c.progress === 100).length;
  const totalHours = enrolledCourses.reduce((acc, c) => {
    const h = parseFloat(c.duration.replace('h', ''));
    return acc + Math.round((c.progress / 100) * h * 10) / 10;
  }, 0);

  const startEditing = () => {
    setEditName(user.name); setEditPhone(user.phone);
    setEditBio(user.bio); setEditLocation(user.location);
    setSaveSuccess(false); setSaveError('');
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    setSaveLoading(true); setSaveError('');
    const result = await updateProfile({ name: editName.trim(), phone: editPhone.trim(), bio: editBio.trim(), location: editLocation.trim() });
    setSaveLoading(false);
    if (result.error) { setSaveError(result.error); } else { setSaveSuccess(true); setIsEditing(false); }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError('');
    // Validate client-side before uploading — no need for alert()
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Image must be under 2MB.');
      return;
    }
    setAvatarLoading(true);
    const result = await updateAvatar(file);
    setAvatarLoading(false);
    if (result?.error) {
      // updateAvatar already rolled back the Storage file on DB failure
      setAvatarError(result.error);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setPwError(''); setPwSuccess(false);
    if (!pwForm.new || !pwForm.confirm) { setPwError('All fields are required.'); return; }
    if (pwForm.new.length < 8) { setPwError('New password must be at least 8 characters.'); return; }
    if (pwForm.new !== pwForm.confirm) { setPwError('Passwords do not match.'); return; }
    setPwLoading(true);
    const result = await updatePassword(pwForm.new);
    setPwLoading(false);
    if (result.error) { setPwError(result.error); } else { setPwSuccess(true); setPwForm({ new: '', confirm: '' }); }
  };

  const handlePrefChange = async (key: keyof typeof user.preferences, value: boolean) => {
    setPrefError('');
    const result = await updatePreferences({ ...user.preferences, [key]: value });
    if (result?.error) {
      // updatePreferences only calls setUser on success, so the checkbox
      // is still showing the old value — no visual revert needed.
      // We just need to tell the user why their click had no effect.
      setPrefError('Settings could not be saved. Please check your connection.');
    }
  };

  return (
    <>
      {showDeleteModal && <DeleteModal onClose={() => setShowDeleteModal(false)} onConfirm={deleteAccount} />}

      <div className="space-y-6">
        {/* Hero */}
        <GlowCard hero>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar with upload button */}
              <div className="relative group">
                <div className="w-16 h-16 rounded-full bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-indigo-500/50 overflow-hidden">
                  {user.avatarUrl
                    ? <Image src={user.avatarUrl} alt="Avatar" fill sizes="64px" className="object-cover" />
                    : user.avatar}
                </div>
                <button onClick={() => avatarInputRef.current?.click()} disabled={avatarLoading}
                  className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                  {avatarLoading ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Camera size={16} className="text-white" />}
                </button>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{user.name}</h1>
                <p className="text-indigo-300 text-sm">{user.role}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {isEditing
                ? <button onClick={handleSaveProfile} disabled={saveLoading} className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 border border-indigo-500 text-white transition disabled:opacity-60"><Save size={18} /></button>
                : <button onClick={startEditing} className="p-2.5 rounded-xl bg-gray-900/60 border border-indigo-500/30 hover:border-indigo-500/60 text-white transition"><Edit2 size={18} /></button>
              }
              <button onClick={logout} className="p-2.5 rounded-xl bg-gray-900/60 border border-red-500/20 hover:border-red-500/50 text-red-400 transition"><LogOut size={18} /></button>
            </div>
          </div>
          {saveSuccess && <div className="mt-4 flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg"><CheckCircle2 size={15} />Profile saved!</div>}
          {saveError && <div className="mt-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{saveError}</div>}
          {avatarLoading && <div className="mt-3 text-xs text-indigo-400">Uploading avatar...</div>}
          {avatarError && <div className="mt-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{avatarError}</div>}
        </GlowCard>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">

            {/* Personal Info */}
            <GlowCard>
              <h2 className="text-lg font-bold text-white mb-5">Personal Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 font-medium">Full Name</label>
                  <input type="text" value={isEditing ? editName : user.name} readOnly={!isEditing}
                    onChange={(e) => setEditName(e.target.value)}
                    className={`w-full mt-1.5 px-4 py-3 rounded-lg bg-gray-800 border text-white text-sm focus:outline-none transition ${isEditing ? 'border-indigo-500/40 focus:border-indigo-500/70' : 'border-indigo-500/10 cursor-default'}`} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 font-medium">Email</label>
                    <div className="mt-1.5 px-4 py-3 rounded-lg bg-gray-800 border border-indigo-500/10 text-gray-300 text-sm flex items-center gap-2">
                      <Mail size={14} className="text-indigo-400 shrink-0" />{user.email}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-medium">Phone</label>
                    <input type="text" value={isEditing ? editPhone : (user.phone || '—')} readOnly={!isEditing}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className={`w-full mt-1.5 px-4 py-3 rounded-lg bg-gray-800 border text-white text-sm focus:outline-none transition ${isEditing ? 'border-indigo-500/40 focus:border-indigo-500/70' : 'border-indigo-500/10 cursor-default'}`} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium">Location</label>
                  {isEditing
                    ? <input type="text" value={editLocation} placeholder="City, Country" onChange={(e) => setEditLocation(e.target.value)}
                        className="w-full mt-1.5 px-4 py-3 rounded-lg bg-gray-800 border border-indigo-500/40 focus:border-indigo-500/70 text-white text-sm focus:outline-none transition" />
                    : <div className="mt-1.5 px-4 py-3 rounded-lg bg-gray-800 border border-indigo-500/10 text-gray-300 text-sm flex items-center gap-2">
                        <MapPin size={14} className="text-purple-400 shrink-0" />{user.location || 'Not set'}
                      </div>
                  }
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium">Bio</label>
                  <textarea readOnly={!isEditing} rows={3}
                    value={isEditing ? editBio : (user.bio || '')}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder={isEditing ? 'Tell us about yourself...' : 'No bio yet'}
                    className={`w-full mt-1.5 px-4 py-3 rounded-lg bg-gray-800 border text-white text-sm focus:outline-none transition resize-none ${isEditing ? 'border-indigo-500/40 focus:border-indigo-500/70' : 'border-indigo-500/10 cursor-default'}`} />
                </div>
                {isEditing && (
                  <div className="flex gap-3">
                    <button onClick={() => setIsEditing(false)} className="flex-1 py-3 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 text-sm font-medium transition">Cancel</button>
                    <button onClick={handleSaveProfile} disabled={saveLoading} className="flex-1 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition disabled:opacity-60">
                      {saveLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            </GlowCard>

            {/* Change Password */}
            <GlowCard>
              <div className="flex items-center gap-2 mb-5"><Lock size={18} className="text-indigo-400" /><h2 className="text-lg font-bold text-white">Change Password</h2></div>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {[{ label: 'New Password', key: 'new', show: showNew, toggle: () => setShowNew(!showNew), ph: 'At least 8 characters' },
                  { label: 'Confirm New Password', key: 'confirm', show: showConfirm, toggle: () => setShowConfirm(!showConfirm), ph: 'Re-enter your new password' }
                ].map(({ label, key, show, toggle, ph }) => (
                  <div key={key}>
                    <label className="text-xs text-gray-400 font-medium">{label}</label>
                    <div className="relative mt-1.5">
                      <input type={show ? 'text' : 'password'} placeholder={ph}
                        value={pwForm[key as keyof typeof pwForm]}
                        onChange={(e) => setPwForm((p) => ({ ...p, [key]: e.target.value }))}
                        className={`w-full px-4 py-3 pr-10 rounded-lg bg-gray-800 border text-white text-sm placeholder-gray-500 focus:outline-none transition ${
                          key === 'confirm' && pwForm.confirm && pwForm.new !== pwForm.confirm ? 'border-red-500/50' : 'border-indigo-500/20 focus:border-indigo-500/50'}`} />
                      <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition">
                        {show ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {key === 'new' && pwForm.new && (
                      <div className="mt-1.5 flex gap-1">
                        {[1,2,3,4].map((i) => (
                          <div key={i} className={`h-1 flex-1 rounded-full ${pwForm.new.length >= i * 3 ? i <= 1 ? 'bg-red-500' : i <= 2 ? 'bg-yellow-500' : i <= 3 ? 'bg-blue-500' : 'bg-emerald-500' : 'bg-gray-700'}`} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {pwError && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-lg">{pwError}</p>}
                {pwSuccess && <p className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-lg">✓ Password updated successfully!</p>}
                <button type="submit" disabled={pwLoading} className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition disabled:opacity-60">
                  {pwLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </GlowCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <GlowCard>
              <h3 className="text-sm font-bold text-gray-400 mb-4 flex items-center gap-2"><Briefcase size={15} className="text-indigo-400" /> Learning Stats</h3>
              <div className="space-y-3">
                {[{ label: 'Courses Enrolled', value: enrolledCourses.length },
                  { label: 'Total Hours', value: `${totalHours}h` },
                  { label: 'Completed', value: completed },
                  { label: 'Certificates', value: completed }].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">{label}</span>
                    <span className="text-white font-bold text-sm">{value}</span>
                  </div>
                ))}
              </div>
            </GlowCard>

            {/* Preferences — real save */}
            <GlowCard>
              <h3 className="text-sm font-bold text-gray-400 mb-4 flex items-center gap-2"><Settings size={15} className="text-purple-400" /> Preferences</h3>
              <div className="space-y-3">
                {([
                  { label: 'Email notifications', key: 'email_notifications' },
                  { label: 'Course recommendations', key: 'course_recommendations' },
                  { label: 'Weekly digest', key: 'weekly_digest' },
                ] as const).map(({ label, key }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox"
                      checked={user.preferences[key]}
                      onChange={(e) => handlePrefChange(key, e.target.checked)}
                      className="w-4 h-4 rounded accent-indigo-500" />
                    <span className="text-sm text-gray-300 group-hover:text-white transition">{label}</span>
                  </label>
                ))}
              </div>
              {prefError && (
                <p className="mt-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
                  {prefError}
                </p>
              )}
            </GlowCard>

            {/* Danger Zone */}
            <GlowCard className="border-red-500/20 hover:border-red-500/30">
              <h3 className="text-sm font-bold text-red-400 mb-2 flex items-center gap-2"><AlertTriangle size={14} /> Danger Zone</h3>
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">Permanently delete your account. All data, enrollments, and progress will be wiped forever.</p>
              <button onClick={() => setShowDeleteModal(true)}
                className="w-full py-2.5 rounded-lg border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/10 hover:border-red-500/60 transition flex items-center justify-center gap-2">
                <Trash2 size={13} /> Delete My Account
              </button>
            </GlowCard>
          </div>
        </div>
      </div>
    </>
  );
}
