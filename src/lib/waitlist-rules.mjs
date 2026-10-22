const transitions = {
  waiting: ["called", "cancelled", "no_show"],
  called: ["waiting", "cancelled", "no_show"],
  seated: ["completed"],
  completed: [],
  cancelled: [],
  no_show: [],
};

export function isAllowedWaitlistTransition(current, next) {
  return current === next || transitions[current]?.includes(next) === true;
}

export function recommendWaitlistEntry(entries, capacity) {
  return entries
    .filter(
      (entry) =>
        (entry.status === "waiting" || entry.status === "called") &&
        entry.partySize <= capacity,
    )
    .sort((a, b) => {
      const joinedAtDifference =
        new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
      return joinedAtDifference || a.id.localeCompare(b.id);
    })[0] ?? null;
}
