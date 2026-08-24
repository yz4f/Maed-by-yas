import { SupportSessionPage } from '@/components/support/support-session-page';

export const dynamic = 'force-dynamic';

export default async function SupportSessionRoute({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  return <SupportSessionPage sessionId={sessionId} />;
}
