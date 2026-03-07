import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { session_token, event_type, event_data } = body;

  if (!session_token || !event_type) {
    return NextResponse.json({ error: 'session_token and event_type are required' }, { status: 400 });
  }

  const { data: session, error: sessionError } = await supabase
    .from('game_sessions')
    .select('id')
    .eq('session_token', session_token)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Invalid session token' }, { status: 401 });
  }

  const { error } = await supabase.from('event_logs').insert({
    session_id: session.id,
    event_type,
    event_data: event_data ?? {},
  });

  if (error) {
    return NextResponse.json({ error: 'Failed to log event' }, { status: 500 });
  }

  // Update session activity
  await supabase
    .from('game_sessions')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', session.id);

  return NextResponse.json({ logged: true });
}
