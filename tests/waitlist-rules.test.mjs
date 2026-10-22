import assert from "node:assert/strict";
import test from "node:test";
import {
  isAllowedWaitlistTransition,
  recommendWaitlistEntry,
} from "../src/lib/waitlist-rules.mjs";

test("permite transições operacionais válidas da fila", () => {
  assert.equal(isAllowedWaitlistTransition("waiting", "called"), true);
  assert.equal(isAllowedWaitlistTransition("called", "waiting"), true);
  assert.equal(isAllowedWaitlistTransition("waiting", "cancelled"), true);
  assert.equal(isAllowedWaitlistTransition("called", "no_show"), true);
});

test("impede reabrir entradas finalizadas e acomodar sem selecionar uma mesa", () => {
  assert.equal(isAllowedWaitlistTransition("waiting", "seated"), false);
  assert.equal(isAllowedWaitlistTransition("called", "seated"), false);
  assert.equal(isAllowedWaitlistTransition("seated", "waiting"), false);
  assert.equal(isAllowedWaitlistTransition("cancelled", "called"), false);
});

test("recomenda o grupo compatível mais antigo e mantém os demais na fila", () => {
  const entries = [
    { id: "too-large", partySize: 6, joinedAt: "2026-10-21T10:00:00Z", status: "waiting" },
    { id: "newer", partySize: 2, joinedAt: "2026-10-21T10:05:00Z", status: "called" },
    { id: "older", partySize: 4, joinedAt: "2026-10-21T10:01:00Z", status: "waiting" },
  ];

  assert.equal(recommendWaitlistEntry(entries, 4)?.id, "older");
  assert.equal(entries[0].status, "waiting");
  assert.equal(recommendWaitlistEntry(entries, 1), null);
});
