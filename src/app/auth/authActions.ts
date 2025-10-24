'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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

export async function loginAction(
  prevState: { success: boolean; message: string },
  formData: FormData
) {
  try {
    const rawData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string
    };

    // 유효성 검사
    const validatedData = LoginSchema.parse(rawData);

    // 사용자 찾기
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (!user) {
      return {
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.'
      };
    }

    // 비밀번호 확인
    const isValidPassword = await bcrypt.compare(
      validatedData.password,
      user.password
    );
    if (!isValidPassword) {
      return {
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.'
      };
    }

    // JWT 토큰 생성
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d'
    });

    // 쿠키에 토큰 저장
    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7일
      sameSite: 'strict'
    });

    return { success: true, message: '로그인되었습니다.' };
  } catch (error) {
    console.error('로그인 오류:', error);
    return { success: false, message: '로그인 중 오류가 발생했습니다.' };
  }
}

export async function signupAction(
  prevState: { success: boolean; message: string },
  formData: FormData
) {
  try {
    const rawData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      name: (formData.get('name') as string) || undefined
    };

    // 유효성 검사
    const validatedData = SignupSchema.parse(rawData);

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return { success: false, message: '이미 사용 중인 이메일입니다.' };
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name || null
      }
    });

    // JWT 토큰 생성
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d'
    });

    // 쿠키에 토큰 저장
    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7일
      sameSite: 'strict'
    });

    return { success: true, message: '회원가입이 완료되었습니다.' };
  } catch (error) {
    console.error('회원가입 오류:', error);
    return { success: false, message: '회원가입 중 오류가 발생했습니다.' };
  }
}

export async function logoutAction() {
  try {
    // 쿠키 삭제
    const cookieStore = await cookies();
    cookieStore.set('token', '', {
      httpOnly: true,
      path: '/',
      maxAge: 0,
      sameSite: 'strict'
    });

    return { success: true, message: '로그아웃되었습니다.' };
  } catch (error) {
    console.error('로그아웃 오류:', error);
    return { success: false, message: '로그아웃 중 오류가 발생했습니다.' };
  }
}
