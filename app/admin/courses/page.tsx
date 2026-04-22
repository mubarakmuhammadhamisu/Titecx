'use client';

import React, { useState, useMemo } from 'react';
import { AdminTable, Column } from '@/components/admin/shared/AdminTable';
import { FilterBar } from '@/components/admin/shared/FilterBar';
import { Modal } from '@/components/admin/shared/Modal';
import { mockCourses, Course } from '@/components/admin/mock-data';
import { useRouter } from 'next/navigation';
import { ToggleLeft, ToggleRight, BookOpen, Trash2 } from 'lucide-react';

export default function CoursesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [publishedFilter, setPublishedFilter] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [courses, setCourses] = useState<Course[]>(mockCourses);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [toggledCourses, setToggledCourses] = useState<{ [key: string]: boolean }>(
    {}
  );

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch = course.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesPublished =
        publishedFilter === ''
          ? true
          : publishedFilter === 'published'
            ? course.published
            : !course.published;
      return matchesSearch && matchesPublished;
    });
  }, [courses, searchTerm, publishedFilter]);

  const handleToggle = (courseId: string) => {
    setToggledCourses((prev) => ({
      ...prev,
      [courseId]: !prev[courseId],
    }));
  };

  const handleDeleteCourse = () => {
    if (!deleteTarget) return;
    setCourses((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const courseColumns: Column<Course>[] = [
    { key: 'title', label: 'Course Title', sortable: true },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (value) => `₦${value.toLocaleString()}`,
    },
    {
      key: 'enrolledCount',
      label: 'Enrolled',
      sortable: true,
    },
    {
      key: 'totalRevenue',
      label: 'Revenue',
      sortable: true,
      render: (value) => `₦${value.toLocaleString()}`,
    },
    {
      key: 'completionRate',
      label: 'Completion',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="w-20 h-2 rounded-full bg-gray-700">
            <div
              className="h-full rounded-full bg-purple-500"
              style={{ width: `${value}%` }}
            />
          </div>
          <span className="text-xs">{value}%</span>
        </div>
      ),
    },
    {
      key: 'id',
      label: 'Status',
      render: (_, course) => {
        const isPublished =
          toggledCourses[course.id] !== undefined
            ? toggledCourses[course.id]
            : course.published;
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggle(course.id);
            }}
            className="flex items-center gap-2 text-sm transition"
          >
            {isPublished ? (
              <>
                <ToggleRight size={18} className="text-green-400" />
                <span className="text-green-400">Published</span>
              </>
            ) : (
              <>
                <ToggleLeft size={18} className="text-gray-500" />
                <span className="text-gray-500">Draft</span>
              </>
            )}
          </button>
        );
      },
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_, course) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setDeleteTarget(course)}
            className="flex items-center gap-1 text-xs px-3 py-1 rounded-lg border border-red-500/30 text-red-400 hover:border-red-500/60 hover:bg-red-500/10 transition"
          >
            <Trash2 size={13} />
            Delete
          </button>
        </div>
      ),
    },
  ];

  const handleRowClick = (course: Course) => {
    router.push(`/admin/courses/${course.id}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Courses</h1>
        <p className="mt-2 text-gray-400">
          Manage course content, pricing, and enrollment.
        </p>
      </div>

      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filters={{
          status: {
            label: 'Status',
            value: publishedFilter,
            options: [
              { label: 'Published', value: 'published' },
              { label: 'Draft', value: 'draft' },
            ],
            onChange: setPublishedFilter,
          },
        }}
        placeholder="Search by course name..."
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          Showing {filteredCourses.length} of {courses.length} courses
        </p>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-500/50'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-indigo-500/30'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-500/50'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-indigo-500/30'
              }`}
            >
              Grid
            </button>
          </div>
        </div>

        {viewMode === 'table' ? (
          <AdminTable
            columns={courseColumns}
            data={filteredCourses}
            onRowClick={handleRowClick}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCourses.map((course) => {
              const isPublished =
                toggledCourses[course.id] !== undefined
                  ? toggledCourses[course.id]
                  : course.published;
              return (
                <div
                  key={course.id}
                  onClick={() => handleRowClick(course)}
                  className="group rounded-xl border border-indigo-500/20 bg-gradient-to-br from-gray-900/80 to-gray-800/40 p-6 backdrop-blur-md cursor-pointer transition-all duration-300 hover:border-indigo-400/60 hover:shadow-lg hover:shadow-indigo-500/20"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center border border-indigo-500/30 group-hover:scale-110 transition-transform duration-300">
                      <BookOpen size={24} className="text-indigo-400" />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggle(course.id);
                      }}
                      className="flex items-center gap-1 text-xs transition"
                    >
                      {isPublished ? (
                        <>
                          <ToggleRight size={16} className="text-emerald-400" />
                          <span className="text-emerald-400 text-xs">Published</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft size={16} className="text-gray-500" />
                          <span className="text-gray-500 text-xs">Draft</span>
                        </>
                      )}
                    </button>
                  </div>

                  <h3 className="font-semibold text-white line-clamp-2 mb-2">
                    {course.title}
                  </h3>
                  <p className="text-xs text-gray-400 line-clamp-2 mb-4">
                    {course.description}
                  </p>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center p-2 rounded-lg bg-gray-800/30">
                      <span className="text-gray-400">Price</span>
                      <span className="font-semibold text-indigo-400">
                        ₦{course.price.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-gray-800/30">
                      <span className="text-gray-400">Enrolled</span>
                      <span className="font-semibold text-emerald-400">
                        {course.enrolledCount}
                      </span>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-400 text-xs">Completion</span>
                        <span className="text-xs text-gray-300">
                          {course.completionRate}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-gray-700">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                          style={{ width: `${course.completionRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Course Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Course"
        footer={
          <>
            <button
              onClick={() => setDeleteTarget(null)}
              className="flex-1 rounded-lg border border-gray-600 px-4 py-2 font-medium text-gray-300 hover:bg-gray-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteCourse}
              className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2 font-medium text-white transition"
            >
              Delete
            </button>
          </>
        }
      >
        <p className="text-gray-300 text-sm">
          Are you sure you want to delete <span className="font-bold text-white">{deleteTarget?.title}</span>? This will remove the course and cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
