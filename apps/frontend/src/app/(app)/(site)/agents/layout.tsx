import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { OWNER_SOCIAL_ROOM_URL } from '@gitroom/frontend/components/agents/owner.social.room';
export const metadata: Metadata = {
  title: 'LYFE Social - Agent',
  description: 'agents',
};
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  redirect(OWNER_SOCIAL_ROOM_URL);
}
