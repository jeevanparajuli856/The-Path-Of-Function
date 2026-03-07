import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { requireAdmin, isNextResponse } from '@/lib/api-middleware';

const PAGE_SIZE = 1000;
const IN_CHUNK_SIZE = 500;

type SessionRow = {
  id: string;
  session_token?: string | null;
  code_id: string;
  status: string | null;
  started_at: string | null;
  ended_at: string | null;
  completion_percentage: number | null;
  current_checkpoint?: number | null;
  total_duration_seconds?: number | null;
  quizzes_attempted_count?: number | null;
  quizzes_correct_count?: number | null;
};

type AccessCodeRow = {
  id: string;
  code: string | null;
  batch_id: string | null;
  is_active?: boolean | null;
  times_used?: number | null;
  first_used_at?: string | null;
  last_used_at?: string | null;
};

type BatchRow = {
  id: string;
  batch_name: string | null;
  treatment_group: string | null;
};

type EventLogRow = {
  id: string;
  session_id: string;
  event_type: string;
  event_name: string | null;
  event_data: Record<string, unknown> | null;
  created_at: string | null;
};

type CheckpointRow = {
  id: string;
  session_id: string;
  checkpoint_number: number | null;
  entered_code: string | null;
  is_valid: boolean | null;
  verification_attempt: number | null;
  verified_at: string | null;
};

type ChatRow = {
  id: string;
  session_id: string;
  user_message: string;
  ai_response: string;
  scene_id: string | null;
  topic_id: string | null;
  citations: unknown;
  guardrail_mode: string | null;
  created_at: string | null;
};

type ExportRow = Record<string, string | number | boolean | null>;

const DETAILED_HEADERS = [
  'row_source',
  'row_id',
  'event_time',
  'event_type',
  'event_name',
  'session_id',
  'session_token',
  'code',
  'batch_name',
  'treatment_group',
  'session_status',
  'started_at',
  'ended_at',
  'completion_percentage',
  'scene_id',
  'topic_id',
  'dialogue_id',
  'choice_id',
  'quiz_id',
  'question_id',
  'checkpoint_number',
  'checkpoint_entered_code',
  'checkpoint_is_valid',
  'checkpoint_attempt',
  'user_message',
  'ai_response',
  'guardrail_mode',
  'citations_json',
  'event_data_json',
] as const;

const MINIMAL_HEADERS = [
  'code',
  'batch_name',
  'treatment_group',
  'is_active',
  'times_used',
  'first_used_at',
  'last_used_at',
  'session_id',
  'session_status',
  'started_at',
  'ended_at',
  'completion_percentage',
  'current_checkpoint',
  'duration_minutes',
  'quizzes_attempted_count',
  'quizzes_correct_count',
  'quiz_accuracy_pct',
  'total_events',
  'scene_start_count',
  'dialogue_count',
  'choice_count',
  'quiz_started_count',
  'quiz_submitted_count',
  'distinct_scene_count',
  'checkpoint_attempts_total',
  'checkpoint_valid_count',
  'checkpoint_invalid_count',
  'chat_turns',
  'guardrail_spoiler_count',
  'guardrail_out_of_scope_count',
  'guardrail_social_boundary_count',
  'guardrail_leak_attempt_count',
] as const;

