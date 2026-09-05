const resetCodes = new Map();

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function normalizeEmail(email = '') {
  return String(email).trim().toLowerCase();
}

function saveResetCode(email, code) {
  const normalized = normalizeEmail(email);
  resetCodes.set(normalized, {
    code,
    expiresAt: Date.now() + 15 * 60 * 1000,
  });
  return code;
}

function getResetCode(email) {
  const normalized = normalizeEmail(email);
  const entry = resetCodes.get(normalized);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    resetCodes.delete(normalized);
    return null;
  }
  return entry;
}

function clearResetCode(email) {
  resetCodes.delete(normalizeEmail(email));
}

module.exports = {
  generateCode,
  saveResetCode,
  getResetCode,
  clearResetCode,
};
