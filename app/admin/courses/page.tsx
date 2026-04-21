'use client';

import React, { useState, useMemo } from 'react';
import { AdminTable, Column } from '@/components/admin/shared/AdminTable';
import { FilterBar } from '@/components/admin/shared/FilterBar';
import { mockCourses, Course } from '@/components/admin/mock-data';
import { useRouter } from 'next/navigation';
import { ToggleLeft, ToggleRight } from 'lucide-react';

export default function CoursesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [publishedFilter, setPublishedFilter] = useState('');
  const [toggledCourses, setToggledCourses] = useState<{ [key: string]: boolean }>(
    {}
  );

  const filteredCourses = useMemo(() => {
    return mockCourses.filter((course) => {
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
  }, [searchTerm, publishedFilter]);

  const handleToggle = (courseId: string) => {
    setToggledCourses((prev) => ({
      ...prev,
      [courseId]: !prev[courseId],
    }));
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
            Showing {filteredCourses.length} of {mockCourses.length} courses
          </p>
        </div>
        <AdminTable
          columns={courseColumns}
          data={filteredCourses}
          onRowClick={handleRowClick}
        />
      </div>
    </div>
  );
}
