export type LessonType = 'video' | 'reading' | 'quiz';
export type LessonStatus = 'completed' | 'current' | 'locked';
export type FilterStatus = 'all' | 'in-progress' | 'completed';

export interface VideoContent { videoUrl: string; duration: string; topics?: string[]; }
export interface ReadingContent { markdownBody: string; topics?: string[]; }
export interface QuizContent {
  questions: Array<{ id: string; question: string; options: string[]; correctAnswer: number }>;
  topics?: string[];
}

export interface Lesson { id: string; title: string; type: LessonType; status: LessonStatus; content: VideoContent | ReadingContent | QuizContent; }
export interface Module { id: string; title: string; lessons: Lesson[]; }

export interface CourseSchema {
  id: string; slug: string; title: string; shortDescription: string; description: string;
  level: string; duration: string; price: string; instructor: string;
  thumbnail: string; gradientFrom: string; gradientTo: string;
  features: string[]; curriculum: string[]; modules: Module[];
}

export interface EnrolledCourse {
  id: string;           // UUID from enrollments table
  slug: string;
  title: string;
  instructor: string;
  progress: number;
  duration: string;
  students: number;
  thumbnail: string;
  gradientFrom: string;
  gradientTo: string;
  nextLessonId?: string;
  completedAt?: string | null;
  enrolledAt?: string;
}

