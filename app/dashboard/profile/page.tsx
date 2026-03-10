'use client';

import GlowCard from '@/components/AppShell/GlowCard';
import { Mail, MapPin, Briefcase, Settings, Save, Edit2, Lock, Eye, EyeOff, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
  const { user, enrolledCourses, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwForm, setPwForm] = useState({ old: '', new: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  if (!user) return null;

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess(false);
    if (!pwForm.old || !pwForm.new || !pwForm.confirm) { setPwError('All fields are required.'); return; }
    if (pwForm.new.length < 8) { setPwError('New password must be at least 8 characters.'); return; }
    if (pwForm.new !== pwForm.confirm) { setPwError('New passwords do not match.'); return; }
    // TODO: call Supabase update password
    setPwSuccess(true);
    setPwForm({ old: '', new: '', confirm: '' });
  };

  const completed = enrolledCourses.filter((c) => c.progress === 100).length;
  const totalHours = enrolledCourses.reduce((acc, c) => {
    const h = parseFloat(c.duration.replace('h', ''));
    return acc + Math.round((c.progress / 100) * h * 10) / 10;
  }, 0);

  return (
    <div className="space-y-6">
      <GlowCard hero>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-indigo-500/50">
              {user.avatar}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{user.name}</h1>
              <p className="text-indigo-300 text-sm mt-0.5">{user.role}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              title={isEditing ? 'Save' : 'Edit'}
              className="p-2.5 rounded-xl bg-gray-900/60 border border-indigo-500/30 hover:border-indigo-500/60 text-white transition"
            >
              {isEditing ? <Save size={18} /> : <Edit2 size={18} />}
            </button>
            <button
              onClick={logout}
              title="Log out"
              className="p-2.5 rounded-xl bg-gray-900/60 border border-red-500/20 hover:border-red-500/50 text-red-400 transition"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </GlowCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info */}
          <GlowCard>
            <h2 className="text-lg font-bold text-white mb-5">Personal Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-medium">Full Name</label>
                <input type="text" defaultValue={user.name} readOnly={!isEditing}
                  className={`w-full mt-1.5 px-4 py-3 rounded-lg bg-gray-800 border text-white text-sm focus:outline-none transition ${isEditing ? 'border-indigo-500/40 focus:border-indigo-500/70 cursor-text' : 'border-indigo-500/10 cursor-default'}`} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 font-medium">Email</label>
                  <div className="mt-1.5 px-4 py-3 rounded-lg bg-gray-800 border border-indigo-500/10 text-gray-300 text-sm flex items-center gap-2">
                    <Mail size={14} className="text-indigo-400 flex-shrink-0" />{user.email}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium">Phone</label>
                  <input type="text" defaultValue={user.phone} readOnly={!isEditing}
                    className={`w-full mt-1.5 px-4 py-3 rounded-lg bg-gray-800 border text-white text-sm focus:outline-none transition ${isEditing ? 'border-indigo-500/40 focus:border-indigo-500/70 cursor-text' : 'border-indigo-500/10 cursor-default'}`} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 font-medium">Location</label>
                <div className="mt-1.5 px-4 py-3 rounded-lg bg-gray-800 border border-indigo-500/10 text-gray-300 text-sm flex items-center gap-2">
                  <MapPin size={14} className="text-purple-400 flex-shrink-0" />{user.location}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 font-medium">Bio</label>
                <textarea readOnly={!isEditing} rows={3} defaultValue={user.bio}
                  className={`w-full mt-1.5 px-4 py-3 rounded-lg bg-gray-800 border text-white text-sm focus:outline-none transition resize-none ${isEditing ? 'border-indigo-500/40 focus:border-indigo-500/70 cursor-text' : 'border-indigo-500/10 cursor-default'}`} />
              </div>
              {isEditing && (
                <button onClick={() => setIsEditing(false)} className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition">
                  Save Changes
                </button>
              )}
            </div>
          </GlowCard>

          {/* Change Password */}
          <GlowCard>
            <div className="flex items-center gap-2 mb-5">
              <Lock size={18} className="text-indigo-400" />
              <h2 className="text-lg font-bold text-white">Change Password</h2>
            </div>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {[
                { label: 'Current Password', key: 'old', show: showOld, toggle: () => setShowOld(!showOld), placeholder: 'Enter your current password' },
                { label: 'New Password', key: 'new', show: showNew, toggle: () => setShowNew(!showNew), placeholder: 'At least 8 characters' },
                { label: 'Confirm New Password', key: 'confirm', show: showConfirm, toggle: () => setShowConfirm(!showConfirm), placeholder: 'Re-enter your new password' },
              ].map(({ label, key, show, toggle, placeholder }) => (
                <div key={key}>
                  <label className="text-xs text-gray-400 font-medium">{label}</label>
                  <div className="relative mt-1.5">
                    <input
                      type={show ? 'text' : 'password'}
                      placeholder={placeholder}
                      value={pwForm[key as keyof typeof pwForm]}
                      onChange={(e) => setPwForm((p) => ({ ...p, [key]: e.target.value }))}
                      className={`w-full px-4 py-3 pr-10 rounded-lg bg-gray-800 border text-white text-sm placeholder-gray-500 focus:outline-none transition ${
                        key === 'confirm' && pwForm.confirm && pwForm.new !== pwForm.confirm
                          ? 'border-red-500/50 focus:border-red-500/70'
                          : 'border-indigo-500/20 focus:border-indigo-500/50'
                      }`}
                    />
                    <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition">
                      {show ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {key === 'new' && pwForm.new && (
                    <div className="mt-1.5 flex gap-1">
                      {[1,2,3,4].map((i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full ${
                          pwForm.new.length >= i * 3
                            ? i <= 1 ? 'bg-red-500' : i <= 2 ? 'bg-yellow-500' : i <= 3 ? 'bg-blue-500' : 'bg-emerald-500'
                            : 'bg-gray-700'
                        }`} />
                      ))}
                    </div>
                  )}
                  {key === 'confirm' && pwForm.confirm && pwForm.new !== pwForm.confirm && (
                    <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                  )}
                </div>
              ))}
              {pwError && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-lg">{pwError}</p>}
              {pwSuccess && <p className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-lg">✓ Password updated successfully!</p>}
              <button type="submit" className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition">
                Update Password
              </button>
            </form>
          </GlowCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <GlowCard>
            <h3 className="text-sm font-bold text-gray-400 mb-4 flex items-center gap-2">
              <Briefcase size={15} className="text-indigo-400" /> Learning Stats
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Courses Enrolled', value: enrolledCourses.length },
                { label: 'Total Hours', value: `${totalHours}h` },
                { label: 'Completed', value: completed },
                { label: 'Certificates', value: completed },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">{label}</span>
                  <span className="text-white font-bold text-sm">{value}</span>
                </div>
              ))}
            </div>
          </GlowCard>

          <GlowCard>
            <h3 className="text-sm font-bold text-gray-400 mb-4 flex items-center gap-2">
              <Settings size={15} className="text-purple-400" /> Preferences
            </h3>
            <div className="space-y-3">
              {['Email notifications', 'Course recommendations', 'Weekly digest'].map((label, i) => (
                <label key={label} className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" defaultChecked={i < 2} className="w-4 h-4 rounded accent-indigo-500" />
                  <span className="text-sm text-gray-300 group-hover:text-white transition">{label}</span>
                </label>
              ))}
            </div>
          </GlowCard>

          <GlowCard className="border-red-500/20 hover:border-red-500/30">
            <h3 className="text-sm font-bold text-red-400 mb-2">Danger Zone</h3>
            <p className="text-xs text-gray-500 mb-3">Permanently delete your account and all data.</p>
            <button className="w-full py-2 rounded-lg border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/10 transition">
              Delete Account
            </button>
          </GlowCard>
        </div>
      </div>
    </div>
  );
}
