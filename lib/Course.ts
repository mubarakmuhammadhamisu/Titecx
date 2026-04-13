// ─────────────────────────────────────────────────────────────────────────────
// lib/Course.ts — TypeScript types only.
//
// The static courseSchemas array has been moved to Supabase.
// Courses are now fetched at runtime:
//   - Server components  → import { getAllCourses, getCourseBySlug } from '@/lib/courses'
//   - Client components  → const { courses } = useAuth()
// ─────────────────────────────────────────────────────────────────────────────

export type LessonType   = 'video' | 'reading' | 'quiz';
export type LessonStatus = 'completed' | 'current' | 'locked';
export type FilterStatus = 'all' | 'in-progress' | 'completed';

export interface VideoContent   { videoUrl: string; duration: string; topics?: string[]; }
export interface ReadingContent { markdownBody: string; topics?: string[]; }

// ── QuizQuestion ──────────────────────────────────────────────────────────────
// One question inside a quiz lesson.
//
// Fields:
//   id            — unique string identifier (e.g. "q1", "q2")
//   question      — the question text shown to the user
//   answers       — array of all answer options (correct + wrong, in any order)
//   correctIndex  — index inside `answers[]` that is the right answer (0-based)
//   points        — score awarded when the user picks the correct answer
//                   (use 0 to mark a question as bonus / unscored)
//
// Example:
//   {
//     id: "q1",
//     question: "What does HTML stand for?",
//     answers: [
//       "HyperText Markup Language",   // ← correctIndex: 0
//       "High-Tech Modern Layout",
//       "HyperLink and Text Markup",
//       "Hypertext Machine Language",
//     ],
//     correctIndex: 0,
//     points: 10,
//   }
export interface QuizQuestion {
  id: string;
  question: string;
  answers: string[];     // all options shown (correct + incorrect, any order)
  correctIndex: number;  // which index in answers[] is the right answer
  points: number;        // points earned when answered correctly (0 if answered wrong)
}

// ── QuizContent ───────────────────────────────────────────────────────────────
// The `content` field of a lesson whose `type === 'quiz'`.
//
// Fields:
//   questions  — ordered array of QuizQuestion objects
//   topics     — optional list of topic labels shown on the intro screen
//                (same convention as VideoContent and ReadingContent)
//
// Pass/fail threshold is fixed at 50% in QuizPlayer.tsx.
// To change it, update the `passed` constant there.
export interface QuizContent {
  questions: QuizQuestion[];
  topics?: string[];
}

export interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  status: LessonStatus;
  content: VideoContent | ReadingContent | QuizContent;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface CourseSchema {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  level: string;
  duration: string;
  price: string;
  instructor: string;
  thumbnail: string;
  gradientFrom: string;
  gradientTo: string;
  features: string[];
  curriculum: string[];
  modules: Module[];
}

export interface EnrolledCourse {
  id: string;           // UUID from enrollments table
  slug: string;
  title: string;
  instructor: string;
  progress: number;
  duration: string;
  students: number;
  thumbnail: string;
  gradientFrom: string;
  gradientTo: string;
  nextLessonId?: string;
  completedAt?: string | null;
  enrolledAt?: string;
}
