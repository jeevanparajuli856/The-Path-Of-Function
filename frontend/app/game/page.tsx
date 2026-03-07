'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import GameWindow from '@/components/GameWindow';
import ChatBot from '@/components/ChatBot';
import { gameAPI } from '@/lib/api';
import { useGameStore } from '@/lib/store';
import { onRenPyEvent } from '@/lib/renpy';

type ChatGameContext = {
  scene_id?: string;
  topic_id?: string;
  learning_objective?: string;
  help_policy?: { allowed_help_level?: string; spoiler_guard?: string };
  player_state?: Record<string, unknown>;
};

const DEBUG_HUD_FLAG = (process.env.NEXT_PUBLIC_RENPY_DEBUG_HUD ?? '').toLowerCase();
const SHOW_TELEMETRY_DEBUG_HUD = DEBUG_HUD_FLAG === '1' || DEBUG_HUD_FLAG === 'true';
const GAME_ENTRY_TOKEN_KEY = 'game-entry-token';
const CHAT_AVAILABLE_FROM_SCENE = 'hallway';
const SCENE_PROGRESS_ORDER = [
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
  return SCENE_PROGRESS_ORDER.indexOf(sceneId);
}

export default function GamePage() {
  const router = useRouter();
  const session = useGameStore((state) => state.session);
  const currentScene = useGameStore((state) => state.currentScene);
  const [chatContext, setChatContext] = useState<ChatGameContext>({});
  const [isChatBlocked, setIsChatBlocked] = useState(false);
  const [showFinalVerify, setShowFinalVerify] = useState(false);
  const [finalCode, setFinalCode] = useState('');
  const [finalVerifyError, setFinalVerifyError] = useState<string | null>(null);
  const [isSubmittingFinalVerify, setIsSubmittingFinalVerify] = useState(false);
  const [lastTelemetryEvent, setLastTelemetryEvent] = useState<string>('none');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const effectiveSceneId = chatContext.scene_id || currentScene || '';
  const canShowChatIcon = sceneRank(effectiveSceneId) >= sceneRank(CHAT_AVAILABLE_FROM_SCENE);

  useEffect(() => {
    if (!session || !useGameStore.getState().isSessionValid()) {
      toast.error('Session expired. Please enter a code again.');
      router.replace('/code-entry');
      return;
    }

    const entryToken = typeof window !== 'undefined' ? sessionStorage.getItem(GAME_ENTRY_TOKEN_KEY) : null;
    if (!entryToken || entryToken !== session.session_token) {
      toast.error('Please enter your code to start the game.');
      router.replace('/code-entry');
      return;
    }

    gameAPI
      .logEvent(session.session_token, 'session_start', {
        timestamp: new Date().toISOString(),
      })
      .catch((error) => {
        console.error('Failed to log session_start:', error);
      });
  }, [session, router]);

  useEffect(() => {
    const handleRawTelemetry = (event: MessageEvent) => {
      const data = event.data as { type?: string } | null;
      if (!data || typeof data !== 'object' || typeof data.type !== 'string') {
        return;
      }

      // Fallback lock logic directly from raw bridge messages.
      setLastTelemetryEvent(data.type);
      if (
        data.type === 'quiz_started' ||
        data.type === 'request_checkpoint_code' ||
        data.type === 'player_prompt_started'
      ) {
        setIsChatBlocked(true);
      }
      if (
        data.type === 'player_prompt_resolved' ||
        data.type === 'quiz_submitted' ||
        data.type === 'choice_made' ||
        data.type === 'scene_start'
      ) {
        setIsChatBlocked(false);
      }
    };

    window.addEventListener('message', handleRawTelemetry);
    return () => {
      window.removeEventListener('message', handleRawTelemetry);
    };
  }, []);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsHelpOpen(false);
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);

  useEffect(() => {
    if (!session) return;

    const logRenPyEvent = async (eventType: string, eventData?: Record<string, any>) => {
      try {
        await gameAPI.logEvent(session.session_token, eventType, {
          ...(eventData || {}),
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error(`Failed to log ${eventType}:`, error);
      }
    };

    const unsubDialogue = onRenPyEvent('dialogue', async (message) => {
      setLastTelemetryEvent('dialogue');
      await logRenPyEvent('dialogue', message.payload);
    });

    const unsubChoice = onRenPyEvent('choice_made', async (message) => {
      setLastTelemetryEvent('choice_made');
      setIsChatBlocked(false);
      await logRenPyEvent('choice_made', message.payload);
    });

    const unsubSceneStart = onRenPyEvent('scene_start', async (message) => {
      const sceneId =
        message.payload.scene_id || message.payload.current_scene_id || message.payload.scene_name;
      if (sceneId) {
        setChatContext((prev) => ({ ...prev, scene_id: sceneId }));
      }
      setLastTelemetryEvent('scene_start');
      await logRenPyEvent('scene_start', message.payload);
    });

    const unsubLearningContext = onRenPyEvent('learning_context_update', async (message) => {
      setChatContext((prev) => ({
        ...prev,
        scene_id: message.payload.scene_id ?? prev.scene_id,
        topic_id: message.payload.topic_id ?? prev.topic_id,
        learning_objective: message.payload.learning_objective ?? prev.learning_objective,
      }));
      setLastTelemetryEvent('learning_context_update');
      await logRenPyEvent('learning_context_update', message.payload);
    });

    const unsubHelpPolicy = onRenPyEvent('help_policy_update', async (message) => {
      setChatContext((prev) => ({
        ...prev,
        help_policy: {
          allowed_help_level: message.payload.allowed_help_level,
          spoiler_guard: message.payload.spoiler_guard,
        },
      }));
      setLastTelemetryEvent('help_policy_update');
      await logRenPyEvent('help_policy_update', message.payload);
    });

    const unsubPlayerState = onRenPyEvent('player_state_update', async (message) => {
      setLastTelemetryEvent('player_state_update');
      setChatContext((prev) => ({
        ...prev,
        player_state: message.payload,
      }));
      await logRenPyEvent('player_state_update', message.payload);
    });

    const unsubQuizStart = onRenPyEvent('quiz_started', async (message) => {
      setLastTelemetryEvent('quiz_started');
      setIsChatBlocked(true);
      await logRenPyEvent('quiz_started', message.payload);
    });

    const unsubQuizSubmit = onRenPyEvent('quiz_submitted', async (message) => {
      setLastTelemetryEvent('quiz_submitted');
      setIsChatBlocked(false);
      await logRenPyEvent('quiz_submitted', message.payload);
    });

    const unsubPromptStart = onRenPyEvent('player_prompt_started', async (message) => {
      setLastTelemetryEvent('player_prompt_started');
      setIsChatBlocked(true);
      await logRenPyEvent('player_state_update', {
        ...message.payload,
        prompt_state: 'started',
      });
    });

    const unsubPromptResolved = onRenPyEvent('player_prompt_resolved', async (message) => {
      setLastTelemetryEvent('player_prompt_resolved');
      setIsChatBlocked(false);
      await logRenPyEvent('player_state_update', {
        ...message.payload,
        prompt_state: 'resolved',
      });
    });

    const unsubCheckpointReached = onRenPyEvent('checkpoint_reached', async (message) => {
      setLastTelemetryEvent('checkpoint_reached');
      await logRenPyEvent('checkpoint_reached', message.payload);
    });

    const unsubCheckpointRequest = onRenPyEvent('request_checkpoint_code', async (message) => {
      setLastTelemetryEvent('request_checkpoint_code');
      setIsChatBlocked(true);
      await logRenPyEvent('request_checkpoint_code', {
        ...message.payload,
        bypassed: true,
      });
    });

    const unsubError = onRenPyEvent('error', async (message) => {
      setLastTelemetryEvent('error');
      await logRenPyEvent('game_error', message.payload);
    });

    return () => {
      unsubDialogue();
      unsubChoice();
      unsubSceneStart();
      unsubLearningContext();
      unsubHelpPolicy();
      unsubPlayerState();
      unsubQuizStart();
      unsubQuizSubmit();
      unsubPromptStart();
      unsubPromptResolved();
      unsubCheckpointReached();
      unsubCheckpointRequest();
      unsubError();
    };
  }, [session]);

  const handleSceneChanged = (sceneName: string) => {
    useGameStore.getState().updateScene(sceneName);
    setChatContext((prev) => ({ ...prev, scene_id: sceneName }));
  };

  const handleGameEnded = async () => {
    if (!session) return;

    try {
      await gameAPI.logEvent(session.session_token, 'game_ended', {
        timestamp: new Date().toISOString(),
      });
      setShowFinalVerify(true);
      setFinalVerifyError(null);
      setFinalCode('');
    } catch (error) {
      toast.error('Failed to start final verification. Please try again.');
      console.error('Failed to start final verification:', error);
    }
  };

  const handleFinalVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    if (!finalCode.trim()) {
      setFinalVerifyError('Please enter your original session code.');
      return;
    }

    setFinalVerifyError(null);
    setIsSubmittingFinalVerify(true);
    try {
      const verifyResult = await gameAPI.finalVerifyCode(session.session_token, finalCode.trim());
      if (!verifyResult.verified) {
        setFinalVerifyError('Code does not match this session. Please try again.');
        return;
      }

      await gameAPI.endSession(session.session_token, 'completed');
      toast.success('Game completed. Thank you for playing.');
      setShowFinalVerify(false);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(GAME_ENTRY_TOKEN_KEY);
      }
      useGameStore.getState().reset();
      router.push('/');
    } catch (error) {
      setFinalVerifyError('Unable to verify code right now. Please try again.');
      console.error('Final verification failed:', error);
    } finally {
      setIsSubmittingFinalVerify(false);
    }
  };

  const handleExit = async () => {
    if (!session) {
      router.push('/');
      return;
    }

    try {
      await gameAPI.endSession(session.session_token, 'abandoned');
    } catch (error) {
      console.error('Failed to mark session as abandoned:', error);
    } finally {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(GAME_ENTRY_TOKEN_KEY);
      }
      useGameStore.getState().reset();
      router.replace('/code-entry');
    }
  };

  if (!session || !useGameStore.getState().isSessionValid()) {
    return (
      <div className="min-h-screen bg-[#F7F3EA] flex items-center justify-center">
        <p className="text-[#2E2E2E]">Checking session...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#F7F3EA] overflow-hidden">
      <Toaster position="top-right" />

      {/* Game Header */}
      <header className="bg-[#C9A899] border-b border-[#6AA6D9] px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-bold text-[#2E2E2E]">The Path of Function</span>
        </div>

        <button
          onClick={handleExit}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200 shadow-md"
        >
          Exit Game
        </button>
      </header>

      {/* Game Container */}
      <div className="flex-1 overflow-hidden relative">
        <GameWindow
          renpyUrl="/renpy-game/index.html"
          onSceneChanged={handleSceneChanged}
          onGameEnded={handleGameEnded}
        />
      </div>

      {/* Emma ChatBot */}
      {canShowChatIcon && (
        <ChatBot
          sessionToken={session.session_token}
          currentScene={currentScene || ''}
          gameContext={chatContext}
          isBlocked={isChatBlocked}
        />
      )}

      {isHelpOpen && (
        <>
          <button
            type="button"
            aria-label="Close quick help"
            onClick={() => setIsHelpOpen(false)}
            className="fixed inset-0 z-[108] bg-black/35"
          />
          <div
            className="fixed bottom-28 left-6 z-[111] w-[24rem] max-w-[calc(100vw-3rem)] rounded-3xl overflow-hidden shadow-2xl"
            style={{
              backgroundColor: 'rgba(249, 246, 240, 0.98)',
              border: '3px solid #C9A899',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div className="bg-gradient-to-r from-[#C9A899] to-[#D4B5A5] px-4 py-3 flex items-center justify-between border-b-2 border-[#B8978A]">
              <span className="text-[#2E2E2E] font-bold text-lg">Quick Help</span>
              <button
                onClick={() => setIsHelpOpen(false)}
                className="text-[#2E2E2E] hover:text-red-600 font-bold text-2xl leading-none w-8 h-8 flex items-center justify-center hover:bg-white/30 rounded-full transition"
                aria-label="Close help"
              >
                ×
              </button>
            </div>
            <div
              className="p-4 text-[#2E2E2E] text-sm leading-relaxed space-y-3"
              style={{
                backgroundColor: 'rgba(247, 243, 234, 0.95)',
                backgroundImage:
                  'radial-gradient(circle at 20% 50%, rgba(201, 168, 153, 0.05) 0%, transparent 50%)',
              }}
            >
              <p>
                <span className="font-semibold">Prefs</span> lets you adjust text speed, auto speed,
                audio, and display settings.
              </p>
              <p>
                At the end of the game, submit your <span className="font-semibold">original access code</span> to finish your session.
              </p>
              <p>
                <span className="font-semibold">Ask Emma</span> helps with concepts. During active
                questions, chat may hide and returns after you answer.
              </p>
            </div>
          </div>
        </>
      )}

      <button
        onClick={() => setIsHelpOpen((prev) => !prev)}
        className="fixed bottom-6 left-6 z-[110] w-16 h-16 rounded-full bg-[#F7F3EA] border-[3px] border-[#C9A899] text-[#2E2E2E] text-4xl leading-none font-bold shadow-xl hover:scale-105 transition"
        aria-label="Open quick help"
      >
        ?
      </button>

      {SHOW_TELEMETRY_DEBUG_HUD && (
        <div className="fixed left-3 top-14 z-[140] bg-black/75 text-white text-xs rounded-md px-3 py-2 space-y-1 pointer-events-none">
          <div>telemetry: {lastTelemetryEvent}</div>
          <div>chat_blocked: {isChatBlocked ? 'yes' : 'no'}</div>
          <div>scene: {chatContext.scene_id || currentScene || 'unknown'}</div>
        </div>
      )}

      {showFinalVerify && (
        <div className="fixed inset-0 bg-black/50 z-[120] flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-[#F7F3EA] border border-[#C9A899] rounded-2xl shadow-2xl p-6">
            <h2 className="text-2xl font-bold text-[#2E2E2E] mb-2">Final Verification</h2>
            <p className="text-sm text-[#2E2E2E] opacity-80 mb-4">
              Enter your original access code to confirm you completed the game.
            </p>

            <form onSubmit={handleFinalVerificationSubmit} className="space-y-4">
              <input
                type="text"
                value={finalCode}
                onChange={(e) => setFinalCode(e.target.value.toUpperCase())}
                placeholder="Enter your code"
                className="input-game font-mono tracking-widest"
                disabled={isSubmittingFinalVerify}
              />

              {finalVerifyError && (
                <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg p-3 text-sm">
                  {finalVerifyError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmittingFinalVerify}
                className="btn-game w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingFinalVerify ? 'Verifying...' : 'Verify and Finish'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
