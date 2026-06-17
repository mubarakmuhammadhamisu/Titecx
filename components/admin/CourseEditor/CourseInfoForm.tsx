'use client';

import React from 'react';
import type { Course } from '@/components/admin/adminTypes';
import { ImageOff } from 'lucide-react';

type CourseInfoProps = {
  data: Partial<Course>;
  onChange: (field: keyof Course, value: any) => void;
};

const inp  = 'w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-white text-sm outline-none focus:border-indigo-500/60 transition';
const label = 'block text-xs text-gray-400 mb-1.5';

const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];

export default function CourseInfoForm({ data, onChange }: CourseInfoProps) {
  return (
    <div className="space-y-6">
      {/* Thumbnail preview */}
      <div className="rounded-xl overflow-hidden h-44 relative"
        style={{ background: `linear-gradient(135deg, ${data.gradient_from || '#6366f1'}, ${data.gradient_to || '#8b5cf6'})` }}>
        {data.thumbnail ? (
          <img src={data.thumbnail} alt="Thumbnail preview"
            className="w-full h-full object-cover opacity-80"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/40">
            <ImageOff size={32} />
            <p className="text-xs">Thumbnail preview</p>
          </div>
        )}
      </div>

      <div>
        <label className={label}>Thumbnail URL</label>
        <input value={data.thumbnail ?? ''} onChange={(e) => onChange('thumbnail', e.target.value)}
          placeholder="https://images.example.com/my-course.jpg" className={inp} />
        <p className="text-xs text-gray-600 mt-1">Paste a URL from any image host. Shown as live preview above.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Gradient From</label>
          <div className="flex gap-2">
            <input type="color" value={data.gradient_from || '#6366f1'} onChange={(e) => onChange('gradient_from', e.target.value)}
              className="h-10 w-12 rounded-lg cursor-pointer bg-gray-800 border border-gray-700 p-1" />
            <input value={data.gradient_from || '#6366f1'} onChange={(e) => onChange('gradient_from', e.target.value)}
              placeholder="#6366f1" className={`${inp} flex-1`} />
          </div>
        </div>
        <div>
          <label className={label}>Gradient To</label>
          <div className="flex gap-2">
            <input type="color" value={data.gradient_to || '#8b5cf6'} onChange={(e) => onChange('gradient_to', e.target.value)}
              className="h-10 w-12 rounded-lg cursor-pointer bg-gray-800 border border-gray-700 p-1" />
            <input value={data.gradient_to || '#8b5cf6'} onChange={(e) => onChange('gradient_to', e.target.value)}
              placeholder="#8b5cf6" className={`${inp} flex-1`} />
          </div>
        </div>
      </div>

      <div>
        <label className={label}>Title *</label>
        <input value={data.title ?? ''} onChange={(e) => onChange('title', e.target.value)}
          placeholder="e.g. Python for Everyone" className={inp} />
      </div>

      <div>
        <label className={label}>Slug *</label>
        <input value={data.slug ?? ''} onChange={(e) => onChange('slug', e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
          placeholder="e.g. python-for-everyone" className={inp} />
        <p className="text-xs text-gray-600 mt-1">Used in the URL. Auto-formatted to lowercase with hyphens.</p>
      </div>

      <div>
        <label className={label}>Short Description</label>
        <input value={data.short_description ?? ''} onChange={(e) => onChange('short_description', e.target.value)}
          placeholder="One-liner shown on course cards" className={inp} />
      </div>

      <div>
        <label className={label}>Full Description</label>
        <textarea value={data.description ?? ''} onChange={(e) => onChange('description', e.target.value)}
          rows={4} placeholder="Detailed description shown on the course page…" className={`${inp} resize-none`} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Level</label>
          <select value={data.level ?? 'Beginner'} onChange={(e) => onChange('level', e.target.value)} className={inp}>
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Duration</label>
          <input value={data.duration ?? ''} onChange={(e) => onChange('duration', e.target.value)}
            placeholder="e.g. 8 hours" className={inp} />
        </div>
      </div>

      <div>
        <label className={label}>Instructor</label>
        <input value={data.instructor ?? ''} onChange={(e) => onChange('instructor', e.target.value)}
          placeholder="Instructor name" className={inp} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Price (₦)</label>
          <input type="number" min="0" value={data.price ?? ''} onChange={(e) => onChange('price', e.target.value)}
            placeholder="e.g. 15000" className={inp} />
        </div>
        <div>
          <label className={label}>Premium Price (₦)</label>
          <input type="number" min="0" value={data.premium_price ?? ''} onChange={(e) => onChange('premium_price', e.target.value)}
            placeholder="Optional, for fast-track" className={inp} />
        </div>
      </div>

      <div>
        <label className={label}>Premium Deadline (days)</label>
        <input type="number" min="1" value={data.premium_deadline_days ?? 60} onChange={(e) => onChange('premium_deadline_days', Number(e.target.value))}
          className={inp} />
        <p className="text-xs text-gray-600 mt-1">Days student has to complete for mystery box eligibility.</p>
      </div>

      <div>
        <label className={label}>What You'll Learn (one per line)</label>
        <textarea
          value={(data.curriculum ?? []).join('\n')}
          onChange={(e) => onChange('curriculum', e.target.value.split('\n').filter((l) => l.trim()))}
          rows={4} placeholder="Master Python basics&#10;Build real projects&#10;Debug like a pro"
          className={`${inp} resize-none`} />
      </div>

      <div>
        <label className={label}>Course Features (one per line)</label>
        <textarea
          value={(data.features ?? []).join('\n')}
          onChange={(e) => onChange('features', e.target.value.split('\n').filter((l) => l.trim()))}
          rows={3} placeholder="Certificate of completion&#10;Lifetime access&#10;Practice environments"
          className={`${inp} resize-none`} />
      </div>
    </div>
  );
}
