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

interface AuthContextValue {
  user: SafeUser | null;
  enrolledCourses: EnrolledCourse[];
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Derive EnrolledCourse[] from the user's enrolledSlugs ──
function buildEnrolledCourses(user: SafeUser): EnrolledCourse[] {
  // nextLessonId mapping (first lesson per course that has modules)
  const firstLessonMap: Record<string, string> = {
    'nextjs-for-beginners-full': 'lesson_1_1',
    'react-fundamentals': 'lesson_r1_1',
  };

  return user.enrolledSlugs
    .map((slug) => {
      const schema = courseSchemas.find((c) => c.slug === slug);
      if (!schema) return null;
      const progress = user.enrolledProgress[slug] ?? 0;
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

  // Rehydrate session on mount
  useEffect(() => {
    const session = getSession();
    if (session) {
      setUser(session);
      setEnrolledCourses(buildEnrolledCourses(session));
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
    setUser(safe);
    setEnrolledCourses(buildEnrolledCourses(safe));
    return {};
  };

  const logout = () => {
    clearSession();
    setUser(null);
    setEnrolledCourses([]);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, enrolledCourses, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
