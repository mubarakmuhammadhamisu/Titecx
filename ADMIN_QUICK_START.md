# Admin Dashboard - Quick Start Guide

## 🎯 Access the Admin Dashboard

**URL**: `http://localhost:3000/admin`

### Authentication
The admin dashboard requires you to be logged in first:
1. Go to `http://localhost:3000/login` or `/signup`
2. Create an account or login with existing credentials
3. You'll be redirected back to `/admin` after authentication

---

## 📍 Navigation Map

```
Admin Dashboard (/)
├── Overview [/admin]
│   └── 4 stat cards + revenue chart + recent payments
│
├── Students [/admin/students]
│   ├── Student list (searchable, sortable)
│   └── Click any student → [/admin/students/[id]]
│       └── Detail: enrollments, payments, profile
│
├── Courses [/admin/courses]
│   ├── Course list with toggle publish/draft
│   └── Click any course → [/admin/courses/[id]]
│       └── Detail: enrolled students, completion rates
│
├── Enrollments [/admin/enrollments]
│   └── Filterable by course/status/payment type
│   └── Export CSV button works
│
├── Payments [/admin/payments]
│   ├── Search & filter payments
│   ├── "Verify with Paystack" button (mock)
│   └── Revenue summary
│
├── Coupons [/admin/coupons]
│   ├── Create Coupon button → modal form
│   ├── Toggle active/inactive
│   └── Search by code
│
├── Leaderboard [/admin/leaderboard]
│   ├── Ranked student list
│   └── Reset Monthly button → confirmation
│
└── Settings [/admin/settings]
    └── Platform toggles & text fields
```

---

## 🧪 What to Test

### Quick Tests (2-3 minutes)
1. ✅ Navigate sidebar - all links work
2. ✅ Search students - type in search box on `/students`
3. ✅ Click a student - goes to detail page
4. ✅ Sort table columns - click column headers
5. ✅ Toggle course published status - click toggle button on `/courses`

### Feature Tests (5 minutes)
1. ✅ **Enrollments CSV Export**
   - Go to `/admin/enrollments`
   - Click "Export CSV" button
   - File downloads to your computer
   - Open in Excel/Google Sheets

2. ✅ **Create Coupon Modal**
   - Go to `/admin/coupons`
   - Click "Create Coupon" button
   - Fill form (code, discount %, max uses, date)
   - Click "Create" - shows success alert

3. ✅ **Verify Payment (Mock)**
   - Go to `/admin/payments`
   - Click "Verify" button
   - Shows verification alert after 1.5 seconds

4. ✅ **Reset Leaderboard**
   - Go to `/admin/leaderboard`
   - Click "Reset Monthly" button
   - Confirm in modal - shows success

5. ✅ **Save Settings**
   - Go to `/admin/settings`
   - Change email or toggle switches
   - Click "Save Settings" - shows success

---

## 📊 Mock Data Available

All data is in `components/admin/mock-data.ts`:

- **12 Students** with different enrollment levels
- **6 Courses** with various price points (₦15K-₦35K)
- **10 Enrollments** with progress 0-100%
- **10 Payments** with Paystack references
- **6 Coupons** with discount codes
- **10 Leaderboard entries** with rankings
- **15 Daily revenue points** for the chart

Try these searches:
- Search "Amina" on Students page
- Search "React" on Courses page
- Search "SAVE10" on Coupons page

---

## 🎨 Design Elements Working

✅ Dark theme (gray-950 background)  
✅ Glassmorphic cards (transparent borders)  
✅ Indigo accent colors  
✅ Smooth animations (Framer Motion)  
✅ Mobile responsive sidebar  
✅ Active page highlighting in sidebar  
✅ Hover effects on tables  
✅ Status badges (green/red/yellow)  
✅ Progress bars on enrollment tables  

---

## 🔧 What's NOT Real Yet (Intentional)

❌ **Verify Payment** - Shows mock alert, not real Paystack API call  
❌ **Create Coupon** - Form doesn't save to database  
❌ **Reset Leaderboard** - Doesn't actually clear data  
❌ **Save Settings** - Doesn't persist changes  
❌ **Toggle Publish** - State changes locally only  

**These will be connected to real APIs** when backend integration is added.

---

## 📝 Code Structure

### Shared Components
- `AdminTable.tsx` - Reusable table (used on 4+ pages)
- `FilterBar.tsx` - Search & filter UI
- `StatCard.tsx` - Dashboard stat cards
- `Modal.tsx` - Generic modal dialog
- `AdminSidebar.tsx` - Navigation sidebar

### Data Layer
- `mock-data.ts` - 700+ lines of hardcoded mock data
  - Easy to replace with API calls later
  - No database queries needed now

### Each Page
- Uses mock data directly
- Client-side filtering/sorting
- No API calls (yet)
- Shows success alerts for forms

---

## 🚀 When You're Ready for Real Backend

### Step 1: Create API Routes
```
app/api/admin/
├── students/route.ts
├── courses/route.ts
├── enrollments/route.ts
├── payments/route.ts
├── coupons/route.ts
└── leaderboard/route.ts
```

### Step 2: Replace Mock Data
Delete `mock-data.ts` and create `api-service.ts`:
```typescript
export async function getStudents() {
  const res = await fetch('/api/admin/students');
  return res.json();
}
```

### Step 3: Update Pages
```typescript
// Old (mock)
import { mockStudents } from '@/components/admin/mock-data';

// New (real)
import { getStudents } from '@/components/admin/api-service';
const students = await getStudents();
```

---

## 💡 Tips

- **Search is case-insensitive** - "amina" finds "Amina Hassan"
- **Sorting works on all sortable columns** - Click header twice to reverse sort
- **Filters stack** - Multiple filters work together
- **CSV export uses current filters** - Export only what you filtered
- **Mobile sidebar hides by default** - Click hamburger menu to open
- **All animations are smooth** - No jarring transitions

---

## ✨ Everything is Complete!

The entire admin dashboard is production-ready in terms of:
- ✅ UI/UX design
- ✅ Component structure
- ✅ Data display
- ✅ Form handling (mock)
- ✅ Navigation
- ✅ Responsiveness
- ✅ Performance

**Only missing: Real backend API integration** (coming when you ask!)

Have fun exploring! 🎉
