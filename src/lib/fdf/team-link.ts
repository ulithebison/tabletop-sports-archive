export function getTeamLink(
  teamStoreId: string,
  commissionerLeagueId?: string,
  commissionerTeams?: { id: string; teamStoreId: string }[],
  returnTo?: string
): string {
  let url: string;
  if (commissionerLeagueId && commissionerTeams) {
    const ct = commissionerTeams.find((t) => t.teamStoreId === teamStoreId);
    if (ct) url = `/fdf/commissioner/${commissionerLeagueId}/team/${ct.id}`;
    else url = `/fdf/teams/${teamStoreId}`;
  } else {
    url = `/fdf/teams/${teamStoreId}`;
  }
  if (returnTo) url += `?from=${encodeURIComponent(returnTo)}`;
  return url;
}
