// Mock data for admin dashboard - all hardcoded for now
// Will be replaced with API calls when real backend is integrated

export interface Student {
  id: string;
  name: string;
  email: string;
  joinDate: string;
  enrollmentCount: number;
  amountPaid: number;
  referralCount: number;
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
  points: number;
  coursesCompleted: number;
}

// Mock Students
export const mockStudents: Student[] = [
  {
    id: '1',
    name: 'Amina Hassan',
    email: 'amina.hassan@email.com',
    joinDate: '2024-01-15',
    enrollmentCount: 3,
    amountPaid: 45000,
    referralCount: 2,
  },
  {
    id: '2',
    name: 'Ibrahim Musa',
    email: 'ibrahim.musa@email.com',
    joinDate: '2024-01-20',
    enrollmentCount: 2,
    amountPaid: 30000,
    referralCount: 0,
  },
  {
    id: '3',
    name: 'Zainab Adeyemi',
    email: 'zainab.adeyemi@email.com',
    joinDate: '2024-02-10',
    enrollmentCount: 4,
    amountPaid: 60000,
    referralCount: 3,
  },
  {
    id: '4',
    name: 'Chukwu Okonkwo',
    email: 'chukwu.okonkwo@email.com',
    joinDate: '2024-02-15',
    enrollmentCount: 1,
    amountPaid: 15000,
    referralCount: 1,
  },
  {
    id: '5',
    name: 'Fatima Mohammed',
    email: 'fatima.mohammed@email.com',
    joinDate: '2024-03-01',
    enrollmentCount: 3,
    amountPaid: 45000,
    referralCount: 2,
  },
  {
    id: '6',
    name: 'Chisom Eze',
    email: 'chisom.eze@email.com',
    joinDate: '2024-03-10',
    enrollmentCount: 2,
    amountPaid: 30000,
    referralCount: 0,
  },
  {
    id: '7',
    name: 'Aisha Bello',
    email: 'aisha.bello@email.com',
    joinDate: '2024-03-15',
    enrollmentCount: 5,
    amountPaid: 75000,
    referralCount: 4,
  },
  {
    id: '8',
    name: 'Tunde Oluwafemi',
    email: 'tunde.oluwafemi@email.com',
    joinDate: '2024-03-20',
    enrollmentCount: 2,
    amountPaid: 30000,
    referralCount: 1,
  },
  {
    id: '9',
    name: 'Mariam Suleiman',
    email: 'mariam.suleiman@email.com',
    joinDate: '2024-04-01',
    enrollmentCount: 3,
    amountPaid: 45000,
    referralCount: 2,
  },
  {
    id: '10',
    name: 'Eze Nwankwo',
    email: 'eze.nwankwo@email.com',
    joinDate: '2024-04-05',
    enrollmentCount: 1,
    amountPaid: 15000,
    referralCount: 0,
  },
  {
    id: '11',
    name: 'Halima Abdullahi',
    email: 'halima.abdullahi@email.com',
    joinDate: '2024-04-10',
    enrollmentCount: 4,
    amountPaid: 60000,
    referralCount: 3,
  },
  {
    id: '12',
    name: 'Segun Adebayo',
    email: 'segun.adebayo@email.com',
    joinDate: '2024-04-15',
    enrollmentCount: 2,
    amountPaid: 30000,
    referralCount: 1,
  },
];

