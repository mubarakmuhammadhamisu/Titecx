'use client';

import { useState, useMemo } from 'react';
import { Package, CheckCircle2, Truck, Clock, X, Search, ChevronDown } from 'lucide-react';
import { Modal } from '@/components/admin/shared/Modal';

// ── Mock data ─────────────────────────────────────────────────────────────────
// TODO: Replace with real Supabase fetch from mystery_box_requests table
// joined with enrollments, profiles, and courses

type BoxStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'forfeited';

interface MysteryBoxRequest {
  id: string;
  studentName: string;
  studentEmail: string;
  courseName: string;
  courseSlug: string;
  earnedAt: string;        // when mystery_box_status was set to 'earned'
  premiumDeadline: string; // original deadline they beat
  status: BoxStatus;
  trackingNumber: string | null;
  deliveryAddress: {
    name: string;
    address: string;
    city: string;
    state: string;
    phone: string;
  } | null;
  notes: string;
}

const mockRequests: MysteryBoxRequest[] = [
  {
    id: 'mbr-001',
    studentName: 'Amina Hassan',
    studentEmail: 'amina.hassan@email.com',
    courseName: 'Introduction to Web Development',
    courseSlug: 'intro-to-web-development',
    earnedAt: '2025-04-10T14:22:00Z',
    premiumDeadline: '2025-04-15T00:00:00Z',
    status: 'pending',
    trackingNumber: null,
    deliveryAddress: {
      name: 'Amina Hassan',
      address: '14B Adeola Odeku Street, Victoria Island',
      city: 'Lagos',
      state: 'Lagos',
      phone: '+234 812 345 6789',
    },
    notes: '',
  },
  {
    id: 'mbr-002',
    studentName: 'Chukwuemeka Obi',
    studentEmail: 'c.obi@gmail.com',
    courseName: 'Advanced React.js Mastery',
    courseSlug: 'advanced-react',
    earnedAt: '2025-04-08T09:10:00Z',
    premiumDeadline: '2025-04-20T00:00:00Z',
    status: 'processing',
    trackingNumber: null,
    deliveryAddress: {
      name: 'Chukwuemeka Obi',
      address: '22 Aguiyi-Ironsi Street, Maitama',
      city: 'Abuja',
      state: 'FCT',
      phone: '+234 803 987 6543',
    },
    notes: 'Call before delivery',
  },
  {
    id: 'mbr-003',
    studentName: 'Fatima Yusuf',
    studentEmail: 'fatimayusuf@outlook.com',
    courseName: 'Python for Data Science',
    courseSlug: 'python-data-science',
    earnedAt: '2025-03-25T17:45:00Z',
    premiumDeadline: '2025-04-01T00:00:00Z',
    status: 'shipped',
    trackingNumber: 'DHL-7823910042',
    deliveryAddress: {
      name: 'Fatima Yusuf',
      address: '5 Yakubu Gowon Crescent',
      city: 'Kaduna',
      state: 'Kaduna',
      phone: '+234 706 111 2233',
    },
    notes: '',
  },
  {
    id: 'mbr-004',
    studentName: 'Tunde Adeyemi',
    studentEmail: 'tunde.a@proton.me',
    courseName: 'Introduction to Web Development',
    courseSlug: 'intro-to-web-development',
    earnedAt: '2025-03-18T11:00:00Z',
    premiumDeadline: '2025-03-30T00:00:00Z',
    status: 'delivered',
    trackingNumber: 'GIG-00192837',
    deliveryAddress: {
      name: 'Tunde Adeyemi',
      address: '9 Allen Avenue, Ikeja',
      city: 'Lagos',
      state: 'Lagos',
      phone: '+234 818 222 3344',
    },
    notes: 'Delivered and confirmed via WhatsApp',
  },
  {
    id: 'mbr-005',
    studentName: 'Ngozi Eze',
    studentEmail: 'ngozi.eze@email.com',
    courseName: 'Advanced React.js Mastery',
    courseSlug: 'advanced-react',
    earnedAt: '2025-04-12T08:30:00Z',
    premiumDeadline: '2025-04-25T00:00:00Z',
    status: 'pending',
    trackingNumber: null,
    deliveryAddress: null, // student hasn't submitted address yet
    notes: 'Awaiting delivery address from student',
  },
];

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<BoxStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending:    { label: 'Pending',    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',    icon: <Clock size={11} /> },
  processing: { label: 'Processing', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',       icon: <Package size={11} /> },
  shipped:    { label: 'Shipped',    color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', icon: <Truck size={11} /> },
  delivered:  { label: 'Delivered',  color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: <CheckCircle2 size={11} /> },
  forfeited:  { label: 'Forfeited', color: 'text-gray-400 bg-gray-700/30 border-gray-600/30',       icon: <X size={11} /> },
};

const STATUS_ORDER: BoxStatus[] = ['pending', 'processing', 'shipped', 'delivered'];

export default function MysteryBoxPage() {
  const [requests, setRequests] = useState<MysteryBoxRequest[]>(mockRequests);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BoxStatus | 'all'>('all');
  const [selected, setSelected] = useState<MysteryBoxRequest | null>(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [notesInput, setNotesInput] = useState('');

  // Stats
  const stats = useMemo(() => ({
    total:      requests.length,
    pending:    requests.filter(r => r.status === 'pending').length,
    processing: requests.filter(r => r.status === 'processing').length,
    shipped:    requests.filter(r => r.status === 'shipped').length,
    delivered:  requests.filter(r => r.status === 'delivered').length,
  }), [requests]);

  const filtered = useMemo(() =>
    requests.filter(r => {
      const matchSearch =
        r.studentName.toLowerCase().includes(search.toLowerCase()) ||
        r.courseName.toLowerCase().includes(search.toLowerCase()) ||
        (r.trackingNumber ?? '').toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchSearch && matchStatus;
    }),
  [requests, search, statusFilter]);

  const openModal = (req: MysteryBoxRequest) => {
    setSelected(req);
    setTrackingInput(req.trackingNumber ?? '');
    setNotesInput(req.notes);
  };

  const handleAdvanceStatus = () => {
    if (!selected) return;
    const currentIdx = STATUS_ORDER.indexOf(selected.status as BoxStatus);
    if (currentIdx === -1 || currentIdx >= STATUS_ORDER.length - 1) return;
    const nextStatus = STATUS_ORDER[currentIdx + 1];
    const updated = { ...selected, status: nextStatus, trackingNumber: trackingInput || selected.trackingNumber, notes: notesInput };
    setRequests(prev => prev.map(r => r.id === selected.id ? updated : r));
    setSelected(updated);
  };

  const handleSaveNotes = () => {
    if (!selected) return;
    const updated = { ...selected, trackingNumber: trackingInput || selected.trackingNumber, notes: notesInput };
    setRequests(prev => prev.map(r => r.id === selected.id ? updated : r));
    setSelected(updated);
  };

  const canAdvance = selected && STATUS_ORDER.indexOf(selected.status as BoxStatus) < STATUS_ORDER.length - 1;

  const stat = (label: string, value: number, color: string) => (
    <div className="rounded-xl border border-indigo-500/20 bg-gray-900/60 px-5 py-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Package size={28} className="text-pink-400" />
          Mystery Box Fulfilment
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Manage mystery box delivery for premium course completions.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {stat('Total Earned', stats.total,      'text-white')}
        {stat('Pending',      stats.pending,    'text-amber-400')}
        {stat('Processing',   stats.processing, 'text-blue-400')}
        {stat('Shipped',      stats.shipped,    'text-indigo-400')}
        {stat('Delivered',    stats.delivered,  'text-emerald-400')}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by student, course, or tracking number..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-gray-900 border border-indigo-500/20 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as BoxStatus | 'all')}
            className="appearance-none pl-3 pr-8 py-2.5 rounded-lg bg-gray-900 border border-indigo-500/20 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition"
          >
            <option value="all">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-indigo-500/20 bg-gray-900/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-indigo-500/10">
                {['Student', 'Course', 'Earned On', 'Address', 'Tracking', 'Status', 'Action'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-500/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-gray-500 py-12">
                    <Package size={32} className="mx-auto mb-3 text-gray-700" />
                    No mystery box requests found
                  </td>
                </tr>
              ) : filtered.map(req => {
                const cfg = STATUS_CONFIG[req.status];
                return (
                  <tr key={req.id} className="hover:bg-indigo-500/5 transition">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{req.studentName}</p>
                      <p className="text-xs text-gray-500">{req.studentEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-300 max-w-[180px]">
                      <p className="truncate">{req.courseName}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(req.earnedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {req.deliveryAddress ? (
                        <span className="text-gray-300">{req.deliveryAddress.city}, {req.deliveryAddress.state}</span>
                      ) : (
                        <span className="text-amber-400">⚠ Not provided</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono">
                      {req.trackingNumber
                        ? <span className="text-indigo-300">{req.trackingNumber}</span>
                        : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
                        {cfg.icon}{cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openModal(req)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500/60 transition"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manage Modal */}
      {selected && (
        <Modal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title={`Manage — ${selected.studentName}`}
          footer={
            <div className="flex gap-2 w-full">
              <button
                onClick={handleSaveNotes}
                className="flex-1 rounded-lg border border-indigo-500/30 px-4 py-2 text-indigo-400 hover:bg-indigo-500/10 transition text-sm font-medium"
              >
                Save Notes
              </button>
              {canAdvance && (
                <button
                  onClick={handleAdvanceStatus}
                  className="flex-1 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 px-4 py-2 text-white text-sm font-medium transition"
                >
                  Mark as {STATUS_CONFIG[STATUS_ORDER[STATUS_ORDER.indexOf(selected.status as BoxStatus) + 1]]?.label}
                </button>
              )}
            </div>
          }
        >
          <div className="space-y-4 text-sm">
            {/* Current status */}
            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-800/40 border border-indigo-500/10">
              <span className="text-gray-400">Current Status</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_CONFIG[selected.status].color}`}>
                {STATUS_CONFIG[selected.status].icon}
                {STATUS_CONFIG[selected.status].label}
              </span>
            </div>

            {/* Course & dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="px-3 py-2.5 rounded-lg bg-gray-800/40 border border-indigo-500/10">
                <p className="text-xs text-gray-500 mb-0.5">Course</p>
                <p className="text-white font-medium text-xs leading-snug">{selected.courseName}</p>
              </div>
              <div className="px-3 py-2.5 rounded-lg bg-gray-800/40 border border-indigo-500/10">
                <p className="text-xs text-gray-500 mb-0.5">Earned On</p>
                <p className="text-white font-medium text-xs">{new Date(selected.earnedAt).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Delivery address */}
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-2">Delivery Address</p>
              {selected.deliveryAddress ? (
                <div className="px-4 py-3 rounded-xl bg-gray-800/40 border border-indigo-500/10 space-y-1 text-xs">
                  <p className="text-white font-semibold">{selected.deliveryAddress.name}</p>
                  <p className="text-gray-300">{selected.deliveryAddress.address}</p>
                  <p className="text-gray-300">{selected.deliveryAddress.city}, {selected.deliveryAddress.state}</p>
                  <p className="text-gray-400">{selected.deliveryAddress.phone}</p>
                </div>
              ) : (
                <div className="px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                  ⚠ Student has not submitted a delivery address yet.
                </div>
              )}
            </div>

            {/* Tracking number */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Tracking Number</label>
              <input
                value={trackingInput}
                onChange={e => setTrackingInput(e.target.value)}
                placeholder="e.g. DHL-7823910042"
                className="w-full rounded-lg bg-gray-800 border border-indigo-500/20 px-3 py-2 text-white text-sm placeholder-gray-600 outline-none focus:border-indigo-500/50 transition"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Internal Notes</label>
              <textarea
                value={notesInput}
                onChange={e => setNotesInput(e.target.value)}
                rows={3}
                placeholder="e.g. Called student, confirmed address..."
                className="w-full rounded-lg bg-gray-800 border border-indigo-500/20 px-3 py-2 text-white text-sm placeholder-gray-600 outline-none focus:border-indigo-500/50 transition resize-none"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
