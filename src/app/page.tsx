import { cookies } from 'next/headers';
import HomeContainer from '@/components/utils/HomeContainer';

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token');

  return <HomeContainer token={token?.value || ''} />;
}
