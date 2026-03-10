'use client';

// Smart enroll button:
// - If user is logged in  → go to /dashboard/checkout/[slug]
// - If not logged in      → go to /login?redirect=/dashboard/checkout/[slug]
// This way, after login, the user lands directly on the checkout page for the course they wanted.

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShoppingCart, Zap } from 'lucide-react';

export default function EnrollButton({ slug, price }: { slug: string; price: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const isFree = price === 'Free';

  const handleClick = () => {
    const checkoutPath = `/dashboard/checkout/${slug}`;
    if (user) {
      router.push(checkoutPath);
    } else {
      router.push(`/login?redirect=${encodeURIComponent(checkoutPath)}`);
    }
  };

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
