'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

export default function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5분간 fresh 상태 유지
            gcTime: 10 * 60 * 1000, // 10분간 캐시 유지 (cacheTime → gcTime)
            retry: 2, // 실패 시 2번 재시도
            refetchOnWindowFocus: false // 윈도우 포커스 시 자동 재요청 비활성화
          },
          mutations: {
            retry: 1 // 뮤테이션 실패 시 1번 재시도
          }
        }
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
