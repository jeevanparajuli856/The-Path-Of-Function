import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { requireAdmin, isNextResponse } from '@/lib/api-middleware';
import { generateAccessCode } from '@/lib/access-codes';

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  const body = await req.json().catch(() => ({}));
  const { batch_name, num_codes, treatment_group } = body;

  if (!batch_name || !num_codes || !treatment_group) {
    return NextResponse.json({ error: 'batch_name, num_codes, and treatment_group are required' }, { status: 400 });
  }

  if (num_codes < 1 || num_codes > 1000) {
    return NextResponse.json({ error: 'num_codes must be between 1 and 1000' }, { status: 400 });
  }

  // Create batch
  const { data: batch, error: batchError } = await supabase
    .from('code_batches')
    .insert({ batch_name, treatment_group, num_codes })
    .select('id')
    .single();

  if (batchError || !batch) {
    return NextResponse.json({ error: 'Failed to create batch' }, { status: 500 });
  }

  // Generate unique codes
  const codes: string[] = [];
  const maxAttempts = num_codes * 5;
  let attempts = 0;

  while (codes.length < num_codes && attempts < maxAttempts) {
    attempts++;
    const code = generateAccessCode();
    if (!codes.includes(code)) {
      codes.push(code);
    }
  }

  const rows = codes.map((code) => ({ batch_id: batch.id, code }));
  const { error: codesError } = await supabase.from('access_codes').insert(rows);

  if (codesError) {
    // Cleanup batch on failure
    await supabase.from('code_batches').delete().eq('id', batch.id);
    return NextResponse.json({ error: 'Failed to insert codes' }, { status: 500 });
  }

  return NextResponse.json({
    batch_id: batch.id,
    codes_generated: codes.length,
    codes,
  });
}
