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

// ── QuizContent ───────────────────────────────────────────────────────────────
// Each question keeps your existing field names (options, correctAnswer)
// with one new field: points — how much this question is worth.
//
// Example question object in Supabase:
// {
//   "id": "q1",
//   "question": "What does HTML stand for?",
//   "options": [
//     "HyperText Markup Language",
//     "High-Tech Modern Layout",
//     "HyperLink and Text Markup",
//     "Hypertext Machine Language"
//   ],
//   "correctAnswer": 0,
//   "points": 10
// }
export interface QuizContent {
  questions: Array<{
    id: string;
    question: string;
    options: string[];      // all answer choices shown to the user
    correctAnswer: number;  // index into options[] that is the right answer (0-based)
    points: number;         // score awarded when answered correctly
  }>;
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
