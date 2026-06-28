// lib/courses.ts — Shared course utilities used by both server and client code.
//
// Exports:
//   CourseRow          — raw Supabase DB row shape (used internally + by AuthContext)
//   rowToCourse()      — canonical DB-row → CourseSchema mapper (single source of truth)
//   getAllCourses()     — server-only fetch (SERVER COMPONENTS only)
//   getCourseBySlug()  — server-only fetch (SERVER COMPONENTS only)
//
// Client components access courses via: const { courses } = useAuth()

import { createClient } from '@supabase/supabase-js';
import type { CourseSchema, Module } from '@/lib/Course';

// Exported so AuthContext can reuse the same shape without redeclaring it.
export interface CourseRow {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  description: string;
  level: string;
  duration: string;
  price: string;
  instructor: string;
  thumbnail: string;
  gradient_from: string;
  gradient_to: string;
  features: string[];
  curriculum: string[];
  modules: Module[];
  is_published: boolean;
  premium_price: string | null;
  premium_deadline_days: number;
  premium_perks: string[];
}

// Exported so AuthContext can reuse the same mapper without redeclaring it.
export function rowToCourse(row: CourseRow): CourseSchema {
  return {
    id:               row.id,
    slug:             row.slug,
    title:            row.title,
    shortDescription: row.short_description,
    description:      row.description,
    level:            row.level,
    duration:         row.duration,
    price:            row.price,
    instructor:       row.instructor,
    thumbnail:        row.thumbnail,
    gradientFrom:     row.gradient_from,
    gradientTo:       row.gradient_to,
    features:         row.features  ?? [],
    curriculum:       row.curriculum ?? [],
    modules:          row.modules    ?? [],
    premiumPrice:        row.premium_price         ?? null,
    premiumDeadlineDays: row.premium_deadline_days ?? 60,
    premiumPerks:        row.premium_perks         ?? [],
  };
}

// Creates a Supabase client for server-side fetches (no service role — anon key only).
// Called inside each fetch function; the client is cheap to construct per-request.
function getServerClient() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key  = process.env.NEXT_PUBLIC_SUPABASE_Publishable_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_Publishable_KEY'
    );
  }

  return createClient(url, key);
}

export async function getAllCourses(): Promise<CourseSchema[]> {
  try {
    const supabase = getServerClient();
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: true });

    if (error || !data) return [];
    return (data as unknown as CourseRow[]).map(rowToCourse);
  } catch {
    return [];
  }
}

export async function getCourseBySlug(slug: string): Promise<CourseSchema | null> {
  try {
    const supabase = getServerClient();
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();

    if (error || !data) return null;
    return rowToCourse(data as unknown as CourseRow);
  } catch {
    return null;
  }
}