// Mock Courses
export const mockCourses: Course[] = [
  {
    id: '1',
    title: 'Introduction to Web Development',
    description: 'Learn the basics of HTML, CSS, and JavaScript',
    price: 15000,
    enrolledCount: 234,
    totalRevenue: 3510000,
    published: true,
    lessonsCount: 24,
    completionRate: 78,
  },
  {
    id: '2',
    title: 'Advanced React.js Mastery',
    description: 'Master advanced React patterns and optimization',
    price: 25000,
    enrolledCount: 156,
    totalRevenue: 3900000,
    published: true,
    lessonsCount: 32,
    completionRate: 82,
  },
  {
    id: '3',
    title: 'Full-Stack Web Development with Next.js',
    description: 'Build modern full-stack applications',
    price: 30000,
    enrolledCount: 89,
    totalRevenue: 2670000,
    published: true,
    lessonsCount: 40,
    completionRate: 71,
  },
  {
    id: '4',
    title: 'Mobile App Development with React Native',
    description: 'Create cross-platform mobile applications',
    price: 28000,
    enrolledCount: 67,
    totalRevenue: 1876000,
    published: true,
    lessonsCount: 36,
    completionRate: 65,
  },
  {
    id: '5',
    title: 'Data Science with Python',
    description: 'Learn data analysis and machine learning basics',
    price: 35000,
    enrolledCount: 45,
    totalRevenue: 1575000,
    published: true,
    lessonsCount: 28,
    completionRate: 58,
  },
  {
    id: '6',
    title: 'DevOps and Cloud Deployment',
    description: 'Master Docker, Kubernetes, and AWS',
    price: 32000,
    enrolledCount: 34,
    totalRevenue: 1088000,
    published: false,
    lessonsCount: 30,
    completionRate: 0,
  },
];

// Mock Enrollments
export const mockEnrollments: Enrollment[] = [
  {
    id: '1',
    studentId: '1',
    studentName: 'Amina Hassan',
    courseId: '1',
    courseName: 'Introduction to Web Development',
    dateEnrolled: '2024-01-20',
    progress: 100,
    completionDate: '2024-03-15',
    couponUsed: 'SAVE10',
    paymentType: 'paid',
    status: 'completed',
  },
  {
    id: '2',
    studentId: '1',
    studentName: 'Amina Hassan',
    courseId: '2',
    courseName: 'Advanced React.js Mastery',
    dateEnrolled: '2024-03-20',
    progress: 65,
    couponUsed: undefined,
    paymentType: 'paid',
    status: 'in-progress',
  },
  {
    id: '3',
    studentId: '2',
    studentName: 'Ibrahim Musa',
    courseId: '1',
    courseName: 'Introduction to Web Development',
    dateEnrolled: '2024-01-25',
    progress: 45,
    couponUsed: 'WELCOME20',
    paymentType: 'paid',
    status: 'in-progress',
  },
  {
    id: '4',
    studentId: '3',
    studentName: 'Zainab Adeyemi',
    courseId: '2',
    courseName: 'Advanced React.js Mastery',
    dateEnrolled: '2024-02-15',
    progress: 100,
    completionDate: '2024-04-10',
    couponUsed: undefined,
    paymentType: 'paid',
    status: 'completed',
  },
  {
    id: '5',
    studentId: '3',
    studentName: 'Zainab Adeyemi',
    courseId: '3',
    courseName: 'Full-Stack Web Development with Next.js',
    dateEnrolled: '2024-04-11',
    progress: 80,
    couponUsed: 'SAVE10',
    paymentType: 'paid',
    status: 'in-progress',
  },
  {
    id: '6',
    studentId: '4',
    studentName: 'Chukwu Okonkwo',
    courseId: '1',
    courseName: 'Introduction to Web Development',
    dateEnrolled: '2024-02-20',
    progress: 30,
    couponUsed: undefined,
    paymentType: 'free',
    status: 'in-progress',
  },
  {
    id: '7',
    studentId: '5',
    studentName: 'Fatima Mohammed',
    courseId: '4',
    courseName: 'Mobile App Development with React Native',
    dateEnrolled: '2024-03-05',
    progress: 100,
    completionDate: '2024-04-12',
    couponUsed: 'LEARNING50',
    paymentType: 'paid',
    status: 'completed',
  },
  {
    id: '8',
    studentId: '6',
    studentName: 'Chisom Eze',
    courseId: '5',
    courseName: 'Data Science with Python',
    dateEnrolled: '2024-03-15',
    progress: 50,
    couponUsed: undefined,
    paymentType: 'paid',
    status: 'in-progress',
  },
  {
    id: '9',
    studentId: '7',
    studentName: 'Aisha Bello',
    courseId: '2',
    courseName: 'Advanced React.js Mastery',
    dateEnrolled: '2024-03-20',
    progress: 100,
    completionDate: '2024-04-18',
    couponUsed: undefined,
    paymentType: 'paid',
    status: 'completed',
  },
  {
    id: '10',
    studentId: '7',
    studentName: 'Aisha Bello',
    courseId: '3',
    courseName: 'Full-Stack Web Development with Next.js',
    dateEnrolled: '2024-04-19',
    progress: 35,
    couponUsed: 'SAVE10',
    paymentType: 'paid',
    status: 'in-progress',
  },
];

