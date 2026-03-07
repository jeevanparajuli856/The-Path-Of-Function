import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { generateAIResponse, GameContext } from '@/lib/bedrock';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { session_token, message, context } = body;

  if (!session_token || !message) {
    return NextResponse.json({ error: 'session_token and message are required' }, { status: 400 });
  }

  const { data: session, error: sessionError } = await supabase
    .from('game_sessions')
    .select('id')
    .eq('session_token', session_token)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Invalid session token' }, { status: 401 });
  }

  const gameContext: GameContext | undefined = context ?? undefined;

  const start = Date.now();
  const aiResponse = await generateAIResponse(message, gameContext, session.id);
  const latencyMs = Date.now() - start;

  const modelId = process.env.BEDROCK_MODEL_ID ?? 'anthropic.claude-3-haiku-20240307-v1:0';

  await supabase.from('chat_logs').insert({
    session_id: session.id,
    user_message: message,
    ai_response: aiResponse.response,
    scene_id: gameContext?.scene_id ?? null,
    topic_id: gameContext?.topic_id ?? null,
    learning_objective: gameContext?.learning_objective ?? null,
    player_state: gameContext?.player_state ?? null,
    help_policy:
      typeof gameContext?.help_policy === 'string'
        ? gameContext.help_policy
        : gameContext?.help_policy
        ? JSON.stringify(gameContext.help_policy)
        : null,
    citations: aiResponse.citations,
    guardrail_mode: aiResponse.guardrail_applied_mode,
    model_id: modelId,
    prompt_tokens: null,
    completion_tokens: null,
    latency_ms: latencyMs,
  });

  return NextResponse.json({
    assistant_message: aiResponse.response,
    applied_guardrail_mode: aiResponse.guardrail_applied_mode,
    citations: aiResponse.citations,
    message_id: aiResponse.message_id,
    token_count: aiResponse.token_count,
  });
}
