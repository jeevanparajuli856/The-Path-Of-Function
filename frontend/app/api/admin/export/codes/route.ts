import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { requireAdmin, isNextResponse } from '@/lib/api-middleware';

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const batchId = searchParams.get('batch_id');

  let query = supabase
    .from('access_codes')
    .select('code, is_active, times_used, first_used_at, last_used_at, created_at, code_batches(batch_name, treatment_group)')
    .order('created_at', { ascending: true });

  if (batchId) {
    query = query.eq('batch_id', batchId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to export codes' }, { status: 500 });
  }

  const rows = (data ?? []).map((row) => {
    const batch = Array.isArray(row.code_batches) ? row.code_batches[0] : row.code_batches;
    return {
      code: row.code,
      batch_name: (batch as { batch_name?: string } | null)?.batch_name ?? '',
      treatment_group: (batch as { treatment_group?: string } | null)?.treatment_group ?? '',
      is_active: row.is_active,
      times_used: row.times_used,
      first_used_at: row.first_used_at ?? '',
      last_used_at: row.last_used_at ?? '',
      created_at: row.created_at,
    };
  });

  const headers = Object.keys(rows[0] ?? { code: '', batch_name: '', treatment_group: '', is_active: '', times_used: '', first_used_at: '', last_used_at: '', created_at: '' });
  const csv = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => JSON.stringify(r[h as keyof typeof r] ?? '')).join(',')),
  ].join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="access-codes${batchId ? `-${batchId}` : ''}.csv"`,
    },
  });
}