// Mock Payments
export const mockPayments: Payment[] = [
  {
    id: '1',
    studentId: '1',
    studentName: 'Amina Hassan',
    courseId: '1',
    courseName: 'Introduction to Web Development',
    amount: 13500,
    currency: 'NGN',
    reference: 'PSK_1234567890_001',
    coupon: 'SAVE10',
    date: '2024-01-20',
    status: 'success',
  },
  {
    id: '2',
    studentId: '1',
    studentName: 'Amina Hassan',
    courseId: '2',
    courseName: 'Advanced React.js Mastery',
    amount: 25000,
    currency: 'NGN',
    reference: 'PSK_1234567890_002',
    coupon: undefined,
    date: '2024-03-20',
    status: 'success',
  },
  {
    id: '3',
    studentId: '2',
    studentName: 'Ibrahim Musa',
    courseId: '1',
    courseName: 'Introduction to Web Development',
    amount: 12000,
    currency: 'NGN',
    reference: 'PSK_1234567890_003',
    coupon: 'WELCOME20',
    date: '2024-01-25',
    status: 'success',
  },
  {
    id: '4',
    studentId: '3',
    studentName: 'Zainab Adeyemi',
    courseId: '2',
    courseName: 'Advanced React.js Mastery',
    amount: 25000,
    currency: 'NGN',
    reference: 'PSK_1234567890_004',
    coupon: undefined,
    date: '2024-02-15',
    status: 'success',
  },
  {
    id: '5',
    studentId: '3',
    studentName: 'Zainab Adeyemi',
    courseId: '3',
    courseName: 'Full-Stack Web Development with Next.js',
    amount: 27000,
    currency: 'NGN',
    reference: 'PSK_1234567890_005',
    coupon: 'SAVE10',
    date: '2024-04-11',
    status: 'success',
  },
  {
    id: '6',
    studentId: '4',
    studentName: 'Chukwu Okonkwo',
    courseId: '1',
    courseName: 'Introduction to Web Development',
    amount: 0,
    currency: 'NGN',
    reference: 'FREE_0001',
    coupon: undefined,
    date: '2024-02-20',
    status: 'success',
  },
  {
    id: '7',
    studentId: '5',
    studentName: 'Fatima Mohammed',
    courseId: '4',
    courseName: 'Mobile App Development with React Native',
    amount: 14000,
    currency: 'NGN',
    reference: 'PSK_1234567890_006',
    coupon: 'LEARNING50',
    date: '2024-03-05',
    status: 'success',
  },
  {
    id: '8',
    studentId: '6',
    studentName: 'Chisom Eze',
    courseId: '5',
    courseName: 'Data Science with Python',
    amount: 35000,
    currency: 'NGN',
    reference: 'PSK_1234567890_007',
    coupon: undefined,
    date: '2024-03-15',
    status: 'success',
  },
  {
    id: '9',
    studentId: '7',
    studentName: 'Aisha Bello',
    courseId: '2',
    courseName: 'Advanced React.js Mastery',
    amount: 25000,
    currency: 'NGN',
    reference: 'PSK_1234567890_008',
    coupon: undefined,
    date: '2024-03-20',
    status: 'success',
  },
  {
    id: '10',
    studentId: '7',
    studentName: 'Aisha Bello',
    courseId: '3',
    courseName: 'Full-Stack Web Development with Next.js',
    amount: 27000,
    currency: 'NGN',
    reference: 'PSK_1234567890_009',
    coupon: 'SAVE10',
    date: '2024-04-19',
    status: 'success',
  },
];

