'use client';

// =============================================================================
// components/CoursePlayer/QuizPlayer.tsx
//
// Self-contained quiz player for TITECX lesson view.
// Matches the existing dark-theme aesthetic (GlowCard, indigo/purple palette).
//
// PROPS:
//   content       — QuizContent object (see lib/Course.ts for shape)
//   title         — lesson title shown in the header
//   isCompleted   — whether this lesson is already marked complete in DB
//   onQuizComplete — called once when the user submits the quiz (triggers DB write)
//
// FLOW:
//   intro → question (one at a time) → results → calls onQuizComplete
//
// ANSWER FEEDBACK:
//   • Correct pick   → green ✓ ring + green fill on that option
//   • Wrong pick     → red ✗ ring + red fill on that option
//                      green ✓ ring revealed on the correct option
//   • Locked after any pick — user cannot change answer, only advance
//
// SCORING:
//   Each question has a `points` value (set in the data).
//   If correct → full points earned. If wrong → 0 points for that question.
//   Results screen shows totalEarned / maxPossible and a pass/fail badge.
// =============================================================================

import React, { useState, useCallback } from 'react';
import GlowCard from '@/components/AppShell/GlowCard';
import {
  CheckCircle2, XCircle, ChevronRight, Brain,
  Trophy, Star, ArrowRight, RotateCcw,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
// These mirror the QuizContent / QuizQuestion interfaces in lib/Course.ts.
// Duplicated here so the component compiles independently; update both files together.
interface QuizQuestion {
  id: string;
  question: string;
  answers: string[];     // all options shown to the user (mix of correct + wrong)
  correctIndex: number;  // index into answers[] that is the right answer
  points: number;        // points awarded when answered correctly
}

interface QuizContent {
  questions: QuizQuestion[];
  topics?: string[];
}

interface QuizPlayerProps {
  content: QuizContent;
  title: string;
  isCompleted: boolean;
  onQuizComplete: () => void;
}

// ── Internal state ─────────────────────────────────────────────────────────────
type Phase = 'intro' | 'question' | 'results';

interface AnswerRecord {
  questionId: string;
  selectedIndex: number;
  correct: boolean;
  pointsEarned: number;
}

// Letter labels for up to 6 answers (A–F)
const LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

// ── Component ─────────────────────────────────────────────────────────────────
export default function QuizPlayer({
  content,
  title,
  isCompleted,
  onQuizComplete,
}: QuizPlayerProps) {
  const { questions } = content;

  const [phase, setPhase]               = useState<Phase>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [records, setRecords]           = useState<AnswerRecord[]>([]);
  const [submitted, setSubmitted]       = useState(false); // quiz fully submitted

  const totalQuestions = questions.length;
  const maxScore       = questions.reduce((s, q) => s + q.points, 0);
  const currentQ       = questions[currentIndex];

  // ── Derived from records ──────────────────────────────────────────────────
  const totalEarned    = records.reduce((s, r) => s + r.pointsEarned, 0);
  const correctCount   = records.filter((r) => r.correct).length;
  const pct            = maxScore > 0 ? Math.round((totalEarned / maxScore) * 100) : 0;
  const passed         = pct >= 50;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleStart = useCallback(() => {
    setPhase('question');
    setCurrentIndex(0);
    setSelectedIndex(null);
    setRecords([]);
    setSubmitted(false);
  }, []);

  const handleSelectAnswer = useCallback((idx: number) => {
    // Lock once selected — cannot change
    if (selectedIndex !== null) return;
    setSelectedIndex(idx);
  }, [selectedIndex]);

  const handleNext = useCallback(() => {
    if (selectedIndex === null || !currentQ) return;

    const correct      = selectedIndex === currentQ.correctIndex;
    const pointsEarned = correct ? currentQ.points : 0;
    const newRecord: AnswerRecord = {
      questionId: currentQ.id,
      selectedIndex,
      correct,
      pointsEarned,
    };
    const newRecords = [...records, newRecord];
    setRecords(newRecords);

    if (currentIndex + 1 < totalQuestions) {
      // Advance to next question
      setCurrentIndex((i) => i + 1);
      setSelectedIndex(null);
    } else {
      // Last question → results screen
      setPhase('results');
      setSubmitted(true);
      // Mark the lesson complete in the DB (once, on first completion)
      if (!isCompleted) {
        onQuizComplete();
      }
    }
  }, [selectedIndex, currentQ, records, currentIndex, totalQuestions, isCompleted, onQuizComplete]);

  // ── Guards ────────────────────────────────────────────────────────────────
  if (!questions || questions.length === 0) {
    return (
      <GlowCard className="space-y-4">
        <div className="flex items-center gap-3">
          <Brain size={22} className="text-pink-400" />
          <h2 className="text-xl font-bold text-white">{title}</h2>
        </div>
        <p className="text-gray-400 text-sm">
          This quiz has no questions yet. Check back later.
        </p>
      </GlowCard>
    );
  }

  // ── PHASE: intro ──────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <GlowCard className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center shrink-0">
              <Brain size={20} className="text-pink-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white leading-snug">{title}</h2>
              <p className="text-gray-500 text-xs mt-0.5">Knowledge check</p>
            </div>
          </div>
          {isCompleted && (
            <span className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full whitespace-nowrap shrink-0">
              <CheckCircle2 size={14} /> Completed
            </span>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Questions', value: totalQuestions, color: 'indigo' },
            { label: 'Max Score',  value: maxScore,       color: 'purple' },
            { label: 'Pass Mark',  value: '50%',          color: 'pink'   },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className={`rounded-xl border p-3 text-center
                bg-${color}-500/10 border-${color}-500/25`}
            >
              <p className={`text-2xl font-extrabold text-${color}-400`}>{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Topics */}
        {content.topics && content.topics.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Topics Covered</p>
            <div className="flex flex-wrap gap-2">
              {content.topics.map((t) => (
                <span key={t} className="text-xs px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="rounded-xl bg-gray-800/60 border border-gray-700/50 p-4 space-y-2">
          <p className="text-sm font-semibold text-white">How it works</p>
          <ul className="space-y-1.5 text-sm text-gray-400">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
              Read each question and pick the best answer.
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
              Once you select an answer you cannot change it.
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
              The correct answer is shown immediately after each pick.
            </li>
          </ul>
        </div>

        <button
          onClick={handleStart}
          className="w-full py-3.5 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600
                     hover:from-indigo-700 hover:to-purple-700
                     text-white font-bold transition shadow-lg shadow-indigo-500/20
                     flex items-center justify-center gap-2"
        >
          <Brain size={18} />
          {isCompleted ? 'Retake Quiz' : 'Start Quiz'}
        </button>
      </GlowCard>
    );
  }

  // ── PHASE: question ───────────────────────────────────────────────────────
  if (phase === 'question' && currentQ) {
    const answered        = selectedIndex !== null;
    const progressPercent = Math.round((currentIndex / totalQuestions) * 100);

    return (
      <GlowCard className="space-y-6">
        {/* Top bar: progress + counter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-medium text-white">
              Question {currentIndex + 1}
              <span className="text-gray-500"> / {totalQuestions}</span>
            </span>
            <span className="text-pink-400 font-semibold">
              {currentQ.points} {currentQ.points === 1 ? 'pt' : 'pts'}
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Question text */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-pink-500/15 border border-pink-500/25 flex items-center justify-center shrink-0">
              <Brain size={15} className="text-pink-400" />
            </div>
            <span className="text-xs font-semibold text-pink-400 uppercase tracking-wide">Question</span>
          </div>
          <p className="text-lg font-semibold text-white leading-snug">
            {currentQ.question}
          </p>
        </div>

        {/* Answer options */}
        <div className="space-y-3">
          {currentQ.answers.map((answer, idx) => {
            const isSelected = selectedIndex === idx;
            const isCorrect  = idx === currentQ.correctIndex;

            // Before answering: neutral style with hover
            // After answering: apply result styles
            let containerClass = '';
            let labelClass     = '';
            let icon: React.ReactNode = null;

            if (!answered) {
              // Neutral + hover state
              containerClass = `
                border border-gray-700/80 bg-gray-800/50
                hover:border-indigo-500/60 hover:bg-indigo-500/8
                cursor-pointer active:scale-[0.99]
              `;
              labelClass = 'bg-gray-700 text-gray-300 group-hover:bg-indigo-500/30 group-hover:text-indigo-200';
            } else if (isSelected && isCorrect) {
              // User picked the right answer
              containerClass = 'border border-emerald-500/70 bg-emerald-500/10 cursor-default';
              labelClass     = 'bg-emerald-500/30 text-emerald-300';
              icon           = <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />;
            } else if (isSelected && !isCorrect) {
              // User picked a wrong answer
              containerClass = 'border border-red-500/70 bg-red-500/10 cursor-default';
              labelClass     = 'bg-red-500/30 text-red-300';
              icon           = <XCircle size={18} className="text-red-400 shrink-0" />;
            } else if (!isSelected && isCorrect && answered) {
              // Reveal the correct answer when user got it wrong
              containerClass = 'border border-emerald-500/50 bg-emerald-500/6 cursor-default';
              labelClass     = 'bg-emerald-500/20 text-emerald-400';
              icon           = <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />;
            } else {
              // Other options — dim them out after answering
              containerClass = 'border border-gray-800 bg-gray-800/30 opacity-50 cursor-default';
              labelClass     = 'bg-gray-700/60 text-gray-500';
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelectAnswer(idx)}
                disabled={answered}
                className={`
                  group w-full flex items-center gap-4 p-4 rounded-xl
                  transition-all duration-200 text-left
                  ${containerClass}
                `}
              >
                {/* Letter label */}
                <span className={`
                  w-8 h-8 rounded-lg text-sm font-bold flex items-center justify-center shrink-0 transition-all
                  ${labelClass}
                `}>
                  {LABELS[idx] ?? idx + 1}
                </span>

                {/* Answer text */}
                <span className={`
                  flex-1 text-sm font-medium leading-snug
                  ${answered
                    ? (isSelected && isCorrect)
                      ? 'text-emerald-300'
                      : (isSelected && !isCorrect)
                        ? 'text-red-300'
                        : isCorrect
                          ? 'text-emerald-300'
                          : 'text-gray-500'
                    : 'text-gray-200 group-hover:text-white'
                  }
                `}>
                  {answer}
                </span>

                {/* Result icon — only shown after answering */}
                {icon}
              </button>
            );
          })}
        </div>

        {/* Next / Finish button — only visible after answering */}
        <div className={`transition-all duration-300 ${answered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
          <button
            onClick={handleNext}
            disabled={!answered}
            className="w-full py-3.5 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600
                       hover:from-indigo-700 hover:to-purple-700
                       text-white font-bold transition shadow-lg shadow-indigo-500/20
                       flex items-center justify-center gap-2"
          >
            {currentIndex + 1 < totalQuestions ? (
              <>Next Question <ChevronRight size={18} /></>
            ) : (
              <>See Results <ArrowRight size={18} /></>
            )}
          </button>
        </div>
      </GlowCard>
    );
  }

  // ── PHASE: results ────────────────────────────────────────────────────────
  if (phase === 'results') {
    return (
      <GlowCard className="space-y-6">
        {/* Score hero */}
        <div className="text-center space-y-3 py-2">
          <div className={`
            mx-auto w-20 h-20 rounded-full flex items-center justify-center
            shadow-2xl border-2
            ${passed
              ? 'bg-linear-to-br from-emerald-500/30 to-teal-500/30 border-emerald-500/50 shadow-emerald-500/30'
              : 'bg-linear-to-br from-red-500/20 to-orange-500/20 border-red-500/40 shadow-red-500/20'
            }
          `}>
            {passed
              ? <Trophy size={36} className="text-emerald-400" />
              : <RotateCcw size={32} className="text-red-400" />
            }
          </div>

          <div>
            <p className={`text-4xl font-black tracking-tight ${passed ? 'text-emerald-400' : 'text-red-400'}`}>
              {totalEarned}
              <span className="text-xl text-gray-500 font-bold"> / {maxScore}</span>
            </p>
            <p className="text-gray-400 text-sm mt-1">{pct}% score</p>
          </div>

          <div className={`
            inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold border
            ${passed
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
              : 'bg-red-500/15 border-red-500/30 text-red-400'
            }
          `}>
            {passed ? <><Star size={14} /> Passed</> : <><XCircle size={14} /> Not Passed</>}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Correct',   value: correctCount, sub: `of ${totalQuestions}`, color: 'emerald' },
            { label: 'Score',     value: `${totalEarned}pts`, sub: `of ${maxScore}`,   color: 'indigo'  },
            { label: 'Result',    value: pct + '%',    sub: passed ? 'pass' : 'fail', color: passed ? 'emerald' : 'red' },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className={`rounded-xl border p-3 text-center bg-${color}-500/10 border-${color}-500/25`}>
              <p className={`text-lg font-extrabold text-${color}-400`}>{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
              <p className={`text-xs text-${color}-500/80`}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Per-question breakdown */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Question Breakdown</p>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {questions.map((q, i) => {
              const rec = records[i];
              if (!rec) return null;
              return (
                <div
                  key={q.id}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border text-sm
                    ${rec.correct
                      ? 'bg-emerald-500/8 border-emerald-500/25'
                      : 'bg-red-500/8 border-red-500/20'
                    }
                  `}
                >
                  {/* Number */}
                  <span className="text-xs text-gray-500 font-bold w-4 shrink-0">{i + 1}</span>

                  {/* Icon */}
                  {rec.correct
                    ? <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    : <XCircle      size={16} className="text-red-400 shrink-0" />
                  }

                  {/* Question truncated */}
                  <p className={`flex-1 truncate ${rec.correct ? 'text-gray-200' : 'text-gray-400'}`}>
                    {q.question}
                  </p>

                  {/* Points */}
                  <span className={`text-xs font-bold shrink-0 ${rec.correct ? 'text-emerald-400' : 'text-red-400/70'}`}>
                    {rec.correct ? `+${rec.pointsEarned}` : '0'} pts
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {/* Retake — resets state back to intro without re-triggering onQuizComplete */}
          <button
            onClick={() => {
              setPhase('intro');
              setCurrentIndex(0);
              setSelectedIndex(null);
              setRecords([]);
              setSubmitted(false);
            }}
            className="flex-1 py-3 rounded-xl border border-indigo-500/30 hover:border-indigo-500/60
                       text-gray-300 hover:text-white font-semibold text-sm transition
                       flex items-center justify-center gap-2"
          >
            <RotateCcw size={16} /> Retake Quiz
          </button>

          {/* Completion notice if already saved */}
          <div className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                          bg-emerald-500/10 border border-emerald-500/30 text-emerald-400
                          font-semibold text-sm">
            <CheckCircle2 size={16} />
            {submitted ? 'Progress Saved' : 'Already Completed'}
          </div>
        </div>
      </GlowCard>
    );
  }

  return null;
}
