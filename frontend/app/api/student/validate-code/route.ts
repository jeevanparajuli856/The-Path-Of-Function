import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { validateCodeFormat } from '@/lib/access-codes';

const RESUME_WINDOW_DAYS = 7;

function isWithinResumeWindow(lastActiveAt?: string | null): boolean {
  if (!lastActiveAt) return false;
  const lastActiveMs = new Date(lastActiveAt).getTime();
  if (Number.isNaN(lastActiveMs)) return false;
  const elapsedMs = Date.now() - lastActiveMs;
  return elapsedMs <= RESUME_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const code: string = (body.code ?? '').toUpperCase().trim();

  if (!code || !validateCodeFormat(code)) {
    return NextResponse.json({ valid: false, can_start: false, can_resume: false, message: 'Invalid code format' }, { status: 400 });
  }

  const { data: accessCode, error } = await supabase
    .from('access_codes')
    .select('id, is_active, max_uses, times_used')
    .eq('code', code)
    .single();

  if (error || !accessCode) {
    return NextResponse.json({ valid: false, can_start: false, can_resume: false, message: 'Code not found' });
  }

  if (!accessCode.is_active) {
    return NextResponse.json({ valid: true, can_start: false, can_resume: false, message: 'Code is no longer active' });
  }

  // Check for an existing resumable session (active/paused/abandoned recovery)
  const { data: existingSession } = await supabase
    .from('game_sessions')
    .select('id, status, last_active_at, completion_percentage')
    .eq('code_id', accessCode.id)
    .in('status', ['active', 'paused', 'abandoned'])
    .lt('completion_percentage', 100)
    .order('last_active_at', { ascending: false })
    .limit(1)
    .single();

  const canResume = Boolean(existingSession && isWithinResumeWindow(existingSession.last_active_at));
  const canStart = !canResume && accessCode.times_used < accessCode.max_uses;

  if (!canStart && !canResume) {
    return NextResponse.json({ valid: true, can_start: false, can_resume: false, message: 'Code has already been used' });
  }

  return NextResponse.json({
    valid: true,
    can_start: canStart,
    can_resume: canResume,
    message: canResume ? 'Resume existing session' : 'Ready to start',
  });
}
