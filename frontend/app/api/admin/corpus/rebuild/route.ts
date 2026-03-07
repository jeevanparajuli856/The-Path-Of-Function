import fs from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { supabase } from '@/lib/db';
import { requireAdmin, isNextResponse } from '@/lib/api-middleware';

type SeedRow = {
  source_id: string;
  source_type: string;
  scene_id: string;
  topic: string;
  content: string;
};

function validateSeedRow(row: Partial<SeedRow>): row is SeedRow {
  return Boolean(
    row.source_id &&
      row.source_type &&
      row.scene_id &&
      row.topic &&
      row.content &&
      typeof row.source_id === 'string' &&
      typeof row.source_type === 'string' &&
      typeof row.scene_id === 'string' &&
      typeof row.topic === 'string' &&
      typeof row.content === 'string'
  );
}

async function embedText(client: BedrockRuntimeClient, modelId: string, text: string): Promise<number[]> {
  const command = new InvokeModelCommand({
    modelId,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({ inputText: text }),
  });

  const result = await client.send(command);
  const body = JSON.parse(new TextDecoder().decode(result.body));

  if (!Array.isArray(body.embedding)) {
    throw new Error('Embedding response missing embedding array');
  }

  return body.embedding.map((v: unknown) => Number(v)).filter((v: number) => Number.isFinite(v));
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  try {
    const seedPath = path.join(process.cwd(), 'scripts', 'corpus.seed.json');
    if (!fs.existsSync(seedPath)) {
      return NextResponse.json({ error: `Seed file not found: ${seedPath}` }, { status: 500 });
    }

    const raw = fs.readFileSync(seedPath, 'utf8');
    const parsed = JSON.parse(raw) as Partial<SeedRow>[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return NextResponse.json({ error: 'Seed file is empty or invalid' }, { status: 400 });
    }

    const invalid = parsed.find((row) => !validateSeedRow(row));
    if (invalid) {
      return NextResponse.json({ error: 'Seed file has invalid rows' }, { status: 400 });
    }

    const rows = parsed as SeedRow[];
    const embedModelId = process.env.BEDROCK_EMBED_MODEL_ID ?? 'amazon.titan-embed-text-v2:0';
    const region = process.env.AWS_REGION ?? 'us-east-1';

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return NextResponse.json({ error: 'Missing AWS credentials for Bedrock embedding' }, { status: 500 });
    }

    const bedrock = new BedrockRuntimeClient({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    const embeddings: Array<SeedRow & { embedding: number[] }> = [];
    for (const row of rows) {
      const embedding = await embedText(bedrock, embedModelId, row.content);
      embeddings.push({ ...row, embedding });
    }

    const { error: deleteError } = await supabase
      .from('content_corpus')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) {
      return NextResponse.json({ error: `Failed to clear content_corpus: ${deleteError.message}` }, { status: 500 });
    }

    const { error: upsertError } = await supabase
      .from('content_corpus')
      .upsert(embeddings, { onConflict: 'source_id' });

    if (upsertError) {
      return NextResponse.json({ error: `Failed to write corpus: ${upsertError.message}` }, { status: 500 });
    }

    const { count, error: countError } = await supabase
      .from('content_corpus')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      return NextResponse.json({ error: `Rebuild completed but count failed: ${countError.message}` }, { status: 500 });
    }

    return NextResponse.json({
      rebuilt: true,
      embedded_rows: embeddings.length,
      total_rows: count ?? embeddings.length,
      model_id: embedModelId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Corpus rebuild failed: ${message}` }, { status: 500 });
  }
}
