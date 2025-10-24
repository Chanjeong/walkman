import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AuthForm from '../../components/AuthForm';

export default async function AuthPage() {
  // 서버에서 쿠키 확인
  const cookieStore = await cookies();
  const token = cookieStore.get('token');

  // 이미 로그인된 경우 홈으로 리다이렉트
  if (token) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🚶‍♂️ Walkman</h1>
          <p className="text-gray-600">로그인하여 코스를 공유해보세요</p>
        </div>

        {/* 폼 컴포넌트 */}
        <AuthForm />
      </div>
    </div>
  );
}
