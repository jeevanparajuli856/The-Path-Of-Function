import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { requireAdmin, isNextResponse } from '@/lib/api-middleware';

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  const [{ data: sessions }, { data: events }] = await Promise.all([
    supabase
      .from('game_sessions')
      .select(
        'id, session_token, status, started_at, ended_at, current_scene, current_checkpoint, completion_percentage, total_duration_seconds, quizzes_attempted_count, quizzes_correct_count'
      )
      .order('started_at', { ascending: false }),
    supabase
      .from('event_logs')
      .select('id, session_id, event_type, event_data, created_at')
      .order('created_at', { ascending: false })
      .limit(10000),
  ]);

  return NextResponse.json({
    exported_at: new Date().toISOString(),
    sessions: sessions ?? [],
    events: events ?? [],
  });
}
