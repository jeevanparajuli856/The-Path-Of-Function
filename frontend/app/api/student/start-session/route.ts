import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/db';
import { validateCodeFormat } from '@/lib/access-codes';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const code: string = (body.code ?? '').toUpperCase().trim();

  if (!code || !validateCodeFormat(code)) {
    return NextResponse.json({ error: 'Invalid code format' }, { status: 400 });
  }

  // Look up the access code with its batch for treatment_group
  const { data: accessCode, error: codeError } = await supabase
    .from('access_codes')
    .select('id, is_active, max_uses, times_used, code_batches(treatment_group)')
    .eq('code', code)
    .single();

  if (codeError || !accessCode) {
    return NextResponse.json({ error: 'Code not found' }, { status: 404 });
  }

  if (!accessCode.is_active || accessCode.times_used >= accessCode.max_uses) {
    return NextResponse.json({ error: 'Code is not available for use' }, { status: 409 });
  }

  const sessionToken = uuidv4();
  const batch = Array.isArray(accessCode.code_batches)
    ? accessCode.code_batches[0]
    : accessCode.code_batches;
  const treatmentGroup = (batch as { treatment_group?: string } | null)?.treatment_group ?? 'control';

  // Create session
  const { data: session, error: sessionError } = await supabase
    .from('game_sessions')
    .insert({
      code_id: accessCode.id,
      session_token: sessionToken,
      status: 'active',
    })
    .select('id')
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }

  // Mark code as used
  await supabase
    .from('access_codes')
    .update({
      times_used: accessCode.times_used + 1,
      first_used_at: accessCode.times_used === 0 ? new Date().toISOString() : undefined,
      last_used_at: new Date().toISOString(),
    })
    .eq('id', accessCode.id);

  return NextResponse.json({
    session_id: session.id,
    session_token: sessionToken,
    treatment_group: treatmentGroup,
    game_url: '/game',
    expires_in: 86400,
  });
}
