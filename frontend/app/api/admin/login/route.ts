import { NextResponse } from 'next/server';
import { signAdminToken } from '@/lib/jwt';
import { createSupabaseAuthClient } from '@/lib/supabase-auth';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email: string = (body.email ?? '').trim().toLowerCase();
  const password: string = body.password ?? '';

  if (!email || !password) {
    return NextResponse.json({ error: 'email and password are required' }, { status: 400 });
  }

  const configuredAdminEmail = (
    process.env.ADMIN_EMAIL ?? 'jeevanparajuli856@gmail.com'
  ).trim().toLowerCase();
  if (email !== configuredAdminEmail) {
    return NextResponse.json({ error: 'Unauthorized email.' }, { status: 401 });
  }

  const authClient = createSupabaseAuthClient();
  const { data, error } = await authClient.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user) {
    return NextResponse.json({ error: 'Wrong password.' }, { status: 401 });
  }

  const token = await signAdminToken({ email, role: 'admin', adminId: data.user.id });
  return NextResponse.json({ access_token: token, token_type: 'bearer', expires_in: 86400 });
}
