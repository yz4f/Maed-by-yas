import { redirect } from 'next/navigation';

export default function SupportPage() {
  redirect('/?tab=tickets');
}
