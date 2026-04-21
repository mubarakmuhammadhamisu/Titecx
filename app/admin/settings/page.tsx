'use client';

import React, { useState } from 'react';
import { Save, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    enrollmentsOpen: true,
    showPricingPage: true,
    supportEmail: 'support@titecx.com',
    platformName: 'Titecx',
    paystackMode: 'test',
  });

  const [saved, setSaved] = useState(false);

  const handleChange = (field: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
    setSaved(false);
  };

  const handleSave = () => {
    alert('Settings saved! (Mock: changes not persisted)');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Platform Settings</h1>
        <p className="mt-2 text-gray-400">
          Configure platform-wide settings and preferences.
        </p>
      </div>

      <div className="rounded-lg border border-indigo-500/20 bg-gray-900/50 p-8 backdrop-blur-sm space-y-8">
        {/* Enrollment Settings */}
        <div className="border-b border-indigo-500/10 pb-8">
          <h2 className="text-xl font-bold text-white mb-6">Enrollment Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Accept New Enrollments</p>
                <p className="text-sm text-gray-400 mt-1">
                  Allow students to enroll in new courses
                </p>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enrollmentsOpen}
                  onChange={(e) => handleChange('enrollmentsOpen', e.target.checked)}
                  className="w-5 h-5 rounded border-indigo-500 bg-gray-800 text-indigo-500 cursor-pointer"
                />
                <span className="text-sm text-gray-300">
                  {settings.enrollmentsOpen ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Show Pricing Page</p>
                <p className="text-sm text-gray-400 mt-1">
                  Display pricing information to prospective students
                </p>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showPricingPage}
                  onChange={(e) => handleChange('showPricingPage', e.target.checked)}
                  className="w-5 h-5 rounded border-indigo-500 bg-gray-800 text-indigo-500 cursor-pointer"
                />
                <span className="text-sm text-gray-300">
                  {settings.showPricingPage ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Contact Settings */}
        <div className="border-b border-indigo-500/10 pb-8">
          <h2 className="text-xl font-bold text-white mb-6">Contact Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Support Email Address
              </label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => handleChange('supportEmail', e.target.value)}
                className="w-full rounded-lg bg-gray-800 border border-indigo-500/20 px-4 py-2 text-white placeholder:text-gray-500 outline-none focus:border-indigo-500/60"
              />
              <p className="text-xs text-gray-500 mt-1">
                This email will be displayed in support pages and emails
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Platform Name
              </label>
              <input
                type="text"
                value={settings.platformName}
                onChange={(e) => handleChange('platformName', e.target.value)}
                className="w-full rounded-lg bg-gray-800 border border-indigo-500/20 px-4 py-2 text-white placeholder:text-gray-500 outline-none focus:border-indigo-500/60"
              />
              <p className="text-xs text-gray-500 mt-1">
                Used in emails and browser titles
              </p>
            </div>
          </div>
        </div>

        {/* Payment Settings */}
        <div>
          <h2 className="text-xl font-bold text-white mb-6">Payment Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Paystack Mode
              </label>
              <select
                value={settings.paystackMode}
                onChange={(e) => handleChange('paystackMode', e.target.value)}
                className="w-full rounded-lg bg-gray-800 border border-indigo-500/20 px-4 py-2 text-white outline-none focus:border-indigo-500/60"
              >
                <option value="test">Test Mode</option>
                <option value="live">Live Mode</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Use test mode for development, live mode for production
              </p>
            </div>

            {settings.paystackMode === 'live' && (
              <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4 flex gap-3">
                <AlertCircle size={18} className="text-yellow-400 shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-300">
                  You&apos;re currently in <strong>Live Mode</strong>. Real payments will
                  be processed. Make sure your Paystack credentials are correct.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex gap-4">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 rounded-lg bg-indigo-500 px-6 py-3 font-medium text-white hover:bg-indigo-600 transition"
        >
          <Save size={18} />
          Save Settings
        </button>

        {saved && (
          <div className="flex items-center gap-2 text-green-400 text-sm">
            ✓ Settings saved successfully
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
        <div className="flex gap-3">
          <AlertCircle size={18} className="text-blue-400 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-300">
            These settings are currently mock-based. When backend integration is added,
            they will be persisted to the database and affect platform behavior.
          </p>
        </div>
      </div>
    </div>
  );
}
