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
import { Award, CheckCircle2, Shield, Hash, Package, Trophy } from 'lucide-react';

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
  let isPremium = false;

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
      .select('id, progress, completed_at, purchase_type, profiles(name)')
      .eq('user_id', user.id)
      .eq('course_slug', slug)
      .maybeSingle();

    const isCompleted =
      enrollment &&
      (enrollment.progress >= 100 || enrollment.completed_at);

    if (isCompleted) {
      verificationId = enrollment.id.slice(0, 8).toUpperCase();
      const profileData = enrollment.profiles as { name?: string } | null;
      studentName = profileData?.name ?? null;
      isPremium = enrollment.purchase_type === 'premium';
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar />

      <section className="max-w-3xl mx-auto px-4 py-16">

        {/* Verification badge */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Shield size={16} className={isPremium ? 'text-pink-400' : 'text-emerald-400'} />
          <span className={`text-sm font-medium tracking-wide uppercase ${isPremium ? 'text-pink-400' : 'text-emerald-400'}`}>
            {isPremium ? 'Premium Certificate' : 'Verified Certificate'}
          </span>
        </div>

        {/* Certificate card */}
        <div className={`relative rounded-3xl border-2 bg-gray-900 overflow-hidden ${
          isPremium
            ? 'border-pink-500/50 shadow-[0_0_80px_rgba(236,72,153,0.20)]'
            : 'border-indigo-500/40 shadow-[0_0_60px_rgba(99,102,241,0.15)]'
        }`}>

          {/* Top accent bar */}
          <div className={`h-2 ${isPremium ? 'bg-gradient-to-r from-pink-500 via-fuchsia-500 to-pink-500' : 'bg-linear-to-r from-indigo-500 via-purple-500 to-indigo-500'}`} />

          <div className="px-8 py-12 text-center space-y-6">

            {/* Premium exclusive badge */}
            {isPremium && (
              <div className="flex items-center justify-center gap-2">
                <span className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500/20 to-fuchsia-500/20 border border-pink-500/40 text-pink-300 text-xs font-bold px-4 py-1.5 rounded-full">
                  <Trophy size={12} />
                  Premium Completion — Challenge Completed
                </span>
              </div>
            )}

            {/* Issuer */}
            <p className={`text-xs font-bold tracking-[0.25em] uppercase ${isPremium ? 'text-pink-400' : 'text-indigo-400'}`}>
              TITECX Academy
            </p>

            {/* Certificate of completion heading */}
            <div>
              <p className="text-gray-400 text-sm mb-2">Certificate of Completion</p>
              <p className="text-gray-400 text-sm">This certifies successful completion of</p>
            </div>

            {/* Course title */}
            <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
              {course.title}
            </h1>

            {/* Student name */}
            {studentName && (
              <div className="space-y-1">
                <p className="text-gray-400 text-sm">Awarded to</p>
                <p className={`text-2xl font-bold ${isPremium ? 'text-pink-300' : 'text-indigo-300'}`}>{studentName}</p>
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-4 justify-center">
              <div className={`h-px flex-1 ${isPremium ? 'bg-pink-500/20' : 'bg-indigo-500/20'}`} />
              <Award size={24} className={isPremium ? 'text-pink-400' : 'text-indigo-400'} />
              <div className={`h-px flex-1 ${isPremium ? 'bg-pink-500/20' : 'bg-indigo-500/20'}`} />
            </div>

            {/* Course details — gap-2 keeps the 3 cells readable on 320px screens */}
            <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto">
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
              <CheckCircle2 size={18} className={isPremium ? 'text-pink-400' : 'text-emerald-400'} />
              <span className={`text-sm font-medium ${isPremium ? 'text-pink-400' : 'text-emerald-400'}`}>
                Issued by TITECX · {(process.env.NEXT_PUBLIC_APP_URL ?? 'titecx-mb.vercel.app').replace(/^https?:\/\//, '')}
              </span>
            </div>

            {/* Premium physical reward note */}
            {isPremium && verificationId && (
              <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-pink-500/10 border border-pink-500/20 mx-auto max-w-sm">
                <Package size={14} className="text-pink-400 shrink-0" />
                <span className="text-xs text-pink-200">
                  Your printed certificate & mystery box are being processed.
                </span>
              </div>
            )}

            {/* Verification ID */}
            {verificationId && (
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg mx-auto border ${
                isPremium
                  ? 'bg-pink-500/10 border-pink-500/20'
                  : 'bg-indigo-500/10 border-indigo-500/20'
              }`}>
                <Hash size={14} className={isPremium ? 'text-pink-400 shrink-0' : 'text-indigo-400 shrink-0'} />
                <span className="text-xs text-gray-400 font-mono">
                  Verification ID:{' '}
                  <span className={`font-bold ${isPremium ? 'text-pink-300' : 'text-indigo-300'}`}>{verificationId}</span>
                </span>
              </div>
            )}
          </div>

          {/* Bottom accent bar */}
          <div className={`h-1 ${isPremium ? 'bg-gradient-to-r from-pink-500/0 via-pink-500/40 to-pink-500/0' : 'bg-linear-to-r from-indigo-500/0 via-indigo-500/40 to-indigo-500/0'}`} />
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
