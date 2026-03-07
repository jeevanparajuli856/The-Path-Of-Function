import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { requireAdmin, isNextResponse } from '@/lib/api-middleware';

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  try {
    // Fetch all quiz submission events
    const { data: quizEvents } = await supabase
      .from('event_logs')
      .select('event_data, session_token, created_at')
      .eq('event_type', 'quiz_submitted');

    // Fetch all scene start events for engagement calculation
    const { data: sceneEvents } = await supabase
      .from('event_logs')
      .select('event_data, session_token, created_at')
      .eq('event_type', 'scene_start');

    // Fetch all sessions for funnel calculation
    const { data: allSessions } = await supabase.from('game_sessions').select('*');

    // ===== QUIZ CORRECTNESS ANALYSIS =====
    let totalQuizzes = 0;
    let correctQuizzes = 0;
    const perQuestionStats: Record<
      string,
      { total: number; correct: number; accuracy: number }
    > = {};

    if (quizEvents) {
      quizEvents.forEach((event) => {
        try {
          const data = event.event_data as any;
          if (data?.is_correct !== undefined) {
            totalQuizzes++;
            if (data.is_correct) {
              correctQuizzes++;
            }

            // Track per-question stats
            const quizId = data.quiz_id || 'unknown';
            if (!perQuestionStats[quizId]) {
              perQuestionStats[quizId] = { total: 0, correct: 0, accuracy: 0 };
            }
            perQuestionStats[quizId].total++;
            if (data.is_correct) {
              perQuestionStats[quizId].correct++;
            }
          }
        } catch (e) {
          // Skip malformed events
        }
      });
    }

    // Calculate accuracy percentages
    const overallAccuracy = totalQuizzes > 0 ? (correctQuizzes / totalQuizzes) * 100 : 0;
    Object.entries(perQuestionStats).forEach(([, stats]) => {
      stats.accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
    });

    // ===== SCENE ENGAGEMENT ANALYSIS =====
    const sceneEngagement: Record<
      string,
      { control: number; treatment_a: number; treatment_b: number; count: number }
    > = {};

    if (sceneEvents && allSessions) {
      // Build a map of session_token to treatment_group
      const sessionTreatmentMap: Record<string, string> = {};
      allSessions.forEach((session) => {
        sessionTreatmentMap[session.session_token] = session.code_id || 'unknown';
      });

      // Process scene events
      let sceneEventsBySession: Record<
        string,
        { sceneId: string; timestamp: string; index: number }[]
      > = {};
      sceneEvents.forEach((event) => {
        try {
          const data = event.event_data as any;
          const sceneId = data.scene_id || 'unknown';
          const sessionToken = event.session_token;

          if (!sceneEventsBySession[sessionToken]) {
            sceneEventsBySession[sessionToken] = [];
          }
          sceneEventsBySession[sessionToken].push({
            sceneId,
            timestamp: event.created_at,
            index: sceneEventsBySession[sessionToken].length,
          });
        } catch (e) {
          // Skip malformed events
        }
      });

      // Calculate time in each scene
      Object.entries(sceneEventsBySession).forEach(([sessionToken, events]) => {
        const treatment = sessionTreatmentMap[sessionToken] || 'unknown';

        events.forEach((event, idx) => {
          let timeInScene = 0;
          if (idx < events.length - 1) {
            const currentTime = new Date(event.timestamp).getTime();
            const nextTime = new Date(events[idx + 1].timestamp).getTime();
            timeInScene = (nextTime - currentTime) / 1000; // Convert to seconds
          }

          if (!sceneEngagement[event.sceneId]) {
            sceneEngagement[event.sceneId] = {
              control: 0,
              treatment_a: 0,
              treatment_b: 0,
              count: 0,
            };
          }

          const treatmentKey = treatment === 'control' ? 'control' : treatment === 'treatment_a' ? 'treatment_a' : 'treatment_b';
          sceneEngagement[event.sceneId][treatmentKey] += timeInScene;
          sceneEngagement[event.sceneId].count++;
        });
      });
    }

    // Average engagement time per scene per treatment
    const sceneEngagementAvg: Record<
      string,
      { control: number; treatment_a: number; treatment_b: number }
    > = {};
    Object.entries(sceneEngagement).forEach(([sceneId, stats]) => {
      sceneEngagementAvg[sceneId] = {
        control: stats.count > 0 ? stats.control / stats.count : 0,
        treatment_a: stats.count > 0 ? stats.treatment_a / stats.count : 0,
        treatment_b: stats.count > 0 ? stats.treatment_b / stats.count : 0,
      };
    });

    // ===== SESSION COMPLETION FUNNEL =====
    const funnel = {
      started: 0,
      reached_lab: 0,
      attempted_quiz: 0,
      completed: 0,
    };

    if (allSessions) {
      funnel.started = allSessions.length;

      // Reached lab: sessions with current_scene starting with 'lab' or scenes visited > 1
      funnel.reached_lab = allSessions.filter(
        (s) => (s.current_scene && s.current_scene.toLowerCase().includes('lab')) || s.scenes_visited_count > 1
      ).length;

      // Attempted quiz: sessions with quiz attempts > 0
      funnel.attempted_quiz = allSessions.filter((s) => s.quizzes_attempted_count > 0).length;

      // Completed: sessions with status = 'completed'
      funnel.completed = allSessions.filter((s) => s.status === 'completed').length;
    }

    // ===== LIVE ACTIVITY (last 5, 15, 60 minutes) =====
    const now = new Date();
    const last5MinEvents = quizEvents
      ? quizEvents.filter((e) => {
          const eventTime = new Date(e.created_at);
          return now.getTime() - eventTime.getTime() < 5 * 60 * 1000;
        }).length
      : 0;
    const last15MinEvents = quizEvents
      ? quizEvents.filter((e) => {
          const eventTime = new Date(e.created_at);
          return now.getTime() - eventTime.getTime() < 15 * 60 * 1000;
        }).length
      : 0;
    const last60MinEvents = quizEvents
      ? quizEvents.filter((e) => {
          const eventTime = new Date(e.created_at);
          return now.getTime() - eventTime.getTime() < 60 * 60 * 1000;
        }).length
      : 0;

    return NextResponse.json({
      quiz: {
        total_submissions: totalQuizzes,
        correct_count: correctQuizzes,
        overall_accuracy: Number(overallAccuracy.toFixed(2)),
        per_question: perQuestionStats,
      },
      scene_engagement: sceneEngagementAvg,
      funnel: {
        started: funnel.started,
        reached_lab: funnel.reached_lab,
        attempted_quiz: funnel.attempted_quiz,
        completed: funnel.completed,
      },
      activity: {
        last_5_minutes: last5MinEvents,
        last_15_minutes: last15MinEvents,
        last_60_minutes: last60MinEvents,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
