import LandingView from '@/components/LandingView';
import { serverGet } from '@/lib/api';
import type { CourseCard as C } from '@/lib/types';

export default async function Landing() {
  const courses = (await serverGet<C[]>('/courses')) ?? [];
  return <LandingView courses={courses} />;
}
