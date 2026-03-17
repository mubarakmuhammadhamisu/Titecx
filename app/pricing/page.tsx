// The public pricing page has been removed.
// Individual course pricing is shown on each course page and at checkout.
import { redirect } from 'next/navigation';

export default function PricingPage() {
  redirect('/courses');
}
