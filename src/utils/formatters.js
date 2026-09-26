// src/utils/formatters.js
// Pure formatting and helper functions for FitArena.

/**
 * Extracts up to 2 uppercase initials from a name string.
 * @param {string|null|undefined} name
 * @returns {string}
 */
export function deriveInitials(name) {
  if (!name || !name.trim()) return "??";
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Derives athlete rank label from numerical level.
 * @param {number} level
 * @returns {string}
 */
export function rankFromLevel(level) {
  if (level >= 20) return "Legend";
  if (level >= 15) return "Elite";
  if (level >= 10) return "Champion";
  if (level >= 5)  return "Contender";
  return "Rookie";
}

/**
 * Returns human-readable relative deadline text.
 * @param {string|Date|null|undefined} date
 * @returns {string}
 */
export function formatDeadline(date) {
  if (!date || isNaN(new Date(date).getTime())) return "Ongoing";
  const target = new Date(date);
  const now = new Date();
  const diff = Math.round((target - now) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "Ended";
  if (diff === 0) return "Ends today";
  if (diff === 1) return "1 day left";
  return `${diff} days left`;
}
