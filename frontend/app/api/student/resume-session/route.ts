import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { validateCodeFormat } from '@/lib/access-codes';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const code: string = (body.code ?? '').toUpperCase().trim();

  if (!code || !validateCodeFormat(code)) {
    return NextResponse.json({ error: 'Invalid code format' }, { status: 400 });
  }

  const { data: accessCode, error: codeError } = await supabase
    .from('access_codes')
    .select('id, code_batches(treatment_group)')
    .eq('code', code)
    .single();

  if (codeError || !accessCode) {
    return NextResponse.json({ error: 'Code not found' }, { status: 404 });
  }

  const { data: session, error: sessionError } = await supabase
    .from('game_sessions')
    .select('id, session_token, status')
    .eq('code_id', accessCode.id)
    .in('status', ['active', 'paused'])
    .order('last_active_at', { ascending: false })
    .limit(1)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: 'No active session found for this code' }, { status: 404 });
  }

  // Update last_active_at
  await supabase
    .from('game_sessions')
    .update({ last_active_at: new Date().toISOString(), status: 'active' })
    .eq('id', session.id);

  const batch = Array.isArray(accessCode.code_batches)
    ? accessCode.code_batches[0]
    : accessCode.code_batches;
  const treatmentGroup = (batch as { treatment_group?: string } | null)?.treatment_group ?? 'control';

  return NextResponse.json({
    session_id: session.id,
    session_token: session.session_token,
    treatment_group: treatmentGroup,
    game_url: '/game',
    expires_in: 86400,
  });
}
