import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { courses } from '@/lib/Course';
import EnrollButton from '@/components/ui/EnrollButton';

type PageProps = { params: Promise<{ slug: string }> };

export default async function CourseDetailsPage({ params }: PageProps) {
  const { slug } = await params;
  const course = courses.find((c) => c.slug === slug);
  if (!course) notFound();

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent" />
        <div className="relative max-w-5xl mx-auto px-4 py-20 flex flex-col md:flex-row gap-10 items-start">
          <div className="flex-1">
            <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-medium mb-4">
              {course.level}
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">{course.title}</h1>
            <p className="mt-4 text-lg text-gray-300">{course.shortDescription}</p>
            <p className="mt-2 text-sm text-gray-400">by {course.instructor}</p>
          </div>
          <div className={`w-full md:w-80 rounded-2xl overflow-hidden bg-gradient-to-br ${course.gradientFrom} ${course.gradientTo} relative aspect-video md:aspect-square flex-shrink-0 border border-white/10`}>
            <Image src={course.thumbnail} alt={course.title} fill className="object-cover" />
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-16 space-y-12">
        {/* Meta + Enroll */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-gray-900 border border-white/10 space-y-2 text-sm text-gray-300">
            <h3 className="font-semibold text-white mb-3">Course Details</h3>
            <p>Level: <span className="text-gray-100">{course.level}</span></p>
            <p>Duration: <span className="text-gray-100">{course.duration}</span></p>
            <p>Instructor: <span className="text-gray-100">{course.instructor}</span></p>
          </div>
          <div className="p-6 rounded-2xl bg-gray-900 border border-white/10">
            <h3 className="font-semibold text-white mb-3">Price</h3>
            <p className="text-4xl font-extrabold text-indigo-400">{course.price}</p>
            {/* Client component handles auth-aware redirect */}
            <EnrollButton slug={course.slug} price={course.price} />
          </div>
        </div>

        {/* Description */}
        <div>
          <h2 className="text-2xl font-bold mb-4">About This Course</h2>
          <p className="text-gray-300 leading-relaxed">{course.description}</p>
        </div>

        {/* What you'll learn */}
        <div>
          <h2 className="text-2xl font-bold mb-4">What You'll Learn</h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {course.features.map((f) => (
              <li key={f} className="p-3 rounded-xl bg-gray-900 border border-white/10 text-sm text-gray-300 flex items-start gap-2">
                <span className="text-indigo-400 mt-0.5">✓</span> {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Curriculum */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Curriculum</h2>
          <ol className="space-y-2">
            {course.curriculum.map((item, i) => (
              <li key={item} className="p-3 rounded-xl bg-gray-900 border border-white/10 text-sm text-gray-300 flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                {item}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <Footer />
    </main>
  );
}
