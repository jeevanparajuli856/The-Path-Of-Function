import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ========== TYPE DEFINITIONS ==========

export interface GameEvent {
  event_type: string;
  event_data?: Record<string, any>;
  timestamp: number;
  synced?: boolean;
}

export interface GameSession {
  session_id: string;
  session_token: string;
  treatment_group: string;
  started_at: number;
  expires_at: number;
}

export interface GameState {
  // Session Management
  session: GameSession | null;
  isLoading: boolean;
  error: string | null;

  // Game Progress
  currentScene: string;
  checkpointsPassed: number;
  quizzesCompleted: number;
  timePlayedMinutes: number;
  finalScore?: number;

  // Event Management
  events: GameEvent[];
  eventQueue: GameEvent[]; // For offline buffering

  // Session Actions
  setSession: (session: GameSession) => void;
  clearSession: () => void;
  isSessionValid: () => boolean;

  // Progress Actions
  updateScene: (scene: string) => void;
  recordCheckpoint: (checkpointNumber: number, passed: boolean) => void;
  recordQuiz: (passed: boolean) => void;
  updateTimeElapsed: (minutes: number) => void;
  setFinalScore: (score: number) => void;

  // Event Actions
  addEvent: (event: GameEvent) => void;
  addEventToQueue: (event: GameEvent) => void;
  markEventSynced: (index: number) => void;
  clearEventQueue: () => void;
  getUnSyncedEvents: () => GameEvent[];

  // UI/Error Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Reset
  reset: () => void;
}

// Initial State
const initialState = {
  session: null,
  isLoading: false,
  error: null,
  currentScene: 'start',
  checkpointsPassed: 0,
  quizzesCompleted: 0,
  timePlayedMinutes: 0,
  finalScore: undefined,
  events: [],
  eventQueue: [],
};

// Create store with persistence
export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Session Actions
      setSession: (session: GameSession) => {
        set({ session });
      },

      clearSession: () => {
        set({ session: null });
      },

      isSessionValid: () => {
        const { session } = get();
        if (!session) return false;
        return Date.now() < session.expires_at;
      },

      // Progress Actions
      updateScene: (scene: string) => {
        set({ currentScene: scene });
      },

      recordCheckpoint: (checkpointNumber: number, passed: boolean) => {
        if (passed) {
          set((state) => ({
            checkpointsPassed: state.checkpointsPassed + 1,
          }));
        }
      },

      recordQuiz: (passed: boolean) => {
        set((state) => ({
          quizzesCompleted: state.quizzesCompleted + 1,
        }));
      },

      updateTimeElapsed: (minutes: number) => {
        set({ timePlayedMinutes: minutes });
      },

      setFinalScore: (score: number) => {
        set({ finalScore: score });
      },

      // Event Actions
      addEvent: (event: GameEvent) => {
        set((state) => ({
          events: [...state.events, { ...event, synced: true }],
        }));
      },

      addEventToQueue: (event: GameEvent) => {
        set((state) => ({
          eventQueue: [...state.eventQueue, { ...event, synced: false }],
        }));
      },

      markEventSynced: (index: number) => {
        set((state) => ({
          eventQueue: state.eventQueue.map((event, i) =>
            i === index ? { ...event, synced: true } : event
          ),
        }));
      },

      clearEventQueue: () => {
        set({ eventQueue: [] });
      },

      getUnSyncedEvents: () => {
        return get().eventQueue.filter((e) => !e.synced);
      },

      // UI/Error Actions
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      // Reset
      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'game-store', // localStorage key
      partialize: (state) => ({
        // Persist only these fields
        session: state.session,
        currentScene: state.currentScene,
        checkpointsPassed: state.checkpointsPassed,
        quizzesCompleted: state.quizzesCompleted,
        timePlayedMinutes: state.timePlayedMinutes,
        finalScore: state.finalScore,
        eventQueue: state.eventQueue, // Persist offline events
      }),
    }
  )
);

// ========== ADMIN STORE ==========

export interface AdminState {
  // Authentication
  adminToken: string | null;
  adminEmail: string | null;

  // UI State
  isLoading: boolean;
  error: string | null;

  // Data
  batches: any[];
  dashboardSummary: any | null;

  // Actions
  setAdminToken: (token: string, email: string) => void;
  clearAdminToken: () => void;
  isAdminAuthenticated: () => boolean;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setBatches: (batches: any[]) => void;
  setDashboardSummary: (summary: any) => void;
  reset: () => void;
}

const adminInitialState = {
  adminToken: null,
  adminEmail: null,
  isLoading: false,
  error: null,
  batches: [],
  dashboardSummary: null,
};

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      ...adminInitialState,

      setAdminToken: (token: string, email: string) => {
        set({ adminToken: token, adminEmail: email });
      },

      clearAdminToken: () => {
        set({ adminToken: null, adminEmail: null });
      },

      isAdminAuthenticated: () => {
        return !!get().adminToken;
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      setBatches: (batches: any[]) => {
        set({ batches });
      },

      setDashboardSummary: (summary: any) => {
        set({ dashboardSummary: summary });
      },

      reset: () => {
        set(adminInitialState);
      },
    }),
    {
      name: 'admin-store',
      partialize: (state) => ({
        adminToken: state.adminToken,
        adminEmail: state.adminEmail,
      }),
    }
  )
);
