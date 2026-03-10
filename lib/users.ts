// ─────────────────────────────────────────────
// Demo Users
// Replace this entire file with Supabase auth calls when ready.
// Each user has a subset of courses they are enrolled in (by course slug).
// ─────────────────────────────────────────────

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  password: string;           // plain text for demo — hash in production
  avatar: string;             // initials
  role: string;
  location: string;
  bio: string;
  phone: string;
  enrolledSlugs: string[];    // which courseSchema slugs this user is enrolled in
  enrolledProgress: Record<string, number>; // slug → 0-100
}

export const demoUsers: DemoUser[] = [
  {
    id: 'user_001',
    name: 'Mubarak Muhammad',
    email: 'mubarak@learnify.com',
    password: 'Learn@2025',
    avatar: 'M',
    role: 'Premium Member',
    location: 'Kano, Nigeria',
    bio: 'Passionate learner building skills in web development, AI, and cloud computing.',
    phone: '+234 800 000 0001',
    enrolledSlugs: [
      'nextjs-for-beginners-full',
      'react-fundamentals',
      'fullstack-web-development',
      'advanced-python',
    ],
    enrolledProgress: {
      'nextjs-for-beginners-full': 75,
      'react-fundamentals': 40,
      'fullstack-web-development': 60,
      'advanced-python': 100,
    },
  },
  {
    id: 'user_002',
    name: 'Aisha Bello',
    email: 'aisha@learnify.com',
    password: 'Learn@2025',
    avatar: 'A',
    role: 'Pro Member',
    location: 'Lagos, Nigeria',
    bio: 'Frontend developer transitioning into full-stack engineering.',
    phone: '+234 800 000 0002',
    enrolledSlugs: [
      'react-fundamentals',
      'machine-learning',
      'data-science',
    ],
    enrolledProgress: {
      'react-fundamentals': 90,
      'machine-learning': 55,
      'data-science': 20,
    },
  },
  {
    id: 'user_003',
    name: 'Chukwuemeka Obi',
    email: 'emeka@learnify.com',
    password: 'Learn@2025',
    avatar: 'C',
    role: 'Free Member',
    location: 'Abuja, Nigeria',
    bio: 'Cloud enthusiast learning AWS and DevOps practices.',
    phone: '+234 800 000 0003',
    enrolledSlugs: [
      'cloud-aws',
      'nextjs-for-beginners-full',
    ],
    enrolledProgress: {
      'cloud-aws': 85,
      'nextjs-for-beginners-full': 30,
    },
  },
];

// ─────────────────────────────────────────────
// Lookup helper (replaces Supabase query later)
// ─────────────────────────────────────────────
export function getUserByCredentials(
  email: string,
  password: string
): DemoUser | null {
  return (
    demoUsers.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.password === password
    ) ?? null
  );
}
