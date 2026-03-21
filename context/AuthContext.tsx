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
  // true when the initial data fetch (profile / enrollments / courses) failed.
  // The dashboard uses this to show a "Reload Page" button instead of zeros.
  loadError: boolean;
  // Non-null when markLessonComplete failed to save to the DB.
  // Rendered as a toast in AppShellLayout. Clear it with clearProgressSaveError.
  progressSaveError: string | null;
  clearProgressSaveError: () => void;
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
  // true when the initial DB fetch fails — dashboard shows "Reload Page" instead of zeros
  const [loadError, setLoadError]             = useState(false);
  // Non-null when markLessonComplete fails — rendered as a toast in AppShellLayout
  const [progressSaveError, setProgressSaveError] = useState<string | null>(null);
  const router = useRouter();
  const loadedUserIdRef = useRef<string | null>(null);

  const clearProgressSaveError = () => setProgressSaveError(null);

  const loadUserData = useCallback(async (userId: string) => {
    setLoadError(false);
    try {
      // Fetch profile, enrollments, completions, and courses all in one round trip
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

      // Profile and courses are critical — without them the dashboard is broken.
      // Enrollment and completion errors are non-fatal; we show what we can.
      if (profileError || coursesError) {
        console.error('[loadUserData] Critical query failed:',
          profileError?.message ?? coursesError?.message);
        setLoadError(true);
        return;
      }

      if (enrollError)  console.warn('[loadUserData] enrollments fetch failed:', enrollError.message);
      if (compError)    console.warn('[loadUserData] completions fetch failed:', compError.message);

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
      // Unexpected JS error (e.g. network failure that threw instead of returning an error object)
      console.error('[loadUserData] Unexpected error:', err);
      setLoadError(true);
    }
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

    // ── Profile creation ──────────────────────────────────────────────────────
    // IMPORTANT: When Supabase "Confirm email" is ON (required in production),
    // signUp() returns a user object but NO active session. Without a session,
    // auth.uid() is null inside Supabase, so the RLS policy (auth.uid() = id)
    // silently blocks any INSERT/UPSERT from the browser client.
    //
    // The reliable solution is the Database Trigger defined in SUPABASE_SETUP.md
    // (Step 5 — "Auto-create profile on signup"). That trigger fires inside
    // Supabase itself when the auth.users row is created, before any RLS check,
    // so it always succeeds regardless of whether the user has a session.
    //
    // If the trigger is active: the profile row already exists by the time the
    // user confirms their email and logs in, and loadUserData() will find it.
    //
    // If the trigger is NOT active AND email confirmation is ON:
    //   - The upsert below will fail silently (RLS blocks it)
    //   - The user will see a broken empty dashboard after confirming
    //   - Fix: enable the trigger in Supabase, or create a /api/register
    //     server route that uses the service_role key to bypass RLS.
    //
    // When email confirmation is OFF (local dev / testing):
    //   - data.session is present, auth.uid() works, upsert succeeds normally.

    if (data.session) {
      // Session exists → email confirmation is OFF → safe to write from client.
      const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id, name, email,
        avatar: initials, role: 'Member', location: '', bio: '', phone: '',
        preferences: { email_notifications: true, course_recommendations: true, weekly_digest: false },
      });
      if (profileError) {
        // Log for debugging but do not surface to the user — the trigger
        // is the authoritative profile creator in production.
        console.warn('[register] Profile upsert failed (session present):', profileError.message);
      }
    }
    // If data.session is null (email confirmation pending), we intentionally
    // skip the upsert here and rely on the DB trigger to create the profile.
    // Attempting the upsert without a session would fail silently due to RLS
    // and could mask the real issue. The trigger is the correct fix.

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

    // ── Write 1: record the lesson completion ─────────────────────────────────
    const { error: completionError } = await supabase.from('lesson_completions').upsert({
      user_id: user.id, course_slug: courseSlug, lesson_id: lessonId,
    }, { onConflict: 'user_id,course_slug,lesson_id' });

    if (completionError) {
      // DB write failed — do NOT update local state. The UI must not lie about
      // what is saved. Show a toast so the user knows to retry.
      console.error('[markLessonComplete] lesson_completions write failed:', completionError.message);
      setProgressSaveError('Failed to save progress. Please check your connection.');
      // Auto-clear the toast after 5 seconds
      setTimeout(() => setProgressSaveError(null), 5000);
      return;
    }

    const schema = courses.find((c) => c.slug === courseSlug);
    if (schema) {
      const totalLessons = schema.modules.flatMap((m) => m.lessons).length;
      const newCompleted = new Set([...completedLessonIds, lessonId]);
      const completedInCourse = schema.modules
        .flatMap((m) => m.lessons)
        .filter((l) => newCompleted.has(l.id)).length;
      const newProgress = totalLessons > 0
        ? Math.round((completedInCourse / totalLessons) * 100)
        : 0;

      // ── Write 2: update progress percentage on the enrollment row ──────────
      const { error: progressError } = await supabase.from('enrollments')
        .update({ progress: newProgress, completed_at: newProgress === 100 ? new Date().toISOString() : null })
        .eq('user_id', user.id)
        .eq('course_slug', courseSlug);

      if (progressError) {
        // The lesson IS saved (write 1 succeeded) but the progress % failed.
        // Update completedLessonIds so the checkmark shows correctly, but do
        // NOT update the progress bar — it would be a lie about what is in DB.
        console.error('[markLessonComplete] enrollments update failed:', progressError.message);
        setCompletedLessonIds(newCompleted);
        setProgressSaveError('Failed to save progress. Please check your connection.');
        setTimeout(() => setProgressSaveError(null), 5000);
        return;
      }

      // ── Both writes confirmed — now it is safe to update the UI ───────────
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

    // Step 1: upload file to Storage and get back the public URL and storage path
    const { url, path, error: uploadError } = await uploadAvatar(user.id, file);
    if (uploadError || !url || !path) return { error: uploadError ?? 'Upload failed.' };

    // Step 2: save the URL to the profiles table
    const { error: dbError } = await supabase.from('profiles')
      .update({ avatar_url: url })
      .eq('id', user.id);

    if (dbError) {
      // ── ROLLBACK: DB save failed — delete the just-uploaded file from Storage ──
      // Without this, the file sits in the bucket permanently with no reference
      // to it in the DB (an "orphaned" file). Clean it up immediately.
      await supabase.storage.from('avatars').remove([path]);
      // Do NOT update local state — the avatar_url in the DB is still the old one.
      console.error('[updateAvatar] profiles update failed, storage file rolled back:', dbError.message);
      return { error: 'Failed to save your avatar. Please try again.' };
    }

    // Both steps succeeded — safe to update the local state
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

    try {
      // ── Step 1: Delete the Auth user via the secured API route FIRST ───────
      // The API route reads the identity from the JWT cookie — it does not
      // trust any userId we send. We still include userId so the route can
      // do a sanity log, but the actual deletion is based on the session.
      //
      // CRITICAL: if this step fails the user's Supabase Auth account still
      // exists. We must NOT delete their data yet — they would be locked out
      // permanently (can't log in: no profile; can't register: email taken).
      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!res.ok) {
        // Auth account NOT deleted — safe to surface the error and stop here.
        const body = await res.json().catch(() => ({}));
        return {
          error: body.error ?? 'Failed to delete account. Please contact support@TITECX.com.',
        };
      }

      // ── Step 2: Auth account is confirmed deleted — now clean up DB rows ──
      // Order: most dependent tables first, then the root profile row.
      // Errors here are non-fatal: the Auth user is already gone so the rows
      // are orphaned anyway and Supabase's ON DELETE CASCADE will handle them.
      await supabase.from('lesson_completions').delete().eq('user_id', user.id);
      await supabase.from('enrollments').delete().eq('user_id', user.id);
      await supabase.from('payments').delete().eq('user_id', user.id);
      await supabase.from('profiles').delete().eq('id', user.id);

      // ── Step 3: Clear local state and redirect ─────────────────────────────
      await supabase.auth.signOut();
      setUser(null);
      setEnrolledCourses([]);
      setCompletedLessonIds(new Set());
      setCourses([]);
      router.push('/');
      return {};

    } catch (err: unknown) {
      // Unexpected network error — Auth account status is unknown.
      // Return an error rather than proceeding with any data deletion.
      const message = err instanceof Error ? err.message : 'Unexpected error.';
      return { error: `Account deletion failed: ${message} Please contact support@TITECX.com.` };
    }
  };

  const isEnrolled    = (slug: string)     => enrolledCourses.some((c) => c.slug === slug);
  const isLessonCompleted = (lessonId: string) => completedLessonIds.has(lessonId);

  return (
    <AuthContext.Provider value={{
      user, courses, enrolledCourses, completedLessonIds,
      isEnrolled, isLessonCompleted, isLoading,
      loadError, progressSaveError, clearProgressSaveError,
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
