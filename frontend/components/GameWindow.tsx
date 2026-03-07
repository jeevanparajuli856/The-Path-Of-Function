'use client';

import { useEffect, useState, useRef } from 'react';
import {
  initializeRenPyIntegration,
  onRenPyEvent,
  continueGame,
  sendRenPyMessage,
  getGameState,
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
  const [showCheckpointModal, setShowCheckpointModal] = useState(false);
  const [checkpointData, setCheckpointData] = useState<{
    checkpoint_number: number;
    prompt_text: string;
    hint?: string;
    max_attempts: number;
    current_attempt: number;
  } | null>(null);
  const [checkpointCode, setCheckpointCode] = useState('');

  useEffect(() => {
    if (iframeRef.current) {
      // Initialize Ren'Py communication
      initializeRenPyIntegration(iframeRef.current);

      // Setup checkpoint listener
      setupCheckpointListener();

      // Listen for checkpoint requests
      const unsubscribeCheckpoint = onRenPyEvent('request_checkpoint_code', async (message) => {
        const payload = message.payload;
        setCheckpointData(payload);
        setShowCheckpointModal(true);

        if (onCheckpointRequested) {
          onCheckpointRequested(payload.checkpoint_number, payload.prompt_text);
        }
      });

      // Listen for scene changes
      const unsubscribeScene = onRenPyEvent('scene_start', async (message) => {
        const sceneName = message.payload.scene_name;
        if (onSceneChanged) {
          onSceneChanged(sceneName);
        }
      });

      // Listen for game end
      const unsubscribeEnd = onRenPyEvent('game_ended', async (message) => {
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
    }
  }, [onCheckpointRequested, onSceneChanged, onGameEnded]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    toast.success('Game loaded!');
  };

  const handleCheckpointSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!checkpointData) return;

    // Send the code back to Ren'Py
    sendRenPyMessage('checkpoint_code_submitted', {
      checkpoint_number: checkpointData.checkpoint_number,
      code_entered: checkpointCode.toUpperCase(),
    });

    // Modal will be closed by parent component after verification
    setCheckpointCode('');
  };

  const handleCheckpointClose = () => {
    setShowCheckpointModal(false);
    setCheckpointCode('');
    setCheckpointData(null);

    // Tell Ren'Py to cancel
    sendRenPyMessage('checkpoint_cancelled', {});
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

      {/* Checkpoint Code Modal */}
      {showCheckpointModal && checkpointData && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-slate-800 border-2 border-cyan-500 rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-white mb-2">Code Required</h3>
            <p className="text-slate-300 mb-4 text-sm">{checkpointData.prompt_text}</p>

            {checkpointData.hint && (
              <div className="bg-slate-700 bg-opacity-50 border border-slate-600 rounded p-3 mb-4">
                <p className="text-xs text-slate-300">
                  <span className="font-semibold">💡 Hint: </span>
                  {checkpointData.hint}
                </p>
              </div>
            )}

            <form onSubmit={handleCheckpointSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={checkpointCode}
                  onChange={(e) => setCheckpointCode(e.target.value)}
                  placeholder="Enter code here"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 font-mono uppercase text-center tracking-widest"
                  autoFocus
                  maxLength={20}
                />
                <p className="text-xs text-slate-400 mt-2 text-center">
                  Attempt {checkpointData.current_attempt} of {checkpointData.max_attempts}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={checkpointCode.length === 0}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition duration-200"
                >
                  Submit
                </button>
                <button
                  type="button"
                  onClick={handleCheckpointClose}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded transition duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
