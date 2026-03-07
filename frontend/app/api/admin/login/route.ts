import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/db';
import { signAdminToken } from '@/lib/jwt';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: 'email and password are required' }, { status: 400 });
  }

  // Check env-based admin first (simple single-admin setup)
  const envEmail = process.env.ADMIN_EMAIL;
  const envHash = process.env.ADMIN_PASSWORD_HASH;

  if (envEmail && envHash && email === envEmail) {
    const match = await bcrypt.compare(password, envHash);
    if (!match) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await signAdminToken({ email, role: 'admin', adminId: 'env-admin' });
    return NextResponse.json({ access_token: token, token_type: 'bearer', expires_in: 86400 });
  }

  // Fall back to database admin_users table
  const { data: admin, error } = await supabase
    .from('admin_users')
    .select('id, email, password_hash, role, is_active')
    .eq('email', email)
    .single();

  if (error || !admin || !admin.is_active) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const match = await bcrypt.compare(password, admin.password_hash);
  if (!match) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  await supabase
    .from('admin_users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', admin.id);

  const token = await signAdminToken({ email: admin.email, role: admin.role, adminId: admin.id });
  return NextResponse.json({ access_token: token, token_type: 'bearer', expires_in: 86400 });
}
