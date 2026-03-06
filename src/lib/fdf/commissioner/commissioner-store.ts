// ============================================================
// FDF Commissioner — Zustand Store
// ============================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS } from "../constants";
import { generateId } from "../id";
import type {
  CommissionerState,
  CommissionerLeague,
  CommissionerTeam,
  LeaguePhase,
  TemporaryModifier,
  HeadlineRecord,
  CommissionerMode,
  LeagueSettings,
} from "./types";

// ============================================================
// Store Interface
// ============================================================

interface CommissionerStore extends CommissionerState {
  // League CRUD
  createLeague: (data: {
    name: string;
    mode: CommissionerMode;
    settings: LeagueSettings;
  }) => string;
  updateLeague: (id: string, updates: Partial<CommissionerLeague>) => void;
  deleteLeague: (id: string) => void;
  setActiveLeague: (id: string | null) => void;
  getActiveLeague: () => CommissionerLeague | null;
  getLeague: (id: string) => CommissionerLeague | undefined;

  // Team operations
  addTeamToLeague: (leagueId: string, team: CommissionerTeam) => void;
  updateTeamInLeague: (
    leagueId: string,
    teamId: string,
    updates: Partial<CommissionerTeam>
  ) => void;
  removeTeamFromLeague: (leagueId: string, teamId: string) => void;

  // Phase management
  setLeaguePhase: (leagueId: string, phase: LeaguePhase) => void;

  // Temporary modifiers
  addTemporaryModifier: (
    leagueId: string,
    teamId: string,
    modifier: TemporaryModifier
  ) => void;
  removeTemporaryModifier: (
    leagueId: string,
    teamId: string,
    modifierId: string
  ) => void;

  // Week / Season advancement
  advanceWeek: (leagueId: string) => void;
  advanceSeason: (leagueId: string) => void;

  // Headlines
  addHeadline: (leagueId: string, headline: HeadlineRecord) => void;

  // Season linkage
  addSeasonId: (leagueId: string, seasonId: string) => void;

  // Export / Import
  exportLeagueData: (leagueId: string) => string;
  importLeagueData: (json: string) => string | null;
}

// ============================================================
// Helper: immutable league update
// ============================================================

function updateLeagueInState(
  state: CommissionerState,
  leagueId: string,
  updater: (league: CommissionerLeague) => CommissionerLeague
): Partial<CommissionerState> {
  const league = state.leagues[leagueId];
  if (!league) return {};
  return {
    leagues: {
      ...state.leagues,
      [leagueId]: {
        ...updater(league),
        updatedAt: new Date().toISOString(),
      },
    },
  };
}

function updateTeamInState(
  league: CommissionerLeague,
  teamId: string,
  updater: (team: CommissionerTeam) => CommissionerTeam
): CommissionerLeague {
  return {
    ...league,
    teams: league.teams.map((t) => (t.id === teamId ? updater(t) : t)),
  };
}

// ============================================================
// Store
// ============================================================

