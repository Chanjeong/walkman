'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { logoutAction } from '@/app/auth/authActions';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';

export default function LogoutButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleLogout = () => {
    startTransition(async () => {
      const result = await logoutAction();

      if (result.success) {
        toast.success(result.message);
        router.push('/auth');
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <Button
      onClick={handleLogout}
      disabled={isPending}
      variant="destructive"
      className="px-4 py-2">
      {isPending ? '처리 중...' : '로그아웃'}
    </Button>
  );
}
