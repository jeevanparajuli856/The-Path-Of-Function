'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminStore } from '@/lib/store';
import { adminAPI, handleAPIError } from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';

interface CodeBatch {
  id: string;
  batch_name: string;
  treatment_group: string;
  created_at: string;
  total_codes: number;
  used_codes: number;
  active_codes: number;
}

interface DashboardSummary {
  total_codes: number;
  used_codes: number;
  active_sessions: number;
  completed_sessions: number;
  avg_session_duration_minutes: number;
  avg_quiz_score: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { adminToken, adminEmail, isAdminAuthenticated } = useAdminStore();
  const [batches, setBatches] = useState<CodeBatch[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generatingBatch, setGeneratingBatch] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    batch_name: '',
    num_codes: '10',
    treatment_group: 'control' as 'control' | 'treatment_a' | 'treatment_b',
  });

  // Check authentication
  useEffect(() => {
    if (!isAdminAuthenticated()) {
      toast.error('Please log in first');
      router.push('/admin/login');
      return;
    }

    loadDashboardData();
  }, [isAdminAuthenticated, router]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [batchesData, summaryData] = await Promise.all([
        adminAPI.getBatches(),
        adminAPI.getDashboardSummary(),
      ]);

      setBatches(batchesData);
      setSummary(summaryData);
      toast.success('Dashboard data loaded');
    } catch (error) {
      const errorMsg = handleAPIError(error);
      toast.error(`Failed to load data: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneratingBatch(true);

    try {
      const result = await adminAPI.generateCodes({
        batch_name: formData.batch_name,
        num_codes: parseInt(formData.num_codes),
        treatment_group: formData.treatment_group,
      });

      toast.success(`Generated ${result.codes_generated} codes!`);
      setFormData({ batch_name: '', num_codes: '10', treatment_group: 'control' });
      setShowGenerateModal(false);

      // Reload batches
      await loadDashboardData();
    } catch (error) {
      const errorMsg = handleAPIError(error);
      toast.error(`Failed to generate codes: ${errorMsg}`);
    } finally {
      setGeneratingBatch(false);
    }
  };

  const handleLogout = () => {
    adminAPI.logout();
    useAdminStore.getState().clearAdminToken();
    toast.success('Logged out');
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin text-4xl mb-4">⟳</div>
          <p className="text-xl text-slate-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <div className="flex items-center gap-6">
            <span className="text-slate-300">
              Welcome, <span className="font-semibold text-cyan-400">{adminEmail}</span>
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {/* Total Codes */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="text-sm text-slate-400 mb-2">Total Codes Generated</div>
            <div className="text-4xl font-bold text-cyan-400">{summary?.total_codes || 0}</div>
            <div className="text-xs text-slate-500 mt-2">
              Used: {summary?.used_codes || 0} ({summary?.total_codes ? Math.round((summary.used_codes / summary.total_codes) * 100) : 0}%)
            </div>
          </div>

          {/* Active Sessions */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="text-sm text-slate-400 mb-2">Active Sessions</div>
            <div className="text-4xl font-bold text-blue-400">{summary?.active_sessions || 0}</div>
            <div className="text-xs text-slate-500 mt-2">
              Completed: {summary?.completed_sessions || 0}
            </div>
          </div>

          {/* Avg Duration */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="text-sm text-slate-400 mb-2">Avg Session Duration</div>
            <div className="text-4xl font-bold text-green-400">
              {(summary?.avg_session_duration_minutes || 0).toFixed(1)} min
            </div>
            <div className="text-xs text-slate-500 mt-2">Per student</div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setShowGenerateModal(true)}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 flex items-center gap-2"
          >
            <span>➕</span> Generate New Batch
          </button>
          <button
            onClick={loadDashboardData}
            className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Code Batches Table */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white">Code Batches</h2>
          </div>

          {batches.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400">
              <p>No code batches yet. Create your first batch to get started!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-slate-200">Batch Name</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-slate-200">Treatment</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-slate-200">Total Codes</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-slate-200">Used</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-slate-200">Active</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-slate-200">Created</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-slate-200">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {batches.map((batch) => (
                    <tr key={batch.id} className="hover:bg-slate-700 transition duration-200">
                      <td className="px-6 py-4 text-white font-medium">{batch.batch_name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded text-sm font-medium ${
                          batch.treatment_group === 'control'
                            ? 'bg-blue-900 text-blue-200'
                            : batch.treatment_group === 'treatment_a'
                            ? 'bg-purple-900 text-purple-200'
                            : 'bg-pink-900 text-pink-200'
                        }`}>
                          {batch.treatment_group}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-300">{batch.total_codes}</td>
                      <td className="px-6 py-4 text-slate-300">{batch.used_codes}</td>
                      <td className="px-6 py-4 text-slate-300">{batch.active_codes}</td>
                      <td className="px-6 py-4 text-slate-400 text-sm">
                        {new Date(batch.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            // Copy batch ID to clipboard
                            navigator.clipboard.writeText(batch.id);
                            toast.success('Batch ID copied!');
                          }}
                          className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition duration-200"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Generate Codes Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-white mb-6">Generate New Batch</h3>
            <form onSubmit={handleGenerateCodes} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Batch Name</label>
                <input
                  type="text"
                  required
                  value={formData.batch_name}
                  onChange={(e) => setFormData({ ...formData, batch_name: e.target.value })}
                  placeholder="e.g., Spring 2024 - Section A"
                  className="input-field"
                  disabled={generatingBatch}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Number of Codes</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="1000"
                  value={formData.num_codes}
                  onChange={(e) => setFormData({ ...formData, num_codes: e.target.value })}
                  className="input-field"
                  disabled={generatingBatch}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Treatment Group</label>
                <select
                  value={formData.treatment_group}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      treatment_group: e.target.value as 'control' | 'treatment_a' | 'treatment_b',
                    })
                  }
                  className="input-field"
                  disabled={generatingBatch}
                >
                  <option value="control">Control</option>
                  <option value="treatment_a">Treatment A</option>
                  <option value="treatment_b">Treatment B</option>
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={generatingBatch}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white font-bold py-2 px-4 rounded transition duration-200"
                >
                  {generatingBatch ? 'Generating...' : 'Generate'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  disabled={generatingBatch}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-600 text-white font-bold py-2 px-4 rounded transition duration-200"
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
