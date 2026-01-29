// lib/data.ts
export const currentUser = {
  name: "Mubarak",
  role: "Premium Member",
  avatar: "M",
  stats: [
    { label: "Active Courses", val: "4" },
    { label: "Completed", val: "12" },
    { label: "Hours Studied", val: "128h" },
    { label: "Security Score", val: "98%" },
  ]
};

export const enrolledCourses = [
  {
    id: 1,
    title: "Advanced React Patterns",
    description: "Mastering memoization and custom hooks.",
    progress: 75,
    nextLesson: "State Management",
    imageColor: "bg-indigo-500/20"
  },
  {
    id: 2,
    title: "Cybersecurity Fundamentals",
    description: "Protecting systems with a defender mindset.",
    progress: 40,
    nextLesson: "Network Security",
    imageColor: "bg-purple-500/20"
  }
];
