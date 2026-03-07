'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { supabaseBrowser } from '@/lib/supabase-browser';

function getRecoveryHashTokens(): { accessToken: string | null; refreshToken: string | null; type: string | null } {
  if (typeof window === 'undefined') {
    return { accessToken: null, refreshToken: null, type: null };
  }

  const hash = window.location.hash?.replace(/^#/, '') ?? '';
  const params = new URLSearchParams(hash);
  return {
    accessToken: params.get('access_token'),
    refreshToken: params.get('refresh_token'),
    type: params.get('type'),
  };
}

export default function AdminResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreparing, setIsPreparing] = useState(true);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const prepareRecovery = async () => {
      try {
        const { accessToken, refreshToken, type } = getRecoveryHashTokens();

        if (type === 'recovery' && accessToken && refreshToken) {
          const { error: setSessionError } = await supabaseBrowser.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (setSessionError) {
            throw setSessionError;
          }
          if (mounted) {
            setRecoveryReady(true);
            setError(null);
          }
          return;
        }

        const code = searchParams.get('code');
        if (code) {
          const { error: exchangeError } = await supabaseBrowser.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            throw exchangeError;
          }
          if (mounted) {
            setRecoveryReady(true);
            setError(null);
          }
          return;
        }

        const { data, error: sessionError } = await supabaseBrowser.auth.getSession();
        if (sessionError) {
          throw sessionError;
        }

        if (mounted) {
          const hasSession = Boolean(data.session);
          setRecoveryReady(hasSession);
          if (!hasSession) {
            setError('Invalid or expired reset link. Please request a new password reset email.');
          }
        }
      } catch (err) {
        if (mounted) {
          const message = err instanceof Error ? err.message : 'Unable to validate reset link.';
          setRecoveryReady(false);
          setError(message);
        }
      } finally {
        if (mounted) {
          setIsPreparing(false);
        }
      }
    };

    prepareRecovery();
    return () => {
      mounted = false;
    };
  }, [searchParams]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: updateError } = await supabaseBrowser.auth.updateUser({
        password: newPassword,
      });
      if (updateError) {
        throw updateError;
      }

      toast.success('Password updated successfully.');
      router.push('/admin/login');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update password.';
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isPreparing) {
    return (
      <div className="min-h-screen bg-[#F7F3EA] flex items-center justify-center px-4">
        <p className="text-[#2E2E2E]">Preparing password reset...</p>
      </div>
    );
  }

  if (!recoveryReady) {
    return (
      <div className="min-h-screen bg-[#F7F3EA] flex items-center justify-center px-4">
        <Toaster position="top-right" />
        <div className="w-full max-w-md bg-white border border-[#C9A899] rounded-2xl shadow-md p-8 space-y-4">
          <h1 className="text-2xl font-bold text-[#2E2E2E]">Reset Link Invalid</h1>
          <p className="text-sm text-red-700 bg-red-50 border border-red-300 rounded-lg p-3">
            {error ?? 'Invalid or expired reset link.'}
          </p>
          <button
            type="button"
            onClick={() => router.push('/admin/login')}
            className="btn-game w-full"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F3EA] flex items-center justify-center px-4">
      <Toaster position="top-right" />
      <div className="w-full max-w-md bg-white border border-[#C9A899] rounded-2xl shadow-md p-8">
        <h1 className="text-3xl font-bold mb-2 text-[#2E2E2E]">Change Password</h1>
        <p className="text-sm text-[#2E2E2E] opacity-80 mb-6">
          Enter your new admin password below.
        </p>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-[#2E2E2E] mb-2">
              New Password
            </label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="input-game"
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="block text-sm font-medium text-[#2E2E2E] mb-2"
            >
              Confirm Password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="input-game"
              disabled={isSubmitting}
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg p-4 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-game w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Updating password...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
