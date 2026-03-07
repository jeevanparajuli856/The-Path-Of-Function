import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { requireAdmin, isNextResponse } from '@/lib/api-middleware';

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

  const { error } = await supabase
    .from('code_batches')
    .delete()
    .eq('id', batchId);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete batch' }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
