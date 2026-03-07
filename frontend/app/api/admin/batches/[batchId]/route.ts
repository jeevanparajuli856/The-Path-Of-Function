import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { requireAdmin, isNextResponse } from '@/lib/api-middleware';

const CHUNK_SIZE = 500;

async function deleteByIds(table: string, column: string, ids: string[]) {
  for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
    const chunk = ids.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase.from(table).delete().in(column, chunk);
    if (error) {
      throw new Error(`Failed deleting from ${table}: ${error.message}`);
    }
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { batchId: string } }
) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  const batchId = params.batchId;
  if (!batchId) {
    return NextResponse.json({ error: 'batchId is required' }, { status: 400 });
  }

  try {
    // Step 1: fetch all access codes in this batch.
    const { data: codes, error: codesError } = await supabase
      .from('access_codes')
      .select('id')
      .eq('batch_id', batchId);

    if (codesError) {
      return NextResponse.json({ error: 'Failed to read batch codes' }, { status: 500 });
    }

    const codeIds = (codes ?? []).map((row) => row.id);

    // Step 2: fetch sessions linked to those codes.
    let sessionIds: string[] = [];
    if (codeIds.length > 0) {
      const { data: sessions, error: sessionsError } = await supabase
        .from('game_sessions')
        .select('id')
        .in('code_id', codeIds);

      if (sessionsError) {
        return NextResponse.json({ error: 'Failed to read linked sessions' }, { status: 500 });
      }

      sessionIds = (sessions ?? []).map((row) => row.id);
    }

    // Step 3: remove child records first (works even without cascade FKs).
    if (sessionIds.length > 0) {
      await deleteByIds('event_logs', 'session_id', sessionIds);
      await deleteByIds('chat_logs', 'session_id', sessionIds);
      await deleteByIds('checkpoint_verifications', 'session_id', sessionIds);
      await deleteByIds('quiz_attempts', 'session_id', sessionIds);
      await deleteByIds('game_sessions', 'id', sessionIds);
    }

    // Step 4: remove codes in this batch.
    const { error: deleteCodesError } = await supabase
      .from('access_codes')
      .delete()
      .eq('batch_id', batchId);

    if (deleteCodesError) {
      return NextResponse.json({ error: 'Failed to delete linked access codes' }, { status: 500 });
    }

    // Step 5: remove the batch.
    const { error: deleteBatchError } = await supabase
      .from('code_batches')
      .delete()
      .eq('id', batchId);

    if (deleteBatchError) {
      return NextResponse.json({ error: 'Failed to delete batch' }, { status: 500 });
    }

    return NextResponse.json({
      deleted: true,
      batch_id: batchId,
      deleted_codes: codeIds.length,
      deleted_sessions: sessionIds.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete batch';
    return NextResponse.json({ error: message }, { status: 500 });
  }

}
