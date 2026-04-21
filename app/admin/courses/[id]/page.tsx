'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, BookOpen, Users, TrendingUp, Zap } from 'lucide-react';
import {
  mockCourses,
  mockEnrollments,
  Enrollment,
} from '@/components/admin/mock-data';
import { AdminTable, Column } from '@/components/admin/shared/AdminTable';

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const course = mockCourses.find((c) => c.id === courseId);
  const courseEnrollments = mockEnrollments.filter(
    (e) => e.courseId === courseId
  );

  if (!course) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-6">
          <p className="text-red-400">Course not found</p>
        </div>
      </div>
    );
  }

  const enrollmentColumns: Column<Enrollment>[] = [
    { key: 'studentName', label: 'Student', sortable: true },
    {
      key: 'dateEnrolled',
      label: 'Enrolled Date',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'progress',
      label: 'Progress',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 rounded-full bg-gray-700">
            <div
              className="h-full rounded-full bg-indigo-500"
              style={{ width: `${value}%` }}
            />
          </div>
          <span className="text-xs">{value}%</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
            value === 'completed'
              ? 'bg-green-500/10 text-green-400'
              : value === 'in-progress'
                ? 'bg-blue-500/10 text-blue-400'
                : 'bg-gray-500/10 text-gray-400'
          }`}
        >
          {String(value).charAt(0).toUpperCase() + String(value).slice(1)}
        </span>
      ),
    },
  ];

  const completedCount = courseEnrollments.filter(
    (e) => e.status === 'completed'
  ).length;
  const inProgressCount = courseEnrollments.filter(
    (e) => e.status === 'in-progress'
  ).length;

  return (
    <div className="space-y-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition"
      >
        <ArrowLeft size={18} />
        Back to Courses
      </button>

      {/* Course Header */}
      <div className="rounded-lg border border-indigo-500/20 bg-gray-900/50 p-8 backdrop-blur-sm">
        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-white">{course.title}</h1>
                <p className="mt-2 text-gray-400">{course.description}</p>
              </div>
              <span
                className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                  course.published
                    ? 'bg-green-500/10 text-green-400'
                    : 'bg-gray-500/10 text-gray-400'
                }`}
              >
                {course.published ? 'Published' : 'Draft'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg bg-gray-800/50 p-4">
              <p className="text-sm text-gray-400">Price</p>
              <p className="mt-2 text-2xl font-bold text-indigo-400">
                ₦{course.price.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg bg-gray-800/50 p-4">
              <p className="flex items-center gap-2 text-sm text-gray-400">
                <Users size={16} />
                Enrolled
              </p>
              <p className="mt-2 text-2xl font-bold text-purple-400">
                {course.enrolledCount}
              </p>
            </div>
            <div className="rounded-lg bg-gray-800/50 p-4">
              <p className="flex items-center gap-2 text-sm text-gray-400">
                <TrendingUp size={16} />
                Revenue
              </p>
              <p className="mt-2 text-2xl font-bold text-green-400">
                ₦{(course.totalRevenue / 1000000).toFixed(1)}M
              </p>
            </div>
            <div className="rounded-lg bg-gray-800/50 p-4">
              <p className="flex items-center gap-2 text-sm text-gray-400">
                <BookOpen size={16} />
                Lessons
              </p>
              <p className="mt-2 text-2xl font-bold text-blue-400">
                {course.lessonsCount}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="rounded-lg bg-blue-500/10 px-4 py-2">
              <p className="text-xs text-blue-400">
                <span className="font-bold">{completedCount}</span> Completed
              </p>
            </div>
            <div className="rounded-lg bg-indigo-500/10 px-4 py-2">
              <p className="text-xs text-indigo-400">
                <span className="font-bold">{inProgressCount}</span> In Progress
              </p>
            </div>
            <div className="rounded-lg bg-purple-500/10 px-4 py-2">
              <p className="text-xs text-purple-400">
                <span className="font-bold">{course.completionRate}%</span>{' '}
                Completion Rate
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enrolled Students */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Enrolled Students</h2>
        {courseEnrollments.length > 0 ? (
          <AdminTable columns={enrollmentColumns} data={courseEnrollments} />
        ) : (
          <div className="rounded-lg border border-indigo-500/20 bg-gray-900/50 p-6 text-center">
            <p className="text-gray-400">No enrollments yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
