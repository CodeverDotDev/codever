class ShareLinkConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ShareLinkConflictError';
  }
}

module.exports = ShareLinkConflictError;
