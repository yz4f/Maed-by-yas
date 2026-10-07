import { redirect } from 'next/navigation';

export default function SupportSessionRoute() {
  redirect('/?tab=tickets');
}
