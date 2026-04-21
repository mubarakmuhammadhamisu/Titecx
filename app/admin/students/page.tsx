'use client';

import React, { useState, useMemo } from 'react';
import { AdminTable, Column } from '@/components/admin/shared/AdminTable';
import { FilterBar } from '@/components/admin/shared/FilterBar';
import { mockStudents, Student } from '@/components/admin/mock-data';
import { useRouter } from 'next/navigation';

export default function StudentsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = useMemo(() => {
    return mockStudents.filter(
      (student) =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const studentColumns: Column<Student>[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    {
      key: 'joinDate',
      label: 'Join Date',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'enrollmentCount',
      label: 'Enrollments',
      sortable: true,
    },
    {
      key: 'amountPaid',
      label: 'Total Paid',
      sortable: true,
      render: (value) => `₦${value.toLocaleString()}`,
    },
  ];

  const handleRowClick = (student: Student) => {
    router.push(`/admin/students/${student.id}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Students</h1>
        <p className="mt-2 text-gray-400">
          Manage and view student information and enrollment history.
        </p>
      </div>

      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search by name or email..."
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Showing {filteredStudents.length} of {mockStudents.length} students
          </p>
        </div>
        <AdminTable
          columns={studentColumns}
          data={filteredStudents}
          onRowClick={handleRowClick}
        />
      </div>
    </div>
  );
}