export const useCommissionerStore = create<CommissionerStore>()(
  persist(
    (set, get) => ({
      leagues: {},
      activeLeagueId: null,

      // ── League CRUD ──────────────────────────────────
      createLeague: (data) => {
        const id = generateId();
        const now = new Date().toISOString();
        const league: CommissionerLeague = {
          id,
          name: data.name,
          mode: data.mode,
          currentSeason: 1,
          currentWeek: 0,
          currentPhase: "setup",
          teams: [],
          freeAgents: [],
          draftHistory: [],
          headlineHistory: [],
          settings: data.settings,
          seasonIds: [],
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          leagues: { ...state.leagues, [id]: league },
          activeLeagueId: id,
        }));
        return id;
      },

      updateLeague: (id, updates) => {
        set((state) =>
          updateLeagueInState(state, id, (l) => ({ ...l, ...updates }))
        );
      },

      deleteLeague: (id) => {
        set((state) => {
          const rest = { ...state.leagues };
          delete rest[id];
          return {
            leagues: rest,
            activeLeagueId:
              state.activeLeagueId === id ? null : state.activeLeagueId,
          };
        });
      },

      setActiveLeague: (id) => {
        set({ activeLeagueId: id });
      },

      getActiveLeague: () => {
        const { leagues, activeLeagueId } = get();
        return activeLeagueId ? leagues[activeLeagueId] ?? null : null;
      },

      getLeague: (id) => get().leagues[id],

      // ── Team operations ──────────────────────────────
      addTeamToLeague: (leagueId, team) => {
        set((state) =>
          updateLeagueInState(state, leagueId, (l) => ({
            ...l,
            teams: [...l.teams, team],
          }))
        );
      },

      updateTeamInLeague: (leagueId, teamId, updates) => {
        set((state) =>
          updateLeagueInState(state, leagueId, (l) =>
            updateTeamInState(l, teamId, (t) => ({ ...t, ...updates }))
          )
        );
      },

      removeTeamFromLeague: (leagueId, teamId) => {
        set((state) =>
          updateLeagueInState(state, leagueId, (l) => ({
            ...l,
            teams: l.teams.filter((t) => t.id !== teamId),
          }))
        );
      },

      // ── Phase management ─────────────────────────────
      setLeaguePhase: (leagueId, phase) => {
        set((state) =>
          updateLeagueInState(state, leagueId, (l) => ({
            ...l,
            currentPhase: phase,
          }))
        );
      },

      // ── Temporary modifiers ──────────────────────────
      addTemporaryModifier: (leagueId, teamId, modifier) => {
        set((state) =>
          updateLeagueInState(state, leagueId, (l) =>
            updateTeamInState(l, teamId, (t) => ({
              ...t,
              temporaryModifiers: [...t.temporaryModifiers, modifier],
            }))
          )
        );
      },

      removeTemporaryModifier: (leagueId, teamId, modifierId) => {
        set((state) =>
          updateLeagueInState(state, leagueId, (l) =>
            updateTeamInState(l, teamId, (t) => ({
              ...t,
              temporaryModifiers: t.temporaryModifiers.filter(
                (m) => m.id !== modifierId
              ),
            }))
          )
        );
      },

      // ── Week / Season advancement ────────────────────
      advanceWeek: (leagueId) => {
        set((state) =>
          updateLeagueInState(state, leagueId, (l) => ({
            ...l,
            currentWeek: l.currentWeek + 1,
            teams: l.teams.map((t) => ({
              ...t,
              temporaryModifiers: t.temporaryModifiers
                .map((m) =>
                  m.weeksRemaining > 0
                    ? { ...m, weeksRemaining: m.weeksRemaining - 1 }
                    : m
                )
                .filter((m) => m.weeksRemaining !== 0 || m.weeksRemaining === 0),
              // Note: weeksRemaining 0 means "rest of season" — kept until advanceSeason
            })),
          }))
        );
      },

      advanceSeason: (leagueId) => {
        set((state) =>
          updateLeagueInState(state, leagueId, (l) => ({
            ...l,
            currentSeason: l.currentSeason + 1,
            currentWeek: 0,
            // Remove all temporary modifiers at season end
            teams: l.teams.map((t) => ({
              ...t,
              temporaryModifiers: [],
            })),
          }))
        );
      },

      // ── Headlines ────────────────────────────────────
      addHeadline: (leagueId, headline) => {
        set((state) =>
          updateLeagueInState(state, leagueId, (l) => ({
            ...l,
            headlineHistory: [...l.headlineHistory, headline],
          }))
        );
      },

      // ── Season linkage ───────────────────────────────
      addSeasonId: (leagueId, seasonId) => {
        set((state) =>
          updateLeagueInState(state, leagueId, (l) => ({
            ...l,
            seasonIds: [...l.seasonIds, seasonId],
          }))
        );
      },

      // ── Export / Import ──────────────────────────────
      exportLeagueData: (leagueId) => {
        const league = get().leagues[leagueId];
        if (!league) return "{}";
        return JSON.stringify(league, null, 2);
      },

      importLeagueData: (json) => {
        try {
          const data = JSON.parse(json) as CommissionerLeague;
          if (!data.id || !data.name || !data.mode) return null;
          // Generate new ID to avoid collisions
          const newId = generateId();
          const now = new Date().toISOString();
          const league: CommissionerLeague = {
            ...data,
            id: newId,
            createdAt: now,
            updatedAt: now,
          };
          set((state) => ({
            leagues: { ...state.leagues, [newId]: league },
            activeLeagueId: newId,
          }));
          return newId;
        } catch {
          return null;
        }
      },
    }),
    {
      name: STORAGE_KEYS.COMMISSIONER,
      version: 1,
    }
  )
);
