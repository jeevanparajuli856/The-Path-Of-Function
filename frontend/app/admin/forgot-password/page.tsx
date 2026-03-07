'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { adminAPI, handleAPIError } from '@/lib/api';

export default function AdminForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError('Please enter your email.');
      return;
    }

    setError(null);
    setIsSending(true);
    try {
      const response = await adminAPI.forgotPassword(normalizedEmail);
      toast.success(response.message);
      router.push(`/admin/forgot-password/sent?email=${encodeURIComponent(normalizedEmail)}`);
    } catch (err) {
      const errorMsg = handleAPIError(err);
      setError(errorMsg);
      toast.error(errorMsg);
      setTimeout(() => setError(null), 8000);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F3EA] flex items-center justify-center px-4">
      <Toaster position="top-right" />
      <div className="w-full max-w-md bg-white border border-[#C9A899] rounded-2xl shadow-md p-8">
        <h1 className="text-3xl font-bold mb-2 text-[#2E2E2E]">Forgot Password</h1>
        <p className="text-sm text-[#2E2E2E] opacity-80 mb-6">
          Enter your admin email to receive reset link/code.
        </p>

        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#2E2E2E] mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jeevanparajuli856@gmail.com"
              className="input-game"
              disabled={isSending}
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
            disabled={isSending}
            className="btn-game w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? 'Sending...' : 'Send reset link'}
          </button>

          <button
            type="button"
            onClick={() => router.push('/admin/login')}
            className="w-full text-[#6AA6D9] hover:text-[#4A8CC4] transition duration-200 text-sm underline"
          >
            Back to Login
          </button>
        </form>
      </div>
    </div>
  );
}
