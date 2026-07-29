// Stub for the `sharp` package. Real sharp is a native module that fails to
// extract in this sandbox; Next.js dev does not need it (production-only image
// optimization). Methods throw only if actually invoked.
module.exports = {};
