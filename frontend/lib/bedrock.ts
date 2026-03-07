import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/db';

export interface GameContext {
  scene_id?: string;
  topic_id?: string;
  learning_objective?: string;
  player_state?: Record<string, unknown>;
  help_policy?: string | { allowed_help_level?: string; spoiler_guard?: string };
}

export interface Citation {
  source_type: string;
  source_id: string;
  relevance_score: number;
  excerpt: string;
}

export interface AIResponse {
  response: string;
  citations: Citation[];
  guardrail_applied_mode: string;
  token_count: number;
  message_id: string;
  help_requests_remaining: number | null;
}

interface CorpusItem {
  source_type: string;
  source_id: string;
  scene_id: string;
  topic: string;
  content: string;
  relevance_score: number;
}

const SCENE_PROGRESSION = [
  'start',
  'inbed',
  'hallway',
  'hallwayafter',
  'teaching1',
  'teaching2',
  'dragqns',
  'aftersubmission',
  'ending',
];

function sceneRank(sceneId?: string): number {
  if (!sceneId) return -1;
  const idx = SCENE_PROGRESSION.indexOf(sceneId);
  return idx === -1 ? -1 : idx;
}

function isAllowedBySceneProgress(contentSceneId: string, currentSceneId?: string): boolean {
  const contentRank = sceneRank(contentSceneId);
  const currentRank = sceneRank(currentSceneId);
  const effectiveCurrentRank = currentRank === -1 ? 0 : currentRank;

  if (contentRank === -1) return false;
  return contentRank <= effectiveCurrentRank;
}

function parseEmbedding(raw: unknown): number[] | null {
  if (Array.isArray(raw)) {
    const parsed = raw.map((v) => Number(v)).filter((v) => Number.isFinite(v));
    return parsed.length ? parsed : null;
  }

  if (typeof raw !== 'string') return null;
  const cleaned = raw.trim().replace(/^\[|\]$/g, '');
  if (!cleaned) return null;

  const parsed = cleaned
    .split(',')
    .map((chunk) => Number(chunk.trim()))
    .filter((v) => Number.isFinite(v));

  return parsed.length ? parsed : null;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || !b.length || a.length !== b.length) return -1;

  let dot = 0;
  let aNorm = 0;
  let bNorm = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    aNorm += a[i] * a[i];
    bNorm += b[i] * b[i];
  }

  if (!aNorm || !bNorm) return -1;
  return dot / (Math.sqrt(aNorm) * Math.sqrt(bNorm));
}

export function checkGuardrails(
  message: string,
  gameContext?: GameContext
): string {
  const normalized = message.toLowerCase();

  let helpLevel = 'default';
  let spoilerGuard = 'off';

  if (gameContext?.help_policy) {
    const policy = gameContext.help_policy;
    if (typeof policy === 'string') {
      helpLevel = policy;
      spoilerGuard = policy === 'restricted' ? 'strict' : 'off';
    } else {
      helpLevel = policy.allowed_help_level ?? 'default';
      spoilerGuard = policy.spoiler_guard ?? 'off';
    }
  }

  const spoilerKeywords = [
    'solution',
    'answer',
    'how do i beat',
    'skip this',
    'just tell me',
    'correct order',
    'exact code',
    'what is the right',
    'final answer',
    'next scene',
    'later scene',
    'future',
  ];
  const isSpoilerRequest = spoilerKeywords.some((kw) => normalized.includes(kw));

  const playerState = (gameContext?.player_state ?? {}) as Record<string, unknown>;
  const activeQuiz = Boolean(playerState.quiz_id);

  if (activeQuiz && isSpoilerRequest) return 'spoiler';
  if (isSpoilerRequest && ['strict', 'medium'].includes(spoilerGuard)) return 'spoiler';
  if (!isGameRelated(message)) return 'out_of_scope';
  if (['nudge', 'hint'].includes(helpLevel)) return 'hint';

  return 'none';
}

