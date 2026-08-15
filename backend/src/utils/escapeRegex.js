/**
 * Escapes regex metacharacters so user input can be safely embedded in a
 * MongoDB $regex without enabling pattern injection or ReDoS via crafted
 * patterns (e.g. catastrophic-backtracking constructs like `(a+)+$`).
 */
const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = escapeRegex;
