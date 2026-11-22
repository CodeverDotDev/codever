/**
 * Thrown when an admin restore cannot be done because the current data
 * conflicts with the deleted entry (mapped to HTTP 409).
 */
class AdminRestoreConflictError extends Error {
  constructor(message) {
    super(message);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AdminRestoreConflictError);
    }

    this.name = 'AdminRestoreConflictError';
  }
}

module.exports = AdminRestoreConflictError;
