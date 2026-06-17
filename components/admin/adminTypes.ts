// ─────────────────────────────────────────────────────────────────────────────
// components/admin/adminTypes.ts
// ALL admin types derived strictly from the real Supabase schema.
// Zero mock data. Zero invented fields.
// ─────────────────────────────────────────────────────────────────────────────

import type { Module, Lesson, LessonType, VideoProvider, PracticeContent, TestCase, VideoContent, ReadingContent, QuizContent } from '@/lib/Course';

// ── profiles ─────────────────────────────────────────────────────────────────
export interface Student {
  id: string;
  name: string;
  email: string;
  avatar: string;
  avatar_url: string | null;
  role: string;
  location: string;
  bio: string;
  phone: string;
  referral_code: string;
  credit_balance: number;
  lifetime_points: number;
  is_banned: boolean;
  last_login_at: string | null;
  created_at: string;
  // enriched
  enrollment_count: number;
  total_paid_kobo: number;
}

// Lesson and Module types are imported from lib/Course.ts to stay in sync with the CoursePlayer.
// The admin curriculum builder writes data in this exact shape into courses.modules JSONB.
// Re-exporting for convenience to consumers of this types file.
export type { Module, Lesson, LessonType, VideoProvider, PracticeContent, TestCase, VideoContent, ReadingContent, QuizContent };

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  points: number;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  description: string;
  level: string;
  duration: string;
  price: string;
  instructor: string;
  thumbnail: string;
  gradient_from: string;
  gradient_to: string;
  features: string[];
  curriculum: string[];
  modules: Module[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
  premium_price: string | null;
  premium_deadline_days: number;
  // enriched
  enrolled_count: number;
  total_revenue_kobo: number;
}

// ── enrollments ───────────────────────────────────────────────────────────────
export interface Enrollment {
  id: string;
  user_id: string;
  course_slug: string;
  progress: number;
  enrolled_at: string;
  completed_at: string | null;
  purchase_type: string;
  premium_deadline: string | null;
  mystery_box_status: string | null;
  // enriched
  student_name: string;
  student_email: string;
  course_title: string;
  referral_triggered: boolean;
  referrer_name: string | null;
}

// ── payments ──────────────────────────────────────────────────────────────────
export interface Payment {
  id: string;
  user_id: string;
  course_slug: string;
  paystack_reference: string;
  amount_kobo: number;
  status: 'success' | 'failed' | 'pending';
  paid_at: string;
  points_applied: number;
  // enriched
  student_name: string;
  student_email: string;
  course_title: string;
}

// ── referrals ─────────────────────────────────────────────────────────────────
export interface Referral {
  id: string;
  referrer_id: string;
  referee_id: string;
  referred_at: string;
  status: 'pending' | 'converted' | 'expired';
  converted_at: string | null;
  commission_points: number | null;
  payment_id: string | null;
  // enriched
  referrer_name: string;
  referrer_email: string;
  referee_name: string;
  referee_email: string;
}

// ── point_transactions ────────────────────────────────────────────────────────
export type PointTxnType =
  | 'referral_commission'
  | 'manual_credit'
  | 'manual_deduction'
  | 'redemption'
  | 'expiry';

export interface PointTransaction {
  id: string;
  user_id: string;
  type: PointTxnType;
  points: number;
  description: string | null;
  reference_id: string | null;
  created_at: string;
  // enriched
  student_name: string;
  student_email: string;
  credit_balance: number;
}

// ── coupons ───────────────────────────────────────────────────────────────────
export interface Coupon {
  id: string;
  code: string;
  discount_percent: number;
  max_usage: number;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

// ── mystery_box_requests ──────────────────────────────────────────────────────
export type MysteryBoxStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'forfeited';

export interface MysteryBoxRequest {
  id: string;
  user_id: string;
  enrollment_id: string;
  status: MysteryBoxStatus;
  tracking_number: string | null;
  delivery_name: string | null;
  delivery_address: string | null;
  delivery_city: string | null;
  delivery_state: string | null;
  delivery_phone: string | null;
  notes: string | null;
  earned_at: string | null;
  updated_at: string | null;
  // enriched
  student_name: string;
  student_email: string;
  course_title: string;
}

// ── leaderboard_view ──────────────────────────────────────────────────────────
export interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  avatar_url: string | null;
  lifetime_points: number;
  credit_balance: number;
  courses_completed: number;
  rank: number;
}

// ── platform_settings ─────────────────────────────────────────────────────────
export interface PlatformSetting {
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
}

// ── admin stats ───────────────────────────────────────────────────────────────
export interface AdminStats {
  total_revenue_kobo: number;
  total_students: number;
  active_enrollments: number;
  completed_enrollments: number;
  revenue_by_day: { date: string; revenue_kobo: number }[];
  recent_payments: Payment[];
}
