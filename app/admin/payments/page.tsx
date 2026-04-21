'use client';

import React, { useState, useMemo } from 'react';
import { AdminTable, Column } from '@/components/admin/shared/AdminTable';
import { FilterBar } from '@/components/admin/shared/FilterBar';
import { mockPayments, Payment } from '@/components/admin/mock-data';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [verifying, setVerifying] = useState<string | null>(null);

  const filteredPayments = useMemo(() => {
    return mockPayments.filter((payment) => {
      const matchesSearch =
        payment.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.courseName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === '' || payment.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

  const handleVerifyPayment = (paymentId: string) => {
    setVerifying(paymentId);
    setTimeout(() => {
      alert(
        'Verified: Payment verification simulated. In real backend, this would call Paystack API.'
      );
      setVerifying(null);
    }, 1500);
  };

  const paymentColumns: Column<Payment>[] = [
    { key: 'studentName', label: 'Student', sortable: true },
    { key: 'courseName', label: 'Course', sortable: true },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (value) => `₦${value.toLocaleString()}`,
    },
    {
      key: 'reference',
      label: 'Reference',
      sortable: true,
      render: (value) => (
        <span className="font-mono text-xs text-gray-300">{value}</span>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (value) => format(new Date(value), 'MMM d, yyyy'),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span
          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
            value === 'success'
              ? 'bg-green-500/10 text-green-400'
              : value === 'pending'
                ? 'bg-yellow-500/10 text-yellow-400'
                : 'bg-red-500/10 text-red-400'
          }`}
        >
          <CheckCircle size={12} />
          {String(value).charAt(0).toUpperCase() + String(value).slice(1)}
        </span>
      ),
    },
    {
      key: 'id',
      label: 'Action',
      render: (_, payment) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleVerifyPayment(payment.id);
          }}
          disabled={verifying === payment.id}
          className="text-xs px-3 py-1 rounded-lg border border-indigo-500/30 text-indigo-400 hover:border-indigo-500/60 hover:bg-indigo-500/10 transition disabled:opacity-50"
        >
          {verifying === payment.id ? 'Verifying...' : 'Verify'}
        </button>
      ),
    },
  ];

  const totalRevenue = filteredPayments
    .filter((p) => p.status === 'success')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Payments</h1>
        <p className="mt-2 text-gray-400">
          Track and verify payment transactions.
        </p>
      </div>

      {/* Revenue Summary */}
      <div className="rounded-lg border border-indigo-500/20 bg-gray-900/50 p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Total Revenue (Filtered)</p>
            <p className="mt-2 text-3xl font-bold text-indigo-400">
              ₦{totalRevenue.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Successful Transactions</p>
            <p className="mt-2 text-3xl font-bold text-green-400">
              {filteredPayments.filter((p) => p.status === 'success').length}
            </p>
          </div>
        </div>
      </div>

      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filters={{
          status: {
            label: 'Status',
            value: statusFilter,
            options: [
              { label: 'Success', value: 'success' },
              { label: 'Failed', value: 'failed' },
              { label: 'Pending', value: 'pending' },
            ],
            onChange: setStatusFilter,
          },
        }}
        placeholder="Search by reference, student, or course..."
      />

      <div className="space-y-4">
        <p className="text-sm text-gray-400">
          Showing {filteredPayments.length} of {mockPayments.length} payments
        </p>
        <AdminTable columns={paymentColumns} data={filteredPayments} />
      </div>

      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="flex gap-3">
          <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-300">
            The &quot;Verify with Paystack&quot; button is a mock implementation. When the
            real backend is integrated, it will verify payments against Paystack API.
          </p>
        </div>
      </div>
    </div>
  );
}
