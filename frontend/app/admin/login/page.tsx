'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminAPI, handleAPIError } from '@/lib/api';
import { useAdminStore } from '@/lib/store';
import toast, { Toaster } from 'react-hot-toast';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const setAdminToken = useAdminStore((state) => state.setAdminToken);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await adminAPI.login(email, password);
      setAdminToken(response.access_token, email);
      toast.success('Login successful!');
      router.push('/admin');
    } catch (err) {
      const baseError = handleAPIError(err);
      const errorMsg = baseError || 'Wrong password.';
      setError(errorMsg);
      toast.error(errorMsg);
      // Keep warning visible long enough for the user to read.
      setTimeout(() => setError(null), 8000);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F3EA] flex items-center justify-center px-4">
      <Toaster position="top-right" />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-[#2E2E2E]">Admin Portal</h1>
          <p className="text-[#6AA6D9]">Research Team Access Only</p>
        </div>

        <div className="bg-white border border-[#C9A899] rounded-2xl shadow-md p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#2E2E2E] mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                className="input-game"
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#2E2E2E] mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="input-game"
                disabled={isLoading}
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
              disabled={isLoading}
              className="btn-game w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push('/admin/forgot-password')}
                disabled={isLoading}
                className="text-sm text-[#6AA6D9] hover:text-[#4A8CC4] transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Forgot password?
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => (location.href = '/')}
            className="text-[#6AA6D9] hover:text-[#4A8CC4] transition duration-200 text-sm underline"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
