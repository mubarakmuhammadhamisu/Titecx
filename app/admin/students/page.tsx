'use client';

import React, { useState, useMemo } from 'react';
import { AdminTable, Column } from '@/components/admin/shared/AdminTable';
import { FilterBar } from '@/components/admin/shared/FilterBar';
import { mockStudents, Student } from '@/components/admin/mock-data';
import { useRouter } from 'next/navigation';
import { User } from 'lucide-react';

export default function StudentsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const filteredStudents = useMemo(() => {
    return mockStudents.filter(
      (student) =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const studentColumns: Column<Student>[] = [
    {
      key: 'name',
      label: 'Student',
      sortable: true,
      render: (value, student) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center border border-indigo-500/20">
            <User size={20} className="text-indigo-400" />
          </div>
          <div>
            <p className="font-medium text-white">{value}</p>
            <p className="text-xs text-gray-500">{student.email}</p>
          </div>
        </div>
      ),
    },
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
            columns={studentColumns}
            data={filteredStudents}
            onRowClick={handleRowClick}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                onClick={() => handleRowClick(student)}
                className="group rounded-xl border border-indigo-500/20 bg-gradient-to-br from-gray-900/80 to-gray-800/40 p-6 backdrop-blur-md cursor-pointer transition-all duration-300 hover:border-indigo-400/60 hover:shadow-lg hover:shadow-indigo-500/20"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center border border-indigo-500/30 group-hover:scale-110 transition-transform duration-300">
                    <User size={32} className="text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">{student.name}</h3>
                    <p className="text-xs text-gray-500 truncate">{student.email}</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-gray-800/30">
                    <span className="text-gray-400">Joined</span>
                    <span className="text-gray-200">{new Date(student.joinDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-gray-800/30">
                    <span className="text-gray-400">Enrollments</span>
                    <span className="font-semibold text-indigo-400">{student.enrollmentCount}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-gray-800/30">
                    <span className="text-gray-400">Total Paid</span>
                    <span className="font-semibold text-emerald-400">₦{student.amountPaid.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
