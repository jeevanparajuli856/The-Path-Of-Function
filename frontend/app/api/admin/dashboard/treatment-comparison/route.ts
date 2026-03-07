import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { requireAdmin, isNextResponse } from '@/lib/api-middleware';

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  // Query the treatment_group_comparison view defined in schema.sql
  const { data, error } = await supabase
    .from('treatment_group_comparison')
    .select('*');

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch treatment comparison' }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
