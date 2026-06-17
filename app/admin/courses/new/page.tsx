'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react';
import CourseInfoForm from '@/components/admin/CourseEditor/CourseInfoForm';
import CurriculumBuilder from '@/components/admin/CourseEditor/CurriculumBuilder';
import type { Course, Module } from '@/components/admin/adminTypes';

const TABS = ['Info', 'Curriculum'] as const;
type Tab = typeof TABS[number];

export default function NewCoursePage() {
  const router = useRouter();
  const [tab, setTab]     = useState<Tab>('Info');
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const [courseData, setCourseData] = useState<Partial<Course>>({
    title: '', slug: '', short_description: '', description: '',
    level: 'Beginner', duration: '', price: '0', instructor: '',
    thumbnail: '', gradient_from: '#6366f1', gradient_to: '#8b5cf6',
    features: [], curriculum: [], modules: [], is_published: false,
    premium_price: null, premium_deadline_days: 60,
  });

  const onChange = (field: keyof Course, value: any) =>
    setCourseData((d) => ({ ...d, [field]: value }));

  const handleSave = async (publish?: boolean) => {
    if (!courseData.title?.trim()) { setError('Title is required.'); setTab('Info'); return; }
    if (!courseData.slug?.trim())  { setError('Slug is required.');  setTab('Info'); return; }
    setSaving(true); setError('');
    const payload = { ...courseData, is_published: publish ?? courseData.is_published };
    const res = await fetch('/api/admin/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-csrf-protection': '1' },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Failed to create course.'); return; }
    router.push('/admin/courses');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin/courses')}
            className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm transition">
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">New Course</h1>
            <p className="text-gray-500 text-xs mt-0.5">Fill in the details and build the curriculum.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => handleSave(false)} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 text-sm transition disabled:opacity-50">
            <Save size={14} /> {saving ? 'Saving…' : 'Save Draft'}
          </button>
          <button onClick={() => handleSave(true)} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-sm font-medium transition disabled:opacity-50 shadow-lg shadow-emerald-500/25">
            <Eye size={14} /> Publish
          </button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 text-sm">{error}</div>}

      <div className="flex gap-1 p-1 bg-gray-900/50 rounded-xl border border-gray-800 w-fit">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition ${tab === t ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Info' && <CourseInfoForm data={courseData} onChange={onChange} />}
      {tab === 'Curriculum' && (
        <CurriculumBuilder modules={courseData.modules ?? []}
          onChange={(m) => onChange('modules', m)} />
      )}
    </div>
  );
}
