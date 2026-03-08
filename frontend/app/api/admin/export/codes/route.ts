import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { requireAdmin, isNextResponse } from '@/lib/api-middleware';

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const batchId = searchParams.get('batch_id');

  if (!batchId) {
    return NextResponse.json({ error: 'batch_id is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('access_codes')
    .select('code, code_batches(batch_name)')
    .eq('batch_id', batchId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Export codes query failed:', error.message);
    return NextResponse.json(
      { error: 'Failed to export codes', details: error.message },
      { status: 500 }
    );
  }

  const batchNameRaw = (() => {
    const first = data?.[0];
    const batch = first?.code_batches;
    if (Array.isArray(batch)) return batch[0]?.batch_name ?? '';
    return (batch as { batch_name?: string } | null)?.batch_name ?? '';
  })();
  const safeBatchName = (batchNameRaw || batchId).replace(/[^a-zA-Z0-9-_]+/g, '_');

  const rows = (data ?? []).map((row) => ({
    Code: row.code,
    Name: '',
  }));

  const headers = ['Code', 'Name'];
  const csv = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => JSON.stringify(r[h as keyof typeof r] ?? '')).join(',')),
  ].join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="batch-${safeBatchName}.csv"`,
    },
  });
}