function isGameRelated(message: string): boolean {
  const keywords = [
    'function', 'functions', 'game', 'scene', 'code', 'program',
    'variable', 'variables', 'parameter', 'parameters', 'argument',
    'arguments', 'return', 'main', 'call stack', 'quiz', 'loop', 'if',
  ];
  const lower = message.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

export async function queryRagCorpus(
  message: string,
  gameContext?: GameContext
): Promise<CorpusItem[]> {
  const sceneId = gameContext?.scene_id;
  const topicId = gameContext?.topic_id;

  const queryEmbedding = await getQueryEmbedding(message);
  if (!queryEmbedding) return [];

  const { data, error } = await supabase
    .from('content_corpus')
    .select('source_type, source_id, scene_id, topic, content, embedding')
    .not('embedding', 'is', null)
    .limit(300);

  if (error || !data?.length) return [];

  const ranked = data
    .map((row) => {
      const rowEmbedding = parseEmbedding(row.embedding);
      if (!rowEmbedding) return null;

      const similarity = cosineSimilarity(queryEmbedding, rowEmbedding);
      if (similarity < 0) return null;
      if (!isAllowedBySceneProgress(row.scene_id ?? '', sceneId)) return null;

      let score = similarity;
      if (topicId && row.topic === topicId) score += 0.12;
      if (sceneId && row.scene_id === sceneId) score += 0.08;

      return {
        source_type: row.source_type,
        source_id: row.source_id,
        scene_id: row.scene_id ?? '',
        topic: row.topic ?? '',
        content: row.content,
        relevance_score: Math.min(Math.round(score * 1000) / 1000, 0.99),
      } as CorpusItem;
    })
    .filter((item): item is CorpusItem => Boolean(item))
    .filter((item) => item.relevance_score >= 0.2)
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, 3);

  return ranked;
}

export function buildPrompt(
  message: string,
  ragResults: CorpusItem[],
  gameContext: GameContext | undefined,
  guardrailMode: string
): string {
  const sceneInfo =
    gameContext?.scene_id
      ? `Current scene: ${gameContext.scene_id}\nTopic: ${gameContext.topic_id ?? ''}\n`
      : '';

  const ragContext = ragResults
    .map((r) => `[${r.source_type}: ${r.source_id}] ${r.content}`)
    .join('\n');

  let guardrailInstruction = '';
  if (guardrailMode === 'hint') {
    guardrailInstruction =
      'Provide hints rather than direct answers. Help the learner reason without giving final solutions.';
  } else if (guardrailMode === 'spoiler') {
    guardrailInstruction =
      'Do not reveal direct solutions or future-scene content. Offer general guidance only.';
  } else if (guardrailMode === 'out_of_scope') {
    guardrailInstruction =
      'The question is outside game scope. Politely redirect to game-related programming topics.';
  }

  return `You are Emma, a tutor in an educational game about programming functions.
${sceneInfo}
Rules:
- Answer only using the provided lesson content.
- Never reveal future-scene content.
- Keep responses concise and supportive.
- If context is insufficient, say exactly: "I don't have enough information from this lesson yet."

${guardrailInstruction}

Relevant lesson content:
${ragContext}

Student question: ${message}

Answer:`;
}

export function extractCitations(
  ragResults: CorpusItem[],
  responseText: string
): Citation[] {
  const lower = responseText.toLowerCase();
  let citations = ragResults
    .filter((r) => lower.includes(r.content.toLowerCase()))
    .map((r) => ({
      source_type: r.source_type,
      source_id: r.source_id,
      relevance_score: r.relevance_score,
      excerpt: r.content,
    }));

  if (!citations.length) {
    citations = [...ragResults]
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, 2)
      .map((r) => ({
        source_type: r.source_type,
        source_id: r.source_id,
        relevance_score: r.relevance_score,
        excerpt: r.content,
      }));
  }

  return citations;
}

