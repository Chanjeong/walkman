'use client';

import { useState, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { loginAction, signupAction } from '@/app/auth/authActions';
import toast from 'react-hot-toast';

// 스키마 정의
const LoginSchema = z.object({
  email: z.string().email('올바른 이메일을 입력해주세요'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다')
});

const SignupSchema = z.object({
  email: z.string().email('올바른 이메일을 입력해주세요'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
  name: z.string().optional()
});

type LoginFormData = z.infer<typeof LoginSchema>;
type SignupFormData = z.infer<typeof SignupSchema>;

const initialState = {
  success: false,
  message: ''
};

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();

  // useActionState 훅 사용
  const [loginState, loginFormAction, isLoginPending] = useActionState(
    loginAction,
    initialState
  );
  const [signupState, signupFormAction, isSignupPending] = useActionState(
    signupAction,
    initialState
  );

  // React Hook Form 설정
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      email: '',
      password: '',
      name: ''
    }
  });

  if (loginState.success) {
    toast.success(loginState.message);
    router.push('/');
    router.refresh();
  }

  if (signupState.success) {
    toast.success(signupState.message);
    router.push('/');
    router.refresh();
  }

  const handleTabChange = (newIsLogin: boolean) => {
    setIsLogin(newIsLogin);
    // 폼 리셋
    loginForm.reset();
    signupForm.reset();
  };

  return (
    <>
      {/* 탭 버튼 */}
      <div className="flex mb-8 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => handleTabChange(true)}
          className={`flex-1 py-2 px-4 rounded-md transition-colors ${
            isLogin
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}>
          로그인
        </button>
        <button
          onClick={() => handleTabChange(false)}
          className={`flex-1 py-2 px-4 rounded-md transition-colors ${
            !isLogin
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}>
          회원가입
        </button>
      </div>

      {/* 로그인 폼 */}
      {isLogin ? (
        <form action={loginFormAction} className="space-y-6">
          <div>
            <label
              htmlFor="login-email"
              className="block text-sm font-medium text-gray-700 mb-2">
              이메일
            </label>
            <input
              {...loginForm.register('email')}
              type="email"
              id="login-email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="이메일을 입력하세요"
            />
            {loginForm.formState.errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {loginForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-sm font-medium text-gray-700 mb-2">
              비밀번호
            </label>
            <input
              {...loginForm.register('password')}
              type="password"
              id="login-password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="비밀번호를 입력하세요 (최소 6자)"
            />
            {loginForm.formState.errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {loginForm.formState.errors.password.message}
              </p>
            )}
          </div>

          {/* 서버 에러 메시지 */}
          {loginState.message && !loginState.success && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 font-medium">
                {loginState.message}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoginPending}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {isLoginPending ? '처리 중...' : '로그인'}
          </button>
        </form>
      ) : (
        /* 회원가입 폼 */
        <form action={signupFormAction} className="space-y-6">
          <div>
            <label
              htmlFor="signup-name"
              className="block text-sm font-medium text-gray-700 mb-2">
              이름 (선택사항)
            </label>
            <input
              {...signupForm.register('name')}
              type="text"
              id="signup-name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="이름을 입력하세요"
            />
            {signupForm.formState.errors.name && (
              <p className="mt-1 text-sm text-red-600">
                {signupForm.formState.errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="signup-email"
              className="block text-sm font-medium text-gray-700 mb-2">
              이메일
            </label>
            <input
              {...signupForm.register('email')}
              type="email"
              id="signup-email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="이메일을 입력하세요"
            />
            {signupForm.formState.errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {signupForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="signup-password"
              className="block text-sm font-medium text-gray-700 mb-2">
              비밀번호
            </label>
            <input
              {...signupForm.register('password')}
              type="password"
              id="signup-password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="비밀번호를 입력하세요 (최소 6자)"
            />
            {signupForm.formState.errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {signupForm.formState.errors.password.message}
              </p>
            )}
          </div>

          {/* 서버 에러 메시지 */}
          {signupState.message && !signupState.success && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 font-medium">
                {signupState.message}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSignupPending}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {isSignupPending ? '처리 중...' : '회원가입'}
          </button>
        </form>
      )}

      {/* 추가 정보 */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600">
          {isLogin ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}
          <button
            onClick={() => handleTabChange(!isLogin)}
            className="ml-1 text-blue-600 hover:text-blue-700 font-medium">
            {isLogin ? '회원가입' : '로그인'}
          </button>
        </p>
      </div>
    </>
  );
}
