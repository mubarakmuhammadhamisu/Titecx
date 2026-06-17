'use client';

import React, { useState } from 'react';

import type { Module, Lesson, LessonType, VideoProvider } from '@/lib/Course';
import { Plus, Trash2, ChevronDown, ChevronUp, GripVertical, Video, BookOpen, HelpCircle, Code } from 'lucide-react';

const inp  = 'w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-white text-sm outline-none focus:border-indigo-500/60 transition';
const label = 'block text-xs text-gray-400 mb-1.5';

const LESSON_ICONS: Record<LessonType, React.ReactNode> = {
  video:    <Video    size={14} className="text-blue-400" />,
  reading:  <BookOpen size={14} className="text-green-400" />,
  quiz:     <HelpCircle size={14} className="text-amber-400" />,
  practice: <Code    size={14} className="text-purple-400" />,
};

const VIDEO_PROVIDERS: { value: VideoProvider; label: string }[] = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'gdrive',  label: 'Google Drive' },
  { value: 'bunny',   label: 'Bunny.net' },
  { value: 'gumlet',  label: 'Gumlet' },
];

function LessonEditor({ lesson, onUpdate, onDelete }: {
  lesson: Lesson;
  onUpdate: (l: Lesson) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const content = lesson.content as any;

  const setContent = (patch: Record<string, any>) =>
    onUpdate({ ...lesson, content: { ...content, ...patch } });

  const setType = (t: LessonType) => {
    const defaults: Record<LessonType, any> = {
      reading:  { markdownBody: '' },
      video:    { videoUrl: '', videoProvider: 'youtube', duration: '' },
      quiz:     { questions: [] },
      practice: { language: 'html', instructions: '', starter_code: '', example_output: '', test_cases: [] },
    };
    onUpdate({ ...lesson, type: t, status: lesson.status ?? 'locked', content: defaults[t] });
  };

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800/50">
      <div className="flex items-center gap-3 px-4 py-3">
        <GripVertical size={16} className="text-gray-600 shrink-0 cursor-grab" />
        <span className="shrink-0">{LESSON_ICONS[lesson.type]}</span>
        <input
          value={lesson.title}
          onChange={(e) => onUpdate({ ...lesson, title: e.target.value })}
          className="flex-1 bg-transparent text-white text-sm font-medium outline-none placeholder-gray-600"
          placeholder="Lesson title…"
        />
        <button onClick={() => setOpen(!open)}
          className="shrink-0 text-gray-500 hover:text-gray-300 transition">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        <button onClick={onDelete}
          className="shrink-0 text-gray-600 hover:text-red-400 transition">
          <Trash2 size={14} />
        </button>
      </div>

      {open && (
        <div className="border-t border-gray-700 px-4 py-4 space-y-4">
          {/* Type selector */}
          <div>
            <label className={label}>Lesson Type</label>
            <div className="flex gap-2">
              {(['reading', 'video', 'quiz', 'practice'] as LessonType[]).map((t) => (
                <button key={t} onClick={() => setType(t)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition capitalize
                    ${lesson.type === t ? 'border-indigo-500/50 bg-indigo-500/15 text-indigo-300' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}>
                  {LESSON_ICONS[t]}{t}
                </button>
              ))}
            </div>
          </div>

          {/* Reading */}
          {lesson.type === 'reading' && (
            <div>
              <label className={label}>Content (Markdown supported)</label>
              <textarea value={content.markdownBody ?? ''} onChange={(e) => setContent({ markdownBody: e.target.value })}
                rows={10} placeholder="## Introduction&#10;&#10;Write your lesson content here. Use **bold**, *italic*, and ```code blocks```."
                className={`${inp} resize-y font-mono text-xs`} />
            </div>
          )}

          {/* Video */}
          {lesson.type === 'video' && (
            <>
              <div>
                <label className={label}>Video Provider</label>
                <select value={content.videoProvider ?? 'youtube'} onChange={(e) => setContent({ videoProvider: e.target.value })} className={inp}>
                  {VIDEO_PROVIDERS.map(({ value, label: l }) => <option key={value} value={value}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className={label}>Video URL / ID</label>
                <input value={content.videoUrl ?? ''} onChange={(e) => setContent({ videoUrl: e.target.value })}
                  placeholder="Paste URL or embed ID" className={inp} />
              </div>
              <div>
                <label className={label}>Duration</label>
                <input value={content.duration ?? ''} onChange={(e) => setContent({ duration: e.target.value })}
                  placeholder="e.g. 12:45" className={inp} />
              </div>
            </>
          )}

          {/* Quiz */}
          {lesson.type === 'quiz' && (
            <QuizEditor questions={content.questions ?? []} onChange={(q) => setContent({ questions: q })} />
          )}

          {/* Practice */}
          {lesson.type === 'practice' && (
            <PracticeEditor content={content} onChange={setContent} />
          )}
        </div>
      )}
    </div>
  );
}

function QuizEditor({ questions, onChange }: { questions: any[]; onChange: (q: any[]) => void }) {
  const addQ = () => onChange([...questions, { id: crypto.randomUUID(), question: '', options: ['', '', '', ''], correctAnswer: 0, points: 10 }]);
  const updateQ = (i: number, patch: any) => onChange(questions.map((q, idx) => idx === i ? { ...q, ...patch } : q));
  const deleteQ = (i: number) => onChange(questions.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-4">
      {questions.map((q, i) => (
        <div key={q.id} className="rounded-lg border border-gray-600 bg-gray-800/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Question {i + 1}</span>
            <button onClick={() => deleteQ(i)} className="text-gray-600 hover:text-red-400 transition"><Trash2 size={13} /></button>
          </div>
          <input value={q.question} onChange={(e) => updateQ(i, { question: e.target.value })}
            placeholder="Enter question…" className={inp} />
          <div className="space-y-2">
            {(q.options ?? ['','','','']).map((opt: string, oi: number) => (
              <div key={oi} className="flex items-center gap-2">
                <input type="radio" name={`correct-${q.id}`} checked={q.correctAnswer === oi}
                  onChange={() => updateQ(i, { correctAnswer: oi })}
                  className="accent-indigo-500 shrink-0" />
                <input value={opt} onChange={(e) => {
                  const opts = [...q.options]; opts[oi] = e.target.value;
                  updateQ(i, { options: opts });
                }} placeholder={`Option ${oi + 1}`} className={`${inp} text-xs`} />
              </div>
            ))}
          </div>
          <div>
            <label className={label}>Points for this question</label>
            <input type="number" min="1" value={q.points} onChange={(e) => updateQ(i, { points: Number(e.target.value) })}
              className={`${inp} w-24`} />
          </div>
        </div>
      ))}
      <button onClick={addQ}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-xs transition w-full justify-center">
        <Plus size={14} /> Add Question
      </button>
    </div>
  );
}

function PracticeEditor({ content, onChange }: { content: any; onChange: (p: any) => void }) {
  const testCases: any[] = content.test_cases ?? [];
  const addTestCase = () => onChange({ test_cases: [...testCases, { input: '', expected_output: '', hidden: false }] });
  const updateTC = (i: number, patch: any) => onChange({ test_cases: testCases.map((t, idx) => idx === i ? { ...t, ...patch } : t) });
  const deleteTC = (i: number) => onChange({ test_cases: testCases.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-4">
      <div>
        <label className={label}>Language</label>
        <select value={content.language ?? 'html'} onChange={(e) => onChange({ language: e.target.value })} className={inp}>
          <option value="html">HTML / CSS / JS</option>
          <option value="python">Python</option>
          <option value="c">C</option>
        </select>
      </div>
      <div>
        <label className={label}>Instructions (Markdown)</label>
        <textarea value={content.instructions ?? ''} onChange={(e) => onChange({ instructions: e.target.value })}
          rows={4} placeholder="Describe what the student must build or solve…" className={`${inp} resize-y`} />
      </div>
      <div>
        <label className={label}>Starter Code</label>
        <textarea value={content.starter_code ?? ''} onChange={(e) => onChange({ starter_code: e.target.value })}
          rows={5} placeholder="// Starter code shown to student" className={`${inp} resize-y font-mono text-xs`} />
      </div>
      <div>
        <label className={label}>Example Output (shown to student)</label>
        <textarea value={content.example_output ?? ''} onChange={(e) => onChange({ example_output: e.target.value })}
          rows={3} placeholder="What the output should look like…" className={`${inp} resize-y font-mono text-xs`} />
      </div>
      {content.language !== 'html' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-400 font-medium">Test Cases</label>
            <button onClick={addTestCase}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 transition">
              <Plus size={12} /> Add Case
            </button>
          </div>
          {testCases.map((tc, i) => (
            <div key={i} className="rounded-lg border border-gray-600 bg-gray-800/30 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Case {i + 1}</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
                    <input type="checkbox" checked={tc.hidden} onChange={(e) => updateTC(i, { hidden: e.target.checked })} className="accent-purple-500" />
                    Hidden
                  </label>
                  <button onClick={() => deleteTC(i)} className="text-gray-600 hover:text-red-400 transition"><Trash2 size={12} /></button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={label}>Input</label>
                  <textarea value={tc.input} onChange={(e) => updateTC(i, { input: e.target.value })}
                    rows={2} placeholder="stdin input…" className={`${inp} font-mono text-xs resize-none`} />
                </div>
                <div>
                  <label className={label}>Expected Output</label>
                  <textarea value={tc.expected_output} onChange={(e) => updateTC(i, { expected_output: e.target.value })}
                    rows={2} placeholder="expected stdout…" className={`${inp} font-mono text-xs resize-none`} />
                </div>
              </div>
              {tc.hidden && <p className="text-xs text-purple-400">🔒 Hidden — student won't see this test case</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CurriculumBuilder({ modules, onChange }: {
  modules: Module[];
  onChange: (m: Module[]) => void;
}) {
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());

  const toggleModule = (id: string) => setOpenModules((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const addModule = () => {
    const m: Module = { id: crypto.randomUUID(), title: 'New Module', lessons: [] };
    onChange([...modules, m]);
    setOpenModules((s) => new Set([...s, m.id]));
  };

  const updateModule = (id: string, patch: Partial<Module>) =>
    onChange(modules.map((m) => m.id === id ? { ...m, ...patch } : m));

  const deleteModule = (id: string) =>
    onChange(modules.filter((m) => m.id !== id));

  const addLesson = (moduleId: string) => {
    const l: Lesson = { id: crypto.randomUUID(), title: 'New Lesson', type: 'reading', status: 'locked', content: { markdownBody: '' } };
    updateModule(moduleId, { lessons: [...(modules.find((m) => m.id === moduleId)?.lessons ?? []), l] });
  };

  const updateLesson = (moduleId: string, lessonId: string, lesson: Lesson) =>
    updateModule(moduleId, { lessons: modules.find((m) => m.id === moduleId)!.lessons.map((l) => l.id === lessonId ? lesson : l) });

  const deleteLesson = (moduleId: string, lessonId: string) =>
    updateModule(moduleId, { lessons: modules.find((m) => m.id === moduleId)!.lessons.filter((l) => l.id !== lessonId) });

  return (
    <div className="space-y-4">
      {modules.map((module, mi) => (
        <div key={module.id} className="rounded-2xl border border-gray-700 bg-gray-900/50 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 bg-gray-800/50">
            <GripVertical size={18} className="text-gray-600 shrink-0 cursor-grab" />
            <span className="text-xs text-gray-500 font-bold shrink-0">M{mi + 1}</span>
            <input
              value={module.title}
              onChange={(e) => updateModule(module.id, { title: e.target.value })}
              className="flex-1 bg-transparent text-white font-semibold outline-none placeholder-gray-600"
              placeholder="Module title…"
            />
            <span className="text-xs text-gray-500 shrink-0">{module.lessons.length} lesson{module.lessons.length !== 1 ? 's' : ''}</span>
            <button onClick={() => toggleModule(module.id)} className="text-gray-500 hover:text-gray-300 transition shrink-0">
              {openModules.has(module.id) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            <button onClick={() => deleteModule(module.id)} className="text-gray-600 hover:text-red-400 transition shrink-0">
              <Trash2 size={16} />
            </button>
          </div>

          {openModules.has(module.id) && (
            <div className="p-4 space-y-3 border-t border-gray-700">
              {module.lessons.map((lesson) => (
                <LessonEditor key={lesson.id} lesson={lesson}
                  onUpdate={(l) => updateLesson(module.id, lesson.id, l)}
                  onDelete={() => deleteLesson(module.id, lesson.id)} />
              ))}
              <button onClick={() => addLesson(module.id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 text-xs transition w-full justify-center">
                <Plus size={14} /> Add Lesson
              </button>
            </div>
          )}
        </div>
      ))}

      <button onClick={addModule}
        className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-dashed border-gray-600 text-gray-400 hover:border-indigo-500/50 hover:text-indigo-400 text-sm transition w-full justify-center">
        <Plus size={16} /> Add Module
      </button>
    </div>
  );
}
