'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { logoutAction } from '@/app/auth/authActions';
import toast from 'react-hot-toast';

export default function LogoutButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleLogout = () => {
    startTransition(async () => {
      const result = await logoutAction();

      if (result.success) {
        toast.success(result.message);
        router.push('/');
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
      {isPending ? '처리 중...' : '로그아웃'}
    </button>
  );
}
