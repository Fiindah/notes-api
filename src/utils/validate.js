const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isNonEmptyString(v, minLen = 1) {
  return typeof v === "string" && v.trim().length >= minLen;
}

function isValidEmail(v) {
  return typeof v === "string" && EMAIL_RE.test(v.trim());
}

module.exports = { isNonEmptyString, isValidEmail };