// Mock Coupons
export const mockCoupons: Coupon[] = [
  {
    id: '1',
    code: 'SAVE10',
    discountPercentage: 10,
    timesUsed: 45,
    maxUses: 100,
    expiryDate: '2024-12-31',
    active: true,
    createdDate: '2024-01-01',
  },
  {
    id: '2',
    code: 'WELCOME20',
    discountPercentage: 20,
    timesUsed: 28,
    maxUses: 50,
    expiryDate: '2024-06-30',
    active: true,
    createdDate: '2024-01-01',
  },
  {
    id: '3',
    code: 'LEARNING50',
    discountPercentage: 50,
    timesUsed: 12,
    maxUses: 25,
    expiryDate: '2024-05-31',
    active: true,
    createdDate: '2024-02-01',
  },
  {
    id: '4',
    code: 'EARLYBIRD',
    discountPercentage: 30,
    timesUsed: 67,
    maxUses: 100,
    expiryDate: '2024-12-31',
    active: true,
    createdDate: '2024-01-15',
  },
  {
    id: '5',
    code: 'STUDENTDEAL',
    discountPercentage: 25,
    timesUsed: 34,
    maxUses: 80,
    expiryDate: '2024-08-31',
    active: true,
    createdDate: '2024-02-15',
  },
  {
    id: '6',
    code: 'NEWLAUNCHED',
    discountPercentage: 15,
    timesUsed: 8,
    maxUses: 200,
    expiryDate: '2024-09-30',
    active: true,
    createdDate: '2024-04-01',
  },
];

// Mock Leaderboard
export const mockLeaderboard: Leaderboard[] = [
  {
    id: '1',
    position: 1,
    studentName: 'Aisha Bello',
    points: 850,
    coursesCompleted: 2,
  },
  {
    id: '2',
    position: 2,
    studentName: 'Zainab Adeyemi',
    points: 780,
    coursesCompleted: 2,
  },
  {
    id: '3',
    position: 3,
    studentName: 'Amina Hassan',
    points: 720,
    coursesCompleted: 1,
  },
  {
    id: '4',
    position: 4,
    studentName: 'Fatima Mohammed',
    points: 650,
    coursesCompleted: 1,
  },
  {
    id: '5',
    position: 5,
    studentName: 'Ibrahim Musa',
    points: 580,
    coursesCompleted: 0,
  },
  {
    id: '6',
    position: 6,
    studentName: 'Tunde Oluwafemi',
    points: 520,
    coursesCompleted: 0,
  },
  {
    id: '7',
    position: 7,
    studentName: 'Segun Adebayo',
    points: 450,
    coursesCompleted: 0,
  },
  {
    id: '8',
    position: 8,
    studentName: 'Chisom Eze',
    points: 400,
    coursesCompleted: 0,
  },
  {
    id: '9',
    position: 9,
    studentName: 'Mariam Suleiman',
    points: 340,
    coursesCompleted: 0,
  },
  {
    id: '10',
    position: 10,
    studentName: 'Halima Abdullahi',
    points: 320,
    coursesCompleted: 0,
  },
];

// Mock daily revenue data for charts
export const mockRevenueData = [
  { date: '2024-04-01', revenue: 125000 },
  { date: '2024-04-02', revenue: 98000 },
  { date: '2024-04-03', revenue: 156000 },
  { date: '2024-04-04', revenue: 142000 },
  { date: '2024-04-05', revenue: 189000 },
  { date: '2024-04-06', revenue: 167000 },
  { date: '2024-04-07', revenue: 201000 },
  { date: '2024-04-08', revenue: 176000 },
  { date: '2024-04-09', revenue: 145000 },
  { date: '2024-04-10', revenue: 198000 },
  { date: '2024-04-11', revenue: 213000 },
  { date: '2024-04-12', revenue: 184000 },
  { date: '2024-04-13', revenue: 156000 },
  { date: '2024-04-14', revenue: 167000 },
  { date: '2024-04-15', revenue: 234000 },
];

// Helper function to get recent payments
export const getRecentPayments = (limit: number = 5) => {
  return mockPayments.slice(0, limit);
};

// Helper function to calculate total metrics
export const getMetrics = () => {
  const totalRevenue = mockPayments
    .filter((p) => p.status === 'success')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalStudents = mockStudents.length;
  const activeEnrollments = mockEnrollments.filter(
    (e) => e.status === 'in-progress'
  ).length;
  const completedEnrollments = mockEnrollments.filter(
    (e) => e.status === 'completed'
  ).length;

  return {
    totalRevenue,
    totalStudents,
    activeEnrollments,
    completedEnrollments,
  };
};
