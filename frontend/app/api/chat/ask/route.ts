import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { generateAIResponse, GameContext } from '@/lib/bedrock';

type EventLogRow = {
  event_type: string;
  event_data: Record<string, unknown> | null;
};

const MIN_SCENE_FOR_OPEN_CHAT = 'teaching1';
const SCENE_PROGRESS_ORDER = [
  'start',
  'inbed',
  'hallway',
  'hallwayafter',
  'teaching1',
  'teaching2',
  'dragqns',
  'aftersubmission',
  'ending',
];

function sceneRank(sceneId?: string): number {
  if (!sceneId) return -1;
  return SCENE_PROGRESS_ORDER.indexOf(sceneId);
}

function normalizeSceneId(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function extractSceneFromEvent(eventData: Record<string, unknown> | null): string | undefined {
  if (!eventData) return undefined;
  return (
    normalizeSceneId(eventData.scene_id) ||
    normalizeSceneId(eventData.current_scene_id) ||
    normalizeSceneId(eventData.current_scene)
  );
}

function inferActivePromptState(rows: EventLogRow[]): {
  prompt_active: boolean;
  active_prompt_id?: string;
} {
  for (const row of rows) {
    const payload = row.event_data ?? {};

    if (row.event_type === 'player_prompt_started') {
      return {
        prompt_active: true,
        active_prompt_id: typeof payload.prompt_id === 'string' ? payload.prompt_id : undefined,
      };
    }

    if (row.event_type === 'player_prompt_resolved') {
      return { prompt_active: false };
    }

    if (row.event_type === 'quiz_started') {
      return {
        prompt_active: true,
        active_prompt_id: typeof payload.quiz_id === 'string' ? payload.quiz_id : undefined,
      };
    }

    if (row.event_type === 'quiz_submitted') {
      return { prompt_active: false };
    }

    if (row.event_type === 'player_state_update') {
      const promptState = payload.prompt_state;
      if (promptState === 'started') {
        return {
          prompt_active: true,
          active_prompt_id: typeof payload.prompt_id === 'string' ? payload.prompt_id : undefined,
        };
      }
      if (promptState === 'resolved') {
        return { prompt_active: false };
      }
    }
  }

  return { prompt_active: false };
}

async function getLatestContextFromTelemetry(sessionId: string): Promise<Partial<GameContext>> {
  const { data } = await supabase
    .from('event_logs')
    .select('event_type, event_data')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(120);

  const rows = (data ?? []) as EventLogRow[];
  const merged: Partial<GameContext> = {};
  const inferredPromptState = inferActivePromptState(rows);

  for (const row of rows) {
    const payload = row.event_data ?? {};

    if (!merged.scene_id) {
      const sceneId = extractSceneFromEvent(payload);
      if (sceneId) merged.scene_id = sceneId;
    }
    if (!merged.topic_id && typeof payload.topic_id === 'string') {
      merged.topic_id = payload.topic_id;
    }
    if (!merged.learning_objective && typeof payload.learning_objective === 'string') {
      merged.learning_objective = payload.learning_objective;
    }
    if (!merged.player_state && row.event_type === 'player_state_update') {
      merged.player_state = payload;
    }
    if (!merged.help_policy && row.event_type === 'help_policy_update') {
      merged.help_policy = payload;
    }

    if (
      merged.scene_id &&
      merged.topic_id &&
      merged.learning_objective &&
      merged.player_state &&
      merged.help_policy
    ) {
      break;
    }
  }

  const currentPlayerState = (merged.player_state ?? {}) as Record<string, unknown>;
  merged.player_state = {
    ...currentPlayerState,
    prompt_active: inferredPromptState.prompt_active,
    active_prompt_id: inferredPromptState.active_prompt_id ?? currentPlayerState.active_prompt_id,
  };

  return merged;
}

function mergeContextWithTelemetry(
  requestContext: GameContext | undefined,
  telemetryContext: Partial<GameContext>
): GameContext | undefined {
  const incoming = requestContext ?? {};
  const merged: GameContext = { ...incoming };

  const incomingSceneRank = sceneRank(incoming.scene_id);
  const telemetrySceneRank = sceneRank(telemetryContext.scene_id);

  if (!incoming.scene_id || telemetrySceneRank > incomingSceneRank) {
    merged.scene_id = telemetryContext.scene_id ?? incoming.scene_id;
  }
  if (!incoming.topic_id && telemetryContext.topic_id) {
    merged.topic_id = telemetryContext.topic_id;
  }
  if (!incoming.learning_objective && telemetryContext.learning_objective) {
    merged.learning_objective = telemetryContext.learning_objective;
  }
  if (!incoming.player_state && telemetryContext.player_state) {
    merged.player_state = telemetryContext.player_state;
  } else if (incoming.player_state && telemetryContext.player_state) {
    merged.player_state = {
      ...(incoming.player_state as Record<string, unknown>),
      ...(telemetryContext.player_state as Record<string, unknown>),
    };
  }
  if (!incoming.help_policy && telemetryContext.help_policy) {
    merged.help_policy = telemetryContext.help_policy;
  }

  return merged;
}

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
  const telemetryContext = await getLatestContextFromTelemetry(session.id);
  const resolvedContext = mergeContextWithTelemetry(gameContext, telemetryContext);
  const currentSceneRank = sceneRank(resolvedContext?.scene_id);
  const minimumSceneRank = sceneRank(MIN_SCENE_FOR_OPEN_CHAT);

  if (currentSceneRank < minimumSceneRank) {
    const assistantMessage =
      "I don't have enough lesson information yet. Please keep on playing and ask me when you are stuck.";

    await supabase.from('chat_logs').insert({
      session_id: session.id,
      user_message: message,
      ai_response: assistantMessage,
      scene_id: resolvedContext?.scene_id ?? null,
      topic_id: resolvedContext?.topic_id ?? null,
      learning_objective: resolvedContext?.learning_objective ?? null,
      player_state: resolvedContext?.player_state ?? null,
      help_policy:
        typeof resolvedContext?.help_policy === 'string'
          ? resolvedContext.help_policy
          : resolvedContext?.help_policy
          ? JSON.stringify(resolvedContext.help_policy)
          : null,
      citations: [],
      guardrail_mode: 'insufficient_progress',
      model_id: null,
      prompt_tokens: null,
      completion_tokens: null,
      latency_ms: 0,
    });

    return NextResponse.json({
      assistant_message: assistantMessage,
      applied_guardrail_mode: 'insufficient_progress',
      citations: [],
      message_id: `insufficient-${Date.now()}`,
      token_count: assistantMessage.split(/\s+/).length,
    });
  }

  const start = Date.now();
  const aiResponse = await generateAIResponse(message, resolvedContext, session.id);
  const latencyMs = Date.now() - start;

  const modelId = process.env.BEDROCK_MODEL_ID ?? 'anthropic.claude-3-haiku-20240307-v1:0';

  await supabase.from('chat_logs').insert({
    session_id: session.id,
    user_message: message,
    ai_response: aiResponse.response,
    scene_id: resolvedContext?.scene_id ?? null,
    topic_id: resolvedContext?.topic_id ?? null,
    learning_objective: resolvedContext?.learning_objective ?? null,
    player_state: resolvedContext?.player_state ?? null,
    help_policy:
      typeof resolvedContext?.help_policy === 'string'
        ? resolvedContext.help_policy
        : resolvedContext?.help_policy
        ? JSON.stringify(resolvedContext.help_policy)
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