let bedrockClient: BedrockRuntimeClient | null = null;

function getBedrockClient(): BedrockRuntimeClient {
  if (!bedrockClient) {
    bedrockClient = new BedrockRuntimeClient({
      region: process.env.AWS_REGION ?? 'us-east-1',
      credentials:
        process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
          ? {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            }
          : undefined,
    });
  }
  return bedrockClient;
}

export async function callBedrock(
  prompt: string
): Promise<{ text: string; tokenCount: number }> {
  const modelId =
    process.env.BEDROCK_MODEL_ID ?? 'anthropic.claude-3-haiku-20240307-v1:0';
  const maxTokens = parseInt(process.env.BEDROCK_MAX_TOKENS ?? '512', 10);
  const temperature = parseFloat(process.env.BEDROCK_TEMPERATURE ?? '0.2');

  const payload = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: maxTokens,
    temperature,
    messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
  };

  const command = new InvokeModelCommand({
    modelId,
    body: JSON.stringify(payload),
    contentType: 'application/json',
    accept: 'application/json',
  });

  const result = await getBedrockClient().send(command);
  const body = JSON.parse(new TextDecoder().decode(result.body));
  const text: string =
    (body.content?.[0]?.text as string | undefined) ??
    "I don't have enough information from this lesson yet.";

  const tokenCount =
    prompt.split(/\s+/).length + text.split(/\s+/).length;

  return { text, tokenCount };
}

async function getQueryEmbedding(text: string): Promise<number[] | null> {
  const modelId = process.env.BEDROCK_EMBED_MODEL_ID ?? 'amazon.titan-embed-text-v2:0';
  const command = new InvokeModelCommand({
    modelId,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({ inputText: text }),
  });

  try {
    const result = await getBedrockClient().send(command);
    const body = JSON.parse(new TextDecoder().decode(result.body));
    if (!Array.isArray(body.embedding)) return null;
    const parsed = body.embedding
      .map((v: unknown) => Number(v))
      .filter((v: number) => Number.isFinite(v));
    return parsed.length ? parsed : null;
  } catch {
    return null;
  }
}

export async function generateAIResponse(
  userMessage: string,
  gameContext: GameContext | undefined,
  _sessionId: string
): Promise<AIResponse> {
  const messageId = uuidv4();
  const guardrailMode = checkGuardrails(userMessage, gameContext);

  let responseText: string;
  let tokenCount: number;
  let ragResults: CorpusItem[] = [];

  if (guardrailMode === 'out_of_scope') {
    responseText =
      "I can help with this game's Python function topics. Try asking about function definitions, parameters, return values, main(), or the call stack.";
    tokenCount = userMessage.split(/\s+/).length + responseText.split(/\s+/).length;
  } else if (guardrailMode === 'spoiler') {
    responseText =
      'I cannot provide direct answers for this step. I can still give a small hint based on your current scene.';
    tokenCount = userMessage.split(/\s+/).length + responseText.split(/\s+/).length;
  } else {
    ragResults = await queryRagCorpus(userMessage, gameContext);

    if (!ragResults.length) {
      responseText = "I don't have enough information from this lesson yet.";
      tokenCount = userMessage.split(/\s+/).length + responseText.split(/\s+/).length;
    } else {
      const prompt = buildPrompt(userMessage, ragResults, gameContext, guardrailMode);
      try {
        const result = await callBedrock(prompt);
        responseText = result.text;
        tokenCount = result.tokenCount;
      } catch {
        responseText = "I don't have enough information from this lesson yet.";
        tokenCount = userMessage.split(/\s+/).length + responseText.split(/\s+/).length;
      }
    }
  }

  const citations = extractCitations(ragResults, responseText);

  return {
    response: responseText,
    citations,
    guardrail_applied_mode: guardrailMode,
    token_count: tokenCount,
    message_id: messageId,
    help_requests_remaining: null,
  };
}
