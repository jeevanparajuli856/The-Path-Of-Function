/**
 * Ren'Py Web Integration Utilities
 * 
 * This file handles communication between the Ren'Py game running in an iframe
 * and the React frontend using postMessage() API.
 * 
 * Message Format (Ren'Py → React):
 * {
 *   type: 'event' | 'checkpoint' | 'quiz' | 'dialogue' | 'checkpoint_prompt',
 *   payload: { ... event-specific data ... }
 * }
 */

export type RenPyEventType = 
  | 'scene_start'
  | 'scene_end'
  | 'dialogue'
  | 'choice_made'
  | 'learning_context_update'
  | 'help_policy_update'
  | 'player_state_update'
  | 'checkpoint_reached'
  | 'quiz_started'
  | 'quiz_submitted'
  | 'player_prompt_started'
  | 'player_prompt_resolved'
  | 'game_ended'
  | 'request_checkpoint_code'
  | 'request_pause'
  | 'error';

export interface RenPyMessage {
  type: RenPyEventType;
  payload: Record<string, any>;
}

export interface CheckpointPromptPayload {
  checkpoint_number: number;
  prompt_text: string;
  hint?: string;
  max_attempts: number;
  current_attempt: number;
}

export interface QuizPayload {
  quiz_id: string;
  question: string;
  options: string[];
  quiz_number: number;
  total_quizzes: number;
}

export interface RenPyGameState {
  current_scene: string;
  checkpoint_passed: number;
  time_elapsed_seconds: number;
  last_event_type: RenPyEventType | null;
}

// ========== LISTENERS ==========

type MessageHandler = (message: RenPyMessage, gameState: RenPyGameState) => void | Promise<void>;

const messageHandlers = new Map<RenPyEventType, MessageHandler[]>();

/**
 * Register a handler for a specific Ren'Py event type
 */
export const onRenPyEvent = (
  eventType: RenPyEventType,
  handler: MessageHandler
): (() => void) => {
  if (!messageHandlers.has(eventType)) {
    messageHandlers.set(eventType, []);
  }

  messageHandlers.get(eventType)!.push(handler);

  // Return unsubscribe function
  return () => {
    const handlers = messageHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  };
};

// ========== GAME STATE TRACKING ==========

let gameState: RenPyGameState = {
  current_scene: 'start',
  checkpoint_passed: 0,
  time_elapsed_seconds: 0,
  last_event_type: null,
};

export const getGameState = (): RenPyGameState => {
  return { ...gameState };
};

export const updateGameState = (updates: Partial<RenPyGameState>) => {
  gameState = { ...gameState, ...updates };
};

// ========== IFRAME COMMUNICATION ==========

let gameIframe: HTMLIFrameElement | null = null;
let isListenerAttached = false;

/**
 * Initialize Ren'Py iframe communication
 * Call this once when the game page loads
 */
export const initializeRenPyIntegration = (iframeElement: HTMLIFrameElement) => {
  gameIframe = iframeElement;

  // Attach message listener
  if (!isListenerAttached) {
    window.addEventListener('message', handleIncomingMessage);
    isListenerAttached = true;
  }
};

/**
 * Handle messages from Ren'Py game
 */
const handleIncomingMessage = async (event: MessageEvent<any>) => {
  // Security: only accept messages from same origin (adjust if needed)
  // if (event.origin !== window.location.origin) return;

  const rawMessage = event.data as Partial<RenPyMessage> | null;
  if (!rawMessage || typeof rawMessage !== 'object' || !rawMessage.type) {
    console.warn('Invalid message format from Ren\'Py:', rawMessage);
    return;
  }

  const message: RenPyMessage = {
    type: rawMessage.type as RenPyEventType,
    payload: (rawMessage.payload ?? {}) as Record<string, any>,
  };

  console.log(`📨 RenPy Event: ${message.type}`, message.payload);

  // Update game state
  const sceneId = message.payload.scene_id || message.payload.current_scene_id || message.payload.current_scene;
  if (sceneId) {
    updateGameState({ current_scene: sceneId });
  }
  if (message.payload.checkpoint_passed !== undefined) {
    updateGameState({ checkpoint_passed: message.payload.checkpoint_passed });
  }
  if (message.payload.time_elapsed_seconds !== undefined) {
    updateGameState({ time_elapsed_seconds: message.payload.time_elapsed_seconds });
  }

  updateGameState({ last_event_type: message.type });

  // Call registered handlers
  const handlers = messageHandlers.get(message.type) || [];
  for (const handler of handlers) {
    try {
      await handler(message, gameState);
    } catch (error) {
      console.error(`Error in RenPy event handler for ${message.type}:`, error);
    }
  }
};

/**
 * Send message to Ren'Py game
 */
export const sendRenPyMessage = (type: string, payload: Record<string, any> = {}) => {
  if (!gameIframe?.contentWindow) {
    console.warn('Game iframe not ready to send message');
    return;
  }

  console.log(`📤 Sending to RenPy: ${type}`, payload);

  gameIframe.contentWindow.postMessage(
    { type, payload },
    '*' // Adjust origin if needed for security
  );
};

/**
 * Request checkpoint code from player
 * Ren'Py should send 'request_checkpoint_code' when a checkpoint is reached
 */
export const showCheckpointPrompt = (checkpointNumber: number, promptText: string, hint?: string) => {
  sendRenPyMessage('show_checkpoint_prompt', {
    checkpoint_number: checkpointNumber,
    prompt_text: promptText,
    hint,
  });
};

/**
 * Send quiz question to Ren'Py to display
 */
export const showQuizQuestion = (quizId: string, question: string, options: string[]) => {
  sendRenPyMessage('show_quiz', {
    quiz_id: quizId,
    question,
    options,
  });
};

/**
 * Tell Ren'Py to continue (after code verified or quiz answered)
 */
export const continueGame = (checkpointNumber?: number) => {
  sendRenPyMessage('continue', {
    checkpoint_number: checkpointNumber,
  });
};

/**
 * Pause the game
 */
export const pauseGame = () => {
  sendRenPyMessage('pause', {});
};

/**
 * Resume the game
 */
export const resumeGame = () => {
  sendRenPyMessage('resume', {});
};

/**
 * End the game
 */
export const endGame = () => {
  sendRenPyMessage('end_game', {});
};

// ========== EVENT LISTENERS FOR COMMON SCENARIOS ==========

/**
 * Setup automatic event logging when player requests checkpoint code
 * Usage: setupCheckpointListener((checkpointNumber, promptText) => { ... })
 */
export const setupCheckpointListener = () => {
  onRenPyEvent('request_checkpoint_code', async (message) => {
    const payload = message.payload as CheckpointPromptPayload;
    console.log(
      `🔐 Checkpoint ${payload.checkpoint_number} reached. Current attempt: ${payload.current_attempt}/${payload.max_attempts}`
    );
    // Frontend will show modal for code entry
  });
};

/**
 * Setup automatic logging for quiz events
 */
export const setupQuizListener = () => {
  onRenPyEvent('quiz_submitted', async (message) => {
    const payload = message.payload;
    console.log(`📝 Quiz submitted. Score: ${payload.score}/${payload.total}`);
  });
};

/**
 * Setup automatic logging for scene changes
 */
export const setupSceneListener = () => {
  onRenPyEvent('scene_start', async (message) => {
    const payload = message.payload;
    console.log(`🎬 Scene: ${payload.scene_name}`);
  });
};
