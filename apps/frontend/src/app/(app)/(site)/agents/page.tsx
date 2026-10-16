import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { OWNER_SOCIAL_ROOM_URL } from '@gitroom/frontend/components/agents/owner.social.room';

export const metadata: Metadata = {
  title: 'LYFE Social - Agent',
  description: '',
};

export default async function Page() {
  redirect(OWNER_SOCIAL_ROOM_URL);
}
