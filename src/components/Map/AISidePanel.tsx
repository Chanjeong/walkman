'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AISidePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AISidePanel = ({ onClose }: AISidePanelProps) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<
    Array<{ type: 'user' | 'ai'; content: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: userMessage })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API 호출 실패');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setMessages(prev => [...prev, { type: 'ai', content: data.response }]);
    } catch (error) {
      console.error('AI 대화 오류:', error);
      setMessages(prev => [
        ...prev,
        {
          type: 'ai',
          content: `❌ 오류: ${
            error instanceof Error ? error.message : 'AI와 연결할 수 없습니다.'
          }`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-screen w-full shadow-xl flex flex-col p-0">
      {/* 헤더 */}
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b shrink-0">
        <CardTitle className="text-lg font-semibold text-gray-800">
          🤖 AI 어시스턴트
          <br />
          <p className="text-xs text-red-500">
            무료버전이랑 대화내용이 좀 허접합니다.
          </p>
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-xl h-8 w-8">
          ✕
        </Button>
      </CardHeader>

      {/* 채팅 영역 */}
      <CardContent className="flex-1 p-4 min-h-0">
        <ScrollArea className="h-full">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <div className="text-4xl mb-2">🤖</div>
                <div className="text-sm">
                  AI와 대화를 시작해보세요!
                  <br />
                  지도 관련 질문도 가능해요.
                </div>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.type === 'user' ? 'justify-end' : 'justify-start'
                  }`}>
                  <div
                    className={`max-w-xs p-3 rounded-lg ${
                      msg.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    AI가 생각 중...
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      {/* 입력 영역 - 맨 아래 고정 */}
      <div className="p-4 border-t border-gray-200 bg-white shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="무엇이든 물어보세요..."
            className="flex-1 h-12 "
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="h-12 px-4 shrink-0">
            전송
          </Button>
        </form>
      </div>
    </Card>
  );
};
