'use client';

// ─────────────────────────────────────────────
// AuthContext — wraps the whole app so any component
// can call useAuth() to get the current user.
// Replace saveSession / clearSession with Supabase when ready.
// ─────────────────────────────────────────────

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DemoUser, demoUsers, getUserByCredentials } from '@/lib/users';
import { saveSession, getSession, clearSession } from '@/lib/auth';
import { courseSchemas, EnrolledCourse } from '@/lib/Course';

type SafeUser = Omit<DemoUser, 'password'>;

// ── Per-user extra enrollments in localStorage ──
function enrollmentKey(userId: string) {
  return `learnify_enrollments_${userId}`;
}
function loadExtras(userId: string): { slug: string; progress: number }[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(enrollmentKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveExtras(userId: string, extras: { slug: string; progress: number }[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(enrollmentKey(userId), JSON.stringify(extras));
}

interface AuthContextValue {
  user: SafeUser | null;
  enrolledCourses: EnrolledCourse[];
  isEnrolled: (slug: string) => boolean;
  enroll: (slug: string) => void;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Derive EnrolledCourse[] from the user's enrolledSlugs + any extra enrollments ──
function buildEnrolledCourses(
  user: SafeUser,
  extras: { slug: string; progress: number }[] = []
): EnrolledCourse[] {
  // nextLessonId mapping (first lesson per course that has modules)
  const firstLessonMap: Record<string, string> = {
    'nextjs-for-beginners-full': 'lesson_1_1',
    'react-fundamentals': 'lesson_r1_1',
  };

  // Base slugs from user definition + extra enrollments (no duplicates)
  const allSlugs = [
    ...user.enrolledSlugs.map((slug) => ({ slug, progress: user.enrolledProgress[slug] ?? 0 })),
    ...extras.filter((e) => !user.enrolledSlugs.includes(e.slug)),
  ];

  return allSlugs
    .map(({ slug, progress }) => {
      const schema = courseSchemas.find((c) => c.slug === slug);
      if (!schema) return null;
      return {
        id: Number(schema.id),
        slug: schema.slug,
        title: schema.title,
        instructor: schema.instructor,
        progress,
        duration: schema.duration.replace(' hours', 'h').replace(' hour', 'h'),
        students: Math.floor(Math.random() * 3000) + 500, // placeholder until backend
        thumbnail: schema.thumbnail,
        gradientFrom: schema.gradientFrom,
        gradientTo: schema.gradientTo,
        nextLessonId: firstLessonMap[slug],
      } as EnrolledCourse;
    })
    .filter(Boolean) as EnrolledCourse[];
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Rehydrate session + any extra enrollments on mount
  useEffect(() => {
    const session = getSession();
    if (session) {
      const extras = loadExtras(session.id);
      setUser(session);
      setEnrolledCourses(buildEnrolledCourses(session, extras));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ error?: string }> => {
    const found = getUserByCredentials(email, password);
    if (!found) {
      return { error: 'Invalid email or password.' };
    }
    const { password: _, ...safe } = found;
    saveSession(found);
    const extras = loadExtras(safe.id);
    setUser(safe);
    setEnrolledCourses(buildEnrolledCourses(safe, extras));
    return {};
  };

  const logout = () => {
    clearSession();
    setUser(null);
    setEnrolledCourses([]);
    router.push('/login');
  };

  // Enroll the logged-in user in a new course and persist to localStorage
  const enroll = (slug: string) => {
    if (!user) return;
    if (enrolledCourses.some((c) => c.slug === slug)) return; // already enrolled
    const extras = loadExtras(user.id);
    const updated = [...extras, { slug, progress: 0 }];
    saveExtras(user.id, updated);
    setEnrolledCourses(buildEnrolledCourses(user, updated));
  };

  const isEnrolled = (slug: string) => enrolledCourses.some((c) => c.slug === slug);

  return (
    <AuthContext.Provider value={{ user, enrolledCourses, isEnrolled, enroll, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
