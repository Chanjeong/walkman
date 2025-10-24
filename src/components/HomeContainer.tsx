'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import WalkmanMap from '@/components/Map/WalkmanMap';
import { AISidePanel } from '@/components/Map/AISidePanel';

interface HomeContainerProps {
  token: string;
}

export default function HomeContainer({ token }: HomeContainerProps) {
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);

  return (
    <div className={isAIPanelOpen ? 'grid grid-cols-4' : ''}>
      <div
        className={`${
          isAIPanelOpen ? 'col-span-3' : ''
        } min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-4`}>
        <div className="max-w-7xl mx-auto">
          <Header token={token} />
          <WalkmanMap />
        </div>
      </div>

      {/* 토글 버튼 */}
      <button
        onClick={() => setIsAIPanelOpen(!isAIPanelOpen)}
        className="fixed top-4 right-4 z-40 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-all duration-300">
        🤖
      </button>

      {/* AISidePanel 영역 - isAIPanelOpen일 때만 표시 */}
      <div className={`${isAIPanelOpen ? 'col-span-1 block' : 'hidden'}`}>
        <AISidePanel
          isOpen={isAIPanelOpen}
          onClose={() => setIsAIPanelOpen(false)}
        />
      </div>
    </div>
  );
}
