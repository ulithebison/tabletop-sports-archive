import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  FdfSeason,
  SeasonConfig,
  OvertimeConfig,
  Division,
  ScheduleGame,
  SeasonGameResult,
  SeasonStatus,
  LeagueType,
} from "../types";
import { generateId } from "../id";
import { STORAGE_KEYS } from "../constants";

interface SeasonState {
  seasons: Record<string, FdfSeason>;
  createSeason: (data: {
    name: string;
    year: number;
    leagueType: LeagueType;
    config: SeasonConfig;
    overtimeRules: OvertimeConfig;
    teamIds: string[];
    divisions: Division[];
  }) => string;
  updateSeason: (id: string, updates: Partial<FdfSeason>) => void;
  deleteSeason: (id: string) => void;
  getSeason: (id: string) => FdfSeason | undefined;
  setSchedule: (id: string, schedule: ScheduleGame[]) => void;
  advanceWeek: (id: string) => void;
  setSeasonStatus: (id: string, status: SeasonStatus) => void;
  recordGameResult: (
    seasonId: string,
    scheduleGameId: string,
    result: SeasonGameResult,
    gameId?: string
  ) => void;
  simulateRemainingGames: (
    seasonId: string,
    simulateFn: (game: ScheduleGame, season: FdfSeason) => SeasonGameResult,
    skipGameIds?: Set<string>
  ) => void;
  startPlayoffs: (id: string, playoffSchedule: ScheduleGame[]) => void;
  completeSeason: (id: string) => void;
  resetGameResult: (seasonId: string, scheduleGameId: string) => void;
}

export const useSeasonStore = create<SeasonState>()(
  persist(
    (set, get) => ({
      seasons: {},

      createSeason: (data) => {
        const id = generateId();
        const now = new Date().toISOString();
        const season: FdfSeason = {
          id,
          name: data.name,
          year: data.year,
          leagueType: data.leagueType,
          config: data.config,
          overtimeRules: data.overtimeRules,
          currentWeek: 1,
          status: "setup",
          teamIds: data.teamIds,
          divisions: data.divisions,
          schedule: [],
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          seasons: { ...state.seasons, [id]: season },
        }));
        return id;
      },

      updateSeason: (id, updates) => {
        set((state) => {
          const existing = state.seasons[id];
          if (!existing) return state;
          return {
            seasons: {
              ...state.seasons,
              [id]: { ...existing, ...updates, updatedAt: new Date().toISOString() },
            },
          };
        });
      },

      deleteSeason: (id) => {
        set((state) => {
          const { [id]: _removed, ...rest } = state.seasons;
          return { seasons: rest };
        });
      },

      getSeason: (id) => get().seasons[id],

      setSchedule: (id, schedule) => {
        set((state) => {
          const season = state.seasons[id];
          if (!season) return state;
          return {
            seasons: {
              ...state.seasons,
              [id]: { ...season, schedule, updatedAt: new Date().toISOString() },
            },
          };
        });
      },

      advanceWeek: (id) => {
        set((state) => {
          const season = state.seasons[id];
          if (!season) return state;
          return {
            seasons: {
              ...state.seasons,
              [id]: {
                ...season,
                currentWeek: season.currentWeek + 1,
                updatedAt: new Date().toISOString(),
              },
            },
          };
        });
      },

      setSeasonStatus: (id, status) => {
        set((state) => {
          const season = state.seasons[id];
          if (!season) return state;
          return {
            seasons: {
              ...state.seasons,
              [id]: { ...season, status, updatedAt: new Date().toISOString() },
            },
          };
        });
      },

      recordGameResult: (seasonId, scheduleGameId, result, gameId) => {
        set((state) => {
          const season = state.seasons[seasonId];
          if (!season) return state;

          const updatedSchedule = season.schedule.map((g) =>
            g.id === scheduleGameId
              ? { ...g, result, gameId: gameId || g.gameId }
              : g
          );

          return {
            seasons: {
              ...state.seasons,
              [seasonId]: {
                ...season,
                schedule: updatedSchedule,
                updatedAt: new Date().toISOString(),
              },
            },
          };
        });
      },

      simulateRemainingGames: (seasonId, simulateFn, skipGameIds) => {
        set((state) => {
          const season = state.seasons[seasonId];
          if (!season) return state;

          const updatedSchedule = season.schedule.map((g) => {
            if (g.result || g.isBye) return g;
            // Only simulate regular season games (not playoff)
            if (g.isPlayoff) return g;
            // Skip active in-progress games
            if (skipGameIds?.has(g.id)) return g;
            return { ...g, result: simulateFn(g, season) };
          });

          // Find max week with games
          const maxWeek = Math.max(...updatedSchedule.filter((g) => !g.isPlayoff).map((g) => g.week));

          return {
            seasons: {
              ...state.seasons,
              [seasonId]: {
                ...season,
                schedule: updatedSchedule,
                currentWeek: maxWeek,
                updatedAt: new Date().toISOString(),
              },
            },
          };
        });
      },

      startPlayoffs: (id, playoffSchedule) => {
        set((state) => {
          const season = state.seasons[id];
          if (!season) return state;

          // Append playoff games to existing schedule
          const updatedSchedule = [...season.schedule, ...playoffSchedule];
          const playoffWeek = Math.min(...playoffSchedule.map((g) => g.week));

          return {
            seasons: {
              ...state.seasons,
              [id]: {
                ...season,
                schedule: updatedSchedule,
                status: "playoffs",
                currentWeek: playoffWeek,
                updatedAt: new Date().toISOString(),
              },
            },
          };
        });
      },

      completeSeason: (id) => {
        set((state) => {
          const season = state.seasons[id];
          if (!season) return state;
          return {
            seasons: {
              ...state.seasons,
              [id]: { ...season, status: "completed", updatedAt: new Date().toISOString() },
            },
          };
        });
      },

      resetGameResult: (seasonId, scheduleGameId) => {
        set((state) => {
          const season = state.seasons[seasonId];
          if (!season) return state;

          const updatedSchedule = season.schedule.map((g) =>
            g.id === scheduleGameId
              ? { ...g, result: undefined, gameId: undefined }
              : g
          );

          return {
            seasons: {
              ...state.seasons,
              [seasonId]: {
                ...season,
                schedule: updatedSchedule,
                updatedAt: new Date().toISOString(),
              },
            },
          };
        });
      },
    }),
    { name: STORAGE_KEYS.SEASONS }
  )
);
