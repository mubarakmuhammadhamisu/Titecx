import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_Publishable_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_Publishable_KEY to .env.local'
  );
}


export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);


// ── Row types ────────────────────────────────────────────────────────────────

export interface ProfileRow {
  id: string;
  name: string;
  email: string;
  avatar: string;          // initials fallback e.g. "M"
  avatar_url: string | null; // real uploaded image URL
  role: string;
  location: string;
  bio: string;
  phone: string;
  preferences: {
    email_notifications: boolean;
    course_recommendations: boolean;
    weekly_digest: boolean;
  };
  created_at: string;
}

export interface EnrollmentRow {
  id: string;
  user_id: string;
  course_slug: string;
  progress: number;        // 0–100, recalculated when lessons complete
  completed_at: string | null;
  enrolled_at: string;
  purchase_type: 'standard' | 'premium' | 'free';
  premium_deadline: string | null;
  mystery_box_status: 'pending' | 'earned' | 'forfeited' | null;
}

export interface LessonCompletionRow {
  id: string;
  user_id: string;
  course_slug: string;
  lesson_id: string;
  completed_at: string;
}

export interface PaymentRow {
  id: string;
  user_id: string;
  course_slug: string;
  paystack_reference: string;
  amount_kobo: number;
  status: 'success' | 'failed' | 'pending';
  paid_at: string;
}

// ── Avatar upload helper ─────────────────────────────────────────────────────
// Uploads a file to the "avatars" Supabase Storage bucket.
// Returns the public URL AND the storage path.
// The path is returned so the caller can delete the file from Storage if the
// subsequent profiles DB write fails (rollback pattern in updateAvatar).
export async function uploadAvatar(
  userId: string,
  file: File,
): Promise<{ url?: string; path?: string; error?: string }> {
  // Validate type and size before hitting Storage — prevents XSS via SVG
  // upload and protects against oversized payloads.
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: 'Only JPG, PNG, WebP, or GIF images are allowed.' };
  }
  if (file.size > MAX_SIZE) {
    return { error: 'Image must be under 5 MB.' };
  }

  // Task 7: use a fixed path with no extension so the upsert always targets
  // the exact same storage object regardless of what file type the user uploads.
  // Without this, uploading a .jpg then a .png creates two separate objects
  // because the path changes — the old one is never overwritten.
  // Setting contentType explicitly tells Supabase the MIME type even without
  // a file extension in the path.
  const path = `${userId}/avatar`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { error: uploadError.message };

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return { url: `${data.publicUrl}?t=${Date.now()}`, path };
}
