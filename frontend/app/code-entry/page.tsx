'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { studentAPI, handleAPIError } from '@/lib/api';
import { useGameStore } from '@/lib/store';
import toast, { Toaster } from 'react-hot-toast';

const GAME_ENTRY_TOKEN_KEY = 'game-entry-token';

export default function CodeEntryPage() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationState, setValidationState] = useState<{
    valid: boolean;
    can_start: boolean;
    can_resume: boolean;
    message: string;
  } | null>(null);
  const router = useRouter();
  const setSession = useGameStore((state) => state.setSession);

  const handleValidateCodeOnly = async () => {
    if (code.length === 0) return;
    setError(null);

    try {
      const validation = await studentAPI.validateCode(code);
      setValidationState(validation);

      if (!validation.valid) {
        setError(validation.message || 'Invalid code');
      } else {
        setError(null);
      }
    } catch (err) {
      const errorMsg = handleAPIError(err);
      setError(errorMsg);
      setValidationState(null);
    }
  };

  const handleValidateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const validation = await studentAPI.validateCode(code);

      if (!validation.valid) {
        toast.error(validation.message || 'Invalid code');
        setError(validation.message || 'The code you entered is not valid');
        setIsLoading(false);
        return;
      }

      let sessionResponse;
      try {
        if (validation.can_resume) {
          sessionResponse = await studentAPI.resumeSession(code);
          toast.success('Session resumed!');
        } else if (validation.can_start) {
          sessionResponse = await studentAPI.startSession(code);
          toast.success('Welcome! Starting your game...');
        } else {
          setError('Unable to start or resume session');
          setIsLoading(false);
          return;
        }
      } catch (sessionError) {
        const errorMsg = handleAPIError(sessionError);
        if (errorMsg.includes('is_active')) {
          setError('This code is no longer active');
        } else if (errorMsg.includes('expires_at')) {
          setError('This code has expired');
        } else {
          setError(errorMsg || 'Failed to start session');
        }
        toast.error('Failed to start session');
        setIsLoading(false);
        return;
      }

      setSession({
        session_id: sessionResponse.session_id,
        session_token: sessionResponse.session_token,
        treatment_group: sessionResponse.treatment_group,
        started_at: Date.now(),
        expires_at: Date.now() + sessionResponse.expires_in * 1000,
      });

      if (typeof window !== 'undefined') {
        sessionStorage.setItem(GAME_ENTRY_TOKEN_KEY, sessionResponse.session_token);
      }

      router.push('/game');
    } catch (err) {
      const errorMsg = handleAPIError(err);
      setError(errorMsg);
      toast.error(errorMsg);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F3EA] flex items-center justify-center px-4">
      <Toaster position="top-right" />
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-[#2E2E2E]">Enter Your Code</h1>
          <p className="text-[#2E2E2E] opacity-70">
            You should have received a unique access code to play this game
          </p>
        </div>

        {/* Code Entry Form */}
        <div className="card-game">
          {/* Validation Status */}
          {validationState && (
            <div className={`rounded-lg p-4 border mb-4 ${
              validationState.valid
                ? 'bg-green-50 border-green-300 text-green-700'
                : 'bg-red-50 border-red-300 text-red-700'
            }`}>
              <p className="text-sm font-semibold mb-2">
                {validationState.valid ? '✓ Code Valid' : '✗ Code Invalid'}
              </p>
              <p className="text-xs">{validationState.message}</p>
              {validationState.valid && (
                <div className="mt-2 text-xs space-y-1">
                  {validationState.can_resume && <p>You can resume your previous session</p>}
                  {validationState.can_start && <p>You can start a new game</p>}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleValidateCode} className="space-y-6">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-[#2E2E2E] mb-2">
                Access Code
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onBlur={handleValidateCodeOnly}
                placeholder="e.g. ABC123"
                className="input-game font-mono text-lg tracking-widest"
                disabled={isLoading}
                autoComplete="off"
                maxLength={10}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg p-4 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || code.length === 0}
              className="btn-game w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <span className="inline-block animate-spin mr-2">⟳</span>
                  Validating...
                </>
              ) : (
                'Enter Game'
              )}
            </button>

            <p className="text-center text-[#2E2E2E] opacity-60 text-sm">
              Your code gives you access to your personalized learning experience.
            </p>
          </form>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-[#6AA6D9] hover:text-[#4A8CC4] transition duration-200 text-sm underline"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
