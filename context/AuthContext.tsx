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
  // Separate from isLoading: true when the data fetch failed for a transient
  // reason. We do NOT redirect to /login on a transient error — the session
  // is still valid. We show a "Reload" UI instead.
  const [loadError, setLoadError]             = useState(false);
  // Non-null when markLessonComplete fails to save to DB.
  // AppShellLayout renders this as a fixed toast.
  const [progressSaveError, setProgressSaveError] = useState<string | null>(null);
  const clearProgressSaveError = () => setProgressSaveError(null);
  const router = useRouter();
  const loadedUserIdRef = useRef<string | null>(null);

  const loadUserData = useCallback(async (userId: string) => {
    setLoadError(false);
    try {
      // Fetch all four in one round trip
      const [
        { data: profile,     error: profileError  },
        { data: enrollments, error: enrollError   },
        { data: completions, error: compError     },
        { data: coursesData, error: coursesError  },
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('enrollments').select('*').eq('user_id', userId),
        supabase.from('lesson_completions').select('*').eq('user_id', userId),
        supabase.from('courses').select('*').eq('is_published', true).order('created_at', { ascending: true }),
      ]);

      // Profile and courses are critical. A failure here is almost always a
      // transient Supabase/network error — NOT an invalid session.
      // We set loadError=true WITHOUT redirecting to /login.
      // Invalid sessions are handled by the proxy + AuthGuard via JWT.
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
      // Unexpected throw (network failure that threw rather than returning an
      // error object). Same treatment: set loadError, do not redirect.
      console.error('[loadUserData] unexpected error:', err);
      setLoadError(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // setters from useState are stable; supabase is a module-level singleton

  useEffect(() => {
    // getUser() validates the JWT with Supabase's servers on every call.
    // getSession() only reads from local storage/cookies without server
    // validation — a stale or tampered token would be accepted as valid.
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        loadedUserIdRef.current = user.id;
        await loadUserData(user.id);
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
    // ── Client-side email format check ────────────────────────────────────
    // Saves a round-trip to Supabase on slow connections.
    // Regex requires: non-empty local part @ non-empty domain with a dot.
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
    const schema = courses.find((c) => c.slug === slug); // reads from context state
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

  // Ref to hold the active toast auto-dismiss timer.
  // Using a ref (not state) means clearing/resetting it never triggers a re-render.
  // Without this, completing two lessons quickly creates two timers — the first
  // fires 5 s after click 1, dismissing the toast that was set by click 2.
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Show the progress error toast and (re)start a single 5-second dismiss timer.
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

    // ── Optimistic update ────────────────────────────────────────────────────
    // Update the UI immediately so the user gets instant feedback.
    // We compute the new state once and reuse it across both the optimistic
    // update and the rollback, avoiding any state drift.
    const optimisticCompleted = new Set([...completedLessonIds, lessonId]);

    const optimisticProgress = (() => {
      if (!schema || schema.modules.length === 0) return null; // cannot compute
      const totalLessons = schema.modules.flatMap((m) => m.lessons).length;
      const completedCount = schema.modules
        .flatMap((m) => m.lessons)
        .filter((l) => optimisticCompleted.has(l.id)).length;
      return totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
    })();

    // Apply optimistic state — checkmark and progress bar update instantly
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

    // ── Server-side write: lesson completion + progress update ──────────────
    // The API route verifies enrollment, upserts lesson_completions (Write 1),
    // then recomputes and updates the enrollment progress % (Write 2).
    // Rollback logic below mirrors the previous two-write error handling exactly.
    let apiResult: { success?: boolean; error?: string } = {};
    try {
      const res = await fetch('/api/mark-lesson-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-protection': '1' },
        body: JSON.stringify({ courseSlug, lessonId }),
      });
      apiResult = await res.json().catch(() => ({ error: 'parse_failed' }));
      // Non-2xx and not a progress_failed (200) → treat as a completion failure
      if (!res.ok && apiResult.error !== 'progress_failed') {
        apiResult = { error: apiResult.error ?? 'completion_failed' };
      }
    } catch {
      apiResult = { error: 'completion_failed' };
    }

    if (apiResult.error === 'progress_failed') {
      // Write 1 succeeded — lesson IS saved. Keep the checkmark (it's true).
      // Write 2 failed — the progress % in DB is stale.
      // Roll back the progress bar only; do NOT remove the checkmark.
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
      // Write 1 failed (or network/parse error) — roll back both checkmark and progress bar.
      // The lesson is NOT saved; the UI must reflect that.
      console.error('[markLessonComplete] lesson_completions write failed:', apiResult.error);
      setCompletedLessonIds(completedLessonIds); // restore original set
      if (schema && optimisticProgress !== null) {
        setEnrolledCourses((prev) =>
          prev.map((c) => {
            if (c.slug !== courseSlug) return c;
            // Restore original nextLessonId using the pre-optimistic completedLessonIds
            const allLessons = schema.modules.flatMap((m) => m.lessons);
            const nextLesson = allLessons.find((l) => !completedLessonIds.has(l.id));
            // progress is read from the enrollment row — restore using original completed count
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
    // Input validation — runs before any Supabase call so invalid data is never written.
    // Build a sanitized copy — validated and trimmed values replace the originals.
    const sanitized = { ...data };
    if (sanitized.name !== undefined) {
      const trimmedName = sanitized.name.trim();
      if (!trimmedName) return { error: 'Name cannot be empty.' };
      if (trimmedName.length > 100) return { error: 'Name must be 100 characters or fewer.' };
      sanitized.name = trimmedName; // store the trimmed value, not the raw input
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
    // Password change is now handled server-side — the API route re-authenticates
    // the user with their current password before allowing the update.
    // This prevents an attacker with a hijacked session from changing the password
    // without knowing the current one.
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
    // All data deletion (lesson_completions, enrollments, payments, profiles)
    // now happens server-side in /api/delete-account using the service role key.
    // Previously these ran client-side BEFORE the API confirmed the auth
    // account was deleted — if the API failed the user's data was already gone.
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
