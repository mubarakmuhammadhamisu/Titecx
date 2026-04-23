'use client';

import React, { useState, useMemo } from 'react';
import { AdminTable, Column } from '@/components/admin/shared/AdminTable';
import { FilterBar } from '@/components/admin/shared/FilterBar';
import { Modal } from '@/components/admin/shared/Modal';
import { mockCoupons, Coupon } from '@/components/admin/mock-data';
import { Plus, ToggleLeft, ToggleRight, Trash2, Pencil } from 'lucide-react';

export default function CouponsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>(mockCoupons);
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);
  const [editTarget, setEditTarget] = useState<Coupon | null>(null);
  const [toggledCoupons, setToggledCoupons] = useState<{ [key: string]: boolean }>({});
  const [createError, setCreateError] = useState('');
  const [formData, setFormData] = useState({
    code: '',
    discount: '',
    maxUses: '',
    expiryDate: '',
  });

  const filteredCoupons = useMemo(() => {
    return coupons.filter((coupon) =>
      coupon.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [coupons, searchTerm]);

  const handleToggle = (couponId: string) => {
    setToggledCoupons((prev) => ({
      ...prev,
      [couponId]: !prev[couponId],
    }));
  };

  const handleDeleteCoupon = () => {
    if (!deleteTarget) return;
    setCoupons((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const handleCreateCoupon = () => {
    if (!formData.code || !formData.discount || !formData.maxUses) {
      setCreateError('Please fill in all required fields.');
      return;
    }
    setCreateError('');

    if (editTarget) {
      // EDIT MODE
      setCoupons(prev => prev.map(c => c.id === editTarget.id ? {
        ...c,
        code: formData.code.toUpperCase(),
        discountPercentage: Number(formData.discount),
        maxUses: Number(formData.maxUses),
        expiryDate: formData.expiryDate || c.expiryDate,
      } : c));
      setEditTarget(null);
    } else {
      // CREATE MODE
      const newCoupon: Coupon = {
        id: `new-${Date.now()}`,
        code: formData.code.toUpperCase(),
        discountPercentage: Number(formData.discount),
        timesUsed: 0,
        maxUses: Number(formData.maxUses),
        expiryDate: formData.expiryDate || '2099-12-31',
        active: true,
        createdDate: new Date().toISOString().split('T')[0],
      };
      setCoupons(prev => [newCoupon, ...prev]);
    }

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
    {
      key: 'id',
      label: 'Actions',
      render: (_, coupon) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => {
              setEditTarget(coupon);
              setFormData({
                code: coupon.code,
                discount: String(coupon.discountPercentage),
                maxUses: String(coupon.maxUses),
                expiryDate: coupon.expiryDate,
              });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1 text-xs px-3 py-1 rounded-lg border border-indigo-500/30 text-indigo-400 hover:border-indigo-500/60 hover:bg-indigo-500/10 transition"
          >
            <Pencil size={13} /> Edit
          </button>
          <button
            onClick={() => setDeleteTarget(coupon)}
            className="flex items-center gap-1 text-xs px-3 py-1 rounded-lg border border-red-500/30 text-red-400 hover:border-red-500/60 hover:bg-red-500/10 transition"
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      ),
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
          onClick={() => { setEditTarget(null); setFormData({ code: '', discount: '', maxUses: '', expiryDate: '' }); setIsModalOpen(true); }}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2 font-medium text-white hover:from-indigo-600 hover:to-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-500/30"
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
          Showing {filteredCoupons.length} of {coupons.length} coupons
        </p>
        <AdminTable columns={couponColumns} data={filteredCoupons} />
      </div>

      {/* Create/Edit Coupon Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditTarget(null); setFormData({ code: '', discount: '', maxUses: '', expiryDate: '' }); setCreateError(''); }}
        title={editTarget ? 'Edit Coupon' : 'Create New Coupon'}
        footer={
          <>
            <button
              onClick={() => { setIsModalOpen(false); setEditTarget(null); setFormData({ code: '', discount: '', maxUses: '', expiryDate: '' }); setCreateError(''); }}
              className="flex-1 rounded-lg border border-gray-600 px-4 py-2 font-medium text-gray-300 hover:bg-gray-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateCoupon}
              className="flex-1 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2 font-medium text-white hover:from-indigo-600 hover:to-indigo-700 transition"
            >
              {editTarget ? 'Save Changes' : 'Create'}
            </button>
          </>
        }
      >
        {createError && (
          <p className="text-sm text-red-400 mb-4">{createError}</p>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Code</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="e.g., SAVE20"
              className="w-full rounded-lg bg-gray-800 border border-indigo-500/20 px-3 py-2 text-white outline-none focus:border-indigo-500/60"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Discount %</label>
            <input
              type="number"
              value={formData.discount}
              onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
              placeholder="e.g., 20"
              className="w-full rounded-lg bg-gray-800 border border-indigo-500/20 px-3 py-2 text-white outline-none focus:border-indigo-500/60"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Max Uses</label>
            <input
              type="number"
              value={formData.maxUses}
              onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
              placeholder="e.g., 100"
              className="w-full rounded-lg bg-gray-800 border border-indigo-500/20 px-3 py-2 text-white outline-none focus:border-indigo-500/60"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Expiry Date (Optional)</label>
            <input
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              className="w-full rounded-lg bg-gray-800 border border-indigo-500/20 px-3 py-2 text-white outline-none focus:border-indigo-500/60"
            />
          </div>
        </div>
      </Modal>

      {/* Delete Coupon Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Coupon"
        footer={
          <>
            <button
              onClick={() => setDeleteTarget(null)}
              className="flex-1 rounded-lg border border-gray-600 px-4 py-2 font-medium text-gray-300 hover:bg-gray-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteCoupon}
              className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2 font-medium text-white transition"
            >
              Delete
            </button>
          </>
        }
      >
        <p className="text-gray-300 text-sm">
          Are you sure you want to delete coupon <span className="font-bold text-white">{deleteTarget?.code}</span>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
