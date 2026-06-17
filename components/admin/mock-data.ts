// Mock data for admin dashboard — hardcoded fixtures for pages not yet wired to the API.
// All interfaces now live in adminTypes.ts. This file re-exports them so pages that still
// import from here continue to work without any changes until they are individually migrated.
//
// DO NOT import mockLeaderboard from here for new code — the leaderboard page now fetches
// from /api/admin/leaderboard. Import types from @/components/admin/adminTypes instead.

// ─────────────────────────────────────────────────────────────────────────────
// RE-EXPORT ALL TYPES (backward compatibility — do not remove)
// ─────────────────────────────────────────────────────────────────────────────

export type {
  Student,
  Course,
  Enrollment,
  Payment,
  Coupon,
  Referral,
  LeaderboardEntry,
  PointTxnType,
  PointTransaction,
} from '@/components/admin/adminTypes';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

import type {
  Student,
  Course,
  Enrollment,
  Payment,
  Coupon,
  Referral,
  LeaderboardEntry,
  PointTransaction,
} from '@/components/admin/adminTypes';

function deriveLearningPoints(progress: number): number {
  if (progress === 100) return 800;
  if (progress > 0) return 200;
  return 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK STUDENTS
// ─────────────────────────────────────────────────────────────────────────────

export const mockStudents: Student[] = [
  { id: '1',  name: 'Amina Hassan',     email: 'amina.hassan@email.com',     avatar: '', avatar_url: null, role: 'student', location: 'Lagos', bio: '', phone: '', referral_code: 'AMIN001', credit_balance: 3000,  lifetime_points: 5000, is_banned: false, last_login_at: '2024-04-20', created_at: '2024-01-15', enrollment_count: 3, total_paid_kobo: 45000000 },
  { id: '2',  name: 'Ibrahim Musa',     email: 'ibrahim.musa@email.com',     avatar: '', avatar_url: null, role: 'student', location: 'Kano', bio: '', phone: '', referral_code: 'IBRA001', credit_balance: 0,     lifetime_points: 0,     is_banned: false, last_login_at: '2024-02-10', created_at: '2024-01-20', enrollment_count: 2, total_paid_kobo: 30000000 },
  { id: '3',  name: 'Zainab Adeyemi',   email: 'zainab.adeyemi@email.com',   avatar: '', avatar_url: null, role: 'student', location: 'Abuja', bio: '', phone: '', referral_code: 'ZAIN001', credit_balance: 7500,  lifetime_points: 10000, is_banned: false, last_login_at: '2024-04-18', created_at: '2024-02-10', enrollment_count: 4, total_paid_kobo: 60000000 },
  { id: '4',  name: 'Chukwu Okonkwo',  email: 'chukwu.okonkwo@email.com',   avatar: '', avatar_url: null, role: 'student', location: 'Enugu', bio: '', phone: '', referral_code: 'CHUK001', credit_balance: 1500,  lifetime_points: 1500,  is_banned: false, last_login_at: '2024-01-15', created_at: '2024-02-15', enrollment_count: 1, total_paid_kobo: 15000000 },
  { id: '5',  name: 'Fatima Mohammed',  email: 'fatima.mohammed@email.com',  avatar: '', avatar_url: null, role: 'student', location: 'Kaduna', bio: '', phone: '', referral_code: 'FATI001', credit_balance: 2500,  lifetime_points: 2500,  is_banned: false, last_login_at: '2024-04-19', created_at: '2024-03-01', enrollment_count: 3, total_paid_kobo: 45000000 },
  { id: '6',  name: 'Chisom Eze',       email: 'chisom.eze@email.com',       avatar: '', avatar_url: null, role: 'student', location: 'Onitsha', bio: '', phone: '', referral_code: 'CHIS001', credit_balance: 0,     lifetime_points: 0,     is_banned: false, last_login_at: '2024-03-20', created_at: '2024-03-10', enrollment_count: 2, total_paid_kobo: 30000000 },
  { id: '7',  name: 'Aisha Bello',      email: 'aisha.bello@email.com',      avatar: '', avatar_url: null, role: 'student', location: 'Ilorin', bio: '', phone: '', referral_code: 'AISH001', credit_balance: 12000, lifetime_points: 15000, is_banned: false, last_login_at: '2024-04-22', created_at: '2024-03-15', enrollment_count: 5, total_paid_kobo: 75000000 },
  { id: '8',  name: 'Tunde Oluwafemi', email: 'tunde.oluwafemi@email.com',  avatar: '', avatar_url: null, role: 'student', location: 'Ibadan', bio: '', phone: '', referral_code: 'TUND001', credit_balance: 500,   lifetime_points: 1000,  is_banned: false, last_login_at: '2024-02-05', created_at: '2024-03-20', enrollment_count: 2, total_paid_kobo: 30000000 },
  { id: '9',  name: 'Mariam Suleiman',  email: 'mariam.suleiman@email.com',  avatar: '', avatar_url: null, role: 'student', location: 'Maiduguri', bio: '', phone: '', referral_code: 'MARI001', credit_balance: 4000,  lifetime_points: 4000,  is_banned: false, last_login_at: '2024-04-21', created_at: '2024-04-01', enrollment_count: 3, total_paid_kobo: 45000000 },
  { id: '10', name: 'Eze Nwankwo',      email: 'eze.nwankwo@email.com',      avatar: '', avatar_url: null, role: 'student', location: 'Port Harcourt', bio: '', phone: '', referral_code: 'EZEN001', credit_balance: 0,     lifetime_points: 0,     is_banned: true,  last_login_at: '2024-04-10', created_at: '2024-04-05', enrollment_count: 1, total_paid_kobo: 15000000 },
  { id: '11', name: 'Halima Abdullahi', email: 'halima.abdullahi@email.com', avatar: '', avatar_url: null, role: 'student', location: 'Katsina', bio: '', phone: '', referral_code: 'HALI001', credit_balance: 6000,  lifetime_points: 7500,  is_banned: false, last_login_at: '2024-04-23', created_at: '2024-04-10', enrollment_count: 4, total_paid_kobo: 60000000 },
  { id: '12', name: 'Segun Adebayo',    email: 'segun.adebayo@email.com',    avatar: '', avatar_url: null, role: 'student', location: 'Akure', bio: '', phone: '', referral_code: 'SEGU001', credit_balance: 0,     lifetime_points: 2500,  is_banned: false, last_login_at: '2024-03-10', created_at: '2024-04-15', enrollment_count: 2, total_paid_kobo: 30000000 },
];

// ─────────────────────────────────────────────────────────────────────────────
// MOCK COURSES - Deprecated: Use Supabase APIs instead
// ─────────────────────────────────────────────────────────────────────────────

// export const mockCourses: Course[] = [
// Courses should be fetched from Supabase
// ];

// ─────────────────────────────────────────────────────────────────────────────
// MOCK ENROLLMENTS - Deprecated: Use Supabase APIs instead
// ─────────────────────────────────────────────────────────────────────────────

// export const mockEnrollments: Enrollment[] = [
// Enrollments should be fetched from Supabase
// ];

// ─────────────────────────────────────────────────────────────────────────────
// MOCK PAYMENTS
// ─────────────────────────────────────────────────────────────────────────────

export const mockPayments: Payment[] = [
  { id: '1',  user_id: '1', course_slug: 'intro-web-dev',       paystack_reference: 'PSK_001', amount_kobo: 1500000, status: 'success', paid_at: '2024-01-20T10:00:00Z', points_applied: 1500, student_name: 'Amina Hassan', student_email: 'amina.hassan@email.com', course_title: 'Introduction to Web Development' },
  { id: '2',  user_id: '1', course_slug: 'advanced-react',      paystack_reference: 'PSK_002', amount_kobo: 2500000, status: 'success', paid_at: '2024-03-20T14:30:00Z', points_applied: 0, student_name: 'Amina Hassan', student_email: 'amina.hassan@email.com', course_title: 'Advanced React.js Mastery' },
  { id: '3',  user_id: '2', course_slug: 'intro-web-dev',       paystack_reference: 'PSK_003', amount_kobo: 1500000, status: 'success', paid_at: '2024-01-25T11:15:00Z', points_applied: 0, student_name: 'Ibrahim Musa', student_email: 'ibrahim.musa@email.com', course_title: 'Introduction to Web Development' },
  { id: '4',  user_id: '3', course_slug: 'advanced-react',      paystack_reference: 'PSK_004', amount_kobo: 2500000, status: 'success', paid_at: '2024-02-15T09:45:00Z', points_applied: 0, student_name: 'Zainab Adeyemi', student_email: 'zainab.adeyemi@email.com', course_title: 'Advanced React.js Mastery' },
  { id: '5',  user_id: '3', course_slug: 'fullstack-nextjs',    paystack_reference: 'PSK_005', amount_kobo: 3000000, status: 'success', paid_at: '2024-04-11T16:20:00Z', points_applied: 3000, student_name: 'Zainab Adeyemi', student_email: 'zainab.adeyemi@email.com', course_title: 'Full-Stack Web Development with Next.js' },
  { id: '6',  user_id: '5', course_slug: 'mobile-react-native', paystack_reference: 'PSK_006', amount_kobo: 2800000, status: 'success', paid_at: '2024-03-05T13:00:00Z', points_applied: 2500, student_name: 'Fatima Mohammed', student_email: 'fatima.mohammed@email.com', course_title: 'Mobile App Development with React Native' },
  { id: '7',  user_id: '6', course_slug: 'data-science-python', paystack_reference: 'PSK_007', amount_kobo: 3500000, status: 'success', paid_at: '2024-03-15T10:30:00Z', points_applied: 0, student_name: 'Chisom Eze', student_email: 'chisom.eze@email.com', course_title: 'Data Science with Python' },
  { id: '8',  user_id: '7', course_slug: 'advanced-react',      paystack_reference: 'PSK_008', amount_kobo: 2500000, status: 'success', paid_at: '2024-03-20T15:45:00Z', points_applied: 0, student_name: 'Aisha Bello', student_email: 'aisha.bello@email.com', course_title: 'Advanced React.js Mastery' },
  { id: '9',  user_id: '7', course_slug: 'fullstack-nextjs',    paystack_reference: 'PSK_009', amount_kobo: 3000000, status: 'success', paid_at: '2024-04-19T12:00:00Z', points_applied: 0, student_name: 'Aisha Bello', student_email: 'aisha.bello@email.com', course_title: 'Full-Stack Web Development with Next.js' },
];

// ─────────────────────────────────────────────────────────────────────────────
// MOCK COUPONS
// ─────────────────────────────────────────────────────────────────────────────

export const mockCoupons: Coupon[] = [
  { id: '1', code: 'SAVE10',      discount_percent: 10, used_count: 45, max_usage: 100, is_active: true, expires_at: '2024-12-31T23:59:59Z', created_at: '2024-01-01T00:00:00Z' },
  { id: '2', code: 'WELCOME20',   discount_percent: 20, used_count: 28, max_usage: 50,  is_active: true, expires_at: '2024-06-30T23:59:59Z', created_at: '2024-01-01T00:00:00Z' },
  { id: '3', code: 'LEARNING50',  discount_percent: 50, used_count: 12, max_usage: 25,  is_active: true, expires_at: '2024-05-31T23:59:59Z', created_at: '2024-02-01T00:00:00Z' },
  { id: '4', code: 'EARLYBIRD',   discount_percent: 30, used_count: 67, max_usage: 100, is_active: true, expires_at: '2024-12-31T23:59:59Z', created_at: '2024-01-15T00:00:00Z' },
  { id: '5', code: 'STUDENTDEAL', discount_percent: 25, used_count: 34, max_usage: 80,  is_active: true, expires_at: '2024-08-31T23:59:59Z', created_at: '2024-02-15T00:00:00Z' },
  { id: '6', code: 'NEWLAUNCHED', discount_percent: 15, used_count: 8,  max_usage: 200, is_active: true, expires_at: '2024-09-30T23:59:59Z', created_at: '2024-04-01T00:00:00Z' },
];



// ─────────────────────────────────────────────────────────────────────────────
// CHART DATA
// ─────────────────────────────────────────────────────────────────────────────

export const mockRevenueData = [
  { date: 'Apr 1',  revenue: 125000 }, { date: 'Apr 2',  revenue: 98000  },
  { date: 'Apr 3',  revenue: 156000 }, { date: 'Apr 4',  revenue: 142000 },
  { date: 'Apr 5',  revenue: 189000 }, { date: 'Apr 6',  revenue: 167000 },
  { date: 'Apr 7',  revenue: 201000 }, { date: 'Apr 8',  revenue: 176000 },
  { date: 'Apr 9',  revenue: 145000 }, { date: 'Apr 10', revenue: 198000 },
  { date: 'Apr 11', revenue: 213000 }, { date: 'Apr 12', revenue: 184000 },
  { date: 'Apr 13', revenue: 156000 }, { date: 'Apr 14', revenue: 167000 },
  { date: 'Apr 15', revenue: 234000 },
];

export const mockReferralConversions = [
  { date: 'Apr 9',  conversions: 1 }, { date: 'Apr 10', conversions: 3 },
  { date: 'Apr 11', conversions: 2 }, { date: 'Apr 12', conversions: 4 },
  { date: 'Apr 13', conversions: 1 }, { date: 'Apr 14', conversions: 5 },
  { date: 'Apr 15', conversions: 3 },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export const getRecentPayments = (limit = 5): Payment[] =>
  mockPayments.slice(0, limit);

export const getMetrics = () => {
  const totalRevenue = mockPayments
    .filter((p) => p.status === 'success')
    .reduce((sum, p) => sum + p.amount_kobo, 0) / 100; // Convert kobo to Naira

  const totalStudents        = mockStudents.length;
  const activeEnrollments    = 0; // Fetch from Supabase API instead
  const completedEnrollments = 0; // Fetch from Supabase API instead
  const creditsIssuedThisMonth = 0; // Fetch from Supabase API instead
  const pendingReferrals = 0; // Fetch from Supabase API instead

  return {
    totalRevenue,
    totalStudents,
    activeEnrollments,
    completedEnrollments,
    creditsIssuedThisMonth,
    pendingReferrals,
    referralConversionsLast7Days: mockReferralConversions,
  };
};
