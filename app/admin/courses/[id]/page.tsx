import { redirect } from 'next/navigation';

export default function CourseRedirectPage({ params }: { params: { id: string } }) {
  redirect(`/admin/courses/${params.id}/edit`);
}
