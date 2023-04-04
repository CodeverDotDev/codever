class PublicBookmarkExistingError extends Error {
  constructor(message) {
    super(message);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PublicBookmarkExistingError);
    }

    this.name = 'PublicBookmarkExistingError';
  }
}

module.exports = PublicBookmarkExistingError;
