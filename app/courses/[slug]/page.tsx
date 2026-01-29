import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { courses } from "@/lib/Course";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function CourseDetailsPage({ params }: PageProps) {
  // ✅ UNWRAP PARAMS
  const { slug } = await params;

  const course = courses.find((c) => c.slug === slug);

  if (!course) {
    notFound();
  }

  const enrollHref = "/register";

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent" />
        <div className="relative max-w-5xl mx-auto px-4 py-20">
          <h1 className="text-4xl md:text-5xl font-extrabold">
            {course.title}
          </h1>
          <p className="mt-4 text-lg text-gray-300">
            {course.shortDescription}
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <section className="max-w-5xl mx-auto px-4 py-20 space-y-12">
        {/* META */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-gray-900 border border-white/10">
            <h3 className="font-semibold mb-2">Course Details</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>Level: {course.level}</li>
              <li>Duration: {course.duration}</li>
              <li>Instructor: {course.instructor}</li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-gray-900 border border-white/10">
            <h3 className="font-semibold mb-2">Price</h3>
            <p className="text-3xl font-extrabold text-indigo-400">
              {course.price}
            </p>

            <Link
              href={enrollHref}
              className="mt-6 block text-center px-4 py-3 rounded-xl bg-indigo-600 text-white font-semibold"
            >
              Enroll Now
            </Link>
          </div>
        </div>

        {/* DESCRIPTION */}
        <div>
          <h2 className="text-2xl font-bold mb-4">About This Course</h2>
          <p className="text-gray-300">{course.fullDescription}</p>
        </div>

        {/* FEATURES */}
        <div>
          <h2 className="text-2xl font-bold mb-4">What You’ll Learn</h2>
          <ul className="grid sm:grid-cols-2 gap-3 text-sm text-gray-300">
            {course.features.map((feature) => (
              <li
                key={feature}
                className="p-3 rounded-xl bg-gray-900 border border-white/10"
              >
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* CURRICULUM */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Curriculum</h2>
          <ol className="space-y-2 text-sm text-gray-300">
            {course.curriculum.map((item, index) => (
              <li
                key={item}
                className="p-3 rounded-xl bg-gray-900 border border-white/10"
              >
                {index + 1}. {item}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <Footer />
    </main>
  );
}
