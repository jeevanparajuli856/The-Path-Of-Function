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
    supabase.from('game_sessions').select('started_at, ended_at, quizzes_attempted_count, quizzes_correct_count').eq('status', 'completed').not('ended_at', 'is', null),
  ]);

  let avgDurationMinutes = 0;
  let avgQuizScore = 0;

  if (durationData && durationData.length > 0) {
    const totalDuration = durationData.reduce(
      (sum: number, s: { started_at: string; ended_at: string }) => {
        const startTime = new Date(s.started_at).getTime();
        const endTime = new Date(s.ended_at).getTime();
        return sum + (endTime - startTime) / 1000; // Convert to seconds
      },
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
