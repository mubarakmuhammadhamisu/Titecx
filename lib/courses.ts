// lib/courses.ts — Server-side fetch functions for SERVER COMPONENTS only.
// Client components use const { courses } = useAuth() instead.

import { createClient } from '@supabase/supabase-js';
import type { CourseSchema, Module } from '@/lib/Course';

interface CourseRow {
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
  // 1. Add these fields to the interface
  premium_price: string;
  premium_deadline_days: number;
  premium_perks: string[];
}

function rowToCourse(row: CourseRow): CourseSchema {
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
    features:         Array.isArray(row.features)   ? row.features   : [],
    curriculum:       Array.isArray(row.curriculum) ? row.curriculum : [],
    modules:          Array.isArray(row.modules)    ? row.modules    : [],
    // 2. Map the database row properties to the schema properties
    premiumPrice:        row.premium_price,
    premiumDeadlineDays: row.premium_deadline_days,
    premiumPerks:        Array.isArray(row.premium_perks) ? row.premium_perks : [],
  };
}

// Client is created once at module level — not inside the fetch functions —
// so it is not re-created on every server component render.
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
