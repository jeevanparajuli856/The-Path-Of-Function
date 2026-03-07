import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { session_token, code_entered } = body;

  if (!session_token || !code_entered) {
    return NextResponse.json(
      { error: 'session_token and code_entered are required' },
      { status: 400 }
    );
  }

  const { data: session, error: sessionError } = await supabase
    .from('game_sessions')
    .select('id, code_id')
    .eq('session_token', session_token)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Invalid session token' }, { status: 401 });
  }

  const { data: accessCode, error: accessCodeError } = await supabase
    .from('access_codes')
    .select('code')
    .eq('id', session.code_id)
    .single();

  if (accessCodeError || !accessCode) {
    return NextResponse.json({ error: 'Access code not found for session' }, { status: 404 });
  }

  const entered = String(code_entered).trim().toUpperCase();
  const expected = String(accessCode.code).trim().toUpperCase();
  const verified = entered === expected;

  await supabase.from('event_logs').insert({
    session_id: session.id,
    event_type: verified ? 'checkpoint_pass' : 'checkpoint_fail',
    event_name: 'final_player_verification',
    event_data: {
      entered_code: entered,
      verified,
      timestamp: new Date().toISOString(),
    },
  });

  if (verified) {
    await supabase
      .from('game_sessions')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', session.id);
  }

  return NextResponse.json({
    verified,
    message: verified ? 'Final verification passed.' : 'Code does not match your session code.',
  });
}
