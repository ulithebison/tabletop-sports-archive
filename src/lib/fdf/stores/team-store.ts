import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FdfTeam, PlayerEntry, TeamRoster, PlayerFinderRanges, FinderRoster, FinderPlayer } from "../types";
import { generateId } from "../id";
import { STORAGE_KEYS } from "../constants";

// ============================================================
// Migration helpers: v0 (legacy finderRange) → v1 (finderRanges)
// ============================================================

function migratePlayerEntry(player: PlayerEntry): PlayerEntry {
  if (player.finderRange && !player.finderRanges) {
    const ranges: PlayerFinderRanges = {};
    switch (player.position) {
      case "QB":
        ranges.passingTD = player.finderRange;
        break;
      case "RB":
        ranges.rushingTD = player.finderRange;
        break;
      case "WR":
      case "TE":
        ranges.receivingTD = player.finderRange;
        break;
      case "K":
        ranges.kickingFGXP = player.finderRange;
        break;
    }
    return { ...player, finderRanges: ranges, finderRange: undefined };
  }
  return player;
}

function migrateRoster(roster: TeamRoster): TeamRoster {
  return {
    quarterbacks: roster.quarterbacks.map(migratePlayerEntry),
    runningBacks: roster.runningBacks.map(migratePlayerEntry),
    receivers: roster.receivers.map(migratePlayerEntry),
    kicker: roster.kicker ? migratePlayerEntry(roster.kicker) : undefined,
    punter: roster.punter ? migratePlayerEntry(roster.punter) : undefined,
    defensiveBacks: roster.defensiveBacks.map(migratePlayerEntry),
    linebackers: roster.linebackers.map(migratePlayerEntry),
    defensiveLinemen: roster.defensiveLinemen.map(migratePlayerEntry),
    kickReturner: roster.kickReturner ? migratePlayerEntry(roster.kickReturner) : undefined,
    puntReturner: roster.puntReturner ? migratePlayerEntry(roster.puntReturner) : undefined,
  };
}

// ============================================================
// Migration v1 → v2: position-based roster → finder roster
// ============================================================

function playerToFinder(player: PlayerEntry): FinderPlayer {
  return {
    id: player.id,
    name: player.name,
    number: player.number,
    finderRange: player.finderRanges?.rushingTD
      || player.finderRanges?.passingTD
      || player.finderRanges?.receivingTD
      || player.finderRanges?.kickingFGXP
      || player.finderRange
      || undefined,
  };
}

function rosterToFinderRoster(roster: TeamRoster): FinderRoster {
  const rushingTD: FinderPlayer[] = [];
  const passingTD: FinderPlayer[] = [];
  const receivingTD: FinderPlayer[] = [];
  const kickingFGXP: FinderPlayer[] = [];

  // QBs → passingTD (and rushingTD if they have a rush range)
  for (const p of roster.quarterbacks) {
    if (!p.name.trim()) continue;
    const fp = playerToFinder(p);
    passingTD.push({ ...fp, finderRange: p.finderRanges?.passingTD || fp.finderRange });
    if (p.finderRanges?.rushingTD) {
      rushingTD.push({ ...fp, finderRange: p.finderRanges.rushingTD });
    }
  }

  // RBs → rushingTD (and receivingTD if they have a rec range)
  for (const p of roster.runningBacks) {
    if (!p.name.trim()) continue;
    const fp = playerToFinder(p);
    rushingTD.push({ ...fp, finderRange: p.finderRanges?.rushingTD || fp.finderRange });
    if (p.finderRanges?.receivingTD) {
      receivingTD.push({ ...fp, finderRange: p.finderRanges.receivingTD });
    }
  }

  // WR/TE → receivingTD (and rushingTD if they have a rush range)
  for (const p of roster.receivers) {
    if (!p.name.trim()) continue;
    const fp = playerToFinder(p);
    receivingTD.push({ ...fp, finderRange: p.finderRanges?.receivingTD || fp.finderRange });
    if (p.finderRanges?.rushingTD) {
      rushingTD.push({ ...fp, finderRange: p.finderRanges.rushingTD });
    }
  }

  // K → kickingFGXP
  if (roster.kicker && roster.kicker.name.trim()) {
    const fp = playerToFinder(roster.kicker);
    kickingFGXP.push({ ...fp, finderRange: roster.kicker.finderRanges?.kickingFGXP || fp.finderRange });
  }

  return { rushingTD, passingTD, receivingTD, kickingFGXP };
}

// ============================================================
// Store
// ============================================================

interface TeamState {
  teams: Record<string, FdfTeam>;
  addTeam: (team: Omit<FdfTeam, "id" | "createdAt" | "updatedAt">) => string;
  updateTeam: (id: string, updates: Partial<FdfTeam>) => void;
  deleteTeam: (id: string) => void;
  getTeam: (id: string) => FdfTeam | undefined;
}

export const useTeamStore = create<TeamState>()(
  persist(
    (set, get) => ({
      teams: {},

      addTeam: (teamData) => {
        const id = generateId();
        const now = new Date().toISOString();
        const team: FdfTeam = {
          ...teamData,
          id,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          teams: { ...state.teams, [id]: team },
        }));
        return id;
      },

      updateTeam: (id, updates) => {
        set((state) => {
          const existing = state.teams[id];
          if (!existing) return state;
          return {
            teams: {
              ...state.teams,
              [id]: { ...existing, ...updates, updatedAt: new Date().toISOString() },
            },
          };
        });
      },

      deleteTeam: (id) => {
        set((state) => {
          const rest = { ...state.teams };
          delete rest[id];
          return { teams: rest };
        });
      },

      getTeam: (id) => get().teams[id],
    }),
    {
      name: STORAGE_KEYS.TEAMS,
      version: 2,
      migrate: (persisted, version) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const state = persisted as any;

        // v0 → v1: migrate legacy finderRange to finderRanges
        if (version === 0 && state?.teams) {
          const migratedTeams: Record<string, FdfTeam> = {};
          for (const [id, team] of Object.entries(state.teams)) {
            const t = team as FdfTeam;
            migratedTeams[id] = t.roster
              ? { ...t, roster: migrateRoster(t.roster) }
              : t;
          }
          state.teams = migratedTeams;
        }

        // v0/v1 → v2: auto-create finderRoster from position-based roster
        if ((version === 0 || version === 1) && state?.teams) {
          const migratedTeams: Record<string, FdfTeam> = {};
          for (const [id, team] of Object.entries(state.teams)) {
            const t = team as FdfTeam;
            if (t.roster && !t.finderRoster) {
              migratedTeams[id] = {
                ...t,
                finderRoster: rosterToFinderRoster(t.roster),
              };
            } else {
              migratedTeams[id] = t;
            }
          }
          return { ...state, teams: migratedTeams };
        }

        return state as TeamState;
      },
    }
  )
);
