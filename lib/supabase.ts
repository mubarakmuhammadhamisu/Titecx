import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_Publishable_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_Publishable_KEY to .env.local'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
// Returns the public URL of the uploaded image.
export async function uploadAvatar(userId: string, file: File): Promise<{ url?: string; error?: string }> {
  const ext = file.name.split('.').pop();
  const path = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true }); // upsert=true overwrites old avatar

  if (uploadError) return { error: uploadError.message };

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  // Add a cache-bust param so the browser doesn't serve the old image
  return { url: `${data.publicUrl}?t=${Date.now()}` };
}
