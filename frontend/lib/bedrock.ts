import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { v4 as uuidv4 } from 'uuid';

// ── Types ──────────────────────────────────────────────────────────────────────

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

// ── Local corpus ───────────────────────────────────────────────────────────────

const LOCAL_CORPUS: CorpusItem[] = [
  {
    source_type: 'lesson',
    source_id: 'functions.builtin',
    scene_id: 'teaching1',
    topic: 'functions.builtin',
    content:
      'Built-in functions are predefined Python functions like print() and len() that you can call directly.',
    relevance_score: 0.9,
  },
  {
    source_type: 'lesson',
    source_id: 'functions.user_defined',
    scene_id: 'teaching1',
    topic: 'functions.user_defined',
    content:
      'User-defined functions are created with def and can be reused by calling their function name.',
    relevance_score: 0.9,
  },
  {
    source_type: 'lesson',
    source_id: 'functions.parameters',
    scene_id: 'teaching1',
    topic: 'functions.parameters',
    content:
      'Parameters receive values from function calls and act as local variables inside the function body.',
    relevance_score: 0.92,
  },
  {
    source_type: 'lesson',
    source_id: 'functions.return_values',
    scene_id: 'teaching1',
    topic: 'functions.return_values',
    content:
      'A return statement sends a computed value back to the caller so it can be used later in the program.',
    relevance_score: 0.92,
  },
  {
    source_type: 'lesson',
    source_id: 'functions.main',
    scene_id: 'teaching2',
    topic: 'functions.main',
    content:
      'A main() function organizes the program flow: define functions first, then call main() to execute core logic.',
    relevance_score: 0.94,
  },
  {
    source_type: 'lesson',
    source_id: 'functions.call_stack',
    scene_id: 'aftersubmission',
    topic: 'functions.call_stack',
    content:
      'The call stack executes the most recent function call first and returns to the previous function when done.',
    relevance_score: 0.93,
  },
  {
    source_type: 'quiz',
    source_id: 'q1_dragdrop_main',
    scene_id: 'dragqns',
    topic: 'functions.main',
    content:
      'For drag-and-drop exercises, focus on function definition order, argument passing, return assignment, and main() call placement.',
    relevance_score: 0.91,
  },
];

// ── Guardrails ─────────────────────────────────────────────────────────────────

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

// ── RAG corpus query ────────────────────────────────────────────────────────────

export function queryRagCorpus(
  message: string,
  gameContext?: GameContext
): CorpusItem[] {
  const sceneId = gameContext?.scene_id;
  const topicId = gameContext?.topic_id;
  const queryTokens = new Set(
    message
      .split(/\s+/)
      .map((t) => t.replace(/[.,!?()[\]{}"']/g, '').toLowerCase())
      .filter(Boolean)
  );

  const scored = LOCAL_CORPUS.map((item) => {
    let score = item.relevance_score;
    if (topicId && item.topic === topicId) score += 0.25;
    if (sceneId && item.scene_id === sceneId) score += 0.15;

    const contentWords = new Set(item.content.toLowerCase().split(/\s+/));
    const overlap = [...queryTokens].filter((t) => contentWords.has(t)).length;
    if (overlap) score += Math.min(0.2, overlap * 0.03);

    return { ...item, relevance_score: Math.min(Math.round(score * 1000) / 1000, 0.99) };
  });

  const top = scored.sort((a, b) => b.relevance_score - a.relevance_score).slice(0, 3);
  return top.length ? top : LOCAL_CORPUS.slice(0, 2);
}

// ── Prompt builder ─────────────────────────────────────────────────────────────

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
      'Provide hints rather than direct answers. Help them learn, do not give away solutions.';
  } else if (guardrailMode === 'spoiler') {
    guardrailInstruction =
      'Do not reveal solutions or scene outcomes. Offer general guidance instead.';
  } else if (guardrailMode === 'out_of_scope') {
    guardrailInstruction =
      'The question is not about the game or programming. Politely redirect to game-related topics.';
  }

  return `You are a helpful tutor in an educational game about programming and functions.
The learner is in the game and needs your help understanding concepts.

${sceneInfo}

Keep responses:
- Friendly and encouraging (matching the game tone)
- Focused on the game's learning objectives
- Short and conversational (1-2 paragraphs max)
- Grounded in the game's context

${guardrailInstruction}

Relevant game content:
${ragContext}

Student's question: ${message}

Provide a helpful response:`;
}

// ── Citation extractor ─────────────────────────────────────────────────────────

export function extractCitations(
  ragResults: CorpusItem[],
  responseText: string
): Citation[] {
  const lower = responseText.toLowerCase();
  let citations: Citation[] = ragResults
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

// ── Bedrock client ─────────────────────────────────────────────────────────────

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
    'I can help explain this step by step.';

  const tokenCount =
    prompt.split(/\s+/).length + text.split(/\s+/).length;

  return { text, tokenCount };
}

// ── Top-level generator ────────────────────────────────────────────────────────

export async function generateAIResponse(
  userMessage: string,
  gameContext: GameContext | undefined,
  _sessionId: string
): Promise<AIResponse> {
  const messageId = uuidv4();
  const guardrailMode = checkGuardrails(userMessage, gameContext);
  const ragResults = queryRagCorpus(userMessage, gameContext);

  let responseText: string;
  let tokenCount: number;

  if (guardrailMode === 'out_of_scope') {
    responseText =
      "I can help with this game's Python function topics. Try asking about function definitions, parameters, return values, main(), or the call stack.";
    tokenCount = userMessage.split(/\s+/).length + responseText.split(/\s+/).length;
  } else if (guardrailMode === 'spoiler') {
    responseText =
      'I cannot provide direct answers for this step. Try breaking the problem into function definition, arguments, return value, and where main() is called.';
    tokenCount = userMessage.split(/\s+/).length + responseText.split(/\s+/).length;
  } else {
    const prompt = buildPrompt(userMessage, ragResults, gameContext, guardrailMode);
    try {
      const result = await callBedrock(prompt);
      responseText = result.text;
      tokenCount = result.tokenCount;
    } catch {
      // Guarded local fallback when Bedrock is unavailable
      responseText =
        guardrailMode === 'hint'
          ? 'Try identifying what each function is responsible for first, then trace what value is passed in and what value is returned.'
          : 'A function is a reusable block of code that performs one task. Focus on the call flow: define functions, pass inputs as parameters, return the result, then call main() to run the logic.';
      tokenCount = userMessage.split(/\s+/).length + responseText.split(/\s+/).length;
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
