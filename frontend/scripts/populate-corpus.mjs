import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIdx = line.indexOf('=');
    if (eqIdx <= 0) continue;

    const key = line.slice(0, eqIdx).trim();
    const value = line.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(process.cwd(), '.env.local'));
loadEnvFile(path.join(__dirname, '..', '.env.local'));

const seedFileArg = process.argv.find((arg) => arg.startsWith('--seed-file='));
const seedFile = seedFileArg
  ? path.resolve(process.cwd(), seedFileArg.split('=')[1])
  : path.join(__dirname, 'corpus.seed.json');
const shouldTruncate = process.argv.includes('--truncate');
const isDryRun = process.argv.includes('--dry-run');

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_KEY;
const awsRegion = process.env.AWS_REGION ?? 'us-east-1';
const embedModelId = process.env.BEDROCK_EMBED_MODEL_ID ?? 'amazon.titan-embed-text-v2:0';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_* fallback).');
  process.exit(1);
}

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.error('Missing AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.');
  process.exit(1);
}

if (!fs.existsSync(seedFile)) {
  console.error(`Seed file not found: ${seedFile}`);
  process.exit(1);
}

const raw = fs.readFileSync(seedFile, 'utf8');
const corpus = JSON.parse(raw);

if (!Array.isArray(corpus) || corpus.length === 0) {
  console.error('Seed corpus is empty or invalid.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const bedrock = new BedrockRuntimeClient({
  region: awsRegion,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function embedText(text) {
  const command = new InvokeModelCommand({
    modelId: embedModelId,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({ inputText: text }),
  });

  const result = await bedrock.send(command);
  const body = JSON.parse(new TextDecoder().decode(result.body));
  if (!Array.isArray(body.embedding)) {
    throw new Error('Embedding response missing embedding array');
  }

  return body.embedding.map((v) => Number(v));
}

function validateRow(row) {
  const required = ['source_id', 'source_type', 'scene_id', 'topic', 'content'];
  for (const key of required) {
    if (!row[key] || typeof row[key] !== 'string') {
      throw new Error(`Invalid corpus row: missing/invalid ${key} for source_id=${row.source_id ?? '<unknown>'}`);
    }
  }
}

async function main() {
  console.log(`Seed file: ${seedFile}`);
  console.log(`Rows: ${corpus.length}`);
  console.log(`Model: ${embedModelId}`);
  console.log(`Region: ${awsRegion}`);
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}`);

  for (const row of corpus) {
    validateRow(row);
  }

  if (isDryRun) {
    console.log('Dry run complete: validation passed, no DB writes performed.');
    return;
  }

  if (shouldTruncate) {
    console.log('Truncating content_corpus...');
    const { error: truncateError } = await supabase
      .from('content_corpus')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (truncateError) {
      throw new Error(`Failed to truncate content_corpus: ${truncateError.message}`);
    }
  }

  const rows = [];
  for (let i = 0; i < corpus.length; i += 1) {
    const item = corpus[i];
    console.log(`Embedding ${i + 1}/${corpus.length}: ${item.source_id}`);
    const embedding = await embedText(item.content);
    rows.push({
      source_id: item.source_id,
      source_type: item.source_type,
      scene_id: item.scene_id,
      topic: item.topic,
      content: item.content,
      embedding,
    });
  }

  console.log('Upserting into content_corpus...');
  const { error: upsertError } = await supabase
    .from('content_corpus')
    .upsert(rows, { onConflict: 'source_id' });

  if (upsertError) {
    throw new Error(`Upsert failed: ${upsertError.message}`);
  }

  const { count, error: countError } = await supabase
    .from('content_corpus')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    throw new Error(`Count check failed: ${countError.message}`);
  }

  console.log(`Done. content_corpus rows now: ${count ?? 'unknown'}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
