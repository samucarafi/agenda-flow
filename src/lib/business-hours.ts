type BusinessAvailability = {
  workingDays?: number[];
  openingTime?: string;
  closingTime?: string;
};

const weekdayNumbers: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export function isBusinessWithinHours(
  availability: BusinessAvailability | null | undefined,
  timezone: string | null | undefined,
  at = new Date(),
) {
  if (
    !availability ||
    !timezone ||
    !Array.isArray(availability.workingDays) ||
    !availability.openingTime ||
    !availability.closingTime
  ) {
    return false;
  }

  const opening = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(availability.openingTime);
  const closing = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(availability.closingTime);
  if (!opening || !closing) return false;

  try {
    const localParts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(at);
    const parts = Object.fromEntries(localParts.map(({ type, value }) => [type, value]));
    const localWeekday = weekdayNumbers[parts.weekday];
    const localMinutes = Number(parts.hour) * 60 + Number(parts.minute);
    const openingMinutes = Number(opening[1]) * 60 + Number(opening[2]);
    const closingMinutes = Number(closing[1]) * 60 + Number(closing[2]);

    return (
      availability.workingDays.includes(localWeekday) &&
      localMinutes >= openingMinutes &&
      localMinutes < closingMinutes
    );
  } catch {
    return false;
  }
}
