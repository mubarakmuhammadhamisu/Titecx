import Image from 'next/image';
import Link from 'next/link';
import { getAllCourses } from '@/lib/courses';
import { Clock } from 'lucide-react';

export default async function CoursePreview() {

  let courses = [];
  try{
    courses = await getAllCourses();  
  }catch (error){
      console.error("Failed to fetch courses:", error);

    // Return a fallback UI instead of crashing
    return (
      <div className="py-20 text-center border border-red-900/20 bg-red-900/10 rounded-xl">
        <p className="text-red-400">Unable to load courses. Please refresh the page.</p>
      </div>
    );
    }

    if (courses.length === 0) {
    return <div>No courses found.</div>;
  }

  const featured = courses.slice(0, 6);
  

  return (
    <section className="max-w-7xl mx-auto px-4 py-20">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-white">Popular Courses</h2>
        <Link href="/courses" className="text-sm text-indigo-400 hover:text-indigo-300 transition">
          View all →
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {featured.map((c) => (
          <Link
            key={c.slug}
            href={`/courses/${c.slug}`}
            className="group block rounded-2xl bg-gray-900 border border-white/10 overflow-hidden hover:border-indigo-500/40 transition"
          >
            <div className={`h-40 bg-linear-to-br ${c.gradientFrom} ${c.gradientTo} relative overflow-hidden`}>
              <Image src={c.thumbnail} alt={c.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover group-hover:scale-105 transition duration-300" />
              <div className="absolute top-2 left-2 bg-gray-900/70 backdrop-blur text-xs text-gray-200 px-2 py-0.5 rounded-full border border-white/10">
                {c.level}
              </div>
              <div className="absolute top-2 right-2 bg-gray-900/70 backdrop-blur text-xs text-indigo-300 font-semibold px-2 py-0.5 rounded-full border border-indigo-500/20">
                {c.price}
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold group-hover:text-indigo-400 transition text-sm leading-snug">{c.title}</h3>
              <p className="mt-1.5 text-xs text-gray-400 line-clamp-2">{c.shortDescription}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1"><Clock size={11} /> {c.duration}</span>
                <span>{c.instructor}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
