import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { requireAdmin, isNextResponse } from '@/lib/api-middleware';

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  const { data: batches, error } = await supabase
    .from('code_batches')
    .select(`
      id,
      batch_name,
      treatment_group,
      created_at,
      num_codes,
      access_codes(id, is_active, times_used)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch batches' }, { status: 500 });
  }

  const result = (batches ?? []).map((b) => {
    const codes = Array.isArray(b.access_codes) ? b.access_codes : [];
    const totalCodes = codes.length;
    const usedCodes = codes.filter((c: { times_used: number }) => c.times_used > 0).length;
    const activeCodes = codes.filter((c: { is_active: boolean; times_used: number }) => c.is_active && c.times_used === 0).length;

    return {
      id: b.id,
      batch_name: b.batch_name,
      treatment_group: b.treatment_group,
      created_at: b.created_at,
      total_codes: totalCodes,
      used_codes: usedCodes,
      active_codes: activeCodes,
    };
  });

  return NextResponse.json(result);
}
