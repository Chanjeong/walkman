'use client';

import { useState } from 'react';

export default function AIPage() {
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
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-blue-600">
          🤖 AI 대화 테스트
        </h1>

        {/* 채팅 영역 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="h-96 overflow-y-auto mb-4 border rounded-lg p-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500">
                AI와 대화를 시작해보세요! 무엇이든 물어보세요.
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-4 ${
                    msg.type === 'user' ? 'text-right' : 'text-left'
                  }`}>
                  <div
                    className={`inline-block p-3 rounded-lg max-w-xs ${
                      msg.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-800 border'
                    }`}>
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="text-center text-gray-500">
                AI가 생각 중입니다...
              </div>
            )}
          </div>

          {/* 입력창 */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="무엇이든 물어보세요..."
              className="flex-1 p-3 border text-black border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? '전송 중...' : '전송'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
