import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent" />
        <div className="relative max-w-4xl mx-auto px-4 py-24 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold">
            About <span className="text-indigo-400">Learnify</span>
          </h1>
          <p className="mt-6 text-gray-300 text-lg">
            A learning platform built to help people gain real, practical skills
            that actually matter.
          </p>
        </div>
      </section>

      {/* MISSION */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
        <p className="text-gray-400 leading-relaxed">
          Learnify was created to remove confusion from learning. We focus on
          structured, practical courses that help learners understand concepts
          deeply, apply them confidently, and grow at their own pace.
        </p>
      </section>

      {/* WHO IT'S FOR */}
      <section className="max-w-5xl mx-auto px-4 py-20 border-t border-white/10">
        <h2 className="text-2xl font-bold mb-8">Who Learnify Is For</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {[
            "Beginners starting from scratch",
            "Self-taught learners seeking structure",
            "Developers sharpening real-world skills",
            "Anyone who prefers clarity over complexity",
          ].map((item) => (
            <div
              key={item}
              className="p-6 rounded-2xl bg-gray-900 border border-white/10"
            >
              <p className="text-gray-300">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DIFFERENCE */}
      <section className="max-w-5xl mx-auto px-4 py-20 border-t border-white/10">
        <h2 className="text-2xl font-bold mb-4">What Makes Us Different</h2>
        <p className="text-gray-400 leading-relaxed">
          We believe learning should be clear, honest, and practical. No rushed
          lessons, no unnecessary complexity, and no pressure. Just focused
          learning designed to help you truly understand what you are building.
        </p>
      </section>

      {/* CTA */}
      <section className="py-24 text-center border-t border-white/10">
        <h2 className="text-3xl font-bold">Start Learning With Confidence</h2>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/courses"
            className="px-6 py-3 rounded-2xl bg-white text-gray-900 font-semibold"
          >
            Browse Courses
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-semibold"
          >
            Create Account
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
