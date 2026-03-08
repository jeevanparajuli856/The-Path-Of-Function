import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { requireAdmin, isNextResponse } from '@/lib/api-middleware';

const ANALYTICS_WINDOW_DAYS = 180;
const MAX_QUIZ_EVENTS = 20000;
const MAX_SCENE_EVENTS = 30000;

type QuizEventRow = {
  session_id: string;
  created_at: string;
  event_data: Record<string, unknown> | null;
};

type SceneEventRow = {
  session_id: string;
  created_at: string;
  event_data: Record<string, unknown> | null;
};

type SessionRow = {
  id: string;
  code_id: string;
  status: string | null;
  current_scene: string | null;
  scenes_visited_count: number | null;
  quizzes_attempted_count: number | null;
};

type AccessCodeRow = {
  id: string;
  batch_id: string;
  code_batches: { treatment_group: string | null } | { treatment_group: string | null }[] | null;
};

function getNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function getString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function mapTreatment(raw: string | null | undefined): 'control' | 'treatment_a' | 'treatment_b' {
  if (raw === 'treatment_a') return 'treatment_a';
  if (raw === 'treatment_b') return 'treatment_b';
  return 'control';
}

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  try {
    const analyticsCutoff = new Date(Date.now() - ANALYTICS_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const [
      quizEventsResult,
      sceneEventsResult,
      sessionsResult,
      accessCodesResult,
      last5Result,
      last15Result,
      last60Result,
    ] = await Promise.all([
      supabase
        .from('event_logs')
        .select('session_id, event_data, created_at')
        .eq('event_type', 'quiz_submitted')
        .gte('created_at', analyticsCutoff)
        .order('created_at', { ascending: false })
        .limit(MAX_QUIZ_EVENTS),
      supabase
        .from('event_logs')
        .select('session_id, event_data, created_at')
        .eq('event_type', 'scene_start')
        .gte('created_at', analyticsCutoff)
        .order('created_at', { ascending: false })
        .limit(MAX_SCENE_EVENTS),
      supabase
        .from('game_sessions')
        .select('id, code_id, status, current_scene, scenes_visited_count, quizzes_attempted_count'),
      supabase
        .from('access_codes')
        .select('id, batch_id, code_batches(treatment_group)'),
      supabase
        .from('event_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()),
      supabase
        .from('event_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString()),
      supabase
        .from('event_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()),
    ]);

    if (sessionsResult.error) {
      throw new Error(`Failed to fetch sessions: ${sessionsResult.error.message}`);
    }
    if (accessCodesResult.error) {
      throw new Error(`Failed to fetch access codes: ${accessCodesResult.error.message}`);
    }
    if (last5Result.error || last15Result.error || last60Result.error) {
      const message =
        last5Result.error?.message || last15Result.error?.message || last60Result.error?.message || 'unknown error';
      throw new Error(`Failed to fetch activity counts: ${message}`);
    }

    if (quizEventsResult.error) {
      console.error('Analytics warning: quiz events query failed', quizEventsResult.error.message);
    }
    if (sceneEventsResult.error) {
      console.error('Analytics warning: scene events query failed', sceneEventsResult.error.message);
    }

    const quizEvents = ((quizEventsResult.error ? [] : quizEventsResult.data) ?? []) as QuizEventRow[];
    const sceneEvents = ((sceneEventsResult.error ? [] : sceneEventsResult.data) ?? []) as SceneEventRow[];
    const allSessions = (sessionsResult.data ?? []) as SessionRow[];
    const accessCodes = (accessCodesResult.data ?? []) as AccessCodeRow[];

    const codeIdToTreatment = new Map<string, 'control' | 'treatment_a' | 'treatment_b'>();
    for (const accessCode of accessCodes) {
      const batchData = Array.isArray(accessCode.code_batches)
        ? accessCode.code_batches[0]
        : accessCode.code_batches;
      codeIdToTreatment.set(accessCode.id, mapTreatment(batchData?.treatment_group));
    }

    const sessionIdToTreatment = new Map<string, 'control' | 'treatment_a' | 'treatment_b'>();
    for (const session of allSessions) {
      sessionIdToTreatment.set(session.id, codeIdToTreatment.get(session.code_id) ?? 'control');
    }

    // ===== QUIZ CORRECTNESS ANALYSIS =====
    let totalQuizzes = 0;
    let correctQuizzes = 0;
    const perQuestionStats: Record<string, { total: number; correct: number; accuracy: number }> = {};

    for (const event of quizEvents) {
      const data = event.event_data ?? {};
      const isCorrect = data.is_correct;
      if (typeof isCorrect !== 'boolean') {
        continue;
      }

      totalQuizzes += 1;
      if (isCorrect) {
        correctQuizzes += 1;
      }

      const quizId = getString(data.quiz_id, 'unknown');
      if (!perQuestionStats[quizId]) {
        perQuestionStats[quizId] = { total: 0, correct: 0, accuracy: 0 };
      }
      perQuestionStats[quizId].total += 1;
      if (isCorrect) {
        perQuestionStats[quizId].correct += 1;
      }
    }

    const overallAccuracy = totalQuizzes > 0 ? (correctQuizzes / totalQuizzes) * 100 : 0;
    for (const stats of Object.values(perQuestionStats)) {
      stats.accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
    }

    // ===== SCENE ENGAGEMENT ANALYSIS =====
    const sceneEventsBySession = new Map<string, Array<{ sceneId: string; timestampMs: number }>>();
    for (const event of sceneEvents) {
      const payload = event.event_data ?? {};
      const sceneId =
        getString(payload.scene_id) ||
        getString(payload.current_scene_id) ||
        getString(payload.current_scene) ||
        'unknown';
      const timestampMs = new Date(event.created_at).getTime();
      if (!Number.isFinite(timestampMs)) continue;

      const list = sceneEventsBySession.get(event.session_id) ?? [];
      list.push({ sceneId, timestampMs });
      sceneEventsBySession.set(event.session_id, list);
    }

    const sceneAccumulator: Record<
      string,
      {
        control_sum: number;
        control_count: number;
        treatment_a_sum: number;
        treatment_a_count: number;
        treatment_b_sum: number;
        treatment_b_count: number;
      }
    > = {};

    for (const [sessionId, events] of sceneEventsBySession.entries()) {
      const treatment = sessionIdToTreatment.get(sessionId) ?? 'control';
      const ordered = [...events].sort((a, b) => a.timestampMs - b.timestampMs);

      for (let i = 0; i < ordered.length; i += 1) {
        const current = ordered[i];
        const next = ordered[i + 1];
        const timeInScene = next ? Math.max(0, (next.timestampMs - current.timestampMs) / 1000) : 0;

        if (!sceneAccumulator[current.sceneId]) {
          sceneAccumulator[current.sceneId] = {
            control_sum: 0,
            control_count: 0,
            treatment_a_sum: 0,
            treatment_a_count: 0,
            treatment_b_sum: 0,
            treatment_b_count: 0,
          };
        }

        const sceneStats = sceneAccumulator[current.sceneId];
        if (treatment === 'treatment_a') {
          sceneStats.treatment_a_sum += timeInScene;
          sceneStats.treatment_a_count += 1;
        } else if (treatment === 'treatment_b') {
          sceneStats.treatment_b_sum += timeInScene;
          sceneStats.treatment_b_count += 1;
        } else {
          sceneStats.control_sum += timeInScene;
          sceneStats.control_count += 1;
        }
      }
    }

    const sceneEngagementAvg: Record<string, { control: number; treatment_a: number; treatment_b: number }> = {};
    for (const [sceneId, stats] of Object.entries(sceneAccumulator)) {
      sceneEngagementAvg[sceneId] = {
        control: stats.control_count > 0 ? stats.control_sum / stats.control_count : 0,
        treatment_a: stats.treatment_a_count > 0 ? stats.treatment_a_sum / stats.treatment_a_count : 0,
        treatment_b: stats.treatment_b_count > 0 ? stats.treatment_b_sum / stats.treatment_b_count : 0,
      };
    }

    // ===== SESSION COMPLETION FUNNEL =====
    const funnel = {
      started: allSessions.length,
      reached_lab: allSessions.filter((s) => {
        const currentScene = (s.current_scene ?? '').toLowerCase();
        const visited = getNumber(s.scenes_visited_count, 0);
        return currentScene.includes('lab') || visited > 1;
      }).length,
      attempted_quiz: allSessions.filter((s) => getNumber(s.quizzes_attempted_count, 0) > 0).length,
      completed: allSessions.filter((s) => s.status === 'completed').length,
    };

    return NextResponse.json({
      quiz: {
        total_submissions: totalQuizzes,
        correct_count: correctQuizzes,
        overall_accuracy: Number(overallAccuracy.toFixed(2)),
        per_question: perQuestionStats,
      },
      scene_engagement: sceneEngagementAvg,
      funnel,
      activity: {
        last_5_minutes: last5Result.count ?? 0,
        last_15_minutes: last15Result.count ?? 0,
        last_60_minutes: last60Result.count ?? 0,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown analytics failure';
    console.error('Analytics error:', message);
    return NextResponse.json({ error: 'Failed to fetch analytics', details: message }, { status: 500 });
  }
}
