'use client';

import React, { useState, useMemo } from 'react';
import { AdminTable, Column } from '@/components/admin/shared/AdminTable';
import { FilterBar } from '@/components/admin/shared/FilterBar';
import { Modal } from '@/components/admin/shared/Modal';
import { mockCoupons, Coupon } from '@/components/admin/mock-data';
import { Plus, ToggleLeft, ToggleRight } from 'lucide-react';

export default function CouponsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toggledCoupons, setToggledCoupons] = useState<{ [key: string]: boolean }>({});
  const [formData, setFormData] = useState({
    code: '',
    discount: '',
    maxUses: '',
    expiryDate: '',
  });

  const filteredCoupons = useMemo(() => {
    return mockCoupons.filter((coupon) =>
      coupon.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const handleToggle = (couponId: string) => {
    setToggledCoupons((prev) => ({
      ...prev,
      [couponId]: !prev[couponId],
    }));
  };

  const handleCreateCoupon = () => {
    if (!formData.code || !formData.discount || !formData.maxUses) {
      alert('Please fill in all fields');
      return;
    }
    alert(
      `Coupon "${formData.code}" created with ${formData.discount}% discount! (Mock: not saved)`
    );
    setFormData({ code: '', discount: '', maxUses: '', expiryDate: '' });
    setIsModalOpen(false);
  };

  const couponColumns: Column<Coupon>[] = [
    { key: 'code', label: 'Code', sortable: true },
    {
      key: 'discountPercentage',
      label: 'Discount',
      sortable: true,
      render: (value) => `${value}%`,
    },
    {
      key: 'timesUsed',
      label: 'Times Used',
      sortable: true,
    },
    {
      key: 'maxUses',
      label: 'Max Uses',
      sortable: true,
    },
    {
      key: 'expiryDate',
      label: 'Expiry Date',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'id',
      label: 'Status',
      render: (_, coupon) => {
        const isActive =
          toggledCoupons[coupon.id] !== undefined
            ? toggledCoupons[coupon.id]
            : coupon.active;
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggle(coupon.id);
            }}
            className="flex items-center gap-2 text-sm transition"
          >
            {isActive ? (
              <>
                <ToggleRight size={18} className="text-green-400" />
                <span className="text-green-400">Active</span>
              </>
            ) : (
              <>
                <ToggleLeft size={18} className="text-gray-500" />
                <span className="text-gray-500">Inactive</span>
              </>
            )}
          </button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Coupons</h1>
          <p className="mt-2 text-gray-400">
            Create and manage promotional coupon codes.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 font-medium text-white hover:bg-indigo-600 transition"
        >
          <Plus size={18} />
          Create Coupon
        </button>
      </div>

      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search by coupon code..."
      />

      <div className="space-y-4">
        <p className="text-sm text-gray-400">
          Showing {filteredCoupons.length} of {mockCoupons.length} coupons
        </p>
        <AdminTable columns={couponColumns} data={filteredCoupons} />
      </div>

      {/* Create Coupon Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Coupon"
        footer={
          <>
            <button
              onClick={() => setIsModalOpen(false)}
              className="flex-1 rounded-lg border border-gray-600 px-4 py-2 font-medium text-gray-300 hover:bg-gray-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateCoupon}
              className="flex-1 rounded-lg bg-indigo-500 px-4 py-2 font-medium text-white hover:bg-indigo-600 transition"
            >
              Create
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Coupon Code
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value.toUpperCase() })
              }
              placeholder="e.g., SAVE20"
              className="w-full rounded-lg bg-gray-800 border border-indigo-500/20 px-3 py-2 text-white placeholder:text-gray-500 outline-none focus:border-indigo-500/60"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Discount %
            </label>
            <input
              type="number"
              value={formData.discount}
              onChange={(e) =>
                setFormData({ ...formData, discount: e.target.value })
              }
              placeholder="e.g., 20"
              className="w-full rounded-lg bg-gray-800 border border-indigo-500/20 px-3 py-2 text-white placeholder:text-gray-500 outline-none focus:border-indigo-500/60"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Max Uses
            </label>
            <input
              type="number"
              value={formData.maxUses}
              onChange={(e) =>
                setFormData({ ...formData, maxUses: e.target.value })
              }
              placeholder="e.g., 100"
              className="w-full rounded-lg bg-gray-800 border border-indigo-500/20 px-3 py-2 text-white placeholder:text-gray-500 outline-none focus:border-indigo-500/60"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Expiry Date
            </label>
            <input
              type="date"
              value={formData.expiryDate}
              onChange={(e) =>
                setFormData({ ...formData, expiryDate: e.target.value })
              }
              className="w-full rounded-lg bg-gray-800 border border-indigo-500/20 px-3 py-2 text-white outline-none focus:border-indigo-500/60"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
