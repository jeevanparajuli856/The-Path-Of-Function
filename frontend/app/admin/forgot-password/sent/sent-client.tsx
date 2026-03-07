'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { adminAPI, handleAPIError } from '@/lib/api';

export default function ForgotPasswordSentClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = (searchParams.get('email') ?? '').trim().toLowerCase();
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResend = async () => {
    if (!email) {
      setError('Missing email. Please return to login and request reset again.');
      return;
    }

    setError(null);
    setIsResending(true);
    try {
      const response = await adminAPI.forgotPassword(email);
      toast.success(response.message);
    } catch (err) {
      const message = handleAPIError(err);
      setError(message);
      toast.error(message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F3EA] flex items-center justify-center px-4">
      <Toaster position="top-right" />
      <div className="w-full max-w-lg bg-white border border-[#C9A899] rounded-2xl shadow-md p-8 space-y-5">
        <h1 className="text-3xl font-bold text-[#2E2E2E]">Check Your Email</h1>
        <p className="text-[#2E2E2E]">If this email exists, reset code/link has been sent:</p>
        <p className="font-semibold text-[#6AA6D9] break-all">{email || 'Email not provided'}</p>
        <p className="text-sm text-[#2E2E2E] opacity-80">
          Open the reset email from Supabase and click the link. You will be routed to the change
          password page.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg p-4 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="btn-game flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResending ? 'Resending...' : 'Resend email'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/login')}
            className="flex-1 border border-[#6AA6D9] text-[#6AA6D9] rounded-lg px-4 py-3 hover:bg-[#EEF6FD] transition duration-200"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
