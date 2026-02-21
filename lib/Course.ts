// Types for the Universal Course Player
export type LessonType = 'video' | 'reading' | 'quiz';
export type LessonStatus = 'completed' | 'current' | 'locked';

export interface VideoContent {
  videoUrl: string;
  duration: string;
  topics?: string[];
}

export interface ReadingContent {
  markdownBody: string;
  topics?: string[];
}

export interface QuizContent {
  questions: Array<{
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
  }>;
  topics?: string[];
}

export interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  status: LessonStatus;
  content: VideoContent | ReadingContent | QuizContent;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface CourseSchema {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: string;
  duration: string;
  instructor: string;
  modules: Module[];
}

// Legacy course data (keep for backward compatibility)
export const course = [
  {
    slug: "nextjs",
    title: "Next.js for Beginners",
    description: "Modern React apps.",
  },
  {
    slug: "fullstack",
    title: "Full-Stack Web Dev",
    description: "Frontend to backend.",
  },
  {
    slug: "uiux",
    title: "UI/UX Design",
    description: "Design better interfaces.",
  },
];

export const courses = [
  {
    id: "nextjs",
    slug: "nextjs-for-beginners",
    title: "Next.js for Beginners",
    shortDescription: "Learn how to build modern React apps using Next.js.",
    fullDescription:
      "A complete introduction to Next.js, covering routing, layouts, data fetching, and deployment.",
    level: "Beginner",
    duration: "6 hours",
    price: "Free",
    instructor: "Learnify Team",
    features: ["Project-based learning", "Modern App Router", "Best practices"],
    curriculum: [
      "Introduction to Next.js",
      "App Router Basics",
      "Layouts & Pages",
      "Data Fetching",
      "Deployment",
    ],
  },
  {
    id: "fullstack",
    slug: "fullstack-web-development",
    title: "Full-Stack Web Development",
    shortDescription: "From frontend to backend, build real applications.",
    fullDescription:
      "Master frontend and backend development with practical, real-world projects.",
    level: "Intermediate",
    duration: "18 hours",
    price: "$49",
    instructor: "Learnify Team",
    features: ["Frontend & backend", "APIs & databases", "Real projects"],
    curriculum: [
      "HTML, CSS, JavaScript",
      "React Fundamentals",
      "Backend APIs",
      "Authentication",
      "Deployment",
    ],
  },
];

// New CourseSchema data for the Universal Course Player
export const courseSchemas: CourseSchema[] = [
  {
    id: "course_nextjs_001",
    slug: "nextjs-for-beginners-full",
    title: "Next.js for Beginners",
    description: "A complete introduction to Next.js with video lessons and reading materials.",
    level: "Beginner",
    duration: "6 hours",
    instructor: "Learnify Team",
    modules: [
      {
        id: "module_1",
        title: "Introduction to Next.js",
        lessons: [
          {
            id: "lesson_1_1",
            title: "What is Next.js?",
            type: "video",
            status: "current",
            content: {
              videoUrl: "https://www.youtube.com/embed/Sklc_fQBmcs",
              duration: "12:30",
              topics: ["Framework Overview", "Setup", "Key Concepts"],
            },
          },
          {
            id: "lesson_1_2",
            title: "Installation and Setup",
            type: "reading",
            status: "locked",
            content: {
              markdownBody: `# Installation and Setup

## Prerequisites
- Node.js 16.8 or later
- npm or yarn package manager

## Step 1: Create a new Next.js app
\`\`\`bash
npx create-next-app@latest my-app
\`\`\`

## Step 2: Navigate to your project
\`\`\`bash
cd my-app
\`\`\`

## Step 3: Run the development server
\`\`\`bash
npm run dev
\`\`\`

Visit http://localhost:3000 to see your app running!`,
              topics: ["Installation", "Project Structure", "Running Dev Server"],
            },
          },
        ],
      },
      {
        id: "module_2",
        title: "App Router Basics",
        lessons: [
          {
            id: "lesson_2_1",
            title: "Understanding the App Router",
            type: "video",
            status: "locked",
            content: {
              videoUrl: "https://www.youtube.com/embed/gSSsZReIFnM",
              duration: "15:45",
              topics: ["App Router", "File-based Routing", "Dynamic Routes"],
            },
          },
          {
            id: "lesson_2_2",
            title: "Creating Pages and Layouts",
            type: "reading",
            status: "locked",
            content: {
              markdownBody: `# Creating Pages and Layouts

## File-based Routing
In Next.js, the file system is the router. Files placed in the \`app\` directory automatically become routes.

## Creating a Page
Create a \`page.tsx\` file in any directory under \`app\`:

\`\`\`typescript
export default function Home() {
  return <h1>Welcome to Next.js!</h1>;
}
\`\`\`

## Creating a Layout
Create a \`layout.tsx\` file to wrap multiple pages:

\`\`\`typescript
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
\`\`\``,
              topics: ["File-based Routing", "Pages", "Layouts"],
            },
          },
        ],
      },
      {
        id: "module_3",
        title: "Data Fetching",
        lessons: [
          {
            id: "lesson_3_1",
            title: "Server-Side Data Fetching",
            type: "video",
            status: "locked",
            content: {
              videoUrl: "https://www.youtube.com/embed/Vr2eWwRAcJk",
              duration: "18:20",
              topics: ["Server Components", "Data Fetching", "Best Practices"],
            },
          },
        ],
      },
    ],
  },
  {
    id: "course_react_001",
    slug: "react-fundamentals",
    title: "React Fundamentals",
    description: "Master the core concepts of React with interactive lessons.",
    level: "Beginner",
    duration: "8 hours",
    instructor: "Learnify Team",
    modules: [
      {
        id: "module_r1",
        title: "React Basics",
        lessons: [
          {
            id: "lesson_r1_1",
            title: "Components and JSX",
            type: "video",
            status: "current",
            content: {
              videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
              duration: "14:00",
              topics: ["Components", "JSX", "Rendering"],
            },
          },
          {
            id: "lesson_r1_2",
            title: "Props and State",
            type: "reading",
            status: "locked",
            content: {
              markdownBody: `# Props and State

## Props
Props are how you pass data from a parent component to a child component.

## State
State is data that changes over time within a component.`,
              topics: ["Props", "State Management"],
            },
          },
        ],
      },
    ],
  },
];
