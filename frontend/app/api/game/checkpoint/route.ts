import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

const VALID_CHECKPOINTS: Record<number, string> = {
  1: 'CP1',
  2: 'CP2',
};

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { session_token, checkpoint_number, code_entered } = body;

  if (!session_token || checkpoint_number == null || !code_entered) {
    return NextResponse.json({ error: 'session_token, checkpoint_number, and code_entered are required' }, { status: 400 });
  }

  const { data: session, error: sessionError } = await supabase
    .from('game_sessions')
    .select('id, current_checkpoint')
    .eq('session_token', session_token)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Invalid session token' }, { status: 401 });
  }

  const expectedCode = VALID_CHECKPOINTS[checkpoint_number];
  const isValid =
    expectedCode !== undefined &&
    code_entered.toUpperCase().trim() === expectedCode;

  // Count previous attempts for this checkpoint
  const { count: prevAttempts } = await supabase
    .from('checkpoint_verifications')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', session.id)
    .eq('checkpoint_number', checkpoint_number);

  const attempt = (prevAttempts ?? 0) + 1;

  await supabase.from('checkpoint_verifications').insert({
    session_id: session.id,
    checkpoint_number,
    entered_code: code_entered,
    is_valid: isValid,
    verification_attempt: attempt,
  });

  if (isValid) {
    const checkpointField =
      checkpoint_number === 1 ? 'checkpoint_1_verified_at' : 'checkpoint_2_verified_at';

    await supabase
      .from('game_sessions')
      .update({
        current_checkpoint: checkpoint_number,
        [checkpointField]: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
      })
      .eq('id', session.id);
  }

  const maxAttempts = 3;
  return NextResponse.json({
    verified: isValid,
    attempts_used: attempt,
    attempts_remaining: Math.max(0, maxAttempts - attempt),
    message: isValid ? 'Checkpoint verified' : 'Incorrect code',
  });
}
