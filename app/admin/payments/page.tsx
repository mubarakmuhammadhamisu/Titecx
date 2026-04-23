'use client';

import React, { useState, useMemo } from 'react';
import { AdminTable, Column } from '@/components/admin/shared/AdminTable';
import { FilterBar } from '@/components/admin/shared/FilterBar';
import { mockPayments, Payment } from '@/components/admin/mock-data';
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import { format } from 'date-fns';

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [verifying, setVerifying] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<{ id: string; success: boolean } | null>(null);

  const filteredPayments = useMemo(() => {
    return mockPayments.filter((payment) => {
      const matchesSearch =
        payment.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.courseName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === '' || payment.status === statusFilter;
      const paymentDate = new Date(payment.date);
      const matchesFrom = !dateFrom || paymentDate >= new Date(dateFrom);
      const matchesTo = !dateTo || paymentDate <= new Date(dateTo);
      return matchesSearch && matchesStatus && matchesFrom && matchesTo;
    });
  }, [searchTerm, statusFilter, dateFrom, dateTo]);

  const handleVerifyPayment = (paymentId: string) => {
    setVerifying(paymentId);
    setTimeout(() => {
      setVerifying(null);
      setVerifyResult({ id: paymentId, success: true });
      setTimeout(() => setVerifyResult(null), 3000);
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-br from-gray-900/80 to-gray-800/40 p-6 backdrop-blur-md shadow-lg shadow-indigo-500/10">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Total Revenue (Filtered)</p>
          <p className="mt-3 text-4xl font-bold text-indigo-400">
            ₦{totalRevenue.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {filteredPayments.length} transaction{filteredPayments.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-gray-900/80 to-gray-800/40 p-6 backdrop-blur-md shadow-lg shadow-emerald-500/10">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Successful Transactions</p>
          <p className="mt-3 text-4xl font-bold text-emerald-400">
            {filteredPayments.filter((p) => p.status === 'success').length}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {filteredPayments.filter((p) => p.status === 'success').length > 0 
              ? `₦${filteredPayments.filter((p) => p.status === 'success').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}`
              : 'No successful transactions'}
          </p>
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

      <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-lg border border-indigo-500/20 bg-gray-900/50">
        <span className="text-xs text-gray-400 font-medium">Date range:</span>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="rounded-lg bg-gray-800 border border-indigo-500/20 px-3 py-1.5 text-sm text-white outline-none focus:border-indigo-500/60"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="rounded-lg bg-gray-800 border border-indigo-500/20 px-3 py-1.5 text-sm text-white outline-none focus:border-indigo-500/60"
          />
        </div>
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); }}
            className="text-xs text-gray-500 hover:text-gray-300 transition flex items-center gap-1"
          >
            <X size={12} /> Clear dates
          </button>
        )}
      </div>

      <div className="space-y-4">
        <p className="text-sm text-gray-400">
          Showing {filteredPayments.length} of {mockPayments.length} payments
        </p>
        
        {/* Desktop Table */}
        <div className="hidden md:block">
          <AdminTable columns={paymentColumns} data={filteredPayments} />
        </div>

        {/* Mobile Grid Cards */}
        <div className="md:hidden space-y-3">
          {filteredPayments.length > 0 ? (
            filteredPayments.map((payment) => (
              <div key={payment.id} className="rounded-lg border border-indigo-500/20 bg-gray-900/50 p-4 backdrop-blur-sm">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-base font-bold text-white">{payment.studentName}</p>
                    <p className="text-xs text-gray-500">{payment.courseName}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    payment.status === 'success'
                      ? 'bg-green-500/10 text-green-400'
                      : payment.status === 'pending'
                        ? 'bg-yellow-500/10 text-yellow-400'
                        : 'bg-red-500/10 text-red-400'
                  }`}>
                    <CheckCircle size={12} />
                    {String(payment.status).charAt(0).toUpperCase() + String(payment.status).slice(1)}
                  </span>
                </div>

                {/* Body - Key/Value pairs */}
                <div className="space-y-2 mb-4 text-sm border-t border-indigo-500/10 pt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount</span>
                    <span className="font-semibold text-indigo-400">₦{payment.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Reference</span>
                    <span className="font-mono text-xs text-gray-300">{payment.reference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date</span>
                    <span className="font-semibold text-gray-300">{format(new Date(payment.date), 'MMM d, yyyy')}</span>
                  </div>
                </div>

                {/* Actions */}
                <button
                  onClick={() => handleVerifyPayment(payment.id)}
                  disabled={verifying === payment.id}
                  className="w-full text-xs py-2 rounded-lg border border-indigo-500/30 text-indigo-400 hover:border-indigo-500/60 hover:bg-indigo-500/10 transition disabled:opacity-50"
                >
                  {verifying === payment.id ? 'Verifying...' : 'Verify Payment'}
                </button>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-gray-700 p-8 text-center">
              <p className="text-gray-400">No payments found</p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 backdrop-blur-sm">
        <div className="flex gap-3">
          <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-200">
            The &quot;Verify&quot; button is a mock implementation. When the
            real backend is integrated, it will verify payments against Paystack API.
          </p>
        </div>
      </div>

      {verifyResult && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-xl backdrop-blur-md">
          <CheckCircle size={18} />
          <span className="text-sm font-medium">Payment verified successfully (mock)</span>
        </div>
      )}
    </div>
  );
}
