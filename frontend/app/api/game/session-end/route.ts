import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { session_token, completion_status, final_score } = body;

  if (!session_token || !completion_status) {
    return NextResponse.json({ error: 'session_token and completion_status are required' }, { status: 400 });
  }

  if (!['completed', 'abandoned'].includes(completion_status)) {
    return NextResponse.json({ error: 'completion_status must be "completed" or "abandoned"' }, { status: 400 });
  }

  const { data: session, error: sessionError } = await supabase
    .from('game_sessions')
    .select('id')
    .eq('session_token', session_token)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Invalid session token' }, { status: 401 });
  }

  const updateData: Record<string, unknown> = {
    status: completion_status,
    ended_at: new Date().toISOString(),
    last_active_at: new Date().toISOString(),
  };

  if (completion_status === 'completed') {
    updateData.completion_percentage = 100;
  }

  if (final_score != null) {
    updateData.quizzes_correct_count = final_score;
  }

  await supabase.from('game_sessions').update(updateData).eq('id', session.id);

  return NextResponse.json({ ended: true });
}
