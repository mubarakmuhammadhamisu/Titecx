// lib/courseLocking.ts
//
// Pure, deterministic locking functions shared by:
//   - app/dashboard/courses/[slug]/page.tsx         (course overview)
//   - app/dashboard/courses/[slug]/view/[lessonId]/page.tsx  (lesson view)
//
// NOT used by CurriculumSidebar — that component has an additional `isActive`
// guard (the currently-viewed lesson is never shown as locked regardless of
// predecessor state) which is intentionally different from the routing gate here.
//
// Locking rules:
//   Module gate:  a module (index > 0) is locked until the last lesson of the
//                 preceding module has been completed.
//   Lesson gate:  within an unlocked module, each lesson requires the lesson
//                 immediately before it to be completed.

import type { Module } from '@/lib/Course';

/**
 * Returns true if the module at `moduleIdx` is gated (its predecessor's
 * final lesson has not yet been completed).
 */
export function isModuleLocked(
  modules: Module[],
  moduleIdx: number,
  completedLessonIds: Set<string>,
): boolean {
  if (moduleIdx === 0) return false;
  const prev = modules[moduleIdx - 1];
  if (!prev || prev.lessons.length === 0) return false;
  return !completedLessonIds.has(prev.lessons[prev.lessons.length - 1].id);
}

/**
 * Returns true if a specific lesson is locked.
 * A lesson is locked if its module is locked, or if the lesson
 * immediately before it in the same module has not been completed.
 */
export function isLessonLocked(
  modules: Module[],
  moduleIdx: number,
  lessonIdx: number,
  completedLessonIds: Set<string>,
): boolean {
  if (isModuleLocked(modules, moduleIdx, completedLessonIds)) return true;
  if (lessonIdx === 0) return false;
  return !completedLessonIds.has(modules[moduleIdx].lessons[lessonIdx - 1].id);
}
