import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { requireAdmin, isNextResponse } from '@/lib/api-middleware';

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  const [
    { count: totalCodes },
    { count: usedCodes },
    { count: activeSessions },
    { count: completedSessions },
    { data: durationData },
  ] = await Promise.all([
    supabase.from('access_codes').select('*', { count: 'exact', head: true }),
    supabase.from('access_codes').select('*', { count: 'exact', head: true }).gt('times_used', 0),
    supabase.from('game_sessions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('game_sessions').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('game_sessions').select('total_duration_seconds, quizzes_attempted_count, quizzes_correct_count').eq('status', 'completed'),
  ]);

  let avgDurationMinutes = 0;
  let avgQuizScore = 0;

  if (durationData && durationData.length > 0) {
    const totalDuration = durationData.reduce(
      (sum: number, s: { total_duration_seconds: number }) => sum + (s.total_duration_seconds ?? 0),
      0
    );
    avgDurationMinutes = Math.round(totalDuration / durationData.length / 60);

    const quizSessions = durationData.filter(
      (s: { quizzes_attempted_count: number }) => (s.quizzes_attempted_count ?? 0) > 0
    );
    if (quizSessions.length > 0) {
      const totalAccuracy = quizSessions.reduce(
        (sum: number, s: { quizzes_correct_count: number; quizzes_attempted_count: number }) =>
          sum + (s.quizzes_correct_count ?? 0) / s.quizzes_attempted_count,
        0
      );
      avgQuizScore = Math.round((totalAccuracy / quizSessions.length) * 100);
    }
  }

  return NextResponse.json({
    total_codes: totalCodes ?? 0,
    used_codes: usedCodes ?? 0,
    active_sessions: activeSessions ?? 0,
    completed_sessions: completedSessions ?? 0,
    avg_session_duration_minutes: avgDurationMinutes,
    avg_quiz_score: avgQuizScore,
  });
}
