'use client';

import { useEffect, useState, useRef } from 'react';
import {
  initializeRenPyIntegration,
  onRenPyEvent,
  sendRenPyMessage,
  setupCheckpointListener,
} from '@/lib/renpy';
import toast, { Toaster } from 'react-hot-toast';

interface GameWindowProps {
  renpyUrl?: string;
  onCheckpointRequested?: (checkpointNumber: number, promptText: string) => void;
  onSceneChanged?: (sceneName: string) => void;
  onGameEnded?: () => void;
}

export default function GameWindow({
  renpyUrl = '/game/index.html',
  onCheckpointRequested,
  onSceneChanged,
  onGameEnded,
}: GameWindowProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!iframeRef.current) {
      return;
    }

    // Initialize Ren'Py communication
    initializeRenPyIntegration(iframeRef.current);

    // Setup checkpoint listener
    setupCheckpointListener();

    // Listen for checkpoint requests
    const unsubscribeCheckpoint = onRenPyEvent('request_checkpoint_code', async (message) => {
      const payload = message.payload;

      if (onCheckpointRequested) {
        onCheckpointRequested(payload.checkpoint_number, payload.prompt_text);
      }

      // Requirement: no mid-game code entry. Auto-acknowledge and continue.
      sendRenPyMessage('checkpoint_verified', {
        checkpoint_number: payload.checkpoint_number,
        verified: true,
        bypassed: true,
      });

      sendRenPyMessage('continue', {
        checkpoint_number: payload.checkpoint_number,
        bypassed: true,
      });
    });

    // Listen for scene changes
    const unsubscribeScene = onRenPyEvent('scene_start', async (message) => {
      const sceneName = message.payload.scene_name;
      if (onSceneChanged) {
        onSceneChanged(sceneName);
      }
    });

    // Listen for game end
    const unsubscribeEnd = onRenPyEvent('game_ended', async () => {
      if (onGameEnded) {
        onGameEnded();
      }
    });

    // Cleanup
    return () => {
      unsubscribeCheckpoint();
      unsubscribeScene();
      unsubscribeEnd();
    };
  }, [onCheckpointRequested, onSceneChanged, onGameEnded]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    toast.success('Game loaded!');
  };

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      <Toaster position="top-right" />

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-900 flex items-center justify-center z-20">
          <div className="text-center">
            <div className="inline-block animate-spin text-4xl mb-4 text-cyan-400">⟳</div>
            <p className="text-xl text-slate-300">Loading game...</p>
          </div>
        </div>
      )}

      {/* Ren'Py Game iframe */}
      <iframe
        ref={iframeRef}
        src={renpyUrl}
        title="The Path of Function Game"
        className="w-full h-full"
        onLoad={handleIframeLoad}
        allow="fullscreen"
        style={{
          border: 'none',
          display: isLoading ? 'none' : 'block',
        }}
      />

      {/* Fallback for when Ren'Py isn't available */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0">
        <div className="text-center">
          <p className="text-slate-400 text-lg">
            Game not loaded. Make sure the Ren'Py web build is available at: {renpyUrl}
          </p>
        </div>
      </div>
    </div>
  );
}
