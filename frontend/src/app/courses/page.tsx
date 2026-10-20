import CoursesView from '@/components/CoursesView';
import { serverGet } from '@/lib/api';
import type { CourseCard as C } from '@/lib/types';

export const metadata = { title: 'Courses' };

export default async function Courses({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q?.trim() ?? '';
  const courses = (await serverGet<C[]>(`/courses${q ? `?q=${encodeURIComponent(q)}` : ''}`)) ?? [];
  return <CoursesView q={q} courses={courses} />;
}
