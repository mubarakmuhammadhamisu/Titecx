'use client';

import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, EnrollmentRow, LessonCompletionRow, uploadAvatar } from '@/lib/supabase';
import type { CourseSchema, EnrolledCourse, Module } from '@/lib/Course';

// ── DB row shape for courses ──────────────────────────────────────────────────
interface CourseRow {
  id: string; slug: string; title: string; short_description: string;
  description: string; level: string; duration: string; price: string;
  instructor: string; thumbnail: string; gradient_from: string; gradient_to: string;
  features: string[]; curriculum: string[]; modules: Module[]; is_published: boolean;
}

function rowToCourse(row: CourseRow): CourseSchema {
  return {
    id: row.id, slug: row.slug, title: row.title,
    shortDescription: row.short_description, description: row.description,
    level: row.level, duration: row.duration, price: row.price,
    instructor: row.instructor, thumbnail: row.thumbnail,
    gradientFrom: row.gradient_from, gradientTo: row.gradient_to,
    features: row.features ?? [], curriculum: row.curriculum ?? [], modules: row.modules ?? [],
  };
}

export interface AppUser {
  id: string; name: string; email: string; avatar: string;
  avatarUrl: string | null; role: string; location: string;
  bio: string; phone: string;
  preferences: { email_notifications: boolean; course_recommendations: boolean; weekly_digest: boolean };
}

interface AuthContextValue {
  user: AppUser | null;
  courses: CourseSchema[];
  enrolledCourses: EnrolledCourse[];
  completedLessonIds: Set<string>;
  isEnrolled: (slug: string) => boolean;
  isLessonCompleted: (lessonId: string) => boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  enroll: (slug: string) => void;
  markLessonComplete: (courseSlug: string, lessonId: string) => Promise<void>;
  updateProfile: (data: Partial<Pick<AppUser, 'name' | 'phone' | 'bio' | 'location'>>) => Promise<{ error?: string }>;
  updatePreferences: (prefs: AppUser['preferences']) => Promise<{ error?: string }>;
  updateAvatar: (file: File) => Promise<{ error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ error?: string }>;
  deleteAccount: () => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Build EnrolledCourse[] from DB rows ───────────────────────────────────────
function buildEnrolledCourses(
  enrollments: EnrollmentRow[],
  completions: LessonCompletionRow[],
  courseList: CourseSchema[],       // now passed in, not read from a static file
): EnrolledCourse[] {
  return enrollments
    .map((row) => {
      const schema = courseList.find((c) => c.slug === row.course_slug);
      if (!schema) return null;

      const allLessons = schema.modules.flatMap((m) => m.lessons);
      const completedInCourse = new Set(
        completions.filter((c) => c.course_slug === row.course_slug).map((c) => c.lesson_id)
      );
      const nextLesson = allLessons.find((l) => !completedInCourse.has(l.id));

      return {
        id: row.id, slug: schema.slug, title: schema.title, instructor: schema.instructor,
        progress: row.progress,
        duration: schema.duration.replace(' hours', 'h').replace(' hour', 'h'),
        students: 0, thumbnail: schema.thumbnail,
        gradientFrom: schema.gradientFrom, gradientTo: schema.gradientTo,
        nextLessonId: nextLesson?.id, completedAt: row.completed_at, enrolledAt: row.enrolled_at,
      } as EnrolledCourse;
    })
    .filter(Boolean) as EnrolledCourse[];
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]                       = useState<AppUser | null>(null);
  const [courses, setCourses]                 = useState<CourseSchema[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading]             = useState(true);
  const router = useRouter();
  const loadedUserIdRef = useRef<string | null>(null);

  const loadUserData = useCallback(async (userId: string) => {
    // Fetch profile, enrollments, completions, and courses all in one round trip
    const [
      { data: profile },
      { data: enrollments },
      { data: completions },
      { data: coursesData },
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('enrollments').select('*').eq('user_id', userId),
      supabase.from('lesson_completions').select('*').eq('user_id', userId),
      supabase.from('courses').select('*').eq('is_published', true).order('created_at', { ascending: true }),
    ]);

    const courseList: CourseSchema[] = coursesData
      ? (coursesData as CourseRow[]).map(rowToCourse)
      : [];

    setCourses(courseList);

    if (profile) {
      setUser({
        id: profile.id, name: profile.name, email: profile.email,
        avatar: profile.avatar, avatarUrl: profile.avatar_url ?? null,
        role: profile.role, location: profile.location ?? '',
        bio: profile.bio ?? '', phone: profile.phone ?? '',
        preferences: profile.preferences ?? {
          email_notifications: true, course_recommendations: true, weekly_digest: false,
        },
      });
    }

    const comp = completions ?? [];
    setCompletedLessonIds(new Set(comp.map((c: LessonCompletionRow) => c.lesson_id)));
    setEnrolledCourses(buildEnrolledCourses(enrollments ?? [], comp, courseList));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // setters from useState are stable; supabase is a module-level singleton

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        loadedUserIdRef.current = session.user.id;
        await loadUserData(session.user.id);
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session?.user) {
        loadedUserIdRef.current = null;
        setUser(null); setEnrolledCourses([]); setCompletedLessonIds(new Set()); setCourses([]);
        return;
      }
      if (loadedUserIdRef.current === session.user.id) return;
      loadedUserIdRef.current = session.user.id;
      await loadUserData(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, [loadUserData]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  };

