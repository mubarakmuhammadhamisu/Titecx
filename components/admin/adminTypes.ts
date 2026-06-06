// Admin type definitions — shared interfaces for all admin pages.
// This file contains only types/interfaces. No mock data lives here.
// Mock data (for pages not yet wired to the API) stays in mock-data.ts,
// which re-exports everything from this file for backward compatibility.

// ─────────────────────────────────────────────────────────────────────────────
// INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

export interface Student {
  id: string;
  name: string;
  email: string;
  joinDate: string;
  lastLogin: string;
  enrollmentCount: number;
  amountPaid: number;
  referralCount: number;
  isBanned: boolean;
  credit_balance: number;
  lifetime_points: number;
  referrals_sent: number;
  referrals_converted: number;
  total_commission_earned: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  enrolledCount: number;
  totalRevenue: number;
  published: boolean;
  lessonsCount: number;
  completionRate: number;
}

export interface Enrollment {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  dateEnrolled: string;
  progress: number;
  completionDate?: string;
  couponUsed?: string;
  paymentType: 'free' | 'paid';
  status: 'in-progress' | 'completed' | 'dropped';
  learning_points: number;
  referral_triggered: boolean;
  referrer_name: string | null;
}

export interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  amount: number;
  currency: string;
  reference: string;
  coupon?: string;
  date: string;
  status: 'success' | 'failed' | 'pending';
  credits_applied: number;
  credits_value_ngn: number;
  net_amount: number;
  referral_id: string | null;
}

export interface Coupon {
  id: string;
  code: string;
  discountPercentage: number;
  timesUsed: number;
  maxUses: number;
  expiryDate: string;
  active: boolean;
  createdDate: string;
}

export interface Leaderboard {
  id: string;
  position: number;
  studentName: string;
  studentId: string;
  lifetime_points: number;
  credit_balance: number;
  courses_completed: number;
  courses_in_progress: number;
  learning_points: number;
  points: number;
  coursesCompleted: number;
}

export type ReferralStatus = 'pending' | 'converted';

export interface ReferralRecord {
  id: string;
  referrer_id: string;
  referrer_name: string;
  referee_id: string;
  referee_name: string;
  referee_email: string;
  referral_code: string;
  created_at: string;
  status: ReferralStatus;
  converted_at: string | null;
  commission_credits: number;
  triggering_payment_id: string | null;
  triggering_payment_amount: number | null;
  admin_notes: string | null;
  manually_converted: boolean;
}

export type PointTxnType =
  | 'referral_commission'
  | 'manual_credit'
  | 'manual_deduction'
  | 'redemption'
  | 'expiry';

export interface PointTransaction {
  id: string;
  student_id: string;
  type: PointTxnType;
  amount: number;
  balance_after: number;
  description: string;
  reference_id: string | null;
  created_at: string;
  created_by: string;
}

export interface StudentPointSummary {
  student_id: string;
  student_name: string;
  credit_balance: number;
  lifetime_points: number;
  learning_points: number;
  transactions: PointTransaction[];
}
