'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/store';
import { gameAPI } from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';

export default function GamePage() {
  const router = useRouter();
  const session = useGameStore((state) => state.session);
  const [gameLoaded, setGameLoaded] = useState(false);
  const [checkpointCode, setCheckpointCode] = useState('');
  const [showCheckpointModal, setShowCheckpointModal] = useState(false);

  useEffect(() => {
    // Verify session validity
    if (!session || !useGameStore.getState().isSessionValid()) {
      toast.error('Session expired. Please enter a code again.');
      router.push('/code-entry');
      return;
    }

    setGameLoaded(true);

    // Log session start
    gameAPI.logEvent(session.session_token, 'session_start', {
      timestamp: new Date().toISOString(),
    });
  }, [session, router]);

  const handleCheckpointSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    try {
      const response = await gameAPI.verifyCheckpoint(
        session.session_token,
        1, // checkpoint number (can be extracted from context)
        checkpointCode.toUpperCase()
      );

      if (response.verified) {
        toast.success('Checkpoint verified! ' + response.message);
        useGameStore.getState().recordCheckpoint(1, true);
      } else {
        toast.error(response.message || 'Incorrect code');
      }

      setCheckpointCode('');
      setShowCheckpointModal(false);
    } catch (error) {
      toast.error('Failed to verify checkpoint');
    }
  };

  const handleEndSession = async () => {
    if (!session) return;

    try {
      await gameAPI.endSession(session.session_token, 'completed');
      useGameStore.getState().reset();
      toast.success('Session ended. Thank you for playing!');
      router.push('/');
    } catch (error) {
      toast.error('Failed to end session');
    }
  };

  if (!gameLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin text-4xl mb-4">⟳</div>
          <p className="text-xl text-slate-300">Loading game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <Toaster position="top-right" />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Game In Progress</h1>
          <div className="space-x-4">
            <span className="text-slate-300">
              Group: <span className="font-mono font-bold text-cyan-400">{session?.treatment_group}</span>
            </span>
            <button
              onClick={handleEndSession}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-200"
            >
              End Session
            </button>
          </div>
        </div>

        {/* Game Container */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Welcome to the Game</h2>

          {/* Placeholder for Ren'Py iframe */}
          <div className="bg-black rounded-lg aspect-video mb-6 flex items-center justify-center border-2 border-slate-600">
            <div className="text-center">
              <p className="text-slate-300 mb-4">Game Coming Soon</p>
              <p className="text-sm text-slate-400">Ren'Py game will be embedded here</p>
            </div>
          </div>

          {/* Game Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setShowCheckpointModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
            >
              Submit Checkpoint Code
            </button>
            <button
              onClick={() => gameAPI.logEvent(session!.session_token, 'help_requested')}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
            >
              Request Help
            </button>
            <button
              onClick={() => gameAPI.logEvent(session!.session_token, 'timer_update', { elapsed_minutes: 5 })}
              className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
            >
              Update Progress
            </button>
          </div>
        </div>
      </div>

      {/* Checkpoint Modal */}
      {showCheckpointModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-white mb-4">Verify Checkpoint</h3>
            <form onSubmit={handleCheckpointSubmit} className="space-y-4">
              <div>
                <label htmlFor="checkpoint" className="block text-sm font-medium text-slate-200 mb-2">
                  Enter the code from the game:
                </label>
                <input
                  id="checkpoint"
                  type="text"
                  value={checkpointCode}
                  onChange={(e) => setCheckpointCode(e.target.value)}
                  placeholder="e.g. FUNC123"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 font-mono uppercase"
                  autoFocus
                  maxLength={20}
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={checkpointCode.length === 0}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white font-bold py-2 px-4 rounded transition duration-200"
                >
                  Verify
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCheckpointModal(false);
                    setCheckpointCode('');
                  }}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded transition duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
