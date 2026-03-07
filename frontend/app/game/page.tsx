'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import GameWindow from '@/components/GameWindow';
import { gameAPI } from '@/lib/api';
import { useGameStore } from '@/lib/store';
import { onRenPyEvent } from '@/lib/renpy';

export default function GamePage() {
  const router = useRouter();
  const session = useGameStore((state) => state.session);
  const currentScene = useGameStore((state) => state.currentScene);

  useEffect(() => {
    if (!session || !useGameStore.getState().isSessionValid()) {
      toast.error('Session expired. Please enter a code again.');
      router.push('/code-entry');
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
      await logRenPyEvent('dialogue', message.payload);
    });

    const unsubChoice = onRenPyEvent('choice_made', async (message) => {
      await logRenPyEvent('choice_made', message.payload);
    });

    const unsubQuizStart = onRenPyEvent('quiz_started', async (message) => {
      await logRenPyEvent('quiz_started', message.payload);
    });

    const unsubQuizSubmit = onRenPyEvent('quiz_submitted', async (message) => {
      await logRenPyEvent('quiz_submitted', message.payload);
    });

    const unsubCheckpointReached = onRenPyEvent('checkpoint_reached', async (message) => {
      await logRenPyEvent('checkpoint_reached', message.payload);
    });

    // Keep a record if Ren'Py still emits checkpoint prompts, but do not ask player for a code.
    const unsubCheckpointRequest = onRenPyEvent('request_checkpoint_code', async (message) => {
      await logRenPyEvent('request_checkpoint_code', {
        ...message.payload,
        bypassed: true,
      });
    });

    const unsubError = onRenPyEvent('error', async (message) => {
      await logRenPyEvent('game_error', message.payload);
    });

    return () => {
      unsubDialogue();
      unsubChoice();
      unsubQuizStart();
      unsubQuizSubmit();
      unsubCheckpointReached();
      unsubCheckpointRequest();
      unsubError();
    };
  }, [session]);

  const handleSceneChanged = async (sceneName: string) => {
    useGameStore.getState().updateScene(sceneName);

    if (!session) return;

    try {
      await gameAPI.logEvent(session.session_token, 'scene_enter', {
        scene_name: sceneName,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log scene_enter:', error);
    }
  };

  const handleGameEnded = async () => {
    if (!session) return;

    try {
      await gameAPI.logEvent(session.session_token, 'game_ended', {
        timestamp: new Date().toISOString(),
      });

      await gameAPI.endSession(session.session_token, 'completed');

      toast.success('Game completed. Thank you for playing.');
      useGameStore.getState().reset();
      router.push('/');
    } catch (error) {
      toast.error('Failed to end session. Please try again.');
      console.error('Failed to end session:', error);
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
      useGameStore.getState().reset();
      router.push('/');
    }
  };

  if (!session || !useGameStore.getState().isSessionValid()) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <p className="text-slate-200">Checking session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Game In Progress</h1>
            <p className="text-slate-300 text-sm mt-1">
              Group: <span className="font-mono text-cyan-400">{session.treatment_group}</span>
              {' | '}Scene: <span className="font-mono text-cyan-400">{currentScene}</span>
            </p>
          </div>

          <button
            onClick={handleExit}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition duration-200"
          >
            Exit Game
          </button>
        </div>

        <div className="h-[70vh] md:h-[78vh] bg-slate-800 border border-slate-700 rounded-lg p-2 md:p-4">
          <GameWindow
            renpyUrl="/game/index.html"
            onSceneChanged={handleSceneChanged}
            onGameEnded={handleGameEnded}
          />
        </div>
      </div>
    </div>
  );
}
