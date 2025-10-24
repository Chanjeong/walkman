import { cookies } from 'next/headers';
import HomeContainer from '@/components/HomeContainer';

export default async function Home() {
  // 서버에서 쿠키 확인
  const cookieStore = await cookies();
  const token = cookieStore.get('token');

  return <HomeContainer token={token?.value || ''} />;
}
