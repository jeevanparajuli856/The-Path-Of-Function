import { NextResponse } from 'next/server';
import { createSupabaseAuthClient } from '@/lib/supabase-auth';

const DEFAULT_ADMIN_EMAIL = 'jeevanparajuli856@gmail.com';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email: string = (body.email ?? '').trim().toLowerCase();
  const adminEmail = (process.env.ADMIN_EMAIL ?? DEFAULT_ADMIN_EMAIL).trim().toLowerCase();

  if (!email) {
    return NextResponse.json(
      {
        success: false,
        error: 'Email is required.',
      },
      { status: 400 }
    );
  }

  if (email !== adminEmail) {
    return NextResponse.json(
      {
        success: false,
        error: 'Only the configured admin email can reset password.',
      },
      { status: 400 }
    );
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??
    new URL(req.url).origin;
  const redirectTo = `${baseUrl}/admin/reset-password`;

  const authClient = createSupabaseAuthClient();
  const { error } = await authClient.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Failed to send reset email: ${error.message}`,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: `If this email exists, reset link/code has been sent to ${email}.`,
  });
}
