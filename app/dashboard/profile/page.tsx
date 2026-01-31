import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { currentUser } from "@/lib/data";
import { Mail, MapPin, Briefcase, Settings, ChevronRight } from "lucide-react";

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar />
      <ProfileContent />
      <Footer />
    </main>
  );
}

function ProfileContent() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      {/* Page Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-2">My Profile</h1>
        <p className="text-gray-400">Manage your account and learning preferences</p>
      </div>

      {/* Profile Header Card */}
      <div className="p-8 rounded-2xl bg-gray-900 border border-white/10 mb-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-4xl font-bold">
              {currentUser.avatar}
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">{currentUser.name}</h2>
              <p className="text-indigo-400 font-medium mb-4">{currentUser.role}</p>
              <button className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition">
                Edit Profile
              </button>
            </div>
          </div>
          <Link
            href="/dashboard/profile/settings"
            className="p-3 rounded-xl bg-gray-800 hover:bg-gray-700 border border-white/10 transition"
          >
            <Settings size={24} />
          </Link>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-3 gap-8 mb-8">
        {/* Contact & Location */}
        <div className="lg:col-span-2">
          <div className="p-6 rounded-2xl bg-gray-900 border border-white/10 mb-6">
            <h3 className="text-xl font-bold mb-6">Contact Information</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Mail size={20} className="text-indigo-400" />
                <div>
                  <p className="text-sm text-gray-400">Email Address</p>
                  <p className="text-white">{currentUser.name.toLowerCase()}@learnify.com</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <MapPin size={20} className="text-purple-400" />
                <div>
                  <p className="text-sm text-gray-400">Location</p>
                  <p className="text-white">Not specified</p>
                </div>
              </div>
            </div>
          </div>

          {/* Learning Preferences */}
          <div className="p-6 rounded-2xl bg-gray-900 border border-white/10">
            <h3 className="text-xl font-bold mb-6">Learning Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-800 border border-white/5">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-gray-400">Get updates about new courses</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-5 h-5 rounded"
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-800 border border-white/5">
                <div>
                  <p className="font-medium">Course Reminders</p>
                  <p className="text-sm text-gray-400">Reminders to continue learning</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-5 h-5 rounded"
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-800 border border-white/5">
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-sm text-gray-400">Always enabled</p>
                </div>
                <div className="w-10 h-6 rounded-full bg-indigo-600 flex items-center justify-end pr-1">
                  <div className="w-5 h-5 bg-white rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Sidebar */}
        <div>
          <div className="p-6 rounded-2xl bg-gray-900 border border-white/10">
            <h3 className="text-xl font-bold mb-6">Your Progress</h3>
            <div className="space-y-6">
              {currentUser.stats.map((stat) => (
                <div key={stat.label}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-400">{stat.label}</p>
                    <p className="font-bold text-indigo-400">{stat.val}</p>
                  </div>
                  <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                      style={{
                        width: `${Math.min(
                          (parseInt(stat.val) /
                            Math.max(
                              parseInt(currentUser.stats[0].val),
                              parseInt(currentUser.stats[1].val),
                              parseInt(currentUser.stats[2].val)
                            )) *
                            100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="p-6 rounded-2xl bg-gray-900 border border-white/10">
        <h3 className="text-xl font-bold mb-6">Account</h3>
        <div className="space-y-3">
          <button className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-800 hover:bg-gray-700 border border-white/5 transition text-left">
            <span>Change Password</span>
            <ChevronRight size={20} className="text-gray-400" />
          </button>
          <button className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-800 hover:bg-gray-700 border border-white/5 transition text-left">
            <span>Download My Data</span>
            <ChevronRight size={20} className="text-gray-400" />
          </button>
          <button className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-800 hover:bg-red-900/20 border border-red-500/20 transition text-left text-red-400">
            <span>Delete Account</span>
            <ChevronRight size={20} />
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
