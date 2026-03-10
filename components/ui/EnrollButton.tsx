'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShoppingCart, Zap, CheckCircle, ArrowRight } from 'lucide-react';

export default function EnrollButton({ slug, price }: { slug: string; price: string }) {
  const { user, isEnrolled } = useAuth();
  const router = useRouter();
  const isFree = price === 'Free';
  const alreadyEnrolled = isEnrolled(slug);

  const handleClick = () => {
    // Already enrolled — go straight into the course
    if (alreadyEnrolled) {
      router.push(`/dashboard/courses/${slug}`);
      return;
    }

    // Not logged in — send to login, redirect back to this course page after
    if (!user) {
      router.push(`/login?redirect=/courses/${slug}`);
      return;
    }

    // Logged in — go to checkout page (free or paid, same flow)
    // Actual enrollment happens ONLY after the user confirms on checkout
    router.push(`/dashboard/checkout/${slug}`);
  };

  if (alreadyEnrolled) {
    return (
      <button
        onClick={handleClick}
        className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition shadow-lg shadow-emerald-500/20"
      >
        <CheckCircle size={16} />
        Already Enrolled — Go to Course
        <ArrowRight size={16} />
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition shadow-lg shadow-indigo-500/20"
    >
      {isFree ? <Zap size={16} /> : <ShoppingCart size={16} />}
      {isFree ? 'Enroll for Free' : 'Enroll Now'}
    </button>
  );
}
