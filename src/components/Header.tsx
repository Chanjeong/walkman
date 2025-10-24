'use client';

import Link from 'next/link';
import LogoutButton from '@/components/Buttons/LogoutButton';

interface HeaderProps {
  token: string;
}

export default function Header({ token }: HeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold text-gray-800">
        <Link href={'/'}>🚶‍♂️ Walkman</Link>
      </h1>
      {token ? (
        <div className="flex items-center space-x-4">
          <span className="text-gray-700">안녕하세요!</span>
          <LogoutButton />
        </div>
      ) : (
        <Link
          href="/auth"
          className="px-6 py-2 m-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          로그인
        </Link>
      )}
    </div>
  );
}