  const register = async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: { name } },
    });
    if (error) {
      if (error.message.includes('already registered')) return { error: 'An account with this email already exists.' };
      return { error: error.message };
    }
    if (!data.user) return { error: 'Registration failed. Please try again.' };
    const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    await supabase.from('profiles').upsert({
      id: data.user.id, name, email,
      avatar: initials, role: 'Member', location: '', bio: '', phone: '',
      preferences: { email_notifications: true, course_recommendations: true, weekly_digest: false },
    });
    return {};
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null); setEnrolledCourses([]); setCompletedLessonIds(new Set()); setCourses([]);
    router.push('/login');
  };

  const enroll = (slug: string) => {
    if (!user || enrolledCourses.some((c) => c.slug === slug)) return;
    const schema = courses.find((c) => c.slug === slug); // reads from context state
    if (!schema) return;
    const allLessons = schema.modules.flatMap((m) => m.lessons);
    setEnrolledCourses((prev) => [...prev, {
      id: crypto.randomUUID(), slug: schema.slug, title: schema.title,
      instructor: schema.instructor, progress: 0,
      duration: schema.duration.replace(' hours', 'h').replace(' hour', 'h'),
      students: 0, thumbnail: schema.thumbnail,
      gradientFrom: schema.gradientFrom, gradientTo: schema.gradientTo,
      nextLessonId: allLessons[0]?.id,
    } as EnrolledCourse]);
  };

  const markLessonComplete = async (courseSlug: string, lessonId: string) => {
    if (!user) return;
    if (completedLessonIds.has(lessonId)) return;

    await supabase.from('lesson_completions').upsert({
      user_id: user.id, course_slug: courseSlug, lesson_id: lessonId,
    }, { onConflict: 'user_id,course_slug,lesson_id' });

    const schema = courses.find((c) => c.slug === courseSlug); // reads from context state
    if (schema) {
      const totalLessons = schema.modules.flatMap((m) => m.lessons).length;
      const newCompleted = new Set([...completedLessonIds, lessonId]);
      const completedInCourse = schema.modules
        .flatMap((m) => m.lessons)
        .filter((l) => newCompleted.has(l.id)).length;
      const newProgress = totalLessons > 0
        ? Math.round((completedInCourse / totalLessons) * 100)
        : 0;

      await supabase.from('enrollments')
        .update({ progress: newProgress, completed_at: newProgress === 100 ? new Date().toISOString() : null })
        .eq('user_id', user.id)
        .eq('course_slug', courseSlug);

      setCompletedLessonIds(newCompleted);
      setEnrolledCourses((prev) =>
        prev.map((c) => {
          if (c.slug !== courseSlug) return c;
          const allLessons = schema.modules.flatMap((m) => m.lessons);
          const nextLesson = allLessons.find((l) => !newCompleted.has(l.id));
          return { ...c, progress: newProgress, nextLessonId: nextLesson?.id };
        })
      );
    }
  };

  const updateProfile = async (data: Partial<Pick<AppUser, 'name' | 'phone' | 'bio' | 'location'>>) => {
    if (!user) return { error: 'Not logged in.' };
    const { error } = await supabase.from('profiles').update(data).eq('id', user.id);
    if (error) return { error: error.message };
    setUser((prev) => prev ? { ...prev, ...data } : prev);
    return {};
  };

  const updatePreferences = async (prefs: AppUser['preferences']) => {
    if (!user) return { error: 'Not logged in.' };
    const { error } = await supabase.from('profiles').update({ preferences: prefs }).eq('id', user.id);
    if (error) return { error: error.message };
    setUser((prev) => prev ? { ...prev, preferences: prefs } : prev);
    return {};
  };

  const updateAvatar = async (file: File) => {
    if (!user) return { error: 'Not logged in.' };
    const { url, error } = await uploadAvatar(user.id, file);
    if (error || !url) return { error: error ?? 'Upload failed.' };
    await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id);
    setUser((prev) => prev ? { ...prev, avatarUrl: url } : prev);
    return {};
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { error: error.message };
    return {};
  };

  const deleteAccount = async () => {
    if (!user) return { error: 'Not logged in.' };
    await supabase.from('lesson_completions').delete().eq('user_id', user.id);
    await supabase.from('enrollments').delete().eq('user_id', user.id);
    await supabase.from('payments').delete().eq('user_id', user.id);
    await supabase.from('profiles').delete().eq('id', user.id);
    const res = await fetch('/api/delete-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    });
    if (!res.ok) return { error: 'Failed to delete account. Please contact support.' };
    await supabase.auth.signOut();
    setUser(null); setEnrolledCourses([]); setCompletedLessonIds(new Set()); setCourses([]);
    router.push('/');
    return {};
  };

  const isEnrolled    = (slug: string)     => enrolledCourses.some((c) => c.slug === slug);
  const isLessonCompleted = (lessonId: string) => completedLessonIds.has(lessonId);

  return (
    <AuthContext.Provider value={{
      user, courses, enrolledCourses, completedLessonIds,
      isEnrolled, isLessonCompleted, isLoading,
      login, register, logout, enroll, markLessonComplete,
      updateProfile, updatePreferences, updateAvatar, updatePassword, deleteAccount,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
