import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionToken = searchParams.get('session_token');

  if (!sessionToken) {
    return NextResponse.json({ error: 'session_token query param is required' }, { status: 400 });
  }

  const { data: session, error: sessionError } = await supabase
    .from('game_sessions')
    .select('id')
    .eq('session_token', sessionToken)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Invalid session token' }, { status: 401 });
  }

  const { data: logs, error } = await supabase
    .from('chat_logs')
    .select('id, user_message, ai_response, scene_id, topic_id, guardrail_mode, citations, created_at')
    .eq('session_id', session.id)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 });
  }

  return NextResponse.json({ history: logs ?? [] });
}
