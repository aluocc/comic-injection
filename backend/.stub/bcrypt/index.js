// Stub for the native `bcrypt` package. Real bcrypt's tarball fails to extract
// in this sandbox (EPERM on the temp-dir rename). The scaffold does not use
// bcrypt yet; replace with the real package once a proper auth module lands.
const crypto = require("crypto");

function hash(password, rounds, cb) {
  if (typeof rounds === "function") {
    cb = rounds;
    rounds = 10;
  }
  const salt = crypto.randomBytes(16).toString("hex");
  const h = crypto
    .createHash("sha256")
    .update(salt + password)
    .digest("hex");
  if (cb) return cb(null, `${salt}$${h}`);
  return `${salt}$${h}`;
}

function compare(password, hashed, cb) {
  const [salt, h] = String(hashed).split("$");
  const candidate = crypto
    .createHash("sha256")
    .update(salt + password)
    .digest("hex");
  const ok = candidate === h;
  if (cb) return cb(null, ok);
  return ok;
}

module.exports = { hash, compare, compareSync: compare, hashSync: hash };
