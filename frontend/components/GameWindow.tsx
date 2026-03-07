'use client';

import { useEffect, useRef, useState } from 'react';
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
  renpyUrl = '/renpy-game/index.html',
  onCheckpointRequested,
  onSceneChanged,
  onGameEnded,
}: GameWindowProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const checkRenpyBuild = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const response = await fetch(renpyUrl, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        if (active) {
          setResolvedUrl(renpyUrl);
        }
      } catch {
        if (active) {
          setResolvedUrl(null);
          setIsLoading(false);
          setLoadError(
            `Ren'Py build not found at ${renpyUrl}. Export your web build and copy it to frontend/public/renpy-game/.`
          );
        }
      }
    };

    checkRenpyBuild();
    return () => {
      active = false;
    };
  }, [renpyUrl]);

  useEffect(() => {
    if (!iframeRef.current || !resolvedUrl || loadError) {
      return;
    }

    initializeRenPyIntegration(iframeRef.current);
    setupCheckpointListener();

    const unsubscribeCheckpoint = onRenPyEvent('request_checkpoint_code', async (message) => {
      const payload = message.payload;

      if (onCheckpointRequested) {
        onCheckpointRequested(payload.checkpoint_number, payload.prompt_text);
      }

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

    const unsubscribeScene = onRenPyEvent('scene_start', async (message) => {
      const sceneName =
        message.payload.scene_id || message.payload.current_scene_id || message.payload.scene_name;
      if (onSceneChanged) {
        onSceneChanged(sceneName);
      }
    });

    const unsubscribeEnd = onRenPyEvent('game_ended', async () => {
      if (onGameEnded) {
        onGameEnded();
      }
    });

    return () => {
      unsubscribeCheckpoint();
      unsubscribeScene();
      unsubscribeEnd();
    };
  }, [loadError, onCheckpointRequested, onGameEnded, onSceneChanged, resolvedUrl]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    toast.success('Game loaded!');
  };

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      <Toaster position="top-right" />

      {isLoading && !loadError && (
        <div className="absolute inset-0 bg-[#F7F3EA] flex items-center justify-center z-20">
          <div className="text-center">
            <div className="inline-block animate-spin text-4xl mb-4 text-[#6AA6D9]">...</div>
            <p className="text-xl text-[#2E2E2E]">Loading game...</p>
          </div>
        </div>
      )}

      {loadError && (
        <div className="absolute inset-0 bg-[#F7F3EA] flex items-center justify-center z-20 px-8">
          <div className="max-w-xl text-center">
            <p className="text-lg font-semibold text-[#2E2E2E] mb-3">Unable to load Ren'Py build</p>
            <p className="text-sm text-[#2E2E2E]">{loadError}</p>
          </div>
        </div>
      )}

      {resolvedUrl && (
        <iframe
          ref={iframeRef}
          src={resolvedUrl}
          title="The Path of Function Game"
          className="w-full h-full"
          onLoad={handleIframeLoad}
          allow="fullscreen"
          style={{
            border: 'none',
            display: isLoading ? 'none' : 'block',
          }}
        />
      )}
    </div>
  );
}
