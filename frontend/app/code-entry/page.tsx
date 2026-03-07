'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { studentAPI, handleAPIError } from '@/lib/api';
import { useGameStore } from '@/lib/store';
import toast, { Toaster } from 'react-hot-toast';

export default function CodeEntryPage() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
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
    setIsValidating(true);
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
    } finally {
      setIsValidating(false);
    }
  };

  const handleValidateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validate the code first
      const validation = await studentAPI.validateCode(code);

      if (!validation.valid) {
        toast.error(validation.message || 'Invalid code');
        setError(validation.message || 'The code you entered is not valid');
        setIsLoading(false);
        return;
      }

      // If code is valid, start or resume session
      let sessionResponse;
      try {
        if (validation.can_resume) {
          sessionResponse = await studentAPI.resumeSession(code);
          toast.info('Session resumed!');
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

      // Store session in Zustand
      setSession({
        session_id: sessionResponse.session_id,
        session_token: sessionResponse.session_token,
        treatment_group: sessionResponse.treatment_group,
        started_at: Date.now(),
        expires_at: Date.now() + sessionResponse.expires_in * 1000,
      });

      // Redirect to game
      router.push('/game');
    } catch (err) {
      const errorMsg = handleAPIError(err);
      setError(errorMsg);
      toast.error(errorMsg);
      setIsLoading(false);
    }
  };
             onBlur={handleValidateCodeOnly}

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <Toaster position="top-right" />
      <div className="w-full max-w-md">
        {/* Header */}
                 {/* Validation Status */}
                 {validationState && (
                   <div className={`rounded-lg p-4 border ${
                     validationState.valid
                       ? 'bg-green-900 bg-opacity-30 border-green-700 text-green-200'
                       : 'bg-red-900 bg-opacity-30 border-red-700 text-red-200'
                   }`}>
                     <p className="text-sm font-semibold mb-2">
                       {validationState.valid ? '✓ Code Valid' : '✗ Code Invalid'}
                     </p>
                     <p className="text-xs">{validationState.message}</p>
                     {validationState.valid && (
                       <div className="mt-2 text-xs text-slate-300 space-y-1">
                         {validationState.can_resume && (
                           <p>💾 You can resume your previous session</p>
                         )}
                         {validationState.can_start && (
                           <p>🆕 You can start a new game</p>
                         )}
                       </div>
                     )}
                   </div>
                 )}

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-white">Enter Your Code</h1>
          <p className="text-slate-300">
            You should have received a unique access code to play this game
          </p>
        </div>

        {/* Code Entry Form */}
        <form onSubmit={handleValidateCode} className="space-y-6">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-slate-200 mb-2">
              Access Code
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. ABC123"
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50 font-mono text-lg tracking-widest"
              disabled={isLoading}
              autoComplete="off"
              maxLength={10}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900 bg-opacity-50 border border-red-700 rounded-lg p-4 text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || code.length === 0}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition duration-200"
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

          {/* Help Text */}
          <p className="text-center text-slate-400 text-sm">
            Your code gives you access to your personalized learning experience.
          </p>
        </form>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-slate-400 hover:text-slate-200 transition duration-200 text-sm underline"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
