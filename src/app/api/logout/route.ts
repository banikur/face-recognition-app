import { NextRequest, NextResponse } from 'next/server';
import { destroySession } from '@/lib/simple-auth';

export async function POST(request: NextRequest) {
  await destroySession();
  const url = new URL('/login', request.nextUrl.origin);
  return NextResponse.redirect(url);
}
