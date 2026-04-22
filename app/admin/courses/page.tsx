'use client';

import React, { useState, useMemo } from 'react';
import { AdminTable, Column } from '@/components/admin/shared/AdminTable';
import { FilterBar } from '@/components/admin/shared/FilterBar';
import { Modal } from '@/components/admin/shared/Modal';
import { mockCourses, Course } from '@/components/admin/mock-data';
import { useRouter } from 'next/navigation';
import {
  ToggleLeft, ToggleRight, BookOpen, Plus, Trash2,
  ArrowLeft, Save, Eye, EyeOff, GripVertical,
  Video, FileText, HelpCircle, X, ChevronDown, ChevronUp, Check,
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

// ── Lesson types (mirrors lib/Course.ts but self-contained for mock) ──────────
type LessonType = 'video' | 'reading' | 'quiz';

interface VideoContent   { videoUrl: string; duration: string; }
interface ReadingContent { markdownBody: string; }
interface QuizQuestion   { id: string; question: string; options: string[]; correctAnswer: number; points: number; }
interface QuizContent    { questions: QuizQuestion[]; }

interface DraftLesson {
  id: string;
  title: string;
  type: LessonType;
  content: VideoContent | ReadingContent | QuizContent;
  expanded: boolean;
}

interface DraftModule {
  id: string;
  title: string;
  lessons: DraftLesson[];
  collapsed: boolean;
}

interface CourseForm {
  title: string;
  description: string;
  instructor: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  price: string;
  published: boolean;
  modules: DraftModule[];
}

const BLANK_FORM: CourseForm = {
  title: '',
  description: '',
  instructor: '',
  level: 'Beginner',
  price: '',
  published: false,
  modules: [],
};

function defaultContent(type: LessonType): VideoContent | ReadingContent | QuizContent {
  if (type === 'video')   return { videoUrl: '', duration: '' };
  if (type === 'reading') return { markdownBody: '' };
  return { questions: [{ id: `q-${Date.now()}`, question: '', options: ['', '', '', ''], correctAnswer: 0, points: 10 }] };
}

const inputCls = 'w-full rounded-lg bg-gray-800 border border-indigo-500/20 px-3 py-2.5 text-white placeholder:text-gray-500 outline-none focus:border-indigo-500/60 transition text-sm';

// ── Main component ────────────────────────────────────────────────────────────
export default function CoursesPage() {
  const router = useRouter();
  const [pageMode, setPageMode] = useState<'list' | 'create'>('list');

  // ── List-mode state ───────────────────────────────────────────────────────
  const [courses, setCourses] = useState<Course[]>(mockCourses);
  const [searchTerm, setSearchTerm] = useState('');
  const [publishedFilter, setPublishedFilter] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [toggledCourses, setToggledCourses] = useState<Record<string, boolean>>({});
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);

  // ── Create-mode state ─────────────────────────────────────────────────────
  const [form, setForm] = useState<CourseForm>(BLANK_FORM);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ── List helpers ──────────────────────────────────────────────────────────
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
      const isPublished = toggledCourses[course.id] !== undefined ? toggledCourses[course.id] : course.published;
      const matchesPublished =
        publishedFilter === '' ? true :
        publishedFilter === 'published' ? isPublished : !isPublished;
      return matchesSearch && matchesPublished;
    });
  }, [courses, searchTerm, publishedFilter, toggledCourses]);

  const handleToggle = (courseId: string) =>
    setToggledCourses(prev => ({ ...prev, [courseId]: !(prev[courseId] ?? courses.find(c => c.id === courseId)?.published) }));

  const handleDeleteCourse = () => {
    if (!deleteTarget) return;
    setCourses(prev => prev.filter(c => c.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const handleRowClick = (course: Course) => router.push(`/admin/courses/${course.id}`);

  // ── Create helpers ────────────────────────────────────────────────────────
  const totalLessons = form.modules.reduce((acc, m) => acc + m.lessons.length, 0);

  const addModule = () => {
    setForm(f => ({
      ...f,
      modules: [...f.modules, {
        id: `mod-${Date.now()}`,
        title: `Module ${f.modules.length + 1}`,
        lessons: [],
        collapsed: false,
      }],
    }));
  };

  const removeModule = (mi: number) =>
    setForm(f => ({ ...f, modules: f.modules.filter((_, i) => i !== mi) }));

  const updateModuleTitle = (mi: number, title: string) =>
    setForm(f => { const m = [...f.modules]; m[mi] = { ...m[mi], title }; return { ...f, modules: m }; });

  const toggleModuleCollapse = (mi: number) =>
    setForm(f => { const m = [...f.modules]; m[mi] = { ...m[mi], collapsed: !m[mi].collapsed }; return { ...f, modules: m }; });

  const addLesson = (mi: number) => {
    setForm(f => {
      const modules = [...f.modules];
      modules[mi].lessons.push({
        id: `les-${Date.now()}`,
        title: 'New Lesson',
        type: 'video',
        content: { videoUrl: '', duration: '' },
        expanded: true,
      });
      return { ...f, modules };
    });
  };

  const removeLesson = (mi: number, li: number) =>
    setForm(f => {
      const modules = [...f.modules];
      modules[mi].lessons = modules[mi].lessons.filter((_, i) => i !== li);
      return { ...f, modules };
    });

  const updateLesson = (mi: number, li: number, patch: Partial<DraftLesson>) =>
    setForm(f => {
      const modules = [...f.modules];
      modules[mi].lessons[li] = { ...modules[mi].lessons[li], ...patch };
      return { ...f, modules };
    });

  const changeLessonType = (mi: number, li: number, type: LessonType) =>
    updateLesson(mi, li, { type, content: defaultContent(type) });

  const updateVideoContent = (mi: number, li: number, patch: Partial<VideoContent>) => {
    const prev = form.modules[mi].lessons[li].content as VideoContent;
    updateLesson(mi, li, { content: { ...prev, ...patch } });
  };

  const updateReadingContent = (mi: number, li: number, markdownBody: string) =>
    updateLesson(mi, li, { content: { markdownBody } });

  const updateQuizQuestion = (mi: number, li: number, qi: number, patch: Partial<QuizQuestion>) => {
    const content = { ...(form.modules[mi].lessons[li].content as QuizContent) };
    content.questions = content.questions.map((q, i) => i === qi ? { ...q, ...patch } : q);
    updateLesson(mi, li, { content });
  };

  const addQuestion = (mi: number, li: number) => {
    const content = { ...(form.modules[mi].lessons[li].content as QuizContent) };
    content.questions = [...content.questions, { id: `q-${Date.now()}`, question: '', options: ['', '', '', ''], correctAnswer: 0, points: 10 }];
    updateLesson(mi, li, { content });
  };

  const removeQuestion = (mi: number, li: number, qi: number) => {
    const content = { ...(form.modules[mi].lessons[li].content as QuizContent) };
    content.questions = content.questions.filter((_, i) => i !== qi);
    updateLesson(mi, li, { content });
  };

  // Drag and drop — modules
  const onModuleDragEnd = (result: any) => {
    if (!result.destination) return;
    const modules = [...form.modules];
    const [moved] = modules.splice(result.source.index, 1);
    modules.splice(result.destination.index, 0, moved);
    setForm(f => ({ ...f, modules }));
  };

  // Drag and drop — lessons within a module
  const onLessonDragEnd = (mi: number, result: any) => {
    if (!result.destination) return;
    const modules = [...form.modules];
    const lessons = [...modules[mi].lessons];
    const [moved] = lessons.splice(result.source.index, 1);
    lessons.splice(result.destination.index, 0, moved);
    modules[mi] = { ...modules[mi], lessons };
    setForm(f => ({ ...f, modules }));
  };

  const handleSaveCourse = () => {
    const errors: string[] = [];
    if (!form.title.trim())       errors.push('Course title is required.');
    if (!form.description.trim()) errors.push('Description is required.');
    if (!form.instructor.trim())  errors.push('Instructor name is required.');
    if (!form.price.trim())       errors.push('Price is required.');
    if (form.modules.length === 0) errors.push('Add at least one module.');

    if (errors.length > 0) { setFormErrors(errors); return; }
    setFormErrors([]);

    const newCourse: Course = {
      id: `new-${Date.now()}`,
      title: form.title,
      description: form.description,
      price: Number(form.price.replace(/[^0-9]/g, '')) || 0,
      enrolledCount: 0,
      totalRevenue: 0,
      published: form.published,
      lessonsCount: totalLessons,
      completionRate: 0,
    };

    console.log('New course (full):', JSON.stringify({ ...newCourse, modules: form.modules }, null, 2));

    setCourses(prev => [newCourse, ...prev]);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setPageMode('list');
      setForm(BLANK_FORM);
    }, 1800);
  };

  // ── Shared table columns ──────────────────────────────────────────────────
  const courseColumns: Column<Course>[] = [
    { key: 'title', label: 'Course Title', sortable: true },
    { key: 'price', label: 'Price', sortable: true, render: (v) => `₦${v.toLocaleString()}` },
    { key: 'enrolledCount', label: 'Enrolled', sortable: true },
    { key: 'totalRevenue', label: 'Revenue', sortable: true, render: (v) => `₦${v.toLocaleString()}` },
    {
      key: 'completionRate', label: 'Completion', sortable: true,
      render: (v) => (
        <div className="flex items-center gap-2">
          <div className="w-20 h-2 rounded-full bg-gray-700">
            <div className="h-full rounded-full bg-purple-500" style={{ width: `${v}%` }} />
          </div>
          <span className="text-xs">{v}%</span>
        </div>
      ),
    },
    {
      key: 'id', label: 'Status',
      render: (_, course) => {
        const isPublished = toggledCourses[course.id] ?? course.published;
        return (
          <button onClick={(e) => { e.stopPropagation(); handleToggle(course.id); }} className="flex items-center gap-2 text-sm transition">
            {isPublished ? <><ToggleRight size={18} className="text-green-400" /><span className="text-green-400">Published</span></> : <><ToggleLeft size={18} className="text-gray-500" /><span className="text-gray-500">Draft</span></>}
          </button>
        );
      },
    },
    {
      key: 'id', label: 'Actions',
      render: (_, course) => (
        <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(course); }} className="flex items-center gap-1 text-xs px-3 py-1 rounded-lg border border-red-500/30 text-red-400 hover:border-red-500/60 hover:bg-red-500/10 transition">
          <Trash2 size={13} /> Delete
        </button>
      ),
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // CREATE MODE
  // ─────────────────────────────────────────────────────────────────────────
  if (pageMode === 'create') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={() => { setPageMode('list'); setForm(BLANK_FORM); setFormErrors([]); }} className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition text-sm">
            <ArrowLeft size={18} /> Back to Courses
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setForm(f => ({ ...f, published: !f.published }))}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all ${form.published ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' : 'bg-gray-700/40 border-gray-600 text-gray-400'}`}
            >
              {form.published ? <><Eye size={14} /> Published</> : <><EyeOff size={14} /> Draft</>}
            </button>
            <button onClick={handleSaveCourse} className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-medium text-sm transition shadow-lg shadow-indigo-500/30">
              <Save size={16} /> {form.published ? 'Publish Course' : 'Save Draft'}
            </button>
          </div>
        </div>

        {/* Success banner */}
        {saveSuccess && (
          <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <Check size={18} />
            <span className="text-sm font-medium">Course {form.published ? 'published' : 'saved as draft'}! Returning to list…</span>
          </div>
        )}

        {/* Error banner */}
        {formErrors.length > 0 && (
          <div className="px-5 py-4 rounded-xl bg-red-500/10 border border-red-500/20 space-y-1">
            {formErrors.map((e, i) => <p key={i} className="text-sm text-red-400">• {e}</p>)}
          </div>
        )}

        {/* ── SECTION 1: Basic Info ── */}
        <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-br from-gray-900/80 to-gray-800/40 p-6 backdrop-blur-md space-y-4">
          <h2 className="text-lg font-bold text-white">Basic Information</h2>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Course Title *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Advanced React.js Mastery" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Description *</label>
            <textarea rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe what students will learn..." className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Instructor *</label>
              <input value={form.instructor} onChange={e => setForm(f => ({ ...f, instructor: e.target.value }))} placeholder="Instructor name" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Level</label>
              <select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value as any }))} className={inputCls}>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Price (₦) *</label>
            <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="15000" className={inputCls} />
          </div>
        </div>

        {/* ── SECTION 2: Modules & Lessons ── */}
        <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-br from-gray-900/80 to-gray-800/40 p-6 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Course Content</h2>
              <p className="text-xs text-gray-400 mt-1">{totalLessons} lesson{totalLessons !== 1 ? 's' : ''} total</p>
            </div>
            <button onClick={addModule} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-sm font-medium transition">
              <Plus size={16} /> Add Module
            </button>
          </div>

          {form.modules.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">No modules yet. Add one to get started.</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={onModuleDragEnd}>
              <Droppable droppableId="modules">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                    {form.modules.map((module, mi) => (
                      <Draggable key={module.id} draggableId={module.id} index={mi}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="rounded-lg border border-gray-700 bg-gray-800/50 overflow-hidden"
                          >
                            {/* Module header */}
                            <div className="flex items-center gap-3 p-4 bg-gray-800/80">
                              <GripVertical size={16} className="text-gray-500 cursor-grab" {...provided.dragHandleProps} />
                              <input
                                value={module.title}
                                onChange={e => updateModuleTitle(mi, e.target.value)}
                                className="flex-1 bg-transparent text-white font-medium outline-none text-sm"
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => toggleModuleCollapse(mi)}
                                  className="p-1 text-gray-400 hover:text-gray-200 transition"
                                >
                                  {module.collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                                </button>
                                <button
                                  onClick={() => removeModule(mi)}
                                  className="p-1 text-red-400 hover:text-red-300 transition"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </div>

                            {/* Module lessons */}
                            {!module.collapsed && (
                              <div className="border-t border-gray-700 p-4 space-y-3 bg-gray-900/50">
                                <DragDropContext onDragEnd={(result) => onLessonDragEnd(mi, result)}>
                                  <Droppable droppableId={`lessons-${module.id}`}>
                                    {(provided) => (
                                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                                        {module.lessons.map((lesson, li) => (
                                          <Draggable key={lesson.id} draggableId={lesson.id} index={li}>
                                            {(provided) => (
                                              <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className="rounded-lg bg-gray-800 border border-gray-700 p-3 space-y-2"
                                              >
                                                <div className="flex items-center gap-2">
                                                  <GripVertical size={14} className="text-gray-500 cursor-grab" {...provided.dragHandleProps} />
                                                  <input
                                                    value={lesson.title}
                                                    onChange={e => updateLesson(mi, li, { title: e.target.value })}
                                                    placeholder="Lesson title"
                                                    className="flex-1 bg-gray-700 text-white outline-none rounded px-2 py-1 text-xs"
                                                  />
                                                  <select
                                                    value={lesson.type}
                                                    onChange={e => changeLessonType(mi, li, e.target.value as LessonType)}
                                                    className="bg-gray-700 text-gray-300 outline-none rounded px-2 py-1 text-xs"
                                                  >
                                                    <option value="video">Video</option>
                                                    <option value="reading">Reading</option>
                                                    <option value="quiz">Quiz</option>
                                                  </select>
                                                  <button
                                                    onClick={() => updateLesson(mi, li, { expanded: !lesson.expanded })}
                                                    className="p-1 text-gray-400 hover:text-gray-200"
                                                  >
                                                    {lesson.expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                  </button>
                                                  <button
                                                    onClick={() => removeLesson(mi, li)}
                                                    className="p-1 text-red-400 hover:text-red-300"
                                                  >
                                                    <X size={14} />
                                                  </button>
                                                </div>

                                                {/* Lesson content editor */}
                                                {lesson.expanded && (
                                                  <div className="ml-5 pt-2 border-t border-gray-700 space-y-2">
                                                    {lesson.type === 'video' && (
                                                      <>
                                                        <input
                                                          value={(lesson.content as VideoContent).videoUrl}
                                                          onChange={e => updateVideoContent(mi, li, { videoUrl: e.target.value })}
                                                          placeholder="Video URL (e.g. https://..."
                                                          className="w-full bg-gray-700 text-white outline-none rounded px-2 py-1 text-xs"
                                                        />
                                                        <input
                                                          value={(lesson.content as VideoContent).duration}
                                                          onChange={e => updateVideoContent(mi, li, { duration: e.target.value })}
                                                          placeholder="Duration (e.g. 15:30)"
                                                          className="w-full bg-gray-700 text-white outline-none rounded px-2 py-1 text-xs"
                                                        />
                                                      </>
                                                    )}
                                                    {lesson.type === 'reading' && (
                                                      <textarea
                                                        value={(lesson.content as ReadingContent).markdownBody}
                                                        onChange={e => updateReadingContent(mi, li, e.target.value)}
                                                        placeholder="Markdown content..."
                                                        rows={3}
                                                        className="w-full bg-gray-700 text-white outline-none rounded px-2 py-1 text-xs"
                                                      />
                                                    )}
                                                    {lesson.type === 'quiz' && (
                                                      <div className="space-y-2">
                                                        {(lesson.content as QuizContent).questions.map((q, qi) => (
                                                          <div key={q.id} className="bg-gray-700/50 rounded p-2 space-y-1 text-xs">
                                                            <input
                                                              value={q.question}
                                                              onChange={e => updateQuizQuestion(mi, li, qi, { question: e.target.value })}
                                                              placeholder="Question"
                                                              className="w-full bg-gray-700 text-white outline-none rounded px-2 py-1"
                                                            />
                                                            {q.options.map((opt, oi) => (
                                                              <input
                                                                key={oi}
                                                                value={opt}
                                                                onChange={e => {
                                                                  const newOpts = [...q.options];
                                                                  newOpts[oi] = e.target.value;
                                                                  updateQuizQuestion(mi, li, qi, { options: newOpts });
                                                                }}
                                                                placeholder={`Option ${oi + 1}`}
                                                                className="w-full bg-gray-700 text-white outline-none rounded px-2 py-1"
                                                              />
                                                            ))}
                                                            <div className="flex gap-1">
                                                              <select
                                                                value={q.correctAnswer}
                                                                onChange={e => updateQuizQuestion(mi, li, qi, { correctAnswer: Number(e.target.value) })}
                                                                className="flex-1 bg-gray-700 text-gray-300 outline-none rounded px-2 py-1"
                                                              >
                                                                <option value={0}>Correct: Option 1</option>
                                                                <option value={1}>Correct: Option 2</option>
                                                                <option value={2}>Correct: Option 3</option>
                                                                <option value={3}>Correct: Option 4</option>
                                                              </select>
                                                              <button
                                                                onClick={() => removeQuestion(mi, li, qi)}
                                                                className="px-2 py-1 text-red-400 hover:text-red-300 bg-red-500/10 rounded"
                                                              >
                                                                <X size={12} />
                                                              </button>
                                                            </div>
                                                          </div>
                                                        ))}
                                                        <button
                                                          onClick={() => addQuestion(mi, li)}
                                                          className="w-full px-2 py-1 text-xs text-indigo-400 border border-indigo-500/30 rounded hover:bg-indigo-500/10"
                                                        >
                                                          + Add Question
                                                        </button>
                                                      </div>
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </Draggable>
                                        ))}
                                        {provided.placeholder}
                                      </div>
                                    )}
                                  </Droppable>
                                </DragDropContext>
                                <button
                                  onClick={() => addLesson(mi)}
                                  className="w-full px-3 py-2 text-xs text-indigo-400 border border-indigo-500/30 rounded hover:bg-indigo-500/10 transition"
                                >
                                  + Add Lesson
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LIST MODE
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Courses</h1>
          <p className="mt-2 text-gray-400">Manage course content, pricing, and enrollment.</p>
        </div>
        <button
          onClick={() => setPageMode('create')}
          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-medium text-sm transition shadow-lg shadow-indigo-500/30"
        >
          <Plus size={16} /> New Course
        </button>
      </div>

      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filters={{
          status: {
            label: 'Status',
            value: publishedFilter,
            options: [
              { label: 'Published', value: 'published' },
              { label: 'Draft', value: 'draft' },
            ],
            onChange: setPublishedFilter,
          },
        }}
        placeholder="Search by course name..."
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Showing {filteredCourses.length} of {courses.length} courses
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-500/50'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-indigo-500/30'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-500/50'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-indigo-500/30'
              }`}
            >
              Grid
            </button>
          </div>
        </div>

        {viewMode === 'table' ? (
          <AdminTable
            columns={courseColumns}
            data={filteredCourses}
            onRowClick={handleRowClick}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCourses.map((course) => {
              const isPublished =
                toggledCourses[course.id] !== undefined
                  ? toggledCourses[course.id]
                  : course.published;
              return (
                <div
                  key={course.id}
                  onClick={() => handleRowClick(course)}
                  className="group rounded-xl border border-indigo-500/20 bg-gradient-to-br from-gray-900/80 to-gray-800/40 p-6 backdrop-blur-md cursor-pointer transition-all duration-300 hover:border-indigo-400/60 hover:shadow-lg hover:shadow-indigo-500/20"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center border border-indigo-500/30 group-hover:scale-110 transition-transform duration-300">
                      <BookOpen size={24} className="text-indigo-400" />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggle(course.id);
                      }}
                      className="flex items-center gap-1 text-xs transition"
                    >
                      {isPublished ? (
                        <>
                          <ToggleRight size={16} className="text-emerald-400" />
                          <span className="text-emerald-400 text-xs">Published</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft size={16} className="text-gray-500" />
                          <span className="text-gray-500 text-xs">Draft</span>
                        </>
                      )}
                    </button>
                  </div>

                  <h3 className="font-semibold text-white line-clamp-2 mb-2">
                    {course.title}
                  </h3>
                  <p className="text-xs text-gray-400 line-clamp-2 mb-4">
                    {course.description}
                  </p>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center p-2 rounded-lg bg-gray-800/30">
                      <span className="text-gray-400">Price</span>
                      <span className="font-semibold text-indigo-400">
                        ₦{course.price.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-gray-800/30">
                      <span className="text-gray-400">Enrolled</span>
                      <span className="font-semibold text-emerald-400">
                        {course.enrolledCount}
                      </span>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-400 text-xs">Completion</span>
                        <span className="text-xs text-gray-300">
                          {course.completionRate}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-gray-700">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                          style={{ width: `${course.completionRate}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action row — stop propagation so card click (go to detail) doesn't fire */}
                  <div className="mt-4 pt-4 border-t border-indigo-500/10" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setDeleteTarget(course)}
                      className="w-full flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg border border-red-500/30 text-red-400 hover:border-red-500/60 hover:bg-red-500/10 transition"
                    >
                      <Trash2 size={13} /> Delete Course
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Course Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Course"
        footer={
          <>
            <button
              onClick={() => setDeleteTarget(null)}
              className="flex-1 rounded-lg border border-gray-600 px-4 py-2 font-medium text-gray-300 hover:bg-gray-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteCourse}
              className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2 font-medium text-white transition"
            >
              Delete
            </button>
          </>
        }
      >
        <p className="text-gray-300 text-sm">
          Are you sure you want to delete <span className="font-bold text-white">{deleteTarget?.title}</span>? This will remove the course and cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
