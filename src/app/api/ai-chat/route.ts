import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: '메시지가 필요합니다.' },
        { status: 400 }
      );
    }

    // Hugging Face Inference Providers API 사용
    const hfToken = process.env.HUGGINGFACE_API_KEY;

    if (!hfToken) {
      return NextResponse.json(
        {
          error: 'Hugging Face 토큰이 설정되지 않았습니다.'
        },
        { status: 500 }
      );
    }

    // Inference Providers API 사용
    const response = await fetch(
      'https://router.huggingface.co/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'meta-llama/Llama-3.1-8B-Instruct',
          messages: [
            {
              role: 'user',
              content: message
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      }
    );

    if (response.ok) {
      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content || '';

      if (aiResponse && aiResponse.trim().length > 0) {
        return NextResponse.json({ response: aiResponse.trim() });
      }
    }

    // API 실패 시 에러 반환
    return NextResponse.json(
      {
        error: 'AI 모델에 연결할 수 없습니다.'
      },
      { status: 500 }
    );
  } catch (error) {
    console.error('AI 채팅 API 오류:', error);
    return NextResponse.json(
      {
        error: '서버 오류가 발생했습니다.'
      },
      { status: 500 }
    );
  }
}
