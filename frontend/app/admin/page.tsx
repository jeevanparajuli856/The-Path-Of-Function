'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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

const POLL_INTERVAL_MS = 30000;

export default function AdminDashboard() {
  const router = useRouter();
  const { adminEmail, isAdminAuthenticated } = useAdminStore();

  const [batches, setBatches] = useState<CodeBatch[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generatingBatch, setGeneratingBatch] = useState(false);
  const [busyBatchId, setBusyBatchId] = useState<string | null>(null);
  const [pendingDeleteBatch, setPendingDeleteBatch] = useState<CodeBatch | null>(null);

  const [formData, setFormData] = useState({
    batch_name: '',
    num_codes: '10',
    treatment_group: 'control' as 'control' | 'treatment_a' | 'treatment_b',
  });

  const loadDashboardData = useCallback(
    async (options?: { silent?: boolean; background?: boolean }) => {
      const silent = options?.silent ?? true;
      const background = options?.background ?? false;

      if (background) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const [batchesData, summaryData] = await Promise.all([
          adminAPI.getBatches(),
          adminAPI.getDashboardSummary(),
        ]);
        setBatches(batchesData);
        setSummary(summaryData);

        if (!silent) {
          toast.success('Dashboard refreshed');
        }
      } catch (error) {
        const errorMsg = handleAPIError(error);
        toast.error(`Failed to load data: ${errorMsg}`);
      } finally {
        if (background) {
          setIsRefreshing(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      toast.error('Please log in first');
      router.push('/admin/login');
      return;
    }

    void loadDashboardData({ silent: true, background: false });

    const timer = window.setInterval(() => {
      void loadDashboardData({ silent: true, background: true });
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [isAdminAuthenticated, loadDashboardData, router]);

  const handleGenerateCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneratingBatch(true);
    try {
      const result = await adminAPI.generateCodes({
        batch_name: formData.batch_name,
        num_codes: Number.parseInt(formData.num_codes, 10),
        treatment_group: formData.treatment_group,
      });
      toast.success(`Generated ${result.codes_generated} codes`);
      setFormData({ batch_name: '', num_codes: '10', treatment_group: 'control' });
      setShowGenerateModal(false);
      await loadDashboardData({ silent: true, background: true });
    } catch (error) {
      const errorMsg = handleAPIError(error);
      toast.error(`Failed to generate codes: ${errorMsg}`);
    } finally {
      setGeneratingBatch(false);
    }
  };

  const handleDownloadBatch = async (batch: CodeBatch) => {
    setBusyBatchId(batch.id);
    try {
      const blob = await adminAPI.exportCodes(batch.id);
      const safeName = (batch.batch_name || batch.id).replace(/[^a-zA-Z0-9-_]+/g, '_');
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `batch-${safeName}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Batch CSV downloaded');
    } catch (error) {
      const errorMsg = handleAPIError(error);
      toast.error(`Failed to download: ${errorMsg}`);
    } finally {
      setBusyBatchId(null);
    }
  };

  const handleDeleteBatch = async (batch: CodeBatch) => {
    setBusyBatchId(batch.id);
    try {
      await adminAPI.deleteBatch(batch.id);
      toast.success('Batch deleted');
      await loadDashboardData({ silent: true, background: true });
    } catch (error) {
      const errorMsg = handleAPIError(error);
      toast.error(`Failed to delete batch: ${errorMsg}`);
    } finally {
      setBusyBatchId(null);
    }
  };

  const handleLogout = () => {
    adminAPI.logout();
    useAdminStore.getState().clearAdminToken();
    toast.success('Logged out');
    router.push('/');
  };

  const totalCodes = summary?.total_codes ?? 0;
  const usedCodes = summary?.used_codes ?? 0;
  const unusedCodes = Math.max(0, totalCodes - usedCodes);
  const usageRate = totalCodes > 0 ? Math.round((usedCodes / totalCodes) * 100) : 0;

  const treatmentTotals = useMemo(() => {
    return batches.reduce(
      (acc, batch) => {
        if (batch.treatment_group === 'treatment_a') {
          acc.treatmentA += batch.total_codes;
        } else if (batch.treatment_group === 'treatment_b') {
          acc.treatmentB += batch.total_codes;
        } else {
          acc.control += batch.total_codes;
        }
        return acc;
      },
      { control: 0, treatmentA: 0, treatmentB: 0 }
    );
  }, [batches]);

  const treatmentTotalCodes =
    treatmentTotals.control + treatmentTotals.treatmentA + treatmentTotals.treatmentB;

  const controlPct =
    treatmentTotalCodes > 0 ? Math.round((treatmentTotals.control / treatmentTotalCodes) * 100) : 0;
  const treatmentAPct =
    treatmentTotalCodes > 0
      ? Math.round((treatmentTotals.treatmentA / treatmentTotalCodes) * 100)
      : 0;
  const treatmentBPct =
    treatmentTotalCodes > 0
      ? Math.round((treatmentTotals.treatmentB / treatmentTotalCodes) * 100)
      : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F3EA] flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-[#2E2E2E]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F3EA]">
      <Toaster position="top-right" />

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-[#C9A899] rounded-xl p-6 shadow-sm">
            <div className="text-sm text-[#2E2E2E] opacity-70 mb-2">Total Codes</div>
            <div className="text-4xl font-bold text-[#6AA6D9]">{totalCodes}</div>
            <div className="text-xs text-[#2E2E2E] opacity-50 mt-2">Used: {usedCodes}</div>
          </div>

          <div className="bg-white border border-[#C9A899] rounded-xl p-6 shadow-sm">
            <div className="text-sm text-[#2E2E2E] opacity-70 mb-2">Unused Codes</div>
            <div className="text-4xl font-bold text-[#4A8CC4]">{unusedCodes}</div>
            <div className="text-xs text-[#2E2E2E] opacity-50 mt-2">Usage rate: {usageRate}%</div>
          </div>

          <div className="bg-white border border-[#C9A899] rounded-xl p-6 shadow-sm">
            <div className="text-sm text-[#2E2E2E] opacity-70 mb-2">Active Sessions</div>
            <div className="text-4xl font-bold text-[#4A8CC4]">{summary?.active_sessions ?? 0}</div>
            <div className="text-xs text-[#2E2E2E] opacity-50 mt-2">
              Completed: {summary?.completed_sessions ?? 0}
            </div>
          </div>

          <div className="bg-white border border-[#C9A899] rounded-xl p-6 shadow-sm">
            <div className="text-sm text-[#2E2E2E] opacity-70 mb-2">Avg Session Duration</div>
            <div className="text-4xl font-bold text-[#C9A899]">
              {(summary?.avg_session_duration_minutes ?? 0).toFixed(1)} min
            </div>
            <div className="text-xs text-[#2E2E2E] opacity-50 mt-2">Per student</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <div className="bg-white border border-[#C9A899] rounded-xl p-5 shadow-sm">
            <div className="text-sm text-[#2E2E2E] opacity-70 mb-3">Codes Used Progress</div>
            <div className="w-full h-3 rounded-full bg-[#E8E4DB] overflow-hidden">
              <div className="h-3 bg-[#6AA6D9]" style={{ width: `${usageRate}%` }} />
            </div>
            <div className="text-xs text-[#2E2E2E] opacity-60 mt-2">
              {usedCodes} of {totalCodes} codes used ({usageRate}%)
            </div>
          </div>

          <div className="bg-white border border-[#C9A899] rounded-xl p-5 shadow-sm">
            <div className="text-sm text-[#2E2E2E] opacity-70 mb-3">Treatment Mix (by codes)</div>
            <div className="w-full h-3 rounded-full bg-[#E8E4DB] overflow-hidden flex">
              <div className="h-3 bg-blue-400" style={{ width: `${controlPct}%` }} />
              <div className="h-3 bg-purple-400" style={{ width: `${treatmentAPct}%` }} />
              <div className="h-3 bg-pink-400" style={{ width: `${treatmentBPct}%` }} />
            </div>
            <div className="text-xs text-[#2E2E2E] opacity-60 mt-2">
              Control {controlPct}% | Treatment A {treatmentAPct}% | Treatment B {treatmentBPct}%
            </div>
          </div>
        </div>

        <div className="flex gap-4 mb-8 items-center">
          <button onClick={() => setShowGenerateModal(true)} className="btn-game flex items-center gap-2">
            <span>+</span> Generate New Batch
          </button>
          <button
            onClick={() => void loadDashboardData({ silent: false, background: true })}
            className="bg-[#F0EBE0] border border-[#C9A899] text-[#2E2E2E] hover:bg-[#C9A899] font-bold py-3 px-6 rounded-xl transition duration-200"
          >
            Refresh
          </button>
          <span className="text-xs text-[#2E2E2E] opacity-60">
            {isRefreshing ? 'Refreshing...' : `Auto-refresh: ${POLL_INTERVAL_MS / 1000}s`}
          </span>
        </div>

        <div className="bg-white border border-[#C9A899] rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-[#C9A899] bg-[#F0EBE0]">
            <h2 className="text-2xl font-bold text-[#2E2E2E]">Code Batches</h2>
          </div>

          {batches.length === 0 ? (
            <div className="px-6 py-12 text-center text-[#2E2E2E] opacity-60">
              <p>No code batches yet. Create your first batch to get started.</p>
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
                        <span
                          className={`px-3 py-1 rounded text-sm font-medium ${
                            batch.treatment_group === 'control'
                              ? 'bg-blue-100 text-blue-700'
                              : batch.treatment_group === 'treatment_a'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-pink-100 text-pink-700'
                          }`}
                        >
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
                        <div className="flex gap-4 text-sm">
                          <button
                            onClick={() => void handleDownloadBatch(batch)}
                            disabled={busyBatchId === batch.id}
                            className="text-[#6AA6D9] hover:text-[#4A8CC4] font-medium disabled:opacity-50"
                          >
                            Download
                          </button>
                          <button
                            onClick={() => setPendingDeleteBatch(batch)}
                            disabled={busyBatchId === batch.id}
                            className="text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(batch.id);
                              toast.success('Batch ID copied');
                            }}
                            className="text-[#6AA6D9] hover:text-[#4A8CC4] font-medium"
                          >
                            View Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

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
                  placeholder="e.g., CSCI 2000"
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

      {pendingDeleteBatch && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white border border-[#C9A899] rounded-2xl p-8 shadow-xl max-w-md w-full">
            <h3 className="text-2xl font-bold text-[#2E2E2E] mb-3">Delete Batch</h3>
            <p className="text-sm text-[#2E2E2E] opacity-80 mb-6">
              Delete batch <span className="font-semibold">"{pendingDeleteBatch.batch_name}"</span> and all related codes?
              This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setPendingDeleteBatch(null)}
                disabled={busyBatchId === pendingDeleteBatch.id}
                className="flex-1 bg-[#F0EBE0] text-[#2E2E2E] border border-[#C9A899] font-bold py-2 px-4 rounded transition duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const batch = pendingDeleteBatch;
                  if (!batch) return;
                  await handleDeleteBatch(batch);
                  setPendingDeleteBatch(null);
                }}
                disabled={busyBatchId === pendingDeleteBatch.id}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-200 disabled:opacity-50"
              >
                {busyBatchId === pendingDeleteBatch.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
