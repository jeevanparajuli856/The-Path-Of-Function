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
  const { adminEmail, isAdminAuthenticated } = useAdminStore();
  const [batches, setBatches] = useState<CodeBatch[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generatingBatch, setGeneratingBatch] = useState(false);

  const [formData, setFormData] = useState({
    batch_name: '',
    num_codes: '10',
    treatment_group: 'control' as 'control' | 'treatment_a' | 'treatment_b',
  });

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
      <div className="min-h-screen bg-[#F7F3EA] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin text-4xl mb-4 text-[#6AA6D9]">⟳</div>
          <p className="text-xl text-[#2E2E2E]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F3EA]">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-[#C9A899] border-b border-[#6AA6D9] sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-[#2E2E2E]">Admin Dashboard</h1>
          <div className="flex items-center gap-6">
            <span className="text-[#2E2E2E]">
              Welcome, <span className="font-semibold text-[#6AA6D9]">{adminEmail}</span>
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-[#C9A899] rounded-xl p-6 shadow-sm">
            <div className="text-sm text-[#2E2E2E] opacity-70 mb-2">Total Codes Generated</div>
            <div className="text-4xl font-bold text-[#6AA6D9]">{summary?.total_codes || 0}</div>
            <div className="text-xs text-[#2E2E2E] opacity-50 mt-2">
              Used: {summary?.used_codes || 0} ({summary?.total_codes ? Math.round((summary.used_codes / summary.total_codes) * 100) : 0}%)
            </div>
          </div>

          <div className="bg-white border border-[#C9A899] rounded-xl p-6 shadow-sm">
            <div className="text-sm text-[#2E2E2E] opacity-70 mb-2">Active Sessions</div>
            <div className="text-4xl font-bold text-[#4A8CC4]">{summary?.active_sessions || 0}</div>
            <div className="text-xs text-[#2E2E2E] opacity-50 mt-2">
              Completed: {summary?.completed_sessions || 0}
            </div>
          </div>

          <div className="bg-white border border-[#C9A899] rounded-xl p-6 shadow-sm">
            <div className="text-sm text-[#2E2E2E] opacity-70 mb-2">Avg Session Duration</div>
            <div className="text-4xl font-bold text-[#C9A899]">
              {(summary?.avg_session_duration_minutes || 0).toFixed(1)} min
            </div>
            <div className="text-xs text-[#2E2E2E] opacity-50 mt-2">Per student</div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setShowGenerateModal(true)}
            className="btn-game flex items-center gap-2"
          >
            <span>+</span> Generate New Batch
          </button>
          <button
            onClick={loadDashboardData}
            className="bg-[#F0EBE0] border border-[#C9A899] text-[#2E2E2E] hover:bg-[#C9A899] font-bold py-3 px-6 rounded-xl transition duration-200"
          >
            Refresh
          </button>
        </div>

        {/* Code Batches Table */}
        <div className="bg-white border border-[#C9A899] rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-[#C9A899] bg-[#F0EBE0]">
            <h2 className="text-2xl font-bold text-[#2E2E2E]">Code Batches</h2>
          </div>

          {batches.length === 0 ? (
            <div className="px-6 py-12 text-center text-[#2E2E2E] opacity-60">
              <p>No code batches yet. Create your first batch to get started!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#C9A899]">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-[#2E2E2E]">Batch Name</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-[#2E2E2E]">Treatment</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-[#2E2E2E]">Total Codes</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-[#2E2E2E]">Used</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-[#2E2E2E]">Active</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-[#2E2E2E]">Created</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-[#2E2E2E]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E4DB]">
                  {batches.map((batch) => (
                    <tr key={batch.id} className="hover:bg-[#F0EBE0] transition duration-200">
                      <td className="px-6 py-4 text-[#2E2E2E] font-medium">{batch.batch_name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded text-sm font-medium ${
                          batch.treatment_group === 'control'
                            ? 'bg-blue-100 text-blue-700'
                            : batch.treatment_group === 'treatment_a'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-pink-100 text-pink-700'
                        }`}>
                          {batch.treatment_group}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#2E2E2E]">{batch.total_codes}</td>
                      <td className="px-6 py-4 text-[#2E2E2E]">{batch.used_codes}</td>
                      <td className="px-6 py-4 text-[#2E2E2E]">{batch.active_codes}</td>
                      <td className="px-6 py-4 text-[#2E2E2E] opacity-60 text-sm">
                        {new Date(batch.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(batch.id);
                            toast.success('Batch ID copied!');
                          }}
                          className="text-[#6AA6D9] hover:text-[#4A8CC4] text-sm font-medium transition duration-200"
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
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white border border-[#C9A899] rounded-2xl p-8 shadow-xl max-w-md w-full">
            <h3 className="text-2xl font-bold text-[#2E2E2E] mb-6">Generate New Batch</h3>
            <form onSubmit={handleGenerateCodes} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#2E2E2E] mb-2">Batch Name</label>
                <input
                  type="text"
                  required
                  value={formData.batch_name}
                  onChange={(e) => setFormData({ ...formData, batch_name: e.target.value })}
                  placeholder="e.g., Spring 2024 - Section A"
                  className="input-game"
                  disabled={generatingBatch}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2E2E2E] mb-2">Number of Codes</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="1000"
                  value={formData.num_codes}
                  onChange={(e) => setFormData({ ...formData, num_codes: e.target.value })}
                  className="input-game"
                  disabled={generatingBatch}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2E2E2E] mb-2">Treatment Group</label>
                <select
                  value={formData.treatment_group}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      treatment_group: e.target.value as 'control' | 'treatment_a' | 'treatment_b',
                    })
                  }
                  className="input-game"
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
                  className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold py-2 px-4 rounded transition duration-200"
                >
                  {generatingBatch ? 'Generating...' : 'Generate'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  disabled={generatingBatch}
                  className="flex-1 bg-[#F0EBE0] text-[#2E2E2E] border border-[#C9A899] font-bold py-2 px-4 rounded transition duration-200"
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
