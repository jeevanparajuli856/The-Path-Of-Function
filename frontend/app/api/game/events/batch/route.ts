import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { session_token, events } = body;

  if (!session_token || !Array.isArray(events) || events.length === 0) {
    return NextResponse.json({ error: 'session_token and events array are required' }, { status: 400 });
  }

  if (events.length > 100) {
    return NextResponse.json({ error: 'Maximum 100 events per batch' }, { status: 400 });
  }

  const { data: session, error: sessionError } = await supabase
    .from('game_sessions')
    .select('id')
    .eq('session_token', session_token)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Invalid session token' }, { status: 401 });
  }

  const rows = events.map((e: { event_type: string; event_data?: Record<string, unknown> }) => ({
    session_id: session.id,
    event_type: e.event_type,
    event_data: e.event_data ?? {},
  }));

  const { error } = await supabase.from('event_logs').insert(rows);

  if (error) {
    return NextResponse.json({ error: 'Failed to log events' }, { status: 500 });
  }

  await supabase
    .from('game_sessions')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', session.id);

  return NextResponse.json({ logged: rows.length });
}
