'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Course } from '@/components/admin/adminTypes';
import { Plus, Eye, EyeOff, Pencil, Trash2, BookOpen } from 'lucide-react';
import { Modal } from '@/components/admin/shared/Modal';
import Image from 'next/image';

function fmt(kobo: number) { return `₦${(kobo / 100).toLocaleString()}`; }

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState<'all' | 'published' | 'draft'>('all');
  const [deleteTarget, setDel] = useState<Course | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/admin/courses')
      .then((r) => r.json())
      .then((d) => { setCourses(d.courses ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => courses.filter((c) => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
                        c.slug.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'published' ? c.is_published : !c.is_published);
    return matchSearch && matchFilter;
  }), [courses, search, filter]);

  const handleTogglePublish = async (c: Course) => {
    setToggling(c.id);
    const res = await fetch(`/api/admin/courses/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-csrf-protection': '1' },
      body: JSON.stringify({ is_published: !c.is_published }),
    });
    setToggling(null);
    if (res.ok) setCourses((prev) => prev.map((x) => x.id === c.id ? { ...x, is_published: !x.is_published } : x));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/admin/courses/${deleteTarget.id}`, {
      method: 'DELETE',
      headers: { 'x-csrf-protection': '1' },
    });
    setCourses((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    setDel(null);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="text-gray-400 text-sm animate-pulse">Loading courses…</div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Courses</h1>
          <p className="mt-2 text-gray-400">{courses.length} total · {courses.filter((c) => c.is_published).length} published</p>
        </div>
        <button onClick={() => router.push('/admin/courses/new')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-sm font-medium transition shadow-lg shadow-indigo-500/30">
          <Plus size={16} /> New Course
        </button>
      </div>

      <div className="flex items-center gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search courses…"
          className="rounded-lg bg-gray-800 border border-gray-700 px-4 py-2.5 text-white text-sm outline-none focus:border-indigo-500/60 flex-1 max-w-sm" />
        <div className="flex gap-1 p-1 bg-gray-900/50 rounded-xl border border-gray-800">
          {(['all', 'published', 'draft'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium capitalize transition ${filter === f ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((c) => (
          <div key={c.id}
            className="group rounded-2xl border border-gray-800 bg-gray-900/60 overflow-hidden hover:border-indigo-500/30 transition cursor-pointer"
            onClick={() => router.push(`/admin/courses/${c.id}/edit`)}
          >
            {/* Thumbnail */}
            <div className="relative h-40 overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${c.gradient_from || '#6366f1'}, ${c.gradient_to || '#8b5cf6'})` }}>
              {c.thumbnail ? (
                <img src={c.thumbnail} alt={c.title}
                  className="w-full h-full object-cover opacity-80"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <BookOpen size={40} className="text-white/30" />
                </div>
              )}
              <div className="absolute top-3 right-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border
                  ${c.is_published ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                  {c.is_published ? 'Published' : 'Draft'}
                </span>
              </div>
            </div>

            <div className="p-5 space-y-3">
              <div>
                <h3 className="text-white font-bold text-sm leading-tight">{c.title}</h3>
                <p className="text-gray-500 text-xs mt-1 line-clamp-2">{c.short_description}</p>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><BookOpen size={11} />{(c.modules ?? []).length} modules</span>
                <span>·</span>
                <span>{c.enrolled_count ?? 0} enrolled</span>
                <span>·</span>
                <span className="text-emerald-400">{fmt(c.total_revenue_kobo ?? 0)}</span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={(e) => { e.stopPropagation(); router.push(`/admin/courses/${c.id}/edit`); }}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 transition">
                  <Pencil size={12} /> Edit
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleTogglePublish(c); }}
                  disabled={toggling === c.id}
                  className={`flex-1 flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition disabled:opacity-50
                    ${c.is_published ? 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10' : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'}`}>
                  {toggling === c.id ? '…' : c.is_published ? <><EyeOff size={12} /> Unpublish</> : <><Eye size={12} /> Publish</>}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setDel(c); }}
                  className="flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-500">
            <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">{search ? 'No courses match your search.' : 'No courses yet. Create your first one!'}</p>
          </div>
        )}
      </div>

      <Modal isOpen={!!deleteTarget} onClose={() => setDel(null)} title="Delete Course"
        footer={
          <>
            <button onClick={() => setDel(null)} className="flex-1 rounded-lg border border-gray-600 px-4 py-2 text-gray-300 hover:bg-gray-800 transition">Cancel</button>
            <button onClick={handleDelete} className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2 font-medium text-white transition">Delete</button>
          </>
        }>
        <p className="text-gray-300 text-sm">Delete <span className="font-bold text-white">{deleteTarget?.title}</span>? All modules and lessons inside will be removed. This cannot be undone.</p>
      </Modal>
    </div>
  );
}