async function fetchAll<T>(table: string, selectClause: string): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from(table)
      .select(selectClause)
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch ${table}: ${error.message}`);
    }

    const page = (data as T[] | null) ?? [];
    if (!page.length) break;

    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
}

async function fetchBySessionIds<T>(
  table: string,
  selectClause: string,
  sessionIds: string[]
): Promise<T[]> {
  if (!sessionIds.length) return [];

  const out: T[] = [];
  for (let i = 0; i < sessionIds.length; i += IN_CHUNK_SIZE) {
    const chunk = sessionIds.slice(i, i + IN_CHUNK_SIZE);
    const { data, error } = await supabase
      .from(table)
      .select(selectClause)
      .in('session_id', chunk);
    if (error) {
      throw new Error(`Failed to fetch ${table}: ${error.message}`);
    }
    out.push(...(((data as T[] | null) ?? [])));
  }
  return out;
}

function csvValue(value: string | number | boolean | null): string {
  if (value == null) return '""';
  return JSON.stringify(String(value));
}

function jsonText(value: unknown): string {
  if (value == null) return '';
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
}

function getIdField(payload: Record<string, unknown> | null, key: string): string {
  if (!payload) return '';
  const raw = payload[key];
  return raw == null ? '' : String(raw);
}

function toCsv(headers: readonly string[], rows: ExportRow[]): string {
  return [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvValue(row[header] ?? '')).join(',')),
  ].join('\n');
}

function toMs(value?: string | null): number {
  if (!value) return 0;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

async function getCodeAndBatchMaps(
  sessions: SessionRow[]
): Promise<{
  codeById: Map<string, AccessCodeRow>;
  batchById: Map<string, BatchRow>;
}> {
  const codeIds = [...new Set(sessions.map((s) => s.code_id).filter(Boolean))];
  const accessCodes = codeIds.length
    ? (
        await supabase
          .from('access_codes')
          .select('id, code, batch_id')
          .in('id', codeIds)
      ).data ?? []
    : [];

  const batchIds = [...new Set(accessCodes.map((c) => c.batch_id).filter(Boolean))];
  const batches = batchIds.length
    ? (
        await supabase
          .from('code_batches')
          .select('id, batch_name, treatment_group')
          .in('id', batchIds)
      ).data ?? []
    : [];

  return {
    codeById: new Map<string, AccessCodeRow>((accessCodes as AccessCodeRow[]).map((c) => [c.id, c])),
    batchById: new Map<string, BatchRow>((batches as BatchRow[]).map((b) => [b.id, b])),
  };
}

async function buildDetailedRows(): Promise<ExportRow[]> {
  const [sessions, events, checkpoints, chats] = await Promise.all([
    fetchAll<SessionRow>(
      'game_sessions',
      'id, session_token, code_id, status, started_at, ended_at, completion_percentage'
    ),
    fetchAll<EventLogRow>('event_logs', 'id, session_id, event_type, event_name, event_data, created_at'),
    fetchAll<CheckpointRow>(
      'checkpoint_verifications',
      'id, session_id, checkpoint_number, entered_code, is_valid, verification_attempt, verified_at'
    ),
    fetchAll<ChatRow>(
      'chat_logs',
      'id, session_id, user_message, ai_response, scene_id, topic_id, citations, guardrail_mode, created_at'
    ),
  ]);

  const { codeById, batchById } = await getCodeAndBatchMaps(sessions);

  const sessionMetaById = new Map(
    sessions.map((session) => {
      const code = codeById.get(session.code_id);
      const batch = code?.batch_id ? batchById.get(code.batch_id) : null;
      return [
        session.id,
        {
          session_id: session.id,
          session_token: session.session_token ?? '',
          code: code?.code ?? '',
          batch_name: batch?.batch_name ?? '',
          treatment_group: batch?.treatment_group ?? '',
          session_status: session.status ?? '',
          started_at: session.started_at ?? '',
          ended_at: session.ended_at ?? '',
          completion_percentage: session.completion_percentage ?? '',
        },
      ];
    })
  );

  const rows: ExportRow[] = [];

  for (const event of events) {
    const payload = event.event_data ?? null;
    const meta = sessionMetaById.get(event.session_id);
    if (!meta) continue;

    rows.push({
      row_source: 'event_log',
      row_id: event.id,
      event_time: event.created_at ?? '',
      event_type: event.event_type,
      event_name: event.event_name ?? '',
      ...meta,
      scene_id: getIdField(payload, 'scene_id'),
      topic_id: getIdField(payload, 'topic_id'),
      dialogue_id: getIdField(payload, 'dialogue_id'),
      choice_id: getIdField(payload, 'choice_id'),
      quiz_id: getIdField(payload, 'quiz_id'),
      question_id: getIdField(payload, 'question_id'),
      checkpoint_number: '',
      checkpoint_entered_code: '',
      checkpoint_is_valid: '',
      checkpoint_attempt: '',
      user_message: '',
      ai_response: '',
      guardrail_mode: '',
      citations_json: '',
      event_data_json: jsonText(payload),
    });
  }

  for (const checkpoint of checkpoints) {
    const meta = sessionMetaById.get(checkpoint.session_id);
    if (!meta) continue;

    rows.push({
      row_source: 'checkpoint',
      row_id: checkpoint.id,
      event_time: checkpoint.verified_at ?? '',
      event_type: 'checkpoint_verification',
      event_name: '',
      ...meta,
      scene_id: '',
      topic_id: '',
      dialogue_id: '',
      choice_id: '',
      quiz_id: '',
      question_id: '',
      checkpoint_number: checkpoint.checkpoint_number ?? '',
      checkpoint_entered_code: checkpoint.entered_code ?? '',
      checkpoint_is_valid: checkpoint.is_valid ?? '',
      checkpoint_attempt: checkpoint.verification_attempt ?? '',
      user_message: '',
      ai_response: '',
      guardrail_mode: '',
      citations_json: '',
      event_data_json: '',
    });
  }

  for (const chat of chats) {
    const meta = sessionMetaById.get(chat.session_id);
    if (!meta) continue;

    rows.push({
      row_source: 'chat',
      row_id: chat.id,
      event_time: chat.created_at ?? '',
      event_type: 'chat_turn',
      event_name: '',
      ...meta,
      scene_id: chat.scene_id ?? '',
      topic_id: chat.topic_id ?? '',
      dialogue_id: '',
      choice_id: '',
      quiz_id: '',
      question_id: '',
      checkpoint_number: '',
      checkpoint_entered_code: '',
      checkpoint_is_valid: '',
      checkpoint_attempt: '',
      user_message: chat.user_message,
      ai_response: chat.ai_response,
      guardrail_mode: chat.guardrail_mode ?? '',
      citations_json: jsonText(chat.citations),
      event_data_json: '',
    });
  }

  rows.sort((a, b) => String(a.event_time ?? '').localeCompare(String(b.event_time ?? '')));
  return rows;
}

async function buildMinimalRows(): Promise<ExportRow[]> {
  const [accessCodes, sessions, batches] = await Promise.all([
    fetchAll<AccessCodeRow>('access_codes', 'id, code, batch_id, is_active, times_used, first_used_at, last_used_at'),
    fetchAll<SessionRow>(
      'game_sessions',
      'id, code_id, status, started_at, ended_at, completion_percentage, current_checkpoint, total_duration_seconds, quizzes_attempted_count, quizzes_correct_count'
    ),
    fetchAll<BatchRow>('code_batches', 'id, batch_name, treatment_group'),
  ]);

  const sessionsByCodeId = new Map<string, SessionRow[]>();
  for (const session of sessions) {
    const list = sessionsByCodeId.get(session.code_id) ?? [];
    list.push(session);
    sessionsByCodeId.set(session.code_id, list);
  }

  const latestSessionByCodeId = new Map<string, SessionRow>();
  for (const [codeId, codeSessions] of sessionsByCodeId.entries()) {
    let latest = codeSessions[0];
    for (const candidate of codeSessions) {
      if (toMs(candidate.started_at) > toMs(latest.started_at)) {
        latest = candidate;
      }
    }
    latestSessionByCodeId.set(codeId, latest);
  }

  const latestSessionIds = [...new Set(Array.from(latestSessionByCodeId.values()).map((s) => s.id))];
  const [events, checkpoints, chats] = await Promise.all([
    fetchBySessionIds<EventLogRow>('event_logs', 'id, session_id, event_type, event_data, created_at', latestSessionIds),
    fetchBySessionIds<CheckpointRow>(
      'checkpoint_verifications',
      'id, session_id, is_valid, verification_attempt, verified_at',
      latestSessionIds
    ),
    fetchBySessionIds<ChatRow>('chat_logs', 'id, session_id, guardrail_mode', latestSessionIds),
  ]);

  const batchById = new Map<string, BatchRow>(batches.map((b) => [b.id, b]));

  const eventsBySessionId = new Map<string, EventLogRow[]>();
  for (const event of events) {
    const list = eventsBySessionId.get(event.session_id) ?? [];
    list.push(event);
    eventsBySessionId.set(event.session_id, list);
  }

  const checkpointsBySessionId = new Map<string, CheckpointRow[]>();
  for (const checkpoint of checkpoints) {
    const list = checkpointsBySessionId.get(checkpoint.session_id) ?? [];
    list.push(checkpoint);
    checkpointsBySessionId.set(checkpoint.session_id, list);
  }

  const chatsBySessionId = new Map<string, ChatRow[]>();
  for (const chat of chats) {
    const list = chatsBySessionId.get(chat.session_id) ?? [];
    list.push(chat);
    chatsBySessionId.set(chat.session_id, list);
  }

  const rows: ExportRow[] = accessCodes.map((code) => {
    const batch = code.batch_id ? batchById.get(code.batch_id) : null;
    const session = latestSessionByCodeId.get(code.id);

    const sessionEvents = session ? eventsBySessionId.get(session.id) ?? [] : [];
    const sceneSet = new Set<string>();
    let sceneStartCount = 0;
    let dialogueCount = 0;
    let choiceCount = 0;
    let quizStartedCount = 0;
    let quizSubmittedCount = 0;
    for (const event of sessionEvents) {
      const payload = event.event_data ?? {};
      const sceneId = getIdField(payload, 'scene_id');
      if (sceneId) sceneSet.add(sceneId);
      if (event.event_type === 'scene_start') sceneStartCount += 1;
      if (event.event_type === 'dialogue') dialogueCount += 1;
      if (event.event_type === 'choice_made') choiceCount += 1;
      if (event.event_type === 'quiz_started') quizStartedCount += 1;
      if (event.event_type === 'quiz_submitted') quizSubmittedCount += 1;
    }

    const sessionCheckpoints = session ? checkpointsBySessionId.get(session.id) ?? [] : [];
    const checkpointAttemptsTotal = sessionCheckpoints.length;
    const checkpointValidCount = sessionCheckpoints.filter((c) => Boolean(c.is_valid)).length;
    const checkpointInvalidCount = checkpointAttemptsTotal - checkpointValidCount;

    const sessionChats = session ? chatsBySessionId.get(session.id) ?? [] : [];
    const guardrailCounts = {
      spoiler: 0,
      out_of_scope: 0,
      social_boundary: 0,
      leak_attempt: 0,
    };
    for (const chat of sessionChats) {
      if (chat.guardrail_mode === 'spoiler') guardrailCounts.spoiler += 1;
      if (chat.guardrail_mode === 'out_of_scope') guardrailCounts.out_of_scope += 1;
      if (chat.guardrail_mode === 'social_boundary') guardrailCounts.social_boundary += 1;
      if (chat.guardrail_mode === 'leak_attempt') guardrailCounts.leak_attempt += 1;
    }

    const attempted = session?.quizzes_attempted_count ?? 0;
    const correct = session?.quizzes_correct_count ?? 0;
    const accuracyPct = attempted > 0 ? Math.round((correct / attempted) * 100) : '';

    return {
      code: code.code ?? '',
      batch_name: batch?.batch_name ?? '',
      treatment_group: batch?.treatment_group ?? '',
      is_active: code.is_active ?? '',
      times_used: code.times_used ?? '',
      first_used_at: code.first_used_at ?? '',
      last_used_at: code.last_used_at ?? '',
      session_id: session?.id ?? '',
      session_status: session?.status ?? '',
      started_at: session?.started_at ?? '',
      ended_at: session?.ended_at ?? '',
      completion_percentage: session?.completion_percentage ?? '',
      current_checkpoint: session?.current_checkpoint ?? '',
      duration_minutes:
        session?.total_duration_seconds != null
          ? Math.round((session.total_duration_seconds / 60) * 10) / 10
          : '',
      quizzes_attempted_count: attempted || '',
      quizzes_correct_count: correct || '',
      quiz_accuracy_pct: accuracyPct,
      total_events: sessionEvents.length || '',
      scene_start_count: sceneStartCount || '',
      dialogue_count: dialogueCount || '',
      choice_count: choiceCount || '',
      quiz_started_count: quizStartedCount || '',
      quiz_submitted_count: quizSubmittedCount || '',
      distinct_scene_count: sceneSet.size || '',
      checkpoint_attempts_total: checkpointAttemptsTotal || '',
      checkpoint_valid_count: checkpointValidCount || '',
      checkpoint_invalid_count: checkpointInvalidCount || '',
      chat_turns: sessionChats.length || '',
      guardrail_spoiler_count: guardrailCounts.spoiler || '',
      guardrail_out_of_scope_count: guardrailCounts.out_of_scope || '',
      guardrail_social_boundary_count: guardrailCounts.social_boundary || '',
      guardrail_leak_attempt_count: guardrailCounts.leak_attempt || '',
    };
  });

  rows.sort((a, b) => String(a.code ?? '').localeCompare(String(b.code ?? '')));
  return rows;
}

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('mode') === 'minimal' ? 'minimal' : 'detailed';

  try {
    const rows = mode === 'minimal' ? await buildMinimalRows() : await buildDetailedRows();
    const headers = mode === 'minimal' ? MINIMAL_HEADERS : DETAILED_HEADERS;
    const csv = toCsv(headers, rows);

    const now = new Date().toISOString().replace(/[:.]/g, '-');
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="research-export-${mode}-${now}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to build research export';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
