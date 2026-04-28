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
  premium_price: string | null; premium_deadline_days: number; premium_perks: string[];
}

function rowToCourse(row: CourseRow): CourseSchema {
  return {
    id: row.id, slug: row.slug, title: row.title,
    shortDescription: row.short_description, description: row.description,
    level: row.level, duration: row.duration, price: row.price,
    instructor: row.instructor, thumbnail: row.thumbnail,
    gradientFrom: row.gradient_from, gradientTo: row.gradient_to,
    features: row.features ?? [], curriculum: row.curriculum ?? [], modules: row.modules ?? [],
    premiumPrice: row.premium_price ?? null,
    premiumDeadlineDays: row.premium_deadline_days ?? 60,
    premiumPerks: row.premium_perks ?? [],
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
  // true when the data fetch failed for a transient reason (Supabase down,
  // network error). Distinct from !user (session invalid). Dashboard pages
  // use this to show a "Reload" UI instead of misleading zeros.
  loadError: boolean;
  // Non-null when markLessonComplete failed to write to the DB.
  // Rendered as a toast in AppShellLayout. Clear with clearProgressSaveError.
  progressSaveError: string | null;
  clearProgressSaveError: () => void;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  enroll: (slug: string, enrollmentId?: string) => void;
  markLessonComplete: (courseSlug: string, lessonId: string) => Promise<void>;
  updateProfile: (data: Partial<Pick<AppUser, 'name' | 'phone' | 'bio' | 'location'>>) => Promise<{ error?: string }>;
  updatePreferences: (prefs: AppUser['preferences']) => Promise<{ error?: string }>;
  updateAvatar: (file: File) => Promise<{ error?: string }>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ error?: string }>;
  deleteAccount: () => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Build EnrolledCourse[] from DB rows ───────────────────────────────────────
function buildEnrolledCourses(
  enrollments: EnrollmentRow[],
  completions: LessonCompletionRow[],
  courseList: CourseSchema[],
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
        purchaseType: row.purchase_type ?? 'standard',
        premiumDeadline: row.premium_deadline ?? null,
        mysteryBoxStatus: row.mystery_box_status ?? null,
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
  const [loadError, setLoadError]             = useState(false);
  const [progressSaveError, setProgressSaveError] = useState<string | null>(null);
  const clearProgressSaveError = () => setProgressSaveError(null);
  const router = useRouter();
  const loadedUserIdRef = useRef<string | null>(null);

  const loadUserData = useCallback(async (userId: string) => {
    setLoadError(false);
    try {
      // ── FIX 3: Race the Promise.all against a 15-second hard timeout. ─────
      // Before this fix, if any of the 4 Supabase queries stalled (connection
      // pool exhaustion, flaky desktop network), Promise.all never resolved,
      // loadUserData never returned, and the loading spinner ran forever.
      // Promise.race ensures we always exit within 15 s — the catch block below
      // sets loadError=true so the user sees the "Reload" UI instead of a
      // spinner that never stops.
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 15_000)
      );

      const [
        { data: profile,     error: profileError  },
        { data: enrollments, error: enrollError   },
        { data: completions, error: compError     },
        { data: coursesData, error: coursesError  },
      ] = await Promise.race([
        Promise.all([
          supabase.from('profiles').select('*').eq('id', userId).single(),
          supabase.from('enrollments').select('*').eq('user_id', userId),
          supabase.from('lesson_completions').select('*').eq('user_id', userId),
          supabase.from('courses').select('*').eq('is_published', true).order('created_at', { ascending: true }),
        ]),
        timeoutPromise,
      ]);

      // Profile and courses are critical. A failure here is almost always a
      // transient Supabase/network error — NOT an invalid session.
      // We set loadError=true WITHOUT redirecting to /login.
      if (profileError || coursesError) {
        console.error(
          '[loadUserData] critical query failed:',
          profileError?.message ?? coursesError?.message
        );
        setLoadError(true);
        return;
      }

      // Enrollment/completion errors are non-fatal — render partial data
      if (enrollError)  console.warn('[loadUserData] enrollments query failed:', enrollError.message);
      if (compError)    console.warn('[loadUserData] completions query failed:', compError.message);

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

    } catch (err: unknown) {
      // Catches both unexpected throws AND the 15-second timeout rejection.
      // Either way: surface the error UI, do not redirect to /login.
      console.error('[loadUserData] unexpected error or timeout:', err);
      setLoadError(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // setters from useState are stable; supabase is a module-level singleton

  useEffect(() => {
    // ── FIX 1 & 2: Guaranteed setIsLoading(false) via .finally() ─────────────
    //
    // ROOT CAUSE OF THE INFINITE LOADING BUG:
    //   Before this fix, setIsLoading(false) was ONLY inside .then(). If
    //   getUser() was blocked or slow (desktop ad-blockers / privacy extensions
    //   can delay Supabase auth network calls), .then() never ran, and the
    //   loading spinner ran forever — even if onAuthStateChange had already
    //   loaded all the data successfully.
    //
    // Fix 1: Move setIsLoading(false) into .finally() so it runs regardless
    //   of whether getUser() succeeds, fails, or throws.
    //
    // Fix 2: Also call setIsLoading(false) inside onAuthStateChange when
    //   there is no session. This covers the fast path where the user is
    //   not logged in — previously isLoading stayed true until getUser()
    //   completed its network roundtrip even though we already knew the
    //   user was absent.
    supabase.auth.getUser()
      .then(async ({ data: { user } }) => {
        if (user) {
          loadedUserIdRef.current = user.id;
          await loadUserData(user.id);
        }
      })
      .catch((err) => {
        // getUser() itself rejected (network error, SDK throw, etc.)
        console.error('[AuthProvider] session init error:', err);
        setLoadError(true);
      })
      .finally(() => {
        // Guaranteed to run: resolves the loading state no matter what happened above.
        setIsLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session?.user) {
        loadedUserIdRef.current = null;
        setUser(null); setEnrolledCourses([]); setCompletedLessonIds(new Set()); setCourses([]);
        // FIX 2: Resolve loading on the "not logged in" path so we don't wait
        // for the getUser() network roundtrip to finish before showing the
        // login page. onAuthStateChange reads from cookies synchronously and
        // knows immediately when there is no session.
        setIsLoading(false);
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
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_RE.test(email.trim())) {
      return { error: 'Please enter a valid email address.' };
    }

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

  const enroll = (slug: string, enrollmentId?: string) => {
    if (!user || enrolledCourses.some((c) => c.slug === slug)) return;
    const schema = courses.find((c) => c.slug === slug);
    if (!schema) return;
    const allLessons = schema.modules.flatMap((m) => m.lessons);
    setEnrolledCourses((prev) => [...prev, {
      id: enrollmentId ?? crypto.randomUUID(), slug: schema.slug, title: schema.title,
      instructor: schema.instructor, progress: 0,
      duration: schema.duration.replace(' hours', 'h').replace(' hour', 'h'),
      students: 0, thumbnail: schema.thumbnail,
      gradientFrom: schema.gradientFrom, gradientTo: schema.gradientTo,
      nextLessonId: allLessons[0]?.id,
    } as EnrolledCourse]);
  };

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showProgressError = (msg: string) => {
    setProgressSaveError(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setProgressSaveError(null);
      toastTimerRef.current = null;
    }, 5000);
  };

  const markLessonComplete = async (courseSlug: string, lessonId: string) => {
    if (!user) return;
    if (completedLessonIds.has(lessonId)) return;

    const schema = courses.find((c) => c.slug === courseSlug);

    const optimisticCompleted = new Set([...completedLessonIds, lessonId]);

    const optimisticProgress = (() => {
      if (!schema || schema.modules.length === 0) return null;
      const totalLessons = schema.modules.flatMap((m) => m.lessons).length;
      const completedCount = schema.modules
        .flatMap((m) => m.lessons)
        .filter((l) => optimisticCompleted.has(l.id)).length;
      return totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
    })();

    setCompletedLessonIds(optimisticCompleted);
    if (schema && optimisticProgress !== null) {
      setEnrolledCourses((prev) =>
        prev.map((c) => {
          if (c.slug !== courseSlug) return c;
          const allLessons = schema.modules.flatMap((m) => m.lessons);
          const nextLesson = allLessons.find((l) => !optimisticCompleted.has(l.id));
          return { ...c, progress: optimisticProgress, nextLessonId: nextLesson?.id };
        })
      );
    }

    let apiResult: { success?: boolean; error?: string } = {};
    try {
      const res = await fetch('/api/mark-lesson-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-protection': '1' },
        body: JSON.stringify({ courseSlug, lessonId }),
      });
      apiResult = await res.json().catch(() => ({ error: 'parse_failed' }));
      if (!res.ok && apiResult.error !== 'progress_failed') {
        apiResult = { error: apiResult.error ?? 'completion_failed' };
      }
    } catch {
      apiResult = { error: 'completion_failed' };
    }

    if (apiResult.error === 'progress_failed') {
      console.error('[markLessonComplete] enrollments update failed (server)');
      if (schema && optimisticProgress !== null) {
        setEnrolledCourses((prev) =>
          prev.map((c) => {
            if (c.slug !== courseSlug) return c;
            const allLessons = schema.modules.flatMap((m) => m.lessons);
            const nextLesson = allLessons.find((l) => !optimisticCompleted.has(l.id));
            const originalCount = schema.modules
              .flatMap((m) => m.lessons)
              .filter((l) => completedLessonIds.has(l.id)).length;
            const totalLessons = schema.modules.flatMap((m) => m.lessons).length;
            const originalProgress = totalLessons > 0
              ? Math.round((originalCount / totalLessons) * 100) : 0;
            return { ...c, progress: originalProgress, nextLessonId: nextLesson?.id };
          })
        );
      }
      showProgressError('Lesson saved but progress % could not update. Please reload.');
      return;
    }

    if (apiResult.error) {
      console.error('[markLessonComplete] lesson_completions write failed:', apiResult.error);
      setCompletedLessonIds(completedLessonIds);
      if (schema && optimisticProgress !== null) {
        setEnrolledCourses((prev) =>
          prev.map((c) => {
            if (c.slug !== courseSlug) return c;
            const allLessons = schema.modules.flatMap((m) => m.lessons);
            const nextLesson = allLessons.find((l) => !completedLessonIds.has(l.id));
            const originalCount = schema.modules
              .flatMap((m) => m.lessons)
              .filter((l) => completedLessonIds.has(l.id)).length;
            const totalLessons = schema.modules.flatMap((m) => m.lessons).length;
            const originalProgress = totalLessons > 0
              ? Math.round((originalCount / totalLessons) * 100) : 0;
            return { ...c, progress: originalProgress, nextLessonId: nextLesson?.id };
          })
        );
      }
      showProgressError('Failed to save progress. Please check your connection.');
      return;
    }

    // Both writes succeeded — UI is already correct from the optimistic update.
  };

  const updateProfile = async (data: Partial<Pick<AppUser, 'name' | 'phone' | 'bio' | 'location'>>) => {
    if (!user) return { error: 'Not logged in.' };
    const sanitized = { ...data };
    if (sanitized.name !== undefined) {
      const trimmedName = sanitized.name.trim();
      if (!trimmedName) return { error: 'Name cannot be empty.' };
      if (trimmedName.length > 100) return { error: 'Name must be 100 characters or fewer.' };
      sanitized.name = trimmedName;
    }
    if (sanitized.bio !== undefined && sanitized.bio.length > 500) {
      return { error: 'Bio must be 500 characters or fewer.' };
    }
    if (sanitized.phone !== undefined) {
      const trimmedPhone = sanitized.phone.trim();
      if (trimmedPhone.length > 20) return { error: 'Phone must be 20 characters or fewer.' };
      sanitized.phone = trimmedPhone;
    }
    if (sanitized.location !== undefined) {
      const trimmedLocation = sanitized.location.trim();
      if (trimmedLocation.length > 100) return { error: 'Location must be 100 characters or fewer.' };
      sanitized.location = trimmedLocation;
    }
    const { error } = await supabase.from('profiles').update(sanitized).eq('id', user.id);
    if (error) return { error: error.message };
    setUser((prev) => prev ? { ...prev, ...sanitized } : prev);
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

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    const res = await fetch('/api/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-csrf-protection': '1' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json().catch(() => ({ error: 'Server error' }));
    if (!res.ok) return { error: data.error ?? 'Password update failed' };
    return {};
  };

  const deleteAccount = async () => {
    if (!user) return { error: 'Not logged in.' };
    const res = await fetch('/api/delete-account', { method: 'POST', headers: { 'x-csrf-protection': '1' } });
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
      isEnrolled, isLessonCompleted, isLoading, loadError,
      progressSaveError, clearProgressSaveError,
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
