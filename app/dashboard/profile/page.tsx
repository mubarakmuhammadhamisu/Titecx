'use client';

import GlowCard from '@/components/AppShell/GlowCard';
import { Mail, MapPin, Briefcase, Settings, Save, Edit2 } from 'lucide-react';
import { useState } from 'react';

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <GlowCard hero>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-indigo-500/50">
              M
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">My Profile</h1>
              <p className="text-gray-300 text-sm">Manage your account and preferences</p>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-3 rounded-xl bg-gray-900 border border-indigo-500/30 hover:border-indigo-500/60 transition"
          >
            {isEditing ? <Save size={20} /> : <Edit2 size={20} />}
          </button>
        </div>
      </GlowCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Info */}
        <div className="lg:col-span-2">
          <GlowCard>
            <h2 className="text-lg font-bold text-white mb-6">Personal Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Full Name</label>
                <input
                  type="text"
                  value="Mubarak Muhammad Hamisu"
                  readOnly={!isEditing}
                  className={`w-full mt-2 px-4 py-3 rounded-lg bg-gray-800 border border-indigo-500/20
                    text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/60 transition
                    ${isEditing ? 'cursor-text' : 'cursor-default'}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Email</label>
                  <div className="mt-2 px-4 py-3 rounded-lg bg-gray-800 border border-indigo-500/20 text-gray-300 flex items-center gap-2">
                    <Mail size={16} className="text-indigo-400" />
                    mubarak@example.com
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Phone</label>
                  <input
                    type="text"
                    value="+1 (555) 123-4567"
                    readOnly={!isEditing}
                    className={`w-full mt-2 px-4 py-3 rounded-lg bg-gray-800 border border-indigo-500/20
                      text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/60 transition
                      ${isEditing ? 'cursor-text' : 'cursor-default'}`}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400">Location</label>
                <div className="mt-2 px-4 py-3 rounded-lg bg-gray-800 border border-indigo-500/20 text-gray-300 flex items-center gap-2">
                  <MapPin size={16} className="text-purple-400" />
                  San Francisco, USA
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400">Bio</label>
                <textarea
                  readOnly={!isEditing}
                  className={`w-full mt-2 px-4 py-3 rounded-lg bg-gray-800 border border-indigo-500/20
                    text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/60 transition
                    ${isEditing ? 'cursor-text' : 'cursor-default'}`}
                  rows={4}
                  defaultValue="Passionate learner exploring AI and machine learning technologies."
                />
              </div>
            </div>
          </GlowCard>
        </div>

        {/* Learning Stats */}
        <div className="space-y-4">
          <GlowCard>
            <h3 className="text-sm font-bold text-gray-400 mb-4 flex items-center gap-2">
              <Briefcase size={16} className="text-indigo-400" />
              Learning Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Courses Active</span>
                <span className="text-white font-bold">8</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Total Hours</span>
                <span className="text-white font-bold">42.5h</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Certificates</span>
                <span className="text-white font-bold">3</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Completed</span>
                <span className="text-white font-bold">5</span>
              </div>
            </div>
          </GlowCard>

          <GlowCard>
            <h3 className="text-sm font-bold text-gray-400 mb-4 flex items-center gap-2">
              <Settings size={16} className="text-purple-400" />
              Preferences
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span className="text-sm text-gray-300">Email notifications</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span className="text-sm text-gray-300">Course recommendations</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4" />
                <span className="text-sm text-gray-300">Weekly digest</span>
              </label>
            </div>
          </GlowCard>
        </div>
      </div>
    </div>
  );
}
