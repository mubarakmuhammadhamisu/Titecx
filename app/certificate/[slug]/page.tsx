// app/certificate/[slug]/page.tsx
//
// Public certificate page — no auth redirect.
// Anyone who has the link can view the certificate.
//
// If the viewer is the course owner (logged in with a completed enrollment):
//   → Shows their name, the course title, and a Verification ID.
// If the viewer is not logged in (or hasn't completed the course):
//   → Shows the course certificate template without personal details.
//
// The admin client is used for the enrollment + profile join so RLS doesn't
// interfere with reads — this is a public display, not a mutating operation.

import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import CopyLinkButton from '@/components/ui/CopyLinkButton';
import { getCourseBySlug } from '@/lib/courses';
import { Award, CheckCircle2, Shield, Hash } from 'lucide-react';

type PageProps = { params: Promise<{ slug: string }> };

export default async function CertificatePage({ params }: PageProps) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  // getCourseBySlug returns null for unknown or unpublished slugs
  if (!course) return notFound();

  // ── Soft session check — NO redirect; public page ─────────────────────────
  // We try to read the session so we can personalise the certificate if the
  // viewer is the student who earned it. Non-logged-in visitors still see the
  // course certificate template — we just omit their personal details.
  const cookieStore = await cookies();
  const sessionClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_Publishable_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await sessionClient.auth.getUser();

  // ── Personalisation: fetch enrollment + student name ──────────────────────
  // Only runs if a session exists. Uses the service-role client so RLS on the
  // enrollments and profiles tables doesn't block the join.
  let studentName: string | null = null;
  let verificationId: string | null = null;

  if (user) {
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Join enrollments with profiles to fetch the student's display name.
    // The 'profiles(name)' syntax uses Supabase's PostgREST FK relationship
    // between enrollments.user_id → profiles.id.
    const { data: enrollment } = await adminClient
      .from('enrollments')
      .select('id, progress, completed_at, profiles(name)')
      .eq('user_id', user.id)
      .eq('course_slug', slug)
      .maybeSingle();

    const isCompleted =
      enrollment &&
      (enrollment.progress >= 100 || enrollment.completed_at);

    if (isCompleted) {
      // Verification ID = first 8 chars of the DB UUID, uppercased.
      verificationId = enrollment.id.slice(0, 8).toUpperCase();
      // The join returns profiles as an object; cast because nested select types are broad.
      const profileData = enrollment.profiles as { name?: string } | null;
      studentName = profileData?.name ?? null;
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar />

      <section className="max-w-3xl mx-auto px-4 py-16">

        {/* Verification badge */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Shield size={16} className="text-emerald-400" />
          <span className="text-emerald-400 text-sm font-medium tracking-wide uppercase">
            Verified Certificate
          </span>
        </div>

        {/* Certificate card */}
        <div className="relative rounded-3xl border-2 border-indigo-500/40 bg-gray-900
                        shadow-[0_0_60px_rgba(99,102,241,0.15)] overflow-hidden">

          {/* Top accent bar */}
          <div className="h-2 bg-linear-to-r from-indigo-500 via-purple-500 to-indigo-500" />

          <div className="px-8 py-12 text-center space-y-6">

            {/* Issuer */}
            <p className="text-xs font-bold text-indigo-400 tracking-[0.25em] uppercase">
              TITECX Academy
            </p>

            {/* Certificate of completion heading */}
            <div>
              <p className="text-gray-400 text-sm mb-2">Certificate of Completion</p>
              <p className="text-gray-400 text-sm">This certifies successful completion of</p>
            </div>

            {/* Course title — the centrepiece */}
            <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
              {course.title}
            </h1>

            {/* Student name — only shown when the logged-in viewer owns this cert */}
            {studentName && (
              <div className="space-y-1">
                <p className="text-gray-400 text-sm">Awarded to</p>
                <p className="text-2xl font-bold text-indigo-300">{studentName}</p>
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-4 justify-center">
              <div className="h-px flex-1 bg-indigo-500/20" />
              <Award size={24} className="text-indigo-400" />
              <div className="h-px flex-1 bg-indigo-500/20" />
            </div>

            {/* Course details */}
            <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
              {[
                { label: 'Level',      value: course.level      },
                { label: 'Duration',   value: course.duration   },
                { label: 'Instructor', value: course.instructor },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-sm font-semibold text-gray-200">{value}</p>
                </div>
              ))}
            </div>

            {/* Verified checkmark */}
            <div className="flex items-center justify-center gap-2 pt-2">
              <CheckCircle2 size={18} className="text-emerald-400" />
              <span className="text-sm text-emerald-400 font-medium">
                Issued by TITECX · {(process.env.NEXT_PUBLIC_APP_URL ?? 'titecx-mb.vercel.app').replace(/^https?:\/\//, '')}
              </span>
            </div>

            {/* Verification ID — only shown when the viewer owns this cert */}
            {verificationId && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg
                              bg-indigo-500/10 border border-indigo-500/20 mx-auto">
                <Hash size={14} className="text-indigo-400 shrink-0" />
                <span className="text-xs text-gray-400 font-mono">
                  Verification ID:{' '}
                  <span className="text-indigo-300 font-bold">{verificationId}</span>
                </span>
              </div>
            )}
          </div>

          {/* Bottom accent bar */}
          <div className="h-1 bg-linear-to-r from-indigo-500/0 via-indigo-500/40 to-indigo-500/0" />
        </div>

        {/* Actions */}
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard/achievements"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                       bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition"
          >
            ← Back to Achievements
          </Link>
          {/* CopyLinkButton is a 'use client' component — handles onClick safely */}
          <CopyLinkButton />
        </div>
      </section>

      <Footer />
    </main>
  );
}
