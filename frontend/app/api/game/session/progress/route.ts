import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionToken = searchParams.get('session_token');

  if (!sessionToken) {
    return NextResponse.json({ error: 'session_token query param is required' }, { status: 400 });
  }

  const { data: session, error } = await supabase
    .from('game_sessions')
    .select(
      'id, current_scene, current_checkpoint, quizzes_attempted_count, total_duration_seconds, last_active_at'
    )
    .eq('session_token', sessionToken)
    .single();

  if (error || !session) {
    return NextResponse.json({ error: 'Invalid session token' }, { status: 401 });
  }

  const { count: eventCount } = await supabase
    .from('event_logs')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', session.id);

  return NextResponse.json({
    session_id: session.id,
    current_scene: session.current_scene ?? 'start',
    checkpoints_passed: session.current_checkpoint ?? 0,
    quizzes_completed: session.quizzes_attempted_count ?? 0,
    time_played_minutes: Math.round((session.total_duration_seconds ?? 0) / 60),
    last_event_at: session.last_active_at,
    total_events: eventCount ?? 0,
  });
}
