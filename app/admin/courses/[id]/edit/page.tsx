'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Eye, EyeOff, Loader2 } from 'lucide-react';
import CourseInfoForm from '@/components/admin/CourseEditor/CourseInfoForm';
import CurriculumBuilder from '@/components/admin/CourseEditor/CurriculumBuilder';
import type { Course } from '@/components/admin/adminTypes';

const TABS = ['Info', 'Curriculum'] as const;
type Tab = typeof TABS[number];

export default function EditCoursePage() {
  const { id } = useParams() as { id: string };
  const router  = useRouter();
  const [tab, setTab]       = useState<Tab>('Info');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [saved, setSaved]     = useState(false);
  const [courseData, setCourseData] = useState<Partial<Course> | null>(null);

  useEffect(() => {
    fetch(`/api/admin/courses/${id}`)
      .then((r) => r.json())
      .then((d) => { setCourseData(d.course); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const onChange = (field: keyof Course, value: any) =>
    setCourseData((d) => d ? { ...d, [field]: value } : d);

  const handleSave = async (publishOverride?: boolean) => {
    if (!courseData) return;
    if (!courseData.title?.trim()) { setError('Title is required.'); setTab('Info'); return; }
    if (!courseData.slug?.trim())  { setError('Slug is required.');  setTab('Info'); return; }
    setSaving(true); setError('');
    const payload = publishOverride !== undefined
      ? { ...courseData, is_published: publishOverride }
      : courseData;
    const res = await fetch(`/api/admin/courses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-csrf-protection': '1' },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Failed to save.'); return; }
    const { course } = await res.json();
    setCourseData(course);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 size={24} className="text-indigo-400 animate-spin" />
    </div>
  );

  if (!courseData) return (
    <div className="space-y-4">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-indigo-400 text-sm"><ArrowLeft size={16} /> Back</button>
      <p className="text-red-400">Course not found.</p>
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin/courses')}
            className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm transition">
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white truncate max-w-xs">{courseData.title}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs font-semibold ${courseData.is_published ? 'text-emerald-400' : 'text-gray-500'}`}>
                {courseData.is_published ? '● Published' : '● Draft'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => handleSave()} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 text-sm transition disabled:opacity-50">
            <Save size={14} /> {saved ? 'Saved!' : saving ? 'Saving…' : 'Save'}
          </button>
          <button onClick={() => handleSave(!courseData.is_published)} disabled={saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 shadow-lg
              ${courseData.is_published
                ? 'border border-amber-500/40 text-amber-400 hover:bg-amber-500/10'
                : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-emerald-500/25'}`}>
            {courseData.is_published ? <><EyeOff size={14} /> Unpublish</> : <><Eye size={14} /> Publish</>}
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
        <CurriculumBuilder
          modules={courseData.modules ?? []}
          onChange={(m) => onChange('modules', m)} />
      )}

      {/* Floating save bar */}
      <div className="sticky bottom-6 flex justify-end">
        <button onClick={() => handleSave()} disabled={saving}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-medium shadow-2xl shadow-indigo-500/40 transition disabled:opacity-50">
          <Save size={16} /> {saved ? 'Saved!' : saving ? 'Saving…' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
}
