import type { WaitlistStatus } from "@/models/WaitlistEntry";

export function isAllowedWaitlistTransition(
  current: WaitlistStatus,
  next: WaitlistStatus,
): boolean;

export interface WaitlistCandidate {
  id: string;
  partySize: number;
  joinedAt: Date | string;
  status: WaitlistStatus;
  customerName?: string;
}

export function recommendWaitlistEntry(
  entries: WaitlistCandidate[],
  capacity: number,
): WaitlistCandidate | null;
