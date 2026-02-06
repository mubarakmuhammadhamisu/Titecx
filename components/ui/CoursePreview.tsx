import Image from "next/image"
import Link from "next/link";
import { courses } from "@/lib/Course";

export default function CoursePreview() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-20">
      <h2 className="text-2xl font-bold mb-8">Popular Courses</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((c) => (
          <Link
            key={c.slug}
            href={`/courses/${c.slug}`}
            className="block rounded-2xl bg-gray-900 border border-white/10 overflow-hidden"
          >
            <div className="h-40 bg-indigo-500/20 flex justify-center items-center" >
              <Image
                className="dark:invert"
                src="/next.svg"
                alt="Next.js logo"
                width={100}
                height={20}
                priority
              /> <           
            <div className="p-5">
              <h3 className="font-semibold">{c.title}</h3>
              <p className="text-sm text-gray-400 mt-2">{c.shortDescription}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
