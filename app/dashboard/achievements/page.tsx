import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { Award, Download, Share2, Trophy, Star, Zap } from "lucide-react";

export default function AchievementsPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar />
      <AchievementsContent />
      <Footer />
    </main>
  );
}

function AchievementsContent() {
  const certificates = [
    {
      id: 1,
      course: "Advanced React Patterns",
      issuedDate: "Dec 15, 2024",
      credentialId: "REACT-2024-001",
      status: "earned",
      instructor: "Learnify Team",
    },
    {
      id: 2,
      course: "Cybersecurity Fundamentals",
      issuedDate: "Jan 10, 2025",
      credentialId: "CS-2025-042",
      status: "earned",
      instructor: "Security Expert",
    },
  ];

  const badges = [
    {
      id: 1,
      name: "Quick Learner",
      description: "Complete 3 lessons in one day",
      icon: "⚡",
      earned: true,
      earnedDate: "Dec 20, 2024",
    },
    {
      id: 2,
      name: "Quiz Master",
      description: "Score 90% or higher on 5 quizzes",
      icon: "🎯",
      earned: true,
      earnedDate: "Jan 5, 2025",
    },
    {
      id: 3,
      name: "Perfect Score",
      description: "Achieve 100% on any quiz",
      icon: "⭐",
      earned: true,
      earnedDate: "Dec 28, 2024",
    },
    {
      id: 4,
      name: "Week Warrior",
      description: "Learn for 7 consecutive days",
      icon: "💪",
      earned: false,
      progress: 5,
    },
    {
      id: 5,
      name: "Course Completer",
      description: "Complete 3 full courses",
      icon: "🏆",
      earned: false,
      progress: 2,
    },
    {
      id: 6,
      name: "Community Star",
      description: "Earn 10 helpful votes from other students",
      icon: "✨",
      earned: false,
      progress: 3,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      {/* Page Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Trophy size={40} className="text-yellow-400" />
          Your Achievements
        </h1>
        <p className="text-gray-400">
          Celebrate your learning milestones and earned credentials
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-3 gap-4 mb-12">
        <div className="p-6 rounded-2xl bg-gray-900 border border-white/10">
          <p className="text-gray-400 text-sm mb-2">Certificates Earned</p>
          <p className="text-3xl font-bold text-indigo-400">{certificates.length}</p>
        </div>
        <div className="p-6 rounded-2xl bg-gray-900 border border-white/10">
          <p className="text-gray-400 text-sm mb-2">Badges Earned</p>
          <p className="text-3xl font-bold text-purple-400">
            {badges.filter((b) => b.earned).length}
          </p>
        </div>
        <div className="p-6 rounded-2xl bg-gray-900 border border-white/10">
          <p className="text-gray-400 text-sm mb-2">Total Points</p>
          <p className="text-3xl font-bold text-green-400">2,450</p>
        </div>
      </div>

      {/* Certificates Section */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold mb-8 flex items-center gap-2">
          <Award size={32} className="text-indigo-400" />
          Certificates
        </h2>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="relative rounded-2xl overflow-hidden group"
            >
              {/* Certificate Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-orange-500/10 border border-yellow-500/20" />

              {/* Certificate Content */}
              <div className="relative p-8 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Award size={28} className="text-yellow-400" />
                    <h3 className="text-xl font-bold">{cert.course}</h3>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">
                    Issued on {cert.issuedDate}
                  </p>
                  <p className="text-xs text-gray-500">
                    Credential ID: {cert.credentialId}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="p-3 rounded-lg bg-gray-900 hover:bg-gray-800 border border-white/10 transition" title="Download Certificate">
                    <Download size={18} />
                  </button>
                  <button className="p-3 rounded-lg bg-gray-900 hover:bg-gray-800 border border-white/10 transition" title="Share Certificate">
                    <Share2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add More Certificates CTA */}
        <div className="p-8 rounded-2xl bg-gray-900 border border-white/10 border-dashed text-center">
          <Award size={40} className="mx-auto mb-4 text-gray-600" />
          <h3 className="text-xl font-bold mb-2">Earn More Certificates</h3>
          <p className="text-gray-400 mb-6">
            Complete more courses to unlock additional certificates
          </p>
          <Link
            href="/courses"
            className="inline-block px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition"
          >
            Explore Courses
          </Link>
        </div>
      </div>

      {/* Badges Section */}
      <div>
        <h2 className="text-3xl font-bold mb-8 flex items-center gap-2">
          <Star size={32} className="text-purple-400" />
          Badges & Achievements
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-6 rounded-2xl border transition relative overflow-hidden group ${
                badge.earned
                  ? "bg-gray-900 border-white/10 hover:border-yellow-500/40"
                  : "bg-gray-900/50 border-white/5 hover:border-white/10"
              }`}
            >
              {/* Badge Glow Effect for Earned */}
              {badge.earned && (
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition" />
              )}

              <div className="relative">
                {/* Badge Icon */}
                <div className="text-5xl mb-4 text-center">
                  {badge.icon}
                </div>

                {/* Badge Status */}
                {badge.earned && (
                  <div className="absolute top-2 right-2">
                    <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900" />
                  </div>
                )}

                {/* Badge Content */}
                <h3 className="font-bold text-lg text-center mb-2">
                  {badge.name}
                </h3>
                <p className="text-xs text-gray-400 text-center mb-4 h-8">
                  {badge.description}
                </p>

                {/* Badge Status Footer */}
                {badge.earned ? (
                  <div className="text-center text-xs text-green-400 font-medium">
                    Earned {badge.earnedDate}
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">Progress</span>
                      <span className="text-xs font-bold text-gray-400">
                        {badge.progress}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                        style={{ width: `${badge.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Share Your Achievements */}
      <div className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/20">
        <h3 className="text-2xl font-bold mb-4">Share Your Achievements</h3>
        <p className="text-gray-400 mb-6">
          Inspire others by sharing your certificates and badges on social media
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button className="px-6 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 border border-white/10 text-white font-medium transition">
            Share on LinkedIn
          </button>
          <button className="px-6 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 border border-white/10 text-white font-medium transition">
            Share on Twitter
          </button>
          <button className="px-6 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 border border-white/10 text-white font-medium transition">
            Copy Profile Link
          </button>
        </div>
      </div>

      {/* Navigation Back */}
      <div className="mt-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