// ─── Course catalogue (local static data until admin dashboard exists) ────────
export const courseSchemas: CourseSchema[] = [
  {
    id: 'course_nextjs_001', slug: 'nextjs-for-beginners-full', title: 'Next.js for Beginners',
    shortDescription: 'Learn how to build modern React apps using Next.js.',
    description: 'A complete introduction to Next.js, covering routing, layouts, data fetching, and deployment.',
    level: 'Beginner', duration: '6 hours', price: 'Free', instructor: 'TITECX Team',
    thumbnail: '/courses/nextjs.svg', gradientFrom: 'from-indigo-500/20', gradientTo: 'to-purple-500/20',
    features: ['Project-based learning', 'Modern App Router', 'Best practices'],
    curriculum: ['Introduction to Next.js', 'App Router Basics', 'Layouts & Pages', 'Data Fetching', 'Deployment'],
    modules: [
      {
        id: 'module_1', title: 'Introduction to Next.js',
        lessons: [
          { id: 'lesson_1_1', title: 'What is Next.js?', type: 'video', status: 'current', content: { videoUrl: 'https://www.youtube.com/embed/Sklc_fQBmcs', duration: '12:30', topics: ['Framework Overview', 'Setup', 'Key Concepts'] } },
          { id: 'lesson_1_2', title: 'Installation and Setup', type: 'reading', status: 'locked', content: { markdownBody: '# Installation and Setup\n\n## Prerequisites\n- Node.js 16.8 or later\n- npm or yarn package manager\n\n## Step 1: Create a new Next.js app\n```bash\nnpx create-next-app@latest my-app\n```\n\n## Step 3: Run the development server\n```bash\nnpm run dev\n```\n\nVisit http://localhost:3000 to see your app running!', topics: ['Installation', 'Project Structure', 'Running Dev Server'] } },
        ],
      },
      {
        id: 'module_2', title: 'App Router Basics',
        lessons: [
          { id: 'lesson_2_1', title: 'Understanding the App Router', type: 'video', status: 'locked', content: { videoUrl: 'https://www.youtube.com/embed/gSSsZReIFnM', duration: '15:45', topics: ['App Router', 'File-based Routing', 'Dynamic Routes'] } },
          { id: 'lesson_2_2', title: 'Creating Pages and Layouts', type: 'reading', status: 'locked', content: { markdownBody: '# Creating Pages and Layouts\n\n## File-based Routing\nIn Next.js, the file system is the router.\n\n## Creating a Page\n```typescript\nexport default function Home() {\n  return <h1>Welcome!</h1>;\n}\n```', topics: ['File-based Routing', 'Pages', 'Layouts'] } },
        ],
      },
      {
        id: 'module_3', title: 'Data Fetching',
        lessons: [
          { id: 'lesson_3_1', title: 'Server-Side Data Fetching', type: 'video', status: 'locked', content: { videoUrl: 'https://www.youtube.com/embed/Vr2eWwRAcJk', duration: '18:20', topics: ['Server Components', 'Data Fetching', 'Best Practices'] } },
        ],
      },
    ],
  },
  {
    id: 'course_react_001', slug: 'react-fundamentals', title: 'React Fundamentals',
    shortDescription: 'Master the core concepts of React with interactive lessons.',
    description: 'A hands-on course covering components, hooks, state management, and modern React patterns.',
    level: 'Beginner', duration: '8 hours', price: 'N9,999', instructor: 'TITECX Team',
    thumbnail: '/courses/react.svg', gradientFrom: 'from-sky-500/20', gradientTo: 'to-indigo-500/20',
    features: ['Hooks deep-dive', 'Component patterns', 'State management'],
    curriculum: ['Components & JSX', 'Props and State', 'Hooks (useState, useEffect)', 'Context API', 'Performance Optimisation'],
    modules: [
      {
        id: 'module_r1', title: 'React Basics',
        lessons: [
          { id: 'lesson_r1_1', title: 'Components and JSX', type: 'video', status: 'current', content: { videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: '14:00', topics: ['Components', 'JSX', 'Rendering'] } },
          { id: 'lesson_r1_2', title: 'Props and State', type: 'reading', status: 'locked', content: { markdownBody: '# Props and State\n\n## Props\nProps are how you pass data from a parent to a child component.\n\n## State\nState is data that changes over time within a component.', topics: ['Props', 'State Management'] } },
        ],
      },
    ],
  },
  { id: 'course_fullstack_001', slug: 'fullstack-web-development', title: 'Full-Stack Web Development', shortDescription: 'From frontend to backend, build real applications.', description: 'Master frontend and backend development with practical, real-world projects.', level: 'Intermediate', duration: '18 hours', price: 'N14,999', instructor: 'TITECX Team', thumbnail: '/courses/webdev.svg', gradientFrom: 'from-purple-500/20', gradientTo: 'to-pink-500/20', features: ['Frontend & backend', 'APIs & databases', 'Real projects'], curriculum: ['HTML, CSS, JavaScript', 'React Fundamentals', 'Backend APIs', 'Authentication', 'Deployment'], modules: [] },
  { id: 'course_python_001', slug: 'advanced-python', title: 'Advanced Python Programming', shortDescription: 'Go deep into Python with advanced patterns and techniques.', description: 'Covers decorators, generators, async programming, OOP patterns, and more.', level: 'Advanced', duration: '24 hours', price: 'N14,999', instructor: 'TITECX Team', thumbnail: '/courses/python.svg', gradientFrom: 'from-amber-500/20', gradientTo: 'to-red-500/20', features: ['Decorators & metaclasses', 'Async programming', 'OOP design patterns'], curriculum: ['Python Basics Recap', 'Advanced OOP', 'Decorators & Generators', 'Async/Await', 'Testing & Packaging'], modules: [] },
  { id: 'course_ml_001', slug: 'machine-learning', title: 'Machine Learning Fundamentals', shortDescription: 'Understand ML from the ground up with hands-on projects.', description: 'A practical course covering supervised learning, model evaluation, and deployment.', level: 'Intermediate', duration: '32 hours', price: 'N19,999', instructor: 'TITECX Team', thumbnail: '/courses/ml.svg', gradientFrom: 'from-emerald-500/20', gradientTo: 'to-sky-500/20', features: ['Supervised learning', 'Model evaluation', 'Real datasets'], curriculum: ['Introduction to ML', 'Linear & Logistic Regression', 'Decision Trees', 'Neural Networks Basics', 'Model Deployment'], modules: [] },
  { id: 'course_aws_001', slug: 'cloud-aws', title: 'Cloud Computing with AWS', shortDescription: 'Build and deploy scalable apps on Amazon Web Services.', description: 'Hands-on training with core AWS services including EC2, S3, Lambda, and RDS.', level: 'Intermediate', duration: '20 hours', price: 'N19,999', instructor: 'TITECX Team', thumbnail: '/courses/aws.svg', gradientFrom: 'from-orange-500/20', gradientTo: 'to-yellow-500/20', features: ['EC2 & S3', 'Serverless with Lambda', 'RDS & DynamoDB'], curriculum: ['AWS Fundamentals', 'EC2 & Networking', 'S3 Storage', 'Lambda & Serverless', 'RDS Databases'], modules: [] },
  { id: 'course_mobile_001', slug: 'mobile-app-dev', title: 'Mobile App Development', shortDescription: 'Build cross-platform mobile apps with React Native.', description: 'Learn to build and publish iOS and Android apps using React Native and Expo.', level: 'Intermediate', duration: '36 hours', price: 'N24,999', instructor: 'TITECX Team', thumbnail: '/courses/mobile.svg', gradientFrom: 'from-teal-500/20', gradientTo: 'to-indigo-500/20', features: ['React Native', 'Expo workflow', 'App Store publishing'], curriculum: ['React Native Basics', 'Navigation', 'State Management', 'Native APIs', 'Publishing'], modules: [] },
  { id: 'course_ds_001', slug: 'data-science', title: 'Data Science Masterclass', shortDescription: 'Become a data scientist with Python, Pandas, and ML.', description: 'A comprehensive journey through data analysis, visualisation, and machine learning.', level: 'Advanced', duration: '40 hours', price: 'N24,999', instructor: 'TITECX Team', thumbnail: '/courses/datascience.svg', gradientFrom: 'from-cyan-500/20', gradientTo: 'to-emerald-500/20', features: ['Pandas & NumPy', 'Data visualisation', 'ML pipelines'], curriculum: ['Python for Data Science', 'Exploratory Data Analysis', 'Data Visualisation', 'Machine Learning', 'Capstone Project'], modules: [] },
];

export const courses = courseSchemas;
