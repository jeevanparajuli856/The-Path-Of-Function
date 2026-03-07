'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminStore } from '@/lib/store';
import { adminAPI, handleAPIError, DashboardAnalytics } from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
} from 'recharts';

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
  const { isAdminAuthenticated } = useAdminStore();

  const [batches, setBatches] = useState<CodeBatch[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showResearchExportModal, setShowResearchExportModal] = useState(false);
  const [showRebuildModal, setShowRebuildModal] = useState(false);
  const [generatingBatch, setGeneratingBatch] = useState(false);
  const [rebuildingCorpus, setRebuildingCorpus] = useState(false);
  const [exportingResearchCsv, setExportingResearchCsv] = useState(false);
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
        const [batchesData, summaryData, analyticsData] = await Promise.all([
          adminAPI.getBatches(),
          adminAPI.getDashboardSummary(),
          adminAPI.getDashboardAnalytics(),
        ]);
        setBatches(batchesData);
        setSummary(summaryData);
        setAnalytics(analyticsData);
        setAnalyticsError(null);

        if (!silent) {
          toast.success('Dashboard refreshed');
        }
      } catch (error) {
        const errorMsg = handleAPIError(error);
        toast.error(`Failed to load data: ${errorMsg}`);
        setAnalyticsError(errorMsg);
        if (!background) {
          setAnalytics(null);
        }
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

  const handleRebuildCorpus = async () => {
    setRebuildingCorpus(true);
    try {
      const result = await adminAPI.rebuildCorpus();
      toast.success(
        `Corpus rebuilt. Embedded ${result.embedded_rows} rows (${result.model_id}).`
      );
    } catch (error) {
      const errorMsg = handleAPIError(error);
      toast.error(`Failed to rebuild corpus: ${errorMsg}`);
    } finally {
      setRebuildingCorpus(false);
    }
  };

  const handleDownloadResearchCsv = async (mode: 'detailed' | 'minimal') => {
    setExportingResearchCsv(true);
    try {
      const blob = await adminAPI.exportResearchCsv(mode);
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `research-export-${mode}-${stamp}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Research export downloaded');
    } catch (error) {
      const errorMsg = handleAPIError(error);
      toast.error(`Failed to export research data: ${errorMsg}`);
    } finally {
      setExportingResearchCsv(false);
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
            <span className="text-[#2E2E2E] font-semibold">Welcome Admin</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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

        {/* ANALYTICS VISUALIZATIONS SECTION */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            <div className="bg-white border border-[#C9A899] rounded-xl p-6 shadow-sm flex items-center justify-center min-h-[300px]">
              <p className="text-[#2E2E2E] opacity-60">Loading analytics...</p>
            </div>
            <div className="bg-white border border-[#C9A899] rounded-xl p-6 shadow-sm flex items-center justify-center min-h-[300px]">
              <p className="text-[#2E2E2E] opacity-60">Loading analytics...</p>
            </div>
          </div>
        ) : analytics ? (
          <>
            {/* Row 1: Live Activity + Quiz Correctness */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
              {/* Live Activity Indicator */}
              <div className="bg-white border border-[#C9A899] rounded-xl p-6 shadow-sm">
                <div className="text-sm text-[#2E2E2E] opacity-70 mb-4 font-semibold">Live Activity</div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-[#F0EBE0] rounded-lg">
                    <span className="text-xs text-[#2E2E2E]">Last 5 min</span>
                    <span className="text-xl font-bold text-[#6AA6D9]">{analytics.activity.last_5_minutes}</span>
                    <span className="text-xs text-[#2E2E2E] opacity-60">events</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#F0EBE0] rounded-lg">
                    <span className="text-xs text-[#2E2E2E]">Last 15 min</span>
                    <span className="text-xl font-bold text-[#4A8CC4]">{analytics.activity.last_15_minutes}</span>
                    <span className="text-xs text-[#2E2E2E] opacity-60">events</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#F0EBE0] rounded-lg">
                    <span className="text-xs text-[#2E2E2E]">Last 60 min</span>
                    <span className="text-xl font-bold text-[#4A8CC4]">{analytics.activity.last_60_minutes}</span>
                    <span className="text-xs text-[#2E2E2E] opacity-60">events</span>
                  </div>
                  <div className="text-xs text-[#2E2E2E] opacity-50 mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                    🟢 System is actively being used
                  </div>
                </div>
              </div>

              {/* Quiz Correctness Pie Chart */}
              <div className="bg-white border border-[#C9A899] rounded-xl p-6 shadow-sm">
                <div className="text-sm text-[#2E2E2E] opacity-70 mb-4 font-semibold">Quiz Correctness</div>
                {analytics.quiz.total_submissions > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Correct', value: analytics.quiz.correct_count },
                            { name: 'Incorrect', value: analytics.quiz.total_submissions - analytics.quiz.correct_count },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(props: any) =>
                            `${props.name}: ${props.value} (${(props.percent * 100).toFixed(1)}%)`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill="#4CAF50" />
                          <Cell fill="#F44336" />
                        </Pie>
                        <Tooltip
                      formatter={(value: any) => `${value} answers`}
                    />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="text-center mt-4 p-3 bg-[#F0EBE0] rounded-lg">
                      <div className="text-2xl font-bold text-[#6AA6D9]">
                        {analytics.quiz.overall_accuracy.toFixed(1)}%
                      </div>
                      <div className="text-xs text-[#2E2E2E] opacity-60">Overall Accuracy</div>
                    </div>
                  </>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-[#2E2E2E] opacity-60">
                    No quiz data yet
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Per-Question Accuracy Bar Chart (Full Width) */}
            {Object.keys(analytics.quiz.per_question).length > 0 && (
              <div className="bg-white border border-[#C9A899] rounded-xl p-6 shadow-sm mb-8">
                <div className="text-sm text-[#2E2E2E] opacity-70 mb-4 font-semibold">Per-Question Accuracy</div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={Object.entries(analytics.quiz.per_question).map(([quizId, stats]) => ({
                      quiz: quizId,
                      accuracy: Number(stats.accuracy.toFixed(1)),
                      total: stats.total,
                      correct: stats.correct,
                    }))}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 200, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DB" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="quiz" type="category" tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: any, name: any) => {
                        if (name === 'accuracy') return [`${(value as number).toFixed(1)}%`, 'Accuracy'];
                        return [value, name];
                      }}
                      labelFormatter={(label: any) => `Question: ${label}`}
                    />
                    <Bar dataKey="accuracy" fill="#6AA6D9" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 flex gap-4 justify-center text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-[#F44336]"></div>
                    <span className="text-[#2E2E2E] opacity-70">&lt;50%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-[#FFC107]"></div>
                    <span className="text-[#2E2E2E] opacity-70">50-80%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-[#4CAF50]"></div>
                    <span className="text-[#2E2E2E] opacity-70">&gt;80%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Row 3: Funnel + Heatmap */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
              {/* Session Completion Funnel */}
              <div className="bg-white border border-[#C9A899] rounded-xl p-6 shadow-sm">
                <div className="text-sm text-[#2E2E2E] opacity-70 mb-4 font-semibold">Session Completion</div>
                <ResponsiveContainer width="100%" height={300}>
                  <FunnelChart margin={{ top: 20, right: 160, bottom: 20, left: 0 }}>
                    <Funnel
                      dataKey="value"
                      data={[
                        { name: 'Sessions Started', value: analytics.funnel.started },
                        { name: 'Reached Lab', value: analytics.funnel.reached_lab },
                        { name: 'Attempted Quiz', value: analytics.funnel.attempted_quiz },
                        { name: 'Completed', value: analytics.funnel.completed },
                      ]}
                    >
                      <Tooltip />
                      <Cell fill="#6AA6D9" />
                      <Cell fill="#4A8CC4" />
                      <Cell fill="#3B79AE" />
                      <Cell fill="#2A5191" />
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
              </div>

              {/* Scene Engagement Heatmap */}
              <div className="bg-white border border-[#C9A899] rounded-xl p-6 shadow-sm">
                <div className="text-sm text-[#2E2E2E] opacity-70 mb-4 font-semibold">Scene Engagement (Avg Time)</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#F0EBE0]">
                        <th className="px-3 py-2 text-left text-xs font-semibold text-[#2E2E2E]">Scene</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-[#2E2E2E]">Control</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-[#2E2E2E]">Treatment A</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-[#2E2E2E]">Treatment B</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E4DB]">
                      {Object.entries(analytics.scene_engagement).map(([scene, times]) => (
                        <tr key={scene} className="hover:bg-[#F0EBE0]">
                          <td className="px-3 py-2 text-[#2E2E2E] font-medium text-xs">{scene}</td>
                          <td
                            className="px-3 py-2 text-center text-xs text-[#2E2E2E]"
                            style={{
                              backgroundColor: `rgba(100, 150, 217, ${Math.min(times.control / 300, 0.8)})`,
                            }}
                          >
                            {Math.round(times.control)}s
                          </td>
                          <td
                            className="px-3 py-2 text-center text-xs text-[#2E2E2E]"
                            style={{
                              backgroundColor: `rgba(74, 140, 196, ${Math.min(times.treatment_a / 300, 0.8)})`,
                            }}
                          >
                            {Math.round(times.treatment_a)}s
                          </td>
                          <td
                            className="px-3 py-2 text-center text-xs text-[#2E2E2E]"
                            style={{
                              backgroundColor: `rgba(59, 121, 174, ${Math.min(times.treatment_b / 300, 0.8)})`,
                            }}
                          >
                            {Math.round(times.treatment_b)}s
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white border border-[#C9A899] rounded-xl p-6 shadow-sm mb-8">
            <div className="text-[#2E2E2E] font-semibold mb-2">Analytics unavailable</div>
            <p className="text-sm text-[#2E2E2E] opacity-70 mb-4">
              {analyticsError ?? 'Unable to fetch analytics right now.'}
            </p>
            <button
              onClick={() => void loadDashboardData({ silent: false, background: false })}
              className="bg-[#6AA6D9] hover:bg-[#4A8CC4] text-white font-bold py-2 px-4 rounded-xl transition duration-200"
            >
              Retry Analytics
            </button>
          </div>
        )}

        <div className="flex gap-4 mb-8 items-center">
          <button onClick={() => setShowGenerateModal(true)} className="flex items-center gap-2 bg-[#6AA6D9] hover:bg-[#4A8CC4] text-white font-bold py-2 px-4 rounded-xl transition duration-200">
            <span>+</span> Generate New Batch
          </button>
          <button
            onClick={() => setShowResearchExportModal(true)}
            disabled={exportingResearchCsv}
            className="bg-[#4A8CC4] hover:bg-[#3B79AE] disabled:opacity-50 text-white font-bold py-2 px-4 rounded-xl transition duration-200"
          >
            {exportingResearchCsv ? 'Preparing Export...' : 'Download Research Excel (CSV)'}
          </button>
          <button
            onClick={() => setShowRebuildModal(true)}
            disabled={rebuildingCorpus}
            className="bg-[#6AA6D9] hover:bg-[#4A8CC4] disabled:opacity-50 text-white font-bold py-2 px-4 rounded-xl transition duration-200"
          >
            {rebuildingCorpus ? 'Rebuilding Corpus...' : 'Rebuild Vector Corpus'}
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

      {showResearchExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white border border-[#C9A899] rounded-2xl p-8 shadow-xl max-w-md w-full">
            <h3 className="text-2xl font-bold text-[#2E2E2E] mb-3">Download Research Export</h3>
            <p className="text-sm text-[#2E2E2E] opacity-80 mb-6">
              Choose export type. Detailed includes all event rows. Minimal gives one row per code with summarized metrics.
            </p>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={async () => {
                  setShowResearchExportModal(false);
                  await handleDownloadResearchCsv('detailed');
                }}
                disabled={exportingResearchCsv}
                className="flex-1 bg-[#4A8CC4] hover:bg-[#3B79AE] text-white font-bold py-2 px-4 rounded transition duration-200 disabled:opacity-50"
              >
                Detailed
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowResearchExportModal(false);
                  await handleDownloadResearchCsv('minimal');
                }}
                disabled={exportingResearchCsv}
                className="flex-1 bg-[#6AA6D9] hover:bg-[#4A8CC4] text-white font-bold py-2 px-4 rounded transition duration-200 disabled:opacity-50"
              >
                Minimal
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowResearchExportModal(false)}
              disabled={exportingResearchCsv}
              className="w-full mt-4 bg-[#F0EBE0] text-[#2E2E2E] border border-[#C9A899] font-bold py-2 px-4 rounded transition duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
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

      {showRebuildModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white border border-[#C9A899] rounded-2xl p-8 shadow-xl max-w-md w-full">
            <h3 className="text-2xl font-bold text-[#2E2E2E] mb-3">Rebuild Vector Corpus</h3>
            <p className="text-sm text-[#2E2E2E] opacity-80 mb-6">
              Are you sure you want to rebuild the vector corpus? This may take a few moments.
            </p>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setShowRebuildModal(false)}
                disabled={rebuildingCorpus}
                className="flex-1 bg-[#F0EBE0] text-[#2E2E2E] border border-[#C9A899] font-bold py-2 px-4 rounded transition duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleRebuildCorpus();
                  setShowRebuildModal(false);
                }}
                disabled={rebuildingCorpus}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-200 disabled:opacity-50"
              >
                {rebuildingCorpus ? 'Rebuilding...' : 'Rebuild'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
