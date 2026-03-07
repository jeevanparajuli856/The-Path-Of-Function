import axios, { AxiosInstance, AxiosError } from 'axios';

// Get API URL from environment or default to localhost
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        const requestUrl = error.config?.url ?? '';
        const isAuthFlowRequest =
          requestUrl.includes('/admin/login') || requestUrl.includes('/admin/forgot-password');

        // Keep user on auth screens so warning messages are visible.
        if (!isAuthFlowRequest) {
          localStorage.removeItem('access_token');
          window.location.href = '/admin/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// ========== TYPE DEFINITIONS ==========

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export interface GenerateCodesRequest {
  batch_name: string;
  num_codes: number;
  treatment_group: 'control' | 'treatment_a' | 'treatment_b';
}

export interface GenerateCodesResponse {
  batch_id: string;
  codes_generated: number;
  codes: string[];
}

export interface CodeBatch {
  id: string;
  batch_name: string;
  treatment_group: string;
  created_at: string;
  total_codes: number;
  used_codes: number;
  active_codes: number;
}

export interface DashboardSummary {
  total_codes: number;
  used_codes: number;
  active_sessions: number;
  completed_sessions: number;
  avg_session_duration_minutes: number;
  avg_quiz_score: number;
}

export interface RebuildCorpusResponse {
  rebuilt: boolean;
  embedded_rows: number;
  total_rows: number;
  model_id: string;
}

export interface ValidateCodeRequest {
  code: string;
}

export interface ValidateCodeResponse {
  valid: boolean;
  can_start: boolean;
  can_resume: boolean;
  message: string;
}

export interface StartSessionRequest {
  code: string;
}

export interface StartSessionResponse {
  session_id: string;
  session_token: string;
  treatment_group: string;
  game_url: string;
  expires_in: number;
}

export interface GameEventRequest {
  session_token: string;
  event_type: string;
  event_data?: Record<string, any>;
}

export interface BatchEventRequest {
  session_token: string;
  events: Array<{
    event_type: string;
    event_data?: Record<string, any>;
  }>;
}

export interface CheckpointRequest {
  session_token: string;
  checkpoint_number: number;
  code_entered: string;
}

export interface CheckpointResponse {
  verified: boolean;
  attempts_used: number;
  attempts_remaining: number;
  message: string;
}

export interface SessionProgress {
  session_id: string;
  current_scene: string;
  checkpoints_passed: number;
  quizzes_completed: number;
  time_played_minutes: number;
  last_event_at: string;
}

export interface EndSessionRequest {
  session_token: string;
  completion_status: 'completed' | 'abandoned';
  final_score?: number;
}

// ========== ADMIN ENDPOINTS ==========

export const adminAPI = {
  // Admin login
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/admin/login', { email, password });
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
    }
    return response.data;
  },

  // Generate access codes
  generateCodes: async (request: GenerateCodesRequest): Promise<GenerateCodesResponse> => {
    const response = await apiClient.post<GenerateCodesResponse>('/admin/generate-codes', request);
    return response.data;
  },

  // Get code batches
  getBatches: async (): Promise<CodeBatch[]> => {
    const response = await apiClient.get<CodeBatch[]>('/admin/batches');
    return response.data;
  },

  // Delete a batch and all its codes
  deleteBatch: async (batchId: string): Promise<void> => {
    await apiClient.delete(`/admin/batches/${batchId}`);
  },

  // Get dashboard summary
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const response = await apiClient.get<DashboardSummary>('/admin/dashboard/summary');
    return response.data;
  },

  // Export codes as CSV
  exportCodes: async (batchId: string): Promise<Blob> => {
    const response = await apiClient.get(`/admin/export/codes?batch_id=${batchId}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Export analytics as JSON
  exportAnalytics: async (): Promise<any> => {
    const response = await apiClient.get('/admin/export/analytics');
    return response.data;
  },

  // Rebuild vector corpus (delete + embed + upsert)
  rebuildCorpus: async (): Promise<RebuildCorpusResponse> => {
    const response = await apiClient.post<RebuildCorpusResponse>('/admin/corpus/rebuild');
    return response.data;
  },

  // Logout
  logout: (): void => {
    localStorage.removeItem('access_token');
  },

  // Send reset password email (admin only)
  forgotPassword: async (email: string): Promise<ForgotPasswordResponse> => {
    const response = await apiClient.post<ForgotPasswordResponse>('/admin/forgot-password', { email });
    return response.data;
  },
};

// ========== STUDENT ENDPOINTS ==========

export const studentAPI = {
  // Validate access code
  validateCode: async (code: string): Promise<ValidateCodeResponse> => {
    const response = await apiClient.post<ValidateCodeResponse>('/student/validate-code', { code });
    return response.data;
  },

  // Start new session
  startSession: async (code: string): Promise<StartSessionResponse> => {
    const response = await apiClient.post<StartSessionResponse>('/student/start-session', { code });
    return response.data;
  },

  // Resume existing session
  resumeSession: async (code: string): Promise<StartSessionResponse> => {
    const response = await apiClient.post<StartSessionResponse>('/student/resume-session', { code });
    return response.data;
  },
};

// ========== GAME ENDPOINTS ==========

export const gameAPI = {
  // Log single event
  logEvent: async (sessionToken: string, eventType: string, eventData?: Record<string, any>): Promise<void> => {
    await apiClient.post('/game/event', {
      session_token: sessionToken,
      event_type: eventType,
      event_data: eventData,
    });
  },

  // Batch log events (for offline replay)
  logEventsBatch: async (sessionToken: string, events: Array<{ event_type: string; event_data?: Record<string, any> }>): Promise<void> => {
    await apiClient.post('/game/events/batch', {
      session_token: sessionToken,
      events,
    });
  },

  // Verify checkpoint
  verifyCheckpoint: async (sessionToken: string, checkpointNumber: number, codeEntered: string): Promise<CheckpointResponse> => {
    const response = await apiClient.post<CheckpointResponse>('/game/checkpoint', {
      session_token: sessionToken,
      checkpoint_number: checkpointNumber,
      code_entered: codeEntered,
    });
    return response.data;
  },

  // Get session progress
  getProgress: async (sessionToken: string): Promise<SessionProgress> => {
    const response = await apiClient.get<SessionProgress>(`/game/progress?session_token=${sessionToken}`);
    return response.data;
  },

  // End session
  endSession: async (sessionToken: string, completionStatus: 'completed' | 'abandoned', finalScore?: number): Promise<void> => {
    await apiClient.post('/game/session-end', {
      session_token: sessionToken,
      completion_status: completionStatus,
      final_score: finalScore,
    });
  },
};

// ========== UTILITY FUNCTIONS ==========

export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('access_token');
};

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
};

export const setAuthToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', token);
  }
};

export const clearAuthToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
  }
};

// Error handler utility
export const handleAPIError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.response?.data?.detail) {
      return error.response.data.detail;
    }
    return error.message || 'An error occurred';
  }
  return 'Unknown error';
};
