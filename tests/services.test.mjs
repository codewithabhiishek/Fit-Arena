import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  getStreakMessage,
  isStreakCreditedToday,
  isStreakAtRisk,
  isStreakBroken,
  formatStreak,
} from "../src/services/streakService.js";
import { deriveInitials, rankFromLevel, formatDeadline } from "../src/utils/formatters.js";

// ─── 1. Streak Service Tests ──────────────────────────────────────────────────

test("getStreakMessage produces appropriate motivational messages", () => {
  assert.match(getStreakMessage("active_today", 30), /legend/);
  assert.match(getStreakMessage("active_today", 14), /on fire/);
  assert.match(getStreakMessage("active_today", 7), /consistency/);
  assert.match(getStreakMessage("active_today", 3), /keep it up/);
  assert.match(getStreakMessage("active_today", 1), /Streak credited for today/);
  assert.match(getStreakMessage("at_risk", 5), /keep your streak alive/);
  assert.match(getStreakMessage("broken", 0), /broken/);
  assert.match(getStreakMessage("never", 0), /first challenge/);
});

test("formatStreak outputs formatted streak string or dash", () => {
  assert.equal(formatStreak(10), "10 🔥");
  assert.equal(formatStreak(1), "1 🔥");
  assert.equal(formatStreak(0), "—");
  assert.equal(formatStreak(-3), "—");
  assert.equal(formatStreak(null), "—");
  assert.equal(formatStreak(undefined), "—");
});

test("isStreakCreditedToday identifies today UTC correctly", () => {
  const todayIso = new Date().toISOString();
  assert.equal(isStreakCreditedToday(todayIso), true);
  assert.equal(isStreakCreditedToday(null), false);

  const pastDate = new Date();
  pastDate.setUTCDate(pastDate.getUTCDate() - 2);
  assert.equal(isStreakCreditedToday(pastDate.toISOString()), false);
});

test("isStreakAtRisk detects activity on yesterday UTC", () => {
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  assert.equal(isStreakAtRisk(yesterday.toISOString()), true);

  const todayIso = new Date().toISOString();
  assert.equal(isStreakAtRisk(todayIso), false);
  assert.equal(isStreakAtRisk(null), false);
});

test("isStreakBroken identifies activity older than yesterday UTC", () => {
  const threeDaysAgo = new Date();
  threeDaysAgo.setUTCDate(threeDaysAgo.getUTCDate() - 3);
  assert.equal(isStreakBroken(threeDaysAgo.toISOString()), true);

  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  assert.equal(isStreakBroken(yesterday.toISOString()), false);

  const todayIso = new Date().toISOString();
  assert.equal(isStreakBroken(todayIso), false);
  assert.equal(isStreakBroken(null), false);
});

// ─── 2. Profile & Leaderboard Helpers ────────────────────────────────────────

test("deriveInitials extracts up to 2 uppercase initials", () => {
  assert.equal(deriveInitials("Marcus Aurelius"), "MA");
  assert.equal(deriveInitials("Elena"), "E");
  assert.equal(deriveInitials("John Robert Smith"), "JR");
  assert.equal(deriveInitials(""), "??");
  assert.equal(deriveInitials(null), "??");
  assert.equal(deriveInitials("   "), "??");
});

test("rankFromLevel computes correct rank tiers", () => {
  assert.equal(rankFromLevel(1), "Rookie");
  assert.equal(rankFromLevel(4), "Rookie");
  assert.equal(rankFromLevel(5), "Contender");
  assert.equal(rankFromLevel(9), "Contender");
  assert.equal(rankFromLevel(10), "Champion");
  assert.equal(rankFromLevel(14), "Champion");
  assert.equal(rankFromLevel(15), "Elite");
  assert.equal(rankFromLevel(19), "Elite");
  assert.equal(rankFromLevel(20), "Legend");
  assert.equal(rankFromLevel(50), "Legend");
});

// ─── 3. Challenge Deadline Helpers ───────────────────────────────────────────

test("formatDeadline handles relative dates and invalid inputs cleanly", () => {
  assert.equal(formatDeadline(null), "Ongoing");
  assert.equal(formatDeadline("invalid-date"), "Ongoing");

  const past = new Date();
  past.setDate(past.getDate() - 2);
  assert.equal(formatDeadline(past), "Ended");

  const future10 = new Date();
  future10.setDate(future10.getDate() + 10);
  assert.match(formatDeadline(future10), /days left/);
});

// ─── 4. QR Token Hashing & Verification Logic ────────────────────────────────

test("QR HMAC SHA-256 signature verification validates correctly", () => {
  const secret = "test-secret-key-fitarena-elite-gym";
  const challengeId = "ch_bench_press_100";
  const expiresAt = Date.now() + 3600 * 1000;

  const validToken = crypto
    .createHmac("sha256", secret)
    .update(`${challengeId}:${expiresAt}`)
    .digest("hex");

  assert.equal(validToken.length, 64);

  // Timing safe equal check
  const compare = (t) => {
    if (!/^[0-9a-f]{64}$/i.test(t)) return false;
    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${challengeId}:${expiresAt}`)
      .digest("hex");
    return crypto.timingSafeEqual(Buffer.from(t, "hex"), Buffer.from(expected, "hex"));
  };

  assert.equal(compare(validToken), true);
  assert.equal(compare("a".repeat(64)), false);
  assert.equal(compare("invalid-token"), false);
});
